<script setup lang="ts">
import SectionHeader from '@/components/shared/SectionHeader.vue'
import FamilyToggle from '@/components/shared/FamilyToggle.vue'

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
    <SectionHeader title="Protection" subtitle="Insurance coverage analysis" icon="mdi-shield-check" :tabs="tabs" />
    <FamilyToggle class="mb-6" />
    <v-row>
      <v-col cols="12" md="4">
        <v-card class="pa-4">
          <div class="text-body-2 text-medium-emphasis">Life Coverage</div>
          <div class="text-h5 font-weight-bold">Loading...</div>
        </v-card>
      </v-col>
      <v-col cols="12" md="4">
        <v-card class="pa-4">
          <div class="text-body-2 text-medium-emphasis">Health Coverage</div>
          <div class="text-h5 font-weight-bold">Loading...</div>
        </v-card>
      </v-col>
      <v-col cols="12" md="4">
        <v-card class="pa-4">
          <div class="text-body-2 text-medium-emphasis">Annual Premium</div>
          <div class="text-h5 font-weight-bold">Loading...</div>
        </v-card>
      </v-col>
    </v-row>
    <v-card class="mt-6">
      <v-card-title>Protection Overview</v-card-title>
      <v-card-text>
        <p class="text-medium-emphasis">Track insurance policies and analyze coverage adequacy using HLV method.</p>
      </v-card-text>
    </v-card>
  </div>
</template>
