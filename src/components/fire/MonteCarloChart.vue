<script setup lang="ts">
import { computed } from 'vue'
import type { MonteCarloResult } from '@/composables/useFIRE'
import { formatINR } from '@/composables/useFIRE'
import { chartColors, getFireProgressColor } from '@/utils/chartTheme'

const props = defineProps<{
  data: MonteCarloResult
  loading?: boolean
}>()

const successRateColor = computed(() => {
  const rate = props.data?.successRate ?? 0
  if (rate >= 90) return 'success'
  if (rate >= 80) return 'info'
  if (rate >= 70) return 'warning'
  return 'error'
})

const confidenceZone = computed(() => {
  const rate = props.data?.successRate ?? 0
  if (rate >= 95) return { label: 'Excellent', color: 'success', description: 'Very high confidence in plan success' }
  if (rate >= 80) return { label: 'Healthy', color: 'info', description: 'Plan has good probability of success' }
  if (rate >= 70) return { label: 'Moderate', color: 'warning', description: 'Consider adjustments to improve odds' }
  return { label: 'Needs Review', color: 'error', description: 'Plan has significant risk of failure' }
})

// Chart dimensions
const chartWidth = 700
const chartHeight = 280
const padding = { top: 30, right: 30, bottom: 50, left: 70 }
const plotWidth = chartWidth - padding.left - padding.right
const plotHeight = chartHeight - padding.top - padding.bottom

const chartData = computed(() => props.data?.yearByYearPercentiles ?? [])

const maxValue = computed(() => {
  if (!chartData.value.length) return 1 // Avoid divide by zero
  return Math.max(...chartData.value.map(d => d.p90)) * 1.1 || 1
})

// Generate percentile band paths
const generatePath = (key: 'p10' | 'p25' | 'p50' | 'p75' | 'p90') => {
  if (chartData.value.length < 2) return ''
  const points = chartData.value.map((d, i) => {
    const x = padding.left + (i / (chartData.value.length - 1)) * plotWidth
    const y = padding.top + plotHeight - (d[key] / maxValue.value) * plotHeight
    return `${x},${y}`
  })
  return `M${points.join(' L')}`
}

const p90Path = computed(() => generatePath('p90'))
const p75Path = computed(() => generatePath('p75'))
const p50Path = computed(() => generatePath('p50'))
const p25Path = computed(() => generatePath('p25'))
const p10Path = computed(() => generatePath('p10'))

// Generate area between two percentiles
const generateAreaPath = (topKey: 'p10' | 'p25' | 'p50' | 'p75' | 'p90', bottomKey: 'p10' | 'p25' | 'p50' | 'p75' | 'p90') => {
  if (chartData.value.length < 2) return ''

  const topPoints = chartData.value.map((d, i) => {
    const x = padding.left + (i / (chartData.value.length - 1)) * plotWidth
    const y = padding.top + plotHeight - (d[topKey] / maxValue.value) * plotHeight
    return { x, y }
  })

  const bottomPoints = [...chartData.value].reverse().map((d, i) => {
    const x = padding.left + ((chartData.value.length - 1 - i) / (chartData.value.length - 1)) * plotWidth
    const y = padding.top + plotHeight - (d[bottomKey] / maxValue.value) * plotHeight
    return { x, y }
  })

  const allPoints = [...topPoints, ...bottomPoints]
  return `M${allPoints.map(p => `${p.x},${p.y}`).join(' L')} Z`
}

const p75to90Area = computed(() => generateAreaPath('p90', 'p75'))
const p50to75Area = computed(() => generateAreaPath('p75', 'p50'))
const p25to50Area = computed(() => generateAreaPath('p50', 'p25'))
const p10to25Area = computed(() => generateAreaPath('p25', 'p10'))

// Y-axis labels
const yAxisLabels = computed(() => {
  const max = maxValue.value
  return [0, 0.25, 0.5, 0.75, 1].map(pct => ({
    value: max * pct,
    y: padding.top + plotHeight - pct * plotHeight,
    label: formatINR(max * pct, true)
  }))
})

// X-axis labels
const xAxisLabels = computed(() => {
  const data = chartData.value
  const step = Math.max(1, Math.floor(data.length / 6))
  return data.filter((_, i) => i % step === 0 || i === data.length - 1).map((d, i, arr) => ({
    year: d.year,
    x: padding.left + (i / (arr.length - 1)) * plotWidth
  }))
})
</script>

<template>
  <v-card :loading="loading">
    <v-card-title class="d-flex align-center">
      <v-icon icon="mdi-chart-bell-curve" class="mr-2" />
      Monte Carlo Simulation
      <v-spacer />
      <v-chip v-if="data" :color="successRateColor" size="small">
        {{ (data.runsCount ?? 0).toLocaleString() }} simulations
      </v-chip>
    </v-card-title>

    <v-card-text v-if="data">
      <!-- Success Rate Gauge -->
      <div class="d-flex justify-center mb-6">
        <div class="success-gauge text-center">
          <div class="gauge-container">
            <svg width="180" height="120" viewBox="0 0 180 120">
              <!-- Background arc -->
              <path
                d="M 20 100 A 70 70 0 0 1 160 100"
                fill="none"
                stroke="rgba(0,0,0,0.1)"
                stroke-width="16"
                stroke-linecap="round"
              />
              <!-- Progress arc -->
              <path
                d="M 20 100 A 70 70 0 0 1 160 100"
                fill="none"
                :stroke="getFireProgressColor(data.successRate)"
                stroke-width="16"
                stroke-linecap="round"
                :stroke-dasharray="`${(data.successRate / 100) * 220}, 220`"
              />
            </svg>
            <div class="gauge-text">
              <div class="text-h3 font-weight-bold" :class="`text-${successRateColor}`">
                {{ data.successRate }}%
              </div>
              <div class="text-body-2 text-medium-emphasis">Success Rate</div>
            </div>
          </div>
          <v-chip :color="confidenceZone.color" class="mt-2">
            {{ confidenceZone.label }}
          </v-chip>
          <div class="text-caption text-medium-emphasis mt-1">{{ confidenceZone.description }}</div>
        </div>
      </div>

      <!-- Percentile Stats -->
      <v-row dense class="mb-4">
        <v-col cols="4" sm="2">
          <div class="stat-box pa-2 rounded text-center">
            <div class="text-caption text-medium-emphasis">10th %ile</div>
            <div class="text-body-2 font-weight-bold text-currency">{{ formatINR(data.percentile10, true) }}</div>
          </div>
        </v-col>
        <v-col cols="4" sm="2">
          <div class="stat-box pa-2 rounded text-center">
            <div class="text-caption text-medium-emphasis">25th %ile</div>
            <div class="text-body-2 font-weight-bold text-currency">{{ formatINR(data.percentile25, true) }}</div>
          </div>
        </v-col>
        <v-col cols="4" sm="2">
          <div class="stat-box pa-2 rounded text-center" style="background: rgba(var(--v-theme-primary), 0.1)">
            <div class="text-caption">Median</div>
            <div class="text-body-1 font-weight-bold text-currency text-primary">{{ formatINR(data.percentile50, true) }}</div>
          </div>
        </v-col>
        <v-col cols="4" sm="2">
          <div class="stat-box pa-2 rounded text-center">
            <div class="text-caption text-medium-emphasis">75th %ile</div>
            <div class="text-body-2 font-weight-bold text-currency">{{ formatINR(data.percentile75, true) }}</div>
          </div>
        </v-col>
        <v-col cols="4" sm="2">
          <div class="stat-box pa-2 rounded text-center">
            <div class="text-caption text-medium-emphasis">90th %ile</div>
            <div class="text-body-2 font-weight-bold text-currency">{{ formatINR(data.percentile90, true) }}</div>
          </div>
        </v-col>
        <v-col cols="4" sm="2">
          <div class="stat-box pa-2 rounded text-center">
            <div class="text-caption text-medium-emphasis">Median End</div>
            <div class="text-body-2 font-weight-bold text-currency">{{ formatINR(data.medianEndingValue, true) }}</div>
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

          <!-- Percentile bands (bottom to top) -->
          <path :d="p10to25Area" :fill="chartColors.fireProgress[0]" fill-opacity="0.15" />
          <path :d="p25to50Area" :fill="chartColors.fireProgress[25]" fill-opacity="0.2" />
          <path :d="p50to75Area" :fill="chartColors.fireProgress[75]" fill-opacity="0.2" />
          <path :d="p75to90Area" :fill="chartColors.fireProgress[100]" fill-opacity="0.15" />

          <!-- Median line -->
          <path
            :d="p50Path"
            fill="none"
            :stroke="chartColors.primary[0]"
            stroke-width="3"
          />

          <!-- Percentile boundary lines (subtle) -->
          <path :d="p90Path" fill="none" stroke="rgba(0,0,0,0.2)" stroke-width="1" stroke-dasharray="4,4" />
          <path :d="p10Path" fill="none" stroke="rgba(0,0,0,0.2)" stroke-width="1" stroke-dasharray="4,4" />

          <!-- Legend -->
          <g :transform="`translate(${chartWidth - padding.right - 140}, ${padding.top})`">
            <rect x="-5" y="-5" width="140" height="65" fill="rgba(255,255,255,0.9)" rx="4" />
            <rect x="0" y="5" width="15" height="10" :fill="chartColors.fireProgress[100]" fill-opacity="0.3" />
            <text x="20" y="13" font-size="9" fill="currentColor">75th-90th percentile</text>
            <rect x="0" y="20" width="15" height="10" :fill="chartColors.fireProgress[75]" fill-opacity="0.3" />
            <text x="20" y="28" font-size="9" fill="currentColor">50th-75th percentile</text>
            <line x1="0" y1="40" x2="15" y2="40" :stroke="chartColors.primary[0]" stroke-width="2" />
            <text x="20" y="43" font-size="9" fill="currentColor">Median (50th)</text>
          </g>
        </svg>
      </div>

      <!-- Interpretation -->
      <v-alert type="info" variant="tonal" density="compact" class="mt-4">
        <div class="text-body-2">
          Based on {{ (data.runsCount ?? 0).toLocaleString() }} market simulations, your plan has a
          <strong>{{ data.successRate ?? 0 }}%</strong> chance of not running out of money.
          The median ending portfolio value is <strong>{{ formatINR(data.medianEndingValue ?? 0, true) }}</strong>.
        </div>
      </v-alert>
    </v-card-text>
    <v-card-text v-else class="text-center text-medium-emphasis">
      <v-icon icon="mdi-chart-bell-curve-cumulative" size="48" class="mb-2" />
      <div>Monte Carlo simulation data is loading...</div>
    </v-card-text>
  </v-card>
</template>

<style scoped>
.chart-container {
  min-height: 280px;
}

.success-gauge {
  position: relative;
}

.gauge-container {
  position: relative;
  width: 180px;
  height: 120px;
}

.gauge-text {
  position: absolute;
  bottom: 10px;
  left: 50%;
  transform: translateX(-50%);
  text-align: center;
}

.stat-box {
  background: rgba(var(--v-theme-surface-variant), 0.3);
}
</style>
