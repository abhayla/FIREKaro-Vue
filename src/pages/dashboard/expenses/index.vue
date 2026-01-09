<script setup lang="ts">
import { ref, computed } from 'vue'
import SectionHeader from '@/components/shared/SectionHeader.vue'
import FamilyToggle from '@/components/shared/FamilyToggle.vue'
import ExpenseFilters from '@/components/expenses/ExpenseFilters.vue'
import BudgetCard from '@/components/expenses/BudgetCard.vue'
import CategoryPieChart from '@/components/expenses/CategoryPieChart.vue'
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
  { title: 'Categories', route: '/dashboard/expenses/categories' },
]

// Current month filter
const selectedMonth = ref(getCurrentMonth())

// Fetch data
const { expenses, totalExpenses, expensesByCategory, topCategory, isLoading } =
  useExpenses(selectedMonth)
const { currentBudget, budgetUsage, isLoading: budgetsLoading } = useBudgets(selectedMonth)

// Month name
const monthName = computed(() => {
  const [year, month] = selectedMonth.value.split('-').map(Number)
  return new Date(year, month - 1).toLocaleString('en-IN', { month: 'long', year: 'numeric' })
})

// Recent expenses (last 5)
const recentExpenses = computed(() => {
  if (!expenses.value) return []
  return [...expenses.value]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5)
})

// Format date
const formatDate = (date: string) =>
  new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short' }).format(new Date(date))
</script>

<template>
  <div>
    <SectionHeader
      title="Expenses"
      subtitle="Track and manage your spending"
      icon="mdi-cart-outline"
      :tabs="tabs"
    />

    <FamilyToggle class="mb-6" />

    <!-- Month Filter -->
    <ExpenseFilters v-model:month="selectedMonth" class="mb-6" />

    <!-- Loading State -->
    <div v-if="isLoading || budgetsLoading" class="text-center py-8">
      <v-progress-circular indeterminate color="primary" size="48" />
      <p class="mt-4 text-medium-emphasis">Loading expense data...</p>
    </div>

    <template v-else>
      <!-- Summary Cards -->
      <v-row class="mb-6">
        <!-- Total Expenses -->
        <v-col cols="12" sm="6" md="3">
          <v-card class="pa-4" variant="elevated">
            <div class="d-flex align-center mb-2">
              <v-avatar color="error" variant="tonal" size="40">
                <v-icon icon="mdi-cash-minus" />
              </v-avatar>
              <v-spacer />
              <v-chip size="x-small" color="error" variant="tonal">
                {{ monthName }}
              </v-chip>
            </div>
            <div class="text-body-2 text-medium-emphasis">Total Spent</div>
            <div class="text-h5 font-weight-bold text-error">
              {{ formatINR(totalExpenses) }}
            </div>
            <div class="text-caption text-medium-emphasis mt-1">
              {{ expenses?.length || 0 }} transactions
            </div>
          </v-card>
        </v-col>

        <!-- Budget Used -->
        <v-col cols="12" sm="6" md="3">
          <v-card class="pa-4" variant="elevated">
            <div class="d-flex align-center mb-2">
              <v-avatar
                :color="budgetUsage && budgetUsage.total >= 80 ? 'warning' : 'success'"
                variant="tonal"
                size="40"
              >
                <v-icon icon="mdi-chart-pie" />
              </v-avatar>
            </div>
            <div class="text-body-2 text-medium-emphasis">Budget Used</div>
            <div class="text-h5 font-weight-bold">
              <template v-if="budgetUsage">
                {{ budgetUsage.total.toFixed(0) }}%
              </template>
              <template v-else>--</template>
            </div>
            <v-progress-linear
              v-if="budgetUsage"
              :model-value="budgetUsage.total"
              :color="budgetUsage.total >= 100 ? 'error' : budgetUsage.total >= 80 ? 'warning' : 'success'"
              height="4"
              rounded
              class="mt-2"
            />
            <div v-else class="text-caption text-medium-emphasis mt-1">
              No budget set
            </div>
          </v-card>
        </v-col>

        <!-- Top Category -->
        <v-col cols="12" sm="6" md="3">
          <v-card class="pa-4" variant="elevated">
            <div class="d-flex align-center mb-2">
              <v-avatar color="primary" variant="tonal" size="40">
                <v-icon icon="mdi-tag" />
              </v-avatar>
            </div>
            <div class="text-body-2 text-medium-emphasis">Top Category</div>
            <div class="text-h6 font-weight-bold">
              {{ topCategory?.name || 'No data' }}
            </div>
            <div v-if="topCategory" class="text-caption text-medium-emphasis mt-1">
              {{ formatINR(topCategory.amount) }}
            </div>
          </v-card>
        </v-col>

        <!-- Average Daily -->
        <v-col cols="12" sm="6" md="3">
          <v-card class="pa-4" variant="elevated">
            <div class="d-flex align-center mb-2">
              <v-avatar color="info" variant="tonal" size="40">
                <v-icon icon="mdi-calendar-today" />
              </v-avatar>
            </div>
            <div class="text-body-2 text-medium-emphasis">Daily Average</div>
            <div class="text-h5 font-weight-bold">
              {{ formatINR(Math.round(totalExpenses / 30)) }}
            </div>
            <div class="text-caption text-medium-emphasis mt-1">
              Per day this month
            </div>
          </v-card>
        </v-col>
      </v-row>

      <!-- Main Content -->
      <v-row>
        <!-- Budget Progress (if exists) -->
        <v-col v-if="currentBudget" cols="12" md="6">
          <BudgetCard :budget="currentBudget" @edit="$router.push('/dashboard/expenses/budgets')" />
        </v-col>

        <!-- No Budget Alert -->
        <v-col v-else cols="12" md="6">
          <v-card>
            <v-card-text class="text-center pa-8">
              <v-icon icon="mdi-chart-pie" size="64" color="grey" />
              <h3 class="text-h6 mt-4">No Budget Set</h3>
              <p class="text-medium-emphasis mt-2">
                Create a budget to track your spending against your 50/30/20 goals.
              </p>
              <v-btn
                color="primary"
                class="mt-4"
                @click="$router.push('/dashboard/expenses/budgets')"
              >
                <v-icon icon="mdi-plus" class="mr-1" />
                Create Budget
              </v-btn>
            </v-card-text>
          </v-card>
        </v-col>

        <!-- Category Breakdown -->
        <v-col cols="12" md="6">
          <CategoryPieChart
            :data="expensesByCategory"
            title="Spending by Category"
          />
        </v-col>
      </v-row>

      <!-- Recent Expenses -->
      <v-card class="mt-6">
        <v-card-title class="d-flex align-center">
          <v-icon icon="mdi-clock-outline" class="mr-2" />
          Recent Expenses
          <v-spacer />
          <v-btn
            variant="text"
            color="primary"
            size="small"
            @click="$router.push('/dashboard/expenses/track')"
          >
            View All
          </v-btn>
        </v-card-title>

        <v-card-text v-if="recentExpenses.length === 0" class="text-center pa-8">
          <v-icon icon="mdi-receipt-text-outline" size="48" color="grey" />
          <p class="text-medium-emphasis mt-2">No expenses this month</p>
          <v-btn
            color="primary"
            class="mt-4"
            @click="$router.push('/dashboard/expenses/track')"
          >
            <v-icon icon="mdi-plus" class="mr-1" />
            Add Expense
          </v-btn>
        </v-card-text>

        <v-list v-else lines="two">
          <v-list-item
            v-for="expense in recentExpenses"
            :key="expense.id"
            :title="expense.description"
            :subtitle="`${expense.category} • ${formatDate(expense.date)}`"
          >
            <template #prepend>
              <v-avatar color="primary" variant="tonal" size="40">
                <v-icon icon="mdi-cash" size="20" />
              </v-avatar>
            </template>
            <template #append>
              <span class="text-body-1 font-weight-bold text-error">
                -{{ formatINR(expense.amount) }}
              </span>
            </template>
          </v-list-item>
        </v-list>
      </v-card>

      <!-- Quick Actions -->
      <v-card class="mt-6">
        <v-card-title>
          <v-icon icon="mdi-lightning-bolt" class="mr-2" />
          Quick Actions
        </v-card-title>
        <v-card-text>
          <v-row>
            <v-col cols="6" sm="3">
              <v-btn
                block
                variant="outlined"
                class="pa-6"
                @click="$router.push('/dashboard/expenses/track')"
              >
                <div class="text-center">
                  <v-icon icon="mdi-plus-circle" size="32" color="primary" />
                  <div class="mt-2 text-body-2">Add Expense</div>
                </div>
              </v-btn>
            </v-col>
            <v-col cols="6" sm="3">
              <v-btn
                block
                variant="outlined"
                class="pa-6"
                @click="$router.push('/dashboard/expenses/budgets')"
              >
                <div class="text-center">
                  <v-icon icon="mdi-chart-pie" size="32" color="success" />
                  <div class="mt-2 text-body-2">Set Budget</div>
                </div>
              </v-btn>
            </v-col>
            <v-col cols="6" sm="3">
              <v-btn
                block
                variant="outlined"
                class="pa-6"
                @click="$router.push('/dashboard/expenses/track')"
              >
                <div class="text-center">
                  <v-icon icon="mdi-file-upload" size="32" color="info" />
                  <div class="mt-2 text-body-2">Import CSV</div>
                </div>
              </v-btn>
            </v-col>
            <v-col cols="6" sm="3">
              <v-btn
                block
                variant="outlined"
                class="pa-6"
                @click="$router.push('/dashboard/expenses/reports')"
              >
                <div class="text-center">
                  <v-icon icon="mdi-file-chart" size="32" color="warning" />
                  <div class="mt-2 text-body-2">View Reports</div>
                </div>
              </v-btn>
            </v-col>
          </v-row>
        </v-card-text>
      </v-card>
    </template>
  </div>
</template>
