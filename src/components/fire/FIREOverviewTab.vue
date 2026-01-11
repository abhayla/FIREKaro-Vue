<script setup lang="ts">
import { computed } from 'vue'
import FreedomScoreCard from '@/components/fire/FreedomScoreCard.vue'
import CrossoverPointChart from '@/components/fire/CrossoverPointChart.vue'
import ExpenseCoverageGrid from '@/components/fire/ExpenseCoverageGrid.vue'
import FIREMilestoneBar from '@/components/fire/FIREMilestoneBar.vue'
import {
  useFreedomScore,
  useCrossoverPoint,
  useExpenseCoverage,
  useFIREMetrics,
  formatINR
} from '@/composables/useFIRE'

const emit = defineEmits<{
  (e: 'go-to-planning'): void
}>()

// Data fetching
const { data: freedomScore, isLoading: scoreLoading } = useFreedomScore()
const { data: crossover, isLoading: crossoverLoading } = useCrossoverPoint()
const { data: coverage, isLoading: coverageLoading } = useExpenseCoverage()
const { data: metrics, isLoading: metricsLoading } = useFIREMetrics()

const isLoading = computed(() =>
  scoreLoading.value || crossoverLoading.value || coverageLoading.value || metricsLoading.value
)

// Calculate years and months to FIRE
const yearsToFIRE = computed(() => {
  if (!metrics.value || typeof metrics.value.yearsToFIRE !== 'number' || isNaN(metrics.value.yearsToFIRE)) {
    return '--'
  }
  const years = Math.floor(metrics.value.yearsToFIRE)
  const months = Math.round((metrics.value.yearsToFIRE - years) * 12)
  if (isNaN(years) || isNaN(months)) return '--'
  if (years === 0 && months === 0) return 'Achieved!'
  if (years === 0) return `${months}m`
  if (months === 0) return `${years}y`
  return `${years}y ${months}m`
})

// Calculate monthly passive income
const monthlyPassiveIncome = computed(() => {
  if (!metrics.value?.currentCorpus) return 0
  // Assuming 4% SWR divided by 12 months
  return (metrics.value.currentCorpus * 0.04) / 12
})
</script>

<template>
  <div>
    <!-- Primary Metrics Row (4 cards) -->
    <v-row class="mb-4">
      <v-col cols="6" sm="3">
        <v-skeleton-loader v-if="metricsLoading" type="card" height="120" />
        <v-card v-else class="pa-4 text-center h-100">
          <v-icon icon="mdi-fire" color="fire-orange" size="32" class="mb-2" />
          <div class="text-body-2 text-medium-emphasis">FIRE Number</div>
          <div class="text-h6 font-weight-bold text-currency">
            {{ formatINR(metrics?.fireNumber || 0, true) }}
          </div>
        </v-card>
      </v-col>
      <v-col cols="6" sm="3">
        <v-skeleton-loader v-if="metricsLoading" type="card" height="120" />
        <v-card v-else class="pa-4 text-center h-100">
          <v-icon icon="mdi-piggy-bank" color="primary" size="32" class="mb-2" />
          <div class="text-body-2 text-medium-emphasis">Current Corpus</div>
          <div class="text-h6 font-weight-bold text-currency">
            {{ formatINR(metrics?.currentCorpus || 0, true) }}
          </div>
        </v-card>
      </v-col>
      <v-col cols="6" sm="3">
        <v-skeleton-loader v-if="metricsLoading" type="card" height="120" />
        <v-card v-else class="pa-4 text-center h-100">
          <v-icon icon="mdi-chart-arc" color="success" size="32" class="mb-2" />
          <div class="text-body-2 text-medium-emphasis">Progress</div>
          <div class="text-h6 font-weight-bold">
            <span class="fire-progress-75">{{ metrics?.progressPercent || 0 }}%</span>
          </div>
        </v-card>
      </v-col>
      <v-col cols="6" sm="3">
        <v-skeleton-loader v-if="metricsLoading" type="card" height="120" />
        <v-card v-else class="pa-4 text-center h-100">
          <v-icon icon="mdi-timer-sand" color="warning" size="32" class="mb-2" />
          <div class="text-body-2 text-medium-emphasis">Time to FIRE</div>
          <div class="text-h6 font-weight-bold">{{ yearsToFIRE }}</div>
        </v-card>
      </v-col>
    </v-row>

    <!-- Secondary Metrics Row (4 cards) -->
    <v-row class="mb-6">
      <v-col cols="6" sm="3">
        <v-skeleton-loader v-if="metricsLoading" type="card" height="100" />
        <v-card v-else variant="outlined" class="pa-3 text-center h-100">
          <v-icon icon="mdi-percent" color="info" size="24" class="mb-1" />
          <div class="text-caption text-medium-emphasis">Savings Rate</div>
          <div class="text-subtitle-1 font-weight-bold">{{ metrics?.savingsRate || 0 }}%</div>
        </v-card>
      </v-col>
      <v-col cols="6" sm="3">
        <v-skeleton-loader v-if="metricsLoading" type="card" height="100" />
        <v-card v-else variant="outlined" class="pa-3 text-center h-100">
          <v-icon icon="mdi-cash-sync" color="success" size="24" class="mb-1" />
          <div class="text-caption text-medium-emphasis">Monthly Passive</div>
          <div class="text-subtitle-1 font-weight-bold text-currency">
            {{ formatINR(monthlyPassiveIncome, true) }}
          </div>
        </v-card>
      </v-col>
      <v-col cols="6" sm="3">
        <v-skeleton-loader v-if="metricsLoading" type="card" height="100" />
        <v-card v-else variant="outlined" class="pa-3 text-center h-100">
          <v-icon icon="mdi-fire-circle" color="fire-orange" size="24" class="mb-1" />
          <div class="text-caption text-medium-emphasis">Lean FIRE</div>
          <div class="text-subtitle-1 font-weight-bold text-currency">
            {{ formatINR(metrics?.leanFIRE || 0, true) }}
          </div>
        </v-card>
      </v-col>
      <v-col cols="6" sm="3">
        <v-skeleton-loader v-if="metricsLoading" type="card" height="100" />
        <v-card v-else variant="outlined" class="pa-3 text-center h-100">
          <v-icon icon="mdi-fire" color="error" size="24" class="mb-1" />
          <div class="text-caption text-medium-emphasis">Fat FIRE</div>
          <div class="text-subtitle-1 font-weight-bold text-currency">
            {{ formatINR(metrics?.fatFIRE || 0, true) }}
          </div>
        </v-card>
      </v-col>
    </v-row>

    <!-- Main Content: Freedom Score + Crossover Chart -->
    <v-row>
      <v-col cols="12" lg="5">
        <v-skeleton-loader v-if="scoreLoading" type="card" height="350" />
        <FreedomScoreCard
          v-else-if="freedomScore"
          :score="freedomScore"
          :loading="scoreLoading"
        />
      </v-col>
      <v-col cols="12" lg="7">
        <v-skeleton-loader v-if="crossoverLoading" type="card" height="350" />
        <CrossoverPointChart
          v-else-if="crossover"
          :data="crossover"
          :loading="crossoverLoading"
        />
      </v-col>
    </v-row>

    <!-- FIRE Milestones -->
    <v-row class="mt-4">
      <v-col cols="12">
        <FIREMilestoneBar :progress-percent="metrics?.progressPercent || 0" />
      </v-col>
    </v-row>

    <!-- Expense Coverage -->
    <v-row class="mt-4">
      <v-col cols="12">
        <v-skeleton-loader v-if="coverageLoading" type="card" height="200" />
        <ExpenseCoverageGrid
          v-else-if="coverage"
          :data="coverage"
          :loading="coverageLoading"
        />
      </v-col>
    </v-row>

    <!-- Smart Alerts & Tips -->
    <v-row class="mt-4">
      <v-col cols="12" md="4">
        <v-card class="h-100">
          <v-card-title class="d-flex align-center">
            <v-icon icon="mdi-target" class="mr-2" />
            Quick Actions
          </v-card-title>
          <v-card-text>
            <v-list density="compact" nav>
              <v-list-item
                prepend-icon="mdi-calculator"
                title="FIRE Calculator"
                subtitle="Calculate your FIRE number"
                @click="emit('go-to-planning')"
              />
              <v-list-item
                prepend-icon="mdi-flag-checkered"
                title="Set a Goal"
                subtitle="Create a new financial goal"
                @click="emit('go-to-planning')"
              />
              <v-list-item
                prepend-icon="mdi-chart-timeline"
                title="View Projections"
                subtitle="See your wealth over time"
                @click="emit('go-to-planning')"
              />
              <v-list-item
                prepend-icon="mdi-cash-sync"
                title="Withdrawal Strategy"
                subtitle="Plan your FIRE withdrawals"
                @click="emit('go-to-planning')"
              />
            </v-list>
          </v-card-text>
        </v-card>
      </v-col>
      <v-col cols="12" md="8">
        <v-card class="h-100">
          <v-card-title class="d-flex align-center">
            <v-icon icon="mdi-lightbulb" class="mr-2" color="warning" />
            FIRE Tip of the Day
          </v-card-title>
          <v-card-text>
            <v-sheet rounded class="pa-4" color="warning-lighten-5">
              <div class="text-subtitle-1 font-weight-bold mb-2">"The Power of 1% More"</div>
              <div class="text-body-2">
                Increasing your savings rate by just 1% could shave months off your FIRE timeline.
                Small, consistent improvements compound dramatically over time.
              </div>
              <div class="mt-3 d-flex ga-2">
                <v-btn color="warning" variant="outlined" size="small">
                  <v-icon icon="mdi-muscle" start />
                  Accept Challenge
                </v-btn>
                <v-btn variant="text" size="small">Learn More</v-btn>
              </div>
            </v-sheet>

            <v-row dense class="mt-4">
              <v-col cols="6">
                <div class="text-body-2 text-medium-emphasis mb-1">Your Savings Rate</div>
                <div class="text-h5 font-weight-bold">{{ metrics?.savingsRate || 0 }}%</div>
              </v-col>
              <v-col cols="6">
                <div class="text-body-2 text-medium-emphasis mb-1">Monthly Savings</div>
                <div class="text-h5 font-weight-bold text-currency">
                  {{ formatINR(metrics?.monthlySavings || 0, true) }}
                </div>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </div>
</template>
