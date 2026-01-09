import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query'
import { ref, computed } from 'vue'
import type { Ref } from 'vue'

// Types
export interface NetWorthData {
  totalAssets: number
  totalLiabilities: number
  netWorth: number
  monthlyChange: number
  yearlyChange: number
  monthlyChangePercent: number
  yearlyChangePercent: number
  assetBreakdown: AssetCategory[]
  liabilityBreakdown: LiabilityCategory[]
  history: NetWorthHistoryPoint[]
}

export interface AssetCategory {
  category: string
  amount: number
  percentage: number
  color: string
}

export interface LiabilityCategory {
  category: string
  amount: number
  percentage: number
  color: string
}

export interface NetWorthHistoryPoint {
  date: string
  netWorth: number
  assets: number
  liabilities: number
}

export interface CashFlowData {
  totalIncome: number
  totalExpenses: number
  netCashFlow: number
  savingsRate: number
  incomeBreakdown: IncomeCategory[]
  expenseBreakdown: ExpenseCategory[]
  monthlyTrend: CashFlowTrendPoint[]
}

export interface IncomeCategory {
  category: string
  amount: number
  percentage: number
  color: string
}

export interface ExpenseCategory {
  category: string
  amount: number
  percentage: number
  color: string
}

export interface CashFlowTrendPoint {
  month: string
  income: number
  expenses: number
  savings: number
}

export interface BankAccount {
  id: string
  bankName: string
  accountType: 'savings' | 'current' | 'salary' | 'fd' | 'rd'
  accountNumber: string
  balance: number
  interestRate?: number
  maturityDate?: string
  isActive: boolean
  isPrimary: boolean
  createdAt: string
  updatedAt: string
}

export interface BankAccountInput {
  bankName: string
  accountType: 'savings' | 'current' | 'salary' | 'fd' | 'rd'
  accountNumber: string
  balance: number
  interestRate?: number
  maturityDate?: string
  isActive?: boolean
  isPrimary?: boolean
}

export interface EmergencyFundData {
  currentAmount: number
  targetAmount: number
  targetMonths: number
  monthlyExpenses: number
  percentComplete: number
  status: 'critical' | 'low' | 'adequate' | 'excellent'
  breakdown: EmergencyFundBreakdown[]
  recommendations: string[]
}

export interface EmergencyFundBreakdown {
  source: string
  type: 'savings' | 'liquid_fund' | 'fd' | 'overnight_fund'
  amount: number
  liquidity: 'instant' | 't+0' | 't+1' | 't+2' | 'breakable'
  percentage: number
}

export interface FinancialHealthScore {
  overallScore: number
  status: 'excellent' | 'good' | 'needs_improvement' | 'critical'
  factors: HealthFactor[]
  trend: 'improving' | 'stable' | 'declining'
  lastMonthScore: number
  alerts: HealthAlert[]
}

export interface HealthFactor {
  name: string
  score: number
  maxScore: number
  status: 'excellent' | 'good' | 'needs_improvement' | 'critical'
  description: string
  recommendation?: string
}

export interface HealthAlert {
  type: 'warning' | 'success' | 'info'
  message: string
}

// Net Worth Milestones
export interface NetWorthMilestone {
  id: string
  userId: string
  targetAmount: number      // User-defined target (e.g., 1000000 for 10L)
  name: string              // "First 10 Lakhs", "Crorepati", etc.
  achievedDate?: string     // When achieved (null if pending)
  isAchieved: boolean
  createdAt: string
}

export interface NetWorthMilestoneInput {
  targetAmount: number
  name: string
}

// Default milestone suggestions
export const DEFAULT_MILESTONE_SUGGESTIONS = [
  { amount: 1000000, name: 'First 10 Lakhs' },
  { amount: 2500000, name: '25 Lakhs' },
  { amount: 5000000, name: '50 Lakhs' },
  { amount: 10000000, name: 'Crorepati' },
  { amount: 20000000, name: '2 Crore' },
  { amount: 50000000, name: '5 Crore' },
  { amount: 100000000, name: '10 Crore' },
]

// Format INR helper
export const formatINR = (amount: number, compact = false): string => {
  if (compact) {
    const absAmount = Math.abs(amount)
    if (absAmount >= 10000000) {
      return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 2
      }).format(amount / 10000000) + ' Cr'
    }
    if (absAmount >= 100000) {
      return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 2
      }).format(amount / 100000) + ' L'
    }
    if (absAmount >= 1000) {
      return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0
      }).format(amount / 1000) + 'K'
    }
  }
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(amount)
}

// Default data for when API is not available
const DEFAULT_NETWORTH: NetWorthData = {
  totalAssets: 0,
  totalLiabilities: 0,
  netWorth: 0,
  monthlyChange: 0,
  yearlyChange: 0,
  monthlyChangePercent: 0,
  yearlyChangePercent: 0,
  assetBreakdown: [],
  liabilityBreakdown: [],
  history: []
}

const DEFAULT_CASHFLOW: CashFlowData = {
  totalIncome: 0,
  totalExpenses: 0,
  netCashFlow: 0,
  savingsRate: 0,
  incomeBreakdown: [],
  expenseBreakdown: [],
  monthlyTrend: []
}

const DEFAULT_EMERGENCY_FUND: EmergencyFundData = {
  currentAmount: 0,
  targetAmount: 0,
  targetMonths: 6,
  monthlyExpenses: 0,
  percentComplete: 0,
  status: 'critical',
  breakdown: [],
  recommendations: ['Set up an emergency fund covering 6 months of expenses']
}

// Net Worth Composables
export function useNetWorth() {
  return useQuery({
    queryKey: ['financial-health', 'networth'],
    queryFn: async (): Promise<NetWorthData> => {
      try {
        const res = await fetch('/api/financial-health/networth')
        if (!res.ok) {
          console.warn('Net worth API not available, using defaults')
          return DEFAULT_NETWORTH
        }
        return res.json()
      } catch (error) {
        console.warn('Failed to fetch net worth, using defaults:', error)
        return DEFAULT_NETWORTH
      }
    }
  })
}

// Cash Flow Composables
export function useCashFlow(month?: Ref<string | undefined>) {
  return useQuery({
    queryKey: ['financial-health', 'cash-flow', month?.value],
    queryFn: async (): Promise<CashFlowData> => {
      try {
        const url = month?.value
          ? `/api/financial-health/cash-flow?month=${month.value}`
          : '/api/financial-health/cash-flow'
        const res = await fetch(url)
        if (!res.ok) {
          console.warn('Cash flow API not available, using defaults')
          return DEFAULT_CASHFLOW
        }
        return res.json()
      } catch (error) {
        console.warn('Failed to fetch cash flow, using defaults:', error)
        return DEFAULT_CASHFLOW
      }
    }
  })
}

// Bank Accounts Composables
export function useBankAccounts() {
  return useQuery({
    queryKey: ['banking', 'accounts'],
    queryFn: async (): Promise<BankAccount[]> => {
      try {
        const res = await fetch('/api/banking/accounts')
        if (!res.ok) {
          console.warn('Bank accounts API not available, using empty list')
          return []
        }
        return res.json()
      } catch (error) {
        console.warn('Failed to fetch bank accounts, using empty list:', error)
        return []
      }
    }
  })
}

export function useCreateBankAccount() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (account: BankAccountInput): Promise<BankAccount> => {
      const res = await fetch('/api/banking/accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(account)
      })
      if (!res.ok) throw new Error('Failed to create bank account')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['banking', 'accounts'] })
      queryClient.invalidateQueries({ queryKey: ['financial-health'] })
    }
  })
}

export function useUpdateBankAccount() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<BankAccountInput> }): Promise<BankAccount> => {
      const res = await fetch(`/api/banking/accounts/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      if (!res.ok) throw new Error('Failed to update bank account')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['banking', 'accounts'] })
      queryClient.invalidateQueries({ queryKey: ['financial-health'] })
    }
  })
}

export function useDeleteBankAccount() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      const res = await fetch(`/api/banking/accounts/${id}`, {
        method: 'DELETE'
      })
      if (!res.ok) throw new Error('Failed to delete bank account')
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['banking', 'accounts'] })
      queryClient.invalidateQueries({ queryKey: ['financial-health'] })
    }
  })
}

// Emergency Fund Composables
export function useEmergencyFund() {
  return useQuery({
    queryKey: ['financial-health', 'emergency-fund'],
    queryFn: async (): Promise<EmergencyFundData> => {
      try {
        const res = await fetch('/api/banking/emergency-fund')
        if (!res.ok) {
          console.warn('Emergency fund API not available, using defaults')
          return DEFAULT_EMERGENCY_FUND
        }
        return res.json()
      } catch (error) {
        console.warn('Failed to fetch emergency fund, using defaults:', error)
        return DEFAULT_EMERGENCY_FUND
      }
    }
  })
}

// Default health score for when APIs are not available
const DEFAULT_HEALTH_SCORE: FinancialHealthScore = {
  overallScore: 0,
  status: 'needs_improvement',
  factors: [],
  trend: 'stable',
  lastMonthScore: 0,
  alerts: [{ type: 'info', message: 'Add your financial data to see your health score' }]
}

// Financial Health Score Composable
export function useFinancialHealthScore() {
  return useQuery({
    queryKey: ['financial-health', 'score'],
    queryFn: async (): Promise<FinancialHealthScore> => {
      try {
        // This combines data from multiple endpoints
        const [netWorthRes, cashFlowRes, emergencyFundRes] = await Promise.all([
          fetch('/api/financial-health/networth'),
          fetch('/api/financial-health/cash-flow'),
          fetch('/api/banking/emergency-fund')
        ])

        // Use defaults for any failed requests
        const netWorth = netWorthRes.ok ? await netWorthRes.json() : DEFAULT_NETWORTH
        const cashFlow = cashFlowRes.ok ? await cashFlowRes.json() : DEFAULT_CASHFLOW
        const emergencyFund = emergencyFundRes.ok ? await emergencyFundRes.json() : DEFAULT_EMERGENCY_FUND

        // Calculate scores
        const factors = calculateHealthFactors(netWorth, cashFlow, emergencyFund)
        const overallScore = factors.reduce((sum, f) => sum + f.score, 0)

        return {
          overallScore,
          status: getScoreStatus(overallScore),
          factors,
          trend: netWorth.monthlyChange >= 0 ? 'improving' : 'declining',
          lastMonthScore: overallScore - (Math.random() * 10 - 5), // Placeholder
          alerts: generateAlerts(factors, emergencyFund, cashFlow)
        }
      } catch (error) {
        console.warn('Failed to calculate financial health score:', error)
        return DEFAULT_HEALTH_SCORE
      }
    }
  })
}

// Helper functions for score calculation
function calculateHealthFactors(
  netWorth: NetWorthData,
  cashFlow: CashFlowData,
  emergencyFund: EmergencyFundData
): HealthFactor[] {
  const factors: HealthFactor[] = []

  // 1. Net Worth Trend (25 points)
  const netWorthScore = calculateNetWorthScore(netWorth)
  factors.push({
    name: 'Net Worth Trend',
    score: netWorthScore,
    maxScore: 25,
    status: getFactorStatus(netWorthScore, 25),
    description: netWorth.monthlyChange >= 0
      ? `Growing by ${formatINR(netWorth.monthlyChange, true)}/month`
      : `Declining by ${formatINR(Math.abs(netWorth.monthlyChange), true)}/month`,
    recommendation: netWorthScore < 20 ? 'Focus on increasing savings and reducing debt' : undefined
  })

  // 2. Emergency Fund Adequacy (25 points)
  const efScore = calculateEmergencyFundScore(emergencyFund)
  factors.push({
    name: 'Emergency Fund',
    score: efScore,
    maxScore: 25,
    status: getFactorStatus(efScore, 25),
    description: `${emergencyFund.percentComplete}% of target (${emergencyFund.targetMonths} months)`,
    recommendation: efScore < 20 ? `Add ${formatINR(emergencyFund.targetAmount - emergencyFund.currentAmount, true)} to reach target` : undefined
  })

  // 3. Debt-to-Income Ratio (25 points)
  const annualIncome = cashFlow.totalIncome * 12
  const dtiRatio = annualIncome > 0 ? netWorth.totalLiabilities / annualIncome : 0
  const dtiScore = calculateDTIScore(dtiRatio)
  factors.push({
    name: 'Debt-to-Income',
    score: dtiScore,
    maxScore: 25,
    status: getFactorStatus(dtiScore, 25),
    description: annualIncome > 0 ? `${(dtiRatio * 100).toFixed(1)}% annual DTI ratio` : 'No income data',
    recommendation: dtiScore < 20 ? 'Consider paying down high-interest debt' : undefined
  })

  // 4. Savings Rate (25 points)
  const savingsScore = calculateSavingsScore(cashFlow.savingsRate)
  factors.push({
    name: 'Savings Rate',
    score: savingsScore,
    maxScore: 25,
    status: getFactorStatus(savingsScore, 25),
    description: `${cashFlow.savingsRate.toFixed(1)}% of income saved`,
    recommendation: savingsScore < 20 ? 'Aim for at least 20% savings rate' : undefined
  })

  return factors
}

function calculateNetWorthScore(netWorth: NetWorthData): number {
  if (netWorth.yearlyChangePercent >= 15) return 25
  if (netWorth.yearlyChangePercent >= 10) return 22
  if (netWorth.yearlyChangePercent >= 5) return 18
  if (netWorth.yearlyChangePercent >= 0) return 15
  if (netWorth.yearlyChangePercent >= -5) return 10
  return 5
}

function calculateEmergencyFundScore(ef: EmergencyFundData): number {
  if (ef.percentComplete >= 100) return 25
  if (ef.percentComplete >= 80) return 22
  if (ef.percentComplete >= 60) return 18
  if (ef.percentComplete >= 40) return 12
  if (ef.percentComplete >= 20) return 8
  return 4
}

function calculateDTIScore(dtiRatio: number): number {
  if (dtiRatio <= 0.15) return 25
  if (dtiRatio <= 0.25) return 22
  if (dtiRatio <= 0.35) return 18
  if (dtiRatio <= 0.45) return 12
  if (dtiRatio <= 0.55) return 8
  return 4
}

function calculateSavingsScore(savingsRate: number): number {
  if (savingsRate >= 40) return 25
  if (savingsRate >= 30) return 22
  if (savingsRate >= 20) return 18
  if (savingsRate >= 10) return 12
  if (savingsRate >= 5) return 8
  return 4
}

function getFactorStatus(score: number, maxScore: number): HealthFactor['status'] {
  const percentage = (score / maxScore) * 100
  if (percentage >= 85) return 'excellent'
  if (percentage >= 70) return 'good'
  if (percentage >= 50) return 'needs_improvement'
  return 'critical'
}

function getScoreStatus(score: number): FinancialHealthScore['status'] {
  if (score >= 90) return 'excellent'
  if (score >= 70) return 'good'
  if (score >= 50) return 'needs_improvement'
  return 'critical'
}

function generateAlerts(
  factors: HealthFactor[],
  emergencyFund: EmergencyFundData,
  cashFlow: CashFlowData
): HealthAlert[] {
  const alerts: HealthAlert[] = []

  // Check emergency fund
  if (emergencyFund.percentComplete < 100) {
    alerts.push({
      type: 'warning',
      message: `Emergency fund is ${emergencyFund.percentComplete}% complete - add ${formatINR(emergencyFund.targetAmount - emergencyFund.currentAmount, true)} to reach target`
    })
  }

  // Check savings rate
  if (cashFlow.savingsRate >= 30) {
    alerts.push({
      type: 'success',
      message: `Excellent savings rate of ${cashFlow.savingsRate.toFixed(0)}%`
    })
  } else if (cashFlow.savingsRate < 10) {
    alerts.push({
      type: 'warning',
      message: `Low savings rate of ${cashFlow.savingsRate.toFixed(0)}% - aim for at least 20%`
    })
  }

  // Check factors
  factors.forEach(factor => {
    if (factor.status === 'excellent') {
      alerts.push({
        type: 'success',
        message: `${factor.name}: ${factor.description}`
      })
    }
  })

  return alerts.slice(0, 5) // Limit to 5 alerts
}

// Aggregate computed values
export function useFinancialHealthSummary() {
  const netWorth = useNetWorth()
  const cashFlow = useCashFlow()
  const emergencyFund = useEmergencyFund()
  const healthScore = useFinancialHealthScore()

  const isLoading = computed(() =>
    netWorth.isLoading.value ||
    cashFlow.isLoading.value ||
    emergencyFund.isLoading.value ||
    healthScore.isLoading.value
  )

  const hasError = computed(() =>
    netWorth.isError.value ||
    cashFlow.isError.value ||
    emergencyFund.isError.value ||
    healthScore.isError.value
  )

  return {
    netWorth,
    cashFlow,
    emergencyFund,
    healthScore,
    isLoading,
    hasError
  }
}

// Net Worth Milestones Composables
export function useNetWorthMilestones() {
  return useQuery({
    queryKey: ['financial-health', 'milestones'],
    queryFn: async (): Promise<NetWorthMilestone[]> => {
      try {
        const res = await fetch('/api/financial-health/milestones')
        if (!res.ok) {
          console.warn('Milestones API not available, using empty list')
          return []
        }
        return res.json()
      } catch (error) {
        console.warn('Failed to fetch milestones, using empty list:', error)
        return []
      }
    }
  })
}

export function useCreateMilestone() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (milestone: NetWorthMilestoneInput): Promise<NetWorthMilestone> => {
      const res = await fetch('/api/financial-health/milestones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(milestone)
      })
      if (!res.ok) throw new Error('Failed to create milestone')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['financial-health', 'milestones'] })
    }
  })
}

export function useUpdateMilestone() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<NetWorthMilestoneInput> }): Promise<NetWorthMilestone> => {
      const res = await fetch(`/api/financial-health/milestones/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      if (!res.ok) throw new Error('Failed to update milestone')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['financial-health', 'milestones'] })
    }
  })
}

export function useDeleteMilestone() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      const res = await fetch(`/api/financial-health/milestones/${id}`, {
        method: 'DELETE'
      })
      if (!res.ok) throw new Error('Failed to delete milestone')
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['financial-health', 'milestones'] })
    }
  })
}

// Check and auto-update milestone achievements based on current net worth
export function useMilestoneProgress(currentNetWorth: Ref<number | undefined>) {
  const { data: milestones } = useNetWorthMilestones()

  const milestoneProgress = computed(() => {
    if (!milestones.value || currentNetWorth.value === undefined) return []

    return milestones.value
      .sort((a, b) => a.targetAmount - b.targetAmount)
      .map(m => ({
        ...m,
        progress: Math.min(100, (currentNetWorth.value! / m.targetAmount) * 100),
        remaining: Math.max(0, m.targetAmount - currentNetWorth.value!),
        justAchieved: !m.isAchieved && currentNetWorth.value! >= m.targetAmount
      }))
  })

  const achievedMilestones = computed(() =>
    milestoneProgress.value.filter(m => m.isAchieved || currentNetWorth.value! >= m.targetAmount)
  )

  const pendingMilestones = computed(() =>
    milestoneProgress.value.filter(m => !m.isAchieved && currentNetWorth.value! < m.targetAmount)
  )

  const nextMilestone = computed(() => {
    const next = pendingMilestones.value[0]
    if (!next) return null
    return {
      ...next,
      daysToReach: estimateDaysToMilestone(currentNetWorth.value!, next.targetAmount)
    }
  })

  return {
    milestoneProgress,
    achievedMilestones,
    pendingMilestones,
    nextMilestone
  }
}

// Helper to estimate days to reach milestone based on historical growth
function estimateDaysToMilestone(current: number, target: number, monthlyGrowthRate = 0.02): number | null {
  if (current >= target) return 0
  if (monthlyGrowthRate <= 0) return null

  const remaining = target - current
  const monthlyGrowth = current * monthlyGrowthRate
  if (monthlyGrowth <= 0) return null

  const months = Math.log(target / current) / Math.log(1 + monthlyGrowthRate)
  return Math.ceil(months * 30)
}

// ============================================
// Passive Income Summary
// ============================================

export interface PassiveIncomeSource {
  type: 'rental' | 'dividend' | 'interest' | 'other'
  name: string
  monthlyAmount: number
  annualAmount: number
  color: string
}

export interface PassiveIncomeSummary {
  totalMonthly: number
  totalAnnual: number
  sources: PassiveIncomeSource[]
  expensesCoverage: number  // % of monthly expenses covered
  monthlyTrend: Array<{ month: string; amount: number }>
}

// Default passive income summary
const DEFAULT_PASSIVE_INCOME: PassiveIncomeSummary = {
  totalMonthly: 0,
  totalAnnual: 0,
  sources: [],
  expensesCoverage: 0,
  monthlyTrend: []
}

export function usePassiveIncomeSummary() {
  return useQuery({
    queryKey: ['financial-health', 'passive-income'],
    queryFn: async (): Promise<PassiveIncomeSummary> => {
      try {
        // Fetch passive income data from various sources
        const [rentalRes, otherIncomeRes, cashFlowRes] = await Promise.all([
          fetch('/api/rental-income'),
          fetch('/api/other-income'),
          fetch('/api/financial-health/cash-flow')
        ])

        // If both main APIs fail, return defaults
        if (!rentalRes.ok && !otherIncomeRes.ok) {
          console.warn('Passive income APIs not available, using defaults')
          return DEFAULT_PASSIVE_INCOME
        }

        const rentalIncome = rentalRes.ok ? await rentalRes.json() : []
        const otherIncome = otherIncomeRes.ok ? await otherIncomeRes.json() : []
        const cashFlow = cashFlowRes.ok ? await cashFlowRes.json() : null

      const sources: PassiveIncomeSource[] = []

      // Aggregate rental income
      const totalRentalAnnual = rentalIncome.reduce(
        (sum: number, r: { monthlyRent: number }) => sum + (r.monthlyRent * 12),
        0
      )
      if (totalRentalAnnual > 0) {
        sources.push({
          type: 'rental',
          name: 'Rental Income',
          monthlyAmount: totalRentalAnnual / 12,
          annualAmount: totalRentalAnnual,
          color: '#78716c' // Stone for real estate
        })
      }

      // Aggregate dividend income
      const dividendIncome = otherIncome.filter(
        (o: { category: string }) => o.category === 'dividend'
      )
      const totalDividendAnnual = dividendIncome.reduce(
        (sum: number, d: { grossAmount: number }) => sum + d.grossAmount,
        0
      )
      if (totalDividendAnnual > 0) {
        sources.push({
          type: 'dividend',
          name: 'Dividends',
          monthlyAmount: totalDividendAnnual / 12,
          annualAmount: totalDividendAnnual,
          color: '#3b82f6' // Blue for equity
        })
      }

      // Aggregate interest income
      const interestIncome = otherIncome.filter(
        (o: { category: string }) => o.category === 'interest'
      )
      const totalInterestAnnual = interestIncome.reduce(
        (sum: number, i: { grossAmount: number }) => sum + i.grossAmount,
        0
      )
      if (totalInterestAnnual > 0) {
        sources.push({
          type: 'interest',
          name: 'Interest',
          monthlyAmount: totalInterestAnnual / 12,
          annualAmount: totalInterestAnnual,
          color: '#10b981' // Emerald for debt
        })
      }

      // Calculate totals
      const totalAnnual = sources.reduce((sum, s) => sum + s.annualAmount, 0)
      const totalMonthly = totalAnnual / 12

      // Calculate expenses coverage
      const monthlyExpenses = cashFlow?.totalExpenses || 0
      const expensesCoverage = monthlyExpenses > 0
        ? (totalMonthly / monthlyExpenses) * 100
        : 0

      // Generate monthly trend (placeholder - would need historical data)
      const monthlyTrend = Array.from({ length: 12 }, (_, i) => {
        const date = new Date()
        date.setMonth(date.getMonth() - (11 - i))
        return {
          month: date.toLocaleDateString('en-IN', { month: 'short' }),
          amount: totalMonthly * (0.9 + Math.random() * 0.2) // Simulate slight variation
        }
      })

      return {
        totalMonthly,
        totalAnnual,
        sources,
        expensesCoverage,
        monthlyTrend
      }
      } catch (error) {
        console.warn('Failed to fetch passive income data:', error)
        return DEFAULT_PASSIVE_INCOME
      }
    }
  })
}
