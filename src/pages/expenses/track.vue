<script setup lang="ts">
import { ref, computed } from 'vue'
import SectionHeader from '@/components/shared/SectionHeader.vue'
import ExpenseFilters from '@/components/expenses/ExpenseFilters.vue'
import ExpenseList from '@/components/expenses/ExpenseList.vue'
import ExpenseForm from '@/components/expenses/ExpenseForm.vue'
import CSVImportModal from '@/components/expenses/CSVImportModal.vue'
import ReceiptUploader from '@/components/expenses/ReceiptUploader.vue'
import {
  useExpenses,
  useCategories,
  formatINR,
  getCurrentMonth,
  type Expense,
  type CreateExpenseInput,
} from '@/composables/useExpenses'

const tabs = [
  { title: 'Overview', route: '/expenses' },
  { title: 'Track', route: '/expenses/track' },
  { title: 'Budgets', route: '/expenses/budgets' },
  { title: 'Reports', route: '/expenses/reports' },
  { title: 'Categories', route: '/expenses/categories' },
]

// Current month filter
const selectedMonth = ref(getCurrentMonth())
const selectedCategory = ref<string | null>(null)

// Fetch data
const {
  expenses,
  totalExpenses,
  isLoading,
  createExpense,
  updateExpense,
  deleteExpense,
} = useExpenses(selectedMonth)
const { data: categories } = useCategories()

// Category list for filter
const categoryList = computed(() =>
  categories.value?.map((c) => c.name) ?? []
)

// Filtered expenses by category
const filteredExpenses = computed(() => {
  if (!expenses.value) return []
  if (!selectedCategory.value) return expenses.value
  return expenses.value.filter((e) => e.category === selectedCategory.value)
})

// Dialogs
const showExpenseForm = ref(false)
const showCSVImport = ref(false)
const showReceiptUploader = ref(false)
const editingExpense = ref<Expense | null>(null)
const prefillData = ref<Partial<CreateExpenseInput> | null>(null)
const deleteConfirmDialog = ref(false)
const deletingExpenseId = ref<string | null>(null)

// Snackbar
const snackbar = ref({
  show: false,
  message: '',
  color: 'success',
})

const showMessage = (message: string, color = 'success') => {
  snackbar.value = { show: true, message, color }
}

// Open add form
const openAddForm = () => {
  editingExpense.value = null
  prefillData.value = null
  showExpenseForm.value = true
}

// Handle receipt processed - prefill form with extracted data
const handleReceiptProcessed = (data: {
  merchant: string | null
  date: string | null
  amount: number | null
  paymentMethod: string | null
  suggestedCategory: string | null
}) => {
  prefillData.value = {
    merchant: data.merchant || undefined,
    date: data.date || new Date().toISOString().split('T')[0],
    amount: data.amount || 0,
    paymentMethod: data.paymentMethod || undefined,
    category: data.suggestedCategory || 'Other',
    description: data.merchant ? `Purchase at ${data.merchant}` : '',
  }
  editingExpense.value = null
  showExpenseForm.value = true
}

// Open edit form
const openEditForm = (expense: Expense) => {
  editingExpense.value = expense
  showExpenseForm.value = true
}

// Save expense (create or update)
const handleSaveExpense = async (data: CreateExpenseInput) => {
  try {
    if (editingExpense.value) {
      await updateExpense.mutateAsync({ id: editingExpense.value.id, ...data })
      showMessage('Expense updated successfully')
    } else {
      await createExpense.mutateAsync(data)
      showMessage('Expense added successfully')
    }
    showExpenseForm.value = false
    editingExpense.value = null
    prefillData.value = null
  } catch (error) {
    showMessage('Failed to save expense', 'error')
  }
}

// Confirm delete
const confirmDelete = (id: string) => {
  deletingExpenseId.value = id
  deleteConfirmDialog.value = true
}

// Delete expense
const handleDeleteExpense = async () => {
  if (!deletingExpenseId.value) return
  try {
    await deleteExpense.mutateAsync(deletingExpenseId.value)
    showMessage('Expense deleted successfully')
    deleteConfirmDialog.value = false
    deletingExpenseId.value = null
  } catch (error) {
    showMessage('Failed to delete expense', 'error')
  }
}

// Import CSV expenses
const handleCSVImport = async (importedExpenses: CreateExpenseInput[]) => {
  try {
    let successCount = 0
    for (const expense of importedExpenses) {
      try {
        await createExpense.mutateAsync(expense)
        successCount++
      } catch {
        // Continue with next expense
      }
    }
    showMessage(`Successfully imported ${successCount} of ${importedExpenses.length} expenses`)
    showCSVImport.value = false
  } catch (error) {
    showMessage('Failed to import expenses', 'error')
  }
}

// Month name
const monthName = computed(() => {
  const [year, month] = selectedMonth.value.split('-').map(Number)
  return new Date(year, month - 1).toLocaleString('en-IN', { month: 'long', year: 'numeric' })
})
</script>

<template>
  <div>
    <SectionHeader
      title="Expenses"
      subtitle="Add and track expenses"
      icon="mdi-cart-outline"
      :tabs="tabs"
    />

    <!-- Actions Bar -->
    <v-card class="mb-6" variant="outlined">
      <v-card-text class="d-flex align-center gap-3 flex-wrap">
        <v-btn color="primary" @click="openAddForm">
          <v-icon icon="mdi-plus" class="mr-1" />
          Add Expense
        </v-btn>

        <v-btn variant="outlined" color="secondary" @click="showReceiptUploader = true">
          <v-icon icon="mdi-camera" class="mr-1" />
          Scan Receipt
        </v-btn>

        <v-btn variant="outlined" @click="showCSVImport = true">
          <v-icon icon="mdi-file-upload" class="mr-1" />
          Import CSV
        </v-btn>

        <v-spacer />

        <!-- Summary -->
        <div class="text-right">
          <div class="text-caption text-medium-emphasis">{{ monthName }} Total</div>
          <div class="text-h6 font-weight-bold text-error">
            {{ formatINR(totalExpenses) }}
          </div>
        </div>
      </v-card-text>
    </v-card>

    <!-- Filters -->
    <ExpenseFilters
      v-model:month="selectedMonth"
      v-model:selectedCategory="selectedCategory"
      :categories="categoryList"
      class="mb-6"
    />

    <!-- Expense List -->
    <ExpenseList
      :expenses="filteredExpenses"
      :loading="isLoading"
      @edit="openEditForm"
      @delete="confirmDelete"
    />

    <!-- Add/Edit Expense Dialog -->
    <ExpenseForm
      v-model="showExpenseForm"
      :expense="editingExpense"
      :prefill-data="prefillData"
      @save="handleSaveExpense"
    />

    <!-- CSV Import Dialog -->
    <CSVImportModal
      v-model="showCSVImport"
      @import="handleCSVImport"
    />

    <!-- Receipt Uploader Dialog -->
    <ReceiptUploader
      v-model="showReceiptUploader"
      @receipt-processed="handleReceiptProcessed"
    />

    <!-- Delete Confirmation Dialog -->
    <v-dialog v-model="deleteConfirmDialog" max-width="400">
      <v-card>
        <v-card-title class="d-flex align-center">
          <v-icon icon="mdi-delete-alert" color="error" class="mr-2" />
          Delete Expense
        </v-card-title>
        <v-card-text>
          Are you sure you want to delete this expense? This action cannot be undone.
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="deleteConfirmDialog = false">Cancel</v-btn>
          <v-btn
            color="error"
            variant="elevated"
            :loading="deleteExpense.isPending.value"
            @click="handleDeleteExpense"
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
