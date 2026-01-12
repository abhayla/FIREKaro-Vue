<script setup lang="ts">
import { computed } from 'vue'
import DebtPayoffStrategy from '@/components/liabilities/DebtPayoffStrategy.vue'
import PayoffProgressChart from '@/components/liabilities/PayoffProgressChart.vue'
import {
  useLoans,
  useCreditCards,
  comparePayoffStrategies,
  formatINR,
  formatINRCompact,
  calculateMinimumDue,
  type DebtPayoffStrategy as StrategyType
} from '@/composables/useLiabilities'

const props = defineProps<{
  extraPayment: number
  selectedStrategy: 'snowball' | 'avalanche' | 'custom'
}>()

const emit = defineEmits<{
  'update:extraPayment': [value: number]
  'update:selectedStrategy': [value: 'snowball' | 'avalanche' | 'custom']
  'go-to-details': []
}>()

// Data fetching
const { data: loans, isLoading: loansLoading } = useLoans()
const { data: creditCards, isLoading: cardsLoading } = useCreditCards()

// Use API data directly
const loansList = computed(() => loans.value || [])
const cardsList = computed(() => creditCards.value || [])

// Combine all debts for strategy calculation
const allDebts = computed(() => {
  const debts: { name: string; balance: number; interestRate: number; minPayment: number }[] = []

  loansList.value.forEach(loan => {
    debts.push({
      name: loan.loanName || loan.lender,
      balance: loan.outstandingAmount ?? 0,
      interestRate: loan.interestRate ?? 0,
      minPayment: loan.emiAmount ?? 0
    })
  })

  cardsList.value.forEach(card => {
    debts.push({
      name: card.cardName,
      balance: card.currentOutstanding ?? 0,
      interestRate: card.interestRateAPR ?? 0,
      minPayment: calculateMinimumDue(card.currentOutstanding ?? 0)
    })
  })

  return debts
})

// Calculate strategies
const calculatedStrategies = computed(() => {
  if (allDebts.value.length === 0) return { snowball: null, avalanche: null }
  return comparePayoffStrategies(allDebts.value, props.extraPayment)
})

// Convert to strategy format for component
const strategyList = computed((): StrategyType[] => {
  const list: StrategyType[] = []
  if (calculatedStrategies.value.snowball) {
    list.push(calculatedStrategies.value.snowball)
  }
  if (calculatedStrategies.value.avalanche) {
    list.push(calculatedStrategies.value.avalanche)
  }
  return list
})

// Summary
const summary = computed(() => {
  const totalDebt = allDebts.value.reduce((sum, d) => sum + d.balance, 0)
  const totalMinPayment = allDebts.value.reduce((sum, d) => sum + d.minPayment, 0)
  const avgRate = totalDebt > 0
    ? allDebts.value.reduce((sum, d) => sum + (d.interestRate * d.balance / totalDebt), 0)
    : 0

  return {
    totalDebt,
    totalMinPayment,
    avgRate,
    debtCount: allDebts.value.length
  }
})

const handleSelectStrategy = (strategy: 'snowball' | 'avalanche' | 'custom') => {
  emit('update:selectedStrategy', strategy)
}

// Loading state
const isLoading = computed(() => loansLoading.value || cardsLoading.value)
</script>

<template>
  <div>
    <!-- Loading State -->
    <template v-if="isLoading">
      <v-row>
        <v-col v-for="n in 4" :key="n" cols="12" md="3">
          <v-skeleton-loader type="card" />
        </v-col>
      </v-row>
    </template>

    <template v-else>
      <!-- Summary Cards -->
      <v-row class="mb-6">
        <v-col cols="12" sm="6" md="3">
          <v-card class="pa-4" color="error" variant="tonal">
            <div class="d-flex align-center mb-2">
              <v-icon icon="mdi-cash-minus" size="24" class="mr-2" />
              <span class="text-body-2">Total Debt</span>
            </div>
            <div class="text-h5 font-weight-bold">{{ formatINRCompact(summary.totalDebt) }}</div>
            <div class="text-caption">{{ summary.debtCount }} debts</div>
          </v-card>
        </v-col>
        <v-col cols="12" sm="6" md="3">
          <v-card class="pa-4">
            <div class="d-flex align-center mb-2">
              <v-icon icon="mdi-calendar-month" color="primary" size="24" class="mr-2" />
              <span class="text-body-2">Minimum Payment</span>
            </div>
            <div class="text-h5 font-weight-bold">{{ formatINR(summary.totalMinPayment) }}</div>
            <div class="text-caption text-medium-emphasis">Per month</div>
          </v-card>
        </v-col>
        <v-col cols="12" sm="6" md="3">
          <v-card class="pa-4">
            <div class="d-flex align-center mb-2">
              <v-icon icon="mdi-percent" color="warning" size="24" class="mr-2" />
              <span class="text-body-2">Avg Interest Rate</span>
            </div>
            <div class="text-h5 font-weight-bold">{{ summary.avgRate.toFixed(1) }}%</div>
            <div class="text-caption text-medium-emphasis">Weighted average</div>
          </v-card>
        </v-col>
        <v-col cols="12" sm="6" md="3">
          <v-card class="pa-4" color="success" variant="tonal">
            <div class="d-flex align-center mb-2">
              <v-icon icon="mdi-cash-plus" size="24" class="mr-2" />
              <span class="text-body-2">Extra Payment</span>
            </div>
            <div class="text-h5 font-weight-bold">{{ formatINR(extraPayment) }}</div>
            <div class="text-caption">Monthly boost</div>
          </v-card>
        </v-col>
      </v-row>

      <!-- Extra Payment Slider -->
      <v-card variant="outlined" class="mb-6 pa-4">
        <div class="d-flex align-center mb-2">
          <v-icon icon="mdi-rocket-launch" color="success" class="mr-2" />
          <span class="text-subtitle-1 font-weight-medium">Extra Monthly Payment</span>
        </div>
        <v-slider
          :model-value="extraPayment"
          @update:model-value="emit('update:extraPayment', $event)"
          :min="0"
          :max="50000"
          :step="1000"
          color="success"
          thumb-label="always"
          hide-details
        >
          <template #thumb-label="{ modelValue }">
            {{ formatINRCompact(modelValue) }}
          </template>
        </v-slider>
        <div class="d-flex justify-space-between text-caption text-medium-emphasis mt-1">
          <span>₹0</span>
          <span>Total: {{ formatINR(summary.totalMinPayment + extraPayment) }}/month</span>
          <span>₹50,000</span>
        </div>
      </v-card>

      <!-- Strategy Comparison -->
      <DebtPayoffStrategy
        v-if="strategyList.length > 0"
        :strategies="strategyList"
        :current-strategy="selectedStrategy"
        @select-strategy="handleSelectStrategy"
      />

      <!-- Payoff Projection -->
      <v-row class="mt-6">
        <v-col cols="12">
          <PayoffProgressChart
            :loans="loansList"
            :credit-cards="cardsList"
            :projection-months="60"
          />
        </v-col>
      </v-row>

      <!-- Strategy Tips -->
      <v-card variant="outlined" class="mt-6">
        <v-card-title class="text-subtitle-1">
          <v-icon icon="mdi-lightbulb" class="mr-2" />
          Debt Payoff Tips
        </v-card-title>
        <v-card-text>
          <v-row>
            <v-col cols="12" md="6">
              <v-alert color="blue" variant="tonal" density="compact">
                <div class="text-subtitle-2 font-weight-bold">Snowball Method</div>
                <div class="text-body-2 mt-1">
                  <ul class="pl-4">
                    <li>Pay minimums on all debts</li>
                    <li>Put extra money toward smallest balance</li>
                    <li>Great for motivation and quick wins</li>
                    <li>May cost more in interest overall</li>
                  </ul>
                </div>
              </v-alert>
            </v-col>
            <v-col cols="12" md="6">
              <v-alert color="success" variant="tonal" density="compact">
                <div class="text-subtitle-2 font-weight-bold">Avalanche Method (Recommended)</div>
                <div class="text-body-2 mt-1">
                  <ul class="pl-4">
                    <li>Pay minimums on all debts</li>
                    <li>Put extra money toward highest interest rate</li>
                    <li>Saves the most money mathematically</li>
                    <li>May take longer to see first debt eliminated</li>
                  </ul>
                </div>
              </v-alert>
            </v-col>
          </v-row>
        </v-card-text>
      </v-card>

      <!-- View Details Link -->
      <v-card variant="outlined" class="mt-6">
        <v-card-text class="text-center">
          <v-btn
            variant="text"
            color="primary"
            @click="emit('go-to-details')"
          >
            View Detailed Payoff Order
            <v-icon icon="mdi-arrow-right" class="ml-2" />
          </v-btn>
        </v-card-text>
      </v-card>
    </template>
  </div>
</template>
