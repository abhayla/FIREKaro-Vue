<script setup lang="ts">
import SectionHeader from '@/components/shared/SectionHeader.vue'
import FamilyToggle from '@/components/shared/FamilyToggle.vue'

const tabs = [
  { title: 'Overview', route: '/dashboard/expenses' },
  { title: 'Track', route: '/dashboard/expenses/track' },
  { title: 'Budgets', route: '/dashboard/expenses/budgets' },
  { title: 'Reports', route: '/dashboard/expenses/reports' },
]
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

    <v-row>
      <v-col cols="12" md="4">
        <v-card class="pa-4">
          <div class="text-body-2 text-medium-emphasis">This Month</div>
          <div class="text-h5 font-weight-bold">Loading...</div>
        </v-card>
      </v-col>
      <v-col cols="12" md="4">
        <v-card class="pa-4">
          <div class="text-body-2 text-medium-emphasis">Budget Used</div>
          <div class="text-h5 font-weight-bold">Loading...</div>
        </v-card>
      </v-col>
      <v-col cols="12" md="4">
        <v-card class="pa-4">
          <div class="text-body-2 text-medium-emphasis">Top Category</div>
          <div class="text-h5 font-weight-bold">Loading...</div>
        </v-card>
      </v-col>
    </v-row>

    <v-card class="mt-6">
      <v-card-title>Expense Overview</v-card-title>
      <v-card-text>
        <p class="text-medium-emphasis">
          Track expenses with AI-powered categorization, set budgets, and view spending patterns.
        </p>
      </v-card-text>
    </v-card>
  </div>
</template>
