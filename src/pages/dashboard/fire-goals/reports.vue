<script setup lang="ts">
import { ref, computed } from 'vue'
import SectionHeader from '@/components/shared/SectionHeader.vue'
import FreedomScoreCard from '@/components/fire/FreedomScoreCard.vue'
import FIREMilestoneBar from '@/components/fire/FIREMilestoneBar.vue'
import { useFreedomScore, useGoals, useFIREMetrics, useMonteCarlo, formatINR } from '@/composables/useFIRE'

const tabs = [
  { title: 'FIRE Dashboard', route: '/dashboard/fire-goals' },
  { title: 'Calculators', route: '/dashboard/fire-goals/calculators' },
  { title: 'Goals', route: '/dashboard/fire-goals/goals' },
  { title: 'Projections', route: '/dashboard/fire-goals/projections' },
  { title: 'Withdrawal', route: '/dashboard/fire-goals/withdrawal' },
  { title: 'Reports', route: '/dashboard/fire-goals/reports' },
]

const { data: freedomScore, isLoading: scoreLoading } = useFreedomScore()
const { data: goals, isLoading: goalsLoading } = useGoals()
const { data: metrics, isLoading: metricsLoading } = useFIREMetrics()
const { data: monteCarlo, isLoading: monteCarloLoading } = useMonteCarlo()

const isLoading = computed(() => scoreLoading.value || goalsLoading.value || metricsLoading.value || monteCarloLoading.value)

// Report types
const reportTypes = [
  {
    id: 'fire-progress',
    title: 'FIRE Progress Report',
    description: 'Freedom score, milestones, crossover progress',
    icon: 'mdi-fire',
    color: 'fire-orange'
  },
  {
    id: 'goals-progress',
    title: 'Goals Progress Report',
    description: 'All goals status and recommendations',
    icon: 'mdi-flag-checkered',
    color: 'success'
  },
  {
    id: 'projection-accuracy',
    title: 'Projection Accuracy Report',
    description: 'Compare past projections vs actual results',
    icon: 'mdi-chart-timeline',
    color: 'primary'
  },
  {
    id: 'withdrawal-readiness',
    title: 'Withdrawal Readiness Report',
    description: 'Monte Carlo results, strategy sustainability',
    icon: 'mdi-cash-sync',
    color: 'info'
  }
]

const selectedReport = ref('fire-progress')
const dateRange = ref('this-year')

const dateRangeOptions = [
  { title: 'This Month', value: 'this-month' },
  { title: 'This Quarter', value: 'this-quarter' },
  { title: 'This Year', value: 'this-year' },
  { title: 'Last Year', value: 'last-year' },
  { title: 'All Time', value: 'all-time' }
]

const currentDate = new Date().toLocaleDateString('en-IN', {
  day: 'numeric',
  month: 'long',
  year: 'numeric'
})

const handleExport = (format: 'pdf' | 'excel') => {
  // TODO: Implement export functionality
  console.log(`Exporting ${selectedReport.value} as ${format}`)
}

// Goals stats
const goalsOnTrack = computed(() => goals.value?.filter(g => g.status === 'on_track').length || 0)
const goalsCompleted = computed(() => goals.value?.filter(g => g.status === 'completed').length || 0)
const goalsAtRisk = computed(() => goals.value?.filter(g => g.status === 'at_risk' || g.status === 'off_track').length || 0)
</script>

<template>
  <div>
    <SectionHeader
      title="FIRE & Goals"
      subtitle="FIRE Reports"
      icon="mdi-fire"
      :tabs="tabs"
    />

    <v-row>
      <!-- Report Selection -->
      <v-col cols="12" md="4">
        <v-card class="h-100">
          <v-card-title>Report Types</v-card-title>
          <v-card-text>
            <v-list density="compact" nav>
              <v-list-item
                v-for="report in reportTypes"
                :key="report.id"
                :value="report.id"
                :active="selectedReport === report.id"
                :prepend-icon="report.icon"
                rounded="lg"
                @click="selectedReport = report.id"
              >
                <v-list-item-title>{{ report.title }}</v-list-item-title>
                <v-list-item-subtitle>{{ report.description }}</v-list-item-subtitle>
              </v-list-item>
            </v-list>
          </v-card-text>
        </v-card>
      </v-col>

      <!-- Report Preview -->
      <v-col cols="12" md="8">
        <v-card>
          <v-card-title class="d-flex align-center justify-space-between">
            <div class="d-flex align-center">
              <v-icon :icon="reportTypes.find(r => r.id === selectedReport)?.icon" class="mr-2" />
              {{ reportTypes.find(r => r.id === selectedReport)?.title }}
            </div>
            <div class="d-flex ga-2">
              <v-select
                v-model="dateRange"
                :items="dateRangeOptions"
                item-title="title"
                item-value="value"
                variant="outlined"
                density="compact"
                hide-details
                style="max-width: 180px"
              />
              <v-btn-group variant="outlined" density="compact">
                <v-btn prepend-icon="mdi-file-pdf-box" @click="handleExport('pdf')">PDF</v-btn>
                <v-btn prepend-icon="mdi-file-excel" @click="handleExport('excel')">Excel</v-btn>
              </v-btn-group>
            </div>
          </v-card-title>

          <v-divider />

          <!-- Loading State -->
          <div v-if="isLoading" class="text-center py-8">
            <v-progress-circular indeterminate color="primary" size="48" />
            <p class="text-body-2 text-medium-emphasis mt-4">Loading report data...</p>
          </div>

          <!-- Report Content -->
          <v-card-text v-else class="report-preview">
            <!-- FIRE Progress Report -->
            <template v-if="selectedReport === 'fire-progress' && freedomScore && metrics">
              <div class="report-header text-center mb-6">
                <div class="text-h5 font-weight-bold">FIRE Progress Report</div>
                <div class="text-body-2 text-medium-emphasis">Generated on {{ currentDate }}</div>
              </div>

              <!-- Freedom Score Summary -->
              <v-row class="mb-6">
                <v-col cols="12" sm="4">
                  <div class="text-center">
                    <div class="text-body-2 text-medium-emphasis">Freedom Score</div>
                    <div class="text-h3 font-weight-bold text-primary">{{ freedomScore.total }}</div>
                    <v-chip :color="freedomScore.status === 'excellent' ? 'success' : freedomScore.status === 'on_track' ? 'primary' : 'warning'" size="small">
                      {{ freedomScore.status.replace('_', ' ') }}
                    </v-chip>
                  </div>
                </v-col>
                <v-col cols="12" sm="4">
                  <div class="text-center">
                    <div class="text-body-2 text-medium-emphasis">FIRE Progress</div>
                    <div class="text-h3 font-weight-bold">{{ metrics.progressPercent }}%</div>
                  </div>
                </v-col>
                <v-col cols="12" sm="4">
                  <div class="text-center">
                    <div class="text-body-2 text-medium-emphasis">Time to FIRE</div>
                    <div class="text-h3 font-weight-bold">{{ metrics.yearsToFIRE }} yrs</div>
                  </div>
                </v-col>
              </v-row>

              <!-- Milestones -->
              <FIREMilestoneBar :progress-percent="metrics.progressPercent" />

              <!-- Domain Scores -->
              <v-table class="mt-6">
                <thead>
                  <tr>
                    <th>Domain</th>
                    <th class="text-center">Score</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td class="font-weight-medium">SAVE</td>
                    <td class="text-center">{{ freedomScore.domains.save.score }}/{{ freedomScore.domains.save.maxScore }}</td>
                    <td><v-progress-linear :model-value="(freedomScore.domains.save.score / freedomScore.domains.save.maxScore) * 100" color="success" height="8" rounded /></td>
                  </tr>
                  <tr>
                    <td class="font-weight-medium">GROW</td>
                    <td class="text-center">{{ freedomScore.domains.grow.score }}/{{ freedomScore.domains.grow.maxScore }}</td>
                    <td><v-progress-linear :model-value="(freedomScore.domains.grow.score / freedomScore.domains.grow.maxScore) * 100" color="primary" height="8" rounded /></td>
                  </tr>
                  <tr>
                    <td class="font-weight-medium">PROTECT</td>
                    <td class="text-center">{{ freedomScore.domains.protect.score }}/{{ freedomScore.domains.protect.maxScore }}</td>
                    <td><v-progress-linear :model-value="(freedomScore.domains.protect.score / freedomScore.domains.protect.maxScore) * 100" color="warning" height="8" rounded /></td>
                  </tr>
                  <tr>
                    <td class="font-weight-medium">READY</td>
                    <td class="text-center">{{ freedomScore.domains.ready.score }}/{{ freedomScore.domains.ready.maxScore }}</td>
                    <td><v-progress-linear :model-value="(freedomScore.domains.ready.score / freedomScore.domains.ready.maxScore) * 100" color="info" height="8" rounded /></td>
                  </tr>
                </tbody>
              </v-table>
            </template>

            <!-- Goals Progress Report -->
            <template v-else-if="selectedReport === 'goals-progress' && goals">
              <div class="report-header text-center mb-6">
                <div class="text-h5 font-weight-bold">Goals Progress Report</div>
                <div class="text-body-2 text-medium-emphasis">Generated on {{ currentDate }}</div>
              </div>

              <v-row class="mb-6">
                <v-col cols="4">
                  <div class="text-center">
                    <div class="text-body-2 text-medium-emphasis">On Track</div>
                    <div class="text-h3 font-weight-bold text-success">{{ goalsOnTrack }}</div>
                  </div>
                </v-col>
                <v-col cols="4">
                  <div class="text-center">
                    <div class="text-body-2 text-medium-emphasis">Completed</div>
                    <div class="text-h3 font-weight-bold text-primary">{{ goalsCompleted }}</div>
                  </div>
                </v-col>
                <v-col cols="4">
                  <div class="text-center">
                    <div class="text-body-2 text-medium-emphasis">Needs Attention</div>
                    <div class="text-h3 font-weight-bold text-warning">{{ goalsAtRisk }}</div>
                  </div>
                </v-col>
              </v-row>

              <v-table>
                <thead>
                  <tr>
                    <th>Goal</th>
                    <th class="text-right">Target</th>
                    <th class="text-right">Current</th>
                    <th class="text-center">Progress</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="goal in goals" :key="goal.id">
                    <td class="font-weight-medium">{{ goal.name }}</td>
                    <td class="text-right text-currency">{{ formatINR(goal.targetAmount, true) }}</td>
                    <td class="text-right text-currency">{{ formatINR(goal.currentAmount, true) }}</td>
                    <td class="text-center">{{ goal.progressPercent }}%</td>
                    <td>
                      <v-chip
                        :color="goal.status === 'completed' ? 'success' : goal.status === 'on_track' ? 'primary' : goal.status === 'at_risk' ? 'warning' : 'error'"
                        size="small"
                      >
                        {{ goal.status.replace('_', ' ') }}
                      </v-chip>
                    </td>
                  </tr>
                </tbody>
              </v-table>
            </template>

            <!-- Projection Accuracy Report -->
            <template v-else-if="selectedReport === 'projection-accuracy'">
              <div class="report-header text-center mb-6">
                <div class="text-h5 font-weight-bold">Projection Accuracy Report</div>
                <div class="text-body-2 text-medium-emphasis">Generated on {{ currentDate }}</div>
              </div>

              <v-alert type="info" variant="tonal" class="mb-4">
                <div class="text-body-2">
                  This report compares your past projections with actual results.
                  Data will populate as you track your progress over time.
                </div>
              </v-alert>

              <v-table>
                <thead>
                  <tr>
                    <th>Metric</th>
                    <th class="text-right">Projected</th>
                    <th class="text-right">Actual</th>
                    <th class="text-right">Variance</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Net Worth Growth</td>
                    <td class="text-right text-currency">{{ formatINR(500000, true) }}</td>
                    <td class="text-right text-currency">{{ formatINR(520000, true) }}</td>
                    <td class="text-right text-success">+4%</td>
                  </tr>
                  <tr>
                    <td>Savings Rate</td>
                    <td class="text-right">40%</td>
                    <td class="text-right">42%</td>
                    <td class="text-right text-success">+2%</td>
                  </tr>
                  <tr>
                    <td>Investment Returns</td>
                    <td class="text-right">12%</td>
                    <td class="text-right">10.5%</td>
                    <td class="text-right text-error">-1.5%</td>
                  </tr>
                </tbody>
              </v-table>
            </template>

            <!-- Withdrawal Readiness Report -->
            <template v-else-if="selectedReport === 'withdrawal-readiness' && monteCarlo">
              <div class="report-header text-center mb-6">
                <div class="text-h5 font-weight-bold">Withdrawal Readiness Report</div>
                <div class="text-body-2 text-medium-emphasis">Generated on {{ currentDate }}</div>
              </div>

              <v-row class="mb-6">
                <v-col cols="12" sm="4">
                  <div class="text-center">
                    <div class="text-body-2 text-medium-emphasis">Monte Carlo Success</div>
                    <div class="text-h3 font-weight-bold" :class="monteCarlo.successRate >= 80 ? 'text-success' : 'text-warning'">
                      {{ monteCarlo.successRate }}%
                    </div>
                  </div>
                </v-col>
                <v-col cols="12" sm="4">
                  <div class="text-center">
                    <div class="text-body-2 text-medium-emphasis">Median End Value</div>
                    <div class="text-h4 font-weight-bold text-currency">{{ formatINR(monteCarlo.medianEndingValue, true) }}</div>
                  </div>
                </v-col>
                <v-col cols="12" sm="4">
                  <div class="text-center">
                    <div class="text-body-2 text-medium-emphasis">Simulations</div>
                    <div class="text-h4 font-weight-bold">{{ monteCarlo.runsCount.toLocaleString() }}</div>
                  </div>
                </v-col>
              </v-row>

              <v-table>
                <thead>
                  <tr>
                    <th>Percentile</th>
                    <th class="text-right">Ending Value</th>
                    <th>Interpretation</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>10th Percentile (Worst)</td>
                    <td class="text-right text-currency">{{ formatINR(monteCarlo.percentile10, true) }}</td>
                    <td class="text-body-2 text-medium-emphasis">Worst 10% of outcomes</td>
                  </tr>
                  <tr>
                    <td>25th Percentile</td>
                    <td class="text-right text-currency">{{ formatINR(monteCarlo.percentile25, true) }}</td>
                    <td class="text-body-2 text-medium-emphasis">Conservative estimate</td>
                  </tr>
                  <tr class="bg-primary-lighten-5">
                    <td class="font-weight-bold">50th Percentile (Median)</td>
                    <td class="text-right text-currency font-weight-bold">{{ formatINR(monteCarlo.percentile50, true) }}</td>
                    <td class="text-body-2">Most likely outcome</td>
                  </tr>
                  <tr>
                    <td>75th Percentile</td>
                    <td class="text-right text-currency">{{ formatINR(monteCarlo.percentile75, true) }}</td>
                    <td class="text-body-2 text-medium-emphasis">Optimistic estimate</td>
                  </tr>
                  <tr>
                    <td>90th Percentile (Best)</td>
                    <td class="text-right text-currency">{{ formatINR(monteCarlo.percentile90, true) }}</td>
                    <td class="text-body-2 text-medium-emphasis">Best 10% of outcomes</td>
                  </tr>
                </tbody>
              </v-table>
            </template>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </div>
</template>

<style scoped>
.report-preview {
  min-height: 400px;
}

.report-header {
  padding-bottom: 16px;
  border-bottom: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  margin-bottom: 24px;
}
</style>
