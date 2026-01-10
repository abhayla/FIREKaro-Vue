import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query'
import { computed, ref, type Ref } from 'vue'

// Insurance Types
export type InsuranceType = 'life' | 'health' | 'motor' | 'home' | 'travel'
export type PolicyStatus = 'active' | 'expired' | 'cancelled' | 'pending'
export type PaymentFrequency = 'monthly' | 'quarterly' | 'half-yearly' | 'yearly'

// Policy interface matching backend schema
export interface InsurancePolicy {
  id: string
  type: InsuranceType
  provider: string
  policyNumber: string
  policyName: string
  status: PolicyStatus
  sumAssured: number
  premium: number
  paymentFrequency: PaymentFrequency
  startDate: string
  endDate: string
  maturityDate?: string
  // Life insurance specific
  nominees?: InsuranceNominee[]
  riders?: InsuranceRider[]
  // Health specific
  coverageType?: 'individual' | 'family' | 'floater'
  familyMembers?: string[]
  roomRent?: number
  coPayment?: number
  waitingPeriod?: number
  networkHospitals?: number
  // Motor specific
  vehicleNumber?: string
  vehicleModel?: string
  idvValue?: number
  // Home specific
  propertyAddress?: string
  propertyValue?: number
  // Common
  claimBonus?: number
  taxBenefit?: '80C' | '80D' | 'both' | 'none'
  documents?: string[]
  notes?: string
  familyMemberId?: string
  createdAt: string
  updatedAt: string
}

export interface InsuranceNominee {
  id: string
  name: string
  relationship: string
  share: number
  age?: number
  contactNumber?: string
}

export interface InsuranceRider {
  id: string
  name: string
  sumAssured: number
  premium: number
}

export interface CreatePolicyInput {
  type: InsuranceType
  provider: string
  policyNumber: string
  policyName: string
  sumAssured: number
  premium: number
  paymentFrequency: PaymentFrequency
  startDate: string
  endDate: string
  maturityDate?: string
  coverageType?: 'individual' | 'family' | 'floater'
  familyMembers?: string[]
  roomRent?: number
  coPayment?: number
  vehicleNumber?: string
  vehicleModel?: string
  idvValue?: number
  propertyAddress?: string
  propertyValue?: number
  taxBenefit?: '80C' | '80D' | 'both' | 'none'
  notes?: string
  familyMemberId?: string
}

export interface UpdatePolicyInput extends Partial<CreatePolicyInput> {
  id: string
}

// Coverage Analysis Types
export interface CoverageAnalysis {
  life: {
    current: number
    recommended: number
    gap: number
    percentage: number
    breakdown: {
      incomeReplacement: number
      liabilities: number
      childrenFuture: number
      emergencyBuffer: number
    }
  }
  health: {
    current: number
    recommended: number
    gap: number
    percentage: number
    familyBreakdown: {
      self: number
      spouse?: number
      children?: number
      parents?: number
    }
  }
  overall: {
    score: number
    status: 'adequate' | 'partial' | 'critical'
    message: string
  }
}

export interface InsuranceRecommendation {
  priority: number
  type: InsuranceType
  description: string
  suggestedCoverage: number
  estimatedPremium: {
    min: number
    max: number
  }
  taxBenefit?: string
}

// Summary Types
export interface InsuranceSummary {
  totalPolicies: number
  lifeCoverage: number
  healthCoverage: number
  annualPremium: number
  upcomingRenewals: InsurancePolicy[]
  policiesByType: Record<InsuranceType, number>
  taxDeductions: {
    section80C: number
    section80D: number
  }
}

// HLV Calculator Input
export interface HLVCalculatorInput {
  annualIncome: number
  age: number
  retirementAge: number
  city: 'metro' | 'tier1' | 'tier2'
  spouse?: { age: number }
  children?: { age: number }[]
  dependentParents?: { age: number }[]
  homeLoan?: number
  carLoan?: number
  otherLoans?: number
  creditCardDebt?: number
  childEducation?: number
  childMarriage?: number
  spouseSecurityYears?: number
  existingLifeCover?: number
  existingHealthCover?: number
  employerCover?: number
}

// Helper functions
export const formatINR = (amount: number) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount)

export const formatINRCompact = (amount: number) => {
  if (amount >= 10000000) {
    return `₹${(amount / 10000000).toFixed(1)}Cr`
  } else if (amount >= 100000) {
    return `₹${(amount / 100000).toFixed(1)}L`
  } else if (amount >= 1000) {
    return `₹${(amount / 1000).toFixed(1)}K`
  }
  return formatINR(amount)
}

export const formatDate = (date: string) =>
  new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(date))

export const getDaysUntil = (date: string) => {
  const target = new Date(date)
  const today = new Date()
  const diff = target.getTime() - today.getTime()
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

export const getInsuranceTypeIcon = (type: InsuranceType) => {
  const icons: Record<InsuranceType, string> = {
    life: 'mdi-heart-pulse',
    health: 'mdi-hospital-box',
    motor: 'mdi-car',
    home: 'mdi-home-outline',
    travel: 'mdi-airplane',
  }
  return icons[type]
}

export const getInsuranceTypeColor = (type: InsuranceType) => {
  const colors: Record<InsuranceType, string> = {
    life: 'purple',
    health: 'blue',
    motor: 'orange',
    home: 'green',
    travel: 'cyan',
  }
  return colors[type]
}

export const getStatusColor = (status: PolicyStatus) => {
  const colors: Record<PolicyStatus, string> = {
    active: 'success',
    expired: 'error',
    cancelled: 'grey',
    pending: 'warning',
  }
  return colors[status]
}

// HLV Calculation (Human Life Value method)
export function calculateHLV(input: HLVCalculatorInput): CoverageAnalysis {
  const yearsToRetirement = input.retirementAge - input.age
  const incomeMultiplier = yearsToRetirement > 20 ? 20 : yearsToRetirement > 10 ? 15 : 10

  // Life insurance calculation
  const incomeReplacement = input.annualIncome * incomeMultiplier
  const liabilities =
    (input.homeLoan || 0) +
    (input.carLoan || 0) +
    (input.otherLoans || 0) +
    (input.creditCardDebt || 0)
  const childrenFuture =
    (input.children?.length || 0) * ((input.childEducation || 0) + (input.childMarriage || 0))
  const emergencyBuffer = input.annualIncome * 0.5 // 6 months emergency

  const totalLifeRecommended = incomeReplacement + liabilities + childrenFuture + emergencyBuffer
  const existingLife = (input.existingLifeCover || 0) + (input.employerCover || 0)
  const lifeGap = Math.max(0, totalLifeRecommended - existingLife)

  // Health insurance calculation based on city tier
  const baseHealthCover = {
    metro: 1000000, // ₹10L
    tier1: 750000, // ₹7.5L
    tier2: 500000, // ₹5L
  }

  const selfCover = baseHealthCover[input.city]
  const spouseCover = input.spouse ? baseHealthCover[input.city] : 0
  const childrenCover = (input.children?.length || 0) * 500000 // ₹5L per child
  const parentsCover = (input.dependentParents?.length || 0) * baseHealthCover[input.city] * 1.5 // 1.5x for seniors

  const totalHealthRecommended = selfCover + spouseCover + childrenCover + parentsCover
  const healthGap = Math.max(0, totalHealthRecommended - (input.existingHealthCover || 0))

  // Overall score
  const lifeScore =
    existingLife > 0 ? Math.min(100, (existingLife / totalLifeRecommended) * 100) : 0
  const healthScore =
    (input.existingHealthCover || 0) > 0
      ? Math.min(100, ((input.existingHealthCover || 0) / totalHealthRecommended) * 100)
      : 0
  const overallScore = (lifeScore * 0.6 + healthScore * 0.4) // Life weighted more

  let status: 'adequate' | 'partial' | 'critical'
  let message: string

  if (overallScore >= 70) {
    status = 'adequate'
    message = 'Your coverage is adequate. Review annually to ensure continued protection.'
  } else if (overallScore >= 40) {
    status = 'partial'
    message = 'Your coverage has gaps. Consider increasing coverage in key areas.'
  } else {
    status = 'critical'
    message = 'Your coverage is critically low. Immediate action recommended.'
  }

  return {
    life: {
      current: existingLife,
      recommended: totalLifeRecommended,
      gap: lifeGap,
      percentage: lifeScore,
      breakdown: {
        incomeReplacement,
        liabilities,
        childrenFuture,
        emergencyBuffer,
      },
    },
    health: {
      current: input.existingHealthCover || 0,
      recommended: totalHealthRecommended,
      gap: healthGap,
      percentage: healthScore,
      familyBreakdown: {
        self: selfCover,
        spouse: spouseCover || undefined,
        children: childrenCover || undefined,
        parents: parentsCover || undefined,
      },
    },
    overall: {
      score: overallScore,
      status,
      message,
    },
  }
}

// Main composable for insurance policies
export function useInsurancePolicies(type?: Ref<InsuranceType | 'all'> | InsuranceType | 'all') {
  const queryClient = useQueryClient()
  const typeValue = computed(() => (typeof type === 'string' ? type : type?.value || 'all'))

  // Fetch policies
  const policiesQuery = useQuery({
    queryKey: computed(() => ['insurance-policies', typeValue.value]),
    queryFn: async () => {
      const url =
        typeValue.value && typeValue.value !== 'all'
          ? `/api/insurance?type=${typeValue.value}`
          : '/api/insurance'
      const res = await fetch(url)
      if (!res.ok) throw new Error('Failed to fetch insurance policies')
      return res.json() as Promise<InsurancePolicy[]>
    },
  })

  // Create policy
  const createPolicy = useMutation({
    mutationFn: async (data: CreatePolicyInput) => {
      const res = await fetch('/api/insurance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error('Failed to create policy')
      return res.json() as Promise<InsurancePolicy>
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['insurance-policies'] })
      queryClient.invalidateQueries({ queryKey: ['insurance-summary'] })
      queryClient.invalidateQueries({ queryKey: ['coverage-analysis'] })
    },
  })

  // Update policy
  const updatePolicy = useMutation({
    mutationFn: async ({ id, ...data }: UpdatePolicyInput) => {
      const res = await fetch(`/api/insurance/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error('Failed to update policy')
      return res.json() as Promise<InsurancePolicy>
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['insurance-policies'] })
      queryClient.invalidateQueries({ queryKey: ['insurance-summary'] })
      queryClient.invalidateQueries({ queryKey: ['coverage-analysis'] })
    },
  })

  // Delete policy
  const deletePolicy = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/insurance/${id}`, {
        method: 'DELETE',
      })
      if (!res.ok) throw new Error('Failed to delete policy')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['insurance-policies'] })
      queryClient.invalidateQueries({ queryKey: ['insurance-summary'] })
      queryClient.invalidateQueries({ queryKey: ['coverage-analysis'] })
    },
  })

  // Filtered policies by status
  const activePolicies = computed(
    () => policiesQuery.data.value?.filter((p) => p.status === 'active') || []
  )

  const expiredPolicies = computed(
    () => policiesQuery.data.value?.filter((p) => p.status === 'expired') || []
  )

  // Policies expiring soon (within 30 days)
  const expiringPolicies = computed(() => {
    return (
      activePolicies.value?.filter((p) => {
        const days = getDaysUntil(p.endDate)
        return days > 0 && days <= 30
      }) || []
    )
  })

  // Total coverage
  const totalCoverage = computed(() =>
    activePolicies.value.reduce((sum, p) => sum + p.sumAssured, 0)
  )

  // Total annual premium
  const totalAnnualPremium = computed(() =>
    activePolicies.value.reduce((sum, p) => {
      const multiplier = {
        monthly: 12,
        quarterly: 4,
        'half-yearly': 2,
        yearly: 1,
      }
      return sum + p.premium * multiplier[p.paymentFrequency]
    }, 0)
  )

  // Coverage by type
  const coverageByType = computed(() => {
    const coverage: Record<InsuranceType, number> = {
      life: 0,
      health: 0,
      motor: 0,
      home: 0,
      travel: 0,
    }
    activePolicies.value.forEach((p) => {
      coverage[p.type] += p.sumAssured
    })
    return coverage
  })

  return {
    // Queries
    policies: policiesQuery.data,
    isLoading: policiesQuery.isLoading,
    isError: policiesQuery.isError,
    error: policiesQuery.error,
    refetch: policiesQuery.refetch,

    // Mutations
    createPolicy,
    updatePolicy,
    deletePolicy,

    // Computed
    activePolicies,
    expiredPolicies,
    expiringPolicies,
    totalCoverage,
    totalAnnualPremium,
    coverageByType,
  }
}

// Composable for insurance summary
export function useInsuranceSummary() {
  return useQuery({
    queryKey: ['insurance-summary'],
    queryFn: async () => {
      // This would ideally be a dedicated summary endpoint
      // For now, we calculate from policies
      const res = await fetch('/api/insurance')
      if (!res.ok) throw new Error('Failed to fetch insurance data')
      const policies = (await res.json()) as InsurancePolicy[]

      const activePolicies = policies.filter((p) => p.status === 'active')
      const now = new Date()
      const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)

      const summary: InsuranceSummary = {
        totalPolicies: activePolicies.length,
        lifeCoverage: activePolicies
          .filter((p) => p.type === 'life')
          .reduce((sum, p) => sum + p.sumAssured, 0),
        healthCoverage: activePolicies
          .filter((p) => p.type === 'health')
          .reduce((sum, p) => sum + p.sumAssured, 0),
        annualPremium: activePolicies.reduce((sum, p) => {
          const multiplier = {
            monthly: 12,
            quarterly: 4,
            'half-yearly': 2,
            yearly: 1,
          }
          return sum + p.premium * multiplier[p.paymentFrequency]
        }, 0),
        upcomingRenewals: activePolicies.filter(
          (p) => new Date(p.endDate) <= thirtyDaysFromNow && new Date(p.endDate) >= now
        ),
        policiesByType: {
          life: activePolicies.filter((p) => p.type === 'life').length,
          health: activePolicies.filter((p) => p.type === 'health').length,
          motor: activePolicies.filter((p) => p.type === 'motor').length,
          home: activePolicies.filter((p) => p.type === 'home').length,
          travel: activePolicies.filter((p) => p.type === 'travel').length,
        },
        taxDeductions: {
          section80C: activePolicies
            .filter((p) => p.taxBenefit === '80C' || p.taxBenefit === 'both')
            .reduce((sum, p) => {
              const multiplier = {
                monthly: 12,
                quarterly: 4,
                'half-yearly': 2,
                yearly: 1,
              }
              return sum + p.premium * multiplier[p.paymentFrequency]
            }, 0),
          section80D: activePolicies
            .filter((p) => p.taxBenefit === '80D' || p.taxBenefit === 'both')
            .reduce((sum, p) => {
              const multiplier = {
                monthly: 12,
                quarterly: 4,
                'half-yearly': 2,
                yearly: 1,
              }
              return sum + p.premium * multiplier[p.paymentFrequency]
            }, 0),
        },
      }

      return summary
    },
  })
}

// Composable for coverage analysis
export function useCoverageAnalysis() {
  return useQuery({
    queryKey: ['coverage-analysis'],
    queryFn: async () => {
      const res = await fetch('/api/insurance/coverage-analysis')
      if (!res.ok) throw new Error('Failed to fetch coverage analysis')
      return res.json() as Promise<CoverageAnalysis>
    },
  })
}

// Composable for recommendations
export function useInsuranceRecommendations() {
  return useQuery({
    queryKey: ['insurance-recommendations'],
    queryFn: async () => {
      const res = await fetch('/api/insurance/recommendations')
      if (!res.ok) throw new Error('Failed to fetch recommendations')
      return res.json() as Promise<InsuranceRecommendation[]>
    },
  })
}

// Family member filter ref (shared state)
export const selectedFamilyMember = ref<string | 'all'>('all')

// Composable for family-filtered policies
export function useFamilyPolicies() {
  const { policies, isLoading } = useInsurancePolicies()

  const filteredPolicies = computed(() => {
    if (!policies.value) return []
    if (selectedFamilyMember.value === 'all') return policies.value
    return policies.value.filter(
      (p) => !p.familyMemberId || p.familyMemberId === selectedFamilyMember.value
    )
  })

  const familyCoverage = computed(() => {
    if (!policies.value) return []

    const members = new Map<
      string,
      {
        id: string
        name: string
        lifeCoverage: number
        healthCoverage: number
        totalPolicies: number
      }
    >()

    // Add 'self' by default
    members.set('self', {
      id: 'self',
      name: 'Self',
      lifeCoverage: 0,
      healthCoverage: 0,
      totalPolicies: 0,
    })

    policies.value
      .filter((p) => p.status === 'active')
      .forEach((p) => {
        const memberId = p.familyMemberId || 'self'
        if (!members.has(memberId)) {
          members.set(memberId, {
            id: memberId,
            name: memberId,
            lifeCoverage: 0,
            healthCoverage: 0,
            totalPolicies: 0,
          })
        }

        const member = members.get(memberId)!
        member.totalPolicies++
        if (p.type === 'life') {
          member.lifeCoverage += p.sumAssured
        } else if (p.type === 'health') {
          member.healthCoverage += p.sumAssured
        }
      })

    return Array.from(members.values())
  })

  return {
    filteredPolicies,
    familyCoverage,
    isLoading,
  }
}
