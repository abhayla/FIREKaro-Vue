<script setup lang="ts">
import { computed, ref } from "vue";
import type { SalaryHistoryRecord } from "@/types/salary";
import { getShortMonthName } from "@/types/salary";
import { formatINRLakhs } from "@/composables/useSalary";

const props = defineProps<{
  records: SalaryHistoryRecord[];
  loading?: boolean;
}>();

type ChartView = "gross" | "net" | "comparison";
const chartView = ref<ChartView>("comparison");

// Sort records by month
const sortedRecords = computed(() => {
  return [...props.records].sort((a, b) => a.month - b.month);
});

// Calculate max value for scaling
const maxValue = computed(() => {
  if (!props.records.length) return 100000;
  return Math.max(...props.records.map((r) => r.grossEarnings));
});

// Generate bar data
const chartData = computed(() => {
  return sortedRecords.value.map((record) => ({
    month: getShortMonthName(record.month),
    gross: record.grossEarnings,
    deductions: record.totalDeductions,
    net: record.netSalary,
    grossPercent: (record.grossEarnings / maxValue.value) * 100,
    netPercent: (record.netSalary / maxValue.value) * 100,
    deductionsPercent: (record.totalDeductions / maxValue.value) * 100,
  }));
});

// Summary stats
const stats = computed(() => {
  if (!props.records.length) return null;
  const totalGross = props.records.reduce((sum, r) => sum + r.grossEarnings, 0);
  const totalNet = props.records.reduce((sum, r) => sum + r.netSalary, 0);
  const avgGross = totalGross / props.records.length;
  const avgNet = totalNet / props.records.length;
  const minGross = Math.min(...props.records.map((r) => r.grossEarnings));
  const maxGross = Math.max(...props.records.map((r) => r.grossEarnings));

  return {
    totalGross,
    totalNet,
    avgGross,
    avgNet,
    minGross,
    maxGross,
    variance: maxGross - minGross,
  };
});
</script>

<template>
  <v-card :loading="loading">
    <v-card-title class="d-flex align-center justify-space-between">
      <div class="d-flex align-center">
        <v-icon icon="mdi-chart-bar" class="mr-2" />
        Salary Trend
      </div>
      <v-btn-toggle
        v-model="chartView"
        mandatory
        density="compact"
        color="primary"
      >
        <v-btn value="gross" size="small">Gross</v-btn>
        <v-btn value="net" size="small">Net</v-btn>
        <v-btn value="comparison" size="small">Both</v-btn>
      </v-btn-toggle>
    </v-card-title>

    <v-card-text>
      <!-- Stats Row -->
      <div v-if="stats" class="d-flex ga-4 mb-4 flex-wrap">
        <v-chip color="success" variant="tonal">
          <v-icon icon="mdi-sigma" start size="small" />
          Total: {{ formatINRLakhs(stats.totalGross) }}
        </v-chip>
        <v-chip color="primary" variant="tonal">
          <v-icon icon="mdi-chart-line-variant" start size="small" />
          Avg: {{ formatINRLakhs(stats.avgGross) }}/mo
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
              <!-- Gross Bar -->
              <div
                v-if="chartView === 'gross' || chartView === 'comparison'"
                class="bar gross-bar rounded-t"
                :style="{ height: `${item.grossPercent}%` }"
              >
                <v-tooltip activator="parent" location="top">
                  Gross: {{ formatINRLakhs(item.gross) }}
                </v-tooltip>
              </div>
              <!-- Net Bar -->
              <div
                v-if="chartView === 'net' || chartView === 'comparison'"
                class="bar net-bar rounded-t"
                :style="{ height: `${item.netPercent}%` }"
              >
                <v-tooltip activator="parent" location="top">
                  Net: {{ formatINRLakhs(item.net) }}
                </v-tooltip>
              </div>
            </div>
            <div class="text-caption text-medium-emphasis mt-2">
              {{ item.month }}
            </div>
          </div>
        </div>

        <!-- Legend -->
        <div class="d-flex justify-center ga-4 mt-4">
          <div
            v-if="chartView === 'gross' || chartView === 'comparison'"
            class="d-flex align-center"
          >
            <div class="legend-dot gross-dot mr-2" />
            <span class="text-caption">Gross Earnings</span>
          </div>
          <div
            v-if="chartView === 'net' || chartView === 'comparison'"
            class="d-flex align-center"
          >
            <div class="legend-dot net-dot mr-2" />
            <span class="text-caption">Net Salary</span>
          </div>
        </div>
      </div>

      <v-alert v-else type="info" variant="tonal">
        No salary data to display. Add salary records to see the trend chart.
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

.gross-bar {
  background: linear-gradient(
    180deg,
    rgb(var(--v-theme-success)) 0%,
    rgba(var(--v-theme-success), 0.7) 100%
  );
}

.net-bar {
  background: linear-gradient(
    180deg,
    rgb(var(--v-theme-primary)) 0%,
    rgba(var(--v-theme-primary), 0.7) 100%
  );
}

.legend-dot {
  width: 12px;
  height: 12px;
  border-radius: 2px;
}

.gross-dot {
  background-color: rgb(var(--v-theme-success));
}

.net-dot {
  background-color: rgb(var(--v-theme-primary));
}
</style>
