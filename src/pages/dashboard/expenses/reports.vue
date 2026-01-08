<script setup lang="ts">
import { ref, computed } from 'vue'
import SectionHeader from '@/components/shared/SectionHeader.vue'
import CategoryPieChart from '@/components/expenses/CategoryPieChart.vue'
import MonthlyTrendChart from '@/components/expenses/MonthlyTrendChart.vue'
import {
  useExpenses,
  useBudgets,
  formatINR,
  getCurrentMonth,
} from '@/composables/useExpenses'

const tabs = [
  { title: 'Overview', route: '/dashboard/expenses' },
  { title: 'Track', route: '/dashboard/expenses/track' },
  { title: 'Budgets', route: '/dashboard/expenses/budgets' },
  { title: 'Reports', route: '/dashboard/expenses/reports' },
]

// Report type
const reportType = ref<'monthly' | 'quarterly' | 'yearly' | 'custom'>('monthly')

// Date range
const selectedMonth = ref(getCurrentMonth())
const customStartDate = ref('')
const customEndDate = ref('')

// Fetch data
const { expenses, totalExpenses, expensesByCategory, isLoading } = useExpenses(selectedMonth)
const { currentBudget, budgetUsage } = useBudgets(selectedMonth)

// Month name
const monthName = computed(() => {
  const [year, month] = selectedMonth.value.split('-').map(Number)
  return new Date(year, month - 1).toLocaleString('en-IN', { month: 'long', year: 'numeric' })
})

// Mock trend data (in real app, would fetch from API)
const trendData = computed(() => {
  const months = []
  const now = new Date()

  for (let i = 5; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const monthStr = date.toLocaleString('en-IN', { month: 'short' })

    // Generate mock data (in real app, this would come from API)
    const total = Math.floor(Math.random() * 50000) + 30000
    months.push({
      month: monthStr,
      total,
      needs: Math.floor(total * 0.5),
      wants: Math.floor(total * 0.3),
      savings: Math.floor(total * 0.2),
    })
  }

  return months
})

// Top expenses
const topExpenses = computed(() => {
  if (!expenses.value) return []
  return [...expenses.value]
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 5)
})

// Payment method breakdown
const paymentMethodBreakdown = computed(() => {
  if (!expenses.value) return {}
  return expenses.value.reduce(
    (acc, expense) => {
      const method = expense.paymentMethod || 'Other'
      acc[method] = (acc[method] || 0) + expense.amount
      return acc
    },
    {} as Record<string, number>
  )
})

// Export functions
const exportToCSV = () => {
  if (!expenses.value) return

  const headers = ['Date', 'Description', 'Category', 'Amount', 'Merchant', 'Payment Method']
  const rows = expenses.value.map((e) => [
    e.date,
    e.description,
    e.category,
    e.amount.toString(),
    e.merchant || '',
    e.paymentMethod || '',
  ])

  const csvContent = [headers, ...rows].map((row) => row.join(',')).join('\n')
  downloadFile(csvContent, `expenses-${selectedMonth.value}.csv`, 'text/csv')
}

const exportToJSON = () => {
  if (!expenses.value) return
  const jsonContent = JSON.stringify(expenses.value, null, 2)
  downloadFile(jsonContent, `expenses-${selectedMonth.value}.json`, 'application/json')
}

const downloadFile = (content: string, filename: string, mimeType: string) => {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

// Print report
const printReport = () => {
  window.print()
}

// Month options for selector
const monthOptions = computed(() => {
  const options = []
  const now = new Date()

  for (let i = 0; i < 12; i++) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
    options.push({
      title: date.toLocaleString('en-IN', { month: 'long', year: 'numeric' }),
      value: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`,
    })
  }

  return options
})

// Navigation
const goToPreviousMonth = () => {
  const [year, month] = selectedMonth.value.split('-').map(Number)
  const date = new Date(year, month - 2, 1)
  selectedMonth.value = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

const goToNextMonth = () => {
  const [year, month] = selectedMonth.value.split('-').map(Number)
  const date = new Date(year, month, 1)
  selectedMonth.value = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}
</script>

<template>
  <div>
    <SectionHeader
      title="Expenses"
      subtitle="Expense reports and analytics"
      icon="mdi-cart-outline"
      :tabs="tabs"
    />

    <!-- Report Controls -->
    <v-card class="mb-6" variant="outlined">
      <v-card-text>
        <v-row align="center">
          <!-- Report Type -->
          <v-col cols="12" sm="4">
            <v-btn-toggle v-model="reportType" mandatory density="compact" color="primary">
              <v-btn value="monthly" size="small">Monthly</v-btn>
              <v-btn value="quarterly" size="small">Quarterly</v-btn>
              <v-btn value="yearly" size="small">Yearly</v-btn>
              <v-btn value="custom" size="small">Custom</v-btn>
            </v-btn-toggle>
          </v-col>

          <!-- Date Selection -->
          <v-col cols="12" sm="4">
            <template v-if="reportType === 'monthly'">
              <div class="d-flex align-center">
                <v-btn icon="mdi-chevron-left" variant="text" size="small" @click="goToPreviousMonth" />
                <v-select
                  v-model="selectedMonth"
                  :items="monthOptions"
                  item-title="title"
                  item-value="value"
                  density="compact"
                  hide-details
                  variant="outlined"
                  style="min-width: 180px"
                />
                <v-btn icon="mdi-chevron-right" variant="text" size="small" @click="goToNextMonth" />
              </div>
            </template>
            <template v-else-if="reportType === 'custom'">
              <div class="d-flex gap-2">
                <v-text-field
                  v-model="customStartDate"
                  type="date"
                  label="From"
                  density="compact"
                  hide-details
                />
                <v-text-field
                  v-model="customEndDate"
                  type="date"
                  label="To"
                  density="compact"
                  hide-details
                />
              </div>
            </template>
          </v-col>

          <!-- Export Actions -->
          <v-col cols="12" sm="4" class="text-right">
            <v-menu>
              <template #activator="{ props }">
                <v-btn variant="outlined" v-bind="props">
                  <v-icon icon="mdi-download" class="mr-1" />
                  Export
                </v-btn>
              </template>
              <v-list density="compact">
                <v-list-item @click="exportToCSV">
                  <template #prepend>
                    <v-icon icon="mdi-file-delimited" />
                  </template>
                  <v-list-item-title>Export as CSV</v-list-item-title>
                </v-list-item>
                <v-list-item @click="exportToJSON">
                  <template #prepend>
                    <v-icon icon="mdi-code-json" />
                  </template>
                  <v-list-item-title>Export as JSON</v-list-item-title>
                </v-list-item>
                <v-list-item @click="printReport">
                  <template #prepend>
                    <v-icon icon="mdi-printer" />
                  </template>
                  <v-list-item-title>Print Report</v-list-item-title>
                </v-list-item>
              </v-list>
            </v-menu>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <!-- Loading State -->
    <div v-if="isLoading" class="text-center py-8">
      <v-progress-circular indeterminate color="primary" size="48" />
      <p class="mt-4 text-medium-emphasis">Loading report data...</p>
    </div>

    <template v-else>
      <!-- Report Header -->
      <v-card class="mb-6">
        <v-card-title class="d-flex align-center">
          <v-icon icon="mdi-file-chart" class="mr-2" />
          Expense Report - {{ monthName }}
        </v-card-title>
        <v-card-text>
          <v-row>
            <v-col cols="12" sm="6" md="3">
              <div class="text-body-2 text-medium-emphasis">Total Expenses</div>
              <div class="text-h4 font-weight-bold text-error">
                {{ formatINR(totalExpenses) }}
              </div>
            </v-col>
            <v-col cols="12" sm="6" md="3">
              <div class="text-body-2 text-medium-emphasis">Transactions</div>
              <div class="text-h4 font-weight-bold">
                {{ expenses?.length || 0 }}
              </div>
            </v-col>
            <v-col cols="12" sm="6" md="3">
              <div class="text-body-2 text-medium-emphasis">Avg. Transaction</div>
              <div class="text-h4 font-weight-bold">
                {{ formatINR(expenses?.length ? totalExpenses / expenses.length : 0) }}
              </div>
            </v-col>
            <v-col cols="12" sm="6" md="3">
              <div class="text-body-2 text-medium-emphasis">Budget Usage</div>
              <div class="text-h4 font-weight-bold" :class="budgetUsage && budgetUsage.total > 100 ? 'text-error' : 'text-success'">
                {{ budgetUsage?.total.toFixed(0) || '--' }}%
              </div>
            </v-col>
          </v-row>
        </v-card-text>
      </v-card>

      <!-- Charts Row -->
      <v-row class="mb-6">
        <!-- Category Breakdown -->
        <v-col cols="12" md="6">
          <CategoryPieChart
            :data="expensesByCategory"
            title="Spending by Category"
          />
        </v-col>

        <!-- Monthly Trend -->
        <v-col cols="12" md="6">
          <MonthlyTrendChart
            :data="trendData"
            title="6-Month Trend"
            show-breakdown
          />
        </v-col>
      </v-row>

      <!-- Details Row -->
      <v-row>
        <!-- Top Expenses -->
        <v-col cols="12" md="6">
          <v-card>
            <v-card-title>
              <v-icon icon="mdi-trending-up" class="mr-2" />
              Top Expenses
            </v-card-title>
            <v-card-text v-if="topExpenses.length === 0" class="text-center pa-8">
              <v-icon icon="mdi-receipt-text-outline" size="48" color="grey" />
              <p class="text-medium-emphasis mt-2">No expenses this month</p>
            </v-card-text>
            <v-list v-else lines="two">
              <v-list-item
                v-for="(expense, index) in topExpenses"
                :key="expense.id"
              >
                <template #prepend>
                  <v-avatar color="primary" variant="tonal" size="36">
                    <span class="font-weight-bold">{{ index + 1 }}</span>
                  </v-avatar>
                </template>
                <v-list-item-title>{{ expense.description }}</v-list-item-title>
                <v-list-item-subtitle>
                  {{ expense.category }} &bull; {{ new Date(expense.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) }}
                </v-list-item-subtitle>
                <template #append>
                  <span class="text-body-1 font-weight-bold text-error">
                    {{ formatINR(expense.amount) }}
                  </span>
                </template>
              </v-list-item>
            </v-list>
          </v-card>
        </v-col>

        <!-- Payment Methods -->
        <v-col cols="12" md="6">
          <v-card>
            <v-card-title>
              <v-icon icon="mdi-credit-card" class="mr-2" />
              Payment Methods
            </v-card-title>
            <v-card-text v-if="Object.keys(paymentMethodBreakdown).length === 0" class="text-center pa-8">
              <v-icon icon="mdi-credit-card-outline" size="48" color="grey" />
              <p class="text-medium-emphasis mt-2">No payment data</p>
            </v-card-text>
            <v-list v-else>
              <v-list-item
                v-for="(amount, method) in paymentMethodBreakdown"
                :key="method"
              >
                <template #prepend>
                  <v-avatar color="info" variant="tonal" size="36">
                    <v-icon
                      :icon="method === 'UPI' ? 'mdi-cellphone' : method === 'Credit Card' ? 'mdi-credit-card' : method === 'Cash' ? 'mdi-cash' : 'mdi-bank'"
                      size="18"
                    />
                  </v-avatar>
                </template>
                <v-list-item-title>{{ method }}</v-list-item-title>
                <v-list-item-subtitle>
                  {{ Math.round((amount / totalExpenses) * 100) }}% of total
                </v-list-item-subtitle>
                <template #append>
                  <span class="text-body-1 font-weight-bold">
                    {{ formatINR(amount) }}
                  </span>
                </template>
              </v-list-item>
            </v-list>
          </v-card>
        </v-col>
      </v-row>

      <!-- Budget vs Actual -->
      <v-card v-if="currentBudget" class="mt-6">
        <v-card-title>
          <v-icon icon="mdi-scale-balance" class="mr-2" />
          Budget vs Actual
        </v-card-title>
        <v-card-text>
          <v-row>
            <!-- Needs -->
            <v-col cols="12" md="4">
              <div class="text-center mb-3">
                <v-avatar color="blue" size="48">
                  <v-icon icon="mdi-home" />
                </v-avatar>
                <div class="text-subtitle-1 font-weight-medium mt-2">Needs (50%)</div>
              </div>
              <div class="d-flex justify-space-between mb-2">
                <span class="text-body-2">Budget</span>
                <span class="font-weight-medium">{{ formatINR(currentBudget.needsLimit) }}</span>
              </div>
              <div class="d-flex justify-space-between mb-2">
                <span class="text-body-2">Actual</span>
                <span class="font-weight-medium" :class="currentBudget.needsActual > currentBudget.needsLimit ? 'text-error' : ''">
                  {{ formatINR(currentBudget.needsActual) }}
                </span>
              </div>
              <v-progress-linear
                :model-value="currentBudget.needsLimit > 0 ? (currentBudget.needsActual / currentBudget.needsLimit) * 100 : 0"
                :color="currentBudget.needsActual > currentBudget.needsLimit ? 'error' : 'blue'"
                height="8"
                rounded
              />
              <div class="text-center mt-2">
                <v-chip
                  :color="currentBudget.needsActual <= currentBudget.needsLimit ? 'success' : 'error'"
                  size="small"
                >
                  {{ currentBudget.needsActual <= currentBudget.needsLimit ? 'Under Budget' : 'Over Budget' }}
                </v-chip>
              </div>
            </v-col>

            <!-- Wants -->
            <v-col cols="12" md="4">
              <div class="text-center mb-3">
                <v-avatar color="purple" size="48">
                  <v-icon icon="mdi-shopping" />
                </v-avatar>
                <div class="text-subtitle-1 font-weight-medium mt-2">Wants (30%)</div>
              </div>
              <div class="d-flex justify-space-between mb-2">
                <span class="text-body-2">Budget</span>
                <span class="font-weight-medium">{{ formatINR(currentBudget.wantsLimit) }}</span>
              </div>
              <div class="d-flex justify-space-between mb-2">
                <span class="text-body-2">Actual</span>
                <span class="font-weight-medium" :class="currentBudget.wantsActual > currentBudget.wantsLimit ? 'text-error' : ''">
                  {{ formatINR(currentBudget.wantsActual) }}
                </span>
              </div>
              <v-progress-linear
                :model-value="currentBudget.wantsLimit > 0 ? (currentBudget.wantsActual / currentBudget.wantsLimit) * 100 : 0"
                :color="currentBudget.wantsActual > currentBudget.wantsLimit ? 'error' : 'purple'"
                height="8"
                rounded
              />
              <div class="text-center mt-2">
                <v-chip
                  :color="currentBudget.wantsActual <= currentBudget.wantsLimit ? 'success' : 'error'"
                  size="small"
                >
                  {{ currentBudget.wantsActual <= currentBudget.wantsLimit ? 'Under Budget' : 'Over Budget' }}
                </v-chip>
              </div>
            </v-col>

            <!-- Savings -->
            <v-col cols="12" md="4">
              <div class="text-center mb-3">
                <v-avatar color="green" size="48">
                  <v-icon icon="mdi-piggy-bank" />
                </v-avatar>
                <div class="text-subtitle-1 font-weight-medium mt-2">Savings (20%)</div>
              </div>
              <div class="d-flex justify-space-between mb-2">
                <span class="text-body-2">Target</span>
                <span class="font-weight-medium">{{ formatINR(currentBudget.savingsLimit) }}</span>
              </div>
              <div class="d-flex justify-space-between mb-2">
                <span class="text-body-2">Actual</span>
                <span class="font-weight-medium text-success">
                  {{ formatINR(currentBudget.savingsActual) }}
                </span>
              </div>
              <v-progress-linear
                :model-value="currentBudget.savingsLimit > 0 ? (currentBudget.savingsActual / currentBudget.savingsLimit) * 100 : 0"
                color="green"
                height="8"
                rounded
              />
              <div class="text-center mt-2">
                <v-chip
                  :color="currentBudget.savingsActual >= currentBudget.savingsLimit ? 'success' : 'warning'"
                  size="small"
                >
                  {{ currentBudget.savingsActual >= currentBudget.savingsLimit ? 'Goal Met' : 'Keep Saving' }}
                </v-chip>
              </div>
            </v-col>
          </v-row>
        </v-card-text>
      </v-card>
    </template>
  </div>
</template>

<style>
@media print {
  .v-navigation-drawer,
  .v-app-bar,
  .section-header,
  .v-btn-toggle,
  .v-menu {
    display: none !important;
  }
}
</style>
