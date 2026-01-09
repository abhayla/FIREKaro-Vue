import { Hono } from 'hono'
import { prisma } from '../lib/prisma'
import { authMiddleware } from '../middleware/auth'

const app = new Hono()

// Apply auth middleware to all routes
app.use('*', authMiddleware)

// GET /api/liabilities/reports/debt-summary - Debt summary report data
app.get('/debt-summary', async (c) => {
  const userId = c.get('userId')
  const from = c.req.query('from')
  const to = c.req.query('to')

  try {
    const dateFilter: { gte?: Date; lte?: Date } = {}
    if (from) dateFilter.gte = new Date(from)
    if (to) dateFilter.lte = new Date(to)

    // Get all loans
    const loans = await prisma.loan.findMany({
      where: { userId },
      orderBy: { outstandingAmount: 'desc' },
    })

    // Get all credit cards
    const creditCards = await prisma.creditCard.findMany({
      where: { userId },
    })

    // Calculate totals by type
    const loansByType = loans.reduce((acc, loan) => {
      const type = loan.loanType
      if (!acc[type]) {
        acc[type] = { count: 0, principal: 0, outstanding: 0, monthlyEmi: 0 }
      }
      acc[type].count++
      acc[type].principal += loan.principalAmount
      acc[type].outstanding += loan.outstandingAmount
      acc[type].monthlyEmi += loan.emiAmount
      return acc
    }, {} as Record<string, { count: number; principal: number; outstanding: number; monthlyEmi: number }>)

    // Credit card summary
    const ccSummary = {
      count: creditCards.length,
      totalLimit: creditCards.reduce((sum, cc) => sum + cc.creditLimit, 0),
      totalOutstanding: creditCards.reduce((sum, cc) => sum + cc.currentOutstanding, 0),
      totalAvailable: creditCards.reduce((sum, cc) => sum + cc.availableLimit, 0),
      avgUtilization: creditCards.length > 0
        ? creditCards.reduce((sum, cc) =>
            sum + (cc.creditLimit > 0 ? (cc.currentOutstanding / cc.creditLimit) * 100 : 0), 0
          ) / creditCards.length
        : 0,
    }

    // Overall totals
    const totalPrincipal = loans.reduce((sum, l) => sum + l.principalAmount, 0)
    const totalOutstanding = loans.reduce((sum, l) => sum + l.outstandingAmount, 0) + ccSummary.totalOutstanding
    const totalMonthlyPayment = loans.reduce((sum, l) => sum + l.emiAmount, 0)
    const principalPaid = totalPrincipal - loans.reduce((sum, l) => sum + l.outstandingAmount, 0)

    return c.json({
      reportDate: new Date().toISOString().split('T')[0],
      period: { from: from || null, to: to || null },
      summary: {
        totalLoans: loans.length,
        totalCreditCards: creditCards.length,
        totalPrincipal,
        totalOutstanding,
        totalMonthlyPayment,
        principalPaid,
        payoffProgress: totalPrincipal > 0
          ? Math.round((principalPaid / totalPrincipal) * 100)
          : 0,
      },
      loansByType: Object.entries(loansByType).map(([type, data]) => ({
        type,
        ...data,
      })),
      creditCards: ccSummary,
      loans: loans.map(l => ({
        id: l.id,
        name: l.loanName,
        type: l.loanType,
        lender: l.lender,
        principal: l.principalAmount,
        outstanding: l.outstandingAmount,
        interestRate: l.interestRate,
        emi: l.emiAmount,
        tenure: l.tenure,
        remainingTenure: l.remainingTenure,
        status: l.status,
        maturityDate: l.maturityDate.toISOString().split('T')[0],
      })),
    })
  } catch (error) {
    console.error('Error generating debt summary:', error)
    return c.json({ success: false, error: 'Failed to generate debt summary' }, 500)
  }
})

// GET /api/liabilities/reports/payment-history - Payment history report
app.get('/payment-history', async (c) => {
  const userId = c.get('userId')
  const from = c.req.query('from')
  const to = c.req.query('to')
  const loanId = c.req.query('loanId')

  try {
    const dateFilter: { gte?: Date; lte?: Date } = {}
    if (from) dateFilter.gte = new Date(from)
    if (to) dateFilter.lte = new Date(to)

    // Get loan payments
    const payments = await prisma.loanPayment.findMany({
      where: {
        userId,
        ...(loanId && { loanId }),
        ...(Object.keys(dateFilter).length > 0 && { paymentDate: dateFilter }),
      },
      include: {
        loan: {
          select: { loanName: true, loanType: true, lender: true },
        },
      },
      orderBy: { paymentDate: 'desc' },
    })

    // Calculate statistics
    const totalPayments = payments.length
    const totalPrincipalPaid = payments.reduce((sum, p) => sum + p.principalPaid, 0)
    const totalInterestPaid = payments.reduce((sum, p) => sum + p.interestPaid, 0)
    const totalAmountPaid = payments.reduce((sum, p) => sum + p.totalPaid, 0)
    const latePayments = payments.filter(p => p.isLateFee).length
    const lateFeesPaid = payments.reduce((sum, p) => sum + p.lateFeeAmount, 0)

    // Group by month
    const byMonth = payments.reduce((acc, p) => {
      const month = p.paymentDate.toISOString().slice(0, 7)
      if (!acc[month]) {
        acc[month] = { count: 0, principal: 0, interest: 0, total: 0 }
      }
      acc[month].count++
      acc[month].principal += p.principalPaid
      acc[month].interest += p.interestPaid
      acc[month].total += p.totalPaid
      return acc
    }, {} as Record<string, { count: number; principal: number; interest: number; total: number }>)

    return c.json({
      reportDate: new Date().toISOString().split('T')[0],
      period: { from: from || null, to: to || null },
      summary: {
        totalPayments,
        totalPrincipalPaid,
        totalInterestPaid,
        totalAmountPaid,
        latePayments,
        lateFeesPaid,
        onTimeRate: totalPayments > 0
          ? Math.round(((totalPayments - latePayments) / totalPayments) * 100)
          : 100,
      },
      byMonth: Object.entries(byMonth)
        .map(([month, data]) => ({ month, ...data }))
        .sort((a, b) => b.month.localeCompare(a.month)),
      payments: payments.map(p => ({
        id: p.id,
        loanName: p.loan.loanName,
        loanType: p.loan.loanType,
        lender: p.loan.lender,
        paymentDate: p.paymentDate.toISOString().split('T')[0],
        emiNumber: p.emiNumber,
        principalPaid: p.principalPaid,
        interestPaid: p.interestPaid,
        totalPaid: p.totalPaid,
        outstandingAfter: p.outstandingAfter,
        isLateFee: p.isLateFee,
        lateFeeAmount: p.lateFeeAmount,
        paymentMode: p.paymentMode,
      })),
    })
  } catch (error) {
    console.error('Error generating payment history:', error)
    return c.json({ success: false, error: 'Failed to generate payment history' }, 500)
  }
})

// GET /api/liabilities/reports/interest-analysis - Interest breakdown report
app.get('/interest-analysis', async (c) => {
  const userId = c.get('userId')

  try {
    const loans = await prisma.loan.findMany({
      where: { userId },
      include: {
        payments: true,
      },
    })

    // Calculate interest analysis for each loan
    const loanAnalysis = loans.map(loan => {
      const totalInterestPaid = loan.payments.reduce((sum, p) => sum + p.interestPaid, 0)
      const totalPrincipalPaid = loan.payments.reduce((sum, p) => sum + p.principalPaid, 0)

      // Estimated remaining interest (simple approximation)
      const remainingMonths = loan.remainingTenure
      const avgMonthlyInterest = loan.outstandingAmount * (loan.interestRate / 12 / 100)
      const estimatedRemainingInterest = avgMonthlyInterest * remainingMonths * 0.5 // Decreasing over time

      // Total cost of loan
      const totalCost = loan.principalAmount + totalInterestPaid + estimatedRemainingInterest

      return {
        id: loan.id,
        name: loan.loanName,
        type: loan.loanType,
        lender: loan.lender,
        principal: loan.principalAmount,
        interestRate: loan.interestRate,
        interestPaid: totalInterestPaid,
        principalPaid: totalPrincipalPaid,
        estimatedRemainingInterest: Math.round(estimatedRemainingInterest),
        totalInterestCost: Math.round(totalInterestPaid + estimatedRemainingInterest),
        totalCost: Math.round(totalCost),
        interestToValueRatio: loan.principalAmount > 0
          ? Math.round(((totalInterestPaid + estimatedRemainingInterest) / loan.principalAmount) * 100)
          : 0,
      }
    })

    // Sort by interest cost (highest first)
    loanAnalysis.sort((a, b) => b.totalInterestCost - a.totalInterestCost)

    // Totals
    const totalPrincipal = loanAnalysis.reduce((sum, l) => sum + l.principal, 0)
    const totalInterestPaid = loanAnalysis.reduce((sum, l) => sum + l.interestPaid, 0)
    const totalRemainingInterest = loanAnalysis.reduce((sum, l) => sum + l.estimatedRemainingInterest, 0)
    const totalInterestCost = totalInterestPaid + totalRemainingInterest

    return c.json({
      reportDate: new Date().toISOString().split('T')[0],
      summary: {
        totalLoans: loans.length,
        totalPrincipal,
        totalInterestPaid,
        totalRemainingInterest,
        totalInterestCost,
        overallInterestRatio: totalPrincipal > 0
          ? Math.round((totalInterestCost / totalPrincipal) * 100)
          : 0,
      },
      loans: loanAnalysis,
      insights: generateInterestInsights(loanAnalysis),
    })
  } catch (error) {
    console.error('Error generating interest analysis:', error)
    return c.json({ success: false, error: 'Failed to generate interest analysis' }, 500)
  }
})

// GET /api/liabilities/reports/credit-health - Credit health metrics
app.get('/credit-health', async (c) => {
  const userId = c.get('userId')

  try {
    const creditCards = await prisma.creditCard.findMany({
      where: { userId },
      include: {
        statements: {
          orderBy: { statementDate: 'desc' },
          take: 12,
        },
      },
    })

    const loans = await prisma.loan.findMany({
      where: { userId, status: 'ACTIVE' },
    })

    // Calculate credit utilization
    const totalLimit = creditCards.reduce((sum, cc) => sum + cc.creditLimit, 0)
    const totalOutstanding = creditCards.reduce((sum, cc) => sum + cc.currentOutstanding, 0)
    const utilization = totalLimit > 0 ? (totalOutstanding / totalLimit) * 100 : 0

    // Calculate utilization by card
    const cardUtilization = creditCards.map(cc => ({
      id: cc.id,
      name: `${cc.bankName} ${cc.cardName}`,
      limit: cc.creditLimit,
      outstanding: cc.currentOutstanding,
      utilization: cc.creditLimit > 0
        ? Math.round((cc.currentOutstanding / cc.creditLimit) * 100)
        : 0,
      status: getUtilizationStatus(cc.creditLimit > 0 ? (cc.currentOutstanding / cc.creditLimit) * 100 : 0),
    }))

    // Payment history analysis
    const allStatements = creditCards.flatMap(cc => cc.statements)
    const paidStatements = allStatements.filter(s => s.isPaid)
    const onTimePayments = paidStatements.filter(s =>
      s.paidDate && s.paidDate <= s.dueDate
    ).length

    // Active accounts
    const activeAccounts = creditCards.filter(cc => cc.isActive).length + loans.length

    // Credit age (oldest account)
    const allDates = [
      ...creditCards.map(cc => cc.createdAt),
      ...loans.map(l => l.loanStartDate),
    ]
    const oldestAccount = allDates.length > 0
      ? Math.min(...allDates.map(d => d.getTime()))
      : Date.now()
    const creditAgeMonths = Math.floor((Date.now() - oldestAccount) / (1000 * 60 * 60 * 24 * 30))

    // Credit health score (simplified)
    const healthScore = calculateCreditHealthScore({
      utilization,
      onTimeRate: paidStatements.length > 0 ? (onTimePayments / paidStatements.length) * 100 : 100,
      activeAccounts,
      creditAgeMonths,
    })

    return c.json({
      reportDate: new Date().toISOString().split('T')[0],
      healthScore: {
        score: healthScore,
        rating: getHealthRating(healthScore),
        factors: [
          {
            name: 'Credit Utilization',
            value: Math.round(utilization),
            status: getUtilizationStatus(utilization),
            impact: utilization > 30 ? 'negative' : 'positive',
            recommendation: utilization > 30
              ? 'Keep utilization below 30% for best credit health'
              : 'Great! Your utilization is in the healthy range',
          },
          {
            name: 'Payment History',
            value: paidStatements.length > 0
              ? Math.round((onTimePayments / paidStatements.length) * 100)
              : 100,
            status: 'good',
            impact: 'positive',
          },
          {
            name: 'Active Accounts',
            value: activeAccounts,
            status: activeAccounts >= 2 ? 'good' : 'fair',
            impact: 'neutral',
          },
          {
            name: 'Credit Age',
            value: creditAgeMonths,
            status: creditAgeMonths >= 24 ? 'good' : creditAgeMonths >= 12 ? 'fair' : 'building',
            impact: creditAgeMonths >= 24 ? 'positive' : 'neutral',
          },
        ],
      },
      utilization: {
        overall: Math.round(utilization),
        totalLimit,
        totalOutstanding,
        status: getUtilizationStatus(utilization),
        byCard: cardUtilization,
      },
      paymentHistory: {
        totalStatements: allStatements.length,
        paidStatements: paidStatements.length,
        onTimePayments,
        onTimeRate: paidStatements.length > 0
          ? Math.round((onTimePayments / paidStatements.length) * 100)
          : 100,
      },
    })
  } catch (error) {
    console.error('Error generating credit health report:', error)
    return c.json({ success: false, error: 'Failed to generate credit health report' }, 500)
  }
})

// GET /api/liabilities/reports/export - Export report as PDF or Excel
app.get('/export', async (c) => {
  const userId = c.get('userId')
  const format = c.req.query('format') || 'json' // pdf, xlsx, json
  const reportType = c.req.query('type') || 'debt-summary'
  const from = c.req.query('from')
  const to = c.req.query('to')

  try {
    // For now, return JSON data that frontend can use to generate PDF/Excel
    // In production, you'd use libraries like jspdf or xlsx on the server

    let reportData: Record<string, unknown> = {}

    switch (reportType) {
      case 'debt-summary':
        // Fetch debt summary data
        const loans = await prisma.loan.findMany({ where: { userId } })
        const creditCards = await prisma.creditCard.findMany({ where: { userId } })
        reportData = {
          type: 'Debt Summary Report',
          generatedAt: new Date().toISOString(),
          period: { from, to },
          loans: loans.map(l => ({
            name: l.loanName,
            type: l.loanType,
            lender: l.lender,
            principal: l.principalAmount,
            outstanding: l.outstandingAmount,
            interestRate: l.interestRate,
            emi: l.emiAmount,
            status: l.status,
          })),
          creditCards: creditCards.map(cc => ({
            name: `${cc.bankName} ${cc.cardName}`,
            limit: cc.creditLimit,
            outstanding: cc.currentOutstanding,
            available: cc.availableLimit,
            utilization: cc.creditLimit > 0
              ? Math.round((cc.currentOutstanding / cc.creditLimit) * 100)
              : 0,
          })),
        }
        break

      case 'payment-history':
        const payments = await prisma.loanPayment.findMany({
          where: { userId },
          include: { loan: { select: { loanName: true } } },
          orderBy: { paymentDate: 'desc' },
        })
        reportData = {
          type: 'Payment History Report',
          generatedAt: new Date().toISOString(),
          period: { from, to },
          payments: payments.map(p => ({
            date: p.paymentDate.toISOString().split('T')[0],
            loan: p.loan.loanName,
            principal: p.principalPaid,
            interest: p.interestPaid,
            total: p.totalPaid,
            balance: p.outstandingAfter,
          })),
        }
        break

      default:
        reportData = { error: 'Unknown report type' }
    }

    // Set appropriate headers based on format
    if (format === 'json') {
      return c.json({
        success: true,
        format: 'json',
        reportType,
        data: reportData,
        exportInfo: {
          message: 'Use this data to generate PDF/Excel on the frontend',
          suggestedFilename: `liabilities-${reportType}-${new Date().toISOString().split('T')[0]}`,
        },
      })
    }

    // For PDF/Excel, we return the data with format hints
    // Frontend will use jspdf/xlsx libraries to generate the file
    return c.json({
      success: true,
      format,
      reportType,
      data: reportData,
      exportInfo: {
        message: `Generate ${format.toUpperCase()} file on frontend using provided data`,
        suggestedFilename: `liabilities-${reportType}-${new Date().toISOString().split('T')[0]}.${format}`,
      },
    })
  } catch (error) {
    console.error('Error exporting report:', error)
    return c.json({ success: false, error: 'Failed to export report' }, 500)
  }
})

// Helper: Get utilization status
function getUtilizationStatus(utilization: number): 'excellent' | 'good' | 'fair' | 'poor' | 'critical' {
  if (utilization <= 10) return 'excellent'
  if (utilization <= 30) return 'good'
  if (utilization <= 50) return 'fair'
  if (utilization <= 75) return 'poor'
  return 'critical'
}

// Helper: Calculate credit health score (0-100)
function calculateCreditHealthScore(factors: {
  utilization: number
  onTimeRate: number
  activeAccounts: number
  creditAgeMonths: number
}): number {
  let score = 0

  // Utilization (35% weight)
  if (factors.utilization <= 10) score += 35
  else if (factors.utilization <= 30) score += 30
  else if (factors.utilization <= 50) score += 20
  else if (factors.utilization <= 75) score += 10

  // Payment history (35% weight)
  score += (factors.onTimeRate / 100) * 35

  // Active accounts (15% weight)
  if (factors.activeAccounts >= 3) score += 15
  else if (factors.activeAccounts >= 2) score += 12
  else if (factors.activeAccounts >= 1) score += 8

  // Credit age (15% weight)
  if (factors.creditAgeMonths >= 60) score += 15
  else if (factors.creditAgeMonths >= 36) score += 12
  else if (factors.creditAgeMonths >= 24) score += 10
  else if (factors.creditAgeMonths >= 12) score += 6
  else score += 3

  return Math.round(score)
}

// Helper: Get health rating
function getHealthRating(score: number): 'Excellent' | 'Good' | 'Fair' | 'Poor' {
  if (score >= 80) return 'Excellent'
  if (score >= 60) return 'Good'
  if (score >= 40) return 'Fair'
  return 'Poor'
}

// Helper: Generate interest insights
function generateInterestInsights(
  loans: Array<{ name: string; interestRate: number; totalInterestCost: number }>
): string[] {
  const insights: string[] = []

  const highInterestLoans = loans.filter(l => l.interestRate > 12)
  if (highInterestLoans.length > 0) {
    insights.push(
      `You have ${highInterestLoans.length} high-interest loan(s) above 12%. Consider refinancing or prepayment.`
    )
  }

  const topInterestLoan = loans[0]
  if (topInterestLoan) {
    insights.push(
      `"${topInterestLoan.name}" has the highest interest cost of ₹${topInterestLoan.totalInterestCost.toLocaleString('en-IN')}. Prioritize prepayment.`
    )
  }

  const totalInterest = loans.reduce((sum, l) => sum + l.totalInterestCost, 0)
  if (totalInterest > 100000) {
    insights.push(
      `Total interest liability is ₹${totalInterest.toLocaleString('en-IN')}. Consider debt consolidation strategies.`
    )
  }

  return insights
}

export default app
