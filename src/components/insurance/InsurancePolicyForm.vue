<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import {
  type InsurancePolicy,
  type CreatePolicyInput,
  type InsuranceType,
  type PaymentFrequency,
} from '@/composables/useInsurance'

const props = defineProps<{
  modelValue: boolean
  policy?: InsurancePolicy | null
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  save: [data: CreatePolicyInput]
}>()

const isOpen = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
})

const isEditing = computed(() => !!props.policy)

// Form data
const formData = ref<CreatePolicyInput>({
  type: 'life',
  provider: '',
  policyNumber: '',
  policyName: '',
  sumAssured: 0,
  premium: 0,
  paymentFrequency: 'yearly',
  startDate: new Date().toISOString().split('T')[0],
  endDate: '',
  taxBenefit: 'none',
  notes: '',
})

// Reset form when dialog opens/closes or policy changes
watch(
  () => [props.modelValue, props.policy],
  () => {
    if (props.modelValue) {
      if (props.policy) {
        formData.value = {
          type: props.policy.type,
          provider: props.policy.provider,
          policyNumber: props.policy.policyNumber,
          policyName: props.policy.policyName,
          sumAssured: props.policy.sumAssured,
          premium: props.policy.premium,
          paymentFrequency: props.policy.paymentFrequency,
          startDate: props.policy.startDate.split('T')[0],
          endDate: props.policy.endDate.split('T')[0],
          maturityDate: props.policy.maturityDate?.split('T')[0],
          coverageType: props.policy.coverageType,
          roomRent: props.policy.roomRent,
          coPayment: props.policy.coPayment,
          vehicleNumber: props.policy.vehicleNumber,
          vehicleModel: props.policy.vehicleModel,
          idvValue: props.policy.idvValue,
          propertyAddress: props.policy.propertyAddress,
          propertyValue: props.policy.propertyValue,
          taxBenefit: props.policy.taxBenefit || 'none',
          notes: props.policy.notes || '',
        }
      } else {
        // Reset to defaults
        formData.value = {
          type: 'life',
          provider: '',
          policyNumber: '',
          policyName: '',
          sumAssured: 0,
          premium: 0,
          paymentFrequency: 'yearly',
          startDate: new Date().toISOString().split('T')[0],
          endDate: '',
          taxBenefit: 'none',
          notes: '',
        }
      }
    }
  },
  { immediate: true }
)

// Insurance type options
const insuranceTypes: { title: string; value: InsuranceType; icon: string }[] = [
  { title: 'Life Insurance', value: 'life', icon: 'mdi-heart-pulse' },
  { title: 'Health Insurance', value: 'health', icon: 'mdi-hospital-box' },
  { title: 'Motor Insurance', value: 'motor', icon: 'mdi-car' },
  { title: 'Home Insurance', value: 'home', icon: 'mdi-home-outline' },
  { title: 'Travel Insurance', value: 'travel', icon: 'mdi-airplane' },
]

const paymentFrequencies: { title: string; value: PaymentFrequency }[] = [
  { title: 'Monthly', value: 'monthly' },
  { title: 'Quarterly', value: 'quarterly' },
  { title: 'Half-Yearly', value: 'half-yearly' },
  { title: 'Yearly', value: 'yearly' },
]

const coverageTypes = [
  { title: 'Individual', value: 'individual' },
  { title: 'Family', value: 'family' },
  { title: 'Family Floater', value: 'floater' },
]

const taxBenefitOptions = [
  { title: 'None', value: 'none' },
  { title: 'Section 80C', value: '80C' },
  { title: 'Section 80D', value: '80D' },
  { title: 'Both 80C & 80D', value: 'both' },
]

// Common insurance providers
const providers = [
  'LIC',
  'HDFC Life',
  'ICICI Prudential',
  'SBI Life',
  'Max Life',
  'Bajaj Allianz',
  'Tata AIA',
  'Star Health',
  'Care Health',
  'Niva Bupa',
  'New India Assurance',
  'United India',
  'ICICI Lombard',
  'Other',
]

// Form validation
const formRef = ref()
const isValid = computed(() => {
  return (
    formData.value.provider &&
    formData.value.policyNumber &&
    formData.value.policyName &&
    formData.value.sumAssured > 0 &&
    formData.value.premium > 0 &&
    formData.value.startDate &&
    formData.value.endDate
  )
})

// Submit form
const handleSubmit = () => {
  if (!isValid.value) return
  emit('save', { ...formData.value })
  isOpen.value = false
}

// Calculate end date suggestion (1 year from start)
watch(
  () => formData.value.startDate,
  (startDate) => {
    if (startDate && !formData.value.endDate) {
      const start = new Date(startDate)
      start.setFullYear(start.getFullYear() + 1)
      formData.value.endDate = start.toISOString().split('T')[0]
    }
  }
)
</script>

<template>
  <v-dialog v-model="isOpen" max-width="700" persistent scrollable>
    <v-card>
      <v-card-title class="d-flex align-center pa-4">
        <v-icon :icon="isEditing ? 'mdi-pencil' : 'mdi-plus'" class="mr-2" />
        {{ isEditing ? 'Edit Policy' : 'Add New Policy' }}
        <v-spacer />
        <v-btn icon="mdi-close" variant="text" @click="isOpen = false" />
      </v-card-title>

      <v-divider />

      <v-card-text class="pa-4">
        <v-form ref="formRef">
          <!-- Insurance Type -->
          <div class="mb-4">
            <div class="text-subtitle-2 mb-2">Policy Type</div>
            <v-btn-toggle
              v-model="formData.type"
              mandatory
              divided
              variant="outlined"
              color="primary"
              class="flex-wrap"
            >
              <v-btn
                v-for="type in insuranceTypes"
                :key="type.value"
                :value="type.value"
                size="small"
              >
                <v-icon :icon="type.icon" class="mr-1" size="small" />
                {{ type.title.replace(' Insurance', '') }}
              </v-btn>
            </v-btn-toggle>
          </div>

          <v-row>
            <!-- Provider -->
            <v-col cols="12" sm="6">
              <v-autocomplete
                v-model="formData.provider"
                :items="providers"
                label="Insurance Provider"
                prepend-inner-icon="mdi-domain"
                :rules="[(v) => !!v || 'Provider is required']"
                required
              />
            </v-col>

            <!-- Policy Number -->
            <v-col cols="12" sm="6">
              <v-text-field
                v-model="formData.policyNumber"
                label="Policy Number"
                prepend-inner-icon="mdi-identifier"
                :rules="[(v) => !!v || 'Policy number is required']"
                required
              />
            </v-col>

            <!-- Policy Name -->
            <v-col cols="12">
              <v-text-field
                v-model="formData.policyName"
                label="Policy Name"
                prepend-inner-icon="mdi-text"
                placeholder="e.g., HDFC Click 2 Protect"
                :rules="[(v) => !!v || 'Policy name is required']"
                required
              />
            </v-col>

            <!-- Sum Assured -->
            <v-col cols="12" sm="6">
              <v-text-field
                v-model.number="formData.sumAssured"
                label="Sum Assured"
                prepend-inner-icon="mdi-currency-inr"
                type="number"
                :rules="[(v) => v > 0 || 'Sum assured is required']"
                required
              >
                <template #append>
                  <v-btn-group density="compact" variant="outlined">
                    <v-btn size="x-small" @click="formData.sumAssured = 500000">5L</v-btn>
                    <v-btn size="x-small" @click="formData.sumAssured = 1000000">10L</v-btn>
                    <v-btn size="x-small" @click="formData.sumAssured = 5000000">50L</v-btn>
                    <v-btn size="x-small" @click="formData.sumAssured = 10000000">1Cr</v-btn>
                  </v-btn-group>
                </template>
              </v-text-field>
            </v-col>

            <!-- Premium -->
            <v-col cols="12" sm="6">
              <v-text-field
                v-model.number="formData.premium"
                label="Premium Amount"
                prepend-inner-icon="mdi-cash"
                type="number"
                :rules="[(v) => v > 0 || 'Premium is required']"
                required
              />
            </v-col>

            <!-- Payment Frequency -->
            <v-col cols="12" sm="6">
              <v-select
                v-model="formData.paymentFrequency"
                :items="paymentFrequencies"
                label="Payment Frequency"
                prepend-inner-icon="mdi-calendar-clock"
              />
            </v-col>

            <!-- Tax Benefit -->
            <v-col cols="12" sm="6">
              <v-select
                v-model="formData.taxBenefit"
                :items="taxBenefitOptions"
                label="Tax Benefit"
                prepend-inner-icon="mdi-percent"
              />
            </v-col>

            <!-- Start Date -->
            <v-col cols="12" sm="6">
              <v-text-field
                v-model="formData.startDate"
                label="Start Date"
                prepend-inner-icon="mdi-calendar"
                type="date"
                :rules="[(v) => !!v || 'Start date is required']"
                required
              />
            </v-col>

            <!-- End Date -->
            <v-col cols="12" sm="6">
              <v-text-field
                v-model="formData.endDate"
                label="End Date"
                prepend-inner-icon="mdi-calendar"
                type="date"
                :rules="[(v) => !!v || 'End date is required']"
                required
              />
            </v-col>

            <!-- Maturity Date (Life Insurance) -->
            <v-col v-if="formData.type === 'life'" cols="12" sm="6">
              <v-text-field
                v-model="formData.maturityDate"
                label="Maturity Date (optional)"
                prepend-inner-icon="mdi-calendar-check"
                type="date"
              />
            </v-col>
          </v-row>

          <!-- Health Insurance Specific -->
          <template v-if="formData.type === 'health'">
            <v-divider class="my-4" />
            <div class="text-subtitle-2 mb-3">Health Insurance Details</div>
            <v-row>
              <v-col cols="12" sm="6">
                <v-select
                  v-model="formData.coverageType"
                  :items="coverageTypes"
                  label="Coverage Type"
                  prepend-inner-icon="mdi-account-group"
                />
              </v-col>
              <v-col cols="12" sm="6">
                <v-text-field
                  v-model.number="formData.roomRent"
                  label="Room Rent Limit (per day)"
                  prepend-inner-icon="mdi-bed"
                  type="number"
                />
              </v-col>
              <v-col cols="12" sm="6">
                <v-text-field
                  v-model.number="formData.coPayment"
                  label="Co-payment %"
                  prepend-inner-icon="mdi-percent"
                  type="number"
                  min="0"
                  max="100"
                />
              </v-col>
            </v-row>
          </template>

          <!-- Motor Insurance Specific -->
          <template v-if="formData.type === 'motor'">
            <v-divider class="my-4" />
            <div class="text-subtitle-2 mb-3">Vehicle Details</div>
            <v-row>
              <v-col cols="12" sm="6">
                <v-text-field
                  v-model="formData.vehicleNumber"
                  label="Vehicle Number"
                  prepend-inner-icon="mdi-car"
                  placeholder="e.g., KA01AB1234"
                />
              </v-col>
              <v-col cols="12" sm="6">
                <v-text-field
                  v-model="formData.vehicleModel"
                  label="Vehicle Model"
                  prepend-inner-icon="mdi-car-info"
                />
              </v-col>
              <v-col cols="12" sm="6">
                <v-text-field
                  v-model.number="formData.idvValue"
                  label="Insured Declared Value (IDV)"
                  prepend-inner-icon="mdi-currency-inr"
                  type="number"
                />
              </v-col>
            </v-row>
          </template>

          <!-- Home Insurance Specific -->
          <template v-if="formData.type === 'home'">
            <v-divider class="my-4" />
            <div class="text-subtitle-2 mb-3">Property Details</div>
            <v-row>
              <v-col cols="12">
                <v-text-field
                  v-model="formData.propertyAddress"
                  label="Property Address"
                  prepend-inner-icon="mdi-map-marker"
                />
              </v-col>
              <v-col cols="12" sm="6">
                <v-text-field
                  v-model.number="formData.propertyValue"
                  label="Property Value"
                  prepend-inner-icon="mdi-currency-inr"
                  type="number"
                />
              </v-col>
            </v-row>
          </template>

          <!-- Notes -->
          <v-row>
            <v-col cols="12">
              <v-textarea
                v-model="formData.notes"
                label="Notes (optional)"
                prepend-inner-icon="mdi-note-text"
                rows="2"
                auto-grow
              />
            </v-col>
          </v-row>
        </v-form>
      </v-card-text>

      <v-divider />

      <v-card-actions class="pa-4">
        <v-btn variant="text" @click="isOpen = false">Cancel</v-btn>
        <v-spacer />
        <v-btn color="primary" :disabled="!isValid" @click="handleSubmit">
          {{ isEditing ? 'Update Policy' : 'Add Policy' }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
