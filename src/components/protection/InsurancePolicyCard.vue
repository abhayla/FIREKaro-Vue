<script setup lang="ts">
import {
  type InsurancePolicy,
  formatINR,
  formatINRCompact,
  formatDate,
  getDaysUntil,
  getInsuranceTypeIcon,
  getInsuranceTypeColor,
  getStatusColor,
} from '@/composables/useProtection'

const props = defineProps<{
  policy: InsurancePolicy
}>()

const emit = defineEmits<{
  edit: [policy: InsurancePolicy]
  delete: [policy: InsurancePolicy]
  view: [policy: InsurancePolicy]
}>()

const daysUntilExpiry = getDaysUntil(props.policy.endDate)
const isExpiringSoon = daysUntilExpiry > 0 && daysUntilExpiry <= 30

const annualPremium = computed(() => {
  const multiplier = {
    monthly: 12,
    quarterly: 4,
    'half-yearly': 2,
    yearly: 1,
  }
  return props.policy.premium * multiplier[props.policy.paymentFrequency]
})

const frequencyLabel = {
  monthly: '/mo',
  quarterly: '/qtr',
  'half-yearly': '/half-yr',
  yearly: '/yr',
}

import { computed } from 'vue'
</script>

<template>
  <v-card class="policy-card" :class="{ 'expiring-soon': isExpiringSoon }">
    <!-- Header with type badge -->
    <div class="d-flex align-center pa-4 pb-2">
      <v-avatar :color="getInsuranceTypeColor(policy.type)" size="40" class="mr-3">
        <v-icon :icon="getInsuranceTypeIcon(policy.type)" color="white" />
      </v-avatar>
      <div class="flex-grow-1">
        <div class="text-subtitle-1 font-weight-bold">{{ policy.policyName }}</div>
        <div class="text-caption text-medium-emphasis">{{ policy.provider }}</div>
      </div>
      <v-chip :color="getStatusColor(policy.status)" size="small" variant="tonal">
        {{ policy.status }}
      </v-chip>
    </div>

    <!-- Expiry warning -->
    <v-alert
      v-if="isExpiringSoon && policy.status === 'active'"
      type="warning"
      variant="tonal"
      density="compact"
      class="mx-4 mb-2"
    >
      <template #prepend>
        <v-icon icon="mdi-alert" size="small" />
      </template>
      Expires in {{ daysUntilExpiry }} days
    </v-alert>

    <v-card-text class="pt-0">
      <!-- Coverage & Premium -->
      <v-row no-gutters class="mb-3">
        <v-col cols="6">
          <div class="text-caption text-medium-emphasis">Sum Assured</div>
          <div class="text-h6 font-weight-bold text-success">
            {{ formatINRCompact(policy.sumAssured) }}
          </div>
        </v-col>
        <v-col cols="6" class="text-right">
          <div class="text-caption text-medium-emphasis">Premium</div>
          <div class="text-body-1 font-weight-medium">
            {{ formatINR(policy.premium) }}{{ frequencyLabel[policy.paymentFrequency] }}
          </div>
          <div class="text-caption text-medium-emphasis">
            {{ formatINR(annualPremium) }}/yr
          </div>
        </v-col>
      </v-row>

      <!-- Policy details -->
      <v-divider class="mb-3" />

      <div class="d-flex flex-wrap gap-2 mb-3">
        <v-chip size="x-small" variant="outlined" prepend-icon="mdi-identifier">
          {{ policy.policyNumber }}
        </v-chip>
        <v-chip
          v-if="policy.taxBenefit && policy.taxBenefit !== 'none'"
          size="x-small"
          color="primary"
          variant="tonal"
          prepend-icon="mdi-percent"
        >
          Section {{ policy.taxBenefit }}
        </v-chip>
        <v-chip
          v-if="policy.coverageType"
          size="x-small"
          variant="outlined"
          prepend-icon="mdi-account-group"
        >
          {{ policy.coverageType }}
        </v-chip>
      </div>

      <!-- Dates -->
      <div class="text-caption">
        <div class="d-flex justify-space-between mb-1">
          <span class="text-medium-emphasis">Start Date</span>
          <span>{{ formatDate(policy.startDate) }}</span>
        </div>
        <div class="d-flex justify-space-between">
          <span class="text-medium-emphasis">End Date</span>
          <span :class="isExpiringSoon ? 'text-warning font-weight-medium' : ''">
            {{ formatDate(policy.endDate) }}
          </span>
        </div>
      </div>

      <!-- Type-specific details -->
      <template v-if="policy.type === 'health' && policy.roomRent">
        <v-divider class="my-3" />
        <div class="text-caption">
          <div class="d-flex justify-space-between mb-1">
            <span class="text-medium-emphasis">Room Rent</span>
            <span>{{ formatINR(policy.roomRent) }}/day</span>
          </div>
          <div v-if="policy.coPayment" class="d-flex justify-space-between">
            <span class="text-medium-emphasis">Co-payment</span>
            <span>{{ policy.coPayment }}%</span>
          </div>
        </div>
      </template>

      <template v-if="policy.type === 'motor' && policy.vehicleNumber">
        <v-divider class="my-3" />
        <div class="text-caption">
          <div class="d-flex justify-space-between mb-1">
            <span class="text-medium-emphasis">Vehicle</span>
            <span>{{ policy.vehicleNumber }}</span>
          </div>
          <div v-if="policy.idvValue" class="d-flex justify-space-between">
            <span class="text-medium-emphasis">IDV</span>
            <span>{{ formatINR(policy.idvValue) }}</span>
          </div>
        </div>
      </template>

      <!-- Riders -->
      <template v-if="policy.riders && policy.riders.length > 0">
        <v-divider class="my-3" />
        <div class="text-caption text-medium-emphasis mb-1">Riders</div>
        <div class="d-flex flex-wrap gap-1">
          <v-chip
            v-for="rider in policy.riders"
            :key="rider.id"
            size="x-small"
            variant="outlined"
            color="purple"
          >
            {{ rider.name }} ({{ formatINRCompact(rider.sumAssured) }})
          </v-chip>
        </div>
      </template>
    </v-card-text>

    <v-divider />

    <v-card-actions>
      <v-btn variant="text" size="small" @click="emit('view', policy)">
        <v-icon icon="mdi-eye" class="mr-1" size="small" />
        View
      </v-btn>
      <v-spacer />
      <v-btn variant="text" size="small" color="primary" @click="emit('edit', policy)">
        <v-icon icon="mdi-pencil" class="mr-1" size="small" />
        Edit
      </v-btn>
      <v-btn variant="text" size="small" color="error" @click="emit('delete', policy)">
        <v-icon icon="mdi-delete" class="mr-1" size="small" />
        Delete
      </v-btn>
    </v-card-actions>
  </v-card>
</template>

<style scoped>
.policy-card.expiring-soon {
  border-left: 4px solid rgb(var(--v-theme-warning));
}
</style>
