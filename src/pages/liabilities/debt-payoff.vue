<script setup lang="ts">
import { ref } from 'vue'
import SectionHeader from '@/components/shared/SectionHeader.vue'
import DebtPayoffOverviewTab from '@/components/liabilities/DebtPayoffOverviewTab.vue'
import DebtPayoffDetailsTab from '@/components/liabilities/DebtPayoffDetailsTab.vue'

// Internal tab state (Overview vs Details)
const activeTab = ref('overview')

// Shared state between tabs
const extraPayment = ref(10000)
const selectedStrategy = ref<'snowball' | 'avalanche' | 'custom'>('avalanche')
</script>

<template>
  <div>
    <!-- Section Header -->
    <SectionHeader
      title="Debt Payoff"
      subtitle="Payoff strategies and planning"
      icon="mdi-chart-timeline-variant"
    />

    <!-- Internal Tab Navigation (Overview / Details) -->
    <v-tabs v-model="activeTab" color="primary" density="compact" class="mb-4">
      <v-tab value="overview">Overview</v-tab>
      <v-tab value="details">Details</v-tab>
    </v-tabs>

    <!-- Tab Content -->
    <v-window v-model="activeTab">
      <!-- Overview Tab -->
      <v-window-item value="overview">
        <DebtPayoffOverviewTab
          v-model:extra-payment="extraPayment"
          v-model:selected-strategy="selectedStrategy"
          @go-to-details="activeTab = 'details'"
        />
      </v-window-item>

      <!-- Details Tab -->
      <v-window-item value="details">
        <DebtPayoffDetailsTab
          :extra-payment="extraPayment"
          v-model:selected-strategy="selectedStrategy"
        />
      </v-window-item>
    </v-window>
  </div>
</template>

