import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { prisma } from '../lib/prisma'
import { authMiddleware } from '../middleware/auth'

const app = new Hono()

// Apply auth middleware to all routes
app.use('*', authMiddleware)

// Validation schema for rental income
const rentalIncomeSchema = z.object({
  fiscalYear: z.string(),
  propertyId: z.string().optional(),
  propertyName: z.string().min(1, 'Property name is required'),
  propertyAddress: z.string().optional(),
  propertyType: z.enum(['RESIDENTIAL', 'COMMERCIAL', 'LAND']),
  ownershipType: z.enum(['SELF', 'JOINT', 'HUF']).default('SELF'),
  grossAnnualRent: z.number().min(0),
  monthlyRent: z.number().optional(),
  vacantMonths: z.number().int().min(0).max(12).default(0),
  municipalTaxes: z.number().min(0).default(0),
  housingLoanInterest: z.number().min(0).default(0),
  preConstructionInt: z.number().min(0).default(0),
  preCnstIntStartYear: z.string().optional(),
  tenantName: z.string().optional(),
  tenantPan: z.string().optional(),
  tenantStartDate: z.string().optional(),
  rentAgreementExpiry: z.string().optional(),
  coOwners: z.array(z.object({
    name: z.string(),
    pan: z.string().optional(),
    percentage: z.number(),
  })).optional(),
  ownershipPercent: z.number().min(0).max(100).default(100),
  loanAccountNumber: z.string().optional(),
  lenderName: z.string().optional(),
  loanSanctionDate: z.string().optional(),
  possessionDate: z.string().optional(),
  isSelfOccupied: z.boolean().default(false),
})

// Calculate Section 24 deductions
function calculateSection24(data: {
  grossAnnualRent: number
  municipalTaxes: number
  housingLoanInterest: number
  preConstructionInt: number
  isSelfOccupied: boolean
  ownershipPercent: number
}) {
  // Net Annual Value = Gross Annual Rent - Municipal Taxes
  const netAnnualValue = data.grossAnnualRent - data.municipalTaxes

  // Standard Deduction = 30% of NAV
  const standardDeduction = netAnnualValue * 0.3

  // Housing loan interest deduction
  // Self-occupied: Max Rs 2L, Let-out: No limit
  let interestDeduction = data.housingLoanInterest
  if (data.isSelfOccupied && interestDeduction > 200000) {
    interestDeduction = 200000
  }

  // Pre-construction interest (1/5th per year for 5 years)
  const preConstructionDeduction = data.preConstructionInt / 5

  // Total deductions
  const totalDeductions = standardDeduction + interestDeduction + preConstructionDeduction

  // Taxable income (can be negative - loss from house property)
  const taxableIncome = netAnnualValue - totalDeductions

  // Apply ownership percentage
  const ownerShare = data.ownershipPercent / 100

  return {
    netAnnualValue: netAnnualValue * ownerShare,
    standardDeduction: standardDeduction * ownerShare,
    taxableIncome: taxableIncome * ownerShare,
  }
}

// GET /api/rental-income - List all rental income records
app.get('/', async (c) => {
  const userId = c.get('userId')
  const financialYear = c.req.query('financialYear')

  try {
    const whereClause: { userId: string; fiscalYear?: string } = { userId }
    if (financialYear) {
      whereClause.fiscalYear = financialYear
    }

    const records = await prisma.rentalIncome.findMany({
      where: whereClause,
      orderBy: [{ createdAt: 'desc' }],
    })

    // Calculate summary
    const summary = {
      totalGrossRent: records.reduce((sum, r) => sum + r.grossAnnualRent, 0),
      totalDeductions: records.reduce(
        (sum, r) => sum + r.standardDeduction + r.housingLoanInterest + r.preConstructionInt,
        0
      ),
      totalTaxableIncome: records.reduce((sum, r) => sum + r.taxableIncome, 0),
      propertyCount: records.length,
    }

    return c.json({
      success: true,
      data: { records, summary },
    })
  } catch (error) {
    console.error('Error fetching rental income:', error)
    return c.json({ success: false, error: 'Failed to fetch rental income' }, 500)
  }
})

// GET /api/rental-income/:id - Get single rental income record
app.get('/:id', async (c) => {
  const userId = c.get('userId')
  const id = c.req.param('id')

  try {
    const record = await prisma.rentalIncome.findFirst({
      where: { id, userId },
    })

    if (!record) {
      return c.json({ success: false, error: 'Rental income not found' }, 404)
    }

    return c.json({ success: true, data: record })
  } catch (error) {
    console.error('Error fetching rental income:', error)
    return c.json({ success: false, error: 'Failed to fetch rental income' }, 500)
  }
})

// POST /api/rental-income - Create rental income record
app.post('/', zValidator('json', rentalIncomeSchema), async (c) => {
  const userId = c.get('userId')
  const data = c.req.valid('json')

  try {
    // Calculate Section 24 deductions
    const calculations = calculateSection24({
      grossAnnualRent: data.grossAnnualRent,
      municipalTaxes: data.municipalTaxes,
      housingLoanInterest: data.housingLoanInterest,
      preConstructionInt: data.preConstructionInt,
      isSelfOccupied: data.isSelfOccupied,
      ownershipPercent: data.ownershipPercent,
    })

    const record = await prisma.rentalIncome.create({
      data: {
        userId,
        fiscalYear: data.fiscalYear,
        propertyId: data.propertyId,
        propertyName: data.propertyName,
        propertyAddress: data.propertyAddress,
        propertyType: data.propertyType,
        ownershipType: data.ownershipType,
        grossAnnualRent: data.grossAnnualRent,
        monthlyRent: data.monthlyRent ?? data.grossAnnualRent / 12,
        vacantMonths: data.vacantMonths,
        municipalTaxes: data.municipalTaxes,
        netAnnualValue: calculations.netAnnualValue,
        standardDeduction: calculations.standardDeduction,
        housingLoanInterest: data.housingLoanInterest,
        preConstructionInt: data.preConstructionInt,
        preCnstIntStartYear: data.preCnstIntStartYear,
        taxableIncome: calculations.taxableIncome,
        tenantName: data.tenantName,
        tenantPan: data.tenantPan,
        tenantStartDate: data.tenantStartDate ? new Date(data.tenantStartDate) : null,
        rentAgreementExpiry: data.rentAgreementExpiry ? new Date(data.rentAgreementExpiry) : null,
        coOwners: data.coOwners,
        ownershipPercent: data.ownershipPercent,
        loanAccountNumber: data.loanAccountNumber,
        lenderName: data.lenderName,
        loanSanctionDate: data.loanSanctionDate ? new Date(data.loanSanctionDate) : null,
        possessionDate: data.possessionDate ? new Date(data.possessionDate) : null,
        isSelfOccupied: data.isSelfOccupied,
      },
    })

    return c.json({ success: true, data: record }, 201)
  } catch (error) {
    console.error('Error creating rental income:', error)
    return c.json({ success: false, error: 'Failed to create rental income' }, 500)
  }
})

// PUT /api/rental-income/:id - Update rental income record
app.put('/:id', zValidator('json', rentalIncomeSchema.partial()), async (c) => {
  const userId = c.get('userId')
  const id = c.req.param('id')
  const data = c.req.valid('json')

  try {
    const existing = await prisma.rentalIncome.findFirst({
      where: { id, userId },
    })

    if (!existing) {
      return c.json({ success: false, error: 'Rental income not found' }, 404)
    }

    // Recalculate if relevant fields changed
    const grossAnnualRent = data.grossAnnualRent ?? existing.grossAnnualRent
    const municipalTaxes = data.municipalTaxes ?? existing.municipalTaxes
    const housingLoanInterest = data.housingLoanInterest ?? existing.housingLoanInterest
    const preConstructionInt = data.preConstructionInt ?? existing.preConstructionInt
    const isSelfOccupied = data.isSelfOccupied ?? existing.isSelfOccupied
    const ownershipPercent = data.ownershipPercent ?? existing.ownershipPercent

    const calculations = calculateSection24({
      grossAnnualRent,
      municipalTaxes,
      housingLoanInterest,
      preConstructionInt,
      isSelfOccupied,
      ownershipPercent,
    })

    const record = await prisma.rentalIncome.update({
      where: { id },
      data: {
        ...data,
        netAnnualValue: calculations.netAnnualValue,
        standardDeduction: calculations.standardDeduction,
        taxableIncome: calculations.taxableIncome,
        tenantStartDate: data.tenantStartDate ? new Date(data.tenantStartDate) : undefined,
        rentAgreementExpiry: data.rentAgreementExpiry ? new Date(data.rentAgreementExpiry) : undefined,
        loanSanctionDate: data.loanSanctionDate ? new Date(data.loanSanctionDate) : undefined,
        possessionDate: data.possessionDate ? new Date(data.possessionDate) : undefined,
      },
    })

    return c.json({ success: true, data: record })
  } catch (error) {
    console.error('Error updating rental income:', error)
    return c.json({ success: false, error: 'Failed to update rental income' }, 500)
  }
})

// DELETE /api/rental-income/:id - Delete rental income record
app.delete('/:id', async (c) => {
  const userId = c.get('userId')
  const id = c.req.param('id')

  try {
    const existing = await prisma.rentalIncome.findFirst({
      where: { id, userId },
    })

    if (!existing) {
      return c.json({ success: false, error: 'Rental income not found' }, 404)
    }

    await prisma.rentalIncome.delete({
      where: { id },
    })

    return c.json({ success: true, message: 'Rental income deleted successfully' })
  } catch (error) {
    console.error('Error deleting rental income:', error)
    return c.json({ success: false, error: 'Failed to delete rental income' }, 500)
  }
})

export default app
