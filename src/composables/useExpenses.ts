import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query'
import { computed, type Ref } from 'vue'

// Types
export interface Expense {
  id: string
  amount: number
  description: string
  category: string
  subcategory?: string
  date: string
  merchant?: string
  paymentMethod?: string
  tags?: string[]
  isRecurring?: boolean
  receiptUrl?: string
  notes?: string
  createdAt: string
  updatedAt: string
}

export interface CreateExpenseInput {
  amount: number
  description: string
  category: string
  subcategory?: string
  date: string
  merchant?: string
  paymentMethod?: string
  tags?: string[]
  isRecurring?: boolean
  notes?: string
}

export interface UpdateExpenseInput extends Partial<CreateExpenseInput> {
  id: string
}

export interface Category {
  id: string
  name: string
  icon?: string
  color?: string
  type: 'needs' | 'wants' | 'savings'
  subcategories?: string[]
}

export interface Budget {
  id: string
  month: number
  year: number
  income: number
  needsLimit: number
  wantsLimit: number
  savingsLimit: number
  needsActual: number
  wantsActual: number
  savingsActual: number
  createdAt: string
  updatedAt: string
}

export interface CreateBudgetInput {
  month: number
  year: number
  income: number
  needsPercentage?: number
  wantsPercentage?: number
  savingsPercentage?: number
}

export interface ExpenseRule {
  id: string
  name: string
  isActive: boolean
  priority: number
  conditions: RuleCondition[]
  targetCategory: string
  targetSubcategory?: string
  applyTags?: string[]
  timesApplied: number
}

export interface RuleCondition {
  field: 'merchant' | 'description' | 'amount' | 'paymentMethod'
  operator: 'equals' | 'contains' | 'startsWith' | 'endsWith' | 'greaterThan' | 'lessThan' | 'between'
  value: string | number | [number, number]
  caseSensitive?: boolean
}

export interface CreateRuleInput {
  name: string
  isActive?: boolean
  priority?: number
  conditions: RuleCondition[]
  targetCategory: string
  targetSubcategory?: string | null
  applyTags?: string[]
}

export interface RuleSuggestion {
  suggestion: string
  conditions: RuleCondition[]
  targetCategory: string
  matchCount: number
}

export interface RuleTestResult {
  matches: number
  total: number
  matchPercentage: number
  matchedExpenses: Array<{
    description: string
    merchant?: string
    amount: number
    category: string
  }>
}

export interface AICategorization {
  category: string
  subcategory?: string
  confidence: number
  suggestions?: string[]
}

// Helper for INR formatting
export const formatINR = (amount: number) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount)

// Helper for date formatting
export const formatDate = (date: string) =>
  new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(date))

// Get current month in YYYY-MM format
export const getCurrentMonth = () => {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

// Composable for expenses
export function useExpenses(month?: Ref<string> | string) {
  const queryClient = useQueryClient()
  const monthValue = computed(() => (typeof month === 'string' ? month : month?.value))

  // Fetch expenses
  const expensesQuery = useQuery({
    queryKey: computed(() => ['expenses', monthValue.value]),
    queryFn: async () => {
      const url = monthValue.value
        ? `/api/expenses?month=${monthValue.value}`
        : '/api/expenses'
      const res = await fetch(url)
      if (!res.ok) throw new Error('Failed to fetch expenses')
      return res.json() as Promise<Expense[]>
    },
  })

  // Create expense
  const createExpense = useMutation({
    mutationFn: async (data: CreateExpenseInput) => {
      const res = await fetch('/api/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error('Failed to create expense')
      return res.json() as Promise<Expense>
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] })
      queryClient.invalidateQueries({ queryKey: ['budgets'] })
    },
  })

  // Update expense
  const updateExpense = useMutation({
    mutationFn: async ({ id, ...data }: UpdateExpenseInput) => {
      const res = await fetch(`/api/expenses/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error('Failed to update expense')
      return res.json() as Promise<Expense>
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] })
      queryClient.invalidateQueries({ queryKey: ['budgets'] })
    },
  })

  // Delete expense
  const deleteExpense = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/expenses/${id}`, {
        method: 'DELETE',
      })
      if (!res.ok) throw new Error('Failed to delete expense')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] })
      queryClient.invalidateQueries({ queryKey: ['budgets'] })
    },
  })

  // Computed stats
  const totalExpenses = computed(() =>
    expensesQuery.data.value?.reduce((sum, e) => sum + e.amount, 0) ?? 0
  )

  const expensesByCategory = computed(() => {
    if (!expensesQuery.data.value) return {}
    return expensesQuery.data.value.reduce(
      (acc, expense) => {
        acc[expense.category] = (acc[expense.category] || 0) + expense.amount
        return acc
      },
      {} as Record<string, number>
    )
  })

  const topCategory = computed(() => {
    const categories = expensesByCategory.value
    const entries = Object.entries(categories)
    if (entries.length === 0) return null
    const [name, amount] = entries.sort((a, b) => b[1] - a[1])[0]
    return { name, amount }
  })

  return {
    // Queries
    expenses: expensesQuery.data,
    isLoading: expensesQuery.isLoading,
    isError: expensesQuery.isError,
    error: expensesQuery.error,
    refetch: expensesQuery.refetch,

    // Mutations
    createExpense,
    updateExpense,
    deleteExpense,

    // Computed
    totalExpenses,
    expensesByCategory,
    topCategory,
  }
}

// Composable for categories
export function useCategories() {
  return useQuery({
    queryKey: ['expense-categories'],
    queryFn: async () => {
      const res = await fetch('/api/expenses/categories')
      if (!res.ok) throw new Error('Failed to fetch categories')
      return res.json() as Promise<Category[]>
    },
    staleTime: 1000 * 60 * 60, // 1 hour - categories rarely change
  })
}

// Composable for budgets
export function useBudgets(month?: Ref<string> | string) {
  const queryClient = useQueryClient()
  const monthValue = computed(() => (typeof month === 'string' ? month : month?.value))

  // Fetch budgets
  const budgetsQuery = useQuery({
    queryKey: computed(() => ['budgets', monthValue.value]),
    queryFn: async () => {
      const url = monthValue.value
        ? `/api/budgets?month=${monthValue.value}`
        : '/api/budgets'
      const res = await fetch(url)
      if (!res.ok) throw new Error('Failed to fetch budgets')
      return res.json() as Promise<Budget[]>
    },
  })

  // Get current month's budget
  const currentBudget = computed(() => {
    if (!budgetsQuery.data.value) return null
    const [year, month] = (monthValue.value || getCurrentMonth()).split('-').map(Number)
    return budgetsQuery.data.value.find((b) => b.month === month && b.year === year) ?? null
  })

  // Create budget
  const createBudget = useMutation({
    mutationFn: async (data: CreateBudgetInput) => {
      const res = await fetch('/api/budgets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error('Failed to create budget')
      return res.json() as Promise<Budget>
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgets'] })
    },
  })

  // Budget usage percentages
  const budgetUsage = computed(() => {
    const budget = currentBudget.value
    if (!budget) return null
    return {
      needs: budget.needsLimit > 0 ? (budget.needsActual / budget.needsLimit) * 100 : 0,
      wants: budget.wantsLimit > 0 ? (budget.wantsActual / budget.wantsLimit) * 100 : 0,
      savings: budget.savingsLimit > 0 ? (budget.savingsActual / budget.savingsLimit) * 100 : 0,
      total:
        budget.income > 0
          ? ((budget.needsActual + budget.wantsActual + budget.savingsActual) / budget.income) *
            100
          : 0,
    }
  })

  return {
    budgets: budgetsQuery.data,
    currentBudget,
    isLoading: budgetsQuery.isLoading,
    isError: budgetsQuery.isError,
    error: budgetsQuery.error,
    refetch: budgetsQuery.refetch,
    createBudget,
    budgetUsage,
  }
}

// Composable for expense rules
export function useExpenseRules() {
  const queryClient = useQueryClient()

  const rulesQuery = useQuery({
    queryKey: ['expense-rules'],
    queryFn: async () => {
      const res = await fetch('/api/expense-rules')
      if (!res.ok) throw new Error('Failed to fetch expense rules')
      return res.json() as Promise<ExpenseRule[]>
    },
  })

  const suggestionsQuery = useQuery({
    queryKey: ['expense-rules', 'suggestions'],
    queryFn: async () => {
      const res = await fetch('/api/expense-rules/suggestions')
      if (!res.ok) return [] // Fail silently - suggestions are optional
      return res.json() as Promise<RuleSuggestion[]>
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  })

  const createRule = useMutation({
    mutationFn: async (data: CreateRuleInput) => {
      const res = await fetch('/api/expense-rules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error('Failed to create rule')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expense-rules'] })
    },
  })

  const updateRule = useMutation({
    mutationFn: async ({ id, ...data }: { id: string } & Partial<CreateRuleInput>) => {
      const res = await fetch(`/api/expense-rules/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error('Failed to update rule')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expense-rules'] })
    },
  })

  const deleteRule = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/expense-rules/${id}`, {
        method: 'DELETE',
      })
      if (!res.ok) throw new Error('Failed to delete rule')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expense-rules'] })
    },
  })

  const toggleRule = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/expense-rules/${id}/toggle`, {
        method: 'POST',
      })
      if (!res.ok) throw new Error('Failed to toggle rule')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expense-rules'] })
    },
  })

  const testRule = useMutation({
    mutationFn: async (conditions: RuleCondition[]) => {
      const res = await fetch('/api/expense-rules/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conditions }),
      })
      if (!res.ok) throw new Error('Failed to test rule')
      return res.json() as Promise<RuleTestResult>
    },
  })

  return {
    rules: rulesQuery.data,
    suggestions: suggestionsQuery.data,
    isLoading: rulesQuery.isLoading,
    isSuggestionsLoading: suggestionsQuery.isLoading,
    createRule,
    updateRule,
    deleteRule,
    toggleRule,
    testRule,
    refetch: rulesQuery.refetch,
    refetchSuggestions: suggestionsQuery.refetch,
  }
}

// Composable for AI categorization
export function useAICategorization() {
  return useMutation({
    mutationFn: async (description: string) => {
      const res = await fetch(`/api/expenses/ai/categorize?description=${encodeURIComponent(description)}`)
      if (!res.ok) throw new Error('Failed to categorize')
      return res.json() as Promise<AICategorization>
    },
  })
}
