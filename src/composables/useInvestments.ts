import { computed } from 'vue'
import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query'
import { useUiStore } from '@/stores/ui'

// Types
export interface Investment {
  id: string
  name: string
  type: 'stock' | 'mutual_fund' | 'fd' | 'bond' | 'gold' | 'real_estate' | 'other'
  category: 'equity' | 'debt' | 'hybrid' | 'gold' | 'real_estate' | 'cash'
  currentValue: number
  investedAmount: number
  units?: number
  purchasePrice?: number
  currentPrice?: number
  purchaseDate: string
  notes?: string
  familyMemberId?: string
}

export interface PortfolioSummary {
  totalValue: number
  totalInvested: number
  totalReturns: number
  returnsPercentage: number
  xirr?: number
  allocation: {
    equity: number
    debt: number
    gold: number
    realEstate: number
    cash: number
  }
  categoryBreakdown: {
    stocks: { value: number; invested: number; count: number }
    mutualFunds: { value: number; invested: number; count: number }
    fixedDeposits: { value: number; invested: number; count: number }
    bonds: { value: number; invested: number; count: number }
    gold: { value: number; invested: number; count: number }
    realEstate: { value: number; invested: number; count: number }
  }
}

export interface EPFData {
  id?: string
  uan: string
  establishmentCode?: string
  currentBalance: number
  employeeShare: number
  employerShare: number
  pensionFund: number
  lastUpdated: string
  monthlyContribution: {
    basic: number
    employee: number
    employerEPF: number
    employerEPS: number
    vpf: number
  }
  projectedCorpusAt60?: number
}

export interface PPFData {
  id?: string
  accountNumber: string
  accountHolderName: string
  bankOrPostOffice: string
  openingDate: string
  maturityDate: string
  currentBalance: number
  totalDeposits: number
  totalInterestEarned: number
  currentFYDeposits: number
  currentFY: string
  hasActiveLoan: boolean
  loanAmount: number
  isExtended: boolean
}

export interface NPSData {
  id?: string
  pranNumber: string
  tier1Balance: number
  tier2Balance?: number
  totalContributions: number
  totalReturns: number
  assetAllocation: {
    equityE: number
    corporateBondC: number
    governmentBondG: number
    alternativeA: number
  }
  pensionFundManager: string
  investmentChoice: 'active' | 'auto'
  lastUpdated: string
}

export interface StockHolding {
  id: string
  symbol: string
  name: string
  exchange: 'NSE' | 'BSE'
  quantity: number
  averagePrice: number
  currentPrice: number
  investedValue: number
  currentValue: number
  pnl: number
  pnlPercentage: number
  dayChange: number
  dayChangePercentage: number
}

export interface MutualFund {
  id: string
  schemeName: string
  schemeCode: string
  amcName: string
  category: string
  subCategory: string
  units: number
  nav: number
  averageNav: number
  investedValue: number
  currentValue: number
  pnl: number
  pnlPercentage: number
  xirr?: number
  sipAmount?: number
  sipDate?: number
}

export interface Property {
  id: string
  name: string
  type: 'residential' | 'commercial' | 'land' | 'other'
  address: string
  purchaseDate: string
  purchasePrice: number
  currentValue: number
  registrationCost: number
  stampDuty: number
  loanOutstanding?: number
  rentalIncome?: number
  appreciation: number
  appreciationPercentage: number
}

// Utility function for INR formatting
export const formatINR = (amount: number) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(amount)

export const formatINRCompact = (amount: number) => {
  if (amount >= 10000000) {
    return `${(amount / 10000000).toFixed(2)} Cr`
  } else if (amount >= 100000) {
    return `${(amount / 100000).toFixed(2)} L`
  } else if (amount >= 1000) {
    return `${(amount / 1000).toFixed(1)}K`
  }
  return formatINR(amount)
}

export const formatPercentage = (value: number) =>
  `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`

// Helper to build query params with family member support
function buildQueryParams() {
  const uiStore = useUiStore()
  const params = new URLSearchParams()

  if (uiStore.isFamilyView) {
    if (uiStore.selectedFamilyMemberId) {
      params.set('familyMemberId', uiStore.selectedFamilyMemberId)
    } else {
      params.set('familyMemberId', 'all')
    }
  }

  return params.toString() ? `?${params.toString()}` : ''
}

// Portfolio Summary
export function usePortfolio() {
  const uiStore = useUiStore()

  return useQuery({
    queryKey: computed(() => ['portfolio', uiStore.isFamilyView, uiStore.selectedFamilyMemberId]),
    queryFn: async (): Promise<PortfolioSummary> => {
      const res = await fetch(`/api/portfolio${buildQueryParams()}`)
      if (!res.ok) throw new Error('Failed to fetch portfolio')
      return res.json()
    }
  })
}

// All Investments
export function useInvestments() {
  const uiStore = useUiStore()

  return useQuery({
    queryKey: computed(() => ['investments', uiStore.isFamilyView, uiStore.selectedFamilyMemberId]),
    queryFn: async (): Promise<Investment[]> => {
      const res = await fetch(`/api/investments${buildQueryParams()}`)
      if (!res.ok) throw new Error('Failed to fetch investments')
      return res.json()
    }
  })
}

// Create Investment
export function useCreateInvestment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: Omit<Investment, 'id'>) => {
      const res = await fetch('/api/investments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      if (!res.ok) throw new Error('Failed to create investment')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['investments'] })
      queryClient.invalidateQueries({ queryKey: ['portfolio'] })
    }
  })
}

// Update Investment
export function useUpdateInvestment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Investment> }) => {
      const res = await fetch(`/api/investments/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      if (!res.ok) throw new Error('Failed to update investment')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['investments'] })
      queryClient.invalidateQueries({ queryKey: ['portfolio'] })
    }
  })
}

// Delete Investment
export function useDeleteInvestment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/investments/${id}`, {
        method: 'DELETE'
      })
      if (!res.ok) throw new Error('Failed to delete investment')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['investments'] })
      queryClient.invalidateQueries({ queryKey: ['portfolio'] })
    }
  })
}

// EPF
export function useEPF() {
  const uiStore = useUiStore()

  return useQuery({
    queryKey: computed(() => ['epf', uiStore.isFamilyView, uiStore.selectedFamilyMemberId]),
    queryFn: async (): Promise<EPFData> => {
      const res = await fetch(`/api/epf${buildQueryParams()}`)
      if (!res.ok) throw new Error('Failed to fetch EPF')
      return res.json()
    }
  })
}

export function useUpdateEPF() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: Partial<EPFData>) => {
      const res = await fetch('/api/epf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      if (!res.ok) throw new Error('Failed to update EPF')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['epf'] })
      queryClient.invalidateQueries({ queryKey: ['portfolio'] })
    }
  })
}

// PPF
export function usePPF() {
  const uiStore = useUiStore()

  return useQuery({
    queryKey: computed(() => ['ppf', uiStore.isFamilyView, uiStore.selectedFamilyMemberId]),
    queryFn: async (): Promise<PPFData> => {
      const res = await fetch(`/api/ppf${buildQueryParams()}`)
      if (!res.ok) throw new Error('Failed to fetch PPF')
      return res.json()
    }
  })
}

export function useUpdatePPF() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: Partial<PPFData>) => {
      const res = await fetch('/api/ppf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      if (!res.ok) throw new Error('Failed to update PPF')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ppf'] })
      queryClient.invalidateQueries({ queryKey: ['portfolio'] })
    }
  })
}

// NPS
export function useNPS() {
  const uiStore = useUiStore()

  return useQuery({
    queryKey: computed(() => ['nps', uiStore.isFamilyView, uiStore.selectedFamilyMemberId]),
    queryFn: async (): Promise<NPSData> => {
      const res = await fetch(`/api/nps${buildQueryParams()}`)
      if (!res.ok) throw new Error('Failed to fetch NPS')
      return res.json()
    }
  })
}

export function useUpdateNPS() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: Partial<NPSData>) => {
      const res = await fetch('/api/nps', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      if (!res.ok) throw new Error('Failed to update NPS')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['nps'] })
      queryClient.invalidateQueries({ queryKey: ['portfolio'] })
    }
  })
}

// Stocks
export function useStocks() {
  const uiStore = useUiStore()

  return useQuery({
    queryKey: computed(() => ['stocks', uiStore.isFamilyView, uiStore.selectedFamilyMemberId]),
    queryFn: async (): Promise<StockHolding[]> => {
      const res = await fetch(`/api/investments${buildQueryParams()}&type=stock`)
      if (!res.ok) throw new Error('Failed to fetch stocks')
      return res.json()
    }
  })
}

// Mutual Funds
export function useMutualFunds() {
  const uiStore = useUiStore()

  return useQuery({
    queryKey: computed(() => ['mutual-funds', uiStore.isFamilyView, uiStore.selectedFamilyMemberId]),
    queryFn: async (): Promise<MutualFund[]> => {
      const res = await fetch(`/api/investments${buildQueryParams()}&type=mutual_fund`)
      if (!res.ok) throw new Error('Failed to fetch mutual funds')
      return res.json()
    }
  })
}

// Properties
export function useProperties() {
  const uiStore = useUiStore()

  return useQuery({
    queryKey: computed(() => ['properties', uiStore.isFamilyView, uiStore.selectedFamilyMemberId]),
    queryFn: async (): Promise<Property[]> => {
      const res = await fetch(`/api/investments${buildQueryParams()}&type=real_estate`)
      if (!res.ok) throw new Error('Failed to fetch properties')
      return res.json()
    }
  })
}

// EPF Projection Calculator
export function calculateEPFProjection(params: {
  currentBalance: number
  monthlyContribution: number
  currentAge: number
  retirementAge: number
  interestRate: number
}) {
  const { currentBalance, monthlyContribution, currentAge, retirementAge, interestRate } = params
  const yearsToRetirement = retirementAge - currentAge
  const monthlyRate = interestRate / 12 / 100
  const totalMonths = yearsToRetirement * 12

  // FV = PV * (1 + r)^n + PMT * ((1 + r)^n - 1) / r
  const futureValue =
    currentBalance * Math.pow(1 + monthlyRate, totalMonths) +
    monthlyContribution * ((Math.pow(1 + monthlyRate, totalMonths) - 1) / monthlyRate)

  return {
    projectedCorpus: Math.round(futureValue),
    totalContributions: currentBalance + monthlyContribution * totalMonths,
    totalInterest: Math.round(futureValue - currentBalance - monthlyContribution * totalMonths),
    yearsToRetirement
  }
}

// PPF Maturity Calculator
export function calculatePPFMaturity(params: {
  currentBalance: number
  yearlyDeposit: number
  yearsRemaining: number
  interestRate: number
}) {
  const { currentBalance, yearlyDeposit, yearsRemaining, interestRate } = params
  let balance = currentBalance
  const yearlyBreakdown: { year: number; deposit: number; interest: number; balance: number }[] = []

  for (let year = 1; year <= yearsRemaining; year++) {
    const deposit = Math.min(yearlyDeposit, 150000) // PPF max limit
    const interest = (balance + deposit) * (interestRate / 100)
    balance = balance + deposit + interest

    yearlyBreakdown.push({
      year,
      deposit,
      interest: Math.round(interest),
      balance: Math.round(balance)
    })
  }

  return {
    maturityValue: Math.round(balance),
    totalDeposits: currentBalance + yearlyDeposit * yearsRemaining,
    totalInterest: Math.round(balance - currentBalance - yearlyDeposit * yearsRemaining),
    yearlyBreakdown
  }
}

// NPS Projection Calculator
export function calculateNPSProjection(params: {
  currentCorpus: number
  monthlyContribution: number
  currentAge: number
  retirementAge: number
  expectedReturns: number
  annuityPercentage: number
}) {
  const { currentCorpus, monthlyContribution, currentAge, retirementAge, expectedReturns, annuityPercentage } = params
  const yearsToRetirement = retirementAge - currentAge
  const monthlyRate = expectedReturns / 12 / 100
  const totalMonths = yearsToRetirement * 12

  const futureCorpus =
    currentCorpus * Math.pow(1 + monthlyRate, totalMonths) +
    monthlyContribution * ((Math.pow(1 + monthlyRate, totalMonths) - 1) / monthlyRate)

  const annuityAmount = futureCorpus * (annuityPercentage / 100)
  const lumpsum = futureCorpus - annuityAmount

  // Estimate monthly pension (assuming 6% annuity rate)
  const monthlyPension = (annuityAmount * 0.06) / 12

  return {
    projectedCorpus: Math.round(futureCorpus),
    lumpsumWithdrawal: Math.round(lumpsum),
    annuityInvestment: Math.round(annuityAmount),
    estimatedMonthlyPension: Math.round(monthlyPension),
    totalContributions: currentCorpus + monthlyContribution * totalMonths,
    totalReturns: Math.round(futureCorpus - currentCorpus - monthlyContribution * totalMonths)
  }
}
