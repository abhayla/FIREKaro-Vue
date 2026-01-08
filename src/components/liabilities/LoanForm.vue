<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useForm } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import * as z from 'zod'
import {
  type Loan,
  calculateEMI,
  calculateTotalInterest,
  formatINR,
  getLoanTypeLabel
} from '@/composables/useLiabilities'

const props = defineProps<{
  modelValue: boolean
  loan?: Loan | null
  isEditing?: boolean
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'save', loan: Partial<Loan>): void
}>()

const dialog = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const loanTypes: { title: string; value: Loan['loanType'] }[] = [
  { title: 'Home Loan', value: 'home' },
  { title: 'Car Loan', value: 'car' },
  { title: 'Personal Loan', value: 'personal' },
  { title: 'Education Loan', value: 'education' },
  { title: 'Gold Loan', value: 'gold' },
  { title: 'Other', value: 'other' }
]

// Form validation schema
const loanSchema = toTypedSchema(
  z.object({
    loanType: z.enum(['home', 'car', 'personal', 'education', 'gold', 'other']),
    lenderName: z.string().min(1, 'Lender name is required'),
    accountNumber: z.string().optional(),
    principalAmount: z.number().min(1, 'Principal amount is required'),
    interestRate: z.number().min(0.1, 'Interest rate is required').max(50, 'Rate too high'),
    tenure: z.number().min(1, 'Tenure is required').max(360, 'Max 30 years'),
    startDate: z.string().min(1, 'Start date is required'),
    emiDate: z.number().min(1).max(31)
  })
)

const { handleSubmit, resetForm, values, setValues } = useForm({
  validationSchema: loanSchema,
  initialValues: {
    loanType: 'home' as Loan['loanType'],
    lenderName: '',
    accountNumber: '',
    principalAmount: 0,
    interestRate: 8.5,
    tenure: 240,
    startDate: new Date().toISOString().split('T')[0],
    emiDate: 5
  }
})

// Watch for loan prop changes
watch(
  () => props.loan,
  (newLoan) => {
    if (newLoan) {
      setValues({
        loanType: newLoan.loanType,
        lenderName: newLoan.lenderName,
        accountNumber: newLoan.accountNumber || '',
        principalAmount: newLoan.principalAmount,
        interestRate: newLoan.interestRate,
        tenure: newLoan.tenure,
        startDate: newLoan.startDate,
        emiDate: newLoan.emiDate
      })
    } else {
      resetForm()
    }
  },
  { immediate: true }
)

// Calculated EMI
const calculatedEmi = computed(() => {
  if (values.principalAmount && values.interestRate && values.tenure) {
    return calculateEMI(values.principalAmount, values.interestRate, values.tenure)
  }
  return 0
})

// Total interest
const totalInterest = computed(() => {
  if (calculatedEmi.value && values.tenure) {
    return calculateTotalInterest(values.principalAmount || 0, calculatedEmi.value, values.tenure)
  }
  return 0
})

// Total payable
const totalPayable = computed(() => {
  return (values.principalAmount || 0) + totalInterest.value
})

// Calculate end date
const endDate = computed(() => {
  if (values.startDate && values.tenure) {
    const start = new Date(values.startDate)
    start.setMonth(start.getMonth() + values.tenure)
    return start.toISOString().split('T')[0]
  }
  return ''
})

const onSubmit = handleSubmit((formValues) => {
  const loanData: Partial<Loan> = {
    ...formValues,
    emiAmount: Math.round(calculatedEmi.value),
    endDate: endDate.value,
    outstandingPrincipal: props.isEditing ? props.loan?.outstandingPrincipal : formValues.principalAmount,
    totalInterestPaid: props.isEditing ? props.loan?.totalInterestPaid : 0,
    totalPrincipalPaid: props.isEditing ? props.loan?.totalPrincipalPaid : 0,
    prepaymentsMade: props.isEditing ? props.loan?.prepaymentsMade : 0,
    isActive: true
  }

  if (props.isEditing && props.loan) {
    loanData.id = props.loan.id
  }

  emit('save', loanData)
  dialog.value = false
})

const handleClose = () => {
  resetForm()
  dialog.value = false
}
</script>

<template>
  <v-dialog v-model="dialog" max-width="700" persistent>
    <v-card>
      <v-card-title class="d-flex align-center">
        <v-icon icon="mdi-bank" class="mr-2" />
        {{ isEditing ? 'Edit Loan' : 'Add Loan' }}
      </v-card-title>

      <v-form @submit.prevent="onSubmit">
        <v-card-text>
          <v-row>
            <!-- Loan Type -->
            <v-col cols="12" md="6">
              <v-select
                v-model="values.loanType"
                :items="loanTypes"
                label="Loan Type"
                variant="outlined"
                density="comfortable"
                prepend-inner-icon="mdi-format-list-bulleted-type"
              />
            </v-col>

            <!-- Lender Name -->
            <v-col cols="12" md="6">
              <v-text-field
                v-model="values.lenderName"
                label="Lender / Bank Name"
                variant="outlined"
                density="comfortable"
                prepend-inner-icon="mdi-bank"
                placeholder="e.g., HDFC Bank"
              />
            </v-col>

            <!-- Account Number -->
            <v-col cols="12" md="6">
              <v-text-field
                v-model="values.accountNumber"
                label="Loan Account Number (Optional)"
                variant="outlined"
                density="comfortable"
                prepend-inner-icon="mdi-identifier"
              />
            </v-col>

            <!-- EMI Date -->
            <v-col cols="12" md="6">
              <v-text-field
                v-model.number="values.emiDate"
                label="EMI Due Date (Day of Month)"
                type="number"
                min="1"
                max="31"
                variant="outlined"
                density="comfortable"
                prepend-inner-icon="mdi-calendar"
              />
            </v-col>

            <!-- Principal Amount -->
            <v-col cols="12" md="6">
              <v-text-field
                v-model.number="values.principalAmount"
                label="Principal Amount"
                type="number"
                prefix="₹"
                variant="outlined"
                density="comfortable"
                prepend-inner-icon="mdi-cash"
              />
            </v-col>

            <!-- Interest Rate -->
            <v-col cols="12" md="6">
              <v-text-field
                v-model.number="values.interestRate"
                label="Interest Rate (% p.a.)"
                type="number"
                step="0.1"
                suffix="%"
                variant="outlined"
                density="comfortable"
                prepend-inner-icon="mdi-percent"
              />
            </v-col>

            <!-- Tenure -->
            <v-col cols="12" md="6">
              <v-text-field
                v-model.number="values.tenure"
                label="Tenure (Months)"
                type="number"
                variant="outlined"
                density="comfortable"
                prepend-inner-icon="mdi-calendar-range"
                :hint="`${Math.floor((values.tenure || 0) / 12)} years ${(values.tenure || 0) % 12} months`"
                persistent-hint
              />
            </v-col>

            <!-- Start Date -->
            <v-col cols="12" md="6">
              <v-text-field
                v-model="values.startDate"
                label="Loan Start Date"
                type="date"
                variant="outlined"
                density="comfortable"
                prepend-inner-icon="mdi-calendar-start"
              />
            </v-col>
          </v-row>

          <!-- EMI Calculator Preview -->
          <v-card variant="tonal" color="primary" class="mt-4">
            <v-card-text>
              <div class="text-subtitle-2 font-weight-bold mb-2">
                <v-icon icon="mdi-calculator" size="small" class="mr-1" />
                EMI Calculation
              </div>
              <v-row dense>
                <v-col cols="6" sm="3">
                  <div class="text-caption text-medium-emphasis">Monthly EMI</div>
                  <div class="text-h6 font-weight-bold">{{ formatINR(calculatedEmi) }}</div>
                </v-col>
                <v-col cols="6" sm="3">
                  <div class="text-caption text-medium-emphasis">Total Interest</div>
                  <div class="text-h6">{{ formatINR(totalInterest) }}</div>
                </v-col>
                <v-col cols="6" sm="3">
                  <div class="text-caption text-medium-emphasis">Total Payable</div>
                  <div class="text-h6">{{ formatINR(totalPayable) }}</div>
                </v-col>
                <v-col cols="6" sm="3">
                  <div class="text-caption text-medium-emphasis">End Date</div>
                  <div class="text-h6">{{ endDate ? new Date(endDate).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }) : '-' }}</div>
                </v-col>
              </v-row>
            </v-card-text>
          </v-card>

          <!-- Tax Benefits Info -->
          <v-alert
            v-if="values.loanType === 'home' || values.loanType === 'education'"
            type="info"
            variant="tonal"
            density="compact"
            class="mt-4"
          >
            <template v-if="values.loanType === 'home'">
              <strong>Tax Benefits:</strong> Claim interest up to ₹2L under Section 24(b) and principal up to ₹1.5L under Section 80C.
            </template>
            <template v-else-if="values.loanType === 'education'">
              <strong>Tax Benefits:</strong> Entire interest paid is deductible under Section 80E for 8 years.
            </template>
          </v-alert>
        </v-card-text>

        <v-card-actions class="pa-4">
          <v-spacer />
          <v-btn variant="text" @click="handleClose">Cancel</v-btn>
          <v-btn color="primary" variant="flat" type="submit">
            {{ isEditing ? 'Update Loan' : 'Add Loan' }}
          </v-btn>
        </v-card-actions>
      </v-form>
    </v-card>
  </v-dialog>
</template>
