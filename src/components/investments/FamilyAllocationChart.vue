<script setup lang="ts">
import { computed, ref } from 'vue'
import { Bar } from 'vue-chartjs'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js'
import { chartColors, barChartOptions, formatINRForChart } from '@/utils/chartTheme'

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend)

interface FamilyMemberAllocation {
  memberId: string
  memberName: string
  equity: number
  debt: number
  gold: number
  realEstate: number
  cash: number
  total: number
}

interface Props {
  members: FamilyMemberAllocation[]
  loading?: boolean
  viewMode?: 'value' | 'percentage'
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  viewMode: 'value'
})

const localViewMode = ref(props.viewMode)

const chartData = computed(() => {
  if (!props.members?.length) {
    return {
      labels: [],
      datasets: []
    }
  }

  const sortedMembers = [...props.members].sort((a, b) => (b.total ?? 0) - (a.total ?? 0))
  const labels = sortedMembers.map(m => m.memberName)

  const getValue = (member: FamilyMemberAllocation, key: keyof FamilyMemberAllocation): number => {
    const val = member[key] as number ?? 0
    if (localViewMode.value === 'percentage' && member.total > 0) {
      return (val / member.total) * 100
    }
    return val
  }

  return {
    labels,
    datasets: [
      {
        label: 'Equity',
        data: sortedMembers.map(m => getValue(m, 'equity')),
        backgroundColor: chartColors.assetClasses.equity,
        borderRadius: 4,
      },
      {
        label: 'Debt',
        data: sortedMembers.map(m => getValue(m, 'debt')),
        backgroundColor: chartColors.assetClasses.debt,
        borderRadius: 4,
      },
      {
        label: 'Gold',
        data: sortedMembers.map(m => getValue(m, 'gold')),
        backgroundColor: chartColors.assetClasses.gold,
        borderRadius: 4,
      },
      {
        label: 'Real Estate',
        data: sortedMembers.map(m => getValue(m, 'realEstate')),
        backgroundColor: chartColors.assetClasses.realEstate,
        borderRadius: 4,
      },
      {
        label: 'Cash',
        data: sortedMembers.map(m => getValue(m, 'cash')),
        backgroundColor: chartColors.assetClasses.cash,
        borderRadius: 4,
      },
    ]
  }
})

const chartOptions = computed(() => {
  return {
    ...barChartOptions,
    indexAxis: 'y' as const,
    scales: {
      x: {
        stacked: true,
        grid: {
          display: true,
          color: 'rgba(128, 128, 128, 0.1)',
        },
        ticks: {
          callback: function(value: string | number) {
            const numValue = typeof value === 'string' ? parseFloat(value) : value
            if (localViewMode.value === 'percentage') {
              return `${numValue}%`
            }
            return formatINRForChart(numValue)
          }
        },
        title: {
          display: true,
          text: localViewMode.value === 'percentage' ? 'Allocation (%)' : 'Value (₹)',
        }
      },
      y: {
        stacked: true,
        grid: {
          display: false,
        },
      },
    },
    plugins: {
      ...barChartOptions.plugins,
      tooltip: {
        ...(barChartOptions.plugins as any)?.tooltip,
        callbacks: {
          label: function(context: any) {
            const label = context.dataset.label || ''
            const value = context.raw || 0
            if (localViewMode.value === 'percentage') {
              return `${label}: ${value.toFixed(1)}%`
            }
            return `${label}: ${formatINRForChart(value)}`
          }
        }
      }
    }
  }
})

const totalFamilyValue = computed(() => {
  return props.members?.reduce((sum, m) => sum + (m.total ?? 0), 0) ?? 0
})

const aggregatedAllocation = computed(() => {
  if (!props.members?.length) {
    return { equity: 0, debt: 0, gold: 0, realEstate: 0, cash: 0 }
  }

  const agg = props.members.reduce(
    (acc, m) => ({
      equity: acc.equity + (m.equity ?? 0),
      debt: acc.debt + (m.debt ?? 0),
      gold: acc.gold + (m.gold ?? 0),
      realEstate: acc.realEstate + (m.realEstate ?? 0),
      cash: acc.cash + (m.cash ?? 0),
    }),
    { equity: 0, debt: 0, gold: 0, realEstate: 0, cash: 0 }
  )

  if (totalFamilyValue.value === 0) return agg

  return {
    equity: (agg.equity / totalFamilyValue.value) * 100,
    debt: (agg.debt / totalFamilyValue.value) * 100,
    gold: (agg.gold / totalFamilyValue.value) * 100,
    realEstate: (agg.realEstate / totalFamilyValue.value) * 100,
    cash: (agg.cash / totalFamilyValue.value) * 100,
  }
})
</script>

<template>
  <v-card>
    <v-card-title class="d-flex align-center">
      <v-icon start>mdi-chart-bar-stacked</v-icon>
      Family Allocation by Asset Class
      <v-spacer />
      <v-btn-toggle
        v-model="localViewMode"
        mandatory
        density="compact"
        variant="outlined"
      >
        <v-btn value="value" size="small">
          <v-icon start size="small">mdi-currency-inr</v-icon>
          Value
        </v-btn>
        <v-btn value="percentage" size="small">
          <v-icon start size="small">mdi-percent</v-icon>
          Percent
        </v-btn>
      </v-btn-toggle>
    </v-card-title>

    <v-card-text>
      <!-- Loading State -->
      <v-skeleton-loader
        v-if="loading"
        type="image"
        height="300"
      />

      <!-- Empty State -->
      <v-alert
        v-else-if="!members?.length"
        type="info"
        variant="tonal"
        class="mb-0"
      >
        <v-alert-title>No Family Data</v-alert-title>
        Add family members and their investments to see allocation chart.
      </v-alert>

      <!-- Chart -->
      <template v-else>
        <!-- Aggregated Summary -->
        <div class="d-flex flex-wrap justify-center ga-4 mb-4">
          <div class="text-center">
            <div class="text-caption text-medium-emphasis">Total Family Value</div>
            <div class="text-h5 text-currency">{{ formatINRForChart(totalFamilyValue) }}</div>
          </div>
          <v-divider vertical class="mx-2" />
          <div class="d-flex ga-4">
            <div class="text-center">
              <div class="d-flex align-center ga-1">
                <div class="color-dot" :style="{ backgroundColor: chartColors.assetClasses.equity }"></div>
                <span class="text-caption">Equity</span>
              </div>
              <div class="text-body-2 font-weight-medium">{{ aggregatedAllocation.equity.toFixed(1) }}%</div>
            </div>
            <div class="text-center">
              <div class="d-flex align-center ga-1">
                <div class="color-dot" :style="{ backgroundColor: chartColors.assetClasses.debt }"></div>
                <span class="text-caption">Debt</span>
              </div>
              <div class="text-body-2 font-weight-medium">{{ aggregatedAllocation.debt.toFixed(1) }}%</div>
            </div>
            <div class="text-center">
              <div class="d-flex align-center ga-1">
                <div class="color-dot" :style="{ backgroundColor: chartColors.assetClasses.gold }"></div>
                <span class="text-caption">Gold</span>
              </div>
              <div class="text-body-2 font-weight-medium">{{ aggregatedAllocation.gold.toFixed(1) }}%</div>
            </div>
            <div class="text-center">
              <div class="d-flex align-center ga-1">
                <div class="color-dot" :style="{ backgroundColor: chartColors.assetClasses.realEstate }"></div>
                <span class="text-caption">Real Estate</span>
              </div>
              <div class="text-body-2 font-weight-medium">{{ aggregatedAllocation.realEstate.toFixed(1) }}%</div>
            </div>
            <div class="text-center">
              <div class="d-flex align-center ga-1">
                <div class="color-dot" :style="{ backgroundColor: chartColors.assetClasses.cash }"></div>
                <span class="text-caption">Cash</span>
              </div>
              <div class="text-body-2 font-weight-medium">{{ aggregatedAllocation.cash.toFixed(1) }}%</div>
            </div>
          </div>
        </div>

        <!-- Stacked Bar Chart -->
        <div style="height: 300px;">
          <Bar
            :data="chartData"
            :options="chartOptions"
          />
        </div>
      </template>
    </v-card-text>
  </v-card>
</template>

<style scoped>
.color-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
}
</style>
