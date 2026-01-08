<script setup lang="ts">
import { ref } from 'vue'
import SectionHeader from '@/components/shared/SectionHeader.vue'
import FIRECalculator from '@/components/fire/FIRECalculator.vue'
import MonteCarloChart from '@/components/fire/MonteCarloChart.vue'
import { useMonteCarlo, useFIREMetrics, formatINR, calculateRecommendedSIP } from '@/composables/useFIRE'

const tabs = [
  { title: 'FIRE Dashboard', route: '/dashboard/fire-goals' },
  { title: 'Calculators', route: '/dashboard/fire-goals/calculators' },
  { title: 'Goals', route: '/dashboard/fire-goals/goals' },
  { title: 'Projections', route: '/dashboard/fire-goals/projections' },
  { title: 'Withdrawal', route: '/dashboard/fire-goals/withdrawal' },
  { title: 'Reports', route: '/dashboard/fire-goals/reports' },
]

const { data: monteCarlo, isLoading: monteCarloLoading } = useMonteCarlo()
const { data: metrics } = useFIREMetrics()

// Active calculator tab
const activeCalculator = ref('fire')

// SIP Calculator state
const sipGoalAmount = ref(1000000)
const sipYears = ref(5)
const sipExpectedReturn = ref(12)
const sipRecommended = ref(0)

const calculateSIP = () => {
  sipRecommended.value = calculateRecommendedSIP(
    sipGoalAmount.value,
    0,
    sipYears.value * 12,
    sipExpectedReturn.value
  )
}

// Retirement Date Calculator
const retirementCurrentAge = ref(32)
const retirementTargetCorpus = ref(30000000)
const retirementCurrentCorpus = ref(5000000)
const retirementMonthlySavings = ref(50000)
const retirementExpectedReturn = ref(12)

const retirementAge = () => {
  const target = retirementTargetCorpus.value
  const current = retirementCurrentCorpus.value
  const monthly = retirementMonthlySavings.value
  const rate = retirementExpectedReturn.value / 100 / 12

  let corpus = current
  let months = 0
  const maxMonths = 600 // 50 years max

  while (corpus < target && months < maxMonths) {
    corpus = corpus * (1 + rate) + monthly
    months++
  }

  return retirementCurrentAge.value + Math.floor(months / 12)
}

// Initialize
calculateSIP()
</script>

<template>
  <div>
    <SectionHeader
      title="FIRE & Goals"
      subtitle="FIRE Calculators"
      icon="mdi-fire"
      :tabs="tabs"
    />

    <!-- Calculator Tabs -->
    <v-tabs v-model="activeCalculator" color="primary" class="mb-6">
      <v-tab value="fire">
        <v-icon icon="mdi-fire" start />
        FIRE Number
      </v-tab>
      <v-tab value="retirement">
        <v-icon icon="mdi-calendar-check" start />
        Retirement Date
      </v-tab>
      <v-tab value="sip">
        <v-icon icon="mdi-cash-sync" start />
        SIP Calculator
      </v-tab>
      <v-tab value="montecarlo">
        <v-icon icon="mdi-chart-bell-curve" start />
        Monte Carlo
      </v-tab>
    </v-tabs>

    <v-window v-model="activeCalculator">
      <!-- FIRE Number Calculator -->
      <v-window-item value="fire">
        <FIRECalculator
          :initial-expenses="metrics?.annualExpenses || 1200000"
          :initial-corpus="metrics?.currentCorpus || 5000000"
          :initial-savings="metrics?.monthlySavings ? metrics.monthlySavings * 12 : 400000"
          :expected-return="metrics?.expectedReturns || 12"
          :inflation-rate="metrics?.inflationRate || 6"
        />
      </v-window-item>

      <!-- Retirement Date Calculator -->
      <v-window-item value="retirement">
        <v-card>
          <v-card-title class="d-flex align-center">
            <v-icon icon="mdi-calendar-check" class="mr-2" />
            Retirement Date Calculator
          </v-card-title>
          <v-card-text>
            <v-alert color="primary" variant="tonal" class="mb-6">
              <div class="d-flex justify-space-between align-center">
                <div>
                  <div class="text-body-2">At current pace, you can retire at age</div>
                  <div class="text-h3 font-weight-bold">{{ retirementAge() }}</div>
                </div>
                <v-icon icon="mdi-party-popper" size="48" />
              </div>
            </v-alert>

            <v-row>
              <v-col cols="12" md="6">
                <v-text-field
                  v-model.number="retirementCurrentAge"
                  label="Current Age"
                  type="number"
                  variant="outlined"
                  density="comfortable"
                />

                <v-text-field
                  v-model.number="retirementCurrentCorpus"
                  label="Current Corpus"
                  type="number"
                  prefix="₹"
                  variant="outlined"
                  density="comfortable"
                  hint="Your current investments"
                  persistent-hint
                />

                <v-text-field
                  v-model.number="retirementMonthlySavings"
                  label="Monthly Savings"
                  type="number"
                  prefix="₹"
                  variant="outlined"
                  density="comfortable"
                />
              </v-col>

              <v-col cols="12" md="6">
                <v-text-field
                  v-model.number="retirementTargetCorpus"
                  label="Target Retirement Corpus"
                  type="number"
                  prefix="₹"
                  variant="outlined"
                  density="comfortable"
                  hint="Your FIRE number"
                  persistent-hint
                />

                <div class="mt-4">
                  <div class="d-flex justify-space-between mb-1">
                    <span class="text-body-2">Expected Returns</span>
                    <span class="text-body-2 font-weight-bold">{{ retirementExpectedReturn }}%</span>
                  </div>
                  <v-slider
                    v-model="retirementExpectedReturn"
                    :min="6"
                    :max="18"
                    :step="0.5"
                    color="primary"
                    thumb-label
                    hide-details
                  />
                </div>

                <v-alert type="info" variant="tonal" class="mt-6">
                  <div class="text-body-2">
                    <strong>Tip:</strong> Increasing monthly savings by ₹10,000 could
                    shave ~2 years off your retirement age.
                  </div>
                </v-alert>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>
      </v-window-item>

      <!-- SIP Calculator -->
      <v-window-item value="sip">
        <v-card>
          <v-card-title class="d-flex align-center">
            <v-icon icon="mdi-cash-sync" class="mr-2" />
            SIP Calculator
          </v-card-title>
          <v-card-text>
            <v-alert color="success" variant="tonal" class="mb-6">
              <div class="d-flex justify-space-between align-center">
                <div>
                  <div class="text-body-2">Recommended Monthly SIP</div>
                  <div class="text-h3 font-weight-bold text-currency">{{ formatINR(sipRecommended) }}</div>
                </div>
                <v-icon icon="mdi-trending-up" size="48" color="success" />
              </div>
            </v-alert>

            <v-row>
              <v-col cols="12" md="6">
                <v-text-field
                  v-model.number="sipGoalAmount"
                  label="Goal Amount"
                  type="number"
                  prefix="₹"
                  variant="outlined"
                  density="comfortable"
                  @update:model-value="calculateSIP"
                />

                <v-text-field
                  v-model.number="sipYears"
                  label="Time Period (Years)"
                  type="number"
                  variant="outlined"
                  density="comfortable"
                  @update:model-value="calculateSIP"
                />
              </v-col>

              <v-col cols="12" md="6">
                <div class="mb-4">
                  <div class="d-flex justify-space-between mb-1">
                    <span class="text-body-2">Expected Returns</span>
                    <span class="text-body-2 font-weight-bold">{{ sipExpectedReturn }}%</span>
                  </div>
                  <v-slider
                    v-model="sipExpectedReturn"
                    :min="6"
                    :max="18"
                    :step="0.5"
                    color="primary"
                    thumb-label
                    hide-details
                    @update:model-value="calculateSIP"
                  />
                </div>

                <v-sheet rounded class="pa-4 mt-4" color="surface-variant">
                  <div class="text-body-2 mb-2"><strong>Investment Breakdown</strong></div>
                  <v-row dense>
                    <v-col cols="6">
                      <div class="text-caption text-medium-emphasis">Total Investment</div>
                      <div class="text-body-1 font-weight-bold text-currency">
                        {{ formatINR(sipRecommended * sipYears * 12, true) }}
                      </div>
                    </v-col>
                    <v-col cols="6">
                      <div class="text-caption text-medium-emphasis">Expected Returns</div>
                      <div class="text-body-1 font-weight-bold text-success text-currency">
                        {{ formatINR(sipGoalAmount - sipRecommended * sipYears * 12, true) }}
                      </div>
                    </v-col>
                  </v-row>
                </v-sheet>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>
      </v-window-item>

      <!-- Monte Carlo Simulation -->
      <v-window-item value="montecarlo">
        <MonteCarloChart
          v-if="monteCarlo"
          :data="monteCarlo"
          :loading="monteCarloLoading"
        />
        <v-skeleton-loader v-else type="card" />
      </v-window-item>
    </v-window>
  </div>
</template>
