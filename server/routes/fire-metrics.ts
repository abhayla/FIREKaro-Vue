import { Hono } from 'hono'
import { prisma } from '../lib/prisma'
import { authMiddleware } from '../middleware/auth'

const app = new Hono()

// Apply auth middleware to all routes
app.use('*', authMiddleware)

// India-specific constants
const INDIA_SWR = 0.035 // 3.5% Safe Withdrawal Rate (vs US 4%)
const INDIA_INFLATION = 0.06 // 6% general inflation
const INDIA_HEALTHCARE_INFLATION = 0.08 // 8% healthcare inflation
const DEFAULT_RETURNS = 0.12 // 12% expected returns

// Helper: Calculate FIRE Number
function calculateFIRENumber(annualExpenses: number, swr: number = INDIA_SWR): number {
  return annualExpenses / swr
}

// Helper: Calculate FIRE variants
function calculateFIREVariants(annualExpenses: number, swr: number = INDIA_SWR) {
  const fireNumber = calculateFIRENumber(annualExpenses, swr)
  return {
    leanFIRE: fireNumber * 0.6, // 60% of current expenses
    regularFIRE: fireNumber, // 100% of current expenses
    fatFIRE: fireNumber * 1.5, // 150% of current expenses
  }
}

// Helper: Calculate years to FIRE
function calculateYearsToFIRE(
  currentCorpus: number,
  targetCorpus: number,
  monthlySavings: number,
  expectedReturns: number = DEFAULT_RETURNS
): number {
  if (currentCorpus >= targetCorpus) return 0
  if (monthlySavings <= 0) return Infinity

  const r = expectedReturns / 12 // Monthly return rate
  const futureValue = targetCorpus
  const presentValue = currentCorpus
  const payment = monthlySavings

  // Using future value formula to solve for n (months)
  // FV = PV(1+r)^n + PMT * ((1+r)^n - 1) / r
  // This is a transcendental equation, so we use iterative approach
  let months = 0
  let corpus = currentCorpus

  while (corpus < targetCorpus && months < 1200) {
    // Max 100 years
    corpus = corpus * (1 + r) + payment
    months++
  }

  return months / 12
}

// Helper: Calculate Coast FIRE
function calculateCoastFIRE(
  targetCorpus: number,
  yearsToRetirement: number,
  expectedReturns: number = DEFAULT_RETURNS
): number {
  // Amount needed today that will grow to target without additional contributions
  return targetCorpus / Math.pow(1 + expectedReturns, yearsToRetirement)
}

// Helper: Calculate Barista FIRE
function calculateBaristaFIRE(
  annualExpenses: number,
  partTimeMonthlyIncome: number,
  swr: number = INDIA_SWR
): { corpus: number; monthlyIncome: number } {
  // Corpus needed to cover expenses minus part-time income
  const annualShortfall = Math.max(
    0,
    annualExpenses - partTimeMonthlyIncome * 12
  )
  return {
    corpus: annualShortfall / swr,
    monthlyIncome: partTimeMonthlyIncome,
  }
}

// Helper: Calculate savings rate
function calculateSavingsRate(
  monthlyIncome: number,
  monthlySavings: number
): number {
  if (monthlyIncome <= 0) return 0
  return (monthlySavings / monthlyIncome) * 100
}

// GET /api/fire/metrics - Get all FIRE metrics for user
app.get('/', async (c) => {
  const userId = c.get('userId')

  try {
    // Check for cached metrics first
    const cached = await prisma.fIREMetricsCache.findUnique({
      where: { userId },
    })

    // If cache is fresh (less than 5 minutes old), return it
    if (
      cached &&
      !cached.isStale &&
      new Date().getTime() - cached.calculatedAt.getTime() < 5 * 60 * 1000
    ) {
      return c.json({
        fireNumber: cached.fireNumber,
        currentCorpus: cached.currentCorpus,
        progressPercent: cached.progressPercent,
        yearsToFIRE: cached.yearsToFIRE,
        monthsToFIRE: cached.monthsToFIRE,
        leanFIRE: cached.leanFIRE,
        regularFIRE: cached.regularFIRE,
        fatFIRE: cached.fatFIRE,
        coastFIRE: cached.coastFIRE,
        coastFIREAge: cached.coastFIREAge,
        baristaFIRE: cached.baristaFIRE,
        baristaFIREMonthlyIncome: cached.baristaFIREMonthlyIncome,
        annualExpenses: cached.annualExpenses,
        healthcareExpenses: cached.healthcareExpenses,
        monthlySavings: cached.monthlySavings,
        savingsRate: cached.savingsRate,
        safeWithdrawalRate: cached.safeWithdrawalRate,
        expectedReturns: cached.expectedReturns,
        inflationRate: cached.inflationRate,
        healthcareInflation: cached.healthcareInflation,
        cached: true,
        calculatedAt: cached.calculatedAt,
      })
    }

    // Get user profile for age/retirement info
    const profile = await prisma.profile.findUnique({
      where: { userId },
    })

    // Calculate current corpus from all investments
    const [
      investments,
      epfAccount,
      ppfAccounts,
      npsAccounts,
      bankAccounts,
    ] = await Promise.all([
      prisma.investment.findMany({
        where: { userId, isActive: true },
        select: { currentValue: true },
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
        select: { currentCorpus: true },
      }),
      prisma.bankAccount.findMany({
        where: { userId, isActive: true },
        select: { currentBalance: true, accountType: true },
      }),
    ])

    // Sum up current corpus
    const investmentTotal = investments.reduce(
      (sum, inv) => sum + (inv.currentValue || 0),
      0
    )
    const epfTotal = epfAccount?.currentBalance || 0
    const ppfTotal = ppfAccounts.reduce(
      (sum, acc) => sum + acc.currentBalance,
      0
    )
    const npsTotal = npsAccounts.reduce(
      (sum, acc) => sum + acc.currentCorpus,
      0
    )
    // Only count savings accounts for liquid corpus
    const savingsTotal = bankAccounts
      .filter((acc) => acc.accountType === 'SAVINGS')
      .reduce((sum, acc) => sum + acc.currentBalance, 0)

    const currentCorpus =
      investmentTotal + epfTotal + ppfTotal + npsTotal + savingsTotal

    // Get monthly expenses from last 3 months average
    const threeMonthsAgo = new Date()
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3)

    const expenses = await prisma.expense.findMany({
      where: {
        userId,
        date: { gte: threeMonthsAgo },
      },
      select: { amount: true, category: true },
    })

    const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0)
    const monthlyExpenses = totalExpenses / 3 || profile?.monthlyExpenses || 50000
    const annualExpenses = monthlyExpenses * 12

    // Separate healthcare expenses (for higher inflation calculation)
    const healthcareExpenses = expenses
      .filter((exp) =>
        ['Healthcare', 'Medical', 'Health Insurance'].includes(exp.category)
      )
      .reduce((sum, exp) => sum + exp.amount, 0)
    const monthlyHealthcare = healthcareExpenses / 3

    // Get monthly income from latest salary
    const latestSalary = await prisma.monthlySalary.findFirst({
      where: { userId },
      orderBy: [{ year: 'desc' }, { month: 'desc' }],
      select: { netSalary: true, grossSalary: true },
    })

    const monthlyIncome =
      latestSalary?.netSalary || profile?.monthlyIncome || 100000
    const monthlySavings = Math.max(0, monthlyIncome - monthlyExpenses)

    // Get user's withdrawal strategy preferences
    const withdrawalStrategy = await prisma.withdrawalStrategy.findUnique({
      where: { userId },
    })

    const swr = withdrawalStrategy?.customSWR
      ? withdrawalStrategy.customSWR / 100
      : INDIA_SWR

    // Calculate FIRE metrics
    const fireNumber = calculateFIRENumber(annualExpenses, swr)
    const progressPercent = Math.min(100, (currentCorpus / fireNumber) * 100)

    const variants = calculateFIREVariants(annualExpenses, swr)

    const yearsToFIRE = calculateYearsToFIRE(
      currentCorpus,
      fireNumber,
      monthlySavings
    )

    const currentAge = profile?.currentAge || 30
    const targetRetirementAge = profile?.targetRetirementAge || 50
    const yearsToRetirement = Math.max(0, targetRetirementAge - currentAge)

    const coastFIRE = calculateCoastFIRE(fireNumber, yearsToRetirement)
    const coastFIREAge =
      currentCorpus >= coastFIRE ? currentAge : currentAge + yearsToFIRE

    // Assume part-time income of 30% of current salary for Barista FIRE
    const partTimeIncome = monthlyIncome * 0.3
    const baristaResult = calculateBaristaFIRE(annualExpenses, partTimeIncome, swr)

    const savingsRate = calculateSavingsRate(monthlyIncome, monthlySavings)

    // Cache the results
    const metrics = {
      fireNumber,
      currentCorpus,
      progressPercent,
      yearsToFIRE: isFinite(yearsToFIRE) ? yearsToFIRE : 999,
      monthsToFIRE: isFinite(yearsToFIRE)
        ? Math.round(yearsToFIRE * 12)
        : 9999,
      leanFIRE: variants.leanFIRE,
      regularFIRE: variants.regularFIRE,
      fatFIRE: variants.fatFIRE,
      coastFIRE,
      coastFIREAge,
      baristaFIRE: baristaResult.corpus,
      baristaFIREMonthlyIncome: baristaResult.monthlyIncome,
      annualExpenses,
      healthcareExpenses: monthlyHealthcare * 12,
      monthlySavings,
      savingsRate,
      safeWithdrawalRate: swr * 100,
      expectedReturns: DEFAULT_RETURNS * 100,
      inflationRate: INDIA_INFLATION * 100,
      healthcareInflation: INDIA_HEALTHCARE_INFLATION * 100,
    }

    // Upsert cache
    await prisma.fIREMetricsCache.upsert({
      where: { userId },
      create: {
        userId,
        ...metrics,
        calculatedAt: new Date(),
        isStale: false,
      },
      update: {
        ...metrics,
        calculatedAt: new Date(),
        isStale: false,
      },
    })

    return c.json({
      ...metrics,
      cached: false,
      calculatedAt: new Date(),
    })
  } catch (error) {
    console.error('Error calculating FIRE metrics:', error)
    return c.json(
      { success: false, error: 'Failed to calculate FIRE metrics' },
      500
    )
  }
})

// POST /api/fire/metrics/invalidate - Invalidate cache
app.post('/invalidate', async (c) => {
  const userId = c.get('userId')

  try {
    await prisma.fIREMetricsCache.update({
      where: { userId },
      data: { isStale: true },
    })

    return c.json({ success: true, message: 'Cache invalidated' })
  } catch (error) {
    // Cache might not exist, which is fine
    return c.json({ success: true, message: 'No cache to invalidate' })
  }
})

export default app
