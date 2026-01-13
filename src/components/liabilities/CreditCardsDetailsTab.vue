<script setup lang="ts">
import { computed } from 'vue'
import CreditCardCard from '@/components/liabilities/CreditCardCard.vue'
import {
  useCreditCards,
  formatINR,
  formatINRCompact,
  calculateMinimumDue,
  type CreditCard
} from '@/composables/useLiabilities'

// Emits
const emit = defineEmits<{
  'add-card': []
  'edit-card': [card: CreditCard]
  'delete-card': [id: string]
  'record-payment': [card: CreditCard]
  'view-statements': [card: CreditCard]
}>()

// Data fetching
const { data: creditCards, isLoading, error } = useCreditCards()

// Use API data directly - ensure it's always an array
const cardsList = computed(() => {
  const data = creditCards.value
  return Array.isArray(data) ? data : []
})

// Summary calculations for utilization bar
const summary = computed(() => {
  const totalLimit = cardsList.value.reduce((sum, c) => sum + (c.creditLimit ?? 0), 0)
  const totalOutstanding = cardsList.value.reduce((sum, c) => sum + (c.currentOutstanding ?? 0), 0)
  const totalAvailable = cardsList.value.reduce((sum, c) => sum + (c.availableLimit ?? 0), 0)
  const totalMinDue = cardsList.value.reduce((sum, c) => {
    return sum + calculateMinimumDue(c.currentOutstanding ?? 0)
  }, 0)

  return {
    totalLimit,
    totalOutstanding,
    totalAvailable,
    avgUtilization: totalLimit > 0 ? Math.round((totalOutstanding / totalLimit) * 100) : 0,
    totalMinDue
  }
})

// Utilization color
const utilizationColor = computed(() => {
  const util = summary.value.avgUtilization
  if (util <= 30) return 'success'
  if (util <= 50) return 'primary'
  if (util <= 70) return 'warning'
  return 'error'
})

// Handlers - emit events to parent
const handleEdit = (card: CreditCard) => {
  emit('edit-card', card)
}

const handleDelete = (id: string) => {
  emit('delete-card', id)
}

const handleRecordPayment = (card: CreditCard) => {
  emit('record-payment', card)
}

const handleViewStatements = (card: CreditCard) => {
  emit('view-statements', card)
}
</script>

<template>
  <div>
    <!-- Utilization Bar -->
    <v-card variant="outlined" class="mb-6 pa-4">
      <div class="d-flex justify-space-between align-center mb-2">
        <span class="text-body-1 font-weight-medium">Overall Credit Utilization</span>
        <v-chip :color="utilizationColor" size="small">{{ summary.avgUtilization }}%</v-chip>
      </div>
      <v-progress-linear
        :model-value="summary.avgUtilization"
        :color="utilizationColor"
        height="12"
        rounded
      />
      <div class="d-flex justify-space-between text-caption text-medium-emphasis mt-2">
        <span>Used: {{ formatINRCompact(summary.totalOutstanding) }}</span>
        <span>Available: {{ formatINRCompact(summary.totalAvailable) }}</span>
        <span>Limit: {{ formatINRCompact(summary.totalLimit) }}</span>
      </div>
      <v-alert
        v-if="summary.avgUtilization > 30"
        :type="summary.avgUtilization > 70 ? 'error' : 'warning'"
        variant="tonal"
        density="compact"
        class="mt-3"
      >
        <template v-if="summary.avgUtilization > 70">
          High credit utilization can negatively impact your credit score. Consider paying down balances.
        </template>
        <template v-else>
          Keep utilization below 30% for optimal credit score impact.
        </template>
      </v-alert>
    </v-card>

    <!-- Toolbar -->
    <v-card variant="outlined" class="mb-6">
      <v-card-text class="d-flex gap-3 flex-wrap align-center">
        <v-btn color="primary" variant="flat" prepend-icon="mdi-credit-card-plus" @click="emit('add-card')">
          Add Credit Card
        </v-btn>

        <v-spacer />

        <v-chip variant="tonal" size="small">
          Min Due: {{ formatINR(summary.totalMinDue) }}
        </v-chip>
      </v-card-text>
    </v-card>

    <!-- Loading State -->
    <template v-if="isLoading">
      <v-row>
        <v-col v-for="n in 3" :key="n" cols="12" md="4">
          <v-skeleton-loader type="card" />
        </v-col>
      </v-row>
    </template>

    <!-- Error State -->
    <v-alert v-else-if="error" type="info" variant="tonal" class="mb-6">
      Showing demo data. Add your credit cards to track utilization and payments.
    </v-alert>

    <!-- Credit Cards Grid -->
    <v-row v-if="cardsList.length > 0">
      <v-col
        v-for="card in cardsList"
        :key="card.id"
        cols="12"
        md="6"
        lg="4"
      >
        <CreditCardCard
          :card="card"
          show-actions
          @edit="handleEdit"
          @delete="handleDelete"
          @record-payment="handleRecordPayment"
          @view-statements="handleViewStatements"
        />
      </v-col>
    </v-row>

    <!-- Empty State -->
    <v-card v-else-if="!isLoading" variant="outlined" class="pa-8 text-center">
      <v-icon icon="mdi-credit-card-off" size="64" color="grey" class="mb-4" />
      <h3 class="text-h6 mb-2">No credit cards found</h3>
      <p class="text-body-2 text-medium-emphasis mb-4">
        Add your credit cards to track balances and utilization.
      </p>
      <v-btn color="primary" variant="flat" prepend-icon="mdi-credit-card-plus" @click="emit('add-card')">
        Add Credit Card
      </v-btn>
    </v-card>
  </div>
</template>
