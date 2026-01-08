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
      subtitle="Monthly salary history"
      icon="mdi-cash-multiple"
      :tabs="tabs"
    />

    <v-card class="mt-6">
      <v-card-title>Salary History</v-card-title>
      <v-card-text>
        <v-data-table
          :headers="[
            { title: 'Month', key: 'month' },
            { title: 'Gross', key: 'gross' },
            { title: 'Net', key: 'net' },
            { title: 'Actions', key: 'actions' },
          ]"
          :items="[]"
          :loading="true"
        >
          <template #no-data>
            <v-alert type="info" variant="tonal">
              No salary history records found. Add your first salary entry.
            </v-alert>
          </template>
        </v-data-table>
      </v-card-text>
    </v-card>
  </div>
</template>
