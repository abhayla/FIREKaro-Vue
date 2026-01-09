/**
 * Expense Rules Engine
 *
 * Applies user-defined rules to automatically categorize expenses.
 * Rules are checked in priority order (highest first).
 */

import { prisma } from '../lib/prisma'

// Types matching frontend expectations
export interface RuleCondition {
  field: 'merchant' | 'description' | 'amount' | 'paymentMethod'
  operator: 'equals' | 'contains' | 'startsWith' | 'endsWith' | 'greaterThan' | 'lessThan' | 'between'
  value: string | number | [number, number]
  caseSensitive?: boolean
}

export interface ExpenseInput {
  description: string
  merchant?: string | null
  amount: number
  paymentMethod?: string
  category?: string
  subcategory?: string | null
  tags?: string[]
}

export interface RuleMatchResult {
  matched: boolean
  ruleId?: string
  ruleName?: string
  category?: string
  subcategory?: string | null
  applyTags?: string[]
}

/**
 * Apply rules to an expense and return categorization result
 */
export async function applyRules(
  expense: ExpenseInput,
  userId: string
): Promise<RuleMatchResult> {
  // Fetch active rules ordered by priority (highest first)
  const rules = await prisma.expenseCategoryRule.findMany({
    where: {
      userId,
      isActive: true,
    },
    orderBy: { priority: 'desc' },
  })

  for (const rule of rules) {
    const conditions = rule.conditions as RuleCondition[]

    if (matchesAllConditions(expense, conditions)) {
      // Update rule usage stats
      await prisma.expenseCategoryRule.update({
        where: { id: rule.id },
        data: {
          timesApplied: { increment: 1 },
          lastAppliedAt: new Date(),
        },
      })

      return {
        matched: true,
        ruleId: rule.id,
        ruleName: rule.name,
        category: rule.targetCategory,
        subcategory: rule.targetSubcategory,
        applyTags: rule.applyTags,
      }
    }
  }

  return { matched: false }
}

/**
 * Check if expense matches all conditions in a rule
 */
function matchesAllConditions(
  expense: ExpenseInput,
  conditions: RuleCondition[]
): boolean {
  return conditions.every((condition) => evaluateCondition(expense, condition))
}

/**
 * Evaluate a single condition against an expense
 */
function evaluateCondition(expense: ExpenseInput, condition: RuleCondition): boolean {
  const fieldValue = getFieldValue(expense, condition.field)

  if (fieldValue === null || fieldValue === undefined) {
    return false
  }

  const caseSensitive = condition.caseSensitive ?? false

  switch (condition.operator) {
    case 'equals':
      return compareEquals(fieldValue, condition.value, caseSensitive)

    case 'contains':
      return compareContains(fieldValue, condition.value, caseSensitive)

    case 'startsWith':
      return compareStartsWith(fieldValue, condition.value, caseSensitive)

    case 'endsWith':
      return compareEndsWith(fieldValue, condition.value, caseSensitive)

    case 'greaterThan':
      return typeof fieldValue === 'number' && fieldValue > Number(condition.value)

    case 'lessThan':
      return typeof fieldValue === 'number' && fieldValue < Number(condition.value)

    case 'between':
      if (typeof fieldValue !== 'number' || !Array.isArray(condition.value)) {
        return false
      }
      const [min, max] = condition.value
      return fieldValue >= min && fieldValue <= max

    default:
      return false
  }
}

/**
 * Get field value from expense
 */
function getFieldValue(
  expense: ExpenseInput,
  field: RuleCondition['field']
): string | number | null {
  switch (field) {
    case 'merchant':
      return expense.merchant || null
    case 'description':
      return expense.description
    case 'amount':
      return expense.amount
    case 'paymentMethod':
      return expense.paymentMethod || null
    default:
      return null
  }
}

/**
 * Compare equality (string or number)
 */
function compareEquals(
  fieldValue: string | number,
  conditionValue: string | number | [number, number],
  caseSensitive: boolean
): boolean {
  if (typeof fieldValue === 'number') {
    return fieldValue === Number(conditionValue)
  }

  const fieldStr = caseSensitive ? String(fieldValue) : String(fieldValue).toLowerCase()
  const condStr = caseSensitive
    ? String(conditionValue)
    : String(conditionValue).toLowerCase()

  return fieldStr === condStr
}

/**
 * Check if field contains value
 */
function compareContains(
  fieldValue: string | number,
  conditionValue: string | number | [number, number],
  caseSensitive: boolean
): boolean {
  const fieldStr = caseSensitive ? String(fieldValue) : String(fieldValue).toLowerCase()
  const condStr = caseSensitive
    ? String(conditionValue)
    : String(conditionValue).toLowerCase()

  return fieldStr.includes(condStr)
}

/**
 * Check if field starts with value
 */
function compareStartsWith(
  fieldValue: string | number,
  conditionValue: string | number | [number, number],
  caseSensitive: boolean
): boolean {
  const fieldStr = caseSensitive ? String(fieldValue) : String(fieldValue).toLowerCase()
  const condStr = caseSensitive
    ? String(conditionValue)
    : String(conditionValue).toLowerCase()

  return fieldStr.startsWith(condStr)
}

/**
 * Check if field ends with value
 */
function compareEndsWith(
  fieldValue: string | number,
  conditionValue: string | number | [number, number],
  caseSensitive: boolean
): boolean {
  const fieldStr = caseSensitive ? String(fieldValue) : String(fieldValue).toLowerCase()
  const condStr = caseSensitive
    ? String(conditionValue)
    : String(conditionValue).toLowerCase()

  return fieldStr.endsWith(condStr)
}

/**
 * Test a rule against sample data without saving
 */
export async function testRule(
  conditions: RuleCondition[],
  sampleExpenses: ExpenseInput[]
): Promise<{ matches: number; total: number; matchedExpenses: ExpenseInput[] }> {
  const matchedExpenses: ExpenseInput[] = []

  for (const expense of sampleExpenses) {
    if (matchesAllConditions(expense, conditions)) {
      matchedExpenses.push(expense)
    }
  }

  return {
    matches: matchedExpenses.length,
    total: sampleExpenses.length,
    matchedExpenses,
  }
}

/**
 * Generate rule suggestions based on uncategorized expenses
 * This analyzes patterns in merchant names and descriptions
 */
export async function suggestRules(
  userId: string,
  limit: number = 5
): Promise<
  {
    suggestion: string
    conditions: RuleCondition[]
    targetCategory: string
    matchCount: number
  }[]
> {
  // Get recent expenses that might benefit from rules
  const expenses = await prisma.expense.findMany({
    where: { userId },
    orderBy: { date: 'desc' },
    take: 100,
  })

  // Group by merchant
  const merchantCounts = new Map<string, { count: number; category: string }>()

  for (const expense of expenses) {
    if (expense.merchant) {
      const key = expense.merchant.toLowerCase()
      const existing = merchantCounts.get(key)
      if (existing) {
        existing.count++
      } else {
        merchantCounts.set(key, { count: 1, category: expense.category })
      }
    }
  }

  // Generate suggestions for merchants with 3+ occurrences
  const suggestions: {
    suggestion: string
    conditions: RuleCondition[]
    targetCategory: string
    matchCount: number
  }[] = []

  for (const [merchant, data] of merchantCounts) {
    if (data.count >= 3) {
      // Check if a rule already exists for this merchant
      const existingRule = await prisma.expenseCategoryRule.findFirst({
        where: {
          userId,
          conditions: {
            path: ['$[*].value'],
            string_contains: merchant,
          },
        },
      })

      if (!existingRule) {
        suggestions.push({
          suggestion: `Create rule for "${merchant}" → ${data.category}`,
          conditions: [
            {
              field: 'merchant',
              operator: 'contains',
              value: merchant,
            },
          ],
          targetCategory: data.category,
          matchCount: data.count,
        })
      }
    }
  }

  // Sort by match count and limit
  return suggestions.sort((a, b) => b.matchCount - a.matchCount).slice(0, limit)
}
