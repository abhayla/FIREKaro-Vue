<script setup lang="ts">
import { computed } from 'vue'
import type { BankAccount } from '@/composables/useFinancialHealth'
import { formatINR } from '@/composables/useFinancialHealth'

const props = defineProps<{
  account: BankAccount
}>()

const emit = defineEmits<{
  edit: [account: BankAccount]
  delete: [account: BankAccount]
}>()

const accountTypeConfig = computed(() => {
  switch (props.account.accountType) {
    case 'savings':
      return { icon: 'mdi-piggy-bank', color: 'success', label: 'Savings' }
    case 'current':
      return { icon: 'mdi-bank', color: 'primary', label: 'Current' }
    case 'salary':
      return { icon: 'mdi-cash-multiple', color: 'info', label: 'Salary' }
    case 'fd':
      return { icon: 'mdi-safe', color: 'warning', label: 'Fixed Deposit' }
    case 'rd':
      return { icon: 'mdi-calendar-clock', color: 'secondary', label: 'Recurring Deposit' }
    default:
      return { icon: 'mdi-bank', color: 'grey', label: 'Account' }
  }
})

const maskedAccountNumber = computed(() => {
  const num = props.account.accountNumber
  if (num.length <= 4) return num
  return '••••' + num.slice(-4)
})

const bankLogo = computed(() => {
  const bankName = props.account.bankName.toLowerCase()
  if (bankName.includes('hdfc')) return 'mdi-bank'
  if (bankName.includes('icici')) return 'mdi-bank'
  if (bankName.includes('sbi')) return 'mdi-bank'
  if (bankName.includes('axis')) return 'mdi-bank'
  if (bankName.includes('kotak')) return 'mdi-bank'
  return 'mdi-bank'
})
</script>

<template>
  <v-card
    class="bank-account-card"
    :class="{ 'primary-account': account.isPrimary }"
    variant="outlined"
  >
    <v-card-text>
      <div class="d-flex align-start justify-space-between">
        <div class="d-flex align-center">
          <v-avatar :color="accountTypeConfig.color" size="48" class="mr-3">
            <v-icon :icon="accountTypeConfig.icon" color="white" />
          </v-avatar>
          <div>
            <div class="d-flex align-center">
              <span class="text-subtitle-1 font-weight-medium">{{ account.bankName }}</span>
              <v-chip
                v-if="account.isPrimary"
                color="primary"
                size="x-small"
                class="ml-2"
              >
                Primary
              </v-chip>
            </div>
            <div class="text-body-2 text-medium-emphasis">
              {{ accountTypeConfig.label }} • {{ maskedAccountNumber }}
            </div>
          </div>
        </div>

        <v-menu>
          <template #activator="{ props: menuProps }">
            <v-btn icon="mdi-dots-vertical" variant="text" size="small" v-bind="menuProps" />
          </template>
          <v-list density="compact">
            <v-list-item prepend-icon="mdi-pencil" title="Edit" @click="emit('edit', account)" />
            <v-list-item
              prepend-icon="mdi-delete"
              title="Delete"
              class="text-error"
              @click="emit('delete', account)"
            />
          </v-list>
        </v-menu>
      </div>

      <v-divider class="my-3" />

      <div class="d-flex align-end justify-space-between">
        <div>
          <div class="text-caption text-medium-emphasis">Balance</div>
          <div class="text-h5 font-weight-bold">{{ formatINR(account.balance) }}</div>
        </div>

        <div v-if="account.accountType === 'fd' || account.accountType === 'rd'" class="text-right">
          <div v-if="account.interestRate" class="text-caption text-medium-emphasis">
            Interest Rate
          </div>
          <div v-if="account.interestRate" class="text-body-1 font-weight-medium text-success">
            {{ account.interestRate }}% p.a.
          </div>
          <div v-if="account.maturityDate" class="text-caption text-medium-emphasis mt-1">
            Matures: {{ new Date(account.maturityDate).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }) }}
          </div>
        </div>
      </div>

      <v-chip
        v-if="!account.isActive"
        color="warning"
        size="small"
        class="mt-3"
        prepend-icon="mdi-alert"
      >
        Inactive
      </v-chip>
    </v-card-text>
  </v-card>
</template>

<style scoped>
.bank-account-card {
  height: 100%;
  transition: all 0.2s ease;
}

.bank-account-card:hover {
  border-color: rgb(var(--v-theme-primary));
}

.primary-account {
  border-color: rgb(var(--v-theme-primary));
  border-width: 2px;
}
</style>
