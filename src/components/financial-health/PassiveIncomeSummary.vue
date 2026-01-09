<script setup lang="ts">
import { computed } from 'vue'
import { usePassiveIncomeSummary, formatINR, type PassiveIncomeSummary } from '@/composables/useFinancialHealth'

const { data: passiveIncome, isLoading, isError } = usePassiveIncomeSummary()

// Chart dimensions for trend mini-chart
const chartWidth = 300
const chartHeight = 80
const padding = { top: 10, right: 10, bottom: 20, left: 10 }

const trendChartPath = computed(() => {
  if (!passiveIncome.value?.monthlyTrend?.length) return null

  const data = passiveIncome.value.monthlyTrend
  const maxValue = Math.max(...data.map(d => d.amount))
  const minValue = Math.min(...data.map(d => d.amount))
  const range = maxValue - minValue || 1

  const xScale = (index: number) =>
    padding.left + (index / (data.length - 1)) * (chartWidth - padding.left - padding.right)

  const yScale = (value: number) =>
    padding.top + (1 - (value - minValue) / range) * (chartHeight - padding.top - padding.bottom)

  // Create smooth curve path
  const linePath = data.map((d, i) => `${i === 0 ? 'M' : 'L'} ${xScale(i)} ${yScale(d.amount)}`).join(' ')

  // Create area path
  const areaPath = `${linePath} L ${xScale(data.length - 1)} ${chartHeight - padding.bottom} L ${padding.left} ${chartHeight - padding.bottom} Z`

  return { linePath, areaPath }
})

const getSourceIcon = (type: string): string => {
  switch (type) {
    case 'rental': return 'mdi-home-city'
    case 'dividend': return 'mdi-chart-line'
    case 'interest': return 'mdi-bank'
    default: return 'mdi-cash'
  }
}

const getCoverageStatus = (coverage: number): { color: string; label: string; icon: string } => {
  if (coverage >= 100) return { color: 'success', label: 'Fully Covered', icon: 'mdi-check-circle' }
  if (coverage >= 75) return { color: 'lime', label: 'Almost There', icon: 'mdi-progress-check' }
  if (coverage >= 50) return { color: 'warning', label: 'Partial Coverage', icon: 'mdi-progress-clock' }
  if (coverage >= 25) return { color: 'orange', label: 'Building Up', icon: 'mdi-trending-up' }
  return { color: 'grey', label: 'Getting Started', icon: 'mdi-rocket-launch' }
}
</script>

<template>
  <v-card>
    <v-card-title class="d-flex align-center">
      <v-icon icon="mdi-cash-multiple" class="mr-2" />
      Passive Income Summary
      <v-spacer />
      <v-chip v-if="passiveIncome" size="small" color="success" variant="flat">
        <v-icon icon="mdi-trending-up" size="x-small" class="mr-1" />
        {{ formatINR(passiveIncome.totalMonthly, true) }}/month
      </v-chip>
    </v-card-title>

    <v-card-text>
      <!-- Loading State -->
      <div v-if="isLoading" class="text-center py-4">
        <v-progress-circular indeterminate color="primary" size="32" />
      </div>

      <!-- Error State -->
      <v-alert v-else-if="isError" type="error" variant="tonal">
        Failed to load passive income data.
      </v-alert>

      <!-- No Data State -->
      <v-alert
        v-else-if="!passiveIncome?.sources.length"
        type="info"
        variant="tonal"
      >
        <template #prepend>
          <v-icon icon="mdi-information" />
        </template>
        <div class="font-weight-medium">No passive income tracked yet</div>
        <div class="text-body-2">
          Add rental properties, dividends, or interest income to see your passive income summary.
        </div>
      </v-alert>

      <!-- Main Content -->
      <template v-else>
        <v-row>
          <!-- Left: Summary Cards -->
          <v-col cols="12" md="7">
            <!-- Total Summary -->
            <v-row class="mb-4">
              <v-col cols="6">
                <v-card variant="tonal" color="success" class="pa-3">
                  <div class="text-body-2">Monthly Passive Income</div>
                  <div class="text-h5 font-weight-bold">
                    {{ formatINR(passiveIncome.totalMonthly, true) }}
                  </div>
                </v-card>
              </v-col>
              <v-col cols="6">
                <v-card variant="tonal" color="primary" class="pa-3">
                  <div class="text-body-2">Annual Passive Income</div>
                  <div class="text-h5 font-weight-bold">
                    {{ formatINR(passiveIncome.totalAnnual, true) }}
                  </div>
                </v-card>
              </v-col>
            </v-row>

            <!-- Sources Breakdown -->
            <div class="text-body-2 text-medium-emphasis mb-2">Income Sources</div>
            <v-list density="compact" class="bg-transparent">
              <v-list-item
                v-for="source in passiveIncome.sources"
                :key="source.type"
                class="px-0"
              >
                <template #prepend>
                  <v-avatar :color="source.color" size="36" class="mr-3">
                    <v-icon :icon="getSourceIcon(source.type)" size="small" color="white" />
                  </v-avatar>
                </template>

                <v-list-item-title>{{ source.name }}</v-list-item-title>
                <v-list-item-subtitle>
                  {{ formatINR(source.monthlyAmount, true) }}/month
                </v-list-item-subtitle>

                <template #append>
                  <div class="text-right">
                    <div class="font-weight-bold">{{ formatINR(source.annualAmount, true) }}</div>
                    <div class="text-caption text-medium-emphasis">per year</div>
                  </div>
                </template>
              </v-list-item>
            </v-list>
          </v-col>

          <!-- Right: Expenses Coverage + Mini Chart -->
          <v-col cols="12" md="5">
            <!-- Expenses Coverage Card -->
            <v-card variant="outlined" class="pa-4 mb-4">
              <div class="d-flex align-center mb-2">
                <v-icon
                  :icon="getCoverageStatus(passiveIncome.expensesCoverage).icon"
                  :color="getCoverageStatus(passiveIncome.expensesCoverage).color"
                  class="mr-2"
                />
                <span class="text-body-2 font-weight-medium">Expense Coverage</span>
              </div>

              <div class="text-h4 font-weight-bold mb-2">
                {{ passiveIncome.expensesCoverage.toFixed(1) }}%
              </div>

              <v-progress-linear
                :model-value="Math.min(passiveIncome.expensesCoverage, 100)"
                :color="getCoverageStatus(passiveIncome.expensesCoverage).color"
                height="12"
                rounded
                class="mb-2"
              />

              <div class="text-caption text-medium-emphasis">
                {{ getCoverageStatus(passiveIncome.expensesCoverage).label }}
                <span v-if="passiveIncome.expensesCoverage < 100">
                  - {{ formatINR((100 - passiveIncome.expensesCoverage) / 100 * (passiveIncome.totalMonthly * 100 / passiveIncome.expensesCoverage), true) }} more needed
                </span>
              </div>
            </v-card>

            <!-- Mini Trend Chart -->
            <v-card variant="outlined" class="pa-3">
              <div class="text-body-2 text-medium-emphasis mb-2">12-Month Trend</div>
              <svg
                v-if="trendChartPath"
                :viewBox="`0 0 ${chartWidth} ${chartHeight}`"
                preserveAspectRatio="xMidYMid meet"
                class="w-100"
              >
                <!-- Area fill -->
                <path
                  :d="trendChartPath.areaPath"
                  fill="rgba(16, 185, 129, 0.15)"
                />
                <!-- Line -->
                <path
                  :d="trendChartPath.linePath"
                  fill="none"
                  stroke="rgb(16, 185, 129)"
                  stroke-width="2"
                  stroke-linecap="round"
                />
              </svg>
              <div v-else class="text-center text-caption text-medium-emphasis py-4">
                No trend data available
              </div>
            </v-card>
          </v-col>
        </v-row>

        <!-- FIRE Insight -->
        <v-alert
          v-if="passiveIncome.expensesCoverage >= 100"
          type="success"
          variant="tonal"
          class="mt-4"
        >
          <template #prepend>
            <v-icon icon="mdi-fire" />
          </template>
          <strong>Financial Independence Achieved!</strong>
          Your passive income fully covers your monthly expenses.
        </v-alert>

        <v-alert
          v-else-if="passiveIncome.expensesCoverage >= 50"
          type="info"
          variant="tonal"
          class="mt-4"
        >
          <template #prepend>
            <v-icon icon="mdi-rocket-launch" />
          </template>
          <strong>Coast FIRE Progress</strong>
          Your passive income covers {{ passiveIncome.expensesCoverage.toFixed(0) }}% of expenses.
          You're well on your way to financial independence!
        </v-alert>
      </template>
    </v-card-text>
  </v-card>
</template>
