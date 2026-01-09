import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { prisma } from '../lib/prisma'
import { authMiddleware } from '../middleware/auth'

const app = new Hono()

// Apply auth middleware to all routes
app.use('*', authMiddleware)

// Deduction limits for utilization calculation
const DEDUCTION_LIMITS = {
  section80C: 150000,
  section80D: 25000,
  section80D_SeniorParents: 50000,
  section80CCD1B: 50000,
  section24: 200000,
  section80TTA: 10000,
}

// Validation schemas
const exportSchema = z.object({
  financialYear: z.string().regex(/^\d{4}-\d{2}$/, 'Format: YYYY-YY'),
  format: z.enum(['pdf', 'excel']),
  includeScenarios: z.boolean().optional().default(false),
  includeAdvanceTax: z.boolean().optional().default(true),
})

// GET /api/tax-planning/reports - Get report data for FY
app.get('/', async (c) => {
  const userId = c.get('userId')
  const financialYear = c.req.query('financialYear')

  if (!financialYear) {
    return c.json({ success: false, error: 'Financial year required' }, 400)
  }

  try {
    // Get baseline scenario for tax summary
    const baseline = await prisma.taxWhatIfScenario.findFirst({
      where: {
        userId,
        financialYear,
        isBaseline: true,
      },
    })

    // Get advance tax estimate
    const advanceTaxEstimate = await prisma.advanceTaxEstimate.findFirst({
      where: {
        userId,
        financialYear,
      },
      include: {
        schedules: {
          orderBy: { quarter: 'asc' },
        },
        payments: {
          orderBy: { paymentDate: 'asc' },
        },
      },
    })

    // Get all income sources for breakdown
    const [
      salaryData,
      businessIncomes,
      rentalIncomes,
      capitalGains,
      interestIncomes,
      dividendIncomes,
      otherIncomes,
    ] = await Promise.all([
      prisma.monthlySalary.aggregate({
        where: { userId, financialYear },
        _sum: { grossSalary: true, totalDeductions: true, netSalary: true },
      }),
      prisma.businessIncome.aggregate({
        where: { userId, fiscalYear: financialYear },
        _sum: { taxableProfit: true },
      }),
      prisma.rentalIncome.aggregate({
        where: { userId, fiscalYear: financialYear },
        _sum: { taxableIncome: true },
      }),
      prisma.capitalGain.aggregate({
        where: { userId, fiscalYear: financialYear },
        _sum: { taxableGain: true, estimatedTax: true },
      }),
      prisma.interestIncome.aggregate({
        where: { userId, fiscalYear: financialYear },
        _sum: { interestEarned: true, tdsDeducted: true },
      }),
      prisma.dividendIncome.aggregate({
        where: { userId, fiscalYear: financialYear },
        _sum: { dividendAmount: true, tdsDeducted: true },
      }),
      prisma.otherIncome.aggregate({
        where: { userId, fiscalYear: financialYear },
        _sum: { grossAmount: true, tdsDeducted: true },
      }),
    ])

    // Calculate income breakdown
    const incomeBreakdown = {
      salary: salaryData._sum.grossSalary || 0,
      business: businessIncomes._sum.taxableProfit || 0,
      rental: rentalIncomes._sum.taxableIncome || 0,
      capitalGains: capitalGains._sum.taxableGain || 0,
      interest: interestIncomes._sum.interestEarned || 0,
      dividend: dividendIncomes._sum.dividendAmount || 0,
      other: otherIncomes._sum.grossAmount || 0,
    }

    const totalIncome = Object.values(incomeBreakdown).reduce((sum, val) => sum + val, 0)

    // Calculate TDS breakdown
    const tdsBreakdown = {
      salary: salaryData._sum.totalDeductions || 0, // Approximate
      interest: interestIncomes._sum.tdsDeducted || 0,
      dividend: dividendIncomes._sum.tdsDeducted || 0,
      other: otherIncomes._sum.tdsDeducted || 0,
    }

    const totalTDS = Object.values(tdsBreakdown).reduce((sum, val) => sum + val, 0)

    // Get deduction utilization from baseline
    const deductionAdjustments = baseline?.deductionAdjustments as Record<string, number> || {}
    const deductionUtilization = {
      section80C: {
        used: deductionAdjustments.section80C || 0,
        limit: DEDUCTION_LIMITS.section80C,
        percentage: Math.min(100, ((deductionAdjustments.section80C || 0) / DEDUCTION_LIMITS.section80C) * 100),
      },
      section80D: {
        used: deductionAdjustments.section80D || 0,
        limit: DEDUCTION_LIMITS.section80D,
        percentage: Math.min(100, ((deductionAdjustments.section80D || 0) / DEDUCTION_LIMITS.section80D) * 100),
      },
      section80CCD1B: {
        used: deductionAdjustments.section80CCD1B || 0,
        limit: DEDUCTION_LIMITS.section80CCD1B,
        percentage: Math.min(100, ((deductionAdjustments.section80CCD1B || 0) / DEDUCTION_LIMITS.section80CCD1B) * 100),
      },
      section24: {
        used: deductionAdjustments.section24 || 0,
        limit: DEDUCTION_LIMITS.section24,
        percentage: Math.min(100, ((deductionAdjustments.section24 || 0) / DEDUCTION_LIMITS.section24) * 100),
      },
    }

    return c.json({
      financialYear,
      summary: {
        totalGrossIncome: totalIncome,
        totalDeductions: baseline?.totalDeductions || 0,
        taxableIncome: baseline?.taxableIncome || 0,
        totalTaxLiability: baseline?.totalTaxLiability || 0,
        totalTDSDeducted: totalTDS,
        netTaxPayable: (baseline?.totalTaxLiability || 0) - totalTDS,
        selectedRegime: baseline?.selectedRegime || 'NEW',
      },
      incomeBreakdown,
      tdsBreakdown,
      deductionUtilization,
      advanceTax: advanceTaxEstimate ? {
        netTaxLiability: advanceTaxEstimate.netTaxLiability,
        advanceTaxRequired: advanceTaxEstimate.advanceTaxRequired,
        schedules: advanceTaxEstimate.schedules,
        totalPaid: advanceTaxEstimate.payments.reduce((sum, p) => sum + p.amount, 0),
        interest234B: advanceTaxEstimate.interest234B,
        interest234C: advanceTaxEstimate.interest234C,
        totalInterest: advanceTaxEstimate.interest234B + advanceTaxEstimate.interest234C,
      } : null,
    })
  } catch (error) {
    console.error('Error fetching report data:', error)
    return c.json({ success: false, error: 'Failed to fetch report data' }, 500)
  }
})

// GET /api/tax-planning/reports/yoy - Get multi-year comparison (up to 5 years)
app.get('/yoy', async (c) => {
  const userId = c.get('userId')
  const years = c.req.query('years') // Comma-separated: "2024-25,2023-24,2022-23"

  try {
    let financialYears: string[] = []

    if (years) {
      financialYears = years.split(',').slice(0, 5)
    } else {
      // Default to last 5 years
      const currentYear = new Date().getFullYear()
      const currentMonth = new Date().getMonth() + 1
      const startYear = currentMonth >= 4 ? currentYear : currentYear - 1

      for (let i = 0; i < 5; i++) {
        const fy = startYear - i
        financialYears.push(`${fy}-${(fy + 1).toString().slice(-2)}`)
      }
    }

    // Get baseline scenarios for each year
    const scenarios = await prisma.taxWhatIfScenario.findMany({
      where: {
        userId,
        financialYear: { in: financialYears },
        isBaseline: true,
      },
      orderBy: { financialYear: 'desc' },
    })

    // Get advance tax data for each year
    const advanceTaxData = await prisma.advanceTaxEstimate.findMany({
      where: {
        userId,
        financialYear: { in: financialYears },
      },
      include: {
        payments: true,
      },
      orderBy: { financialYear: 'desc' },
    })

    // Create year-over-year comparison
    const yoyData = financialYears.map((fy) => {
      const scenario = scenarios.find((s) => s.financialYear === fy)
      const advanceTax = advanceTaxData.find((a) => a.financialYear === fy)

      return {
        financialYear: fy,
        totalGrossIncome: scenario?.totalGrossIncome || 0,
        totalDeductions: scenario?.totalDeductions || 0,
        taxableIncome: scenario?.taxableIncome || 0,
        totalTaxLiability: scenario?.totalTaxLiability || 0,
        selectedRegime: scenario?.selectedRegime || 'NEW',
        advanceTaxPaid: advanceTax?.payments.reduce((sum, p) => sum + p.amount, 0) || 0,
        effectiveTaxRate: scenario && scenario.totalGrossIncome > 0
          ? (scenario.totalTaxLiability / scenario.totalGrossIncome) * 100
          : 0,
      }
    })

    // Calculate trends
    const trends = {
      incomeGrowth: yoyData.length >= 2 && yoyData[1].totalGrossIncome > 0
        ? ((yoyData[0].totalGrossIncome - yoyData[1].totalGrossIncome) / yoyData[1].totalGrossIncome) * 100
        : null,
      taxGrowth: yoyData.length >= 2 && yoyData[1].totalTaxLiability > 0
        ? ((yoyData[0].totalTaxLiability - yoyData[1].totalTaxLiability) / yoyData[1].totalTaxLiability) * 100
        : null,
      deductionGrowth: yoyData.length >= 2 && yoyData[1].totalDeductions > 0
        ? ((yoyData[0].totalDeductions - yoyData[1].totalDeductions) / yoyData[1].totalDeductions) * 100
        : null,
    }

    return c.json({
      years: yoyData,
      trends,
      summary: {
        averageIncome: yoyData.reduce((sum, y) => sum + y.totalGrossIncome, 0) / yoyData.length,
        averageTax: yoyData.reduce((sum, y) => sum + y.totalTaxLiability, 0) / yoyData.length,
        averageEffectiveRate: yoyData.reduce((sum, y) => sum + y.effectiveTaxRate, 0) / yoyData.length,
      },
    })
  } catch (error) {
    console.error('Error fetching YoY data:', error)
    return c.json({ success: false, error: 'Failed to fetch YoY data' }, 500)
  }
})

// POST /api/tax-planning/reports/export - Generate PDF or Excel
app.post('/export', zValidator('json', exportSchema), async (c) => {
  const userId = c.get('userId')
  const { financialYear, format, includeScenarios, includeAdvanceTax } = c.req.valid('json')

  try {
    // Get report data
    const baseline = await prisma.taxWhatIfScenario.findFirst({
      where: { userId, financialYear, isBaseline: true },
    })

    const scenarios = includeScenarios
      ? await prisma.taxWhatIfScenario.findMany({
          where: { userId, financialYear },
          orderBy: [{ isBaseline: 'desc' }, { createdAt: 'desc' }],
        })
      : []

    const advanceTax = includeAdvanceTax
      ? await prisma.advanceTaxEstimate.findFirst({
          where: { userId, financialYear },
          include: {
            schedules: { orderBy: { quarter: 'asc' } },
            payments: { orderBy: { paymentDate: 'desc' } },
          },
        })
      : null

    // Build export data structure
    const exportData = {
      generatedAt: new Date().toISOString(),
      financialYear,
      user: {
        id: userId,
      },
      taxSummary: baseline
        ? {
            selectedRegime: baseline.selectedRegime,
            totalGrossIncome: baseline.totalGrossIncome,
            totalDeductions: baseline.totalDeductions,
            taxableIncome: baseline.taxableIncome,
            totalTaxLiability: baseline.totalTaxLiability,
          }
        : null,
      scenarios: scenarios.map((s) => ({
        name: s.name,
        isBaseline: s.isBaseline,
        selectedRegime: s.selectedRegime,
        totalGrossIncome: s.totalGrossIncome,
        totalDeductions: s.totalDeductions,
        taxableIncome: s.taxableIncome,
        totalTaxLiability: s.totalTaxLiability,
        taxDifferenceFromBaseline: s.taxDifferenceFromBaseline,
        percentageSavings: s.percentageSavings,
      })),
      advanceTax: advanceTax
        ? {
            netTaxLiability: advanceTax.netTaxLiability,
            interest234B: advanceTax.interest234B,
            interest234C: advanceTax.interest234C,
            schedules: advanceTax.schedules.map((s) => ({
              quarter: s.quarter,
              dueDate: s.dueDate.toISOString().split('T')[0],
              cumulativePercentage: s.cumulativePercentage,
              amountDue: s.quarterAmountDue,
              amountPaid: s.amountPaid,
              shortfall: s.shortfall,
              status: s.status,
            })),
            payments: advanceTax.payments.map((p) => ({
              paymentDate: p.paymentDate.toISOString().split('T')[0],
              amount: p.amount,
              quarter: p.quarter,
              challanSerialNumber: p.challanSerialNumber,
              bsrCode: p.bsrCode,
            })),
          }
        : null,
    }

    if (format === 'pdf') {
      // Return JSON with instructions for client-side PDF generation
      // The frontend will use jsPDF to generate the actual PDF
      return c.json({
        success: true,
        format: 'pdf',
        data: exportData,
        message: 'Use client-side jsPDF to generate PDF from this data',
      })
    } else {
      // Return JSON for Excel generation
      // The frontend will use xlsx to generate the actual Excel file
      return c.json({
        success: true,
        format: 'excel',
        data: exportData,
        sheets: {
          summary: baseline
            ? [
                ['Tax Summary Report', `FY ${financialYear}`],
                [],
                ['Selected Regime', baseline.selectedRegime],
                ['Total Gross Income', baseline.totalGrossIncome],
                ['Total Deductions', baseline.totalDeductions],
                ['Taxable Income', baseline.taxableIncome],
                ['Total Tax Liability', baseline.totalTaxLiability],
              ]
            : [],
          scenarios: [
            ['Name', 'Regime', 'Gross Income', 'Deductions', 'Taxable', 'Tax', 'Savings'],
            ...scenarios.map((s) => [
              s.name,
              s.selectedRegime,
              s.totalGrossIncome,
              s.totalDeductions,
              s.taxableIncome,
              s.totalTaxLiability,
              s.taxDifferenceFromBaseline,
            ]),
          ],
          advanceTax: advanceTax
            ? [
                ['Quarter', 'Due Date', '%', 'Amount Due', 'Paid', 'Shortfall', 'Status'],
                ...advanceTax.schedules.map((s) => [
                  `Q${s.quarter}`,
                  s.dueDate.toISOString().split('T')[0],
                  s.cumulativePercentage,
                  s.quarterAmountDue,
                  s.amountPaid,
                  s.shortfall,
                  s.status,
                ]),
              ]
            : [],
        },
        message: 'Use client-side xlsx to generate Excel from this data',
      })
    }
  } catch (error) {
    console.error('Error generating export:', error)
    return c.json({ success: false, error: 'Failed to generate export' }, 500)
  }
})

export default app
