<script setup lang="ts">
import { ref } from 'vue'
import SectionHeader from '@/components/shared/SectionHeader.vue'
import NetWorthChart from '@/components/financial-health/NetWorthChart.vue'
import NetWorthBreakdown from '@/components/financial-health/NetWorthBreakdown.vue'
import NetWorthMilestones from '@/components/financial-health/NetWorthMilestones.vue'
import { useNetWorth, formatINR } from '@/composables/useFinancialHealth'

const tabs = [
  { title: 'Health Score', route: '/financial-health' },
  { title: 'Net Worth', route: '/financial-health/net-worth' },
  { title: 'Cash Flow', route: '/financial-health/cash-flow' },
  { title: 'Banking', route: '/financial-health/banking' },
  { title: 'Emergency Fund', route: '/financial-health/emergency-fund' },
  { title: 'Reports', route: '/financial-health/reports' },
]

// Internal tab state for Overview/Details
const activeTab = ref('overview')

const { data: netWorth, isLoading, isError } = useNetWorth()
</script>

<template>
  <div>
    <SectionHeader
      title="Financial Health"
      subtitle="Track your net worth over time"
      icon="mdi-heart-pulse"
      :tabs="tabs"
    />

    <!-- Internal Tab Navigation -->
    <v-tabs v-model="activeTab" color="primary" class="mb-4">
      <v-tab value="overview">
        <v-icon icon="mdi-chart-box" size="small" class="mr-2" />
        Overview
      </v-tab>
      <v-tab value="details">
        <v-icon icon="mdi-flag-checkered" size="small" class="mr-2" />
        Details
      </v-tab>
    </v-tabs>

    <!-- Loading State -->
    <div v-if="isLoading" class="text-center py-8">
      <v-progress-circular indeterminate color="primary" size="48" />
      <p class="text-body-2 text-medium-emphasis mt-4">Loading net worth data...</p>
    </div>

    <!-- Error State -->
    <v-alert v-else-if="isError" type="error" variant="tonal" class="mb-6">
      <v-icon icon="mdi-alert-circle" class="mr-2" />
      Failed to load net worth data. Please try again later.
    </v-alert>

    <!-- Tab Content -->
    <v-window v-else-if="netWorth" v-model="activeTab">
      <!-- Overview Tab -->
      <v-window-item value="overview">
        <!-- Summary Cards -->
        <v-row class="mb-6">
          <v-col cols="12" sm="4">
            <v-card class="pa-4">
              <div class="text-body-2 text-medium-emphasis">Total Net Worth</div>
              <div class="text-h4 font-weight-bold text-primary">{{ formatINR(netWorth.netWorth, true) }}</div>
              <div class="d-flex align-center mt-1">
                <v-chip
                  :color="netWorth.yearlyChangePercent >= 0 ? 'success' : 'error'"
                  size="small"
                  class="mr-2"
                >
                  <v-icon
                    :icon="netWorth.yearlyChangePercent >= 0 ? 'mdi-arrow-up' : 'mdi-arrow-down'"
                    size="x-small"
                    class="mr-1"
                  />
                  {{ netWorth.yearlyChangePercent >= 0 ? '+' : '' }}{{ netWorth.yearlyChangePercent.toFixed(1) }}%
                </v-chip>
                <span class="text-caption text-medium-emphasis">vs last year</span>
              </div>
            </v-card>
          </v-col>

          <v-col cols="12" sm="4">
            <v-card class="pa-4">
              <div class="text-body-2 text-medium-emphasis">Monthly Change</div>
              <div class="text-h5 font-weight-bold" :class="netWorth.monthlyChange >= 0 ? 'text-success' : 'text-error'">
                {{ netWorth.monthlyChange >= 0 ? '+' : '' }}{{ formatINR(netWorth.monthlyChange, true) }}
              </div>
              <div class="text-caption text-medium-emphasis">
                {{ netWorth.monthlyChangePercent >= 0 ? '+' : '' }}{{ netWorth.monthlyChangePercent.toFixed(1) }}% this month
              </div>
            </v-card>
          </v-col>

          <v-col cols="12" sm="4">
            <v-card class="pa-4">
              <div class="text-body-2 text-medium-emphasis">Yearly Change</div>
              <div class="text-h5 font-weight-bold" :class="netWorth.yearlyChange >= 0 ? 'text-success' : 'text-error'">
                {{ netWorth.yearlyChange >= 0 ? '+' : '' }}{{ formatINR(netWorth.yearlyChange, true) }}
              </div>
              <div class="text-caption text-medium-emphasis">
                {{ netWorth.yearlyChangePercent >= 0 ? '+' : '' }}{{ netWorth.yearlyChangePercent.toFixed(1) }}% this year
              </div>
            </v-card>
          </v-col>
        </v-row>

        <!-- Net Worth Trend Chart -->
        <v-card class="mb-6">
          <v-card-title class="d-flex align-center">
            <v-icon icon="mdi-chart-line" class="mr-2" />
            Net Worth Trend (12 Months)
          </v-card-title>
          <v-card-text>
            <NetWorthChart :data="netWorth.history" :height="350" />
          </v-card-text>
        </v-card>

        <!-- Asset/Liability Breakdown -->
        <NetWorthBreakdown
          :assets="netWorth.assetBreakdown"
          :liabilities="netWorth.liabilityBreakdown"
          :total-assets="netWorth.totalAssets"
          :total-liabilities="netWorth.totalLiabilities"
          :net-worth="netWorth.netWorth"
        />
      </v-window-item>

      <!-- Details Tab -->
      <v-window-item value="details">
        <!-- Customizable Net Worth Milestones -->
        <NetWorthMilestones :current-net-worth="netWorth.netWorth" />
      </v-window-item>
    </v-window>
  </div>
</template>
