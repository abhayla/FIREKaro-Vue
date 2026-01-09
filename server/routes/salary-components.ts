import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { prisma } from '../lib/prisma'
import { authMiddleware } from '../middleware/auth'

const app = new Hono()

// Apply auth middleware to all routes
app.use('*', authMiddleware)

// Validation schemas
const salaryComponentSchema = z.object({
  code: z.string().min(1, 'Code is required').max(50),
  name: z.string().min(1, 'Name is required').max(100),
  componentType: z.enum(['EARNING', 'DEDUCTION', 'EMPLOYER_CONTRIBUTION']),
  category: z.string().nullable().optional(),
  isTaxable: z.boolean().optional().default(true),
  taxSection: z.string().nullable().optional(),
  isExemptUpTo: z.number().nullable().optional(),
  syncTarget: z.enum(['EPF', 'VPF', 'NPS_EMPLOYEE', 'NPS_EMPLOYER', 'SUPERANNUATION', 'PENSION_FUND', 'NONE']).optional().default('NONE'),
  syncDirection: z.enum(['FROM_SALARY', 'TO_SALARY', 'BIDIRECTIONAL', 'MANUAL']).optional().default('FROM_SALARY'),
  isExpandable: z.boolean().optional().default(false),
  parentCode: z.string().nullable().optional(),
  displayOrder: z.number().optional().default(100),
  isActive: z.boolean().optional().default(true),
})

// GET /api/salary-components - List all salary components (system + user's custom)
app.get('/', async (c) => {
  const userId = c.get('userId')
  const componentType = c.req.query('componentType') as 'EARNING' | 'DEDUCTION' | 'EMPLOYER_CONTRIBUTION' | undefined
  const includeInactive = c.req.query('includeInactive') === 'true'

  try {
    const whereClause: {
      OR: Array<{ userId: string | null }>
      componentType?: 'EARNING' | 'DEDUCTION' | 'EMPLOYER_CONTRIBUTION'
      isActive?: boolean
    } = {
      OR: [
        { userId: null }, // System components
        { userId },       // User's custom components
      ],
    }

    if (componentType) {
      whereClause.componentType = componentType
    }

    if (!includeInactive) {
      whereClause.isActive = true
    }

    const components = await prisma.salaryComponentDefinition.findMany({
      where: whereClause,
      orderBy: [
        { componentType: 'asc' },
        { displayOrder: 'asc' },
        { name: 'asc' },
      ],
    })

    return c.json({
      success: true,
      data: { components },
    })
  } catch (error) {
    console.error('Error fetching salary components:', error)
    return c.json({ success: false, error: 'Failed to fetch salary components' }, 500)
  }
})

// GET /api/salary-components/:id - Get single salary component
app.get('/:id', async (c) => {
  const userId = c.get('userId')
  const id = c.req.param('id')

  try {
    const component = await prisma.salaryComponentDefinition.findFirst({
      where: {
        id,
        OR: [
          { userId: null }, // System components are visible to all
          { userId },       // User's own custom components
        ],
      },
      include: {
        entries: {
          take: 10,
          orderBy: { createdAt: 'desc' },
        },
      },
    })

    if (!component) {
      return c.json({ success: false, error: 'Salary component not found' }, 404)
    }

    return c.json({ success: true, data: component })
  } catch (error) {
    console.error('Error fetching salary component:', error)
    return c.json({ success: false, error: 'Failed to fetch salary component' }, 500)
  }
})

// POST /api/salary-components - Create custom salary component
app.post('/', zValidator('json', salaryComponentSchema), async (c) => {
  const userId = c.get('userId')
  const data = c.req.valid('json')

  try {
    // Check if code already exists for this user or as a system component
    const existing = await prisma.salaryComponentDefinition.findFirst({
      where: {
        code: data.code.toUpperCase(),
        OR: [
          { userId: null }, // System component with same code
          { userId },       // User's existing component with same code
        ],
      },
    })

    if (existing) {
      return c.json({
        success: false,
        error: `A component with code "${data.code.toUpperCase()}" already exists`,
      }, 400)
    }

    const component = await prisma.salaryComponentDefinition.create({
      data: {
        userId,
        code: data.code.toUpperCase(),
        name: data.name,
        componentType: data.componentType,
        category: data.category || null,
        isTaxable: data.isTaxable ?? true,
        taxSection: data.taxSection || null,
        isExemptUpTo: data.isExemptUpTo || null,
        syncTarget: data.syncTarget || 'NONE',
        syncDirection: data.syncDirection || 'FROM_SALARY',
        isExpandable: data.isExpandable || false,
        parentCode: data.parentCode || null,
        displayOrder: data.displayOrder ?? 100,
        isActive: data.isActive ?? true,
        isSystem: false, // User-created components are never system components
      },
    })

    return c.json({ success: true, data: component }, 201)
  } catch (error) {
    console.error('Error creating salary component:', error)
    return c.json({ success: false, error: 'Failed to create salary component' }, 500)
  }
})

// PUT /api/salary-components/:id - Update salary component
app.put('/:id', zValidator('json', salaryComponentSchema.partial()), async (c) => {
  const userId = c.get('userId')
  const id = c.req.param('id')
  const data = c.req.valid('json')

  try {
    // Check if component exists
    const existing = await prisma.salaryComponentDefinition.findFirst({
      where: { id },
    })

    if (!existing) {
      return c.json({ success: false, error: 'Salary component not found' }, 404)
    }

    // System components cannot be modified by users
    if (existing.isSystem) {
      return c.json({
        success: false,
        error: 'System components cannot be modified',
      }, 403)
    }

    // Users can only modify their own components
    if (existing.userId !== userId) {
      return c.json({
        success: false,
        error: 'You can only modify your own custom components',
      }, 403)
    }

    // If code is being changed, check for duplicates
    if (data.code && data.code.toUpperCase() !== existing.code) {
      const duplicate = await prisma.salaryComponentDefinition.findFirst({
        where: {
          code: data.code.toUpperCase(),
          OR: [
            { userId: null },
            { userId },
          ],
          NOT: { id },
        },
      })

      if (duplicate) {
        return c.json({
          success: false,
          error: `A component with code "${data.code.toUpperCase()}" already exists`,
        }, 400)
      }
    }

    const component = await prisma.salaryComponentDefinition.update({
      where: { id },
      data: {
        ...(data.code && { code: data.code.toUpperCase() }),
        ...(data.name && { name: data.name }),
        ...(data.componentType && { componentType: data.componentType }),
        ...(data.category !== undefined && { category: data.category }),
        ...(data.isTaxable !== undefined && { isTaxable: data.isTaxable }),
        ...(data.taxSection !== undefined && { taxSection: data.taxSection }),
        ...(data.isExemptUpTo !== undefined && { isExemptUpTo: data.isExemptUpTo }),
        ...(data.syncTarget && { syncTarget: data.syncTarget }),
        ...(data.syncDirection && { syncDirection: data.syncDirection }),
        ...(data.isExpandable !== undefined && { isExpandable: data.isExpandable }),
        ...(data.parentCode !== undefined && { parentCode: data.parentCode }),
        ...(data.displayOrder !== undefined && { displayOrder: data.displayOrder }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
      },
    })

    return c.json({ success: true, data: component })
  } catch (error) {
    console.error('Error updating salary component:', error)
    return c.json({ success: false, error: 'Failed to update salary component' }, 500)
  }
})

// DELETE /api/salary-components/:id - Delete custom salary component
app.delete('/:id', async (c) => {
  const userId = c.get('userId')
  const id = c.req.param('id')

  try {
    // Check if component exists
    const existing = await prisma.salaryComponentDefinition.findFirst({
      where: { id },
    })

    if (!existing) {
      return c.json({ success: false, error: 'Salary component not found' }, 404)
    }

    // System components cannot be deleted
    if (existing.isSystem) {
      return c.json({
        success: false,
        error: 'System components cannot be deleted',
      }, 403)
    }

    // Users can only delete their own components
    if (existing.userId !== userId) {
      return c.json({
        success: false,
        error: 'You can only delete your own custom components',
      }, 403)
    }

    // Check if there are linked salary entries
    const linkedEntries = await prisma.salaryComponentEntry.count({
      where: { componentDefinitionId: id },
    })

    if (linkedEntries > 0) {
      // Soft delete - just mark as inactive
      await prisma.salaryComponentDefinition.update({
        where: { id },
        data: { isActive: false },
      })
      return c.json({
        success: true,
        message: 'Salary component deactivated (has linked salary entries)',
      })
    }

    // Hard delete if no linked records
    await prisma.salaryComponentDefinition.delete({
      where: { id },
    })

    return c.json({ success: true, message: 'Salary component deleted successfully' })
  } catch (error) {
    console.error('Error deleting salary component:', error)
    return c.json({ success: false, error: 'Failed to delete salary component' }, 500)
  }
})

export default app
