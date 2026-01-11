import { Hono } from 'hono'
import { prisma } from '../lib/prisma'
import { authMiddleware } from '../middleware/auth'

const app = new Hono()

// Apply auth middleware to all routes
app.use('*', authMiddleware)

// GET /api/fire/export - Export FIRE data for PDF/Excel generation
app.get('/', async (c) => {
  const userId = c.get('userId')
  const format = c.req.query('format') || 'json' // pdf, xlsx, json

  try {
    // Get all FIRE-related data
    const [
      profile,
      metrics,
      goals,
      withdrawalStrategy,
      monteCarloResult,
      investments,
      epfAccount,
      ppfAccounts,
      npsAccounts,
      emergencyFund,
      insurancePolicies,
    ] = await Promise.all([
      prisma.profile.findUnique({ where: { userId } }),
      prisma.fIREMetricsCache.findUnique({ where: { userId } }),
      prisma.financialGoal.findMany({
        where: { userId },
        include: { milestones: true },
        orderBy: { targetDate: 'asc' },
      }),
      prisma.withdrawalStrategy.findUnique({ where: { userId } }),
      prisma.monteCarloResult.findFirst({
        where: { userId },
        orderBy: { calculatedAt: 'desc' },
      }),
      prisma.investment.findMany({
        where: { userId, isActive: true },
      }),
      prisma.ePFAccount.findUnique({ where: { userId } }),
      prisma.pPFAccount.findMany({ where: { userId, isActive: true } }),
      prisma.nPSAccount.findMany({ where: { userId } }),
      prisma.emergencyFund.findUnique({ where: { userId } }),
      prisma.insurancePolicy.findMany({
        where: { userId, status: 'ACTIVE' },
      }),
    ])

    // Get user info
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { name: true, email: true },
    })

    // Calculate totals
    const currentCorpus =
      investments.reduce((sum, inv) => sum + (inv.currentValue || 0), 0) +
      (epfAccount?.currentBalance || 0) +
      ppfAccounts.reduce((sum, acc) => sum + acc.currentBalance, 0) +
      npsAccounts.reduce((sum, acc) => sum + acc.currentCorpus, 0)

    // Build export data structure
    const exportData = {
      reportInfo: {
        title: 'FIRE Journey Report',
        generatedAt: new Date().toISOString(),
        userName: user?.name || 'User',
        userEmail: user?.email || '',
        format,
      },

      summary: {
        currentAge: profile?.currentAge || 30,
        targetRetirementAge: profile?.targetRetirementAge || 50,
        yearsToFIRE: metrics?.yearsToFIRE || 0,
        fireNumber: metrics?.regularFIRE || 0,
        currentCorpus,
        progressPercent: metrics?.progressPercent || 0,
        freedomScore: metrics?.freedomScore || 0,
        savingsRate: metrics?.savingsRate || 0,
        monthlyPassiveIncome: currentCorpus * 0.035 / 12,
      },

      fireVariants: {
        leanFIRE: metrics?.leanFIRE || 0,
        regularFIRE: metrics?.regularFIRE || 0,
        fatFIRE: metrics?.fatFIRE || 0,
        coastFIRE: metrics?.coastFIRE || 0,
        baristaFIRE: metrics?.baristaFIRE || 0,
      },

      freedomScore: {
        total: metrics?.freedomScore || 0,
        save: metrics?.freedomScoreSave || 0,
        grow: metrics?.freedomScoreGrow || 0,
        protect: metrics?.freedomScoreProtect || 0,
        ready: metrics?.freedomScoreReady || 0,
      },

      portfolioSummary: {
        investments: {
          count: investments.length,
          totalValue: investments.reduce((sum, inv) => sum + (inv.currentValue || 0), 0),
          byCategory: investments.reduce((acc, inv) => {
            acc[inv.category] = (acc[inv.category] || 0) + (inv.currentValue || 0)
            return acc
          }, {} as Record<string, number>),
        },
        epf: epfAccount ? {
          balance: epfAccount.currentBalance,
          employeeShare: epfAccount.employeeShare,
          employerShare: epfAccount.employerShare,
        } : null,
        ppf: {
          count: ppfAccounts.length,
          totalBalance: ppfAccounts.reduce((sum, acc) => sum + acc.currentBalance, 0),
        },
        nps: {
          count: npsAccounts.length,
          totalCorpus: npsAccounts.reduce((sum, acc) => sum + acc.currentCorpus, 0),
        },
        total: currentCorpus,
      },

      goals: goals.map(goal => ({
        name: goal.goalName,
        category: goal.category,
        targetAmount: goal.targetAmount,
        currentAmount: goal.currentAmount,
        progress: (goal.currentAmount / goal.targetAmount) * 100,
        targetDate: goal.targetDate.toISOString().split('T')[0],
        status: goal.status,
        monthlyContribution: goal.monthlyContribution,
        sipRecommended: goal.sipRecommended,
        milestonesAchieved: goal.milestones.filter(m => m.achieved).length,
        totalMilestones: goal.milestones.length,
      })),

      goalsSummary: {
        total: goals.length,
        completed: goals.filter(g => g.status === 'COMPLETED').length,
        onTrack: goals.filter(g => g.status === 'ON_TRACK').length,
        atRisk: goals.filter(g => g.status === 'AT_RISK').length,
        offTrack: goals.filter(g => g.status === 'OFF_TRACK').length,
        totalTarget: goals.reduce((sum, g) => sum + g.targetAmount, 0),
        totalSaved: goals.reduce((sum, g) => sum + g.currentAmount, 0),
      },

      withdrawalStrategy: withdrawalStrategy ? {
        activeStrategy: withdrawalStrategy.activeStrategy,
        customSWR: withdrawalStrategy.customSWR,
        bucketConfig: {
          cashYears: withdrawalStrategy.bucketCashYears,
          bondsYears: withdrawalStrategy.bucketBondsYears,
          equityPercent: withdrawalStrategy.bucketEquityPercent,
        },
        guytonKlinger: {
          upperGuardrail: withdrawalStrategy.gkUpperGuardrail,
          lowerGuardrail: withdrawalStrategy.gkLowerGuardrail,
          maxIncrease: withdrawalStrategy.gkMaxIncrease,
          maxDecrease: withdrawalStrategy.gkMaxDecrease,
        },
      } : null,

      monteCarlo: monteCarloResult ? {
        successRate: monteCarloResult.successRate,
        runsCount: monteCarloResult.runsCount,
        yearsSimulated: monteCarloResult.yearsSimulated,
        percentiles: {
          p10: monteCarloResult.percentile10,
          p25: monteCarloResult.percentile25,
          p50: monteCarloResult.percentile50,
          p75: monteCarloResult.percentile75,
          p90: monteCarloResult.percentile90,
        },
        calculatedAt: monteCarloResult.calculatedAt,
      } : null,

      protection: {
        emergencyFund: emergencyFund ? {
          targetMonths: emergencyFund.targetMonths,
          targetAmount: emergencyFund.targetAmount,
          currentAmount: emergencyFund.currentAmount,
          percentComplete: emergencyFund.percentageComplete,
        } : null,
        insurance: {
          totalPolicies: insurancePolicies.length,
          lifeCover: insurancePolicies
            .filter(p => p.type === 'LIFE')
            .reduce((sum, p) => sum + p.sumAssured, 0),
          healthCover: insurancePolicies
            .filter(p => p.type === 'HEALTH')
            .reduce((sum, p) => sum + p.sumAssured, 0),
          policies: insurancePolicies.map(p => ({
            type: p.type,
            provider: p.provider,
            sumAssured: p.sumAssured,
            premium: p.premium,
            endDate: p.endDate.toISOString().split('T')[0],
          })),
        },
      },

      assumptions: {
        safeWithdrawalRate: metrics?.safeWithdrawalRate || 3.5,
        expectedReturns: metrics?.expectedReturns || 12,
        generalInflation: metrics?.inflationRate || 6,
        healthcareInflation: metrics?.healthcareInflation || 8,
      },

      recommendations: generateRecommendations(
        metrics?.progressPercent || 0,
        metrics?.savingsRate || 0,
        emergencyFund?.percentageComplete || 0,
        insurancePolicies.length
      ),
    }

    // Return data for frontend to generate PDF/Excel
    return c.json({
      success: true,
      format,
      data: exportData,
      exportInfo: {
        message: `Use this data to generate ${format.toUpperCase()} on the frontend`,
        suggestedFilename: `fire-report-${new Date().toISOString().split('T')[0]}`,
        sheets: format === 'xlsx' ? [
          'Summary',
          'Portfolio',
          'Goals',
          'Projections',
          'Protection',
          'Assumptions',
        ] : undefined,
      },
    })
  } catch (error) {
    console.error('Error exporting FIRE data:', error)
    return c.json({ success: false, error: 'Failed to export FIRE data' }, 500)
  }
})

// Helper: Generate recommendations based on current status
function generateRecommendations(
  progress: number,
  savingsRate: number,
  emergencyFundPercent: number,
  insuranceCount: number
): string[] {
  const recommendations: string[] = []

  if (progress < 25) {
    recommendations.push('Focus on building your investment corpus consistently through SIPs')
  }

  if (savingsRate < 30) {
    recommendations.push('Try to increase your savings rate to at least 30% for faster FIRE achievement')
  } else if (savingsRate >= 50) {
    recommendations.push('Excellent savings rate! You\'re on the fast track to FIRE')
  }

  if (emergencyFundPercent < 100) {
    recommendations.push('Prioritize building your emergency fund to 6 months of expenses')
  }

  if (insuranceCount === 0) {
    recommendations.push('Consider getting life and health insurance to protect your FIRE journey')
  }

  if (progress >= 50 && progress < 75) {
    recommendations.push('You\'re halfway there! Consider optimizing your asset allocation for growth')
  }

  if (progress >= 75) {
    recommendations.push('Start planning your withdrawal strategy and post-FIRE lifestyle')
  }

  return recommendations
}

export default app
