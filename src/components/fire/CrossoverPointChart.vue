<script setup lang="ts">
import { computed } from 'vue'
import type { CrossoverPoint } from '@/composables/useFIRE'
import { formatINR } from '@/composables/useFIRE'
import { chartColors } from '@/utils/chartTheme'

const props = defineProps<{
  data: CrossoverPoint
  loading?: boolean
}>()

const progressPercent = computed(() => props.data?.currentState?.passiveIncomePercent ?? 0)

const yearsMonthsToGo = computed(() => {
  if (!props.data?.crossover?.years) return '--'
  const years = Math.floor(props.data.crossover.years)
  const months = Math.round((props.data.crossover.years - years) * 12)
  return `${years}y ${months}m`
})

const crossoverDateFormatted = computed(() => {
  if (!props.data?.crossover?.projectedDate) return '--'
  const date = new Date(props.data.crossover.projectedDate)
  return date.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })
})

// Chart dimensions
const chartWidth = 600
const chartHeight = 200
const padding = { top: 20, right: 20, bottom: 30, left: 50 }
const plotWidth = chartWidth - padding.left - padding.right
const plotHeight = chartHeight - padding.top - padding.bottom

// Sample 24 data points for the chart
const chartDataPoints = computed(() => {
  const data = props.data?.chartData
  if (!data?.length) return []
  const step = Math.max(1, Math.floor(data.length / 24))
  return data.filter((_: unknown, i: number) => i % step === 0).slice(0, 24)
})

const maxValue = computed(() => {
  if (!chartDataPoints.value.length) return 100000 // default to prevent divide by zero
  const allValues = chartDataPoints.value.flatMap((d: { expenses: number; passiveIncome: number }) => [d.expenses, d.passiveIncome])
  return Math.max(...allValues) * 1.1 || 100000
})

const expensesPath = computed(() => {
  if (chartDataPoints.value.length < 2) return ''
  const points = chartDataPoints.value.map((d: { expenses: number }, i: number) => {
    const x = padding.left + (i / (chartDataPoints.value.length - 1)) * plotWidth
    const y = padding.top + plotHeight - (d.expenses / maxValue.value) * plotHeight
    return `${x},${y}`
  })
  return `M${points.join(' L')}`
})

const incomePath = computed(() => {
  if (chartDataPoints.value.length < 2) return ''
  const points = chartDataPoints.value.map((d: { passiveIncome: number }, i: number) => {
    const x = padding.left + (i / (chartDataPoints.value.length - 1)) * plotWidth
    const y = padding.top + plotHeight - (d.passiveIncome / maxValue.value) * plotHeight
    return `${x},${y}`
  })
  return `M${points.join(' L')}`
})

// Find crossover point on chart
const crossoverPointIndex = computed(() => {
  return chartDataPoints.value.findIndex((d: { passiveIncome: number; expenses: number; isCrossover: boolean }, i: number, arr: Array<{ passiveIncome: number; expenses: number }>) => {
    if (i === 0) return false
    return arr[i - 1].passiveIncome < arr[i - 1].expenses &&
           d.passiveIncome >= d.expenses
  })
})

const crossoverX = computed(() => {
  if (crossoverPointIndex.value < 0) return null
  return padding.left + (crossoverPointIndex.value / (chartDataPoints.value.length - 1)) * plotWidth
})

const crossoverY = computed(() => {
  if (crossoverPointIndex.value < 0) return null
  const d = chartDataPoints.value[crossoverPointIndex.value]
  return padding.top + plotHeight - (d.passiveIncome / maxValue.value) * plotHeight
})
</script>

<template>
  <v-card :loading="loading">
    <v-card-title class="d-flex align-center">
      <v-icon icon="mdi-chart-timeline-variant" class="mr-2" />
      The Crossover Point
    </v-card-title>
    <v-card-text>
      <!-- Current Status -->
      <div class="d-flex justify-space-between align-center mb-4">
        <div class="text-center">
          <div class="text-body-2 text-medium-emphasis">Monthly Expenses</div>
          <div class="text-h5 font-weight-bold text-currency" :style="{ color: chartColors.incomeExpense.expense }">
            {{ formatINR(data?.currentState?.monthlyExpenses ?? 0, true) }}
          </div>
        </div>
        <div class="text-center flex-grow-1 mx-4">
          <v-progress-linear
            :model-value="progressPercent"
            height="24"
            rounded
            color="warning"
            bg-color="grey-lighten-2"
          >
            <template #default>
              <span class="text-body-2 font-weight-bold">{{ Math.round(progressPercent) }}%</span>
            </template>
          </v-progress-linear>
          <div class="text-caption text-medium-emphasis mt-1">to Crossover</div>
        </div>
        <div class="text-center">
          <div class="text-body-2 text-medium-emphasis">Investment Income</div>
          <div class="text-h5 font-weight-bold text-currency" :style="{ color: chartColors.incomeExpense.income }">
            {{ formatINR(data?.currentState?.currentPassiveIncome ?? 0, true) }}
          </div>
        </div>
      </div>

      <!-- Chart -->
      <div class="chart-container-sm">
        <svg :viewBox="`0 0 ${chartWidth} ${chartHeight}`" class="w-100">
          <!-- Grid lines -->
          <g class="grid">
            <line
              v-for="i in 4"
              :key="i"
              :x1="padding.left"
              :y1="padding.top + (i * plotHeight / 4)"
              :x2="chartWidth - padding.right"
              :y2="padding.top + (i * plotHeight / 4)"
              stroke="rgba(0,0,0,0.1)"
              stroke-dasharray="4,4"
            />
          </g>

          <!-- Crossover point marker -->
          <g v-if="crossoverX && crossoverY">
            <line
              :x1="crossoverX"
              :y1="padding.top"
              :x2="crossoverX"
              :y2="padding.top + plotHeight"
              :stroke="chartColors.incomeExpense.crossover"
              stroke-width="2"
              stroke-dasharray="6,4"
            />
            <circle
              :cx="crossoverX"
              :cy="crossoverY"
              r="6"
              :fill="chartColors.incomeExpense.crossover"
            />
          </g>

          <!-- Expense line -->
          <path
            :d="expensesPath"
            fill="none"
            :stroke="chartColors.incomeExpense.expense"
            stroke-width="2.5"
          />

          <!-- Investment income line -->
          <path
            :d="incomePath"
            fill="none"
            :stroke="chartColors.incomeExpense.income"
            stroke-width="2.5"
          />

          <!-- Legend -->
          <g :transform="`translate(${padding.left}, ${chartHeight - 10})`">
            <circle cx="0" cy="0" r="4" :fill="chartColors.incomeExpense.expense" />
            <text x="10" y="4" font-size="10" fill="currentColor">Expenses</text>
            <circle cx="100" cy="0" r="4" :fill="chartColors.incomeExpense.income" />
            <text x="110" y="4" font-size="10" fill="currentColor">Investment Income</text>
            <circle cx="230" cy="0" r="4" :fill="chartColors.incomeExpense.crossover" />
            <text x="240" y="4" font-size="10" fill="currentColor">Crossover</text>
          </g>
        </svg>
      </div>

      <!-- Crossover Info -->
      <v-row class="mt-4" dense>
        <v-col cols="6" sm="3">
          <div class="info-card pa-3 rounded text-center">
            <v-icon icon="mdi-calendar-check" size="20" color="primary" />
            <div class="text-caption text-medium-emphasis">Crossover Date</div>
            <div class="text-body-1 font-weight-bold">{{ crossoverDateFormatted }}</div>
          </div>
        </v-col>
        <v-col cols="6" sm="3">
          <div class="info-card pa-3 rounded text-center">
            <v-icon icon="mdi-timer-sand" size="20" color="warning" />
            <div class="text-caption text-medium-emphasis">Time to Go</div>
            <div class="text-body-1 font-weight-bold">{{ yearsMonthsToGo }}</div>
          </div>
        </v-col>
        <v-col cols="6" sm="3">
          <div class="info-card pa-3 rounded text-center">
            <v-icon icon="mdi-cash-minus" size="20" color="error" />
            <div class="text-caption text-medium-emphasis">Gap to Cover</div>
            <div class="text-body-1 font-weight-bold">{{ formatINR((data?.currentState?.monthlyExpenses ?? 0) - (data?.currentState?.currentPassiveIncome ?? 0), true) }}</div>
          </div>
        </v-col>
        <v-col cols="6" sm="3">
          <div class="info-card pa-3 rounded text-center">
            <v-icon icon="mdi-percent" size="20" color="success" />
            <div class="text-caption text-medium-emphasis">Coverage</div>
            <div class="text-body-1 font-weight-bold">{{ (data?.currentState?.monthlyExpenses ?? 0) > 0 ? Math.round(((data?.currentState?.currentPassiveIncome ?? 0) / (data?.currentState?.monthlyExpenses ?? 1)) * 100) : 0 }}%</div>
          </div>
        </v-col>
      </v-row>
    </v-card-text>
  </v-card>
</template>

<style scoped>
.chart-container-sm {
  min-height: 200px;
}

.info-card {
  background: rgba(var(--v-theme-surface-variant), 0.3);
}
</style>
