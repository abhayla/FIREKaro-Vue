<script setup lang="ts">
import { computed } from 'vue'
import {
  useLoans,
  useCreditCards,
  comparePayoffStrategies,
  formatINR,
  formatINRCompact,
  calculateMinimumDue
} from '@/composables/useLiabilities'

const props = defineProps<{
  extraPayment: number
  selectedStrategy: 'snowball' | 'avalanche' | 'custom'
}>()

const emit = defineEmits<{
  'update:selectedStrategy': [value: 'snowball' | 'avalanche' | 'custom']
}>()

// Data fetching
const { data: loans, isLoading: loansLoading } = useLoans()
const { data: creditCards, isLoading: cardsLoading } = useCreditCards()

// Use API data directly
const loansList = computed(() => loans.value || [])
const cardsList = computed(() => creditCards.value || [])

// Combine all debts for strategy calculation
const allDebts = computed(() => {
  const debts: { name: string; balance: number; interestRate: number; minPayment: number; type: 'loan' | 'card' }[] = []

  loansList.value.forEach(loan => {
    debts.push({
      name: loan.loanName || loan.lender,
      balance: loan.outstandingAmount ?? 0,
      interestRate: loan.interestRate ?? 0,
      minPayment: loan.emiAmount ?? 0,
      type: 'loan'
    })
  })

  cardsList.value.forEach(card => {
    debts.push({
      name: card.cardName,
      balance: card.currentOutstanding ?? 0,
      interestRate: card.interestRateAPR ?? 0,
      minPayment: calculateMinimumDue(card.currentOutstanding ?? 0),
      type: 'card'
    })
  })

  return debts
})

// Calculate strategies
const calculatedStrategies = computed(() => {
  if (allDebts.value.length === 0) return { snowball: null, avalanche: null }
  return comparePayoffStrategies(allDebts.value, props.extraPayment)
})

// Sorted debts based on selected strategy
const sortedDebts = computed(() => {
  const debts = [...allDebts.value]
  if (props.selectedStrategy === 'snowball') {
    return debts.sort((a, b) => a.balance - b.balance)
  } else {
    return debts.sort((a, b) => b.interestRate - a.interestRate)
  }
})

// Summary
const summary = computed(() => {
  const totalDebt = allDebts.value.reduce((sum, d) => sum + d.balance, 0)
  const totalMinPayment = allDebts.value.reduce((sum, d) => sum + d.minPayment, 0)

  return {
    totalDebt,
    totalMinPayment
  }
})

// Loading state
const isLoading = computed(() => loansLoading.value || cardsLoading.value)

// Estimated payoff dates (simplified calculation)
const getEstimatedPayoffMonths = (debt: typeof allDebts.value[0], index: number) => {
  // Simplified: First debt gets extra payment, subsequent debts get it after previous is paid
  const monthlyPayment = debt.minPayment + (index === 0 ? props.extraPayment : 0)
  if (monthlyPayment <= 0) return 999
  const months = Math.ceil(debt.balance / monthlyPayment)
  return Math.min(months, 360) // Cap at 30 years
}

const getPayoffDate = (months: number) => {
  const date = new Date()
  date.setMonth(date.getMonth() + months)
  return date.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })
}
</script>

<template>
  <div>
    <!-- Loading State -->
    <template v-if="isLoading">
      <v-skeleton-loader type="table" />
    </template>

    <template v-else>
      <!-- Strategy Selector -->
      <v-card variant="outlined" class="mb-6">
        <v-card-text>
          <div class="d-flex align-center flex-wrap gap-4">
            <span class="text-subtitle-2">Strategy:</span>
            <v-btn-toggle
              :model-value="selectedStrategy"
              @update:model-value="emit('update:selectedStrategy', $event)"
              mandatory
              color="primary"
              variant="outlined"
            >
              <v-btn value="avalanche">
                <v-icon icon="mdi-trending-up" class="mr-2" />
                Avalanche (Highest Interest)
              </v-btn>
              <v-btn value="snowball">
                <v-icon icon="mdi-snowflake" class="mr-2" />
                Snowball (Smallest Balance)
              </v-btn>
            </v-btn-toggle>
            <v-spacer />
            <div class="text-body-2">
              Extra Payment: <strong class="text-success">{{ formatINR(extraPayment) }}/month</strong>
            </div>
          </div>
        </v-card-text>
      </v-card>

      <!-- Debt Payoff Order Table -->
      <v-card variant="outlined" class="mb-6">
        <v-card-title>
          <v-icon icon="mdi-format-list-numbered" class="mr-2" />
          Debt Payoff Order
        </v-card-title>
        <v-card-text>
          <v-table density="compact">
            <thead>
              <tr>
                <th style="width: 60px">#</th>
                <th>Debt Name</th>
                <th>Type</th>
                <th class="text-right">Balance</th>
                <th class="text-right">Interest Rate</th>
                <th class="text-right">Min Payment</th>
                <th class="text-center">Priority</th>
                <th class="text-right">Est. Payoff</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="(debt, index) in sortedDebts"
                :key="debt.name"
              >
                <td>
                  <v-avatar
                    :color="selectedStrategy === 'avalanche' ? 'success' : 'blue'"
                    size="28"
                  >
                    <span class="text-caption font-weight-bold">{{ index + 1 }}</span>
                  </v-avatar>
                </td>
                <td>
                  <div class="d-flex align-center">
                    <v-icon
                      :icon="debt.type === 'loan' ? 'mdi-bank' : 'mdi-credit-card'"
                      :color="debt.type === 'loan' ? 'blue' : 'orange'"
                      size="20"
                      class="mr-2"
                    />
                    {{ debt.name }}
                  </div>
                </td>
                <td>
                  <v-chip
                    :color="debt.type === 'loan' ? 'blue' : 'orange'"
                    size="x-small"
                    variant="tonal"
                  >
                    {{ debt.type === 'loan' ? 'Loan' : 'Card' }}
                  </v-chip>
                </td>
                <td class="text-right font-weight-medium">{{ formatINRCompact(debt.balance) }}</td>
                <td class="text-right">
                  <v-chip
                    :color="debt.interestRate > 15 ? 'error' : debt.interestRate > 10 ? 'warning' : 'success'"
                    size="x-small"
                  >
                    {{ debt.interestRate.toFixed(1) }}%
                  </v-chip>
                </td>
                <td class="text-right">{{ formatINR(debt.minPayment) }}</td>
                <td class="text-center">
                  <v-chip
                    v-if="index === 0"
                    color="primary"
                    size="small"
                    variant="elevated"
                  >
                    Pay First
                  </v-chip>
                  <span v-else class="text-medium-emphasis">{{ index + 1 }}</span>
                </td>
                <td class="text-right">
                  {{ getPayoffDate(getEstimatedPayoffMonths(debt, index)) }}
                </td>
              </tr>
            </tbody>
            <tfoot>
              <tr class="bg-grey-lighten-4">
                <td colspan="3" class="font-weight-bold">Total</td>
                <td class="text-right font-weight-bold">{{ formatINRCompact(summary.totalDebt) }}</td>
                <td></td>
                <td class="text-right font-weight-bold">{{ formatINR(summary.totalMinPayment) }}</td>
                <td colspan="2"></td>
              </tr>
            </tfoot>
          </v-table>
        </v-card-text>
      </v-card>

      <!-- Payoff Timeline Visualization -->
      <v-card variant="outlined" class="mb-6">
        <v-card-title>
          <v-icon icon="mdi-timeline" class="mr-2" />
          Payoff Timeline
        </v-card-title>
        <v-card-text>
          <div class="payoff-timeline">
            <div
              v-for="(debt, index) in sortedDebts"
              :key="debt.name"
              class="timeline-item d-flex align-center mb-3"
            >
              <div class="timeline-label" style="width: 150px">
                <span class="text-body-2 font-weight-medium">{{ debt.name }}</span>
              </div>
              <div class="timeline-bar flex-grow-1 mx-4">
                <v-progress-linear
                  :model-value="100 - (index * 15)"
                  :color="debt.type === 'loan' ? 'blue' : 'orange'"
                  height="24"
                  rounded
                >
                  <template #default>
                    <span class="text-caption white--text">
                      {{ getPayoffDate(getEstimatedPayoffMonths(debt, index)) }}
                    </span>
                  </template>
                </v-progress-linear>
              </div>
              <div class="timeline-amount text-right" style="width: 100px">
                <span class="text-body-2 font-weight-bold">{{ formatINRCompact(debt.balance) }}</span>
              </div>
            </div>
          </div>
        </v-card-text>
      </v-card>

      <!-- Strategy Comparison Table -->
      <v-card variant="outlined">
        <v-card-title>
          <v-icon icon="mdi-compare" class="mr-2" />
          Strategy Comparison
        </v-card-title>
        <v-card-text>
          <v-table density="comfortable">
            <thead>
              <tr>
                <th>Metric</th>
                <th class="text-center">
                  <v-icon icon="mdi-trending-up" color="success" class="mr-1" />
                  Avalanche
                </th>
                <th class="text-center">
                  <v-icon icon="mdi-snowflake" color="blue" class="mr-1" />
                  Snowball
                </th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Strategy Focus</td>
                <td class="text-center">Highest interest first</td>
                <td class="text-center">Smallest balance first</td>
              </tr>
              <tr>
                <td>Estimated Payoff Date</td>
                <td class="text-center font-weight-bold">
                  {{ calculatedStrategies.avalanche?.payoffDate || '-' }}
                </td>
                <td class="text-center font-weight-bold">
                  {{ calculatedStrategies.snowball?.payoffDate || '-' }}
                </td>
              </tr>
              <tr>
                <td>Total Interest Saved</td>
                <td class="text-center font-weight-bold text-success">
                  {{ formatINRCompact(calculatedStrategies.avalanche?.totalInterestSaved || 0) }}
                </td>
                <td class="text-center font-weight-bold">
                  {{ formatINRCompact(calculatedStrategies.snowball?.totalInterestSaved || 0) }}
                </td>
              </tr>
              <tr>
                <td>First Debt Paid Off</td>
                <td class="text-center">
                  {{ calculatedStrategies.avalanche?.debts?.[0]?.name || '-' }}
                </td>
                <td class="text-center text-primary font-weight-bold">
                  {{ calculatedStrategies.snowball?.debts?.[0]?.name || '-' }}
                </td>
              </tr>
              <tr>
                <td>Best For</td>
                <td class="text-center">
                  <v-chip color="success" size="small">Saves Most Money</v-chip>
                </td>
                <td class="text-center">
                  <v-chip color="blue" size="small">Quick Wins</v-chip>
                </td>
              </tr>
            </tbody>
          </v-table>
        </v-card-text>
      </v-card>
    </template>
  </div>
</template>

<style scoped>
.payoff-timeline {
  padding: 16px 0;
}

.timeline-item {
  position: relative;
}
</style>
