<script setup lang="ts">
import SectionHeader from '@/components/shared/SectionHeader.vue'
import FamilyToggle from '@/components/shared/FamilyToggle.vue'

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
    <SectionHeader title="Financial Health" subtitle="Your financial health score" icon="mdi-heart-pulse" :tabs="tabs" />
    <FamilyToggle class="mb-6" />
    <v-row>
      <v-col cols="12" md="3">
        <v-card class="pa-4">
          <div class="text-body-2 text-medium-emphasis">Health Score</div>
          <div class="text-h5 font-weight-bold">Loading...</div>
        </v-card>
      </v-col>
      <v-col cols="12" md="3">
        <v-card class="pa-4">
          <div class="text-body-2 text-medium-emphasis">Net Worth</div>
          <div class="text-h5 font-weight-bold">Loading...</div>
        </v-card>
      </v-col>
      <v-col cols="12" md="3">
        <v-card class="pa-4">
          <div class="text-body-2 text-medium-emphasis">Savings Rate</div>
          <div class="text-h5 font-weight-bold">Loading...</div>
        </v-card>
      </v-col>
      <v-col cols="12" md="3">
        <v-card class="pa-4">
          <div class="text-body-2 text-medium-emphasis">Emergency Fund</div>
          <div class="text-h5 font-weight-bold">Loading...</div>
        </v-card>
      </v-col>
    </v-row>
    <v-card class="mt-6">
      <v-card-title>Financial Health Overview</v-card-title>
      <v-card-text>
        <p class="text-medium-emphasis">Track your overall financial health score based on 4 key factors.</p>
      </v-card-text>
    </v-card>
  </div>
</template>
