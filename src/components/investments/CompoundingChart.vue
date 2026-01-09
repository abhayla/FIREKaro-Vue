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
  Filler
} from 'chart.js'
import { useCompoundingAnalysis, formatINRCompact } from '@/composables/useInvestments'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler)

const { data: compounding, isLoading, isError } = useCompoundingAnalysis()

// Chart data
const chartData = computed(() => {
  if (!compounding.value?.data) return null

  const crossoverIdx = compounding.value.data.findIndex(d => d.returnsExceedContributions)

  return {
    labels: compounding.value.data.map(d => d.year.toString()),
    datasets: [
      {
        label: 'Your Contributions',
        data: compounding.value.data.map(d => d.contributions),
        borderColor: '#3b82f6',
        backgroundColor: 'rgba(59, 130, 246, 0.3)',
        fill: true,
        tension: 0.3,
        pointRadius: 4,
        pointBackgroundColor: '#3b82f6'
      },
      {
        label: 'Returns (Compounding)',
        data: compounding.value.data.map(d => d.returns),
        borderColor: '#10b981',
        backgroundColor: 'rgba(16, 185, 129, 0.3)',
        fill: true,
        tension: 0.3,
        pointRadius: 4,
        pointBackgroundColor: (ctx: { dataIndex: number }) => {
          // Highlight crossover point
          if (crossoverIdx >= 0 && ctx.dataIndex === crossoverIdx) {
            return '#f59e0b'
          }
          return '#10b981'
        },
        pointBorderColor: (ctx: { dataIndex: number }) => {
          if (crossoverIdx >= 0 && ctx.dataIndex === crossoverIdx) {
            return '#f59e0b'
          }
          return '#10b981'
        },
        pointBorderWidth: (ctx: { dataIndex: number }) => {
          if (crossoverIdx >= 0 && ctx.dataIndex === crossoverIdx) {
            return 3
          }
          return 1
        }
      }
    ]
  }
})

const chartOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  interaction: {
    mode: 'index' as const,
    intersect: false
  },
  plugins: {
    legend: {
      position: 'bottom' as const,
      labels: {
        usePointStyle: true
      }
    },
    tooltip: {
      callbacks: {
        label: (context: { dataset: { label: string }; raw: number }) =>
          `${context.dataset.label}: ${formatINRCompact(context.raw)}`
      }
    }
  },
  scales: {
    y: {
      beginAtZero: true,
      stacked: false,
      ticks: {
        callback: (value: number) => formatINRCompact(value)
      }
    }
  }
}))

// Status message based on compounding strength
const compoundingStatus = computed(() => {
  if (!compounding.value) return null

  const { returnsMultiplier, isCompoundingStrong, crossoverYear } = compounding.value

  if (returnsMultiplier >= 1) {
    return {
      icon: 'mdi-fire',
      color: 'success',
      title: 'Your Money is Working Harder Than You!',
      message: `Your returns (${formatINRCompact(compounding.value.currentReturns)}) now exceed what you invested. The magic of compounding is in full effect!`
    }
  } else if (isCompoundingStrong) {
    return {
      icon: 'mdi-rocket-launch',
      color: 'warning',
      title: 'Compounding is Building Momentum',
      message: `Your returns are ${(returnsMultiplier * 100).toFixed(0)}% of your contributions. Stay the course - the crossover point is approaching!`
    }
  } else {
    return {
      icon: 'mdi-seed',
      color: 'info',
      title: 'Seeds of Compounding Planted',
      message: `You're in the early accumulation phase. Keep investing consistently - the magic happens after 10-15 years!`
    }
  }
})
</script>

<template>
  <v-card>
    <v-card-title class="d-flex align-center">
      <v-icon icon="mdi-chart-bell-curve-cumulative" class="mr-2" />
      Compounding Visualization
      <v-spacer />
      <v-chip
        v-if="compounding?.crossoverYear"
        color="warning"
        variant="tonal"
        size="small"
      >
        <v-icon icon="mdi-star" size="small" class="mr-1" />
        Crossover: {{ compounding.crossoverYear }}
      </v-chip>
    </v-card-title>

    <v-card-text>
      <!-- Loading State -->
      <div v-if="isLoading" class="text-center py-4">
        <v-progress-circular indeterminate color="primary" size="32" />
      </div>

      <!-- Error State -->
      <v-alert v-else-if="isError" type="error" variant="tonal">
        Failed to load compounding analysis.
      </v-alert>

      <!-- Main Content -->
      <template v-else-if="compounding && chartData">
        <!-- Summary Cards -->
        <v-row class="mb-4">
          <v-col cols="6" md="3">
            <v-card variant="tonal" color="primary" class="pa-3 text-center">
              <div class="text-body-2">Total Invested</div>
              <div class="text-h6 font-weight-bold">
                {{ formatINRCompact(compounding.currentContributions) }}
              </div>
            </v-card>
          </v-col>
          <v-col cols="6" md="3">
            <v-card variant="tonal" color="success" class="pa-3 text-center">
              <div class="text-body-2">Total Returns</div>
              <div class="text-h6 font-weight-bold">
                {{ formatINRCompact(compounding.currentReturns) }}
              </div>
            </v-card>
          </v-col>
          <v-col cols="6" md="3">
            <v-card variant="tonal" class="pa-3 text-center">
              <div class="text-body-2">Portfolio Value</div>
              <div class="text-h6 font-weight-bold">
                {{ formatINRCompact(compounding.currentValue) }}
              </div>
            </v-card>
          </v-col>
          <v-col cols="6" md="3">
            <v-card
              variant="tonal"
              :color="compounding.returnsMultiplier >= 1 ? 'success' : compounding.returnsMultiplier >= 0.5 ? 'warning' : 'info'"
              class="pa-3 text-center"
            >
              <div class="text-body-2">Returns Ratio</div>
              <div class="text-h6 font-weight-bold">
                {{ (compounding.returnsMultiplier * 100).toFixed(0) }}%
              </div>
              <div class="text-caption">of contributions</div>
            </v-card>
          </v-col>
        </v-row>

        <!-- Chart -->
        <div style="height: 320px" class="mb-4">
          <Line :data="chartData" :options="chartOptions as any" />
        </div>

        <!-- Compounding Status Alert -->
        <v-alert
          v-if="compoundingStatus"
          :type="compoundingStatus.color as 'success' | 'warning' | 'info'"
          variant="tonal"
        >
          <template #prepend>
            <v-icon :icon="compoundingStatus.icon" />
          </template>
          <div class="font-weight-bold">{{ compoundingStatus.title }}</div>
          <div class="text-body-2 mt-1">{{ compoundingStatus.message }}</div>
        </v-alert>

        <!-- Educational Note -->
        <v-expansion-panels class="mt-4" variant="accordion">
          <v-expansion-panel>
            <v-expansion-panel-title>
              <v-icon icon="mdi-school" class="mr-2" />
              Understanding the Power of Compounding
            </v-expansion-panel-title>
            <v-expansion-panel-text>
              <v-list density="compact" class="bg-transparent">
                <v-list-item prepend-icon="mdi-numeric-1-circle">
                  <v-list-item-title class="text-body-2">
                    <strong>Early Years:</strong> Your contributions dominate portfolio growth
                  </v-list-item-title>
                </v-list-item>
                <v-list-item prepend-icon="mdi-numeric-2-circle">
                  <v-list-item-title class="text-body-2">
                    <strong>Crossover Point:</strong> When returns equal your contributions (typically 8-12 years)
                  </v-list-item-title>
                </v-list-item>
                <v-list-item prepend-icon="mdi-numeric-3-circle">
                  <v-list-item-title class="text-body-2">
                    <strong>Wealth Building:</strong> After crossover, returns grow exponentially - your money works harder than you!
                  </v-list-item-title>
                </v-list-item>
              </v-list>
              <v-alert type="info" variant="tonal" density="compact" class="mt-2">
                <strong>Key Insight:</strong> The magic of compounding happens after 10-15 years. Stay invested and stay patient!
              </v-alert>
            </v-expansion-panel-text>
          </v-expansion-panel>
        </v-expansion-panels>
      </template>
    </v-card-text>
  </v-card>
</template>
