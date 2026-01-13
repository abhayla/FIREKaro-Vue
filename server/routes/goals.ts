import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { prisma } from '../lib/prisma'
import { authMiddleware } from '../middleware/auth'

const app = new Hono()

// Apply auth middleware to all routes
app.use('*', authMiddleware)

// Goal category enum values
const goalCategories = [
  'HOUSE',
  'CAR',
  'EDUCATION',
  'TRAVEL',
  'EMERGENCY',
  'WEDDING',
  'RETIREMENT',
  'BUSINESS',
  'PARENTS_CARE',
  'FIRE_CORPUS',
  'OTHER',
] as const

// Validation schemas
const createGoalSchema = z.object({
  goalName: z.string().min(1, 'Goal name is required'),
  goalType: z.string().min(1, 'Goal type is required'),
  category: z.enum(goalCategories).default('OTHER'),
  description: z.string().optional(),
  targetAmount: z.number().positive('Target amount must be positive'),
  targetDate: z.string().transform((str) => new Date(str)),
  currentAmount: z.number().min(0).default(0),
  monthlyContribution: z.number().min(0).default(0),
  expectedReturn: z.number().min(0).max(100).default(12),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH']).default('MEDIUM'),
  icon: z.string().optional(),
  color: z.string().optional(),
  linkedInvestments: z.array(z.string()).default([]),
  linkedSIPs: z.array(z.string()).default([]),
})

const updateGoalSchema = createGoalSchema.partial()

// Helper: Calculate goal status based on progress
function calculateGoalStatus(
  currentAmount: number,
  targetAmount: number,
  targetDate: Date,
  monthlyContribution: number,
  expectedReturn: number
): { status: string; statusColor: string; projectedDate: Date | null } {
  const progressPercent = (currentAmount / targetAmount) * 100

  if (progressPercent >= 100) {
    return {
      status: 'COMPLETED',
      statusColor: 'success',
      projectedDate: new Date(),
    }
  }

  // Calculate projected completion date
  const remainingAmount = targetAmount - currentAmount
  const monthlyReturn = expectedReturn / 100 / 12
  let months = 0
  let accumulated = currentAmount

  while (accumulated < targetAmount && months < 600) {
    accumulated = accumulated * (1 + monthlyReturn) + monthlyContribution
    months++
  }

  const projectedDate = new Date()
  projectedDate.setMonth(projectedDate.getMonth() + months)

  const targetTime = targetDate.getTime()
  const projectedTime = projectedDate.getTime()

  if (projectedTime <= targetTime) {
    return { status: 'ON_TRACK', statusColor: 'success', projectedDate }
  } else if (projectedTime <= targetTime * 1.1) {
    // Within 10% of target date
    return { status: 'AT_RISK', statusColor: 'warning', projectedDate }
  } else {
    return { status: 'OFF_TRACK', statusColor: 'error', projectedDate }
  }
}

// Helper: Calculate recommended SIP
function calculateRecommendedSIP(
  targetAmount: number,
  currentAmount: number,
  targetDate: Date,
  expectedReturn: number
): number {
  const now = new Date()
  const months = Math.max(
    1,
    (targetDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24 * 30)
  )
  const monthlyReturn = expectedReturn / 100 / 12

  // Future value of current amount
  const fvCurrent = currentAmount * Math.pow(1 + monthlyReturn, months)
  const remainingTarget = targetAmount - fvCurrent

  if (remainingTarget <= 0) return 0

  // SIP formula: PMT = FV * r / ((1+r)^n - 1)
  const sip =
    (remainingTarget * monthlyReturn) /
    (Math.pow(1 + monthlyReturn, months) - 1)

  return Math.max(0, Math.ceil(sip / 100) * 100) // Round up to nearest 100
}

// Helper: Generate goal insight
function generateGoalInsight(
  goal: {
    status: string
    currentAmount: number
    targetAmount: number
    monthlyContribution: number
    sipRecommended: number | null
  }
): string | null {
  const progressPercent = (goal.currentAmount / goal.targetAmount) * 100

  if (goal.status === 'COMPLETED') {
    return "Congratulations! You've achieved this goal!"
  }

  if (goal.status === 'ON_TRACK') {
    return "You're on track! Keep up the great work."
  }

  if (goal.status === 'AT_RISK') {
    const sipIncrease = goal.sipRecommended
      ? goal.sipRecommended - goal.monthlyContribution
      : 0
    if (sipIncrease > 0) {
      return `Consider increasing your SIP by ₹${sipIncrease.toLocaleString('en-IN')} to stay on track.`
    }
    return 'Your goal is slightly behind schedule. Consider increasing contributions.'
  }

  if (goal.status === 'OFF_TRACK') {
    if (progressPercent < 25) {
      return 'This goal needs attention. Start with small, consistent investments.'
    }
    return 'This goal is significantly behind. Review your contribution strategy.'
  }

  return null
}

// Helper: Create milestones for a goal
async function createMilestones(goalId: string) {
  const milestones = [25, 50, 75, 100].map((percent) => ({
    goalId,
    percent,
    achieved: false,
    celebrationType:
      percent === 100 ? 'confetti' : percent === 75 ? 'badge' : 'notification',
    badgeIcon:
      percent === 25
        ? 'mdi-medal-outline'
        : percent === 50
          ? 'mdi-medal'
          : percent === 75
            ? 'mdi-trophy-outline'
            : 'mdi-trophy',
  }))

  await prisma.goalMilestone.createMany({
    data: milestones,
    skipDuplicates: true,
  })
}

// Helper: Update milestone achievements
async function updateMilestones(
  goalId: string,
  progressPercent: number
): Promise<{ newlyAchieved: number[] }> {
  const milestones = await prisma.goalMilestone.findMany({
    where: { goalId },
    orderBy: { percent: 'asc' },
  })

  const newlyAchieved: number[] = []

  for (const milestone of milestones) {
    if (!milestone.achieved && progressPercent >= milestone.percent) {
      await prisma.goalMilestone.update({
        where: { id: milestone.id },
        data: {
          achieved: true,
          achievedAt: new Date(),
        },
      })
      newlyAchieved.push(milestone.percent)
    }
  }

  return { newlyAchieved }
}

// GET /api/goals - List all goals
app.get('/', async (c) => {
  const userId = c.get('userId')
  const status = c.req.query('status')
  const category = c.req.query('category')

  try {
    const where: Record<string, unknown> = { userId }

    if (status) {
      where.status = status
    }

    if (category) {
      where.category = category
    }

    const goals = await prisma.financialGoal.findMany({
      where,
      include: {
        milestones: {
          orderBy: { percent: 'asc' },
        },
      },
      orderBy: [{ priority: 'desc' }, { targetDate: 'asc' }],
    })

    // Add computed fields
    const goalsWithProgress = goals.map((goal) => ({
      ...goal,
      progressPercent: Math.min(
        100,
        (goal.currentAmount / goal.targetAmount) * 100
      ),
    }))

    return c.json(goalsWithProgress)
  } catch (error) {
    console.error('Error fetching goals:', error)
    return c.json({ success: false, error: 'Failed to fetch goals' }, 500)
  }
})

// GET /api/goals/:id - Get single goal
app.get('/:id', async (c) => {
  const userId = c.get('userId')
  const goalId = c.req.param('id')

  try {
    const goal = await prisma.financialGoal.findFirst({
      where: { id: goalId, userId },
      include: {
        milestones: {
          orderBy: { percent: 'asc' },
        },
      },
    })

    if (!goal) {
      return c.json({ success: false, error: 'Goal not found' }, 404)
    }

    return c.json({
      ...goal,
      progressPercent: Math.min(
        100,
        (goal.currentAmount / goal.targetAmount) * 100
      ),
    })
  } catch (error) {
    console.error('Error fetching goal:', error)
    return c.json({ success: false, error: 'Failed to fetch goal' }, 500)
  }
})

// POST /api/goals - Create new goal
app.post('/', zValidator('json', createGoalSchema), async (c) => {
  const userId = c.get('userId')
  const data = c.req.valid('json')

  try {
    // Calculate status and recommendations
    const statusInfo = calculateGoalStatus(
      data.currentAmount,
      data.targetAmount,
      data.targetDate,
      data.monthlyContribution,
      data.expectedReturn
    )

    const sipRecommended = calculateRecommendedSIP(
      data.targetAmount,
      data.currentAmount,
      data.targetDate,
      data.expectedReturn
    )

    const goal = await prisma.financialGoal.create({
      data: {
        userId,
        goalName: data.goalName,
        goalType: data.goalType,
        category: data.category,
        description: data.description,
        targetAmount: data.targetAmount,
        targetDate: data.targetDate,
        currentAmount: data.currentAmount,
        monthlyContribution: data.monthlyContribution,
        expectedReturn: data.expectedReturn,
        priority: data.priority,
        icon: data.icon,
        color: data.color,
        linkedInvestments: data.linkedInvestments,
        linkedSIPs: data.linkedSIPs,
        status: statusInfo.status,
        statusColor: statusInfo.statusColor,
        projectedDate: statusInfo.projectedDate,
        sipRecommended,
        lastCalculatedAt: new Date(),
        currentInsight: generateGoalInsight({
          status: statusInfo.status,
          currentAmount: data.currentAmount,
          targetAmount: data.targetAmount,
          monthlyContribution: data.monthlyContribution,
          sipRecommended,
        }),
        lastInsightAt: new Date(),
      },
      include: {
        milestones: true,
      },
    })

    // Create milestones
    await createMilestones(goal.id)

    // Check if any milestones should be marked as achieved
    const progressPercent = (data.currentAmount / data.targetAmount) * 100
    await updateMilestones(goal.id, progressPercent)

    // Fetch updated goal with milestones
    const updatedGoal = await prisma.financialGoal.findUnique({
      where: { id: goal.id },
      include: {
        milestones: {
          orderBy: { percent: 'asc' },
        },
      },
    })

    // Invalidate FIRE metrics cache
    await prisma.fIREMetricsCache
      .update({
        where: { userId },
        data: { isStale: true },
      })
      .catch(() => {})

    return c.json(updatedGoal, 201)
  } catch (error) {
    console.error('Error creating goal:', error)
    return c.json({ success: false, error: 'Failed to create goal' }, 500)
  }
})

// PUT /api/goals/:id - Update goal
app.put('/:id', zValidator('json', updateGoalSchema), async (c) => {
  const userId = c.get('userId')
  const goalId = c.req.param('id')
  const data = c.req.valid('json')

  try {
    // Verify ownership
    const existing = await prisma.financialGoal.findFirst({
      where: { id: goalId, userId },
    })

    if (!existing) {
      return c.json({ success: false, error: 'Goal not found' }, 404)
    }

    // Merge with existing data for calculations
    const targetAmount = data.targetAmount ?? existing.targetAmount
    const currentAmount = data.currentAmount ?? existing.currentAmount
    const targetDate = data.targetDate ?? existing.targetDate
    const monthlyContribution =
      data.monthlyContribution ?? existing.monthlyContribution
    const expectedReturn = data.expectedReturn ?? existing.expectedReturn

    // Recalculate status and recommendations
    const statusInfo = calculateGoalStatus(
      currentAmount,
      targetAmount,
      targetDate,
      monthlyContribution,
      expectedReturn
    )

    const sipRecommended = calculateRecommendedSIP(
      targetAmount,
      currentAmount,
      targetDate,
      expectedReturn
    )

    const goal = await prisma.financialGoal.update({
      where: { id: goalId },
      data: {
        ...data,
        status: statusInfo.status,
        statusColor: statusInfo.statusColor,
        projectedDate: statusInfo.projectedDate,
        sipRecommended,
        lastCalculatedAt: new Date(),
        currentInsight: generateGoalInsight({
          status: statusInfo.status,
          currentAmount,
          targetAmount,
          monthlyContribution,
          sipRecommended,
        }),
        lastInsightAt: new Date(),
      },
      include: {
        milestones: {
          orderBy: { percent: 'asc' },
        },
      },
    })

    // Update milestones
    const progressPercent = (currentAmount / targetAmount) * 100
    const { newlyAchieved } = await updateMilestones(goalId, progressPercent)

    // Invalidate FIRE metrics cache
    await prisma.fIREMetricsCache
      .update({
        where: { userId },
        data: { isStale: true },
      })
      .catch(() => {})

    return c.json({
      ...goal,
      progressPercent,
      newlyAchievedMilestones: newlyAchieved,
    })
  } catch (error) {
    console.error('Error updating goal:', error)
    return c.json({ success: false, error: 'Failed to update goal' }, 500)
  }
})

// DELETE /api/goals/:id - Delete goal
app.delete('/:id', async (c) => {
  const userId = c.get('userId')
  const goalId = c.req.param('id')

  try {
    // Verify ownership
    const existing = await prisma.financialGoal.findFirst({
      where: { id: goalId, userId },
    })

    if (!existing) {
      return c.json({ success: false, error: 'Goal not found' }, 404)
    }

    // Delete goal (milestones will be cascade deleted)
    await prisma.financialGoal.delete({
      where: { id: goalId },
    })

    // Invalidate FIRE metrics cache
    await prisma.fIREMetricsCache
      .update({
        where: { userId },
        data: { isStale: true },
      })
      .catch(() => {})

    return c.json({ success: true, message: 'Goal deleted' })
  } catch (error) {
    console.error('Error deleting goal:', error)
    return c.json({ success: false, error: 'Failed to delete goal' }, 500)
  }
})

// GET /api/goals/:id/milestones - Get goal milestones
app.get('/:id/milestones', async (c) => {
  const userId = c.get('userId')
  const goalId = c.req.param('id')

  try {
    // Verify ownership
    const goal = await prisma.financialGoal.findFirst({
      where: { id: goalId, userId },
    })

    if (!goal) {
      return c.json({ success: false, error: 'Goal not found' }, 404)
    }

    const milestones = await prisma.goalMilestone.findMany({
      where: { goalId },
      orderBy: { percent: 'asc' },
    })

    return c.json(milestones)
  } catch (error) {
    console.error('Error fetching milestones:', error)
    return c.json({ success: false, error: 'Failed to fetch milestones' }, 500)
  }
})

// GET /api/goals/:id/insight - Get goal insight
app.get('/:id/insight', async (c) => {
  const userId = c.get('userId')
  const goalId = c.req.param('id')

  try {
    const goal = await prisma.financialGoal.findFirst({
      where: { id: goalId, userId },
    })

    if (!goal) {
      return c.json({ success: false, error: 'Goal not found' }, 404)
    }

    const insight = generateGoalInsight({
      status: goal.status,
      currentAmount: goal.currentAmount,
      targetAmount: goal.targetAmount,
      monthlyContribution: goal.monthlyContribution,
      sipRecommended: goal.sipRecommended,
    })

    return c.json({
      goalId: goal.id,
      goalName: goal.goalName,
      status: goal.status,
      insight,
      sipRecommended: goal.sipRecommended,
      currentSIP: goal.monthlyContribution,
      sipDifference: goal.sipRecommended
        ? goal.sipRecommended - goal.monthlyContribution
        : null,
    })
  } catch (error) {
    console.error('Error generating insight:', error)
    return c.json({ success: false, error: 'Failed to generate insight' }, 500)
  }
})

// GET /api/goals/summary - Get goals summary
app.get('/summary', async (c) => {
  const userId = c.get('userId')

  try {
    const goals = await prisma.financialGoal.findMany({
      where: { userId },
    })

    const summary = {
      total: goals.length,
      completed: goals.filter((g) => g.status === 'COMPLETED').length,
      onTrack: goals.filter((g) => g.status === 'ON_TRACK').length,
      atRisk: goals.filter((g) => g.status === 'AT_RISK').length,
      offTrack: goals.filter((g) => g.status === 'OFF_TRACK').length,
      totalTarget: goals.reduce((sum, g) => sum + g.targetAmount, 0),
      totalSaved: goals.reduce((sum, g) => sum + g.currentAmount, 0),
      totalMonthlyContribution: goals.reduce(
        (sum, g) => sum + g.monthlyContribution,
        0
      ),
      overallProgress:
        goals.length > 0
          ? (goals.reduce((sum, g) => sum + g.currentAmount, 0) /
              goals.reduce((sum, g) => sum + g.targetAmount, 0)) *
            100
          : 0,
    }

    return c.json(summary)
  } catch (error) {
    console.error('Error fetching goals summary:', error)
    return c.json(
      { success: false, error: 'Failed to fetch goals summary' },
      500
    )
  }
})

export default app
