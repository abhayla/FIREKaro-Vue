<script setup lang="ts">
import { ref, computed } from 'vue'
import SectionHeader from '@/components/shared/SectionHeader.vue'
import FamilyToggle from '@/components/shared/FamilyToggle.vue'
import CreditCardCard from '@/components/liabilities/CreditCardCard.vue'
import CreditCardForm from '@/components/liabilities/CreditCardForm.vue'
import {
  useCreditCards,
  useCreateCreditCard,
  useUpdateCreditCard,
  useDeleteCreditCard,
  formatINR,
  formatINRCompact,
  type CreditCard,
  type CreditCardStatement
} from '@/composables/useLiabilities'

const tabs = [
  { title: 'Overview', route: '/dashboard/liabilities' },
  { title: 'Loans', route: '/dashboard/liabilities/loans' },
  { title: 'Credit Cards', route: '/dashboard/liabilities/credit-cards' },
  { title: 'Debt Payoff', route: '/dashboard/liabilities/debt-payoff' },
  { title: 'Reports', route: '/dashboard/liabilities/reports' },
]

// Data fetching
const { data: creditCards, isLoading, error } = useCreditCards()
const createCard = useCreateCreditCard()
const updateCard = useUpdateCreditCard()
const deleteCard = useDeleteCreditCard()

// UI State
const showAddDialog = ref(false)
const editingCard = ref<CreditCard | null>(null)
const showDeleteConfirm = ref(false)
const deletingId = ref<string | null>(null)
const showStatements = ref(false)
const selectedCardForStatements = ref<CreditCard | null>(null)
const showPaymentDialog = ref(false)
const selectedCardForPayment = ref<CreditCard | null>(null)

// Mock data for demo
const mockCreditCards: CreditCard[] = [
  {
    id: '1',
    userId: 'user1',
    cardName: 'HDFC Regalia',
    bankName: 'HDFC Bank',
    cardNumber: '****5678',
    cardType: 'VISA',
    creditLimit: 500000,
    availableLimit: 175000,
    currentOutstanding: 325000,
    utilizationPercent: 65,
    billingCycleDate: 15,
    paymentDueDate: 5,
    rewardPointsBalance: 12500,
    interestRateAPR: 42,
    annualFee: 2500,
    isActive: true,
    minimumDue: 16250,
    nextDueDate: '2026-02-05'
  },
  {
    id: '2',
    userId: 'user1',
    cardName: 'SBI SimplyCLICK',
    bankName: 'SBI Card',
    cardNumber: '****1234',
    cardType: 'MASTERCARD',
    creditLimit: 300000,
    availableLimit: 220000,
    currentOutstanding: 80000,
    utilizationPercent: 27,
    billingCycleDate: 20,
    paymentDueDate: 10,
    rewardPointsBalance: 5200,
    interestRateAPR: 39.6,
    annualFee: 499,
    isActive: true,
    minimumDue: 4000,
    nextDueDate: '2026-02-10'
  },
  {
    id: '3',
    userId: 'user1',
    cardName: 'ICICI Amazon Pay',
    bankName: 'ICICI Bank',
    cardNumber: '****9012',
    cardType: 'VISA',
    creditLimit: 200000,
    availableLimit: 185000,
    currentOutstanding: 15000,
    utilizationPercent: 7.5,
    billingCycleDate: 25,
    paymentDueDate: 15,
    rewardPointsBalance: 2100,
    interestRateAPR: 40.8,
    annualFee: 0,
    isActive: true,
    minimumDue: 750,
    nextDueDate: '2026-02-15'
  }
]

// Mock statements
const mockStatements: CreditCardStatement[] = [
  { id: '1', creditCardId: '1', statementDate: '2025-12-15', statementAmount: 42500, minimumDue: 8500, dueDate: '2026-01-05', isPaid: true, paidAmount: 42500, paidDate: '2026-01-03' },
  { id: '2', creditCardId: '1', statementDate: '2025-11-15', statementAmount: 38200, minimumDue: 7640, dueDate: '2025-12-05', isPaid: true, paidAmount: 38200, paidDate: '2025-12-02' },
  { id: '3', creditCardId: '1', statementDate: '2025-10-15', statementAmount: 35800, minimumDue: 7160, dueDate: '2025-11-05', isPaid: true, paidAmount: 35800, paidDate: '2025-11-04' },
]

// Use mock data if API returns empty
const cardsList = computed(() => creditCards.value?.length ? creditCards.value : mockCreditCards)

// Summary calculations
const summary = computed(() => {
  const totalLimit = cardsList.value.reduce((sum, c) => sum + c.creditLimit, 0)
  const totalOutstanding = cardsList.value.reduce((sum, c) => sum + c.currentOutstanding, 0)
  const totalAvailable = cardsList.value.reduce((sum, c) => sum + c.availableLimit, 0)
  const totalMinDue = cardsList.value.reduce((sum, c) => sum + c.minimumDue, 0)
  const totalRewards = cardsList.value.reduce((sum, c) => sum + c.rewardPointsBalance, 0)

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

// Payment amount
const paymentAmount = ref(0)

// Handlers
const handleSaveCard = async (data: Partial<CreditCard>) => {
  if (editingCard.value) {
    await updateCard.mutateAsync({ ...data, id: editingCard.value.id } as CreditCard & { id: string })
  } else {
    await createCard.mutateAsync(data)
  }
  showAddDialog.value = false
  editingCard.value = null
}

const handleEdit = (card: CreditCard) => {
  editingCard.value = card
  showAddDialog.value = true
}

const handleDelete = (id: string) => {
  deletingId.value = id
  showDeleteConfirm.value = true
}

const confirmDelete = async () => {
  if (deletingId.value) {
    await deleteCard.mutateAsync(deletingId.value)
  }
  showDeleteConfirm.value = false
  deletingId.value = null
}

const handleViewStatements = (card: CreditCard) => {
  selectedCardForStatements.value = card
  showStatements.value = true
}

const handleRecordPayment = (card: CreditCard) => {
  selectedCardForPayment.value = card
  paymentAmount.value = card.currentOutstanding
  showPaymentDialog.value = true
}

const submitPayment = async () => {
  // In real app, call API to record payment
  console.log('Payment recorded:', paymentAmount.value)
  showPaymentDialog.value = false
  selectedCardForPayment.value = null
}
</script>

<template>
  <div>
    <SectionHeader
      title="Liabilities"
      subtitle="Credit Card Management"
      icon="mdi-credit-card-outline"
      :tabs="tabs"
    />

    <FamilyToggle class="mb-6" />

    <!-- Summary Cards -->
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
        <v-btn color="primary" variant="flat" prepend-icon="mdi-credit-card-plus" @click="showAddDialog = true">
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
    <v-card v-else variant="outlined" class="pa-8 text-center">
      <v-icon icon="mdi-credit-card-off" size="64" color="grey" class="mb-4" />
      <h3 class="text-h6 mb-2">No credit cards found</h3>
      <p class="text-body-2 text-medium-emphasis mb-4">
        Add your credit cards to track balances and utilization.
      </p>
      <v-btn color="primary" variant="flat" prepend-icon="mdi-credit-card-plus" @click="showAddDialog = true">
        Add Credit Card
      </v-btn>
    </v-card>

    <!-- Credit Score Tips -->
    <v-card variant="outlined" class="mt-6">
      <v-card-title class="text-subtitle-1">
        <v-icon icon="mdi-lightbulb" class="mr-2" />
        Credit Score Tips
      </v-card-title>
      <v-card-text>
        <v-row>
          <v-col cols="12" md="4">
            <v-alert color="success" variant="tonal" density="compact">
              <div class="text-subtitle-2 font-weight-bold">Keep Utilization Low</div>
              <div class="text-body-2 mt-1">
                Maintain credit utilization below 30% for optimal score
              </div>
            </v-alert>
          </v-col>
          <v-col cols="12" md="4">
            <v-alert color="primary" variant="tonal" density="compact">
              <div class="text-subtitle-2 font-weight-bold">Pay On Time</div>
              <div class="text-body-2 mt-1">
                Payment history is 35% of your credit score
              </div>
            </v-alert>
          </v-col>
          <v-col cols="12" md="4">
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

    <!-- Add/Edit Card Dialog -->
    <CreditCardForm
      v-model="showAddDialog"
      :card="editingCard"
      :is-editing="!!editingCard"
      @save="handleSaveCard"
    />

    <!-- Delete Confirmation Dialog -->
    <v-dialog v-model="showDeleteConfirm" max-width="400">
      <v-card>
        <v-card-title class="d-flex align-center">
          <v-icon icon="mdi-alert" color="error" class="mr-2" />
          Delete Credit Card
        </v-card-title>
        <v-card-text>
          Are you sure you want to delete this credit card? This action cannot be undone.
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="showDeleteConfirm = false">Cancel</v-btn>
          <v-btn color="error" variant="flat" @click="confirmDelete">Delete</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Statements Dialog -->
    <v-dialog v-model="showStatements" max-width="700" scrollable>
      <v-card v-if="selectedCardForStatements">
        <v-card-title class="d-flex align-center">
          {{ selectedCardForStatements.cardName }} - Statement History
          <v-spacer />
          <v-btn icon="mdi-close" variant="text" @click="showStatements = false" />
        </v-card-title>
        <v-card-text>
          <v-table density="compact">
            <thead>
              <tr>
                <th>Statement Date</th>
                <th class="text-right">Amount</th>
                <th class="text-right">Min Due</th>
                <th>Due Date</th>
                <th class="text-center">Status</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="stmt in mockStatements" :key="stmt.id">
                <td>{{ new Date(stmt.statementDate).toLocaleDateString('en-IN') }}</td>
                <td class="text-right">{{ formatINR(stmt.statementAmount) }}</td>
                <td class="text-right">{{ formatINR(stmt.minimumDue) }}</td>
                <td>{{ new Date(stmt.dueDate).toLocaleDateString('en-IN') }}</td>
                <td class="text-center">
                  <v-chip :color="stmt.isPaid ? 'success' : 'warning'" size="small">
                    {{ stmt.isPaid ? 'Paid' : 'Pending' }}
                  </v-chip>
                </td>
              </tr>
            </tbody>
          </v-table>
        </v-card-text>
      </v-card>
    </v-dialog>

    <!-- Payment Dialog -->
    <v-dialog v-model="showPaymentDialog" max-width="400">
      <v-card v-if="selectedCardForPayment">
        <v-card-title class="d-flex align-center">
          <v-icon icon="mdi-cash-plus" color="success" class="mr-2" />
          Record Payment
        </v-card-title>
        <v-card-text>
          <div class="text-body-2 mb-4">
            Recording payment for <strong>{{ selectedCardForPayment.cardName }}</strong>
          </div>
          <v-text-field
            v-model.number="paymentAmount"
            label="Payment Amount"
            type="number"
            prefix="₹"
            variant="outlined"
            density="comfortable"
          />
          <div class="d-flex gap-2 mt-2">
            <v-chip
              size="small"
              variant="outlined"
              @click="paymentAmount = selectedCardForPayment.minimumDue"
            >
              Min Due: {{ formatINR(selectedCardForPayment.minimumDue) }}
            </v-chip>
            <v-chip
              size="small"
              variant="outlined"
              @click="paymentAmount = selectedCardForPayment.currentOutstanding"
            >
              Full: {{ formatINR(selectedCardForPayment.currentOutstanding) }}
            </v-chip>
          </div>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="showPaymentDialog = false">Cancel</v-btn>
          <v-btn color="success" variant="flat" @click="submitPayment">Record Payment</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>
