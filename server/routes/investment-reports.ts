import { Hono } from 'hono'
import { prisma } from '../lib/prisma'
import { authMiddleware } from '../middleware/auth'

const app = new Hono()

// Apply auth middleware to all routes
app.use('*', authMiddleware)

// Helper to get financial year
function getFinancialYear(date: Date = new Date()): string {
  const month = date.getMonth()
  const year = date.getFullYear()
  const startYear = month >= 3 ? year : year - 1
  return `${startYear}-${String(startYear + 1).slice(-2)}`
}

// GET /api/investment-reports/portfolio-summary - Portfolio Summary Report
app.get('/portfolio-summary', async (c) => {
  const userId = c.get('userId')

  try {
    // Fetch all investments
    const investments = await prisma.investment.findMany({
      where: { userId, isActive: true },
      include: {
        transactions: {
          orderBy: { transactionDate: 'desc' },
        },
      },
    })

    // Fetch retirement accounts
    const [epfAccount, ppfAccounts, npsAccounts, esopGrants] = await Promise.all([
      prisma.ePFAccount.findFirst({ where: { userId } }),
      prisma.pPFAccount.findMany({ where: { userId, isActive: true } }),
      prisma.nPSAccount.findMany({ where: { userId } }),
      prisma.eSOPGrant.findMany({ where: { userId, status: { not: 'CANCELLED' } } }),
    ])

    // Calculate totals
    const investmentTotal = investments.reduce((sum, inv) => sum + inv.currentValue, 0)
    const investmentInvested = investments.reduce((sum, inv) => sum + inv.totalInvested, 0)

    const epfTotal = epfAccount?.currentBalance || 0
    const ppfTotal = ppfAccounts.reduce((sum, acc) => sum + acc.currentBalance, 0)
    const npsTotal = npsAccounts.reduce((sum, acc) => sum + acc.currentCorpus, 0)
    const esopTotal = esopGrants.reduce(
      (sum, g) => sum + g.vestedUnits * (g.currentFMV || g.fairMarketValue),
      0
    )

    const totalPortfolioValue = investmentTotal + epfTotal + ppfTotal + npsTotal + esopTotal

    // Category breakdown
    const categoryBreakdown: Record<string, { value: number; invested: number; count: number }> = {}
    investments.forEach((inv) => {
      const cat = inv.category || 'OTHER'
      if (!categoryBreakdown[cat]) {
        categoryBreakdown[cat] = { value: 0, invested: 0, count: 0 }
      }
      categoryBreakdown[cat].value += inv.currentValue
      categoryBreakdown[cat].invested += inv.totalInvested
      categoryBreakdown[cat].count += 1
    })

    // Type breakdown
    const typeBreakdown: Record<string, { value: number; invested: number; count: number }> = {}
    investments.forEach((inv) => {
      const type = inv.type || 'OTHER'
      if (!typeBreakdown[type]) {
        typeBreakdown[type] = { value: 0, invested: 0, count: 0 }
      }
      typeBreakdown[type].value += inv.currentValue
      typeBreakdown[type].invested += inv.totalInvested
      typeBreakdown[type].count += 1
    })

    // Top holdings
    const topHoldings = investments
      .sort((a, b) => b.currentValue - a.currentValue)
      .slice(0, 10)
      .map((inv) => ({
        name: inv.name,
        type: inv.type,
        value: inv.currentValue,
        invested: inv.totalInvested,
        returns: inv.absoluteReturn,
        returnsPercent: inv.absoluteReturnPercent,
        allocation: (inv.currentValue / totalPortfolioValue) * 100,
      }))

    return c.json({
      success: true,
      data: {
        generatedAt: new Date().toISOString(),
        financialYear: getFinancialYear(),
        summary: {
          totalPortfolioValue,
          totalInvested: investmentInvested,
          absoluteReturn: investmentTotal - investmentInvested,
          absoluteReturnPercent:
            investmentInvested > 0
              ? ((investmentTotal - investmentInvested) / investmentInvested) * 100
              : 0,
        },
        breakdown: {
          investments: { value: investmentTotal, percentage: (investmentTotal / totalPortfolioValue) * 100 },
          epf: { value: epfTotal, percentage: (epfTotal / totalPortfolioValue) * 100 },
          ppf: { value: ppfTotal, percentage: (ppfTotal / totalPortfolioValue) * 100 },
          nps: { value: npsTotal, percentage: (npsTotal / totalPortfolioValue) * 100 },
          esop: { value: esopTotal, percentage: (esopTotal / totalPortfolioValue) * 100 },
        },
        categoryBreakdown: Object.entries(categoryBreakdown).map(([category, data]) => ({
          category,
          ...data,
          returns: data.value - data.invested,
          returnsPercent: data.invested > 0 ? ((data.value - data.invested) / data.invested) * 100 : 0,
          allocation: (data.value / totalPortfolioValue) * 100,
        })),
        typeBreakdown: Object.entries(typeBreakdown).map(([type, data]) => ({
          type,
          ...data,
          returns: data.value - data.invested,
          returnsPercent: data.invested > 0 ? ((data.value - data.invested) / data.invested) * 100 : 0,
          allocation: (data.value / totalPortfolioValue) * 100,
        })),
        topHoldings,
        retirementAccounts: {
          epf: epfAccount
            ? {
                balance: epfAccount.currentBalance,
                employeeShare: epfAccount.employeeShare,
                employerShare: epfAccount.employerShare,
              }
            : null,
          ppf: ppfAccounts.map((acc) => ({
            id: acc.id,
            balance: acc.currentBalance,
            maturityDate: acc.maturityDate,
          })),
          nps: npsAccounts.map((acc) => ({
            id: acc.id,
            tierType: acc.tierType,
            corpus: acc.currentCorpus,
            allocation: {
              equity: acc.equityAllocation,
              corporateDebt: acc.corporateDebtAllocation,
              governmentBonds: acc.governmentBondAllocation,
            },
          })),
        },
        esopSummary: {
          totalGrants: esopGrants.length,
          vestedValue: esopTotal,
          unvestedValue: esopGrants.reduce(
            (sum, g) => sum + g.unvestedUnits * (g.currentFMV || g.fairMarketValue),
            0
          ),
          exercisableValue: esopGrants.reduce(
            (sum, g) => sum + g.exercisableUnits * (g.currentFMV || g.fairMarketValue),
            0
          ),
        },
      },
    })
  } catch (error) {
    console.error('Error generating portfolio summary:', error)
    return c.json({ success: false, error: 'Failed to generate portfolio summary' }, 500)
  }
})

// GET /api/investment-reports/tax-report - Capital Gains Tax Report
app.get('/tax-report', async (c) => {
  const userId = c.get('userId')
  const financialYear = c.req.query('financialYear') || getFinancialYear()

  try {
    // Fetch capital gains for the financial year
    const capitalGains = await prisma.capitalGain.findMany({
      where: { userId, fiscalYear: financialYear },
      orderBy: { saleDate: 'desc' },
    })

    // Fetch dividend income
    const dividends = await prisma.dividendIncome.findMany({
      where: { userId, fiscalYear: financialYear },
    })

    // Fetch ESOP exercises (taxable events)
    const esopExercises = await prisma.eSOPVestingEvent.findMany({
      where: {
        esopGrant: { userId },
        isExercised: true,
        exerciseDate: {
          gte: new Date(`${financialYear.split('-')[0]}-04-01`),
          lt: new Date(`20${financialYear.split('-')[1]}-04-01`),
        },
      },
      include: { esopGrant: true },
    })

    // Calculate STCG and LTCG
    const stcgEquity = capitalGains
      .filter((cg) => cg.gainType === 'STCG' && ['EQUITY', 'EQUITY_MF'].includes(cg.assetType))
      .reduce((sum, cg) => sum + cg.taxableGain, 0)

    const stcgOther = capitalGains
      .filter((cg) => cg.gainType === 'STCG' && !['EQUITY', 'EQUITY_MF'].includes(cg.assetType))
      .reduce((sum, cg) => sum + cg.taxableGain, 0)

    const ltcgEquity = capitalGains
      .filter((cg) => cg.gainType === 'LTCG' && ['EQUITY', 'EQUITY_MF'].includes(cg.assetType))
      .reduce((sum, cg) => sum + cg.taxableGain, 0)

    const ltcgOther = capitalGains
      .filter((cg) => cg.gainType === 'LTCG' && !['EQUITY', 'EQUITY_MF'].includes(cg.assetType))
      .reduce((sum, cg) => sum + cg.taxableGain, 0)

    // LTCG exemption (Rs 1.25 Lakh for equity)
    const ltcgExemption = 125000
    const ltcgEquityTaxable = Math.max(0, ltcgEquity - ltcgExemption)

    // Tax calculations (2024-25 rates)
    const stcgEquityTax = stcgEquity * 0.20 // 20% for equity STCG
    const stcgOtherTax = stcgOther * 0.30 // Slab rate (assuming 30%)
    const ltcgEquityTax = ltcgEquityTaxable * 0.125 // 12.5% for equity LTCG
    const ltcgOtherTax = ltcgOther * 0.125 // 12.5% for other LTCG (without indexation)

    // Dividend income
    const totalDividends = dividends.reduce((sum, d) => sum + d.dividendAmount, 0)
    const dividendTds = dividends.reduce((sum, d) => sum + d.tdsDeducted, 0)

    // ESOP perquisite
    const esopPerquisite = esopExercises.reduce((sum, e) => sum + e.perquisiteValue, 0)
    const esopTds = esopExercises.reduce((sum, e) => sum + e.tdsDeducted, 0)

    return c.json({
      success: true,
      data: {
        financialYear,
        generatedAt: new Date().toISOString(),
        capitalGains: {
          shortTerm: {
            equity: {
              gain: stcgEquity,
              taxRate: '20%',
              estimatedTax: stcgEquityTax,
              transactions: capitalGains.filter(
                (cg) => cg.gainType === 'STCG' && ['EQUITY', 'EQUITY_MF'].includes(cg.assetType)
              ).length,
            },
            other: {
              gain: stcgOther,
              taxRate: 'Slab Rate',
              estimatedTax: stcgOtherTax,
              transactions: capitalGains.filter(
                (cg) => cg.gainType === 'STCG' && !['EQUITY', 'EQUITY_MF'].includes(cg.assetType)
              ).length,
            },
            total: stcgEquity + stcgOther,
            totalTax: stcgEquityTax + stcgOtherTax,
          },
          longTerm: {
            equity: {
              gain: ltcgEquity,
              exemption: Math.min(ltcgEquity, ltcgExemption),
              taxableGain: ltcgEquityTaxable,
              taxRate: '12.5%',
              estimatedTax: ltcgEquityTax,
              transactions: capitalGains.filter(
                (cg) => cg.gainType === 'LTCG' && ['EQUITY', 'EQUITY_MF'].includes(cg.assetType)
              ).length,
            },
            other: {
              gain: ltcgOther,
              taxRate: '12.5%',
              estimatedTax: ltcgOtherTax,
              transactions: capitalGains.filter(
                (cg) => cg.gainType === 'LTCG' && !['EQUITY', 'EQUITY_MF'].includes(cg.assetType)
              ).length,
            },
            total: ltcgEquity + ltcgOther,
            totalTax: ltcgEquityTax + ltcgOtherTax,
          },
          totalGain: stcgEquity + stcgOther + ltcgEquity + ltcgOther,
          totalTax: stcgEquityTax + stcgOtherTax + ltcgEquityTax + ltcgOtherTax,
        },
        dividendIncome: {
          total: totalDividends,
          tdsDeducted: dividendTds,
          taxRate: 'Slab Rate (TDS 10% above Rs 5,000)',
          transactions: dividends.length,
        },
        esopIncome: {
          perquisiteValue: esopPerquisite,
          tdsDeducted: esopTds,
          taxRate: 'Slab Rate (at vesting)',
          exercises: esopExercises.length,
          note: 'Capital gains on sale taxed separately',
        },
        summary: {
          totalTaxableIncome:
            stcgEquity + stcgOther + ltcgEquityTaxable + ltcgOther + totalDividends + esopPerquisite,
          totalEstimatedTax:
            stcgEquityTax + stcgOtherTax + ltcgEquityTax + ltcgOtherTax,
          totalTdsDeducted: dividendTds + esopTds,
          netTaxPayable:
            stcgEquityTax + stcgOtherTax + ltcgEquityTax + ltcgOtherTax - dividendTds - esopTds,
        },
        transactions: capitalGains.map((cg) => ({
          id: cg.id,
          assetName: cg.assetName,
          assetType: cg.assetType,
          purchaseDate: cg.purchaseDate,
          saleDate: cg.saleDate,
          purchasePrice: cg.purchasePrice,
          salePrice: cg.salePrice,
          holdingPeriod: cg.holdingPeriodMonths,
          gainType: cg.gainType,
          grossGain: cg.grossGain,
          exemption: cg.exemptionAmount,
          taxableGain: cg.taxableGain,
          taxRate: cg.taxRate,
          estimatedTax: cg.estimatedTax,
        })),
      },
    })
  } catch (error) {
    console.error('Error generating tax report:', error)
    return c.json({ success: false, error: 'Failed to generate tax report' }, 500)
  }
})

// GET /api/investment-reports/performance - Performance Analysis Report
app.get('/performance', async (c) => {
  const userId = c.get('userId')
  const period = c.req.query('period') || '1Y' // 1M, 3M, 6M, 1Y, 3Y, 5Y, ALL

  try {
    const investments = await prisma.investment.findMany({
      where: { userId, isActive: true },
      include: {
        transactions: {
          orderBy: { transactionDate: 'asc' },
        },
      },
    })

    // Calculate date range based on period
    const endDate = new Date()
    const startDate = new Date()
    switch (period) {
      case '1M':
        startDate.setMonth(startDate.getMonth() - 1)
        break
      case '3M':
        startDate.setMonth(startDate.getMonth() - 3)
        break
      case '6M':
        startDate.setMonth(startDate.getMonth() - 6)
        break
      case '1Y':
        startDate.setFullYear(startDate.getFullYear() - 1)
        break
      case '3Y':
        startDate.setFullYear(startDate.getFullYear() - 3)
        break
      case '5Y':
        startDate.setFullYear(startDate.getFullYear() - 5)
        break
      case 'ALL':
        startDate.setFullYear(2000)
        break
    }

    // Performance by investment
    const performanceData = investments.map((inv) => {
      const periodTransactions = inv.transactions.filter(
        (t) => new Date(t.transactionDate) >= startDate
      )

      return {
        id: inv.id,
        name: inv.name,
        type: inv.type,
        category: inv.category,
        totalInvested: inv.totalInvested,
        currentValue: inv.currentValue,
        absoluteReturn: inv.absoluteReturn,
        absoluteReturnPercent: inv.absoluteReturnPercent,
        xirr: inv.xirr,
        cagr: inv.cagr,
        transactionsInPeriod: periodTransactions.length,
        investedInPeriod: periodTransactions
          .filter((t) => t.transactionType === 'BUY' || t.transactionType === 'SIP')
          .reduce((sum, t) => sum + t.amount, 0),
      }
    })

    // Top performers
    const topPerformers = [...performanceData]
      .sort((a, b) => b.absoluteReturnPercent - a.absoluteReturnPercent)
      .slice(0, 5)

    // Bottom performers
    const bottomPerformers = [...performanceData]
      .sort((a, b) => a.absoluteReturnPercent - b.absoluteReturnPercent)
      .slice(0, 5)

    // Category performance
    const categoryPerformance: Record<
      string,
      { invested: number; value: number; count: number }
    > = {}
    investments.forEach((inv) => {
      const cat = inv.category || 'OTHER'
      if (!categoryPerformance[cat]) {
        categoryPerformance[cat] = { invested: 0, value: 0, count: 0 }
      }
      categoryPerformance[cat].invested += inv.totalInvested
      categoryPerformance[cat].value += inv.currentValue
      categoryPerformance[cat].count += 1
    })

    // Portfolio totals
    const totalInvested = investments.reduce((sum, inv) => sum + inv.totalInvested, 0)
    const totalValue = investments.reduce((sum, inv) => sum + inv.currentValue, 0)
    const absoluteReturn = totalValue - totalInvested
    const absoluteReturnPercent = totalInvested > 0 ? (absoluteReturn / totalInvested) * 100 : 0

    return c.json({
      success: true,
      data: {
        period,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        generatedAt: new Date().toISOString(),
        portfolio: {
          totalInvested,
          totalValue,
          absoluteReturn,
          absoluteReturnPercent,
          investmentCount: investments.length,
        },
        topPerformers,
        bottomPerformers,
        categoryPerformance: Object.entries(categoryPerformance).map(([category, data]) => ({
          category,
          ...data,
          returns: data.value - data.invested,
          returnsPercent: data.invested > 0 ? ((data.value - data.invested) / data.invested) * 100 : 0,
        })),
        allInvestments: performanceData,
      },
    })
  } catch (error) {
    console.error('Error generating performance report:', error)
    return c.json({ success: false, error: 'Failed to generate performance report' }, 500)
  }
})

// GET /api/investment-reports/family - Family Investment Report
app.get('/family', async (c) => {
  const userId = c.get('userId')

  try {
    // Get family members
    const familyMembers = await prisma.familyMember.findMany({
      where: { userId, isActive: true },
    })

    // For now, return user's own investments
    // In a full implementation, investments would have familyMemberId
    const investments = await prisma.investment.findMany({
      where: { userId, isActive: true },
    })

    const totalValue = investments.reduce((sum, inv) => sum + inv.currentValue, 0)
    const totalInvested = investments.reduce((sum, inv) => sum + inv.totalInvested, 0)

    // Group by category for the primary user
    const categoryBreakdown: Record<string, number> = {}
    investments.forEach((inv) => {
      const cat = inv.category || 'OTHER'
      categoryBreakdown[cat] = (categoryBreakdown[cat] || 0) + inv.currentValue
    })

    return c.json({
      success: true,
      data: {
        generatedAt: new Date().toISOString(),
        familyMembers: familyMembers.map((m) => ({
          id: m.id,
          name: m.name,
          relationship: m.relationship,
        })),
        aggregated: {
          totalValue,
          totalInvested,
          absoluteReturn: totalValue - totalInvested,
          absoluteReturnPercent:
            totalInvested > 0 ? ((totalValue - totalInvested) / totalInvested) * 100 : 0,
          investmentCount: investments.length,
        },
        byMember: [
          {
            memberId: 'self',
            memberName: 'Self',
            relationship: 'SELF',
            totalValue,
            totalInvested,
            absoluteReturn: totalValue - totalInvested,
            percentage: 100,
            categoryBreakdown: Object.entries(categoryBreakdown).map(([category, value]) => ({
              category,
              value,
              percentage: (value / totalValue) * 100,
            })),
          },
        ],
        note: 'Family member investment tracking requires familyMemberId on investments',
      },
    })
  } catch (error) {
    console.error('Error generating family report:', error)
    return c.json({ success: false, error: 'Failed to generate family report' }, 500)
  }
})

// GET /api/investment-reports/retirement-projection - Retirement Corpus Projection
app.get('/retirement-projection', async (c) => {
  const userId = c.get('userId')
  const retirementAge = parseInt(c.req.query('retirementAge') || '60')
  const currentAge = parseInt(c.req.query('currentAge') || '30')
  const inflationRate = parseFloat(c.req.query('inflationRate') || '6') / 100
  const expectedReturn = parseFloat(c.req.query('expectedReturn') || '10') / 100

  try {
    const yearsToRetirement = retirementAge - currentAge

    // Fetch all retirement accounts
    const [epfAccount, ppfAccounts, npsAccounts, investments] = await Promise.all([
      prisma.ePFAccount.findFirst({ where: { userId } }),
      prisma.pPFAccount.findMany({ where: { userId, isActive: true } }),
      prisma.nPSAccount.findMany({ where: { userId } }),
      prisma.investment.findMany({ where: { userId, isActive: true } }),
    ])

    // Current corpus
    const epfCorpus = epfAccount?.currentBalance || 0
    const ppfCorpus = ppfAccounts.reduce((sum, acc) => sum + acc.currentBalance, 0)
    const npsCorpus = npsAccounts.reduce((sum, acc) => sum + acc.currentCorpus, 0)
    const investmentCorpus = investments.reduce((sum, inv) => sum + inv.currentValue, 0)
    const currentCorpus = epfCorpus + ppfCorpus + npsCorpus + investmentCorpus

    // Monthly contributions
    const epfMonthly = epfAccount ? epfAccount.employeeContribution + epfAccount.employerEPF : 0
    const ppfMonthly = 12500 // Assumed Rs 1.5L/year
    const npsMonthly = npsAccounts.reduce(
      (sum, acc) => sum + acc.monthlyContribution + acc.employerContribution,
      0
    )

    // Project each account
    const projections: Array<{
      year: number
      age: number
      epf: number
      ppf: number
      nps: number
      investments: number
      total: number
    }> = []

    let epfBalance = epfCorpus
    let ppfBalance = ppfCorpus
    let npsBalance = npsCorpus
    let invBalance = investmentCorpus

    for (let year = 1; year <= yearsToRetirement; year++) {
      // EPF: 8.25% return
      epfBalance = epfBalance * 1.0825 + epfMonthly * 12
      // PPF: 7.1% return (15-year tenure, then extensions)
      ppfBalance = ppfBalance * 1.071 + ppfMonthly * 12
      // NPS: Expected return (default 10%)
      npsBalance = npsBalance * (1 + expectedReturn) + npsMonthly * 12
      // Investments: Expected return
      invBalance = invBalance * (1 + expectedReturn)

      projections.push({
        year,
        age: currentAge + year,
        epf: Math.round(epfBalance),
        ppf: Math.round(ppfBalance),
        nps: Math.round(npsBalance),
        investments: Math.round(invBalance),
        total: Math.round(epfBalance + ppfBalance + npsBalance + invBalance),
      })
    }

    const finalCorpus = projections[projections.length - 1]?.total || currentCorpus

    // Calculate required corpus for retirement (25x annual expenses rule)
    const monthlyExpenses = 100000 // Default Rs 1L/month - should come from profile
    const inflatedMonthlyExpenses = monthlyExpenses * Math.pow(1 + inflationRate, yearsToRetirement)
    const requiredCorpus = inflatedMonthlyExpenses * 12 * 25

    return c.json({
      success: true,
      data: {
        generatedAt: new Date().toISOString(),
        assumptions: {
          currentAge,
          retirementAge,
          yearsToRetirement,
          inflationRate: inflationRate * 100,
          expectedReturn: expectedReturn * 100,
          monthlyExpenses,
        },
        currentStatus: {
          epf: epfCorpus,
          ppf: ppfCorpus,
          nps: npsCorpus,
          investments: investmentCorpus,
          total: currentCorpus,
        },
        monthlyContributions: {
          epf: epfMonthly,
          ppf: ppfMonthly,
          nps: npsMonthly,
          total: epfMonthly + ppfMonthly + npsMonthly,
        },
        projectedCorpus: {
          epf: projections[projections.length - 1]?.epf || epfCorpus,
          ppf: projections[projections.length - 1]?.ppf || ppfCorpus,
          nps: projections[projections.length - 1]?.nps || npsCorpus,
          investments: projections[projections.length - 1]?.investments || investmentCorpus,
          total: finalCorpus,
        },
        retirementReadiness: {
          requiredCorpus: Math.round(requiredCorpus),
          projectedCorpus: finalCorpus,
          gap: Math.round(requiredCorpus - finalCorpus),
          readinessPercent: Math.min(100, (finalCorpus / requiredCorpus) * 100),
          inflatedMonthlyExpenses: Math.round(inflatedMonthlyExpenses),
          safeWithdrawalRate: 4,
          sustainableMonthlyIncome: Math.round((finalCorpus * 0.04) / 12),
        },
        yearlyProjections: projections,
      },
    })
  } catch (error) {
    console.error('Error generating retirement projection:', error)
    return c.json({ success: false, error: 'Failed to generate retirement projection' }, 500)
  }
})

// GET /api/investment-reports/80c-status - Section 80C Investment Status
app.get('/80c-status', async (c) => {
  const userId = c.get('userId')
  const financialYear = c.req.query('financialYear') || getFinancialYear()

  try {
    // Fetch all 80C eligible investments
    const [epfAccount, ppfAccounts, elssFunds, npsAccounts] = await Promise.all([
      prisma.ePFAccount.findFirst({ where: { userId } }),
      prisma.pPFAccount.findMany({ where: { userId, isActive: true } }),
      prisma.investment.findMany({ where: { userId, isELSS: true, isActive: true } }),
      prisma.nPSAccount.findMany({ where: { userId } }),
    ])

    // Calculate contributions for the FY
    const epfContribution = (epfAccount?.employeeContribution || 0) * 12
    const ppfContribution = ppfAccounts.reduce((sum, acc) => sum + acc.currentYearDeposit, 0)
    const elssInvestment = elssFunds.reduce((sum, inv) => sum + inv.totalInvested, 0)
    const nps80CCD1 = Math.min(
      npsAccounts.reduce((sum, acc) => sum + acc.monthlyContribution * 12, 0),
      150000
    )

    // 80C limit
    const limit80C = 150000
    const total80C = Math.min(limit80C, epfContribution + ppfContribution + elssInvestment)

    // 80CCD(1B) - Additional Rs 50,000 for NPS
    const limit80CCD1B = 50000
    const used80CCD1B = Math.min(
      limit80CCD1B,
      npsAccounts.reduce((sum, acc) => sum + acc.monthlyContribution * 12, 0)
    )

    // 80CCD(2) - Employer NPS contribution (no limit)
    const used80CCD2 = npsAccounts.reduce((sum, acc) => sum + acc.employerContribution * 12, 0)

    return c.json({
      success: true,
      data: {
        financialYear,
        generatedAt: new Date().toISOString(),
        section80C: {
          limit: limit80C,
          used: total80C,
          remaining: Math.max(0, limit80C - total80C),
          breakdown: {
            epf: epfContribution,
            ppf: ppfContribution,
            elss: elssInvestment,
            nps80CCD1,
            // Add more: LIC, NSC, SCSS, etc.
          },
        },
        section80CCD1B: {
          limit: limit80CCD1B,
          used: used80CCD1B,
          remaining: Math.max(0, limit80CCD1B - used80CCD1B),
          note: 'Additional NPS contribution beyond 80C',
        },
        section80CCD2: {
          limit: 'No limit (10% of basic for private, 14% for govt)',
          used: used80CCD2,
          note: 'Employer NPS contribution',
        },
        totalDeduction: total80C + used80CCD1B + used80CCD2,
        taxSavings: {
          at30Percent: (total80C + used80CCD1B + used80CCD2) * 0.30,
          at20Percent: (total80C + used80CCD1B + used80CCD2) * 0.20,
          at10Percent: (total80C + used80CCD1B + used80CCD2) * 0.10,
        },
        recommendations: [],
      },
    })
  } catch (error) {
    console.error('Error generating 80C status:', error)
    return c.json({ success: false, error: 'Failed to generate 80C status' }, 500)
  }
})

export default app
