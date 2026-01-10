<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import {
  type CoverageAnalysis,
  calculateHLV,
  formatINRCompact,
} from '@/composables/useInsurance'

const props = defineProps<{
  existingLifeCover?: number
  existingHealthCover?: number
}>()

const emit = defineEmits<{
  calculated: [analysis: CoverageAnalysis]
}>()

// Simplified form for quick calculation
const annualIncome = ref(0)
const age = ref(30)
const retirementAge = ref(60)
const city = ref<'metro' | 'tier1' | 'tier2'>('metro')
const hasSpouse = ref(false)
const childrenCount = ref(0)
const hasParents = ref(false)
const homeLoan = ref(0)

// Quick presets for income
const incomePresets = [
  { label: '5L', value: 500000 },
  { label: '10L', value: 1000000 },
  { label: '15L', value: 1500000 },
  { label: '25L', value: 2500000 },
  { label: '50L', value: 5000000 },
]

// Calculate result
const result = computed<CoverageAnalysis | null>(() => {
  if (annualIncome.value <= 0) return null

  return calculateHLV({
    annualIncome: annualIncome.value,
    age: age.value,
    retirementAge: retirementAge.value,
    city: city.value,
    spouse: hasSpouse.value ? { age: age.value } : undefined,
    children: Array.from({ length: childrenCount.value }, () => ({ age: 5 })),
    dependentParents: hasParents.value ? [{ age: 60 }] : [],
    homeLoan: homeLoan.value,
    childEducation: 2500000,
    childMarriage: 1000000,
    existingLifeCover: props.existingLifeCover || 0,
    existingHealthCover: props.existingHealthCover || 0,
  })
})

// Emit result when calculated
watch(result, (newResult) => {
  if (newResult) {
    emit('calculated', newResult)
  }
})

// Progress color helper
const getProgressColor = (percentage: number) => {
  if (percentage >= 70) return 'success'
  if (percentage >= 40) return 'warning'
  return 'error'
}
</script>

<template>
  <v-card>
    <v-card-title>
      <v-icon icon="mdi-calculator-variant" class="mr-2" />
      Quick HLV Calculator
    </v-card-title>

    <v-card-text>
      <!-- Income Input with Presets -->
      <div class="mb-4">
        <v-text-field
          v-model.number="annualIncome"
          label="Annual Income"
          prepend-inner-icon="mdi-currency-inr"
          type="number"
          hint="Your total annual income before tax"
          persistent-hint
        />
        <div class="d-flex flex-wrap gap-2 mt-2">
          <v-chip
            v-for="preset in incomePresets"
            :key="preset.value"
            :color="annualIncome === preset.value ? 'primary' : undefined"
            variant="outlined"
            size="small"
            @click="annualIncome = preset.value"
          >
            {{ preset.label }}
          </v-chip>
        </div>
      </div>

      <!-- Quick Settings -->
      <v-row>
        <v-col cols="6" sm="3">
          <v-text-field
            v-model.number="age"
            label="Age"
            type="number"
            density="compact"
            min="18"
            max="70"
          />
        </v-col>
        <v-col cols="6" sm="3">
          <v-text-field
            v-model.number="retirementAge"
            label="Retire At"
            type="number"
            density="compact"
            min="45"
            max="70"
          />
        </v-col>
        <v-col cols="12" sm="6">
          <v-select
            v-model="city"
            :items="[
              { title: 'Metro', value: 'metro' },
              { title: 'Tier 1', value: 'tier1' },
              { title: 'Tier 2', value: 'tier2' },
            ]"
            label="City Type"
            density="compact"
          />
        </v-col>
      </v-row>

      <!-- Family Toggles -->
      <div class="d-flex flex-wrap gap-4 my-4">
        <v-checkbox v-model="hasSpouse" label="Spouse" hide-details density="compact" />
        <div class="d-flex align-center">
          <span class="text-body-2 mr-2">Children:</span>
          <v-btn-group density="compact" variant="outlined">
            <v-btn size="small" :disabled="childrenCount <= 0" @click="childrenCount--">-</v-btn>
            <v-btn size="small" disabled>{{ childrenCount }}</v-btn>
            <v-btn size="small" :disabled="childrenCount >= 4" @click="childrenCount++">+</v-btn>
          </v-btn-group>
        </div>
        <v-checkbox v-model="hasParents" label="Parents" hide-details density="compact" />
      </div>

      <!-- Home Loan -->
      <v-text-field
        v-model.number="homeLoan"
        label="Home Loan Outstanding"
        prepend-inner-icon="mdi-home"
        type="number"
        density="compact"
      />

      <!-- Results -->
      <v-expand-transition>
        <div v-if="result" class="mt-4">
          <v-divider class="mb-4" />

          <!-- Overall Score -->
          <div class="text-center mb-4">
            <v-progress-circular
              :model-value="result.overall.score"
              :color="getProgressColor(result.overall.score)"
              :size="100"
              :width="10"
            >
              <div class="text-h5 font-weight-bold">{{ result.overall.score.toFixed(0) }}%</div>
            </v-progress-circular>
            <div class="text-subtitle-1 mt-2 text-uppercase" :class="`text-${getProgressColor(result.overall.score)}`">
              {{ result.overall.status }}
            </div>
          </div>

          <!-- Life Insurance -->
          <v-card variant="outlined" class="mb-3 pa-3">
            <div class="d-flex align-center mb-2">
              <v-icon icon="mdi-heart-pulse" color="purple" size="20" class="mr-2" />
              <span class="font-weight-medium">Life Insurance</span>
            </div>
            <div class="d-flex justify-space-between text-body-2 mb-1">
              <span class="text-medium-emphasis">Recommended</span>
              <span class="font-weight-bold">{{ formatINRCompact(result.life.recommended) }}</span>
            </div>
            <v-progress-linear
              :model-value="result.life.percentage"
              :color="getProgressColor(result.life.percentage)"
              height="8"
              rounded
            />
            <div v-if="result.life.gap > 0" class="text-caption text-error mt-1">
              Gap: {{ formatINRCompact(result.life.gap) }}
            </div>
          </v-card>

          <!-- Health Insurance -->
          <v-card variant="outlined" class="pa-3">
            <div class="d-flex align-center mb-2">
              <v-icon icon="mdi-hospital-box" color="blue" size="20" class="mr-2" />
              <span class="font-weight-medium">Health Insurance</span>
            </div>
            <div class="d-flex justify-space-between text-body-2 mb-1">
              <span class="text-medium-emphasis">Recommended</span>
              <span class="font-weight-bold">{{ formatINRCompact(result.health.recommended) }}</span>
            </div>
            <v-progress-linear
              :model-value="result.health.percentage"
              :color="getProgressColor(result.health.percentage)"
              height="8"
              rounded
            />
            <div v-if="result.health.gap > 0" class="text-caption text-error mt-1">
              Gap: {{ formatINRCompact(result.health.gap) }}
            </div>
          </v-card>
        </div>
      </v-expand-transition>
    </v-card-text>
  </v-card>
</template>
