<script setup lang="ts">
import { computed } from 'vue'
import { Doughnut } from 'vue-chartjs'
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  type ChartOptions
} from 'chart.js'
import {
  chartColors,
  doughnutChartOptions,
  formatINRForChart
} from '@/utils/chartTheme'
import { formatINR, formatINRCompact } from '@/composables/useInvestments'

ChartJS.register(ArcElement, Tooltip, Legend)

interface AllocationData {
  equity: number
  debt: number
  gold: number
  realEstate: number
  cash: number
  retirement?: number
}

const props = withDefaults(
  defineProps<{
    allocation: AllocationData
    totalValue: number
    showLegend?: boolean
    height?: number
  }>(),
  {
    showLegend: true,
    height: 250
  }
)

// Use asset class colors from chartTheme
const allocationColors: Record<keyof AllocationData, string> = {
  equity: chartColors.assetClasses.equity,
  debt: chartColors.assetClasses.debt,
  gold: chartColors.assetClasses.gold,
  realEstate: chartColors.assetClasses.realEstate,
  cash: chartColors.assetClasses.cash,
  retirement: chartColors.assetClasses.retirement
}

const allocationLabels: Record<keyof AllocationData, string> = {
  equity: 'Equity',
  debt: 'Debt',
  gold: 'Gold',
  realEstate: 'Real Estate',
  cash: 'Cash',
  retirement: 'Retirement'
}

const chartData = computed(() => {
  const labels: string[] = []
  const data: number[] = []
  const backgroundColor: string[] = []

  Object.entries(props.allocation).forEach(([key, value]) => {
    if (value > 0) {
      const typedKey = key as keyof AllocationData
      labels.push(allocationLabels[typedKey])
      data.push(value)
      backgroundColor.push(allocationColors[typedKey])
    }
  })

  return {
    labels,
    datasets: [
      {
        data,
        backgroundColor,
        borderWidth: 2,
        borderColor: '#ffffff',
        hoverBorderWidth: 3
      }
    ]
  }
})

// Merge base doughnut options with custom tooltip
const chartOptions = computed<ChartOptions<'doughnut'>>(() => ({
  ...doughnutChartOptions,
  cutout: '65%',
  plugins: {
    ...doughnutChartOptions.plugins,
    legend: {
      display: false
    },
    tooltip: {
      ...doughnutChartOptions.plugins?.tooltip,
      callbacks: {
        label: (context) => {
          const value = context.raw as number
          const total = context.dataset.data.reduce((a, b) => (a as number) + (b as number), 0) as number
          const percentage = ((value / total) * 100).toFixed(1)
          const amount = (props.totalValue * value) / 100
          return `${context.label}: ${percentage}% (${formatINRForChart(amount)})`
        }
      }
    }
  }
}))

const allocationItems = computed(() => {
  return Object.entries(props.allocation)
    .filter(([, value]) => value > 0)
    .map(([key, percentage]) => {
      const typedKey = key as keyof AllocationData
      return {
        key,
        label: allocationLabels[typedKey],
        percentage,
        value: (props.totalValue * percentage) / 100,
        color: allocationColors[typedKey]
      }
    })
    .sort((a, b) => b.percentage - a.percentage)
})
</script>

<template>
  <div class="portfolio-allocation-chart">
    <div class="chart-container" :style="{ height: `${height}px` }">
      <Doughnut :data="chartData" :options="chartOptions" />
      <div class="chart-center">
        <div class="text-h6 font-weight-bold text-currency">{{ formatINRCompact(totalValue) }}</div>
        <div class="text-caption text-medium-emphasis">Total Value</div>
      </div>
    </div>

    <div v-if="showLegend" class="allocation-legend mt-4">
      <div
        v-for="item in allocationItems"
        :key="item.key"
        class="legend-item d-flex align-center justify-space-between py-2"
      >
        <div class="d-flex align-center">
          <div
            class="legend-dot mr-2"
            :style="{ backgroundColor: item.color }"
          />
          <span class="text-body-2" :class="`asset-${item.key}`">{{ item.label }}</span>
        </div>
        <div class="text-right">
          <span class="text-body-2 font-weight-medium">{{ item.percentage.toFixed(1) }}%</span>
          <span class="text-caption text-medium-emphasis text-currency ml-2">
            {{ formatINRCompact(item.value) }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.chart-container {
  position: relative;
}

.chart-center {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
}

.legend-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
}

.legend-item {
  border-bottom: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
}

.legend-item:last-child {
  border-bottom: none;
}
</style>
