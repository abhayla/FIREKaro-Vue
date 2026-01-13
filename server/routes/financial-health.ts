/**
 * Financial Health Routes - Net Worth, Cash Flow, Milestones
 */
import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { prisma } from '../lib/prisma'
import { authMiddleware } from '../middleware/auth'

const app = new Hono()

// Apply auth middleware to all routes
app.use('*', authMiddleware)

// ============================================
// Net Worth
// ============================================

// GET /api/financial-health/networth - Get aggregated net worth data
app.get('/networth', async (c) => {
  const userId = c.get('userId')

  // Gather all assets
  // 1. Bank Accounts (liquid assets)
  const bankAccounts = await prisma.bankAccount.findMany({
    where: { userId, isActive: true }
  })
  const liquidAssets = bankAccounts
    .filter(a => ['SAVINGS', 'SALARY', 'CURRENT'].includes(a.accountType))
    .reduce((sum, a) => sum + a.currentBalance, 0)
  const fdAssets = bankAccounts
    .filter(a => a.accountType === 'FD')
    .reduce((sum, a) => sum + a.currentBalance, 0)
  const rdAssets = bankAccounts
    .filter(a => a.accountType === 'RD')
    .reduce((sum, a) => sum + a.currentBalance, 0)

  // 2. Investments
  const investments = await prisma.investment.findMany({
    where: { userId, isActive: true }
  })
  const equityInvestments = investments
    .filter(i => i.category === 'EQUITY' || i.type === 'STOCK' || i.type === 'EQUITY_MF')
    .reduce((sum, i) => sum + i.currentValue, 0)
  const debtInvestments = investments
    .filter(i => i.category === 'DEBT' || i.type === 'DEBT_MF' || i.type === 'LIQUID_FUND')
    .reduce((sum, i) => sum + i.currentValue, 0)
  const hybridInvestments = investments
    .filter(i => i.category === 'HYBRID')
    .reduce((sum, i) => sum + i.currentValue, 0)
  const realEstateInvestments = investments
    .filter(i => i.type === 'REAL_ESTATE' || i.category === 'REAL_ESTATE')
    .reduce((sum, i) => sum + i.currentValue, 0)
  const goldInvestments = investments
    .filter(i => i.type === 'GOLD' || i.type === 'SGB' || i.category === 'GOLD')
    .reduce((sum, i) => sum + i.currentValue, 0)

  // 3. Retirement accounts
  const epfAccount = await prisma.ePFAccount.findUnique({ where: { userId } })
  const ppfAccounts = await prisma.pPFAccount.findMany({ where: { userId, isActive: true } })
  const npsAccounts = await prisma.nPSAccount.findMany({ where: { userId } })

  const retirementAssets =
    (epfAccount?.currentBalance || 0) +
    ppfAccounts.reduce((sum, p) => sum + p.currentBalance, 0) +
    npsAccounts.reduce((sum, n) => sum + n.currentCorpus, 0)

  // 4. Rental property (from rental income records)
  const rentalProperties = await prisma.rentalIncome.findMany({ where: { userId } })
  // Estimate property value from monthly rent (rough estimate: 200x monthly rent)
  const propertyAssets = rentalProperties.reduce((sum, r) => sum + r.monthlyRent * 200, 0)

  // Total assets calculation
  const totalAssets =
    liquidAssets +
    fdAssets +
    rdAssets +
    equityInvestments +
    debtInvestments +
    hybridInvestments +
    realEstateInvestments +
    goldInvestments +
    retirementAssets +
    propertyAssets

  // Gather all liabilities
  const loans = await prisma.loan.findMany({
    where: { userId, status: 'ACTIVE' }
  })
  const creditCards = await prisma.creditCard.findMany({
    where: { userId, isActive: true }
  })

  const homeLoanLiability = loans
    .filter(l => l.loanType === 'HOME_LOAN')
    .reduce((sum, l) => sum + l.outstandingAmount, 0)
  const carLoanLiability = loans
    .filter(l => l.loanType === 'CAR_LOAN')
    .reduce((sum, l) => sum + l.outstandingAmount, 0)
  const personalLoanLiability = loans
    .filter(l => l.loanType === 'PERSONAL_LOAN')
    .reduce((sum, l) => sum + l.outstandingAmount, 0)
  const otherLoanLiability = loans
    .filter(l => !['HOME_LOAN', 'CAR_LOAN', 'PERSONAL_LOAN'].includes(l.loanType))
    .reduce((sum, l) => sum + l.outstandingAmount, 0)
  const creditCardLiability = creditCards.reduce((sum, cc) => sum + cc.currentOutstanding, 0)

  const totalLiabilities =
    homeLoanLiability +
    carLoanLiability +
    personalLoanLiability +
    otherLoanLiability +
    creditCardLiability

  const netWorth = totalAssets - totalLiabilities

  // Get historical data for trend
  const netWorthHistory = await prisma.netWorth.findMany({
    where: { userId },
    orderBy: { recordedAt: 'desc' },
    take: 12
  })

  // Calculate changes
  const lastMonth = netWorthHistory[1]
  const lastYear = netWorthHistory[11]
  const monthlyChange = lastMonth ? netWorth - lastMonth.netWorth : 0
  const yearlyChange = lastYear ? netWorth - lastYear.netWorth : 0
  const monthlyChangePercent = lastMonth && lastMonth.netWorth > 0
    ? ((netWorth - lastMonth.netWorth) / lastMonth.netWorth) * 100
    : 0
  const yearlyChangePercent = lastYear && lastYear.netWorth > 0
    ? ((netWorth - lastYear.netWorth) / lastYear.netWorth) * 100
    : 0

  // Build asset breakdown
  const assetBreakdown = []
  if (liquidAssets > 0) assetBreakdown.push({ category: 'Liquid Cash', amount: liquidAssets, percentage: (liquidAssets / totalAssets) * 100, color: '#10b981' })
  if (fdAssets + rdAssets > 0) assetBreakdown.push({ category: 'Fixed Deposits', amount: fdAssets + rdAssets, percentage: ((fdAssets + rdAssets) / totalAssets) * 100, color: '#6366f1' })
  if (equityInvestments > 0) assetBreakdown.push({ category: 'Equity', amount: equityInvestments, percentage: (equityInvestments / totalAssets) * 100, color: '#3b82f6' })
  if (debtInvestments > 0) assetBreakdown.push({ category: 'Debt Funds', amount: debtInvestments, percentage: (debtInvestments / totalAssets) * 100, color: '#8b5cf6' })
  if (hybridInvestments > 0) assetBreakdown.push({ category: 'Hybrid', amount: hybridInvestments, percentage: (hybridInvestments / totalAssets) * 100, color: '#ec4899' })
  if (retirementAssets > 0) assetBreakdown.push({ category: 'Retirement (EPF/PPF/NPS)', amount: retirementAssets, percentage: (retirementAssets / totalAssets) * 100, color: '#f59e0b' })
  if (realEstateInvestments + propertyAssets > 0) assetBreakdown.push({ category: 'Real Estate', amount: realEstateInvestments + propertyAssets, percentage: ((realEstateInvestments + propertyAssets) / totalAssets) * 100, color: '#78716c' })
  if (goldInvestments > 0) assetBreakdown.push({ category: 'Gold', amount: goldInvestments, percentage: (goldInvestments / totalAssets) * 100, color: '#fbbf24' })

  // Build liability breakdown
  const liabilityBreakdown = []
  if (homeLoanLiability > 0) liabilityBreakdown.push({ category: 'Home Loan', amount: homeLoanLiability, percentage: (homeLoanLiability / totalLiabilities) * 100, color: '#ef4444' })
  if (carLoanLiability > 0) liabilityBreakdown.push({ category: 'Car Loan', amount: carLoanLiability, percentage: (carLoanLiability / totalLiabilities) * 100, color: '#f97316' })
  if (personalLoanLiability > 0) liabilityBreakdown.push({ category: 'Personal Loan', amount: personalLoanLiability, percentage: (personalLoanLiability / totalLiabilities) * 100, color: '#eab308' })
  if (creditCardLiability > 0) liabilityBreakdown.push({ category: 'Credit Cards', amount: creditCardLiability, percentage: (creditCardLiability / totalLiabilities) * 100, color: '#dc2626' })
  if (otherLoanLiability > 0) liabilityBreakdown.push({ category: 'Other Loans', amount: otherLoanLiability, percentage: (otherLoanLiability / totalLiabilities) * 100, color: '#9ca3af' })

  // Build history for chart
  const history = netWorthHistory.reverse().map(h => ({
    date: h.recordedAt.toISOString().split('T')[0],
    netWorth: h.netWorth,
    assets: h.totalAssets,
    liabilities: h.liabilities
  }))

  // Save current snapshot if it's a new month
  const now = new Date()
  const thisMonthSnapshot = netWorthHistory.find(h =>
    h.recordedAt.getMonth() === now.getMonth() &&
    h.recordedAt.getFullYear() === now.getFullYear()
  )
  if (!thisMonthSnapshot) {
    await prisma.netWorth.create({
      data: {
        userId,
        liquid: liquidAssets,
        equity: equityInvestments,
        fixed: fdAssets + rdAssets + debtInvestments,
        property: realEstateInvestments + propertyAssets,
        other: goldInvestments + hybridInvestments + retirementAssets,
        liabilities: totalLiabilities,
        totalAssets,
        netWorth
      }
    })
  }

  return c.json({
    totalAssets,
    totalLiabilities,
    netWorth,
    monthlyChange,
    yearlyChange,
    monthlyChangePercent: Math.round(monthlyChangePercent * 100) / 100,
    yearlyChangePercent: Math.round(yearlyChangePercent * 100) / 100,
    assetBreakdown,
    liabilityBreakdown,
    history
  })
})

// ============================================
// Cash Flow
// ============================================

// GET /api/financial-health/cash-flow - Get monthly cash flow data
app.get('/cash-flow', async (c) => {
  const userId = c.get('userId')
  const monthParam = c.req.query('month')

  // Default to current month
  const now = new Date()
  const targetDate = monthParam ? new Date(monthParam) : now
  const month = targetDate.getMonth() + 1
  const year = targetDate.getFullYear()

  // Get salary income
  const salaries = await prisma.monthlySalary.findMany({
    where: {
      userId,
      year,
      month: month <= 3 ? month + 9 : month - 3 // Convert calendar month to FY month
    }
  })
  const salaryIncome = salaries.reduce((sum, s) => sum + s.netSalary, 0)

  // Get business income (monthly average from FY)
  const businessIncomes = await prisma.businessIncome.findMany({ where: { userId } })
  const businessIncome = businessIncomes.reduce((sum, b) => sum + b.deemedProfit, 0) / 12

  // Get rental income
  const rentalIncomes = await prisma.rentalIncome.findMany({ where: { userId } })
  const rentalIncome = rentalIncomes.reduce((sum, r) => sum + r.monthlyRent, 0)

  // Get other income (monthly average)
  const otherIncomes = await prisma.otherIncome.findMany({ where: { userId } })
  const otherIncome = otherIncomes.reduce((sum, o) => sum + o.grossAmount, 0) / 12

  // Get dividend income (monthly average)
  const dividendIncomes = await prisma.dividendIncome.findMany({ where: { userId } })
  const dividendIncome = dividendIncomes.reduce((sum, d) => sum + d.dividendAmount, 0) / 12

  // Get interest income (monthly average)
  const interestIncomes = await prisma.interestIncome.findMany({ where: { userId } })
  const interestIncome = interestIncomes.reduce((sum, i) => sum + i.interestEarned, 0) / 12

  const totalIncome = salaryIncome + businessIncome + rentalIncome + otherIncome + dividendIncome + interestIncome

  // Get expenses for the month
  const startOfMonth = new Date(year, month - 1, 1)
  const endOfMonth = new Date(year, month, 0)

  const expenses = await prisma.expense.findMany({
    where: {
      userId,
      date: {
        gte: startOfMonth,
        lte: endOfMonth
      }
    }
  })

  // Get budget for expense categorization
  const budget = await prisma.budget.findFirst({
    where: { userId, month, year }
  })

  // Categorize expenses
  const needsCategories = ['Housing', 'Utilities', 'Groceries', 'Healthcare', 'Insurance', 'Transportation', 'Education']
  const needsExpenses = expenses.filter(e => needsCategories.some(c => e.category.toLowerCase().includes(c.toLowerCase())))
  const wantsExpenses = expenses.filter(e => !needsCategories.some(c => e.category.toLowerCase().includes(c.toLowerCase())))

  const needsTotal = needsExpenses.reduce((sum, e) => sum + e.amount, 0)
  const wantsTotal = wantsExpenses.reduce((sum, e) => sum + e.amount, 0)
  const totalExpenses = needsTotal + wantsTotal

  // Calculate EMI payments (not double-counting as expenses)
  const loans = await prisma.loan.findMany({
    where: { userId, status: 'ACTIVE' }
  })
  const totalEmi = loans.reduce((sum, l) => sum + l.emiAmount, 0)

  const netCashFlow = totalIncome - totalExpenses
  const savingsRate = totalIncome > 0 ? (netCashFlow / totalIncome) * 100 : 0

  // Build income breakdown
  const incomeBreakdown = []
  if (salaryIncome > 0) incomeBreakdown.push({ category: 'Salary', amount: salaryIncome, percentage: (salaryIncome / totalIncome) * 100, color: '#3b82f6' })
  if (businessIncome > 0) incomeBreakdown.push({ category: 'Business', amount: businessIncome, percentage: (businessIncome / totalIncome) * 100, color: '#10b981' })
  if (rentalIncome > 0) incomeBreakdown.push({ category: 'Rental', amount: rentalIncome, percentage: (rentalIncome / totalIncome) * 100, color: '#78716c' })
  if (dividendIncome > 0) incomeBreakdown.push({ category: 'Dividends', amount: dividendIncome, percentage: (dividendIncome / totalIncome) * 100, color: '#8b5cf6' })
  if (interestIncome > 0) incomeBreakdown.push({ category: 'Interest', amount: interestIncome, percentage: (interestIncome / totalIncome) * 100, color: '#f59e0b' })
  if (otherIncome > 0) incomeBreakdown.push({ category: 'Other', amount: otherIncome, percentage: (otherIncome / totalIncome) * 100, color: '#6b7280' })

  // Build expense breakdown by category
  const expensesByCategory: Record<string, number> = {}
  expenses.forEach(e => {
    expensesByCategory[e.category] = (expensesByCategory[e.category] || 0) + e.amount
  })

  const expenseColors = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#14b8a6', '#3b82f6', '#8b5cf6', '#ec4899']
  const expenseBreakdown = Object.entries(expensesByCategory)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([category, amount], index) => ({
      category,
      amount,
      percentage: totalExpenses > 0 ? (amount / totalExpenses) * 100 : 0,
      color: expenseColors[index % expenseColors.length]
    }))

  // Get monthly trend (last 6 months)
  const monthlyTrend = []
  for (let i = 5; i >= 0; i--) {
    const trendDate = new Date(year, month - 1 - i, 1)
    const trendMonth = trendDate.getMonth() + 1
    const trendYear = trendDate.getFullYear()

    const snapshot = await prisma.monthlyFinancialSnapshot.findFirst({
      where: {
        userId,
        month: trendMonth,
        year: trendYear
      }
    })

    monthlyTrend.push({
      month: trendDate.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' }),
      income: snapshot?.totalIncome || 0,
      expenses: snapshot?.totalExpenses || 0,
      savings: snapshot?.monthlySavings || 0
    })
  }

  // Update current month snapshot
  await prisma.monthlyFinancialSnapshot.upsert({
    where: {
      userId_financialYear_month: {
        userId,
        financialYear: month <= 3 ? `${year - 1}-${String(year).slice(2)}` : `${year}-${String(year + 1).slice(2)}`,
        month: month <= 3 ? month + 9 : month - 3
      }
    },
    create: {
      userId,
      financialYear: month <= 3 ? `${year - 1}-${String(year).slice(2)}` : `${year}-${String(year + 1).slice(2)}`,
      month: month <= 3 ? month + 9 : month - 3,
      year,
      totalIncome,
      salaryIncome,
      businessIncome,
      rentalIncome,
      otherIncome: otherIncome + dividendIncome + interestIncome,
      totalExpenses,
      essentialExpenses: needsTotal,
      discretionaryExpenses: wantsTotal,
      emiPayments: totalEmi,
      monthlySavings: netCashFlow,
      savingsRate,
      isActual: true
    },
    update: {
      totalIncome,
      salaryIncome,
      businessIncome,
      rentalIncome,
      otherIncome: otherIncome + dividendIncome + interestIncome,
      totalExpenses,
      essentialExpenses: needsTotal,
      discretionaryExpenses: wantsTotal,
      emiPayments: totalEmi,
      monthlySavings: netCashFlow,
      savingsRate,
      isActual: true
    }
  })

  return c.json({
    totalIncome,
    totalExpenses,
    netCashFlow,
    savingsRate: Math.round(savingsRate * 10) / 10,
    incomeBreakdown,
    expenseBreakdown,
    monthlyTrend
  })
})

// ============================================
// Milestones
// ============================================

const milestoneSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  targetAmount: z.number().positive('Target amount must be positive')
})

// GET /api/financial-health/milestones - List all milestones
app.get('/milestones', async (c) => {
  const userId = c.get('userId')

  // Since NetWorthMilestone doesn't exist in schema yet, use FinancialGoal as a workaround
  // with goalType = 'NET_WORTH_MILESTONE'
  const milestones = await prisma.financialGoal.findMany({
    where: {
      userId,
      goalType: 'NET_WORTH_MILESTONE'
    },
    orderBy: { targetAmount: 'asc' }
  })

  // Get current net worth to check achievements
  const netWorthRecords = await prisma.netWorth.findMany({
    where: { userId },
    orderBy: { recordedAt: 'desc' },
    take: 1
  })
  const currentNetWorth = netWorthRecords[0]?.netWorth || 0

  return c.json(milestones.map(m => ({
    id: m.id,
    userId: m.userId,
    name: m.goalName,
    targetAmount: m.targetAmount,
    isAchieved: currentNetWorth >= m.targetAmount || m.status === 'ACHIEVED',
    achievedDate: m.status === 'ACHIEVED' ? m.updatedAt.toISOString().split('T')[0] : undefined,
    createdAt: m.createdAt.toISOString()
  })))
})

// POST /api/financial-health/milestones - Create milestone
app.post('/milestones', zValidator('json', milestoneSchema), async (c) => {
  const userId = c.get('userId')
  const data = c.req.valid('json')

  const milestone = await prisma.financialGoal.create({
    data: {
      userId,
      goalName: data.name,
      goalType: 'NET_WORTH_MILESTONE',
      targetAmount: data.targetAmount,
      targetDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year default
      status: 'IN_PROGRESS'
    }
  })

  return c.json({
    id: milestone.id,
    userId: milestone.userId,
    name: milestone.goalName,
    targetAmount: milestone.targetAmount,
    isAchieved: false,
    createdAt: milestone.createdAt.toISOString()
  }, 201)
})

// PUT /api/financial-health/milestones/:id - Update milestone
app.put('/milestones/:id', zValidator('json', milestoneSchema.partial()), async (c) => {
  const userId = c.get('userId')
  const id = c.req.param('id')
  const data = c.req.valid('json')

  const existing = await prisma.financialGoal.findFirst({
    where: { id, userId, goalType: 'NET_WORTH_MILESTONE' }
  })
  if (!existing) {
    return c.json({ error: 'Milestone not found' }, 404)
  }

  const milestone = await prisma.financialGoal.update({
    where: { id },
    data: {
      goalName: data.name,
      targetAmount: data.targetAmount
    }
  })

  return c.json({
    id: milestone.id,
    userId: milestone.userId,
    name: milestone.goalName,
    targetAmount: milestone.targetAmount,
    isAchieved: milestone.status === 'ACHIEVED',
    achievedDate: milestone.status === 'ACHIEVED' ? milestone.updatedAt.toISOString().split('T')[0] : undefined,
    createdAt: milestone.createdAt.toISOString()
  })
})

// DELETE /api/financial-health/milestones/:id - Delete milestone
app.delete('/milestones/:id', async (c) => {
  const userId = c.get('userId')
  const id = c.req.param('id')

  const existing = await prisma.financialGoal.findFirst({
    where: { id, userId, goalType: 'NET_WORTH_MILESTONE' }
  })
  if (!existing) {
    return c.json({ error: 'Milestone not found' }, 404)
  }

  await prisma.financialGoal.delete({ where: { id } })
  return c.json({ success: true })
})

export default app
