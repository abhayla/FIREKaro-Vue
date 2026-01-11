<script setup lang="ts">
import { computed } from 'vue'
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement } from 'chart.js'
import { Doughnut, Bar } from 'vue-chartjs'
import BudgetCard from '@/components/expenses/BudgetCard.vue'
import {
  useBudgets,
  useExpenses,
  formatINR,
  type Budget,
} from '@/composables/useExpenses'
import { barChartOptions, doughnutChartOptions } from '@/utils/chartTheme'

// Colors for charts
const budgetColors = {
  info: '#3b82f6',     // Blue
  warning: '#f97316',  // Orange
  success: '#10b981',  // Green
  error: '#ef4444',    // Red
}

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement)

const props = defineProps<{
  selectedMonth: string
}>()

const emit = defineEmits<{
  (e: 'edit-budget'): void
  (e: 'go-to-details'): void
}>()

// Fetch data
const { currentBudget, budgets, budgetUsage, isLoading } = useBudgets(computed(() => props.selectedMonth))
const { totalExpenses, expensesByCategory } = useExpenses(computed(() => props.selectedMonth))

// Month name for display
const monthName = computed(() => {
  const [year, month] = props.selectedMonth.split('-').map(Number)
  return new Date(year, month - 1).toLocaleString('en-IN', { month: 'long', year: 'numeric' })
})

// Category item type
interface CategoryItem {
  name: string
  amount: number
}

// Category breakdown type
interface CategoryBreakdown {
  needs: { categories: CategoryItem[]; total: number }
  wants: { categories: CategoryItem[]; total: number }
  savings: { categories: CategoryItem[]; total: number }
}

// Category breakdown for current budget
const categoryBreakdown = computed<CategoryBreakdown>(() => {
  const breakdown: CategoryBreakdown = {
    needs: { categories: [], total: 0 },
    wants: { categories: [], total: 0 },
    savings: { categories: [], total: 0 },
  }

  if (!expensesByCategory.value || !currentBudget.value) return breakdown

  // Map categories to budget types
  const needsCategories = ['Rent', 'Utilities', 'Groceries', 'Healthcare', 'Insurance', 'Transportation']
  const savingsCategories = ['Investments', 'Savings']

  for (const [category, amount] of Object.entries(expensesByCategory.value)) {
    const item = { name: category, amount }
    if (needsCategories.includes(category)) {
      breakdown.needs.categories.push(item)
      breakdown.needs.total += amount
    } else if (savingsCategories.includes(category)) {
      breakdown.savings.categories.push(item)
      breakdown.savings.total += amount
    } else {
      breakdown.wants.categories.push(item)
      breakdown.wants.total += amount
    }
  }

  return breakdown
})

// Budget trend chart data (last 6 months)
const budgetTrendData = computed(() => {
  if (!budgets.value) return { labels: [], datasets: [] }

  const sortedBudgets = [...budgets.value]
    .sort((a, b) => {
      const dateA = new Date(a.year, a.month - 1)
      const dateB = new Date(b.year, b.month - 1)
      return dateA.getTime() - dateB.getTime()
    })
    .slice(-6)

  return {
    labels: sortedBudgets.map((b) =>
      new Date(b.year, b.month - 1).toLocaleString('en-IN', { month: 'short' })
    ),
    datasets: [
      {
        label: 'Budget',
        data: sortedBudgets.map((b) => b.needsLimit + b.wantsLimit + b.savingsLimit),
        backgroundColor: budgetColors.info,
        borderRadius: 4,
      },
      {
        label: 'Actual',
        data: sortedBudgets.map((b) => b.needsActual + b.wantsActual + b.savingsActual),
        backgroundColor: budgetColors.error,
        borderRadius: 4,
      },
    ],
  }
})

const budgetTrendOptions = computed(() => ({
  ...barChartOptions,
  plugins: {
    legend: {
      display: true,
      position: 'top' as const,
    },
  },
  scales: {
    x: {
      grid: { display: false },
    },
    y: {
      beginAtZero: true,
      ticks: {
        callback: (value: string | number) => formatINR(Number(value)),
      },
    },
  },
}))

// 50/30/20 allocation chart
const allocationChartData = computed(() => {
  if (!currentBudget.value) {
    return {
      labels: ['Needs (50%)', 'Wants (30%)', 'Savings (20%)'],
      datasets: [
        {
          data: [50, 30, 20],
          backgroundColor: [budgetColors.info, budgetColors.warning, budgetColors.success],
          borderWidth: 0,
        },
      ],
    }
  }

  const budget = currentBudget.value
  const total = budget.needsLimit + budget.wantsLimit + budget.savingsLimit

  return {
    labels: ['Needs', 'Wants', 'Savings'],
    datasets: [
      {
        data: [budget.needsActual, budget.wantsActual, budget.savingsActual],
        backgroundColor: [budgetColors.info, budgetColors.warning, budgetColors.success],
        borderWidth: 0,
      },
    ],
  }
})

const allocationChartOptions = computed(() => ({
  ...doughnutChartOptions,
  cutout: '60%',
  plugins: {
    legend: {
      display: true,
      position: 'bottom' as const,
    },
    tooltip: {
      callbacks: {
        label: (context: { label: string; raw: unknown }) => {
          return `${context.label}: ${formatINR(context.raw as number)}`
        },
      },
    },
  },
}))

// Remaining budget
const remaining = computed(() => {
  if (!currentBudget.value) return 0
  return currentBudget.value.income - totalExpenses.value
})

// Budget health status
const budgetHealth = computed(() => {
  if (!budgetUsage.value) return { status: 'unknown', color: 'grey', icon: 'mdi-help-circle' }

  const usage = budgetUsage.value.total
  if (usage >= 100) {
    return { status: 'Over Budget', color: 'error', icon: 'mdi-alert-circle' }
  } else if (usage >= 90) {
    return { status: 'Critical', color: 'error', icon: 'mdi-alert' }
  } else if (usage >= 80) {
    return { status: 'Warning', color: 'warning', icon: 'mdi-alert-outline' }
  } else {
    return { status: 'Healthy', color: 'success', icon: 'mdi-check-circle' }
  }
})
</script>

<template>
  <div>
    <!-- Loading State -->
    <div v-if="isLoading" class="text-center py-8">
      <v-progress-circular indeterminate color="primary" size="48" />
      <p class="mt-4 text-medium-emphasis">Loading budget data...</p>
    </div>

    <!-- No Budget State -->
    <v-card v-else-if="!currentBudget" class="mb-6">
      <v-card-text class="text-center pa-8">
        <v-icon icon="mdi-chart-pie" size="80" color="primary" class="mb-4" />
        <h2 class="text-h5 mb-2">No Budget for {{ monthName }}</h2>
        <p class="text-medium-emphasis mb-6">
          Create a budget to track your spending using the 50/30/20 rule.
        </p>

        <!-- 50/30/20 Explanation -->
        <v-row class="mb-6" justify="center">
          <v-col cols="12" sm="4">
            <v-card variant="tonal" color="blue" class="pa-4">
              <v-icon icon="mdi-home" size="32" />
              <div class="text-h4 font-weight-bold my-2">50%</div>
              <div class="text-subtitle-1 font-weight-medium">Needs</div>
              <div class="text-caption">
                Essential expenses like rent, groceries, utilities
              </div>
            </v-card>
          </v-col>
          <v-col cols="12" sm="4">
            <v-card variant="tonal" color="purple" class="pa-4">
              <v-icon icon="mdi-shopping" size="32" />
              <div class="text-h4 font-weight-bold my-2">30%</div>
              <div class="text-subtitle-1 font-weight-medium">Wants</div>
              <div class="text-caption">
                Discretionary spending like dining, entertainment
              </div>
            </v-card>
          </v-col>
          <v-col cols="12" sm="4">
            <v-card variant="tonal" color="green" class="pa-4">
              <v-icon icon="mdi-piggy-bank" size="32" />
              <div class="text-h4 font-weight-bold my-2">20%</div>
              <div class="text-subtitle-1 font-weight-medium">Savings</div>
              <div class="text-caption">
                Savings, investments, and debt repayment
              </div>
            </v-card>
          </v-col>
        </v-row>

        <v-btn color="primary" size="large" @click="emit('go-to-details')">
          <v-icon icon="mdi-plus" class="mr-2" />
          Create Budget for {{ monthName }}
        </v-btn>
      </v-card-text>
    </v-card>

    <!-- Budget Overview Content -->
    <template v-else>
      <!-- Summary Cards -->
      <v-row class="mb-6">
        <v-col cols="12" sm="6" md="3">
          <v-card class="pa-4" variant="elevated">
            <div class="d-flex align-center mb-2">
              <v-avatar color="success" variant="tonal" size="36">
                <v-icon icon="mdi-currency-inr" size="20" />
              </v-avatar>
              <span class="text-body-2 text-medium-emphasis ml-2">Monthly Income</span>
            </div>
            <div class="text-h5 font-weight-bold text-success">
              {{ formatINR(currentBudget.income) }}
            </div>
          </v-card>
        </v-col>
        <v-col cols="12" sm="6" md="3">
          <v-card class="pa-4" variant="elevated">
            <div class="d-flex align-center mb-2">
              <v-avatar color="error" variant="tonal" size="36">
                <v-icon icon="mdi-cart-outline" size="20" />
              </v-avatar>
              <span class="text-body-2 text-medium-emphasis ml-2">Total Spent</span>
            </div>
            <div class="text-h5 font-weight-bold text-error">
              {{ formatINR(totalExpenses) }}
            </div>
          </v-card>
        </v-col>
        <v-col cols="12" sm="6" md="3">
          <v-card class="pa-4" variant="elevated">
            <div class="d-flex align-center mb-2">
              <v-avatar :color="remaining >= 0 ? 'success' : 'error'" variant="tonal" size="36">
                <v-icon icon="mdi-wallet-outline" size="20" />
              </v-avatar>
              <span class="text-body-2 text-medium-emphasis ml-2">Remaining</span>
            </div>
            <div class="text-h5 font-weight-bold" :class="remaining >= 0 ? 'text-success' : 'text-error'">
              {{ formatINR(remaining) }}
            </div>
          </v-card>
        </v-col>
        <v-col cols="12" sm="6" md="3">
          <v-card class="pa-4" variant="elevated">
            <div class="d-flex align-center mb-2">
              <v-avatar :color="budgetHealth.color" variant="tonal" size="36">
                <v-icon :icon="budgetHealth.icon" size="20" />
              </v-avatar>
              <span class="text-body-2 text-medium-emphasis ml-2">Budget Health</span>
            </div>
            <div class="d-flex align-center">
              <span class="text-h6 font-weight-bold" :class="`text-${budgetHealth.color}`">
                {{ budgetUsage?.total.toFixed(0) || 0 }}% Used
              </span>
              <v-chip size="x-small" :color="budgetHealth.color" variant="tonal" class="ml-2">
                {{ budgetHealth.status }}
              </v-chip>
            </div>
          </v-card>
        </v-col>
      </v-row>

      <!-- Main Content Row -->
      <v-row class="mb-6">
        <!-- Budget Card (50/30/20 Progress) -->
        <v-col cols="12" md="6">
          <BudgetCard :budget="currentBudget" @edit="emit('edit-budget')" />
        </v-col>

        <!-- Allocation Breakdown Chart -->
        <v-col cols="12" md="6">
          <v-card>
            <v-card-title class="d-flex align-center">
              <v-icon icon="mdi-chart-donut" class="mr-2" />
              Spending Distribution
            </v-card-title>
            <v-card-text>
              <div style="height: 280px" class="d-flex justify-center align-center">
                <Doughnut :data="allocationChartData" :options="allocationChartOptions" />
              </div>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <!-- Category Breakdown + Trend Chart -->
      <v-row class="mb-6">
        <!-- Category Breakdown -->
        <v-col cols="12" md="6">
          <v-card>
            <v-card-title>
              <v-icon icon="mdi-tag-multiple" class="mr-2" />
              Category Breakdown
            </v-card-title>
            <v-card-text>
              <!-- Needs -->
              <div class="mb-4">
                <div class="d-flex align-center mb-2">
                  <v-avatar color="blue" size="24" class="mr-2">
                    <v-icon icon="mdi-home" size="14" />
                  </v-avatar>
                  <span class="font-weight-medium">Needs</span>
                  <v-spacer />
                  <span class="font-weight-bold">
                    {{ formatINR(categoryBreakdown.needs?.total || 0) }}
                  </span>
                </div>
                <div v-if="categoryBreakdown.needs?.categories?.length" class="ml-8">
                  <div
                    v-for="cat in categoryBreakdown.needs.categories.slice(0, 3)"
                    :key="cat.name"
                    class="d-flex justify-space-between text-body-2 py-1"
                  >
                    <span class="text-medium-emphasis">{{ cat.name }}</span>
                    <span>{{ formatINR(cat.amount) }}</span>
                  </div>
                  <div v-if="categoryBreakdown.needs.categories.length > 3" class="text-caption text-medium-emphasis">
                    +{{ categoryBreakdown.needs.categories.length - 3 }} more
                  </div>
                </div>
                <div v-else class="ml-8 text-caption text-medium-emphasis">
                  No expenses in this category
                </div>
              </div>

              <v-divider class="my-3" />

              <!-- Wants -->
              <div class="mb-4">
                <div class="d-flex align-center mb-2">
                  <v-avatar color="purple" size="24" class="mr-2">
                    <v-icon icon="mdi-shopping" size="14" />
                  </v-avatar>
                  <span class="font-weight-medium">Wants</span>
                  <v-spacer />
                  <span class="font-weight-bold">
                    {{ formatINR(categoryBreakdown.wants?.total || 0) }}
                  </span>
                </div>
                <div v-if="categoryBreakdown.wants?.categories?.length" class="ml-8">
                  <div
                    v-for="cat in categoryBreakdown.wants.categories.slice(0, 3)"
                    :key="cat.name"
                    class="d-flex justify-space-between text-body-2 py-1"
                  >
                    <span class="text-medium-emphasis">{{ cat.name }}</span>
                    <span>{{ formatINR(cat.amount) }}</span>
                  </div>
                  <div v-if="categoryBreakdown.wants.categories.length > 3" class="text-caption text-medium-emphasis">
                    +{{ categoryBreakdown.wants.categories.length - 3 }} more
                  </div>
                </div>
                <div v-else class="ml-8 text-caption text-medium-emphasis">
                  No expenses in this category
                </div>
              </div>

              <v-divider class="my-3" />

              <!-- Savings -->
              <div>
                <div class="d-flex align-center mb-2">
                  <v-avatar color="green" size="24" class="mr-2">
                    <v-icon icon="mdi-piggy-bank" size="14" />
                  </v-avatar>
                  <span class="font-weight-medium">Savings</span>
                  <v-spacer />
                  <span class="font-weight-bold">
                    {{ formatINR(categoryBreakdown.savings?.total || 0) }}
                  </span>
                </div>
                <div v-if="categoryBreakdown.savings?.categories?.length" class="ml-8">
                  <div
                    v-for="cat in categoryBreakdown.savings.categories.slice(0, 3)"
                    :key="cat.name"
                    class="d-flex justify-space-between text-body-2 py-1"
                  >
                    <span class="text-medium-emphasis">{{ cat.name }}</span>
                    <span>{{ formatINR(cat.amount) }}</span>
                  </div>
                </div>
                <div v-else class="ml-8 text-caption text-medium-emphasis">
                  No expenses in this category
                </div>
              </div>
            </v-card-text>
          </v-card>
        </v-col>

        <!-- Budget Trend Chart -->
        <v-col cols="12" md="6">
          <v-card>
            <v-card-title>
              <v-icon icon="mdi-chart-bar" class="mr-2" />
              Budget vs Actual Trend
            </v-card-title>
            <v-card-text>
              <div v-if="budgetTrendData.labels.length > 1" style="height: 280px">
                <Bar :data="budgetTrendData" :options="budgetTrendOptions" />
              </div>
              <div v-else class="text-center pa-8 text-medium-emphasis">
                <v-icon icon="mdi-chart-bar" size="48" color="grey" class="mb-2" />
                <p>Not enough data for trend chart.<br />Create budgets for more months to see trends.</p>
              </div>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <!-- Quick Actions -->
      <v-card variant="outlined">
        <v-card-text class="d-flex align-center justify-space-between flex-wrap ga-2">
          <div>
            <div class="text-subtitle-2">Need to adjust your budget?</div>
            <div class="text-body-2 text-medium-emphasis">
              Update allocations or view budget history in Budget Details
            </div>
          </div>
          <div class="d-flex ga-2">
            <v-btn variant="outlined" @click="emit('edit-budget')">
              <v-icon icon="mdi-pencil" class="mr-1" />
              Edit Budget
            </v-btn>
            <v-btn color="primary" @click="emit('go-to-details')">
              <v-icon icon="mdi-history" class="mr-1" />
              View History
            </v-btn>
          </div>
        </v-card-text>
      </v-card>
    </template>
  </div>
</template>
