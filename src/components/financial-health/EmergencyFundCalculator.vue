<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { formatINR } from '@/composables/useFinancialHealth'

const props = defineProps<{
  monthlyExpenses?: number
  currentAmount?: number
}>()

const emit = defineEmits<{
  calculate: [result: CalculationResult]
}>()

interface CalculationResult {
  targetMonths: number
  targetAmount: number
  currentAmount: number
  gap: number
  monthlyContribution: number
  monthsToReach: number
}

// Form inputs
const monthlyExpenses = ref(props.monthlyExpenses || 100000)
const currentAmount = ref(props.currentAmount || 0)
const incomeStability = ref<'stable' | 'freelance' | 'business'>('stable')
const dependents = ref(0)
const hasDebt = ref(false)
const targetTimelineMonths = ref(12)

const incomeStabilityOptions = [
  { title: 'Stable Salary', value: 'stable' },
  { title: 'Freelance / Contractual', value: 'freelance' },
  { title: 'Business Owner', value: 'business' }
]

// Calculate recommended months based on profile
const recommendedMonths = computed(() => {
  let baseMonths = 6

  // Income stability factor
  switch (incomeStability.value) {
    case 'freelance': baseMonths = 9; break
    case 'business': baseMonths = 12; break
    default: baseMonths = 6
  }

  // Dependents factor
  baseMonths += dependents.value * 0.75

  // Debt factor
  if (hasDebt.value) baseMonths += 1.5

  return Math.ceil(baseMonths)
})

const targetMonths = ref(6)

// Update target months when recommendation changes
watch(recommendedMonths, (newVal) => {
  targetMonths.value = newVal
}, { immediate: true })

// Calculations
const targetAmount = computed(() => monthlyExpenses.value * targetMonths.value)
const gap = computed(() => Math.max(0, targetAmount.value - currentAmount.value))
const percentComplete = computed(() =>
  targetAmount.value > 0 ? Math.min(100, (currentAmount.value / targetAmount.value) * 100) : 0
)

const monthlyContribution = computed(() => {
  if (gap.value <= 0) return 0
  return Math.ceil(gap.value / targetTimelineMonths.value)
})

const monthsToReach = computed(() => {
  if (gap.value <= 0) return 0
  if (monthlyContribution.value <= 0) return Infinity
  return Math.ceil(gap.value / monthlyContribution.value)
})

const status = computed(() => {
  if (percentComplete.value >= 100) return { color: 'success', label: 'Target Reached' }
  if (percentComplete.value >= 80) return { color: 'primary', label: 'Almost There' }
  if (percentComplete.value >= 50) return { color: 'warning', label: 'Making Progress' }
  return { color: 'error', label: 'Needs Attention' }
})

const handleCalculate = () => {
  emit('calculate', {
    targetMonths: targetMonths.value,
    targetAmount: targetAmount.value,
    currentAmount: currentAmount.value,
    gap: gap.value,
    monthlyContribution: monthlyContribution.value,
    monthsToReach: monthsToReach.value
  })
}
</script>

<template>
  <v-card variant="outlined">
    <v-card-title class="d-flex align-center">
      <v-icon icon="mdi-calculator" class="mr-2" />
      Emergency Fund Calculator
    </v-card-title>

    <v-card-text>
      <v-row>
        <!-- Input Section -->
        <v-col cols="12" md="6">
          <div class="text-subtitle-2 font-weight-medium mb-3">Your Profile</div>

          <v-text-field
            v-model.number="monthlyExpenses"
            label="Monthly Expenses"
            type="number"
            prefix="₹"
            variant="outlined"
            density="comfortable"
            hint="Include all essential expenses"
            class="mb-3"
          />

          <v-text-field
            v-model.number="currentAmount"
            label="Current Emergency Fund"
            type="number"
            prefix="₹"
            variant="outlined"
            density="comfortable"
            hint="Total liquid savings for emergencies"
            class="mb-3"
          />

          <v-select
            v-model="incomeStability"
            :items="incomeStabilityOptions"
            item-title="title"
            item-value="value"
            label="Income Stability"
            variant="outlined"
            density="comfortable"
            class="mb-3"
          />

          <v-text-field
            v-model.number="dependents"
            label="Number of Dependents"
            type="number"
            variant="outlined"
            density="comfortable"
            class="mb-3"
          />

          <v-checkbox
            v-model="hasDebt"
            label="I have existing debt/loans"
            density="comfortable"
            hide-details
          />
        </v-col>

        <!-- Recommendation Section -->
        <v-col cols="12" md="6">
          <div class="recommendation-box pa-4 rounded mb-4">
            <div class="text-subtitle-2 mb-2">Recommended Coverage</div>
            <div class="text-h3 font-weight-bold text-primary">{{ recommendedMonths }} months</div>
            <div class="text-body-2 text-medium-emphasis mt-2">
              Based on your profile:
              <ul class="mt-1 pl-4">
                <li>{{ incomeStability === 'stable' ? 'Stable salary' : incomeStability === 'freelance' ? 'Variable income' : 'Business income' }}</li>
                <li v-if="dependents > 0">{{ dependents }} dependent{{ dependents > 1 ? 's' : '' }}</li>
                <li v-if="hasDebt">Has existing debt</li>
              </ul>
            </div>
          </div>

          <v-slider
            v-model="targetMonths"
            :min="3"
            :max="18"
            :step="1"
            label="Target Months"
            thumb-label="always"
            class="mb-4"
          />

          <v-slider
            v-model="targetTimelineMonths"
            :min="3"
            :max="24"
            :step="1"
            label="Build in (months)"
            thumb-label="always"
            class="mb-4"
          />
        </v-col>
      </v-row>

      <v-divider class="my-4" />

      <!-- Results Section -->
      <div class="results-section">
        <div class="text-subtitle-2 font-weight-medium mb-3">Your Plan</div>

        <v-row>
          <v-col cols="6" sm="3">
            <div class="result-card pa-3 rounded text-center">
              <div class="text-caption text-medium-emphasis">Target Amount</div>
              <div class="text-h6 font-weight-bold">{{ formatINR(targetAmount, true) }}</div>
            </div>
          </v-col>

          <v-col cols="6" sm="3">
            <div class="result-card pa-3 rounded text-center">
              <div class="text-caption text-medium-emphasis">Current Progress</div>
              <div class="text-h6 font-weight-bold" :class="`text-${status.color}`">
                {{ percentComplete.toFixed(0) }}%
              </div>
            </div>
          </v-col>

          <v-col cols="6" sm="3">
            <div class="result-card pa-3 rounded text-center">
              <div class="text-caption text-medium-emphasis">Gap to Fill</div>
              <div class="text-h6 font-weight-bold text-warning">{{ formatINR(gap, true) }}</div>
            </div>
          </v-col>

          <v-col cols="6" sm="3">
            <div class="result-card pa-3 rounded text-center">
              <div class="text-caption text-medium-emphasis">Monthly Saving</div>
              <div class="text-h6 font-weight-bold text-primary">{{ formatINR(monthlyContribution, true) }}</div>
            </div>
          </v-col>
        </v-row>

        <v-alert
          v-if="gap > 0"
          type="info"
          variant="tonal"
          class="mt-4"
        >
          <template #prepend>
            <v-icon icon="mdi-lightbulb" />
          </template>
          Save <strong>{{ formatINR(monthlyContribution, true) }}</strong> per month to reach your target in <strong>{{ monthsToReach }}</strong> months.
        </v-alert>

        <v-alert
          v-else
          type="success"
          variant="tonal"
          class="mt-4"
        >
          <template #prepend>
            <v-icon icon="mdi-party-popper" />
          </template>
          Congratulations! You've reached your emergency fund target.
        </v-alert>
      </div>
    </v-card-text>
  </v-card>
</template>

<style scoped>
.recommendation-box {
  background: rgba(var(--v-theme-primary), 0.1);
  border: 1px solid rgba(var(--v-theme-primary), 0.3);
}

.result-card {
  background: rgba(var(--v-theme-surface-variant), 0.3);
}
</style>
