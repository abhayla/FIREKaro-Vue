import { prisma } from '../lib/prisma'
import type { RecurringFrequency, PaymentMethod } from '@prisma/client'

export interface GenerateResult {
  recurringExpenseId: string
  expenseId: string
  amount: number
  description: string
  date: string
}

/**
 * Calculate the next occurrence date based on frequency
 */
export function calculateNextOccurrence(
  frequency: RecurringFrequency,
  currentDate: Date
): Date {
  const next = new Date(currentDate)

  switch (frequency) {
    case 'WEEKLY':
      next.setDate(next.getDate() + 7)
      break
    case 'MONTHLY':
      next.setMonth(next.getMonth() + 1)
      break
    case 'QUARTERLY':
      next.setMonth(next.getMonth() + 3)
      break
    case 'YEARLY':
      next.setFullYear(next.getFullYear() + 1)
      break
  }

  return next
}

/**
 * Check if a recurring expense should generate (based on end conditions)
 */
export function shouldGenerate(recurring: {
  endType: string
  endAfterCount: number | null
  endDate: Date | null
  generatedCount: number
  isPaused: boolean
  nextOccurrence: Date
}): boolean {
  // Don't generate if paused
  if (recurring.isPaused) return false

  // Check if next occurrence is in the future
  if (recurring.nextOccurrence > new Date()) return false

  // Check end conditions
  switch (recurring.endType) {
    case 'NEVER':
      return true
    case 'AFTER_OCCURRENCES':
      return recurring.endAfterCount ? recurring.generatedCount < recurring.endAfterCount : true
    case 'ON_DATE':
      return recurring.endDate ? recurring.nextOccurrence <= recurring.endDate : true
    default:
      return true
  }
}

/**
 * Generate an expense from a recurring expense template
 */
export async function generateExpenseFromRecurring(
  recurringId: string,
  userId: string
): Promise<GenerateResult | null> {
  const recurring = await prisma.recurringExpense.findFirst({
    where: { id: recurringId, userId },
  })

  if (!recurring) {
    throw new Error('Recurring expense not found')
  }

  if (!shouldGenerate(recurring)) {
    return null
  }

  // Create the expense
  const expense = await prisma.expense.create({
    data: {
      userId,
      amount: recurring.amount,
      description: recurring.description,
      category: recurring.category,
      subcategory: recurring.subcategory,
      date: recurring.nextOccurrence,
      merchant: recurring.merchant,
      paymentMethod: recurring.paymentMethod,
      tags: recurring.tags,
      isRecurring: true,
      notes: recurring.notes,
      familyMemberId: recurring.familyMemberId,
      recurringExpenseId: recurring.id,
    },
  })

  // Calculate next occurrence
  const nextOccurrence = calculateNextOccurrence(
    recurring.frequency,
    recurring.nextOccurrence
  )

  // Update recurring expense
  await prisma.recurringExpense.update({
    where: { id: recurringId },
    data: {
      nextOccurrence,
      lastGenerated: new Date(),
      generatedCount: recurring.generatedCount + 1,
    },
  })

  return {
    recurringExpenseId: recurring.id,
    expenseId: expense.id,
    amount: expense.amount,
    description: expense.description,
    date: expense.date.toISOString().split('T')[0],
  }
}

/**
 * Process all due recurring expenses for a user
 * Returns array of generated expenses
 */
export async function processRecurringExpenses(userId: string): Promise<GenerateResult[]> {
  const now = new Date()

  // Get all active recurring expenses that are due
  const dueRecurring = await prisma.recurringExpense.findMany({
    where: {
      userId,
      isPaused: false,
      nextOccurrence: { lte: now },
    },
    orderBy: { nextOccurrence: 'asc' },
  })

  const results: GenerateResult[] = []

  for (const recurring of dueRecurring) {
    // Check end conditions before generating
    if (!shouldGenerate(recurring)) continue

    try {
      const result = await generateExpenseFromRecurring(recurring.id, userId)
      if (result) {
        results.push(result)
      }
    } catch (error) {
      console.error(`Failed to generate expense from recurring ${recurring.id}:`, error)
    }
  }

  return results
}

/**
 * Get upcoming recurring expenses (next N days)
 */
export async function getUpcomingRecurring(
  userId: string,
  days: number = 30
): Promise<
  Array<{
    id: string
    description: string
    amount: number
    category: string
    nextOccurrence: string
    frequency: string
    isPaused: boolean
  }>
> {
  const endDate = new Date()
  endDate.setDate(endDate.getDate() + days)

  const recurring = await prisma.recurringExpense.findMany({
    where: {
      userId,
      isPaused: false,
      nextOccurrence: { lte: endDate },
      OR: [
        { endType: 'NEVER' },
        {
          endType: 'AFTER_OCCURRENCES',
          generatedCount: { lt: prisma.recurringExpense.fields.endAfterCount },
        },
        { endType: 'ON_DATE', endDate: { gte: new Date() } },
      ],
    },
    orderBy: { nextOccurrence: 'asc' },
  })

  return recurring.map((r) => ({
    id: r.id,
    description: r.description,
    amount: r.amount,
    category: r.category,
    nextOccurrence: r.nextOccurrence.toISOString().split('T')[0],
    frequency: r.frequency,
    isPaused: r.isPaused,
  }))
}

/**
 * Skip the next occurrence of a recurring expense
 */
export async function skipNextOccurrence(
  recurringId: string,
  userId: string
): Promise<{ nextOccurrence: string }> {
  const recurring = await prisma.recurringExpense.findFirst({
    where: { id: recurringId, userId },
  })

  if (!recurring) {
    throw new Error('Recurring expense not found')
  }

  const nextOccurrence = calculateNextOccurrence(
    recurring.frequency,
    recurring.nextOccurrence
  )

  await prisma.recurringExpense.update({
    where: { id: recurringId },
    data: { nextOccurrence },
  })

  return { nextOccurrence: nextOccurrence.toISOString().split('T')[0] }
}

/**
 * Get recurring expense statistics for a user
 */
export async function getRecurringStats(userId: string): Promise<{
  totalActive: number
  totalPaused: number
  totalMonthlyAmount: number
  upcomingCount: number
}> {
  const [active, paused, allRecurring] = await Promise.all([
    prisma.recurringExpense.count({
      where: { userId, isPaused: false },
    }),
    prisma.recurringExpense.count({
      where: { userId, isPaused: true },
    }),
    prisma.recurringExpense.findMany({
      where: { userId, isPaused: false },
      select: { amount: true, frequency: true },
    }),
  ])

  // Calculate total monthly amount (normalize all frequencies to monthly)
  const totalMonthlyAmount = allRecurring.reduce((total, r) => {
    switch (r.frequency) {
      case 'WEEKLY':
        return total + r.amount * 4.33 // ~4.33 weeks per month
      case 'MONTHLY':
        return total + r.amount
      case 'QUARTERLY':
        return total + r.amount / 3
      case 'YEARLY':
        return total + r.amount / 12
      default:
        return total + r.amount
    }
  }, 0)

  // Get count of upcoming in next 7 days
  const sevenDaysFromNow = new Date()
  sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7)

  const upcomingCount = await prisma.recurringExpense.count({
    where: {
      userId,
      isPaused: false,
      nextOccurrence: { lte: sevenDaysFromNow },
    },
  })

  return {
    totalActive: active,
    totalPaused: paused,
    totalMonthlyAmount: Math.round(totalMonthlyAmount * 100) / 100,
    upcomingCount,
  }
}
