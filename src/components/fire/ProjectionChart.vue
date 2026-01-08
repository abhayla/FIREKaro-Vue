<script setup lang="ts">
import { computed, ref } from 'vue'
import type { FIREProjection } from '@/composables/useFIRE'
import { formatINR } from '@/composables/useFIRE'
import { chartColors } from '@/utils/chartTheme'

const props = defineProps<{
  data: FIREProjection
  loading?: boolean
}>()

// Year slider
const selectedYearIndex = ref(0)

const selectedYear = computed(() => props.data.years[selectedYearIndex.value])
const selectedCorpus = computed(() => props.data.corpus[selectedYearIndex.value])
const selectedExpenses = computed(() => props.data.expenses[selectedYearIndex.value])
const selectedIncome = computed(() => props.data.investmentIncome[selectedYearIndex.value])

// Chart dimensions
const chartWidth = 800
const chartHeight = 300
const padding = { top: 30, right: 30, bottom: 50, left: 70 }
const plotWidth = chartWidth - padding.left - padding.right
const plotHeight = chartHeight - padding.top - padding.bottom

// Sample data for performance (max 50 points)
const chartData = computed(() => {
  const data = props.data
  const step = Math.max(1, Math.floor(data.years.length / 50))
  return data.years.map((year, i) => ({
    year,
    corpus: data.corpus[i],
    expenses: data.expenses[i],
    investmentIncome: data.investmentIncome[i],
    index: i
  })).filter((_, i) => i % step === 0 || i === data.years.length - 1)
})

const maxValue = computed(() => {
  return Math.max(...props.data.corpus) * 1.1
})

// Path generators
const getPath = (values: number[]) => {
  const sampledValues = values.filter((_, i) => {
    const step = Math.max(1, Math.floor(values.length / 50))
    return i % step === 0 || i === values.length - 1
  })

  const points = sampledValues.map((val, i) => {
    const x = padding.left + (i / (sampledValues.length - 1)) * plotWidth
    const y = padding.top + plotHeight - (val / maxValue.value) * plotHeight
    return `${x},${y}`
  })
  return `M${points.join(' L')}`
}

const corpusPath = computed(() => getPath(props.data.corpus))
const expensesPath = computed(() => getPath(props.data.expenses))
const incomePath = computed(() => getPath(props.data.investmentIncome))

// FIRE year marker
const fireYearX = computed(() => {
  const fireIndex = props.data.years.indexOf(props.data.fireYear)
  if (fireIndex < 0) return null
  const sampledLength = chartData.value.length
  const originalStep = Math.max(1, Math.floor(props.data.years.length / 50))
  const adjustedIndex = Math.floor(fireIndex / originalStep)
  return padding.left + (adjustedIndex / (sampledLength - 1)) * plotWidth
})

// Life event markers
const lifeEventMarkers = computed(() => {
  return props.data.lifeEvents.map(event => {
    const eventIndex = props.data.years.indexOf(event.year)
    if (eventIndex < 0) return null
    const sampledLength = chartData.value.length
    const originalStep = Math.max(1, Math.floor(props.data.years.length / 50))
    const adjustedIndex = Math.floor(eventIndex / originalStep)
    const x = padding.left + (adjustedIndex / (sampledLength - 1)) * plotWidth
    const corpus = props.data.corpus[eventIndex]
    const y = padding.top + plotHeight - (corpus / maxValue.value) * plotHeight
    return { ...event, x, y }
  }).filter(Boolean)
})

// Selected year marker position
const selectedYearX = computed(() => {
  const sampledLength = chartData.value.length
  const originalStep = Math.max(1, Math.floor(props.data.years.length / 50))
  const adjustedIndex = Math.floor(selectedYearIndex.value / originalStep)
  return padding.left + (adjustedIndex / (sampledLength - 1)) * plotWidth
})

// Y-axis labels
const yAxisLabels = computed(() => {
  const max = maxValue.value
  return [0, 0.25, 0.5, 0.75, 1].map(pct => ({
    value: max * pct,
    y: padding.top + plotHeight - pct * plotHeight,
    label: formatINR(max * pct, true)
  }))
})

// X-axis labels (every 10 years)
const xAxisLabels = computed(() => {
  const years = props.data.years
  const labels = []
  for (let i = 0; i < years.length; i += 10) {
    const sampledLength = chartData.value.length
    const originalStep = Math.max(1, Math.floor(years.length / 50))
    const adjustedIndex = Math.floor(i / originalStep)
    const x = padding.left + (adjustedIndex / (sampledLength - 1)) * plotWidth
    labels.push({ year: years[i], x })
  }
  return labels
})
</script>

<template>
  <v-card :loading="loading">
    <v-card-title class="d-flex align-center">
      <v-icon icon="mdi-chart-timeline" class="mr-2" />
      100-Year Wealth Projection
    </v-card-title>

    <v-card-text>
      <!-- Year Slider -->
      <div class="mb-4">
        <div class="d-flex justify-space-between align-center mb-2">
          <span class="text-body-2">Year: <strong>{{ selectedYear }}</strong></span>
          <span class="text-body-2">
            <span v-if="selectedYear === data.fireYear" class="text-success font-weight-bold">
              FIRE Year!
            </span>
          </span>
        </div>
        <v-slider
          v-model="selectedYearIndex"
          :min="0"
          :max="data.years.length - 1"
          :step="1"
          color="primary"
          thumb-label
          hide-details
        >
          <template #thumb-label>{{ data.years[selectedYearIndex] }}</template>
        </v-slider>
      </div>

      <!-- Stats for Selected Year -->
      <v-row dense class="mb-4">
        <v-col cols="4">
          <div class="stat-card pa-3 rounded text-center">
            <div class="text-caption text-medium-emphasis">Corpus</div>
            <div class="text-h6 font-weight-bold text-currency" :style="{ color: chartColors.primary[0] }">
              {{ formatINR(selectedCorpus, true) }}
            </div>
          </div>
        </v-col>
        <v-col cols="4">
          <div class="stat-card pa-3 rounded text-center">
            <div class="text-caption text-medium-emphasis">Investment Income</div>
            <div class="text-h6 font-weight-bold text-currency" :style="{ color: chartColors.incomeExpense.income }">
              {{ formatINR(selectedIncome, true) }}
            </div>
          </div>
        </v-col>
        <v-col cols="4">
          <div class="stat-card pa-3 rounded text-center">
            <div class="text-caption text-medium-emphasis">Expenses</div>
            <div class="text-h6 font-weight-bold text-currency" :style="{ color: chartColors.incomeExpense.expense }">
              {{ formatINR(selectedExpenses, true) }}
            </div>
          </div>
        </v-col>
      </v-row>

      <!-- Chart -->
      <div class="chart-container">
        <svg :viewBox="`0 0 ${chartWidth} ${chartHeight}`" class="w-100">
          <!-- Grid lines -->
          <g class="grid">
            <line
              v-for="label in yAxisLabels"
              :key="label.value"
              :x1="padding.left"
              :y1="label.y"
              :x2="chartWidth - padding.right"
              :y2="label.y"
              stroke="rgba(0,0,0,0.08)"
            />
          </g>

          <!-- Y-axis labels -->
          <g class="y-axis">
            <text
              v-for="label in yAxisLabels"
              :key="label.value"
              :x="padding.left - 10"
              :y="label.y + 4"
              text-anchor="end"
              font-size="10"
              fill="currentColor"
              opacity="0.7"
            >
              {{ label.label }}
            </text>
          </g>

          <!-- X-axis labels -->
          <g class="x-axis">
            <text
              v-for="label in xAxisLabels"
              :key="label.year"
              :x="label.x"
              :y="chartHeight - 10"
              text-anchor="middle"
              font-size="10"
              fill="currentColor"
              opacity="0.7"
            >
              {{ label.year }}
            </text>
          </g>

          <!-- FIRE year marker -->
          <g v-if="fireYearX">
            <line
              :x1="fireYearX"
              :y1="padding.top"
              :x2="fireYearX"
              :y2="padding.top + plotHeight"
              stroke="#4caf50"
              stroke-width="2"
              stroke-dasharray="6,4"
            />
            <text
              :x="fireYearX"
              :y="padding.top - 8"
              text-anchor="middle"
              font-size="11"
              fill="#4caf50"
              font-weight="bold"
            >
              FIRE {{ data.fireYear }}
            </text>
          </g>

          <!-- Selected year indicator -->
          <line
            :x1="selectedYearX"
            :y1="padding.top"
            :x2="selectedYearX"
            :y2="padding.top + plotHeight"
            stroke="rgba(0,0,0,0.3)"
            stroke-width="1"
          />

          <!-- Corpus area fill -->
          <path
            :d="corpusPath + ` L${chartWidth - padding.right},${padding.top + plotHeight} L${padding.left},${padding.top + plotHeight} Z`"
            :fill="chartColors.primary[0]"
            fill-opacity="0.1"
          />

          <!-- Lines -->
          <path
            :d="corpusPath"
            fill="none"
            :stroke="chartColors.primary[0]"
            stroke-width="2.5"
          />
          <path
            :d="incomePath"
            fill="none"
            :stroke="chartColors.incomeExpense.income"
            stroke-width="2"
          />
          <path
            :d="expensesPath"
            fill="none"
            :stroke="chartColors.incomeExpense.expense"
            stroke-width="2"
            stroke-dasharray="6,4"
          />

          <!-- Life event markers -->
          <g v-for="event in lifeEventMarkers" :key="event?.id">
            <circle
              v-if="event"
              :cx="event.x"
              :cy="event.y"
              r="6"
              :fill="event.category === 'financial' ? '#9c27b0' : '#ffc107'"
              stroke="white"
              stroke-width="2"
            />
          </g>

          <!-- Legend -->
          <g :transform="`translate(${padding.left + 20}, ${padding.top + 15})`">
            <rect x="-5" y="-12" width="220" height="50" fill="rgba(255,255,255,0.9)" rx="4" />
            <line x1="0" y1="0" x2="20" y2="0" :stroke="chartColors.primary[0]" stroke-width="2" />
            <text x="25" y="4" font-size="10" fill="currentColor">Corpus</text>
            <line x1="80" y1="0" x2="100" y2="0" :stroke="chartColors.incomeExpense.income" stroke-width="2" />
            <text x="105" y="4" font-size="10" fill="currentColor">Inv. Income</text>
            <line x1="0" y1="20" x2="20" y2="20" :stroke="chartColors.incomeExpense.expense" stroke-width="2" stroke-dasharray="4,2" />
            <text x="25" y="24" font-size="10" fill="currentColor">Expenses</text>
          </g>
        </svg>
      </div>

      <!-- Life Events List -->
      <div v-if="data.lifeEvents.length > 0" class="mt-4">
        <div class="text-subtitle-2 mb-2">Life Events</div>
        <v-chip-group>
          <v-chip
            v-for="event in data.lifeEvents"
            :key="event.id"
            size="small"
            :color="event.category === 'financial' ? 'purple' : 'amber'"
            variant="tonal"
          >
            <v-icon :icon="event.icon" start size="14" />
            {{ event.name }} ({{ event.year }})
          </v-chip>
        </v-chip-group>
      </div>
    </v-card-text>
  </v-card>
</template>

<style scoped>
.chart-container {
  min-height: 300px;
}

.stat-card {
  background: rgba(var(--v-theme-surface-variant), 0.3);
}
</style>
