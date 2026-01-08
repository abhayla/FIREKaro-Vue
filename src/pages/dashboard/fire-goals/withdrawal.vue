<script setup lang="ts">
import { ref, computed } from 'vue'
import SectionHeader from '@/components/shared/SectionHeader.vue'
import WithdrawalStrategySelector from '@/components/fire/WithdrawalStrategySelector.vue'
import { useWithdrawalStrategies, formatINR } from '@/composables/useFIRE'
import type { WithdrawalStrategy } from '@/composables/useFIRE'
import { chartColors } from '@/utils/chartTheme'

const tabs = [
  { title: 'FIRE Dashboard', route: '/dashboard/fire-goals' },
  { title: 'Calculators', route: '/dashboard/fire-goals/calculators' },
  { title: 'Goals', route: '/dashboard/fire-goals/goals' },
  { title: 'Projections', route: '/dashboard/fire-goals/projections' },
  { title: 'Withdrawal', route: '/dashboard/fire-goals/withdrawal' },
  { title: 'Reports', route: '/dashboard/fire-goals/reports' },
]

const { data: strategies, isLoading } = useWithdrawalStrategies()

const selectedStrategy = ref<WithdrawalStrategy | null>(null)

const handleStrategySelect = (strategy: WithdrawalStrategy) => {
  selectedStrategy.value = strategy
}

// Sequence of Returns Risk Education
const sequenceRiskData = {
  goodSequence: {
    returns: [15, 12, 18, 10, 8, 14, 11, 9, 13, 16],
    endValue: 85000000,
    label: 'Bull Market First'
  },
  badSequence: {
    returns: [-10, -8, -5, 8, 10, 15, 18, 20, 22, 12],
    endValue: 0,
    label: 'Bear Market First'
  }
}
</script>

<template>
  <div>
    <SectionHeader
      title="FIRE & Goals"
      subtitle="Withdrawal Strategies"
      icon="mdi-fire"
      :tabs="tabs"
    />

    <!-- Loading State -->
    <v-skeleton-loader v-if="isLoading" type="card" />

    <!-- Strategy Selector -->
    <WithdrawalStrategySelector
      v-else-if="strategies"
      :strategies="strategies"
      :loading="isLoading"
      @select="handleStrategySelect"
    />

    <!-- Sequence of Returns Risk -->
    <v-card class="mt-6">
      <v-card-title class="d-flex align-center">
        <v-icon icon="mdi-alert-circle" class="mr-2" color="warning" />
        Sequence of Returns Risk
        <v-spacer />
        <v-chip size="small" color="warning" variant="tonal">Critical Concept</v-chip>
      </v-card-title>
      <v-card-text>
        <v-alert type="warning" variant="tonal" class="mb-4">
          <div class="text-body-1 font-weight-bold mb-2">
            77% of your retirement outcome is determined by the first 10 years of returns.
          </div>
          <div class="text-body-2">
            Even with the same average returns, the order matters dramatically.
            A bear market early in retirement can devastate your portfolio.
          </div>
        </v-alert>

        <v-row>
          <!-- Good Sequence -->
          <v-col cols="12" md="6">
            <v-card variant="outlined" color="success">
              <v-card-title class="text-success">
                <v-icon icon="mdi-check-circle" class="mr-2" />
                {{ sequenceRiskData.goodSequence.label }}
              </v-card-title>
              <v-card-text>
                <div class="d-flex flex-wrap ga-1 mb-3">
                  <v-chip
                    v-for="(ret, i) in sequenceRiskData.goodSequence.returns"
                    :key="i"
                    size="small"
                    :color="ret >= 0 ? 'success' : 'error'"
                    variant="tonal"
                  >
                    {{ ret > 0 ? '+' : '' }}{{ ret }}%
                  </v-chip>
                </div>
                <div class="text-center">
                  <div class="text-body-2 text-medium-emphasis">Ending Value at Age 85</div>
                  <div class="text-h4 font-weight-bold text-success text-currency">
                    {{ formatINR(sequenceRiskData.goodSequence.endValue, true) }}
                  </div>
                  <v-icon icon="mdi-check-decagram" color="success" size="32" class="mt-2" />
                </div>
              </v-card-text>
            </v-card>
          </v-col>

          <!-- Bad Sequence -->
          <v-col cols="12" md="6">
            <v-card variant="outlined" color="error">
              <v-card-title class="text-error">
                <v-icon icon="mdi-close-circle" class="mr-2" />
                {{ sequenceRiskData.badSequence.label }}
              </v-card-title>
              <v-card-text>
                <div class="d-flex flex-wrap ga-1 mb-3">
                  <v-chip
                    v-for="(ret, i) in sequenceRiskData.badSequence.returns"
                    :key="i"
                    size="small"
                    :color="ret >= 0 ? 'success' : 'error'"
                    variant="tonal"
                  >
                    {{ ret > 0 ? '+' : '' }}{{ ret }}%
                  </v-chip>
                </div>
                <div class="text-center">
                  <div class="text-body-2 text-medium-emphasis">Portfolio Depleted at Age</div>
                  <div class="text-h4 font-weight-bold text-error">72</div>
                  <v-icon icon="mdi-alert-circle" color="error" size="32" class="mt-2" />
                </div>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>

        <v-alert type="info" variant="tonal" class="mt-4">
          <div class="text-body-2">
            <strong>How the Bucket Strategy helps:</strong>
            By keeping 2-3 years of expenses in cash and bonds, you avoid selling
            equities during a down market. This significantly reduces sequence risk.
          </div>
        </v-alert>
      </v-card-text>
    </v-card>

    <!-- Safe Withdrawal Rate Calculator -->
    <v-card class="mt-6">
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
                  <th>Historical Success</th>
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
              * Based on ₹10L/year annual expenses. Success = not running out of money in 30 years.
            </div>
          </v-col>

          <v-col cols="12" md="6">
            <v-sheet rounded class="pa-4" color="surface-variant">
              <div class="text-subtitle-2 mb-3">The 4% Rule Explained</div>
              <div class="text-body-2 mb-3">
                The 4% rule states you can withdraw 4% of your portfolio in year one,
                then adjust for inflation each year, with a very high probability of
                your money lasting 30+ years.
              </div>
              <div class="text-body-2 mb-3">
                <strong>Origin:</strong> William Bengen's 1994 research, later validated
                by the Trinity Study.
              </div>
              <div class="text-body-2">
                <strong>India Consideration:</strong> Due to higher inflation (6-7%),
                some experts recommend a more conservative 3-3.5% SWR for Indian FIRE.
              </div>
            </v-sheet>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <!-- Strategy Recommendations -->
    <v-card class="mt-6">
      <v-card-title class="d-flex align-center">
        <v-icon icon="mdi-lightbulb" class="mr-2" color="warning" />
        Which Strategy is Right for You?
      </v-card-title>
      <v-card-text>
        <v-row>
          <v-col cols="12" sm="6" md="3">
            <v-card variant="outlined" class="h-100">
              <v-card-title class="text-body-1">
                <v-icon icon="mdi-percent" color="primary" class="mr-2" />
                4% Rule
              </v-card-title>
              <v-card-text class="text-body-2">
                <strong>Best for:</strong> Simplicity seekers<br>
                <strong>Pros:</strong> Easy to implement, predictable income<br>
                <strong>Cons:</strong> Doesn't adapt to market conditions
              </v-card-text>
            </v-card>
          </v-col>
          <v-col cols="12" sm="6" md="3">
            <v-card variant="outlined" class="h-100">
              <v-card-title class="text-body-1">
                <v-icon icon="mdi-bucket-outline" color="success" class="mr-2" />
                Bucket Strategy
              </v-card-title>
              <v-card-text class="text-body-2">
                <strong>Best for:</strong> Risk-averse retirees<br>
                <strong>Pros:</strong> Reduces sequence risk, psychological comfort<br>
                <strong>Cons:</strong> Requires more management
              </v-card-text>
            </v-card>
          </v-col>
          <v-col cols="12" sm="6" md="3">
            <v-card variant="outlined" class="h-100">
              <v-card-title class="text-body-1">
                <v-icon icon="mdi-chart-line-variant" color="info" class="mr-2" />
                VPW
              </v-card-title>
              <v-card-text class="text-body-2">
                <strong>Best for:</strong> Flexible spenders<br>
                <strong>Pros:</strong> Never depletes, adjusts to market<br>
                <strong>Cons:</strong> Variable income year to year
              </v-card-text>
            </v-card>
          </v-col>
          <v-col cols="12" sm="6" md="3">
            <v-card variant="outlined" class="h-100">
              <v-card-title class="text-body-1">
                <v-icon icon="mdi-shield-check" color="warning" class="mr-2" />
                Guyton-Klinger
              </v-card-title>
              <v-card-text class="text-body-2">
                <strong>Best for:</strong> Maximizers<br>
                <strong>Pros:</strong> Higher initial withdrawal<br>
                <strong>Cons:</strong> Complex rules, may require cuts
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>
  </div>
</template>
