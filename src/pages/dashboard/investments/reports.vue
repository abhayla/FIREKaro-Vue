<script setup lang="ts">
import { ref, computed } from 'vue'
import { Line, Bar } from 'vue-chartjs'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js'
import SectionHeader from '@/components/shared/SectionHeader.vue'
import FamilyToggle from '@/components/shared/FamilyToggle.vue'
import PortfolioAllocationChart from '@/components/investments/PortfolioAllocationChart.vue'
import { usePortfolio, formatINR, formatINRCompact, formatPercentage } from '@/composables/useInvestments'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, Filler)

const tabs = [
  { title: 'Portfolio', route: '/dashboard/investments' },
  { title: 'Stocks', route: '/dashboard/investments/stocks' },
  { title: 'Mutual Funds', route: '/dashboard/investments/mutual-funds' },
  { title: 'EPF & PPF', route: '/dashboard/investments/epf-ppf' },
  { title: 'NPS', route: '/dashboard/investments/nps' },
  { title: 'Property', route: '/dashboard/investments/property' },
  { title: 'Reports', route: '/dashboard/investments/reports' },
]

// Data fetching
const { data: portfolio, isLoading } = usePortfolio()

// Report type
const reportType = ref<'portfolio' | 'performance' | 'allocation' | 'tax'>('portfolio')
const dateRange = ref<'1m' | '3m' | '6m' | '1y' | 'all'>('1y')

// Mock portfolio value over time
const portfolioHistory = [
  { date: 'Jan', value: 7500000 },
  { date: 'Feb', value: 7650000 },
  { date: 'Mar', value: 7420000 },
  { date: 'Apr', value: 7800000 },
  { date: 'May', value: 8100000 },
  { date: 'Jun', value: 7950000 },
  { date: 'Jul', value: 8200000 },
  { date: 'Aug', value: 8450000 },
  { date: 'Sep', value: 8300000 },
  { date: 'Oct', value: 8600000 },
  { date: 'Nov', value: 8750000 },
  { date: 'Dec', value: 8542350 }
]

// Portfolio Chart Data
const portfolioChartData = computed(() => ({
  labels: portfolioHistory.map(p => p.date),
  datasets: [
    {
      label: 'Portfolio Value',
      data: portfolioHistory.map(p => p.value),
      borderColor: '#4CAF50',
      backgroundColor: 'rgba(76, 175, 80, 0.1)',
      fill: true,
      tension: 0.3
    }
  ]
}))

// Category Performance Data
const categoryPerformance = [
  { category: 'Stocks', returns: 18.5, benchmark: 15.2 },
  { category: 'Mutual Funds', returns: 14.2, benchmark: 12.8 },
  { category: 'EPF', returns: 8.25, benchmark: 8.25 },
  { category: 'PPF', returns: 7.1, benchmark: 7.1 },
  { category: 'NPS', returns: 11.5, benchmark: 10.2 },
  { category: 'Real Estate', returns: 8.5, benchmark: 7.0 }
]

const performanceChartData = computed(() => ({
  labels: categoryPerformance.map(c => c.category),
  datasets: [
    {
      label: 'Your Returns',
      data: categoryPerformance.map(c => c.returns),
      backgroundColor: '#4CAF50'
    },
    {
      label: 'Benchmark',
      data: categoryPerformance.map(c => c.benchmark),
      backgroundColor: '#2196F3'
    }
  ]
}))

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'bottom' as const
    }
  },
  scales: {
    y: {
      beginAtZero: false,
      ticks: {
        callback: (value: any) => formatINRCompact(value)
      }
    }
  }
}

const barChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'bottom' as const
    }
  },
  scales: {
    y: {
      beginAtZero: true,
      ticks: {
        callback: (value: any) => `${value}%`
      }
    }
  }
}

// Default allocation for demo
const allocation = computed(() => portfolio.value?.allocation ?? {
  equity: 45,
  debt: 25,
  gold: 5,
  realEstate: 20,
  cash: 5
})

// Rebalancing Recommendations
const rebalancingNeeded = computed(() => {
  const target = { equity: 50, debt: 30, gold: 5, realEstate: 10, cash: 5 }
  const current = allocation.value
  return Object.entries(target).map(([key, targetValue]) => ({
    category: key.charAt(0).toUpperCase() + key.slice(1),
    current: current[key as keyof typeof current] ?? 0,
    target: targetValue,
    difference: (current[key as keyof typeof current] ?? 0) - targetValue,
    action: (current[key as keyof typeof current] ?? 0) > targetValue ? 'Reduce' : 'Increase'
  })).filter(r => Math.abs(r.difference) > 2)
})

// Tax Report Data
const taxReport = {
  shortTermGains: 45000,
  longTermGains: 125000,
  dividendIncome: 35000,
  section80C: {
    epf: 172800,
    ppf: 150000,
    elss: 50000,
    total: 372800,
    limit: 150000
  },
  section80CCD1B: {
    nps: 50000,
    limit: 50000
  }
}
</script>

<template>
  <div>
    <SectionHeader
      title="Investments"
      subtitle="Investment Reports"
      icon="mdi-chart-line"
      :tabs="tabs"
    />

    <FamilyToggle class="mb-6" />

    <!-- Report Type Selector -->
    <v-card variant="outlined" class="mb-6">
      <v-card-text class="d-flex gap-3 flex-wrap align-center">
        <v-btn-toggle v-model="reportType" mandatory color="primary" variant="outlined">
          <v-btn value="portfolio">Portfolio Summary</v-btn>
          <v-btn value="performance">Performance</v-btn>
          <v-btn value="allocation">Rebalancing</v-btn>
          <v-btn value="tax">Tax Report</v-btn>
        </v-btn-toggle>

        <v-spacer />

        <v-btn-toggle v-model="dateRange" mandatory density="compact" variant="outlined">
          <v-btn value="1m" size="small">1M</v-btn>
          <v-btn value="3m" size="small">3M</v-btn>
          <v-btn value="6m" size="small">6M</v-btn>
          <v-btn value="1y" size="small">1Y</v-btn>
          <v-btn value="all" size="small">All</v-btn>
        </v-btn-toggle>

        <v-btn variant="outlined" prepend-icon="mdi-download">
          Export PDF
        </v-btn>
      </v-card-text>
    </v-card>

    <!-- Loading State -->
    <template v-if="isLoading">
      <v-skeleton-loader type="card, card" />
    </template>

    <!-- Portfolio Summary Report -->
    <template v-else-if="reportType === 'portfolio'">
      <v-row>
        <v-col cols="12" md="8">
          <v-card class="h-100">
            <v-card-title class="text-subtitle-1">Portfolio Value Over Time</v-card-title>
            <v-card-text>
              <div style="height: 350px">
                <Line :data="portfolioChartData" :options="chartOptions" />
              </div>
            </v-card-text>
          </v-card>
        </v-col>
        <v-col cols="12" md="4">
          <v-card class="h-100">
            <v-card-title class="text-subtitle-1">Asset Allocation</v-card-title>
            <v-card-text>
              <PortfolioAllocationChart
                :allocation="allocation"
                :total-value="8542350"
                :height="280"
              />
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <v-row class="mt-4">
        <v-col cols="12" md="3">
          <v-card class="pa-4 text-center">
            <div class="text-body-2 text-medium-emphasis">Total Portfolio</div>
            <div class="text-h5 font-weight-bold">₹85.42L</div>
            <div class="text-caption text-success">+13.9% YTD</div>
          </v-card>
        </v-col>
        <v-col cols="12" md="3">
          <v-card class="pa-4 text-center">
            <div class="text-body-2 text-medium-emphasis">Total Invested</div>
            <div class="text-h5 font-weight-bold">₹72.15L</div>
          </v-card>
        </v-col>
        <v-col cols="12" md="3">
          <v-card class="pa-4 text-center">
            <div class="text-body-2 text-medium-emphasis">Total Returns</div>
            <div class="text-h5 font-weight-bold text-success">₹13.27L</div>
            <div class="text-caption text-success">+18.4%</div>
          </v-card>
        </v-col>
        <v-col cols="12" md="3">
          <v-card class="pa-4 text-center">
            <div class="text-body-2 text-medium-emphasis">XIRR</div>
            <div class="text-h5 font-weight-bold">14.2%</div>
            <div class="text-caption text-medium-emphasis">Annualized</div>
          </v-card>
        </v-col>
      </v-row>
    </template>

    <!-- Performance Report -->
    <template v-else-if="reportType === 'performance'">
      <v-row>
        <v-col cols="12" md="8">
          <v-card class="h-100">
            <v-card-title class="text-subtitle-1">Category-wise Performance vs Benchmark</v-card-title>
            <v-card-text>
              <div style="height: 350px">
                <Bar :data="performanceChartData" :options="barChartOptions" />
              </div>
            </v-card-text>
          </v-card>
        </v-col>
        <v-col cols="12" md="4">
          <v-card class="h-100">
            <v-card-title class="text-subtitle-1">Performance Summary</v-card-title>
            <v-card-text>
              <v-list density="compact">
                <v-list-item v-for="cat in categoryPerformance" :key="cat.category">
                  <template #prepend>
                    <v-icon
                      :icon="cat.returns >= cat.benchmark ? 'mdi-arrow-up' : 'mdi-arrow-down'"
                      :color="cat.returns >= cat.benchmark ? 'success' : 'error'"
                      size="small"
                    />
                  </template>
                  <v-list-item-title>{{ cat.category }}</v-list-item-title>
                  <template #append>
                    <div class="text-right">
                      <div
                        class="text-body-2 font-weight-medium"
                        :class="cat.returns >= cat.benchmark ? 'text-success' : 'text-error'"
                      >
                        {{ formatPercentage(cat.returns) }}
                      </div>
                      <div class="text-caption text-medium-emphasis">
                        vs {{ cat.benchmark }}%
                      </div>
                    </div>
                  </template>
                </v-list-item>
              </v-list>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </template>

    <!-- Rebalancing Report -->
    <template v-else-if="reportType === 'allocation'">
      <v-row>
        <v-col cols="12" md="5">
          <v-card class="h-100">
            <v-card-title class="text-subtitle-1">Current Allocation</v-card-title>
            <v-card-text>
              <PortfolioAllocationChart
                :allocation="allocation"
                :total-value="8542350"
                :height="280"
              />
            </v-card-text>
          </v-card>
        </v-col>
        <v-col cols="12" md="7">
          <v-card class="h-100">
            <v-card-title class="text-subtitle-1">
              <v-icon icon="mdi-scale-balance" class="mr-2" />
              Rebalancing Recommendations
            </v-card-title>
            <v-card-text>
              <v-alert
                v-if="rebalancingNeeded.length === 0"
                type="success"
                variant="tonal"
                density="compact"
              >
                Your portfolio is well-balanced. No rebalancing needed.
              </v-alert>

              <v-table v-else density="compact">
                <thead>
                  <tr>
                    <th>Category</th>
                    <th class="text-right">Current</th>
                    <th class="text-right">Target</th>
                    <th class="text-right">Difference</th>
                    <th class="text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="rec in rebalancingNeeded" :key="rec.category">
                    <td>{{ rec.category }}</td>
                    <td class="text-right">{{ rec.current.toFixed(1) }}%</td>
                    <td class="text-right">{{ rec.target }}%</td>
                    <td
                      class="text-right font-weight-medium"
                      :class="rec.difference > 0 ? 'text-error' : 'text-success'"
                    >
                      {{ rec.difference > 0 ? '+' : '' }}{{ rec.difference.toFixed(1) }}%
                    </td>
                    <td class="text-right">
                      <v-chip
                        :color="rec.action === 'Reduce' ? 'error' : 'success'"
                        size="x-small"
                        variant="tonal"
                      >
                        {{ rec.action }}
                      </v-chip>
                    </td>
                  </tr>
                </tbody>
              </v-table>

              <v-alert type="info" variant="tonal" density="compact" class="mt-4">
                <strong>Tip:</strong> Consider SIP into underweight categories and avoid overweight ones during new investments.
              </v-alert>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </template>

    <!-- Tax Report -->
    <template v-else-if="reportType === 'tax'">
      <v-row>
        <v-col cols="12" md="6">
          <v-card class="h-100">
            <v-card-title class="text-subtitle-1">Capital Gains Summary</v-card-title>
            <v-card-text>
              <v-table density="compact">
                <tbody>
                  <tr>
                    <td>Short Term Capital Gains (STCG)</td>
                    <td class="text-right font-weight-medium">{{ formatINR(taxReport.shortTermGains) }}</td>
                    <td class="text-caption">15% tax</td>
                  </tr>
                  <tr>
                    <td>Long Term Capital Gains (LTCG)</td>
                    <td class="text-right font-weight-medium">{{ formatINR(taxReport.longTermGains) }}</td>
                    <td class="text-caption">10% above ₹1L</td>
                  </tr>
                  <tr>
                    <td>Dividend Income</td>
                    <td class="text-right font-weight-medium">{{ formatINR(taxReport.dividendIncome) }}</td>
                    <td class="text-caption">Slab rate</td>
                  </tr>
                </tbody>
              </v-table>

              <v-alert type="warning" variant="tonal" density="compact" class="mt-4">
                <strong>Tax Liability:</strong> Approximately {{ formatINR(taxReport.shortTermGains * 0.15 + Math.max(0, taxReport.longTermGains - 100000) * 0.10) }}
              </v-alert>
            </v-card-text>
          </v-card>
        </v-col>

        <v-col cols="12" md="6">
          <v-card class="h-100">
            <v-card-title class="text-subtitle-1">Tax Deductions</v-card-title>
            <v-card-text>
              <div class="mb-4">
                <div class="d-flex justify-space-between mb-1">
                  <span class="text-body-2">Section 80C</span>
                  <span class="text-body-2 font-weight-medium">
                    {{ formatINR(Math.min(taxReport.section80C.total, taxReport.section80C.limit)) }}
                    / {{ formatINR(taxReport.section80C.limit) }}
                  </span>
                </div>
                <v-progress-linear
                  :model-value="Math.min(100, (taxReport.section80C.total / taxReport.section80C.limit) * 100)"
                  color="success"
                  height="8"
                  rounded
                />
                <div class="text-caption text-medium-emphasis mt-1">
                  EPF: {{ formatINR(taxReport.section80C.epf) }} |
                  PPF: {{ formatINR(taxReport.section80C.ppf) }} |
                  ELSS: {{ formatINR(taxReport.section80C.elss) }}
                </div>
              </div>

              <div>
                <div class="d-flex justify-space-between mb-1">
                  <span class="text-body-2">Section 80CCD(1B) - NPS</span>
                  <span class="text-body-2 font-weight-medium">
                    {{ formatINR(taxReport.section80CCD1B.nps) }}
                    / {{ formatINR(taxReport.section80CCD1B.limit) }}
                  </span>
                </div>
                <v-progress-linear
                  :model-value="(taxReport.section80CCD1B.nps / taxReport.section80CCD1B.limit) * 100"
                  color="orange"
                  height="8"
                  rounded
                />
              </div>

              <v-alert type="success" variant="tonal" density="compact" class="mt-4">
                <strong>Total Deductions:</strong> {{ formatINR(150000 + 50000) }} (₹1.5L + ₹50K)
              </v-alert>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </template>
  </div>
</template>
