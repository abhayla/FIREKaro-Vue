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
      subtitle="Income Reports & Analytics"
      icon="mdi-cash-plus"
      :tabs="tabs"
    />

    <v-card class="mt-6">
      <v-card-title>Income Reports</v-card-title>
      <v-card-text>
        <v-alert type="info" variant="tonal">
          Reports feature coming soon. View income trends and tax implications across all sources.
        </v-alert>
      </v-card-text>
    </v-card>
  </div>
</template>
