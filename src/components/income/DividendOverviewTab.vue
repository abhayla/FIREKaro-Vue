<script setup lang="ts">
import { computed } from "vue";
import SummaryMetricCards from "@/components/shared/SummaryMetricCards.vue";
import YoYComparison from "@/components/shared/YoYComparison.vue";
import IncomeChart from "@/components/shared/IncomeChart.vue";
import {
  useDividendIncomeAPI,
  formatINR,
  formatINRLakhs,
} from "@/composables/useIncome";
import { useFinancialYear } from "@/composables/useSalary";
import { DIVIDEND_TDS_THRESHOLD } from "@/types/income";
import type { MetricCard } from "@/components/shared/SummaryMetricCards.vue";

const emit = defineEmits<{
  (e: "go-to-details"): void;
}>();

const { selectedFinancialYear } = useFinancialYear();
const { data: dividendData, isLoading } = useDividendIncomeAPI();

// Summary from API
const summary = computed(() => dividendData.value?.summary);
const records = computed(() => dividendData.value?.records || []);

// TDS threshold alert
const companiesAboveThreshold = computed(
  () => summary.value?.companiesAboveThreshold || []
);

// Summary metrics
const metrics = computed<MetricCard[]>(() => [
  {
    label: "Total Dividends",
    value: summary.value?.totalDividend || 0,
    icon: "mdi-cash-multiple",
    color: "primary",
    format: "currency",
    subtitle: `FY ${selectedFinancialYear.value}`,
  },
  {
    label: "TDS Deducted",
    value: summary.value?.totalTDS || 0,
    icon: "mdi-receipt",
    color: "error",
    format: "currency",
    subtitle: "Tax deducted at source",
  },
  {
    label: "Net Dividend",
    value: summary.value?.netDividend || 0,
    icon: "mdi-cash-check",
    color: "success",
    format: "currency",
    subtitle: "After TDS",
  },
  {
    label: "Avg Yield",
    value: summary.value?.avgYield || 0,
    icon: "mdi-percent",
    color: "info",
    format: "percent",
    subtitle: "Portfolio dividend yield",
  },
]);

// Chart data - by source type
const chartData = computed(() => {
  if (!summary.value?.bySourceType?.length) return [];
  return summary.value.bySourceType.map((s) => ({
    label: getSourceTypeLabel(s.type),
    primary: s.dividend,
    secondary: 0,
  }));
});

const chartConfig = {
  title: "Dividend Income by Source Type",
  icon: "mdi-chart-bar",
  primaryLabel: "Dividend",
  primaryColor: "primary",
  showStats: true,
};

// YoY comparison (would need API support for actual data)
const yoyData = computed(() => {
  return null; // Return null to show "No comparison data available"
});

function getSourceTypeLabel(type: string) {
  const labels: Record<string, string> = {
    STOCK: "Stock",
    MUTUAL_FUND: "Mutual Fund",
    REIT: "REIT",
    INVIT: "InvIT",
  };
  return labels[type] || type;
}

function getSourceTypeColor(type: string) {
  const colors: Record<string, string> = {
    STOCK: "primary",
    MUTUAL_FUND: "success",
    REIT: "info",
    INVIT: "secondary",
  };
  return colors[type] || "grey";
}

function formatPercent(value: number | null | undefined) {
  if (value === null || value === undefined) return "—";
  return `${value.toFixed(2)}%`;
}
</script>

<template>
  <div class="dividend-overview-tab">
    <!-- TDS Threshold Alert -->
    <v-alert
      v-if="companiesAboveThreshold.length > 0"
      type="warning"
      variant="tonal"
      class="mb-6"
      icon="mdi-alert"
    >
      <div class="font-weight-medium">TDS Threshold Alert</div>
      <div class="text-body-2">
        {{ companiesAboveThreshold.length }} company/fund(s) have dividends exceeding
        {{ formatINR(DIVIDEND_TDS_THRESHOLD.threshold) }}. TDS at {{ DIVIDEND_TDS_THRESHOLD.tdsRate * 100 }}%
        should be deducted.
      </div>
      <v-list density="compact" class="mt-2 bg-transparent">
        <v-list-item
          v-for="item in companiesAboveThreshold"
          :key="item.company"
          class="px-0"
        >
          <template #prepend>
            <v-icon icon="mdi-domain" size="small" class="mr-2" />
          </template>
          <v-list-item-title>{{ item.company }}</v-list-item-title>
          <template #append>
            <span class="text-caption">
              {{ formatINR(item.amount) }} (Expected TDS: {{ formatINR(item.expectedTDS) }})
            </span>
          </template>
        </v-list-item>
      </v-list>
    </v-alert>

    <!-- Summary Metric Cards -->
    <SummaryMetricCards
      :metrics="metrics"
      :columns="4"
      :loading="isLoading"
      class="mb-6"
    />

    <!-- Charts Row -->
    <v-row class="mb-6">
      <!-- Dividend Income Chart -->
      <v-col cols="12" lg="8">
        <IncomeChart :data="chartData" :config="chartConfig" :loading="isLoading" />
      </v-col>

      <!-- YoY Comparison & Breakdown -->
      <v-col cols="12" lg="4">
        <v-row>
          <!-- Year-on-Year Comparison -->
          <v-col cols="12">
            <YoYComparison
              :data="yoyData"
              :loading="isLoading"
              title="Year-on-Year Comparison"
            />
          </v-col>

          <!-- Source Type Breakdown -->
          <v-col cols="12">
            <v-card variant="outlined">
              <v-card-title class="text-subtitle-2">
                <v-icon icon="mdi-chart-pie" class="mr-2" color="primary" size="small" />
                BY SOURCE TYPE
              </v-card-title>
              <v-card-text v-if="summary?.bySourceType?.length">
                <div v-for="source in summary.bySourceType" :key="source.type" class="mb-3">
                  <div class="d-flex justify-space-between align-center mb-1">
                    <span>{{ getSourceTypeLabel(source.type) }}</span>
                    <span class="font-weight-medium">
                      {{ formatINRLakhs(source.dividend) }}
                    </span>
                  </div>
                  <v-progress-linear
                    :model-value="(source.dividend / (summary?.totalDividend || 1)) * 100"
                    height="6"
                    rounded
                    :color="getSourceTypeColor(source.type)"
                  />
                  <div class="text-caption text-medium-emphasis">
                    {{ source.count }} record(s)
                  </div>
                </div>
              </v-card-text>
              <v-card-text v-else class="text-medium-emphasis text-center">
                No data available
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>
      </v-col>
    </v-row>

    <!-- Info Cards -->
    <v-row class="mb-6">
      <v-col cols="12" md="6">
        <v-card variant="outlined">
          <v-card-title>
            <v-icon class="mr-2" color="primary">mdi-information</v-icon>
            Dividend Taxation Rules
          </v-card-title>
          <v-card-text>
            <v-list density="compact">
              <v-list-item>
                <template #prepend>
                  <v-icon icon="mdi-check" color="success" size="small" />
                </template>
                <v-list-item-title>Tax Rate</v-list-item-title>
                <v-list-item-subtitle>
                  Taxed at applicable slab rate (no special rates)
                </v-list-item-subtitle>
              </v-list-item>
              <v-list-item>
                <template #prepend>
                  <v-icon icon="mdi-check" color="success" size="small" />
                </template>
                <v-list-item-title>TDS Threshold</v-list-item-title>
                <v-list-item-subtitle>
                  {{ DIVIDEND_TDS_THRESHOLD.tdsRate * 100 }}% TDS if dividend exceeds
                  {{ formatINR(DIVIDEND_TDS_THRESHOLD.threshold) }} per company
                </v-list-item-subtitle>
              </v-list-item>
              <v-list-item>
                <template #prepend>
                  <v-icon icon="mdi-check" color="success" size="small" />
                </template>
                <v-list-item-title>Reporting</v-list-item-title>
                <v-list-item-subtitle>
                  Report under "Income from Other Sources"
                </v-list-item-subtitle>
              </v-list-item>
              <v-list-item>
                <template #prepend>
                  <v-icon icon="mdi-file-document" color="primary" size="small" />
                </template>
                <v-list-item-title>ITR Form</v-list-item-title>
                <v-list-item-subtitle>ITR-2 or ITR-3</v-list-item-subtitle>
              </v-list-item>
            </v-list>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" md="6">
        <v-card variant="outlined">
          <v-card-title>
            <v-icon class="mr-2" color="info">mdi-lightbulb</v-icon>
            Dividend Yield Tips
          </v-card-title>
          <v-card-text>
            <v-list density="compact">
              <v-list-item>
                <template #prepend>
                  <v-icon icon="mdi-trending-up" color="success" size="small" />
                </template>
                <v-list-item-title>Good Yield</v-list-item-title>
                <v-list-item-subtitle>
                  Generally 2-4% is considered healthy for stocks
                </v-list-item-subtitle>
              </v-list-item>
              <v-list-item>
                <template #prepend>
                  <v-icon icon="mdi-alert" color="warning" size="small" />
                </template>
                <v-list-item-title>Very High Yield</v-list-item-title>
                <v-list-item-subtitle>
                  &gt;10% yield may indicate stock price decline or special dividend
                </v-list-item-subtitle>
              </v-list-item>
              <v-list-item>
                <template #prepend>
                  <v-icon icon="mdi-calendar" color="info" size="small" />
                </template>
                <v-list-item-title>Ex-Dividend Date</v-list-item-title>
                <v-list-item-subtitle>
                  Must hold before ex-date to receive dividend
                </v-list-item-subtitle>
              </v-list-item>
              <v-list-item>
                <template #prepend>
                  <v-icon icon="mdi-home-city" color="secondary" size="small" />
                </template>
                <v-list-item-title>REITs/InvITs</v-list-item-title>
                <v-list-item-subtitle>
                  Required to distribute 90% of income as dividends
                </v-list-item-subtitle>
              </v-list-item>
            </v-list>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Empty State -->
    <v-card
      v-if="!isLoading && (!records || records.length === 0)"
      variant="outlined"
    >
      <v-card-text class="text-center pa-8">
        <v-icon icon="mdi-cash-remove" size="64" color="grey-lighten-1" class="mb-4" />
        <div class="text-h6 text-medium-emphasis mb-2">
          No dividend income for FY {{ selectedFinancialYear }}
        </div>
        <div class="text-body-2 text-medium-emphasis mb-4">
          Start by adding your stock dividends, mutual fund dividends, and REIT/InvIT income in the Dividend Details tab
        </div>
        <v-btn color="primary" variant="flat" @click="emit('go-to-details')">
          <v-icon icon="mdi-arrow-right" class="mr-2" />
          Go to Dividend Details
        </v-btn>
      </v-card-text>
    </v-card>
  </div>
</template>

<style scoped>
.dividend-overview-tab {
  width: 100%;
}
</style>
