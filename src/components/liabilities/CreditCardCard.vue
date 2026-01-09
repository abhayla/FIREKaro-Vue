<script setup lang="ts">
import { computed } from 'vue'
import {
  type CreditCard,
  formatINR,
  formatINRCompact,
  calculateCreditUtilization,
  calculateMinimumDue,
  getNextDueDate
} from '@/composables/useLiabilities'

const props = defineProps<{
  card: CreditCard
  showActions?: boolean
}>()

const emit = defineEmits<{
  (e: 'edit', card: CreditCard): void
  (e: 'delete', id: string): void
  (e: 'record-payment', card: CreditCard): void
  (e: 'view-statements', card: CreditCard): void
}>()

// Calculate utilization percentage from outstanding and limit
const utilizationPercent = computed(() => {
  return calculateCreditUtilization(props.card.currentOutstanding ?? 0, props.card.creditLimit ?? 1)
})

// Calculate minimum due (5% of outstanding or ₹200, whichever is higher)
const minimumDue = computed(() => {
  return calculateMinimumDue(props.card.currentOutstanding ?? 0)
})

// Calculate next due date from payment due day
const nextDueDate = computed(() => {
  return getNextDueDate(props.card)
})

// Utilization color based on percentage
const utilizationColor = computed(() => {
  const util = utilizationPercent.value
  if (util <= 30) return 'success'
  if (util <= 50) return 'primary'
  if (util <= 70) return 'warning'
  return 'error'
})

// Days until due date
const daysUntilDue = computed(() => {
  const today = new Date()
  const dueDate = new Date(nextDueDate.value)
  const diff = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
  return diff
})

// Due status
const dueStatus = computed(() => {
  if (daysUntilDue.value < 0) return { text: 'Overdue', color: 'error' }
  if (daysUntilDue.value === 0) return { text: 'Due Today', color: 'error' }
  if (daysUntilDue.value <= 5) return { text: `${daysUntilDue.value} days`, color: 'warning' }
  return { text: `${daysUntilDue.value} days`, color: 'success' }
})

// Card type icon
const cardTypeIcon = computed(() => {
  const icons: Record<string, string> = {
    VISA: 'mdi-credit-card',
    MASTERCARD: 'mdi-credit-card-outline',
    RUPAY: 'mdi-credit-card-chip',
    AMEX: 'mdi-credit-card-multiple'
  }
  return icons[props.card.cardType] || 'mdi-credit-card'
})

// Card gradient background
const cardGradient = computed(() => {
  const gradients: Record<string, string> = {
    VISA: 'linear-gradient(135deg, #1a237e 0%, #303f9f 100%)',
    MASTERCARD: 'linear-gradient(135deg, #bf360c 0%, #ff6d00 100%)',
    RUPAY: 'linear-gradient(135deg, #00695c 0%, #26a69a 100%)',
    AMEX: 'linear-gradient(135deg, #37474f 0%, #78909c 100%)'
  }
  return gradients[props.card.cardType] || 'linear-gradient(135deg, #424242 0%, #757575 100%)'
})
</script>

<template>
  <v-card class="credit-card-container">
    <!-- Credit Card Visual -->
    <div
      class="credit-card-visual pa-4 text-white"
      :style="{ background: cardGradient }"
    >
      <div class="d-flex justify-space-between align-start mb-4">
        <div>
          <div class="text-caption opacity-80">{{ card.bankName }}</div>
          <div class="text-h6 font-weight-bold">{{ card.cardName }}</div>
        </div>
        <v-icon :icon="cardTypeIcon" size="32" />
      </div>

      <div class="text-h5 font-weight-medium mb-4 letter-spacing-2">
        **** **** **** {{ card.cardNumber.slice(-4) }}
      </div>

      <div class="d-flex justify-space-between">
        <div>
          <div class="text-caption opacity-80">{{ card.cardType }}</div>
        </div>
        <div v-if="card.cardExpiryDate" class="text-right">
          <div class="text-caption opacity-80">Expires</div>
          <div class="text-body-2">{{ new Date(card.cardExpiryDate).toLocaleDateString('en-IN', { month: '2-digit', year: '2-digit' }) }}</div>
        </div>
      </div>
    </div>

    <v-card-text class="pt-4">
      <!-- Utilization Bar -->
      <div class="mb-4">
        <div class="d-flex justify-space-between text-body-2 mb-1">
          <span>Credit Utilization</span>
          <span :class="`text-${utilizationColor}`" class="font-weight-bold">
            {{ utilizationPercent }}%
          </span>
        </div>
        <v-progress-linear
          :model-value="utilizationPercent"
          :color="utilizationColor"
          height="10"
          rounded
        />
        <div class="d-flex justify-space-between text-caption text-medium-emphasis mt-1">
          <span>Used: {{ formatINRCompact(card.currentOutstanding) }}</span>
          <span>Limit: {{ formatINRCompact(card.creditLimit) }}</span>
        </div>
      </div>

      <!-- Key Metrics -->
      <v-row dense class="text-center mb-3">
        <v-col cols="4">
          <div class="text-caption text-medium-emphasis">Outstanding</div>
          <div class="text-subtitle-2 font-weight-bold">{{ formatINRCompact(card.currentOutstanding) }}</div>
        </v-col>
        <v-col cols="4">
          <div class="text-caption text-medium-emphasis">Available</div>
          <div class="text-subtitle-2 font-weight-bold text-success">{{ formatINRCompact(card.availableLimit) }}</div>
        </v-col>
        <v-col cols="4">
          <div class="text-caption text-medium-emphasis">Min Due</div>
          <div class="text-subtitle-2 font-weight-bold text-warning">{{ formatINRCompact(minimumDue) }}</div>
        </v-col>
      </v-row>

      <!-- Due Date Alert -->
      <v-alert
        v-if="card.currentOutstanding > 0"
        :color="dueStatus.color"
        variant="tonal"
        density="compact"
        class="mb-3"
      >
        <div class="d-flex justify-space-between align-center">
          <span>
            <v-icon icon="mdi-calendar-alert" size="small" class="mr-1" />
            Payment Due: {{ new Date(nextDueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) }}
          </span>
          <v-chip :color="dueStatus.color" size="x-small">
            {{ dueStatus.text }}
          </v-chip>
        </div>
      </v-alert>

      <!-- Additional Info -->
      <div class="d-flex gap-2 flex-wrap">
        <v-chip size="small" variant="outlined">
          <v-icon icon="mdi-percent" size="small" class="mr-1" />
          APR: {{ card.interestRateAPR }}%
        </v-chip>
        <v-chip v-if="card.rewardPointsBalance > 0" size="small" color="amber" variant="tonal">
          <v-icon icon="mdi-star" size="small" class="mr-1" />
          {{ card.rewardPointsBalance.toLocaleString() }} pts
        </v-chip>
        <v-chip size="small" variant="outlined">
          <v-icon icon="mdi-calendar-month" size="small" class="mr-1" />
          Bill: {{ card.billingCycleDate }}th
        </v-chip>
      </div>
    </v-card-text>

    <!-- Actions -->
    <v-card-actions v-if="showActions">
      <v-btn
        variant="text"
        size="small"
        color="primary"
        prepend-icon="mdi-cash-plus"
        @click="emit('record-payment', card)"
      >
        Pay
      </v-btn>
      <v-btn
        variant="text"
        size="small"
        prepend-icon="mdi-file-document"
        @click="emit('view-statements', card)"
      >
        Statements
      </v-btn>
      <v-spacer />
      <v-btn
        icon="mdi-pencil"
        size="small"
        variant="text"
        @click="emit('edit', card)"
      />
      <v-btn
        icon="mdi-delete"
        size="small"
        variant="text"
        color="error"
        @click="emit('delete', card.id)"
      />
    </v-card-actions>
  </v-card>
</template>

<style scoped>
.credit-card-container {
  overflow: hidden;
}

.credit-card-visual {
  border-radius: 0;
}

.letter-spacing-2 {
  letter-spacing: 2px;
}

.opacity-80 {
  opacity: 0.8;
}
</style>
