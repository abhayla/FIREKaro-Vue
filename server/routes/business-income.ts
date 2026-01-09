import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { prisma } from '../lib/prisma'
import { authMiddleware } from '../middleware/auth'

const app = new Hono()

// Apply auth middleware to all routes
app.use('*', authMiddleware)

// Validation schema for business income - matching frontend types
const businessIncomeSchema = z.object({
  financialYear: z.string(),
  businessName: z.string().min(1, 'Business name is required'),
  businessType: z.enum(['proprietorship', 'partnership', 'freelance', 'commission_agent']),
  taxationMethod: z.enum(['44AD', '44ADA', 'regular_books']),
  grossReceipts: z.number().min(0),
  digitalPaymentPercentage: z.number().min(0).max(100).default(50),
  totalExpenses: z.number().optional(),
  depreciation: z.number().optional(),
  isGstRegistered: z.boolean().default(false),
  gstin: z.string().optional(),
})

// Helper to calculate deemed profit
function calculateDeemedProfit(
  taxationMethod: string,
  grossReceipts: number,
  digitalPaymentPercentage: number,
  totalExpenses?: number,
  depreciation?: number
): { deemedProfit: number; deemedProfitRate: number } {
  if (taxationMethod === '44AD') {
    // 8% for cash, 6% for digital payments
    const digitalPortion = grossReceipts * (digitalPaymentPercentage / 100)
    const cashPortion = grossReceipts - digitalPortion
    const deemedProfit = cashPortion * 0.08 + digitalPortion * 0.06
    const deemedProfitRate = grossReceipts > 0 ? deemedProfit / grossReceipts : 0
    return { deemedProfit, deemedProfitRate }
  } else if (taxationMethod === '44ADA') {
    // 50% deemed profit for professionals
    const deemedProfit = grossReceipts * 0.5
    return { deemedProfit, deemedProfitRate: 0.5 }
  } else {
    // Regular books - actual profit
    const expenses = (totalExpenses || 0) + (depreciation || 0)
    const deemedProfit = grossReceipts - expenses
    const deemedProfitRate = grossReceipts > 0 ? deemedProfit / grossReceipts : 0
    return { deemedProfit, deemedProfitRate }
  }
}

// GET /api/business-income - List all business income records
app.get('/', async (c) => {
  const userId = c.get('userId')
  // Support both 'fy' and 'financialYear' query params
  const financialYear = c.req.query('fy') || c.req.query('financialYear')

  try {
    const whereClause: { userId: string; financialYear?: string } = { userId }
    if (financialYear) {
      whereClause.financialYear = financialYear
    }

    const records = await prisma.businessIncome.findMany({
      where: whereClause,
      orderBy: [{ createdAt: 'desc' }],
    })

    // Return array directly (frontend expects this format)
    return c.json(records)
  } catch (error) {
    console.error('Error fetching business income:', error)
    return c.json([], 500)
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
      return c.json({ message: 'Business income not found' }, 404)
    }

    return c.json(record)
  } catch (error) {
    console.error('Error fetching business income:', error)
    return c.json({ message: 'Failed to fetch business income' }, 500)
  }
})

// POST /api/business-income - Create business income record
app.post('/', zValidator('json', businessIncomeSchema), async (c) => {
  const userId = c.get('userId')
  const data = c.req.valid('json')

  try {
    // Calculate deemed profit based on taxation method
    const { deemedProfit, deemedProfitRate } = calculateDeemedProfit(
      data.taxationMethod,
      data.grossReceipts,
      data.digitalPaymentPercentage,
      data.totalExpenses,
      data.depreciation
    )

    const record = await prisma.businessIncome.create({
      data: {
        userId,
        financialYear: data.financialYear,
        businessName: data.businessName,
        businessType: data.businessType,
        taxationMethod: data.taxationMethod,
        grossReceipts: data.grossReceipts,
        digitalPaymentPercentage: data.digitalPaymentPercentage,
        totalExpenses: data.totalExpenses,
        depreciation: data.depreciation,
        deemedProfit,
        deemedProfitRate,
        isGstRegistered: data.isGstRegistered,
        gstin: data.gstin,
      },
    })

    return c.json(record, 201)
  } catch (error) {
    console.error('Error creating business income:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return c.json({ message: 'Failed to create business income', details: errorMessage }, 500)
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
      return c.json({ message: 'Business income not found' }, 404)
    }

    // Recalculate profit if relevant fields changed
    const grossReceipts = data.grossReceipts ?? existing.grossReceipts
    const taxationMethod = data.taxationMethod ?? existing.taxationMethod
    const digitalPct = data.digitalPaymentPercentage ?? existing.digitalPaymentPercentage
    const totalExpenses = data.totalExpenses ?? existing.totalExpenses
    const depreciation = data.depreciation ?? existing.depreciation

    const { deemedProfit, deemedProfitRate } = calculateDeemedProfit(
      taxationMethod,
      grossReceipts,
      digitalPct,
      totalExpenses ?? undefined,
      depreciation ?? undefined
    )

    const record = await prisma.businessIncome.update({
      where: { id },
      data: {
        ...data,
        deemedProfit,
        deemedProfitRate,
      },
    })

    return c.json(record)
  } catch (error) {
    console.error('Error updating business income:', error)
    return c.json({ message: 'Failed to update business income' }, 500)
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
      return c.json({ message: 'Business income not found' }, 404)
    }

    await prisma.businessIncome.delete({
      where: { id },
    })

    return c.json({ message: 'Business income deleted successfully' })
  } catch (error) {
    console.error('Error deleting business income:', error)
    return c.json({ message: 'Failed to delete business income' }, 500)
  }
})

export default app
