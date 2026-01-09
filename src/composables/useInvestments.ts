import { computed } from 'vue'
import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query'
import { useUiStore } from '@/stores/ui'

// Types
export interface Investment {
  id: string
  name: string
  type: 'stock' | 'mutual_fund' | 'fd' | 'bond' | 'gold' | 'real_estate' | 'crypto' | 'other'
  category: 'equity' | 'debt' | 'hybrid' | 'gold' | 'real_estate' | 'crypto' | 'cash'
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

// ============================================
// Yield Calculations
// ============================================

export interface YieldSummary {
  dividendYield: number         // % - annual dividends / portfolio value
  rentalYield: number           // % - annual rent / property value
  totalAnnualDividends: number
  totalAnnualRent: number
  portfolioValue: number
  propertyValue: number
}

export function useYieldCalculations() {
  return useQuery({
    queryKey: ['investments', 'yields'],
    queryFn: async (): Promise<YieldSummary> => {
      // Fetch portfolio and income data
      const [portfolioRes, propertiesRes, otherIncomeRes] = await Promise.all([
        fetch('/api/portfolio'),
        fetch('/api/investments?type=real_estate'),
        fetch('/api/other-income')
      ])

      const portfolio = portfolioRes.ok ? await portfolioRes.json() : { totalValue: 0 }
      const properties = propertiesRes.ok ? await propertiesRes.json() : []
      const otherIncome = otherIncomeRes.ok ? await otherIncomeRes.json() : []

      // Calculate dividend yield
      const dividendIncome = otherIncome.filter(
        (o: { category: string }) => o.category === 'dividend'
      )
      const totalAnnualDividends = dividendIncome.reduce(
        (sum: number, d: { grossAmount: number }) => sum + d.grossAmount,
        0
      )

      // Calculate rental yield
      const totalAnnualRent = properties.reduce(
        (sum: number, p: { rentalIncome?: number }) => sum + ((p.rentalIncome || 0) * 12),
        0
      )
      const propertyValue = properties.reduce(
        (sum: number, p: { currentValue: number }) => sum + p.currentValue,
        0
      )

      // Exclude real estate from dividend yield calculation (only stocks/MF value)
      const equityDebtValue = portfolio.totalValue - propertyValue

      const dividendYield = equityDebtValue > 0
        ? (totalAnnualDividends / equityDebtValue) * 100
        : 0

      const rentalYield = propertyValue > 0
        ? (totalAnnualRent / propertyValue) * 100
        : 0

      return {
        dividendYield,
        rentalYield,
        totalAnnualDividends,
        totalAnnualRent,
        portfolioValue: equityDebtValue,
        propertyValue
      }
    }
  })
}

// Calculate rental yield for a single property
export function calculateRentalYield(monthlyRent: number, propertyValue: number): number {
  if (propertyValue <= 0) return 0
  return (monthlyRent * 12 / propertyValue) * 100
}

// Calculate dividend yield
export function calculateDividendYield(annualDividends: number, portfolioValue: number): number {
  if (portfolioValue <= 0) return 0
  return (annualDividends / portfolioValue) * 100
}

// ============================================
// SIP History and Progression
// ============================================

export interface SIPYearlyData {
  year: number
  monthlySIP: number          // Total monthly SIP amount for that year
  yearlyContribution: number  // Total contributed that year
  sipCount: number            // Number of SIPs running
  growthPercent?: number      // % growth from previous year
}

export interface SIPHistorySummary {
  currentMonthlySIP: number
  totalContributed: number
  startYear: number
  yearlyData: SIPYearlyData[]
  averageGrowthRate: number   // Average year-over-year growth
}

// ============================================
// Compounding Visualization
// ============================================

export interface CompoundingDataPoint {
  year: number
  contributions: number       // Cumulative amount invested
  returns: number             // Cumulative returns (value - contributions)
  totalValue: number          // Total portfolio value
  returnsExceedContributions: boolean  // True when returns > contributions
}

export interface CompoundingAnalysis {
  data: CompoundingDataPoint[]
  crossoverYear: number | null   // Year when returns exceeded contributions
  currentContributions: number
  currentReturns: number
  currentValue: number
  returnsMultiplier: number      // returns / contributions
  isCompoundingStrong: boolean   // Returns > 50% of contributions
}

export function useCompoundingAnalysis() {
  return useQuery({
    queryKey: ['investments', 'compounding'],
    queryFn: async (): Promise<CompoundingAnalysis> => {
      // Fetch portfolio data
      const portfolioRes = await fetch('/api/portfolio')
      const portfolio = portfolioRes.ok ? await portfolioRes.json() : { totalValue: 0, totalInvested: 0 }

      const currentValue = portfolio.totalValue || 0
      const currentContributions = portfolio.totalInvested || 0
      const currentReturns = currentValue - currentContributions

      // Generate historical simulation data (would come from actual historical API)
      const currentYear = new Date().getFullYear()
      const startYear = currentYear - 10  // 10 years of history
      const data: CompoundingDataPoint[] = []

      // Simulate growth pattern (in real app, this would come from historical data)
      // Using realistic CAGR of ~12% and assuming even contributions
      const yearlyContribution = currentContributions / 10
      let cumulativeContributions = 0
      let cumulativeValue = 0

      for (let year = startYear; year <= currentYear; year++) {
        cumulativeContributions += yearlyContribution

        // Simulate market growth (varying returns)
        const yearIndex = year - startYear
        const growthFactor = 1 + (0.08 + Math.sin(yearIndex * 0.5) * 0.06) // 8-14% returns
        cumulativeValue = (cumulativeValue + yearlyContribution) * growthFactor

        const returns = cumulativeValue - cumulativeContributions

        data.push({
          year,
          contributions: Math.round(cumulativeContributions),
          returns: Math.round(returns),
          totalValue: Math.round(cumulativeValue),
          returnsExceedContributions: returns > cumulativeContributions
        })
      }

      // Adjust last data point to match actual portfolio values
      if (data.length > 0) {
        const lastPoint = data[data.length - 1]
        lastPoint.contributions = currentContributions
        lastPoint.returns = currentReturns
        lastPoint.totalValue = currentValue
        lastPoint.returnsExceedContributions = currentReturns > currentContributions
      }

      // Find crossover year
      const crossoverPoint = data.find(d => d.returnsExceedContributions)
      const crossoverYear = crossoverPoint?.year || null

      const returnsMultiplier = currentContributions > 0
        ? currentReturns / currentContributions
        : 0

      return {
        data,
        crossoverYear,
        currentContributions,
        currentReturns,
        currentValue,
        returnsMultiplier,
        isCompoundingStrong: returnsMultiplier >= 0.5
      }
    }
  })
}

// ============================================
// Portfolio Journey Timeline (Manual Snapshots)
// ============================================

export interface PortfolioSnapshot {
  id: string
  userId: string
  date: string              // "2020-01-01"
  totalValue: number        // Portfolio value at that date
  notes?: string            // Optional context
  createdAt: string
}

export interface PortfolioSnapshotInput {
  date: string
  totalValue: number
  notes?: string
}

export interface PortfolioJourney {
  snapshots: PortfolioSnapshot[]
  currentValue: number
  startValue: number
  totalGrowth: number
  totalGrowthPercent: number
  yearsTracked: number
}

export function usePortfolioSnapshots() {
  return useQuery({
    queryKey: ['investments', 'portfolio-snapshots'],
    queryFn: async (): Promise<PortfolioSnapshot[]> => {
      const res = await fetch('/api/portfolio-snapshots')
      if (!res.ok) throw new Error('Failed to fetch portfolio snapshots')
      return res.json()
    }
  })
}

export function useCreatePortfolioSnapshot() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (snapshot: PortfolioSnapshotInput): Promise<PortfolioSnapshot> => {
      const res = await fetch('/api/portfolio-snapshots', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(snapshot)
      })
      if (!res.ok) throw new Error('Failed to create snapshot')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['investments', 'portfolio-snapshots'] })
      queryClient.invalidateQueries({ queryKey: ['investments', 'portfolio-journey'] })
    }
  })
}

export function useDeletePortfolioSnapshot() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      const res = await fetch(`/api/portfolio-snapshots/${id}`, {
        method: 'DELETE'
      })
      if (!res.ok) throw new Error('Failed to delete snapshot')
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['investments', 'portfolio-snapshots'] })
      queryClient.invalidateQueries({ queryKey: ['investments', 'portfolio-journey'] })
    }
  })
}

export function usePortfolioJourney() {
  return useQuery({
    queryKey: ['investments', 'portfolio-journey'],
    queryFn: async (): Promise<PortfolioJourney> => {
      // Fetch snapshots and current portfolio
      const [snapshotsRes, portfolioRes] = await Promise.all([
        fetch('/api/portfolio-snapshots'),
        fetch('/api/portfolio')
      ])

      let snapshots: PortfolioSnapshot[] = []
      if (snapshotsRes.ok) {
        snapshots = await snapshotsRes.json()
      }

      const portfolio = portfolioRes.ok ? await portfolioRes.json() : { totalValue: 0 }
      const currentValue = portfolio.totalValue || 0

      // If no snapshots, generate sample data for demo
      if (snapshots.length === 0) {
        const now = new Date()
        const sampleData = [
          { year: 2017, value: 500000 },
          { year: 2018, value: 850000 },
          { year: 2019, value: 1200000 },
          { year: 2020, value: 1800000 },
          { year: 2021, value: 3200000 },
          { year: 2022, value: 4500000 },
          { year: 2023, value: 6200000 },
          { year: 2024, value: 7800000 },
          { year: 2025, value: currentValue || 8500000 }
        ]

        snapshots = sampleData.map((s, i) => ({
          id: `sample-${i}`,
          userId: 'demo',
          date: `${s.year}-12-31`,
          totalValue: s.value,
          createdAt: now.toISOString()
        }))
      }

      // Sort by date
      snapshots.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

      const startValue = snapshots.length > 0 ? snapshots[0].totalValue : 0
      const totalGrowth = currentValue - startValue
      const totalGrowthPercent = startValue > 0 ? (totalGrowth / startValue) * 100 : 0

      // Calculate years tracked
      const firstDate = snapshots.length > 0 ? new Date(snapshots[0].date) : new Date()
      const yearsTracked = Math.max(1, Math.round((Date.now() - firstDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000)))

      return {
        snapshots,
        currentValue,
        startValue,
        totalGrowth,
        totalGrowthPercent,
        yearsTracked
      }
    }
  })
}

export function useSIPHistory() {
  return useQuery({
    queryKey: ['investments', 'sip-history'],
    queryFn: async (): Promise<SIPHistorySummary> => {
      // Fetch mutual funds with SIP data
      const res = await fetch('/api/investments?type=mutual_fund')
      const mutualFunds = res.ok ? await res.json() : []

      // Group SIPs by start year and calculate progression
      const currentYear = new Date().getFullYear()
      const sipsByYear: Map<number, { total: number; count: number }> = new Map()

      // Calculate SIP amounts by year (mock calculation based on purchase dates)
      mutualFunds.forEach((mf: { sipAmount?: number; purchaseDate: string }) => {
        if (mf.sipAmount && mf.sipAmount > 0) {
          const startYear = new Date(mf.purchaseDate).getFullYear()
          for (let year = startYear; year <= currentYear; year++) {
            const existing = sipsByYear.get(year) || { total: 0, count: 0 }
            sipsByYear.set(year, {
              total: existing.total + mf.sipAmount,
              count: existing.count + 1
            })
          }
        }
      })

      // If no real data, generate sample progression for demo
      if (sipsByYear.size === 0) {
        const sampleProgression = [
          { year: 2019, monthlySIP: 10000, count: 2 },
          { year: 2020, monthlySIP: 20000, count: 3 },
          { year: 2021, monthlySIP: 40000, count: 5 },
          { year: 2022, monthlySIP: 55000, count: 6 },
          { year: 2023, monthlySIP: 70000, count: 7 },
          { year: 2024, monthlySIP: 90000, count: 8 },
          { year: 2025, monthlySIP: 110000, count: 9 }
        ]
        sampleProgression.forEach(s => sipsByYear.set(s.year, { total: s.monthlySIP, count: s.count }))
      }

      // Convert to yearly data array
      const years = Array.from(sipsByYear.keys()).sort()
      const yearlyData: SIPYearlyData[] = years.map((year, index) => {
        const data = sipsByYear.get(year)!
        const prevYearData = index > 0 ? sipsByYear.get(years[index - 1]) : null
        const growthPercent = prevYearData
          ? ((data.total - prevYearData.total) / prevYearData.total) * 100
          : 0

        return {
          year,
          monthlySIP: data.total,
          yearlyContribution: data.total * 12,
          sipCount: data.count,
          growthPercent: index > 0 ? growthPercent : undefined
        }
      })

      // Calculate average growth rate
      const growthRates = yearlyData
        .filter(y => y.growthPercent !== undefined)
        .map(y => y.growthPercent!)
      const averageGrowthRate = growthRates.length > 0
        ? growthRates.reduce((a, b) => a + b, 0) / growthRates.length
        : 0

      const currentMonthlySIP = yearlyData.length > 0
        ? yearlyData[yearlyData.length - 1].monthlySIP
        : 0

      const totalContributed = yearlyData.reduce((sum, y) => sum + y.yearlyContribution, 0)

      return {
        currentMonthlySIP,
        totalContributed,
        startYear: years[0] || currentYear,
        yearlyData,
        averageGrowthRate
      }
    }
  })
}
