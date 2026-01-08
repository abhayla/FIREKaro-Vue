<script setup lang="ts">
import { ref, computed } from 'vue'
import type { WithdrawalStrategy } from '@/composables/useFIRE'
import { formatINR } from '@/composables/useFIRE'
import { getFireProgressColor, chartColors } from '@/utils/chartTheme'

const props = defineProps<{
  strategies: WithdrawalStrategy[]
  loading?: boolean
}>()

const emit = defineEmits<{
  (e: 'select', strategy: WithdrawalStrategy): void
}>()

const selectedStrategy = ref<WithdrawalStrategy['type']>('swr')

const currentStrategy = computed(() => {
  return props.strategies.find(s => s.type === selectedStrategy.value) || props.strategies[0]
})

const strategyIcons: Record<WithdrawalStrategy['type'], string> = {
  swr: 'mdi-percent',
  bucket: 'mdi-bucket-outline',
  vpw: 'mdi-chart-line-variant',
  guyton_klinger: 'mdi-shield-check'
}

const strategyColors: Record<WithdrawalStrategy['type'], string> = {
  swr: 'primary',
  bucket: 'success',
  vpw: 'info',
  guyton_klinger: 'warning'
}

const selectStrategy = (strategy: WithdrawalStrategy) => {
  selectedStrategy.value = strategy.type
  emit('select', strategy)
}

// Bucket visualization dimensions
const bucketHeight = 150
const bucketWidth = 80
</script>

<template>
  <v-card :loading="loading">
    <v-card-title class="d-flex align-center">
      <v-icon icon="mdi-cash-sync" class="mr-2" />
      Withdrawal Strategies
    </v-card-title>

    <v-card-text>
      <!-- Strategy Selector -->
      <v-row dense class="mb-4">
        <v-col
          v-for="strategy in strategies"
          :key="strategy.type"
          cols="6"
          sm="3"
        >
          <v-card
            :color="selectedStrategy === strategy.type ? strategyColors[strategy.type] : undefined"
            :variant="selectedStrategy === strategy.type ? 'elevated' : 'outlined'"
            class="strategy-card pa-3 text-center h-100"
            :class="{ 'selected': selectedStrategy === strategy.type }"
            @click="selectStrategy(strategy)"
          >
            <v-icon
              :icon="strategyIcons[strategy.type]"
              size="28"
              :color="selectedStrategy === strategy.type ? 'white' : strategyColors[strategy.type]"
            />
            <div
              class="text-body-2 font-weight-bold mt-1"
              :class="{ 'text-white': selectedStrategy === strategy.type }"
            >
              {{ strategy.name }}
            </div>
            <div
              class="text-caption"
              :class="selectedStrategy === strategy.type ? 'text-white' : 'text-medium-emphasis'"
            >
              {{ strategy.successRate }}% success
            </div>
          </v-card>
        </v-col>
      </v-row>

      <!-- Selected Strategy Details -->
      <v-sheet rounded class="pa-4 mb-4" color="surface-variant">
        <div class="d-flex align-center mb-3">
          <v-icon
            :icon="strategyIcons[currentStrategy.type]"
            :color="strategyColors[currentStrategy.type]"
            size="24"
            class="mr-2"
          />
          <div>
            <div class="text-subtitle-1 font-weight-bold">{{ currentStrategy.name }}</div>
            <div class="text-body-2 text-medium-emphasis">{{ currentStrategy.description }}</div>
          </div>
        </div>

        <v-row dense>
          <v-col cols="6" sm="3">
            <div class="metric-box pa-3 rounded text-center">
              <div class="text-caption text-medium-emphasis">Annual Withdrawal</div>
              <div class="text-h6 font-weight-bold text-currency">
                {{ formatINR(currentStrategy.annualWithdrawal, true) }}
              </div>
            </div>
          </v-col>
          <v-col cols="6" sm="3">
            <div class="metric-box pa-3 rounded text-center">
              <div class="text-caption text-medium-emphasis">Monthly</div>
              <div class="text-h6 font-weight-bold text-currency">
                {{ formatINR(currentStrategy.monthlyWithdrawal, true) }}
              </div>
            </div>
          </v-col>
          <v-col cols="6" sm="3">
            <div class="metric-box pa-3 rounded text-center">
              <div class="text-caption text-medium-emphasis">Success Rate</div>
              <div class="text-h6 font-weight-bold" :style="{ color: getFireProgressColor(currentStrategy.successRate) }">
                {{ currentStrategy.successRate }}%
              </div>
            </div>
          </v-col>
          <v-col cols="6" sm="3">
            <div class="metric-box pa-3 rounded text-center">
              <div class="text-caption text-medium-emphasis">Median End Value</div>
              <div class="text-h6 font-weight-bold text-currency">
                {{ formatINR(currentStrategy.medianEndingValue, true) }}
              </div>
            </div>
          </v-col>
        </v-row>
      </v-sheet>

      <!-- Bucket Strategy Visualization -->
      <div v-if="currentStrategy.type === 'bucket' && currentStrategy.buckets" class="bucket-viz">
        <div class="text-subtitle-2 mb-3">Bucket Allocation</div>
        <div class="d-flex justify-center align-end ga-6">
          <!-- Cash Bucket -->
          <div class="bucket-item text-center">
            <div
              class="bucket"
              :style="{
                height: `${bucketHeight}px`,
                width: `${bucketWidth}px`,
                background: `linear-gradient(to top, ${chartColors.assetClasses.cash} ${currentStrategy.buckets.cash.percent}%, transparent ${currentStrategy.buckets.cash.percent}%)`
              }"
            >
              <div class="bucket-label">
                <v-icon icon="mdi-cash" size="20" />
                <div class="text-body-2 font-weight-bold">{{ currentStrategy.buckets.cash.percent }}%</div>
              </div>
            </div>
            <div class="text-caption font-weight-bold mt-2">CASH</div>
            <div class="text-caption text-medium-emphasis">{{ formatINR(currentStrategy.buckets.cash.amount, true) }}</div>
            <div class="text-caption text-medium-emphasis">{{ currentStrategy.buckets.cash.yearsOfExpenses }}y expenses</div>
          </div>

          <!-- Arrow -->
          <div class="arrow-container">
            <v-icon icon="mdi-arrow-left" size="24" color="grey" />
          </div>

          <!-- Bond Bucket -->
          <div class="bucket-item text-center">
            <div
              class="bucket"
              :style="{
                height: `${bucketHeight}px`,
                width: `${bucketWidth}px`,
                background: `linear-gradient(to top, ${chartColors.assetClasses.debt} ${currentStrategy.buckets.bonds.percent}%, transparent ${currentStrategy.buckets.bonds.percent}%)`
              }"
            >
              <div class="bucket-label">
                <v-icon icon="mdi-file-document" size="20" />
                <div class="text-body-2 font-weight-bold">{{ currentStrategy.buckets.bonds.percent }}%</div>
              </div>
            </div>
            <div class="text-caption font-weight-bold mt-2">BONDS</div>
            <div class="text-caption text-medium-emphasis">{{ formatINR(currentStrategy.buckets.bonds.amount, true) }}</div>
            <div class="text-caption text-medium-emphasis">{{ currentStrategy.buckets.bonds.yearsOfExpenses }}y expenses</div>
          </div>

          <!-- Arrow -->
          <div class="arrow-container">
            <v-icon icon="mdi-arrow-left" size="24" color="grey" />
          </div>

          <!-- Equity Bucket -->
          <div class="bucket-item text-center">
            <div
              class="bucket"
              :style="{
                height: `${bucketHeight}px`,
                width: `${bucketWidth}px`,
                background: `linear-gradient(to top, ${chartColors.assetClasses.equity} ${currentStrategy.buckets.equity.percent}%, transparent ${currentStrategy.buckets.equity.percent}%)`
              }"
            >
              <div class="bucket-label">
                <v-icon icon="mdi-chart-line" size="20" />
                <div class="text-body-2 font-weight-bold">{{ currentStrategy.buckets.equity.percent }}%</div>
              </div>
            </div>
            <div class="text-caption font-weight-bold mt-2">EQUITY</div>
            <div class="text-caption text-medium-emphasis">{{ formatINR(currentStrategy.buckets.equity.amount, true) }}</div>
            <div class="text-caption text-medium-emphasis">{{ currentStrategy.buckets.equity.yearsOfExpenses }}y expenses</div>
          </div>
        </div>

        <v-alert type="info" variant="tonal" density="compact" class="mt-4">
          <div class="text-body-2">
            <strong>How it works:</strong> Withdraw from Cash bucket first (Years 1-2).
            Bonds refill Cash (Years 3-7). Equity grows for long-term (Years 8+).
            This protects against sequence of returns risk.
          </div>
        </v-alert>
      </div>

      <!-- Strategy Comparison Table -->
      <v-expansion-panels class="mt-4">
        <v-expansion-panel>
          <v-expansion-panel-title>
            <v-icon icon="mdi-compare" class="mr-2" />
            Compare All Strategies
          </v-expansion-panel-title>
          <v-expansion-panel-text>
            <v-table density="compact">
              <thead>
                <tr>
                  <th>Strategy</th>
                  <th class="text-right">Monthly</th>
                  <th class="text-right">Annual</th>
                  <th class="text-right">Success</th>
                  <th class="text-right">Median End</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="strategy in strategies"
                  :key="strategy.type"
                  :class="{ 'bg-primary-lighten-5': strategy.type === selectedStrategy }"
                >
                  <td class="font-weight-medium">{{ strategy.name }}</td>
                  <td class="text-right text-currency">{{ formatINR(strategy.monthlyWithdrawal, true) }}</td>
                  <td class="text-right text-currency">{{ formatINR(strategy.annualWithdrawal, true) }}</td>
                  <td class="text-right">
                    <v-chip
                      :color="strategy.successRate >= 90 ? 'success' : strategy.successRate >= 80 ? 'info' : 'warning'"
                      size="x-small"
                    >
                      {{ strategy.successRate }}%
                    </v-chip>
                  </td>
                  <td class="text-right text-currency">{{ formatINR(strategy.medianEndingValue, true) }}</td>
                </tr>
              </tbody>
            </v-table>
          </v-expansion-panel-text>
        </v-expansion-panel>
      </v-expansion-panels>
    </v-card-text>
  </v-card>
</template>

<style scoped>
.strategy-card {
  cursor: pointer;
  transition: all 0.2s ease;
}

.strategy-card:hover {
  transform: translateY(-2px);
}

.strategy-card.selected {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.metric-box {
  background: rgba(255, 255, 255, 0.6);
}

.bucket-viz {
  padding: 16px;
  background: rgba(var(--v-theme-surface-variant), 0.2);
  border-radius: 12px;
}

.bucket {
  border: 2px solid rgba(0, 0, 0, 0.2);
  border-radius: 8px 8px 16px 16px;
  position: relative;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  padding-bottom: 8px;
}

.bucket-label {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
  color: white;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
}

.arrow-container {
  margin-bottom: 60px;
}
</style>
