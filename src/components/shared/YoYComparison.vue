<script setup lang="ts">
import { formatINRLakhs } from "@/composables/useSalary";

export interface ComparisonMetric {
  label: string;
  currentValue: number;
  previousValue: number;
  growth: number;
  growthPercent: number;
}

export interface YoYComparisonData {
  currentFY: string;
  previousFY: string;
  metrics: ComparisonMetric[];
}

const props = withDefaults(
  defineProps<{
    data: YoYComparisonData | null;
    loading?: boolean;
    title?: string;
    icon?: string;
  }>(),
  {
    loading: false,
    title: "Year-on-Year Comparison",
    icon: "mdi-compare-horizontal",
  }
);
</script>

<template>
  <v-card variant="outlined" class="yoy-comparison-card">
    <v-card-title class="text-subtitle-2">
      <v-icon :icon="icon" class="mr-2" color="primary" size="small" />
      {{ title }}
    </v-card-title>

    <v-card-text v-if="data">
      <div class="text-caption text-medium-emphasis mb-3">
        FY {{ data.currentFY }} vs FY {{ data.previousFY }}
      </div>

      <div v-for="(metric, index) in data.metrics" :key="index" class="mb-3">
        <div class="d-flex justify-space-between align-center mb-1">
          <span class="text-body-2">{{ metric.label }}:</span>
          <div class="d-flex align-center">
            <v-icon
              :icon="metric.growth >= 0 ? 'mdi-arrow-up' : 'mdi-arrow-down'"
              :color="metric.growth >= 0 ? 'success' : 'error'"
              size="small"
            />
            <span
              :class="metric.growth >= 0 ? 'text-success' : 'text-error'"
              class="font-weight-medium ml-1"
            >
              {{ formatINRLakhs(Math.abs(metric.growth)) }}
              ({{ metric.growthPercent >= 0 ? "+" : "" }}{{ metric.growthPercent.toFixed(1) }}%)
            </span>
          </div>
        </div>

        <div class="d-flex justify-space-between text-caption text-medium-emphasis">
          <span>{{ data.previousFY }}: {{ formatINRLakhs(metric.previousValue) }}</span>
          <span>{{ data.currentFY }}: {{ formatINRLakhs(metric.currentValue) }}</span>
        </div>

        <v-divider v-if="index < data.metrics.length - 1" class="mt-2" />
      </div>
    </v-card-text>

    <v-card-text v-else-if="loading">
      <v-skeleton-loader type="text@3" />
    </v-card-text>

    <v-card-text v-else class="text-medium-emphasis text-center pa-6">
      <v-icon icon="mdi-chart-timeline-variant" size="32" color="grey-lighten-1" class="mb-2" />
      <div>No comparison data available</div>
    </v-card-text>
  </v-card>
</template>

<style scoped>
.yoy-comparison-card {
  height: 100%;
}
</style>
