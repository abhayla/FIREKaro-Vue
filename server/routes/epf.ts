import { Hono } from 'hono'
import { prisma } from '../lib/prisma'
import { authMiddleware } from '../middleware/auth'

const app = new Hono()

// Apply auth middleware to all routes
app.use('*', authMiddleware)

// GET /api/epf - Get EPF account
app.get('/', async (c) => {
  const userId = c.get('userId')

  try {
    const epfAccount = await prisma.ePFAccount.findFirst({
      where: { userId },
      include: {
        transactions: {
          orderBy: { transactionDate: 'desc' },
          take: 12,
        },
      },
    })

    if (!epfAccount) {
      return c.json({
        success: true,
        data: null,
        message: 'No EPF account found',
      })
    }

    return c.json({ success: true, data: epfAccount })
  } catch (error) {
    console.error('Error fetching EPF account:', error)
    return c.json({ success: false, error: 'Failed to fetch EPF account' }, 500)
  }
})

// POST /api/epf - Create EPF account
app.post('/', async (c) => {
  const userId = c.get('userId')

  try {
    // Check if account already exists
    const existing = await prisma.ePFAccount.findFirst({
      where: { userId },
    })

    if (existing) {
      return c.json({ success: false, error: 'EPF account already exists' }, 400)
    }

    const body = await c.req.json()

    const epfAccount = await prisma.ePFAccount.create({
      data: {
        userId,
        uan: body.uan,
        establishmentCode: body.establishmentCode,
        accountNumber: body.accountNumber,
        currentBalance: body.currentBalance || 0,
        employeeShare: body.employeeShare || 0,
        employerShare: body.employerShare || 0,
        pensionFund: body.pensionFund || 0,
        basicSalary: body.basicSalary || 0,
        employeeContribution: body.employeeContribution || 0,
        employerEPF: body.employerEPF || 0,
        employerEPS: body.employerEPS || 0,
        vpfContribution: body.vpfContribution || 0,
        interestRate: body.interestRate || 0.0825, // 8.25% default
      },
    })

    return c.json({ success: true, data: epfAccount }, 201)
  } catch (error) {
    console.error('Error creating EPF account:', error)
    return c.json({ success: false, error: 'Failed to create EPF account' }, 500)
  }
})

// PUT /api/epf - Update EPF account
app.put('/', async (c) => {
  const userId = c.get('userId')

  try {
    const existing = await prisma.ePFAccount.findFirst({
      where: { userId },
    })

    if (!existing) {
      return c.json({ success: false, error: 'EPF account not found' }, 404)
    }

    const body = await c.req.json()

    const epfAccount = await prisma.ePFAccount.update({
      where: { id: existing.id },
      data: {
        uan: body.uan,
        establishmentCode: body.establishmentCode,
        accountNumber: body.accountNumber,
        currentBalance: body.currentBalance,
        employeeShare: body.employeeShare,
        employerShare: body.employerShare,
        pensionFund: body.pensionFund,
        basicSalary: body.basicSalary,
        employeeContribution: body.employeeContribution,
        employerEPF: body.employerEPF,
        employerEPS: body.employerEPS,
        vpfContribution: body.vpfContribution,
        interestRate: body.interestRate,
        lastUpdated: new Date(),
      },
    })

    return c.json({ success: true, data: epfAccount })
  } catch (error) {
    console.error('Error updating EPF account:', error)
    return c.json({ success: false, error: 'Failed to update EPF account' }, 500)
  }
})

// POST /api/epf/balance - Update balance manually
app.post('/balance', async (c) => {
  const userId = c.get('userId')

  try {
    const existing = await prisma.ePFAccount.findFirst({
      where: { userId },
    })

    if (!existing) {
      return c.json({ success: false, error: 'EPF account not found' }, 404)
    }

    const body = await c.req.json()

    // Update balance
    const epfAccount = await prisma.ePFAccount.update({
      where: { id: existing.id },
      data: {
        currentBalance: body.currentBalance,
        employeeShare: body.employeeShare,
        employerShare: body.employerShare,
        pensionFund: body.pensionFund,
        lastUpdated: new Date(),
      },
    })

    // Optionally create a transaction record
    if (body.createTransaction !== false) {
      await prisma.ePFTransaction.create({
        data: {
          epfAccountId: existing.id,
          transactionType: 'BALANCE_UPDATE',
          amount: body.currentBalance - existing.currentBalance,
          balance: body.currentBalance,
          description: body.description || 'Manual balance update',
          transactionDate: new Date(),
        },
      })
    }

    return c.json({ success: true, data: epfAccount })
  } catch (error) {
    console.error('Error updating EPF balance:', error)
    return c.json({ success: false, error: 'Failed to update EPF balance' }, 500)
  }
})

// GET /api/epf/contributions - Get contribution history
app.get('/contributions', async (c) => {
  const userId = c.get('userId')
  const financialYear = c.req.query('financialYear')

  try {
    const epfAccount = await prisma.ePFAccount.findFirst({
      where: { userId },
    })

    if (!epfAccount) {
      return c.json({ success: false, error: 'EPF account not found' }, 404)
    }

    const whereClause: { epfAccountId: string; transactionType?: string } = {
      epfAccountId: epfAccount.id,
    }

    // Filter by transaction type for contributions
    const transactions = await prisma.ePFTransaction.findMany({
      where: {
        ...whereClause,
        transactionType: { in: ['CONTRIBUTION', 'EMPLOYEE_CONTRIBUTION', 'EMPLOYER_CONTRIBUTION'] },
      },
      orderBy: { transactionDate: 'desc' },
    })

    // Group by financial year if needed
    const grouped = transactions.reduce(
      (acc, txn) => {
        const date = new Date(txn.transactionDate)
        const year = date.getMonth() >= 3 ? date.getFullYear() : date.getFullYear() - 1
        const fy = `${year}-${String(year + 1).slice(-2)}`

        if (!acc[fy]) {
          acc[fy] = { total: 0, transactions: [] }
        }
        acc[fy].total += txn.amount
        acc[fy].transactions.push(txn)
        return acc
      },
      {} as Record<string, { total: number; transactions: typeof transactions }>
    )

    if (financialYear && grouped[financialYear]) {
      return c.json({ success: true, data: grouped[financialYear] })
    }

    return c.json({ success: true, data: grouped })
  } catch (error) {
    console.error('Error fetching EPF contributions:', error)
    return c.json({ success: false, error: 'Failed to fetch EPF contributions' }, 500)
  }
})

// POST /api/epf/contributions - Add contribution
app.post('/contributions', async (c) => {
  const userId = c.get('userId')

  try {
    const epfAccount = await prisma.ePFAccount.findFirst({
      where: { userId },
    })

    if (!epfAccount) {
      return c.json({ success: false, error: 'EPF account not found' }, 404)
    }

    const body = await c.req.json()

    const transaction = await prisma.ePFTransaction.create({
      data: {
        epfAccountId: epfAccount.id,
        transactionType: body.transactionType || 'CONTRIBUTION',
        amount: body.amount,
        balance: epfAccount.currentBalance + body.amount,
        description: body.description,
        transactionDate: body.transactionDate || new Date(),
      },
    })

    // Update account balance
    await prisma.ePFAccount.update({
      where: { id: epfAccount.id },
      data: {
        currentBalance: { increment: body.amount },
        employeeShare:
          body.transactionType === 'EMPLOYEE_CONTRIBUTION'
            ? { increment: body.amount }
            : undefined,
        employerShare:
          body.transactionType === 'EMPLOYER_CONTRIBUTION'
            ? { increment: body.amount }
            : undefined,
        lastUpdated: new Date(),
      },
    })

    return c.json({ success: true, data: transaction }, 201)
  } catch (error) {
    console.error('Error adding EPF contribution:', error)
    return c.json({ success: false, error: 'Failed to add EPF contribution' }, 500)
  }
})

// GET /api/epf/projection - Get corpus projection
app.get('/projection', async (c) => {
  const userId = c.get('userId')
  const years = parseInt(c.req.query('years') || '20')
  const expectedReturn = parseFloat(c.req.query('expectedReturn') || '8.25') / 100

  try {
    const epfAccount = await prisma.ePFAccount.findFirst({
      where: { userId },
    })

    if (!epfAccount) {
      return c.json({ success: false, error: 'EPF account not found' }, 404)
    }

    const monthlyContribution = epfAccount.employeeContribution + epfAccount.employerEPF
    const currentBalance = epfAccount.currentBalance

    // Calculate year-by-year projection
    const projections: Array<{
      year: number
      startingBalance: number
      contributions: number
      interest: number
      endingBalance: number
    }> = []

    let balance = currentBalance

    for (let year = 1; year <= years; year++) {
      const startingBalance = balance
      const yearlyContribution = monthlyContribution * 12
      const interest = (startingBalance + yearlyContribution / 2) * expectedReturn
      balance = startingBalance + yearlyContribution + interest

      projections.push({
        year,
        startingBalance: Math.round(startingBalance),
        contributions: Math.round(yearlyContribution),
        interest: Math.round(interest),
        endingBalance: Math.round(balance),
      })
    }

    return c.json({
      success: true,
      data: {
        currentBalance,
        monthlyContribution,
        interestRate: expectedReturn * 100,
        projections,
        finalCorpus: Math.round(balance),
        totalContributions: Math.round(monthlyContribution * 12 * years),
        totalInterest: Math.round(balance - currentBalance - monthlyContribution * 12 * years),
      },
    })
  } catch (error) {
    console.error('Error calculating EPF projection:', error)
    return c.json({ success: false, error: 'Failed to calculate EPF projection' }, 500)
  }
})

// DELETE /api/epf - Delete EPF account
app.delete('/', async (c) => {
  const userId = c.get('userId')

  try {
    const existing = await prisma.ePFAccount.findFirst({
      where: { userId },
    })

    if (!existing) {
      return c.json({ success: false, error: 'EPF account not found' }, 404)
    }

    await prisma.ePFAccount.delete({
      where: { id: existing.id },
    })

    return c.json({ success: true, message: 'EPF account deleted' })
  } catch (error) {
    console.error('Error deleting EPF account:', error)
    return c.json({ success: false, error: 'Failed to delete EPF account' }, 500)
  }
})

export default app
