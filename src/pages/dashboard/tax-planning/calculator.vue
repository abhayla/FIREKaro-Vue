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
      subtitle="Old vs New Regime Calculator"
      icon="mdi-calculator-variant"
      :tabs="tabs"
    />

    <v-card class="mt-6">
      <v-card-title>Tax Calculator</v-card-title>
      <v-card-text>
        <v-alert type="info" variant="tonal" class="mb-4">
          Calculate and compare your tax liability under Old and New tax regimes.
        </v-alert>
      </v-card-text>
    </v-card>
  </div>
</template>
