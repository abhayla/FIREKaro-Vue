<script setup lang="ts">
import SectionHeader from '@/components/shared/SectionHeader.vue'

const tabs = [
  { title: 'Overview', route: '/dashboard/tax-planning' },
  { title: 'Calculator', route: '/dashboard/tax-planning/calculator' },
  { title: 'Deductions', route: '/dashboard/tax-planning/deductions' },
  { title: 'Reports', route: '/dashboard/tax-planning/reports' },
]
</script>

<template>
  <div>
    <SectionHeader
      title="Tax Planning"
      subtitle="Tax Reports & ITR Suggestions"
      icon="mdi-calculator-variant"
      :tabs="tabs"
    />

    <v-card class="mt-6">
      <v-card-title>Tax Reports</v-card-title>
      <v-card-text>
        <v-alert type="info" variant="tonal">
          View tax reports and get ITR form suggestions (ITR-1/2/3/4) based on your income sources.
        </v-alert>
      </v-card-text>
    </v-card>
  </div>
</template>
