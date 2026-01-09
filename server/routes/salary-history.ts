import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { prisma } from '../lib/prisma'
import { authMiddleware } from '../middleware/auth'
import { syncSalaryToRetirementAccounts, resetSyncStatus } from '../services/sync.service'

const app = new Hono()

// Apply auth middleware to all routes
app.use('*', authMiddleware)

// Validation schema for salary history input
const salaryInputSchema = z.object({
  financialYear: z.string(),
  month: z.number().min(1).max(12),
  year: z.number().min(2000).max(2100),
  incomeSourceId: z.string().optional().nullable(),
  employerName: z.string().optional().nullable(),
  paidDays: z.number().optional().default(30),
  // Earnings
  basicSalary: z.number().default(0),
  houseRentAllowance: z.number().optional().default(0),
  conveyanceAllowance: z.number().optional().default(0),
  medicalAllowance: z.number().optional().default(0),
  dearnessAllowance: z.number().optional().default(0),
  leaveTravelAllowance: z.number().optional().default(0),
  childrenEducation: z.number().optional().default(0),
  carAllowance: z.number().optional().default(0),
  incentives: z.number().optional().default(0),
  miscellaneous: z.number().optional().default(0),
  otherEarnings: z.record(z.number()).optional(),
  // Deductions
  employeePF: z.number().optional().default(0),
  voluntaryPF: z.number().optional().default(0),
  professionalTax: z.number().optional().default(0),
  incomeTax: z.number().optional().default(0),
  otherTaxes: z.number().optional().default(0),
  superannuation: z.number().optional().default(0),
  npsContribution: z.number().optional().default(0),
  otherDeductions: z.record(z.number()).optional(),
  // Employer contributions
  employerPF: z.number().optional().default(0),
  pensionFund: z.number().optional().default(0),
  otherEmployerDeductions: z.number().optional().default(0),
})

// Helper to calculate totals
function calculateTotals(data: z.infer<typeof salaryInputSchema>) {
  const grossSalary =
    (data.basicSalary || 0) +
    (data.houseRentAllowance || 0) +
    (data.conveyanceAllowance || 0) +
    (data.medicalAllowance || 0) +
    (data.dearnessAllowance || 0) +
    (data.leaveTravelAllowance || 0) +
    (data.childrenEducation || 0) +
    (data.carAllowance || 0) +
    (data.incentives || 0) +
    (data.miscellaneous || 0) +
    Object.values(data.otherEarnings || {}).reduce((sum, val) => sum + val, 0)

  const totalDeductions =
    (data.employeePF || 0) +
    (data.voluntaryPF || 0) +
    (data.professionalTax || 0) +
    (data.incomeTax || 0) +
    (data.otherTaxes || 0) +
    (data.superannuation || 0) +
    (data.npsContribution || 0) +
    Object.values(data.otherDeductions || {}).reduce((sum, val) => sum + val, 0)

  const netSalary = grossSalary - totalDeductions

  return { grossSalary, totalDeductions, netSalary }
}

// GET /api/salary-history - List salary history
app.get('/', async (c) => {
  const userId = c.get('userId')
  const financialYear = c.req.query('financialYear')
  const incomeSourceId = c.req.query('incomeSourceId')

  try {
    const whereClause: {
      userId: string
      financialYear?: string
      incomeSourceId?: string
    } = { userId }

    if (financialYear) {
      whereClause.financialYear = financialYear
    }
    if (incomeSourceId) {
      whereClause.incomeSourceId = incomeSourceId
    }

    const entries = await prisma.monthlySalary.findMany({
      where: whereClause,
      include: {
        incomeSource: {
          select: {
            id: true,
            sourceName: true,
            sourceType: true,
          },
        },
      },
      orderBy: [{ year: 'desc' }, { month: 'desc' }],
    })

    return c.json({
      success: true,
      data: { salaryEntries: entries },
    })
  } catch (error) {
    console.error('Error fetching salary history:', error)
    return c.json({ success: false, error: 'Failed to fetch salary history' }, 500)
  }
})

// GET /api/salary-history/:id - Get single salary record
app.get('/:id', async (c) => {
  const userId = c.get('userId')
  const id = c.req.param('id')

  try {
    const entry = await prisma.monthlySalary.findFirst({
      where: { id, userId },
      include: { incomeSource: true },
    })

    if (!entry) {
      return c.json({ success: false, error: 'Record not found' }, 404)
    }

    return c.json({ success: true, data: entry })
  } catch (error) {
    console.error('Error fetching salary record:', error)
    return c.json({ success: false, error: 'Failed to fetch salary record' }, 500)
  }
})

// POST /api/salary-history - Create salary record
app.post('/', zValidator('json', salaryInputSchema), async (c) => {
  const userId = c.get('userId')
  const data = c.req.valid('json')

  try {
    const totals = calculateTotals(data)

    const entry = await prisma.monthlySalary.create({
      data: {
        userId,
        financialYear: data.financialYear,
        month: data.month,
        year: data.year,
        incomeSourceId: data.incomeSourceId || null,
        employerName: data.employerName,
        paidDays: data.paidDays || 30,
        // Earnings
        basicSalary: data.basicSalary || 0,
        houseRentAllowance: data.houseRentAllowance || 0,
        conveyanceAllowance: data.conveyanceAllowance || 0,
        medicalAllowance: data.medicalAllowance || 0,
        dearnessAllowance: data.dearnessAllowance || 0,
        leaveTravelAllowance: data.leaveTravelAllowance || 0,
        childrenEducation: data.childrenEducation || 0,
        carAllowance: data.carAllowance || 0,
        incentives: data.incentives || 0,
        miscellaneous: data.miscellaneous || 0,
        otherEarnings: data.otherEarnings || {},
        // Deductions
        employeePF: data.employeePF || 0,
        voluntaryPF: data.voluntaryPF || 0,
        professionalTax: data.professionalTax || 0,
        incomeTax: data.incomeTax || 0,
        otherTaxes: data.otherTaxes || 0,
        superannuation: data.superannuation || 0,
        npsContribution: data.npsContribution || 0,
        otherDeductions: data.otherDeductions || {},
        // Employer contributions
        employerPF: data.employerPF || 0,
        pensionFund: data.pensionFund || 0,
        otherEmployerDeductions: data.otherEmployerDeductions || 0,
        // Totals
        ...totals,
        // Sync status
        syncStatus: 'PENDING',
      },
      include: { incomeSource: true },
    })

    return c.json({ success: true, data: entry }, 201)
  } catch (error) {
    console.error('Error creating salary record:', error)
    if ((error as { code?: string }).code === 'P2002') {
      return c.json(
        { success: false, error: 'A salary record already exists for this month/employer combination' },
        409
      )
    }
    return c.json({ success: false, error: 'Failed to create salary record' }, 500)
  }
})

// PUT /api/salary-history/:id - Update salary record
app.put('/:id', zValidator('json', salaryInputSchema.partial()), async (c) => {
  const userId = c.get('userId')
  const id = c.req.param('id')
  const data = c.req.valid('json')

  try {
    // Check if record exists and belongs to user
    const existing = await prisma.monthlySalary.findFirst({
      where: { id, userId },
    })

    if (!existing) {
      return c.json({ success: false, error: 'Record not found' }, 404)
    }

    // Merge with existing data for totals calculation
    const mergedData = { ...existing, ...data }
    const totals = calculateTotals(mergedData as z.infer<typeof salaryInputSchema>)

    const entry = await prisma.monthlySalary.update({
      where: { id },
      data: {
        ...data,
        ...totals,
        // Reset sync status on update
        syncStatus: 'PENDING',
        syncedToEpf: false,
        syncedToNps: false,
        syncError: null,
      },
      include: { incomeSource: true },
    })

    return c.json({ success: true, data: entry })
  } catch (error) {
    console.error('Error updating salary record:', error)
    return c.json({ success: false, error: 'Failed to update salary record' }, 500)
  }
})

// DELETE /api/salary-history/:id - Delete salary record
app.delete('/:id', async (c) => {
  const userId = c.get('userId')
  const id = c.req.param('id')

  try {
    // Check if record exists and belongs to user
    const existing = await prisma.monthlySalary.findFirst({
      where: { id, userId },
    })

    if (!existing) {
      return c.json({ success: false, error: 'Record not found' }, 404)
    }

    await prisma.monthlySalary.delete({
      where: { id },
    })

    return c.json({ success: true, message: 'Record deleted successfully' })
  } catch (error) {
    console.error('Error deleting salary record:', error)
    return c.json({ success: false, error: 'Failed to delete salary record' }, 500)
  }
})

// POST /api/salary-history/:id/sync - Sync salary to EPF/NPS accounts
app.post('/:id/sync', async (c) => {
  const userId = c.get('userId')
  const id = c.req.param('id')

  try {
    const result = await syncSalaryToRetirementAccounts(id, userId)
    return c.json({ success: true, data: result })
  } catch (error) {
    console.error('Error syncing salary:', error)
    return c.json({ success: false, error: 'Failed to sync salary to retirement accounts' }, 500)
  }
})

// DELETE /api/salary-history/:id/sync - Reset sync status
app.delete('/:id/sync', async (c) => {
  const userId = c.get('userId')
  const id = c.req.param('id')

  try {
    await resetSyncStatus(id, userId)
    return c.json({ success: true, message: 'Sync status reset successfully' })
  } catch (error) {
    console.error('Error resetting sync status:', error)
    return c.json({ success: false, error: 'Failed to reset sync status' }, 500)
  }
})

export default app
