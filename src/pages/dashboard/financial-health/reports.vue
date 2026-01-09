<script setup lang="ts">
import { ref, computed } from 'vue'
import SectionHeader from '@/components/shared/SectionHeader.vue'
import HealthScoreGauge from '@/components/financial-health/HealthScoreGauge.vue'
import { useFinancialHealthScore, useNetWorth, useCashFlow, useEmergencyFund, formatINR } from '@/composables/useFinancialHealth'

const tabs = [
  { title: 'Health Score', route: '/dashboard/financial-health' },
  { title: 'Net Worth', route: '/dashboard/financial-health/net-worth' },
  { title: 'Cash Flow', route: '/dashboard/financial-health/cash-flow' },
  { title: 'Banking', route: '/dashboard/financial-health/banking' },
  { title: 'Emergency Fund', route: '/dashboard/financial-health/emergency-fund' },
  { title: 'Reports', route: '/dashboard/financial-health/reports' },
]

const { data: healthScore, isLoading: healthLoading } = useFinancialHealthScore()
const { data: netWorth, isLoading: netWorthLoading } = useNetWorth()
const { data: cashFlow, isLoading: cashFlowLoading } = useCashFlow()
const { data: emergencyFund, isLoading: efLoading } = useEmergencyFund()

const isLoading = computed(() => healthLoading.value || netWorthLoading.value || cashFlowLoading.value || efLoading.value)

// Report types
const reportTypes = [
  {
    id: 'health-score',
    title: 'Financial Health Score',
    description: 'Overall financial health assessment with factor breakdown',
    icon: 'mdi-heart-pulse',
    color: 'primary'
  },
  {
    id: 'net-worth',
    title: 'Net Worth Statement',
    description: 'Detailed breakdown of assets and liabilities',
    icon: 'mdi-chart-line',
    color: 'success'
  },
  {
    id: 'cash-flow',
    title: 'Cash Flow Summary',
    description: 'Monthly income, expenses, and savings analysis',
    icon: 'mdi-swap-vertical',
    color: 'info'
  },
  {
    id: 'emergency-fund',
    title: 'Emergency Fund Report',
    description: 'Emergency fund status and recommendations',
    icon: 'mdi-lifebuoy',
    color: 'warning'
  }
]

const selectedReport = ref('health-score')
const dateRange = ref('this-month')

const dateRangeOptions = [
  { title: 'This Month', value: 'this-month' },
  { title: 'Last 3 Months', value: '3-months' },
  { title: 'Last 6 Months', value: '6-months' },
  { title: 'This Year', value: 'this-year' },
  { title: 'Last Year', value: 'last-year' }
]

const currentDate = new Date().toLocaleDateString('en-IN', {
  day: 'numeric',
  month: 'long',
  year: 'numeric'
})

const handleExport = (format: 'pdf' | 'excel') => {
  // TODO: Implement export functionality
  console.log(`Exporting ${selectedReport.value} as ${format}`)
}
</script>

<template>
  <div>
    <SectionHeader
      title="Financial Health"
      subtitle="Generate and export financial reports"
      icon="mdi-heart-pulse"
      :tabs="tabs"
    />
    <v-row>
      <!-- Report Selection -->
      <v-col cols="12" md="4">
        <v-card class="h-100">
          <v-card-title>Report Types</v-card-title>
          <v-card-text>
            <v-list density="compact" nav>
              <v-list-item
                v-for="report in reportTypes"
                :key="report.id"
                :value="report.id"
                :active="selectedReport === report.id"
                :prepend-icon="report.icon"
                rounded="lg"
                @click="selectedReport = report.id"
              >
                <v-list-item-title>{{ report.title }}</v-list-item-title>
                <v-list-item-subtitle>{{ report.description }}</v-list-item-subtitle>
              </v-list-item>
            </v-list>
          </v-card-text>
        </v-card>
      </v-col>

      <!-- Report Preview -->
      <v-col cols="12" md="8">
        <v-card>
          <v-card-title class="d-flex align-center justify-space-between">
            <div class="d-flex align-center">
              <v-icon :icon="reportTypes.find(r => r.id === selectedReport)?.icon" class="mr-2" />
              {{ reportTypes.find(r => r.id === selectedReport)?.title }}
            </div>
            <div class="d-flex ga-2">
              <v-select
                v-model="dateRange"
                :items="dateRangeOptions"
                item-title="title"
                item-value="value"
                variant="outlined"
                density="compact"
                hide-details
                style="max-width: 180px"
              />
              <v-btn-group variant="outlined" density="compact">
                <v-btn prepend-icon="mdi-file-pdf-box" @click="handleExport('pdf')">PDF</v-btn>
                <v-btn prepend-icon="mdi-file-excel" @click="handleExport('excel')">Excel</v-btn>
              </v-btn-group>
            </div>
          </v-card-title>

          <v-divider />

          <!-- Loading State -->
          <div v-if="isLoading" class="text-center py-8">
            <v-progress-circular indeterminate color="primary" size="48" />
            <p class="text-body-2 text-medium-emphasis mt-4">Loading report data...</p>
          </div>

          <!-- Report Content -->
          <v-card-text v-else class="report-preview">
            <!-- Health Score Report -->
            <template v-if="selectedReport === 'health-score' && healthScore">
              <div class="report-header text-center mb-6">
                <div class="text-h5 font-weight-bold">Financial Health Report</div>
                <div class="text-body-2 text-medium-emphasis">Generated on {{ currentDate }}</div>
              </div>

              <div class="d-flex justify-center mb-6">
                <HealthScoreGauge :score="healthScore.overallScore" size="large" />
              </div>

              <v-table>
                <thead>
                  <tr>
                    <th>Factor</th>
                    <th class="text-center">Score</th>
                    <th>Status</th>
                    <th>Details</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="factor in healthScore.factors" :key="factor.name">
                    <td class="font-weight-medium">{{ factor.name }}</td>
                    <td class="text-center">{{ factor.score }}/{{ factor.maxScore }}</td>
                    <td>
                      <v-chip
                        :color="factor.status === 'excellent' ? 'success' : factor.status === 'good' ? 'primary' : factor.status === 'needs_improvement' ? 'warning' : 'error'"
                        size="small"
                      >
                        {{ factor.status.replace('_', ' ') }}
                      </v-chip>
                    </td>
                    <td class="text-body-2">{{ factor.description }}</td>
                  </tr>
                </tbody>
              </v-table>
            </template>

            <!-- Net Worth Report -->
            <template v-else-if="selectedReport === 'net-worth' && netWorth">
              <div class="report-header text-center mb-6">
                <div class="text-h5 font-weight-bold">Net Worth Statement</div>
                <div class="text-body-2 text-medium-emphasis">As of {{ currentDate }}</div>
              </div>

              <v-row class="mb-6">
                <v-col cols="12" sm="4">
                  <div class="text-center">
                    <div class="text-body-2 text-medium-emphasis">Total Assets</div>
                    <div class="text-h4 font-weight-bold text-success">{{ formatINR(netWorth.totalAssets, true) }}</div>
                  </div>
                </v-col>
                <v-col cols="12" sm="4">
                  <div class="text-center">
                    <div class="text-body-2 text-medium-emphasis">Total Liabilities</div>
                    <div class="text-h4 font-weight-bold text-error">{{ formatINR(netWorth.totalLiabilities, true) }}</div>
                  </div>
                </v-col>
                <v-col cols="12" sm="4">
                  <div class="text-center">
                    <div class="text-body-2 text-medium-emphasis">Net Worth</div>
                    <div class="text-h4 font-weight-bold text-primary">{{ formatINR(netWorth.netWorth, true) }}</div>
                  </div>
                </v-col>
              </v-row>

              <v-row>
                <v-col cols="12" md="6">
                  <div class="text-subtitle-1 font-weight-medium mb-2">Assets</div>
                  <v-table density="compact">
                    <tbody>
                      <tr v-for="asset in netWorth.assetBreakdown" :key="asset.category">
                        <td>{{ asset.category }}</td>
                        <td class="text-right font-weight-medium">{{ formatINR(asset.amount, true) }}</td>
                        <td class="text-right text-medium-emphasis">{{ asset.percentage.toFixed(1) }}%</td>
                      </tr>
                    </tbody>
                  </v-table>
                </v-col>
                <v-col cols="12" md="6">
                  <div class="text-subtitle-1 font-weight-medium mb-2">Liabilities</div>
                  <v-table density="compact">
                    <tbody>
                      <tr v-for="liability in netWorth.liabilityBreakdown" :key="liability.category">
                        <td>{{ liability.category }}</td>
                        <td class="text-right font-weight-medium">{{ formatINR(liability.amount, true) }}</td>
                        <td class="text-right text-medium-emphasis">{{ liability.percentage.toFixed(1) }}%</td>
                      </tr>
                    </tbody>
                  </v-table>
                </v-col>
              </v-row>
            </template>

            <!-- Cash Flow Report -->
            <template v-else-if="selectedReport === 'cash-flow' && cashFlow">
              <div class="report-header text-center mb-6">
                <div class="text-h5 font-weight-bold">Cash Flow Summary</div>
                <div class="text-body-2 text-medium-emphasis">{{ currentDate }}</div>
              </div>

              <v-row class="mb-6">
                <v-col cols="12" sm="4">
                  <div class="text-center">
                    <div class="text-body-2 text-medium-emphasis">Total Income</div>
                    <div class="text-h4 font-weight-bold text-success">{{ formatINR(cashFlow.totalIncome, true) }}</div>
                  </div>
                </v-col>
                <v-col cols="12" sm="4">
                  <div class="text-center">
                    <div class="text-body-2 text-medium-emphasis">Total Expenses</div>
                    <div class="text-h4 font-weight-bold text-error">{{ formatINR(cashFlow.totalExpenses, true) }}</div>
                  </div>
                </v-col>
                <v-col cols="12" sm="4">
                  <div class="text-center">
                    <div class="text-body-2 text-medium-emphasis">Net Savings</div>
                    <div class="text-h4 font-weight-bold text-primary">{{ formatINR(cashFlow.netCashFlow, true) }}</div>
                  </div>
                </v-col>
              </v-row>

              <div class="text-center mb-4">
                <v-chip color="primary" size="large">
                  Savings Rate: {{ cashFlow.savingsRate.toFixed(1) }}%
                </v-chip>
              </div>

              <v-row>
                <v-col cols="12" md="6">
                  <div class="text-subtitle-1 font-weight-medium mb-2">Income Sources</div>
                  <v-table density="compact">
                    <tbody>
                      <tr v-for="income in cashFlow.incomeBreakdown" :key="income.category">
                        <td>{{ income.category }}</td>
                        <td class="text-right font-weight-medium">{{ formatINR(income.amount, true) }}</td>
                      </tr>
                    </tbody>
                  </v-table>
                </v-col>
                <v-col cols="12" md="6">
                  <div class="text-subtitle-1 font-weight-medium mb-2">Expense Categories</div>
                  <v-table density="compact">
                    <tbody>
                      <tr v-for="expense in cashFlow.expenseBreakdown" :key="expense.category">
                        <td>{{ expense.category }}</td>
                        <td class="text-right font-weight-medium">{{ formatINR(expense.amount, true) }}</td>
                      </tr>
                    </tbody>
                  </v-table>
                </v-col>
              </v-row>
            </template>

            <!-- Emergency Fund Report -->
            <template v-else-if="selectedReport === 'emergency-fund' && emergencyFund">
              <div class="report-header text-center mb-6">
                <div class="text-h5 font-weight-bold">Emergency Fund Report</div>
                <div class="text-body-2 text-medium-emphasis">{{ currentDate }}</div>
              </div>

              <v-row class="mb-6">
                <v-col cols="12" sm="4">
                  <div class="text-center">
                    <div class="text-body-2 text-medium-emphasis">Current Amount</div>
                    <div class="text-h4 font-weight-bold text-primary">{{ formatINR(emergencyFund.currentAmount, true) }}</div>
                  </div>
                </v-col>
                <v-col cols="12" sm="4">
                  <div class="text-center">
                    <div class="text-body-2 text-medium-emphasis">Target Amount</div>
                    <div class="text-h4 font-weight-bold">{{ formatINR(emergencyFund.targetAmount, true) }}</div>
                  </div>
                </v-col>
                <v-col cols="12" sm="4">
                  <div class="text-center">
                    <div class="text-body-2 text-medium-emphasis">Progress</div>
                    <div class="text-h4 font-weight-bold">{{ emergencyFund.percentComplete }}%</div>
                  </div>
                </v-col>
              </v-row>

              <v-progress-linear
                :model-value="emergencyFund.percentComplete"
                :color="emergencyFund.status === 'excellent' ? 'success' : emergencyFund.status === 'adequate' ? 'primary' : emergencyFund.status === 'low' ? 'warning' : 'error'"
                height="24"
                rounded
                class="mb-6"
              >
                <template #default>
                  <span class="text-caption font-weight-medium">{{ emergencyFund.percentComplete }}% Complete</span>
                </template>
              </v-progress-linear>

              <div class="text-subtitle-1 font-weight-medium mb-2">Fund Breakdown</div>
              <v-table density="compact">
                <thead>
                  <tr>
                    <th>Source</th>
                    <th>Type</th>
                    <th>Liquidity</th>
                    <th class="text-right">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="source in emergencyFund.breakdown" :key="source.source">
                    <td>{{ source.source }}</td>
                    <td>{{ source.type.replace('_', ' ') }}</td>
                    <td>{{ source.liquidity }}</td>
                    <td class="text-right font-weight-medium">{{ formatINR(source.amount, true) }}</td>
                  </tr>
                </tbody>
              </v-table>
            </template>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </div>
</template>

<style scoped>
.report-preview {
  min-height: 400px;
}

.report-header {
  padding-bottom: 16px;
  border-bottom: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  margin-bottom: 24px;
}
</style>
