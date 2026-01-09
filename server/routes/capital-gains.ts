import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { prisma } from '../lib/prisma'
import { authMiddleware } from '../middleware/auth'

const app = new Hono()

// Apply auth middleware to all routes
app.use('*', authMiddleware)

// Cost Inflation Index (CII) for indexation calculation
const CII_INDEX: Record<string, number> = {
  '2001-02': 100,
  '2002-03': 105,
  '2003-04': 109,
  '2004-05': 113,
  '2005-06': 117,
  '2006-07': 122,
  '2007-08': 129,
  '2008-09': 137,
  '2009-10': 148,
  '2010-11': 167,
  '2011-12': 184,
  '2012-13': 200,
  '2013-14': 220,
  '2014-15': 240,
  '2015-16': 254,
  '2016-17': 264,
  '2017-18': 272,
  '2018-19': 280,
  '2019-20': 289,
  '2020-21': 301,
  '2021-22': 317,
  '2022-23': 331,
  '2023-24': 348,
  '2024-25': 363,
  '2025-26': 377,
}

// Budget 2024 Tax Rates (effective July 23, 2024)
const TAX_RATES = {
  EQUITY: { STCG: 0.20, LTCG: 0.125, exemption: 125000 },
  EQUITY_MF: { STCG: 0.20, LTCG: 0.125, exemption: 125000 },
  DEBT_MF: { STCG: 'SLAB', LTCG: 'SLAB', exemption: 0 },
  PROPERTY: { STCG: 'SLAB', LTCG: 0.125, LTCG_WITH_INDEX: 0.20, exemption: 0 },
  GOLD: { STCG: 'SLAB', LTCG: 0.125, exemption: 0 },
  CRYPTO: { STCG: 0.30, LTCG: 0.30, exemption: 0 },
  OTHER: { STCG: 'SLAB', LTCG: 0.20, exemption: 0 },
}

// Holding period thresholds for LTCG (in months)
const LTCG_THRESHOLDS: Record<string, number> = {
  EQUITY: 12,
  EQUITY_MF: 12,
  DEBT_MF: 36, // Note: Post April 2023, no LTCG benefit for debt MF
  PROPERTY: 24,
  GOLD: 24,
  CRYPTO: 12, // Treated as 12 months but taxed at 30% regardless
  OTHER: 36,
}

// Validation schema for capital gains
const capitalGainSchema = z.object({
  fiscalYear: z.string(),
  assetType: z.enum(['EQUITY', 'EQUITY_MF', 'DEBT_MF', 'PROPERTY', 'GOLD', 'CRYPTO', 'OTHER']),
  assetName: z.string().min(1, 'Asset name is required'),
  assetDescription: z.string().optional(),
  quantity: z.number().optional(),
  purchaseDate: z.string(),
  purchasePrice: z.number().min(0),
  saleDate: z.string(),
  salePrice: z.number().min(0),
  expenses: z.number().min(0).default(0),
  useIndexation: z.boolean().default(false),
  exemptionSection: z.enum(['54', '54F', '54EC', '54B']).optional(),
  exemptionAmount: z.number().min(0).default(0),
  brokerName: z.string().optional(),
  brokerOrderId: z.string().optional(),
  importedFrom: z.enum(['ZERODHA', 'GROWW', 'UPSTOX', 'MANUAL']).optional(),
})

// Helper function to get fiscal year from date
function getFiscalYearFromDate(date: Date): string {
  const year = date.getFullYear()
  const month = date.getMonth() + 1 // 0-indexed
  if (month >= 4) {
    return `${year}-${(year + 1).toString().slice(-2)}`
  }
  return `${year - 1}-${year.toString().slice(-2)}`
}

// Calculate capital gains
function calculateCapitalGains(data: {
  assetType: string
  purchaseDate: Date
  purchasePrice: number
  saleDate: Date
  salePrice: number
  expenses: number
  useIndexation: boolean
  exemptionAmount: number
}) {
  // Calculate holding period in months
  const purchaseDate = new Date(data.purchaseDate)
  const saleDate = new Date(data.saleDate)
  const holdingPeriodMonths = Math.floor(
    (saleDate.getTime() - purchaseDate.getTime()) / (1000 * 60 * 60 * 24 * 30)
  )

  // Determine STCG or LTCG
  const threshold = LTCG_THRESHOLDS[data.assetType] || 36
  const gainType = holdingPeriodMonths >= threshold ? 'LTCG' : 'STCG'

  // Calculate indexed cost if applicable
  let indexedCost = data.purchasePrice
  let purchaseCII: number | undefined
  let saleCII: number | undefined

  if (data.useIndexation && gainType === 'LTCG') {
    const purchaseFY = getFiscalYearFromDate(purchaseDate)
    const saleFY = getFiscalYearFromDate(saleDate)
    purchaseCII = CII_INDEX[purchaseFY]
    saleCII = CII_INDEX[saleFY]

    if (purchaseCII && saleCII) {
      indexedCost = (data.purchasePrice * saleCII) / purchaseCII
    }
  }

  // Calculate gross gain
  const grossGain = data.salePrice - (data.useIndexation ? indexedCost : data.purchasePrice) - data.expenses

  // Apply exemption
  const taxableGain = Math.max(0, grossGain - data.exemptionAmount)

  // Determine tax rate
  const rates = TAX_RATES[data.assetType as keyof typeof TAX_RATES] || TAX_RATES.OTHER
  let taxRate: number

  if (gainType === 'STCG') {
    taxRate = typeof rates.STCG === 'number' ? rates.STCG : 0.30 // Use 30% as proxy for slab rate
  } else {
    if (data.useIndexation && 'LTCG_WITH_INDEX' in rates) {
      taxRate = rates.LTCG_WITH_INDEX as number
    } else {
      taxRate = typeof rates.LTCG === 'number' ? rates.LTCG : 0.30
    }
  }

  // Apply exemption for equity LTCG (Rs 1.25L)
  let effectiveTaxableGain = taxableGain
  if (data.assetType === 'EQUITY' || data.assetType === 'EQUITY_MF') {
    if (gainType === 'LTCG') {
      effectiveTaxableGain = Math.max(0, taxableGain - 125000)
    }
  }

  const estimatedTax = effectiveTaxableGain * taxRate

  // For property bought before July 2024, calculate both options
  let taxWithIndexation: number | undefined
  let taxWithoutIndex: number | undefined
  let recommendedOption: string | undefined
  const isPreJuly2024 = purchaseDate < new Date('2024-07-23')

  if (data.assetType === 'PROPERTY' && gainType === 'LTCG' && isPreJuly2024) {
    // Option 1: 12.5% without indexation
    const gainWithoutIndex = data.salePrice - data.purchasePrice - data.expenses - data.exemptionAmount
    taxWithoutIndex = Math.max(0, gainWithoutIndex) * 0.125

    // Option 2: 20% with indexation
    if (purchaseCII && saleCII) {
      const gainWithIndex = data.salePrice - indexedCost - data.expenses - data.exemptionAmount
      taxWithIndexation = Math.max(0, gainWithIndex) * 0.20
    }

    // Recommend lower tax option
    if (taxWithIndexation !== undefined && taxWithoutIndex !== undefined) {
      recommendedOption = taxWithIndexation < taxWithoutIndex ? 'WITH_INDEX' : 'WITHOUT_INDEX'
    }
  }

  return {
    holdingPeriodMonths,
    gainType,
    indexedCost: data.useIndexation ? indexedCost : undefined,
    purchaseCII,
    saleCII,
    grossGain,
    taxableGain,
    taxRate,
    estimatedTax,
    isPreJuly2024,
    taxWithIndexation,
    taxWithoutIndex,
    recommendedOption,
  }
}

// GET /api/capital-gains - List all capital gains records
app.get('/', async (c) => {
  const userId = c.get('userId')
  const financialYear = c.req.query('financialYear')
  const assetType = c.req.query('assetType')
  const gainType = c.req.query('gainType')

  try {
    const whereClause: {
      userId: string
      fiscalYear?: string
      assetType?: string
      gainType?: string
    } = { userId }

    if (financialYear) whereClause.fiscalYear = financialYear
    if (assetType) whereClause.assetType = assetType
    if (gainType) whereClause.gainType = gainType

    const records = await prisma.capitalGain.findMany({
      where: whereClause,
      orderBy: [{ saleDate: 'desc' }],
    })

    // Calculate summary
    const stcgRecords = records.filter((r) => r.gainType === 'STCG')
    const ltcgRecords = records.filter((r) => r.gainType === 'LTCG')

    const summary = {
      totalTransactions: records.length,
      totalSTCG: stcgRecords.reduce((sum, r) => sum + r.taxableGain, 0),
      totalLTCG: ltcgRecords.reduce((sum, r) => sum + r.taxableGain, 0),
      totalEstimatedTax: records.reduce((sum, r) => sum + r.estimatedTax, 0),
      stcgCount: stcgRecords.length,
      ltcgCount: ltcgRecords.length,
      byAssetType: Object.entries(
        records.reduce(
          (acc, r) => {
            if (!acc[r.assetType]) acc[r.assetType] = { gain: 0, tax: 0, count: 0 }
            acc[r.assetType].gain += r.taxableGain
            acc[r.assetType].tax += r.estimatedTax
            acc[r.assetType].count += 1
            return acc
          },
          {} as Record<string, { gain: number; tax: number; count: number }>
        )
      ).map(([type, data]) => ({ type, ...data })),
    }

    return c.json({
      success: true,
      data: { records, summary },
    })
  } catch (error) {
    console.error('Error fetching capital gains:', error)
    return c.json({ success: false, error: 'Failed to fetch capital gains' }, 500)
  }
})

// GET /api/capital-gains/:id - Get single capital gain record
app.get('/:id', async (c) => {
  const userId = c.get('userId')
  const id = c.req.param('id')

  try {
    const record = await prisma.capitalGain.findFirst({
      where: { id, userId },
    })

    if (!record) {
      return c.json({ success: false, error: 'Capital gain not found' }, 404)
    }

    return c.json({ success: true, data: record })
  } catch (error) {
    console.error('Error fetching capital gain:', error)
    return c.json({ success: false, error: 'Failed to fetch capital gain' }, 500)
  }
})

// POST /api/capital-gains - Create capital gain record
app.post('/', zValidator('json', capitalGainSchema), async (c) => {
  const userId = c.get('userId')
  const data = c.req.valid('json')

  try {
    const calculations = calculateCapitalGains({
      assetType: data.assetType,
      purchaseDate: new Date(data.purchaseDate),
      purchasePrice: data.purchasePrice,
      saleDate: new Date(data.saleDate),
      salePrice: data.salePrice,
      expenses: data.expenses,
      useIndexation: data.useIndexation,
      exemptionAmount: data.exemptionAmount,
    })

    const record = await prisma.capitalGain.create({
      data: {
        userId,
        fiscalYear: data.fiscalYear,
        assetType: data.assetType,
        assetName: data.assetName,
        assetDescription: data.assetDescription,
        quantity: data.quantity,
        purchaseDate: new Date(data.purchaseDate),
        purchasePrice: data.purchasePrice,
        saleDate: new Date(data.saleDate),
        salePrice: data.salePrice,
        expenses: data.expenses,
        holdingPeriodMonths: calculations.holdingPeriodMonths,
        gainType: calculations.gainType,
        purchaseCII: calculations.purchaseCII,
        saleCII: calculations.saleCII,
        indexedCost: calculations.indexedCost,
        useIndexation: data.useIndexation,
        grossGain: calculations.grossGain,
        exemptionSection: data.exemptionSection,
        exemptionAmount: data.exemptionAmount,
        taxableGain: calculations.taxableGain,
        taxRate: calculations.taxRate,
        estimatedTax: calculations.estimatedTax,
        isPreJuly2024: calculations.isPreJuly2024,
        taxWithIndexation: calculations.taxWithIndexation,
        taxWithoutIndex: calculations.taxWithoutIndex,
        recommendedOption: calculations.recommendedOption,
        brokerName: data.brokerName,
        brokerOrderId: data.brokerOrderId,
        importedFrom: data.importedFrom ?? 'MANUAL',
      },
    })

    return c.json({ success: true, data: record }, 201)
  } catch (error) {
    console.error('Error creating capital gain:', error)
    return c.json({ success: false, error: 'Failed to create capital gain' }, 500)
  }
})

// PUT /api/capital-gains/:id - Update capital gain record
app.put('/:id', zValidator('json', capitalGainSchema.partial()), async (c) => {
  const userId = c.get('userId')
  const id = c.req.param('id')
  const data = c.req.valid('json')

  try {
    const existing = await prisma.capitalGain.findFirst({
      where: { id, userId },
    })

    if (!existing) {
      return c.json({ success: false, error: 'Capital gain not found' }, 404)
    }

    // Recalculate if relevant fields changed
    const calculations = calculateCapitalGains({
      assetType: data.assetType ?? existing.assetType,
      purchaseDate: data.purchaseDate ? new Date(data.purchaseDate) : existing.purchaseDate,
      purchasePrice: data.purchasePrice ?? existing.purchasePrice,
      saleDate: data.saleDate ? new Date(data.saleDate) : existing.saleDate,
      salePrice: data.salePrice ?? existing.salePrice,
      expenses: data.expenses ?? existing.expenses,
      useIndexation: data.useIndexation ?? existing.useIndexation,
      exemptionAmount: data.exemptionAmount ?? existing.exemptionAmount,
    })

    const record = await prisma.capitalGain.update({
      where: { id },
      data: {
        ...data,
        purchaseDate: data.purchaseDate ? new Date(data.purchaseDate) : undefined,
        saleDate: data.saleDate ? new Date(data.saleDate) : undefined,
        holdingPeriodMonths: calculations.holdingPeriodMonths,
        gainType: calculations.gainType,
        purchaseCII: calculations.purchaseCII,
        saleCII: calculations.saleCII,
        indexedCost: calculations.indexedCost,
        grossGain: calculations.grossGain,
        taxableGain: calculations.taxableGain,
        taxRate: calculations.taxRate,
        estimatedTax: calculations.estimatedTax,
        isPreJuly2024: calculations.isPreJuly2024,
        taxWithIndexation: calculations.taxWithIndexation,
        taxWithoutIndex: calculations.taxWithoutIndex,
        recommendedOption: calculations.recommendedOption,
      },
    })

    return c.json({ success: true, data: record })
  } catch (error) {
    console.error('Error updating capital gain:', error)
    return c.json({ success: false, error: 'Failed to update capital gain' }, 500)
  }
})

// DELETE /api/capital-gains/:id - Delete capital gain record
app.delete('/:id', async (c) => {
  const userId = c.get('userId')
  const id = c.req.param('id')

  try {
    const existing = await prisma.capitalGain.findFirst({
      where: { id, userId },
    })

    if (!existing) {
      return c.json({ success: false, error: 'Capital gain not found' }, 404)
    }

    await prisma.capitalGain.delete({
      where: { id },
    })

    return c.json({ success: true, message: 'Capital gain deleted successfully' })
  } catch (error) {
    console.error('Error deleting capital gain:', error)
    return c.json({ success: false, error: 'Failed to delete capital gain' }, 500)
  }
})

// GET /api/capital-gains/cii - Get CII index values
app.get('/cii/index', async (c) => {
  return c.json({
    success: true,
    data: CII_INDEX,
  })
})

export default app
