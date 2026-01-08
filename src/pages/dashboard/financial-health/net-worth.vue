<script setup lang="ts">
import { computed } from 'vue'
import SectionHeader from '@/components/shared/SectionHeader.vue'
import FamilyToggle from '@/components/shared/FamilyToggle.vue'
import NetWorthChart from '@/components/financial-health/NetWorthChart.vue'
import NetWorthBreakdown from '@/components/financial-health/NetWorthBreakdown.vue'
import { useNetWorth, formatINR } from '@/composables/useFinancialHealth'

const tabs = [
  { title: 'Health Score', route: '/dashboard/financial-health' },
  { title: 'Net Worth', route: '/dashboard/financial-health/net-worth' },
  { title: 'Cash Flow', route: '/dashboard/financial-health/cash-flow' },
  { title: 'Banking', route: '/dashboard/financial-health/banking' },
  { title: 'Emergency Fund', route: '/dashboard/financial-health/emergency-fund' },
  { title: 'Reports', route: '/dashboard/financial-health/reports' },
]

const { data: netWorth, isLoading, isError } = useNetWorth()

// Milestone thresholds in INR
const milestones = [
  { amount: 1000000, label: '10L' },
  { amount: 2500000, label: '25L' },
  { amount: 5000000, label: '50L' },
  { amount: 10000000, label: '1Cr' },
  { amount: 20000000, label: '2Cr' },
  { amount: 50000000, label: '5Cr' },
]

const milestoneProgress = computed(() => {
  if (!netWorth.value) return []
  const current = netWorth.value.netWorth
  return milestones.map(m => ({
    ...m,
    achieved: current >= m.amount,
    progress: Math.min(100, (current / m.amount) * 100)
  }))
})

const nextMilestone = computed(() => {
  if (!netWorth.value) return null
  const current = netWorth.value.netWorth
  const next = milestones.find(m => current < m.amount)
  if (!next) return null
  return {
    ...next,
    remaining: next.amount - current
  }
})
</script>

<template>
  <div>
    <SectionHeader
      title="Financial Health"
      subtitle="Track your net worth over time"
      icon="mdi-heart-pulse"
      :tabs="tabs"
    />
    <FamilyToggle class="mb-6" />

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

    <!-- Main Content -->
    <template v-else-if="netWorth">
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
        class="mb-6"
      />

      <!-- Milestones -->
      <v-card>
        <v-card-title class="d-flex align-center">
          <v-icon icon="mdi-flag-checkered" class="mr-2" />
          Net Worth Milestones
        </v-card-title>
        <v-card-text>
          <div class="d-flex flex-wrap ga-4 mb-4">
            <v-chip
              v-for="milestone in milestoneProgress"
              :key="milestone.label"
              :color="milestone.achieved ? 'success' : 'grey'"
              :variant="milestone.achieved ? 'flat' : 'outlined'"
              size="large"
            >
              <v-icon
                :icon="milestone.achieved ? 'mdi-check-circle' : 'mdi-circle-outline'"
                size="small"
                class="mr-1"
              />
              {{ milestone.label }}
            </v-chip>
          </div>

          <v-alert v-if="nextMilestone" type="info" variant="tonal">
            <template #prepend>
              <v-icon icon="mdi-target" />
            </template>
            <strong>Next milestone: {{ formatINR(nextMilestone.amount, true) }}</strong>
            <br>
            <span class="text-body-2">
              {{ formatINR(nextMilestone.remaining, true) }} away from your next milestone!
            </span>
          </v-alert>

          <v-alert v-else type="success" variant="tonal">
            <template #prepend>
              <v-icon icon="mdi-party-popper" />
            </template>
            <strong>Congratulations!</strong> You've achieved all milestones. Keep growing!
          </v-alert>
        </v-card-text>
      </v-card>
    </template>
  </div>
</template>
