<script setup lang="ts">
import { ref, computed } from 'vue'
import SectionHeader from '@/components/shared/SectionHeader.vue'
import BankAccountCard from '@/components/financial-health/BankAccountCard.vue'
import BankAccountForm from '@/components/financial-health/BankAccountForm.vue'
import {
  useBankAccounts,
  useCreateBankAccount,
  useUpdateBankAccount,
  useDeleteBankAccount,
  formatINR,
  type BankAccount,
  type BankAccountInput
} from '@/composables/useFinancialHealth'

const tabs = [
  { title: 'Health Score', route: '/dashboard/financial-health' },
  { title: 'Net Worth', route: '/dashboard/financial-health/net-worth' },
  { title: 'Cash Flow', route: '/dashboard/financial-health/cash-flow' },
  { title: 'Banking', route: '/dashboard/financial-health/banking' },
  { title: 'Emergency Fund', route: '/dashboard/financial-health/emergency-fund' },
  { title: 'Reports', route: '/dashboard/financial-health/reports' },
]

const { data: accounts, isLoading, isError, refetch } = useBankAccounts()
const createMutation = useCreateBankAccount()
const updateMutation = useUpdateBankAccount()
const deleteMutation = useDeleteBankAccount()

// Form state
const showForm = ref(false)
const editingAccount = ref<BankAccount | null>(null)

// Delete confirmation
const showDeleteConfirm = ref(false)
const accountToDelete = ref<BankAccount | null>(null)

// Computed values
const totalBalance = computed(() => {
  if (!accounts.value) return 0
  return accounts.value.reduce((sum, acc) => sum + acc.balance, 0)
})

const activeAccounts = computed(() => {
  if (!accounts.value) return []
  return accounts.value.filter(a => a.isActive)
})

const fdAccounts = computed(() => {
  if (!accounts.value) return []
  return accounts.value.filter(a => a.accountType === 'fd' || a.accountType === 'rd')
})

const savingsAccounts = computed(() => {
  if (!accounts.value) return []
  return accounts.value.filter(a => a.accountType === 'savings' || a.accountType === 'current' || a.accountType === 'salary')
})

// Actions
const handleAddAccount = () => {
  editingAccount.value = null
  showForm.value = true
}

const handleEditAccount = (account: BankAccount) => {
  editingAccount.value = account
  showForm.value = true
}

const handleSaveAccount = async (data: BankAccountInput) => {
  try {
    if (editingAccount.value) {
      await updateMutation.mutateAsync({ id: editingAccount.value.id, data })
    } else {
      await createMutation.mutateAsync(data)
    }
    showForm.value = false
    editingAccount.value = null
  } catch (error) {
    console.error('Failed to save account:', error)
  }
}

const confirmDelete = (account: BankAccount) => {
  accountToDelete.value = account
  showDeleteConfirm.value = true
}

const handleDeleteAccount = async () => {
  if (!accountToDelete.value) return
  try {
    await deleteMutation.mutateAsync(accountToDelete.value.id)
    showDeleteConfirm.value = false
    accountToDelete.value = null
  } catch (error) {
    console.error('Failed to delete account:', error)
  }
}
</script>

<template>
  <div>
    <SectionHeader
      title="Financial Health"
      subtitle="Manage your bank accounts and track balances"
      icon="mdi-heart-pulse"
      :tabs="tabs"
    />
    <!-- Summary Cards -->
    <v-row class="mb-6">
      <v-col cols="12" sm="4">
        <v-card color="primary" variant="tonal" class="pa-4">
          <div class="text-body-2 text-medium-emphasis">Total Balance</div>
          <div class="text-h4 font-weight-bold">{{ formatINR(totalBalance, true) }}</div>
          <div class="text-caption">Across all accounts</div>
        </v-card>
      </v-col>

      <v-col cols="12" sm="4">
        <v-card color="success" variant="tonal" class="pa-4">
          <div class="text-body-2 text-medium-emphasis">Active Accounts</div>
          <div class="text-h4 font-weight-bold">{{ activeAccounts.length }}</div>
          <div class="text-caption">Bank accounts</div>
        </v-card>
      </v-col>

      <v-col cols="12" sm="4">
        <v-card color="warning" variant="tonal" class="pa-4">
          <div class="text-body-2 text-medium-emphasis">Fixed Deposits</div>
          <div class="text-h4 font-weight-bold">{{ fdAccounts.length }}</div>
          <div class="text-caption">FD/RD accounts</div>
        </v-card>
      </v-col>
    </v-row>

    <!-- Actions -->
    <div class="d-flex justify-space-between align-center mb-4">
      <div class="text-h6">Your Accounts</div>
      <v-btn color="primary" prepend-icon="mdi-plus" @click="handleAddAccount">
        Add Account
      </v-btn>
    </div>

    <!-- Loading State -->
    <div v-if="isLoading" class="text-center py-8">
      <v-progress-circular indeterminate color="primary" size="48" />
      <p class="text-body-2 text-medium-emphasis mt-4">Loading accounts...</p>
    </div>

    <!-- Error State -->
    <v-alert v-else-if="isError" type="error" variant="tonal" class="mb-6">
      <v-icon icon="mdi-alert-circle" class="mr-2" />
      Failed to load accounts. Please try again later.
      <template #append>
        <v-btn variant="text" size="small" @click="refetch">Retry</v-btn>
      </template>
    </v-alert>

    <!-- Empty State -->
    <v-card v-else-if="!accounts || accounts.length === 0" variant="outlined" class="text-center pa-8">
      <v-icon icon="mdi-bank-off" size="64" color="grey" />
      <div class="text-h6 mt-4">No bank accounts yet</div>
      <div class="text-body-2 text-medium-emphasis mb-4">
        Add your first bank account to start tracking
      </div>
      <v-btn color="primary" prepend-icon="mdi-plus" @click="handleAddAccount">
        Add Your First Account
      </v-btn>
    </v-card>

    <!-- Account Lists -->
    <template v-else>
      <!-- Savings & Current Accounts -->
      <div v-if="savingsAccounts.length > 0" class="mb-6">
        <div class="text-subtitle-1 font-weight-medium mb-3">Savings & Current Accounts</div>
        <v-row>
          <v-col v-for="account in savingsAccounts" :key="account.id" cols="12" sm="6" md="4">
            <BankAccountCard
              :account="account"
              @edit="handleEditAccount"
              @delete="confirmDelete"
            />
          </v-col>
        </v-row>
      </div>

      <!-- Fixed Deposits -->
      <div v-if="fdAccounts.length > 0">
        <div class="text-subtitle-1 font-weight-medium mb-3">Fixed & Recurring Deposits</div>
        <v-row>
          <v-col v-for="account in fdAccounts" :key="account.id" cols="12" sm="6" md="4">
            <BankAccountCard
              :account="account"
              @edit="handleEditAccount"
              @delete="confirmDelete"
            />
          </v-col>
        </v-row>
      </div>
    </template>

    <!-- Add/Edit Form Dialog -->
    <BankAccountForm
      v-model="showForm"
      :account="editingAccount"
      @save="handleSaveAccount"
    />

    <!-- Delete Confirmation Dialog -->
    <v-dialog v-model="showDeleteConfirm" max-width="400">
      <v-card>
        <v-card-title>Delete Account?</v-card-title>
        <v-card-text>
          Are you sure you want to delete <strong>{{ accountToDelete?.bankName }}</strong> ({{ accountToDelete?.accountNumber }})?
          This action cannot be undone.
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="showDeleteConfirm = false">Cancel</v-btn>
          <v-btn
            color="error"
            variant="flat"
            :loading="deleteMutation.isPending.value"
            @click="handleDeleteAccount"
          >
            Delete
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>
