<script setup lang="ts">
import { ref, computed } from 'vue'
import SectionHeader from '@/components/shared/SectionHeader.vue'
import FamilyToggle from '@/components/shared/FamilyToggle.vue'
import DebtToIncomeGauge from '@/components/liabilities/DebtToIncomeGauge.vue'
import PayoffProgressChart from '@/components/liabilities/PayoffProgressChart.vue'
import LoanCard from '@/components/liabilities/LoanCard.vue'
import CreditCardCard from '@/components/liabilities/CreditCardCard.vue'
import {
  useLoans,
  useCreditCards,
  useLiabilitiesOverview,
  formatINR,
  formatINRCompact,
  formatDate,
  calculateMinimumDue,
  getNextDueDate
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
const { data: overview, isLoading: overviewLoading } = useLiabilitiesOverview()

// Use API data directly (no mock data)
const loansList = computed(() => loans.value || [])
const cardsList = computed(() => creditCards.value || [])

// Summary calculations
const summary = computed(() => {
  const totalLoanDebt = loansList.value.reduce((sum, l) => sum + (l.outstandingAmount ?? 0), 0)
  const totalCCDebt = cardsList.value.reduce((sum, c) => sum + (c.currentOutstanding ?? 0), 0)
  const totalMonthlyEmi = loansList.value.reduce((sum, l) => sum + (l.emiAmount ?? 0), 0)
  const totalMinDue = cardsList.value.reduce((sum, c) => sum + calculateMinimumDue(c.currentOutstanding ?? 0), 0)

  return {
    totalDebt: totalLoanDebt + totalCCDebt,
    loanDebt: totalLoanDebt,
    ccDebt: totalCCDebt,
    monthlyPayment: totalMonthlyEmi + totalMinDue,
    loanCount: loansList.value.length,
    ccCount: cardsList.value.length
  }
})

// Mock monthly income for DTI calculation
const monthlyIncome = ref(250000)

// Upcoming payments
const upcomingPayments = computed(() => {
  const payments: { name: string; amount: number; dueDate: string; type: 'loan' | 'cc'; daysUntil: number }[] = []

  loansList.value.forEach(loan => {
    if (!loan.nextEmiDate) return
    const today = new Date()
    const nextDue = new Date(loan.nextEmiDate)
    const daysUntil = Math.ceil((nextDue.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    payments.push({
      name: `${loan.lender} EMI`,
      amount: loan.emiAmount ?? 0,
      dueDate: loan.nextEmiDate,
      type: 'loan',
      daysUntil
    })
  })

  cardsList.value.forEach(card => {
    const nextDueDate = getNextDueDate(card)
    const dueDate = new Date(nextDueDate)
    const today = new Date()
    const daysUntil = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    payments.push({
      name: `${card.cardName} Due`,
      amount: calculateMinimumDue(card.currentOutstanding ?? 0),
      dueDate: nextDueDate,
      type: 'cc',
      daysUntil
    })
  })

  return payments.sort((a, b) => a.daysUntil - b.daysUntil).slice(0, 5)
})

// Loading state
const isLoading = computed(() => loansLoading.value || cardsLoading.value || overviewLoading.value)
</script>

<template>
  <div>
    <SectionHeader
      title="Liabilities"
      subtitle="Debt Overview"
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
            <div class="text-caption">
              {{ summary.loanCount }} Loans, {{ summary.ccCount }} Cards
            </div>
          </v-card>
        </v-col>
        <v-col cols="12" sm="6" md="3">
          <v-card class="pa-4">
            <div class="d-flex align-center mb-2">
              <v-icon icon="mdi-calendar-month" color="primary" size="24" class="mr-2" />
              <span class="text-body-2">Monthly Payment</span>
            </div>
            <div class="text-h5 font-weight-bold">{{ formatINR(summary.monthlyPayment) }}</div>
            <div class="text-caption text-medium-emphasis">EMI + Min Due</div>
          </v-card>
        </v-col>
        <v-col cols="12" sm="6" md="3">
          <v-card class="pa-4">
            <div class="d-flex align-center mb-2">
              <v-icon icon="mdi-home" color="blue" size="24" class="mr-2" />
              <span class="text-body-2">Loan Outstanding</span>
            </div>
            <div class="text-h5 font-weight-bold">{{ formatINRCompact(summary.loanDebt) }}</div>
            <div class="text-caption text-medium-emphasis">{{ summary.loanCount }} active loans</div>
          </v-card>
        </v-col>
        <v-col cols="12" sm="6" md="3">
          <v-card class="pa-4">
            <div class="d-flex align-center mb-2">
              <v-icon icon="mdi-credit-card" color="orange" size="24" class="mr-2" />
              <span class="text-body-2">Credit Card Debt</span>
            </div>
            <div class="text-h5 font-weight-bold">{{ formatINRCompact(summary.ccDebt) }}</div>
            <div class="text-caption text-medium-emphasis">{{ summary.ccCount }} active cards</div>
          </v-card>
        </v-col>
      </v-row>

      <!-- Main Content Grid -->
      <v-row>
        <!-- DTI Gauge -->
        <v-col cols="12" md="4">
          <DebtToIncomeGauge
            :total-monthly-debt="summary.monthlyPayment"
            :monthly-income="monthlyIncome"
            show-details
          />
        </v-col>

        <!-- Upcoming Payments -->
        <v-col cols="12" md="8">
          <v-card variant="outlined" class="h-100">
            <v-card-title class="d-flex align-center">
              <v-icon icon="mdi-calendar-clock" class="mr-2" />
              Upcoming Payments
            </v-card-title>
            <v-card-text>
              <v-list>
                <v-list-item
                  v-for="payment in upcomingPayments"
                  :key="payment.name"
                  class="px-0"
                >
                  <template #prepend>
                    <v-avatar
                      :color="payment.type === 'loan' ? 'blue' : 'orange'"
                      size="40"
                    >
                      <v-icon
                        :icon="payment.type === 'loan' ? 'mdi-bank' : 'mdi-credit-card'"
                        color="white"
                      />
                    </v-avatar>
                  </template>
                  <v-list-item-title class="font-weight-medium">
                    {{ payment.name }}
                  </v-list-item-title>
                  <v-list-item-subtitle>
                    Due: {{ formatDate(payment.dueDate) }}
                  </v-list-item-subtitle>
                  <template #append>
                    <div class="text-right">
                      <div class="font-weight-bold">{{ formatINR(payment.amount) }}</div>
                      <v-chip
                        :color="payment.daysUntil <= 5 ? 'warning' : payment.daysUntil <= 0 ? 'error' : 'success'"
                        size="x-small"
                      >
                        {{ payment.daysUntil <= 0 ? 'Overdue' : `${payment.daysUntil} days` }}
                      </v-chip>
                    </div>
                  </template>
                </v-list-item>
              </v-list>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <!-- Payoff Progress Chart -->
      <v-row class="mt-4">
        <v-col cols="12">
          <PayoffProgressChart
            :loans="loansList"
            :credit-cards="cardsList"
            :projection-months="60"
          />
        </v-col>
      </v-row>

      <!-- Quick View of Loans & Cards -->
      <v-row class="mt-4">
        <!-- Top Loans -->
        <v-col cols="12" md="6">
          <v-card variant="outlined">
            <v-card-title class="d-flex align-center">
              <v-icon icon="mdi-bank" class="mr-2" />
              Active Loans
              <v-spacer />
              <v-btn
                variant="text"
                color="primary"
                size="small"
                to="/dashboard/liabilities/loans"
              >
                View All
              </v-btn>
            </v-card-title>
            <v-card-text>
              <v-row>
                <v-col
                  v-for="loan in loansList.slice(0, 2)"
                  :key="loan.id"
                  cols="12"
                >
                  <LoanCard :loan="loan" />
                </v-col>
              </v-row>
              <div v-if="loansList.length === 0" class="text-center py-4">
                <v-icon icon="mdi-bank-off" size="48" color="grey" class="mb-2" />
                <div class="text-body-2 text-medium-emphasis">No active loans</div>
              </div>
            </v-card-text>
          </v-card>
        </v-col>

        <!-- Credit Cards -->
        <v-col cols="12" md="6">
          <v-card variant="outlined">
            <v-card-title class="d-flex align-center">
              <v-icon icon="mdi-credit-card-multiple" class="mr-2" />
              Credit Cards
              <v-spacer />
              <v-btn
                variant="text"
                color="primary"
                size="small"
                to="/dashboard/liabilities/credit-cards"
              >
                View All
              </v-btn>
            </v-card-title>
            <v-card-text>
              <v-row>
                <v-col
                  v-for="card in cardsList.slice(0, 2)"
                  :key="card.id"
                  cols="12"
                >
                  <CreditCardCard :card="card" />
                </v-col>
              </v-row>
              <div v-if="cardsList.length === 0" class="text-center py-4">
                <v-icon icon="mdi-credit-card-off" size="48" color="grey" class="mb-2" />
                <div class="text-body-2 text-medium-emphasis">No credit cards</div>
              </div>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <!-- Quick Actions -->
      <v-card variant="outlined" class="mt-6">
        <v-card-text class="d-flex gap-3 flex-wrap">
          <v-btn color="primary" variant="flat" prepend-icon="mdi-plus" to="/dashboard/liabilities/loans">
            Add Loan
          </v-btn>
          <v-btn color="orange" variant="flat" prepend-icon="mdi-credit-card-plus" to="/dashboard/liabilities/credit-cards">
            Add Credit Card
          </v-btn>
          <v-btn variant="outlined" prepend-icon="mdi-chart-line" to="/dashboard/liabilities/debt-payoff">
            Payoff Strategy
          </v-btn>
          <v-btn variant="outlined" prepend-icon="mdi-file-document" to="/dashboard/liabilities/reports">
            Generate Report
          </v-btn>
        </v-card-text>
      </v-card>
    </template>
  </div>
</template>
