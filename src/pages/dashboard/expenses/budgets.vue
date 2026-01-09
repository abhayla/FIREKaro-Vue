<script setup lang="ts">
import { ref, computed } from 'vue'
import SectionHeader from '@/components/shared/SectionHeader.vue'
import ExpenseFilters from '@/components/expenses/ExpenseFilters.vue'
import BudgetCard from '@/components/expenses/BudgetCard.vue'
import BudgetForm from '@/components/expenses/BudgetForm.vue'
import {
  useBudgets,
  useExpenses,
  formatINR,
  getCurrentMonth,
  type Budget,
  type CreateBudgetInput,
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
const { budgets, currentBudget, budgetUsage, isLoading, createBudget } =
  useBudgets(selectedMonth)
const { totalExpenses, expensesByCategory } = useExpenses(selectedMonth)

// Dialogs
const showBudgetForm = ref(false)
const editingBudget = ref<Budget | null>(null)

// Snackbar
const snackbar = ref({
  show: false,
  message: '',
  color: 'success',
})

const showMessage = (message: string, color = 'success') => {
  snackbar.value = { show: true, message, color }
}

// Open create form
const openCreateForm = () => {
  editingBudget.value = null
  showBudgetForm.value = true
}

// Open edit form
const openEditForm = () => {
  editingBudget.value = currentBudget.value
  showBudgetForm.value = true
}

// Save budget
const handleSaveBudget = async (data: CreateBudgetInput) => {
  try {
    await createBudget.mutateAsync(data)
    showMessage('Budget saved successfully')
    showBudgetForm.value = false
    editingBudget.value = null
  } catch (error) {
    showMessage('Failed to save budget', 'error')
  }
}

// Month name
const monthName = computed(() => {
  const [year, month] = selectedMonth.value.split('-').map(Number)
  return new Date(year, month - 1).toLocaleString('en-IN', { month: 'long', year: 'numeric' })
})

// Budget history (last 6 months)
const budgetHistory = computed(() => {
  if (!budgets.value) return []
  return [...budgets.value]
    .sort((a, b) => {
      const dateA = new Date(a.year, a.month - 1)
      const dateB = new Date(b.year, b.month - 1)
      return dateB.getTime() - dateA.getTime()
    })
    .slice(0, 6)
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
</script>

<template>
  <div>
    <SectionHeader
      title="Expenses"
      subtitle="Budget management"
      icon="mdi-cart-outline"
      :tabs="tabs"
    />

    <!-- Filters -->
    <ExpenseFilters v-model:month="selectedMonth" class="mb-6" />

    <!-- Loading State -->
    <div v-if="isLoading" class="text-center py-8">
      <v-progress-circular indeterminate color="primary" size="48" />
      <p class="mt-4 text-medium-emphasis">Loading budget data...</p>
    </div>

    <template v-else>
      <!-- No Budget State -->
      <v-card v-if="!currentBudget" class="mb-6">
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

          <v-btn color="primary" size="large" @click="openCreateForm">
            <v-icon icon="mdi-plus" class="mr-2" />
            Create Budget for {{ monthName }}
          </v-btn>
        </v-card-text>
      </v-card>

      <!-- Current Budget -->
      <template v-else>
        <v-row class="mb-6">
          <!-- Budget Card -->
          <v-col cols="12" md="6">
            <BudgetCard :budget="currentBudget" @edit="openEditForm" />
          </v-col>

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
                      v-for="cat in categoryBreakdown.needs.categories"
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
                      v-for="cat in categoryBreakdown.wants.categories"
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
                      v-for="cat in categoryBreakdown.savings.categories"
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
        </v-row>

        <!-- Summary Cards -->
        <v-row class="mb-6">
          <v-col cols="12" sm="6" md="3">
            <v-card class="pa-4" variant="elevated">
              <div class="text-body-2 text-medium-emphasis">Monthly Income</div>
              <div class="text-h5 font-weight-bold text-success">
                {{ formatINR(currentBudget.income) }}
              </div>
            </v-card>
          </v-col>
          <v-col cols="12" sm="6" md="3">
            <v-card class="pa-4" variant="elevated">
              <div class="text-body-2 text-medium-emphasis">Total Spent</div>
              <div class="text-h5 font-weight-bold text-error">
                {{ formatINR(totalExpenses) }}
              </div>
            </v-card>
          </v-col>
          <v-col cols="12" sm="6" md="3">
            <v-card class="pa-4" variant="elevated">
              <div class="text-body-2 text-medium-emphasis">Remaining</div>
              <div
                class="text-h5 font-weight-bold"
                :class="currentBudget.income - totalExpenses >= 0 ? 'text-success' : 'text-error'"
              >
                {{ formatINR(currentBudget.income - totalExpenses) }}
              </div>
            </v-card>
          </v-col>
          <v-col cols="12" sm="6" md="3">
            <v-card class="pa-4" variant="elevated">
              <div class="text-body-2 text-medium-emphasis">Budget Health</div>
              <div class="d-flex align-center">
                <v-icon
                  :icon="budgetUsage && budgetUsage.total <= 80 ? 'mdi-check-circle' : 'mdi-alert-circle'"
                  :color="budgetUsage && budgetUsage.total <= 80 ? 'success' : 'warning'"
                  class="mr-2"
                />
                <span
                  class="text-h6 font-weight-bold"
                  :class="budgetUsage && budgetUsage.total <= 80 ? 'text-success' : 'text-warning'"
                >
                  {{ budgetUsage?.total.toFixed(0) || 0 }}% Used
                </span>
              </div>
            </v-card>
          </v-col>
        </v-row>
      </template>

      <!-- Budget History -->
      <v-card v-if="budgetHistory.length > 1">
        <v-card-title>
          <v-icon icon="mdi-history" class="mr-2" />
          Budget History
        </v-card-title>
        <v-card-text>
          <v-table>
            <thead>
              <tr>
                <th>Month</th>
                <th class="text-right">Income</th>
                <th class="text-right">Needs</th>
                <th class="text-right">Wants</th>
                <th class="text-right">Savings</th>
                <th class="text-right">Total Spent</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="budget in budgetHistory" :key="budget.id">
                <td>
                  {{ new Date(budget.year, budget.month - 1).toLocaleString('en-IN', { month: 'short', year: 'numeric' }) }}
                </td>
                <td class="text-right">{{ formatINR(budget.income) }}</td>
                <td class="text-right">
                  <span :class="budget.needsActual > budget.needsLimit ? 'text-error' : ''">
                    {{ formatINR(budget.needsActual) }}
                  </span>
                  <span class="text-caption text-medium-emphasis">
                    / {{ formatINR(budget.needsLimit) }}
                  </span>
                </td>
                <td class="text-right">
                  <span :class="budget.wantsActual > budget.wantsLimit ? 'text-error' : ''">
                    {{ formatINR(budget.wantsActual) }}
                  </span>
                  <span class="text-caption text-medium-emphasis">
                    / {{ formatINR(budget.wantsLimit) }}
                  </span>
                </td>
                <td class="text-right">
                  <span>{{ formatINR(budget.savingsActual) }}</span>
                  <span class="text-caption text-medium-emphasis">
                    / {{ formatINR(budget.savingsLimit) }}
                  </span>
                </td>
                <td class="text-right font-weight-bold">
                  {{ formatINR(budget.needsActual + budget.wantsActual + budget.savingsActual) }}
                </td>
              </tr>
            </tbody>
          </v-table>
        </v-card-text>
      </v-card>
    </template>

    <!-- Budget Form Dialog -->
    <BudgetForm
      v-model="showBudgetForm"
      :budget="editingBudget"
      @save="handleSaveBudget"
    />

    <!-- Snackbar -->
    <v-snackbar
      v-model="snackbar.show"
      :color="snackbar.color"
      :timeout="3000"
      location="bottom right"
    >
      {{ snackbar.message }}
      <template #actions>
        <v-btn variant="text" @click="snackbar.show = false">Close</v-btn>
      </template>
    </v-snackbar>
  </div>
</template>
