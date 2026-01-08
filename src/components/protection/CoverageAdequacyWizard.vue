<script setup lang="ts">
import { ref, computed, reactive } from 'vue'
import {
  type HLVCalculatorInput,
  type CoverageAnalysis,
  calculateHLV,
  formatINR,
  formatINRCompact,
} from '@/composables/useProtection'

const props = defineProps<{
  modelValue: boolean
  existingLifeCover?: number
  existingHealthCover?: number
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  calculated: [analysis: CoverageAnalysis]
}>()

const isOpen = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
})

// Wizard state
const step = ref(1)
const totalSteps = 4
const isCalculating = ref(false)
const result = ref<CoverageAnalysis | null>(null)

// Form data with reactive
const formData = reactive<HLVCalculatorInput>({
  annualIncome: 0,
  age: 30,
  retirementAge: 60,
  city: 'metro',
  spouse: undefined,
  children: [],
  dependentParents: [],
  homeLoan: 0,
  carLoan: 0,
  otherLoans: 0,
  creditCardDebt: 0,
  childEducation: 2500000, // 25L default per child
  childMarriage: 1000000, // 10L default per child
  spouseSecurityYears: 10,
  existingLifeCover: props.existingLifeCover || 0,
  existingHealthCover: props.existingHealthCover || 0,
  employerCover: 0,
})

// Spouse toggle
const hasSpouse = ref(false)
const spouseAge = ref(30)

// Children management
const addChild = () => {
  if (!formData.children) formData.children = []
  formData.children.push({ age: 5 })
}
const removeChild = (index: number) => {
  formData.children?.splice(index, 1)
}

// Parents management
const hasDependentParents = ref(false)
const parentAges = ref([{ age: 60 }])
const addParent = () => {
  parentAges.value.push({ age: 60 })
}
const removeParent = (index: number) => {
  parentAges.value.splice(index, 1)
}

// City options
const cityOptions = [
  { title: 'Metro (Delhi, Mumbai, Bangalore, etc.)', value: 'metro' },
  { title: 'Tier 1 (Pune, Hyderabad, Chennai, etc.)', value: 'tier1' },
  { title: 'Tier 2 & Others', value: 'tier2' },
]

// Validation per step
const isStepValid = computed(() => {
  switch (step.value) {
    case 1:
      return formData.annualIncome > 0 && formData.age > 0 && formData.retirementAge > formData.age
    case 2:
      return true // All fields optional
    case 3:
      return true // All fields optional
    case 4:
      return true
    default:
      return false
  }
})

// Navigation
const nextStep = () => {
  if (step.value < totalSteps) {
    if (step.value === 3) {
      calculateCoverage()
    }
    step.value++
  }
}

const prevStep = () => {
  if (step.value > 1) {
    step.value--
    if (step.value < 4) {
      result.value = null
    }
  }
}

// Calculate coverage
const calculateCoverage = () => {
  isCalculating.value = true

  // Update form data with family members
  if (hasSpouse.value) {
    formData.spouse = { age: spouseAge.value }
  } else {
    formData.spouse = undefined
  }

  if (hasDependentParents.value) {
    formData.dependentParents = parentAges.value
  } else {
    formData.dependentParents = []
  }

  // Calculate using HLV method
  setTimeout(() => {
    result.value = calculateHLV(formData)
    isCalculating.value = false
    emit('calculated', result.value)
  }, 500) // Simulate calculation time
}

// Reset wizard
const resetWizard = () => {
  step.value = 1
  result.value = null
  formData.annualIncome = 0
  formData.age = 30
  formData.retirementAge = 60
  formData.city = 'metro'
  formData.children = []
  formData.homeLoan = 0
  formData.carLoan = 0
  formData.otherLoans = 0
  formData.creditCardDebt = 0
  hasSpouse.value = false
  hasDependentParents.value = false
  parentAges.value = [{ age: 60 }]
}

// Close wizard
const closeWizard = () => {
  isOpen.value = false
  resetWizard()
}

// Progress color helper
const getProgressColor = (percentage: number) => {
  if (percentage >= 70) return 'success'
  if (percentage >= 40) return 'warning'
  return 'error'
}
</script>

<template>
  <v-dialog v-model="isOpen" max-width="800" persistent scrollable>
    <v-card>
      <v-card-title class="d-flex align-center pa-4">
        <v-icon icon="mdi-calculator-variant" class="mr-2" />
        Coverage Adequacy Calculator
        <v-spacer />
        <v-btn icon="mdi-close" variant="text" @click="closeWizard" />
      </v-card-title>

      <v-divider />

      <!-- Progress Steps -->
      <v-stepper v-model="step" flat alt-labels>
        <v-stepper-header>
          <v-stepper-item :value="1" title="Your Profile" subtitle="Income & Family" />
          <v-divider />
          <v-stepper-item :value="2" title="Liabilities" subtitle="Loans & Goals" />
          <v-divider />
          <v-stepper-item :value="3" title="Current Coverage" subtitle="Existing Policies" />
          <v-divider />
          <v-stepper-item :value="4" title="Results" subtitle="Recommendations" />
        </v-stepper-header>

        <v-stepper-window>
          <!-- Step 1: Profile -->
          <v-stepper-window-item :value="1">
            <div class="pa-4">
              <v-row>
                <v-col cols="12" sm="6">
                  <v-text-field
                    v-model.number="formData.annualIncome"
                    label="Annual Income"
                    prepend-inner-icon="mdi-currency-inr"
                    type="number"
                    hint="Your total annual income before tax"
                    :rules="[(v) => v > 0 || 'Income is required']"
                  />
                </v-col>
                <v-col cols="12" sm="6">
                  <v-text-field
                    v-model.number="formData.age"
                    label="Your Age"
                    prepend-inner-icon="mdi-account"
                    type="number"
                    min="18"
                    max="70"
                    :rules="[(v) => v >= 18 || 'Must be at least 18']"
                  />
                </v-col>
                <v-col cols="12" sm="6">
                  <v-text-field
                    v-model.number="formData.retirementAge"
                    label="Retirement Age"
                    prepend-inner-icon="mdi-beach"
                    type="number"
                    min="45"
                    max="70"
                    :rules="[(v) => v > formData.age || 'Must be greater than current age']"
                  />
                </v-col>
                <v-col cols="12" sm="6">
                  <v-select
                    v-model="formData.city"
                    :items="cityOptions"
                    label="City Type"
                    prepend-inner-icon="mdi-city"
                    hint="Affects health insurance recommendation"
                  />
                </v-col>
              </v-row>

              <v-divider class="my-4" />
              <div class="text-subtitle-1 mb-3">Family Members</div>

              <!-- Spouse -->
              <v-row align="center" class="mb-2">
                <v-col cols="6">
                  <v-switch v-model="hasSpouse" label="Spouse" color="primary" hide-details />
                </v-col>
                <v-col v-if="hasSpouse" cols="6">
                  <v-text-field
                    v-model.number="spouseAge"
                    label="Spouse's Age"
                    type="number"
                    density="compact"
                    hide-details
                  />
                </v-col>
              </v-row>

              <!-- Children -->
              <div class="d-flex align-center mb-2">
                <span class="text-body-2">Children</span>
                <v-spacer />
                <v-btn size="small" variant="outlined" @click="addChild">
                  <v-icon icon="mdi-plus" class="mr-1" size="small" />
                  Add Child
                </v-btn>
              </div>
              <v-row v-for="(child, index) in formData.children" :key="index" class="mb-2">
                <v-col cols="8">
                  <v-text-field
                    v-model.number="child.age"
                    :label="`Child ${index + 1} Age`"
                    type="number"
                    density="compact"
                    hide-details
                  />
                </v-col>
                <v-col cols="4" class="d-flex align-center">
                  <v-btn icon="mdi-delete" size="small" color="error" variant="text" @click="removeChild(index)" />
                </v-col>
              </v-row>

              <!-- Dependent Parents -->
              <v-row align="center" class="mb-2 mt-4">
                <v-col cols="6">
                  <v-switch
                    v-model="hasDependentParents"
                    label="Dependent Parents"
                    color="primary"
                    hide-details
                  />
                </v-col>
                <v-col v-if="hasDependentParents" cols="6" class="text-right">
                  <v-btn size="small" variant="outlined" @click="addParent">
                    <v-icon icon="mdi-plus" class="mr-1" size="small" />
                    Add Parent
                  </v-btn>
                </v-col>
              </v-row>
              <template v-if="hasDependentParents">
                <v-row v-for="(parent, index) in parentAges" :key="'parent-' + index" class="mb-2">
                  <v-col cols="8">
                    <v-text-field
                      v-model.number="parent.age"
                      :label="`Parent ${index + 1} Age`"
                      type="number"
                      density="compact"
                      hide-details
                    />
                  </v-col>
                  <v-col cols="4" class="d-flex align-center">
                    <v-btn
                      v-if="parentAges.length > 1"
                      icon="mdi-delete"
                      size="small"
                      color="error"
                      variant="text"
                      @click="removeParent(index)"
                    />
                  </v-col>
                </v-row>
              </template>
            </div>
          </v-stepper-window-item>

          <!-- Step 2: Liabilities & Goals -->
          <v-stepper-window-item :value="2">
            <div class="pa-4">
              <div class="text-subtitle-1 mb-3">Outstanding Liabilities</div>
              <v-row>
                <v-col cols="12" sm="6">
                  <v-text-field
                    v-model.number="formData.homeLoan"
                    label="Home Loan Outstanding"
                    prepend-inner-icon="mdi-home"
                    type="number"
                  />
                </v-col>
                <v-col cols="12" sm="6">
                  <v-text-field
                    v-model.number="formData.carLoan"
                    label="Car/Vehicle Loan"
                    prepend-inner-icon="mdi-car"
                    type="number"
                  />
                </v-col>
                <v-col cols="12" sm="6">
                  <v-text-field
                    v-model.number="formData.otherLoans"
                    label="Other Loans"
                    prepend-inner-icon="mdi-bank"
                    type="number"
                  />
                </v-col>
                <v-col cols="12" sm="6">
                  <v-text-field
                    v-model.number="formData.creditCardDebt"
                    label="Credit Card Debt"
                    prepend-inner-icon="mdi-credit-card"
                    type="number"
                  />
                </v-col>
              </v-row>

              <v-divider class="my-4" />
              <div class="text-subtitle-1 mb-3">Future Goals (per child)</div>
              <v-row>
                <v-col cols="12" sm="6">
                  <v-text-field
                    v-model.number="formData.childEducation"
                    label="Child Education Fund"
                    prepend-inner-icon="mdi-school"
                    type="number"
                    hint="Higher education cost per child"
                  />
                </v-col>
                <v-col cols="12" sm="6">
                  <v-text-field
                    v-model.number="formData.childMarriage"
                    label="Child Marriage Fund"
                    prepend-inner-icon="mdi-ring"
                    type="number"
                    hint="Marriage expenses per child"
                  />
                </v-col>
                <v-col cols="12" sm="6">
                  <v-text-field
                    v-model.number="formData.spouseSecurityYears"
                    label="Spouse Security (Years)"
                    prepend-inner-icon="mdi-shield-account"
                    type="number"
                    hint="Years of expenses for spouse security"
                  />
                </v-col>
              </v-row>
            </div>
          </v-stepper-window-item>

          <!-- Step 3: Current Coverage -->
          <v-stepper-window-item :value="3">
            <div class="pa-4">
              <v-alert type="info" variant="tonal" class="mb-4">
                <v-icon icon="mdi-information" />
                Enter your existing insurance coverage to see the gap analysis.
              </v-alert>

              <v-row>
                <v-col cols="12" sm="6">
                  <v-text-field
                    v-model.number="formData.existingLifeCover"
                    label="Existing Life Insurance Cover"
                    prepend-inner-icon="mdi-heart-pulse"
                    type="number"
                    hint="Total sum assured of all life policies"
                  >
                    <template #append>
                      <v-btn-group density="compact" variant="outlined">
                        <v-btn size="x-small" @click="formData.existingLifeCover = 5000000">50L</v-btn>
                        <v-btn size="x-small" @click="formData.existingLifeCover = 10000000">1Cr</v-btn>
                      </v-btn-group>
                    </template>
                  </v-text-field>
                </v-col>
                <v-col cols="12" sm="6">
                  <v-text-field
                    v-model.number="formData.employerCover"
                    label="Employer Group Life Cover"
                    prepend-inner-icon="mdi-domain"
                    type="number"
                    hint="Group term life from employer"
                  />
                </v-col>
                <v-col cols="12" sm="6">
                  <v-text-field
                    v-model.number="formData.existingHealthCover"
                    label="Existing Health Insurance Cover"
                    prepend-inner-icon="mdi-hospital-box"
                    type="number"
                    hint="Total health insurance sum insured"
                  >
                    <template #append>
                      <v-btn-group density="compact" variant="outlined">
                        <v-btn size="x-small" @click="formData.existingHealthCover = 500000">5L</v-btn>
                        <v-btn size="x-small" @click="formData.existingHealthCover = 1000000">10L</v-btn>
                      </v-btn-group>
                    </template>
                  </v-text-field>
                </v-col>
              </v-row>
            </div>
          </v-stepper-window-item>

          <!-- Step 4: Results -->
          <v-stepper-window-item :value="4">
            <div class="pa-4">
              <v-progress-circular
                v-if="isCalculating"
                indeterminate
                color="primary"
                size="64"
                class="d-block mx-auto my-8"
              />

              <template v-else-if="result">
                <!-- Overall Score -->
                <v-card
                  :color="result.overall.status === 'adequate' ? 'success' : result.overall.status === 'partial' ? 'warning' : 'error'"
                  variant="tonal"
                  class="mb-4"
                >
                  <v-card-text class="text-center py-6">
                    <div class="text-h2 font-weight-bold mb-2">
                      {{ result.overall.score.toFixed(0) }}%
                    </div>
                    <div class="text-h6 font-weight-medium text-uppercase">
                      {{ result.overall.status === 'adequate' ? 'Adequate Coverage' : result.overall.status === 'partial' ? 'Partial Coverage' : 'Critical Gap' }}
                    </div>
                    <div class="text-body-2 mt-2">{{ result.overall.message }}</div>
                  </v-card-text>
                </v-card>

                <!-- Life Insurance Analysis -->
                <v-card class="mb-4">
                  <v-card-title class="d-flex align-center">
                    <v-icon icon="mdi-heart-pulse" color="purple" class="mr-2" />
                    Life Insurance Analysis (HLV Method)
                  </v-card-title>
                  <v-card-text>
                    <div class="d-flex justify-space-between mb-2">
                      <span>Income Replacement ({{ Math.min(20, formData.retirementAge - formData.age) }}x)</span>
                      <span class="font-weight-medium">{{ formatINRCompact(result.life.breakdown.incomeReplacement) }}</span>
                    </div>
                    <div class="d-flex justify-space-between mb-2">
                      <span>Outstanding Liabilities</span>
                      <span class="font-weight-medium">{{ formatINRCompact(result.life.breakdown.liabilities) }}</span>
                    </div>
                    <div class="d-flex justify-space-between mb-2">
                      <span>Children's Future</span>
                      <span class="font-weight-medium">{{ formatINRCompact(result.life.breakdown.childrenFuture) }}</span>
                    </div>
                    <div class="d-flex justify-space-between mb-2">
                      <span>Emergency Buffer</span>
                      <span class="font-weight-medium">{{ formatINRCompact(result.life.breakdown.emergencyBuffer) }}</span>
                    </div>
                    <v-divider class="my-3" />
                    <div class="d-flex justify-space-between mb-2">
                      <span class="font-weight-bold">Total Recommended</span>
                      <span class="font-weight-bold text-primary">{{ formatINRCompact(result.life.recommended) }}</span>
                    </div>
                    <div class="d-flex justify-space-between mb-3">
                      <span>Your Coverage</span>
                      <span>{{ formatINRCompact(result.life.current) }}</span>
                    </div>
                    <v-progress-linear
                      :model-value="result.life.percentage"
                      :color="getProgressColor(result.life.percentage)"
                      height="20"
                      rounded
                    >
                      <template #default>
                        <span class="text-caption font-weight-bold">{{ result.life.percentage.toFixed(0) }}%</span>
                      </template>
                    </v-progress-linear>
                    <div v-if="result.life.gap > 0" class="text-error mt-2 font-weight-medium">
                      Gap: {{ formatINRCompact(result.life.gap) }}
                    </div>
                  </v-card-text>
                </v-card>

                <!-- Health Insurance Analysis -->
                <v-card class="mb-4">
                  <v-card-title class="d-flex align-center">
                    <v-icon icon="mdi-hospital-box" color="blue" class="mr-2" />
                    Health Insurance Analysis (2025 Rates)
                  </v-card-title>
                  <v-card-text>
                    <div class="d-flex justify-space-between mb-2">
                      <span>Self</span>
                      <span class="font-weight-medium">{{ formatINRCompact(result.health.familyBreakdown.self) }}</span>
                    </div>
                    <div v-if="result.health.familyBreakdown.spouse" class="d-flex justify-space-between mb-2">
                      <span>Spouse</span>
                      <span class="font-weight-medium">{{ formatINRCompact(result.health.familyBreakdown.spouse) }}</span>
                    </div>
                    <div v-if="result.health.familyBreakdown.children" class="d-flex justify-space-between mb-2">
                      <span>Children</span>
                      <span class="font-weight-medium">{{ formatINRCompact(result.health.familyBreakdown.children) }}</span>
                    </div>
                    <div v-if="result.health.familyBreakdown.parents" class="d-flex justify-space-between mb-2">
                      <span>Dependent Parents (1.5x senior rate)</span>
                      <span class="font-weight-medium">{{ formatINRCompact(result.health.familyBreakdown.parents) }}</span>
                    </div>
                    <v-divider class="my-3" />
                    <div class="d-flex justify-space-between mb-2">
                      <span class="font-weight-bold">Total Recommended</span>
                      <span class="font-weight-bold text-primary">{{ formatINRCompact(result.health.recommended) }}</span>
                    </div>
                    <div class="d-flex justify-space-between mb-3">
                      <span>Your Coverage</span>
                      <span>{{ formatINRCompact(result.health.current) }}</span>
                    </div>
                    <v-progress-linear
                      :model-value="result.health.percentage"
                      :color="getProgressColor(result.health.percentage)"
                      height="20"
                      rounded
                    >
                      <template #default>
                        <span class="text-caption font-weight-bold">{{ result.health.percentage.toFixed(0) }}%</span>
                      </template>
                    </v-progress-linear>
                    <div v-if="result.health.gap > 0" class="text-error mt-2 font-weight-medium">
                      Gap: {{ formatINRCompact(result.health.gap) }}
                    </div>
                  </v-card-text>
                </v-card>
              </template>
            </div>
          </v-stepper-window-item>
        </v-stepper-window>
      </v-stepper>

      <v-divider />

      <v-card-actions class="pa-4">
        <v-btn v-if="step > 1" variant="text" @click="prevStep">
          <v-icon icon="mdi-chevron-left" class="mr-1" />
          Back
        </v-btn>
        <v-spacer />
        <v-btn variant="text" @click="closeWizard">Cancel</v-btn>
        <v-btn
          v-if="step < totalSteps"
          color="primary"
          :disabled="!isStepValid"
          @click="nextStep"
        >
          {{ step === 3 ? 'Calculate' : 'Next' }}
          <v-icon icon="mdi-chevron-right" class="ml-1" />
        </v-btn>
        <v-btn v-else color="primary" @click="closeWizard">
          Done
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
