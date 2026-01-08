<script setup lang="ts">
import { ref, computed } from 'vue'
import SectionHeader from '@/components/shared/SectionHeader.vue'
import ProjectionChart from '@/components/fire/ProjectionChart.vue'
import MonteCarloChart from '@/components/fire/MonteCarloChart.vue'
import { useFIREProjections, useMonteCarlo, formatINR } from '@/composables/useFIRE'

const tabs = [
  { title: 'FIRE Dashboard', route: '/dashboard/fire-goals' },
  { title: 'Calculators', route: '/dashboard/fire-goals/calculators' },
  { title: 'Goals', route: '/dashboard/fire-goals/goals' },
  { title: 'Projections', route: '/dashboard/fire-goals/projections' },
  { title: 'Withdrawal', route: '/dashboard/fire-goals/withdrawal' },
  { title: 'Reports', route: '/dashboard/fire-goals/reports' },
]

const { data: projections, isLoading: projectionsLoading } = useFIREProjections()
const { data: monteCarlo, isLoading: monteCarloLoading } = useMonteCarlo()

// Active view
const activeView = ref('projection')

// Sensitivity analysis data
const sensitivityVariables = [
  {
    name: 'Returns -2%',
    impact: '+4.5 years to FIRE',
    riskLevel: 'high',
    color: 'error'
  },
  {
    name: 'Inflation +2%',
    impact: '+3.2 years',
    riskLevel: 'medium',
    color: 'warning'
  },
  {
    name: 'Expenses +20%',
    impact: '+5.8 years',
    riskLevel: 'high',
    color: 'error'
  },
  {
    name: 'SIP -25%',
    impact: '+2.8 years',
    riskLevel: 'medium',
    color: 'warning'
  },
  {
    name: 'Healthcare +50K/yr',
    impact: '+1.5 years',
    riskLevel: 'medium',
    color: 'warning'
  },
  {
    name: 'Inheritance +20L',
    impact: '-2.1 years',
    riskLevel: 'positive',
    color: 'success'
  }
]
</script>

<template>
  <div>
    <SectionHeader
      title="FIRE & Goals"
      subtitle="100-Year Projections"
      icon="mdi-fire"
      :tabs="tabs"
    />

    <!-- View Tabs -->
    <v-tabs v-model="activeView" color="primary" class="mb-6">
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

    <v-window v-model="activeView">
      <!-- 100-Year Projection -->
      <v-window-item value="projection">
        <ProjectionChart
          v-if="projections"
          :data="projections"
          :loading="projectionsLoading"
        />
        <v-skeleton-loader v-else type="card" />

        <!-- Key Insights -->
        <v-row class="mt-4">
          <v-col cols="12" md="4">
            <v-card class="pa-4 text-center h-100">
              <v-icon icon="mdi-fire" color="fire-orange" size="40" class="mb-2" />
              <div class="text-body-2 text-medium-emphasis">FIRE Year</div>
              <div class="text-h4 font-weight-bold">{{ projections?.fireYear || '--' }}</div>
              <div class="text-body-2 text-medium-emphasis">Age {{ projections?.fireAge || '--' }}</div>
            </v-card>
          </v-col>
          <v-col cols="12" md="4">
            <v-card class="pa-4 text-center h-100">
              <v-icon icon="mdi-piggy-bank" color="success" size="40" class="mb-2" />
              <div class="text-body-2 text-medium-emphasis">Peak Corpus</div>
              <div class="text-h4 font-weight-bold text-currency">
                {{ formatINR(Math.max(...(projections?.corpus || [0])), true) }}
              </div>
              <div class="text-body-2 text-medium-emphasis">Projected Maximum</div>
            </v-card>
          </v-col>
          <v-col cols="12" md="4">
            <v-card class="pa-4 text-center h-100">
              <v-icon icon="mdi-calendar-range" color="primary" size="40" class="mb-2" />
              <div class="text-body-2 text-medium-emphasis">Life Events</div>
              <div class="text-h4 font-weight-bold">{{ projections?.lifeEvents.length || 0 }}</div>
              <div class="text-body-2 text-medium-emphasis">Planned Events</div>
            </v-card>
          </v-col>
        </v-row>
      </v-window-item>

      <!-- Monte Carlo -->
      <v-window-item value="montecarlo">
        <MonteCarloChart
          v-if="monteCarlo"
          :data="monteCarlo"
          :loading="monteCarloLoading"
        />
        <v-skeleton-loader v-else type="card" />

        <!-- Monte Carlo Explanation -->
        <v-card class="mt-4">
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
                <div class="text-body-2">
                  <strong>What's a "good" success rate?</strong><br>
                  Most financial planners recommend targeting 80-95% success rate.
                  Higher is better, but 100% may mean you're being too conservative.
                </div>
              </v-col>
              <v-col cols="12" md="6">
                <v-alert type="info" variant="tonal" density="compact">
                  <div class="text-body-2">
                    <strong>Interpreting Percentiles:</strong>
                    <ul class="mt-2 mb-0">
                      <li><strong>90th percentile:</strong> Best 10% of outcomes</li>
                      <li><strong>50th percentile:</strong> Median/expected outcome</li>
                      <li><strong>10th percentile:</strong> Worst 10% of outcomes</li>
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
        <v-card>
          <v-card-title class="d-flex align-center">
            <v-icon icon="mdi-tune" class="mr-2" />
            Sensitivity Analysis
            <v-spacer />
            <v-chip size="small" color="info">What breaks your plan?</v-chip>
          </v-card-title>
          <v-card-text>
            <v-alert type="info" variant="tonal" class="mb-4">
              <div class="text-body-2">
                See how changes to key variables affect your FIRE timeline.
                Understanding these sensitivities helps you build a more robust plan.
              </div>
            </v-alert>

            <v-table>
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
                    <v-chip
                      :color="variable.color"
                      size="small"
                      :variant="variable.riskLevel === 'positive' ? 'elevated' : 'tonal'"
                    >
                      {{ variable.riskLevel.toUpperCase() }}
                    </v-chip>
                  </td>
                </tr>
              </tbody>
            </v-table>

            <v-divider class="my-4" />

            <div class="text-subtitle-2 mb-3">Key Takeaways</div>
            <v-row>
              <v-col cols="12" md="4">
                <v-card variant="outlined" class="pa-3">
                  <div class="d-flex align-center mb-2">
                    <v-icon icon="mdi-alert" color="error" class="mr-2" />
                    <span class="font-weight-bold">Highest Risk</span>
                  </div>
                  <div class="text-body-2">
                    Expense inflation is your biggest risk. A 20% increase
                    in expenses delays FIRE by nearly 6 years.
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
                    Maintaining your savings rate is crucial. Even small
                    reductions compound into significant delays.
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
                    Side income or inheritance can dramatically accelerate
                    your timeline. Keep an eye out for opportunities.
                  </div>
                </v-card>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>
      </v-window-item>
    </v-window>
  </div>
</template>
