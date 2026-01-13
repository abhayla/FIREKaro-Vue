<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useForm } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import * as z from 'zod'
import {
  type Loan,
  type LoanType,
  LOAN_TYPES,
  calculateEMI,
  calculateTotalInterest,
  formatINR
} from '@/composables/useLiabilities'

const props = defineProps<{
  modelValue: boolean
  loan?: Loan | null
  isEditing?: boolean
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'save', loan: Partial<Loan>): void
  (e: 'close'): void
}>()

const dialog = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

// Form validation schema - matches backend
const loanSchema = toTypedSchema(
  z.object({
    loanName: z.string().min(1, 'Loan name is required'),
    loanType: z.enum([
      'HOME_LOAN', 'PERSONAL_LOAN', 'CAR_LOAN', 'EDUCATION_LOAN',
      'BUSINESS_LOAN', 'GOLD_LOAN', 'LOAN_AGAINST_PROPERTY',
      'LOAN_AGAINST_SECURITIES', 'OTHER'
    ] as const),
    lender: z.string().min(1, 'Lender name is required'),
    loanAccountNumber: z.string().optional(),
    principalAmount: z.number().min(1, 'Principal amount is required'),
    outstandingAmount: z.number().min(0, 'Outstanding amount is required'),
    interestRate: z.number().min(0.1, 'Interest rate is required').max(50, 'Rate too high'),
    tenure: z.number().min(1, 'Tenure is required').max(360, 'Max 30 years'),
    remainingTenure: z.number().min(0),
    loanStartDate: z.string().min(1, 'Start date is required'),
    emiStartDate: z.string().min(1, 'EMI start date is required'),
    maturityDate: z.string().min(1, 'Maturity date is required'),
    nextEmiDate: z.string().optional(),
    taxBenefitSection: z.string().optional(),
    maxTaxBenefit: z.number().optional(),
    purpose: z.string().optional(),
    notes: z.string().optional()
  })
)

const { handleSubmit, resetForm, values, setValues, defineField } = useForm({
  validationSchema: loanSchema,
  initialValues: {
    loanName: '',
    loanType: 'HOME_LOAN' as LoanType,
    lender: '',
    loanAccountNumber: '',
    principalAmount: 0,
    outstandingAmount: 0,
    interestRate: 8.5,
    tenure: 240,
    remainingTenure: 240,
    loanStartDate: new Date().toISOString().split('T')[0],
    emiStartDate: new Date().toISOString().split('T')[0],
    maturityDate: '',
    nextEmiDate: '',
    taxBenefitSection: '',
    maxTaxBenefit: 0,
    purpose: '',
    notes: ''
  }
})

// Define writable fields using defineField
const [loanName] = defineField('loanName')
const [loanType] = defineField('loanType')
const [lender] = defineField('lender')
const [loanAccountNumber] = defineField('loanAccountNumber')
const [principalAmount] = defineField('principalAmount')
const [outstandingAmount] = defineField('outstandingAmount')
const [interestRate] = defineField('interestRate')
const [tenure] = defineField('tenure')
const [remainingTenure] = defineField('remainingTenure')
const [loanStartDate] = defineField('loanStartDate')
const [emiStartDate] = defineField('emiStartDate')
const [maturityDate] = defineField('maturityDate')
const [nextEmiDate] = defineField('nextEmiDate')
const [taxBenefitSection] = defineField('taxBenefitSection')
const [maxTaxBenefit] = defineField('maxTaxBenefit')
const [purpose] = defineField('purpose')
const [notes] = defineField('notes')

// Watch for loan prop changes
watch(
  () => props.loan,
  (newLoan) => {
    if (newLoan) {
      setValues({
        loanName: newLoan.loanName,
        loanType: newLoan.loanType,
        lender: newLoan.lender,
        loanAccountNumber: newLoan.loanAccountNumber || '',
        principalAmount: newLoan.principalAmount,
        outstandingAmount: newLoan.outstandingAmount,
        interestRate: newLoan.interestRate,
        tenure: newLoan.tenure,
        remainingTenure: newLoan.remainingTenure,
        loanStartDate: newLoan.loanStartDate,
        emiStartDate: newLoan.emiStartDate,
        maturityDate: newLoan.maturityDate,
        nextEmiDate: newLoan.nextEmiDate || '',
        taxBenefitSection: newLoan.taxBenefitSection || '',
        maxTaxBenefit: newLoan.maxTaxBenefit || 0,
        purpose: newLoan.purpose || '',
        notes: newLoan.notes || ''
      })
    } else {
      resetForm()
    }
  },
  { immediate: true }
)

// Auto-calculate maturity date
watch(
  [loanStartDate, tenure],
  ([startDate, tenureVal]) => {
    if (startDate && tenureVal) {
      const start = new Date(startDate)
      start.setMonth(start.getMonth() + tenureVal)
      maturityDate.value = start.toISOString().split('T')[0]
    }
  }
)

// Auto-set outstanding = principal for new loans
watch(
  principalAmount,
  (principal) => {
    if (!props.isEditing && principal && principal > 0) {
      outstandingAmount.value = principal
      remainingTenure.value = tenure.value
    }
  }
)

// Auto-set remaining tenure for new loans
watch(
  tenure,
  (tenureVal) => {
    if (!props.isEditing && tenureVal && tenureVal > 0) {
      remainingTenure.value = tenureVal
    }
  }
)

// Calculated EMI
const calculatedEmi = computed(() => {
  if (principalAmount.value && interestRate.value && tenure.value) {
    return calculateEMI(principalAmount.value, interestRate.value, tenure.value)
  }
  return 0
})

// Total interest
const totalInterest = computed(() => {
  if (calculatedEmi.value && tenure.value) {
    return calculateTotalInterest(principalAmount.value || 0, calculatedEmi.value, tenure.value)
  }
  return 0
})

// Total payable
const totalPayable = computed(() => {
  return (principalAmount.value || 0) + totalInterest.value
})

// Tax benefit suggestions based on loan type
const suggestedTaxBenefit = computed(() => {
  switch (loanType.value) {
    case 'HOME_LOAN':
      return { section: '80C + 24(b)', maxBenefit: 350000 }
    case 'EDUCATION_LOAN':
      return { section: '80E', maxBenefit: 0 } // No limit
    default:
      return null
  }
})

const onSubmit = handleSubmit((formValues) => {
  const loanData: Partial<Loan> = {
    loanName: formValues.loanName,
    loanType: formValues.loanType,
    lender: formValues.lender,
    loanAccountNumber: formValues.loanAccountNumber || null,
    principalAmount: formValues.principalAmount,
    outstandingAmount: formValues.outstandingAmount,
    interestRate: formValues.interestRate,
    emiAmount: Math.round(calculatedEmi.value),
    tenure: formValues.tenure,
    remainingTenure: formValues.remainingTenure,
    loanStartDate: formValues.loanStartDate,
    emiStartDate: formValues.emiStartDate,
    maturityDate: formValues.maturityDate,
    nextEmiDate: formValues.nextEmiDate || null,
    status: 'ACTIVE',
    taxBenefitSection: formValues.taxBenefitSection || null,
    maxTaxBenefit: formValues.maxTaxBenefit || null,
    purpose: formValues.purpose || null,
    notes: formValues.notes || null
  }

  if (props.isEditing && props.loan) {
    loanData.id = props.loan.id
  }

  emit('save', loanData)
  dialog.value = false
})

const handleClose = () => {
  resetForm()
  emit('close')
  dialog.value = false
}
</script>

<template>
  <v-dialog v-model="dialog" max-width="800" persistent>
    <v-card>
      <v-card-title class="d-flex align-center">
        <v-icon icon="mdi-bank" class="mr-2" />
        {{ isEditing ? 'Edit Loan' : 'Add Loan' }}
      </v-card-title>

      <v-form @submit.prevent="onSubmit">
        <v-card-text>
          <v-row>
            <!-- Loan Name -->
            <v-col cols="12" md="6">
              <v-text-field
                v-model="loanName"
                label="Loan Name"
                variant="outlined"
                density="comfortable"
                prepend-inner-icon="mdi-tag"
                placeholder="e.g., Home Loan - Main House"
                :rules="[(v: string) => !!v || 'Loan name is required']"
              />
            </v-col>

            <!-- Loan Type -->
            <v-col cols="12" md="6">
              <v-select
                v-model="loanType"
                :items="LOAN_TYPES"
                item-title="label"
                item-value="value"
                label="Loan Type"
                variant="outlined"
                density="comfortable"
                prepend-inner-icon="mdi-format-list-bulleted-type"
              />
            </v-col>

            <!-- Lender Name -->
            <v-col cols="12" md="6">
              <v-text-field
                v-model="lender"
                label="Lender / Bank Name"
                variant="outlined"
                density="comfortable"
                prepend-inner-icon="mdi-bank"
                placeholder="e.g., HDFC Bank"
                :rules="[(v: string) => !!v || 'Lender name is required']"
              />
            </v-col>

            <!-- Account Number -->
            <v-col cols="12" md="6">
              <v-text-field
                v-model="loanAccountNumber"
                label="Loan Account Number (Optional)"
                variant="outlined"
                density="comfortable"
                prepend-inner-icon="mdi-identifier"
              />
            </v-col>

            <!-- Principal Amount -->
            <v-col cols="12" md="6">
              <v-text-field
                v-model.number="principalAmount"
                label="Principal Amount"
                type="number"
                prefix="₹"
                variant="outlined"
                density="comfortable"
                prepend-inner-icon="mdi-cash"
                :rules="[(v: number) => v > 0 || 'Principal amount is required']"
              />
            </v-col>

            <!-- Outstanding Amount -->
            <v-col cols="12" md="6">
              <v-text-field
                v-model.number="outstandingAmount"
                label="Outstanding Amount"
                type="number"
                prefix="₹"
                variant="outlined"
                density="comfortable"
                prepend-inner-icon="mdi-cash-minus"
                :rules="[(v: number) => v >= 0 || 'Outstanding amount cannot be negative']"
              />
            </v-col>

            <!-- Interest Rate -->
            <v-col cols="12" md="4">
              <v-text-field
                v-model.number="interestRate"
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
            <v-col cols="12" md="4">
              <v-text-field
                v-model.number="tenure"
                label="Total Tenure (Months)"
                type="number"
                variant="outlined"
                density="comfortable"
                prepend-inner-icon="mdi-calendar-range"
                :hint="`${Math.floor((tenure || 0) / 12)} years ${(tenure || 0) % 12} months`"
                persistent-hint
              />
            </v-col>

            <!-- Remaining Tenure -->
            <v-col cols="12" md="4">
              <v-text-field
                v-model.number="remainingTenure"
                label="Remaining Tenure (Months)"
                type="number"
                variant="outlined"
                density="comfortable"
                prepend-inner-icon="mdi-calendar-clock"
              />
            </v-col>

            <!-- Start Date -->
            <v-col cols="12" md="4">
              <v-text-field
                v-model="loanStartDate"
                label="Loan Start Date"
                type="date"
                variant="outlined"
                density="comfortable"
                prepend-inner-icon="mdi-calendar-start"
              />
            </v-col>

            <!-- EMI Start Date -->
            <v-col cols="12" md="4">
              <v-text-field
                v-model="emiStartDate"
                label="EMI Start Date"
                type="date"
                variant="outlined"
                density="comfortable"
                prepend-inner-icon="mdi-calendar-month"
              />
            </v-col>

            <!-- Next EMI Date -->
            <v-col cols="12" md="4">
              <v-text-field
                v-model="nextEmiDate"
                label="Next EMI Date"
                type="date"
                variant="outlined"
                density="comfortable"
                prepend-inner-icon="mdi-calendar-alert"
              />
            </v-col>

            <!-- Purpose -->
            <v-col cols="12" md="6">
              <v-text-field
                v-model="purpose"
                label="Purpose (Optional)"
                variant="outlined"
                density="comfortable"
                prepend-inner-icon="mdi-target"
                placeholder="e.g., Purchase of flat in Mumbai"
              />
            </v-col>

            <!-- Tax Benefit Section -->
            <v-col cols="12" md="3">
              <v-text-field
                v-model="taxBenefitSection"
                label="Tax Section"
                variant="outlined"
                density="comfortable"
                prepend-inner-icon="mdi-file-document"
                placeholder="e.g., 80C, 24(b)"
              />
            </v-col>

            <!-- Max Tax Benefit -->
            <v-col cols="12" md="3">
              <v-text-field
                v-model.number="maxTaxBenefit"
                label="Max Tax Benefit"
                type="number"
                prefix="₹"
                variant="outlined"
                density="comfortable"
                prepend-inner-icon="mdi-cash-check"
              />
            </v-col>

            <!-- Notes -->
            <v-col cols="12">
              <v-textarea
                v-model="notes"
                label="Notes (Optional)"
                variant="outlined"
                density="comfortable"
                rows="2"
                prepend-inner-icon="mdi-note-text"
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
                  <div class="text-caption text-medium-emphasis">Maturity Date</div>
                  <div class="text-h6">{{ maturityDate ? new Date(maturityDate).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }) : '-' }}</div>
                </v-col>
              </v-row>
            </v-card-text>
          </v-card>

          <!-- Tax Benefits Info -->
          <v-alert
            v-if="suggestedTaxBenefit"
            type="info"
            variant="tonal"
            density="compact"
            class="mt-4"
          >
            <template v-if="loanType === 'HOME_LOAN'">
              <strong>Tax Benefits:</strong> Claim interest up to Rs. 2L under Section 24(b) and principal up to Rs. 1.5L under Section 80C.
            </template>
            <template v-else-if="loanType === 'EDUCATION_LOAN'">
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
