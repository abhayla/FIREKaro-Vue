<script setup lang="ts">
import { computed, ref } from "vue";
import { formatINRLakhs } from "@/composables/useSalary";

export interface ChartDataPoint {
  label: string;
  primary: number;
  secondary?: number;
  tertiary?: number;
}

export interface ChartToggle {
  value: string;
  label: string;
}

export interface ChartConfig {
  title?: string;
  icon?: string;
  primaryLabel?: string;
  primaryColor?: string;
  secondaryLabel?: string;
  secondaryColor?: string;
  tertiaryLabel?: string;
  tertiaryColor?: string;
  toggles?: ChartToggle[];
  showStats?: boolean;
}

const props = withDefaults(
  defineProps<{
    data: ChartDataPoint[];
    config?: ChartConfig;
    loading?: boolean;
  }>(),
  {
    loading: false,
    config: () => ({
      title: "Income Trend",
      icon: "mdi-chart-bar",
      primaryLabel: "Amount",
      primaryColor: "success",
      showStats: true,
    }),
  }
);

type ChartView = "primary" | "secondary" | "comparison";
const chartView = ref<ChartView>("comparison");

// Calculate max value for scaling
const maxValue = computed(() => {
  if (!props.data.length) return 100000;
  const allValues = props.data.flatMap((d) => [
    d.primary,
    d.secondary ?? 0,
    d.tertiary ?? 0,
  ]);
  return Math.max(...allValues);
});

// Generate bar data with percentages
const chartData = computed(() => {
  return props.data.map((point) => ({
    ...point,
    primaryPercent: (point.primary / maxValue.value) * 100,
    secondaryPercent: ((point.secondary ?? 0) / maxValue.value) * 100,
    tertiaryPercent: ((point.tertiary ?? 0) / maxValue.value) * 100,
  }));
});

// Summary stats
const stats = computed(() => {
  if (!props.data.length) return null;
  const primaryTotal = props.data.reduce((sum, d) => sum + d.primary, 0);
  const secondaryTotal = props.data.reduce((sum, d) => sum + (d.secondary ?? 0), 0);
  const avgPrimary = primaryTotal / props.data.length;
  const minPrimary = Math.min(...props.data.map((d) => d.primary));
  const maxPrimary = Math.max(...props.data.map((d) => d.primary));

  return {
    primaryTotal,
    secondaryTotal,
    avgPrimary,
    minPrimary,
    maxPrimary,
    variance: maxPrimary - minPrimary,
  };
});

const hasSecondary = computed(() => props.data.some((d) => d.secondary !== undefined));
const hasTertiary = computed(() => props.data.some((d) => d.tertiary !== undefined));

const effectiveToggles = computed(() => {
  if (props.config?.toggles) return props.config.toggles;
  const toggles: ChartToggle[] = [
    { value: "primary", label: props.config?.primaryLabel ?? "Primary" },
  ];
  if (hasSecondary.value) {
    toggles.push({ value: "secondary", label: props.config?.secondaryLabel ?? "Secondary" });
    toggles.push({ value: "comparison", label: "Both" });
  }
  return toggles;
});

const showPrimary = computed(
  () => chartView.value === "primary" || chartView.value === "comparison"
);
const showSecondary = computed(
  () =>
    hasSecondary.value &&
    (chartView.value === "secondary" || chartView.value === "comparison")
);
</script>

<template>
  <v-card :loading="loading" variant="outlined">
    <v-card-title class="d-flex align-center justify-space-between">
      <div class="d-flex align-center">
        <v-icon :icon="config?.icon ?? 'mdi-chart-bar'" class="mr-2" color="primary" />
        {{ config?.title ?? "Income Trend" }}
      </div>
      <v-btn-toggle
        v-if="effectiveToggles.length > 1"
        v-model="chartView"
        mandatory
        density="compact"
        color="primary"
      >
        <v-btn
          v-for="toggle in effectiveToggles"
          :key="toggle.value"
          :value="toggle.value"
          size="small"
        >
          {{ toggle.label }}
        </v-btn>
      </v-btn-toggle>
    </v-card-title>

    <v-card-text>
      <!-- Stats Row -->
      <div v-if="config?.showStats && stats" class="d-flex ga-4 mb-4 flex-wrap">
        <v-chip :color="config?.primaryColor ?? 'success'" variant="tonal">
          <v-icon icon="mdi-sigma" start size="small" />
          Total: {{ formatINRLakhs(stats.primaryTotal) }}
        </v-chip>
        <v-chip color="primary" variant="tonal">
          <v-icon icon="mdi-chart-line-variant" start size="small" />
          Avg: {{ formatINRLakhs(stats.avgPrimary) }}
        </v-chip>
        <v-chip v-if="stats.variance > 0" color="warning" variant="tonal">
          <v-icon icon="mdi-swap-vertical" start size="small" />
          Variance: {{ formatINRLakhs(stats.variance) }}
        </v-chip>
      </div>

      <!-- Chart Area -->
      <div v-if="chartData.length" class="chart-container">
        <div class="chart-bars d-flex align-end ga-2">
          <div
            v-for="(item, index) in chartData"
            :key="index"
            class="chart-bar-group text-center"
          >
            <div
              class="bar-container d-flex align-end justify-center ga-1"
              style="height: 200px"
            >
              <!-- Primary Bar -->
              <div
                v-if="showPrimary"
                class="bar primary-bar rounded-t"
                :class="`${config?.primaryColor ?? 'success'}-bar`"
                :style="{ height: `${item.primaryPercent}%` }"
              >
                <v-tooltip activator="parent" location="top">
                  {{ config?.primaryLabel ?? "Amount" }}: {{ formatINRLakhs(item.primary) }}
                </v-tooltip>
              </div>
              <!-- Secondary Bar -->
              <div
                v-if="showSecondary"
                class="bar secondary-bar rounded-t"
                :class="`${config?.secondaryColor ?? 'primary'}-bar`"
                :style="{ height: `${item.secondaryPercent}%` }"
              >
                <v-tooltip activator="parent" location="top">
                  {{ config?.secondaryLabel ?? "Net" }}: {{ formatINRLakhs(item.secondary ?? 0) }}
                </v-tooltip>
              </div>
            </div>
            <div class="text-caption text-medium-emphasis mt-2">
              {{ item.label }}
            </div>
          </div>
        </div>

        <!-- Legend -->
        <div class="d-flex justify-center ga-4 mt-4">
          <div v-if="showPrimary" class="d-flex align-center">
            <div class="legend-dot mr-2" :class="`${config?.primaryColor ?? 'success'}-dot`" />
            <span class="text-caption">{{ config?.primaryLabel ?? "Amount" }}</span>
          </div>
          <div v-if="showSecondary" class="d-flex align-center">
            <div class="legend-dot mr-2" :class="`${config?.secondaryColor ?? 'primary'}-dot`" />
            <span class="text-caption">{{ config?.secondaryLabel ?? "Net" }}</span>
          </div>
        </div>
      </div>

      <v-alert v-else type="info" variant="tonal">
        No data to display. Add records to see the trend chart.
      </v-alert>
    </v-card-text>
  </v-card>
</template>

<style scoped>
.chart-container {
  padding: 16px 0;
}

.chart-bar-group {
  flex: 1;
  min-width: 40px;
  max-width: 80px;
}

.bar-container {
  min-height: 200px;
}

.bar {
  min-width: 20px;
  max-width: 30px;
  transition: height 0.3s ease;
  cursor: pointer;
}

.bar:hover {
  opacity: 0.8;
}

.success-bar {
  background: linear-gradient(
    180deg,
    rgb(var(--v-theme-success)) 0%,
    rgba(var(--v-theme-success), 0.7) 100%
  );
}

.primary-bar {
  background: linear-gradient(
    180deg,
    rgb(var(--v-theme-primary)) 0%,
    rgba(var(--v-theme-primary), 0.7) 100%
  );
}

.warning-bar {
  background: linear-gradient(
    180deg,
    rgb(var(--v-theme-warning)) 0%,
    rgba(var(--v-theme-warning), 0.7) 100%
  );
}

.info-bar {
  background: linear-gradient(
    180deg,
    rgb(var(--v-theme-info)) 0%,
    rgba(var(--v-theme-info), 0.7) 100%
  );
}

.error-bar {
  background: linear-gradient(
    180deg,
    rgb(var(--v-theme-error)) 0%,
    rgba(var(--v-theme-error), 0.7) 100%
  );
}

.legend-dot {
  width: 12px;
  height: 12px;
  border-radius: 2px;
}

.success-dot {
  background-color: rgb(var(--v-theme-success));
}

.primary-dot {
  background-color: rgb(var(--v-theme-primary));
}

.warning-dot {
  background-color: rgb(var(--v-theme-warning));
}

.info-dot {
  background-color: rgb(var(--v-theme-info));
}

.error-dot {
  background-color: rgb(var(--v-theme-error));
}
</style>
