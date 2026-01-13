<script setup lang="ts">
import { ref } from 'vue'
import SectionHeader from '@/components/shared/SectionHeader.vue'
import ExpenseFilters from '@/components/expenses/ExpenseFilters.vue'
import TrackOverviewTab from '@/components/expenses/track/TrackOverviewTab.vue'
import TrackDetailsTab from '@/components/expenses/track/TrackDetailsTab.vue'
import CategoriesDialog from '@/components/expenses/track/CategoriesDialog.vue'
import { getCurrentMonth } from '@/composables/useExpenses'

// Section-level tabs for expenses navigation
const expensesTabs = [
  { title: 'Overview', route: '/expenses' },
  { title: 'Track', route: '/expenses/track' },
  { title: 'Budgets', route: '/expenses/budgets' },
  { title: 'Categories', route: '/expenses/categories' },
  { title: 'Reports', route: '/expenses/reports' },
]

// Tab state
const activeTab = ref('overview')

// Month filter (shared between tabs)
const selectedMonth = ref(getCurrentMonth())

// Categories dialog
const showCategoriesDialog = ref(false)
</script>

<template>
  <div>
    <SectionHeader
      title="Expenses"
      subtitle="Track and manage your spending"
      icon="mdi-cart-outline"
      :tabs="expensesTabs"
    />

    <!-- Tab Navigation + Month Selector -->
    <div class="d-flex justify-space-between align-center mb-4 flex-wrap ga-2">
      <!-- Tabs -->
      <v-tabs v-model="activeTab" color="primary" density="compact">
        <v-tab value="overview">Overview</v-tab>
        <v-tab value="details">Expense Details</v-tab>
      </v-tabs>

      <!-- Month Selector -->
      <ExpenseFilters v-model:month="selectedMonth" />
    </div>

    <!-- Tab Content -->
    <v-window v-model="activeTab">
      <!-- Overview Tab -->
      <v-window-item value="overview">
        <TrackOverviewTab
          :selected-month="selectedMonth"
          @go-to-details="activeTab = 'details'"
        />
      </v-window-item>

      <!-- Details Tab -->
      <v-window-item value="details">
        <TrackDetailsTab
          :selected-month="selectedMonth"
          @update:selected-month="selectedMonth = $event"
          @open-categories="showCategoriesDialog = true"
        />
      </v-window-item>
    </v-window>

    <!-- Categories Dialog -->
    <CategoriesDialog v-model="showCategoriesDialog" />
  </div>
</template>
