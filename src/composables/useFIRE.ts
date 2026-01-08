/**
 * FIRE & Goals Composables
 * Vue Query hooks for FIRE metrics, projections, Monte Carlo, and goals
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query'
import { computed, type Ref } from 'vue'

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
  // FIRE types
  leanFIRE: number
  regularFIRE: number
  fatFIRE: number
  coastFIRE: number
  coastFIREAge: number
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
  crossoverDate: string
  monthsToGo: number
  yearsToGo: number
  currentExpenses: number
  currentInvestmentIncome: number
  crossoverPercent: number
  projectedData: Array<{
    date: string
    expenses: number
    investmentIncome: number
  }>
}

export interface ExpenseCoverage {
  totalCovered: number
  totalExpenses: number
  coveragePercent: number
  categories: Array<{
    name: string
    amount: number
    covered: boolean
    coveragePercent: number
    icon: string
  }>
}

export interface FIREProjection {
  years: number[]
  corpus: number[]
  expenses: number[]
  investmentIncome: number[]
  contributions: number[]
  fireYear: number
  fireAge: number
  lifeEvents: LifeEvent[]
}

export interface LifeEvent {
  id: string
  name: string
  year: number
  amount: number
  type: 'income' | 'expense' | 'one_time'
  category: 'financial' | 'lifestyle'
  icon: string
}

export interface MonteCarloResult {
  successRate: number
  medianEndingValue: number
  percentile10: number
  percentile25: number
  percentile50: number
  percentile75: number
  percentile90: number
  yearByYearPercentiles: Array<{
    year: number
    p10: number
    p25: number
    p50: number
    p75: number
    p90: number
  }>
  scenarios: {
    best: number[]
    median: number[]
    worst: number[]
  }
  runsCount: number
}

export interface Goal {
  id: string
  name: string
  category: GoalCategory
  targetAmount: number
  currentAmount: number
  targetDate: string
  monthlySIP: number
  expectedReturn: number
  status: 'on_track' | 'at_risk' | 'off_track' | 'completed'
  progressPercent: number
  icon: string
  color: string
  projectedDate: string
  monthsRemaining: number
  createdAt: string
  updatedAt: string
}

export type GoalCategory =
  | 'house'
  | 'car'
  | 'education'
  | 'travel'
  | 'emergency'
  | 'wedding'
  | 'retirement'
  | 'business'
  | 'parents_care'
  | 'other'

export interface CreateGoalInput {
  name: string
  category: GoalCategory
  targetAmount: number
  currentAmount?: number
  targetDate: string
  monthlySIP?: number
  expectedReturn?: number
  icon?: string
  color?: string
}

export interface WithdrawalStrategy {
  type: 'swr' | 'bucket' | 'vpw' | 'guyton_klinger'
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

export interface FIREMilestone {
  percent: number
  label: string
  achieved: boolean
  achievedDate?: string
  icon: string
}

// ============================================
// API Functions
// ============================================

async function fetchFIREMetrics(): Promise<FIREMetrics> {
  const res = await fetch('/api/fire/metrics')
  if (!res.ok) throw new Error('Failed to fetch FIRE metrics')
  return res.json()
}

async function fetchFreedomScore(): Promise<FreedomScore> {
  const res = await fetch('/api/fire/freedom-score')
  if (!res.ok) {
    // Return mock data if API not ready
    return {
      total: 72,
      domains: {
        save: {
          score: 20,
          maxScore: 25,
          factors: [
            { name: 'Savings Rate', score: 15, maxScore: 18, description: '42% savings rate' },
            { name: 'Expense Control', score: 5, maxScore: 7, description: 'Expenses under budget' }
          ]
        },
        grow: {
          score: 18,
          maxScore: 25,
          factors: [
            { name: 'Portfolio Growth', score: 12, maxScore: 15, description: '12% annual returns' },
            { name: 'Net Worth Trend', score: 6, maxScore: 10, description: 'Growing steadily' }
          ]
        },
        protect: {
          score: 16,
          maxScore: 25,
          factors: [
            { name: 'Emergency Fund', score: 8, maxScore: 10, description: '6 months covered' },
            { name: 'Insurance', score: 6, maxScore: 10, description: 'Term + Health active' },
            { name: 'Diversification', score: 2, maxScore: 5, description: 'Moderate diversification' }
          ]
        },
        ready: {
          score: 18,
          maxScore: 25,
          factors: [
            { name: 'FIRE Progress', score: 10, maxScore: 15, description: '68% to crossover' },
            { name: 'Goals On Track', score: 4, maxScore: 5, description: '3 of 4 on track' },
            { name: 'Withdrawal Plan', score: 4, maxScore: 5, description: 'Bucket strategy set' }
          ]
        }
      },
      status: 'good',
      message: 'Solid foundation. Small tweaks can accelerate your journey.'
    }
  }
  return res.json()
}

async function fetchCrossoverPoint(): Promise<CrossoverPoint> {
  const res = await fetch('/api/fire/crossover')
  if (!res.ok) {
    // Return mock data if API not ready
    const months = Array.from({ length: 120 }, (_, i) => {
      const date = new Date()
      date.setMonth(date.getMonth() + i)
      return {
        date: date.toISOString().slice(0, 7),
        expenses: 85000 * Math.pow(1.06 / 12, i),
        investmentIncome: 52000 * Math.pow(1.12 / 12, i)
      }
    })
    return {
      crossoverDate: '2031-11',
      monthsToGo: 70,
      yearsToGo: 5.8,
      currentExpenses: 85000,
      currentInvestmentIncome: 52000,
      crossoverPercent: 61,
      projectedData: months
    }
  }
  return res.json()
}

async function fetchExpenseCoverage(): Promise<ExpenseCoverage> {
  const res = await fetch('/api/fire/expense-coverage')
  if (!res.ok) {
    // Return mock data
    return {
      totalCovered: 36000,
      totalExpenses: 85000,
      coveragePercent: 42,
      categories: [
        { name: 'Groceries', amount: 15000, covered: true, coveragePercent: 100, icon: 'mdi-cart' },
        { name: 'Utilities', amount: 5000, covered: true, coveragePercent: 100, icon: 'mdi-flash' },
        { name: 'Internet', amount: 2000, covered: true, coveragePercent: 100, icon: 'mdi-wifi' },
        { name: 'Transport', amount: 6000, covered: true, coveragePercent: 100, icon: 'mdi-car' },
        { name: 'Insurance', amount: 8000, covered: true, coveragePercent: 100, icon: 'mdi-shield' },
        { name: 'Housing', amount: 25000, covered: false, coveragePercent: 48, icon: 'mdi-home' },
        { name: 'Lifestyle', amount: 12000, covered: false, coveragePercent: 0, icon: 'mdi-shopping' },
        { name: 'Misc', amount: 12000, covered: false, coveragePercent: 0, icon: 'mdi-dots-horizontal' }
      ]
    }
  }
  return res.json()
}

async function fetchFIREProjections(): Promise<FIREProjection> {
  const res = await fetch('/api/fire/projections')
  if (!res.ok) {
    // Return mock 100-year projection
    const currentYear = new Date().getFullYear()
    const years = Array.from({ length: 50 }, (_, i) => currentYear + i)
    const corpus = years.map((_, i) => {
      const base = 5000000
      const growth = Math.pow(1.12, i)
      const contributions = 300000 * i
      return Math.round(base * growth + contributions)
    })
    return {
      years,
      corpus,
      expenses: years.map((_, i) => Math.round(1000000 * Math.pow(1.06, i))),
      investmentIncome: corpus.map(c => Math.round(c * 0.04)),
      contributions: years.map(() => 300000),
      fireYear: currentYear + 6,
      fireAge: 38,
      lifeEvents: [
        { id: '1', name: 'House Purchase', year: currentYear + 2, amount: 2000000, type: 'expense', category: 'financial', icon: 'mdi-home' },
        { id: '2', name: 'Child Birth', year: currentYear + 3, amount: 0, type: 'expense', category: 'lifestyle', icon: 'mdi-baby-carriage' },
        { id: '3', name: 'Child Education', year: currentYear + 18, amount: 5000000, type: 'expense', category: 'financial', icon: 'mdi-school' }
      ]
    }
  }
  return res.json()
}

async function fetchMonteCarlo(): Promise<MonteCarloResult> {
  const res = await fetch('/api/fire/monte-carlo')
  if (!res.ok) {
    // Return mock Monte Carlo results
    const yearByYearPercentiles = Array.from({ length: 30 }, (_, i) => ({
      year: new Date().getFullYear() + i,
      p10: Math.round(5000000 * Math.pow(1.04, i)),
      p25: Math.round(5000000 * Math.pow(1.07, i)),
      p50: Math.round(5000000 * Math.pow(1.10, i)),
      p75: Math.round(5000000 * Math.pow(1.13, i)),
      p90: Math.round(5000000 * Math.pow(1.16, i))
    }))
    return {
      successRate: 87,
      medianEndingValue: 85000000,
      percentile10: 25000000,
      percentile25: 45000000,
      percentile50: 85000000,
      percentile75: 140000000,
      percentile90: 220000000,
      yearByYearPercentiles,
      scenarios: {
        best: yearByYearPercentiles.map(y => y.p90),
        median: yearByYearPercentiles.map(y => y.p50),
        worst: yearByYearPercentiles.map(y => y.p10)
      },
      runsCount: 10000
    }
  }
  return res.json()
}

async function fetchGoals(): Promise<Goal[]> {
  const res = await fetch('/api/goals')
  if (!res.ok) {
    // Return mock goals
    return [
      {
        id: '1',
        name: 'House Down Payment',
        category: 'house',
        targetAmount: 2000000,
        currentAmount: 1560000,
        targetDate: '2025-12-31',
        monthlySIP: 40000,
        expectedReturn: 10,
        status: 'on_track',
        progressPercent: 78,
        icon: 'mdi-home',
        color: '#1976d2',
        projectedDate: '2025-10-15',
        monthsRemaining: 11,
        createdAt: '2024-01-15',
        updatedAt: '2025-01-08'
      },
      {
        id: '2',
        name: 'Emergency Fund',
        category: 'emergency',
        targetAmount: 600000,
        currentAmount: 600000,
        targetDate: '2024-12-31',
        monthlySIP: 0,
        expectedReturn: 6,
        status: 'completed',
        progressPercent: 100,
        icon: 'mdi-lifebuoy',
        color: '#ff9800',
        projectedDate: '2024-11-01',
        monthsRemaining: 0,
        createdAt: '2023-06-01',
        updatedAt: '2024-11-01'
      },
      {
        id: '3',
        name: 'Europe Trip',
        category: 'travel',
        targetAmount: 500000,
        currentAmount: 280000,
        targetDate: '2026-06-30',
        monthlySIP: 15000,
        expectedReturn: 8,
        status: 'at_risk',
        progressPercent: 56,
        icon: 'mdi-airplane',
        color: '#00bcd4',
        projectedDate: '2026-08-15',
        monthsRemaining: 18,
        createdAt: '2024-06-01',
        updatedAt: '2025-01-08'
      }
    ]
  }
  return res.json()
}

async function createGoal(input: CreateGoalInput): Promise<Goal> {
  const res = await fetch('/api/goals', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input)
  })
  if (!res.ok) throw new Error('Failed to create goal')
  return res.json()
}

async function updateGoal(id: string, input: Partial<CreateGoalInput>): Promise<Goal> {
  const res = await fetch(`/api/goals/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input)
  })
  if (!res.ok) throw new Error('Failed to update goal')
  return res.json()
}

async function deleteGoal(id: string): Promise<void> {
  const res = await fetch(`/api/goals/${id}`, {
    method: 'DELETE'
  })
  if (!res.ok) throw new Error('Failed to delete goal')
}

async function fetchWithdrawalStrategies(): Promise<WithdrawalStrategy[]> {
  const res = await fetch('/api/withdrawal-strategy')
  if (!res.ok) {
    // Return mock strategies
    const corpus = 25500000 // 2.55 Cr
    return [
      {
        type: 'swr',
        name: '4% Rule (SWR)',
        description: 'Fixed inflation-adjusted withdrawal of 4% of initial portfolio',
        annualWithdrawal: corpus * 0.04,
        monthlyWithdrawal: (corpus * 0.04) / 12,
        successRate: 95,
        medianEndingValue: 45000000,
        worstCaseYears: 33
      },
      {
        type: 'bucket',
        name: 'Bucket Strategy',
        description: 'Three-bucket approach: Cash, Bonds, Equity for sequence risk mitigation',
        annualWithdrawal: 1000000,
        monthlyWithdrawal: 83333,
        successRate: 92,
        medianEndingValue: 38000000,
        worstCaseYears: 30,
        buckets: {
          cash: { amount: corpus * 0.08, percent: 8, yearsOfExpenses: 2 },
          bonds: { amount: corpus * 0.20, percent: 20, yearsOfExpenses: 5 },
          equity: { amount: corpus * 0.72, percent: 72, yearsOfExpenses: 18 }
        }
      },
      {
        type: 'vpw',
        name: 'Variable Percentage Withdrawal (VPW)',
        description: 'Withdrawal adjusts to market performance, portfolio never depletes',
        annualWithdrawal: 1100000,
        monthlyWithdrawal: 91667,
        successRate: 100,
        medianEndingValue: 25000000,
        worstCaseYears: 45
      },
      {
        type: 'guyton_klinger',
        name: 'Guyton-Klinger',
        description: 'Dynamic guardrails allow higher initial withdrawal with adjustments',
        annualWithdrawal: 1300000,
        monthlyWithdrawal: 108333,
        successRate: 88,
        medianEndingValue: 32000000,
        worstCaseYears: 28
      }
    ]
  }
  return res.json()
}

// ============================================
// Vue Query Hooks
// ============================================

export function useFIREMetrics() {
  return useQuery({
    queryKey: ['fire', 'metrics'],
    queryFn: fetchFIREMetrics,
    staleTime: 5 * 60 * 1000 // 5 minutes
  })
}

export function useFreedomScore() {
  return useQuery({
    queryKey: ['fire', 'freedom-score'],
    queryFn: fetchFreedomScore,
    staleTime: 5 * 60 * 1000
  })
}

export function useCrossoverPoint() {
  return useQuery({
    queryKey: ['fire', 'crossover'],
    queryFn: fetchCrossoverPoint,
    staleTime: 5 * 60 * 1000
  })
}

export function useExpenseCoverage() {
  return useQuery({
    queryKey: ['fire', 'expense-coverage'],
    queryFn: fetchExpenseCoverage,
    staleTime: 5 * 60 * 1000
  })
}

export function useFIREProjections() {
  return useQuery({
    queryKey: ['fire', 'projections'],
    queryFn: fetchFIREProjections,
    staleTime: 10 * 60 * 1000 // 10 minutes
  })
}

export function useMonteCarlo() {
  return useQuery({
    queryKey: ['fire', 'monte-carlo'],
    queryFn: fetchMonteCarlo,
    staleTime: 10 * 60 * 1000
  })
}

export function useGoals() {
  return useQuery({
    queryKey: ['goals'],
    queryFn: fetchGoals,
    staleTime: 2 * 60 * 1000 // 2 minutes
  })
}

export function useWithdrawalStrategies() {
  return useQuery({
    queryKey: ['withdrawal-strategies'],
    queryFn: fetchWithdrawalStrategies,
    staleTime: 10 * 60 * 1000
  })
}

export function useCreateGoal() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createGoal,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] })
    }
  })
}

export function useUpdateGoal() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateGoalInput> }) =>
      updateGoal(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] })
    }
  })
}

export function useDeleteGoal() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deleteGoal,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] })
    }
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
    case 'on_track': return 'success'
    case 'at_risk': return 'warning'
    case 'off_track': return 'error'
    case 'completed': return 'primary'
    default: return 'grey'
  }
}

export const getGoalStatusIcon = (status: Goal['status']): string => {
  switch (status) {
    case 'on_track': return 'mdi-check-circle'
    case 'at_risk': return 'mdi-alert-circle'
    case 'off_track': return 'mdi-close-circle'
    case 'completed': return 'mdi-trophy'
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
  house: { icon: 'mdi-home', color: '#1976d2', label: 'House' },
  car: { icon: 'mdi-car', color: '#43a047', label: 'Car' },
  education: { icon: 'mdi-school', color: '#7b1fa2', label: 'Education' },
  travel: { icon: 'mdi-airplane', color: '#00bcd4', label: 'Travel' },
  emergency: { icon: 'mdi-lifebuoy', color: '#ff9800', label: 'Emergency Fund' },
  wedding: { icon: 'mdi-ring', color: '#e91e63', label: 'Wedding' },
  retirement: { icon: 'mdi-beach', color: '#8d6e63', label: 'Retirement' },
  business: { icon: 'mdi-briefcase', color: '#607d8b', label: 'Business' },
  parents_care: { icon: 'mdi-account-heart', color: '#f44336', label: 'Parents Care' },
  other: { icon: 'mdi-star', color: '#9c27b0', label: 'Other' }
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
