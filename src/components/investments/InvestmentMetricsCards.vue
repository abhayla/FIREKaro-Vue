<script setup lang="ts">
import { computed } from 'vue'
import { formatINR, formatINRCompact } from '@/composables/useLiabilities'

interface MetricItem {
  label: string
  value: number
  format?: 'currency' | 'currencyCompact' | 'percent' | 'number'
  change?: number
  changeLabel?: string
  icon?: string
  color?: string
  subtitle?: string
}

interface Props {
  metrics: MetricItem[]
  loading?: boolean
  columns?: 2 | 3 | 4 | 5 | 6
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  columns: 4
})

const gridClass = computed(() => {
  const colMap = {
    2: 'grid-cols-2',
    3: 'grid-cols-3',
    4: 'grid-cols-4',
    5: 'grid-cols-5',
    6: 'grid-cols-6',
  }
  return colMap[props.columns]
})

function formatValue(value: number, format?: string): string {
  if (value === null || value === undefined || isNaN(value)) return '-'

  switch (format) {
    case 'currency':
      return formatINR(value)
    case 'currencyCompact':
      return formatINRCompact(value)
    case 'percent':
      return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`
    case 'number':
      return value.toLocaleString('en-IN')
    default:
      return formatINRCompact(value)
  }
}

function getChangeColor(change?: number): string {
  if (!change) return 'text-medium-emphasis'
  return change >= 0 ? 'text-success' : 'text-error'
}

function getChangeIcon(change?: number): string {
  if (!change) return 'mdi-minus'
  return change >= 0 ? 'mdi-trending-up' : 'mdi-trending-down'
}
</script>

<template>
  <div class="metrics-grid" :class="gridClass">
    <!-- Loading State -->
    <template v-if="loading">
      <v-card
        v-for="i in columns"
        :key="i"
        class="metric-card"
        variant="outlined"
      >
        <v-card-text class="pa-4">
          <v-skeleton-loader type="text, heading" />
        </v-card-text>
      </v-card>
    </template>

    <!-- Metric Cards -->
    <template v-else>
      <v-card
        v-for="(metric, index) in metrics"
        :key="index"
        class="metric-card"
        variant="outlined"
      >
        <v-card-text class="pa-4">
          <div class="d-flex align-start justify-space-between">
            <div class="flex-grow-1">
              <!-- Label -->
              <div class="text-caption text-medium-emphasis mb-1 d-flex align-center ga-1">
                <v-icon v-if="metric.icon" :icon="metric.icon" size="14" :color="metric.color" />
                {{ metric.label }}
              </div>

              <!-- Value -->
              <div
                class="text-h5 font-weight-bold text-currency"
                :class="metric.color ? `text-${metric.color}` : ''"
              >
                {{ formatValue(metric.value, metric.format) }}
              </div>

              <!-- Subtitle -->
              <div v-if="metric.subtitle" class="text-caption text-medium-emphasis mt-1">
                {{ metric.subtitle }}
              </div>

              <!-- Change indicator -->
              <div
                v-if="metric.change !== undefined"
                class="d-flex align-center ga-1 mt-2"
                :class="getChangeColor(metric.change)"
              >
                <v-icon :icon="getChangeIcon(metric.change)" size="16" />
                <span class="text-body-2 font-weight-medium">
                  {{ metric.change >= 0 ? '+' : '' }}{{ metric.change.toFixed(2) }}%
                </span>
                <span v-if="metric.changeLabel" class="text-caption text-medium-emphasis">
                  {{ metric.changeLabel }}
                </span>
              </div>
            </div>

            <!-- Optional large icon -->
            <v-avatar
              v-if="metric.icon && metric.color"
              :color="metric.color"
              size="40"
              variant="tonal"
              class="ml-2"
            >
              <v-icon :icon="metric.icon" size="20" />
            </v-avatar>
          </div>
        </v-card-text>
      </v-card>
    </template>
  </div>
</template>

<style scoped>
.metrics-grid {
  display: grid;
  gap: 16px;
}

.grid-cols-2 {
  grid-template-columns: repeat(2, 1fr);
}

.grid-cols-3 {
  grid-template-columns: repeat(3, 1fr);
}

.grid-cols-4 {
  grid-template-columns: repeat(4, 1fr);
}

.grid-cols-5 {
  grid-template-columns: repeat(5, 1fr);
}

.grid-cols-6 {
  grid-template-columns: repeat(6, 1fr);
}

@media (max-width: 1280px) {
  .grid-cols-5,
  .grid-cols-6 {
    grid-template-columns: repeat(4, 1fr);
  }
}

@media (max-width: 960px) {
  .grid-cols-3,
  .grid-cols-4,
  .grid-cols-5,
  .grid-cols-6 {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 600px) {
  .metrics-grid {
    grid-template-columns: 1fr;
  }
}

.metric-card {
  transition: all 0.2s ease;
}

.metric-card:hover {
  border-color: rgb(var(--v-theme-primary));
}
</style>
