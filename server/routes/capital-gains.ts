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

// Asset type mapping (lowercase to uppercase)
const ASSET_TYPE_MAP: Record<string, string> = {
  equity: 'EQUITY',
  listed_equity: 'EQUITY',
  equity_mf: 'EQUITY_MF',
  debt_mf: 'DEBT_MF',
  property: 'PROPERTY',
  gold: 'GOLD',
  crypto: 'CRYPTO',
  other: 'OTHER',
  // Also accept uppercase directly
  EQUITY: 'EQUITY',
  EQUITY_MF: 'EQUITY_MF',
  DEBT_MF: 'DEBT_MF',
  PROPERTY: 'PROPERTY',
  GOLD: 'GOLD',
  CRYPTO: 'CRYPTO',
  OTHER: 'OTHER',
}

// Base validation schema for capital gains (lenient - accepts both frontend and backend formats)
const capitalGainBaseSchema = z.object({
  // Accept both fiscalYear and financialYear
  fiscalYear: z.string().optional(),
  financialYear: z.string().optional(),
  // Accept any case for asset type
  assetType: z.string(),
  assetName: z.string().min(1, 'Asset name is required'),
  assetDescription: z.string().optional(),
  quantity: z.number().optional(),
  purchaseDate: z.string(),
  purchasePrice: z.number().min(0),
  saleDate: z.string(),
  salePrice: z.number().min(0),
  expenses: z.number().min(0).default(0),
  purchaseExpenses: z.number().min(0).optional(),
  saleExpenses: z.number().min(0).optional(),
  improvementCost: z.number().min(0).optional(),
  useIndexation: z.boolean().default(false),
  exemptionSection: z.enum(['54', '54F', '54EC', '54B']).optional().nullable(),
  exemptionAmount: z.number().min(0).default(0),
  exemptionClaimed: z.number().min(0).optional(),
  brokerName: z.string().optional(),
  brokerOrderId: z.string().optional(),
  importedFrom: z.enum(['ZERODHA', 'GROWW', 'UPSTOX', 'MANUAL']).optional(),
})

// Schema with transform for create operations
const capitalGainSchema = capitalGainBaseSchema.transform((data) => ({
  ...data,
  // Normalize asset type to uppercase
  assetType: ASSET_TYPE_MAP[data.assetType] || data.assetType.toUpperCase(),
  // Normalize fiscalYear field
  fiscalYear: data.fiscalYear || data.financialYear || '2025-26',
  // Normalize expenses
  expenses: data.expenses || (data.purchaseExpenses || 0) + (data.saleExpenses || 0) + (data.improvementCost || 0),
  exemptionAmount: data.exemptionAmount || data.exemptionClaimed || 0,
}))

// Partial schema for updates
const capitalGainUpdateSchema = capitalGainBaseSchema.partial()

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
  // Support both 'fy' and 'financialYear' query params
  const financialYear = c.req.query('fy') || c.req.query('financialYear')
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

    // Transform records to match frontend expected format
    const transformedRecords = records.map((r) => ({
      id: r.id,
      assetType: r.assetType.toLowerCase(), // Frontend expects lowercase
      assetName: r.assetName,
      financialYear: r.fiscalYear, // Frontend expects financialYear
      purchaseDate: r.purchaseDate.toISOString(),
      purchasePrice: r.purchasePrice,
      saleDate: r.saleDate.toISOString(),
      salePrice: r.salePrice,
      purchaseExpenses: r.expenses, // Map expenses to purchaseExpenses
      saleExpenses: 0,
      improvementCost: 0,
      useIndexation: r.useIndexation,
      exemptionClaimed: r.exemptionAmount,
      exemptionSection: r.exemptionSection,
      holdingPeriodMonths: r.holdingPeriodMonths,
      gainType: r.gainType,
      grossGain: r.grossGain,
      taxableGain: r.taxableGain,
      estimatedTax: r.estimatedTax,
    }))

    // Return array directly (frontend expects this format)
    return c.json(transformedRecords)
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

    // Transform to frontend expected format
    const transformed = {
      id: record.id,
      assetType: record.assetType.toLowerCase(),
      assetName: record.assetName,
      financialYear: record.fiscalYear,
      purchaseDate: record.purchaseDate.toISOString(),
      purchasePrice: record.purchasePrice,
      saleDate: record.saleDate.toISOString(),
      salePrice: record.salePrice,
      purchaseExpenses: record.expenses,
      saleExpenses: 0,
      improvementCost: 0,
      useIndexation: record.useIndexation,
      exemptionClaimed: record.exemptionAmount,
      exemptionSection: record.exemptionSection,
      holdingPeriodMonths: record.holdingPeriodMonths,
      gainType: record.gainType,
      grossGain: record.grossGain,
      taxableGain: record.taxableGain,
      estimatedTax: record.estimatedTax,
    }

    return c.json(transformed, 201)
  } catch (error) {
    console.error('Error creating capital gain:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return c.json({ message: 'Failed to create capital gain', details: errorMessage }, 500)
  }
})

// PUT /api/capital-gains/:id - Update capital gain record
app.put('/:id', zValidator('json', capitalGainUpdateSchema), async (c) => {
  const userId = c.get('userId')
  const id = c.req.param('id')
  const rawData = c.req.valid('json')

  // Normalize asset type if provided
  const data = {
    ...rawData,
    assetType: rawData.assetType ? (ASSET_TYPE_MAP[rawData.assetType] || rawData.assetType.toUpperCase()) : undefined,
  }

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

    // Only include valid Prisma fields (exclude frontend-specific fields like financialYear)
    const updateData: Record<string, unknown> = {
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
    }

    // Only set fields that were actually provided
    if (data.assetType) updateData.assetType = data.assetType
    if (data.assetName) updateData.assetName = data.assetName
    if (data.fiscalYear) updateData.fiscalYear = data.fiscalYear
    if (data.purchaseDate) updateData.purchaseDate = new Date(data.purchaseDate)
    if (data.saleDate) updateData.saleDate = new Date(data.saleDate)
    if (data.purchasePrice !== undefined) updateData.purchasePrice = data.purchasePrice
    if (data.salePrice !== undefined) updateData.salePrice = data.salePrice
    if (data.expenses !== undefined) updateData.expenses = data.expenses
    if (data.useIndexation !== undefined) updateData.useIndexation = data.useIndexation
    if (data.exemptionSection !== undefined) updateData.exemptionSection = data.exemptionSection
    if (data.exemptionAmount !== undefined) updateData.exemptionAmount = data.exemptionAmount
    if (data.assetDescription !== undefined) updateData.assetDescription = data.assetDescription
    if (data.quantity !== undefined) updateData.quantity = data.quantity
    if (data.brokerName !== undefined) updateData.brokerName = data.brokerName
    if (data.brokerOrderId !== undefined) updateData.brokerOrderId = data.brokerOrderId

    const record = await prisma.capitalGain.update({
      where: { id },
      data: updateData,
    })

    // Transform to frontend expected format
    const transformed = {
      id: record.id,
      assetType: record.assetType.toLowerCase(),
      assetName: record.assetName,
      financialYear: record.fiscalYear,
      purchaseDate: record.purchaseDate.toISOString(),
      purchasePrice: record.purchasePrice,
      saleDate: record.saleDate.toISOString(),
      salePrice: record.salePrice,
      purchaseExpenses: record.expenses,
      saleExpenses: 0,
      improvementCost: 0,
      useIndexation: record.useIndexation,
      exemptionClaimed: record.exemptionAmount,
      exemptionSection: record.exemptionSection,
      holdingPeriodMonths: record.holdingPeriodMonths,
      gainType: record.gainType,
      grossGain: record.grossGain,
      taxableGain: record.taxableGain,
      estimatedTax: record.estimatedTax,
    }

    return c.json(transformed)
  } catch (error) {
    console.error('Error updating capital gain:', error)
    return c.json({ message: 'Failed to update capital gain' }, 500)
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
