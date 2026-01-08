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
  type Loan
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
const typeFilter = ref<string | null>(null)

// Mock data for demo
const mockLoans: Loan[] = [
  {
    id: '1',
    userId: 'user1',
    loanType: 'home',
    lenderName: 'HDFC Bank',
    accountNumber: 'HDFC123456',
    principalAmount: 5000000,
    outstandingPrincipal: 3200000,
    interestRate: 8.5,
    tenure: 240,
    emiAmount: 43391,
    emiDate: 5,
    startDate: '2020-06-01',
    endDate: '2040-05-31',
    totalInterestPaid: 850000,
    totalPrincipalPaid: 1800000,
    prepaymentsMade: 200000,
    isActive: true,
    section80C: 150000,
    section24: 200000
  },
  {
    id: '2',
    userId: 'user1',
    loanType: 'car',
    lenderName: 'ICICI Bank',
    accountNumber: 'ICICI789012',
    principalAmount: 800000,
    outstandingPrincipal: 450000,
    interestRate: 9.5,
    tenure: 60,
    emiAmount: 16765,
    emiDate: 15,
    startDate: '2022-03-01',
    endDate: '2027-02-28',
    totalInterestPaid: 120000,
    totalPrincipalPaid: 350000,
    prepaymentsMade: 0,
    isActive: true
  },
  {
    id: '3',
    userId: 'user1',
    loanType: 'personal',
    lenderName: 'Axis Bank',
    accountNumber: 'AXIS456789',
    principalAmount: 300000,
    outstandingPrincipal: 180000,
    interestRate: 14,
    tenure: 36,
    emiAmount: 10248,
    emiDate: 10,
    startDate: '2024-01-01',
    endDate: '2027-01-01',
    totalInterestPaid: 48000,
    totalPrincipalPaid: 120000,
    prepaymentsMade: 0,
    isActive: true
  }
]

// Use mock data if API returns empty
const loansList = computed(() => loans.value?.length ? loans.value : mockLoans)

// Filter loans
const filteredLoans = computed(() => {
  if (!typeFilter.value) return loansList.value
  return loansList.value.filter(l => l.loanType === typeFilter.value)
})

// Available loan types
const loanTypes = computed(() => {
  const types = new Set(loansList.value.map(l => l.loanType))
  return Array.from(types)
})

// Summary calculations
const summary = computed(() => ({
  totalOutstanding: loansList.value.reduce((sum, l) => sum + l.outstandingPrincipal, 0),
  totalEmi: loansList.value.reduce((sum, l) => sum + l.emiAmount, 0),
  totalPrincipalPaid: loansList.value.reduce((sum, l) => sum + l.totalPrincipalPaid, 0),
  totalInterestPaid: loansList.value.reduce((sum, l) => sum + l.totalInterestPaid, 0),
  loanCount: loansList.value.length,
  activeCount: loansList.value.filter(l => l.isActive).length
}))

// Handlers
const handleSaveLoan = async (data: Partial<Loan>) => {
  if (editingLoan.value) {
    await updateLoan.mutateAsync({ ...data, id: editingLoan.value.id } as Loan & { id: string })
  } else {
    await createLoan.mutateAsync(data)
  }
  showAddDialog.value = false
  editingLoan.value = null
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
    await deleteLoan.mutateAsync(deletingId.value)
  }
  showDeleteConfirm.value = false
  deletingId.value = null
}

const handleViewSchedule = (loan: Loan) => {
  selectedLoanForSchedule.value = loan
  showAmortization.value = true
}

const handlePrepay = (loan: Loan) => {
  // TODO: Implement prepayment dialog
  console.log('Prepay loan:', loan.id)
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
            <v-icon icon="mdi-check-circle" color="success" size="24" class="mr-2" />
            <span class="text-body-2">Principal Paid</span>
          </div>
          <div class="text-h5 font-weight-bold text-success">{{ formatINRCompact(summary.totalPrincipalPaid) }}</div>
        </v-card>
      </v-col>
      <v-col cols="12" sm="6" md="3">
        <v-card class="pa-4">
          <div class="d-flex align-center mb-2">
            <v-icon icon="mdi-percent" color="warning" size="24" class="mr-2" />
            <span class="text-body-2">Interest Paid</span>
          </div>
          <div class="text-h5 font-weight-bold text-warning">{{ formatINRCompact(summary.totalInterestPaid) }}</div>
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
          style="max-width: 180px"
        />

        <!-- Type Chips -->
        <div class="d-flex gap-2">
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
    <v-alert v-else-if="error" type="info" variant="tonal" class="mb-6">
      Showing demo data. Add your loans to track EMIs and prepayments.
    </v-alert>

    <!-- Loans Grid -->
    <v-row v-if="filteredLoans.length > 0">
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
          {{ selectedLoanForSchedule.lenderName }} - Amortization Schedule
          <v-spacer />
          <v-btn icon="mdi-close" variant="text" @click="showAmortization = false" />
        </v-card-title>
        <v-card-text>
          <AmortizationTable :loan="selectedLoanForSchedule" />
        </v-card-text>
      </v-card>
    </v-dialog>
  </div>
</template>
