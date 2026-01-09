import { Hono } from 'hono'
import { prisma } from '../lib/prisma'
import { authMiddleware } from '../middleware/auth'

const app = new Hono()

// Apply auth middleware to all routes
app.use('*', authMiddleware)

// Helper to calculate financial year
function getFinancialYear(date: Date): string {
  const month = date.getMonth()
  const year = date.getFullYear()
  const startYear = month >= 3 ? year : year - 1
  return `${startYear}-${String(startYear + 1).slice(-2)}`
}

// Helper to get account year (years since opening)
function getAccountYear(openingDate: Date): number {
  const now = new Date()
  const years = Math.floor((now.getTime() - openingDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000))
  return Math.max(1, years + 1)
}

// GET /api/ppf - List all PPF accounts
app.get('/', async (c) => {
  const userId = c.get('userId')

  try {
    const ppfAccounts = await prisma.pPFAccount.findMany({
      where: { userId },
      include: {
        transactions: {
          orderBy: { transactionDate: 'desc' },
          take: 12,
        },
      },
    })

    return c.json({ success: true, data: ppfAccounts })
  } catch (error) {
    console.error('Error fetching PPF accounts:', error)
    return c.json({ success: false, error: 'Failed to fetch PPF accounts' }, 500)
  }
})

// GET /api/ppf/:id - Get single PPF account
app.get('/:id', async (c) => {
  const userId = c.get('userId')
  const id = c.req.param('id')

  try {
    const ppfAccount = await prisma.pPFAccount.findFirst({
      where: { id, userId },
      include: {
        transactions: {
          orderBy: { transactionDate: 'desc' },
        },
      },
    })

    if (!ppfAccount) {
      return c.json({ success: false, error: 'PPF account not found' }, 404)
    }

    // Add computed fields
    const accountYear = getAccountYear(ppfAccount.openingDate)
    const canWithdraw = accountYear >= 7
    const canTakeLoan = accountYear >= 3 && accountYear <= 6

    return c.json({
      success: true,
      data: {
        ...ppfAccount,
        accountYear,
        canWithdraw,
        canTakeLoan,
        yearsToMaturity: Math.max(0, 15 - accountYear),
      },
    })
  } catch (error) {
    console.error('Error fetching PPF account:', error)
    return c.json({ success: false, error: 'Failed to fetch PPF account' }, 500)
  }
})

// POST /api/ppf - Create PPF account
app.post('/', async (c) => {
  const userId = c.get('userId')

  try {
    const body = await c.req.json()

    const openingDate = new Date(body.openingDate)
    const maturityDate = new Date(openingDate)
    maturityDate.setFullYear(maturityDate.getFullYear() + 15)

    const ppfAccount = await prisma.pPFAccount.create({
      data: {
        userId,
        accountNumber: body.accountNumber,
        bankName: body.bankName,
        branchName: body.branchName,
        openingDate,
        maturityDate,
        currentBalance: body.currentBalance || 0,
        interestRate: body.interestRate || 0.071, // 7.1% default
        totalDeposited: body.totalDeposited || body.currentBalance || 0,
        nomineeName: body.nomineeName,
        nomineeRelation: body.nomineeRelation,
      },
    })

    // Create initial deposit transaction if balance provided
    if (body.currentBalance && body.currentBalance > 0) {
      await prisma.pPFTransaction.create({
        data: {
          ppfAccountId: ppfAccount.id,
          transactionType: 'DEPOSIT',
          amount: body.currentBalance,
          balance: body.currentBalance,
          financialYear: getFinancialYear(openingDate),
          description: 'Initial deposit',
          transactionDate: openingDate,
        },
      })
    }

    return c.json({ success: true, data: ppfAccount }, 201)
  } catch (error) {
    console.error('Error creating PPF account:', error)
    return c.json({ success: false, error: 'Failed to create PPF account' }, 500)
  }
})

// PUT /api/ppf/:id - Update PPF account
app.put('/:id', async (c) => {
  const userId = c.get('userId')
  const id = c.req.param('id')

  try {
    const existing = await prisma.pPFAccount.findFirst({
      where: { id, userId },
    })

    if (!existing) {
      return c.json({ success: false, error: 'PPF account not found' }, 404)
    }

    const body = await c.req.json()

    const ppfAccount = await prisma.pPFAccount.update({
      where: { id },
      data: {
        accountNumber: body.accountNumber,
        bankName: body.bankName,
        branchName: body.branchName,
        currentBalance: body.currentBalance,
        interestRate: body.interestRate,
        totalDeposited: body.totalDeposited,
        totalInterestEarned: body.totalInterestEarned,
        nomineeName: body.nomineeName,
        nomineeRelation: body.nomineeRelation,
        lastUpdated: new Date(),
      },
    })

    return c.json({ success: true, data: ppfAccount })
  } catch (error) {
    console.error('Error updating PPF account:', error)
    return c.json({ success: false, error: 'Failed to update PPF account' }, 500)
  }
})

// DELETE /api/ppf/:id - Delete PPF account
app.delete('/:id', async (c) => {
  const userId = c.get('userId')
  const id = c.req.param('id')

  try {
    const existing = await prisma.pPFAccount.findFirst({
      where: { id, userId },
    })

    if (!existing) {
      return c.json({ success: false, error: 'PPF account not found' }, 404)
    }

    await prisma.pPFAccount.delete({
      where: { id },
    })

    return c.json({ success: true, message: 'PPF account deleted' })
  } catch (error) {
    console.error('Error deleting PPF account:', error)
    return c.json({ success: false, error: 'Failed to delete PPF account' }, 500)
  }
})

// POST /api/ppf/:id/deposit - Make a deposit
app.post('/:id/deposit', async (c) => {
  const userId = c.get('userId')
  const id = c.req.param('id')

  try {
    const ppfAccount = await prisma.pPFAccount.findFirst({
      where: { id, userId },
    })

    if (!ppfAccount) {
      return c.json({ success: false, error: 'PPF account not found' }, 404)
    }

    const body = await c.req.json()
    const amount = body.amount
    const transactionDate = new Date(body.transactionDate || new Date())
    const financialYear = getFinancialYear(transactionDate)

    // Check annual limit (Rs 1.5 Lakh)
    const yearDeposits = await prisma.pPFTransaction.aggregate({
      where: {
        ppfAccountId: id,
        transactionType: 'DEPOSIT',
        financialYear,
      },
      _sum: { amount: true },
    })

    const currentYearDeposit = (yearDeposits._sum.amount || 0) + amount
    if (currentYearDeposit > 150000) {
      return c.json({
        success: false,
        error: `Annual deposit limit exceeded. You can deposit up to Rs ${150000 - (yearDeposits._sum.amount || 0)} more this year.`,
      }, 400)
    }

    const newBalance = ppfAccount.currentBalance + amount

    const transaction = await prisma.pPFTransaction.create({
      data: {
        ppfAccountId: id,
        transactionType: 'DEPOSIT',
        amount,
        balance: newBalance,
        financialYear,
        description: body.description,
        transactionDate,
        depositMonth: transactionDate.getMonth() + 1,
      },
    })

    await prisma.pPFAccount.update({
      where: { id },
      data: {
        currentBalance: newBalance,
        totalDeposited: { increment: amount },
        currentYearDeposit,
        lastUpdated: new Date(),
      },
    })

    return c.json({ success: true, data: transaction }, 201)
  } catch (error) {
    console.error('Error making PPF deposit:', error)
    return c.json({ success: false, error: 'Failed to make PPF deposit' }, 500)
  }
})

// GET /api/ppf/:id/withdrawal-eligibility - Check withdrawal eligibility
app.get('/:id/withdrawal-eligibility', async (c) => {
  const userId = c.get('userId')
  const id = c.req.param('id')

  try {
    const ppfAccount = await prisma.pPFAccount.findFirst({
      where: { id, userId },
      include: {
        transactions: {
          where: { transactionType: 'DEPOSIT' },
          orderBy: { transactionDate: 'asc' },
        },
      },
    })

    if (!ppfAccount) {
      return c.json({ success: false, error: 'PPF account not found' }, 404)
    }

    const accountYear = getAccountYear(ppfAccount.openingDate)
    const isEligible = accountYear >= 7

    if (!isEligible) {
      return c.json({
        success: true,
        data: {
          isEligible: false,
          accountYear,
          yearsUntilEligible: 7 - accountYear,
          message: `Partial withdrawal allowed from 7th year. You are in year ${accountYear}.`,
        },
      })
    }

    // Calculate eligible amount: 50% of balance at end of 4th preceding year
    // For simplicity, we'll use a portion of current balance
    const eligibleAmount = Math.floor(ppfAccount.currentBalance * 0.5)

    return c.json({
      success: true,
      data: {
        isEligible: true,
        accountYear,
        eligibleAmount,
        currentBalance: ppfAccount.currentBalance,
        totalWithdrawn: ppfAccount.totalWithdrawn,
        message: 'You are eligible for partial withdrawal (50% of balance at end of 4th preceding year)',
      },
    })
  } catch (error) {
    console.error('Error checking withdrawal eligibility:', error)
    return c.json({ success: false, error: 'Failed to check withdrawal eligibility' }, 500)
  }
})

// POST /api/ppf/:id/withdraw - Make partial withdrawal
app.post('/:id/withdraw', async (c) => {
  const userId = c.get('userId')
  const id = c.req.param('id')

  try {
    const ppfAccount = await prisma.pPFAccount.findFirst({
      where: { id, userId },
    })

    if (!ppfAccount) {
      return c.json({ success: false, error: 'PPF account not found' }, 404)
    }

    const accountYear = getAccountYear(ppfAccount.openingDate)
    if (accountYear < 7) {
      return c.json({
        success: false,
        error: `Partial withdrawal not allowed before 7th year. You are in year ${accountYear}.`,
      }, 400)
    }

    const body = await c.req.json()
    const amount = body.amount
    const eligibleAmount = Math.floor(ppfAccount.currentBalance * 0.5)

    if (amount > eligibleAmount) {
      return c.json({
        success: false,
        error: `Maximum withdrawal amount is Rs ${eligibleAmount}`,
      }, 400)
    }

    const transactionDate = new Date(body.transactionDate || new Date())
    const newBalance = ppfAccount.currentBalance - amount

    const transaction = await prisma.pPFTransaction.create({
      data: {
        ppfAccountId: id,
        transactionType: 'PARTIAL_WITHDRAWAL',
        amount: -amount,
        balance: newBalance,
        financialYear: getFinancialYear(transactionDate),
        description: body.description || 'Partial withdrawal',
        transactionDate,
        eligibleAmount,
      },
    })

    await prisma.pPFAccount.update({
      where: { id },
      data: {
        currentBalance: newBalance,
        totalWithdrawn: { increment: amount },
        lastUpdated: new Date(),
      },
    })

    return c.json({ success: true, data: transaction }, 201)
  } catch (error) {
    console.error('Error making PPF withdrawal:', error)
    return c.json({ success: false, error: 'Failed to make PPF withdrawal' }, 500)
  }
})

// GET /api/ppf/:id/loan-eligibility - Check loan eligibility
app.get('/:id/loan-eligibility', async (c) => {
  const userId = c.get('userId')
  const id = c.req.param('id')

  try {
    const ppfAccount = await prisma.pPFAccount.findFirst({
      where: { id, userId },
    })

    if (!ppfAccount) {
      return c.json({ success: false, error: 'PPF account not found' }, 404)
    }

    const accountYear = getAccountYear(ppfAccount.openingDate)
    const isEligible = accountYear >= 3 && accountYear <= 6

    if (!isEligible) {
      return c.json({
        success: true,
        data: {
          isEligible: false,
          accountYear,
          message:
            accountYear < 3
              ? `Loan facility available from 3rd year. You are in year ${accountYear}.`
              : `Loan facility not available after 6th year. You are in year ${accountYear}. Consider partial withdrawal instead.`,
        },
      })
    }

    // Max loan: 25% of balance at end of 2nd preceding year
    const maxLoanAmount = Math.floor(ppfAccount.currentBalance * 0.25)
    const existingLoan = ppfAccount.loanOutstanding
    const availableLoan = maxLoanAmount - existingLoan

    return c.json({
      success: true,
      data: {
        isEligible: true,
        accountYear,
        maxLoanAmount,
        existingLoan,
        availableLoan,
        loanInterestRate: (ppfAccount.interestRate + 0.01) * 100, // PPF rate + 1%
        currentBalance: ppfAccount.currentBalance,
        message: 'You are eligible for a PPF loan (25% of balance at end of 2nd preceding year)',
      },
    })
  } catch (error) {
    console.error('Error checking loan eligibility:', error)
    return c.json({ success: false, error: 'Failed to check loan eligibility' }, 500)
  }
})

// POST /api/ppf/:id/loan - Take loan
app.post('/:id/loan', async (c) => {
  const userId = c.get('userId')
  const id = c.req.param('id')

  try {
    const ppfAccount = await prisma.pPFAccount.findFirst({
      where: { id, userId },
    })

    if (!ppfAccount) {
      return c.json({ success: false, error: 'PPF account not found' }, 404)
    }

    const accountYear = getAccountYear(ppfAccount.openingDate)
    if (accountYear < 3 || accountYear > 6) {
      return c.json({
        success: false,
        error: `Loan facility only available from 3rd to 6th year. You are in year ${accountYear}.`,
      }, 400)
    }

    const body = await c.req.json()
    const amount = body.amount
    const maxLoanAmount = Math.floor(ppfAccount.currentBalance * 0.25)
    const availableLoan = maxLoanAmount - ppfAccount.loanOutstanding

    if (amount > availableLoan) {
      return c.json({
        success: false,
        error: `Maximum available loan is Rs ${availableLoan}`,
      }, 400)
    }

    const transactionDate = new Date(body.transactionDate || new Date())
    const loanDueDate = new Date(transactionDate)
    loanDueDate.setMonth(loanDueDate.getMonth() + 36) // 3 years to repay

    const transaction = await prisma.pPFTransaction.create({
      data: {
        ppfAccountId: id,
        transactionType: 'LOAN_TAKEN',
        amount,
        balance: ppfAccount.currentBalance, // Balance doesn't change, loan is separate
        financialYear: getFinancialYear(transactionDate),
        description: body.description || 'PPF Loan',
        transactionDate,
        loanYear: accountYear,
        loanDueDate,
      },
    })

    await prisma.pPFAccount.update({
      where: { id },
      data: {
        loanTaken: { increment: amount },
        loanOutstanding: { increment: amount },
        lastUpdated: new Date(),
      },
    })

    return c.json({ success: true, data: transaction }, 201)
  } catch (error) {
    console.error('Error taking PPF loan:', error)
    return c.json({ success: false, error: 'Failed to take PPF loan' }, 500)
  }
})

// POST /api/ppf/:id/loan-repay - Repay loan
app.post('/:id/loan-repay', async (c) => {
  const userId = c.get('userId')
  const id = c.req.param('id')

  try {
    const ppfAccount = await prisma.pPFAccount.findFirst({
      where: { id, userId },
    })

    if (!ppfAccount) {
      return c.json({ success: false, error: 'PPF account not found' }, 404)
    }

    if (ppfAccount.loanOutstanding <= 0) {
      return c.json({ success: false, error: 'No outstanding loan to repay' }, 400)
    }

    const body = await c.req.json()
    const amount = Math.min(body.amount, ppfAccount.loanOutstanding)
    const transactionDate = new Date(body.transactionDate || new Date())

    const transaction = await prisma.pPFTransaction.create({
      data: {
        ppfAccountId: id,
        transactionType: 'LOAN_REPAID',
        amount: -amount,
        balance: ppfAccount.currentBalance,
        financialYear: getFinancialYear(transactionDate),
        description: body.description || 'PPF Loan Repayment',
        transactionDate,
      },
    })

    await prisma.pPFAccount.update({
      where: { id },
      data: {
        loanOutstanding: { decrement: amount },
        lastUpdated: new Date(),
      },
    })

    return c.json({ success: true, data: transaction }, 201)
  } catch (error) {
    console.error('Error repaying PPF loan:', error)
    return c.json({ success: false, error: 'Failed to repay PPF loan' }, 500)
  }
})

// GET /api/ppf/:id/projection - Get maturity projection
app.get('/:id/projection', async (c) => {
  const userId = c.get('userId')
  const id = c.req.param('id')
  const yearlyDeposit = parseFloat(c.req.query('yearlyDeposit') || '150000')

  try {
    const ppfAccount = await prisma.pPFAccount.findFirst({
      where: { id, userId },
    })

    if (!ppfAccount) {
      return c.json({ success: false, error: 'PPF account not found' }, 404)
    }

    const accountYear = getAccountYear(ppfAccount.openingDate)
    const yearsRemaining = Math.max(0, 15 - accountYear)
    const interestRate = ppfAccount.interestRate

    // Year-by-year projection
    const projections: Array<{
      year: number
      fyYear: string
      openingBalance: number
      deposit: number
      interest: number
      closingBalance: number
    }> = []

    let balance = ppfAccount.currentBalance
    const currentDate = new Date()
    let fyStartYear = currentDate.getMonth() >= 3 ? currentDate.getFullYear() : currentDate.getFullYear() - 1

    for (let i = 1; i <= yearsRemaining; i++) {
      const openingBalance = balance
      const deposit = yearlyDeposit
      // PPF interest is calculated on minimum balance between 5th of each month
      // Simplified: interest on (opening + deposit/2)
      const interest = (openingBalance + deposit) * interestRate
      balance = openingBalance + deposit + interest

      projections.push({
        year: accountYear + i,
        fyYear: `${fyStartYear + i}-${String(fyStartYear + i + 1).slice(-2)}`,
        openingBalance: Math.round(openingBalance),
        deposit: Math.round(deposit),
        interest: Math.round(interest),
        closingBalance: Math.round(balance),
      })
    }

    return c.json({
      success: true,
      data: {
        currentBalance: ppfAccount.currentBalance,
        accountYear,
        yearsRemaining,
        maturityDate: ppfAccount.maturityDate,
        interestRate: interestRate * 100,
        assumedYearlyDeposit: yearlyDeposit,
        projections,
        maturityAmount: Math.round(balance),
        totalDeposits: Math.round(ppfAccount.totalDeposited + yearlyDeposit * yearsRemaining),
        totalInterest: Math.round(
          balance - ppfAccount.currentBalance - yearlyDeposit * yearsRemaining
        ),
      },
    })
  } catch (error) {
    console.error('Error calculating PPF projection:', error)
    return c.json({ success: false, error: 'Failed to calculate PPF projection' }, 500)
  }
})

// POST /api/ppf/:id/extend - Extend PPF after maturity
app.post('/:id/extend', async (c) => {
  const userId = c.get('userId')
  const id = c.req.param('id')

  try {
    const ppfAccount = await prisma.pPFAccount.findFirst({
      where: { id, userId },
    })

    if (!ppfAccount) {
      return c.json({ success: false, error: 'PPF account not found' }, 404)
    }

    const accountYear = getAccountYear(ppfAccount.openingDate)
    if (accountYear < 15) {
      return c.json({
        success: false,
        error: `Account has not matured yet. You are in year ${accountYear} of 15.`,
      }, 400)
    }

    const body = await c.req.json()
    const extensionType = body.extensionType || 'WITH_CONTRIBUTION'

    const newExtensionEndDate = new Date(ppfAccount.extensionEndDate || ppfAccount.maturityDate)
    newExtensionEndDate.setFullYear(newExtensionEndDate.getFullYear() + 5)

    await prisma.pPFAccount.update({
      where: { id },
      data: {
        isExtended: true,
        extensionType,
        extensionEndDate: newExtensionEndDate,
        extensionCount: { increment: 1 },
        lastUpdated: new Date(),
      },
    })

    return c.json({
      success: true,
      data: {
        message: `PPF account extended for 5 more years ${extensionType === 'WITH_CONTRIBUTION' ? 'with' : 'without'} contribution facility`,
        extensionEndDate: newExtensionEndDate,
        extensionCount: ppfAccount.extensionCount + 1,
      },
    })
  } catch (error) {
    console.error('Error extending PPF account:', error)
    return c.json({ success: false, error: 'Failed to extend PPF account' }, 500)
  }
})

// GET /api/ppf/:id/transactions - Get all transactions
app.get('/:id/transactions', async (c) => {
  const userId = c.get('userId')
  const id = c.req.param('id')
  const financialYear = c.req.query('financialYear')

  try {
    const ppfAccount = await prisma.pPFAccount.findFirst({
      where: { id, userId },
    })

    if (!ppfAccount) {
      return c.json({ success: false, error: 'PPF account not found' }, 404)
    }

    const whereClause: { ppfAccountId: string; financialYear?: string } = {
      ppfAccountId: id,
    }
    if (financialYear) {
      whereClause.financialYear = financialYear
    }

    const transactions = await prisma.pPFTransaction.findMany({
      where: whereClause,
      orderBy: { transactionDate: 'desc' },
    })

    return c.json({ success: true, data: transactions })
  } catch (error) {
    console.error('Error fetching PPF transactions:', error)
    return c.json({ success: false, error: 'Failed to fetch PPF transactions' }, 500)
  }
})

export default app
