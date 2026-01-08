<script setup lang="ts">
import { ref } from 'vue'
import SectionHeader from '@/components/shared/SectionHeader.vue'
import FamilyToggle from '@/components/shared/FamilyToggle.vue'
import EmergencyFundProgress from '@/components/financial-health/EmergencyFundProgress.vue'
import EmergencyFundCalculator from '@/components/financial-health/EmergencyFundCalculator.vue'
import { useEmergencyFund, useCashFlow, formatINR } from '@/composables/useFinancialHealth'

const tabs = [
  { title: 'Health Score', route: '/dashboard/financial-health' },
  { title: 'Net Worth', route: '/dashboard/financial-health/net-worth' },
  { title: 'Cash Flow', route: '/dashboard/financial-health/cash-flow' },
  { title: 'Banking', route: '/dashboard/financial-health/banking' },
  { title: 'Emergency Fund', route: '/dashboard/financial-health/emergency-fund' },
  { title: 'Reports', route: '/dashboard/financial-health/reports' },
]

const { data: emergencyFund, isLoading, isError } = useEmergencyFund()
const { data: cashFlow } = useCashFlow()

const activeTab = ref(0)

const tabs2 = [
  { title: 'Current Status', icon: 'mdi-chart-donut' },
  { title: 'Calculator', icon: 'mdi-calculator' },
]
</script>

<template>
  <div>
    <SectionHeader
      title="Financial Health"
      subtitle="Build and track your emergency fund"
      icon="mdi-heart-pulse"
      :tabs="tabs"
    />
    <FamilyToggle class="mb-6" />

    <!-- Quick Stats -->
    <v-row class="mb-6">
      <v-col cols="12" sm="4">
        <v-card class="pa-4">
          <div class="text-body-2 text-medium-emphasis">Current Fund</div>
          <div class="text-h4 font-weight-bold text-primary">
            {{ emergencyFund ? formatINR(emergencyFund.currentAmount, true) : '---' }}
          </div>
          <div class="text-caption text-medium-emphasis">
            {{ emergencyFund ? `${Math.floor(emergencyFund.currentAmount / emergencyFund.monthlyExpenses)} months covered` : '' }}
          </div>
        </v-card>
      </v-col>

      <v-col cols="12" sm="4">
        <v-card class="pa-4">
          <div class="text-body-2 text-medium-emphasis">Target Amount</div>
          <div class="text-h4 font-weight-bold">
            {{ emergencyFund ? formatINR(emergencyFund.targetAmount, true) : '---' }}
          </div>
          <div class="text-caption text-medium-emphasis">
            {{ emergencyFund ? `${emergencyFund.targetMonths} months of expenses` : '' }}
          </div>
        </v-card>
      </v-col>

      <v-col cols="12" sm="4">
        <v-card class="pa-4">
          <div class="text-body-2 text-medium-emphasis">Monthly Expenses</div>
          <div class="text-h4 font-weight-bold">
            {{ emergencyFund ? formatINR(emergencyFund.monthlyExpenses, true) : '---' }}
          </div>
          <div class="text-caption text-medium-emphasis">Average monthly</div>
        </v-card>
      </v-col>
    </v-row>

    <!-- Tabs for Status vs Calculator -->
    <v-tabs v-model="activeTab" color="primary" class="mb-4">
      <v-tab v-for="(tab, i) in tabs2" :key="i" :value="i">
        <v-icon :icon="tab.icon" size="small" class="mr-2" />
        {{ tab.title }}
      </v-tab>
    </v-tabs>

    <!-- Loading State -->
    <div v-if="isLoading && activeTab === 0" class="text-center py-8">
      <v-progress-circular indeterminate color="primary" size="48" />
      <p class="text-body-2 text-medium-emphasis mt-4">Loading emergency fund data...</p>
    </div>

    <!-- Error State -->
    <v-alert v-else-if="isError && activeTab === 0" type="error" variant="tonal" class="mb-6">
      <v-icon icon="mdi-alert-circle" class="mr-2" />
      Failed to load emergency fund data. Please try again later.
    </v-alert>

    <!-- Current Status Tab -->
    <template v-if="activeTab === 0 && emergencyFund">
      <EmergencyFundProgress :data="emergencyFund" class="mb-6" />

      <!-- Cash Flow Based Suggestions -->
      <v-card v-if="cashFlow" class="mb-6">
        <v-card-title class="d-flex align-center">
          <v-icon icon="mdi-lightbulb" class="mr-2" />
          Cash Flow Suggestions
        </v-card-title>
        <v-card-text>
          <v-row>
            <v-col cols="12" md="6">
              <div class="text-subtitle-2 mb-2">Your Monthly Cash Flow</div>
              <v-table density="compact">
                <tbody>
                  <tr>
                    <td>Average Income</td>
                    <td class="text-right font-weight-medium text-success">{{ formatINR(cashFlow.totalIncome, true) }}</td>
                  </tr>
                  <tr>
                    <td>Average Expenses</td>
                    <td class="text-right font-weight-medium text-error">{{ formatINR(cashFlow.totalExpenses, true) }}</td>
                  </tr>
                  <tr>
                    <td>Monthly Surplus</td>
                    <td class="text-right font-weight-medium text-primary">{{ formatINR(cashFlow.netCashFlow, true) }}</td>
                  </tr>
                </tbody>
              </v-table>
            </v-col>

            <v-col cols="12" md="6">
              <div class="text-subtitle-2 mb-2">Suggestions</div>
              <v-alert type="info" variant="tonal" density="compact" class="mb-2">
                <v-icon icon="mdi-lightbulb-outline" size="small" class="mr-1" />
                Allocate 20% of surplus ({{ formatINR(cashFlow.netCashFlow * 0.2, true) }}/mo) to emergency fund
              </v-alert>

              <v-alert
                v-if="emergencyFund.targetAmount > emergencyFund.currentAmount"
                type="success"
                variant="tonal"
                density="compact"
              >
                <v-icon icon="mdi-calendar-check" size="small" class="mr-1" />
                At this rate, reach target in {{ Math.ceil((emergencyFund.targetAmount - emergencyFund.currentAmount) / (cashFlow.netCashFlow * 0.2)) }} months
              </v-alert>
            </v-col>
          </v-row>
        </v-card-text>
      </v-card>

      <!-- Liquidity Tiers -->
      <v-card>
        <v-card-title class="d-flex align-center">
          <v-icon icon="mdi-layers" class="mr-2" />
          Liquidity Tiers
        </v-card-title>
        <v-card-text>
          <v-row>
            <v-col cols="12" md="6">
              <v-card variant="tonal" color="success" class="pa-4">
                <div class="d-flex align-center mb-2">
                  <v-icon icon="mdi-flash" class="mr-2" />
                  <span class="text-subtitle-1 font-weight-medium">Tier 1: Instant Access</span>
                </div>
                <div class="text-body-2 text-medium-emphasis mb-2">
                  Savings accounts, overnight funds, liquid funds
                </div>
                <div class="text-h5 font-weight-bold">
                  {{ formatINR(emergencyFund.breakdown.filter(b => ['instant', 't+0', 't+1'].includes(b.liquidity)).reduce((s, b) => s + b.amount, 0), true) }}
                </div>
                <div class="text-caption">
                  Covers {{ Math.floor(emergencyFund.breakdown.filter(b => ['instant', 't+0', 't+1'].includes(b.liquidity)).reduce((s, b) => s + b.amount, 0) / emergencyFund.monthlyExpenses) }} months
                </div>
              </v-card>
            </v-col>

            <v-col cols="12" md="6">
              <v-card variant="tonal" color="warning" class="pa-4">
                <div class="d-flex align-center mb-2">
                  <v-icon icon="mdi-clock-outline" class="mr-2" />
                  <span class="text-subtitle-1 font-weight-medium">Tier 2: 1-3 Days</span>
                </div>
                <div class="text-body-2 text-medium-emphasis mb-2">
                  Fixed deposits, ultra-short duration funds
                </div>
                <div class="text-h5 font-weight-bold">
                  {{ formatINR(emergencyFund.breakdown.filter(b => ['t+2', 'breakable'].includes(b.liquidity)).reduce((s, b) => s + b.amount, 0), true) }}
                </div>
                <div class="text-caption">
                  Covers {{ Math.floor(emergencyFund.breakdown.filter(b => ['t+2', 'breakable'].includes(b.liquidity)).reduce((s, b) => s + b.amount, 0) / emergencyFund.monthlyExpenses) }} months
                </div>
              </v-card>
            </v-col>
          </v-row>
        </v-card-text>
      </v-card>
    </template>

    <!-- Calculator Tab -->
    <template v-if="activeTab === 1">
      <EmergencyFundCalculator
        :monthly-expenses="emergencyFund?.monthlyExpenses || 100000"
        :current-amount="emergencyFund?.currentAmount || 0"
      />
    </template>
  </div>
</template>
