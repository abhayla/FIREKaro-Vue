import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { prisma } from '../lib/prisma'
import { authMiddleware } from '../middleware/auth'

const app = new Hono()

// Apply auth middleware to all routes
app.use('*', authMiddleware)

// Payment method enum matching Prisma schema
const PaymentMethodEnum = z.enum([
  'UPI',
  'CREDIT_CARD',
  'DEBIT_CARD',
  'CASH',
  'NET_BANKING',
  'WALLET',
  'OTHER',
])

// Validation schema for expense input
const expenseInputSchema = z.object({
  amount: z.number().positive('Amount must be positive'),
  description: z.string().min(1, 'Description is required'),
  category: z.string().min(1, 'Category is required'),
  subcategory: z.string().optional().nullable(),
  date: z.string().transform((val) => new Date(val)),
  merchant: z.string().optional().nullable(),
  paymentMethod: PaymentMethodEnum.optional().default('OTHER'),
  tags: z.array(z.string()).optional().default([]),
  isRecurring: z.boolean().optional().default(false),
  receiptUrl: z.string().url().optional().nullable(),
  notes: z.string().optional().nullable(),
  familyMemberId: z.string().optional().nullable(),
})

// GET /api/expenses - List expenses with optional filters
app.get('/', async (c) => {
  const userId = c.get('userId')
  const month = c.req.query('month') // Format: YYYY-MM
  const category = c.req.query('category')
  const familyMemberId = c.req.query('familyMemberId')

  try {
    const whereClause: {
      userId: string
      date?: { gte: Date; lt: Date }
      category?: string
      familyMemberId?: string | null
    } = { userId }

    // Filter by month (YYYY-MM format)
    if (month) {
      const [year, monthNum] = month.split('-').map(Number)
      const startDate = new Date(year, monthNum - 1, 1)
      const endDate = new Date(year, monthNum, 1)
      whereClause.date = { gte: startDate, lt: endDate }
    }

    if (category) {
      whereClause.category = category
    }

    if (familyMemberId) {
      whereClause.familyMemberId = familyMemberId
    }

    const expenses = await prisma.expense.findMany({
      where: whereClause,
      orderBy: { date: 'desc' },
    })

    // Transform for frontend (date to ISO string, paymentMethod to string)
    const transformedExpenses = expenses.map((expense) => ({
      ...expense,
      date: expense.date.toISOString().split('T')[0],
      paymentMethod: expense.paymentMethod,
    }))

    return c.json(transformedExpenses)
  } catch (error) {
    console.error('Error fetching expenses:', error)
    return c.json({ success: false, error: 'Failed to fetch expenses' }, 500)
  }
})

// GET /api/expenses/:id - Get single expense
app.get('/:id', async (c) => {
  const userId = c.get('userId')
  const id = c.req.param('id')

  try {
    const expense = await prisma.expense.findFirst({
      where: { id, userId },
    })

    if (!expense) {
      return c.json({ success: false, error: 'Expense not found' }, 404)
    }

    return c.json({
      ...expense,
      date: expense.date.toISOString().split('T')[0],
    })
  } catch (error) {
    console.error('Error fetching expense:', error)
    return c.json({ success: false, error: 'Failed to fetch expense' }, 500)
  }
})

// POST /api/expenses - Create expense
app.post('/', zValidator('json', expenseInputSchema), async (c) => {
  const userId = c.get('userId')
  const data = c.req.valid('json')

  try {
    const expense = await prisma.expense.create({
      data: {
        userId,
        amount: data.amount,
        description: data.description,
        category: data.category,
        subcategory: data.subcategory || null,
        date: data.date,
        merchant: data.merchant || null,
        paymentMethod: data.paymentMethod || 'OTHER',
        tags: data.tags || [],
        isRecurring: data.isRecurring || false,
        receiptUrl: data.receiptUrl || null,
        notes: data.notes || null,
        familyMemberId: data.familyMemberId || null,
      },
    })

    // Update budget actuals if budget exists for this month
    await updateBudgetActuals(userId, expense.date)

    // Check for budget alerts (non-blocking)
    checkBudgetAlerts(userId, expense.date).catch((err) =>
      console.error('Error checking alerts:', err)
    )

    return c.json(
      {
        ...expense,
        date: expense.date.toISOString().split('T')[0],
      },
      201
    )
  } catch (error) {
    console.error('Error creating expense:', error)
    return c.json({ success: false, error: 'Failed to create expense' }, 500)
  }
})

// PUT /api/expenses/:id - Update expense
app.put('/:id', zValidator('json', expenseInputSchema.partial()), async (c) => {
  const userId = c.get('userId')
  const id = c.req.param('id')
  const data = c.req.valid('json')

  try {
    // Check if expense exists and belongs to user
    const existing = await prisma.expense.findFirst({
      where: { id, userId },
    })

    if (!existing) {
      return c.json({ success: false, error: 'Expense not found' }, 404)
    }

    const expense = await prisma.expense.update({
      where: { id },
      data: {
        ...(data.amount !== undefined && { amount: data.amount }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.category !== undefined && { category: data.category }),
        ...(data.subcategory !== undefined && { subcategory: data.subcategory }),
        ...(data.date !== undefined && { date: data.date }),
        ...(data.merchant !== undefined && { merchant: data.merchant }),
        ...(data.paymentMethod !== undefined && { paymentMethod: data.paymentMethod }),
        ...(data.tags !== undefined && { tags: data.tags }),
        ...(data.isRecurring !== undefined && { isRecurring: data.isRecurring }),
        ...(data.receiptUrl !== undefined && { receiptUrl: data.receiptUrl }),
        ...(data.notes !== undefined && { notes: data.notes }),
        ...(data.familyMemberId !== undefined && { familyMemberId: data.familyMemberId }),
      },
    })

    // Update budget actuals for both old and new dates if date changed
    await updateBudgetActuals(userId, expense.date)
    if (data.date && existing.date.getTime() !== expense.date.getTime()) {
      await updateBudgetActuals(userId, existing.date)
    }

    // Check for budget alerts (non-blocking)
    checkBudgetAlerts(userId, expense.date).catch((err) =>
      console.error('Error checking alerts:', err)
    )

    return c.json({
      ...expense,
      date: expense.date.toISOString().split('T')[0],
    })
  } catch (error) {
    console.error('Error updating expense:', error)
    return c.json({ success: false, error: 'Failed to update expense' }, 500)
  }
})

// DELETE /api/expenses/:id - Delete expense
app.delete('/:id', async (c) => {
  const userId = c.get('userId')
  const id = c.req.param('id')

  try {
    // Check if expense exists and belongs to user
    const existing = await prisma.expense.findFirst({
      where: { id, userId },
    })

    if (!existing) {
      return c.json({ success: false, error: 'Expense not found' }, 404)
    }

    await prisma.expense.delete({
      where: { id },
    })

    // Update budget actuals
    await updateBudgetActuals(userId, existing.date)

    // Check for budget alerts (non-blocking) - deleting may bring us under threshold
    checkBudgetAlerts(userId, existing.date).catch((err) =>
      console.error('Error checking alerts:', err)
    )

    return c.json({ success: true, message: 'Expense deleted successfully' })
  } catch (error) {
    console.error('Error deleting expense:', error)
    return c.json({ success: false, error: 'Failed to delete expense' }, 500)
  }
})

// GET /api/expenses/categories - List expense categories
app.get('/categories', async (c) => {
  const userId = c.get('userId')

  try {
    // Get system categories and user custom categories
    const categories = await prisma.expenseCategory.findMany({
      where: {
        OR: [{ isSystem: true }, { userId }],
        isActive: true,
      },
      orderBy: [{ isSystem: 'desc' }, { displayOrder: 'asc' }, { name: 'asc' }],
    })

    // If no categories exist, return default categories
    if (categories.length === 0) {
      return c.json(getDefaultCategories())
    }

    return c.json(categories)
  } catch (error) {
    console.error('Error fetching categories:', error)
    // Return default categories on error
    return c.json(getDefaultCategories())
  }
})

// Helper function to check and create budget alerts
async function checkBudgetAlerts(userId: string, date: Date): Promise<void> {
  const month = date.getMonth() + 1
  const year = date.getFullYear()

  try {
    // Get user's alert preferences
    const preferences = await prisma.alertPreference.findUnique({
      where: { userId },
    })

    if (!preferences?.budgetAlerts) return

    const threshold = preferences.alertThreshold || 80

    // Get current month's budget
    const budget = await prisma.budget.findUnique({
      where: {
        userId_month_year: { userId, month, year },
      },
    })

    if (!budget) return

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // Helper to create alert if needed
    const createAlertIfNeeded = async (
      alertType: string,
      category: string,
      percentage: number,
      message: string
    ) => {
      // Check if similar alert already exists today
      const existingAlert = await prisma.alertDelivery.findFirst({
        where: {
          userId,
          alertType,
          category,
          createdAt: { gte: today },
        },
      })

      if (!existingAlert) {
        await prisma.alertDelivery.create({
          data: { userId, alertType, category, percentage, message },
        })
      }
    }

    // Check Needs budget
    const needsUsage = budget.needsLimit > 0 ? (budget.needsActual / budget.needsLimit) * 100 : 0
    if (needsUsage >= threshold && needsUsage < 100) {
      await createAlertIfNeeded(
        'BUDGET_WARNING',
        'Needs',
        needsUsage,
        `Needs spending is at ${needsUsage.toFixed(0)}% of budget`
      )
    } else if (needsUsage >= 100 && preferences.overspendAlerts) {
      await createAlertIfNeeded(
        'BUDGET_EXCEEDED',
        'Needs',
        needsUsage,
        `Needs budget exceeded! Spending at ${needsUsage.toFixed(0)}%`
      )
    }

    // Check Wants budget
    const wantsUsage = budget.wantsLimit > 0 ? (budget.wantsActual / budget.wantsLimit) * 100 : 0
    if (wantsUsage >= threshold && wantsUsage < 100) {
      await createAlertIfNeeded(
        'BUDGET_WARNING',
        'Wants',
        wantsUsage,
        `Wants spending is at ${wantsUsage.toFixed(0)}% of budget`
      )
    } else if (wantsUsage >= 100 && preferences.overspendAlerts) {
      await createAlertIfNeeded(
        'BUDGET_EXCEEDED',
        'Wants',
        wantsUsage,
        `Wants budget exceeded! Spending at ${wantsUsage.toFixed(0)}%`
      )
    }
  } catch (error) {
    console.error('Error checking budget alerts:', error)
    // Don't throw - this is a side effect
  }
}

// Helper function to update budget actuals when expenses change
async function updateBudgetActuals(userId: string, date: Date): Promise<void> {
  const month = date.getMonth() + 1
  const year = date.getFullYear()

  try {
    // Check if budget exists for this month
    const budget = await prisma.budget.findUnique({
      where: {
        userId_month_year: { userId, month, year },
      },
    })

    if (!budget) return

    // Get categories to determine budget type (needs/wants/savings)
    const categories = await prisma.expenseCategory.findMany({
      where: {
        OR: [{ isSystem: true }, { userId }],
        isActive: true,
      },
    })

    const categoryTypeMap = new Map(categories.map((c) => [c.name.toLowerCase(), c.budgetType]))

    // Get all expenses for this month
    const startDate = new Date(year, month - 1, 1)
    const endDate = new Date(year, month, 1)

    const expenses = await prisma.expense.findMany({
      where: {
        userId,
        date: { gte: startDate, lt: endDate },
      },
    })

    // Calculate totals by budget type
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

    // Update budget
    await prisma.budget.update({
      where: {
        userId_month_year: { userId, month, year },
      },
      data: { needsActual, wantsActual, savingsActual },
    })
  } catch (error) {
    console.error('Error updating budget actuals:', error)
    // Don't throw - this is a side effect
  }
}

// Default expense categories
function getDefaultCategories() {
  return [
    { id: 'food', name: 'Food & Dining', icon: 'mdi-food', color: '#FF6B6B', budgetType: 'NEEDS', subcategories: ['Groceries', 'Restaurants', 'Takeout', 'Coffee'] },
    { id: 'transport', name: 'Transportation', icon: 'mdi-car', color: '#4ECDC4', budgetType: 'NEEDS', subcategories: ['Fuel', 'Public Transit', 'Uber/Ola', 'Parking'] },
    { id: 'utilities', name: 'Utilities', icon: 'mdi-flash', color: '#FFE66D', budgetType: 'NEEDS', subcategories: ['Electricity', 'Water', 'Gas', 'Internet', 'Phone'] },
    { id: 'housing', name: 'Housing', icon: 'mdi-home', color: '#95E1D3', budgetType: 'NEEDS', subcategories: ['Rent', 'Maintenance', 'Repairs', 'Society Fees'] },
    { id: 'health', name: 'Healthcare', icon: 'mdi-hospital', color: '#F38181', budgetType: 'NEEDS', subcategories: ['Doctor', 'Medicine', 'Insurance', 'Lab Tests'] },
    { id: 'shopping', name: 'Shopping', icon: 'mdi-shopping', color: '#AA96DA', budgetType: 'WANTS', subcategories: ['Clothes', 'Electronics', 'Home', 'Personal Care'] },
    { id: 'entertainment', name: 'Entertainment', icon: 'mdi-movie', color: '#FCBAD3', budgetType: 'WANTS', subcategories: ['Movies', 'Streaming', 'Games', 'Events'] },
    { id: 'travel', name: 'Travel', icon: 'mdi-airplane', color: '#A8D8EA', budgetType: 'WANTS', subcategories: ['Flights', 'Hotels', 'Vacation', 'Weekend Trips'] },
    { id: 'education', name: 'Education', icon: 'mdi-school', color: '#FFB347', budgetType: 'NEEDS', subcategories: ['Courses', 'Books', 'Certifications', 'School Fees'] },
    { id: 'personal', name: 'Personal', icon: 'mdi-account', color: '#B5EAD7', budgetType: 'WANTS', subcategories: ['Gym', 'Salon', 'Subscriptions', 'Hobbies'] },
    { id: 'gifts', name: 'Gifts & Donations', icon: 'mdi-gift', color: '#E2B4BD', budgetType: 'WANTS', subcategories: ['Gifts', 'Charity', 'Donations'] },
    { id: 'savings', name: 'Savings & Investments', icon: 'mdi-piggy-bank', color: '#77DD77', budgetType: 'SAVINGS', subcategories: ['Emergency Fund', 'Investments', 'Retirement'] },
    { id: 'emi', name: 'EMI & Loans', icon: 'mdi-credit-card', color: '#FF6961', budgetType: 'NEEDS', subcategories: ['Home Loan', 'Car Loan', 'Personal Loan', 'Credit Card'] },
    { id: 'other', name: 'Other', icon: 'mdi-dots-horizontal', color: '#CFCFC4', budgetType: 'WANTS', subcategories: ['Miscellaneous'] },
  ]
}

export default app
