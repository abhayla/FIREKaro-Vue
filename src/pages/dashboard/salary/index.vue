<script setup lang="ts">
import SectionHeader from '@/components/shared/SectionHeader.vue'
import FamilyToggle from '@/components/shared/FamilyToggle.vue'

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
      subtitle="Track your salary income and history"
      icon="mdi-cash-multiple"
      :tabs="tabs"
    />

    <FamilyToggle class="mb-6" />

    <v-row>
      <v-col cols="12" md="6" lg="3">
        <v-card class="pa-4">
          <div class="text-body-2 text-medium-emphasis">Monthly Gross</div>
          <div class="text-h5 font-weight-bold">Loading...</div>
        </v-card>
      </v-col>
      <v-col cols="12" md="6" lg="3">
        <v-card class="pa-4">
          <div class="text-body-2 text-medium-emphasis">Monthly Net</div>
          <div class="text-h5 font-weight-bold">Loading...</div>
        </v-card>
      </v-col>
      <v-col cols="12" md="6" lg="3">
        <v-card class="pa-4">
          <div class="text-body-2 text-medium-emphasis">Annual CTC</div>
          <div class="text-h5 font-weight-bold">Loading...</div>
        </v-card>
      </v-col>
      <v-col cols="12" md="6" lg="3">
        <v-card class="pa-4">
          <div class="text-body-2 text-medium-emphasis">Tax (YTD)</div>
          <div class="text-h5 font-weight-bold">Loading...</div>
        </v-card>
      </v-col>
    </v-row>

    <v-card class="mt-6">
      <v-card-title>Salary Overview</v-card-title>
      <v-card-text>
        <p class="text-medium-emphasis">
          This section will display your salary breakdown, including basic pay, HRA, allowances, and deductions.
        </p>
      </v-card-text>
    </v-card>
  </div>
</template>
