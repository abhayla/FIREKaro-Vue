<script setup lang="ts">
import { ref } from 'vue'
import SectionHeader from '@/components/shared/SectionHeader.vue'
import CreditCardsOverviewTab from '@/components/liabilities/CreditCardsOverviewTab.vue'
import CreditCardsDetailsTab from '@/components/liabilities/CreditCardsDetailsTab.vue'
import CreditCardForm from '@/components/liabilities/CreditCardForm.vue'
import {
  useCreditCards,
  useCreateCreditCard,
  useUpdateCreditCard,
  useDeleteCreditCard,
  formatINR,
  calculateMinimumDue,
  type CreditCard
} from '@/composables/useLiabilities'

// Section-level tabs (for navigation between liabilities pages)
const tabs = [
  { title: 'Overview', route: '/liabilities' },
  { title: 'Loans', route: '/liabilities/loans' },
  { title: 'Credit Cards', route: '/liabilities/credit-cards' },
  { title: 'Debt Payoff', route: '/liabilities/debt-payoff' },
  { title: 'Reports', route: '/liabilities/reports' },
]

// Internal tab state (Overview vs Details)
const activeTab = ref('overview')

// Data fetching (needed for dialog operations)
const { data: creditCards } = useCreditCards()
const createCard = useCreateCreditCard()
const updateCard = useUpdateCreditCard()
const deleteCard = useDeleteCreditCard()

// Dialog states (shared across tabs)
const showAddDialog = ref(false)
const editingCard = ref<CreditCard | null>(null)
const showDeleteConfirm = ref(false)
const deletingId = ref<string | null>(null)
const showStatements = ref(false)
const selectedCardForStatements = ref<CreditCard | null>(null)
const showPaymentDialog = ref(false)
const selectedCardForPayment = ref<CreditCard | null>(null)
const paymentAmount = ref(0)

// Event handlers from tab components
const handleAddCard = () => {
  editingCard.value = null
  showAddDialog.value = true
}

const handleEdit = (card: CreditCard) => {
  editingCard.value = card
  showAddDialog.value = true
}

const handleDelete = (id: string) => {
  deletingId.value = id
  showDeleteConfirm.value = true
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

// Save card handler
const handleSaveCard = async (data: Partial<CreditCard>) => {
  if (editingCard.value) {
    await updateCard.mutateAsync({ ...data, id: editingCard.value.id } as CreditCard & { id: string })
  } else {
    await createCard.mutateAsync(data)
  }
  showAddDialog.value = false
  editingCard.value = null
}

// Confirm delete handler
const confirmDelete = async () => {
  if (deletingId.value) {
    await deleteCard.mutateAsync(deletingId.value)
  }
  showDeleteConfirm.value = false
  deletingId.value = null
}

// Submit payment handler
const submitPayment = async () => {
  // In real app, call API to record payment
  console.log('Payment recorded:', paymentAmount.value)
  showPaymentDialog.value = false
  selectedCardForPayment.value = null
}
</script>

<template>
  <div>
    <!-- Section Header with section-level navigation tabs -->
    <SectionHeader
      title="Liabilities"
      subtitle="Credit Card Management"
      icon="mdi-credit-card-outline"
      :tabs="tabs"
    />

    <!-- Internal Tab Navigation (Overview / Card Details) -->
    <v-tabs v-model="activeTab" color="primary" density="compact" class="mb-4">
      <v-tab value="overview">Overview</v-tab>
      <v-tab value="details">Card Details</v-tab>
    </v-tabs>

    <!-- Tab Content -->
    <v-window v-model="activeTab">
      <!-- Overview Tab -->
      <v-window-item value="overview">
        <CreditCardsOverviewTab @go-to-details="activeTab = 'details'" />
      </v-window-item>

      <!-- Card Details Tab -->
      <v-window-item value="details">
        <CreditCardsDetailsTab
          @add-card="handleAddCard"
          @edit-card="handleEdit"
          @delete-card="handleDelete"
          @record-payment="handleRecordPayment"
          @view-statements="handleViewStatements"
        />
      </v-window-item>
    </v-window>

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
          <v-table v-if="selectedCardForStatements.statements?.length" density="compact">
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
              <tr v-for="stmt in selectedCardForStatements.statements" :key="stmt.id">
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
          <div v-else class="text-center py-4 text-medium-emphasis">
            No statements found for this card.
          </div>
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
              @click="paymentAmount = calculateMinimumDue(selectedCardForPayment.currentOutstanding)"
            >
              Min Due: {{ formatINR(calculateMinimumDue(selectedCardForPayment.currentOutstanding)) }}
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
