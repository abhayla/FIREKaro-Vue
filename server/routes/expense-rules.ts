import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { prisma } from '../lib/prisma'
import { authMiddleware } from '../middleware/auth'
import { applyRules, testRule, suggestRules, type RuleCondition } from '../services/rules-engine'

const app = new Hono()

// Apply auth middleware to all routes
app.use('*', authMiddleware)

// Validation schema for rule condition
const conditionSchema = z.object({
  field: z.enum(['merchant', 'description', 'amount', 'paymentMethod']),
  operator: z.enum(['equals', 'contains', 'startsWith', 'endsWith', 'greaterThan', 'lessThan', 'between']),
  value: z.union([z.string(), z.number(), z.tuple([z.number(), z.number()])]),
  caseSensitive: z.boolean().optional(),
})

// Validation schema for rule input
const ruleInputSchema = z.object({
  name: z.string().min(1, 'Rule name is required'),
  isActive: z.boolean().optional().default(true),
  priority: z.number().min(0).optional().default(0),
  conditions: z.array(conditionSchema).min(1, 'At least one condition is required'),
  targetCategory: z.string().min(1, 'Target category is required'),
  targetSubcategory: z.string().optional().nullable(),
  applyTags: z.array(z.string()).optional().default([]),
})

// GET /api/expense-rules - List all rules for user
app.get('/', async (c) => {
  const userId = c.get('userId')

  try {
    const rules = await prisma.expenseCategoryRule.findMany({
      where: { userId },
      orderBy: [{ priority: 'desc' }, { name: 'asc' }],
    })

    // Transform for frontend
    const transformedRules = rules.map((rule) => ({
      id: rule.id,
      name: rule.name,
      isActive: rule.isActive,
      priority: rule.priority,
      conditions: rule.conditions as RuleCondition[],
      targetCategory: rule.targetCategory,
      targetSubcategory: rule.targetSubcategory,
      applyTags: rule.applyTags,
      timesApplied: rule.timesApplied,
      lastAppliedAt: rule.lastAppliedAt?.toISOString() || null,
      createdAt: rule.createdAt.toISOString(),
      updatedAt: rule.updatedAt.toISOString(),
    }))

    return c.json(transformedRules)
  } catch (error) {
    console.error('Error fetching rules:', error)
    return c.json({ success: false, error: 'Failed to fetch rules' }, 500)
  }
})

// GET /api/expense-rules/:id - Get single rule
app.get('/:id', async (c) => {
  const userId = c.get('userId')
  const id = c.req.param('id')

  try {
    const rule = await prisma.expenseCategoryRule.findFirst({
      where: { id, userId },
    })

    if (!rule) {
      return c.json({ success: false, error: 'Rule not found' }, 404)
    }

    return c.json({
      id: rule.id,
      name: rule.name,
      isActive: rule.isActive,
      priority: rule.priority,
      conditions: rule.conditions as RuleCondition[],
      targetCategory: rule.targetCategory,
      targetSubcategory: rule.targetSubcategory,
      applyTags: rule.applyTags,
      timesApplied: rule.timesApplied,
      lastAppliedAt: rule.lastAppliedAt?.toISOString() || null,
    })
  } catch (error) {
    console.error('Error fetching rule:', error)
    return c.json({ success: false, error: 'Failed to fetch rule' }, 500)
  }
})

// POST /api/expense-rules - Create new rule
app.post('/', zValidator('json', ruleInputSchema), async (c) => {
  const userId = c.get('userId')
  const data = c.req.valid('json')

  try {
    const rule = await prisma.expenseCategoryRule.create({
      data: {
        userId,
        name: data.name,
        isActive: data.isActive,
        priority: data.priority,
        conditions: data.conditions,
        targetCategory: data.targetCategory,
        targetSubcategory: data.targetSubcategory || null,
        applyTags: data.applyTags,
      },
    })

    return c.json(
      {
        id: rule.id,
        name: rule.name,
        isActive: rule.isActive,
        priority: rule.priority,
        conditions: rule.conditions as RuleCondition[],
        targetCategory: rule.targetCategory,
        targetSubcategory: rule.targetSubcategory,
        applyTags: rule.applyTags,
        timesApplied: rule.timesApplied,
      },
      201
    )
  } catch (error) {
    console.error('Error creating rule:', error)
    return c.json({ success: false, error: 'Failed to create rule' }, 500)
  }
})

// PUT /api/expense-rules/:id - Update rule
app.put('/:id', zValidator('json', ruleInputSchema.partial()), async (c) => {
  const userId = c.get('userId')
  const id = c.req.param('id')
  const data = c.req.valid('json')

  try {
    // Check if rule exists and belongs to user
    const existing = await prisma.expenseCategoryRule.findFirst({
      where: { id, userId },
    })

    if (!existing) {
      return c.json({ success: false, error: 'Rule not found' }, 404)
    }

    const rule = await prisma.expenseCategoryRule.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
        ...(data.priority !== undefined && { priority: data.priority }),
        ...(data.conditions !== undefined && { conditions: data.conditions }),
        ...(data.targetCategory !== undefined && { targetCategory: data.targetCategory }),
        ...(data.targetSubcategory !== undefined && { targetSubcategory: data.targetSubcategory }),
        ...(data.applyTags !== undefined && { applyTags: data.applyTags }),
      },
    })

    return c.json({
      id: rule.id,
      name: rule.name,
      isActive: rule.isActive,
      priority: rule.priority,
      conditions: rule.conditions as RuleCondition[],
      targetCategory: rule.targetCategory,
      targetSubcategory: rule.targetSubcategory,
      applyTags: rule.applyTags,
      timesApplied: rule.timesApplied,
    })
  } catch (error) {
    console.error('Error updating rule:', error)
    return c.json({ success: false, error: 'Failed to update rule' }, 500)
  }
})

// DELETE /api/expense-rules/:id - Delete rule
app.delete('/:id', async (c) => {
  const userId = c.get('userId')
  const id = c.req.param('id')

  try {
    // Check if rule exists and belongs to user
    const existing = await prisma.expenseCategoryRule.findFirst({
      where: { id, userId },
    })

    if (!existing) {
      return c.json({ success: false, error: 'Rule not found' }, 404)
    }

    await prisma.expenseCategoryRule.delete({
      where: { id },
    })

    return c.json({ success: true, message: 'Rule deleted successfully' })
  } catch (error) {
    console.error('Error deleting rule:', error)
    return c.json({ success: false, error: 'Failed to delete rule' }, 500)
  }
})

// POST /api/expense-rules/:id/toggle - Toggle rule active status
app.post('/:id/toggle', async (c) => {
  const userId = c.get('userId')
  const id = c.req.param('id')

  try {
    const existing = await prisma.expenseCategoryRule.findFirst({
      where: { id, userId },
    })

    if (!existing) {
      return c.json({ success: false, error: 'Rule not found' }, 404)
    }

    const rule = await prisma.expenseCategoryRule.update({
      where: { id },
      data: { isActive: !existing.isActive },
    })

    return c.json({ success: true, isActive: rule.isActive })
  } catch (error) {
    console.error('Error toggling rule:', error)
    return c.json({ success: false, error: 'Failed to toggle rule' }, 500)
  }
})

// GET /api/expense-rules/suggestions - Get AI-suggested rules
app.get('/suggestions', async (c) => {
  const userId = c.get('userId')

  try {
    const suggestions = await suggestRules(userId, 5)
    return c.json(suggestions)
  } catch (error) {
    console.error('Error generating suggestions:', error)
    return c.json({ success: false, error: 'Failed to generate suggestions' }, 500)
  }
})

// POST /api/expense-rules/test - Test rule against sample data
app.post(
  '/test',
  zValidator(
    'json',
    z.object({
      conditions: z.array(conditionSchema),
    })
  ),
  async (c) => {
    const userId = c.get('userId')
    const { conditions } = c.req.valid('json')

    try {
      // Get recent expenses to test against
      const expenses = await prisma.expense.findMany({
        where: { userId },
        orderBy: { date: 'desc' },
        take: 50,
      })

      const sampleExpenses = expenses.map((e) => ({
        description: e.description,
        merchant: e.merchant,
        amount: e.amount,
        paymentMethod: e.paymentMethod,
        category: e.category,
        subcategory: e.subcategory,
      }))

      const result = await testRule(conditions as RuleCondition[], sampleExpenses)

      return c.json({
        matches: result.matches,
        total: result.total,
        matchPercentage: result.total > 0 ? (result.matches / result.total) * 100 : 0,
        matchedExpenses: result.matchedExpenses.slice(0, 5), // Return up to 5 examples
      })
    } catch (error) {
      console.error('Error testing rule:', error)
      return c.json({ success: false, error: 'Failed to test rule' }, 500)
    }
  }
)

// POST /api/expense-rules/apply - Apply rules to an expense (for categorization)
app.post(
  '/apply',
  zValidator(
    'json',
    z.object({
      description: z.string(),
      merchant: z.string().optional().nullable(),
      amount: z.number(),
      paymentMethod: z.string().optional(),
    })
  ),
  async (c) => {
    const userId = c.get('userId')
    const expense = c.req.valid('json')

    try {
      const result = await applyRules(expense, userId)
      return c.json(result)
    } catch (error) {
      console.error('Error applying rules:', error)
      return c.json({ success: false, error: 'Failed to apply rules' }, 500)
    }
  }
)

export default app
