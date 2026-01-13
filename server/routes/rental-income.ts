import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { prisma } from '../lib/prisma'
import { authMiddleware } from '../middleware/auth'

const app = new Hono()

// Apply auth middleware to all routes
app.use('*', authMiddleware)

// Validation schema matching frontend RentalIncomeInput
const rentalIncomeSchema = z.object({
  financialYear: z.string().default('2025-26'),
  propertyName: z.string().min(1, 'Property name is required'),
  propertyType: z.enum(['residential', 'commercial', 'land']),
  propertyAddress: z.string().optional(),
  monthlyRent: z.number().min(0, 'Monthly rent is required'),
  vacancyMonths: z.number().int().min(0).max(12).default(0),
  municipalTaxesPaid: z.number().min(0).optional(),
  housingLoanInterest: z.number().min(0).optional(),
  isLetOut: z.boolean().default(true),
  tenantName: z.string().optional(),
  tenantStartDate: z.string().optional(),
})

// Calculate Section 24 deductions (matching frontend calculation)
function calculateSection24(data: {
  monthlyRent: number
  vacancyMonths: number
  municipalTaxesPaid: number
  housingLoanInterest: number
  isLetOut: boolean
}) {
  // Gross Annual Value = monthlyRent * (12 - vacancyMonths)
  const grossAnnualValue = data.monthlyRent * (12 - data.vacancyMonths)

  // Net Annual Value = GAV - Municipal Taxes
  const netAnnualValueBeforeDeductions = grossAnnualValue - data.municipalTaxesPaid

  // Standard Deduction = 30% of NAV
  const standardDeduction = netAnnualValueBeforeDeductions * 0.3

  // Housing loan interest deduction
  // Self-occupied: Max Rs 2L, Let-out: No limit
  let allowableInterest = data.housingLoanInterest
  if (!data.isLetOut && allowableInterest > 200000) {
    allowableInterest = 200000
  }

  // Total deductions
  const totalDeduction = standardDeduction + allowableInterest

  // Taxable income (can be negative - loss from house property)
  const taxableIncome = netAnnualValueBeforeDeductions - totalDeduction

  return {
    grossAnnualValue,
    netAnnualValue: taxableIncome,
    standardDeduction,
    allowableInterest,
    totalDeduction,
  }
}

// GET /api/rental-income - List all rental income records
app.get('/', async (c) => {
  const userId = c.get('userId')
  const fy = c.req.query('fy') || c.req.query('financialYear')

  try {
    const whereClause: { userId: string; financialYear?: string } = { userId }
    if (fy) {
      whereClause.financialYear = fy
    }

    const records = await prisma.rentalIncome.findMany({
      where: whereClause,
      orderBy: [{ createdAt: 'desc' }],
    })

    // Transform records to match frontend expectations
    const transformedRecords = records.map(r => ({
      id: r.id,
      financialYear: r.financialYear,
      propertyName: r.propertyName,
      propertyType: r.propertyType,
      propertyAddress: r.propertyAddress,
      monthlyRent: r.monthlyRent,
      vacancyMonths: r.vacancyMonths,
      municipalTaxesPaid: r.municipalTaxesPaid,
      housingLoanInterest: r.housingLoanInterest,
      isLetOut: r.isLetOut,
      tenantName: r.tenantName,
      tenantStartDate: r.tenantStartDate,
      // Calculated fields
      annualRent: r.monthlyRent * (12 - r.vacancyMonths),
      grossAnnualValue: r.grossAnnualValue,
      netAnnualValue: r.netAnnualValue,
      standardDeduction: r.standardDeduction,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
    }))

    return c.json(transformedRecords)
  } catch (error) {
    console.error('Error fetching rental income:', error)
    return c.json({ error: 'Failed to fetch rental income' }, 500)
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
      return c.json({ error: 'Rental income not found' }, 404)
    }

    return c.json({
      id: record.id,
      financialYear: record.financialYear,
      propertyName: record.propertyName,
      propertyType: record.propertyType,
      propertyAddress: record.propertyAddress,
      monthlyRent: record.monthlyRent,
      vacancyMonths: record.vacancyMonths,
      municipalTaxesPaid: record.municipalTaxesPaid,
      housingLoanInterest: record.housingLoanInterest,
      isLetOut: record.isLetOut,
      tenantName: record.tenantName,
      tenantStartDate: record.tenantStartDate,
      annualRent: record.monthlyRent * (12 - record.vacancyMonths),
      grossAnnualValue: record.grossAnnualValue,
      netAnnualValue: record.netAnnualValue,
      standardDeduction: record.standardDeduction,
    })
  } catch (error) {
    console.error('Error fetching rental income:', error)
    return c.json({ error: 'Failed to fetch rental income' }, 500)
  }
})

// POST /api/rental-income - Create rental income record
app.post('/', zValidator('json', rentalIncomeSchema), async (c) => {
  const userId = c.get('userId')
  const data = c.req.valid('json')

  try {
    // Calculate Section 24 deductions
    const calculations = calculateSection24({
      monthlyRent: data.monthlyRent,
      vacancyMonths: data.vacancyMonths,
      municipalTaxesPaid: data.municipalTaxesPaid || 0,
      housingLoanInterest: data.housingLoanInterest || 0,
      isLetOut: data.isLetOut,
    })

    const record = await prisma.rentalIncome.create({
      data: {
        userId,
        financialYear: data.financialYear,
        propertyName: data.propertyName,
        propertyType: data.propertyType,
        propertyAddress: data.propertyAddress,
        monthlyRent: data.monthlyRent,
        vacancyMonths: data.vacancyMonths,
        municipalTaxesPaid: data.municipalTaxesPaid || 0,
        housingLoanInterest: data.housingLoanInterest || 0,
        isLetOut: data.isLetOut,
        tenantName: data.tenantName,
        tenantStartDate: data.tenantStartDate,
        grossAnnualValue: calculations.grossAnnualValue,
        netAnnualValue: calculations.netAnnualValue,
        standardDeduction: calculations.standardDeduction,
      },
    })

    return c.json({
      id: record.id,
      financialYear: record.financialYear,
      propertyName: record.propertyName,
      propertyType: record.propertyType,
      propertyAddress: record.propertyAddress,
      monthlyRent: record.monthlyRent,
      vacancyMonths: record.vacancyMonths,
      municipalTaxesPaid: record.municipalTaxesPaid,
      housingLoanInterest: record.housingLoanInterest,
      isLetOut: record.isLetOut,
      annualRent: record.monthlyRent * (12 - record.vacancyMonths),
      grossAnnualValue: record.grossAnnualValue,
      netAnnualValue: record.netAnnualValue,
      standardDeduction: record.standardDeduction,
    }, 201)
  } catch (error) {
    console.error('Error creating rental income:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return c.json({ error: 'Failed to create rental income', details: errorMessage }, 500)
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
      return c.json({ error: 'Rental income not found' }, 404)
    }

    // Merge existing data with updates for calculation
    const monthlyRent = data.monthlyRent ?? existing.monthlyRent
    const vacancyMonths = data.vacancyMonths ?? existing.vacancyMonths
    const municipalTaxesPaid = data.municipalTaxesPaid ?? existing.municipalTaxesPaid
    const housingLoanInterest = data.housingLoanInterest ?? existing.housingLoanInterest
    const isLetOut = data.isLetOut ?? existing.isLetOut

    // Recalculate
    const calculations = calculateSection24({
      monthlyRent,
      vacancyMonths,
      municipalTaxesPaid,
      housingLoanInterest,
      isLetOut,
    })

    const record = await prisma.rentalIncome.update({
      where: { id },
      data: {
        ...data,
        grossAnnualValue: calculations.grossAnnualValue,
        netAnnualValue: calculations.netAnnualValue,
        standardDeduction: calculations.standardDeduction,
      },
    })

    return c.json({
      id: record.id,
      financialYear: record.financialYear,
      propertyName: record.propertyName,
      propertyType: record.propertyType,
      propertyAddress: record.propertyAddress,
      monthlyRent: record.monthlyRent,
      vacancyMonths: record.vacancyMonths,
      municipalTaxesPaid: record.municipalTaxesPaid,
      housingLoanInterest: record.housingLoanInterest,
      isLetOut: record.isLetOut,
      annualRent: record.monthlyRent * (12 - record.vacancyMonths),
      grossAnnualValue: record.grossAnnualValue,
      netAnnualValue: record.netAnnualValue,
      standardDeduction: record.standardDeduction,
    })
  } catch (error) {
    console.error('Error updating rental income:', error)
    return c.json({ error: 'Failed to update rental income' }, 500)
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
      return c.json({ error: 'Rental income not found' }, 404)
    }

    await prisma.rentalIncome.delete({
      where: { id },
    })

    return c.json({ success: true, message: 'Rental income deleted successfully' })
  } catch (error) {
    console.error('Error deleting rental income:', error)
    return c.json({ error: 'Failed to delete rental income' }, 500)
  }
})

export default app
