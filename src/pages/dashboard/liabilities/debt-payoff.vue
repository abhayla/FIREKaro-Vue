<script setup lang="ts">
import { ref, computed } from 'vue'
import SectionHeader from '@/components/shared/SectionHeader.vue'
import FamilyToggle from '@/components/shared/FamilyToggle.vue'
import DebtPayoffStrategy from '@/components/liabilities/DebtPayoffStrategy.vue'
import PayoffProgressChart from '@/components/liabilities/PayoffProgressChart.vue'
import {
  useLoans,
  useCreditCards,
  useDebtPayoffStrategies,
  comparePayoffStrategies,
  formatINR,
  formatINRCompact,
  type Loan,
  type CreditCard,
  type DebtPayoffStrategy as StrategyType
} from '@/composables/useLiabilities'

const tabs = [
  { title: 'Overview', route: '/dashboard/liabilities' },
  { title: 'Loans', route: '/dashboard/liabilities/loans' },
  { title: 'Credit Cards', route: '/dashboard/liabilities/credit-cards' },
  { title: 'Debt Payoff', route: '/dashboard/liabilities/debt-payoff' },
  { title: 'Reports', route: '/dashboard/liabilities/reports' },
]

// Data fetching
const { data: loans, isLoading: loansLoading } = useLoans()
const { data: creditCards, isLoading: cardsLoading } = useCreditCards()
const { data: strategies, isLoading: strategiesLoading } = useDebtPayoffStrategies()

// Mock data
const mockLoans: Loan[] = [
  {
    id: '1', userId: 'user1', loanType: 'home', lenderName: 'HDFC Bank Home Loan',
    principalAmount: 5000000, outstandingPrincipal: 3200000, interestRate: 8.5,
    tenure: 240, emiAmount: 43391, emiDate: 5, startDate: '2020-06-01', endDate: '2040-05-31',
    totalInterestPaid: 850000, totalPrincipalPaid: 1800000, prepaymentsMade: 200000, isActive: true
  },
  {
    id: '2', userId: 'user1', loanType: 'car', lenderName: 'ICICI Bank Car Loan',
    principalAmount: 800000, outstandingPrincipal: 450000, interestRate: 9.5,
    tenure: 60, emiAmount: 16765, emiDate: 15, startDate: '2022-03-01', endDate: '2027-02-28',
    totalInterestPaid: 120000, totalPrincipalPaid: 350000, prepaymentsMade: 0, isActive: true
  },
  {
    id: '3', userId: 'user1', loanType: 'personal', lenderName: 'Axis Bank Personal Loan',
    principalAmount: 300000, outstandingPrincipal: 180000, interestRate: 14,
    tenure: 36, emiAmount: 10248, emiDate: 10, startDate: '2024-01-01', endDate: '2027-01-01',
    totalInterestPaid: 48000, totalPrincipalPaid: 120000, prepaymentsMade: 0, isActive: true
  }
]

const mockCreditCards: CreditCard[] = [
  {
    id: '1', userId: 'user1', cardName: 'HDFC Credit Card', bankName: 'HDFC Bank',
    cardNumber: '****5678', cardType: 'VISA', creditLimit: 500000, availableLimit: 175000,
    currentOutstanding: 325000, utilizationPercent: 65, billingCycleDate: 15, paymentDueDate: 5,
    rewardPointsBalance: 12500, interestRateAPR: 42, annualFee: 2500, isActive: true,
    minimumDue: 16250, nextDueDate: '2026-02-05'
  },
  {
    id: '2', userId: 'user1', cardName: 'SBI Credit Card', bankName: 'SBI Card',
    cardNumber: '****1234', cardType: 'MASTERCARD', creditLimit: 300000, availableLimit: 220000,
    currentOutstanding: 80000, utilizationPercent: 27, billingCycleDate: 20, paymentDueDate: 10,
    rewardPointsBalance: 5200, interestRateAPR: 39.6, annualFee: 499, isActive: true,
    minimumDue: 4000, nextDueDate: '2026-02-10'
  }
]

// Use mock data
const loansList = computed(() => loans.value?.length ? loans.value : mockLoans)
const cardsList = computed(() => creditCards.value?.length ? creditCards.value : mockCreditCards)

// Extra payment amount
const extraPayment = ref(10000)

// Combine all debts for strategy calculation
const allDebts = computed(() => {
  const debts: { name: string; balance: number; interestRate: number; minPayment: number }[] = []

  loansList.value.forEach(loan => {
    debts.push({
      name: loan.lenderName,
      balance: loan.outstandingPrincipal,
      interestRate: loan.interestRate,
      minPayment: loan.emiAmount
    })
  })

  cardsList.value.forEach(card => {
    debts.push({
      name: card.cardName,
      balance: card.currentOutstanding,
      interestRate: card.interestRateAPR,
      minPayment: card.minimumDue
    })
  })

  return debts
})

// Calculate strategies
const calculatedStrategies = computed(() => {
  if (allDebts.value.length === 0) return { snowball: null, avalanche: null }
  return comparePayoffStrategies(allDebts.value, extraPayment.value)
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

// Selected strategy
const selectedStrategy = ref<'snowball' | 'avalanche' | 'custom'>('avalanche')

const handleSelectStrategy = (strategy: 'snowball' | 'avalanche' | 'custom') => {
  selectedStrategy.value = strategy
}

// Loading state
const isLoading = computed(() => loansLoading.value || cardsLoading.value || strategiesLoading.value)
</script>

<template>
  <div>
    <SectionHeader
      title="Liabilities"
      subtitle="Debt Payoff Strategies"
      icon="mdi-credit-card-outline"
      :tabs="tabs"
    />

    <FamilyToggle class="mb-6" />

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
          v-model="extraPayment"
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

      <!-- Debt List -->
      <v-card variant="outlined" class="mb-6">
        <v-card-title>
          <v-icon icon="mdi-format-list-bulleted" class="mr-2" />
          Your Debts
        </v-card-title>
        <v-card-text>
          <v-table density="compact">
            <thead>
              <tr>
                <th>Debt</th>
                <th class="text-right">Balance</th>
                <th class="text-right">Interest Rate</th>
                <th class="text-right">Min Payment</th>
                <th class="text-center">Priority</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="(debt, index) in allDebts.sort((a, b) =>
                  selectedStrategy === 'snowball'
                    ? a.balance - b.balance
                    : b.interestRate - a.interestRate
                )"
                :key="debt.name"
              >
                <td>
                  <div class="d-flex align-center">
                    <v-avatar
                      :color="selectedStrategy === 'avalanche' ? 'success' : 'blue'"
                      size="24"
                      class="mr-2"
                    >
                      <span class="text-caption">{{ index + 1 }}</span>
                    </v-avatar>
                    {{ debt.name }}
                  </div>
                </td>
                <td class="text-right font-weight-medium">{{ formatINRCompact(debt.balance) }}</td>
                <td class="text-right">
                  <v-chip
                    :color="debt.interestRate > 15 ? 'error' : debt.interestRate > 10 ? 'warning' : 'success'"
                    size="x-small"
                  >
                    {{ debt.interestRate }}%
                  </v-chip>
                </td>
                <td class="text-right">{{ formatINR(debt.minPayment) }}</td>
                <td class="text-center">
                  <v-chip
                    v-if="index === 0"
                    color="primary"
                    size="x-small"
                  >
                    Pay First
                  </v-chip>
                  <span v-else class="text-medium-emphasis">{{ index + 1 }}</span>
                </td>
              </tr>
            </tbody>
          </v-table>
        </v-card-text>
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
    </template>
  </div>
</template>
