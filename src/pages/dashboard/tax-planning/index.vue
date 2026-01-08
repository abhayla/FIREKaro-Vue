<script setup lang="ts">
import SectionHeader from '@/components/shared/SectionHeader.vue'
import FamilyToggle from '@/components/shared/FamilyToggle.vue'

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
      subtitle="Optimize your taxes with Old vs New regime comparison"
      icon="mdi-calculator-variant"
      :tabs="tabs"
    />

    <FamilyToggle class="mb-6" />

    <v-row>
      <v-col cols="12" md="4">
        <v-card class="pa-4">
          <div class="text-body-2 text-medium-emphasis">Old Regime Tax</div>
          <div class="text-h5 font-weight-bold">Loading...</div>
        </v-card>
      </v-col>
      <v-col cols="12" md="4">
        <v-card class="pa-4">
          <div class="text-body-2 text-medium-emphasis">New Regime Tax</div>
          <div class="text-h5 font-weight-bold">Loading...</div>
        </v-card>
      </v-col>
      <v-col cols="12" md="4">
        <v-card class="pa-4 bg-success-lighten-5">
          <div class="text-body-2 text-medium-emphasis">Recommended</div>
          <div class="text-h5 font-weight-bold">Loading...</div>
        </v-card>
      </v-col>
    </v-row>

    <v-card class="mt-6">
      <v-card-title>Tax Planning Overview</v-card-title>
      <v-card-text>
        <p class="text-medium-emphasis">
          Compare Old vs New tax regimes, track deductions under Section 80C/80D/80E,
          and get personalized recommendations for tax savings.
        </p>
      </v-card-text>
    </v-card>
  </div>
</template>
