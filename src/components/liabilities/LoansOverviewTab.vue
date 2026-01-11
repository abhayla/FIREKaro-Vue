<script setup lang="ts">
import { computed } from 'vue'
import {
  useLoans,
  formatINR,
  formatINRCompact,
  getLoanTypeLabel,
  getLoanTypeIcon,
  getLoanTypeColor,
  type Loan,
  type LoanType
} from '@/composables/useLiabilities'

// Emits
const emit = defineEmits<{
  'go-to-details': []
}>()

// Data fetching
const { data: loans, isLoading } = useLoans()

// Use API data directly - ensure it's always an array
const loansList = computed(() => {
  const data = loans.value
  return Array.isArray(data) ? data : []
})

// Summary calculations
const summary = computed(() => {
  const totalOutstanding = loansList.value.reduce((sum, l) => sum + (l.outstandingAmount ?? 0), 0)
  const totalEmi = loansList.value.reduce((sum, l) => sum + (l.emiAmount ?? 0), 0)
  const loanCount = loansList.value.length
  const activeLoans = loansList.value.filter(l => l.status === 'ACTIVE')
  const activeCount = activeLoans.length

  // Average interest rate (weighted by outstanding amount)
  const totalWeightedRate = loansList.value.reduce((sum, l) => {
    return sum + (l.interestRate ?? 0) * (l.outstandingAmount ?? 0)
  }, 0)
  const avgInterestRate = totalOutstanding > 0
    ? (totalWeightedRate / totalOutstanding).toFixed(2)
    : '0.00'

  return {
    totalOutstanding,
    totalEmi,
    loanCount,
    activeCount,
    avgInterestRate
  }
})

// Loan distribution by type
const loanDistribution = computed(() => {
  const distribution = new Map<LoanType, { amount: number; count: number }>()

  loansList.value.forEach(loan => {
    const current = distribution.get(loan.loanType) || { amount: 0, count: 0 }
    distribution.set(loan.loanType, {
      amount: current.amount + (loan.outstandingAmount ?? 0),
      count: current.count + 1
    })
  })

  const total = summary.value.totalOutstanding

  return Array.from(distribution.entries())
    .map(([type, data]) => ({
      type,
      label: getLoanTypeLabel(type),
      icon: getLoanTypeIcon(type),
      color: getLoanTypeColor(type),
      amount: data.amount,
      count: data.count,
      percentage: total > 0 ? Math.round((data.amount / total) * 100) : 0
    }))
    .sort((a, b) => b.amount - a.amount)
})

// Upcoming EMI payments (next 5, sorted by due date)
const upcomingEmis = computed(() => {
  return loansList.value
    .filter(l => l.status === 'ACTIVE' && l.nextEmiDate)
    .map(loan => {
      const dueDate = new Date(loan.nextEmiDate!)
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      dueDate.setHours(0, 0, 0, 0)
      const daysUntilDue = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

      return {
        ...loan,
        dueDate,
        daysUntilDue,
        isOverdue: daysUntilDue < 0,
        isUrgent: daysUntilDue >= 0 && daysUntilDue <= 5
      }
    })
    .sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime())
    .slice(0, 5)
})

// Condensed loan list (for quick overview)
const condensedLoans = computed(() => {
  return loansList.value
    .filter(l => l.status === 'ACTIVE')
    .map(loan => {
      const principal = loan.principalAmount ?? 0
      const outstanding = loan.outstandingAmount ?? 0
      const progress = principal > 0 ? Math.round(((principal - outstanding) / principal) * 100) : 0

      return {
        ...loan,
        progress
      }
    })
    .sort((a, b) => (b.outstandingAmount ?? 0) - (a.outstandingAmount ?? 0))
    .slice(0, 5)
})

// Format date
const formatDate = (date: Date) => {
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
}
</script>

<template>
  <div>
    <!-- Loading State -->
    <template v-if="isLoading">
      <v-row class="mb-6">
        <v-col v-for="n in 4" :key="n" cols="12" sm="6" md="3">
          <v-skeleton-loader type="card" height="100" />
        </v-col>
      </v-row>
      <v-skeleton-loader type="card" height="200" />
    </template>

    <template v-else>
      <!-- Summary Metric Cards -->
      <v-row class="mb-6">
        <v-col cols="12" sm="6" md="3">
          <v-card class="pa-4">
            <div class="d-flex align-center mb-2">
              <v-icon icon="mdi-bank" color="error" size="24" class="mr-2" />
              <span class="text-body-2">Total Outstanding</span>
            </div>
            <div class="text-h5 font-weight-bold">{{ formatINRCompact(summary.totalOutstanding) }}</div>
            <div class="text-caption text-medium-emphasis">{{ summary.activeCount }} active loans</div>
          </v-card>
        </v-col>
        <v-col cols="12" sm="6" md="3">
          <v-card class="pa-4">
            <div class="d-flex align-center mb-2">
              <v-icon icon="mdi-calendar-month" color="primary" size="24" class="mr-2" />
              <span class="text-body-2">Total Monthly EMI</span>
            </div>
            <div class="text-h5 font-weight-bold">{{ formatINR(summary.totalEmi) }}</div>
          </v-card>
        </v-col>
        <v-col cols="12" sm="6" md="3">
          <v-card class="pa-4">
            <div class="d-flex align-center mb-2">
              <v-icon icon="mdi-counter" color="info" size="24" class="mr-2" />
              <span class="text-body-2">Total Loans</span>
            </div>
            <div class="text-h5 font-weight-bold">{{ summary.loanCount }}</div>
          </v-card>
        </v-col>
        <v-col cols="12" sm="6" md="3">
          <v-card class="pa-4">
            <div class="d-flex align-center mb-2">
              <v-icon icon="mdi-percent" color="warning" size="24" class="mr-2" />
              <span class="text-body-2">Avg Interest Rate</span>
            </div>
            <div class="text-h5 font-weight-bold">{{ summary.avgInterestRate }}%</div>
            <div class="text-caption text-medium-emphasis">Weighted average</div>
          </v-card>
        </v-col>
      </v-row>

      <v-row>
        <!-- Left Column: Distribution & Upcoming EMIs -->
        <v-col cols="12" md="6">
          <!-- Loan Distribution by Type -->
          <v-card variant="outlined" class="mb-6">
            <v-card-title class="text-subtitle-1">
              <v-icon icon="mdi-chart-pie" class="mr-2" />
              Debt Distribution by Type
            </v-card-title>
            <v-card-text>
              <div v-if="loanDistribution.length === 0" class="text-center py-4 text-medium-emphasis">
                No loans to display
              </div>
              <div v-else class="d-flex flex-column gap-3">
                <div v-for="item in loanDistribution" :key="item.type">
                  <div class="d-flex justify-space-between align-center mb-1">
                    <div class="d-flex align-center">
                      <v-icon :icon="item.icon" :color="item.color" size="18" class="mr-2" />
                      <span class="text-body-2">{{ item.label }}</span>
                      <v-chip size="x-small" variant="tonal" class="ml-2">{{ item.count }}</v-chip>
                    </div>
                    <span class="text-body-2 font-weight-medium">{{ formatINRCompact(item.amount) }}</span>
                  </div>
                  <v-progress-linear
                    :model-value="item.percentage"
                    :color="item.color"
                    height="8"
                    rounded
                  />
                </div>
              </div>
            </v-card-text>
          </v-card>

          <!-- Upcoming EMI Payments -->
          <v-card variant="outlined">
            <v-card-title class="text-subtitle-1 d-flex align-center">
              <v-icon icon="mdi-calendar-clock" class="mr-2" />
              Upcoming EMI Payments
              <v-spacer />
              <v-chip v-if="upcomingEmis.length > 0" size="small" variant="tonal">
                Next {{ upcomingEmis.length }}
              </v-chip>
            </v-card-title>
            <v-card-text>
              <div v-if="upcomingEmis.length === 0" class="text-center py-4 text-medium-emphasis">
                No upcoming EMI payments
              </div>
              <v-list v-else density="compact" class="py-0">
                <v-list-item
                  v-for="loan in upcomingEmis"
                  :key="loan.id"
                  class="px-0"
                >
                  <template #prepend>
                    <v-avatar size="36" :color="getLoanTypeColor(loan.loanType)" variant="tonal">
                      <v-icon :icon="getLoanTypeIcon(loan.loanType)" size="18" />
                    </v-avatar>
                  </template>
                  <v-list-item-title class="text-body-2">
                    {{ loan.loanName }}
                  </v-list-item-title>
                  <v-list-item-subtitle class="text-caption">
                    {{ loan.lender }}
                  </v-list-item-subtitle>
                  <template #append>
                    <div class="text-right">
                      <div class="text-body-2 font-weight-medium">{{ formatINR(loan.emiAmount) }}</div>
                      <v-chip
                        :color="loan.isOverdue ? 'error' : loan.isUrgent ? 'warning' : 'default'"
                        size="x-small"
                        variant="tonal"
                      >
                        <template v-if="loan.isOverdue">
                          {{ Math.abs(loan.daysUntilDue) }}d overdue
                        </template>
                        <template v-else-if="loan.daysUntilDue === 0">
                          Today
                        </template>
                        <template v-else>
                          {{ formatDate(loan.dueDate) }}
                        </template>
                      </v-chip>
                    </div>
                  </template>
                </v-list-item>
              </v-list>
            </v-card-text>
          </v-card>
        </v-col>

        <!-- Right Column: Condensed List & Tax Benefits -->
        <v-col cols="12" md="6">
          <!-- Condensed Loan List -->
          <v-card variant="outlined" class="mb-6">
            <v-card-title class="text-subtitle-1 d-flex align-center">
              <v-icon icon="mdi-format-list-bulleted" class="mr-2" />
              Your Loans
              <v-spacer />
              <v-btn
                variant="text"
                size="small"
                color="primary"
                append-icon="mdi-arrow-right"
                @click="emit('go-to-details')"
              >
                View All
              </v-btn>
            </v-card-title>
            <v-card-text>
              <div v-if="condensedLoans.length === 0" class="text-center py-4">
                <v-icon icon="mdi-bank-off" size="48" color="grey" class="mb-2" />
                <div class="text-body-2 text-medium-emphasis mb-3">No active loans</div>
                <v-btn
                  color="primary"
                  variant="tonal"
                  size="small"
                  prepend-icon="mdi-plus"
                  @click="emit('go-to-details')"
                >
                  Add Your First Loan
                </v-btn>
              </div>
              <div v-else class="d-flex flex-column gap-3">
                <v-card
                  v-for="loan in condensedLoans"
                  :key="loan.id"
                  variant="tonal"
                  class="pa-3"
                >
                  <div class="d-flex align-center mb-2">
                    <v-avatar size="32" :color="getLoanTypeColor(loan.loanType)" variant="tonal" class="mr-2">
                      <v-icon :icon="getLoanTypeIcon(loan.loanType)" size="16" />
                    </v-avatar>
                    <div class="flex-grow-1">
                      <div class="text-body-2 font-weight-medium">{{ loan.loanName }}</div>
                      <div class="text-caption text-medium-emphasis">{{ loan.lender }}</div>
                    </div>
                    <div class="text-right">
                      <div class="text-body-2 font-weight-bold">{{ formatINRCompact(loan.outstandingAmount) }}</div>
                      <div class="text-caption text-medium-emphasis">EMI: {{ formatINR(loan.emiAmount) }}</div>
                    </div>
                  </div>
                  <div class="d-flex align-center">
                    <v-progress-linear
                      :model-value="loan.progress"
                      color="success"
                      height="6"
                      rounded
                      class="flex-grow-1"
                    />
                    <span class="text-caption text-medium-emphasis ml-2">{{ loan.progress }}% paid</span>
                  </div>
                </v-card>
              </div>
            </v-card-text>
          </v-card>

          <!-- Tax Benefits Info -->
          <v-card variant="outlined">
            <v-card-title class="text-subtitle-1">
              <v-icon icon="mdi-information" class="mr-2" />
              Loan Tax Benefits
            </v-card-title>
            <v-card-text class="pt-0">
              <v-row dense>
                <v-col cols="12">
                  <v-alert color="blue" variant="tonal" density="compact">
                    <div class="text-subtitle-2 font-weight-bold">Home Loan - Section 80C</div>
                    <div class="text-body-2 mt-1">
                      Principal repayment up to Rs. 1.5L per year
                    </div>
                  </v-alert>
                </v-col>
                <v-col cols="12">
                  <v-alert color="success" variant="tonal" density="compact">
                    <div class="text-subtitle-2 font-weight-bold">Home Loan - Section 24(b)</div>
                    <div class="text-body-2 mt-1">
                      Interest up to Rs. 2L for self-occupied property
                    </div>
                  </v-alert>
                </v-col>
                <v-col cols="12">
                  <v-alert color="teal" variant="tonal" density="compact">
                    <div class="text-subtitle-2 font-weight-bold">Education Loan - Section 80E</div>
                    <div class="text-body-2 mt-1">
                      Entire interest deductible for 8 years
                    </div>
                  </v-alert>
                </v-col>
              </v-row>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </template>
  </div>
</template>
