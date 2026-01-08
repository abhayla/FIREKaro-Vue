import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query'
import { computed } from 'vue'
import { useUiStore } from '@/stores/ui'

// Types
export interface Loan {
  id: string
  userId: string
  familyMemberId?: string
  loanType: 'home' | 'car' | 'personal' | 'education' | 'gold' | 'other'
  lenderName: string
  accountNumber?: string
  principalAmount: number
  outstandingPrincipal: number
  interestRate: number
  tenure: number // in months
  emiAmount: number
  emiDate: number // day of month (1-31)
  startDate: string
  endDate: string
  totalInterestPaid: number
  totalPrincipalPaid: number
  prepaymentsMade: number
  isActive: boolean
  // Tax benefits
  section80C?: number // Principal deduction
  section24?: number // Interest deduction (home loan)
  section80E?: number // Education loan interest
  section80EE?: number // First home buyer
}

export interface CreditCard {
  id: string
  userId: string
  familyMemberId?: string
  cardName: string
  bankName: string
  cardNumber: string // Masked: ****1234
  cardType: 'VISA' | 'MASTERCARD' | 'RUPAY' | 'AMEX'
  creditLimit: number
  availableLimit: number
  currentOutstanding: number
  utilizationPercent: number
  billingCycleDate: number // Day of month (1-31)
  paymentDueDate: number // Day of month (1-31)
  rewardPointsBalance: number
  interestRateAPR: number
  annualFee: number
  feeWaiverSpend?: number
  cardExpiryDate?: string
  isActive: boolean
  minimumDue: number
  nextDueDate: string
}

export interface CreditCardStatement {
  id: string
  creditCardId: string
  statementDate: string
  statementAmount: number
  minimumDue: number
  dueDate: string
  isPaid: boolean
  paidAmount?: number
  paidDate?: string
}

export interface LiabilitiesOverview {
  totalDebt: number
  totalMonthlyPayment: number
  yearlyInterest: number
  debtToIncomeRatio: number
  creditUtilization: number
  projectedPayoffDate: string
  debtByType: {
    loans: { count: number; total: number; monthlyEmi: number }
    creditCards: { count: number; total: number; minDue: number }
  }
  upcomingPayments: {
    id: string
    name: string
    type: 'loan' | 'credit_card'
    amount: number
    dueDate: string
    isOverdue: boolean
  }[]
  alerts: {
    overdueCount: number
    upcoming7Days: number
    highInterestDebts: number
  }
}

export interface DebtPayoffStrategy {
  name: 'snowball' | 'avalanche' | 'custom'
  description: string
  totalInterestSaved: number
  payoffDate: string
  monthlyPayment: number
  debts: {
    id: string
    name: string
    balance: number
    interestRate: number
    monthlyPayment: number
    payoffDate: string
    order: number
  }[]
}

export interface AmortizationEntry {
  month: number
  date: string
  openingBalance: number
  emi: number
  principal: number
  interest: number
  closingBalance: number
  prepayment?: number
}

// Helper to build query params with family view
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

// Loans hooks
export function useLoans() {
  const uiStore = useUiStore()
  return useQuery({
    queryKey: computed(() => ['loans', uiStore.isFamilyView, uiStore.selectedFamilyMemberId]),
    queryFn: async (): Promise<Loan[]> => {
      const res = await fetch(`/api/loans${buildQueryParams()}`)
      if (!res.ok) throw new Error('Failed to fetch loans')
      return res.json()
    }
  })
}

export function useLoan(id: string) {
  return useQuery({
    queryKey: ['loan', id],
    queryFn: async (): Promise<Loan> => {
      const res = await fetch(`/api/loans/${id}`)
      if (!res.ok) throw new Error('Failed to fetch loan')
      return res.json()
    },
    enabled: !!id
  })
}

export function useCreateLoan() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (loan: Partial<Loan>) => {
      const res = await fetch('/api/loans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loan)
      })
      if (!res.ok) throw new Error('Failed to create loan')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loans'] })
      queryClient.invalidateQueries({ queryKey: ['liabilities-overview'] })
    }
  })
}

export function useUpdateLoan() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<Loan> & { id: string }) => {
      const res = await fetch(`/api/loans/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      if (!res.ok) throw new Error('Failed to update loan')
      return res.json()
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['loans'] })
      queryClient.invalidateQueries({ queryKey: ['loan', variables.id] })
      queryClient.invalidateQueries({ queryKey: ['liabilities-overview'] })
    }
  })
}

export function useDeleteLoan() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/loans/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete loan')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loans'] })
      queryClient.invalidateQueries({ queryKey: ['liabilities-overview'] })
    }
  })
}

// Credit Cards hooks
export function useCreditCards() {
  const uiStore = useUiStore()
  return useQuery({
    queryKey: computed(() => ['credit-cards', uiStore.isFamilyView, uiStore.selectedFamilyMemberId]),
    queryFn: async (): Promise<CreditCard[]> => {
      const res = await fetch(`/api/credit-cards${buildQueryParams()}`)
      if (!res.ok) throw new Error('Failed to fetch credit cards')
      return res.json()
    }
  })
}

export function useCreateCreditCard() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (card: Partial<CreditCard>) => {
      const res = await fetch('/api/credit-cards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(card)
      })
      if (!res.ok) throw new Error('Failed to create credit card')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['credit-cards'] })
      queryClient.invalidateQueries({ queryKey: ['liabilities-overview'] })
    }
  })
}

export function useUpdateCreditCard() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<CreditCard> & { id: string }) => {
      const res = await fetch(`/api/credit-cards/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      if (!res.ok) throw new Error('Failed to update credit card')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['credit-cards'] })
      queryClient.invalidateQueries({ queryKey: ['liabilities-overview'] })
    }
  })
}

export function useDeleteCreditCard() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/credit-cards/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete credit card')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['credit-cards'] })
      queryClient.invalidateQueries({ queryKey: ['liabilities-overview'] })
    }
  })
}

// Liabilities Overview
export function useLiabilitiesOverview() {
  const uiStore = useUiStore()
  return useQuery({
    queryKey: computed(() => ['liabilities-overview', uiStore.isFamilyView, uiStore.selectedFamilyMemberId]),
    queryFn: async (): Promise<LiabilitiesOverview> => {
      const res = await fetch(`/api/liabilities/overview${buildQueryParams()}`)
      if (!res.ok) throw new Error('Failed to fetch liabilities overview')
      return res.json()
    }
  })
}

// Debt Payoff Strategies
export function useDebtPayoffStrategies() {
  const uiStore = useUiStore()
  return useQuery({
    queryKey: computed(() => ['debt-payoff-strategies', uiStore.isFamilyView, uiStore.selectedFamilyMemberId]),
    queryFn: async (): Promise<DebtPayoffStrategy[]> => {
      const res = await fetch(`/api/debt-payoff/strategies${buildQueryParams()}`)
      if (!res.ok) throw new Error('Failed to fetch payoff strategies')
      return res.json()
    }
  })
}

// Loan Calculations
export function calculateEMI(principal: number, annualRate: number, tenureMonths: number): number {
  const monthlyRate = annualRate / 12 / 100
  if (monthlyRate === 0) return principal / tenureMonths
  return (principal * monthlyRate * Math.pow(1 + monthlyRate, tenureMonths)) /
    (Math.pow(1 + monthlyRate, tenureMonths) - 1)
}

export function calculateTotalInterest(principal: number, emi: number, tenureMonths: number): number {
  return (emi * tenureMonths) - principal
}

export function generateAmortizationSchedule(
  principal: number,
  annualRate: number,
  tenureMonths: number,
  startDate: Date
): AmortizationEntry[] {
  const schedule: AmortizationEntry[] = []
  const monthlyRate = annualRate / 12 / 100
  const emi = calculateEMI(principal, annualRate, tenureMonths)
  let balance = principal
  const currentDate = new Date(startDate)

  for (let month = 1; month <= tenureMonths && balance > 0; month++) {
    const interest = balance * monthlyRate
    const principalPart = Math.min(emi - interest, balance)
    const closingBalance = Math.max(0, balance - principalPart)

    schedule.push({
      month,
      date: currentDate.toISOString().split('T')[0],
      openingBalance: Math.round(balance),
      emi: Math.round(emi),
      principal: Math.round(principalPart),
      interest: Math.round(interest),
      closingBalance: Math.round(closingBalance)
    })

    balance = closingBalance
    currentDate.setMonth(currentDate.getMonth() + 1)
  }

  return schedule
}

export function calculatePrepaymentImpact(
  currentBalance: number,
  annualRate: number,
  remainingTenure: number,
  prepaymentAmount: number,
  reduceEmi: boolean = false
): {
  interestSaved: number
  newTenure: number
  newEmi: number
  monthsSaved: number
} {
  const currentEmi = calculateEMI(currentBalance, annualRate, remainingTenure)
  const newBalance = currentBalance - prepaymentAmount

  if (reduceEmi) {
    // Keep tenure, reduce EMI
    const newEmi = calculateEMI(newBalance, annualRate, remainingTenure)
    const oldTotalInterest = calculateTotalInterest(currentBalance, currentEmi, remainingTenure)
    const newTotalInterest = calculateTotalInterest(newBalance, newEmi, remainingTenure)
    return {
      interestSaved: oldTotalInterest - newTotalInterest,
      newTenure: remainingTenure,
      newEmi: Math.round(newEmi),
      monthsSaved: 0
    }
  } else {
    // Keep EMI, reduce tenure
    const monthlyRate = annualRate / 12 / 100
    let newTenure = 0
    if (monthlyRate > 0) {
      newTenure = Math.ceil(
        Math.log(currentEmi / (currentEmi - newBalance * monthlyRate)) /
        Math.log(1 + monthlyRate)
      )
    } else {
      newTenure = Math.ceil(newBalance / currentEmi)
    }
    const oldTotalInterest = calculateTotalInterest(currentBalance, currentEmi, remainingTenure)
    const newTotalInterest = calculateTotalInterest(newBalance, currentEmi, newTenure)
    return {
      interestSaved: oldTotalInterest - newTotalInterest,
      newTenure,
      newEmi: Math.round(currentEmi),
      monthsSaved: remainingTenure - newTenure
    }
  }
}

// Credit Card Calculations
export function calculateCreditUtilization(outstanding: number, limit: number): number {
  if (limit === 0) return 0
  return Math.round((outstanding / limit) * 100)
}

export function calculateMinimumDue(outstanding: number, minPercent: number = 5): number {
  const minAmount = outstanding * (minPercent / 100)
  return Math.max(minAmount, 200) // Minimum Rs. 200 or percentage, whichever is higher
}

export function calculateInterestCharges(outstanding: number, apr: number, days: number = 30): number {
  const dailyRate = apr / 365 / 100
  return Math.round(outstanding * dailyRate * days)
}

// Debt-to-Income Ratio
export function calculateDTI(totalMonthlyDebt: number, monthlyIncome: number): number {
  if (monthlyIncome === 0) return 0
  return Math.round((totalMonthlyDebt / monthlyIncome) * 100)
}

export function getDTIStatus(dti: number): { status: string; color: string } {
  if (dti <= 20) return { status: 'Excellent', color: 'success' }
  if (dti <= 35) return { status: 'Good', color: 'primary' }
  if (dti <= 43) return { status: 'Fair', color: 'warning' }
  return { status: 'High', color: 'error' }
}

// Snowball vs Avalanche comparison
export function comparePayoffStrategies(
  debts: { name: string; balance: number; interestRate: number; minPayment: number }[],
  extraPayment: number = 0
): { snowball: DebtPayoffStrategy; avalanche: DebtPayoffStrategy } {
  const totalMonthly = debts.reduce((sum, d) => sum + d.minPayment, 0) + extraPayment

  // Snowball: Sort by balance (smallest first)
  const snowballDebts = [...debts].sort((a, b) => a.balance - b.balance)
  const snowball = simulatePayoff(snowballDebts, totalMonthly, 'snowball')

  // Avalanche: Sort by interest rate (highest first)
  const avalancheDebts = [...debts].sort((a, b) => b.interestRate - a.interestRate)
  const avalanche = simulatePayoff(avalancheDebts, totalMonthly, 'avalanche')

  return { snowball, avalanche }
}

function simulatePayoff(
  debts: { name: string; balance: number; interestRate: number; minPayment: number }[],
  monthlyPayment: number,
  strategy: 'snowball' | 'avalanche'
): DebtPayoffStrategy {
  const debtsCopy = debts.map((d, i) => ({
    ...d,
    id: `debt-${i}`,
    order: i + 1,
    payoffDate: '',
    monthlyPayment: d.minPayment
  }))

  let months = 0
  let totalInterest = 0
  const maxMonths = 360 // 30 years max

  while (debtsCopy.some(d => d.balance > 0) && months < maxMonths) {
    months++
    const currentDate = new Date()
    currentDate.setMonth(currentDate.getMonth() + months)

    // Calculate interest for each debt
    debtsCopy.forEach(debt => {
      if (debt.balance > 0) {
        const monthlyInterest = debt.balance * (debt.interestRate / 12 / 100)
        totalInterest += monthlyInterest
        debt.balance += monthlyInterest
      }
    })

    // Apply payments
    let remaining = monthlyPayment
    for (const debt of debtsCopy) {
      if (debt.balance > 0 && remaining > 0) {
        const payment = Math.min(remaining, debt.balance)
        debt.balance -= payment
        remaining -= payment
        if (debt.balance <= 0 && !debt.payoffDate) {
          debt.payoffDate = currentDate.toISOString().split('T')[0]
        }
      }
    }
  }

  const payoffDate = new Date()
  payoffDate.setMonth(payoffDate.getMonth() + months)

  return {
    name: strategy,
    description: strategy === 'snowball'
      ? 'Pay smallest balances first for quick wins'
      : 'Pay highest interest rates first for maximum savings',
    totalInterestSaved: 0, // Calculated relative to minimum payments
    payoffDate: payoffDate.toISOString().split('T')[0],
    monthlyPayment,
    debts: debtsCopy.map(d => ({
      id: d.id,
      name: d.name,
      balance: Math.round(d.balance),
      interestRate: d.interestRate,
      monthlyPayment: d.monthlyPayment,
      payoffDate: d.payoffDate,
      order: d.order
    }))
  }
}

// Formatting utilities
export function formatINR(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(amount)
}

export function formatINRCompact(amount: number): string {
  if (amount >= 10000000) {
    return `${(amount / 10000000).toFixed(2)} Cr`
  }
  if (amount >= 100000) {
    return `${(amount / 100000).toFixed(2)} L`
  }
  if (amount >= 1000) {
    return `${(amount / 1000).toFixed(1)} K`
  }
  return formatINR(amount)
}

export function formatPercentage(value: number): string {
  return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  })
}

// Loan type helpers
export function getLoanTypeLabel(type: Loan['loanType']): string {
  const labels: Record<Loan['loanType'], string> = {
    home: 'Home Loan',
    car: 'Car Loan',
    personal: 'Personal Loan',
    education: 'Education Loan',
    gold: 'Gold Loan',
    other: 'Other Loan'
  }
  return labels[type] || type
}

export function getLoanTypeIcon(type: Loan['loanType']): string {
  const icons: Record<Loan['loanType'], string> = {
    home: 'mdi-home',
    car: 'mdi-car',
    personal: 'mdi-account-cash',
    education: 'mdi-school',
    gold: 'mdi-gold',
    other: 'mdi-bank'
  }
  return icons[type] || 'mdi-bank'
}

export function getLoanTypeColor(type: Loan['loanType']): string {
  const colors: Record<Loan['loanType'], string> = {
    home: 'blue',
    car: 'orange',
    personal: 'purple',
    education: 'teal',
    gold: 'amber',
    other: 'grey'
  }
  return colors[type] || 'grey'
}
