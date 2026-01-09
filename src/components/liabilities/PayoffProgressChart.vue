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
import {
  chartColors,
  lineChartOptions,
  formatINRForChart
} from '@/utils/chartTheme'
import { type Loan, type CreditCard, formatINR, formatINRCompact, calculateMinimumDue } from '@/composables/useLiabilities'

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

const props = defineProps<{
  loans: Loan[]
  creditCards: CreditCard[]
  projectionMonths?: number
}>()

const months = computed(() => props.projectionMonths || 60)

// Calculate total current debt
const totalDebt = computed(() => {
  const loanDebt = props.loans.reduce((sum, l) => sum + (l.outstandingAmount ?? 0), 0)
  const ccDebt = props.creditCards.reduce((sum, c) => sum + (c.currentOutstanding ?? 0), 0)
  return loanDebt + ccDebt
})

// Generate projection data
const projectionData = computed(() => {
  const data: { month: number; date: string; balance: number }[] = []
  let currentBalance = totalDebt.value
  const monthlyPayment = calculateTotalMonthlyPayment()
  const avgInterestRate = calculateAverageInterestRate()

  for (let i = 0; i <= months.value; i++) {
    const date = new Date()
    date.setMonth(date.getMonth() + i)

    data.push({
      month: i,
      date: date.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' }),
      balance: Math.max(0, Math.round(currentBalance))
    })

    // Apply interest and payment
    const monthlyInterest = currentBalance * (avgInterestRate / 12 / 100)
    currentBalance = currentBalance + monthlyInterest - monthlyPayment
    if (currentBalance <= 0) break
  }

  return data
})

// Calculate monthly payment
function calculateTotalMonthlyPayment(): number {
  const loanEmi = props.loans.reduce((sum, l) => sum + (l.emiAmount ?? 0), 0)
  const ccPayment = props.creditCards.reduce((sum, c) => sum + calculateMinimumDue(c.currentOutstanding ?? 0), 0)
  return loanEmi + ccPayment
}

// Calculate average interest rate
function calculateAverageInterestRate(): number {
  const totalDebtAmount = totalDebt.value
  if (totalDebtAmount === 0) return 0

  let weightedRate = 0
  props.loans.forEach(l => {
    const outstanding = l.outstandingAmount ?? 0
    weightedRate += (l.interestRate ?? 0) * (outstanding / totalDebtAmount)
  })
  props.creditCards.forEach(c => {
    const outstanding = c.currentOutstanding ?? 0
    weightedRate += (c.interestRateAPR ?? 0) * (outstanding / totalDebtAmount)
  })

  return weightedRate
}

// Payoff date
const payoffDate = computed(() => {
  const lastNonZero = projectionData.value.findIndex(d => d.balance === 0)
  if (lastNonZero > 0) {
    return projectionData.value[lastNonZero].date
  }
  return projectionData.value[projectionData.value.length - 1].date + '+'
})

// Chart configuration - using chartTheme utilities
const chartData = computed(() => ({
  labels: projectionData.value.map(d => d.date),
  datasets: [
    {
      label: 'Debt Balance',
      data: projectionData.value.map(d => d.balance),
      borderColor: chartColors.primary[0],
      backgroundColor: `${chartColors.primary[0]}1A`,
      fill: true,
      tension: 0.4,
      pointRadius: 0,
      pointHoverRadius: 6
    }
  ]
}))

const chartOptions = computed(() => ({
  ...lineChartOptions,
  plugins: {
    ...lineChartOptions.plugins,
    legend: {
      display: false
    },
    tooltip: {
      ...lineChartOptions.plugins?.tooltip,
      callbacks: {
        label: (context: any) => `Balance: ${formatINRForChart(context.raw)}`
      }
    }
  },
  scales: {
    ...lineChartOptions.scales,
    x: {
      ...lineChartOptions.scales?.x,
      grid: {
        display: false
      },
      ticks: {
        ...lineChartOptions.scales?.x?.ticks,
        maxTicksLimit: 12
      }
    },
    y: {
      ...lineChartOptions.scales?.y,
      beginAtZero: true,
      ticks: {
        ...lineChartOptions.scales?.y?.ticks,
        callback: (value: any) => formatINRCompact(value)
      }
    }
  },
  interaction: {
    intersect: false,
    mode: 'index' as const
  }
}))

// Milestones
const milestones = computed(() => {
  const result: { percent: number; date: string; amount: number }[] = []
  const targets = [75, 50, 25, 0]
  const initialDebt = totalDebt.value

  targets.forEach(target => {
    const targetAmount = initialDebt * (target / 100)
    const milestone = projectionData.value.find(d => d.balance <= targetAmount)
    if (milestone) {
      result.push({
        percent: 100 - target,
        date: milestone.date,
        amount: milestone.balance
      })
    }
  })

  return result
})
</script>

<template>
  <v-card variant="outlined">
    <v-card-title class="d-flex align-center">
      <v-icon icon="mdi-chart-timeline-variant" class="mr-2" />
      Debt Payoff Projection
    </v-card-title>

    <v-card-text>
      <!-- Summary Stats -->
      <v-row class="mb-4">
        <v-col cols="6" sm="3">
          <div class="text-caption text-medium-emphasis">Current Debt</div>
          <div class="text-h6 font-weight-bold">{{ formatINRCompact(totalDebt) }}</div>
        </v-col>
        <v-col cols="6" sm="3">
          <div class="text-caption text-medium-emphasis">Monthly Payment</div>
          <div class="text-h6 font-weight-bold text-primary">
            {{ formatINR(calculateTotalMonthlyPayment()) }}
          </div>
        </v-col>
        <v-col cols="6" sm="3">
          <div class="text-caption text-medium-emphasis">Avg Interest Rate</div>
          <div class="text-h6 font-weight-bold text-warning">
            {{ calculateAverageInterestRate().toFixed(1) }}%
          </div>
        </v-col>
        <v-col cols="6" sm="3">
          <div class="text-caption text-medium-emphasis">Projected Payoff</div>
          <div class="text-h6 font-weight-bold text-success">{{ payoffDate }}</div>
        </v-col>
      </v-row>

      <!-- Chart -->
      <div style="height: 300px">
        <Line :data="chartData" :options="chartOptions" />
      </div>

      <!-- Milestones -->
      <div class="mt-6">
        <div class="text-subtitle-2 mb-3">Payoff Milestones</div>
        <v-timeline side="end" density="compact">
          <v-timeline-item
            v-for="milestone in milestones"
            :key="milestone.percent"
            :dot-color="milestone.percent === 100 ? 'success' : 'primary'"
            size="small"
          >
            <template #opposite>
              <div class="text-caption">{{ milestone.date }}</div>
            </template>
            <div>
              <v-chip
                :color="milestone.percent === 100 ? 'success' : 'primary'"
                size="small"
                class="mr-2"
              >
                {{ milestone.percent }}% Paid
              </v-chip>
              <span class="text-body-2">
                {{ milestone.percent === 100 ? 'Debt Free!' : `Balance: ${formatINRCompact(milestone.amount)}` }}
              </span>
            </div>
          </v-timeline-item>
        </v-timeline>
      </div>

      <!-- Tips -->
      <v-alert type="info" variant="tonal" class="mt-4">
        <v-icon icon="mdi-lightbulb" class="mr-1" />
        <strong>Tip:</strong> Adding just {{ formatINR(5000) }} extra to your monthly payment could
        significantly reduce your payoff time and total interest paid.
      </v-alert>
    </v-card-text>
  </v-card>
</template>
