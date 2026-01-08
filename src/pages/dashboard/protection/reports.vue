<script setup lang="ts">
import { ref, computed } from 'vue'
import SectionHeader from '@/components/shared/SectionHeader.vue'
import {
  useInsurancePolicies,
  useInsuranceSummary,
  useCoverageAnalysis,
  type InsurancePolicy,
  formatINR,
  formatINRCompact,
  formatDate,
  getDaysUntil,
  getInsuranceTypeIcon,
  getInsuranceTypeColor,
} from '@/composables/useProtection'

const tabs = [
  { title: 'Overview', route: '/dashboard/protection' },
  { title: 'Life', route: '/dashboard/protection/life' },
  { title: 'Health', route: '/dashboard/protection/health' },
  { title: 'Other', route: '/dashboard/protection/other' },
  { title: 'Calculator', route: '/dashboard/protection/calculator' },
  { title: 'Reports', route: '/dashboard/protection/reports' },
]

// Fetch data
const { activePolicies, isLoading } = useInsurancePolicies()
const { data: summary } = useInsuranceSummary()
const { data: coverageAnalysis } = useCoverageAnalysis()

// Report type selector
const selectedReport = ref<'coverage' | 'premium' | 'tax' | 'renewals'>('coverage')

const reportTypes = [
  { title: 'Coverage Summary', value: 'coverage', icon: 'mdi-shield-check' },
  { title: 'Premium Analysis', value: 'premium', icon: 'mdi-cash' },
  { title: 'Tax Deductions', value: 'tax', icon: 'mdi-percent' },
  { title: 'Upcoming Renewals', value: 'renewals', icon: 'mdi-calendar-alert' },
]

// Coverage by type
const coverageByType = computed(() => {
  const coverage: Record<string, { count: number; coverage: number; premium: number }> = {}

  activePolicies.value?.forEach((p) => {
    if (!coverage[p.type]) {
      coverage[p.type] = { count: 0, coverage: 0, premium: 0 }
    }
    coverage[p.type].count++
    coverage[p.type].coverage += p.sumAssured
    const multiplier = { monthly: 12, quarterly: 4, 'half-yearly': 2, yearly: 1 }
    coverage[p.type].premium += p.premium * multiplier[p.paymentFrequency]
  })

  return coverage
})

// Policies expiring in next 60 days
const upcomingRenewals = computed(() => {
  return activePolicies.value
    ?.filter((p) => {
      const days = getDaysUntil(p.endDate)
      return days > 0 && days <= 60
    })
    .sort((a, b) => new Date(a.endDate).getTime() - new Date(b.endDate).getTime()) || []
})

// Tax deduction details
const taxDeductions = computed(() => {
  const deductions = {
    section80C: [] as InsurancePolicy[],
    section80D: [] as InsurancePolicy[],
    total80C: 0,
    total80D: 0,
  }

  activePolicies.value?.forEach((p) => {
    const multiplier = { monthly: 12, quarterly: 4, 'half-yearly': 2, yearly: 1 }
    const annualPremium = p.premium * multiplier[p.paymentFrequency]

    if (p.taxBenefit === '80C' || p.taxBenefit === 'both') {
      deductions.section80C.push(p)
      deductions.total80C += annualPremium
    }
    if (p.taxBenefit === '80D' || p.taxBenefit === 'both') {
      deductions.section80D.push(p)
      deductions.total80D += annualPremium
    }
  })

  return deductions
})

// Export functions
const exportToCSV = () => {
  if (!activePolicies.value) return

  const headers = ['Policy Name', 'Type', 'Provider', 'Sum Assured', 'Annual Premium', 'Start Date', 'End Date', 'Status']
  const rows = activePolicies.value.map((p) => {
    const multiplier = { monthly: 12, quarterly: 4, 'half-yearly': 2, yearly: 1 }
    return [
      p.policyName,
      p.type,
      p.provider,
      p.sumAssured,
      p.premium * multiplier[p.paymentFrequency],
      p.startDate,
      p.endDate,
      p.status,
    ]
  })

  const csv = [headers, ...rows].map((row) => row.join(',')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `insurance-report-${new Date().toISOString().split('T')[0]}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

const printReport = () => {
  window.print()
}
</script>

<template>
  <div>
    <SectionHeader
      title="Protection"
      subtitle="Insurance Reports"
      icon="mdi-shield-check"
      :tabs="tabs"
    />

    <!-- Report Type Selector -->
    <v-card class="mb-6">
      <v-card-text class="d-flex flex-wrap align-center gap-4">
        <v-btn-toggle v-model="selectedReport" mandatory variant="outlined" divided>
          <v-btn
            v-for="report in reportTypes"
            :key="report.value"
            :value="report.value"
            size="small"
          >
            <v-icon :icon="report.icon" class="mr-1" size="18" />
            {{ report.title }}
          </v-btn>
        </v-btn-toggle>
        <v-spacer />
        <v-btn variant="outlined" size="small" @click="exportToCSV">
          <v-icon icon="mdi-download" class="mr-1" />
          Export CSV
        </v-btn>
        <v-btn variant="outlined" size="small" @click="printReport">
          <v-icon icon="mdi-printer" class="mr-1" />
          Print
        </v-btn>
      </v-card-text>
    </v-card>

    <!-- Loading State -->
    <div v-if="isLoading" class="text-center py-8">
      <v-progress-circular indeterminate color="primary" size="48" />
      <p class="mt-4 text-medium-emphasis">Loading report data...</p>
    </div>

    <template v-else>
      <!-- Coverage Summary Report -->
      <template v-if="selectedReport === 'coverage'">
        <v-row>
          <v-col cols="12">
            <v-card>
              <v-card-title>
                <v-icon icon="mdi-shield-check" class="mr-2" />
                Coverage Summary Report
              </v-card-title>
              <v-card-text>
                <v-table>
                  <thead>
                    <tr>
                      <th>Insurance Type</th>
                      <th class="text-center">Policies</th>
                      <th class="text-right">Total Coverage</th>
                      <th class="text-right">Annual Premium</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="(data, type) in coverageByType" :key="type">
                      <td>
                        <div class="d-flex align-center">
                          <v-avatar :color="getInsuranceTypeColor(type as any)" size="32" class="mr-2">
                            <v-icon :icon="getInsuranceTypeIcon(type as any)" color="white" size="16" />
                          </v-avatar>
                          <span class="text-capitalize font-weight-medium">{{ type }}</span>
                        </div>
                      </td>
                      <td class="text-center">{{ data.count }}</td>
                      <td class="text-right font-weight-bold text-success">
                        {{ formatINRCompact(data.coverage) }}
                      </td>
                      <td class="text-right">{{ formatINR(data.premium) }}</td>
                    </tr>
                  </tbody>
                  <tfoot>
                    <tr class="font-weight-bold">
                      <td>Total</td>
                      <td class="text-center">{{ activePolicies?.length || 0 }}</td>
                      <td class="text-right text-success">
                        {{ formatINRCompact((summary?.lifeCoverage || 0) + (summary?.healthCoverage || 0)) }}
                      </td>
                      <td class="text-right">{{ formatINR(summary?.annualPremium || 0) }}</td>
                    </tr>
                  </tfoot>
                </v-table>
              </v-card-text>
            </v-card>
          </v-col>

          <!-- Coverage Adequacy -->
          <v-col v-if="coverageAnalysis" cols="12" md="6">
            <v-card>
              <v-card-title>Life Insurance Adequacy</v-card-title>
              <v-card-text>
                <div class="d-flex justify-space-between mb-2">
                  <span>Current Coverage</span>
                  <span class="font-weight-bold">{{ formatINRCompact(coverageAnalysis.life.current) }}</span>
                </div>
                <div class="d-flex justify-space-between mb-2">
                  <span>Recommended</span>
                  <span class="font-weight-bold">{{ formatINRCompact(coverageAnalysis.life.recommended) }}</span>
                </div>
                <v-progress-linear
                  :model-value="coverageAnalysis.life.percentage"
                  :color="coverageAnalysis.life.percentage >= 70 ? 'success' : coverageAnalysis.life.percentage >= 40 ? 'warning' : 'error'"
                  height="20"
                  rounded
                >
                  <template #default>
                    <span class="text-caption font-weight-bold">{{ coverageAnalysis.life.percentage.toFixed(0) }}%</span>
                  </template>
                </v-progress-linear>
              </v-card-text>
            </v-card>
          </v-col>

          <v-col v-if="coverageAnalysis" cols="12" md="6">
            <v-card>
              <v-card-title>Health Insurance Adequacy</v-card-title>
              <v-card-text>
                <div class="d-flex justify-space-between mb-2">
                  <span>Current Coverage</span>
                  <span class="font-weight-bold">{{ formatINRCompact(coverageAnalysis.health.current) }}</span>
                </div>
                <div class="d-flex justify-space-between mb-2">
                  <span>Recommended</span>
                  <span class="font-weight-bold">{{ formatINRCompact(coverageAnalysis.health.recommended) }}</span>
                </div>
                <v-progress-linear
                  :model-value="coverageAnalysis.health.percentage"
                  :color="coverageAnalysis.health.percentage >= 70 ? 'success' : coverageAnalysis.health.percentage >= 40 ? 'warning' : 'error'"
                  height="20"
                  rounded
                >
                  <template #default>
                    <span class="text-caption font-weight-bold">{{ coverageAnalysis.health.percentage.toFixed(0) }}%</span>
                  </template>
                </v-progress-linear>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>
      </template>

      <!-- Premium Analysis Report -->
      <template v-if="selectedReport === 'premium'">
        <v-card>
          <v-card-title>
            <v-icon icon="mdi-cash" class="mr-2" />
            Premium Analysis Report
          </v-card-title>
          <v-card-text>
            <v-row class="mb-4">
              <v-col cols="12" md="4">
                <v-card variant="tonal" color="primary" class="pa-4 text-center">
                  <div class="text-h4 font-weight-bold">{{ formatINR(summary?.annualPremium || 0) }}</div>
                  <div class="text-body-2">Total Annual Premium</div>
                </v-card>
              </v-col>
              <v-col cols="12" md="4">
                <v-card variant="tonal" color="success" class="pa-4 text-center">
                  <div class="text-h4 font-weight-bold">{{ formatINR((summary?.annualPremium || 0) / 12) }}</div>
                  <div class="text-body-2">Monthly Premium</div>
                </v-card>
              </v-col>
              <v-col cols="12" md="4">
                <v-card variant="tonal" color="info" class="pa-4 text-center">
                  <div class="text-h4 font-weight-bold">{{ activePolicies?.length || 0 }}</div>
                  <div class="text-body-2">Active Policies</div>
                </v-card>
              </v-col>
            </v-row>

            <v-table>
              <thead>
                <tr>
                  <th>Policy</th>
                  <th>Type</th>
                  <th>Provider</th>
                  <th class="text-right">Premium</th>
                  <th class="text-center">Frequency</th>
                  <th class="text-right">Annual</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="policy in activePolicies" :key="policy.id">
                  <td class="font-weight-medium">{{ policy.policyName }}</td>
                  <td>
                    <v-chip :color="getInsuranceTypeColor(policy.type)" size="small" variant="tonal">
                      {{ policy.type }}
                    </v-chip>
                  </td>
                  <td>{{ policy.provider }}</td>
                  <td class="text-right">{{ formatINR(policy.premium) }}</td>
                  <td class="text-center text-capitalize">{{ policy.paymentFrequency }}</td>
                  <td class="text-right font-weight-bold">
                    {{
                      formatINR(
                        policy.premium *
                          { monthly: 12, quarterly: 4, 'half-yearly': 2, yearly: 1 }[policy.paymentFrequency]
                      )
                    }}
                  </td>
                </tr>
              </tbody>
            </v-table>
          </v-card-text>
        </v-card>
      </template>

      <!-- Tax Deductions Report -->
      <template v-if="selectedReport === 'tax'">
        <v-row>
          <v-col cols="12" md="6">
            <v-card>
              <v-card-title>
                <v-icon icon="mdi-numeric-80-box" class="mr-2" />
                Section 80C Deductions (Life Insurance)
              </v-card-title>
              <v-card-text>
                <v-alert v-if="taxDeductions.section80C.length === 0" type="info" variant="tonal">
                  No policies eligible for Section 80C deduction
                </v-alert>
                <template v-else>
                  <v-list density="compact">
                    <v-list-item v-for="policy in taxDeductions.section80C" :key="policy.id">
                      <v-list-item-title>{{ policy.policyName }}</v-list-item-title>
                      <v-list-item-subtitle>{{ policy.provider }}</v-list-item-subtitle>
                      <template #append>
                        <span class="font-weight-medium">
                          {{
                            formatINR(
                              policy.premium *
                                { monthly: 12, quarterly: 4, 'half-yearly': 2, yearly: 1 }[policy.paymentFrequency]
                            )
                          }}
                        </span>
                      </template>
                    </v-list-item>
                  </v-list>
                  <v-divider class="my-2" />
                  <div class="d-flex justify-space-between font-weight-bold">
                    <span>Total 80C</span>
                    <span class="text-success">{{ formatINR(taxDeductions.total80C) }}</span>
                  </div>
                  <div class="text-caption text-medium-emphasis mt-1">
                    Maximum limit: ₹1,50,000 under Section 80C
                  </div>
                </template>
              </v-card-text>
            </v-card>
          </v-col>

          <v-col cols="12" md="6">
            <v-card>
              <v-card-title>
                <v-icon icon="mdi-hospital-box" class="mr-2" />
                Section 80D Deductions (Health Insurance)
              </v-card-title>
              <v-card-text>
                <v-alert v-if="taxDeductions.section80D.length === 0" type="info" variant="tonal">
                  No policies eligible for Section 80D deduction
                </v-alert>
                <template v-else>
                  <v-list density="compact">
                    <v-list-item v-for="policy in taxDeductions.section80D" :key="policy.id">
                      <v-list-item-title>{{ policy.policyName }}</v-list-item-title>
                      <v-list-item-subtitle>{{ policy.provider }}</v-list-item-subtitle>
                      <template #append>
                        <span class="font-weight-medium">
                          {{
                            formatINR(
                              policy.premium *
                                { monthly: 12, quarterly: 4, 'half-yearly': 2, yearly: 1 }[policy.paymentFrequency]
                            )
                          }}
                        </span>
                      </template>
                    </v-list-item>
                  </v-list>
                  <v-divider class="my-2" />
                  <div class="d-flex justify-space-between font-weight-bold">
                    <span>Total 80D</span>
                    <span class="text-success">{{ formatINR(taxDeductions.total80D) }}</span>
                  </div>
                  <div class="text-caption text-medium-emphasis mt-1">
                    Limits: ₹25,000 (self/family), ₹50,000 (senior citizens)
                  </div>
                </template>
              </v-card-text>
            </v-card>
          </v-col>

          <v-col cols="12">
            <v-card variant="tonal" color="success">
              <v-card-text class="text-center">
                <div class="text-h5 font-weight-bold mb-1">
                  Total Tax Benefit: {{ formatINR(taxDeductions.total80C + taxDeductions.total80D) }}
                </div>
                <div class="text-body-2">
                  Combined deductions under Section 80C and 80D
                </div>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>
      </template>

      <!-- Upcoming Renewals Report -->
      <template v-if="selectedReport === 'renewals'">
        <v-card>
          <v-card-title>
            <v-icon icon="mdi-calendar-alert" class="mr-2" />
            Upcoming Renewals (Next 60 Days)
          </v-card-title>
          <v-card-text>
            <v-alert v-if="upcomingRenewals.length === 0" type="success" variant="tonal">
              <v-icon icon="mdi-check-circle" class="mr-2" />
              No policies expiring in the next 60 days
            </v-alert>

            <v-table v-else>
              <thead>
                <tr>
                  <th>Policy</th>
                  <th>Type</th>
                  <th>Provider</th>
                  <th class="text-right">Coverage</th>
                  <th class="text-center">Expiry Date</th>
                  <th class="text-center">Days Left</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="policy in upcomingRenewals" :key="policy.id">
                  <td class="font-weight-medium">{{ policy.policyName }}</td>
                  <td>
                    <v-chip :color="getInsuranceTypeColor(policy.type)" size="small" variant="tonal">
                      {{ policy.type }}
                    </v-chip>
                  </td>
                  <td>{{ policy.provider }}</td>
                  <td class="text-right">{{ formatINRCompact(policy.sumAssured) }}</td>
                  <td class="text-center">{{ formatDate(policy.endDate) }}</td>
                  <td class="text-center">
                    <v-chip
                      :color="getDaysUntil(policy.endDate) <= 15 ? 'error' : getDaysUntil(policy.endDate) <= 30 ? 'warning' : 'info'"
                      size="small"
                    >
                      {{ getDaysUntil(policy.endDate) }} days
                    </v-chip>
                  </td>
                </tr>
              </tbody>
            </v-table>
          </v-card-text>
        </v-card>
      </template>
    </template>
  </div>
</template>

<style scoped>
@media print {
  .v-btn-toggle,
  .v-btn {
    display: none !important;
  }
}
</style>
