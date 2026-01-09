<script setup lang="ts">
import { computed } from 'vue'
import {
  type Loan,
  formatINR,
  formatINRCompact,
  getLoanTypeLabel,
  getLoanTypeIcon,
  getLoanTypeColor,
  formatDate
} from '@/composables/useLiabilities'

const props = defineProps<{
  loan: Loan
  showActions?: boolean
}>()

const emit = defineEmits<{
  (e: 'edit', loan: Loan): void
  (e: 'delete', id: string): void
  (e: 'prepay', loan: Loan): void
  (e: 'view-schedule', loan: Loan): void
}>()

// Calculate principal paid
const principalPaid = computed(() => {
  return props.loan.principalAmount - props.loan.outstandingAmount
})

// Calculate progress percentage based on principal paid
const progressPercent = computed(() => {
  if (props.loan.principalAmount <= 0) return 0
  return Math.min(100, Math.round((principalPaid.value / props.loan.principalAmount) * 100))
})

// Is loan active
const isActive = computed(() => props.loan.status === 'ACTIVE')

// Remaining tenure from backend or calculate
const remainingMonths = computed(() => props.loan.remainingTenure ?? 0)

// Next EMI date display
const nextEmiDateDisplay = computed(() => {
  if (!props.loan.nextEmiDate) return null
  return formatDate(props.loan.nextEmiDate)
})

// Days until next EMI
const daysUntilEmi = computed(() => {
  if (!props.loan.nextEmiDate) return null
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const nextDate = new Date(props.loan.nextEmiDate)
  nextDate.setHours(0, 0, 0, 0)
  const diff = Math.ceil((nextDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
  return diff
})

// Tax benefit section display
const taxBenefitLabel = computed(() => {
  if (!props.loan.taxBenefitSection) return null
  return props.loan.taxBenefitSection
})
</script>

<template>
  <v-card variant="outlined" class="loan-card h-100">
    <!-- Header -->
    <v-card-title class="d-flex align-center pb-2">
      <v-avatar :color="getLoanTypeColor(loan.loanType)" size="40" class="mr-3">
        <v-icon :icon="getLoanTypeIcon(loan.loanType)" color="white" />
      </v-avatar>
      <div class="flex-grow-1">
        <div class="text-subtitle-1 font-weight-bold">{{ loan.loanName }}</div>
        <div class="text-caption text-medium-emphasis">
          {{ loan.lender }}
          <span v-if="loan.loanAccountNumber"> - {{ loan.loanAccountNumber }}</span>
        </div>
      </div>
      <v-chip
        :color="isActive ? 'success' : 'grey'"
        size="small"
        variant="tonal"
      >
        {{ isActive ? 'Active' : loan.status }}
      </v-chip>
    </v-card-title>

    <v-divider />

    <v-card-text>
      <!-- Outstanding Amount -->
      <div class="d-flex justify-space-between align-center mb-3">
        <div>
          <div class="text-caption text-medium-emphasis">Outstanding</div>
          <div class="text-h5 font-weight-bold">{{ formatINRCompact(loan.outstandingAmount) }}</div>
        </div>
        <div class="text-right">
          <div class="text-caption text-medium-emphasis">Original</div>
          <div class="text-body-1">{{ formatINRCompact(loan.principalAmount) }}</div>
        </div>
      </div>

      <!-- Progress Bar -->
      <div class="mb-3">
        <div class="d-flex justify-space-between text-caption mb-1">
          <span>Paid: {{ formatINRCompact(principalPaid) }}</span>
          <span>{{ progressPercent }}% Complete</span>
        </div>
        <v-progress-linear
          :model-value="progressPercent"
          :color="getLoanTypeColor(loan.loanType)"
          height="8"
          rounded
        />
      </div>

      <!-- Key Details Grid -->
      <v-row dense class="text-center">
        <v-col cols="4">
          <div class="text-caption text-medium-emphasis">EMI</div>
          <div class="text-subtitle-2 font-weight-bold">{{ formatINR(loan.emiAmount) }}</div>
        </v-col>
        <v-col cols="4">
          <div class="text-caption text-medium-emphasis">Rate</div>
          <div class="text-subtitle-2 font-weight-bold">{{ loan.interestRate }}%</div>
        </v-col>
        <v-col cols="4">
          <div class="text-caption text-medium-emphasis">Remaining</div>
          <div class="text-subtitle-2 font-weight-bold">{{ remainingMonths }} mo</div>
        </v-col>
      </v-row>

      <!-- Next EMI Alert -->
      <v-alert
        v-if="isActive && nextEmiDateDisplay && daysUntilEmi !== null"
        :color="daysUntilEmi <= 5 ? 'warning' : 'info'"
        variant="tonal"
        density="compact"
        class="mt-3"
      >
        <div class="d-flex justify-space-between align-center">
          <span>
            <v-icon icon="mdi-calendar-clock" size="small" class="mr-1" />
            Next EMI: {{ nextEmiDateDisplay }}
          </span>
          <v-chip size="x-small" :color="daysUntilEmi <= 5 ? 'warning' : 'info'">
            {{ daysUntilEmi }} days
          </v-chip>
        </div>
      </v-alert>

      <!-- Loan Details -->
      <div class="mt-3 text-caption text-medium-emphasis">
        <div class="d-flex justify-space-between">
          <span>{{ getLoanTypeLabel(loan.loanType) }}</span>
          <span>Maturity: {{ formatDate(loan.maturityDate) }}</span>
        </div>
      </div>

      <!-- Tax Benefits (if applicable) -->
      <div v-if="taxBenefitLabel" class="mt-2">
        <v-chip size="small" color="success" variant="tonal">
          Tax: {{ taxBenefitLabel }}
          <span v-if="loan.maxTaxBenefit"> (Max: {{ formatINRCompact(loan.maxTaxBenefit) }})</span>
        </v-chip>
      </div>
    </v-card-text>

    <!-- Actions -->
    <v-card-actions v-if="showActions" class="pt-0">
      <v-btn
        variant="text"
        size="small"
        color="primary"
        prepend-icon="mdi-table"
        @click="emit('view-schedule', loan)"
      >
        Schedule
      </v-btn>
      <v-btn
        v-if="isActive"
        variant="text"
        size="small"
        color="success"
        prepend-icon="mdi-cash-plus"
        @click="emit('prepay', loan)"
      >
        Prepay
      </v-btn>
      <v-spacer />
      <v-btn
        icon="mdi-pencil"
        size="small"
        variant="text"
        @click="emit('edit', loan)"
      />
      <v-btn
        icon="mdi-delete"
        size="small"
        variant="text"
        color="error"
        @click="emit('delete', loan.id)"
      />
    </v-card-actions>
  </v-card>
</template>

<style scoped>
.loan-card {
  transition: transform 0.2s, box-shadow 0.2s;
}
.loan-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}
</style>
