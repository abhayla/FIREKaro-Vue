<script setup lang="ts">
import { computed } from 'vue'
import type { CashFlowData, IncomeCategory, ExpenseCategory } from '@/composables/useFinancialHealth'
import { formatINR } from '@/composables/useFinancialHealth'

const props = defineProps<{
  data: CashFlowData
}>()

const savingsRateStatus = computed(() => {
  const rate = props.data.savingsRate
  if (rate >= 40) return { color: 'success', label: 'Excellent', icon: 'mdi-star' }
  if (rate >= 30) return { color: 'success', label: 'Great', icon: 'mdi-thumb-up' }
  if (rate >= 20) return { color: 'primary', label: 'Good', icon: 'mdi-check' }
  if (rate >= 10) return { color: 'warning', label: 'Fair', icon: 'mdi-alert' }
  return { color: 'error', label: 'Low', icon: 'mdi-alert-circle' }
})

const topExpenseCategories = computed(() => {
  return [...props.data.expenseBreakdown]
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 5)
})
</script>

<template>
  <v-card variant="outlined">
    <v-card-title class="d-flex align-center">
      <v-icon icon="mdi-swap-vertical" class="mr-2" />
      Cash Flow Summary
    </v-card-title>

    <v-card-text>
      <!-- Summary Cards -->
      <v-row class="mb-4">
        <v-col cols="12" sm="4">
          <v-card color="success" variant="tonal" class="pa-3">
            <div class="text-caption text-medium-emphasis">Total Income</div>
            <div class="text-h5 font-weight-bold">{{ formatINR(data.totalIncome, true) }}</div>
            <div class="text-caption">This month</div>
          </v-card>
        </v-col>

        <v-col cols="12" sm="4">
          <v-card color="error" variant="tonal" class="pa-3">
            <div class="text-caption text-medium-emphasis">Total Expenses</div>
            <div class="text-h5 font-weight-bold">{{ formatINR(data.totalExpenses, true) }}</div>
            <div class="text-caption">This month</div>
          </v-card>
        </v-col>

        <v-col cols="12" sm="4">
          <v-card :color="data.netCashFlow >= 0 ? 'primary' : 'warning'" variant="tonal" class="pa-3">
            <div class="text-caption text-medium-emphasis">Net Cash Flow</div>
            <div class="text-h5 font-weight-bold">
              {{ data.netCashFlow >= 0 ? '+' : '' }}{{ formatINR(data.netCashFlow, true) }}
            </div>
            <div class="text-caption">Savings</div>
          </v-card>
        </v-col>
      </v-row>

      <!-- Savings Rate -->
      <div class="savings-rate-section mb-4">
        <div class="d-flex align-center justify-space-between mb-2">
          <span class="text-subtitle-2 font-weight-medium">Savings Rate</span>
          <v-chip :color="savingsRateStatus.color" size="small">
            <v-icon :icon="savingsRateStatus.icon" size="small" class="mr-1" />
            {{ savingsRateStatus.label }}
          </v-chip>
        </div>
        <v-progress-linear
          :model-value="Math.min(data.savingsRate, 100)"
          :color="savingsRateStatus.color"
          height="20"
          rounded
        >
          <template #default>
            <span class="text-caption font-weight-medium">{{ data.savingsRate.toFixed(1) }}%</span>
          </template>
        </v-progress-linear>
        <div class="d-flex justify-space-between mt-1">
          <span class="text-caption text-medium-emphasis">0%</span>
          <span class="text-caption text-medium-emphasis">Target: 30%</span>
          <span class="text-caption text-medium-emphasis">50%+</span>
        </div>
      </div>

      <v-divider class="my-4" />

      <!-- Income Breakdown -->
      <div class="income-breakdown mb-4">
        <div class="text-subtitle-2 font-weight-medium mb-3">Income Sources</div>
        <div v-for="income in data.incomeBreakdown" :key="income.category" class="mb-2">
          <div class="d-flex align-center justify-space-between mb-1">
            <span class="text-body-2">{{ income.category }}</span>
            <span class="text-body-2">{{ formatINR(income.amount, true) }}</span>
          </div>
          <v-progress-linear
            :model-value="income.percentage"
            color="success"
            height="4"
            rounded
          />
        </div>
      </div>

      <!-- Top Expense Categories -->
      <div class="expense-breakdown">
        <div class="text-subtitle-2 font-weight-medium mb-3">Top Expense Categories</div>
        <div v-for="expense in topExpenseCategories" :key="expense.category" class="mb-2">
          <div class="d-flex align-center justify-space-between mb-1">
            <span class="text-body-2">{{ expense.category }}</span>
            <span class="text-body-2">{{ formatINR(expense.amount, true) }}</span>
          </div>
          <v-progress-linear
            :model-value="expense.percentage"
            color="error"
            height="4"
            rounded
          />
        </div>
      </div>
    </v-card-text>
  </v-card>
</template>

<style scoped>
.savings-rate-section {
  padding: 12px;
  background: rgba(var(--v-theme-surface-variant), 0.3);
  border-radius: 8px;
}
</style>
