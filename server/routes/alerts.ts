import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { prisma } from '../lib/prisma'
import { authMiddleware } from '../middleware/auth'

const app = new Hono()

// Apply auth middleware to all routes
app.use('*', authMiddleware)

// GET /api/alerts - List unread alerts for user
app.get('/', async (c) => {
  const userId = c.get('userId')

  try {
    const alerts = await prisma.alertDelivery.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50, // Limit to recent 50 alerts
    })

    return c.json(
      alerts.map((alert) => ({
        id: alert.id,
        alertType: alert.alertType,
        category: alert.category,
        percentage: alert.percentage,
        message: alert.message,
        isRead: alert.isRead,
        createdAt: alert.createdAt.toISOString(),
      }))
    )
  } catch (error) {
    console.error('Error fetching alerts:', error)
    return c.json({ success: false, error: 'Failed to fetch alerts' }, 500)
  }
})

// GET /api/alerts/unread-count - Get count of unread alerts
app.get('/unread-count', async (c) => {
  const userId = c.get('userId')

  try {
    const count = await prisma.alertDelivery.count({
      where: { userId, isRead: false },
    })

    return c.json({ count })
  } catch (error) {
    console.error('Error fetching unread count:', error)
    return c.json({ success: false, error: 'Failed to fetch unread count' }, 500)
  }
})

// POST /api/alerts/:id/read - Mark alert as read
app.post('/:id/read', async (c) => {
  const userId = c.get('userId')
  const id = c.req.param('id')

  try {
    const alert = await prisma.alertDelivery.findFirst({
      where: { id, userId },
    })

    if (!alert) {
      return c.json({ success: false, error: 'Alert not found' }, 404)
    }

    await prisma.alertDelivery.update({
      where: { id },
      data: { isRead: true },
    })

    return c.json({ success: true })
  } catch (error) {
    console.error('Error marking alert as read:', error)
    return c.json({ success: false, error: 'Failed to mark alert as read' }, 500)
  }
})

// POST /api/alerts/read-all - Mark all alerts as read
app.post('/read-all', async (c) => {
  const userId = c.get('userId')

  try {
    await prisma.alertDelivery.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    })

    return c.json({ success: true })
  } catch (error) {
    console.error('Error marking all alerts as read:', error)
    return c.json({ success: false, error: 'Failed to mark alerts as read' }, 500)
  }
})

// DELETE /api/alerts/:id - Delete an alert
app.delete('/:id', async (c) => {
  const userId = c.get('userId')
  const id = c.req.param('id')

  try {
    const alert = await prisma.alertDelivery.findFirst({
      where: { id, userId },
    })

    if (!alert) {
      return c.json({ success: false, error: 'Alert not found' }, 404)
    }

    await prisma.alertDelivery.delete({
      where: { id },
    })

    return c.json({ success: true })
  } catch (error) {
    console.error('Error deleting alert:', error)
    return c.json({ success: false, error: 'Failed to delete alert' }, 500)
  }
})

// GET /api/alerts/preferences - Get user's alert preferences
app.get('/preferences', async (c) => {
  const userId = c.get('userId')

  try {
    let preferences = await prisma.alertPreference.findUnique({
      where: { userId },
    })

    // Create default preferences if none exist
    if (!preferences) {
      preferences = await prisma.alertPreference.create({
        data: {
          userId,
          budgetAlerts: true,
          overspendAlerts: true,
          alertThreshold: 80,
        },
      })
    }

    return c.json({
      budgetAlerts: preferences.budgetAlerts,
      overspendAlerts: preferences.overspendAlerts,
      alertThreshold: preferences.alertThreshold,
    })
  } catch (error) {
    console.error('Error fetching preferences:', error)
    return c.json({ success: false, error: 'Failed to fetch preferences' }, 500)
  }
})

// PUT /api/alerts/preferences - Update alert preferences
app.put(
  '/preferences',
  zValidator(
    'json',
    z.object({
      budgetAlerts: z.boolean().optional(),
      overspendAlerts: z.boolean().optional(),
      alertThreshold: z.number().min(1).max(100).optional(),
    })
  ),
  async (c) => {
    const userId = c.get('userId')
    const data = c.req.valid('json')

    try {
      const preferences = await prisma.alertPreference.upsert({
        where: { userId },
        update: data,
        create: {
          userId,
          budgetAlerts: data.budgetAlerts ?? true,
          overspendAlerts: data.overspendAlerts ?? true,
          alertThreshold: data.alertThreshold ?? 80,
        },
      })

      return c.json({
        budgetAlerts: preferences.budgetAlerts,
        overspendAlerts: preferences.overspendAlerts,
        alertThreshold: preferences.alertThreshold,
      })
    } catch (error) {
      console.error('Error updating preferences:', error)
      return c.json({ success: false, error: 'Failed to update preferences' }, 500)
    }
  }
)

// POST /api/alerts/check-budget - Check and create budget alerts
// This is called after expense creation/update
app.post('/check-budget', async (c) => {
  const userId = c.get('userId')

  try {
    // Get user's alert preferences
    const preferences = await prisma.alertPreference.findUnique({
      where: { userId },
    })

    if (!preferences?.budgetAlerts) {
      return c.json({ success: true, alertsCreated: 0 })
    }

    const threshold = preferences.alertThreshold || 80

    // Get current month's budget
    const now = new Date()
    const budget = await prisma.budget.findFirst({
      where: {
        userId,
        month: now.getMonth() + 1,
        year: now.getFullYear(),
      },
    })

    if (!budget) {
      return c.json({ success: true, alertsCreated: 0 })
    }

    const alertsToCreate: Array<{
      userId: string
      alertType: string
      category: string
      percentage: number
      message: string
    }> = []

    // Check Needs budget
    const needsUsage = budget.needsLimit > 0 ? (budget.needsActual / budget.needsLimit) * 100 : 0
    if (needsUsage >= threshold && needsUsage < 100) {
      alertsToCreate.push({
        userId,
        alertType: 'BUDGET_WARNING',
        category: 'Needs',
        percentage: needsUsage,
        message: `Needs spending is at ${needsUsage.toFixed(0)}% of budget`,
      })
    } else if (needsUsage >= 100 && preferences.overspendAlerts) {
      alertsToCreate.push({
        userId,
        alertType: 'BUDGET_EXCEEDED',
        category: 'Needs',
        percentage: needsUsage,
        message: `Needs budget exceeded! Spending at ${needsUsage.toFixed(0)}%`,
      })
    }

    // Check Wants budget
    const wantsUsage = budget.wantsLimit > 0 ? (budget.wantsActual / budget.wantsLimit) * 100 : 0
    if (wantsUsage >= threshold && wantsUsage < 100) {
      alertsToCreate.push({
        userId,
        alertType: 'BUDGET_WARNING',
        category: 'Wants',
        percentage: wantsUsage,
        message: `Wants spending is at ${wantsUsage.toFixed(0)}% of budget`,
      })
    } else if (wantsUsage >= 100 && preferences.overspendAlerts) {
      alertsToCreate.push({
        userId,
        alertType: 'BUDGET_EXCEEDED',
        category: 'Wants',
        percentage: wantsUsage,
        message: `Wants budget exceeded! Spending at ${wantsUsage.toFixed(0)}%`,
      })
    }

    // Avoid duplicate alerts - check if similar alert exists today
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const createdAlerts = []
    for (const alert of alertsToCreate) {
      const existingAlert = await prisma.alertDelivery.findFirst({
        where: {
          userId,
          alertType: alert.alertType,
          category: alert.category,
          createdAt: { gte: today },
        },
      })

      if (!existingAlert) {
        const newAlert = await prisma.alertDelivery.create({
          data: alert,
        })
        createdAlerts.push(newAlert)
      }
    }

    return c.json({ success: true, alertsCreated: createdAlerts.length })
  } catch (error) {
    console.error('Error checking budget alerts:', error)
    return c.json({ success: false, error: 'Failed to check budget alerts' }, 500)
  }
})

export default app
