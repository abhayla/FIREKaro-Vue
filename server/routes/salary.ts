import { Hono } from 'hono'
import { prisma } from '../lib/prisma'
import { authMiddleware } from '../middleware/auth'

const app = new Hono()

// Apply auth middleware to all routes
app.use('*', authMiddleware)

// GET /api/salary/current - Get current salary (latest record)
app.get('/current', async (c) => {
  const userId = c.get('userId')

  try {
    // Get the most recent salary record
    const latestSalary = await prisma.monthlySalary.findFirst({
      where: { userId },
      orderBy: [{ year: 'desc' }, { month: 'desc' }],
      include: { incomeSource: true },
    })

    if (!latestSalary) {
      return c.json({
        success: true,
        data: null,
        message: 'No salary records found',
      })
    }

    // Transform to frontend format
    const currentSalary = {
      id: latestSalary.id,
      employerName: latestSalary.incomeSource?.sourceName || latestSalary.employerName || 'Unknown',
      designation: latestSalary.designation,
      basicSalary: latestSalary.basicSalary,
      hra: latestSalary.houseRentAllowance,
      conveyanceAllowance: latestSalary.conveyanceAllowance,
      medicalAllowance: latestSalary.medicalAllowance,
      specialAllowance: (latestSalary.otherEarnings as Record<string, number>)?.specialAllowance || 0,
      otherAllowances: latestSalary.miscellaneous + latestSalary.incentives,
      grossSalary: latestSalary.grossSalary,
      epfDeduction: latestSalary.employeePF,
      vpfDeduction: latestSalary.voluntaryPF,
      professionalTax: latestSalary.professionalTax,
      tdsDeduction: latestSalary.incomeTax,
      otherDeductions: latestSalary.otherTaxes,
      totalDeductions: latestSalary.totalDeductions,
      netSalary: latestSalary.netSalary,
      effectiveFrom: latestSalary.createdAt.toISOString(),
    }

    return c.json({ success: true, data: currentSalary })
  } catch (error) {
    console.error('Error fetching current salary:', error)
    return c.json({ success: false, error: 'Failed to fetch current salary' }, 500)
  }
})

// GET /api/salary/summary - Get salary summary for a financial year
app.get('/summary', async (c) => {
  const userId = c.get('userId')
  const financialYear = c.req.query('financialYear')

  try {
    const whereClause: { userId: string; financialYear?: string } = { userId }
    if (financialYear) {
      whereClause.financialYear = financialYear
    }

    const salaries = await prisma.monthlySalary.findMany({
      where: whereClause,
    })

    if (salaries.length === 0) {
      return c.json({
        success: true,
        data: null,
        message: 'No salary records found',
      })
    }

    const summary = {
      financialYear: financialYear || 'All',
      totalGrossEarnings: salaries.reduce((sum, s) => sum + s.grossSalary, 0),
      totalDeductions: salaries.reduce((sum, s) => sum + s.totalDeductions, 0),
      totalNetSalary: salaries.reduce((sum, s) => sum + s.netSalary, 0),
      totalTdsDeducted: salaries.reduce((sum, s) => sum + s.incomeTax, 0),
      totalEpfContribution: salaries.reduce((sum, s) => sum + s.employeePF, 0),
      totalVpfContribution: salaries.reduce((sum, s) => sum + s.voluntaryPF, 0),
      monthsRecorded: salaries.length,
      averageMonthlyGross: salaries.reduce((sum, s) => sum + s.grossSalary, 0) / salaries.length,
      averageMonthlyNet: salaries.reduce((sum, s) => sum + s.netSalary, 0) / salaries.length,
    }

    return c.json({ success: true, data: summary })
  } catch (error) {
    console.error('Error fetching salary summary:', error)
    return c.json({ success: false, error: 'Failed to fetch salary summary' }, 500)
  }
})

export default app
