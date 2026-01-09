import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { prisma } from '../lib/prisma'
import { authMiddleware } from '../middleware/auth'

const app = new Hono()

// Apply auth middleware to all routes
app.use('*', authMiddleware)

// Validation schema for interest income
const interestIncomeSchema = z.object({
  fiscalYear: z.string(),
  sourceType: z.enum(['FD', 'RD', 'SAVINGS', 'P2P', 'BONDS', 'NSC', 'SCSS', 'PPF', 'OTHER']),
  institutionName: z.string().min(1, 'Institution name is required'),
  accountNumber: z.string().optional(),
  branchName: z.string().optional(),
  principalAmount: z.number().optional(),
  interestRate: z.number().optional(),
  interestEarned: z.number().min(0),
  accruedInterest: z.number().optional(),
  tdsDeducted: z.number().min(0).default(0),
  tdsRate: z.number().optional(),
  form16AReceived: z.boolean().default(false),
  depositDate: z.string().optional(),
  maturityDate: z.string().optional(),
  maturityAmount: z.number().optional(),
  tenureMonths: z.number().int().optional(),
  isAutoRenew: z.boolean().default(false),
  is80TTAEligible: z.boolean().default(false),
  is80TTBEligible: z.boolean().default(false),
  platformName: z.string().optional(),
  borrowerCount: z.number().int().optional(),
  defaultAmount: z.number().optional(),
})

// GET /api/interest-income - List all interest income records
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

    const records = await prisma.interestIncome.findMany({
      where: whereClause,
      orderBy: [{ maturityDate: 'asc' }, { createdAt: 'desc' }],
    })

    // Calculate summary
    const totalInterest = records.reduce((sum, r) => sum + r.interestEarned, 0)
    const totalTDS = records.reduce((sum, r) => sum + r.tdsDeducted, 0)

    // 80TTA eligible (savings account interest, max Rs 10,000)
    const savingsInterest = records
      .filter((r) => r.is80TTAEligible)
      .reduce((sum, r) => sum + r.interestEarned, 0)
    const deduction80TTA = Math.min(savingsInterest, 10000)

    // 80TTB eligible (senior citizens, max Rs 50,000)
    const seniorInterest = records
      .filter((r) => r.is80TTBEligible)
      .reduce((sum, r) => sum + r.interestEarned, 0)
    const deduction80TTB = Math.min(seniorInterest, 50000)

    // Group by source type
    const bySourceType = records.reduce(
      (acc, r) => {
        if (!acc[r.sourceType]) {
          acc[r.sourceType] = { interest: 0, tds: 0, count: 0 }
        }
        acc[r.sourceType].interest += r.interestEarned
        acc[r.sourceType].tds += r.tdsDeducted
        acc[r.sourceType].count += 1
        return acc
      },
      {} as Record<string, { interest: number; tds: number; count: number }>
    )

    // Upcoming maturities (next 90 days)
    const now = new Date()
    const ninetyDaysLater = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000)
    const upcomingMaturities = records
      .filter((r) => r.maturityDate && r.maturityDate > now && r.maturityDate <= ninetyDaysLater)
      .map((r) => ({
        id: r.id,
        institutionName: r.institutionName,
        sourceType: r.sourceType,
        maturityDate: r.maturityDate,
        maturityAmount: r.maturityAmount,
        principalAmount: r.principalAmount,
      }))
      .sort((a, b) => (a.maturityDate?.getTime() ?? 0) - (b.maturityDate?.getTime() ?? 0))

    const summary = {
      totalInterest,
      totalTDS,
      netInterest: totalInterest - totalTDS,
      deduction80TTA,
      deduction80TTB,
      taxableInterest: totalInterest - deduction80TTA - deduction80TTB,
      recordCount: records.length,
      bySourceType: Object.entries(bySourceType).map(([type, data]) => ({
        type,
        ...data,
      })),
      upcomingMaturities,
    }

    return c.json({
      success: true,
      data: { records, summary },
    })
  } catch (error) {
    console.error('Error fetching interest income:', error)
    return c.json({ success: false, error: 'Failed to fetch interest income' }, 500)
  }
})

// GET /api/interest-income/calendar - Get FD maturity calendar
app.get('/calendar', async (c) => {
  const userId = c.get('userId')
  const startDate = c.req.query('startDate')
  const endDate = c.req.query('endDate')

  try {
    const whereClause: {
      userId: string
      maturityDate?: { gte?: Date; lte?: Date }
    } = { userId }

    if (startDate || endDate) {
      whereClause.maturityDate = {}
      if (startDate) whereClause.maturityDate.gte = new Date(startDate)
      if (endDate) whereClause.maturityDate.lte = new Date(endDate)
    }

    const records = await prisma.interestIncome.findMany({
      where: {
        ...whereClause,
        maturityDate: { not: null, ...(whereClause.maturityDate || {}) },
      },
      select: {
        id: true,
        sourceType: true,
        institutionName: true,
        accountNumber: true,
        principalAmount: true,
        interestRate: true,
        maturityDate: true,
        maturityAmount: true,
        isAutoRenew: true,
      },
      orderBy: { maturityDate: 'asc' },
    })

    // Group by month for calendar view
    const byMonth = records.reduce(
      (acc, r) => {
        if (!r.maturityDate) return acc
        const monthKey = `${r.maturityDate.getFullYear()}-${String(r.maturityDate.getMonth() + 1).padStart(2, '0')}`
        if (!acc[monthKey]) acc[monthKey] = []
        acc[monthKey].push(r)
        return acc
      },
      {} as Record<string, typeof records>
    )

    return c.json({
      success: true,
      data: { records, byMonth },
    })
  } catch (error) {
    console.error('Error fetching maturity calendar:', error)
    return c.json({ success: false, error: 'Failed to fetch maturity calendar' }, 500)
  }
})

// GET /api/interest-income/:id - Get single interest income record
app.get('/:id', async (c) => {
  const userId = c.get('userId')
  const id = c.req.param('id')

  try {
    const record = await prisma.interestIncome.findFirst({
      where: { id, userId },
    })

    if (!record) {
      return c.json({ success: false, error: 'Interest income not found' }, 404)
    }

    return c.json({ success: true, data: record })
  } catch (error) {
    console.error('Error fetching interest income:', error)
    return c.json({ success: false, error: 'Failed to fetch interest income' }, 500)
  }
})

// POST /api/interest-income - Create interest income record
app.post('/', zValidator('json', interestIncomeSchema), async (c) => {
  const userId = c.get('userId')
  const data = c.req.valid('json')

  try {
    // Auto-detect 80TTA eligibility for savings accounts
    const is80TTAEligible = data.sourceType === 'SAVINGS' ? true : data.is80TTAEligible

    // Calculate deduction claimed
    let deductionClaimed = 0
    if (is80TTAEligible) {
      deductionClaimed = Math.min(data.interestEarned, 10000)
    } else if (data.is80TTBEligible) {
      deductionClaimed = Math.min(data.interestEarned, 50000)
    }

    const record = await prisma.interestIncome.create({
      data: {
        userId,
        fiscalYear: data.fiscalYear,
        sourceType: data.sourceType,
        institutionName: data.institutionName,
        accountNumber: data.accountNumber,
        branchName: data.branchName,
        principalAmount: data.principalAmount,
        interestRate: data.interestRate,
        interestEarned: data.interestEarned,
        accruedInterest: data.accruedInterest,
        tdsDeducted: data.tdsDeducted,
        tdsRate: data.tdsRate,
        form16AReceived: data.form16AReceived,
        depositDate: data.depositDate ? new Date(data.depositDate) : null,
        maturityDate: data.maturityDate ? new Date(data.maturityDate) : null,
        maturityAmount: data.maturityAmount,
        tenureMonths: data.tenureMonths,
        isAutoRenew: data.isAutoRenew,
        is80TTAEligible,
        is80TTBEligible: data.is80TTBEligible,
        deductionClaimed,
        platformName: data.platformName,
        borrowerCount: data.borrowerCount,
        defaultAmount: data.defaultAmount,
      },
    })

    return c.json({ success: true, data: record }, 201)
  } catch (error) {
    console.error('Error creating interest income:', error)
    return c.json({ success: false, error: 'Failed to create interest income' }, 500)
  }
})

// PUT /api/interest-income/:id - Update interest income record
app.put('/:id', zValidator('json', interestIncomeSchema.partial()), async (c) => {
  const userId = c.get('userId')
  const id = c.req.param('id')
  const data = c.req.valid('json')

  try {
    const existing = await prisma.interestIncome.findFirst({
      where: { id, userId },
    })

    if (!existing) {
      return c.json({ success: false, error: 'Interest income not found' }, 404)
    }

    // Recalculate deduction if relevant fields changed
    let deductionClaimed = existing.deductionClaimed
    const interestEarned = data.interestEarned ?? existing.interestEarned
    const is80TTAEligible = data.is80TTAEligible ?? existing.is80TTAEligible
    const is80TTBEligible = data.is80TTBEligible ?? existing.is80TTBEligible

    if (is80TTAEligible) {
      deductionClaimed = Math.min(interestEarned, 10000)
    } else if (is80TTBEligible) {
      deductionClaimed = Math.min(interestEarned, 50000)
    } else {
      deductionClaimed = 0
    }

    const record = await prisma.interestIncome.update({
      where: { id },
      data: {
        ...data,
        depositDate: data.depositDate ? new Date(data.depositDate) : undefined,
        maturityDate: data.maturityDate ? new Date(data.maturityDate) : undefined,
        deductionClaimed,
      },
    })

    return c.json({ success: true, data: record })
  } catch (error) {
    console.error('Error updating interest income:', error)
    return c.json({ success: false, error: 'Failed to update interest income' }, 500)
  }
})

// DELETE /api/interest-income/:id - Delete interest income record
app.delete('/:id', async (c) => {
  const userId = c.get('userId')
  const id = c.req.param('id')

  try {
    const existing = await prisma.interestIncome.findFirst({
      where: { id, userId },
    })

    if (!existing) {
      return c.json({ success: false, error: 'Interest income not found' }, 404)
    }

    await prisma.interestIncome.delete({
      where: { id },
    })

    return c.json({ success: true, message: 'Interest income deleted successfully' })
  } catch (error) {
    console.error('Error deleting interest income:', error)
    return c.json({ success: false, error: 'Failed to delete interest income' }, 500)
  }
})

export default app
