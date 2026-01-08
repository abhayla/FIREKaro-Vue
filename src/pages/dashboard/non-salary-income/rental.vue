<script setup lang="ts">
import SectionHeader from '@/components/shared/SectionHeader.vue'

const tabs = [
  { title: 'Overview', route: '/dashboard/non-salary-income' },
  { title: 'Business', route: '/dashboard/non-salary-income/business' },
  { title: 'Rental', route: '/dashboard/non-salary-income/rental' },
  { title: 'Capital Gains', route: '/dashboard/non-salary-income/capital-gains' },
  { title: 'Other', route: '/dashboard/non-salary-income/other' },
  { title: 'Reports', route: '/dashboard/non-salary-income/reports' },
]
</script>

<template>
  <div>
    <SectionHeader
      title="Non-Salary Income"
      subtitle="Rental Income from Properties"
      icon="mdi-cash-plus"
      :tabs="tabs"
    />

    <v-card class="mt-6">
      <v-card-title>Rental Income</v-card-title>
      <v-card-text>
        <v-alert type="info" variant="tonal" class="mb-4">
          Track rental income from house property with automatic 30% standard deduction calculation.
        </v-alert>
      </v-card-text>
    </v-card>
  </div>
</template>
