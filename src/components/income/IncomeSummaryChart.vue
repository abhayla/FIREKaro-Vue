<script setup lang="ts">
import { computed } from "vue";
import { Doughnut } from "vue-chartjs";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  type TooltipItem,
} from "chart.js";
import type { IncomeSummary } from "@/types/income";
import {
  doughnutChartOptions,
  chartColors,
  formatINRForChart,
} from "@/utils/chartTheme";
import { formatINR } from "@/composables/useIncome";

ChartJS.register(ArcElement, Tooltip, Legend);

interface Props {
  summary: IncomeSummary | null;
  loading?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
});

const chartData = computed(() => {
  if (!props.summary) {
    return {
      labels: [],
      datasets: [{ data: [], backgroundColor: [] }],
    };
  }

  const incomeItems = [
    {
      label: "Business",
      value: props.summary.businessIncome,
      color: chartColors.primary[0],
    },
    {
      label: "Rental",
      value: props.summary.rentalIncome,
      color: chartColors.primary[1],
    },
    {
      label: "Capital Gains",
      value: props.summary.capitalGains,
      color: chartColors.primary[2],
    },
    {
      label: "Interest",
      value: props.summary.interestIncome,
      color: chartColors.primary[3],
    },
    {
      label: "Dividends",
      value: props.summary.dividendIncome,
      color: chartColors.primary[4],
    },
    {
      label: "Other",
      value: props.summary.otherIncome,
      color: chartColors.primary[5],
    },
  ].filter((item) => item.value > 0);

  return {
    labels: incomeItems.map((item) => item.label),
    datasets: [
      {
        data: incomeItems.map((item) => item.value),
        backgroundColor: incomeItems.map((item) => item.color),
        borderColor: "#ffffff",
        borderWidth: 2,
      },
    ],
  };
});

const chartOptions = computed(() => ({
  ...doughnutChartOptions,
  plugins: {
    ...doughnutChartOptions.plugins,
    tooltip: {
      ...doughnutChartOptions.plugins?.tooltip,
      callbacks: {
        label: (context: TooltipItem<"doughnut">) => {
          const label = context.label || "";
          const value = context.raw as number;
          return `${label}: ${formatINRForChart(value)}`;
        },
      },
    },
  },
}));

const hasData = computed(() => {
  if (!props.summary) return false;
  return (
    props.summary.businessIncome > 0 ||
    props.summary.rentalIncome > 0 ||
    props.summary.capitalGains > 0 ||
    props.summary.interestIncome > 0 ||
    props.summary.dividendIncome > 0 ||
    props.summary.otherIncome > 0
  );
});

const incomeBreakdown = computed(() => {
  if (!props.summary) return [];

  return [
    {
      label: "Business/Profession",
      value: props.summary.businessIncome,
      color: "primary",
      icon: "mdi-store",
    },
    {
      label: "Rental Income",
      value: props.summary.rentalIncome,
      color: "secondary",
      icon: "mdi-home-city",
    },
    {
      label: "Capital Gains",
      value: props.summary.capitalGains,
      color: "success",
      icon: "mdi-trending-up",
    },
    {
      label: "Interest",
      value: props.summary.interestIncome,
      color: "info",
      icon: "mdi-percent",
    },
    {
      label: "Dividends",
      value: props.summary.dividendIncome,
      color: "warning",
      icon: "mdi-cash-multiple",
    },
    {
      label: "Other Sources",
      value: props.summary.otherIncome,
      color: "grey",
      icon: "mdi-dots-horizontal",
    },
  ].filter((item) => item.value > 0);
});
</script>

<template>
  <v-card :loading="loading">
    <v-card-title>
      <v-icon class="mr-2">mdi-chart-donut</v-icon>
      Income Distribution
    </v-card-title>

    <v-card-text>
      <v-row v-if="hasData">
        <v-col cols="12" md="6">
          <div class="chart-container" style="height: 250px">
            <Doughnut :data="chartData" :options="chartOptions" />
          </div>
        </v-col>

        <v-col cols="12" md="6">
          <v-list density="compact">
            <v-list-item v-for="item in incomeBreakdown" :key="item.label">
              <template #prepend>
                <v-avatar :color="item.color" size="32">
                  <v-icon :icon="item.icon" size="small" color="white" />
                </v-avatar>
              </template>

              <v-list-item-title>{{ item.label }}</v-list-item-title>

              <template #append>
                <span class="text-currency font-weight-medium">
                  {{ formatINR(item.value) }}
                </span>
              </template>
            </v-list-item>

            <v-divider class="my-2" />

            <v-list-item>
              <template #prepend>
                <v-avatar color="primary" size="32">
                  <v-icon icon="mdi-sigma" size="small" color="white" />
                </v-avatar>
              </template>

              <v-list-item-title class="font-weight-bold"
                >Total Income</v-list-item-title
              >

              <template #append>
                <span class="text-currency text-h6 font-weight-bold">
                  {{ formatINR(summary?.totalGrossIncome || 0) }}
                </span>
              </template>
            </v-list-item>
          </v-list>
        </v-col>
      </v-row>

      <div v-else class="text-center py-8">
        <v-icon
          icon="mdi-chart-donut-variant"
          size="64"
          color="grey-lighten-1"
        />
        <div class="text-body-1 text-medium-emphasis mt-4">
          No income data to display
        </div>
        <div class="text-caption text-medium-emphasis">
          Add income sources to see the distribution chart
        </div>
      </div>
    </v-card-text>
  </v-card>
</template>
