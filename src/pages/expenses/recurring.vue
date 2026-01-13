<script setup lang="ts">
import { ref } from 'vue'
import SectionHeader from '@/components/shared/SectionHeader.vue'
import RecurringOverviewTab from '@/components/expenses/recurring/RecurringOverviewTab.vue'
import RecurringDetailsTab from '@/components/expenses/recurring/RecurringDetailsTab.vue'
import RecurringExpenseForm from '@/components/expenses/recurring/RecurringExpenseForm.vue'
import {
  useRecurringExpenses,
  type CreateRecurringExpenseInput,
} from '@/composables/useExpenses'

// Tab state
const activeTab = ref('overview')

// Form dialog state (for quick create from overview)
const showExpenseForm = ref(false)

// Get create mutation
const { createRecurring } = useRecurringExpenses()

// Snackbar
const snackbar = ref({
  show: false,
  message: '',
  color: 'success',
})

const showMessage = (message: string, color = 'success') => {
  snackbar.value = { show: true, message, color }
}

// Handle create from overview
const handleCreateNew = () => {
  showExpenseForm.value = true
}

// Save new expense
const handleSaveExpense = async (data: CreateRecurringExpenseInput) => {
  try {
    await createRecurring.mutateAsync(data)
    showMessage('Recurring expense created')
    showExpenseForm.value = false
  } catch {
    showMessage('Failed to create recurring expense', 'error')
  }
}
</script>

<template>
  <div>
    <SectionHeader
      title="Recurring Expenses"
      subtitle="Manage subscriptions, bills, and regular payments"
      icon="mdi-repeat"
    />

    <!-- Tab Navigation -->
    <div class="d-flex justify-space-between align-center mb-4 flex-wrap ga-2">
      <!-- Tabs -->
      <v-tabs v-model="activeTab" color="primary" density="compact">
        <v-tab value="overview">Overview</v-tab>
        <v-tab value="details">Recurring Details</v-tab>
      </v-tabs>
    </div>

    <!-- Tab Content -->
    <v-window v-model="activeTab">
      <!-- Overview Tab -->
      <v-window-item value="overview">
        <RecurringOverviewTab
          @go-to-details="activeTab = 'details'"
          @create-new="handleCreateNew"
        />
      </v-window-item>

      <!-- Details Tab -->
      <v-window-item value="details">
        <RecurringDetailsTab />
      </v-window-item>
    </v-window>

    <!-- Quick Create Form Dialog -->
    <RecurringExpenseForm
      v-model="showExpenseForm"
      @save="handleSaveExpense"
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
