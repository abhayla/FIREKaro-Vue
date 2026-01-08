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
      subtitle="Deductions & Exemptions (80C/80D)"
      icon="mdi-calculator-variant"
      :tabs="tabs"
    />

    <v-card class="mt-6">
      <v-card-title>Tax Deductions</v-card-title>
      <v-card-text>
        <v-alert type="info" variant="tonal" class="mb-4">
          Track and optimize your tax deductions under various sections.
        </v-alert>
      </v-card-text>
    </v-card>
  </div>
</template>
