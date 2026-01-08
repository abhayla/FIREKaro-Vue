<script setup lang="ts">
import { computed } from 'vue'
import { Line } from 'vue-chartjs'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  type ChartOptions
} from 'chart.js'
import {
  chartColors,
  lineChartOptions,
  formatINRForChart,
  createDataset
} from '@/utils/chartTheme'
import { formatINRCompact } from '@/composables/useInvestments'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
)

export interface ReturnDataPoint {
  date: string
  value: number
  invested?: number
}

const props = withDefaults(
  defineProps<{
    data: ReturnDataPoint[]
    title?: string
    showInvested?: boolean
    height?: number
    showLabels?: boolean
  }>(),
  {
    title: 'Portfolio Value Over Time',
    showInvested: true,
    height: 300,
    showLabels: true
  }
)

const chartData = computed(() => {
  const labels = props.data.map(d => d.date)
  const values = props.data.map(d => d.value)
  const invested = props.data.map(d => d.invested || 0)

  const datasets = [
    {
      label: 'Current Value',
      data: values,
      borderColor: chartColors.primary[0],
      backgroundColor: `${chartColors.primary[0]}20`,
      fill: true,
      tension: 0.3,
      borderWidth: 2,
      pointRadius: props.showLabels ? 3 : 0,
      pointHoverRadius: 5
    }
  ]

  if (props.showInvested && invested.some(v => v > 0)) {
    datasets.push({
      label: 'Invested Amount',
      data: invested,
      borderColor: chartColors.primary[3],
      backgroundColor: 'transparent',
      fill: false,
      tension: 0,
      borderWidth: 2,
      borderDash: [5, 5],
      pointRadius: 0,
      pointHoverRadius: 4
    } as typeof datasets[0])
  }

  return {
    labels,
    datasets
  }
})

const chartOptions = computed<ChartOptions<'line'>>(() => ({
  ...lineChartOptions,
  plugins: {
    ...lineChartOptions.plugins,
    legend: {
      display: props.showInvested,
      position: 'top',
      align: 'end',
      labels: {
        font: {
          family: "'Inter', sans-serif",
          size: 12,
          weight: 500
        },
        usePointStyle: true,
        pointStyle: 'line',
        padding: 16
      }
    },
    tooltip: {
      ...lineChartOptions.plugins?.tooltip,
      mode: 'index',
      intersect: false,
      callbacks: {
        label: (context) => {
          const label = context.dataset.label || ''
          const value = context.parsed.y ?? 0
          return `${label}: ${formatINRForChart(value)}`
        }
      }
    }
  },
  scales: {
    ...lineChartOptions.scales,
    y: {
      ...lineChartOptions.scales?.y,
      ticks: {
        ...lineChartOptions.scales?.y?.ticks,
        callback: (value) => formatINRCompact(Number(value))
      }
    }
  },
  interaction: {
    mode: 'nearest',
    axis: 'x',
    intersect: false
  }
}))

// Calculate returns summary
const summary = computed(() => {
  if (props.data.length < 2) return null

  const firstValue = props.data[0]
  const lastValue = props.data[props.data.length - 1]
  const invested = lastValue.invested || firstValue.value
  const currentValue = lastValue.value

  const absoluteReturn = currentValue - invested
  const percentageReturn = invested > 0 ? ((currentValue - invested) / invested) * 100 : 0

  // Calculate CAGR if we have dates
  const startDate = new Date(firstValue.date)
  const endDate = new Date(lastValue.date)
  const years = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 365)
  const cagr = years > 0 && invested > 0
    ? (Math.pow(currentValue / invested, 1 / years) - 1) * 100
    : 0

  return {
    absoluteReturn,
    percentageReturn,
    cagr,
    currentValue,
    invested
  }
})
</script>

<template>
  <v-card variant="outlined">
    <v-card-title class="d-flex align-center">
      <v-icon icon="mdi-chart-line" class="mr-2" color="primary" />
      {{ title }}
    </v-card-title>

    <v-card-text>
      <!-- Summary Cards -->
      <v-row v-if="summary" class="mb-4">
        <v-col cols="6" sm="3">
          <div class="text-caption text-medium-emphasis">Current Value</div>
          <div class="text-subtitle-1 font-weight-bold text-currency">
            {{ formatINRCompact(summary.currentValue) }}
          </div>
        </v-col>
        <v-col cols="6" sm="3">
          <div class="text-caption text-medium-emphasis">Invested</div>
          <div class="text-subtitle-1 font-weight-medium text-currency">
            {{ formatINRCompact(summary.invested) }}
          </div>
        </v-col>
        <v-col cols="6" sm="3">
          <div class="text-caption text-medium-emphasis">Returns</div>
          <div
            class="text-subtitle-1 font-weight-bold"
            :class="summary.absoluteReturn >= 0 ? 'text-positive' : 'text-negative'"
          >
            {{ summary.absoluteReturn >= 0 ? '+' : '' }}{{ formatINRCompact(summary.absoluteReturn) }}
            <span class="text-caption">
              ({{ summary.percentageReturn >= 0 ? '+' : '' }}{{ summary.percentageReturn.toFixed(1) }}%)
            </span>
          </div>
        </v-col>
        <v-col cols="6" sm="3">
          <div class="text-caption text-medium-emphasis">CAGR</div>
          <div
            class="text-subtitle-1 font-weight-bold"
            :class="summary.cagr >= 0 ? 'text-positive' : 'text-negative'"
          >
            {{ summary.cagr >= 0 ? '+' : '' }}{{ summary.cagr.toFixed(1) }}%
          </div>
        </v-col>
      </v-row>

      <!-- Chart -->
      <div class="chart-container" :style="{ height: `${height}px` }">
        <Line :data="chartData" :options="chartOptions" />
      </div>
    </v-card-text>
  </v-card>
</template>

<style scoped>
.chart-container {
  position: relative;
  width: 100%;
}
</style>
