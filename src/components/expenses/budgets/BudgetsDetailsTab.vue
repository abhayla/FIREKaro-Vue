<script setup lang="ts">
import { ref, computed } from 'vue'
import BudgetForm from '@/components/expenses/BudgetForm.vue'
import {
  useBudgets,
  formatINR,
  type Budget,
  type CreateBudgetInput,
} from '@/composables/useExpenses'

const props = defineProps<{
  selectedMonth: string
}>()

const emit = defineEmits<{
  (e: 'update:selectedMonth', value: string): void
}>()

// Local month state that syncs with parent
const localMonth = computed({
  get: () => props.selectedMonth,
  set: (value) => emit('update:selectedMonth', value),
})

// Fetch data
const { budgets, currentBudget, isLoading, createBudget } = useBudgets(computed(() => props.selectedMonth))

// Dialog state
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
const openEditForm = (budget?: Budget) => {
  editingBudget.value = budget || currentBudget.value
  showBudgetForm.value = true
}

// Save budget
const handleSaveBudget = async (data: CreateBudgetInput) => {
  try {
    await createBudget.mutateAsync(data)
    showMessage('Budget saved successfully')
    showBudgetForm.value = false
    editingBudget.value = null
  } catch {
    showMessage('Failed to save budget', 'error')
  }
}

// Month name
const monthName = computed(() => {
  const [year, month] = props.selectedMonth.split('-').map(Number)
  return new Date(year, month - 1).toLocaleString('en-IN', { month: 'long', year: 'numeric' })
})

// Budget history (sorted by date, most recent first)
const budgetHistory = computed(() => {
  if (!budgets.value) return []
  return [...budgets.value]
    .sort((a, b) => {
      const dateA = new Date(a.year, a.month - 1)
      const dateB = new Date(b.year, b.month - 1)
      return dateB.getTime() - dateA.getTime()
    })
})

// Get status color based on budget usage
const getUsageColor = (actual: number, limit: number) => {
  if (limit === 0) return 'grey'
  const percent = (actual / limit) * 100
  if (percent >= 100) return 'error'
  if (percent >= 80) return 'warning'
  return 'success'
}

// Get total spent for a budget
const getTotalSpent = (budget: Budget) => {
  return budget.needsActual + budget.wantsActual + budget.savingsActual
}

// Get total budget limit
const getTotalLimit = (budget: Budget) => {
  return budget.needsLimit + budget.wantsLimit + budget.savingsLimit
}

// Copy budget from previous month
const copyFromPreviousMonth = async () => {
  if (budgetHistory.value.length === 0) {
    showMessage('No previous budget to copy from', 'warning')
    return
  }

  // Find the most recent budget that's not the current month
  const [currentYear, currentMonth] = props.selectedMonth.split('-').map(Number)
  const previousBudget = budgetHistory.value.find(
    (b) => !(b.year === currentYear && b.month === currentMonth)
  )

  if (!previousBudget) {
    showMessage('No previous budget to copy from', 'warning')
    return
  }

  try {
    const totalLimit = previousBudget.needsLimit + previousBudget.wantsLimit + previousBudget.savingsLimit
    await createBudget.mutateAsync({
      month: currentMonth,
      year: currentYear,
      income: previousBudget.income,
      needsPercentage: totalLimit > 0 ? Math.round((previousBudget.needsLimit / totalLimit) * 100) : 50,
      wantsPercentage: totalLimit > 0 ? Math.round((previousBudget.wantsLimit / totalLimit) * 100) : 30,
      savingsPercentage: totalLimit > 0 ? Math.round((previousBudget.savingsLimit / totalLimit) * 100) : 20,
    })
    showMessage('Budget copied from previous month')
  } catch {
    showMessage('Failed to copy budget', 'error')
  }
}

// Navigate to a specific budget month
const navigateToBudget = (budget: Budget) => {
  localMonth.value = `${budget.year}-${String(budget.month).padStart(2, '0')}`
}
</script>

<template>
  <div>
    <!-- Actions Bar -->
    <v-card class="mb-6" variant="outlined">
      <v-card-text class="d-flex align-center gap-3 flex-wrap">
        <v-btn v-if="!currentBudget" color="primary" @click="openCreateForm">
          <v-icon icon="mdi-plus" class="mr-1" />
          Create Budget
        </v-btn>
        <v-btn v-else variant="outlined" @click="openEditForm()">
          <v-icon icon="mdi-pencil" class="mr-1" />
          Edit {{ monthName }} Budget
        </v-btn>

        <v-btn
          v-if="!currentBudget && budgetHistory.length > 0"
          variant="outlined"
          color="secondary"
          @click="copyFromPreviousMonth"
        >
          <v-icon icon="mdi-content-copy" class="mr-1" />
          Copy from Previous Month
        </v-btn>

        <v-spacer />

        <!-- Current Budget Summary -->
        <div v-if="currentBudget" class="text-right">
          <div class="text-caption text-medium-emphasis">{{ monthName }} Budget</div>
          <div class="d-flex align-center ga-2">
            <span class="text-body-1 font-weight-bold">
              {{ formatINR(currentBudget.income) }}
            </span>
            <v-chip
              size="x-small"
              :color="getUsageColor(getTotalSpent(currentBudget), getTotalLimit(currentBudget))"
              variant="tonal"
            >
              {{ Math.round((getTotalSpent(currentBudget) / getTotalLimit(currentBudget)) * 100) || 0 }}% used
            </v-chip>
          </div>
        </div>
      </v-card-text>
    </v-card>

    <!-- Current Budget Details Card -->
    <v-card v-if="currentBudget" class="mb-6">
      <v-card-title class="d-flex align-center">
        <v-icon icon="mdi-chart-pie" class="mr-2" />
        {{ monthName }} Budget Details
        <v-spacer />
        <v-btn icon="mdi-pencil" variant="text" size="small" @click="openEditForm()" />
      </v-card-title>
      <v-card-text>
        <v-row>
          <!-- Income -->
          <v-col cols="12" sm="6" md="3">
            <div class="text-caption text-medium-emphasis mb-1">Monthly Income</div>
            <div class="text-h6 font-weight-bold text-success">
              {{ formatINR(currentBudget.income) }}
            </div>
          </v-col>

          <!-- Needs -->
          <v-col cols="12" sm="6" md="3">
            <div class="text-caption text-medium-emphasis mb-1">
              <v-icon icon="mdi-home" size="14" color="blue" class="mr-1" />
              Needs (50%)
            </div>
            <div class="d-flex align-center">
              <span class="text-h6 font-weight-bold" :class="`text-${getUsageColor(currentBudget.needsActual, currentBudget.needsLimit)}`">
                {{ formatINR(currentBudget.needsActual) }}
              </span>
              <span class="text-body-2 text-medium-emphasis ml-1">
                / {{ formatINR(currentBudget.needsLimit) }}
              </span>
            </div>
            <v-progress-linear
              :model-value="currentBudget.needsLimit > 0 ? (currentBudget.needsActual / currentBudget.needsLimit) * 100 : 0"
              :color="getUsageColor(currentBudget.needsActual, currentBudget.needsLimit)"
              height="4"
              rounded
              class="mt-1"
            />
          </v-col>

          <!-- Wants -->
          <v-col cols="12" sm="6" md="3">
            <div class="text-caption text-medium-emphasis mb-1">
              <v-icon icon="mdi-shopping" size="14" color="purple" class="mr-1" />
              Wants (30%)
            </div>
            <div class="d-flex align-center">
              <span class="text-h6 font-weight-bold" :class="`text-${getUsageColor(currentBudget.wantsActual, currentBudget.wantsLimit)}`">
                {{ formatINR(currentBudget.wantsActual) }}
              </span>
              <span class="text-body-2 text-medium-emphasis ml-1">
                / {{ formatINR(currentBudget.wantsLimit) }}
              </span>
            </div>
            <v-progress-linear
              :model-value="currentBudget.wantsLimit > 0 ? (currentBudget.wantsActual / currentBudget.wantsLimit) * 100 : 0"
              :color="getUsageColor(currentBudget.wantsActual, currentBudget.wantsLimit)"
              height="4"
              rounded
              class="mt-1"
            />
          </v-col>

          <!-- Savings -->
          <v-col cols="12" sm="6" md="3">
            <div class="text-caption text-medium-emphasis mb-1">
              <v-icon icon="mdi-piggy-bank" size="14" color="green" class="mr-1" />
              Savings (20%)
            </div>
            <div class="d-flex align-center">
              <span class="text-h6 font-weight-bold text-success">
                {{ formatINR(currentBudget.savingsActual) }}
              </span>
              <span class="text-body-2 text-medium-emphasis ml-1">
                / {{ formatINR(currentBudget.savingsLimit) }}
              </span>
            </div>
            <v-progress-linear
              :model-value="currentBudget.savingsLimit > 0 ? (currentBudget.savingsActual / currentBudget.savingsLimit) * 100 : 0"
              color="success"
              height="4"
              rounded
              class="mt-1"
            />
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <!-- Budget History -->
    <v-card>
      <v-card-title class="d-flex align-center">
        <v-icon icon="mdi-history" class="mr-2" />
        Budget History
        <v-chip size="small" variant="tonal" class="ml-2">
          {{ budgetHistory.length }} budgets
        </v-chip>
      </v-card-title>
      <v-card-text>
        <!-- Loading State -->
        <div v-if="isLoading" class="text-center py-8">
          <v-progress-circular indeterminate color="primary" size="32" />
        </div>

        <!-- Empty State -->
        <div v-else-if="budgetHistory.length === 0" class="text-center py-8">
          <v-icon icon="mdi-chart-pie" size="48" color="grey" />
          <p class="text-medium-emphasis mt-2">No budgets created yet.</p>
          <v-btn color="primary" class="mt-4" @click="openCreateForm">
            <v-icon icon="mdi-plus" class="mr-1" />
            Create Your First Budget
          </v-btn>
        </div>

        <!-- Budget Table -->
        <v-table v-else density="comfortable" hover>
          <thead>
            <tr>
              <th>Month</th>
              <th class="text-right">Income</th>
              <th class="text-right">Needs</th>
              <th class="text-right">Wants</th>
              <th class="text-right">Savings</th>
              <th class="text-right">Total Spent</th>
              <th class="text-center">Status</th>
              <th class="text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="budget in budgetHistory"
              :key="budget.id"
              :class="{ 'bg-primary-lighten-5': budget.month === parseInt(props.selectedMonth.split('-')[1]) && budget.year === parseInt(props.selectedMonth.split('-')[0]) }"
            >
              <td>
                <div class="d-flex align-center">
                  <v-icon
                    v-if="budget.month === parseInt(props.selectedMonth.split('-')[1]) && budget.year === parseInt(props.selectedMonth.split('-')[0])"
                    icon="mdi-check-circle"
                    color="primary"
                    size="16"
                    class="mr-1"
                  />
                  {{ new Date(budget.year, budget.month - 1).toLocaleString('en-IN', { month: 'short', year: 'numeric' }) }}
                </div>
              </td>
              <td class="text-right text-success font-weight-medium">
                {{ formatINR(budget.income) }}
              </td>
              <td class="text-right">
                <span :class="`text-${getUsageColor(budget.needsActual, budget.needsLimit)}`">
                  {{ formatINR(budget.needsActual) }}
                </span>
                <span class="text-caption text-medium-emphasis">
                  / {{ formatINR(budget.needsLimit) }}
                </span>
              </td>
              <td class="text-right">
                <span :class="`text-${getUsageColor(budget.wantsActual, budget.wantsLimit)}`">
                  {{ formatINR(budget.wantsActual) }}
                </span>
                <span class="text-caption text-medium-emphasis">
                  / {{ formatINR(budget.wantsLimit) }}
                </span>
              </td>
              <td class="text-right">
                <span class="text-success">{{ formatINR(budget.savingsActual) }}</span>
                <span class="text-caption text-medium-emphasis">
                  / {{ formatINR(budget.savingsLimit) }}
                </span>
              </td>
              <td class="text-right font-weight-bold">
                {{ formatINR(getTotalSpent(budget)) }}
              </td>
              <td class="text-center">
                <v-chip
                  size="x-small"
                  :color="getUsageColor(getTotalSpent(budget), getTotalLimit(budget))"
                  variant="tonal"
                >
                  {{ Math.round((getTotalSpent(budget) / getTotalLimit(budget)) * 100) || 0 }}%
                </v-chip>
              </td>
              <td class="text-center">
                <v-btn
                  icon="mdi-eye"
                  variant="text"
                  size="x-small"
                  title="View this month"
                  @click="navigateToBudget(budget)"
                />
                <v-btn
                  icon="mdi-pencil"
                  variant="text"
                  size="x-small"
                  title="Edit budget"
                  @click="openEditForm(budget)"
                />
              </td>
            </tr>
          </tbody>
        </v-table>
      </v-card-text>
    </v-card>

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
