<script setup lang="ts">
import { computed } from 'vue'
import { Doughnut } from 'vue-chartjs'
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  type ChartData,
} from 'chart.js'
import { doughnutChartOptions, chartColors, formatINRForChart } from '@/utils/chartTheme'
import { formatINR } from '@/composables/useExpenses'

ChartJS.register(ArcElement, Tooltip, Legend)

const props = defineProps<{
  data: Record<string, number>
  title?: string
}>()

// Use chart theme colors for categories
const getColor = (index: number) => {
  return chartColors.primary[index % chartColors.primary.length]
}

// Chart data using theme colors
const chartData = computed<ChartData<'doughnut'>>(() => {
  const labels = Object.keys(props.data)
  const values = Object.values(props.data)
  const colors = labels.map((_, i) => getColor(i))

  return {
    labels,
    datasets: [
      {
        data: values,
        backgroundColor: colors,
        borderColor: '#ffffff',
        borderWidth: 2,
      },
    ],
  }
})

// Chart options from theme with custom tooltip
const chartOptions = computed(() => ({
  ...doughnutChartOptions,
  plugins: {
    ...doughnutChartOptions.plugins,
    tooltip: {
      ...doughnutChartOptions.plugins?.tooltip,
      callbacks: {
        label: (context: { raw: unknown; label: string; dataset: { data: number[] } }) => {
          const value = context.raw as number
          const total = context.dataset.data?.reduce((a: number, b: number) => a + b, 0) ?? 0
          const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : '0.0'
          return `${context.label}: ${formatINRForChart(value)} (${percentage}%)`
        },
      },
    },
  },
}))

// Total
const total = computed(() => Object.values(props.data || {}).reduce((a, b) => a + b, 0))

// Has data
const hasData = computed(() => Object.keys(props.data || {}).length > 0 && total.value > 0)
</script>

<template>
  <v-card>
    <v-card-title v-if="title" class="text-subtitle-1">
      <v-icon icon="mdi-chart-pie" class="mr-2" size="20" />
      {{ title }}
    </v-card-title>

    <v-card-text>
      <div v-if="hasData" class="chart-container" style="height: 300px">
        <Doughnut :data="chartData" :options="chartOptions" />
      </div>
      <div v-else class="text-center py-8">
        <v-icon icon="mdi-chart-pie" size="64" color="grey" />
        <p class="text-medium-emphasis mt-2">No expense data to display</p>
      </div>

      <!-- Category List -->
      <v-divider v-if="hasData" class="my-4" />
      <div v-if="hasData" class="category-list">
        <div
          v-for="(amount, category, index) in data"
          :key="category"
          class="d-flex justify-space-between align-center py-1"
        >
          <div class="d-flex align-center">
            <div
              class="color-dot mr-2"
              :style="{ backgroundColor: getColor(index) }"
            />
            <span class="text-body-2">{{ category }}</span>
          </div>
          <div class="text-right">
            <span class="text-body-2 font-weight-medium text-currency">{{ formatINR(amount) }}</span>
            <span class="text-caption text-medium-emphasis ml-2">
              ({{ ((amount / total) * 100).toFixed(1) }}%)
            </span>
          </div>
        </div>
      </div>
    </v-card-text>
  </v-card>
</template>

<style scoped>
.color-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
}

.category-list {
  max-height: 200px;
  overflow-y: auto;
}
</style>
