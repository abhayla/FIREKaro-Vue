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
  (e: 'viewSchedule', loan: Loan): void
}>()

// Calculate progress percentage
const progressPercent = computed(() => {
  const totalPaid = props.loan.totalPrincipalPaid + props.loan.totalInterestPaid
  const totalAmount = props.loan.principalAmount + props.loan.totalInterestPaid +
    (props.loan.outstandingPrincipal * (props.loan.interestRate / 100) * (getRemainingMonths() / 12))
  return Math.min(100, Math.round((totalPaid / totalAmount) * 100))
})

// Calculate remaining months
function getRemainingMonths(): number {
  const end = new Date(props.loan.endDate)
  const now = new Date()
  const months = (end.getFullYear() - now.getFullYear()) * 12 + (end.getMonth() - now.getMonth())
  return Math.max(0, months)
}

// Next EMI date
const nextEmiDate = computed(() => {
  const today = new Date()
  const emiDay = props.loan.emiDate
  let nextDate = new Date(today.getFullYear(), today.getMonth(), emiDay)
  if (nextDate <= today) {
    nextDate.setMonth(nextDate.getMonth() + 1)
  }
  return nextDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
})

// Days until next EMI
const daysUntilEmi = computed(() => {
  const today = new Date()
  const emiDay = props.loan.emiDate
  let nextDate = new Date(today.getFullYear(), today.getMonth(), emiDay)
  if (nextDate <= today) {
    nextDate.setMonth(nextDate.getMonth() + 1)
  }
  const diff = Math.ceil((nextDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
  return diff
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
        <div class="text-subtitle-1 font-weight-bold">{{ loan.lenderName }}</div>
        <div class="text-caption text-medium-emphasis">
          {{ getLoanTypeLabel(loan.loanType) }}
          <span v-if="loan.accountNumber"> - {{ loan.accountNumber }}</span>
        </div>
      </div>
      <v-chip
        :color="loan.isActive ? 'success' : 'grey'"
        size="small"
        variant="tonal"
      >
        {{ loan.isActive ? 'Active' : 'Closed' }}
      </v-chip>
    </v-card-title>

    <v-divider />

    <v-card-text>
      <!-- Outstanding Amount -->
      <div class="d-flex justify-space-between align-center mb-3">
        <div>
          <div class="text-caption text-medium-emphasis">Outstanding</div>
          <div class="text-h5 font-weight-bold">{{ formatINRCompact(loan.outstandingPrincipal) }}</div>
        </div>
        <div class="text-right">
          <div class="text-caption text-medium-emphasis">Original</div>
          <div class="text-body-1">{{ formatINRCompact(loan.principalAmount) }}</div>
        </div>
      </div>

      <!-- Progress Bar -->
      <div class="mb-3">
        <div class="d-flex justify-space-between text-caption mb-1">
          <span>Paid: {{ formatINRCompact(loan.totalPrincipalPaid) }}</span>
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
          <div class="text-subtitle-2 font-weight-bold">{{ getRemainingMonths() }} mo</div>
        </v-col>
      </v-row>

      <!-- Next EMI Alert -->
      <v-alert
        v-if="loan.isActive"
        :color="daysUntilEmi <= 5 ? 'warning' : 'info'"
        variant="tonal"
        density="compact"
        class="mt-3"
      >
        <div class="d-flex justify-space-between align-center">
          <span>
            <v-icon icon="mdi-calendar-clock" size="small" class="mr-1" />
            Next EMI: {{ nextEmiDate }}
          </span>
          <v-chip size="x-small" :color="daysUntilEmi <= 5 ? 'warning' : 'info'">
            {{ daysUntilEmi }} days
          </v-chip>
        </div>
      </v-alert>

      <!-- Tax Benefits (if applicable) -->
      <div v-if="loan.section80C || loan.section24 || loan.section80E" class="mt-3">
        <div class="text-caption text-medium-emphasis mb-1">Tax Benefits</div>
        <div class="d-flex gap-2 flex-wrap">
          <v-chip v-if="loan.section80C" size="small" color="success" variant="tonal">
            80C: {{ formatINRCompact(loan.section80C) }}
          </v-chip>
          <v-chip v-if="loan.section24" size="small" color="primary" variant="tonal">
            24(b): {{ formatINRCompact(loan.section24) }}
          </v-chip>
          <v-chip v-if="loan.section80E" size="small" color="teal" variant="tonal">
            80E: {{ formatINRCompact(loan.section80E) }}
          </v-chip>
        </div>
      </div>
    </v-card-text>

    <!-- Actions -->
    <v-card-actions v-if="showActions" class="pt-0">
      <v-btn
        variant="text"
        size="small"
        color="primary"
        prepend-icon="mdi-table"
        @click="emit('viewSchedule', loan)"
      >
        Schedule
      </v-btn>
      <v-btn
        v-if="loan.isActive"
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
