<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { formatINR } from '@/composables/useFIRE'
import { getFireProgressColor } from '@/utils/chartTheme'

interface Props {
  initialExpenses?: number
  initialCorpus?: number
  initialSavings?: number
  expectedReturn?: number
  inflationRate?: number
}

const props = withDefaults(defineProps<Props>(), {
  initialExpenses: 1200000,
  initialCorpus: 5000000,
  initialSavings: 400000,
  expectedReturn: 12,
  inflationRate: 6
})

const emit = defineEmits<{
  (e: 'calculated', data: { fireNumber: number; yearsToFIRE: number }): void
}>()

// Input values
const monthlyExpenses = ref(Math.round(props.initialExpenses / 12))
const currentCorpus = ref(props.initialCorpus)
const monthlySavings = ref(Math.round(props.initialSavings / 12))
const expectedReturn = ref(props.expectedReturn)
const inflationRate = ref(props.inflationRate)
const safeWithdrawalRate = ref(4)

// FIRE Type Selection
const fireType = ref<'lean' | 'regular' | 'fat' | 'coast'>('regular')

const fireTypeMultipliers = {
  lean: 0.6,
  regular: 1.0,
  fat: 1.5,
  coast: 1.0
}

// Calculations
const annualExpenses = computed(() => monthlyExpenses.value * 12)

const adjustedExpenses = computed(() => {
  return annualExpenses.value * fireTypeMultipliers[fireType.value]
})

const fireNumber = computed(() => {
  return Math.round(adjustedExpenses.value * (100 / safeWithdrawalRate.value))
})

const progressPercent = computed(() => {
  const percent = (currentCorpus.value / fireNumber.value) * 100
  return Math.min(100, Math.round(percent * 10) / 10)
})

const gap = computed(() => fireNumber.value - currentCorpus.value)

const yearsToFIRE = computed(() => {
  if (gap.value <= 0) return 0

  const annualSavings = monthlySavings.value * 12
  const realReturn = (expectedReturn.value - inflationRate.value) / 100

  if (annualSavings <= 0 || realReturn <= 0) {
    return gap.value / (annualSavings || 1)
  }

  // Using logarithm to solve compound growth with regular contributions
  // FV = PV(1+r)^n + PMT * ((1+r)^n - 1) / r = Target
  // Approximate using iterative approach

  let corpus = currentCorpus.value
  let years = 0
  const maxYears = 100

  while (corpus < fireNumber.value && years < maxYears) {
    corpus = corpus * (1 + realReturn) + annualSavings
    years++
  }

  return years
})

const coastFIREAge = computed(() => {
  if (fireType.value !== 'coast') return null

  // At what corpus can you stop contributing and still reach FIRE?
  // Calculate using real returns
  const realReturn = (expectedReturn.value - inflationRate.value) / 100
  const targetAge = 60 // Assume target retirement age
  const currentAge = 32 // Would come from user profile

  const yearsToTarget = targetAge - currentAge
  const requiredCorpusNow = fireNumber.value / Math.pow(1 + realReturn, yearsToTarget)

  if (currentCorpus.value >= requiredCorpusNow) {
    return currentAge
  }

  // Calculate when corpus will reach coast level
  let corpus = currentCorpus.value
  let age = currentAge
  const annualSavings = monthlySavings.value * 12

  while (corpus < requiredCorpusNow && age < targetAge) {
    corpus = corpus * (1 + realReturn) + annualSavings
    age++
  }

  return age
})

// FIRE Types breakdown
const fireNumbers = computed(() => ({
  lean: Math.round(annualExpenses.value * 0.6 * (100 / safeWithdrawalRate.value)),
  regular: Math.round(annualExpenses.value * (100 / safeWithdrawalRate.value)),
  fat: Math.round(annualExpenses.value * 1.5 * (100 / safeWithdrawalRate.value))
}))

// Watch for changes and emit
watch([fireNumber, yearsToFIRE], () => {
  emit('calculated', {
    fireNumber: fireNumber.value,
    yearsToFIRE: yearsToFIRE.value
  })
})
</script>

<template>
  <v-card>
    <v-card-title class="d-flex align-center">
      <v-icon icon="mdi-fire" class="mr-2" />
      FIRE Calculator
    </v-card-title>

    <v-card-text>
      <!-- Result Display (Always Visible at Top) -->
      <v-alert
        :color="progressPercent >= 100 ? 'success' : progressPercent >= 75 ? 'info' : progressPercent >= 50 ? 'warning' : 'primary'"
        variant="tonal"
        class="mb-6"
      >
        <div class="d-flex justify-space-between align-center flex-wrap">
          <div>
            <div class="text-body-2">Your {{ fireType.toUpperCase() }} FIRE Number</div>
            <div class="text-h4 font-weight-bold text-currency">{{ formatINR(fireNumber, true) }}</div>
          </div>
          <div class="text-right">
            <div class="text-body-2">Time to FIRE</div>
            <div class="text-h4 font-weight-bold">
              <span v-if="yearsToFIRE === 0">Achieved!</span>
              <span v-else>{{ yearsToFIRE }} years</span>
            </div>
          </div>
        </div>
        <v-progress-linear
          :model-value="progressPercent"
          :color="getFireProgressColor(progressPercent)"
          height="20"
          rounded
          class="mt-3"
        >
          <template #default>
            <span class="text-body-2 font-weight-bold">{{ progressPercent }}%</span>
          </template>
        </v-progress-linear>
      </v-alert>

      <!-- FIRE Type Selector -->
      <div class="mb-6">
        <div class="text-subtitle-2 mb-2">FIRE Type</div>
        <v-btn-toggle v-model="fireType" mandatory color="primary" variant="outlined" divided>
          <v-btn value="lean" size="small">
            <v-icon icon="mdi-leaf" start />
            Lean
          </v-btn>
          <v-btn value="regular" size="small">
            <v-icon icon="mdi-fire" start />
            Regular
          </v-btn>
          <v-btn value="fat" size="small">
            <v-icon icon="mdi-crown" start />
            Fat
          </v-btn>
          <v-btn value="coast" size="small">
            <v-icon icon="mdi-beach" start />
            Coast
          </v-btn>
        </v-btn-toggle>

        <v-sheet rounded class="pa-3 mt-2" color="surface-variant">
          <div v-if="fireType === 'lean'" class="text-body-2">
            <strong>Lean FIRE:</strong> 60% of current expenses. Minimal lifestyle, maximum freedom.
          </div>
          <div v-else-if="fireType === 'regular'" class="text-body-2">
            <strong>Regular FIRE:</strong> Current lifestyle sustained indefinitely.
          </div>
          <div v-else-if="fireType === 'fat'" class="text-body-2">
            <strong>Fat FIRE:</strong> 150% of current expenses. Comfortable lifestyle with margin.
          </div>
          <div v-else-if="fireType === 'coast'" class="text-body-2">
            <strong>Coast FIRE:</strong> Stop saving, let existing corpus grow to target.
            <span v-if="coastFIREAge" class="font-weight-bold"> You can coast at age {{ coastFIREAge }}!</span>
          </div>
        </v-sheet>
      </div>

      <v-row>
        <!-- Inputs Column -->
        <v-col cols="12" md="6">
          <div class="text-subtitle-2 mb-3">Your Numbers</div>

          <v-text-field
            v-model.number="monthlyExpenses"
            label="Monthly Expenses"
            type="number"
            prefix="₹"
            variant="outlined"
            density="comfortable"
            hint="Your average monthly spending"
            persistent-hint
            class="mb-4"
          />

          <v-text-field
            v-model.number="currentCorpus"
            label="Current Corpus"
            type="number"
            prefix="₹"
            variant="outlined"
            density="comfortable"
            hint="Total investments today"
            persistent-hint
            class="mb-4"
          />

          <v-text-field
            v-model.number="monthlySavings"
            label="Monthly Savings"
            type="number"
            prefix="₹"
            variant="outlined"
            density="comfortable"
            hint="How much you save each month"
            persistent-hint
            class="mb-4"
          />
        </v-col>

        <!-- Assumptions Column -->
        <v-col cols="12" md="6">
          <div class="text-subtitle-2 mb-3">Assumptions</div>

          <div class="mb-4">
            <div class="d-flex justify-space-between align-center mb-1">
              <span class="text-body-2">Expected Returns</span>
              <span class="text-body-2 font-weight-bold">{{ expectedReturn }}%</span>
            </div>
            <v-slider
              v-model="expectedReturn"
              :min="6"
              :max="18"
              :step="0.5"
              color="primary"
              thumb-label
              hide-details
            />
          </div>

          <div class="mb-4">
            <div class="d-flex justify-space-between align-center mb-1">
              <span class="text-body-2">Inflation Rate</span>
              <span class="text-body-2 font-weight-bold">{{ inflationRate }}%</span>
            </div>
            <v-slider
              v-model="inflationRate"
              :min="3"
              :max="10"
              :step="0.5"
              color="warning"
              thumb-label
              hide-details
            />
          </div>

          <div class="mb-4">
            <div class="d-flex justify-space-between align-center mb-1">
              <span class="text-body-2">Safe Withdrawal Rate</span>
              <span class="text-body-2 font-weight-bold">{{ safeWithdrawalRate }}%</span>
            </div>
            <v-slider
              v-model="safeWithdrawalRate"
              :min="2.5"
              :max="5"
              :step="0.25"
              color="success"
              thumb-label
              hide-details
            />
          </div>

          <v-alert type="info" variant="tonal" density="compact" class="mt-4">
            <div class="text-body-2">
              <strong>Formula:</strong> FIRE Number = Annual Expenses / SWR<br>
              = {{ formatINR(adjustedExpenses) }} / {{ safeWithdrawalRate }}% = {{ formatINR(fireNumber, true) }}
            </div>
          </v-alert>
        </v-col>
      </v-row>

      <!-- FIRE Numbers Comparison -->
      <v-divider class="my-4" />

      <div class="text-subtitle-2 mb-3">All FIRE Numbers</div>
      <v-row dense>
        <v-col cols="4">
          <v-card
            variant="outlined"
            :color="fireType === 'lean' ? 'success' : undefined"
            class="pa-3 text-center"
            @click="fireType = 'lean'"
          >
            <v-icon icon="mdi-leaf" :color="fireType === 'lean' ? 'success' : undefined" />
            <div class="text-caption text-medium-emphasis">Lean</div>
            <div class="text-body-1 font-weight-bold text-currency">{{ formatINR(fireNumbers.lean, true) }}</div>
          </v-card>
        </v-col>
        <v-col cols="4">
          <v-card
            variant="outlined"
            :color="fireType === 'regular' ? 'primary' : undefined"
            class="pa-3 text-center"
            @click="fireType = 'regular'"
          >
            <v-icon icon="mdi-fire" :color="fireType === 'regular' ? 'primary' : undefined" />
            <div class="text-caption text-medium-emphasis">Regular</div>
            <div class="text-body-1 font-weight-bold text-currency">{{ formatINR(fireNumbers.regular, true) }}</div>
          </v-card>
        </v-col>
        <v-col cols="4">
          <v-card
            variant="outlined"
            :color="fireType === 'fat' ? 'warning' : undefined"
            class="pa-3 text-center"
            @click="fireType = 'fat'"
          >
            <v-icon icon="mdi-crown" :color="fireType === 'fat' ? 'warning' : undefined" />
            <div class="text-caption text-medium-emphasis">Fat</div>
            <div class="text-body-1 font-weight-bold text-currency">{{ formatINR(fireNumbers.fat, true) }}</div>
          </v-card>
        </v-col>
      </v-row>
    </v-card-text>
  </v-card>
</template>

<style scoped>
.v-btn-toggle .v-btn {
  text-transform: none;
}
</style>
