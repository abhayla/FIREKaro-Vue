import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { prisma } from '../lib/prisma'
import { authMiddleware } from '../middleware/auth'
import {
  calculateNextOccurrence,
  generateExpenseFromRecurring,
  processRecurringExpenses,
  skipNextOccurrence,
  getRecurringStats,
} from '../services/recurring-expenses.service'

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

// Frequency enum matching Prisma schema
const FrequencyEnum = z.enum(['WEEKLY', 'MONTHLY', 'QUARTERLY', 'YEARLY'])

// End type enum matching Prisma schema
const EndTypeEnum = z.enum(['NEVER', 'AFTER_OCCURRENCES', 'ON_DATE'])

// Validation schema for recurring expense input
const recurringExpenseInputSchema = z.object({
  amount: z.number().positive('Amount must be positive'),
  description: z.string().min(1, 'Description is required'),
  category: z.string().min(1, 'Category is required'),
  subcategory: z.string().optional().nullable(),
  merchant: z.string().optional().nullable(),
  paymentMethod: PaymentMethodEnum.optional().default('OTHER'),
  tags: z.array(z.string()).optional().default([]),
  notes: z.string().optional().nullable(),
  frequency: FrequencyEnum,
  startDate: z.string().transform((val) => new Date(val)),
  endType: EndTypeEnum.optional().default('NEVER'),
  endAfterCount: z.number().int().positive().optional().nullable(),
  endDate: z
    .string()
    .optional()
    .nullable()
    .transform((val) => (val ? new Date(val) : null)),
  familyMemberId: z.string().optional().nullable(),
})

// GET /api/recurring-expenses - List all recurring expenses
app.get('/', async (c) => {
  const userId = c.get('userId')
  const includeStats = c.req.query('includeStats') === 'true'

  try {
    const recurringExpenses = await prisma.recurringExpense.findMany({
      where: { userId },
      orderBy: [{ isPaused: 'asc' }, { nextOccurrence: 'asc' }],
    })

    // Transform for frontend
    const transformed = recurringExpenses.map((r) => ({
      ...r,
      startDate: r.startDate.toISOString().split('T')[0],
      nextOccurrence: r.nextOccurrence.toISOString().split('T')[0],
      lastGenerated: r.lastGenerated?.toISOString().split('T')[0] || null,
      endDate: r.endDate?.toISOString().split('T')[0] || null,
    }))

    if (includeStats) {
      const stats = await getRecurringStats(userId)
      return c.json({ items: transformed, stats })
    }

    return c.json(transformed)
  } catch (error) {
    console.error('Error fetching recurring expenses:', error)
    return c.json({ success: false, error: 'Failed to fetch recurring expenses' }, 500)
  }
})

// GET /api/recurring-expenses/stats - Get recurring expense statistics
app.get('/stats', async (c) => {
  const userId = c.get('userId')

  try {
    const stats = await getRecurringStats(userId)
    return c.json(stats)
  } catch (error) {
    console.error('Error fetching recurring stats:', error)
    return c.json({ success: false, error: 'Failed to fetch statistics' }, 500)
  }
})

// GET /api/recurring-expenses/upcoming - Get upcoming recurring expenses
app.get('/upcoming', async (c) => {
  const userId = c.get('userId')
  const days = parseInt(c.req.query('days') || '30', 10)

  try {
    const endDate = new Date()
    endDate.setDate(endDate.getDate() + days)

    const upcoming = await prisma.recurringExpense.findMany({
      where: {
        userId,
        isPaused: false,
        nextOccurrence: { lte: endDate },
      },
      orderBy: { nextOccurrence: 'asc' },
    })

    const transformed = upcoming.map((r) => ({
      id: r.id,
      description: r.description,
      amount: r.amount,
      category: r.category,
      subcategory: r.subcategory,
      merchant: r.merchant,
      nextOccurrence: r.nextOccurrence.toISOString().split('T')[0],
      frequency: r.frequency,
    }))

    return c.json(transformed)
  } catch (error) {
    console.error('Error fetching upcoming recurring:', error)
    return c.json({ success: false, error: 'Failed to fetch upcoming expenses' }, 500)
  }
})

// GET /api/recurring-expenses/:id - Get single recurring expense
app.get('/:id', async (c) => {
  const userId = c.get('userId')
  const id = c.req.param('id')

  try {
    const recurring = await prisma.recurringExpense.findFirst({
      where: { id, userId },
      include: {
        generatedExpenses: {
          orderBy: { date: 'desc' },
          take: 10,
        },
      },
    })

    if (!recurring) {
      return c.json({ success: false, error: 'Recurring expense not found' }, 404)
    }

    return c.json({
      ...recurring,
      startDate: recurring.startDate.toISOString().split('T')[0],
      nextOccurrence: recurring.nextOccurrence.toISOString().split('T')[0],
      lastGenerated: recurring.lastGenerated?.toISOString().split('T')[0] || null,
      endDate: recurring.endDate?.toISOString().split('T')[0] || null,
      generatedExpenses: recurring.generatedExpenses.map((e) => ({
        ...e,
        date: e.date.toISOString().split('T')[0],
      })),
    })
  } catch (error) {
    console.error('Error fetching recurring expense:', error)
    return c.json({ success: false, error: 'Failed to fetch recurring expense' }, 500)
  }
})

// POST /api/recurring-expenses - Create recurring expense
app.post('/', zValidator('json', recurringExpenseInputSchema), async (c) => {
  const userId = c.get('userId')
  const data = c.req.valid('json')

  try {
    // Calculate first occurrence (either startDate or next based on frequency)
    const nextOccurrence =
      data.startDate > new Date()
        ? data.startDate
        : calculateNextOccurrence(data.frequency, new Date())

    const recurring = await prisma.recurringExpense.create({
      data: {
        userId,
        amount: data.amount,
        description: data.description,
        category: data.category,
        subcategory: data.subcategory || null,
        merchant: data.merchant || null,
        paymentMethod: data.paymentMethod || 'OTHER',
        tags: data.tags || [],
        notes: data.notes || null,
        frequency: data.frequency,
        startDate: data.startDate,
        endType: data.endType || 'NEVER',
        endAfterCount: data.endAfterCount || null,
        endDate: data.endDate || null,
        nextOccurrence,
        familyMemberId: data.familyMemberId || null,
      },
    })

    return c.json(
      {
        ...recurring,
        startDate: recurring.startDate.toISOString().split('T')[0],
        nextOccurrence: recurring.nextOccurrence.toISOString().split('T')[0],
        lastGenerated: null,
        endDate: recurring.endDate?.toISOString().split('T')[0] || null,
      },
      201
    )
  } catch (error) {
    console.error('Error creating recurring expense:', error)
    return c.json({ success: false, error: 'Failed to create recurring expense' }, 500)
  }
})

// PUT /api/recurring-expenses/:id - Update recurring expense
app.put('/:id', zValidator('json', recurringExpenseInputSchema.partial()), async (c) => {
  const userId = c.get('userId')
  const id = c.req.param('id')
  const data = c.req.valid('json')

  try {
    // Check if recurring expense exists and belongs to user
    const existing = await prisma.recurringExpense.findFirst({
      where: { id, userId },
    })

    if (!existing) {
      return c.json({ success: false, error: 'Recurring expense not found' }, 404)
    }

    // If frequency changes, recalculate next occurrence
    let nextOccurrence = existing.nextOccurrence
    if (data.frequency && data.frequency !== existing.frequency) {
      nextOccurrence = calculateNextOccurrence(
        data.frequency,
        existing.lastGenerated || existing.startDate
      )
    }

    const recurring = await prisma.recurringExpense.update({
      where: { id },
      data: {
        ...(data.amount !== undefined && { amount: data.amount }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.category !== undefined && { category: data.category }),
        ...(data.subcategory !== undefined && { subcategory: data.subcategory }),
        ...(data.merchant !== undefined && { merchant: data.merchant }),
        ...(data.paymentMethod !== undefined && { paymentMethod: data.paymentMethod }),
        ...(data.tags !== undefined && { tags: data.tags }),
        ...(data.notes !== undefined && { notes: data.notes }),
        ...(data.frequency !== undefined && { frequency: data.frequency, nextOccurrence }),
        ...(data.startDate !== undefined && { startDate: data.startDate }),
        ...(data.endType !== undefined && { endType: data.endType }),
        ...(data.endAfterCount !== undefined && { endAfterCount: data.endAfterCount }),
        ...(data.endDate !== undefined && { endDate: data.endDate }),
        ...(data.familyMemberId !== undefined && { familyMemberId: data.familyMemberId }),
      },
    })

    return c.json({
      ...recurring,
      startDate: recurring.startDate.toISOString().split('T')[0],
      nextOccurrence: recurring.nextOccurrence.toISOString().split('T')[0],
      lastGenerated: recurring.lastGenerated?.toISOString().split('T')[0] || null,
      endDate: recurring.endDate?.toISOString().split('T')[0] || null,
    })
  } catch (error) {
    console.error('Error updating recurring expense:', error)
    return c.json({ success: false, error: 'Failed to update recurring expense' }, 500)
  }
})

// DELETE /api/recurring-expenses/:id - Delete recurring expense
app.delete('/:id', async (c) => {
  const userId = c.get('userId')
  const id = c.req.param('id')
  const deleteGenerated = c.req.query('deleteGenerated') === 'true'

  try {
    // Check if recurring expense exists and belongs to user
    const existing = await prisma.recurringExpense.findFirst({
      where: { id, userId },
    })

    if (!existing) {
      return c.json({ success: false, error: 'Recurring expense not found' }, 404)
    }

    // Optionally delete all generated expenses
    if (deleteGenerated) {
      await prisma.expense.deleteMany({
        where: { recurringExpenseId: id },
      })
    }

    await prisma.recurringExpense.delete({
      where: { id },
    })

    return c.json({ success: true, message: 'Recurring expense deleted successfully' })
  } catch (error) {
    console.error('Error deleting recurring expense:', error)
    return c.json({ success: false, error: 'Failed to delete recurring expense' }, 500)
  }
})

// POST /api/recurring-expenses/:id/pause - Pause recurring expense
app.post('/:id/pause', async (c) => {
  const userId = c.get('userId')
  const id = c.req.param('id')

  try {
    const existing = await prisma.recurringExpense.findFirst({
      where: { id, userId },
    })

    if (!existing) {
      return c.json({ success: false, error: 'Recurring expense not found' }, 404)
    }

    const recurring = await prisma.recurringExpense.update({
      where: { id },
      data: { isPaused: true },
    })

    return c.json({
      success: true,
      message: 'Recurring expense paused',
      isPaused: recurring.isPaused,
    })
  } catch (error) {
    console.error('Error pausing recurring expense:', error)
    return c.json({ success: false, error: 'Failed to pause recurring expense' }, 500)
  }
})

// POST /api/recurring-expenses/:id/resume - Resume recurring expense
app.post('/:id/resume', async (c) => {
  const userId = c.get('userId')
  const id = c.req.param('id')

  try {
    const existing = await prisma.recurringExpense.findFirst({
      where: { id, userId },
    })

    if (!existing) {
      return c.json({ success: false, error: 'Recurring expense not found' }, 404)
    }

    // If next occurrence is in the past, calculate a new one
    let nextOccurrence = existing.nextOccurrence
    if (nextOccurrence < new Date()) {
      nextOccurrence = calculateNextOccurrence(existing.frequency, new Date())
    }

    const recurring = await prisma.recurringExpense.update({
      where: { id },
      data: { isPaused: false, nextOccurrence },
    })

    return c.json({
      success: true,
      message: 'Recurring expense resumed',
      isPaused: recurring.isPaused,
      nextOccurrence: recurring.nextOccurrence.toISOString().split('T')[0],
    })
  } catch (error) {
    console.error('Error resuming recurring expense:', error)
    return c.json({ success: false, error: 'Failed to resume recurring expense' }, 500)
  }
})

// POST /api/recurring-expenses/:id/skip - Skip next occurrence
app.post('/:id/skip', async (c) => {
  const userId = c.get('userId')
  const id = c.req.param('id')

  try {
    const result = await skipNextOccurrence(id, userId)
    return c.json({
      success: true,
      message: 'Next occurrence skipped',
      nextOccurrence: result.nextOccurrence,
    })
  } catch (error) {
    console.error('Error skipping occurrence:', error)
    return c.json({ success: false, error: 'Failed to skip occurrence' }, 500)
  }
})

// POST /api/recurring-expenses/:id/generate - Manually generate next expense
app.post('/:id/generate', async (c) => {
  const userId = c.get('userId')
  const id = c.req.param('id')

  try {
    const result = await generateExpenseFromRecurring(id, userId)

    if (!result) {
      return c.json(
        {
          success: false,
          error: 'Cannot generate expense (paused, ended, or not due yet)',
        },
        400
      )
    }

    return c.json({
      success: true,
      message: 'Expense generated successfully',
      expense: result,
    })
  } catch (error) {
    console.error('Error generating expense:', error)
    return c.json({ success: false, error: 'Failed to generate expense' }, 500)
  }
})

// POST /api/recurring-expenses/process - Process all due recurring expenses
app.post('/process', async (c) => {
  const userId = c.get('userId')

  try {
    const results = await processRecurringExpenses(userId)

    return c.json({
      success: true,
      message: `Generated ${results.length} expenses`,
      generated: results,
    })
  } catch (error) {
    console.error('Error processing recurring expenses:', error)
    return c.json({ success: false, error: 'Failed to process recurring expenses' }, 500)
  }
})

export default app
