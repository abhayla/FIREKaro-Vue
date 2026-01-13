import { Hono } from 'hono'
import { prisma } from '../lib/prisma'
import { authMiddleware } from '../middleware/auth'

const app = new Hono()

// Apply auth middleware to all routes
app.use('*', authMiddleware)

// Freedom Score domains (each 0-25, total 0-100)
interface FreedomScoreDomain {
  name: string
  score: number
  maxScore: number
  factors: Array<{
    name: string
    value: number
    target: number
    weight: number
    status: 'excellent' | 'good' | 'fair' | 'poor'
  }>
}

// Helper: Calculate SAVE domain score (savings and expense control)
async function calculateSaveScore(userId: string): Promise<FreedomScoreDomain> {
  // Get income and expenses
  const latestSalary = await prisma.monthlySalary.findFirst({
    where: { userId },
    orderBy: [{ year: 'desc' }, { month: 'desc' }],
  })

  const threeMonthsAgo = new Date()
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3)

  const expenses = await prisma.expense.findMany({
    where: { userId, date: { gte: threeMonthsAgo } },
  })

  const monthlyIncome = latestSalary?.netSalary || 100000
  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0)
  const monthlyExpenses = totalExpenses / 3

  const savingsRate = Math.max(0, ((monthlyIncome - monthlyExpenses) / monthlyIncome) * 100)

  // Get budget adherence
  const currentMonth = new Date().getMonth() + 1
  const currentYear = new Date().getFullYear()
  const budget = await prisma.budget.findFirst({
    where: { userId, month: currentMonth, year: currentYear },
  })

  const budgetAdherence = budget
    ? Math.max(0, 100 - Math.abs(
        ((budget.needsActual + budget.wantsActual) -
          (budget.needsLimit + budget.wantsLimit)) /
          (budget.needsLimit + budget.wantsLimit)
      ) * 100)
    : 50

  // Calculate factors
  const factors = [
    {
      name: 'Savings Rate',
      value: savingsRate,
      target: 50,
      weight: 15,
      status: savingsRate >= 50 ? 'excellent' : savingsRate >= 30 ? 'good' : savingsRate >= 15 ? 'fair' : 'poor' as const,
    },
    {
      name: 'Budget Adherence',
      value: budgetAdherence,
      target: 90,
      weight: 10,
      status: budgetAdherence >= 90 ? 'excellent' : budgetAdherence >= 70 ? 'good' : budgetAdherence >= 50 ? 'fair' : 'poor' as const,
    },
  ]

  // Calculate domain score (0-25)
  let domainScore = 0
  for (const factor of factors) {
    const factorScore = Math.min(factor.weight, (factor.value / factor.target) * factor.weight)
    domainScore += factorScore
  }

  return {
    name: 'SAVE',
    score: Math.round(domainScore),
    maxScore: 25,
    factors,
  }
}

// Helper: Calculate GROW domain score (investment growth and diversification)
async function calculateGrowScore(userId: string): Promise<FreedomScoreDomain> {
  // Get all investments
  const investments = await prisma.investment.findMany({
    where: { userId, isActive: true },
  })

  const epf = await prisma.ePFAccount.findUnique({ where: { userId } })
  const ppf = await prisma.pPFAccount.findMany({ where: { userId, isActive: true } })
  const nps = await prisma.nPSAccount.findMany({ where: { userId } })

  // Calculate total portfolio value
  const investmentTotal = investments.reduce((sum, inv) => sum + (inv.currentValue || 0), 0)
  const epfTotal = epf?.currentBalance || 0
  const ppfTotal = ppf.reduce((sum, acc) => sum + acc.currentBalance, 0)
  const npsTotal = nps.reduce((sum, acc) => sum + acc.currentCorpus, 0)
  const totalPortfolio = investmentTotal + epfTotal + ppfTotal + npsTotal

  // Calculate diversification (simplified)
  const hasEquity = investments.some(inv => ['EQUITY', 'MUTUAL_FUND'].includes(inv.category))
  const hasDebt = epfTotal > 0 || ppfTotal > 0 || investments.some(inv => inv.category === 'DEBT')
  const hasNPS = npsTotal > 0
  const diversificationScore = (hasEquity ? 33 : 0) + (hasDebt ? 33 : 0) + (hasNPS ? 34 : 0)

  // Get net worth trend
  const netWorthHistory = await prisma.netWorth.findMany({
    where: { userId },
    orderBy: { recordedAt: 'desc' },
    take: 12,
  })

  let growthTrend = 50 // Default neutral
  if (netWorthHistory.length >= 2) {
    const latest = netWorthHistory[0].netWorth
    const oldest = netWorthHistory[netWorthHistory.length - 1].netWorth
    if (oldest > 0) {
      const growth = ((latest - oldest) / oldest) * 100
      growthTrend = Math.min(100, Math.max(0, 50 + growth))
    }
  }

  const factors = [
    {
      name: 'Portfolio Diversification',
      value: diversificationScore,
      target: 100,
      weight: 12,
      status: diversificationScore >= 80 ? 'excellent' : diversificationScore >= 60 ? 'good' : diversificationScore >= 40 ? 'fair' : 'poor' as const,
    },
    {
      name: 'Net Worth Growth',
      value: growthTrend,
      target: 100,
      weight: 13,
      status: growthTrend >= 80 ? 'excellent' : growthTrend >= 60 ? 'good' : growthTrend >= 40 ? 'fair' : 'poor' as const,
    },
  ]

  let domainScore = 0
  for (const factor of factors) {
    const factorScore = Math.min(factor.weight, (factor.value / factor.target) * factor.weight)
    domainScore += factorScore
  }

  return {
    name: 'GROW',
    score: Math.round(domainScore),
    maxScore: 25,
    factors,
  }
}

// Helper: Calculate PROTECT domain score (emergency fund, insurance)
async function calculateProtectScore(userId: string): Promise<FreedomScoreDomain> {
  // Get emergency fund status
  const emergencyFund = await prisma.emergencyFund.findUnique({
    where: { userId },
  })

  const emergencyFundCoverage = emergencyFund
    ? Math.min(100, emergencyFund.percentageComplete)
    : 0

  // Get insurance coverage
  const insurancePolicies = await prisma.insurancePolicy.findMany({
    where: { userId, status: 'ACTIVE' },
  })

  const hasLifeInsurance = insurancePolicies.some(p => p.type === 'LIFE')
  const hasHealthInsurance = insurancePolicies.some(p => p.type === 'HEALTH')

  // Calculate life insurance adequacy (should be 10-15x annual income)
  const latestSalary = await prisma.monthlySalary.findFirst({
    where: { userId },
    orderBy: [{ year: 'desc' }, { month: 'desc' }],
  })
  const annualIncome = (latestSalary?.netSalary || 100000) * 12
  const lifeInsuranceCover = insurancePolicies
    .filter(p => p.type === 'LIFE')
    .reduce((sum, p) => sum + p.sumAssured, 0)
  const lifeInsuranceAdequacy = Math.min(100, (lifeInsuranceCover / (annualIncome * 10)) * 100)

  // Health insurance adequacy (should be at least 5L per person)
  const healthCover = insurancePolicies
    .filter(p => p.type === 'HEALTH')
    .reduce((sum, p) => sum + p.sumAssured, 0)
  const healthInsuranceAdequacy = Math.min(100, (healthCover / 500000) * 100)

  const factors = [
    {
      name: 'Emergency Fund',
      value: emergencyFundCoverage,
      target: 100,
      weight: 10,
      status: emergencyFundCoverage >= 100 ? 'excellent' : emergencyFundCoverage >= 75 ? 'good' : emergencyFundCoverage >= 50 ? 'fair' : 'poor' as const,
    },
    {
      name: 'Life Insurance',
      value: lifeInsuranceAdequacy,
      target: 100,
      weight: 8,
      status: lifeInsuranceAdequacy >= 100 ? 'excellent' : lifeInsuranceAdequacy >= 70 ? 'good' : lifeInsuranceAdequacy >= 40 ? 'fair' : 'poor' as const,
    },
    {
      name: 'Health Insurance',
      value: healthInsuranceAdequacy,
      target: 100,
      weight: 7,
      status: healthInsuranceAdequacy >= 100 ? 'excellent' : healthInsuranceAdequacy >= 70 ? 'good' : healthInsuranceAdequacy >= 40 ? 'fair' : 'poor' as const,
    },
  ]

  let domainScore = 0
  for (const factor of factors) {
    const factorScore = Math.min(factor.weight, (factor.value / factor.target) * factor.weight)
    domainScore += factorScore
  }

  return {
    name: 'PROTECT',
    score: Math.round(domainScore),
    maxScore: 25,
    factors,
  }
}

// Helper: Calculate READY domain score (FIRE readiness)
async function calculateReadyScore(userId: string): Promise<FreedomScoreDomain> {
  // Get FIRE metrics
  const metrics = await prisma.fIREMetricsCache.findUnique({
    where: { userId },
  })

  const fireProgress = metrics?.progressPercent || 0

  // Get goals status
  const goals = await prisma.financialGoal.findMany({
    where: { userId },
  })

  const goalsOnTrack = goals.filter(g => ['ON_TRACK', 'COMPLETED'].includes(g.status)).length
  const goalsProgress = goals.length > 0 ? (goalsOnTrack / goals.length) * 100 : 0

  // Check withdrawal strategy
  const hasWithdrawalStrategy = await prisma.withdrawalStrategy.findUnique({
    where: { userId },
  })

  const withdrawalPlanScore = hasWithdrawalStrategy ? 100 : 0

  const factors = [
    {
      name: 'FIRE Progress',
      value: fireProgress,
      target: 100,
      weight: 15,
      status: fireProgress >= 75 ? 'excellent' : fireProgress >= 50 ? 'good' : fireProgress >= 25 ? 'fair' : 'poor' as const,
    },
    {
      name: 'Goals On Track',
      value: goalsProgress,
      target: 100,
      weight: 5,
      status: goalsProgress >= 80 ? 'excellent' : goalsProgress >= 60 ? 'good' : goalsProgress >= 40 ? 'fair' : 'poor' as const,
    },
    {
      name: 'Withdrawal Plan',
      value: withdrawalPlanScore,
      target: 100,
      weight: 5,
      status: withdrawalPlanScore >= 100 ? 'excellent' : 'poor' as const,
    },
  ]

  let domainScore = 0
  for (const factor of factors) {
    const factorScore = Math.min(factor.weight, (factor.value / factor.target) * factor.weight)
    domainScore += factorScore
  }

  return {
    name: 'READY',
    score: Math.round(domainScore),
    maxScore: 25,
    factors,
  }
}

// Helper: Get status message based on score
function getScoreMessage(score: number): { status: string; message: string } {
  if (score >= 85) {
    return {
      status: 'Excellent',
      message: "You're doing exceptionally well! Keep up the great work on your FIRE journey.",
    }
  } else if (score >= 70) {
    return {
      status: 'Good',
      message: "You're making solid progress toward financial independence.",
    }
  } else if (score >= 50) {
    return {
      status: 'Fair',
      message: 'You have a good foundation. Focus on improving your weaker areas.',
    }
  } else if (score >= 30) {
    return {
      status: 'Developing',
      message: "You're building your financial independence. Review the recommendations below.",
    }
  } else {
    return {
      status: 'Starting',
      message: "Every journey begins with a first step. Let's build your financial foundation.",
    }
  }
}

// GET /api/fire/freedom-score - Get freedom score with breakdown
app.get('/', async (c) => {
  const userId = c.get('userId')

  try {
    // Calculate all domain scores
    const [saveScore, growScore, protectScore, readyScore] = await Promise.all([
      calculateSaveScore(userId),
      calculateGrowScore(userId),
      calculateProtectScore(userId),
      calculateReadyScore(userId),
    ])

    const totalScore = saveScore.score + growScore.score + protectScore.score + readyScore.score

    const { status, message } = getScoreMessage(totalScore)

    // Update cache
    await prisma.fIREMetricsCache.upsert({
      where: { userId },
      update: {
        freedomScore: totalScore,
        freedomScoreSave: saveScore.score,
        freedomScoreGrow: growScore.score,
        freedomScoreProtect: protectScore.score,
        freedomScoreReady: readyScore.score,
      },
      create: {
        userId,
        fireNumber: 0,
        currentCorpus: 0,
        progressPercent: 0,
        yearsToFIRE: 0,
        monthsToFIRE: 0,
        leanFIRE: 0,
        regularFIRE: 0,
        fatFIRE: 0,
        coastFIRE: 0,
        annualExpenses: 0,
        monthlySavings: 0,
        savingsRate: 0,
        freedomScore: totalScore,
        freedomScoreSave: saveScore.score,
        freedomScoreGrow: growScore.score,
        freedomScoreProtect: protectScore.score,
        freedomScoreReady: readyScore.score,
      },
    })

    return c.json({
      totalScore,
      maxScore: 100,
      status,
      message,
      domains: [saveScore, growScore, protectScore, readyScore],
      calculatedAt: new Date(),
    })
  } catch (error) {
    console.error('Error calculating freedom score:', error)
    return c.json(
      { success: false, error: 'Failed to calculate freedom score' },
      500
    )
  }
})

export default app
