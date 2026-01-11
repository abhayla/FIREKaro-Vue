<script setup lang="ts">
import { computed } from 'vue'
import {
  useCreditCards,
  formatINR,
  formatINRCompact,
  calculateMinimumDue,
  type CreditCard
} from '@/composables/useLiabilities'

// Emits
const emit = defineEmits<{
  'go-to-details': []
}>()

// Data fetching
const { data: creditCards, isLoading } = useCreditCards()

// Use API data directly - ensure it's always an array
const cardsList = computed(() => {
  const data = creditCards.value
  return Array.isArray(data) ? data : []
})

// Summary calculations
const summary = computed(() => {
  const totalLimit = cardsList.value.reduce((sum, c) => sum + (c.creditLimit ?? 0), 0)
  const totalOutstanding = cardsList.value.reduce((sum, c) => sum + (c.currentOutstanding ?? 0), 0)
  const totalAvailable = cardsList.value.reduce((sum, c) => sum + (c.availableLimit ?? 0), 0)
  const totalMinDue = cardsList.value.reduce((sum, c) => {
    return sum + calculateMinimumDue(c.currentOutstanding ?? 0)
  }, 0)
  const totalRewards = cardsList.value.reduce((sum, c) => sum + (c.rewardPointsBalance ?? 0), 0)

  return {
    totalLimit,
    totalOutstanding,
    totalAvailable,
    avgUtilization: totalLimit > 0 ? Math.round((totalOutstanding / totalLimit) * 100) : 0,
    totalMinDue,
    totalRewards,
    cardCount: cardsList.value.length
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

// Utilization segments for gauge visualization
const utilizationSegments = computed(() => [
  { label: 'Excellent', range: '0-30%', color: 'success', active: summary.value.avgUtilization <= 30 },
  { label: 'Good', range: '30-50%', color: 'primary', active: summary.value.avgUtilization > 30 && summary.value.avgUtilization <= 50 },
  { label: 'Fair', range: '50-70%', color: 'warning', active: summary.value.avgUtilization > 50 && summary.value.avgUtilization <= 70 },
  { label: 'Poor', range: '70%+', color: 'error', active: summary.value.avgUtilization > 70 }
])

// Upcoming payment due dates (sorted by date)
const upcomingPayments = computed(() => {
  return cardsList.value
    .filter(c => c.paymentDueDate && (c.currentOutstanding ?? 0) > 0)
    .map(card => {
      const dueDate = new Date(card.paymentDueDate!)
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      dueDate.setHours(0, 0, 0, 0)
      const daysUntilDue = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
      const minDue = calculateMinimumDue(card.currentOutstanding ?? 0)

      return {
        ...card,
        dueDate,
        daysUntilDue,
        minDue,
        isOverdue: daysUntilDue < 0,
        isUrgent: daysUntilDue >= 0 && daysUntilDue <= 5
      }
    })
    .sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime())
    .slice(0, 5)
})

// Condensed credit card list
const condensedCards = computed(() => {
  return cardsList.value
    .map(card => {
      const limit = card.creditLimit ?? 0
      const outstanding = card.currentOutstanding ?? 0
      const utilization = limit > 0 ? Math.round((outstanding / limit) * 100) : 0

      return {
        ...card,
        utilization
      }
    })
    .sort((a, b) => b.utilization - a.utilization)
    .slice(0, 5)
})

// Format date
const formatDate = (date: Date) => {
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
}

// Get card type icon
const getCardTypeIcon = (cardType: string) => {
  const icons: Record<string, string> = {
    'VISA': 'mdi-credit-card',
    'MASTERCARD': 'mdi-credit-card',
    'RUPAY': 'mdi-credit-card',
    'AMEX': 'mdi-credit-card'
  }
  return icons[cardType] || 'mdi-credit-card'
}
</script>

<template>
  <div>
    <!-- Loading State -->
    <template v-if="isLoading">
      <v-row class="mb-6">
        <v-col v-for="n in 4" :key="n" cols="12" sm="6" md="3">
          <v-skeleton-loader type="card" height="100" />
        </v-col>
      </v-row>
      <v-skeleton-loader type="card" height="200" />
    </template>

    <template v-else>
      <!-- Summary Metric Cards -->
      <v-row class="mb-6">
        <v-col cols="12" sm="6" md="3">
          <v-card class="pa-4">
            <div class="d-flex align-center mb-2">
              <v-icon icon="mdi-credit-card-multiple" color="primary" size="24" class="mr-2" />
              <span class="text-body-2">Total Credit Limit</span>
            </div>
            <div class="text-h5 font-weight-bold">{{ formatINRCompact(summary.totalLimit) }}</div>
            <div class="text-caption text-medium-emphasis">{{ summary.cardCount }} cards</div>
          </v-card>
        </v-col>
        <v-col cols="12" sm="6" md="3">
          <v-card class="pa-4">
            <div class="d-flex align-center mb-2">
              <v-icon icon="mdi-cash-minus" color="error" size="24" class="mr-2" />
              <span class="text-body-2">Total Outstanding</span>
            </div>
            <div class="text-h5 font-weight-bold">{{ formatINRCompact(summary.totalOutstanding) }}</div>
            <div class="text-caption" :class="`text-${utilizationColor}`">
              {{ summary.avgUtilization }}% utilized
            </div>
          </v-card>
        </v-col>
        <v-col cols="12" sm="6" md="3">
          <v-card class="pa-4">
            <div class="d-flex align-center mb-2">
              <v-icon icon="mdi-cash-check" color="success" size="24" class="mr-2" />
              <span class="text-body-2">Available Credit</span>
            </div>
            <div class="text-h5 font-weight-bold text-success">{{ formatINRCompact(summary.totalAvailable) }}</div>
          </v-card>
        </v-col>
        <v-col cols="12" sm="6" md="3">
          <v-card class="pa-4">
            <div class="d-flex align-center mb-2">
              <v-icon icon="mdi-star" color="amber" size="24" class="mr-2" />
              <span class="text-body-2">Reward Points</span>
            </div>
            <div class="text-h5 font-weight-bold">{{ summary.totalRewards.toLocaleString() }}</div>
            <div class="text-caption text-medium-emphasis">Across all cards</div>
          </v-card>
        </v-col>
      </v-row>

      <v-row>
        <!-- Left Column: Utilization Gauge & Upcoming Payments -->
        <v-col cols="12" md="6">
          <!-- Credit Utilization Gauge -->
          <v-card variant="outlined" class="mb-6">
            <v-card-title class="text-subtitle-1">
              <v-icon icon="mdi-gauge" class="mr-2" />
              Credit Utilization Score
            </v-card-title>
            <v-card-text>
              <!-- Large circular gauge visualization -->
              <div class="d-flex justify-center mb-4">
                <div class="position-relative" style="width: 160px; height: 160px;">
                  <v-progress-circular
                    :model-value="summary.avgUtilization"
                    :color="utilizationColor"
                    :size="160"
                    :width="16"
                    class="position-absolute"
                  >
                    <div class="text-center">
                      <div class="text-h4 font-weight-bold" :class="`text-${utilizationColor}`">
                        {{ summary.avgUtilization }}%
                      </div>
                      <div class="text-caption text-medium-emphasis">Utilized</div>
                    </div>
                  </v-progress-circular>
                </div>
              </div>

              <!-- Utilization breakdown -->
              <div class="d-flex justify-space-around text-center mb-4">
                <div>
                  <div class="text-body-2 font-weight-medium">{{ formatINRCompact(summary.totalOutstanding) }}</div>
                  <div class="text-caption text-medium-emphasis">Used</div>
                </div>
                <v-divider vertical class="mx-2" />
                <div>
                  <div class="text-body-2 font-weight-medium text-success">{{ formatINRCompact(summary.totalAvailable) }}</div>
                  <div class="text-caption text-medium-emphasis">Available</div>
                </div>
                <v-divider vertical class="mx-2" />
                <div>
                  <div class="text-body-2 font-weight-medium">{{ formatINRCompact(summary.totalLimit) }}</div>
                  <div class="text-caption text-medium-emphasis">Limit</div>
                </div>
              </div>

              <!-- Utilization segments legend -->
              <div class="d-flex flex-wrap gap-2 justify-center">
                <v-chip
                  v-for="segment in utilizationSegments"
                  :key="segment.label"
                  :color="segment.color"
                  :variant="segment.active ? 'flat' : 'outlined'"
                  size="small"
                >
                  {{ segment.label }} ({{ segment.range }})
                </v-chip>
              </div>
            </v-card-text>
          </v-card>

          <!-- Upcoming Payment Due Dates -->
          <v-card variant="outlined">
            <v-card-title class="text-subtitle-1 d-flex align-center">
              <v-icon icon="mdi-calendar-clock" class="mr-2" />
              Upcoming Payments
              <v-spacer />
              <v-chip v-if="upcomingPayments.length > 0" size="small" variant="tonal" color="warning">
                {{ formatINR(summary.totalMinDue) }} min due
              </v-chip>
            </v-card-title>
            <v-card-text>
              <div v-if="upcomingPayments.length === 0" class="text-center py-4 text-medium-emphasis">
                No upcoming payments
              </div>
              <v-list v-else density="compact" class="py-0">
                <v-list-item
                  v-for="card in upcomingPayments"
                  :key="card.id"
                  class="px-0"
                >
                  <template #prepend>
                    <v-avatar size="36" color="primary" variant="tonal">
                      <v-icon :icon="getCardTypeIcon(card.cardType)" size="18" />
                    </v-avatar>
                  </template>
                  <v-list-item-title class="text-body-2">
                    {{ card.cardName }}
                  </v-list-item-title>
                  <v-list-item-subtitle class="text-caption">
                    {{ card.bankName }} | Min: {{ formatINR(card.minDue) }}
                  </v-list-item-subtitle>
                  <template #append>
                    <div class="text-right">
                      <div class="text-body-2 font-weight-medium">{{ formatINR(card.currentOutstanding) }}</div>
                      <v-chip
                        :color="card.isOverdue ? 'error' : card.isUrgent ? 'warning' : 'default'"
                        size="x-small"
                        variant="tonal"
                      >
                        <template v-if="card.isOverdue">
                          {{ Math.abs(card.daysUntilDue) }}d overdue
                        </template>
                        <template v-else-if="card.daysUntilDue === 0">
                          Today
                        </template>
                        <template v-else>
                          {{ formatDate(card.dueDate) }}
                        </template>
                      </v-chip>
                    </div>
                  </template>
                </v-list-item>
              </v-list>
            </v-card-text>
          </v-card>
        </v-col>

        <!-- Right Column: Condensed List & Tips -->
        <v-col cols="12" md="6">
          <!-- Condensed Credit Card List -->
          <v-card variant="outlined" class="mb-6">
            <v-card-title class="text-subtitle-1 d-flex align-center">
              <v-icon icon="mdi-credit-card-multiple" class="mr-2" />
              Your Cards
              <v-spacer />
              <v-btn
                variant="text"
                size="small"
                color="primary"
                append-icon="mdi-arrow-right"
                @click="emit('go-to-details')"
              >
                View All
              </v-btn>
            </v-card-title>
            <v-card-text>
              <div v-if="condensedCards.length === 0" class="text-center py-4">
                <v-icon icon="mdi-credit-card-off" size="48" color="grey" class="mb-2" />
                <div class="text-body-2 text-medium-emphasis mb-3">No credit cards</div>
                <v-btn
                  color="primary"
                  variant="tonal"
                  size="small"
                  prepend-icon="mdi-plus"
                  @click="emit('go-to-details')"
                >
                  Add Your First Card
                </v-btn>
              </div>
              <div v-else class="d-flex flex-column gap-3">
                <v-card
                  v-for="card in condensedCards"
                  :key="card.id"
                  variant="tonal"
                  class="pa-3"
                >
                  <div class="d-flex align-center mb-2">
                    <v-avatar size="32" color="primary" variant="tonal" class="mr-2">
                      <v-icon :icon="getCardTypeIcon(card.cardType)" size="16" />
                    </v-avatar>
                    <div class="flex-grow-1">
                      <div class="text-body-2 font-weight-medium">{{ card.cardName }}</div>
                      <div class="text-caption text-medium-emphasis">{{ card.bankName }}</div>
                    </div>
                    <div class="text-right">
                      <div class="text-body-2 font-weight-bold">{{ formatINRCompact(card.currentOutstanding) }}</div>
                      <div class="text-caption text-medium-emphasis">of {{ formatINRCompact(card.creditLimit) }}</div>
                    </div>
                  </div>
                  <div class="d-flex align-center">
                    <v-progress-linear
                      :model-value="card.utilization"
                      :color="card.utilization <= 30 ? 'success' : card.utilization <= 70 ? 'warning' : 'error'"
                      height="6"
                      rounded
                      class="flex-grow-1"
                    />
                    <span class="text-caption text-medium-emphasis ml-2">{{ card.utilization }}%</span>
                  </div>
                </v-card>
              </div>
            </v-card-text>
          </v-card>

          <!-- Credit Score Tips -->
          <v-card variant="outlined">
            <v-card-title class="text-subtitle-1">
              <v-icon icon="mdi-lightbulb" class="mr-2" />
              Credit Score Tips
            </v-card-title>
            <v-card-text class="pt-0">
              <v-row dense>
                <v-col cols="12">
                  <v-alert color="success" variant="tonal" density="compact">
                    <div class="text-subtitle-2 font-weight-bold">Keep Utilization Low</div>
                    <div class="text-body-2 mt-1">
                      Maintain credit utilization below 30% for optimal score
                    </div>
                  </v-alert>
                </v-col>
                <v-col cols="12">
                  <v-alert color="primary" variant="tonal" density="compact">
                    <div class="text-subtitle-2 font-weight-bold">Pay On Time</div>
                    <div class="text-body-2 mt-1">
                      Payment history is 35% of your credit score
                    </div>
                  </v-alert>
                </v-col>
                <v-col cols="12">
                  <v-alert color="warning" variant="tonal" density="compact">
                    <div class="text-subtitle-2 font-weight-bold">Pay Full Balance</div>
                    <div class="text-body-2 mt-1">
                      Avoid interest charges by paying full amount
                    </div>
                  </v-alert>
                </v-col>
              </v-row>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </template>
  </div>
</template>
