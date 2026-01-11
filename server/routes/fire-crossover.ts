import { Hono } from 'hono'
import { prisma } from '../lib/prisma'
import { authMiddleware } from '../middleware/auth'

const app = new Hono()

// Apply auth middleware to all routes
app.use('*', authMiddleware)

// India-specific constants
const INDIA_SWR = 0.035 // 3.5% Safe Withdrawal Rate
const DEFAULT_RETURNS = 0.12 // 12% expected returns
const INDIA_INFLATION = 0.06 // 6% inflation

// GET /api/fire/crossover - Get crossover point data
app.get('/', async (c) => {
  const userId = c.get('userId')

  try {
    // Get current financial data
    const [
      investments,
      epfAccount,
      ppfAccounts,
      npsAccounts,
      latestSalary,
      profile,
      withdrawalStrategy,
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
      prisma.monthlySalary.findFirst({
        where: { userId },
        orderBy: [{ year: 'desc' }, { month: 'desc' }],
        select: { netSalary: true },
      }),
      prisma.profile.findUnique({
        where: { userId },
      }),
      prisma.withdrawalStrategy.findUnique({
        where: { userId },
      }),
    ])

    // Calculate current corpus
    const currentCorpus =
      investments.reduce((sum, inv) => sum + (inv.currentValue || 0), 0) +
      (epfAccount?.currentBalance || 0) +
      ppfAccounts.reduce((sum, acc) => sum + acc.currentBalance, 0) +
      npsAccounts.reduce((sum, acc) => sum + acc.currentCorpus, 0)

    // Get monthly expenses
    const threeMonthsAgo = new Date()
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3)

    const expenses = await prisma.expense.findMany({
      where: { userId, date: { gte: threeMonthsAgo } },
      select: { amount: true },
    })

    const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0)
    const monthlyExpenses = totalExpenses / 3 || profile?.monthlyExpenses || 50000

    // Get SWR from strategy or use default
    const swr = withdrawalStrategy?.customSWR
      ? withdrawalStrategy.customSWR / 100
      : INDIA_SWR

    // Calculate monthly savings
    const monthlyIncome = latestSalary?.netSalary || profile?.monthlyIncome || 100000
    const monthlySavings = Math.max(0, monthlyIncome - monthlyExpenses)

    // Calculate passive income potential
    const currentPassiveIncome = currentCorpus * swr / 12

    // Generate projection data (month by month)
    const projectionMonths = 360 // 30 years
    const timeline: Array<{
      month: number
      year: number
      corpus: number
      passiveIncome: number
      expenses: number
      isCrossover: boolean
    }> = []

    let corpus = currentCorpus
    let monthlyExpenseInflated = monthlyExpenses
    let crossoverMonth: number | null = null
    const monthlyReturn = DEFAULT_RETURNS / 12
    const monthlyInflation = INDIA_INFLATION / 12

    for (let month = 0; month <= projectionMonths; month++) {
      const passiveIncome = corpus * swr / 12

      timeline.push({
        month,
        year: Math.floor(month / 12),
        corpus: Math.round(corpus),
        passiveIncome: Math.round(passiveIncome),
        expenses: Math.round(monthlyExpenseInflated),
        isCrossover: passiveIncome >= monthlyExpenseInflated,
      })

      // Check for crossover point
      if (crossoverMonth === null && passiveIncome >= monthlyExpenseInflated) {
        crossoverMonth = month
      }

      // Grow corpus
      corpus = corpus * (1 + monthlyReturn) + monthlySavings

      // Inflate expenses
      monthlyExpenseInflated = monthlyExpenseInflated * (1 + monthlyInflation)
    }

    // Sample timeline for chart (every 12 months)
    const chartData = timeline.filter((_, idx) => idx % 12 === 0).slice(0, 31)

    return c.json({
      currentState: {
        corpus: Math.round(currentCorpus),
        monthlyExpenses: Math.round(monthlyExpenses),
        monthlySavings: Math.round(monthlySavings),
        monthlyIncome: Math.round(monthlyIncome),
        currentPassiveIncome: Math.round(currentPassiveIncome),
        passiveIncomePercent: Math.round((currentPassiveIncome / monthlyExpenses) * 100),
      },
      crossover: crossoverMonth !== null ? {
        months: crossoverMonth,
        years: Math.round(crossoverMonth / 12 * 10) / 10,
        targetCorpus: Math.round(monthlyExpenses * 12 / swr),
        projectedDate: new Date(
          new Date().setMonth(new Date().getMonth() + crossoverMonth)
        ).toISOString().split('T')[0],
      } : null,
      parameters: {
        swr: swr * 100,
        expectedReturns: DEFAULT_RETURNS * 100,
        inflation: INDIA_INFLATION * 100,
      },
      chartData,
      calculatedAt: new Date(),
    })
  } catch (error) {
    console.error('Error calculating crossover point:', error)
    return c.json(
      { success: false, error: 'Failed to calculate crossover point' },
      500
    )
  }
})

export default app
