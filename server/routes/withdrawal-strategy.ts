import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { prisma } from '../lib/prisma'
import { authMiddleware } from '../middleware/auth'

const app = new Hono()

// Apply auth middleware to all routes
app.use('*', authMiddleware)

// Withdrawal strategy types
const strategyTypes = [
  'SWR_4_PERCENT',
  'SWR_CUSTOM',
  'BUCKET',
  'VPW',
  'GUYTON_KLINGER',
] as const

// Validation schema
const updateStrategySchema = z.object({
  activeStrategy: z.enum(strategyTypes).optional(),
  customSWR: z.number().min(1).max(10).optional(),
  bucketCashYears: z.number().min(1).max(5).optional(),
  bucketBondsYears: z.number().min(2).max(10).optional(),
  bucketEquityPercent: z.number().min(20).max(80).optional(),
  gkUpperGuardrail: z.number().min(1.1).max(1.5).optional(),
  gkLowerGuardrail: z.number().min(0.5).max(0.9).optional(),
  gkMaxIncrease: z.number().min(1.05).max(1.2).optional(),
  gkMaxDecrease: z.number().min(0.8).max(0.95).optional(),
  vpwStartAge: z.number().min(50).max(80).optional(),
  vpwEndAge: z.number().min(80).max(110).optional(),
})

// Strategy definitions with details
const strategyDefinitions = {
  SWR_4_PERCENT: {
    name: '4% Rule',
    description:
      'Withdraw 4% of initial portfolio, adjusted for inflation each year',
    initialRate: 4.0,
    flexibility: 'Low',
    complexity: 'Simple',
    bestFor: 'Simplicity seekers, traditional retirees',
    pros: ['Simple to understand and implement', 'Well-researched historical basis'],
    cons: [
      'May be too conservative in good markets',
      'May be too aggressive in India (higher inflation)',
    ],
    indiaNote: 'Consider 3-3.5% for India due to higher inflation (6-7%)',
  },
  SWR_CUSTOM: {
    name: 'Custom SWR',
    description: 'Set your own safe withdrawal rate based on your risk tolerance',
    initialRate: 3.5,
    flexibility: 'Medium',
    complexity: 'Simple',
    bestFor: 'Those who want control over their withdrawal rate',
    pros: ['Customizable to personal situation', 'Can be more conservative for India'],
    cons: ['Requires understanding of SWR concept', 'No dynamic adjustment'],
    indiaNote: 'Recommended 3-3.5% for Indian market conditions',
  },
  BUCKET: {
    name: 'Bucket Strategy',
    description:
      'Divide portfolio into time-based buckets: cash (2yr), bonds (5yr), equity (rest)',
    initialRate: 4.0,
    flexibility: 'Medium',
    complexity: 'Moderate',
    bestFor: 'Risk-averse investors, those who want peace of mind',
    pros: [
      'Psychological comfort during market downturns',
      'Clear structure for withdrawals',
    ],
    cons: [
      'Rebalancing complexity',
      'May underperform in strong markets',
    ],
    indiaNote: 'Works well with Indian FD rates for cash bucket',
  },
  VPW: {
    name: 'Variable Percentage Withdrawal',
    description:
      'Withdraw a percentage based on your age and remaining portfolio value',
    initialRate: null, // Varies by age
    flexibility: 'High',
    complexity: 'Moderate',
    bestFor: 'Flexible spenders who can adapt their lifestyle',
    pros: [
      'Adapts to portfolio performance',
      'Lower risk of depletion',
    ],
    cons: [
      'Income varies year to year',
      'Harder to budget',
    ],
    indiaNote: 'Good for those with flexible expenses',
  },
  GUYTON_KLINGER: {
    name: 'Guyton-Klinger Guardrails',
    description:
      'Dynamic withdrawal with ±20% guardrails to adjust spending based on portfolio performance',
    initialRate: 5.2,
    flexibility: 'High',
    complexity: 'Complex',
    bestFor: 'Maximizers willing to adjust spending',
    pros: [
      'Higher initial withdrawal rate possible',
      'Systematic rules for adjustments',
    ],
    cons: [
      'May require significant spending cuts',
      'Complex to implement manually',
    ],
    indiaNote: 'Consider 4.5% initial rate for India, with stricter guardrails',
  },
}

// Helper: Calculate VPW percentage by age
function calculateVPWPercentage(age: number, endAge: number = 95): number {
  const remainingYears = Math.max(1, endAge - age)
  // VPW table approximation
  return Math.min(10, Math.max(3, 100 / remainingYears))
}

// Helper: Calculate Guyton-Klinger withdrawal
function calculateGKWithdrawal(
  currentCorpus: number,
  previousWithdrawal: number,
  initialWithdrawalRate: number,
  inflation: number,
  upperGuardrail: number = 1.2,
  lowerGuardrail: number = 0.8,
  maxIncrease: number = 1.1,
  maxDecrease: number = 0.9
): {
  withdrawal: number
  adjustment: 'none' | 'increase' | 'decrease'
  newRate: number
} {
  // Inflation-adjusted withdrawal
  const inflationAdjusted = previousWithdrawal * (1 + inflation)
  const currentRate = inflationAdjusted / currentCorpus

  // Check guardrails
  if (currentRate > initialWithdrawalRate * upperGuardrail) {
    // Portfolio declined, reduce withdrawal
    const newWithdrawal = Math.max(
      previousWithdrawal * maxDecrease,
      currentCorpus * initialWithdrawalRate
    )
    return {
      withdrawal: newWithdrawal,
      adjustment: 'decrease',
      newRate: newWithdrawal / currentCorpus,
    }
  } else if (currentRate < initialWithdrawalRate * lowerGuardrail) {
    // Portfolio grew, can increase withdrawal
    const newWithdrawal = Math.min(
      inflationAdjusted * maxIncrease,
      currentCorpus * initialWithdrawalRate
    )
    return {
      withdrawal: newWithdrawal,
      adjustment: 'increase',
      newRate: newWithdrawal / currentCorpus,
    }
  }

  return {
    withdrawal: inflationAdjusted,
    adjustment: 'none',
    newRate: currentRate,
  }
}

// Helper: Calculate bucket allocation
function calculateBucketAllocation(
  annualExpenses: number,
  cashYears: number = 2,
  bondsYears: number = 5,
  equityPercent: number = 60
) {
  const cashBucket = annualExpenses * cashYears
  const bondsBucket = annualExpenses * bondsYears
  const totalFromExpenses = cashBucket + bondsBucket

  // Equity bucket is the remainder (targeting the equity percent of total)
  // Total = Cash + Bonds + Equity
  // Equity = Total * equityPercent / 100
  // Total - (Cash + Bonds) = Total * equityPercent / 100
  // Total * (1 - equityPercent/100) = Cash + Bonds
  // Total = (Cash + Bonds) / (1 - equityPercent/100)
  const totalRequired = totalFromExpenses / (1 - equityPercent / 100)
  const equityBucket = totalRequired * (equityPercent / 100)

  return {
    cashBucket,
    bondsBucket,
    equityBucket,
    totalRequired,
    allocation: {
      cash: (cashBucket / totalRequired) * 100,
      bonds: (bondsBucket / totalRequired) * 100,
      equity: equityPercent,
    },
  }
}

// GET /api/withdrawal-strategy - Get user's strategy preferences
app.get('/', async (c) => {
  const userId = c.get('userId')

  try {
    let strategy = await prisma.withdrawalStrategy.findUnique({
      where: { userId },
    })

    // If no strategy exists, create default
    if (!strategy) {
      strategy = await prisma.withdrawalStrategy.create({
        data: {
          userId,
          activeStrategy: 'SWR_CUSTOM',
          customSWR: 3.5, // India-adjusted default
        },
      })
    }

    // Get user profile for age-based calculations
    const profile = await prisma.profile.findUnique({
      where: { userId },
    })

    const age = profile?.currentAge || 50

    // Add computed fields based on strategy
    const activeStrategyInfo =
      strategyDefinitions[
        strategy.activeStrategy as keyof typeof strategyDefinitions
      ]

    // Calculate VPW if applicable
    const vpwPercent =
      strategy.activeStrategy === 'VPW'
        ? calculateVPWPercentage(
            strategy.vpwStartAge || age,
            strategy.vpwEndAge || 95
          )
        : null

    return c.json({
      ...strategy,
      strategyInfo: activeStrategyInfo,
      vpwCurrentPercent: vpwPercent,
      allStrategies: Object.entries(strategyDefinitions).map(([key, value]) => ({
        type: key,
        ...value,
      })),
    })
  } catch (error) {
    console.error('Error fetching withdrawal strategy:', error)
    return c.json(
      { success: false, error: 'Failed to fetch withdrawal strategy' },
      500
    )
  }
})

// PUT /api/withdrawal-strategy - Update strategy preferences
app.put('/', zValidator('json', updateStrategySchema), async (c) => {
  const userId = c.get('userId')
  const data = c.req.valid('json')

  try {
    const strategy = await prisma.withdrawalStrategy.upsert({
      where: { userId },
      create: {
        userId,
        ...data,
      },
      update: data,
    })

    // Invalidate FIRE metrics cache since SWR may have changed
    await prisma.fIREMetricsCache
      .update({
        where: { userId },
        data: { isStale: true },
      })
      .catch(() => {})

    return c.json(strategy)
  } catch (error) {
    console.error('Error updating withdrawal strategy:', error)
    return c.json(
      { success: false, error: 'Failed to update withdrawal strategy' },
      500
    )
  }
})

// GET /api/withdrawal-strategy/calculate - Calculate withdrawal for current strategy
app.get('/calculate', async (c) => {
  const userId = c.get('userId')

  try {
    const strategy = await prisma.withdrawalStrategy.findUnique({
      where: { userId },
    })

    if (!strategy) {
      return c.json({ success: false, error: 'No strategy configured' }, 404)
    }

    // Get FIRE metrics for calculations
    const metrics = await prisma.fIREMetricsCache.findUnique({
      where: { userId },
    })

    const profile = await prisma.profile.findUnique({
      where: { userId },
    })

    const corpus = metrics?.currentCorpus || 10000000 // Default 1 Cr
    const annualExpenses = metrics?.annualExpenses || 600000 // Default 6 L
    const age = profile?.currentAge || 50
    const inflation = 0.06 // 6%

    let result: Record<string, unknown> = {}

    switch (strategy.activeStrategy) {
      case 'SWR_4_PERCENT':
        result = {
          annualWithdrawal: corpus * 0.04,
          monthlyWithdrawal: (corpus * 0.04) / 12,
          withdrawalRate: 4,
          yearsOfCorpus: corpus / (corpus * 0.04),
        }
        break

      case 'SWR_CUSTOM':
        const customRate = strategy.customSWR / 100
        result = {
          annualWithdrawal: corpus * customRate,
          monthlyWithdrawal: (corpus * customRate) / 12,
          withdrawalRate: strategy.customSWR,
          yearsOfCorpus: corpus / (corpus * customRate),
        }
        break

      case 'BUCKET':
        const buckets = calculateBucketAllocation(
          annualExpenses,
          strategy.bucketCashYears,
          strategy.bucketBondsYears,
          strategy.bucketEquityPercent
        )
        result = {
          annualWithdrawal: annualExpenses,
          monthlyWithdrawal: annualExpenses / 12,
          buckets,
          corpusRequired: buckets.totalRequired,
          currentCoverage: (corpus / buckets.totalRequired) * 100,
        }
        break

      case 'VPW':
        const vpwPercent = calculateVPWPercentage(
          strategy.vpwStartAge || age,
          strategy.vpwEndAge || 95
        )
        result = {
          annualWithdrawal: corpus * (vpwPercent / 100),
          monthlyWithdrawal: (corpus * (vpwPercent / 100)) / 12,
          withdrawalRate: vpwPercent,
          ageUsed: strategy.vpwStartAge || age,
          endAge: strategy.vpwEndAge || 95,
        }
        break

      case 'GUYTON_KLINGER':
        const gkResult = calculateGKWithdrawal(
          corpus,
          annualExpenses, // Assuming current expenses as previous withdrawal
          strategy.customSWR / 100 || 0.045, // Default 4.5% for India
          inflation,
          strategy.gkUpperGuardrail,
          strategy.gkLowerGuardrail,
          strategy.gkMaxIncrease,
          strategy.gkMaxDecrease
        )
        result = {
          annualWithdrawal: gkResult.withdrawal,
          monthlyWithdrawal: gkResult.withdrawal / 12,
          withdrawalRate: gkResult.newRate * 100,
          adjustment: gkResult.adjustment,
          guardrails: {
            upper: strategy.gkUpperGuardrail,
            lower: strategy.gkLowerGuardrail,
            maxIncrease: strategy.gkMaxIncrease,
            maxDecrease: strategy.gkMaxDecrease,
          },
        }
        break
    }

    return c.json({
      strategy: strategy.activeStrategy,
      ...result,
    })
  } catch (error) {
    console.error('Error calculating withdrawal:', error)
    return c.json(
      { success: false, error: 'Failed to calculate withdrawal' },
      500
    )
  }
})

// GET /api/withdrawal-strategy/swr-table - Get SWR comparison table
app.get('/swr-table', async (c) => {
  const userId = c.get('userId')

  try {
    const metrics = await prisma.fIREMetricsCache.findUnique({
      where: { userId },
    })

    const annualExpenses = metrics?.annualExpenses || 600000

    // Generate SWR table from 3% to 5%
    const swrTable = [3.0, 3.25, 3.5, 3.75, 4.0, 4.25, 4.5, 4.75, 5.0].map(
      (swr) => ({
        swr,
        corpusRequired: annualExpenses / (swr / 100),
        monthlyWithdrawal: (annualExpenses / 12) * (swr / 3.5), // Relative to 3.5%
        // Approximate success rates based on historical data
        successRate30Years:
          swr <= 3.0
            ? 99
            : swr <= 3.5
              ? 97
              : swr <= 4.0
                ? 95
                : swr <= 4.5
                  ? 90
                  : 85,
        recommendation:
          swr === 3.5
            ? 'Recommended for India'
            : swr === 4.0
              ? 'Traditional US rule'
              : null,
      })
    )

    return c.json({
      annualExpenses,
      table: swrTable,
    })
  } catch (error) {
    console.error('Error generating SWR table:', error)
    return c.json({ success: false, error: 'Failed to generate SWR table' }, 500)
  }
})

export default app
