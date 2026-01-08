<script setup lang="ts">
import SectionHeader from '@/components/shared/SectionHeader.vue'

const tabs = [
  { title: 'Overview', route: '/dashboard/salary' },
  { title: 'Current Salary', route: '/dashboard/salary/current' },
  { title: 'Salary History', route: '/dashboard/salary/history' },
  { title: 'Reports', route: '/dashboard/salary/reports' },
]
</script>

<template>
  <div>
    <SectionHeader
      title="Salary"
      subtitle="Salary reports and analytics"
      icon="mdi-cash-multiple"
      :tabs="tabs"
    />

    <v-card class="mt-6">
      <v-card-title>Salary Reports</v-card-title>
      <v-card-text>
        <v-alert type="info" variant="tonal">
          Reports feature coming soon. View salary trends, growth analysis, and tax projections.
        </v-alert>
      </v-card-text>
    </v-card>
  </div>
</template>
