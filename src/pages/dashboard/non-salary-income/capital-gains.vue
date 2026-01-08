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
      subtitle="Capital Gains (STCG/LTCG)"
      icon="mdi-cash-plus"
      :tabs="tabs"
    />

    <v-card class="mt-6">
      <v-card-title>Capital Gains</v-card-title>
      <v-card-text>
        <v-alert type="info" variant="tonal" class="mb-4">
          Track Short-Term and Long-Term Capital Gains from equity, debt, and property transactions.
        </v-alert>
      </v-card-text>
    </v-card>
  </div>
</template>
