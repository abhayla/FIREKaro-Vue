import { Hono } from 'hono'
import { prisma } from '../lib/prisma'
import { authMiddleware } from '../middleware/auth'

const app = new Hono()

// Apply auth middleware to all routes
app.use('*', authMiddleware)

// India-specific constants
const INDIA_SWR = 0.035 // 3.5% Safe Withdrawal Rate

// Expense categories with typical order of FIRE coverage
const categoryPriority: Record<string, number> = {
  'Housing': 1,
  'Utilities': 2,
  'Groceries': 3,
  'Healthcare': 4,
  'Insurance': 5,
  'Transportation': 6,
  'Education': 7,
  'Entertainment': 8,
  'Lifestyle': 9,
  'Shopping': 10,
  'Travel': 11,
  'Other': 12,
}

// GET /api/fire/expense-coverage - Get expense category coverage analysis
app.get('/', async (c) => {
  const userId = c.get('userId')

  try {
    // Get current corpus
    const [
      investments,
      epfAccount,
      ppfAccounts,
      npsAccounts,
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
      prisma.withdrawalStrategy.findUnique({
        where: { userId },
      }),
    ])

    const currentCorpus =
      investments.reduce((sum, inv) => sum + (inv.currentValue || 0), 0) +
      (epfAccount?.currentBalance || 0) +
      ppfAccounts.reduce((sum, acc) => sum + acc.currentBalance, 0) +
      npsAccounts.reduce((sum, acc) => sum + acc.currentCorpus, 0)

    // Get SWR
    const swr = withdrawalStrategy?.customSWR
      ? withdrawalStrategy.customSWR / 100
      : INDIA_SWR

    // Calculate annual passive income
    const annualPassiveIncome = currentCorpus * swr

    // Get expenses by category (last 12 months)
    const oneYearAgo = new Date()
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1)

    const expenses = await prisma.expense.findMany({
      where: { userId, date: { gte: oneYearAgo } },
      select: { amount: true, category: true },
    })

    // Group expenses by category
    const categoryTotals: Record<string, number> = {}
    for (const expense of expenses) {
      const category = expense.category || 'Other'
      categoryTotals[category] = (categoryTotals[category] || 0) + expense.amount
    }

    // Calculate annual amounts and sort by priority
    const categories = Object.entries(categoryTotals)
      .map(([category, total]) => ({
        category,
        annualAmount: total,
        monthlyAmount: total / 12,
        priority: categoryPriority[category] || 99,
      }))
      .sort((a, b) => a.priority - b.priority)

    // Calculate cumulative coverage
    let cumulativeExpense = 0
    let cumulativelyFullyCovered = 0
    const coverageAnalysis = categories.map((cat) => {
      cumulativeExpense += cat.annualAmount
      const isCovered = annualPassiveIncome >= cumulativeExpense
      const coveragePercent = Math.min(100, (annualPassiveIncome / cumulativeExpense) * 100)

      if (isCovered) {
        cumulativelyFullyCovered++
      }

      return {
        ...cat,
        cumulativeExpense,
        isCovered,
        coveragePercent: Math.round(coveragePercent),
        status: isCovered ? 'covered' : coveragePercent >= 80 ? 'partial' : 'not_covered',
        statusColor: isCovered ? 'success' : coveragePercent >= 80 ? 'warning' : 'error',
      }
    })

    // Calculate total expense coverage
    const totalAnnualExpenses = categories.reduce((sum, cat) => sum + cat.annualAmount, 0)
    const overallCoveragePercent = Math.min(100, (annualPassiveIncome / totalAnnualExpenses) * 100)

    return c.json({
      summary: {
        currentCorpus: Math.round(currentCorpus),
        annualPassiveIncome: Math.round(annualPassiveIncome),
        monthlyPassiveIncome: Math.round(annualPassiveIncome / 12),
        totalAnnualExpenses: Math.round(totalAnnualExpenses),
        overallCoveragePercent: Math.round(overallCoveragePercent),
        categoriesCovered: cumulativelyFullyCovered,
        totalCategories: categories.length,
        swr: swr * 100,
      },
      categories: coverageAnalysis,
      insights: generateInsights(coverageAnalysis, overallCoveragePercent),
      calculatedAt: new Date(),
    })
  } catch (error) {
    console.error('Error calculating expense coverage:', error)
    return c.json(
      { success: false, error: 'Failed to calculate expense coverage' },
      500
    )
  }
})

// Helper: Generate insights based on coverage
function generateInsights(
  categories: Array<{ category: string; isCovered: boolean; coveragePercent: number }>,
  overallCoverage: number
): string[] {
  const insights: string[] = []

  if (overallCoverage >= 100) {
    insights.push('Your passive income can cover all your current expenses. You have achieved the crossover point!')
  } else if (overallCoverage >= 80) {
    insights.push(`You're ${Math.round(100 - overallCoverage)}% away from the crossover point. Stay focused!`)
  } else if (overallCoverage >= 50) {
    insights.push('You\'re halfway there! Continue building your corpus to cover more expenses.')
  } else {
    insights.push('Focus on increasing your savings rate to accelerate your FIRE journey.')
  }

  const uncoveredEssentials = categories
    .filter(c => !c.isCovered && ['Housing', 'Groceries', 'Healthcare', 'Utilities'].includes(c.category))

  if (uncoveredEssentials.length > 0) {
    insights.push(
      `Essential expenses not yet covered: ${uncoveredEssentials.map(c => c.category).join(', ')}`
    )
  }

  const coveredCategories = categories.filter(c => c.isCovered)
  if (coveredCategories.length > 0 && coveredCategories.length < categories.length) {
    insights.push(
      `Your passive income currently covers: ${coveredCategories.map(c => c.category).join(', ')}`
    )
  }

  return insights
}

export default app
