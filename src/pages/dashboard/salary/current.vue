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
      subtitle="Current salary breakdown"
      icon="mdi-cash-multiple"
      :tabs="tabs"
    />

    <v-card class="mt-6">
      <v-card-title>Current Salary Breakdown</v-card-title>
      <v-card-text>
        <p class="text-medium-emphasis mb-4">
          Configure your current salary components.
        </p>
        <v-alert type="info" variant="tonal">
          This feature is under development. Data will be fetched from the API.
        </v-alert>
      </v-card-text>
    </v-card>
  </div>
</template>
