<script setup lang="ts">
import SectionHeader from '@/components/shared/SectionHeader.vue'

const tabs = [
  { title: 'Overview', route: '/dashboard/liabilities' },
  { title: 'Loans', route: '/dashboard/liabilities/loans' },
  { title: 'Credit Cards', route: '/dashboard/liabilities/credit-cards' },
  { title: 'Debt Payoff', route: '/dashboard/liabilities/debt-payoff' },
  { title: 'Reports', route: '/dashboard/liabilities/reports' },
]
</script>

<template>
  <div>
    <SectionHeader title="Liabilities" subtitle="Debt Payoff Strategies" icon="mdi-credit-card-outline" :tabs="tabs" />
    <v-card class="mt-6">
      <v-card-title>Debt Payoff</v-card-title>
      <v-card-text>
        <v-alert type="info" variant="tonal">Compare Snowball, Avalanche, and custom payoff strategies.</v-alert>
      </v-card-text>
    </v-card>
  </div>
</template>
