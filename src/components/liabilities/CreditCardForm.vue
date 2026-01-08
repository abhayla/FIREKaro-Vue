<script setup lang="ts">
import { computed, watch } from 'vue'
import { useForm } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import * as z from 'zod'
import { type CreditCard, formatINR, calculateCreditUtilization } from '@/composables/useLiabilities'

const props = defineProps<{
  modelValue: boolean
  card?: CreditCard | null
  isEditing?: boolean
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'save', card: Partial<CreditCard>): void
}>()

const dialog = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const cardTypes: { title: string; value: CreditCard['cardType'] }[] = [
  { title: 'Visa', value: 'VISA' },
  { title: 'Mastercard', value: 'MASTERCARD' },
  { title: 'RuPay', value: 'RUPAY' },
  { title: 'American Express', value: 'AMEX' }
]

// Form validation schema
const cardSchema = toTypedSchema(
  z.object({
    cardName: z.string().min(1, 'Card name is required'),
    bankName: z.string().min(1, 'Bank name is required'),
    cardNumber: z.string().min(4, 'Enter last 4 digits'),
    cardType: z.enum(['VISA', 'MASTERCARD', 'RUPAY', 'AMEX']),
    creditLimit: z.number().min(1, 'Credit limit is required'),
    currentOutstanding: z.number().min(0),
    billingCycleDate: z.number().min(1).max(31),
    paymentDueDate: z.number().min(1).max(31),
    interestRateAPR: z.number().min(0).max(100),
    annualFee: z.number().min(0),
    cardExpiryDate: z.string().optional()
  })
)

const { handleSubmit, resetForm, values, setValues } = useForm({
  validationSchema: cardSchema,
  initialValues: {
    cardName: '',
    bankName: '',
    cardNumber: '',
    cardType: 'VISA' as CreditCard['cardType'],
    creditLimit: 100000,
    currentOutstanding: 0,
    billingCycleDate: 15,
    paymentDueDate: 5,
    interestRateAPR: 42,
    annualFee: 0,
    cardExpiryDate: ''
  }
})

// Watch for card prop changes
watch(
  () => props.card,
  (newCard) => {
    if (newCard) {
      setValues({
        cardName: newCard.cardName,
        bankName: newCard.bankName,
        cardNumber: newCard.cardNumber.slice(-4),
        cardType: newCard.cardType,
        creditLimit: newCard.creditLimit,
        currentOutstanding: newCard.currentOutstanding,
        billingCycleDate: newCard.billingCycleDate,
        paymentDueDate: newCard.paymentDueDate,
        interestRateAPR: newCard.interestRateAPR,
        annualFee: newCard.annualFee,
        cardExpiryDate: newCard.cardExpiryDate || ''
      })
    } else {
      resetForm()
    }
  },
  { immediate: true }
)

// Calculate utilization
const utilization = computed(() => {
  return calculateCreditUtilization(values.currentOutstanding || 0, values.creditLimit || 1)
})

// Available limit
const availableLimit = computed(() => {
  return Math.max(0, (values.creditLimit || 0) - (values.currentOutstanding || 0))
})

const onSubmit = handleSubmit((formValues) => {
  const cardData: Partial<CreditCard> = {
    ...formValues,
    cardNumber: `****${formValues.cardNumber.slice(-4)}`,
    availableLimit: availableLimit.value,
    utilizationPercent: utilization.value,
    minimumDue: Math.max(200, Math.round((formValues.currentOutstanding || 0) * 0.05)),
    rewardPointsBalance: props.isEditing ? props.card?.rewardPointsBalance : 0,
    isActive: true,
    nextDueDate: getNextDueDate(formValues.paymentDueDate)
  }

  if (props.isEditing && props.card) {
    cardData.id = props.card.id
  }

  emit('save', cardData)
  dialog.value = false
})

function getNextDueDate(dueDay: number): string {
  const today = new Date()
  let nextDue = new Date(today.getFullYear(), today.getMonth(), dueDay)
  if (nextDue <= today) {
    nextDue.setMonth(nextDue.getMonth() + 1)
  }
  return nextDue.toISOString().split('T')[0]
}

const handleClose = () => {
  resetForm()
  dialog.value = false
}
</script>

<template>
  <v-dialog v-model="dialog" max-width="600" persistent>
    <v-card>
      <v-card-title class="d-flex align-center">
        <v-icon icon="mdi-credit-card-plus" class="mr-2" />
        {{ isEditing ? 'Edit Credit Card' : 'Add Credit Card' }}
      </v-card-title>

      <v-form @submit.prevent="onSubmit">
        <v-card-text>
          <v-row>
            <!-- Card Name -->
            <v-col cols="12" md="6">
              <v-text-field
                v-model="values.cardName"
                label="Card Name"
                variant="outlined"
                density="comfortable"
                placeholder="e.g., HDFC Regalia"
                prepend-inner-icon="mdi-card-text"
              />
            </v-col>

            <!-- Bank Name -->
            <v-col cols="12" md="6">
              <v-text-field
                v-model="values.bankName"
                label="Bank Name"
                variant="outlined"
                density="comfortable"
                placeholder="e.g., HDFC Bank"
                prepend-inner-icon="mdi-bank"
              />
            </v-col>

            <!-- Card Type -->
            <v-col cols="12" md="6">
              <v-select
                v-model="values.cardType"
                :items="cardTypes"
                label="Card Network"
                variant="outlined"
                density="comfortable"
                prepend-inner-icon="mdi-credit-card"
              />
            </v-col>

            <!-- Card Number (Last 4) -->
            <v-col cols="12" md="6">
              <v-text-field
                v-model="values.cardNumber"
                label="Last 4 Digits"
                variant="outlined"
                density="comfortable"
                maxlength="4"
                prepend-inner-icon="mdi-dialpad"
                placeholder="1234"
              />
            </v-col>

            <!-- Credit Limit -->
            <v-col cols="12" md="6">
              <v-text-field
                v-model.number="values.creditLimit"
                label="Credit Limit"
                type="number"
                prefix="₹"
                variant="outlined"
                density="comfortable"
                prepend-inner-icon="mdi-cash-100"
              />
            </v-col>

            <!-- Current Outstanding -->
            <v-col cols="12" md="6">
              <v-text-field
                v-model.number="values.currentOutstanding"
                label="Current Outstanding"
                type="number"
                prefix="₹"
                variant="outlined"
                density="comfortable"
                prepend-inner-icon="mdi-cash-minus"
              />
            </v-col>

            <!-- Billing Cycle Date -->
            <v-col cols="12" md="6">
              <v-text-field
                v-model.number="values.billingCycleDate"
                label="Statement Date (Day)"
                type="number"
                min="1"
                max="31"
                variant="outlined"
                density="comfortable"
                prepend-inner-icon="mdi-calendar-month"
                hint="Day of month when statement generates"
                persistent-hint
              />
            </v-col>

            <!-- Payment Due Date -->
            <v-col cols="12" md="6">
              <v-text-field
                v-model.number="values.paymentDueDate"
                label="Payment Due Date (Day)"
                type="number"
                min="1"
                max="31"
                variant="outlined"
                density="comfortable"
                prepend-inner-icon="mdi-calendar-alert"
                hint="Day of month when payment is due"
                persistent-hint
              />
            </v-col>

            <!-- Interest Rate APR -->
            <v-col cols="12" md="6">
              <v-text-field
                v-model.number="values.interestRateAPR"
                label="Interest Rate (APR %)"
                type="number"
                suffix="%"
                variant="outlined"
                density="comfortable"
                prepend-inner-icon="mdi-percent"
              />
            </v-col>

            <!-- Annual Fee -->
            <v-col cols="12" md="6">
              <v-text-field
                v-model.number="values.annualFee"
                label="Annual Fee"
                type="number"
                prefix="₹"
                variant="outlined"
                density="comfortable"
                prepend-inner-icon="mdi-currency-inr"
              />
            </v-col>

            <!-- Card Expiry -->
            <v-col cols="12">
              <v-text-field
                v-model="values.cardExpiryDate"
                label="Card Expiry Date (Optional)"
                type="month"
                variant="outlined"
                density="comfortable"
                prepend-inner-icon="mdi-calendar-clock"
              />
            </v-col>
          </v-row>

          <!-- Utilization Preview -->
          <v-card variant="tonal" :color="utilization > 70 ? 'error' : utilization > 30 ? 'warning' : 'success'" class="mt-4">
            <v-card-text>
              <div class="d-flex justify-space-between align-center mb-2">
                <span class="text-subtitle-2 font-weight-bold">Credit Utilization</span>
                <span class="text-h6 font-weight-bold">{{ utilization }}%</span>
              </div>
              <v-progress-linear
                :model-value="utilization"
                :color="utilization > 70 ? 'error' : utilization > 30 ? 'warning' : 'success'"
                height="8"
                rounded
              />
              <div class="d-flex justify-space-between text-caption mt-2">
                <span>Available: {{ formatINR(availableLimit) }}</span>
                <span>Limit: {{ formatINR(values.creditLimit || 0) }}</span>
              </div>
            </v-card-text>
          </v-card>

          <v-alert
            v-if="utilization > 30"
            :type="utilization > 70 ? 'error' : 'warning'"
            variant="tonal"
            density="compact"
            class="mt-4"
          >
            <template v-if="utilization > 70">
              High utilization (>70%) can negatively impact your credit score. Consider paying down the balance.
            </template>
            <template v-else>
              Keep utilization below 30% for optimal credit score impact.
            </template>
          </v-alert>
        </v-card-text>

        <v-card-actions class="pa-4">
          <v-spacer />
          <v-btn variant="text" @click="handleClose">Cancel</v-btn>
          <v-btn color="primary" variant="flat" type="submit">
            {{ isEditing ? 'Update Card' : 'Add Card' }}
          </v-btn>
        </v-card-actions>
      </v-form>
    </v-card>
  </v-dialog>
</template>
