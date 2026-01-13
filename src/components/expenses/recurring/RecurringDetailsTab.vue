<script setup lang="ts">
import { ref, computed } from 'vue'
import RecurringExpenseForm from './RecurringExpenseForm.vue'
import {
  useRecurringExpenses,
  formatINR,
  type RecurringExpense,
  type CreateRecurringExpenseInput,
} from '@/composables/useExpenses'

const emit = defineEmits<{
  (e: 'expense-form-open'): void
}>()

// Fetch recurring data
const {
  recurring,
  isLoading,
  createRecurring,
  updateRecurring,
  deleteRecurring,
  pauseRecurring,
  resumeRecurring,
  skipNext,
  generateNow,
} = useRecurringExpenses()

// Filter state
const filterStatus = ref<'all' | 'active' | 'paused'>('all')
const filterFrequency = ref<string | null>(null)
const searchQuery = ref('')

// Dialog state
const showExpenseForm = ref(false)
const editingExpense = ref<RecurringExpense | null>(null)
const deleteConfirmDialog = ref(false)
const deletingExpenseId = ref<string | null>(null)
const deleteGeneratedExpenses = ref(false)

// Snackbar
const snackbar = ref({
  show: false,
  message: '',
  color: 'success',
})

const showMessage = (message: string, color = 'success') => {
  snackbar.value = { show: true, message, color }
}

// Filtered expenses
const filteredExpenses = computed(() => {
  let expenses = recurring.value ?? []

  // Filter by status
  if (filterStatus.value === 'active') {
    expenses = expenses.filter((e: RecurringExpense) => !e.isPaused)
  } else if (filterStatus.value === 'paused') {
    expenses = expenses.filter((e: RecurringExpense) => e.isPaused)
  }

  // Filter by frequency
  if (filterFrequency.value) {
    expenses = expenses.filter((e: RecurringExpense) => e.frequency === filterFrequency.value)
  }

  // Search filter
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    expenses = expenses.filter(
      (e: RecurringExpense) =>
        e.description.toLowerCase().includes(query) ||
        e.category.toLowerCase().includes(query) ||
        e.merchant?.toLowerCase().includes(query)
    )
  }

  // Sort by next occurrence
  return expenses.sort(
    (a: RecurringExpense, b: RecurringExpense) => new Date(a.nextOccurrence).getTime() - new Date(b.nextOccurrence).getTime()
  )
})

// Format frequency
const formatFrequency = (freq: string) => {
  const map: Record<string, string> = {
    WEEKLY: 'Weekly',
    MONTHLY: 'Monthly',
    QUARTERLY: 'Quarterly',
    YEARLY: 'Yearly',
  }
  return map[freq] || freq
}

// Format date
const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

// Get frequency color
const getFrequencyColor = (freq: string) => {
  const map: Record<string, string> = {
    WEEKLY: 'blue',
    MONTHLY: 'green',
    QUARTERLY: 'orange',
    YEARLY: 'purple',
  }
  return map[freq] || 'grey'
}

// Days until next occurrence
const daysUntil = (dateStr: string) => {
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  const target = new Date(dateStr)
  target.setHours(0, 0, 0, 0)
  const diff = Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  if (diff === 0) return 'Today'
  if (diff === 1) return 'Tomorrow'
  if (diff < 0) return `${Math.abs(diff)} days ago`
  return `in ${diff} days`
}

// Open create form
const openCreateForm = () => {
  editingExpense.value = null
  showExpenseForm.value = true
  emit('expense-form-open')
}

// Open edit form
const openEditForm = (expense: RecurringExpense) => {
  editingExpense.value = expense
  showExpenseForm.value = true
}

// Save expense
const handleSaveExpense = async (data: CreateRecurringExpenseInput) => {
  try {
    if (editingExpense.value) {
      await updateRecurring.mutateAsync({ id: editingExpense.value.id, ...data })
      showMessage('Recurring expense updated')
    } else {
      await createRecurring.mutateAsync(data)
      showMessage('Recurring expense created')
    }
    showExpenseForm.value = false
    editingExpense.value = null
  } catch {
    showMessage('Failed to save recurring expense', 'error')
  }
}

// Confirm delete
const confirmDelete = (id: string) => {
  deletingExpenseId.value = id
  deleteGeneratedExpenses.value = false
  deleteConfirmDialog.value = true
}

// Delete expense
const handleDelete = async () => {
  if (!deletingExpenseId.value) return
  try {
    await deleteRecurring.mutateAsync({
      id: deletingExpenseId.value,
      deleteGenerated: deleteGeneratedExpenses.value,
    })
    showMessage('Recurring expense deleted')
    deleteConfirmDialog.value = false
    deletingExpenseId.value = null
  } catch {
    showMessage('Failed to delete recurring expense', 'error')
  }
}

// Toggle pause/resume
const handleTogglePause = async (expense: RecurringExpense) => {
  try {
    if (expense.isPaused) {
      await resumeRecurring.mutateAsync(expense.id)
      showMessage('Recurring expense resumed')
    } else {
      await pauseRecurring.mutateAsync(expense.id)
      showMessage('Recurring expense paused')
    }
  } catch {
    showMessage('Failed to update status', 'error')
  }
}

// Skip next occurrence
const handleSkipNext = async (id: string) => {
  try {
    await skipNext.mutateAsync(id)
    showMessage('Next occurrence skipped')
  } catch {
    showMessage('Failed to skip occurrence', 'error')
  }
}

// Generate now
const handleGenerateNow = async (id: string) => {
  try {
    await generateNow.mutateAsync(id)
    showMessage('Expense generated successfully')
  } catch {
    showMessage('Failed to generate expense', 'error')
  }
}
</script>

<template>
  <div>
    <!-- Actions Bar -->
    <v-card class="mb-6" variant="outlined">
      <v-card-text class="d-flex align-center gap-3 flex-wrap">
        <v-btn color="primary" @click="openCreateForm">
          <v-icon icon="mdi-plus" class="mr-1" />
          Add Recurring Expense
        </v-btn>

        <v-spacer />

        <!-- Search -->
        <v-text-field
          v-model="searchQuery"
          prepend-inner-icon="mdi-magnify"
          label="Search"
          density="compact"
          hide-details
          variant="outlined"
          style="max-width: 250px"
          clearable
        />
      </v-card-text>
    </v-card>

    <!-- Filters -->
    <v-card class="mb-6" variant="outlined">
      <v-card-text class="d-flex align-center gap-3 flex-wrap">
        <!-- Status Filter -->
        <v-btn-toggle v-model="filterStatus" mandatory density="compact" color="primary">
          <v-btn value="all" size="small">All</v-btn>
          <v-btn value="active" size="small">
            <v-icon icon="mdi-check-circle" size="16" class="mr-1" color="success" />
            Active
          </v-btn>
          <v-btn value="paused" size="small">
            <v-icon icon="mdi-pause-circle" size="16" class="mr-1" color="warning" />
            Paused
          </v-btn>
        </v-btn-toggle>

        <!-- Frequency Filter -->
        <v-select
          v-model="filterFrequency"
          :items="[
            { title: 'All Frequencies', value: null },
            { title: 'Weekly', value: 'WEEKLY' },
            { title: 'Monthly', value: 'MONTHLY' },
            { title: 'Quarterly', value: 'QUARTERLY' },
            { title: 'Yearly', value: 'YEARLY' },
          ]"
          item-title="title"
          item-value="value"
          label="Frequency"
          density="compact"
          hide-details
          variant="outlined"
          style="max-width: 180px"
        />

        <v-spacer />

        <v-chip variant="tonal">
          {{ filteredExpenses.length }} items
        </v-chip>
      </v-card-text>
    </v-card>

    <!-- Loading State -->
    <div v-if="isLoading" class="text-center py-8">
      <v-progress-circular indeterminate color="primary" size="32" />
    </div>

    <!-- Empty State -->
    <v-card v-else-if="!filteredExpenses.length" class="mb-6">
      <v-card-text class="text-center pa-8">
        <v-icon icon="mdi-repeat-off" size="48" color="grey" />
        <p class="text-medium-emphasis mt-2">
          {{ searchQuery || filterStatus !== 'all' || filterFrequency
            ? 'No recurring expenses match your filters'
            : 'No recurring expenses yet' }}
        </p>
        <v-btn v-if="!searchQuery && filterStatus === 'all' && !filterFrequency" color="primary" class="mt-4" @click="openCreateForm">
          <v-icon icon="mdi-plus" class="mr-1" />
          Add Your First Recurring Expense
        </v-btn>
      </v-card-text>
    </v-card>

    <!-- Recurring Expenses List -->
    <v-card v-else>
      <v-list lines="two">
        <template v-for="(expense, index) in filteredExpenses" :key="expense.id">
          <v-list-item :class="{ 'opacity-60': expense.isPaused }">
            <template #prepend>
              <v-avatar
                :color="expense.isPaused ? 'grey' : getFrequencyColor(expense.frequency)"
                variant="tonal"
                size="48"
              >
                <v-icon :icon="expense.isPaused ? 'mdi-pause' : 'mdi-repeat'" size="24" />
              </v-avatar>
            </template>

            <v-list-item-title class="d-flex align-center">
              <span class="font-weight-medium">{{ expense.description }}</span>
              <v-chip
                size="x-small"
                :color="getFrequencyColor(expense.frequency)"
                variant="tonal"
                class="ml-2"
              >
                {{ formatFrequency(expense.frequency) }}
              </v-chip>
              <v-chip
                v-if="expense.isPaused"
                size="x-small"
                color="warning"
                variant="tonal"
                class="ml-1"
              >
                Paused
              </v-chip>
            </v-list-item-title>

            <v-list-item-subtitle>
              <span>{{ expense.category }}</span>
              <span v-if="expense.merchant"> &bull; {{ expense.merchant }}</span>
              <span v-if="!expense.isPaused">
                &bull; Next: {{ formatDate(expense.nextOccurrence) }}
                <span class="text-primary">({{ daysUntil(expense.nextOccurrence) }})</span>
              </span>
              <span v-if="expense.generatedCount > 0">
                &bull; {{ expense.generatedCount }}x generated
              </span>
            </v-list-item-subtitle>

            <template #append>
              <div class="d-flex align-center ga-2">
                <div class="text-right mr-4">
                  <div class="text-h6 font-weight-bold" :class="expense.isPaused ? 'text-medium-emphasis' : 'text-error'">
                    {{ formatINR(expense.amount) }}
                  </div>
                  <div v-if="expense.endType !== 'NEVER'" class="text-caption text-medium-emphasis">
                    <span v-if="expense.endType === 'AFTER_OCCURRENCES'">
                      {{ (expense.endAfterCount ?? 0) - expense.generatedCount }} left
                    </span>
                    <span v-else-if="expense.endType === 'ON_DATE'">
                      Until {{ formatDate(expense.endDate!) }}
                    </span>
                  </div>
                </div>

                <!-- Actions Menu -->
                <v-menu>
                  <template #activator="{ props }">
                    <v-btn icon="mdi-dots-vertical" variant="text" size="small" v-bind="props" />
                  </template>
                  <v-list density="compact">
                    <v-list-item @click="openEditForm(expense)">
                      <template #prepend>
                        <v-icon icon="mdi-pencil" size="18" />
                      </template>
                      <v-list-item-title>Edit</v-list-item-title>
                    </v-list-item>

                    <v-list-item @click="handleTogglePause(expense)">
                      <template #prepend>
                        <v-icon :icon="expense.isPaused ? 'mdi-play' : 'mdi-pause'" size="18" />
                      </template>
                      <v-list-item-title>{{ expense.isPaused ? 'Resume' : 'Pause' }}</v-list-item-title>
                    </v-list-item>

                    <v-list-item v-if="!expense.isPaused" @click="handleSkipNext(expense.id)">
                      <template #prepend>
                        <v-icon icon="mdi-skip-next" size="18" />
                      </template>
                      <v-list-item-title>Skip Next</v-list-item-title>
                    </v-list-item>

                    <v-list-item v-if="!expense.isPaused" @click="handleGenerateNow(expense.id)">
                      <template #prepend>
                        <v-icon icon="mdi-lightning-bolt" size="18" />
                      </template>
                      <v-list-item-title>Generate Now</v-list-item-title>
                    </v-list-item>

                    <v-divider />

                    <v-list-item class="text-error" @click="confirmDelete(expense.id)">
                      <template #prepend>
                        <v-icon icon="mdi-delete" size="18" color="error" />
                      </template>
                      <v-list-item-title>Delete</v-list-item-title>
                    </v-list-item>
                  </v-list>
                </v-menu>
              </div>
            </template>
          </v-list-item>
          <v-divider v-if="index < filteredExpenses.length - 1" />
        </template>
      </v-list>
    </v-card>

    <!-- Recurring Expense Form Dialog -->
    <RecurringExpenseForm
      v-model="showExpenseForm"
      :expense="editingExpense"
      @save="handleSaveExpense"
    />

    <!-- Delete Confirmation Dialog -->
    <v-dialog v-model="deleteConfirmDialog" max-width="450">
      <v-card>
        <v-card-title class="d-flex align-center">
          <v-icon icon="mdi-delete-alert" color="error" class="mr-2" />
          Delete Recurring Expense
        </v-card-title>
        <v-card-text>
          <p class="mb-4">Are you sure you want to delete this recurring expense?</p>
          <v-checkbox
            v-model="deleteGeneratedExpenses"
            label="Also delete all generated expenses from this recurring template"
            color="error"
            hide-details
            density="compact"
          />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="deleteConfirmDialog = false">Cancel</v-btn>
          <v-btn
            color="error"
            variant="elevated"
            :loading="deleteRecurring.isPending.value"
            @click="handleDelete"
          >
            Delete
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

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
