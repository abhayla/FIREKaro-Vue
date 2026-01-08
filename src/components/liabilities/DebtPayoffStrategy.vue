<script setup lang="ts">
import { ref, computed } from 'vue'
import {
  type DebtPayoffStrategy,
  formatINR,
  formatINRCompact,
  formatDate
} from '@/composables/useLiabilities'

const props = defineProps<{
  strategies: DebtPayoffStrategy[]
  currentStrategy?: 'snowball' | 'avalanche' | 'custom'
}>()

const emit = defineEmits<{
  (e: 'selectStrategy', strategy: 'snowball' | 'avalanche' | 'custom'): void
}>()

const selectedStrategy = ref<'snowball' | 'avalanche' | 'custom'>(props.currentStrategy || 'avalanche')

// Get strategy by name
const getStrategy = (name: 'snowball' | 'avalanche' | 'custom') => {
  return props.strategies.find(s => s.name === name)
}

const snowball = computed(() => getStrategy('snowball'))
const avalanche = computed(() => getStrategy('avalanche'))

// Interest savings comparison (avalanche vs snowball)
const interestSavings = computed(() => {
  if (snowball.value && avalanche.value) {
    const snowballInterest = snowball.value.totalInterestSaved
    const avalancheInterest = avalanche.value.totalInterestSaved
    // Calculate based on payoff timeline difference
    return Math.abs(snowballInterest - avalancheInterest)
  }
  return 0
})

const handleSelect = (strategy: 'snowball' | 'avalanche' | 'custom') => {
  selectedStrategy.value = strategy
  emit('selectStrategy', strategy)
}
</script>

<template>
  <div class="debt-payoff-strategy">
    <!-- Strategy Comparison Cards -->
    <v-row class="mb-6">
      <!-- Snowball Strategy -->
      <v-col cols="12" md="6">
        <v-card
          :variant="selectedStrategy === 'snowball' ? 'elevated' : 'outlined'"
          :class="{ 'border-primary': selectedStrategy === 'snowball' }"
          class="h-100 cursor-pointer"
          @click="handleSelect('snowball')"
        >
          <v-card-title class="d-flex align-center">
            <v-avatar color="blue" size="40" class="mr-3">
              <v-icon icon="mdi-snowflake" />
            </v-avatar>
            <div>
              <div class="text-h6">Debt Snowball</div>
              <div class="text-caption text-medium-emphasis">Smallest balance first</div>
            </div>
            <v-spacer />
            <v-chip
              v-if="selectedStrategy === 'snowball'"
              color="primary"
              size="small"
            >
              Selected
            </v-chip>
          </v-card-title>

          <v-card-text v-if="snowball">
            <v-alert color="blue" variant="tonal" density="compact" class="mb-4">
              <v-icon icon="mdi-lightbulb" size="small" class="mr-1" />
              {{ snowball.description }}
            </v-alert>

            <v-row dense class="text-center">
              <v-col cols="6">
                <div class="text-caption text-medium-emphasis">Payoff Date</div>
                <div class="text-subtitle-1 font-weight-bold">
                  {{ formatDate(snowball.payoffDate) }}
                </div>
              </v-col>
              <v-col cols="6">
                <div class="text-caption text-medium-emphasis">Monthly Payment</div>
                <div class="text-subtitle-1 font-weight-bold">
                  {{ formatINR(snowball.monthlyPayment) }}
                </div>
              </v-col>
            </v-row>

            <!-- Payoff Order -->
            <div class="mt-4">
              <div class="text-subtitle-2 mb-2">Payoff Order</div>
              <v-list density="compact" class="pa-0">
                <v-list-item
                  v-for="(debt, index) in snowball.debts.slice(0, 5)"
                  :key="debt.id"
                  class="px-0"
                >
                  <template #prepend>
                    <v-avatar color="blue" size="24" class="mr-2">
                      <span class="text-caption">{{ index + 1 }}</span>
                    </v-avatar>
                  </template>
                  <v-list-item-title class="text-body-2">{{ debt.name }}</v-list-item-title>
                  <template #append>
                    <span class="text-body-2">{{ formatINRCompact(debt.balance) }}</span>
                  </template>
                </v-list-item>
              </v-list>
            </div>
          </v-card-text>

          <v-card-text v-else class="text-center text-medium-emphasis">
            <v-icon icon="mdi-alert-circle" size="48" class="mb-2" />
            <div>No debts to calculate</div>
          </v-card-text>
        </v-card>
      </v-col>

      <!-- Avalanche Strategy -->
      <v-col cols="12" md="6">
        <v-card
          :variant="selectedStrategy === 'avalanche' ? 'elevated' : 'outlined'"
          :class="{ 'border-success': selectedStrategy === 'avalanche' }"
          class="h-100 cursor-pointer"
          @click="handleSelect('avalanche')"
        >
          <v-card-title class="d-flex align-center">
            <v-avatar color="success" size="40" class="mr-3">
              <v-icon icon="mdi-trending-up" />
            </v-avatar>
            <div>
              <div class="text-h6">Debt Avalanche</div>
              <div class="text-caption text-medium-emphasis">Highest interest first</div>
            </div>
            <v-spacer />
            <v-chip
              v-if="selectedStrategy === 'avalanche'"
              color="success"
              size="small"
            >
              Selected
            </v-chip>
            <v-chip
              v-else
              color="success"
              variant="outlined"
              size="small"
            >
              Recommended
            </v-chip>
          </v-card-title>

          <v-card-text v-if="avalanche">
            <v-alert color="success" variant="tonal" density="compact" class="mb-4">
              <v-icon icon="mdi-lightbulb" size="small" class="mr-1" />
              {{ avalanche.description }}
            </v-alert>

            <v-row dense class="text-center">
              <v-col cols="6">
                <div class="text-caption text-medium-emphasis">Payoff Date</div>
                <div class="text-subtitle-1 font-weight-bold">
                  {{ formatDate(avalanche.payoffDate) }}
                </div>
              </v-col>
              <v-col cols="6">
                <div class="text-caption text-medium-emphasis">Monthly Payment</div>
                <div class="text-subtitle-1 font-weight-bold">
                  {{ formatINR(avalanche.monthlyPayment) }}
                </div>
              </v-col>
            </v-row>

            <!-- Payoff Order -->
            <div class="mt-4">
              <div class="text-subtitle-2 mb-2">Payoff Order</div>
              <v-list density="compact" class="pa-0">
                <v-list-item
                  v-for="(debt, index) in avalanche.debts.slice(0, 5)"
                  :key="debt.id"
                  class="px-0"
                >
                  <template #prepend>
                    <v-avatar color="success" size="24" class="mr-2">
                      <span class="text-caption">{{ index + 1 }}</span>
                    </v-avatar>
                  </template>
                  <v-list-item-title class="text-body-2">
                    {{ debt.name }}
                    <v-chip size="x-small" class="ml-1">{{ debt.interestRate }}%</v-chip>
                  </v-list-item-title>
                  <template #append>
                    <span class="text-body-2">{{ formatINRCompact(debt.balance) }}</span>
                  </template>
                </v-list-item>
              </v-list>
            </div>
          </v-card-text>

          <v-card-text v-else class="text-center text-medium-emphasis">
            <v-icon icon="mdi-alert-circle" size="48" class="mb-2" />
            <div>No debts to calculate</div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Comparison Summary -->
    <v-card v-if="snowball && avalanche" variant="outlined">
      <v-card-title>
        <v-icon icon="mdi-scale-balance" class="mr-2" />
        Strategy Comparison
      </v-card-title>
      <v-card-text>
        <v-table density="compact">
          <thead>
            <tr>
              <th>Metric</th>
              <th class="text-center">Snowball</th>
              <th class="text-center">Avalanche</th>
              <th class="text-center">Difference</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Payoff Date</td>
              <td class="text-center">{{ formatDate(snowball.payoffDate) }}</td>
              <td class="text-center">{{ formatDate(avalanche.payoffDate) }}</td>
              <td class="text-center">-</td>
            </tr>
            <tr>
              <td>Monthly Payment</td>
              <td class="text-center">{{ formatINR(snowball.monthlyPayment) }}</td>
              <td class="text-center">{{ formatINR(avalanche.monthlyPayment) }}</td>
              <td class="text-center">-</td>
            </tr>
            <tr>
              <td>First Debt Paid Off</td>
              <td class="text-center">{{ snowball.debts[0]?.name || '-' }}</td>
              <td class="text-center">{{ avalanche.debts[0]?.name || '-' }}</td>
              <td class="text-center">-</td>
            </tr>
          </tbody>
        </v-table>

        <v-alert color="info" variant="tonal" class="mt-4">
          <v-icon icon="mdi-information" class="mr-1" />
          <strong>Avalanche</strong> saves the most money mathematically by prioritizing high-interest debt.
          <strong>Snowball</strong> provides psychological wins by eliminating smaller debts first.
        </v-alert>
      </v-card-text>
    </v-card>
  </div>
</template>

<style scoped>
.cursor-pointer {
  cursor: pointer;
}

.border-primary {
  border: 2px solid rgb(var(--v-theme-primary)) !important;
}

.border-success {
  border: 2px solid rgb(var(--v-theme-success)) !important;
}
</style>
