import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { prisma } from '../lib/prisma'
import { authMiddleware } from '../middleware/auth'

const app = new Hono()

// Apply auth middleware to all routes
app.use('*', authMiddleware)

// Validation schema for income source
const incomeSourceSchema = z.object({
  sourceName: z.string().min(1, 'Source name is required'),
  sourceType: z.enum(['SALARY', 'BUSINESS', 'PROFESSION', 'HOUSE_PROPERTY', 'CAPITAL_GAINS', 'OTHER_SOURCES']),
  description: z.string().optional(),
  financialYear: z.string(),
  isPrimary: z.boolean().optional().default(false),
})

// GET /api/income-sources - List income sources
app.get('/', async (c) => {
  const userId = c.get('userId')
  const financialYear = c.req.query('financialYear')
  const sourceType = c.req.query('sourceType')

  try {
    const whereClause: {
      userId: string
      financialYear?: string
      sourceType?: 'SALARY' | 'BUSINESS' | 'PROFESSION' | 'HOUSE_PROPERTY' | 'CAPITAL_GAINS' | 'OTHER_SOURCES'
      status?: 'ACTIVE'
    } = { userId, status: 'ACTIVE' }

    if (financialYear) {
      whereClause.financialYear = financialYear
    }
    if (sourceType) {
      whereClause.sourceType = sourceType as typeof whereClause.sourceType
    }

    const incomeSources = await prisma.incomeSource.findMany({
      where: whereClause,
      orderBy: [{ isPrimary: 'desc' }, { displayOrder: 'asc' }, { createdAt: 'asc' }],
    })

    return c.json({
      success: true,
      data: { incomeSources },
    })
  } catch (error) {
    console.error('Error fetching income sources:', error)
    return c.json({ success: false, error: 'Failed to fetch income sources' }, 500)
  }
})

// GET /api/income-sources/:id - Get single income source
app.get('/:id', async (c) => {
  const userId = c.get('userId')
  const id = c.req.param('id')

  try {
    const incomeSource = await prisma.incomeSource.findFirst({
      where: { id, userId },
      include: {
        monthlySalaries: {
          orderBy: [{ year: 'desc' }, { month: 'desc' }],
          take: 12,
        },
      },
    })

    if (!incomeSource) {
      return c.json({ success: false, error: 'Income source not found' }, 404)
    }

    return c.json({ success: true, data: incomeSource })
  } catch (error) {
    console.error('Error fetching income source:', error)
    return c.json({ success: false, error: 'Failed to fetch income source' }, 500)
  }
})

// POST /api/income-sources - Create income source
app.post('/', zValidator('json', incomeSourceSchema), async (c) => {
  const userId = c.get('userId')
  const data = c.req.valid('json')

  try {
    // If this is marked as primary, unset other primary sources of same type
    if (data.isPrimary) {
      await prisma.incomeSource.updateMany({
        where: {
          userId,
          sourceType: data.sourceType,
          financialYear: data.financialYear,
          isPrimary: true,
        },
        data: { isPrimary: false },
      })
    }

    const incomeSource = await prisma.incomeSource.create({
      data: {
        userId,
        sourceName: data.sourceName,
        sourceType: data.sourceType,
        description: data.description,
        financialYear: data.financialYear,
        isPrimary: data.isPrimary || false,
        status: 'ACTIVE',
      },
    })

    return c.json({ success: true, data: incomeSource }, 201)
  } catch (error) {
    console.error('Error creating income source:', error)
    return c.json({ success: false, error: 'Failed to create income source' }, 500)
  }
})

// PUT /api/income-sources/:id - Update income source
app.put('/:id', zValidator('json', incomeSourceSchema.partial()), async (c) => {
  const userId = c.get('userId')
  const id = c.req.param('id')
  const data = c.req.valid('json')

  try {
    // Check if record exists and belongs to user
    const existing = await prisma.incomeSource.findFirst({
      where: { id, userId },
    })

    if (!existing) {
      return c.json({ success: false, error: 'Income source not found' }, 404)
    }

    // If this is marked as primary, unset other primary sources of same type
    if (data.isPrimary) {
      await prisma.incomeSource.updateMany({
        where: {
          userId,
          sourceType: data.sourceType || existing.sourceType,
          financialYear: data.financialYear || existing.financialYear,
          isPrimary: true,
          NOT: { id },
        },
        data: { isPrimary: false },
      })
    }

    const incomeSource = await prisma.incomeSource.update({
      where: { id },
      data,
    })

    return c.json({ success: true, data: incomeSource })
  } catch (error) {
    console.error('Error updating income source:', error)
    return c.json({ success: false, error: 'Failed to update income source' }, 500)
  }
})

// DELETE /api/income-sources/:id - Soft delete income source
app.delete('/:id', async (c) => {
  const userId = c.get('userId')
  const id = c.req.param('id')

  try {
    // Check if record exists and belongs to user
    const existing = await prisma.incomeSource.findFirst({
      where: { id, userId },
    })

    if (!existing) {
      return c.json({ success: false, error: 'Income source not found' }, 404)
    }

    // Check if there are linked salary records
    const linkedSalaries = await prisma.monthlySalary.count({
      where: { incomeSourceId: id },
    })

    if (linkedSalaries > 0) {
      // Soft delete - just mark as inactive
      await prisma.incomeSource.update({
        where: { id },
        data: { status: 'INACTIVE' },
      })
      return c.json({
        success: true,
        message: 'Income source deactivated (has linked salary records)',
      })
    }

    // Hard delete if no linked records
    await prisma.incomeSource.delete({
      where: { id },
    })

    return c.json({ success: true, message: 'Income source deleted successfully' })
  } catch (error) {
    console.error('Error deleting income source:', error)
    return c.json({ success: false, error: 'Failed to delete income source' }, 500)
  }
})

export default app
