<script setup lang="ts">
import SectionHeader from '@/components/shared/SectionHeader.vue'

const tabs = [
  { title: 'Health Score', route: '/dashboard/financial-health' },
  { title: 'Net Worth', route: '/dashboard/financial-health/net-worth' },
  { title: 'Cash Flow', route: '/dashboard/financial-health/cash-flow' },
  { title: 'Banking', route: '/dashboard/financial-health/banking' },
  { title: 'Emergency Fund', route: '/dashboard/financial-health/emergency-fund' },
  { title: 'Reports', route: '/dashboard/financial-health/reports' },
]
</script>

<template>
  <div>
    <SectionHeader title="Financial Health" subtitle="Net Worth Tracker" icon="mdi-heart-pulse" :tabs="tabs" />
    <v-card class="mt-6">
      <v-card-title>Net Worth</v-card-title>
      <v-card-text>
        <v-alert type="info" variant="tonal">Track your net worth over time with asset and liability breakdown.</v-alert>
      </v-card-text>
    </v-card>
  </div>
</template>
