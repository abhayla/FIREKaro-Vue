<script setup lang="ts">
import { computed } from 'vue'
import type { EmergencyFundData } from '@/composables/useFinancialHealth'
import { formatINR } from '@/composables/useFinancialHealth'

const props = defineProps<{
  data: EmergencyFundData
}>()

const statusConfig = computed(() => {
  switch (props.data.status) {
    case 'excellent':
      return { color: 'success', icon: 'mdi-shield-check', label: 'Excellent' }
    case 'adequate':
      return { color: 'primary', icon: 'mdi-check-circle', label: 'Adequate' }
    case 'low':
      return { color: 'warning', icon: 'mdi-alert', label: 'Low' }
    case 'critical':
      return { color: 'error', icon: 'mdi-alert-circle', label: 'Critical' }
    default:
      return { color: 'grey', icon: 'mdi-help-circle', label: 'Unknown' }
  }
})

const remaining = computed(() => props.data.targetAmount - props.data.currentAmount)

const liquidityIcon = (liquidity: string) => {
  switch (liquidity) {
    case 'instant': return 'mdi-flash'
    case 't+0': return 'mdi-flash-outline'
    case 't+1': return 'mdi-clock-fast'
    case 't+2': return 'mdi-clock-outline'
    case 'breakable': return 'mdi-lock-open'
    default: return 'mdi-clock'
  }
}

const liquidityLabel = (liquidity: string) => {
  switch (liquidity) {
    case 'instant': return 'Instant'
    case 't+0': return 'Same day'
    case 't+1': return '1 day'
    case 't+2': return '2 days'
    case 'breakable': return 'Breakable'
    default: return liquidity
  }
}
</script>

<template>
  <v-card variant="outlined">
    <v-card-title class="d-flex align-center">
      <v-icon icon="mdi-lifebuoy" class="mr-2" />
      Emergency Fund
      <v-spacer />
      <v-chip :color="statusConfig.color" size="small">
        <v-icon :icon="statusConfig.icon" size="small" class="mr-1" />
        {{ statusConfig.label }}
      </v-chip>
    </v-card-title>

    <v-card-text>
      <!-- Progress -->
      <div class="progress-section mb-4">
        <div class="d-flex align-center justify-space-between mb-2">
          <span class="text-body-2 text-medium-emphasis">
            Target: {{ data.targetMonths }} months of expenses
          </span>
          <span class="text-h6 font-weight-bold">{{ data.percentComplete }}%</span>
        </div>

        <v-progress-linear
          :model-value="data.percentComplete"
          :color="statusConfig.color"
          height="24"
          rounded
        >
          <template #default>
            <span class="text-caption font-weight-medium">
              {{ formatINR(data.currentAmount, true) }} / {{ formatINR(data.targetAmount, true) }}
            </span>
          </template>
        </v-progress-linear>

        <div v-if="remaining > 0" class="text-body-2 mt-2">
          <v-icon icon="mdi-information-outline" size="small" class="mr-1" />
          {{ formatINR(remaining, true) }} more needed to reach target
        </div>
        <div v-else-if="data.targetAmount > 0 && data.currentAmount >= data.targetAmount" class="text-body-2 text-success mt-2">
          <v-icon icon="mdi-check-circle" size="small" class="mr-1" />
          Target reached! You're prepared for emergencies
        </div>
        <div v-else class="text-body-2 text-medium-emphasis mt-2">
          <v-icon icon="mdi-information-outline" size="small" class="mr-1" />
          Set up your emergency fund to get started
        </div>
      </div>

      <v-divider class="my-4" />

      <!-- Breakdown by source -->
      <div class="breakdown-section">
        <div class="text-subtitle-2 font-weight-medium mb-3">Fund Breakdown</div>

        <div
          v-for="source in data.breakdown"
          :key="source.source"
          class="breakdown-item d-flex align-center justify-space-between pa-2 mb-2 rounded"
        >
          <div class="d-flex align-center">
            <v-icon
              :icon="source.type === 'savings' ? 'mdi-piggy-bank' :
                     source.type === 'liquid_fund' ? 'mdi-water' :
                     source.type === 'fd' ? 'mdi-safe' :
                     'mdi-weather-night'"
              size="small"
              class="mr-2"
            />
            <div>
              <div class="text-body-2">{{ source.source }}</div>
              <div class="d-flex align-center">
                <v-icon
                  :icon="liquidityIcon(source.liquidity)"
                  size="x-small"
                  class="mr-1"
                  color="primary"
                />
                <span class="text-caption text-medium-emphasis">
                  {{ liquidityLabel(source.liquidity) }}
                </span>
              </div>
            </div>
          </div>

          <div class="text-right">
            <div class="text-body-2 font-weight-medium">{{ formatINR(source.amount, true) }}</div>
            <div class="text-caption text-medium-emphasis">{{ source.percentage }}%</div>
          </div>
        </div>
      </div>

      <!-- Recommendations -->
      <div v-if="data.recommendations.length > 0" class="recommendations-section mt-4">
        <v-alert type="info" variant="tonal" density="compact">
          <div class="text-subtitle-2 mb-2">Recommendations</div>
          <ul class="text-body-2 mb-0 pl-4">
            <li v-for="rec in data.recommendations" :key="rec">{{ rec }}</li>
          </ul>
        </v-alert>
      </div>
    </v-card-text>
  </v-card>
</template>

<style scoped>
.breakdown-item {
  background: rgba(var(--v-theme-surface-variant), 0.3);
}
</style>
