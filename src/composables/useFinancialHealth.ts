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

// Net Worth Composables
export function useNetWorth() {
  return useQuery({
    queryKey: ['financial-health', 'networth'],
    queryFn: async (): Promise<NetWorthData> => {
      const res = await fetch('/api/financial-health/networth')
      if (!res.ok) throw new Error('Failed to fetch net worth')
      return res.json()
    }
  })
}

// Cash Flow Composables
export function useCashFlow(month?: Ref<string | undefined>) {
  return useQuery({
    queryKey: ['financial-health', 'cash-flow', month?.value],
    queryFn: async (): Promise<CashFlowData> => {
      const url = month?.value
        ? `/api/financial-health/cash-flow?month=${month.value}`
        : '/api/financial-health/cash-flow'
      const res = await fetch(url)
      if (!res.ok) throw new Error('Failed to fetch cash flow')
      return res.json()
    }
  })
}

// Bank Accounts Composables
export function useBankAccounts() {
  return useQuery({
    queryKey: ['banking', 'accounts'],
    queryFn: async (): Promise<BankAccount[]> => {
      const res = await fetch('/api/banking/accounts')
      if (!res.ok) throw new Error('Failed to fetch bank accounts')
      return res.json()
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
      const res = await fetch('/api/banking/emergency-fund')
      if (!res.ok) throw new Error('Failed to fetch emergency fund')
      return res.json()
    }
  })
}

// Financial Health Score Composable
export function useFinancialHealthScore() {
  return useQuery({
    queryKey: ['financial-health', 'score'],
    queryFn: async (): Promise<FinancialHealthScore> => {
      // This combines data from multiple endpoints
      const [netWorthRes, cashFlowRes, emergencyFundRes] = await Promise.all([
        fetch('/api/financial-health/networth'),
        fetch('/api/financial-health/cash-flow'),
        fetch('/api/banking/emergency-fund')
      ])

      if (!netWorthRes.ok || !cashFlowRes.ok || !emergencyFundRes.ok) {
        throw new Error('Failed to fetch financial health data')
      }

      const netWorth = await netWorthRes.json()
      const cashFlow = await cashFlowRes.json()
      const emergencyFund = await emergencyFundRes.json()

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
  const dtiRatio = netWorth.totalLiabilities / (cashFlow.totalIncome * 12)
  const dtiScore = calculateDTIScore(dtiRatio)
  factors.push({
    name: 'Debt-to-Income',
    score: dtiScore,
    maxScore: 25,
    status: getFactorStatus(dtiScore, 25),
    description: `${(dtiRatio * 100).toFixed(1)}% annual DTI ratio`,
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
