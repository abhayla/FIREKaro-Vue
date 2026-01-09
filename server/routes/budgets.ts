import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { prisma } from '../lib/prisma'
import { authMiddleware } from '../middleware/auth'

const app = new Hono()

// Apply auth middleware to all routes
app.use('*', authMiddleware)

// Validation schema for budget input
const budgetInputSchema = z.object({
  month: z.number().min(1).max(12),
  year: z.number().min(2000).max(2100),
  income: z.number().positive('Income must be positive'),
  needsPercentage: z.number().min(0).max(100).optional().default(50),
  wantsPercentage: z.number().min(0).max(100).optional().default(30),
  savingsPercentage: z.number().min(0).max(100).optional().default(20),
})

// GET /api/budgets - List budgets with optional month filter
app.get('/', async (c) => {
  const userId = c.get('userId')
  const month = c.req.query('month') // Format: YYYY-MM
  const year = c.req.query('year')

  try {
    const whereClause: {
      userId: string
      month?: number
      year?: number
    } = { userId }

    // Filter by month (YYYY-MM format)
    if (month) {
      const [yearNum, monthNum] = month.split('-').map(Number)
      whereClause.month = monthNum
      whereClause.year = yearNum
    } else if (year) {
      whereClause.year = parseInt(year)
    }

    const budgets = await prisma.budget.findMany({
      where: whereClause,
      orderBy: [{ year: 'desc' }, { month: 'desc' }],
    })

    return c.json(budgets)
  } catch (error) {
    console.error('Error fetching budgets:', error)
    return c.json({ success: false, error: 'Failed to fetch budgets' }, 500)
  }
})

// GET /api/budgets/current - Get current month's budget
app.get('/current', async (c) => {
  const userId = c.get('userId')
  const now = new Date()
  const month = now.getMonth() + 1
  const year = now.getFullYear()

  try {
    const budget = await prisma.budget.findUnique({
      where: {
        userId_month_year: { userId, month, year },
      },
    })

    if (!budget) {
      return c.json({ success: false, error: 'No budget set for current month' }, 404)
    }

    return c.json(budget)
  } catch (error) {
    console.error('Error fetching current budget:', error)
    return c.json({ success: false, error: 'Failed to fetch current budget' }, 500)
  }
})

// GET /api/budgets/:id - Get single budget
app.get('/:id', async (c) => {
  const userId = c.get('userId')
  const id = c.req.param('id')

  try {
    const budget = await prisma.budget.findFirst({
      where: { id, userId },
    })

    if (!budget) {
      return c.json({ success: false, error: 'Budget not found' }, 404)
    }

    return c.json(budget)
  } catch (error) {
    console.error('Error fetching budget:', error)
    return c.json({ success: false, error: 'Failed to fetch budget' }, 500)
  }
})

// POST /api/budgets - Create or update budget (upsert)
app.post('/', zValidator('json', budgetInputSchema), async (c) => {
  const userId = c.get('userId')
  const data = c.req.valid('json')

  // Validate percentages sum to 100
  const totalPercentage =
    (data.needsPercentage || 50) + (data.wantsPercentage || 30) + (data.savingsPercentage || 20)
  if (totalPercentage !== 100) {
    return c.json(
      { success: false, error: 'Budget percentages must sum to 100%' },
      400
    )
  }

  try {
    // Calculate limits from income and percentages
    const needsLimit = (data.income * (data.needsPercentage || 50)) / 100
    const wantsLimit = (data.income * (data.wantsPercentage || 30)) / 100
    const savingsLimit = (data.income * (data.savingsPercentage || 20)) / 100

    // Get current actuals from expenses
    const startDate = new Date(data.year, data.month - 1, 1)
    const endDate = new Date(data.year, data.month, 1)

    const expenses = await prisma.expense.findMany({
      where: {
        userId,
        date: { gte: startDate, lt: endDate },
      },
    })

    // Get category budget types
    const categories = await prisma.expenseCategory.findMany({
      where: {
        OR: [{ isSystem: true }, { userId }],
        isActive: true,
      },
    })

    const categoryTypeMap = new Map(categories.map((c) => [c.name.toLowerCase(), c.budgetType]))

    // Calculate actuals by budget type
    let needsActual = 0
    let wantsActual = 0
    let savingsActual = 0

    for (const expense of expenses) {
      const budgetType = categoryTypeMap.get(expense.category.toLowerCase()) || 'WANTS'
      switch (budgetType) {
        case 'NEEDS':
          needsActual += expense.amount
          break
        case 'SAVINGS':
          savingsActual += expense.amount
          break
        default:
          wantsActual += expense.amount
      }
    }

    // Upsert budget
    const budget = await prisma.budget.upsert({
      where: {
        userId_month_year: {
          userId,
          month: data.month,
          year: data.year,
        },
      },
      update: {
        income: data.income,
        needsLimit,
        wantsLimit,
        savingsLimit,
        needsActual,
        wantsActual,
        savingsActual,
      },
      create: {
        userId,
        month: data.month,
        year: data.year,
        income: data.income,
        needsLimit,
        wantsLimit,
        savingsLimit,
        needsActual,
        wantsActual,
        savingsActual,
      },
    })

    return c.json(budget, 201)
  } catch (error) {
    console.error('Error creating/updating budget:', error)
    return c.json({ success: false, error: 'Failed to create/update budget' }, 500)
  }
})

// PUT /api/budgets/:id - Update budget
app.put('/:id', zValidator('json', budgetInputSchema.partial()), async (c) => {
  const userId = c.get('userId')
  const id = c.req.param('id')
  const data = c.req.valid('json')

  try {
    // Check if budget exists and belongs to user
    const existing = await prisma.budget.findFirst({
      where: { id, userId },
    })

    if (!existing) {
      return c.json({ success: false, error: 'Budget not found' }, 404)
    }

    // Calculate new limits if income or percentages changed
    const income = data.income ?? existing.income
    const needsPercentage = data.needsPercentage ?? (existing.needsLimit / existing.income) * 100
    const wantsPercentage = data.wantsPercentage ?? (existing.wantsLimit / existing.income) * 100
    const savingsPercentage = data.savingsPercentage ?? (existing.savingsLimit / existing.income) * 100

    const needsLimit = (income * needsPercentage) / 100
    const wantsLimit = (income * wantsPercentage) / 100
    const savingsLimit = (income * savingsPercentage) / 100

    const budget = await prisma.budget.update({
      where: { id },
      data: {
        income,
        needsLimit,
        wantsLimit,
        savingsLimit,
      },
    })

    return c.json(budget)
  } catch (error) {
    console.error('Error updating budget:', error)
    return c.json({ success: false, error: 'Failed to update budget' }, 500)
  }
})

// DELETE /api/budgets/:id - Delete budget
app.delete('/:id', async (c) => {
  const userId = c.get('userId')
  const id = c.req.param('id')

  try {
    // Check if budget exists and belongs to user
    const existing = await prisma.budget.findFirst({
      where: { id, userId },
    })

    if (!existing) {
      return c.json({ success: false, error: 'Budget not found' }, 404)
    }

    await prisma.budget.delete({
      where: { id },
    })

    return c.json({ success: true, message: 'Budget deleted successfully' })
  } catch (error) {
    console.error('Error deleting budget:', error)
    return c.json({ success: false, error: 'Failed to delete budget' }, 500)
  }
})

export default app
