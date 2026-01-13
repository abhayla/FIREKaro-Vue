<script setup lang="ts">
import { computed } from "vue";
import { Doughnut } from "vue-chartjs";
import { Chart as ChartJS, ArcElement, Tooltip, Legend, type ChartData } from "chart.js";
import { doughnutChartOptions, formatINRForChart } from "@/utils/chartTheme";
import { formatINR } from "@/composables/useTax";
import type { AggregatedTaxData } from "@/composables/useTax";

ChartJS.register(ArcElement, Tooltip, Legend);

interface Props {
  data: AggregatedTaxData | null | undefined;
  loading?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
});

// Income source colors
const incomeColors: Record<string, string> = {
  salary: "#3b82f6", // Blue
  business: "#10b981", // Emerald
  rental: "#78716c", // Stone
  capitalGains: "#f97316", // Orange
  interest: "#06b6d4", // Cyan
  dividend: "#a855f7", // Purple
  other: "#64748b", // Slate
};

// Build income breakdown from aggregated data
const incomeBreakdown = computed(() => {
  if (!props.data) return [];

  const items = [
    {
      key: "salary",
      label: "Salary Income",
      amount: props.data.salaryIncome,
      color: incomeColors.salary,
    },
    {
      key: "business",
      label: "Business/Profession",
      amount: props.data.businessIncome,
      color: incomeColors.business,
    },
    {
      key: "rental",
      label: "Rental Income",
      amount: props.data.rentalIncome,
      color: incomeColors.rental,
    },
    {
      key: "capitalGains",
      label: "Capital Gains",
      amount: props.data.capitalGainsSTCG + props.data.capitalGainsLTCG,
      color: incomeColors.capitalGains,
    },
    {
      key: "interest",
      label: "Interest Income",
      amount: props.data.interestIncome,
      color: incomeColors.interest,
    },
    {
      key: "dividend",
      label: "Dividend Income",
      amount: props.data.dividendIncome,
      color: incomeColors.dividend,
    },
    {
      key: "other",
      label: "Other Income",
      amount: props.data.otherIncome,
      color: incomeColors.other,
    },
  ];

  // Filter out zero values
  return items.filter((item) => item.amount > 0);
});

// Total income
const totalIncome = computed(() => incomeBreakdown.value.reduce((sum, item) => sum + item.amount, 0));

// Chart data
const chartData = computed<ChartData<"doughnut">>(() => {
  const breakdown = incomeBreakdown.value;
  return {
    labels: breakdown.map((item) => item.label),
    datasets: [
      {
        data: breakdown.map((item) => item.amount),
        backgroundColor: breakdown.map((item) => item.color),
        borderColor: "#ffffff",
        borderWidth: 2,
        hoverOffset: 8,
      },
    ],
  };
});

// Chart options
const chartOptions = computed(() => ({
  ...doughnutChartOptions,
  cutout: "60%",
  plugins: {
    ...doughnutChartOptions.plugins,
    legend: {
      display: false, // We'll show our own legend below
    },
    tooltip: {
      ...doughnutChartOptions.plugins?.tooltip,
      callbacks: {
        label: (context: { raw: unknown; label: string; dataset: { data: number[] } }) => {
          const value = context.raw as number;
          const total = context.dataset.data?.reduce((a: number, b: number) => a + b, 0) ?? 0;
          const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : "0.0";
          return `${context.label}: ${formatINRForChart(value)} (${percentage}%)`;
        },
      },
    },
  },
}));

// Has data
const hasData = computed(() => incomeBreakdown.value.length > 0 && totalIncome.value > 0);
</script>

<template>
  <v-card variant="outlined" :loading="loading">
    <v-card-title class="d-flex align-center text-subtitle-2">
      <v-icon icon="mdi-chart-donut" class="mr-2" color="primary" size="small" />
      INCOME BREAKDOWN BY SOURCE
    </v-card-title>

    <v-card-text>
      <!-- Loading state -->
      <div v-if="loading" class="text-center py-8">
        <v-progress-circular indeterminate color="primary" />
      </div>

      <!-- Chart + Legend -->
      <div v-else-if="hasData">
        <v-row align="center">
          <!-- Chart -->
          <v-col cols="12" md="5">
            <div class="chart-container" style="height: 200px; position: relative">
              <Doughnut :data="chartData" :options="chartOptions" />
              <!-- Center Total -->
              <div class="chart-center">
                <div class="text-caption text-medium-emphasis">Total</div>
                <div class="text-subtitle-1 font-weight-bold text-currency">
                  {{ formatINR(totalIncome) }}
                </div>
              </div>
            </div>
          </v-col>

          <!-- Legend / Breakdown List -->
          <v-col cols="12" md="7">
            <div class="income-list">
              <div
                v-for="item in incomeBreakdown"
                :key="item.key"
                class="income-item d-flex justify-space-between align-center py-2"
              >
                <div class="d-flex align-center">
                  <div class="color-dot mr-2" :style="{ backgroundColor: item.color }" />
                  <span class="text-body-2">{{ item.label }}</span>
                </div>
                <div class="text-right">
                  <span class="text-body-2 font-weight-medium text-currency">
                    {{ formatINR(item.amount) }}
                  </span>
                  <span class="text-caption text-medium-emphasis ml-2">
                    ({{ ((item.amount / totalIncome) * 100).toFixed(1) }}%)
                  </span>
                </div>
              </div>
            </div>
          </v-col>
        </v-row>
      </div>

      <!-- Empty state -->
      <div v-else class="text-center py-8">
        <v-icon icon="mdi-chart-donut" size="64" color="grey-lighten-1" class="mb-2" />
        <div class="text-body-2 text-medium-emphasis">No income data available</div>
        <div class="text-caption text-medium-emphasis mt-1">
          Add income in Salary or Non-Salary Income sections
        </div>
      </div>
    </v-card-text>
  </v-card>
</template>

<style scoped>
.chart-container {
  position: relative;
}

.chart-center {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
  pointer-events: none;
}

.color-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  flex-shrink: 0;
}

.income-list {
  max-height: 200px;
  overflow-y: auto;
}

.income-item {
  border-bottom: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
}

.income-item:last-child {
  border-bottom: none;
}

.text-currency {
  font-family: "Roboto Mono", monospace;
}
</style>
