<script setup lang="ts">
import { computed } from 'vue'
import {
  type InsuranceSummary,
  formatINR,
  formatINRCompact,
} from '@/composables/useInsurance'

const props = defineProps<{
  summary: InsuranceSummary | null | undefined
  isLoading?: boolean
}>()

const emit = defineEmits<{
  viewRenewals: []
}>()

const stats = computed(() => {
  if (!props.summary) return []
  return [
    {
      label: 'Life Coverage',
      value: formatINRCompact(props.summary.lifeCoverage),
      icon: 'mdi-heart-pulse',
      color: 'purple',
    },
    {
      label: 'Health Coverage',
      value: formatINRCompact(props.summary.healthCoverage),
      icon: 'mdi-hospital-box',
      color: 'blue',
    },
    {
      label: 'Annual Premium',
      value: formatINR(props.summary.annualPremium),
      icon: 'mdi-cash',
      color: 'orange',
    },
    {
      label: 'Active Policies',
      value: props.summary.totalPolicies.toString(),
      icon: 'mdi-file-document-multiple',
      color: 'green',
    },
  ]
})

const taxDeductions = computed(() => {
  if (!props.summary) return null
  const { section80C, section80D } = props.summary.taxDeductions
  if (section80C === 0 && section80D === 0) return null
  return {
    section80C,
    section80D,
    total: section80C + section80D,
  }
})
</script>

<template>
  <div>
    <!-- Loading State -->
    <v-row v-if="isLoading">
      <v-col v-for="i in 4" :key="i" cols="12" sm="6" md="3">
        <v-card class="pa-4">
          <v-skeleton-loader type="text, text" />
        </v-card>
      </v-col>
    </v-row>

    <!-- Summary Cards -->
    <v-row v-else-if="summary">
      <v-col v-for="stat in stats" :key="stat.label" cols="12" sm="6" md="3">
        <v-card class="pa-4" variant="elevated">
          <div class="d-flex align-center">
            <v-avatar :color="stat.color" size="40" class="mr-3">
              <v-icon :icon="stat.icon" color="white" size="20" />
            </v-avatar>
            <div>
              <div class="text-body-2 text-medium-emphasis">{{ stat.label }}</div>
              <div class="text-h6 font-weight-bold">{{ stat.value }}</div>
            </div>
          </div>
        </v-card>
      </v-col>

      <!-- Upcoming Renewals Alert -->
      <v-col v-if="summary.upcomingRenewals.length > 0" cols="12">
        <v-alert type="warning" variant="tonal" class="mb-0">
          <template #prepend>
            <v-icon icon="mdi-calendar-alert" />
          </template>
          <div class="d-flex align-center justify-space-between">
            <div>
              <div class="font-weight-medium">
                {{ summary.upcomingRenewals.length }} policy{{
                  summary.upcomingRenewals.length > 1 ? 'ies' : 'y'
                }}
                expiring soon
              </div>
              <div class="text-body-2">
                {{ summary.upcomingRenewals.map((p) => p.policyName).join(', ') }}
              </div>
            </div>
            <v-btn variant="text" size="small" @click="emit('viewRenewals')">
              View Details
            </v-btn>
          </div>
        </v-alert>
      </v-col>

      <!-- Tax Deductions Summary -->
      <v-col v-if="taxDeductions" cols="12" md="6">
        <v-card>
          <v-card-title class="text-subtitle-1">
            <v-icon icon="mdi-percent" class="mr-2" size="20" />
            Tax Deductions Available
          </v-card-title>
          <v-card-text>
            <div class="d-flex justify-space-between mb-2">
              <span class="text-medium-emphasis">Section 80C (Life Insurance)</span>
              <span class="font-weight-medium">{{ formatINR(taxDeductions.section80C) }}</span>
            </div>
            <div class="d-flex justify-space-between mb-2">
              <span class="text-medium-emphasis">Section 80D (Health Insurance)</span>
              <span class="font-weight-medium">{{ formatINR(taxDeductions.section80D) }}</span>
            </div>
            <v-divider class="my-2" />
            <div class="d-flex justify-space-between">
              <span class="font-weight-medium">Total Tax Benefit</span>
              <span class="font-weight-bold text-success">
                {{ formatINR(taxDeductions.total) }}
              </span>
            </div>
          </v-card-text>
        </v-card>
      </v-col>

      <!-- Policies by Type -->
      <v-col cols="12" :md="taxDeductions ? 6 : 12">
        <v-card>
          <v-card-title class="text-subtitle-1">
            <v-icon icon="mdi-chart-pie" class="mr-2" size="20" />
            Policies by Type
          </v-card-title>
          <v-card-text>
            <div
              v-for="(count, type) in summary.policiesByType"
              :key="type"
              class="d-flex align-center mb-2"
            >
              <v-chip
                size="small"
                :color="
                  type === 'life'
                    ? 'purple'
                    : type === 'health'
                      ? 'blue'
                      : type === 'motor'
                        ? 'orange'
                        : type === 'home'
                          ? 'green'
                          : 'cyan'
                "
                variant="tonal"
                class="mr-3"
                style="min-width: 80px"
              >
                {{ type }}
              </v-chip>
              <v-progress-linear
                :model-value="(count / summary.totalPolicies) * 100"
                :color="
                  type === 'life'
                    ? 'purple'
                    : type === 'health'
                      ? 'blue'
                      : type === 'motor'
                        ? 'orange'
                        : type === 'home'
                          ? 'green'
                          : 'cyan'
                "
                height="8"
                rounded
                class="flex-grow-1 mr-3"
              />
              <span class="text-body-2 font-weight-medium" style="min-width: 24px">
                {{ count }}
              </span>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Empty State -->
    <v-card v-else class="text-center pa-8">
      <v-icon icon="mdi-shield-off-outline" size="64" color="grey" class="mb-4" />
      <h3 class="text-h6 mb-2">No Insurance Policies</h3>
      <p class="text-medium-emphasis mb-4">
        Add your insurance policies to track coverage and get recommendations.
      </p>
    </v-card>
  </div>
</template>
