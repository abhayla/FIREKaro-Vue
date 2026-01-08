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
  type ChartData,
} from 'chart.js'
import { chartColors, formatINRForChart } from '@/utils/chartTheme'
import { formatINR } from '@/composables/useExpenses'

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

interface MonthlyData {
  month: string
  total: number
  needs?: number
  wants?: number
  savings?: number
}

const props = defineProps<{
  data: MonthlyData[]
  title?: string
  showBreakdown?: boolean
}>()

// Chart data using theme colors
const chartData = computed<ChartData<'line'>>(() => {
  const labels = props.data.map((d) => d.month)

  const datasets: ChartData<'line'>['datasets'] = [
    {
      label: 'Total',
      data: props.data.map((d) => d.total),
      borderColor: chartColors.primary[0],
      backgroundColor: `${chartColors.primary[0]}1A`,
      tension: 0.3,
      fill: true,
      pointRadius: 4,
      pointHoverRadius: 6,
    },
  ]

  if (props.showBreakdown) {
    datasets.push(
      {
        label: 'Needs',
        data: props.data.map((d) => d.needs ?? 0),
        borderColor: chartColors.incomeExpense.savings,
        backgroundColor: 'transparent',
        tension: 0.3,
        pointRadius: 3,
        borderDash: [5, 5],
      },
      {
        label: 'Wants',
        data: props.data.map((d) => d.wants ?? 0),
        borderColor: chartColors.primary[4], // Purple
        backgroundColor: 'transparent',
        tension: 0.3,
        pointRadius: 3,
        borderDash: [5, 5],
      },
      {
        label: 'Savings',
        data: props.data.map((d) => d.savings ?? 0),
        borderColor: chartColors.incomeExpense.crossover,
        backgroundColor: 'transparent',
        tension: 0.3,
        pointRadius: 3,
        borderDash: [5, 5],
      }
    )
  }

  return { labels, datasets }
})

// Chart options with custom tooltip and y-axis formatting
const chartOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  interaction: {
    intersect: false,
    mode: 'index' as const,
  },
  plugins: {
    legend: {
      position: 'top' as const,
      labels: {
        usePointStyle: true,
        padding: 15,
        font: {
          family: "'Inter', sans-serif",
          size: 12,
        },
      },
    },
    tooltip: {
      backgroundColor: 'rgba(33, 33, 33, 0.95)',
      titleColor: '#ffffff',
      bodyColor: '#e0e0e0',
      borderColor: 'rgba(255, 255, 255, 0.1)',
      borderWidth: 1,
      cornerRadius: 8,
      padding: 12,
      callbacks: {
        label: (context: { raw: unknown; dataset: { label?: string } }) => {
          const value = context.raw as number
          return `${context.dataset.label}: ${formatINRForChart(value)}`
        },
      },
    },
  },
  scales: {
    x: {
      grid: {
        color: 'rgba(0, 0, 0, 0.08)',
      },
      ticks: {
        font: {
          family: "'Inter', sans-serif",
          size: 11,
        },
      },
    },
    y: {
      beginAtZero: true,
      grid: {
        color: 'rgba(0, 0, 0, 0.08)',
      },
      ticks: {
        font: {
          family: "'JetBrains Mono', monospace",
          size: 11,
        },
        callback: (value: string | number) => formatINRForChart(value as number),
      },
    },
  },
  elements: {
    line: {
      tension: 0.3,
      borderWidth: 2,
    },
    point: {
      radius: 3,
      hoverRadius: 5,
    },
  },
}))

// Summary stats
const averageMonthly = computed(() => {
  if (props.data.length === 0) return 0
  return props.data.reduce((sum, d) => sum + d.total, 0) / props.data.length
})

const trend = computed(() => {
  if (props.data.length < 2) return 0
  const first = props.data[0].total
  const last = props.data[props.data.length - 1].total
  return first > 0 ? ((last - first) / first) * 100 : 0
})

// Has data
const hasData = computed(() => props.data.length > 0)
</script>

<template>
  <v-card>
    <v-card-title v-if="title" class="d-flex align-center">
      <v-icon icon="mdi-chart-line" class="mr-2" size="20" />
      {{ title }}
      <v-spacer />
      <div v-if="hasData" class="d-flex gap-4">
        <div class="text-right">
          <div class="text-caption text-medium-emphasis">Monthly Avg</div>
          <div class="text-body-2 font-weight-medium text-currency">{{ formatINR(averageMonthly) }}</div>
        </div>
        <div class="text-right">
          <div class="text-caption text-medium-emphasis">Trend</div>
          <div
            class="text-body-2 font-weight-medium"
            :class="trend >= 0 ? 'text-negative' : 'text-positive'"
          >
            <v-icon
              :icon="trend >= 0 ? 'mdi-trending-up' : 'mdi-trending-down'"
              size="14"
            />
            {{ Math.abs(trend).toFixed(1) }}%
          </div>
        </div>
      </div>
    </v-card-title>

    <v-card-text>
      <div v-if="hasData" class="chart-container" style="height: 300px">
        <Line :data="chartData" :options="chartOptions" />
      </div>
      <div v-else class="text-center py-8">
        <v-icon icon="mdi-chart-line" size="64" color="grey" />
        <p class="text-medium-emphasis mt-2">No trend data available</p>
        <p class="text-caption text-medium-emphasis">
          Add expenses across multiple months to see trends
        </p>
      </div>
    </v-card-text>
  </v-card>
</template>
