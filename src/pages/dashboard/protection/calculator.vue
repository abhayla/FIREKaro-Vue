<script setup lang="ts">
import SectionHeader from '@/components/shared/SectionHeader.vue'

const tabs = [
  { title: 'Overview', route: '/dashboard/protection' },
  { title: 'Life', route: '/dashboard/protection/life' },
  { title: 'Health', route: '/dashboard/protection/health' },
  { title: 'Other', route: '/dashboard/protection/other' },
  { title: 'Calculator', route: '/dashboard/protection/calculator' },
  { title: 'Reports', route: '/dashboard/protection/reports' },
]
</script>

<template>
  <div>
    <SectionHeader title="Protection" subtitle="Coverage Adequacy Calculator" icon="mdi-shield-check" :tabs="tabs" />
    <v-card class="mt-6">
      <v-card-title>Coverage Calculator</v-card-title>
      <v-card-text>
        <v-alert type="info" variant="tonal">Calculate insurance adequacy using Human Life Value (HLV) method.</v-alert>
      </v-card-text>
    </v-card>
  </div>
</template>
