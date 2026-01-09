<script setup lang="ts">
import { ref, computed } from 'vue'
import {
  usePortfolioSummaryReport,
  useTaxReport,
  usePerformanceReport,
  use80CStatus,
  useRetirementProjection,
} from '@/composables/useInvestments'
import { formatINR, formatINRCompact } from '@/composables/useLiabilities'
import TaxReportView from './TaxReportView.vue'
import InvestmentMetricsCards from './InvestmentMetricsCards.vue'

type ReportType = 'portfolio' | 'tax' | 'performance' | '80c' | 'retirement'

const selectedReport = ref<ReportType>('portfolio')
const selectedFY = ref(getCurrentFY())
const selectedPeriod = ref('1Y')
const isExporting = ref(false)

// Composables for each report type
const portfolioReport = usePortfolioSummaryReport()
const taxReport = useTaxReport(selectedFY.value)
const performanceReport = usePerformanceReport(selectedPeriod.value)
const section80CStatus = use80CStatus()
const retirementProjection = useRetirementProjection()

const reportTypes = [
  { value: 'portfolio', title: 'Portfolio Summary', icon: 'mdi-chart-pie', color: 'primary' },
  { value: 'tax', title: 'Tax Report', icon: 'mdi-calculator', color: 'warning' },
  { value: 'performance', title: 'Performance', icon: 'mdi-chart-line', color: 'success' },
  { value: '80c', title: '80C Status', icon: 'mdi-shield-check', color: 'info' },
  { value: 'retirement', title: 'Retirement', icon: 'mdi-beach', color: 'purple' },
]

const financialYears = computed(() => {
  const years = []
  const currentYear = new Date().getFullYear()
  for (let i = 0; i < 5; i++) {
    const start = currentYear - i
    years.push(`${start - 1}-${String(start).slice(-2)}`)
  }
  return years
})

const periods = [
  { value: '1M', title: '1 Month' },
  { value: '3M', title: '3 Months' },
  { value: '6M', title: '6 Months' },
  { value: '1Y', title: '1 Year' },
  { value: '3Y', title: '3 Years' },
  { value: '5Y', title: '5 Years' },
  { value: 'ALL', title: 'All Time' },
]

const isLoading = computed(() => {
  switch (selectedReport.value) {
    case 'portfolio':
      return portfolioReport.isLoading.value
    case 'tax':
      return taxReport.isLoading.value
    case 'performance':
      return performanceReport.isLoading.value
    case '80c':
      return section80CStatus.isLoading.value
    case 'retirement':
      return retirementProjection.isLoading.value
    default:
      return false
  }
})

const portfolioMetrics = computed(() => {
  const data = portfolioReport.data.value
  if (!data) return []

  return [
    {
      label: 'Total Portfolio',
      value: data.summary.totalPortfolioValue,
      format: 'currencyCompact' as const,
      icon: 'mdi-wallet',
      color: 'primary',
    },
    {
      label: 'Total Invested',
      value: data.summary.totalInvested,
      format: 'currencyCompact' as const,
      icon: 'mdi-cash-multiple',
    },
    {
      label: 'Total Returns',
      value: data.summary.absoluteReturn,
      format: 'currencyCompact' as const,
      change: data.summary.absoluteReturnPercent,
      icon: 'mdi-trending-up',
      color: data.summary.absoluteReturn >= 0 ? 'success' : 'error',
    },
    {
      label: 'XIRR',
      value: data.summary.absoluteReturnPercent,
      format: 'percent' as const,
      icon: 'mdi-percent',
      color: 'info',
    },
  ]
})

function getCurrentFY(): string {
  const now = new Date()
  const month = now.getMonth()
  const year = now.getFullYear()
  const startYear = month >= 3 ? year : year - 1
  return `${startYear}-${String(startYear + 1).slice(-2)}`
}

async function exportReport(format: 'pdf' | 'excel' | 'csv') {
  isExporting.value = true

  try {
    // Simulate export delay
    await new Promise((resolve) => setTimeout(resolve, 1500))

    // In real implementation, this would call an API endpoint
    // that generates the report file and returns a download URL
    const reportName = reportTypes.find((r) => r.value === selectedReport.value)?.title
    console.log(`Exporting ${reportName} as ${format.toUpperCase()}...`)

    // Show success message
    alert(`${reportName} exported as ${format.toUpperCase()} successfully!`)
  } catch (error) {
    console.error('Export failed:', error)
    alert('Export failed. Please try again.')
  } finally {
    isExporting.value = false
  }
}

function refreshReport() {
  switch (selectedReport.value) {
    case 'portfolio':
      portfolioReport.refetch()
      break
    case 'tax':
      taxReport.refetch()
      break
    case 'performance':
      performanceReport.refetch()
      break
    case '80c':
      section80CStatus.refetch()
      break
    case 'retirement':
      retirementProjection.refetch()
      break
  }
}
</script>

<template>
  <div class="report-generator">
    <!-- Report Type Selection -->
    <v-card variant="outlined" class="mb-4">
      <v-card-text class="pa-4">
        <div class="d-flex flex-wrap align-center ga-3">
          <v-btn-toggle
            v-model="selectedReport"
            mandatory
            density="comfortable"
            color="primary"
          >
            <v-btn
              v-for="report in reportTypes"
              :key="report.value"
              :value="report.value"
              size="small"
            >
              <v-icon start :color="selectedReport === report.value ? report.color : undefined">
                {{ report.icon }}
              </v-icon>
              {{ report.title }}
            </v-btn>
          </v-btn-toggle>

          <v-spacer />

          <!-- Filters based on report type -->
          <v-select
            v-if="selectedReport === 'tax'"
            v-model="selectedFY"
            :items="financialYears"
            label="Financial Year"
            density="compact"
            variant="outlined"
            hide-details
            style="max-width: 150px;"
          />

          <v-select
            v-if="selectedReport === 'performance'"
            v-model="selectedPeriod"
            :items="periods"
            item-title="title"
            item-value="value"
            label="Period"
            density="compact"
            variant="outlined"
            hide-details
            style="max-width: 150px;"
          />

          <!-- Action buttons -->
          <v-btn
            icon
            variant="text"
            :loading="isLoading"
            @click="refreshReport"
          >
            <v-icon>mdi-refresh</v-icon>
            <v-tooltip activator="parent" location="top">Refresh</v-tooltip>
          </v-btn>

          <v-menu>
            <template #activator="{ props }">
              <v-btn
                v-bind="props"
                color="primary"
                :loading="isExporting"
              >
                <v-icon start>mdi-download</v-icon>
                Export
              </v-btn>
            </template>
            <v-list density="compact">
              <v-list-item @click="exportReport('pdf')">
                <template #prepend>
                  <v-icon color="error">mdi-file-pdf-box</v-icon>
                </template>
                <v-list-item-title>Export as PDF</v-list-item-title>
              </v-list-item>
              <v-list-item @click="exportReport('excel')">
                <template #prepend>
                  <v-icon color="success">mdi-microsoft-excel</v-icon>
                </template>
                <v-list-item-title>Export as Excel</v-list-item-title>
              </v-list-item>
              <v-list-item @click="exportReport('csv')">
                <template #prepend>
                  <v-icon color="info">mdi-file-delimited</v-icon>
                </template>
                <v-list-item-title>Export as CSV</v-list-item-title>
              </v-list-item>
            </v-list>
          </v-menu>
        </div>
      </v-card-text>
    </v-card>

    <!-- Report Content -->
    <v-fade-transition mode="out-in">
      <!-- Portfolio Summary Report -->
      <div v-if="selectedReport === 'portfolio'" key="portfolio">
        <InvestmentMetricsCards
          :metrics="portfolioMetrics"
          :loading="portfolioReport.isLoading.value"
          :columns="4"
          class="mb-4"
        />

        <v-row v-if="portfolioReport.data.value">
          <!-- Breakdown by Type -->
          <v-col cols="12" md="6">
            <v-card variant="outlined">
              <v-card-title>
                <v-icon start>mdi-shape</v-icon>
                Breakdown by Type
              </v-card-title>
              <v-card-text>
                <v-list density="compact">
                  <v-list-item
                    v-for="[key, data] in Object.entries(portfolioReport.data.value.breakdown)"
                    :key="key"
                  >
                    <template #prepend>
                      <v-progress-circular
                        :model-value="data?.percentage || 0"
                        :size="32"
                        :width="3"
                        color="primary"
                      >
                        <span class="text-caption">
                          {{ (data?.percentage || 0).toFixed(0) }}%
                        </span>
                      </v-progress-circular>
                    </template>
                    <v-list-item-title class="text-capitalize">{{ key }}</v-list-item-title>
                    <template #append>
                      <span class="text-currency">
                        {{ formatINRCompact(data?.value || 0) }}
                      </span>
                    </template>
                  </v-list-item>
                </v-list>
              </v-card-text>
            </v-card>
          </v-col>

          <!-- Top Holdings -->
          <v-col cols="12" md="6">
            <v-card variant="outlined">
              <v-card-title>
                <v-icon start>mdi-trophy</v-icon>
                Top Holdings
              </v-card-title>
              <v-card-text>
                <v-list density="compact">
                  <v-list-item
                    v-for="holding in portfolioReport.data.value.topHoldings.slice(0, 5)"
                    :key="holding.name"
                  >
                    <v-list-item-title>{{ holding.name }}</v-list-item-title>
                    <v-list-item-subtitle>
                      {{ holding.type }} · {{ holding.allocation.toFixed(1) }}% of portfolio
                    </v-list-item-subtitle>
                    <template #append>
                      <div class="text-right">
                        <div class="text-currency">{{ formatINRCompact(holding.value) }}</div>
                        <div
                          class="text-caption"
                          :class="holding.returnsPercent >= 0 ? 'text-success' : 'text-error'"
                        >
                          {{ holding.returnsPercent >= 0 ? '+' : '' }}{{ holding.returnsPercent.toFixed(1) }}%
                        </div>
                      </div>
                    </template>
                  </v-list-item>
                </v-list>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>
      </div>

      <!-- Tax Report -->
      <TaxReportView
        v-else-if="selectedReport === 'tax'"
        key="tax"
        :report="taxReport.data.value || null"
        :loading="taxReport.isLoading.value"
      />

      <!-- Performance Report -->
      <div v-else-if="selectedReport === 'performance'" key="performance">
        <v-skeleton-loader v-if="performanceReport.isLoading.value" type="card" />

        <template v-else-if="performanceReport.data.value">
          <InvestmentMetricsCards
            :metrics="[
              { label: 'Total Return', value: performanceReport.data.value.summary.totalReturn, format: 'currencyCompact', change: performanceReport.data.value.summary.totalReturnPercent, icon: 'mdi-trending-up', color: 'success' },
              { label: 'CAGR', value: performanceReport.data.value.summary.cagr, format: 'percent', icon: 'mdi-chart-timeline-variant', color: 'primary' },
              { label: 'Benchmark', value: performanceReport.data.value.summary.benchmarkReturn || 0, format: 'percent', icon: 'mdi-flag', color: 'info' },
              { label: 'Alpha', value: performanceReport.data.value.summary.alpha || 0, format: 'percent', icon: 'mdi-alpha-a-circle', color: 'purple' },
            ]"
            :columns="4"
            class="mb-4"
          />

          <v-row>
            <v-col cols="12" md="6">
              <v-card variant="outlined">
                <v-card-title class="text-success">
                  <v-icon start>mdi-trophy</v-icon>
                  Top Performers
                </v-card-title>
                <v-card-text>
                  <v-list density="compact">
                    <v-list-item
                      v-for="item in performanceReport.data.value.topPerformers"
                      :key="item.name"
                    >
                      <v-list-item-title>{{ item.name }}</v-list-item-title>
                      <v-list-item-subtitle>{{ item.type }}</v-list-item-subtitle>
                      <template #append>
                        <div class="text-right">
                          <div class="text-success font-weight-bold">+{{ item.returnPercent.toFixed(1) }}%</div>
                          <div class="text-caption text-currency">{{ formatINRCompact(item.absoluteReturn) }}</div>
                        </div>
                      </template>
                    </v-list-item>
                  </v-list>
                </v-card-text>
              </v-card>
            </v-col>

            <v-col cols="12" md="6">
              <v-card variant="outlined">
                <v-card-title class="text-error">
                  <v-icon start>mdi-trending-down</v-icon>
                  Bottom Performers
                </v-card-title>
                <v-card-text>
                  <v-list density="compact">
                    <v-list-item
                      v-for="item in performanceReport.data.value.bottomPerformers"
                      :key="item.name"
                    >
                      <v-list-item-title>{{ item.name }}</v-list-item-title>
                      <v-list-item-subtitle>{{ item.type }}</v-list-item-subtitle>
                      <template #append>
                        <div class="text-right">
                          <div class="text-error font-weight-bold">{{ item.returnPercent.toFixed(1) }}%</div>
                          <div class="text-caption text-currency">{{ formatINRCompact(item.absoluteReturn) }}</div>
                        </div>
                      </template>
                    </v-list-item>
                  </v-list>
                </v-card-text>
              </v-card>
            </v-col>
          </v-row>
        </template>
      </div>

      <!-- 80C Status -->
      <div v-else-if="selectedReport === '80c'" key="80c">
        <v-skeleton-loader v-if="section80CStatus.isLoading.value" type="card" />

        <template v-else-if="section80CStatus.data.value">
          <v-card variant="outlined" class="mb-4">
            <v-card-text class="pa-6">
              <div class="text-center mb-4">
                <div class="text-h4 text-currency mb-2">
                  {{ formatINR(section80CStatus.data.value.used) }}
                  <span class="text-h6 text-medium-emphasis">/ {{ formatINR(section80CStatus.data.value.limit) }}</span>
                </div>
                <div class="text-body-2 text-medium-emphasis">Section 80C Utilization</div>
              </div>

              <v-progress-linear
                :model-value="(section80CStatus.data.value.used / section80CStatus.data.value.limit) * 100"
                height="24"
                rounded
                :color="section80CStatus.data.value.used >= section80CStatus.data.value.limit ? 'success' : 'primary'"
              >
                <template #default>
                  <span class="text-white font-weight-medium">
                    {{ ((section80CStatus.data.value.used / section80CStatus.data.value.limit) * 100).toFixed(0) }}% Used
                  </span>
                </template>
              </v-progress-linear>

              <div class="d-flex justify-space-between mt-2">
                <span class="text-caption text-medium-emphasis">
                  Remaining: {{ formatINR(section80CStatus.data.value.remaining) }}
                </span>
                <span class="text-caption text-medium-emphasis">
                  Limit: {{ formatINR(section80CStatus.data.value.limit) }}
                </span>
              </div>
            </v-card-text>
          </v-card>

          <v-card variant="outlined">
            <v-card-title>
              <v-icon start>mdi-format-list-checks</v-icon>
              80C Components
            </v-card-title>
            <v-card-text>
              <v-list>
                <v-list-item
                  v-for="item in section80CStatus.data.value.items"
                  :key="item.category"
                >
                  <template #prepend>
                    <v-icon color="success">mdi-check-circle</v-icon>
                  </template>
                  <v-list-item-title>{{ item.category }}</v-list-item-title>
                  <v-list-item-subtitle>{{ item.source }}</v-list-item-subtitle>
                  <template #append>
                    <span class="text-currency font-weight-bold">{{ formatINR(item.amount) }}</span>
                  </template>
                </v-list-item>
              </v-list>
            </v-card-text>
          </v-card>
        </template>
      </div>

      <!-- Retirement Projection -->
      <div v-else-if="selectedReport === 'retirement'" key="retirement">
        <v-skeleton-loader v-if="retirementProjection.isLoading.value" type="card" />

        <template v-else-if="retirementProjection.data.value">
          <InvestmentMetricsCards
            :metrics="[
              { label: 'Current Corpus', value: retirementProjection.data.value.currentCorpus, format: 'currencyCompact', icon: 'mdi-piggy-bank', color: 'primary' },
              { label: 'Projected Corpus', value: retirementProjection.data.value.projectedCorpus, format: 'currencyCompact', icon: 'mdi-chart-timeline-variant', color: 'success' },
              { label: 'Monthly Pension', value: retirementProjection.data.value.monthlyPension, format: 'currencyCompact', icon: 'mdi-cash-multiple', color: 'info' },
              { label: 'Years to Retire', value: retirementProjection.data.value.yearsToRetirement, format: 'number', icon: 'mdi-calendar-clock', color: 'warning' },
            ]"
            :columns="4"
            class="mb-4"
          />

          <v-row>
            <v-col cols="12" md="6">
              <v-card variant="outlined">
                <v-card-title>
                  <v-icon start>mdi-account-clock</v-icon>
                  Timeline
                </v-card-title>
                <v-card-text>
                  <div class="d-flex justify-space-between mb-3">
                    <span>Current Age</span>
                    <span class="font-weight-bold">{{ retirementProjection.data.value.currentAge }} years</span>
                  </div>
                  <div class="d-flex justify-space-between mb-3">
                    <span>Retirement Age</span>
                    <span class="font-weight-bold">{{ retirementProjection.data.value.retirementAge }} years</span>
                  </div>
                  <div class="d-flex justify-space-between">
                    <span>Years to Retirement</span>
                    <v-chip color="primary" size="small">{{ retirementProjection.data.value.yearsToRetirement }} years</v-chip>
                  </div>
                </v-card-text>
              </v-card>
            </v-col>

            <v-col cols="12" md="6">
              <v-card variant="outlined">
                <v-card-title>
                  <v-icon start>mdi-cog</v-icon>
                  Assumptions
                </v-card-title>
                <v-card-text>
                  <div class="d-flex justify-space-between mb-3">
                    <span>Expected Return</span>
                    <span class="font-weight-bold text-success">{{ retirementProjection.data.value.assumptions.expectedReturn }}%</span>
                  </div>
                  <div class="d-flex justify-space-between mb-3">
                    <span>Inflation Rate</span>
                    <span class="font-weight-bold text-warning">{{ retirementProjection.data.value.assumptions.inflationRate }}%</span>
                  </div>
                  <div class="d-flex justify-space-between">
                    <span>Monthly Contribution</span>
                    <span class="font-weight-bold text-currency">{{ formatINR(retirementProjection.data.value.assumptions.monthlyContribution) }}</span>
                  </div>
                </v-card-text>
              </v-card>
            </v-col>
          </v-row>
        </template>
      </div>
    </v-fade-transition>
  </div>
</template>

<style scoped>
.report-generator {
  /* Component container styles */
}
</style>
