import { Hono } from 'hono'
import { prisma } from '../lib/prisma'
import { authMiddleware } from '../middleware/auth'

const app = new Hono()

// Apply auth middleware to all routes
app.use('*', authMiddleware)

// Monte Carlo simulation parameters
const DEFAULT_RUNS = 10000
const DEFAULT_YEARS = 30
const CACHE_DURATION_HOURS = 24

// Historical return statistics (Indian market approximation)
const EQUITY_MEAN_RETURN = 0.12 // 12% mean
const EQUITY_STD_DEV = 0.20 // 20% standard deviation
const DEBT_MEAN_RETURN = 0.07 // 7% mean
const DEBT_STD_DEV = 0.03 // 3% standard deviation

// Helper: Generate normally distributed random number (Box-Muller transform)
function randomNormal(mean: number, stdDev: number): number {
  const u1 = Math.random()
  const u2 = Math.random()
  const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2)
  return mean + z * stdDev
}

// Helper: Run single simulation path
function simulatePath(
  startingCorpus: number,
  annualWithdrawal: number,
  years: number,
  equityAllocation: number
): { path: number[]; success: boolean; endingValue: number } {
  const path: number[] = [startingCorpus]
  let corpus = startingCorpus
  const debtAllocation = 1 - equityAllocation

  for (let year = 0; year < years; year++) {
    // Generate random returns for this year
    const equityReturn = randomNormal(EQUITY_MEAN_RETURN, EQUITY_STD_DEV)
    const debtReturn = randomNormal(DEBT_MEAN_RETURN, DEBT_STD_DEV)

    // Blended portfolio return
    const portfolioReturn = equityAllocation * equityReturn + debtAllocation * debtReturn

    // Apply return and withdrawal
    corpus = corpus * (1 + portfolioReturn) - annualWithdrawal

    // Record path (allow negative for tracking)
    path.push(Math.max(0, corpus))

    // If corpus depleted, fill remaining years with 0
    if (corpus <= 0) {
      while (path.length <= years) {
        path.push(0)
      }
      return { path, success: false, endingValue: 0 }
    }
  }

  return { path, success: true, endingValue: corpus }
}

// Helper: Calculate percentile
function percentile(arr: number[], p: number): number {
  const sorted = [...arr].sort((a, b) => a - b)
  const index = (p / 100) * (sorted.length - 1)
  const lower = Math.floor(index)
  const upper = Math.ceil(index)
  const weight = index - lower

  if (upper >= sorted.length) return sorted[sorted.length - 1]
  return sorted[lower] * (1 - weight) + sorted[upper] * weight
}

// GET /api/fire/monte-carlo - Run Monte Carlo simulation
app.get('/', async (c) => {
  const userId = c.get('userId')
  const runsParam = c.req.query('runs')
  const yearsParam = c.req.query('years')
  const forceRefresh = c.req.query('refresh') === 'true'

  const runs = runsParam ? parseInt(runsParam, 10) : DEFAULT_RUNS
  const years = yearsParam ? parseInt(yearsParam, 10) : DEFAULT_YEARS

  try {
    // Check for cached results first (unless force refresh)
    if (!forceRefresh) {
      const cached = await prisma.monteCarloResult.findFirst({
        where: {
          userId,
          yearsSimulated: years,
          expiresAt: { gt: new Date() },
        },
        orderBy: { calculatedAt: 'desc' },
      })

      if (cached) {
        return c.json({
          ...cached,
          cached: true,
        })
      }
    }

    // Get current financial data
    const [
      investments,
      epfAccount,
      ppfAccounts,
      npsAccounts,
      withdrawalStrategy,
      profile,
    ] = await Promise.all([
      prisma.investment.findMany({
        where: { userId, isActive: true },
        select: { currentValue: true, category: true },
      }),
      prisma.ePFAccount.findUnique({
        where: { userId },
        select: { currentBalance: true },
      }),
      prisma.pPFAccount.findMany({
        where: { userId, isActive: true },
        select: { currentBalance: true },
      }),
      prisma.nPSAccount.findMany({
        where: { userId },
        select: { currentCorpus: true, equityAllocation: true },
      }),
      prisma.withdrawalStrategy.findUnique({
        where: { userId },
      }),
      prisma.profile.findUnique({
        where: { userId },
      }),
    ])

    // Calculate starting corpus
    const startingCorpus =
      investments.reduce((sum, inv) => sum + (inv.currentValue || 0), 0) +
      (epfAccount?.currentBalance || 0) +
      ppfAccounts.reduce((sum, acc) => sum + acc.currentBalance, 0) +
      npsAccounts.reduce((sum, acc) => sum + acc.currentCorpus, 0)

    // Calculate equity allocation
    const equityInvestments = investments
      .filter(inv => ['EQUITY', 'MUTUAL_FUND'].includes(inv.category))
      .reduce((sum, inv) => sum + (inv.currentValue || 0), 0)
    const npsEquity = npsAccounts.reduce(
      (sum, acc) => sum + acc.currentCorpus * (acc.equityAllocation / 100),
      0
    )
    const totalEquity = equityInvestments + npsEquity
    const equityAllocation = startingCorpus > 0 ? totalEquity / startingCorpus : 0.6

    // Get annual withdrawal
    const swr = withdrawalStrategy?.customSWR
      ? withdrawalStrategy.customSWR / 100
      : 0.035
    const monthlyExpenses = profile?.monthlyExpenses || 50000
    const annualWithdrawal = Math.max(startingCorpus * swr, monthlyExpenses * 12)

    // Run simulations
    const results: Array<{ path: number[]; success: boolean; endingValue: number }> = []

    for (let i = 0; i < runs; i++) {
      results.push(
        simulatePath(startingCorpus, annualWithdrawal, years, equityAllocation)
      )
    }

    // Calculate statistics
    const successCount = results.filter(r => r.success).length
    const successRate = (successCount / runs) * 100

    const endingValues = results.map(r => r.endingValue)
    const p10 = percentile(endingValues, 10)
    const p25 = percentile(endingValues, 25)
    const p50 = percentile(endingValues, 50)
    const p75 = percentile(endingValues, 75)
    const p90 = percentile(endingValues, 90)

    // Generate year-by-year percentiles for chart
    const yearByYearData: Array<{
      year: number
      p10: number
      p25: number
      p50: number
      p75: number
      p90: number
    }> = []

    for (let year = 0; year <= years; year++) {
      const yearValues = results.map(r => r.path[year] || 0)
      yearByYearData.push({
        year,
        p10: Math.round(percentile(yearValues, 10)),
        p25: Math.round(percentile(yearValues, 25)),
        p50: Math.round(percentile(yearValues, 50)),
        p75: Math.round(percentile(yearValues, 75)),
        p90: Math.round(percentile(yearValues, 90)),
      })
    }

    // Get sample scenarios for visualization
    const sortedByEnd = [...results].sort((a, b) => a.endingValue - b.endingValue)
    const scenarioSamples = {
      worst: sortedByEnd[Math.floor(runs * 0.05)]?.path || [],
      poor: sortedByEnd[Math.floor(runs * 0.1)]?.path || [],
      median: sortedByEnd[Math.floor(runs * 0.5)]?.path || [],
      good: sortedByEnd[Math.floor(runs * 0.9)]?.path || [],
      best: sortedByEnd[Math.floor(runs * 0.95)]?.path || [],
    }

    // Cache expiry
    const expiresAt = new Date()
    expiresAt.setHours(expiresAt.getHours() + CACHE_DURATION_HOURS)

    // Save to cache
    const result = await prisma.monteCarloResult.create({
      data: {
        userId,
        runsCount: runs,
        yearsSimulated: years,
        startingCorpus,
        annualWithdrawal,
        equityAllocation,
        successRate,
        medianEndingValue: p50,
        percentile10: p10,
        percentile25: p25,
        percentile50: p50,
        percentile75: p75,
        percentile90: p90,
        yearByYearData,
        scenarioSamples,
        expiresAt,
      },
    })

    // Clean up old cache entries
    await prisma.monteCarloResult.deleteMany({
      where: {
        userId,
        expiresAt: { lt: new Date() },
      },
    })

    return c.json({
      id: result.id,
      runsCount: runs,
      yearsSimulated: years,
      startingCorpus: Math.round(startingCorpus),
      annualWithdrawal: Math.round(annualWithdrawal),
      equityAllocation: Math.round(equityAllocation * 100),
      successRate: Math.round(successRate * 10) / 10,
      medianEndingValue: Math.round(p50),
      percentiles: {
        p10: Math.round(p10),
        p25: Math.round(p25),
        p50: Math.round(p50),
        p75: Math.round(p75),
        p90: Math.round(p90),
      },
      yearByYearData,
      scenarioSamples,
      interpretation: generateInterpretation(successRate, p50, startingCorpus),
      cached: false,
      calculatedAt: result.calculatedAt,
      expiresAt: result.expiresAt,
    })
  } catch (error) {
    console.error('Error running Monte Carlo simulation:', error)
    return c.json(
      { success: false, error: 'Failed to run Monte Carlo simulation' },
      500
    )
  }
})

// Helper: Generate interpretation of results
function generateInterpretation(
  successRate: number,
  medianEnding: number,
  startingCorpus: number
): {
  status: 'excellent' | 'good' | 'fair' | 'poor'
  message: string
  recommendations: string[]
} {
  const recommendations: string[] = []

  if (successRate >= 95) {
    return {
      status: 'excellent',
      message: 'Your retirement plan is very robust. You have a very high probability of success even in adverse market conditions.',
      recommendations: [
        'Consider if you can retire earlier or increase spending',
        'Your portfolio is well-positioned for the long term',
      ],
    }
  }

  if (successRate >= 85) {
    return {
      status: 'good',
      message: 'Your retirement plan has a good success rate. Most scenarios show your portfolio lasting through retirement.',
      recommendations: [
        'Consider building a small buffer for unexpected expenses',
        'Review your plan annually to stay on track',
      ],
    }
  }

  if (successRate >= 70) {
    recommendations.push('Consider reducing your planned withdrawal rate')
    recommendations.push('Increase your equity allocation for higher growth potential')
    recommendations.push('Build a larger corpus before retirement')

    return {
      status: 'fair',
      message: 'Your retirement plan has moderate risk. About 30% of scenarios show potential portfolio depletion.',
      recommendations,
    }
  }

  recommendations.push('Strongly consider working longer to build a larger corpus')
  recommendations.push('Reduce planned retirement expenses')
  recommendations.push('Increase savings rate significantly')
  recommendations.push('Review your asset allocation strategy')

  return {
    status: 'poor',
    message: 'Your retirement plan needs attention. There is significant risk of running out of money in retirement.',
    recommendations,
  }
}

export default app
