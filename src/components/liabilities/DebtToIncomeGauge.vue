<script setup lang="ts">
import { computed } from 'vue'
import { Doughnut } from 'vue-chartjs'
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend
} from 'chart.js'
import {
  chartColors,
  doughnutChartOptions,
  formatINRForChart
} from '@/utils/chartTheme'
import { calculateDTI, getDTIStatus, formatINR } from '@/composables/useLiabilities'

ChartJS.register(ArcElement, Tooltip, Legend)

const props = defineProps<{
  totalMonthlyDebt: number
  monthlyIncome: number
  showDetails?: boolean
}>()

// Calculate DTI
const dti = computed(() => calculateDTI(props.totalMonthlyDebt, props.monthlyIncome))
const dtiStatus = computed(() => getDTIStatus(dti.value))

// Remaining income
const remainingIncome = computed(() => Math.max(0, props.monthlyIncome - props.totalMonthlyDebt))

// Get DTI color from chartColors
const getDTIColor = (dtiValue: number): string => {
  if (dtiValue > 43) return chartColors.sentiment.negative
  if (dtiValue > 35) return chartColors.primary[3] // Orange/warning
  if (dtiValue > 20) return chartColors.primary[0] // Primary blue
  return chartColors.sentiment.positive
}

// Chart data - using chartTheme utilities
const chartData = computed(() => ({
  labels: ['Debt Payments', 'Available Income'],
  datasets: [
    {
      data: [props.totalMonthlyDebt, remainingIncome.value],
      backgroundColor: [
        getDTIColor(dti.value),
        chartColors.sentiment.neutral
      ],
      borderWidth: 0,
      cutout: '75%'
    }
  ]
}))

const chartOptions = computed(() => ({
  ...doughnutChartOptions,
  cutout: '75%',
  plugins: {
    ...doughnutChartOptions.plugins,
    legend: {
      display: false
    },
    tooltip: {
      ...doughnutChartOptions.plugins?.tooltip,
      callbacks: {
        label: (context: any) => {
          const value = context.raw
          const percentage = ((value / props.monthlyIncome) * 100).toFixed(1)
          return `${context.label}: ${formatINRForChart(value)} (${percentage}%)`
        }
      }
    }
  }
}))

// DTI ranges explanation
const dtiRanges = [
  { range: '0-20%', status: 'Excellent', description: 'Very manageable debt load', color: 'success' },
  { range: '21-35%', status: 'Good', description: 'Acceptable for most lenders', color: 'primary' },
  { range: '36-43%', status: 'Fair', description: 'May limit borrowing options', color: 'warning' },
  { range: '44%+', status: 'High', description: 'Consider debt reduction', color: 'error' }
]
</script>

<template>
  <v-card variant="outlined" class="h-100">
    <v-card-title>
      <v-icon icon="mdi-gauge" class="mr-2" />
      Debt-to-Income Ratio
    </v-card-title>

    <v-card-text>
      <div class="d-flex flex-column align-center">
        <!-- Gauge Chart -->
        <div class="position-relative" style="width: 200px; height: 200px">
          <Doughnut :data="chartData" :options="chartOptions" />
          <div class="gauge-center">
            <div class="text-h3 font-weight-bold" :class="`text-${dtiStatus.color}`">
              {{ dti }}%
            </div>
            <div class="text-caption text-medium-emphasis">DTI Ratio</div>
          </div>
        </div>

        <!-- Status Badge -->
        <v-chip
          :color="dtiStatus.color"
          size="large"
          class="mt-4"
        >
          <v-icon icon="mdi-check-circle" class="mr-1" v-if="dti <= 35" />
          <v-icon icon="mdi-alert" class="mr-1" v-else />
          {{ dtiStatus.status }}
        </v-chip>

        <!-- Income Breakdown -->
        <div class="w-100 mt-6">
          <div class="d-flex justify-space-between mb-2">
            <span class="text-body-2">Monthly Income</span>
            <span class="text-body-2 font-weight-bold">{{ formatINR(monthlyIncome) }}</span>
          </div>
          <div class="d-flex justify-space-between mb-2">
            <span class="text-body-2">Debt Payments</span>
            <span class="text-body-2 font-weight-bold" :class="`text-${dtiStatus.color}`">
              -{{ formatINR(totalMonthlyDebt) }}
            </span>
          </div>
          <v-divider class="my-2" />
          <div class="d-flex justify-space-between">
            <span class="text-body-2 font-weight-bold">Available Income</span>
            <span class="text-body-2 font-weight-bold text-success">
              {{ formatINR(remainingIncome) }}
            </span>
          </div>
        </div>

        <!-- DTI Ranges (Optional Details) -->
        <template v-if="showDetails">
          <v-divider class="my-4 w-100" />
          <div class="w-100">
            <div class="text-subtitle-2 mb-2">DTI Guidelines</div>
            <v-list density="compact" class="pa-0">
              <v-list-item
                v-for="range in dtiRanges"
                :key="range.range"
                :class="{ 'bg-grey-lighten-4': dti >= parseInt(range.range) && dti < parseInt(range.range.split('-')[1] || '100') }"
                class="px-0"
              >
                <template #prepend>
                  <v-avatar :color="range.color" size="24" class="mr-2">
                    <v-icon icon="mdi-circle" size="8" />
                  </v-avatar>
                </template>
                <v-list-item-title class="text-body-2">
                  {{ range.range }} - {{ range.status }}
                </v-list-item-title>
                <v-list-item-subtitle class="text-caption">
                  {{ range.description }}
                </v-list-item-subtitle>
              </v-list-item>
            </v-list>
          </div>
        </template>
      </div>
    </v-card-text>

    <!-- Recommendations -->
    <v-card-text v-if="dti > 35" class="pt-0">
      <v-alert :type="dti > 43 ? 'error' : 'warning'" variant="tonal" density="compact">
        <template v-if="dti > 43">
          Your DTI is high. Consider paying off high-interest debt or increasing income.
        </template>
        <template v-else>
          Your DTI is moderate. Avoid taking on additional debt until ratio improves.
        </template>
      </v-alert>
    </v-card-text>
  </v-card>
</template>

<style scoped>
.gauge-center {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
}

.position-relative {
  position: relative;
}
</style>
