<script setup lang="ts">
import { computed } from 'vue'
import SectionHeader from '@/components/shared/SectionHeader.vue'
import FamilyToggle from '@/components/shared/FamilyToggle.vue'
import HealthScoreGauge from '@/components/financial-health/HealthScoreGauge.vue'
import HealthFactorCard from '@/components/financial-health/HealthFactorCard.vue'
import { useFinancialHealthScore, useNetWorth, useCashFlow, useEmergencyFund, formatINR } from '@/composables/useFinancialHealth'

const tabs = [
  { title: 'Health Score', route: '/dashboard/financial-health' },
  { title: 'Net Worth', route: '/dashboard/financial-health/net-worth' },
  { title: 'Cash Flow', route: '/dashboard/financial-health/cash-flow' },
  { title: 'Banking', route: '/dashboard/financial-health/banking' },
  { title: 'Emergency Fund', route: '/dashboard/financial-health/emergency-fund' },
  { title: 'Reports', route: '/dashboard/financial-health/reports' },
]

const { data: healthScore, isLoading: healthLoading, isError: healthError } = useFinancialHealthScore()
const { data: netWorth, isLoading: netWorthLoading } = useNetWorth()
const { data: cashFlow, isLoading: cashFlowLoading } = useCashFlow()
const { data: emergencyFund, isLoading: efLoading } = useEmergencyFund()

const isLoading = computed(() => healthLoading.value || netWorthLoading.value || cashFlowLoading.value || efLoading.value)

const quickLinks = [
  { title: 'Net Worth', route: '/dashboard/financial-health/net-worth', icon: 'mdi-chart-line', color: 'primary' },
  { title: 'Cash Flow', route: '/dashboard/financial-health/cash-flow', icon: 'mdi-swap-vertical', color: 'success' },
  { title: 'Banking', route: '/dashboard/financial-health/banking', icon: 'mdi-bank', color: 'info' },
  { title: 'Emergency Fund', route: '/dashboard/financial-health/emergency-fund', icon: 'mdi-lifebuoy', color: 'warning' },
  { title: 'Reports', route: '/dashboard/financial-health/reports', icon: 'mdi-file-chart', color: 'secondary' },
]
</script>

<template>
  <div>
    <SectionHeader
      title="Financial Health"
      subtitle="Your overall financial health score and key metrics"
      icon="mdi-heart-pulse"
      :tabs="tabs"
    />
    <FamilyToggle class="mb-6" />

    <!-- Loading State -->
    <div v-if="isLoading" class="text-center py-8">
      <v-progress-circular indeterminate color="primary" size="48" />
      <p class="text-body-2 text-medium-emphasis mt-4">Loading your financial health data...</p>
    </div>

    <!-- Error State -->
    <v-alert v-else-if="healthError" type="error" variant="tonal" class="mb-6">
      <v-icon icon="mdi-alert-circle" class="mr-2" />
      Failed to load financial health data. Please try again later.
    </v-alert>

    <!-- Main Content -->
    <template v-else-if="healthScore">
      <v-row>
        <!-- Health Score Card -->
        <v-col cols="12" md="4">
          <v-card class="h-100">
            <v-card-text class="d-flex flex-column align-center py-6">
              <div class="text-subtitle-1 text-medium-emphasis mb-4">Financial Health Score</div>
              <HealthScoreGauge
                :score="healthScore.overallScore"
                size="large"
                :show-trend="true"
                :trend="healthScore.trend"
                :trend-value="Math.round(healthScore.overallScore - healthScore.lastMonthScore)"
              />
            </v-card-text>
          </v-card>
        </v-col>

        <!-- Key Metrics -->
        <v-col cols="12" md="8">
          <v-row>
            <v-col cols="6" sm="3">
              <v-card class="pa-4">
                <div class="text-body-2 text-medium-emphasis">Net Worth</div>
                <div class="text-h5 font-weight-bold">
                  {{ netWorth ? formatINR(netWorth.netWorth, true) : '---' }}
                </div>
                <div v-if="netWorth" class="text-caption" :class="netWorth.yearlyChangePercent >= 0 ? 'text-success' : 'text-error'">
                  <v-icon
                    :icon="netWorth.yearlyChangePercent >= 0 ? 'mdi-trending-up' : 'mdi-trending-down'"
                    size="x-small"
                  />
                  {{ netWorth.yearlyChangePercent >= 0 ? '+' : '' }}{{ netWorth.yearlyChangePercent.toFixed(1) }}% YoY
                </div>
              </v-card>
            </v-col>

            <v-col cols="6" sm="3">
              <v-card class="pa-4">
                <div class="text-body-2 text-medium-emphasis">Cash Flow</div>
                <div class="text-h5 font-weight-bold" :class="cashFlow && cashFlow.netCashFlow >= 0 ? 'text-success' : 'text-error'">
                  {{ cashFlow ? formatINR(cashFlow.netCashFlow, true) : '---' }}
                </div>
                <div class="text-caption text-medium-emphasis">This month</div>
              </v-card>
            </v-col>

            <v-col cols="6" sm="3">
              <v-card class="pa-4">
                <div class="text-body-2 text-medium-emphasis">Savings Rate</div>
                <div class="text-h5 font-weight-bold">
                  {{ cashFlow ? cashFlow.savingsRate.toFixed(0) + '%' : '---' }}
                </div>
                <div class="text-caption text-medium-emphasis">Target: 30%</div>
              </v-card>
            </v-col>

            <v-col cols="6" sm="3">
              <v-card class="pa-4">
                <div class="text-body-2 text-medium-emphasis">Emergency Fund</div>
                <div class="text-h5 font-weight-bold">
                  {{ emergencyFund ? emergencyFund.percentComplete + '%' : '---' }}
                </div>
                <div class="text-caption text-medium-emphasis">
                  {{ emergencyFund && emergencyFund.monthlyExpenses > 0 ? `${Math.floor(emergencyFund.currentAmount / emergencyFund.monthlyExpenses)} of ${emergencyFund.targetMonths} mo` : `0 of ${emergencyFund?.targetMonths || 6} mo` }}
                </div>
              </v-card>
            </v-col>
          </v-row>

          <!-- Health Factors -->
          <v-row class="mt-2">
            <v-col v-for="factor in healthScore.factors" :key="factor.name" cols="12" sm="6">
              <HealthFactorCard :factor="factor" />
            </v-col>
          </v-row>
        </v-col>
      </v-row>

      <!-- Alerts & Recommendations -->
      <v-card class="mt-6">
        <v-card-title class="d-flex align-center">
          <v-icon icon="mdi-bell-outline" class="mr-2" />
          Alerts & Recommendations
        </v-card-title>
        <v-card-text>
          <v-list density="compact">
            <v-list-item
              v-for="(alert, index) in healthScore.alerts"
              :key="index"
              :prepend-icon="alert.type === 'success' ? 'mdi-check-circle' : alert.type === 'warning' ? 'mdi-alert' : 'mdi-information'"
              :class="`text-${alert.type === 'success' ? 'success' : alert.type === 'warning' ? 'warning' : 'info'}`"
            >
              <v-list-item-title>{{ alert.message }}</v-list-item-title>
            </v-list-item>
          </v-list>
        </v-card-text>
      </v-card>

      <!-- Quick Links -->
      <v-card class="mt-6">
        <v-card-title>Quick Links</v-card-title>
        <v-card-text>
          <v-row>
            <v-col v-for="link in quickLinks" :key="link.route" cols="6" sm="4" md="2">
              <v-btn
                :to="link.route"
                :color="link.color"
                variant="tonal"
                block
                class="py-6"
              >
                <div class="d-flex flex-column align-center">
                  <v-icon :icon="link.icon" size="24" class="mb-1" />
                  <span class="text-caption">{{ link.title }}</span>
                </div>
              </v-btn>
            </v-col>
          </v-row>
        </v-card-text>
      </v-card>
    </template>
  </div>
</template>
