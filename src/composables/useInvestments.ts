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

// ESOP Types
export interface ESOPGrant {
  id: string
  grantType: 'ESOP' | 'RSU' | 'RSA' | 'SAR' | 'PHANTOM'
  grantDate: string
  grantNumber?: string
  companyName: string
  companySymbol?: string
  totalUnits: number
  grantPrice: number
  fairMarketValue: number
  currentFMV?: number
  vestingScheduleType: 'CLIFF' | 'GRADED' | 'MILESTONE' | 'HYBRID'
  vestingStartDate: string
  cliffMonths: number
  totalVestingMonths: number
  vestingFrequency: number
  status: 'ACTIVE' | 'PARTIALLY_VESTED' | 'FULLY_VESTED' | 'EXERCISED' | 'EXPIRED' | 'CANCELLED' | 'FORFEITED'
  vestedUnits: number
  exercisedUnits: number
  exercisableUnits: number
  unvestedUnits: number
  forfeitedUnits: number
  expiryDate?: string
  perquisiteValue?: number
  taxPaid: number
  isListedCompany: boolean
  isStartup: boolean
  planName?: string
  notes?: string
  vestingEvents?: ESOPVestingEvent[]
}

export interface ESOPVestingEvent {
  id: string
  vestingDate: string
  unitsVested: number
  vestingPercentage: number
  fmvAtVesting: number
  exercisePrice: number
  perquisiteValue: number
  isExercised: boolean
  exerciseDate?: string
  unitsExercised?: number
  salePrice?: number
  status: 'PENDING' | 'VESTED' | 'EXERCISED' | 'EXPIRED' | 'FORFEITED'
}

export interface ESOPSummary {
  totalGrants: number
  activeGrants: number
  totalUnits: number
  vestedUnits: number
  exercisedUnits: number
  exercisableUnits: number
  unvestedUnits: number
  totalCurrentValue: number
  vestedValue: number
  exercisableValue: number
  unvestedValue: number
  totalPerquisiteValue: number
  totalTaxPaid: number
  companies: string[]
}

// ESOP Composables
export function useESOPGrants() {
  const uiStore = useUiStore()

  return useQuery({
    queryKey: computed(() => ['esop', 'grants', uiStore.isFamilyView, uiStore.selectedFamilyMemberId]),
    queryFn: async (): Promise<{ grants: ESOPGrant[]; summary: ESOPSummary }> => {
      const res = await fetch(`/api/esop${buildQueryParams()}`)
      if (!res.ok) {
        // Return mock data for demo
        return {
          grants: [],
          summary: {
            totalGrants: 0,
            activeGrants: 0,
            totalUnits: 0,
            vestedUnits: 0,
            exercisedUnits: 0,
            exercisableUnits: 0,
            unvestedUnits: 0,
            totalCurrentValue: 0,
            vestedValue: 0,
            exercisableValue: 0,
            unvestedValue: 0,
            totalPerquisiteValue: 0,
            totalTaxPaid: 0,
            companies: []
          }
        }
      }
      return res.json().then(r => r.data)
    }
  })
}

export function useESOPSummary() {
  return useQuery({
    queryKey: ['esop', 'summary'],
    queryFn: async (): Promise<ESOPSummary> => {
      const res = await fetch('/api/esop/summary')
      if (!res.ok) {
        return {
          totalGrants: 0,
          activeGrants: 0,
          totalUnits: 0,
          vestedUnits: 0,
          exercisedUnits: 0,
          exercisableUnits: 0,
          unvestedUnits: 0,
          totalCurrentValue: 0,
          vestedValue: 0,
          exercisableValue: 0,
          unvestedValue: 0,
          totalPerquisiteValue: 0,
          totalTaxPaid: 0,
          companies: []
        }
      }
      return res.json().then(r => r.data)
    }
  })
}

export function useESOPGrant(grantId: string) {
  return useQuery({
    queryKey: ['esop', 'grant', grantId],
    queryFn: async () => {
      const res = await fetch(`/api/esop/${grantId}`)
      if (!res.ok) throw new Error('Failed to fetch ESOP grant')
      return res.json().then(r => r.data)
    },
    enabled: !!grantId
  })
}

export function useCreateESOPGrant() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: Partial<ESOPGrant>) => {
      const res = await fetch('/api/esop', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      if (!res.ok) throw new Error('Failed to create ESOP grant')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['esop'] })
    }
  })
}

export function useUpdateESOPGrant() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<ESOPGrant> }) => {
      const res = await fetch(`/api/esop/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      if (!res.ok) throw new Error('Failed to update ESOP grant')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['esop'] })
    }
  })
}

export function useDeleteESOPGrant() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/esop/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete ESOP grant')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['esop'] })
    }
  })
}

export function useVestESOPGrant() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ grantId, vestingEventId, fmvAtVesting, tdsDeducted }: {
      grantId: string
      vestingEventId: string
      fmvAtVesting?: number
      tdsDeducted?: number
    }) => {
      const res = await fetch(`/api/esop/${grantId}/vest`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vestingEventId, fmvAtVesting, tdsDeducted })
      })
      if (!res.ok) throw new Error('Failed to process vesting')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['esop'] })
    }
  })
}

export function useExerciseESOPGrant() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ grantId, units, salePrice }: {
      grantId: string
      units: number
      salePrice?: number
    }) => {
      const res = await fetch(`/api/esop/${grantId}/exercise`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ units, salePrice })
      })
      if (!res.ok) throw new Error('Failed to exercise options')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['esop'] })
    }
  })
}

export function useUpdateESOPFMV() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ grantId, currentFMV }: { grantId: string; currentFMV: number }) => {
      const res = await fetch(`/api/esop/${grantId}/fmv`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentFMV })
      })
      if (!res.ok) throw new Error('Failed to update FMV')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['esop'] })
    }
  })
}

// ==========================================
// Investment Reports Types & Composables
// ==========================================

export interface PortfolioSummaryReport {
  generatedAt: string
  financialYear: string
  summary: {
    totalPortfolioValue: number
    totalInvested: number
    absoluteReturn: number
    absoluteReturnPercent: number
  }
  breakdown: {
    investments: { value: number; percentage: number }
    epf: { value: number; percentage: number }
    ppf: { value: number; percentage: number }
    nps: { value: number; percentage: number }
    esop: { value: number; percentage: number }
  }
  categoryBreakdown: Array<{
    category: string
    value: number
    invested: number
    count: number
    returns: number
    returnsPercent: number
    allocation: number
  }>
  typeBreakdown: Array<{
    type: string
    value: number
    invested: number
    count: number
    returns: number
    returnsPercent: number
    allocation: number
  }>
  topHoldings: Array<{
    name: string
    type: string
    value: number
    invested: number
    returns: number
    returnsPercent: number
    allocation: number
  }>
  retirementAccounts: {
    epf: { balance: number; employeeShare: number; employerShare: number } | null
    ppf: Array<{ id: string; balance: number; maturityDate: string }>
    nps: Array<{
      id: string
      tierType: string
      corpus: number
      allocation: { equity: number; corporateDebt: number; governmentBonds: number }
    }>
  }
  esopSummary: {
    totalGrants: number
    vestedValue: number
    unvestedValue: number
    exercisableValue: number
  }
}

export interface TaxReportData {
  financialYear: string
  generatedAt: string
  capitalGains: {
    shortTerm: {
      equity: { gain: number; taxRate: string; estimatedTax: number; transactions: number }
      other: { gain: number; taxRate: string; estimatedTax: number; transactions: number }
      total: number
      totalTax: number
    }
    longTerm: {
      equity: {
        gain: number
        exemption: number
        taxableGain: number
        taxRate: string
        estimatedTax: number
        transactions: number
      }
      other: { gain: number; taxRate: string; estimatedTax: number; transactions: number }
      total: number
      totalTax: number
    }
    totalGain: number
    totalTax: number
  }
  dividendIncome: {
    total: number
    tdsDeducted: number
    taxRate: string
    transactions: number
  }
  esopIncome: {
    perquisiteValue: number
    tdsDeducted: number
    taxRate: string
    exercises: number
    note: string
  }
  summary: {
    totalTaxableIncome: number
    totalEstimatedTax: number
    totalTdsDeducted: number
    netTaxPayable: number
  }
  transactions: Array<{
    id: string
    assetName: string
    assetType: string
    purchaseDate: string
    saleDate: string
    purchasePrice: number
    salePrice: number
    holdingPeriod: number
    gainType: string
    grossGain: number
    exemption: number
    taxableGain: number
    taxRate: string
    estimatedTax: number
  }>
}

export interface PerformanceReportData {
  period: string
  generatedAt: string
  summary: {
    totalReturn: number
    totalReturnPercent: number
    cagr: number
    benchmarkReturn?: number
    alpha?: number
  }
  topPerformers: Array<{
    name: string
    type: string
    returnPercent: number
    absoluteReturn: number
  }>
  bottomPerformers: Array<{
    name: string
    type: string
    returnPercent: number
    absoluteReturn: number
  }>
  monthlyReturns: Array<{
    month: string
    return: number
    returnPercent: number
  }>
}

export interface Section80CStatus {
  limit: number
  used: number
  remaining: number
  items: Array<{
    category: string
    amount: number
    maxAllowed: number
    source: string
  }>
}

export interface RetirementProjection {
  currentAge: number
  retirementAge: number
  yearsToRetirement: number
  currentCorpus: number
  projectedCorpus: number
  monthlyPension: number
  assumptions: {
    expectedReturn: number
    inflationRate: number
    monthlyContribution: number
  }
}

// Portfolio Summary Report
export function usePortfolioSummaryReport() {
  return useQuery({
    queryKey: ['investment-reports', 'portfolio-summary'],
    queryFn: async (): Promise<PortfolioSummaryReport> => {
      const res = await fetch('/api/investment-reports/portfolio-summary')
      if (!res.ok) {
        // Return mock data for demo
        return {
          generatedAt: new Date().toISOString(),
          financialYear: '2024-25',
          summary: {
            totalPortfolioValue: 5000000,
            totalInvested: 4000000,
            absoluteReturn: 1000000,
            absoluteReturnPercent: 25,
          },
          breakdown: {
            investments: { value: 3000000, percentage: 60 },
            epf: { value: 800000, percentage: 16 },
            ppf: { value: 500000, percentage: 10 },
            nps: { value: 400000, percentage: 8 },
            esop: { value: 300000, percentage: 6 },
          },
          categoryBreakdown: [
            { category: 'EQUITY', value: 2000000, invested: 1600000, count: 15, returns: 400000, returnsPercent: 25, allocation: 40 },
            { category: 'DEBT', value: 1500000, invested: 1400000, count: 8, returns: 100000, returnsPercent: 7.14, allocation: 30 },
            { category: 'GOLD', value: 500000, invested: 400000, count: 2, returns: 100000, returnsPercent: 25, allocation: 10 },
          ],
          typeBreakdown: [
            { type: 'MUTUAL_FUND', value: 1800000, invested: 1500000, count: 12, returns: 300000, returnsPercent: 20, allocation: 36 },
            { type: 'STOCK', value: 1200000, invested: 900000, count: 10, returns: 300000, returnsPercent: 33.3, allocation: 24 },
          ],
          topHoldings: [
            { name: 'Axis Bluechip Fund', type: 'MUTUAL_FUND', value: 500000, invested: 400000, returns: 100000, returnsPercent: 25, allocation: 10 },
            { name: 'HDFC Bank', type: 'STOCK', value: 400000, invested: 300000, returns: 100000, returnsPercent: 33.3, allocation: 8 },
          ],
          retirementAccounts: {
            epf: { balance: 800000, employeeShare: 400000, employerShare: 400000 },
            ppf: [{ id: '1', balance: 500000, maturityDate: '2030-04-01' }],
            nps: [{ id: '1', tierType: 'TIER_1', corpus: 400000, allocation: { equity: 50, corporateDebt: 30, governmentBonds: 20 } }],
          },
          esopSummary: {
            totalGrants: 2,
            vestedValue: 200000,
            unvestedValue: 100000,
            exercisableValue: 150000,
          },
        }
      }
      const data = await res.json()
      return data.data
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

// Tax Report
export function useTaxReport(financialYear?: string) {
  const fy = financialYear || getCurrentFinancialYear()

  return useQuery({
    queryKey: ['investment-reports', 'tax-report', fy],
    queryFn: async (): Promise<TaxReportData> => {
      const res = await fetch(`/api/investment-reports/tax-report?financialYear=${fy}`)
      if (!res.ok) {
        // Return mock data for demo
        return {
          financialYear: fy,
          generatedAt: new Date().toISOString(),
          capitalGains: {
            shortTerm: {
              equity: { gain: 50000, taxRate: '20%', estimatedTax: 10000, transactions: 5 },
              other: { gain: 20000, taxRate: 'Slab Rate', estimatedTax: 6000, transactions: 2 },
              total: 70000,
              totalTax: 16000,
            },
            longTerm: {
              equity: { gain: 200000, exemption: 125000, taxableGain: 75000, taxRate: '12.5%', estimatedTax: 9375, transactions: 3 },
              other: { gain: 50000, taxRate: '12.5%', estimatedTax: 6250, transactions: 1 },
              total: 250000,
              totalTax: 15625,
            },
            totalGain: 320000,
            totalTax: 31625,
          },
          dividendIncome: {
            total: 25000,
            tdsDeducted: 2500,
            taxRate: 'Slab Rate (TDS 10% above Rs 5,000)',
            transactions: 8,
          },
          esopIncome: {
            perquisiteValue: 100000,
            tdsDeducted: 30000,
            taxRate: 'Slab Rate (at vesting)',
            exercises: 1,
            note: 'Capital gains on sale taxed separately',
          },
          summary: {
            totalTaxableIncome: 445000,
            totalEstimatedTax: 31625,
            totalTdsDeducted: 32500,
            netTaxPayable: -875,
          },
          transactions: [],
        }
      }
      const data = await res.json()
      return data.data
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
  })
}

// Performance Report
export function usePerformanceReport(period: string = '1Y') {
  return useQuery({
    queryKey: ['investment-reports', 'performance', period],
    queryFn: async (): Promise<PerformanceReportData> => {
      const res = await fetch(`/api/investment-reports/performance?period=${period}`)
      if (!res.ok) {
        // Return mock data for demo
        return {
          period,
          generatedAt: new Date().toISOString(),
          summary: {
            totalReturn: 250000,
            totalReturnPercent: 18.5,
            cagr: 15.2,
            benchmarkReturn: 12.5,
            alpha: 2.7,
          },
          topPerformers: [
            { name: 'Tata Digital Fund', type: 'MUTUAL_FUND', returnPercent: 45.2, absoluteReturn: 90000 },
            { name: 'Infosys', type: 'STOCK', returnPercent: 38.5, absoluteReturn: 77000 },
            { name: 'ICICI Prudential Tech', type: 'MUTUAL_FUND', returnPercent: 32.1, absoluteReturn: 64000 },
          ],
          bottomPerformers: [
            { name: 'Paytm', type: 'STOCK', returnPercent: -25.3, absoluteReturn: -12500 },
            { name: 'Zomato', type: 'STOCK', returnPercent: -15.2, absoluteReturn: -7600 },
          ],
          monthlyReturns: [
            { month: '2024-01', return: 25000, returnPercent: 2.1 },
            { month: '2024-02', return: 18000, returnPercent: 1.5 },
            { month: '2024-03', return: -8000, returnPercent: -0.6 },
          ],
        }
      }
      const data = await res.json()
      return data.data
    },
    staleTime: 5 * 60 * 1000,
  })
}

// 80C Status Report
export function use80CStatus() {
  return useQuery({
    queryKey: ['investment-reports', '80c-status'],
    queryFn: async (): Promise<Section80CStatus> => {
      const res = await fetch('/api/investment-reports/80c-status')
      if (!res.ok) {
        // Return mock data for demo
        return {
          limit: 150000,
          used: 125000,
          remaining: 25000,
          items: [
            { category: 'EPF', amount: 50000, maxAllowed: 150000, source: 'Employer Deduction' },
            { category: 'PPF', amount: 40000, maxAllowed: 150000, source: 'Self Deposit' },
            { category: 'ELSS', amount: 25000, maxAllowed: 150000, source: 'Mutual Funds' },
            { category: 'Life Insurance', amount: 10000, maxAllowed: 150000, source: 'Premium Payment' },
          ],
        }
      }
      const data = await res.json()
      return data.data
    },
    staleTime: 10 * 60 * 1000,
  })
}

// Retirement Projection Report
export function useRetirementProjection() {
  return useQuery({
    queryKey: ['investment-reports', 'retirement-projection'],
    queryFn: async (): Promise<RetirementProjection> => {
      const res = await fetch('/api/investment-reports/retirement-projection')
      if (!res.ok) {
        // Return mock data for demo
        return {
          currentAge: 35,
          retirementAge: 60,
          yearsToRetirement: 25,
          currentCorpus: 2500000,
          projectedCorpus: 45000000,
          monthlyPension: 150000,
          assumptions: {
            expectedReturn: 12,
            inflationRate: 6,
            monthlyContribution: 50000,
          },
        }
      }
      const data = await res.json()
      return data.data
    },
    staleTime: 30 * 60 * 1000, // 30 minutes
  })
}

// Helper function to get current financial year
function getCurrentFinancialYear(): string {
  const now = new Date()
  const month = now.getMonth()
  const year = now.getFullYear()
  const startYear = month >= 3 ? year : year - 1
  return `${startYear}-${String(startYear + 1).slice(-2)}`
}
