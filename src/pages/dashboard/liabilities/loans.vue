<script setup lang="ts">
import { ref, computed } from 'vue'
import SectionHeader from '@/components/shared/SectionHeader.vue'
import FamilyToggle from '@/components/shared/FamilyToggle.vue'
import LoanCard from '@/components/liabilities/LoanCard.vue'
import LoanForm from '@/components/liabilities/LoanForm.vue'
import AmortizationTable from '@/components/liabilities/AmortizationTable.vue'
import {
  useLoans,
  useCreateLoan,
  useUpdateLoan,
  useDeleteLoan,
  formatINR,
  formatINRCompact,
  getLoanTypeLabel,
  calculatePrepaymentImpact,
  type Loan,
  type LoanType
} from '@/composables/useLiabilities'

const tabs = [
  { title: 'Overview', route: '/dashboard/liabilities' },
  { title: 'Loans', route: '/dashboard/liabilities/loans' },
  { title: 'Credit Cards', route: '/dashboard/liabilities/credit-cards' },
  { title: 'Debt Payoff', route: '/dashboard/liabilities/debt-payoff' },
  { title: 'Reports', route: '/dashboard/liabilities/reports' },
]

// Data fetching
const { data: loans, isLoading, error } = useLoans()
const createLoan = useCreateLoan()
const updateLoan = useUpdateLoan()
const deleteLoan = useDeleteLoan()

// UI State
const showAddDialog = ref(false)
const editingLoan = ref<Loan | null>(null)
const showDeleteConfirm = ref(false)
const deletingId = ref<string | null>(null)
const showAmortization = ref(false)
const selectedLoanForSchedule = ref<Loan | null>(null)
const typeFilter = ref<LoanType | null>(null)

// Prepayment dialog state
const showPrepayDialog = ref(false)
const selectedLoanForPrepay = ref<Loan | null>(null)
const prepaymentAmount = ref(0)
const prepaymentOption = ref<'emi' | 'tenure'>('tenure')

// Use API data directly (no mock data)
const loansList = computed(() => loans.value || [])

// Filter loans
const filteredLoans = computed(() => {
  if (!typeFilter.value) return loansList.value
  return loansList.value.filter(l => l.loanType === typeFilter.value)
})

// Available loan types
const loanTypes = computed(() => {
  const types = new Set(loansList.value.map(l => l.loanType))
  return Array.from(types) as LoanType[]
})

// Summary calculations - use backend field names
const summary = computed(() => ({
  totalOutstanding: loansList.value.reduce((sum, l) => sum + (l.outstandingAmount ?? 0), 0),
  totalEmi: loansList.value.reduce((sum, l) => sum + (l.emiAmount ?? 0), 0),
  loanCount: loansList.value.length,
  activeCount: loansList.value.filter(l => l.status === 'ACTIVE').length
}))

// Handlers
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

const handleEdit = (loan: Loan) => {
  editingLoan.value = loan
  showAddDialog.value = true
}

const handleDelete = (id: string) => {
  deletingId.value = id
  showDeleteConfirm.value = true
}

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

// Prepayment impact calculation - use backend field names
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

    // If reducing EMI, update the EMI amount
    if (prepaymentOption.value === 'emi' && impact.newEmi) {
      updateData.emiAmount = impact.newEmi
    }

    // If reducing tenure, update the remaining tenure
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
    <SectionHeader
      title="Liabilities"
      subtitle="Loan Management"
      icon="mdi-credit-card-outline"
      :tabs="tabs"
    />

    <FamilyToggle class="mb-6" />

    <!-- Summary Cards -->
    <v-row class="mb-6">
      <v-col cols="12" sm="6" md="3">
        <v-card class="pa-4">
          <div class="d-flex align-center mb-2">
            <v-icon icon="mdi-bank" color="error" size="24" class="mr-2" />
            <span class="text-body-2">Total Outstanding</span>
          </div>
          <div class="text-h5 font-weight-bold">{{ formatINRCompact(summary.totalOutstanding) }}</div>
          <div class="text-caption text-medium-emphasis">{{ summary.activeCount }} active loans</div>
        </v-card>
      </v-col>
      <v-col cols="12" sm="6" md="3">
        <v-card class="pa-4">
          <div class="d-flex align-center mb-2">
            <v-icon icon="mdi-calendar-month" color="primary" size="24" class="mr-2" />
            <span class="text-body-2">Total Monthly EMI</span>
          </div>
          <div class="text-h5 font-weight-bold">{{ formatINR(summary.totalEmi) }}</div>
        </v-card>
      </v-col>
      <v-col cols="12" sm="6" md="3">
        <v-card class="pa-4">
          <div class="d-flex align-center mb-2">
            <v-icon icon="mdi-counter" color="info" size="24" class="mr-2" />
            <span class="text-body-2">Total Loans</span>
          </div>
          <div class="text-h5 font-weight-bold">{{ summary.loanCount }}</div>
        </v-card>
      </v-col>
      <v-col cols="12" sm="6" md="3">
        <v-card class="pa-4">
          <div class="d-flex align-center mb-2">
            <v-icon icon="mdi-check-circle" color="success" size="24" class="mr-2" />
            <span class="text-body-2">Active Loans</span>
          </div>
          <div class="text-h5 font-weight-bold text-success">{{ summary.activeCount }}</div>
        </v-card>
      </v-col>
    </v-row>

    <!-- Toolbar -->
    <v-card variant="outlined" class="mb-6">
      <v-card-text class="d-flex gap-3 flex-wrap align-center">
        <v-btn color="primary" variant="flat" prepend-icon="mdi-plus" @click="showAddDialog = true">
          Add Loan
        </v-btn>

        <v-spacer />

        <v-select
          v-model="typeFilter"
          :items="[
            { title: 'All Types', value: null },
            ...loanTypes.map(t => ({ title: getLoanTypeLabel(t), value: t }))
          ]"
          label="Filter by Type"
          variant="outlined"
          density="compact"
          hide-details
          style="max-width: 220px"
        />

        <!-- Type Chips -->
        <div class="d-flex gap-2 flex-wrap">
          <v-chip
            v-for="type in loanTypes"
            :key="type"
            variant="tonal"
            size="small"
          >
            {{ loansList.filter(l => l.loanType === type).length }} {{ getLoanTypeLabel(type) }}
          </v-chip>
        </div>
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
    <v-alert v-else-if="error" type="error" variant="tonal" class="mb-6">
      Failed to load loans. Please try again later.
    </v-alert>

    <!-- Loans Grid -->
    <v-row v-else-if="filteredLoans.length > 0">
      <v-col
        v-for="loan in filteredLoans"
        :key="loan.id"
        cols="12"
        md="6"
        lg="4"
      >
        <LoanCard
          :loan="loan"
          show-actions
          @edit="handleEdit"
          @delete="handleDelete"
          @view-schedule="handleViewSchedule"
          @prepay="handlePrepay"
        />
      </v-col>
    </v-row>

    <!-- Empty State -->
    <v-card v-else variant="outlined" class="pa-8 text-center">
      <v-icon icon="mdi-bank-off" size="64" color="grey" class="mb-4" />
      <h3 class="text-h6 mb-2">No loans found</h3>
      <p class="text-body-2 text-medium-emphasis mb-4">
        {{ typeFilter ? 'No loans match your filter' : 'Add your first loan to start tracking EMIs' }}
      </p>
      <v-btn color="primary" variant="flat" prepend-icon="mdi-plus" @click="showAddDialog = true">
        Add Loan
      </v-btn>
    </v-card>

    <!-- Tax Benefits Info -->
    <v-card variant="outlined" class="mt-6">
      <v-card-title class="text-subtitle-1">
        <v-icon icon="mdi-information" class="mr-2" />
        Loan Tax Benefits
      </v-card-title>
      <v-card-text>
        <v-row>
          <v-col cols="12" md="4">
            <v-alert color="blue" variant="tonal" density="compact">
              <div class="text-subtitle-2 font-weight-bold">Home Loan - Section 80C</div>
              <div class="text-body-2 mt-1">
                Principal repayment up to Rs. 1.5L per year
              </div>
            </v-alert>
          </v-col>
          <v-col cols="12" md="4">
            <v-alert color="success" variant="tonal" density="compact">
              <div class="text-subtitle-2 font-weight-bold">Home Loan - Section 24(b)</div>
              <div class="text-body-2 mt-1">
                Interest up to Rs. 2L for self-occupied property
              </div>
            </v-alert>
          </v-col>
          <v-col cols="12" md="4">
            <v-alert color="teal" variant="tonal" density="compact">
              <div class="text-subtitle-2 font-weight-bold">Education Loan - Section 80E</div>
              <div class="text-body-2 mt-1">
                Entire interest deductible for 8 years
              </div>
            </v-alert>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

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
