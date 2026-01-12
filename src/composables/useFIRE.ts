/**
 * FIRE & Goals Composables
 * Vue Query hooks for FIRE metrics, projections, Monte Carlo, and goals
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query'
import { computed } from 'vue'
import { useUiStore } from '@/stores/ui'

// ============================================
// Types
// ============================================

export interface FIREMetrics {
  fireNumber: number
  currentCorpus: number
  progressPercent: number
  yearsToFIRE: number
  monthsToFIRE: number
  annualExpenses: number
  monthlySavings: number
  savingsRate: number
  safeWithdrawalRate: number
  expectedReturns: number
  inflationRate: number
  healthcareInflation: number
  // FIRE variants
  leanFIRE: number
  regularFIRE: number
  fatFIRE: number
  coastFIRE: number
  baristaFIRE?: number
  coastFIREAge: number
  // Freedom score (cached)
  freedomScore?: number
  freedomScoreSave?: number
  freedomScoreGrow?: number
  freedomScoreProtect?: number
  freedomScoreReady?: number
}

export interface FreedomScore {
  total: number
  domains: {
    save: { score: number; maxScore: number; factors: ScoreFactor[] }
    grow: { score: number; maxScore: number; factors: ScoreFactor[] }
    protect: { score: number; maxScore: number; factors: ScoreFactor[] }
    ready: { score: number; maxScore: number; factors: ScoreFactor[] }
  }
  status: 'excellent' | 'on_track' | 'good' | 'fair' | 'needs_work'
  message: string
}

export interface ScoreFactor {
  name: string
  score: number
  maxScore: number
  description: string
}

export interface CrossoverPoint {
  currentState: {
    corpus: number
    monthlyExpenses: number
    monthlySavings: number
    monthlyIncome: number
    currentPassiveIncome: number
    passiveIncomePercent: number
  }
  crossover: {
    months: number
    years: number
    targetCorpus: number
    projectedDate: string
  } | null
  parameters: {
    swr: number
    expectedReturns: number
    inflation: number
  }
  chartData: Array<{
    month: number
    year: number
    corpus: number
    passiveIncome: number
    expenses: number
    isCrossover: boolean
  }>
}

export interface ExpenseCoverage {
  summary: {
    currentCorpus: number
    annualPassiveIncome: number
    monthlyPassiveIncome: number
    totalAnnualExpenses: number
    overallCoveragePercent: number
    categoriesCovered: number
    totalCategories: number
    swr: number
  }
  categories: Array<{
    category: string
    annualAmount: number
    monthlyAmount: number
    priority: number
    cumulativeExpense: number
    isCovered: boolean
    coveragePercent: number
    status: 'covered' | 'partial' | 'not_covered'
    statusColor: string
  }>
  insights: string[]
}

export interface FIREProjection {
  summary: {
    currentAge: number
    targetRetirementAge: number
    currentCorpus: number
    fireYear: number | null
    peakCorpusAge: number
    peakCorpusAmount: number
    depletionAge: number | null
    projectionSuccess: boolean
  }
  parameters: {
    preRetirementReturns: number
    postRetirementReturns: number
    generalInflation: number
    healthcareInflation: number
    swr: number
    monthlySavings: number
  }
  projections: Array<{
    year: number
    age: number
    phase: 'accumulation' | 'retirement'
    corpus: number
    contributions: number
    returns: number
    withdrawals: number
    expenses: number
    events: LifeEvent[]
  }>
  lifeEvents: LifeEvent[]
  sensitivityAnalysis: Array<{
    variable: string
    impact: { yearsChange: number; corpusChange: number }
    riskLevel: string
  }>
}

export interface LifeEvent {
  year: number
  age: number
  event: string
  impact: number
  type: 'expense' | 'income' | 'milestone'
}

export interface MonteCarloResult {
  id: string
  runsCount: number
  yearsSimulated: number
  startingCorpus: number
  annualWithdrawal: number
  equityAllocation: number
  successRate: number
  medianEndingValue: number
  percentiles: {
    p10: number
    p25: number
    p50: number
    p75: number
    p90: number
  }
  yearByYearData: Array<{
    year: number
    p10: number
    p25: number
    p50: number
    p75: number
    p90: number
  }>
  scenarioSamples: {
    worst: number[]
    poor: number[]
    median: number[]
    good: number[]
    best: number[]
  }
  interpretation: {
    status: 'excellent' | 'good' | 'fair' | 'poor'
    message: string
    recommendations: string[]
  }
  cached: boolean
  calculatedAt: string
  expiresAt: string
}

export interface Goal {
  id: string
  goalName: string
  category: GoalCategory
  targetAmount: number
  currentAmount: number
  targetDate: string
  monthlyContribution: number
  expectedReturns: number
  status: 'ON_TRACK' | 'AT_RISK' | 'OFF_TRACK' | 'COMPLETED'
  progressPercent: number
  icon: string | null
  color: string | null
  projectedDate: string | null
  sipRecommended: number | null
  currentInsight: string | null
  milestones: GoalMilestone[]
  createdAt: string
  updatedAt: string
}

export type GoalCategory =
  | 'HOUSE'
  | 'CAR'
  | 'EDUCATION'
  | 'TRAVEL'
  | 'EMERGENCY'
  | 'WEDDING'
  | 'RETIREMENT'
  | 'BUSINESS'
  | 'PARENTS_CARE'
  | 'FIRE_CORPUS'
  | 'OTHER'

export interface GoalMilestone {
  id: string
  goalId: string
  percent: number
  achieved: boolean
  achievedAt: string | null
  celebrationType: string | null
  badgeIcon: string | null
}

export interface CreateGoalInput {
  goalName: string
  goalType: string
  category: GoalCategory | string
  targetAmount: number
  currentAmount?: number
  targetDate: string
  monthlyContribution?: number
  expectedReturns?: number
  icon?: string
  color?: string
}

export interface WithdrawalStrategyPrefs {
  id: string
  userId: string
  activeStrategy: WithdrawalStrategyType
  customSWR: number
  bucketCashYears: number
  bucketBondsYears: number
  bucketEquityPercent: number
  gkUpperGuardrail: number
  gkLowerGuardrail: number
  gkMaxIncrease: number
  gkMaxDecrease: number
  vpwStartAge: number | null
  vpwEndAge: number
}

export type WithdrawalStrategyType =
  | 'SWR_4_PERCENT'
  | 'SWR_CUSTOM'
  | 'BUCKET'
  | 'VPW'
  | 'GUYTON_KLINGER'

export interface WithdrawalStrategyComparison {
  type: WithdrawalStrategyType
  name: string
  description: string
  annualWithdrawal: number
  monthlyWithdrawal: number
  successRate: number
  medianEndingValue: number
  worstCaseYears: number
  buckets?: {
    cash: { amount: number; percent: number; yearsOfExpenses: number }
    bonds: { amount: number; percent: number; yearsOfExpenses: number }
    equity: { amount: number; percent: number; yearsOfExpenses: number }
  }
}

export interface FIREExportData {
  reportInfo: {
    title: string
    generatedAt: string
    userName: string
    userEmail: string
    format: string
  }
  summary: {
    currentAge: number
    targetRetirementAge: number
    yearsToFIRE: number
    fireNumber: number
    currentCorpus: number
    progressPercent: number
    freedomScore: number
    savingsRate: number
    monthlyPassiveIncome: number
  }
  fireVariants: {
    leanFIRE: number
    regularFIRE: number
    fatFIRE: number
    coastFIRE: number
    baristaFIRE: number
  }
  freedomScore: {
    total: number
    save: number
    grow: number
    protect: number
    ready: number
  }
  portfolioSummary: Record<string, unknown>
  goals: Array<Record<string, unknown>>
  goalsSummary: Record<string, unknown>
  withdrawalStrategy: Record<string, unknown> | null
  monteCarlo: Record<string, unknown> | null
  protection: Record<string, unknown>
  assumptions: Record<string, unknown>
  recommendations: string[]
}

export interface FIREMilestone {
  percent: number
  label: string
  achieved: boolean
  achievedDate?: string
  icon: string
}

// ============================================
// Helper to build query params with family view
// ============================================

function buildQueryParams() {
  const uiStore = useUiStore()
  const params = new URLSearchParams()
  if (uiStore.isFamilyView) {
    params.append('familyView', 'true')
    if (uiStore.selectedFamilyMemberId) {
      params.append('familyMemberId', uiStore.selectedFamilyMemberId)
    }
  }
  return params.toString() ? `?${params.toString()}` : ''
}

// ============================================
// Vue Query Hooks - FIRE Metrics
// ============================================

export function useFIREMetrics() {
  const uiStore = useUiStore()
  return useQuery({
    queryKey: computed(() => ['fire', 'metrics', uiStore.isFamilyView, uiStore.selectedFamilyMemberId]),
    queryFn: async (): Promise<FIREMetrics> => {
      const res = await fetch(`/api/fire/metrics${buildQueryParams()}`)
      if (!res.ok) throw new Error('Failed to fetch FIRE metrics')
      return res.json()
    },
    staleTime: 5 * 60 * 1000 // 5 minutes
  })
}

export function useFreedomScore() {
  const uiStore = useUiStore()
  return useQuery({
    queryKey: computed(() => ['fire', 'freedom-score', uiStore.isFamilyView, uiStore.selectedFamilyMemberId]),
    queryFn: async (): Promise<FreedomScore> => {
      const res = await fetch(`/api/fire/freedom-score${buildQueryParams()}`)
      if (!res.ok) throw new Error('Failed to fetch freedom score')
      return res.json()
    },
    staleTime: 5 * 60 * 1000
  })
}

export function useCrossoverPoint() {
  const uiStore = useUiStore()
  return useQuery({
    queryKey: computed(() => ['fire', 'crossover', uiStore.isFamilyView, uiStore.selectedFamilyMemberId]),
    queryFn: async (): Promise<CrossoverPoint> => {
      const res = await fetch(`/api/fire/crossover${buildQueryParams()}`)
      if (!res.ok) throw new Error('Failed to fetch crossover point')
      return res.json()
    },
    staleTime: 5 * 60 * 1000
  })
}

export function useExpenseCoverage() {
  const uiStore = useUiStore()
  return useQuery({
    queryKey: computed(() => ['fire', 'expense-coverage', uiStore.isFamilyView, uiStore.selectedFamilyMemberId]),
    queryFn: async (): Promise<ExpenseCoverage> => {
      const res = await fetch(`/api/fire/expense-coverage${buildQueryParams()}`)
      if (!res.ok) throw new Error('Failed to fetch expense coverage')
      return res.json()
    },
    staleTime: 5 * 60 * 1000
  })
}

export function useFIREProjections() {
  const uiStore = useUiStore()
  return useQuery({
    queryKey: computed(() => ['fire', 'projections', uiStore.isFamilyView, uiStore.selectedFamilyMemberId]),
    queryFn: async (): Promise<FIREProjection> => {
      const res = await fetch(`/api/fire/projections${buildQueryParams()}`)
      if (!res.ok) throw new Error('Failed to fetch FIRE projections')
      return res.json()
    },
    staleTime: 10 * 60 * 1000 // 10 minutes
  })
}

export function useMonteCarlo(options?: { runs?: number; years?: number; refresh?: boolean }) {
  const uiStore = useUiStore()
  return useQuery({
    queryKey: computed(() => [
      'fire',
      'monte-carlo',
      options?.runs,
      options?.years,
      options?.refresh,
      uiStore.isFamilyView,
      uiStore.selectedFamilyMemberId
    ]),
    queryFn: async (): Promise<MonteCarloResult> => {
      const params = new URLSearchParams()
      if (options?.runs) params.append('runs', options.runs.toString())
      if (options?.years) params.append('years', options.years.toString())
      if (options?.refresh) params.append('refresh', 'true')

      // Add family view params
      if (uiStore.isFamilyView) {
        params.append('familyView', 'true')
        if (uiStore.selectedFamilyMemberId) {
          params.append('familyMemberId', uiStore.selectedFamilyMemberId)
        }
      }

      const queryString = params.toString() ? `?${params.toString()}` : ''
      const res = await fetch(`/api/fire/monte-carlo${queryString}`)
      if (!res.ok) throw new Error('Failed to run Monte Carlo simulation')
      return res.json()
    },
    staleTime: 10 * 60 * 1000
  })
}

// ============================================
// Vue Query Hooks - Goals
// ============================================

export function useGoals() {
  const uiStore = useUiStore()
  return useQuery({
    queryKey: computed(() => ['goals', uiStore.isFamilyView, uiStore.selectedFamilyMemberId]),
    queryFn: async (): Promise<Goal[]> => {
      const res = await fetch(`/api/goals${buildQueryParams()}`)
      if (!res.ok) throw new Error('Failed to fetch goals')
      return res.json()
    },
    staleTime: 2 * 60 * 1000 // 2 minutes
  })
}

export function useGoal(goalId: string) {
  return useQuery({
    queryKey: ['goal', goalId],
    queryFn: async (): Promise<Goal> => {
      const res = await fetch(`/api/goals/${goalId}`)
      if (!res.ok) throw new Error('Failed to fetch goal')
      return res.json()
    },
    enabled: !!goalId,
    staleTime: 2 * 60 * 1000
  })
}

export function useGoalMilestones(goalId: string) {
  return useQuery({
    queryKey: ['goal', goalId, 'milestones'],
    queryFn: async (): Promise<GoalMilestone[]> => {
      const res = await fetch(`/api/goals/${goalId}/milestones`)
      if (!res.ok) throw new Error('Failed to fetch milestones')
      return res.json()
    },
    enabled: !!goalId,
    staleTime: 2 * 60 * 1000
  })
}

export function useGoalInsight(goalId: string) {
  return useQuery({
    queryKey: ['goal', goalId, 'insight'],
    queryFn: async (): Promise<{ insight: string; generatedAt: string }> => {
      const res = await fetch(`/api/goals/${goalId}/insight`)
      if (!res.ok) throw new Error('Failed to fetch goal insight')
      return res.json()
    },
    enabled: !!goalId,
    staleTime: 5 * 60 * 1000
  })
}

export function useCreateGoal() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: CreateGoalInput): Promise<Goal> => {
      const res = await fetch('/api/goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input)
      })
      if (!res.ok) throw new Error('Failed to create goal')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] })
      queryClient.invalidateQueries({ queryKey: ['fire'] })
    }
  })
}

export function useUpdateGoal() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<CreateGoalInput> }): Promise<Goal> => {
      const res = await fetch(`/api/goals/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      if (!res.ok) throw new Error('Failed to update goal')
      return res.json()
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['goals'] })
      queryClient.invalidateQueries({ queryKey: ['goal', variables.id] })
      queryClient.invalidateQueries({ queryKey: ['fire'] })
    }
  })
}

export function useDeleteGoal() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      const res = await fetch(`/api/goals/${id}`, {
        method: 'DELETE'
      })
      if (!res.ok) throw new Error('Failed to delete goal')
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] })
      queryClient.invalidateQueries({ queryKey: ['fire'] })
    }
  })
}

export function useUpdateGoalProgress() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, amount }: { id: string; amount: number }): Promise<Goal> => {
      const res = await fetch(`/api/goals/${id}/progress`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount })
      })
      if (!res.ok) throw new Error('Failed to update progress')
      return res.json()
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['goals'] })
      queryClient.invalidateQueries({ queryKey: ['goal', variables.id] })
      queryClient.invalidateQueries({ queryKey: ['fire'] })
    }
  })
}

// ============================================
// Vue Query Hooks - Withdrawal Strategy
// ============================================

export function useWithdrawalStrategyPrefs() {
  return useQuery({
    queryKey: ['withdrawal-strategy', 'prefs'],
    queryFn: async (): Promise<WithdrawalStrategyPrefs> => {
      const res = await fetch('/api/withdrawal-strategy')
      if (!res.ok) throw new Error('Failed to fetch withdrawal strategy preferences')
      return res.json()
    },
    staleTime: 10 * 60 * 1000
  })
}

export function useUpdateWithdrawalStrategy() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: Partial<WithdrawalStrategyPrefs>): Promise<WithdrawalStrategyPrefs> => {
      const res = await fetch('/api/withdrawal-strategy', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      if (!res.ok) throw new Error('Failed to update withdrawal strategy')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['withdrawal-strategy'] })
      queryClient.invalidateQueries({ queryKey: ['fire'] })
    }
  })
}

export function useWithdrawalStrategyComparison() {
  const uiStore = useUiStore()
  return useQuery({
    queryKey: computed(() => ['withdrawal-strategy', 'compare', uiStore.isFamilyView, uiStore.selectedFamilyMemberId]),
    queryFn: async (): Promise<WithdrawalStrategyComparison[]> => {
      const res = await fetch(`/api/withdrawal-strategy/compare${buildQueryParams()}`)
      if (!res.ok) throw new Error('Failed to fetch strategy comparison')
      return res.json()
    },
    staleTime: 10 * 60 * 1000
  })
}

// ============================================
// Vue Query Hooks - Export
// ============================================

export function useFIREExport(format: 'json' | 'pdf' | 'xlsx' = 'json') {
  const uiStore = useUiStore()
  return useQuery({
    queryKey: computed(() => ['fire', 'export', format, uiStore.isFamilyView, uiStore.selectedFamilyMemberId]),
    queryFn: async (): Promise<{ success: boolean; format: string; data: FIREExportData; exportInfo: Record<string, unknown> }> => {
      const params = new URLSearchParams()
      params.append('format', format)
      if (uiStore.isFamilyView) {
        params.append('familyView', 'true')
        if (uiStore.selectedFamilyMemberId) {
          params.append('familyMemberId', uiStore.selectedFamilyMemberId)
        }
      }
      const res = await fetch(`/api/fire/export?${params.toString()}`)
      if (!res.ok) throw new Error('Failed to export FIRE data')
      return res.json()
    },
    enabled: false, // Only fetch when manually triggered
    staleTime: 0 // Always fresh for exports
  })
}

// ============================================
// Helper Functions
// ============================================

export const formatINR = (amount: number, compact = false): string => {
  if (compact) {
    const absAmount = Math.abs(amount)
    if (absAmount >= 10000000) {
      return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 2
      }).format(amount / 10000000).replace('INR', '').trim() + ' Cr'
    }
    if (absAmount >= 100000) {
      return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 2
      }).format(amount / 100000).replace('INR', '').trim() + ' L'
    }
    if (absAmount >= 1000) {
      return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0
      }).format(amount / 1000).replace('INR', '').trim() + ' K'
    }
  }
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(amount)
}

export const getGoalStatusColor = (status: Goal['status']): string => {
  switch (status) {
    case 'ON_TRACK': return 'success'
    case 'AT_RISK': return 'warning'
    case 'OFF_TRACK': return 'error'
    case 'COMPLETED': return 'primary'
    default: return 'grey'
  }
}

export const getGoalStatusIcon = (status: Goal['status']): string => {
  switch (status) {
    case 'ON_TRACK': return 'mdi-check-circle'
    case 'AT_RISK': return 'mdi-alert-circle'
    case 'OFF_TRACK': return 'mdi-close-circle'
    case 'COMPLETED': return 'mdi-trophy'
    default: return 'mdi-circle-outline'
  }
}

export const getFreedomScoreStatus = (score: number): FreedomScore['status'] => {
  if (score >= 95) return 'excellent'
  if (score >= 80) return 'on_track'
  if (score >= 65) return 'good'
  if (score >= 40) return 'fair'
  return 'needs_work'
}

export const getFreedomScoreMessage = (status: FreedomScore['status']): string => {
  switch (status) {
    case 'excellent': return 'Financial Freedom is within reach!'
    case 'on_track': return 'Great progress! Stay the course.'
    case 'good': return 'Solid foundation. Small tweaks can accelerate.'
    case 'fair': return 'Some areas need attention.'
    case 'needs_work': return "Let's build your foundation."
    default: return ''
  }
}

export const getFIREMilestones = (progressPercent: number): FIREMilestone[] => {
  return [
    { percent: 25, label: '25%', achieved: progressPercent >= 25, icon: 'mdi-medal-outline' },
    { percent: 50, label: '50%', achieved: progressPercent >= 50, icon: 'mdi-medal' },
    { percent: 75, label: '75%', achieved: progressPercent >= 75, icon: 'mdi-trophy-outline' },
    { percent: 100, label: 'FIRE!', achieved: progressPercent >= 100, icon: 'mdi-trophy' }
  ]
}

export const goalCategoryConfig: Record<GoalCategory, { icon: string; color: string; label: string }> = {
  HOUSE: { icon: 'mdi-home', color: '#1976d2', label: 'House' },
  CAR: { icon: 'mdi-car', color: '#43a047', label: 'Car' },
  EDUCATION: { icon: 'mdi-school', color: '#7b1fa2', label: 'Education' },
  TRAVEL: { icon: 'mdi-airplane', color: '#00bcd4', label: 'Travel' },
  EMERGENCY: { icon: 'mdi-lifebuoy', color: '#ff9800', label: 'Emergency Fund' },
  WEDDING: { icon: 'mdi-ring', color: '#e91e63', label: 'Wedding' },
  RETIREMENT: { icon: 'mdi-beach', color: '#8d6e63', label: 'Retirement' },
  BUSINESS: { icon: 'mdi-briefcase', color: '#607d8b', label: 'Business' },
  PARENTS_CARE: { icon: 'mdi-account-heart', color: '#f44336', label: 'Parents Care' },
  FIRE_CORPUS: { icon: 'mdi-fire', color: '#ff5722', label: 'FIRE Corpus' },
  OTHER: { icon: 'mdi-star', color: '#9c27b0', label: 'Other' }
}

// Calculate recommended SIP for a goal
export function calculateRecommendedSIP(
  targetAmount: number,
  currentAmount: number,
  monthsRemaining: number,
  expectedReturn: number = 12
): number {
  if (monthsRemaining <= 0) return 0

  const gap = targetAmount - currentAmount
  if (gap <= 0) return 0

  const monthlyRate = expectedReturn / 100 / 12

  // Future value of annuity formula solved for PMT
  // FV = PMT * ((1 + r)^n - 1) / r
  // PMT = FV * r / ((1 + r)^n - 1)

  if (monthlyRate === 0) {
    return Math.round(gap / monthsRemaining)
  }

  const factor = Math.pow(1 + monthlyRate, monthsRemaining) - 1
  const sip = (gap * monthlyRate) / factor

  return Math.round(sip)
}

// Get withdrawal strategy display info
export const withdrawalStrategyConfig: Record<WithdrawalStrategyType, { name: string; description: string; icon: string }> = {
  SWR_4_PERCENT: {
    name: '4% Rule',
    description: 'Classic safe withdrawal rate - withdraw 4% of initial portfolio annually, adjusted for inflation',
    icon: 'mdi-percent'
  },
  SWR_CUSTOM: {
    name: 'Custom SWR',
    description: 'Custom safe withdrawal rate tailored to your risk tolerance (3.5% recommended for India)',
    icon: 'mdi-tune'
  },
  BUCKET: {
    name: 'Bucket Strategy',
    description: 'Three-bucket approach: Cash (2yr), Bonds (5yr), Equity (rest) for sequence risk mitigation',
    icon: 'mdi-bucket'
  },
  VPW: {
    name: 'Variable Percentage Withdrawal',
    description: 'Withdrawal adjusts to portfolio performance and remaining years - portfolio never fully depletes',
    icon: 'mdi-chart-line-variant'
  },
  GUYTON_KLINGER: {
    name: 'Guyton-Klinger Guardrails',
    description: 'Dynamic withdrawals with guardrails (±20%) allowing higher initial withdrawal with market adjustments',
    icon: 'mdi-shield-half-full'
  }
}

// ============================================
// Alias exports for backward compatibility
// ============================================

// Alias for useWithdrawalStrategyComparison
export const useWithdrawalStrategies = useWithdrawalStrategyComparison

// Type alias for WithdrawalStrategyComparison
export type WithdrawalStrategy = WithdrawalStrategyComparison
