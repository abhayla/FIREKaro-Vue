import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { prisma } from '../lib/prisma'
import { authMiddleware } from '../middleware/auth'

const app = new Hono()

// Apply auth middleware to all routes
app.use('*', authMiddleware)

// Gift exemption - relatives list per Income Tax Act
const EXEMPT_RELATIVES = [
  'SPOUSE',
  'BROTHER',
  'SISTER',
  'BROTHER_SPOUSE',
  'SISTER_SPOUSE',
  'PARENT',
  'PARENT_SPOUSE',
  'LINEAL_ASCENDANT',
  'LINEAL_DESCENDANT',
  'SPOUSE_LINEAL_ASCENDANT',
  'SPOUSE_LINEAL_DESCENDANT',
]

// Validation schema for other income
const otherIncomeSchema = z.object({
  fiscalYear: z.string(),
  category: z.enum([
    'COMMISSION',
    'ROYALTY',
    'PENSION',
    'GIFT',
    'LOTTERY',
    'AGRICULTURAL',
    'FAMILY_PENSION',
    'OTHER',
  ]),
  description: z.string().min(1, 'Description is required'),
  sourceName: z.string().optional(),
  sourcePan: z.string().optional(),
  grossAmount: z.number().min(0),
  tdsDeducted: z.number().min(0).default(0),

  // Commission fields
  isRegular: z.boolean().default(false),
  commissionType: z.enum(['INSURANCE', 'REAL_ESTATE', 'MLM', 'REFERRAL', 'OTHER']).optional(),

  // Gift fields
  giftDate: z.string().optional(),
  donorRelationship: z.string().optional(),
  isFromRelative: z.boolean().default(false),

  // Lottery fields
  gameShowName: z.string().optional(),
  winningDate: z.string().optional(),

  // Pension fields
  pensionType: z.enum(['COMMUTED', 'UNCOMMUTED', 'FAMILY']).optional(),
  pensionerName: z.string().optional(),

  // Agricultural fields
  landLocation: z.string().optional(),
  cropType: z.string().optional(),

  // Royalty fields
  royaltyType: z.enum(['BOOK', 'MUSIC', 'PATENT', 'SOFTWARE']).optional(),

  receiptDate: z.string().optional(),
})

// Calculate tax treatment based on category
function calculateTaxTreatment(data: {
  category: string
  grossAmount: number
  isFromRelative?: boolean
  donorRelationship?: string
}) {
  let isExempt = false
  let flatTaxRate: number | null = null
  let netAmount = data.grossAmount
  let taxNote = ''

  switch (data.category) {
    case 'GIFT':
      // Gifts from relatives are exempt
      // Gifts from non-relatives > Rs 50,000 are taxable
      if (data.isFromRelative || EXEMPT_RELATIVES.includes(data.donorRelationship || '')) {
        isExempt = true
        taxNote = 'Gift from relative - fully exempt'
      } else if (data.grossAmount <= 50000) {
        isExempt = true
        taxNote = 'Gift from non-relative up to Rs 50,000 - exempt'
      } else {
        isExempt = false
        taxNote = 'Gift from non-relative above Rs 50,000 - fully taxable at slab rate'
      }
      break

    case 'LOTTERY':
      // Flat 30% tax + 4% cess = 31.2%
      flatTaxRate = 30
      taxNote = 'Lottery/Game show winnings - flat 30% tax (+ 4% cess)'
      break

    case 'AGRICULTURAL':
      // Exempt but considered for rate purposes
      isExempt = true
      taxNote = 'Agricultural income - exempt but considered for tax rate calculation'
      break

    case 'PENSION':
      // Commuted pension - partially exempt
      // Uncommuted pension - fully taxable
      // Family pension - Rs 15,000 or 1/3rd exempt
      taxNote = 'Pension income - tax treatment depends on type'
      break

    case 'COMMISSION':
      // Regular commission may be treated as business income (44AD)
      // Occasional commission is other income
      taxNote = data.isFromRelative
        ? 'Regular commission - consider declaring as business income under 44AD'
        : 'Occasional commission - taxable at slab rate'
      break

    default:
      taxNote = 'Taxable at applicable slab rate'
  }

  return {
    isExempt,
    flatTaxRate,
    netAmount,
    taxNote,
  }
}

// GET /api/other-income - List all other income records
app.get('/', async (c) => {
  const userId = c.get('userId')
  const financialYear = c.req.query('financialYear')
  const category = c.req.query('category')

  try {
    const whereClause: {
      userId: string
      fiscalYear?: string
      category?: string
    } = { userId }

    if (financialYear) whereClause.fiscalYear = financialYear
    if (category) whereClause.category = category

    const records = await prisma.otherIncome.findMany({
      where: whereClause,
      orderBy: [{ createdAt: 'desc' }],
    })

    // Calculate summary
    const totalGross = records.reduce((sum, r) => sum + r.grossAmount, 0)
    const totalTDS = records.reduce((sum, r) => sum + r.tdsDeducted, 0)
    const totalExempt = records.filter((r) => r.isExempt).reduce((sum, r) => sum + r.grossAmount, 0)

    // Lottery income (30% flat tax)
    const lotteryIncome = records
      .filter((r) => r.category === 'LOTTERY')
      .reduce((sum, r) => sum + r.grossAmount, 0)
    const lotteryTax = lotteryIncome * 0.312 // 30% + 4% cess

    // Group by category
    const byCategory = records.reduce(
      (acc, r) => {
        if (!acc[r.category]) {
          acc[r.category] = { gross: 0, tds: 0, count: 0 }
        }
        acc[r.category].gross += r.grossAmount
        acc[r.category].tds += r.tdsDeducted
        acc[r.category].count += 1
        return acc
      },
      {} as Record<string, { gross: number; tds: number; count: number }>
    )

    // Commission income that could be 44AD eligible
    const regularCommission = records.filter((r) => r.category === 'COMMISSION' && r.isRegular)
    const commission44ADEligible = regularCommission.reduce((sum, r) => sum + r.grossAmount, 0)

    const summary = {
      totalGross,
      totalTDS,
      totalExempt,
      taxableIncome: totalGross - totalExempt,
      netIncome: totalGross - totalTDS,
      lotteryIncome,
      lotteryTax,
      commission44ADEligible,
      recordCount: records.length,
      byCategory: Object.entries(byCategory).map(([cat, data]) => ({
        category: cat,
        ...data,
      })),
    }

    return c.json({
      success: true,
      data: { records, summary },
    })
  } catch (error) {
    console.error('Error fetching other income:', error)
    return c.json({ success: false, error: 'Failed to fetch other income' }, 500)
  }
})

// GET /api/other-income/:id - Get single other income record
app.get('/:id', async (c) => {
  const userId = c.get('userId')
  const id = c.req.param('id')

  try {
    const record = await prisma.otherIncome.findFirst({
      where: { id, userId },
    })

    if (!record) {
      return c.json({ success: false, error: 'Other income not found' }, 404)
    }

    return c.json({ success: true, data: record })
  } catch (error) {
    console.error('Error fetching other income:', error)
    return c.json({ success: false, error: 'Failed to fetch other income' }, 500)
  }
})

// POST /api/other-income - Create other income record
app.post('/', zValidator('json', otherIncomeSchema), async (c) => {
  const userId = c.get('userId')
  const data = c.req.valid('json')

  try {
    // Calculate tax treatment
    const taxTreatment = calculateTaxTreatment({
      category: data.category,
      grossAmount: data.grossAmount,
      isFromRelative: data.isFromRelative,
      donorRelationship: data.donorRelationship,
    })

    const record = await prisma.otherIncome.create({
      data: {
        userId,
        fiscalYear: data.fiscalYear,
        category: data.category,
        description: data.description,
        sourceName: data.sourceName,
        sourcePan: data.sourcePan,
        grossAmount: data.grossAmount,
        tdsDeducted: data.tdsDeducted,
        netAmount: data.grossAmount - data.tdsDeducted,
        isRegular: data.isRegular,
        commissionType: data.commissionType,
        giftDate: data.giftDate ? new Date(data.giftDate) : null,
        donorRelationship: data.donorRelationship,
        isFromRelative: data.isFromRelative || EXEMPT_RELATIVES.includes(data.donorRelationship || ''),
        isExempt: taxTreatment.isExempt,
        gameShowName: data.gameShowName,
        winningDate: data.winningDate ? new Date(data.winningDate) : null,
        flatTaxRate: taxTreatment.flatTaxRate,
        pensionType: data.pensionType,
        pensionerName: data.pensionerName,
        landLocation: data.landLocation,
        cropType: data.cropType,
        royaltyType: data.royaltyType,
        receiptDate: data.receiptDate ? new Date(data.receiptDate) : null,
      },
    })

    return c.json({ success: true, data: record }, 201)
  } catch (error) {
    console.error('Error creating other income:', error)
    return c.json({ success: false, error: 'Failed to create other income' }, 500)
  }
})

// PUT /api/other-income/:id - Update other income record
app.put('/:id', zValidator('json', otherIncomeSchema.partial()), async (c) => {
  const userId = c.get('userId')
  const id = c.req.param('id')
  const data = c.req.valid('json')

  try {
    const existing = await prisma.otherIncome.findFirst({
      where: { id, userId },
    })

    if (!existing) {
      return c.json({ success: false, error: 'Other income not found' }, 404)
    }

    // Recalculate tax treatment if relevant fields changed
    const category = data.category ?? existing.category
    const grossAmount = data.grossAmount ?? existing.grossAmount
    const isFromRelative = data.isFromRelative ?? existing.isFromRelative
    const donorRelationship = data.donorRelationship ?? existing.donorRelationship

    const taxTreatment = calculateTaxTreatment({
      category,
      grossAmount,
      isFromRelative,
      donorRelationship,
    })

    const record = await prisma.otherIncome.update({
      where: { id },
      data: {
        ...data,
        netAmount: grossAmount - (data.tdsDeducted ?? existing.tdsDeducted),
        isExempt: taxTreatment.isExempt,
        flatTaxRate: taxTreatment.flatTaxRate,
        giftDate: data.giftDate ? new Date(data.giftDate) : undefined,
        winningDate: data.winningDate ? new Date(data.winningDate) : undefined,
        receiptDate: data.receiptDate ? new Date(data.receiptDate) : undefined,
      },
    })

    return c.json({ success: true, data: record })
  } catch (error) {
    console.error('Error updating other income:', error)
    return c.json({ success: false, error: 'Failed to update other income' }, 500)
  }
})

// DELETE /api/other-income/:id - Delete other income record
app.delete('/:id', async (c) => {
  const userId = c.get('userId')
  const id = c.req.param('id')

  try {
    const existing = await prisma.otherIncome.findFirst({
      where: { id, userId },
    })

    if (!existing) {
      return c.json({ success: false, error: 'Other income not found' }, 404)
    }

    await prisma.otherIncome.delete({
      where: { id },
    })

    return c.json({ success: true, message: 'Other income deleted successfully' })
  } catch (error) {
    console.error('Error deleting other income:', error)
    return c.json({ success: false, error: 'Failed to delete other income' }, 500)
  }
})

// POST /api/other-income/commission-wizard - Commission wizard to determine routing
app.post('/commission-wizard', async (c) => {
  const body = await c.req.json()
  const { grossAmount, isRegular, commissionType } = body

  // Determine if this should be business income or other income
  let recommendation: 'BUSINESS_44AD' | 'OTHER_SOURCES'
  let itrForm: string
  let explanation: string

  if (isRegular) {
    // Regular commission income - treat as business income under 44AD
    recommendation = 'BUSINESS_44AD'
    itrForm = 'ITR-4'
    explanation = `Regular commission income of Rs ${grossAmount.toLocaleString('en-IN')} should be declared as business income under Section 44AD. Deemed profit will be 8% (or 6% for digital payments) of gross receipts.`
  } else {
    // Occasional/one-time commission - other sources
    recommendation = 'OTHER_SOURCES'
    itrForm = 'ITR-2 or ITR-1'
    explanation = `Occasional commission income of Rs ${grossAmount.toLocaleString('en-IN')} should be declared under "Income from Other Sources". It will be taxed at your slab rate.`
  }

  return c.json({
    success: true,
    data: {
      recommendation,
      itrForm,
      explanation,
      nextStep:
        recommendation === 'BUSINESS_44AD'
          ? 'Navigate to Business Income section and add as commission agent business'
          : 'Add as Other Income with category "COMMISSION"',
    },
  })
})

// GET /api/other-income/gift-exemption - Check gift exemption eligibility
app.get('/gift-exemption', async (c) => {
  const amount = parseFloat(c.req.query('amount') || '0')
  const relationship = c.req.query('relationship') || ''

  const isRelative = EXEMPT_RELATIVES.includes(relationship)
  const isExempt = isRelative || amount <= 50000
  const taxableAmount = isExempt ? 0 : amount

  return c.json({
    success: true,
    data: {
      amount,
      relationship,
      isRelative,
      isExempt,
      taxableAmount,
      exemptRelatives: EXEMPT_RELATIVES,
      explanation: isRelative
        ? 'Gift from relative is fully exempt from tax.'
        : amount <= 50000
          ? 'Gift from non-relative up to Rs 50,000 is exempt.'
          : `Gift from non-relative above Rs 50,000 is fully taxable. Taxable amount: Rs ${taxableAmount.toLocaleString('en-IN')}`,
    },
  })
})

export default app
