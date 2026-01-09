import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { prisma } from '../lib/prisma'
import { authMiddleware } from '../middleware/auth'

const app = new Hono()

// Apply auth middleware to all routes
app.use('*', authMiddleware)

// Validation schema for business income
const businessIncomeSchema = z.object({
  fiscalYear: z.string(),
  businessName: z.string().min(1, 'Business name is required'),
  businessType: z.enum(['PROPRIETORSHIP', 'PARTNERSHIP', 'LLP']),
  taxationScheme: z.enum(['44AD', '44ADA', 'REGULAR']),
  natureOfBusiness: z.string().optional(),
  grossReceipts: z.number().min(0),
  digitalPaymentPct: z.number().min(0).max(100).default(50),
  deemedProfitRate: z.number().min(0).max(100),
  taxableProfit: z.number(),
  gstRegistered: z.boolean().default(false),
  gstNumber: z.string().optional(),
  gstFilingFreq: z.enum(['MONTHLY', 'QUARTERLY']).optional(),
  pan: z.string().optional(),
  schemeStartYear: z.string().optional(),
  yearsOnScheme: z.number().int().min(1).default(1),
})

// GET /api/business-income - List all business income records
app.get('/', async (c) => {
  const userId = c.get('userId')
  const financialYear = c.req.query('financialYear')

  try {
    const whereClause: { userId: string; fiscalYear?: string } = { userId }
    if (financialYear) {
      whereClause.fiscalYear = financialYear
    }

    const records = await prisma.businessIncome.findMany({
      where: whereClause,
      orderBy: [{ createdAt: 'desc' }],
    })

    // Calculate summary
    const summary = {
      totalGrossReceipts: records.reduce((sum, r) => sum + r.grossReceipts, 0),
      totalTaxableProfit: records.reduce((sum, r) => sum + r.taxableProfit, 0),
      businessCount: records.length,
      scheme44ADCount: records.filter((r) => r.taxationScheme === '44AD').length,
      scheme44ADACount: records.filter((r) => r.taxationScheme === '44ADA').length,
    }

    return c.json({
      success: true,
      data: { records, summary },
    })
  } catch (error) {
    console.error('Error fetching business income:', error)
    return c.json({ success: false, error: 'Failed to fetch business income' }, 500)
  }
})

// GET /api/business-income/:id - Get single business income record
app.get('/:id', async (c) => {
  const userId = c.get('userId')
  const id = c.req.param('id')

  try {
    const record = await prisma.businessIncome.findFirst({
      where: { id, userId },
    })

    if (!record) {
      return c.json({ success: false, error: 'Business income not found' }, 404)
    }

    return c.json({ success: true, data: record })
  } catch (error) {
    console.error('Error fetching business income:', error)
    return c.json({ success: false, error: 'Failed to fetch business income' }, 500)
  }
})

// POST /api/business-income - Create business income record
app.post('/', zValidator('json', businessIncomeSchema), async (c) => {
  const userId = c.get('userId')
  const data = c.req.valid('json')

  try {
    // Calculate deemed profit based on scheme
    let calculatedProfit = data.taxableProfit
    if (data.taxationScheme === '44AD') {
      // 8% for non-digital, 6% for digital payments
      const digitalPortion = data.grossReceipts * (data.digitalPaymentPct / 100)
      const nonDigitalPortion = data.grossReceipts - digitalPortion
      calculatedProfit = nonDigitalPortion * 0.08 + digitalPortion * 0.06
    } else if (data.taxationScheme === '44ADA') {
      // 50% deemed profit for professionals
      calculatedProfit = data.grossReceipts * 0.5
    }

    const record = await prisma.businessIncome.create({
      data: {
        userId,
        fiscalYear: data.fiscalYear,
        businessName: data.businessName,
        businessType: data.businessType,
        taxationScheme: data.taxationScheme,
        natureOfBusiness: data.natureOfBusiness,
        grossReceipts: data.grossReceipts,
        digitalPaymentPct: data.digitalPaymentPct,
        deemedProfitRate: data.deemedProfitRate,
        taxableProfit: calculatedProfit,
        gstRegistered: data.gstRegistered,
        gstNumber: data.gstNumber,
        gstFilingFreq: data.gstFilingFreq,
        pan: data.pan,
        schemeStartYear: data.schemeStartYear,
        yearsOnScheme: data.yearsOnScheme,
      },
    })

    return c.json({ success: true, data: record }, 201)
  } catch (error) {
    console.error('Error creating business income:', error)
    return c.json({ success: false, error: 'Failed to create business income' }, 500)
  }
})

// PUT /api/business-income/:id - Update business income record
app.put('/:id', zValidator('json', businessIncomeSchema.partial()), async (c) => {
  const userId = c.get('userId')
  const id = c.req.param('id')
  const data = c.req.valid('json')

  try {
    const existing = await prisma.businessIncome.findFirst({
      where: { id, userId },
    })

    if (!existing) {
      return c.json({ success: false, error: 'Business income not found' }, 404)
    }

    // Recalculate profit if gross receipts or scheme changed
    let updateData = { ...data }
    if (data.grossReceipts !== undefined || data.taxationScheme !== undefined) {
      const grossReceipts = data.grossReceipts ?? existing.grossReceipts
      const scheme = data.taxationScheme ?? existing.taxationScheme
      const digitalPct = data.digitalPaymentPct ?? existing.digitalPaymentPct

      if (scheme === '44AD') {
        const digitalPortion = grossReceipts * (digitalPct / 100)
        const nonDigitalPortion = grossReceipts - digitalPortion
        updateData.taxableProfit = nonDigitalPortion * 0.08 + digitalPortion * 0.06
      } else if (scheme === '44ADA') {
        updateData.taxableProfit = grossReceipts * 0.5
      }
    }

    const record = await prisma.businessIncome.update({
      where: { id },
      data: updateData,
    })

    return c.json({ success: true, data: record })
  } catch (error) {
    console.error('Error updating business income:', error)
    return c.json({ success: false, error: 'Failed to update business income' }, 500)
  }
})

// DELETE /api/business-income/:id - Delete business income record
app.delete('/:id', async (c) => {
  const userId = c.get('userId')
  const id = c.req.param('id')

  try {
    const existing = await prisma.businessIncome.findFirst({
      where: { id, userId },
    })

    if (!existing) {
      return c.json({ success: false, error: 'Business income not found' }, 404)
    }

    await prisma.businessIncome.delete({
      where: { id },
    })

    return c.json({ success: true, message: 'Business income deleted successfully' })
  } catch (error) {
    console.error('Error deleting business income:', error)
    return c.json({ success: false, error: 'Failed to delete business income' }, 500)
  }
})

export default app
