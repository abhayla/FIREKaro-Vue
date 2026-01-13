/**
 * Banking Routes - Bank Accounts & Emergency Fund
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
// Bank Accounts
// ============================================

const bankAccountSchema = z.object({
  bankName: z.string().min(1, 'Bank name is required'),
  accountType: z.enum(['savings', 'current', 'salary', 'fd', 'rd']),
  accountNumber: z.string().min(1, 'Account number is required'),
  balance: z.number().min(0, 'Balance must be non-negative'),
  interestRate: z.number().optional(),
  maturityDate: z.string().optional(),
  isActive: z.boolean().optional().default(true),
  isPrimary: z.boolean().optional().default(false)
})

// GET /api/banking/accounts - List all bank accounts
app.get('/accounts', async (c) => {
  const userId = c.get('userId')

  const accounts = await prisma.bankAccount.findMany({
    where: { userId },
    orderBy: [{ isPrimary: 'desc' }, { bankName: 'asc' }]
  })

  // Map to expected format
  return c.json(accounts.map(a => ({
    id: a.id,
    bankName: a.bankName,
    accountType: a.accountType.toLowerCase(),
    accountNumber: a.accountNumber,
    balance: a.currentBalance,
    interestRate: a.interestRate,
    maturityDate: a.maturityDate?.toISOString().split('T')[0],
    isActive: a.isActive,
    isPrimary: a.isPrimary,
    createdAt: a.createdAt.toISOString(),
    updatedAt: a.updatedAt.toISOString()
  })))
})

// POST /api/banking/accounts - Create bank account
app.post('/accounts', zValidator('json', bankAccountSchema), async (c) => {
  const userId = c.get('userId')
  const data = c.req.valid('json')

  // If setting as primary, unset other primary accounts
  if (data.isPrimary) {
    await prisma.bankAccount.updateMany({
      where: { userId, isPrimary: true },
      data: { isPrimary: false }
    })
  }

  const account = await prisma.bankAccount.create({
    data: {
      userId,
      accountName: `${data.bankName} ${data.accountType}`,
      bankName: data.bankName,
      accountNumber: data.accountNumber,
      accountType: data.accountType.toUpperCase(),
      currentBalance: data.balance,
      interestRate: data.interestRate,
      maturityDate: data.maturityDate ? new Date(data.maturityDate) : undefined,
      isActive: data.isActive ?? true,
      isPrimary: data.isPrimary ?? false
    }
  })

  return c.json({
    id: account.id,
    bankName: account.bankName,
    accountType: account.accountType.toLowerCase(),
    accountNumber: account.accountNumber,
    balance: account.currentBalance,
    interestRate: account.interestRate,
    maturityDate: account.maturityDate?.toISOString().split('T')[0],
    isActive: account.isActive,
    isPrimary: account.isPrimary,
    createdAt: account.createdAt.toISOString(),
    updatedAt: account.updatedAt.toISOString()
  }, 201)
})

// PUT /api/banking/accounts/:id - Update bank account
app.put('/accounts/:id', zValidator('json', bankAccountSchema.partial()), async (c) => {
  const userId = c.get('userId')
  const id = c.req.param('id')
  const data = c.req.valid('json')

  // Verify ownership
  const existing = await prisma.bankAccount.findFirst({
    where: { id, userId }
  })
  if (!existing) {
    return c.json({ error: 'Bank account not found' }, 404)
  }

  // If setting as primary, unset other primary accounts
  if (data.isPrimary) {
    await prisma.bankAccount.updateMany({
      where: { userId, isPrimary: true, id: { not: id } },
      data: { isPrimary: false }
    })
  }

  const account = await prisma.bankAccount.update({
    where: { id },
    data: {
      bankName: data.bankName,
      accountNumber: data.accountNumber,
      accountType: data.accountType?.toUpperCase(),
      currentBalance: data.balance,
      interestRate: data.interestRate,
      maturityDate: data.maturityDate ? new Date(data.maturityDate) : undefined,
      isActive: data.isActive,
      isPrimary: data.isPrimary
    }
  })

  return c.json({
    id: account.id,
    bankName: account.bankName,
    accountType: account.accountType.toLowerCase(),
    accountNumber: account.accountNumber,
    balance: account.currentBalance,
    interestRate: account.interestRate,
    maturityDate: account.maturityDate?.toISOString().split('T')[0],
    isActive: account.isActive,
    isPrimary: account.isPrimary,
    createdAt: account.createdAt.toISOString(),
    updatedAt: account.updatedAt.toISOString()
  })
})

// DELETE /api/banking/accounts/:id - Delete bank account
app.delete('/accounts/:id', async (c) => {
  const userId = c.get('userId')
  const id = c.req.param('id')

  // Verify ownership
  const existing = await prisma.bankAccount.findFirst({
    where: { id, userId }
  })
  if (!existing) {
    return c.json({ error: 'Bank account not found' }, 404)
  }

  await prisma.bankAccount.delete({ where: { id } })
  return c.json({ success: true })
})

// ============================================
// Emergency Fund
// ============================================

// GET /api/banking/emergency-fund - Get emergency fund status
app.get('/emergency-fund', async (c) => {
  const userId = c.get('userId')

  // Get or create emergency fund record
  let emergencyFund = await prisma.emergencyFund.findUnique({
    where: { userId }
  })

  // Get user's profile for monthly expenses
  const profile = await prisma.profile.findUnique({
    where: { userId }
  })

  // Get bank accounts to calculate current liquid amounts
  const bankAccounts = await prisma.bankAccount.findMany({
    where: { userId, isActive: true }
  })

  // Calculate breakdown
  const savingsAccounts = bankAccounts.filter(a =>
    ['SAVINGS', 'SALARY', 'CURRENT'].includes(a.accountType)
  )
  const fdAccounts = bankAccounts.filter(a => a.accountType === 'FD')

  const savingsAmount = savingsAccounts.reduce((sum, a) => sum + a.currentBalance, 0)
  const fdAmount = fdAccounts.reduce((sum, a) => sum + a.currentBalance, 0)

  // Get liquid mutual fund investments (if any)
  const liquidFunds = await prisma.investment.findMany({
    where: {
      userId,
      isActive: true,
      OR: [
        { type: 'LIQUID_FUND' },
        { type: 'OVERNIGHT_FUND' },
        { category: 'LIQUID' }
      ]
    }
  })
  const liquidFundAmount = liquidFunds.reduce((sum, f) => sum + f.currentValue, 0)

  const currentAmount = savingsAmount + liquidFundAmount
  const monthlyExpenses = profile?.monthlyExpenses || emergencyFund?.monthlyExpenses || 50000
  const targetMonths = emergencyFund?.targetMonths || 6
  const targetAmount = monthlyExpenses * targetMonths
  const percentComplete = targetAmount > 0 ? Math.min(100, (currentAmount / targetAmount) * 100) : 0

  // Determine status
  let status: 'critical' | 'low' | 'adequate' | 'excellent' = 'critical'
  const monthsCovered = monthlyExpenses > 0 ? currentAmount / monthlyExpenses : 0
  if (monthsCovered >= 6) status = 'excellent'
  else if (monthsCovered >= 4) status = 'adequate'
  else if (monthsCovered >= 2) status = 'low'

  // Build breakdown
  const breakdown = []
  if (savingsAmount > 0) {
    breakdown.push({
      source: 'Savings Accounts',
      type: 'savings',
      amount: savingsAmount,
      liquidity: 'instant',
      percentage: currentAmount > 0 ? (savingsAmount / (currentAmount + fdAmount)) * 100 : 0
    })
  }
  if (liquidFundAmount > 0) {
    breakdown.push({
      source: 'Liquid/Overnight Funds',
      type: 'liquid_fund',
      amount: liquidFundAmount,
      liquidity: 't+1',
      percentage: currentAmount > 0 ? (liquidFundAmount / (currentAmount + fdAmount)) * 100 : 0
    })
  }
  if (fdAmount > 0) {
    breakdown.push({
      source: 'Fixed Deposits',
      type: 'fd',
      amount: fdAmount,
      liquidity: 'breakable',
      percentage: (currentAmount + fdAmount) > 0 ? (fdAmount / (currentAmount + fdAmount)) * 100 : 0
    })
  }

  // Generate recommendations
  const recommendations: string[] = []
  if (percentComplete < 100) {
    const shortfall = targetAmount - currentAmount
    recommendations.push(`Add ₹${Math.round(shortfall).toLocaleString('en-IN')} to reach your ${targetMonths}-month target`)
  }
  if (savingsAmount < monthlyExpenses) {
    recommendations.push('Keep at least 1 month of expenses in savings for immediate access')
  }
  if (breakdown.length === 1) {
    recommendations.push('Consider diversifying into liquid funds for better returns')
  }
  if (percentComplete >= 100) {
    recommendations.push('Excellent! Your emergency fund is fully funded')
  }

  // Update or create emergency fund record
  if (!emergencyFund) {
    emergencyFund = await prisma.emergencyFund.create({
      data: {
        userId,
        targetMonths,
        monthlyExpenses,
        targetAmount,
        currentAmount,
        percentageComplete: percentComplete,
        savingsAccountAmount: savingsAmount,
        liquidFundAmount,
        fdAmount
      }
    })
  } else {
    emergencyFund = await prisma.emergencyFund.update({
      where: { userId },
      data: {
        currentAmount,
        targetAmount,
        percentageComplete: percentComplete,
        savingsAccountAmount: savingsAmount,
        liquidFundAmount,
        fdAmount
      }
    })
  }

  return c.json({
    currentAmount,
    targetAmount,
    targetMonths,
    monthlyExpenses,
    percentComplete: Math.round(percentComplete * 10) / 10,
    status,
    breakdown,
    recommendations
  })
})

export default app
