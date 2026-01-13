<script setup lang="ts">
import { ref, computed } from 'vue'
import HLVCalculator from '@/components/insurance/HLVCalculator.vue'
import {
  useInsurancePolicies,
  useCoverageAnalysis,
  useInsuranceRecommendations,
  type CoverageAnalysis,
  formatINRCompact,
} from '@/composables/useInsurance'

const emit = defineEmits<{
  'open-wizard': []
}>()

// Fetch existing coverage
const { coverageByType, isLoading } = useInsurancePolicies()
const { data: coverageAnalysis } = useCoverageAnalysis()
const { data: recommendations, isLoading: recommendationsLoading } = useInsuranceRecommendations()

// Local calculation result
const localAnalysis = ref<CoverageAnalysis | null>(null)

// Combined analysis (API or local)
const analysis = computed(() => localAnalysis.value || coverageAnalysis.value)

// Handle calculation result
const handleCalculated = (result: CoverageAnalysis) => {
  localAnalysis.value = result
}

// Progress color helper
const getProgressColor = (percentage: number) => {
  if (percentage >= 70) return 'success'
  if (percentage >= 40) return 'warning'
  return 'error'
}

const openFullWizard = () => {
  emit('open-wizard')
}
</script>

<template>
  <div class="py-4">
    <!-- Introduction -->
    <v-alert type="info" variant="tonal" class="mb-6">
      <template #prepend>
        <v-icon icon="mdi-calculator-variant" />
      </template>
      <div class="text-subtitle-1 font-weight-medium mb-1">Human Life Value (HLV) Calculator</div>
      <p class="text-body-2 mb-0">
        Calculate the right amount of life and health insurance coverage based on your income,
        liabilities, family needs, and future goals. The HLV method ensures your family is
        financially protected.
      </p>
    </v-alert>

    <v-row>
      <!-- Quick Calculator -->
      <v-col cols="12" md="6">
        <HLVCalculator
          :existing-life-cover="coverageByType?.life"
          :existing-health-cover="coverageByType?.health"
          @calculated="handleCalculated"
        />
      </v-col>

      <!-- Analysis Results or CTA -->
      <v-col cols="12" md="6">
        <v-card v-if="!analysis" class="text-center pa-6 h-100 d-flex flex-column justify-center">
          <v-icon icon="mdi-calculator" size="64" color="primary" class="mb-4" />
          <h3 class="text-h6 mb-2">Detailed Coverage Analysis</h3>
          <p class="text-medium-emphasis mb-4">
            Use the quick calculator on the left, or open the full wizard for a comprehensive
            analysis with detailed recommendations.
          </p>
          <v-btn color="primary" size="large" @click="openFullWizard">
            <v-icon icon="mdi-wizard-hat" class="mr-2" />
            Open Full Calculator
          </v-btn>
        </v-card>

        <v-card v-else>
          <v-card-title class="d-flex align-center">
            <v-icon icon="mdi-chart-arc" class="mr-2" />
            Your Coverage Analysis
          </v-card-title>
          <v-card-text>
            <!-- Overall Score -->
            <div class="text-center mb-4">
              <v-progress-circular
                :model-value="analysis.overall.score"
                :color="getProgressColor(analysis.overall.score)"
                :size="120"
                :width="12"
              >
                <div>
                  <div class="text-h4 font-weight-bold">{{ analysis.overall.score.toFixed(0) }}%</div>
                  <div class="text-caption text-uppercase">{{ analysis.overall.status }}</div>
                </div>
              </v-progress-circular>
            </div>

            <v-alert
              :type="analysis.overall.status === 'adequate' ? 'success' : analysis.overall.status === 'partial' ? 'warning' : 'error'"
              variant="tonal"
              class="mb-4"
            >
              {{ analysis.overall.message }}
            </v-alert>

            <!-- Life Coverage -->
            <div class="mb-4">
              <div class="d-flex justify-space-between mb-1">
                <span class="font-weight-medium">Life Insurance</span>
                <span class="text-body-2">
                  {{ formatINRCompact(analysis.life.current) }} / {{ formatINRCompact(analysis.life.recommended) }}
                </span>
              </div>
              <v-progress-linear
                :model-value="analysis.life.percentage"
                :color="getProgressColor(analysis.life.percentage)"
                height="16"
                rounded
              >
                <template #default>
                  <span class="text-caption font-weight-medium">{{ analysis.life.percentage.toFixed(0) }}%</span>
                </template>
              </v-progress-linear>
              <div v-if="analysis.life.gap > 0" class="text-caption text-error mt-1">
                Gap: {{ formatINRCompact(analysis.life.gap) }}
              </div>
            </div>

            <!-- Health Coverage -->
            <div class="mb-4">
              <div class="d-flex justify-space-between mb-1">
                <span class="font-weight-medium">Health Insurance</span>
                <span class="text-body-2">
                  {{ formatINRCompact(analysis.health.current) }} / {{ formatINRCompact(analysis.health.recommended) }}
                </span>
              </div>
              <v-progress-linear
                :model-value="analysis.health.percentage"
                :color="getProgressColor(analysis.health.percentage)"
                height="16"
                rounded
              >
                <template #default>
                  <span class="text-caption font-weight-medium">{{ analysis.health.percentage.toFixed(0) }}%</span>
                </template>
              </v-progress-linear>
              <div v-if="analysis.health.gap > 0" class="text-caption text-error mt-1">
                Gap: {{ formatINRCompact(analysis.health.gap) }}
              </div>
            </div>

            <v-btn variant="outlined" color="primary" block @click="openFullWizard">
              <v-icon icon="mdi-refresh" class="mr-2" />
              Recalculate with Full Wizard
            </v-btn>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Recommendations -->
    <v-row v-if="recommendations && recommendations.length > 0" class="mt-4">
      <v-col cols="12">
        <v-card>
          <v-card-title>
            <v-icon icon="mdi-lightbulb-on" class="mr-2" />
            Personalized Recommendations
          </v-card-title>
          <v-card-text>
            <v-list>
              <v-list-item
                v-for="(rec, index) in recommendations"
                :key="index"
                :prepend-avatar="undefined"
                class="mb-2"
              >
                <template #prepend>
                  <v-avatar
                    :color="rec.type === 'life' ? 'purple' : rec.type === 'health' ? 'blue' : 'orange'"
                    size="40"
                  >
                    <span class="text-h6 font-weight-bold">{{ rec.priority }}</span>
                  </v-avatar>
                </template>
                <v-list-item-title class="font-weight-medium">
                  {{ rec.description }}
                </v-list-item-title>
                <v-list-item-subtitle>
                  Suggested: {{ formatINRCompact(rec.suggestedCoverage) }}
                  <span v-if="rec.estimatedPremium" class="ml-2">
                    (Est. premium: {{ formatINRCompact(rec.estimatedPremium.min) }} -
                    {{ formatINRCompact(rec.estimatedPremium.max) }}/yr)
                  </span>
                  <v-chip v-if="rec.taxBenefit" size="x-small" color="success" class="ml-2">
                    {{ rec.taxBenefit }}
                  </v-chip>
                </v-list-item-subtitle>
              </v-list-item>
            </v-list>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- How HLV Works -->
    <v-row class="mt-4">
      <v-col cols="12">
        <v-card>
          <v-card-title>
            <v-icon icon="mdi-information-outline" class="mr-2" />
            How Human Life Value (HLV) Method Works
          </v-card-title>
          <v-card-text>
            <v-row>
              <v-col cols="12" md="6">
                <div class="text-subtitle-2 mb-2">Life Insurance Calculation</div>
                <v-list density="compact">
                  <v-list-item prepend-icon="mdi-numeric-1-circle">
                    <v-list-item-title>Income Replacement</v-list-item-title>
                    <v-list-item-subtitle>10-20x annual income based on years to retirement</v-list-item-subtitle>
                  </v-list-item>
                  <v-list-item prepend-icon="mdi-numeric-2-circle">
                    <v-list-item-title>Outstanding Liabilities</v-list-item-title>
                    <v-list-item-subtitle>Home loan, car loan, credit card debt</v-list-item-subtitle>
                  </v-list-item>
                  <v-list-item prepend-icon="mdi-numeric-3-circle">
                    <v-list-item-title>Children's Future Needs</v-list-item-title>
                    <v-list-item-subtitle>Education and marriage expenses</v-list-item-subtitle>
                  </v-list-item>
                  <v-list-item prepend-icon="mdi-numeric-4-circle">
                    <v-list-item-title>Emergency Buffer</v-list-item-title>
                    <v-list-item-subtitle>6 months of expenses</v-list-item-subtitle>
                  </v-list-item>
                </v-list>
              </v-col>
              <v-col cols="12" md="6">
                <div class="text-subtitle-2 mb-2">Health Insurance Calculation (2025 Rates)</div>
                <v-list density="compact">
                  <v-list-item prepend-icon="mdi-city">
                    <v-list-item-title>Metro Cities</v-list-item-title>
                    <v-list-item-subtitle>₹10L per adult</v-list-item-subtitle>
                  </v-list-item>
                  <v-list-item prepend-icon="mdi-city-variant">
                    <v-list-item-title>Tier-1 Cities</v-list-item-title>
                    <v-list-item-subtitle>₹7.5L per adult</v-list-item-subtitle>
                  </v-list-item>
                  <v-list-item prepend-icon="mdi-home-city">
                    <v-list-item-title>Tier-2 & Other Cities</v-list-item-title>
                    <v-list-item-subtitle>₹5L per adult</v-list-item-subtitle>
                  </v-list-item>
                  <v-list-item prepend-icon="mdi-account-supervisor">
                    <v-list-item-title>Senior Citizens</v-list-item-title>
                    <v-list-item-subtitle>1.5x base amount (dedicated senior plan)</v-list-item-subtitle>
                  </v-list-item>
                </v-list>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </div>
</template>
