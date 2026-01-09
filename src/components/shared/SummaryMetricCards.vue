<script setup lang="ts">
export interface MetricCard {
  label: string
  value: number | string
  subtitle?: string
  icon?: string
  color?: string
  trend?: {
    value: number
    direction: 'up' | 'down' | 'neutral'
    label?: string
  }
  format?: 'currency' | 'number' | 'percent' | 'none'
}

const props = withDefaults(
  defineProps<{
    metrics: MetricCard[]
    columns?: 2 | 3 | 4
    loading?: boolean
  }>(),
  {
    columns: 4,
    loading: false,
  }
)

const formatValue = (metric: MetricCard): string => {
  if (typeof metric.value === 'string') return metric.value

  switch (metric.format) {
    case 'currency':
      return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0,
      }).format(metric.value)
    case 'percent':
      return `${metric.value.toFixed(1)}%`
    case 'number':
      return new Intl.NumberFormat('en-IN').format(metric.value)
    default:
      return String(metric.value)
  }
}

const getTrendIcon = (direction: 'up' | 'down' | 'neutral'): string => {
  switch (direction) {
    case 'up':
      return 'mdi-trending-up'
    case 'down':
      return 'mdi-trending-down'
    default:
      return 'mdi-minus'
  }
}

const getTrendColor = (direction: 'up' | 'down' | 'neutral'): string => {
  switch (direction) {
    case 'up':
      return 'success'
    case 'down':
      return 'error'
    default:
      return 'grey'
  }
}
</script>

<template>
  <v-row class="summary-metric-cards">
    <v-col
      v-for="(metric, index) in metrics"
      :key="index"
      :cols="12"
      :sm="6"
      :md="12 / columns"
    >
      <v-card
        variant="outlined"
        class="metric-card h-100"
        :loading="loading"
      >
        <v-card-text class="pa-4">
          <div class="d-flex align-start justify-space-between">
            <div class="flex-grow-1">
              <div class="text-caption text-medium-emphasis text-uppercase tracking-wide mb-1">
                {{ metric.label }}
              </div>
              <div class="text-h5 font-weight-bold text-currency" :class="metric.color ? `text-${metric.color}` : ''">
                {{ formatValue(metric) }}
              </div>
              <div v-if="metric.subtitle" class="text-caption text-medium-emphasis mt-1">
                {{ metric.subtitle }}
              </div>
            </div>
            <v-icon
              v-if="metric.icon"
              :icon="metric.icon"
              size="40"
              :color="metric.color || 'primary'"
              class="opacity-20"
            />
          </div>

          <div v-if="metric.trend" class="d-flex align-center mt-3 pt-2 border-t">
            <v-icon
              :icon="getTrendIcon(metric.trend.direction)"
              :color="getTrendColor(metric.trend.direction)"
              size="16"
              class="mr-1"
            />
            <span
              class="text-caption font-weight-medium"
              :class="`text-${getTrendColor(metric.trend.direction)}`"
            >
              {{ metric.trend.value > 0 ? '+' : '' }}{{ metric.trend.value.toFixed(1) }}%
            </span>
            <span v-if="metric.trend.label" class="text-caption text-medium-emphasis ml-1">
              {{ metric.trend.label }}
            </span>
          </div>
        </v-card-text>
      </v-card>
    </v-col>
  </v-row>
</template>

<style scoped>
.metric-card {
  transition: all 0.2s ease;
}

.metric-card:hover {
  border-color: rgb(var(--v-theme-primary));
  box-shadow: 0 2px 8px rgba(var(--v-theme-primary), 0.1);
}

.tracking-wide {
  letter-spacing: 0.05em;
}

.border-t {
  border-top: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
}
</style>
