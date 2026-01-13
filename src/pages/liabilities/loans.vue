<script setup lang="ts">
import { ref, computed } from 'vue'
import SectionHeader from '@/components/shared/SectionHeader.vue'
import LoansOverviewTab from '@/components/liabilities/LoansOverviewTab.vue'
import LoansDetailsTab from '@/components/liabilities/LoansDetailsTab.vue'
import LoanForm from '@/components/liabilities/LoanForm.vue'
import AmortizationTable from '@/components/liabilities/AmortizationTable.vue'
import {
  useLoans,
  useCreateLoan,
  useUpdateLoan,
  useDeleteLoan,
  formatINR,
  calculatePrepaymentImpact,
  type Loan
} from '@/composables/useLiabilities'

// Internal tab state (Overview vs Details)
const activeTab = ref('overview')

// Data fetching (needed for dialog operations)
const { data: loans } = useLoans()
const createLoan = useCreateLoan()
const updateLoan = useUpdateLoan()
const deleteLoan = useDeleteLoan()

// Dialog states (shared across tabs)
const showAddDialog = ref(false)
const editingLoan = ref<Loan | null>(null)
const showDeleteConfirm = ref(false)
const deletingId = ref<string | null>(null)
const showAmortization = ref(false)
const selectedLoanForSchedule = ref<Loan | null>(null)

// Prepayment dialog state
const showPrepayDialog = ref(false)
const selectedLoanForPrepay = ref<Loan | null>(null)
const prepaymentAmount = ref(0)
const prepaymentOption = ref<'emi' | 'tenure'>('tenure')

// Event handlers from tab components
const handleAddLoan = () => {
  editingLoan.value = null
  showAddDialog.value = true
}

const handleEdit = (loan: Loan) => {
  editingLoan.value = loan
  showAddDialog.value = true
}

const handleDelete = (id: string) => {
  deletingId.value = id
  showDeleteConfirm.value = true
}

const handleViewSchedule = (loan: Loan) => {
  selectedLoanForSchedule.value = loan
  showAmortization.value = true
}

const handlePrepay = (loan: Loan) => {
  selectedLoanForPrepay.value = loan
  prepaymentAmount.value = 0
  prepaymentOption.value = 'tenure'
  showPrepayDialog.value = true
}

// Save loan handler
const handleSaveLoan = async (data: Partial<Loan>) => {
  try {
    if (editingLoan.value) {
      await updateLoan.mutateAsync({ ...data, id: editingLoan.value.id } as Loan & { id: string })
    } else {
      await createLoan.mutateAsync(data)
    }
    showAddDialog.value = false
    editingLoan.value = null
  } catch (err) {
    console.error('Failed to save loan:', err)
  }
}

// Confirm delete handler
const confirmDelete = async () => {
  if (deletingId.value) {
    try {
      await deleteLoan.mutateAsync(deletingId.value)
    } catch (err) {
      console.error('Failed to delete loan:', err)
    }
  }
  showDeleteConfirm.value = false
  deletingId.value = null
}

// Prepayment impact calculation
const prepaymentImpact = computed(() => {
  if (!selectedLoanForPrepay.value || prepaymentAmount.value <= 0) {
    return null
  }

  const loan = selectedLoanForPrepay.value
  const remainingTenure = loan.remainingTenure ?? 0

  if (remainingTenure <= 0) return null

  return calculatePrepaymentImpact(
    loan.outstandingAmount,
    loan.interestRate,
    remainingTenure,
    prepaymentAmount.value,
    prepaymentOption.value === 'emi'
  )
})

// Confirm prepayment handler
const confirmPrepay = async () => {
  if (!selectedLoanForPrepay.value || prepaymentAmount.value <= 0) return

  const loan = selectedLoanForPrepay.value
  const impact = prepaymentImpact.value

  if (!impact) return

  try {
    const updateData: Partial<Loan> & { id: string } = {
      id: loan.id,
      outstandingAmount: loan.outstandingAmount - prepaymentAmount.value,
    }

    if (prepaymentOption.value === 'emi' && impact.newEmi) {
      updateData.emiAmount = impact.newEmi
    }

    if (prepaymentOption.value === 'tenure' && impact.monthsSaved > 0) {
      updateData.remainingTenure = Math.max(0, loan.remainingTenure - impact.monthsSaved)
    }

    await updateLoan.mutateAsync(updateData as Loan & { id: string })
    showPrepayDialog.value = false
    selectedLoanForPrepay.value = null
    prepaymentAmount.value = 0
  } catch (err) {
    console.error('Failed to process prepayment:', err)
  }
}

const handleCloseDialog = () => {
  showAddDialog.value = false
  editingLoan.value = null
}
</script>

<template>
  <div>
    <!-- Section Header -->
    <SectionHeader
      title="Loans"
      subtitle="Manage your loans"
      icon="mdi-bank"
    />

    <!-- Internal Tab Navigation (Overview / Loan Details) -->
    <v-tabs v-model="activeTab" color="primary" density="compact" class="mb-4">
      <v-tab value="overview">Overview</v-tab>
      <v-tab value="details">Loan Details</v-tab>
    </v-tabs>

    <!-- Tab Content -->
    <v-window v-model="activeTab">
      <!-- Overview Tab -->
      <v-window-item value="overview">
        <LoansOverviewTab @go-to-details="activeTab = 'details'" />
      </v-window-item>

      <!-- Loan Details Tab -->
      <v-window-item value="details">
        <LoansDetailsTab
          @add-loan="handleAddLoan"
          @edit-loan="handleEdit"
          @delete-loan="handleDelete"
          @view-schedule="handleViewSchedule"
          @prepay="handlePrepay"
        />
      </v-window-item>
    </v-window>

    <!-- Add/Edit Loan Dialog -->
    <LoanForm
      v-model="showAddDialog"
      :loan="editingLoan"
      :is-editing="!!editingLoan"
      @save="handleSaveLoan"
      @close="handleCloseDialog"
    />

    <!-- Delete Confirmation Dialog -->
    <v-dialog v-model="showDeleteConfirm" max-width="400">
      <v-card>
        <v-card-title class="d-flex align-center">
          <v-icon icon="mdi-alert" color="error" class="mr-2" />
          Delete Loan
        </v-card-title>
        <v-card-text>
          Are you sure you want to delete this loan? This action cannot be undone.
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="showDeleteConfirm = false">Cancel</v-btn>
          <v-btn color="error" variant="flat" @click="confirmDelete">Delete</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Amortization Schedule Dialog -->
    <v-dialog v-model="showAmortization" max-width="900" scrollable>
      <v-card v-if="selectedLoanForSchedule">
        <v-card-title class="d-flex align-center">
          {{ selectedLoanForSchedule.loanName }} - Amortization Schedule
          <v-spacer />
          <v-btn icon="mdi-close" variant="text" @click="showAmortization = false" />
        </v-card-title>
        <v-card-text>
          <AmortizationTable :loan="selectedLoanForSchedule" />
        </v-card-text>
      </v-card>
    </v-dialog>

    <!-- Prepayment Dialog -->
    <v-dialog v-model="showPrepayDialog" max-width="550" persistent>
      <v-card v-if="selectedLoanForPrepay">
        <v-card-title class="d-flex align-center">
          <v-icon icon="mdi-cash-fast" color="success" class="mr-2" />
          Make Prepayment
        </v-card-title>

        <v-card-text>
          <v-alert type="info" variant="tonal" density="compact" class="mb-4">
            <strong>{{ selectedLoanForPrepay.loanName }}</strong> ({{ selectedLoanForPrepay.lender }})<br />
            Outstanding: {{ formatINR(selectedLoanForPrepay.outstandingAmount) }} |
            EMI: {{ formatINR(selectedLoanForPrepay.emiAmount) }} |
            Rate: {{ selectedLoanForPrepay.interestRate }}%
          </v-alert>

          <v-text-field
            v-model.number="prepaymentAmount"
            label="Prepayment Amount"
            type="number"
            prefix="₹"
            variant="outlined"
            density="comfortable"
            :max="selectedLoanForPrepay.outstandingAmount"
            :rules="[
              (v: number) => v > 0 || 'Amount must be greater than 0',
              (v: number) => v <= selectedLoanForPrepay!.outstandingAmount || 'Cannot exceed outstanding balance'
            ]"
            class="mb-4"
          />

          <v-radio-group v-model="prepaymentOption" inline class="mb-4">
            <v-radio value="tenure" label="Reduce Tenure (same EMI)" />
            <v-radio value="emi" label="Reduce EMI (same tenure)" />
          </v-radio-group>

          <!-- Impact Preview -->
          <v-card v-if="prepaymentImpact" variant="outlined" class="mt-4">
            <v-card-title class="text-subtitle-2 pb-0">
              <v-icon icon="mdi-chart-line" class="mr-2" />
              Prepayment Impact
            </v-card-title>
            <v-card-text>
              <v-row dense>
                <v-col cols="6">
                  <div class="text-caption text-medium-emphasis">Interest Saved</div>
                  <div class="text-h6 text-success font-weight-bold">
                    {{ formatINR(prepaymentImpact.interestSaved) }}
                  </div>
                </v-col>
                <v-col cols="6">
                  <div class="text-caption text-medium-emphasis">
                    {{ prepaymentOption === 'tenure' ? 'Months Saved' : 'New EMI' }}
                  </div>
                  <div class="text-h6 font-weight-bold">
                    <template v-if="prepaymentOption === 'tenure'">
                      {{ prepaymentImpact.monthsSaved }} months
                    </template>
                    <template v-else>
                      {{ formatINR(prepaymentImpact.newEmi) }}
                    </template>
                  </div>
                </v-col>
              </v-row>

              <v-divider class="my-3" />

              <div class="text-body-2">
                <div class="d-flex justify-space-between">
                  <span class="text-medium-emphasis">New Outstanding:</span>
                  <span class="font-weight-medium">
                    {{ formatINR(selectedLoanForPrepay.outstandingAmount - prepaymentAmount) }}
                  </span>
                </div>
                <div v-if="prepaymentOption === 'tenure'" class="d-flex justify-space-between">
                  <span class="text-medium-emphasis">New Tenure:</span>
                  <span class="font-weight-medium">{{ prepaymentImpact.newTenure }} months</span>
                </div>
              </div>
            </v-card-text>
          </v-card>
        </v-card-text>

        <v-card-actions class="pa-4">
          <v-spacer />
          <v-btn variant="text" @click="showPrepayDialog = false">Cancel</v-btn>
          <v-btn
            color="success"
            variant="flat"
            :disabled="!prepaymentAmount || prepaymentAmount <= 0 || prepaymentAmount > selectedLoanForPrepay.outstandingAmount"
            @click="confirmPrepay"
          >
            Confirm Prepayment
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>
