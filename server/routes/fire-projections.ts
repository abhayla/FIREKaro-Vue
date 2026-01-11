import { Hono } from 'hono'
import { prisma } from '../lib/prisma'
import { authMiddleware } from '../middleware/auth'

const app = new Hono()

// Apply auth middleware to all routes
app.use('*', authMiddleware)

// India-specific constants
const DEFAULT_RETURNS = 0.12 // 12% pre-retirement returns
const POST_RETIREMENT_RETURNS = 0.08 // 8% post-retirement (more conservative)
const INDIA_INFLATION = 0.06 // 6% general inflation
const HEALTHCARE_INFLATION = 0.08 // 8% healthcare inflation
const INDIA_SWR = 0.035 // 3.5% Safe Withdrawal Rate

// Life events that can impact projections
interface LifeEvent {
  year: number
  age: number
  event: string
  impact: number // Positive = expense, negative = income
  type: 'expense' | 'income' | 'milestone'
}

// GET /api/fire/projections - Get 100-year corpus projections
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

    // Get user parameters
    const currentAge = profile?.currentAge || 30
    const targetRetirementAge = profile?.targetRetirementAge || 50
    const monthlyIncome = latestSalary?.netSalary || profile?.monthlyIncome || 100000
    const monthlyExpenses = profile?.monthlyExpenses || 50000
    const monthlySavings = Math.max(0, monthlyIncome - monthlyExpenses)

    // Get SWR
    const swr = withdrawalStrategy?.customSWR
      ? withdrawalStrategy.customSWR / 100
      : INDIA_SWR

    // Generate 100-year projection
    const projectionYears = 70 // From current age to 100
    const endAge = Math.min(currentAge + projectionYears, 100)

    const projections: Array<{
      year: number
      age: number
      phase: 'accumulation' | 'retirement'
      corpus: number
      contributions: number
      returns: number
      withdrawals: number
      expenses: number
      events: LifeEvent[]
    }> = []

    let corpus = currentCorpus
    let annualExpenses = monthlyExpenses * 12
    let healthcareExpenses = annualExpenses * 0.1 // Assume 10% of expenses are healthcare

    // Generate life events
    const lifeEvents: LifeEvent[] = [
      { year: targetRetirementAge - currentAge, age: targetRetirementAge, event: 'FIRE achieved!', impact: 0, type: 'milestone' },
    ]

    // Add children's education if applicable (assuming kids around age 45)
    if (currentAge < 45) {
      lifeEvents.push({
        year: 45 - currentAge,
        age: 45,
        event: 'Children\'s higher education',
        impact: 2000000, // 20L
        type: 'expense',
      })
    }

    // Add children's wedding (assuming around age 55)
    if (currentAge < 55) {
      lifeEvents.push({
        year: 55 - currentAge,
        age: 55,
        event: 'Children\'s wedding',
        impact: 3000000, // 30L
        type: 'expense',
      })
    }

    // Add major healthcare expense at 70
    if (currentAge < 70) {
      lifeEvents.push({
        year: 70 - currentAge,
        age: 70,
        event: 'Increased healthcare costs',
        impact: 500000, // 5L annual increase
        type: 'expense',
      })
    }

    // Generate year-by-year projection
    for (let year = 0; year <= projectionYears; year++) {
      const age = currentAge + year
      if (age > 100) break

      const isRetired = age >= targetRetirementAge
      const returnRate = isRetired ? POST_RETIREMENT_RETURNS : DEFAULT_RETURNS

      // Get events for this year
      const yearEvents = lifeEvents.filter(e => e.year === year)

      // Calculate contributions (only before retirement)
      const contributions = isRetired ? 0 : monthlySavings * 12

      // Calculate returns
      const returns = corpus * returnRate

      // Calculate withdrawals and expenses
      let withdrawals = 0
      let yearExpenses = annualExpenses

      if (isRetired) {
        withdrawals = corpus * swr
        yearExpenses = annualExpenses
      }

      // Apply life events
      for (const event of yearEvents) {
        if (event.type === 'expense') {
          yearExpenses += event.impact
        }
      }

      projections.push({
        year,
        age,
        phase: isRetired ? 'retirement' : 'accumulation',
        corpus: Math.round(corpus),
        contributions: Math.round(contributions),
        returns: Math.round(returns),
        withdrawals: Math.round(withdrawals),
        expenses: Math.round(yearExpenses),
        events: yearEvents,
      })

      // Update corpus for next year
      corpus = corpus + returns + contributions - (isRetired ? withdrawals : 0)

      // One-time expense deductions from life events
      for (const event of yearEvents) {
        if (event.type === 'expense') {
          corpus -= event.impact
        }
      }

      // Ensure corpus doesn't go negative
      corpus = Math.max(0, corpus)

      // Inflate expenses for next year
      const nonHealthcareExpenses = (annualExpenses - healthcareExpenses) * (1 + INDIA_INFLATION)
      healthcareExpenses = healthcareExpenses * (1 + HEALTHCARE_INFLATION)
      annualExpenses = nonHealthcareExpenses + healthcareExpenses
    }

    // Find key milestones
    const fireYear = projections.find(p => p.phase === 'retirement')
    const peakCorpus = projections.reduce((max, p) => p.corpus > max.corpus ? p : max, projections[0])
    const depletionYear = projections.find(p => p.corpus <= 0)

    // Sensitivity analysis
    const sensitivityAnalysis = [
      {
        variable: 'Returns -2%',
        impact: calculateImpact(currentCorpus, monthlySavings, annualExpenses, -0.02, 0, 0, targetRetirementAge - currentAge),
        riskLevel: 'High',
      },
      {
        variable: 'Inflation +2%',
        impact: calculateImpact(currentCorpus, monthlySavings, annualExpenses, 0, 0.02, 0, targetRetirementAge - currentAge),
        riskLevel: 'Medium',
      },
      {
        variable: 'Expenses +20%',
        impact: calculateImpact(currentCorpus, monthlySavings, annualExpenses * 1.2, 0, 0, 0, targetRetirementAge - currentAge),
        riskLevel: 'High',
      },
      {
        variable: 'SIP -25%',
        impact: calculateImpact(currentCorpus, monthlySavings * 0.75, annualExpenses, 0, 0, 0, targetRetirementAge - currentAge),
        riskLevel: 'Medium',
      },
      {
        variable: 'Healthcare +50K/yr',
        impact: calculateImpact(currentCorpus, monthlySavings, annualExpenses + 50000, 0, 0, 0, targetRetirementAge - currentAge),
        riskLevel: 'Low',
      },
    ]

    return c.json({
      summary: {
        currentAge,
        targetRetirementAge,
        currentCorpus: Math.round(currentCorpus),
        fireYear: fireYear ? fireYear.year : null,
        peakCorpusAge: peakCorpus.age,
        peakCorpusAmount: peakCorpus.corpus,
        depletionAge: depletionYear?.age || null,
        projectionSuccess: !depletionYear,
      },
      parameters: {
        preRetirementReturns: DEFAULT_RETURNS * 100,
        postRetirementReturns: POST_RETIREMENT_RETURNS * 100,
        generalInflation: INDIA_INFLATION * 100,
        healthcareInflation: HEALTHCARE_INFLATION * 100,
        swr: swr * 100,
        monthlySavings: Math.round(monthlySavings),
      },
      projections,
      lifeEvents,
      sensitivityAnalysis,
      calculatedAt: new Date(),
    })
  } catch (error) {
    console.error('Error generating projections:', error)
    return c.json(
      { success: false, error: 'Failed to generate projections' },
      500
    )
  }
})

// Helper: Calculate impact of variable changes on FIRE timeline
function calculateImpact(
  currentCorpus: number,
  monthlySavings: number,
  annualExpenses: number,
  returnsDelta: number,
  inflationDelta: number,
  swrDelta: number,
  yearsToFIRE: number
): { yearsChange: number; corpusChange: number } {
  const baseReturns = DEFAULT_RETURNS
  const baseInflation = INDIA_INFLATION
  const baseSWR = INDIA_SWR

  const newReturns = baseReturns + returnsDelta
  const newInflation = baseInflation + inflationDelta
  const newSWR = baseSWR + swrDelta

  // Calculate FIRE number with new parameters
  const baseFireNumber = annualExpenses / baseSWR
  const newFireNumber = (annualExpenses * Math.pow(1 + newInflation, yearsToFIRE)) / newSWR

  // Simplified projection
  let baseCorpus = currentCorpus
  let newCorpus = currentCorpus

  for (let year = 0; year < yearsToFIRE; year++) {
    baseCorpus = baseCorpus * (1 + baseReturns) + monthlySavings * 12
    newCorpus = newCorpus * (1 + newReturns) + monthlySavings * 12
  }

  const baseYearsToFIRE = calculateYearsToTarget(currentCorpus, baseFireNumber, monthlySavings, baseReturns)
  const newYearsToFIRE = calculateYearsToTarget(currentCorpus, newFireNumber, monthlySavings, newReturns)

  return {
    yearsChange: Math.round((newYearsToFIRE - baseYearsToFIRE) * 10) / 10,
    corpusChange: Math.round(((newCorpus - baseCorpus) / baseCorpus) * 100),
  }
}

function calculateYearsToTarget(
  currentCorpus: number,
  targetCorpus: number,
  monthlySavings: number,
  returns: number
): number {
  if (currentCorpus >= targetCorpus) return 0
  if (monthlySavings <= 0) return 999

  let corpus = currentCorpus
  let months = 0
  const monthlyReturn = returns / 12

  while (corpus < targetCorpus && months < 1200) {
    corpus = corpus * (1 + monthlyReturn) + monthlySavings
    months++
  }

  return months / 12
}

export default app
