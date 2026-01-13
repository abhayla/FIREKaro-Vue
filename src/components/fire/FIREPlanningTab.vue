<script setup lang="ts">
import { ref, computed } from 'vue'
import GoalCard from '@/components/fire/GoalCard.vue'
import GoalForm from '@/components/fire/GoalForm.vue'
import FIRECalculator from '@/components/fire/FIRECalculator.vue'
import MonteCarloChart from '@/components/fire/MonteCarloChart.vue'
import ProjectionChart from '@/components/fire/ProjectionChart.vue'
import WithdrawalStrategySelector from '@/components/fire/WithdrawalStrategySelector.vue'
import {
  useGoals,
  useCreateGoal,
  useUpdateGoal,
  useDeleteGoal,
  useFIREMetrics,
  useMonteCarlo,
  useFIREProjections,
  useWithdrawalStrategies,
  formatINR,
  goalCategoryConfig,
  calculateRecommendedSIP
} from '@/composables/useFIRE'
import type { Goal, CreateGoalInput, WithdrawalStrategy } from '@/composables/useFIRE'

// Accordion state - Goals expanded by default
const expandedSections = ref<string[]>(['goals'])

// Goals data
const { data: goals, isLoading: goalsLoading } = useGoals()
const createGoalMutation = useCreateGoal()
const updateGoalMutation = useUpdateGoal()
const deleteGoalMutation = useDeleteGoal()

// Calculators data
const { data: metrics } = useFIREMetrics()
const { data: monteCarlo, isLoading: monteCarloLoading } = useMonteCarlo()

// Projections data
const { data: projections, isLoading: projectionsLoading } = useFIREProjections()

// Withdrawal data
const { data: strategies, isLoading: strategiesLoading } = useWithdrawalStrategies()

// Goals form state
const showForm = ref(false)
const editingGoal = ref<Goal | null>(null)

// Goals filters
const statusFilter = ref<string[]>([])
const categoryFilter = ref<string[]>([])

// Calculator tabs state
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
  const maxMonths = 600

  while (corpus < target && months < maxMonths) {
    corpus = corpus * (1 + rate) + monthly
    months++
  }

  return retirementCurrentAge.value + Math.floor(months / 12)
}

// Projections view state
const activeProjectionView = ref('projection')

// Sensitivity analysis data
const sensitivityVariables = [
  { name: 'Returns -2%', impact: '+4.5 years to FIRE', riskLevel: 'high', color: 'error' },
  { name: 'Inflation +2%', impact: '+3.2 years', riskLevel: 'medium', color: 'warning' },
  { name: 'Expenses +20%', impact: '+5.8 years', riskLevel: 'high', color: 'error' },
  { name: 'SIP -25%', impact: '+2.8 years', riskLevel: 'medium', color: 'warning' },
  { name: 'Healthcare +50K/yr', impact: '+1.5 years', riskLevel: 'medium', color: 'warning' },
  { name: 'Inheritance +20L', impact: '-2.1 years', riskLevel: 'positive', color: 'success' }
]

// Withdrawal strategy selection
const selectedStrategy = ref<WithdrawalStrategy | null>(null)
const handleStrategySelect = (strategy: WithdrawalStrategy) => {
  selectedStrategy.value = strategy
}

// Computed filtered goals
const filteredGoals = computed(() => {
  if (!goals.value) return []
  return goals.value.filter(goal => {
    if (statusFilter.value.length > 0 && !statusFilter.value.includes(goal.status)) return false
    if (categoryFilter.value.length > 0 && !categoryFilter.value.includes(goal.category)) return false
    return true
  })
})

// Goals stats
const totalTargetAmount = computed(() => goals.value?.reduce((sum, g) => sum + g.targetAmount, 0) || 0)
const totalCurrentAmount = computed(() => goals.value?.reduce((sum, g) => sum + g.currentAmount, 0) || 0)
const completedGoals = computed(() => goals.value?.filter(g => g.status === 'COMPLETED').length || 0)

// Category options for filter
const categoryOptions = Object.entries(goalCategoryConfig).map(([key, config]) => ({
  value: key,
  title: config.label
}))

// Goals actions
const openCreateForm = () => {
  editingGoal.value = null
  showForm.value = true
}

const handleEdit = (goal: Goal) => {
  editingGoal.value = goal
  showForm.value = true
}

const handleDelete = async (goal: Goal) => {
  if (confirm(`Are you sure you want to delete "${goal.goalName}"?`)) {
    await deleteGoalMutation.mutateAsync(goal.id)
  }
}

const handleViewDetails = (goal: Goal) => {
  console.log('View details for', goal.goalName)
}

const handleSave = async (data: CreateGoalInput) => {
  if (editingGoal.value) {
    await updateGoalMutation.mutateAsync({ id: editingGoal.value.id, data })
  } else {
    await createGoalMutation.mutateAsync(data)
  }
  showForm.value = false
  editingGoal.value = null
}

// Expand/Collapse all
const expandAll = () => {
  expandedSections.value = ['goals', 'calculators', 'projections', 'withdrawal']
}

const collapseAll = () => {
  expandedSections.value = []
}

// Initialize
calculateSIP()
</script>

<template>
  <div>
    <!-- Action Bar -->
    <div class="d-flex justify-space-between align-center mb-4">
      <div class="d-flex ga-2">
        <v-btn variant="text" size="small" @click="expandAll">
          <v-icon icon="mdi-unfold-more-horizontal" start />
          Expand All
        </v-btn>
        <v-btn variant="text" size="small" @click="collapseAll">
          <v-icon icon="mdi-unfold-less-horizontal" start />
          Collapse All
        </v-btn>
      </div>
    </div>

    <!-- Accordion Sections -->
    <v-expansion-panels v-model="expandedSections" multiple variant="accordion">
      <!-- Goals Section -->
      <v-expansion-panel value="goals">
        <v-expansion-panel-title>
          <div class="d-flex align-center">
            <v-icon icon="mdi-flag-checkered" class="mr-3" color="primary" />
            <div>
              <div class="font-weight-bold">Goals</div>
              <div class="text-caption text-medium-emphasis">
                {{ goals?.length || 0 }} goals | {{ completedGoals }} completed
              </div>
            </div>
          </div>
        </v-expansion-panel-title>
        <v-expansion-panel-text>
          <!-- Stats Row -->
          <v-row class="mb-4">
            <v-col cols="6" sm="3">
              <v-card variant="outlined" class="pa-3 text-center">
                <div class="text-caption text-medium-emphasis">Total Goals</div>
                <div class="text-h6 font-weight-bold">{{ goals?.length || 0 }}</div>
              </v-card>
            </v-col>
            <v-col cols="6" sm="3">
              <v-card variant="outlined" class="pa-3 text-center">
                <div class="text-caption text-medium-emphasis">Completed</div>
                <div class="text-h6 font-weight-bold text-success">{{ completedGoals }}</div>
              </v-card>
            </v-col>
            <v-col cols="6" sm="3">
              <v-card variant="outlined" class="pa-3 text-center">
                <div class="text-caption text-medium-emphasis">Total Target</div>
                <div class="text-h6 font-weight-bold text-currency">{{ formatINR(totalTargetAmount, true) }}</div>
              </v-card>
            </v-col>
            <v-col cols="6" sm="3">
              <v-card variant="outlined" class="pa-3 text-center">
                <div class="text-caption text-medium-emphasis">Saved So Far</div>
                <div class="text-h6 font-weight-bold text-primary text-currency">{{ formatINR(totalCurrentAmount, true) }}</div>
              </v-card>
            </v-col>
          </v-row>

          <!-- Filters & Actions -->
          <v-card variant="outlined" class="mb-4">
            <v-card-text class="py-2">
              <div class="d-flex flex-wrap align-center ga-4">
                <v-select
                  v-model="statusFilter"
                  :items="[
                    { title: 'On Track', value: 'on_track' },
                    { title: 'At Risk', value: 'at_risk' },
                    { title: 'Off Track', value: 'off_track' },
                    { title: 'Completed', value: 'completed' }
                  ]"
                  label="Status"
                  multiple
                  chips
                  closable-chips
                  variant="outlined"
                  density="compact"
                  hide-details
                  clearable
                  style="max-width: 250px"
                />
                <v-select
                  v-model="categoryFilter"
                  :items="categoryOptions"
                  item-value="value"
                  item-title="title"
                  label="Category"
                  multiple
                  chips
                  closable-chips
                  variant="outlined"
                  density="compact"
                  hide-details
                  clearable
                  style="max-width: 250px"
                />
                <v-spacer />
                <v-btn color="primary" prepend-icon="mdi-plus" @click="openCreateForm">
                  Add Goal
                </v-btn>
              </div>
            </v-card-text>
          </v-card>

          <!-- Loading State -->
          <div v-if="goalsLoading" class="text-center py-8">
            <v-progress-circular indeterminate color="primary" size="48" />
            <p class="text-body-2 text-medium-emphasis mt-4">Loading goals...</p>
          </div>

          <!-- Empty State -->
          <v-card v-else-if="!goals || goals.length === 0" variant="outlined" class="pa-8 text-center">
            <v-icon icon="mdi-target" size="64" color="fire-orange" class="mb-4" />
            <h3 class="text-h5 mb-2">Start Your FIRE Journey</h3>
            <p class="text-body-2 text-medium-emphasis mb-4">
              Track your path to Financial Independence by setting your first goal.
            </p>
            <v-btn color="primary" @click="openCreateForm">
              <v-icon icon="mdi-plus" class="mr-2" />
              Create Your First Goal
            </v-btn>
            <p class="text-caption text-medium-emphasis mt-4">
              <v-icon icon="mdi-lightbulb-outline" size="small" class="mr-1" />
              Tip: Start with your FIRE corpus goal to see your overall progress
            </p>
          </v-card>

          <!-- Goals Grid -->
          <v-row v-else>
            <v-col v-for="goal in filteredGoals" :key="goal.id" cols="12" sm="6" lg="4">
              <GoalCard
                :goal="goal"
                @edit="handleEdit"
                @delete="handleDelete"
                @view-details="handleViewDetails"
              />
            </v-col>
          </v-row>

          <!-- No Results -->
          <v-alert
            v-if="goals && goals.length > 0 && filteredGoals.length === 0"
            type="info"
            variant="tonal"
            class="mt-4"
          >
            No goals match your current filters.
            <v-btn variant="text" size="small" @click="statusFilter = []; categoryFilter = []">
              Clear all filters
            </v-btn>
          </v-alert>
        </v-expansion-panel-text>
      </v-expansion-panel>

      <!-- Calculators Section -->
      <v-expansion-panel value="calculators">
        <v-expansion-panel-title>
          <div class="d-flex align-center">
            <v-icon icon="mdi-calculator" class="mr-3" color="info" />
            <div>
              <div class="font-weight-bold">Calculators</div>
              <div class="text-caption text-medium-emphasis">
                FIRE Number, SIP, Retirement Date, Monte Carlo
              </div>
            </div>
          </div>
        </v-expansion-panel-title>
        <v-expansion-panel-text>
          <v-tabs v-model="activeCalculator" color="primary" class="mb-4">
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
            <!-- FIRE Calculator -->
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
              <v-card variant="flat">
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
                    </v-col>
                  </v-row>
                </v-card-text>
              </v-card>
            </v-window-item>

            <!-- SIP Calculator -->
            <v-window-item value="sip">
              <v-card variant="flat">
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

            <!-- Monte Carlo -->
            <v-window-item value="montecarlo">
              <v-skeleton-loader v-if="monteCarloLoading" type="card" />
              <MonteCarloChart v-else-if="monteCarlo" :data="monteCarlo" :loading="monteCarloLoading" />
            </v-window-item>
          </v-window>
        </v-expansion-panel-text>
      </v-expansion-panel>

      <!-- Projections Section -->
      <v-expansion-panel value="projections">
        <v-expansion-panel-title>
          <div class="d-flex align-center">
            <v-icon icon="mdi-chart-timeline" class="mr-3" color="success" />
            <div>
              <div class="font-weight-bold">Projections</div>
              <div class="text-caption text-medium-emphasis">
                100-Year Projection, Monte Carlo, Sensitivity Analysis
              </div>
            </div>
          </div>
        </v-expansion-panel-title>
        <v-expansion-panel-text>
          <v-tabs v-model="activeProjectionView" color="primary" class="mb-4">
            <v-tab value="projection">
              <v-icon icon="mdi-chart-timeline" start />
              100-Year Projection
            </v-tab>
            <v-tab value="montecarlo">
              <v-icon icon="mdi-chart-bell-curve" start />
              Monte Carlo
            </v-tab>
            <v-tab value="sensitivity">
              <v-icon icon="mdi-tune" start />
              Sensitivity Analysis
            </v-tab>
          </v-tabs>

          <v-window v-model="activeProjectionView">
            <!-- 100-Year Projection -->
            <v-window-item value="projection">
              <v-skeleton-loader v-if="projectionsLoading" type="card" />
              <ProjectionChart v-else-if="projections" :data="projections" :loading="projectionsLoading" />

              <!-- Key Insights -->
              <v-row class="mt-4">
                <v-col cols="12" md="4">
                  <v-card variant="outlined" class="pa-4 text-center h-100">
                    <v-icon icon="mdi-fire" color="fire-orange" size="40" class="mb-2" />
                    <div class="text-body-2 text-medium-emphasis">FIRE Year</div>
                    <div class="text-h4 font-weight-bold">{{ projections?.summary?.fireYear || '--' }}</div>
                    <div class="text-body-2 text-medium-emphasis">Age {{ projections?.summary?.targetRetirementAge || '--' }}</div>
                  </v-card>
                </v-col>
                <v-col cols="12" md="4">
                  <v-card variant="outlined" class="pa-4 text-center h-100">
                    <v-icon icon="mdi-piggy-bank" color="success" size="40" class="mb-2" />
                    <div class="text-body-2 text-medium-emphasis">Peak Corpus</div>
                    <div class="text-h4 font-weight-bold text-currency">
                      {{ formatINR(projections?.summary?.peakCorpusAmount ?? 0, true) }}
                    </div>
                  </v-card>
                </v-col>
                <v-col cols="12" md="4">
                  <v-card variant="outlined" class="pa-4 text-center h-100">
                    <v-icon icon="mdi-calendar-range" color="primary" size="40" class="mb-2" />
                    <div class="text-body-2 text-medium-emphasis">Life Events</div>
                    <div class="text-h4 font-weight-bold">{{ projections?.lifeEvents?.length || 0 }}</div>
                  </v-card>
                </v-col>
              </v-row>
            </v-window-item>

            <!-- Monte Carlo -->
            <v-window-item value="montecarlo">
              <v-skeleton-loader v-if="monteCarloLoading" type="card" />
              <MonteCarloChart v-else-if="monteCarlo" :data="monteCarlo" :loading="monteCarloLoading" />

              <v-card variant="outlined" class="mt-4">
                <v-card-title class="d-flex align-center">
                  <v-icon icon="mdi-information" class="mr-2" />
                  Understanding Monte Carlo
                </v-card-title>
                <v-card-text>
                  <v-row>
                    <v-col cols="12" md="6">
                      <div class="text-body-2 mb-3">
                        <strong>What is Monte Carlo Simulation?</strong><br>
                        Monte Carlo simulations run thousands of possible market scenarios
                        using historical data to estimate the probability of your plan succeeding.
                      </div>
                    </v-col>
                    <v-col cols="12" md="6">
                      <v-alert type="info" variant="tonal" density="compact">
                        <div class="text-body-2">
                          <strong>Interpreting Percentiles:</strong>
                          <ul class="mt-2 mb-0">
                            <li><strong>90th:</strong> Best 10% of outcomes</li>
                            <li><strong>50th:</strong> Median outcome</li>
                            <li><strong>10th:</strong> Worst 10% of outcomes</li>
                          </ul>
                        </div>
                      </v-alert>
                    </v-col>
                  </v-row>
                </v-card-text>
              </v-card>
            </v-window-item>

            <!-- Sensitivity Analysis -->
            <v-window-item value="sensitivity">
              <v-card variant="flat">
                <v-card-text>
                  <v-alert type="info" variant="tonal" class="mb-4">
                    See how changes to key variables affect your FIRE timeline.
                  </v-alert>

                  <v-table density="compact">
                    <thead>
                      <tr>
                        <th>Variable Change</th>
                        <th>Impact on FIRE</th>
                        <th>Risk Level</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="variable in sensitivityVariables" :key="variable.name">
                        <td class="font-weight-medium">{{ variable.name }}</td>
                        <td class="text-currency">{{ variable.impact }}</td>
                        <td>
                          <v-chip :color="variable.color" size="small" :variant="variable.riskLevel === 'positive' ? 'elevated' : 'tonal'">
                            {{ variable.riskLevel.toUpperCase() }}
                          </v-chip>
                        </td>
                      </tr>
                    </tbody>
                  </v-table>

                  <v-divider class="my-4" />

                  <v-row>
                    <v-col cols="12" md="4">
                      <v-card variant="outlined" class="pa-3">
                        <div class="d-flex align-center mb-2">
                          <v-icon icon="mdi-alert" color="error" class="mr-2" />
                          <span class="font-weight-bold">Highest Risk</span>
                        </div>
                        <div class="text-body-2">
                          Expense inflation is your biggest risk. A 20% increase delays FIRE by nearly 6 years.
                        </div>
                      </v-card>
                    </v-col>
                    <v-col cols="12" md="4">
                      <v-card variant="outlined" class="pa-3">
                        <div class="d-flex align-center mb-2">
                          <v-icon icon="mdi-shield" color="primary" class="mr-2" />
                          <span class="font-weight-bold">Best Protection</span>
                        </div>
                        <div class="text-body-2">
                          Maintaining your savings rate is crucial. Even small reductions compound significantly.
                        </div>
                      </v-card>
                    </v-col>
                    <v-col cols="12" md="4">
                      <v-card variant="outlined" class="pa-3">
                        <div class="d-flex align-center mb-2">
                          <v-icon icon="mdi-lightbulb" color="warning" class="mr-2" />
                          <span class="font-weight-bold">Opportunity</span>
                        </div>
                        <div class="text-body-2">
                          Side income or inheritance can dramatically accelerate your timeline.
                        </div>
                      </v-card>
                    </v-col>
                  </v-row>
                </v-card-text>
              </v-card>
            </v-window-item>
          </v-window>
        </v-expansion-panel-text>
      </v-expansion-panel>

      <!-- Withdrawal Planning Section -->
      <v-expansion-panel value="withdrawal">
        <v-expansion-panel-title>
          <div class="d-flex align-center">
            <v-icon icon="mdi-cash-sync" class="mr-3" color="warning" />
            <div>
              <div class="font-weight-bold">Withdrawal Planning</div>
              <div class="text-caption text-medium-emphasis">
                SWR, Bucket Strategy, Sequence Risk
              </div>
            </div>
          </div>
        </v-expansion-panel-title>
        <v-expansion-panel-text>
          <!-- Strategy Selector -->
          <v-skeleton-loader v-if="strategiesLoading" type="card" />
          <WithdrawalStrategySelector
            v-else-if="strategies"
            :strategies="strategies"
            :loading="strategiesLoading"
            @select="handleStrategySelect"
          />

          <!-- SWR Calculator -->
          <v-card variant="outlined" class="mt-6">
            <v-card-title class="d-flex align-center">
              <v-icon icon="mdi-calculator" class="mr-2" />
              Safe Withdrawal Rate (SWR) Calculator
            </v-card-title>
            <v-card-text>
              <v-row>
                <v-col cols="12" md="6">
                  <v-table density="compact">
                    <thead>
                      <tr>
                        <th>SWR</th>
                        <th>Corpus Required</th>
                        <th>Success Rate</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td class="font-weight-bold">3.0%</td>
                        <td class="text-currency">{{ formatINR(1000000 / 0.03, true) }}</td>
                        <td><v-chip size="x-small" color="success">100%</v-chip></td>
                      </tr>
                      <tr>
                        <td class="font-weight-bold">3.5%</td>
                        <td class="text-currency">{{ formatINR(1000000 / 0.035, true) }}</td>
                        <td><v-chip size="x-small" color="success">98%</v-chip></td>
                      </tr>
                      <tr class="bg-primary-lighten-5">
                        <td class="font-weight-bold">4.0% (Standard)</td>
                        <td class="text-currency">{{ formatINR(1000000 / 0.04, true) }}</td>
                        <td><v-chip size="x-small" color="success">95%</v-chip></td>
                      </tr>
                      <tr>
                        <td class="font-weight-bold">4.5%</td>
                        <td class="text-currency">{{ formatINR(1000000 / 0.045, true) }}</td>
                        <td><v-chip size="x-small" color="warning">87%</v-chip></td>
                      </tr>
                      <tr>
                        <td class="font-weight-bold">5.0%</td>
                        <td class="text-currency">{{ formatINR(1000000 / 0.05, true) }}</td>
                        <td><v-chip size="x-small" color="warning">75%</v-chip></td>
                      </tr>
                    </tbody>
                  </v-table>
                  <div class="text-caption text-medium-emphasis mt-2">
                    * Based on ₹10L/year annual expenses
                  </div>
                </v-col>
                <v-col cols="12" md="6">
                  <v-sheet rounded class="pa-4" color="surface-variant">
                    <div class="text-subtitle-2 mb-3">The 4% Rule</div>
                    <div class="text-body-2 mb-3">
                      Withdraw 4% of your portfolio in year one, then adjust for inflation each year.
                    </div>
                    <div class="text-body-2">
                      <strong>India Note:</strong> Due to higher inflation (6-7%), consider a more
                      conservative 3-3.5% SWR for Indian FIRE.
                    </div>
                  </v-sheet>
                </v-col>
              </v-row>
            </v-card-text>
          </v-card>

          <!-- Strategy Recommendations -->
          <v-card variant="outlined" class="mt-4">
            <v-card-title class="d-flex align-center">
              <v-icon icon="mdi-lightbulb" class="mr-2" color="warning" />
              Which Strategy is Right for You?
            </v-card-title>
            <v-card-text>
              <v-row>
                <v-col cols="12" sm="6" md="3">
                  <v-card variant="tonal" class="h-100">
                    <v-card-title class="text-body-1">
                      <v-icon icon="mdi-percent" color="primary" class="mr-2" />
                      4% Rule
                    </v-card-title>
                    <v-card-text class="text-body-2">
                      <strong>Best for:</strong> Simplicity seekers<br>
                      <strong>Pros:</strong> Easy, predictable<br>
                      <strong>Cons:</strong> Doesn't adapt
                    </v-card-text>
                  </v-card>
                </v-col>
                <v-col cols="12" sm="6" md="3">
                  <v-card variant="tonal" class="h-100">
                    <v-card-title class="text-body-1">
                      <v-icon icon="mdi-bucket-outline" color="success" class="mr-2" />
                      Bucket Strategy
                    </v-card-title>
                    <v-card-text class="text-body-2">
                      <strong>Best for:</strong> Risk-averse<br>
                      <strong>Pros:</strong> Reduces sequence risk<br>
                      <strong>Cons:</strong> More management
                    </v-card-text>
                  </v-card>
                </v-col>
                <v-col cols="12" sm="6" md="3">
                  <v-card variant="tonal" class="h-100">
                    <v-card-title class="text-body-1">
                      <v-icon icon="mdi-chart-line-variant" color="info" class="mr-2" />
                      VPW
                    </v-card-title>
                    <v-card-text class="text-body-2">
                      <strong>Best for:</strong> Flexible spenders<br>
                      <strong>Pros:</strong> Never depletes<br>
                      <strong>Cons:</strong> Variable income
                    </v-card-text>
                  </v-card>
                </v-col>
                <v-col cols="12" sm="6" md="3">
                  <v-card variant="tonal" class="h-100">
                    <v-card-title class="text-body-1">
                      <v-icon icon="mdi-shield-check" color="warning" class="mr-2" />
                      Guyton-Klinger
                    </v-card-title>
                    <v-card-text class="text-body-2">
                      <strong>Best for:</strong> Maximizers<br>
                      <strong>Pros:</strong> Higher initial<br>
                      <strong>Cons:</strong> Complex rules
                    </v-card-text>
                  </v-card>
                </v-col>
              </v-row>
            </v-card-text>
          </v-card>
        </v-expansion-panel-text>
      </v-expansion-panel>
    </v-expansion-panels>

    <!-- Goal Form Dialog -->
    <GoalForm v-model="showForm" :goal="editingGoal" @save="handleSave" />
  </div>
</template>
