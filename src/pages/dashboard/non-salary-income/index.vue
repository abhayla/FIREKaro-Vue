<script setup lang="ts">
import SectionHeader from '@/components/shared/SectionHeader.vue'
import FamilyToggle from '@/components/shared/FamilyToggle.vue'

const tabs = [
  { title: 'Overview', route: '/dashboard/non-salary-income' },
  { title: 'Business', route: '/dashboard/non-salary-income/business' },
  { title: 'Rental', route: '/dashboard/non-salary-income/rental' },
  { title: 'Capital Gains', route: '/dashboard/non-salary-income/capital-gains' },
  { title: 'Other', route: '/dashboard/non-salary-income/other' },
  { title: 'Reports', route: '/dashboard/non-salary-income/reports' },
]
</script>

<template>
  <div>
    <SectionHeader
      title="Non-Salary Income"
      subtitle="Track all your income sources beyond salary"
      icon="mdi-cash-plus"
      :tabs="tabs"
    />

    <FamilyToggle class="mb-6" />

    <v-row>
      <v-col cols="12" md="6" lg="3">
        <v-card class="pa-4">
          <div class="text-body-2 text-medium-emphasis">Business Income</div>
          <div class="text-h5 font-weight-bold">Loading...</div>
        </v-card>
      </v-col>
      <v-col cols="12" md="6" lg="3">
        <v-card class="pa-4">
          <div class="text-body-2 text-medium-emphasis">Rental Income</div>
          <div class="text-h5 font-weight-bold">Loading...</div>
        </v-card>
      </v-col>
      <v-col cols="12" md="6" lg="3">
        <v-card class="pa-4">
          <div class="text-body-2 text-medium-emphasis">Capital Gains</div>
          <div class="text-h5 font-weight-bold">Loading...</div>
        </v-card>
      </v-col>
      <v-col cols="12" md="6" lg="3">
        <v-card class="pa-4">
          <div class="text-body-2 text-medium-emphasis">Other Sources</div>
          <div class="text-h5 font-weight-bold">Loading...</div>
        </v-card>
      </v-col>
    </v-row>

    <v-card class="mt-6">
      <v-card-title>Income Sources Overview</v-card-title>
      <v-card-text>
        <p class="text-medium-emphasis">
          Manage multiple income sources for accurate ITR filing. Supports Business/Profession (44AD/44ADA),
          Rental Income, Capital Gains, and Other Sources.
        </p>
      </v-card-text>
    </v-card>
  </div>
</template>
