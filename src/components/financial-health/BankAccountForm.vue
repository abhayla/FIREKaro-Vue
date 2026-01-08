<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { BankAccount, BankAccountInput } from '@/composables/useFinancialHealth'

const props = defineProps<{
  modelValue: boolean
  account?: BankAccount | null
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  save: [data: BankAccountInput]
}>()

const isOpen = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const isEditing = computed(() => !!props.account)

const formData = ref<BankAccountInput>({
  bankName: '',
  accountType: 'savings',
  accountNumber: '',
  balance: 0,
  interestRate: undefined,
  maturityDate: undefined,
  isActive: true,
  isPrimary: false
})

const accountTypes = [
  { title: 'Savings Account', value: 'savings' },
  { title: 'Current Account', value: 'current' },
  { title: 'Salary Account', value: 'salary' },
  { title: 'Fixed Deposit', value: 'fd' },
  { title: 'Recurring Deposit', value: 'rd' }
]

const popularBanks = [
  'HDFC Bank',
  'ICICI Bank',
  'State Bank of India',
  'Axis Bank',
  'Kotak Mahindra Bank',
  'Yes Bank',
  'IndusInd Bank',
  'Punjab National Bank',
  'Bank of Baroda',
  'Canara Bank'
]

const showFDFields = computed(() =>
  formData.value.accountType === 'fd' || formData.value.accountType === 'rd'
)

// Reset form when dialog opens/closes
watch(() => props.modelValue, (newVal) => {
  if (newVal) {
    if (props.account) {
      formData.value = {
        bankName: props.account.bankName,
        accountType: props.account.accountType,
        accountNumber: props.account.accountNumber,
        balance: props.account.balance,
        interestRate: props.account.interestRate,
        maturityDate: props.account.maturityDate?.split('T')[0],
        isActive: props.account.isActive,
        isPrimary: props.account.isPrimary
      }
    } else {
      formData.value = {
        bankName: '',
        accountType: 'savings',
        accountNumber: '',
        balance: 0,
        interestRate: undefined,
        maturityDate: undefined,
        isActive: true,
        isPrimary: false
      }
    }
  }
})

const formValid = computed(() => {
  return formData.value.bankName.trim() !== '' &&
    formData.value.accountNumber.trim() !== '' &&
    formData.value.balance >= 0
})

const handleSave = () => {
  if (!formValid.value) return

  const data: BankAccountInput = {
    ...formData.value,
    maturityDate: formData.value.maturityDate
      ? new Date(formData.value.maturityDate).toISOString()
      : undefined
  }

  emit('save', data)
  isOpen.value = false
}
</script>

<template>
  <v-dialog v-model="isOpen" max-width="500" persistent>
    <v-card>
      <v-card-title class="d-flex align-center justify-space-between">
        <span>{{ isEditing ? 'Edit Account' : 'Add Bank Account' }}</span>
        <v-btn icon="mdi-close" variant="text" size="small" @click="isOpen = false" />
      </v-card-title>

      <v-card-text>
        <v-form @submit.prevent="handleSave">
          <v-autocomplete
            v-model="formData.bankName"
            :items="popularBanks"
            label="Bank Name"
            variant="outlined"
            density="comfortable"
            :rules="[(v) => !!v || 'Bank name is required']"
            class="mb-3"
            clearable
          />

          <v-select
            v-model="formData.accountType"
            :items="accountTypes"
            item-title="title"
            item-value="value"
            label="Account Type"
            variant="outlined"
            density="comfortable"
            class="mb-3"
          />

          <v-text-field
            v-model="formData.accountNumber"
            label="Account Number"
            variant="outlined"
            density="comfortable"
            :rules="[(v) => !!v || 'Account number is required']"
            class="mb-3"
            hint="Last 4 digits will be shown"
          />

          <v-text-field
            v-model.number="formData.balance"
            label="Current Balance"
            type="number"
            prefix="₹"
            variant="outlined"
            density="comfortable"
            :rules="[(v) => v >= 0 || 'Balance must be positive']"
            class="mb-3"
          />

          <template v-if="showFDFields">
            <v-text-field
              v-model.number="formData.interestRate"
              label="Interest Rate"
              type="number"
              suffix="% p.a."
              variant="outlined"
              density="comfortable"
              class="mb-3"
            />

            <v-text-field
              v-model="formData.maturityDate"
              label="Maturity Date"
              type="date"
              variant="outlined"
              density="comfortable"
              class="mb-3"
            />
          </template>

          <div class="d-flex ga-4">
            <v-checkbox
              v-model="formData.isActive"
              label="Active account"
              density="comfortable"
              hide-details
            />

            <v-checkbox
              v-model="formData.isPrimary"
              label="Primary account"
              density="comfortable"
              hide-details
            />
          </div>
        </v-form>
      </v-card-text>

      <v-card-actions class="pa-4">
        <v-spacer />
        <v-btn variant="text" @click="isOpen = false">Cancel</v-btn>
        <v-btn
          color="primary"
          variant="flat"
          :disabled="!formValid"
          @click="handleSave"
        >
          {{ isEditing ? 'Save Changes' : 'Add Account' }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
