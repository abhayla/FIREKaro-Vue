import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { prisma } from '../lib/prisma'
import { authMiddleware } from '../middleware/auth'

const app = new Hono()

// Apply auth middleware to all routes
app.use('*', authMiddleware)

// Validation schema for dividend income
const dividendIncomeSchema = z.object({
  fiscalYear: z.string(),
  sourceType: z.enum(['STOCK', 'MUTUAL_FUND', 'REIT', 'INVIT']),
  companyOrFundName: z.string().min(1, 'Company/Fund name is required'),
  symbol: z.string().optional(),
  isin: z.string().optional(),
  folioNumber: z.string().optional(),
  dividendType: z.enum(['INTERIM', 'FINAL', 'SPECIAL']).optional(),
  recordDate: z.string().optional(),
  exDividendDate: z.string().optional(),
  paymentDate: z.string().optional(),
  dividendPerShare: z.number().optional(),
  numberOfShares: z.number().optional(),
  dividendAmount: z.number().min(0),
  tdsDeducted: z.number().min(0).default(0),
  tdsRate: z.number().optional(),
  investmentValue: z.number().optional(),
  dematAccount: z.string().optional(),
  brokerName: z.string().optional(),
})

// GET /api/dividend-income - List all dividend income records
app.get('/', async (c) => {
  const userId = c.get('userId')
  const financialYear = c.req.query('financialYear')
  const sourceType = c.req.query('sourceType')

  try {
    const whereClause: {
      userId: string
      fiscalYear?: string
      sourceType?: string
    } = { userId }

    if (financialYear) whereClause.fiscalYear = financialYear
    if (sourceType) whereClause.sourceType = sourceType

    const records = await prisma.dividendIncome.findMany({
      where: whereClause,
      orderBy: [{ paymentDate: 'desc' }],
    })

    // Calculate summary
    const totalDividend = records.reduce((sum, r) => sum + r.dividendAmount, 0)
    const totalTDS = records.reduce((sum, r) => sum + r.tdsDeducted, 0)

    // Check TDS threshold (10% TDS above Rs 5,000 per company)
    const dividendByCompany = records.reduce(
      (acc, r) => {
        const key = r.companyOrFundName
        if (!acc[key]) acc[key] = 0
        acc[key] += r.dividendAmount
        return acc
      },
      {} as Record<string, number>
    )

    const companiesAboveThreshold = Object.entries(dividendByCompany)
      .filter(([, amount]) => amount > 5000)
      .map(([company, amount]) => ({
        company,
        amount,
        expectedTDS: amount * 0.1,
      }))

    // Group by source type
    const bySourceType = records.reduce(
      (acc, r) => {
        if (!acc[r.sourceType]) {
          acc[r.sourceType] = { dividend: 0, tds: 0, count: 0 }
        }
        acc[r.sourceType].dividend += r.dividendAmount
        acc[r.sourceType].tds += r.tdsDeducted
        acc[r.sourceType].count += 1
        return acc
      },
      {} as Record<string, { dividend: number; tds: number; count: number }>
    )

    // Calculate average yield if investment values provided
    const recordsWithYield = records.filter((r) => r.investmentValue && r.investmentValue > 0)
    const avgYield =
      recordsWithYield.length > 0
        ? recordsWithYield.reduce((sum, r) => sum + (r.dividendYield ?? 0), 0) / recordsWithYield.length
        : null

    const summary = {
      totalDividend,
      totalTDS,
      netDividend: totalDividend - totalTDS,
      recordCount: records.length,
      avgYield,
      bySourceType: Object.entries(bySourceType).map(([type, data]) => ({
        type,
        ...data,
      })),
      companiesAboveThreshold,
      tdsThresholdAlert: companiesAboveThreshold.length > 0,
    }

    return c.json({
      success: true,
      data: { records, summary },
    })
  } catch (error) {
    console.error('Error fetching dividend income:', error)
    return c.json({ success: false, error: 'Failed to fetch dividend income' }, 500)
  }
})

// GET /api/dividend-income/:id - Get single dividend income record
app.get('/:id', async (c) => {
  const userId = c.get('userId')
  const id = c.req.param('id')

  try {
    const record = await prisma.dividendIncome.findFirst({
      where: { id, userId },
    })

    if (!record) {
      return c.json({ success: false, error: 'Dividend income not found' }, 404)
    }

    return c.json({ success: true, data: record })
  } catch (error) {
    console.error('Error fetching dividend income:', error)
    return c.json({ success: false, error: 'Failed to fetch dividend income' }, 500)
  }
})

// POST /api/dividend-income - Create dividend income record
app.post('/', zValidator('json', dividendIncomeSchema), async (c) => {
  const userId = c.get('userId')
  const data = c.req.valid('json')

  try {
    // Calculate dividend yield if investment value provided
    let dividendYield: number | null = null
    if (data.investmentValue && data.investmentValue > 0) {
      // Annualize if this is a single dividend payment
      dividendYield = (data.dividendAmount / data.investmentValue) * 100
    }

    // Calculate TDS rate if TDS and dividend amount provided
    const tdsRate = data.tdsRate ?? (data.tdsDeducted > 0 ? (data.tdsDeducted / data.dividendAmount) * 100 : null)

    const record = await prisma.dividendIncome.create({
      data: {
        userId,
        fiscalYear: data.fiscalYear,
        sourceType: data.sourceType,
        companyOrFundName: data.companyOrFundName,
        symbol: data.symbol,
        isin: data.isin,
        folioNumber: data.folioNumber,
        dividendType: data.dividendType,
        recordDate: data.recordDate ? new Date(data.recordDate) : null,
        exDividendDate: data.exDividendDate ? new Date(data.exDividendDate) : null,
        paymentDate: new Date(data.paymentDate),
        dividendPerShare: data.dividendPerShare,
        numberOfShares: data.numberOfShares,
        dividendAmount: data.dividendAmount,
        tdsDeducted: data.tdsDeducted,
        tdsRate,
        investmentValue: data.investmentValue,
        dividendYield,
        dematAccount: data.dematAccount,
        brokerName: data.brokerName,
      },
    })

    return c.json({ success: true, data: record }, 201)
  } catch (error) {
    console.error('Error creating dividend income:', error)
    return c.json({ success: false, error: 'Failed to create dividend income' }, 500)
  }
})

// PUT /api/dividend-income/:id - Update dividend income record
app.put('/:id', zValidator('json', dividendIncomeSchema.partial()), async (c) => {
  const userId = c.get('userId')
  const id = c.req.param('id')
  const data = c.req.valid('json')

  try {
    const existing = await prisma.dividendIncome.findFirst({
      where: { id, userId },
    })

    if (!existing) {
      return c.json({ success: false, error: 'Dividend income not found' }, 404)
    }

    // Recalculate yield if relevant fields changed
    const dividendAmount = data.dividendAmount ?? existing.dividendAmount
    const investmentValue = data.investmentValue ?? existing.investmentValue
    let dividendYield = existing.dividendYield

    if (investmentValue && investmentValue > 0) {
      dividendYield = (dividendAmount / investmentValue) * 100
    }

    const record = await prisma.dividendIncome.update({
      where: { id },
      data: {
        ...data,
        recordDate: data.recordDate ? new Date(data.recordDate) : undefined,
        exDividendDate: data.exDividendDate ? new Date(data.exDividendDate) : undefined,
        paymentDate: data.paymentDate ? new Date(data.paymentDate) : undefined,
        dividendYield,
      },
    })

    return c.json({ success: true, data: record })
  } catch (error) {
    console.error('Error updating dividend income:', error)
    return c.json({ success: false, error: 'Failed to update dividend income' }, 500)
  }
})

// DELETE /api/dividend-income/:id - Delete dividend income record
app.delete('/:id', async (c) => {
  const userId = c.get('userId')
  const id = c.req.param('id')

  try {
    const existing = await prisma.dividendIncome.findFirst({
      where: { id, userId },
    })

    if (!existing) {
      return c.json({ success: false, error: 'Dividend income not found' }, 404)
    }

    await prisma.dividendIncome.delete({
      where: { id },
    })

    return c.json({ success: true, message: 'Dividend income deleted successfully' })
  } catch (error) {
    console.error('Error deleting dividend income:', error)
    return c.json({ success: false, error: 'Failed to delete dividend income' }, 500)
  }
})

export default app
