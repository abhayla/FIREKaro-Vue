<script setup lang="ts">
import { ref, computed } from 'vue'
import SectionHeader from '@/components/shared/SectionHeader.vue'
import FamilyToggle from '@/components/shared/FamilyToggle.vue'
import CashFlowSummary from '@/components/financial-health/CashFlowSummary.vue'
import PassiveIncomeSummary from '@/components/financial-health/PassiveIncomeSummary.vue'
import { useCashFlow, formatINR } from '@/composables/useFinancialHealth'

const tabs = [
  { title: 'Health Score', route: '/dashboard/financial-health' },
  { title: 'Net Worth', route: '/dashboard/financial-health/net-worth' },
  { title: 'Cash Flow', route: '/dashboard/financial-health/cash-flow' },
  { title: 'Banking', route: '/dashboard/financial-health/banking' },
  { title: 'Emergency Fund', route: '/dashboard/financial-health/emergency-fund' },
  { title: 'Reports', route: '/dashboard/financial-health/reports' },
]

const selectedMonth = ref<string | undefined>()

const monthOptions = computed(() => {
  const months = []
  const now = new Date()
  for (let i = 0; i < 12; i++) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
    months.push({
      title: date.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' }),
      value: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    })
  }
  return months
})

const { data: cashFlow, isLoading, isError } = useCashFlow(selectedMonth)

// Chart data for trend visualization
const chartData = computed(() => {
  if (!cashFlow.value?.monthlyTrend) return null
  return cashFlow.value.monthlyTrend
})

// SVG chart dimensions
const chartWidth = 600
const chartHeight = 200
const padding = { top: 20, right: 20, bottom: 40, left: 60 }

const chartPaths = computed(() => {
  if (!chartData.value || chartData.value.length === 0) return null

  const data = chartData.value
  const maxValue = Math.max(...data.map(d => Math.max(d.income, d.expenses)))
  const minValue = 0

  const xScale = (index: number) =>
    padding.left + (index / (data.length - 1)) * (chartWidth - padding.left - padding.right)

  const yScale = (value: number) =>
    padding.top + (1 - (value - minValue) / (maxValue - minValue)) * (chartHeight - padding.top - padding.bottom)

  const incomePath = data.map((d, i) => `${i === 0 ? 'M' : 'L'} ${xScale(i)} ${yScale(d.income)}`).join(' ')
  const expensePath = data.map((d, i) => `${i === 0 ? 'M' : 'L'} ${xScale(i)} ${yScale(d.expenses)}`).join(' ')
  const savingsPath = data.map((d, i) => `${i === 0 ? 'M' : 'L'} ${xScale(i)} ${yScale(d.savings)}`).join(' ')

  const yTicks = []
  for (let i = 0; i <= 4; i++) {
    const value = minValue + (maxValue - minValue) * (i / 4)
    yTicks.push({ value, y: yScale(value), label: formatINR(value, true) })
  }

  const xLabels = data.map((d, i) => ({
    x: xScale(i),
    label: d.month
  }))

  return { incomePath, expensePath, savingsPath, yTicks, xLabels }
})
</script>

<template>
  <div>
    <SectionHeader
      title="Financial Health"
      subtitle="Track your monthly income, expenses, and savings"
      icon="mdi-heart-pulse"
      :tabs="tabs"
    />
    <FamilyToggle class="mb-6" />

    <!-- Month Selector -->
    <div class="d-flex justify-end mb-4">
      <v-select
        v-model="selectedMonth"
        :items="monthOptions"
        item-title="title"
        item-value="value"
        label="Select Month"
        variant="outlined"
        density="comfortable"
        style="max-width: 250px"
        clearable
        placeholder="Current Month"
      />
    </div>

    <!-- Loading State -->
    <div v-if="isLoading" class="text-center py-8">
      <v-progress-circular indeterminate color="primary" size="48" />
      <p class="text-body-2 text-medium-emphasis mt-4">Loading cash flow data...</p>
    </div>

    <!-- Error State -->
    <v-alert v-else-if="isError" type="error" variant="tonal" class="mb-6">
      <v-icon icon="mdi-alert-circle" class="mr-2" />
      Failed to load cash flow data. Please try again later.
    </v-alert>

    <!-- Main Content -->
    <template v-else-if="cashFlow">
      <!-- Cash Flow Summary -->
      <CashFlowSummary :data="cashFlow" class="mb-6" />

      <!-- Passive Income Summary -->
      <PassiveIncomeSummary class="mb-6" />

      <!-- Cash Flow Trend Chart -->
      <v-card class="mb-6">
        <v-card-title class="d-flex align-center">
          <v-icon icon="mdi-chart-timeline-variant" class="mr-2" />
          Monthly Cash Flow Trend
        </v-card-title>
        <v-card-text>
          <div v-if="chartPaths" class="trend-chart">
            <svg :viewBox="`0 0 ${chartWidth} ${chartHeight}`" preserveAspectRatio="xMidYMid meet" class="w-100">
              <!-- Grid lines -->
              <line
                v-for="tick in chartPaths.yTicks"
                :key="tick.value"
                :x1="padding.left"
                :x2="chartWidth - padding.right"
                :y1="tick.y"
                :y2="tick.y"
                stroke="currentColor"
                stroke-opacity="0.1"
              />

              <!-- Income line -->
              <path
                :d="chartPaths.incomePath"
                fill="none"
                stroke="rgb(var(--v-theme-success))"
                stroke-width="3"
                stroke-linecap="round"
              />

              <!-- Expense line -->
              <path
                :d="chartPaths.expensePath"
                fill="none"
                stroke="rgb(var(--v-theme-error))"
                stroke-width="3"
                stroke-linecap="round"
              />

              <!-- Savings line -->
              <path
                :d="chartPaths.savingsPath"
                fill="none"
                stroke="rgb(var(--v-theme-primary))"
                stroke-width="3"
                stroke-linecap="round"
                stroke-dasharray="6,3"
              />

              <!-- Y-axis labels -->
              <text
                v-for="tick in chartPaths.yTicks"
                :key="`y-${tick.value}`"
                :x="padding.left - 8"
                :y="tick.y"
                text-anchor="end"
                dominant-baseline="middle"
                class="chart-label"
              >
                {{ tick.label }}
              </text>

              <!-- X-axis labels -->
              <text
                v-for="(label, i) in chartPaths.xLabels"
                :key="`x-${i}`"
                :x="label.x"
                :y="chartHeight - 10"
                text-anchor="middle"
                class="chart-label"
              >
                {{ label.label }}
              </text>
            </svg>

            <!-- Legend -->
            <div class="d-flex justify-center ga-4 mt-3">
              <div class="d-flex align-center">
                <div class="legend-line bg-success mr-2" />
                <span class="text-caption">Income</span>
              </div>
              <div class="d-flex align-center">
                <div class="legend-line bg-error mr-2" />
                <span class="text-caption">Expenses</span>
              </div>
              <div class="d-flex align-center">
                <div class="legend-line legend-dashed mr-2" />
                <span class="text-caption">Savings</span>
              </div>
            </div>
          </div>

          <v-alert v-else type="info" variant="tonal">
            No trend data available yet. Add more months of data to see trends.
          </v-alert>
        </v-card-text>
      </v-card>

      <!-- Tips -->
      <v-card>
        <v-card-title class="d-flex align-center">
          <v-icon icon="mdi-lightbulb-outline" class="mr-2" />
          Cash Flow Tips
        </v-card-title>
        <v-card-text>
          <v-list density="compact">
            <v-list-item prepend-icon="mdi-check-circle" class="text-success">
              <v-list-item-title>Track all income sources for complete visibility</v-list-item-title>
            </v-list-item>
            <v-list-item prepend-icon="mdi-check-circle" class="text-success">
              <v-list-item-title>Categorize expenses to identify spending patterns</v-list-item-title>
            </v-list-item>
            <v-list-item prepend-icon="mdi-target" class="text-primary">
              <v-list-item-title>Aim for a savings rate of at least 20-30%</v-list-item-title>
            </v-list-item>
            <v-list-item prepend-icon="mdi-alert" class="text-warning">
              <v-list-item-title>Review and reduce discretionary spending regularly</v-list-item-title>
            </v-list-item>
          </v-list>
        </v-card-text>
      </v-card>
    </template>
  </div>
</template>

<style scoped>
.chart-label {
  font-size: 11px;
  fill: rgba(var(--v-theme-on-surface), 0.6);
}

.legend-line {
  width: 24px;
  height: 3px;
  border-radius: 2px;
}

.legend-dashed {
  background: rgb(var(--v-theme-primary));
  background: repeating-linear-gradient(
    90deg,
    rgb(var(--v-theme-primary)),
    rgb(var(--v-theme-primary)) 6px,
    transparent 6px,
    transparent 9px
  );
}
</style>
