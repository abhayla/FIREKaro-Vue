import { Hono } from 'hono'
import { prisma } from '../lib/prisma'
import { authMiddleware } from '../middleware/auth'

const app = new Hono()

// Apply auth middleware to all routes
app.use('*', authMiddleware)

// GET /api/liabilities/overview - Aggregated liabilities dashboard data
app.get('/overview', async (c) => {
  const userId = c.get('userId')

  try {
    // Fetch all active loans
    const loans = await prisma.loan.findMany({
      where: { userId, status: 'ACTIVE' },
      orderBy: { nextEmiDate: 'asc' },
    })

    // Fetch all active credit cards
    const creditCards = await prisma.creditCard.findMany({
      where: { userId, isActive: true },
    })

    // Calculate loan totals
    const loansTotalOutstanding = loans.reduce((sum, l) => sum + l.outstandingAmount, 0)
    const loansMonthlyEmi = loans.reduce((sum, l) => sum + l.emiAmount, 0)
    const loansYearlyInterest = loans.reduce((sum, l) => {
      // Approximate yearly interest based on remaining balance and rate
      return sum + (l.outstandingAmount * l.interestRate / 100)
    }, 0)

    // Calculate credit card totals
    const ccTotalOutstanding = creditCards.reduce((sum, cc) => sum + cc.currentOutstanding, 0)
    const ccTotalLimit = creditCards.reduce((sum, cc) => sum + cc.creditLimit, 0)
    // Minimum due is typically 5% of outstanding or Rs 200, whichever is higher
    const ccMinimumDue = creditCards.reduce((sum, cc) => {
      const minDue = Math.max(cc.currentOutstanding * 0.05, Math.min(200, cc.currentOutstanding))
      return sum + minDue
    }, 0)

    // Total debt metrics
    const totalDebt = loansTotalOutstanding + ccTotalOutstanding
    const totalMonthlyPayment = loansMonthlyEmi + ccMinimumDue
    const yearlyInterest = loansYearlyInterest + (ccTotalOutstanding * 0.36) // Assume 36% APR avg for CC

    // Credit utilization (credit cards only)
    const creditUtilization = ccTotalLimit > 0
      ? Math.round((ccTotalOutstanding / ccTotalLimit) * 100)
      : 0

    // Calculate projected payoff date (based on largest loan)
    const longestLoan = loans.reduce((longest, loan) =>
      loan.remainingTenure > (longest?.remainingTenure || 0) ? loan : longest
    , loans[0])
    const projectedPayoffDate = longestLoan?.maturityDate?.toISOString().split('T')[0] ?? null

    // Build upcoming payments list (next 30 days)
    const today = new Date()
    const thirtyDaysFromNow = new Date(today)
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30)

    const upcomingPayments: Array<{
      id: string
      name: string
      type: 'loan' | 'credit_card'
      amount: number
      dueDate: string
      isOverdue: boolean
    }> = []

    // Add loan EMIs
    for (const loan of loans) {
      if (loan.nextEmiDate) {
        const isOverdue = loan.nextEmiDate < today
        upcomingPayments.push({
          id: loan.id,
          name: loan.loanName,
          type: 'loan',
          amount: loan.emiAmount,
          dueDate: loan.nextEmiDate.toISOString().split('T')[0],
          isOverdue,
        })
      }
    }

    // Add credit card dues
    for (const cc of creditCards) {
      if (cc.currentOutstanding > 0) {
        // Calculate next due date based on paymentDueDate
        const nextDue = new Date(today.getFullYear(), today.getMonth(), cc.paymentDueDate)
        if (nextDue < today) {
          nextDue.setMonth(nextDue.getMonth() + 1)
        }
        const isOverdue = nextDue < today

        const minDue = Math.max(cc.currentOutstanding * 0.05, Math.min(200, cc.currentOutstanding))
        upcomingPayments.push({
          id: cc.id,
          name: `${cc.bankName} ${cc.cardName}`,
          type: 'credit_card',
          amount: Math.round(minDue),
          dueDate: nextDue.toISOString().split('T')[0],
          isOverdue,
        })
      }
    }

    // Sort by due date
    upcomingPayments.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())

    // Calculate alert counts
    const overdueCount = upcomingPayments.filter(p => p.isOverdue).length
    const sevenDaysFromNow = new Date(today)
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7)
    const upcoming7Days = upcomingPayments.filter(p => {
      const dueDate = new Date(p.dueDate)
      return !p.isOverdue && dueDate <= sevenDaysFromNow
    }).length

    // High interest debts (loans > 12% or CC with balance)
    const highInterestDebts = loans.filter(l => l.interestRate > 12).length +
      creditCards.filter(cc => cc.currentOutstanding > 0).length

    // Debt-to-income ratio (placeholder - would need income data)
    // For now, assume monthly income of 1 lakh for calculation
    const assumedMonthlyIncome = 100000
    const debtToIncomeRatio = Math.round((totalMonthlyPayment / assumedMonthlyIncome) * 100)

    return c.json({
      totalDebt,
      totalMonthlyPayment,
      yearlyInterest: Math.round(yearlyInterest),
      debtToIncomeRatio,
      creditUtilization,
      projectedPayoffDate,
      debtByType: {
        loans: {
          count: loans.length,
          total: loansTotalOutstanding,
          monthlyEmi: loansMonthlyEmi,
        },
        creditCards: {
          count: creditCards.length,
          total: ccTotalOutstanding,
          minDue: Math.round(ccMinimumDue),
          utilization: creditUtilization,
        },
      },
      upcomingPayments: upcomingPayments.slice(0, 10), // Top 10 upcoming
      alerts: {
        overdueCount,
        upcoming7Days,
        highInterestDebts,
      },
    })
  } catch (error) {
    console.error('Error fetching liabilities overview:', error)
    return c.json({ success: false, error: 'Failed to fetch liabilities overview' }, 500)
  }
})

// POST /api/liabilities/generate-alerts - Generate alerts for due dates
app.post('/generate-alerts', async (c) => {
  const userId = c.get('userId')

  try {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const alerts: Array<{
      type: string
      category: string
      message: string
      dueDate: string
    }> = []

    // Check loans for upcoming EMIs
    const loans = await prisma.loan.findMany({
      where: { userId, status: 'ACTIVE' },
    })

    for (const loan of loans) {
      if (!loan.nextEmiDate) continue

      const dueDate = new Date(loan.nextEmiDate)
      dueDate.setHours(0, 0, 0, 0)
      const daysUntilDue = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

      if (daysUntilDue < 0) {
        // Overdue
        alerts.push({
          type: 'EMI_OVERDUE',
          category: 'LOAN',
          message: `${loan.loanName} EMI of ₹${loan.emiAmount.toLocaleString('en-IN')} is overdue by ${Math.abs(daysUntilDue)} day(s)`,
          dueDate: loan.nextEmiDate.toISOString().split('T')[0],
        })
      } else if (daysUntilDue === 0) {
        // Due today
        alerts.push({
          type: 'EMI_DUE_TODAY',
          category: 'LOAN',
          message: `${loan.loanName} EMI of ₹${loan.emiAmount.toLocaleString('en-IN')} is due today`,
          dueDate: loan.nextEmiDate.toISOString().split('T')[0],
        })
      } else if (daysUntilDue <= 3) {
        // Due in 3 days
        alerts.push({
          type: 'EMI_DUE_3_DAYS',
          category: 'LOAN',
          message: `${loan.loanName} EMI of ₹${loan.emiAmount.toLocaleString('en-IN')} due on ${loan.nextEmiDate.toISOString().split('T')[0]}`,
          dueDate: loan.nextEmiDate.toISOString().split('T')[0],
        })
      }
    }

    // Check credit cards
    const creditCards = await prisma.creditCard.findMany({
      where: { userId, isActive: true },
    })

    for (const cc of creditCards) {
      if (cc.currentOutstanding <= 0) continue

      // Calculate next due date
      const nextDue = new Date(today.getFullYear(), today.getMonth(), cc.paymentDueDate)
      if (nextDue < today) {
        nextDue.setMonth(nextDue.getMonth() + 1)
      }

      const daysUntilDue = Math.ceil((nextDue.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
      const minDue = Math.max(cc.currentOutstanding * 0.05, Math.min(200, cc.currentOutstanding))

      if (daysUntilDue === 0) {
        alerts.push({
          type: 'CC_DUE_TODAY',
          category: 'CREDIT_CARD',
          message: `${cc.bankName} ${cc.cardName} payment of ₹${Math.round(minDue).toLocaleString('en-IN')} is due today`,
          dueDate: nextDue.toISOString().split('T')[0],
        })
      } else if (daysUntilDue <= 5) {
        alerts.push({
          type: 'CC_DUE_5_DAYS',
          category: 'CREDIT_CARD',
          message: `${cc.bankName} ${cc.cardName} payment of ₹${Math.round(minDue).toLocaleString('en-IN')} due on ${nextDue.toISOString().split('T')[0]}`,
          dueDate: nextDue.toISOString().split('T')[0],
        })
      }

      // High utilization alert
      const utilization = cc.creditLimit > 0 ? (cc.currentOutstanding / cc.creditLimit) * 100 : 0
      if (utilization >= 70) {
        alerts.push({
          type: 'HIGH_UTILIZATION',
          category: 'CREDIT_CARD',
          message: `${cc.bankName} ${cc.cardName} credit utilization at ${Math.round(utilization)}%. Consider paying down.`,
          dueDate: today.toISOString().split('T')[0],
        })
      }
    }

    // Store alerts in AlertDelivery table
    let createdCount = 0
    for (const alert of alerts) {
      // Check if similar alert already exists today
      const existingAlert = await prisma.alertDelivery.findFirst({
        where: {
          userId,
          alertType: alert.type,
          category: alert.category,
          createdAt: { gte: today },
        },
      })

      if (!existingAlert) {
        await prisma.alertDelivery.create({
          data: {
            userId,
            alertType: alert.type,
            category: alert.category,
            percentage: 0,
            message: alert.message,
            isRead: false,
          },
        })
        createdCount++
      }
    }

    return c.json({
      success: true,
      message: `Generated ${createdCount} new alert(s)`,
      alerts,
      totalAlerts: alerts.length,
      newAlerts: createdCount,
    })
  } catch (error) {
    console.error('Error generating alerts:', error)
    return c.json({ success: false, error: 'Failed to generate alerts' }, 500)
  }
})

// GET /api/liabilities/debt-payoff-strategies - Get debt payoff strategy comparison
app.get('/debt-payoff-strategies', async (c) => {
  const userId = c.get('userId')
  const extraPayment = parseFloat(c.req.query('extraPayment') || '0')

  try {
    // Get all active debts
    const loans = await prisma.loan.findMany({
      where: { userId, status: 'ACTIVE' },
    })

    const creditCards = await prisma.creditCard.findMany({
      where: { userId, isActive: true, currentOutstanding: { gt: 0 } },
    })

    // Combine into unified debt list
    const debts = [
      ...loans.map(l => ({
        id: l.id,
        name: l.loanName,
        type: 'loan' as const,
        balance: l.outstandingAmount,
        interestRate: l.interestRate,
        minimumPayment: l.emiAmount,
      })),
      ...creditCards.map(cc => ({
        id: cc.id,
        name: `${cc.bankName} ${cc.cardName}`,
        type: 'credit_card' as const,
        balance: cc.currentOutstanding,
        interestRate: cc.interestRateAPR || 36, // Default 36% APR
        minimumPayment: Math.max(cc.currentOutstanding * 0.05, 200),
      })),
    ]

    if (debts.length === 0) {
      return c.json({
        message: 'No active debts found',
        strategies: [],
      })
    }

    // Calculate snowball strategy (smallest balance first)
    const snowballOrder = [...debts].sort((a, b) => a.balance - b.balance)
    const snowballResult = simulatePayoff(snowballOrder, extraPayment)

    // Calculate avalanche strategy (highest interest first)
    const avalancheOrder = [...debts].sort((a, b) => b.interestRate - a.interestRate)
    const avalancheResult = simulatePayoff(avalancheOrder, extraPayment)

    return c.json({
      totalDebt: debts.reduce((sum, d) => sum + d.balance, 0),
      totalMinimumPayment: debts.reduce((sum, d) => sum + d.minimumPayment, 0),
      extraPayment,
      strategies: [
        {
          name: 'avalanche',
          displayName: 'Avalanche (Highest Interest First)',
          description: 'Pay off highest interest rate debts first to minimize total interest',
          order: avalancheOrder.map(d => d.name),
          ...avalancheResult,
        },
        {
          name: 'snowball',
          displayName: 'Snowball (Smallest Balance First)',
          description: 'Pay off smallest balances first for quick wins and motivation',
          order: snowballOrder.map(d => d.name),
          ...snowballResult,
        },
      ],
      recommendation: avalancheResult.totalInterest < snowballResult.totalInterest
        ? 'avalanche'
        : 'snowball',
      interestSavings: Math.abs(avalancheResult.totalInterest - snowballResult.totalInterest),
    })
  } catch (error) {
    console.error('Error calculating payoff strategies:', error)
    return c.json({ success: false, error: 'Failed to calculate payoff strategies' }, 500)
  }
})

// Helper: Simulate debt payoff
function simulatePayoff(
  debts: Array<{
    id: string
    name: string
    balance: number
    interestRate: number
    minimumPayment: number
  }>,
  extraPayment: number
): {
  months: number
  totalInterest: number
  totalPaid: number
  payoffDate: string
} {
  // Clone debts to avoid mutation
  const debtsCopy = debts.map(d => ({ ...d, currentBalance: d.balance }))
  let months = 0
  let totalInterest = 0
  const maxMonths = 360 // 30 years max

  while (debtsCopy.some(d => d.currentBalance > 0) && months < maxMonths) {
    months++
    let availableExtra = extraPayment

    for (const debt of debtsCopy) {
      if (debt.currentBalance <= 0) continue

      // Calculate monthly interest
      const monthlyRate = debt.interestRate / 12 / 100
      const interest = debt.currentBalance * monthlyRate
      totalInterest += interest

      // Apply minimum payment
      let payment = Math.min(debt.minimumPayment, debt.currentBalance + interest)

      // Apply extra payment to first debt with balance
      if (availableExtra > 0 && debtsCopy.indexOf(debt) === debtsCopy.findIndex(d => d.currentBalance > 0)) {
        payment += availableExtra
        availableExtra = 0
      }

      debt.currentBalance = Math.max(0, debt.currentBalance + interest - payment)
    }
  }

  const totalPaid = debts.reduce((sum, d) => sum + d.balance, 0) + totalInterest
  const payoffDate = new Date()
  payoffDate.setMonth(payoffDate.getMonth() + months)

  return {
    months,
    totalInterest: Math.round(totalInterest),
    totalPaid: Math.round(totalPaid),
    payoffDate: payoffDate.toISOString().split('T')[0],
  }
}

export default app
