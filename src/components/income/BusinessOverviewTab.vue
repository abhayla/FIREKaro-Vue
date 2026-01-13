<script setup lang="ts">
import { computed } from "vue";
import SummaryMetricCards from "@/components/shared/SummaryMetricCards.vue";
import YoYComparison from "@/components/shared/YoYComparison.vue";
import IncomeChart from "@/components/shared/IncomeChart.vue";
import LockInTracker from "@/components/income/LockInTracker.vue";
import {
  useBusinessIncome,
  formatINR,
  formatINRLakhs,
} from "@/composables/useIncome";
import { useFinancialYear } from "@/composables/useSalary";
import { PRESUMPTIVE_TAX_LIMITS } from "@/types/income";
import type { MetricCard } from "@/components/shared/SummaryMetricCards.vue";

const emit = defineEmits<{
  (e: "go-to-details"): void;
}>();

const { selectedFinancialYear } = useFinancialYear();
const { data: businessData, isLoading } = useBusinessIncome();

// Summary stats
const totalGrossReceipts = computed(
  () => businessData.value?.reduce((sum, b) => sum + b.grossReceipts, 0) || 0
);
const totalDeemedProfit = computed(
  () => businessData.value?.reduce((sum, b) => sum + b.deemedProfit, 0) || 0
);
const businessCount = computed(() => businessData.value?.length || 0);

// Average profit rate
const avgProfitRate = computed(() => {
  if (!businessData.value?.length) return 0;
  const totalRate = businessData.value.reduce((sum, b) => sum + b.deemedProfitRate, 0);
  return totalRate / businessData.value.length;
});

// Summary metrics
const metrics = computed<MetricCard[]>(() => [
  {
    label: "Total Businesses",
    value: businessCount.value,
    icon: "mdi-store",
    color: "primary",
    format: "number",
    subtitle: `FY ${selectedFinancialYear.value}`,
  },
  {
    label: "Gross Receipts",
    value: totalGrossReceipts.value,
    icon: "mdi-cash",
    color: "info",
    format: "currency",
    subtitle: "Total turnover",
  },
  {
    label: "Taxable Profit",
    value: totalDeemedProfit.value,
    icon: "mdi-trending-up",
    color: "success",
    format: "currency",
    subtitle: `~${(avgProfitRate.value * 100).toFixed(1)}% avg rate`,
  },
]);

// Chart data - monthly breakdown (if available) or by business
const chartData = computed(() => {
  if (!businessData.value?.length) return [];
  return businessData.value.map((b) => ({
    label: b.businessName.substring(0, 10),
    primary: b.grossReceipts,
    secondary: b.deemedProfit,
  }));
});

const chartConfig = {
  title: "Business Income Overview",
  icon: "mdi-chart-bar",
  primaryLabel: "Gross Receipts",
  primaryColor: "info",
  secondaryLabel: "Taxable Profit",
  secondaryColor: "success",
  showStats: true,
};

// Calculate previous FY
const previousFY = computed(() => {
  const [startYear] = selectedFinancialYear.value.split("-").map(Number);
  return `${startYear - 1}-${startYear.toString().slice(-2)}`;
});

// YoY comparison (mock for now - would need API support)
const yoyData = computed(() => {
  // This would normally come from API comparing two FYs
  return null; // Return null to show "No comparison data available"
});

// Business breakdown by type
const businessByType = computed(() => {
  if (!businessData.value?.length) return [];
  const byType: Record<string, { count: number; amount: number }> = {};
  for (const b of businessData.value) {
    if (!byType[b.taxationMethod]) {
      byType[b.taxationMethod] = { count: 0, amount: 0 };
    }
    byType[b.taxationMethod].count++;
    byType[b.taxationMethod].amount += b.deemedProfit;
  }
  return Object.entries(byType).map(([type, data]) => ({
    type,
    label: type === "44AD" ? "Sec 44AD" : type === "44ADA" ? "Sec 44ADA" : "Regular",
    ...data,
    percentage: totalDeemedProfit.value > 0 ? (data.amount / totalDeemedProfit.value) * 100 : 0,
  }));
});
</script>

<template>
  <div class="business-overview-tab">
    <!-- Summary Metric Cards -->
    <SummaryMetricCards :metrics="metrics" :columns="3" :loading="isLoading" class="mb-6" />

    <!-- Charts Row -->
    <v-row class="mb-6">
      <!-- Business Income Chart -->
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

          <!-- Taxation Method Breakdown -->
          <v-col cols="12">
            <v-card variant="outlined">
              <v-card-title class="text-subtitle-2">
                <v-icon icon="mdi-chart-pie" class="mr-2" color="primary" size="small" />
                BY TAXATION METHOD
              </v-card-title>
              <v-card-text v-if="businessByType.length > 0">
                <div v-for="item in businessByType" :key="item.type" class="mb-3">
                  <div class="d-flex justify-space-between align-center mb-1">
                    <span>{{ item.label }}</span>
                    <span class="font-weight-medium">
                      {{ formatINRLakhs(item.amount) }} ({{ item.percentage.toFixed(0) }}%)
                    </span>
                  </div>
                  <v-progress-linear
                    :model-value="item.percentage"
                    height="6"
                    rounded
                    :color="item.type === '44AD' ? 'primary' : item.type === '44ADA' ? 'secondary' : 'grey'"
                  />
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

    <!-- 5-Year Lock-in Tracker -->
    <v-expansion-panels class="mb-6">
      <v-expansion-panel>
        <v-expansion-panel-title>
          <v-icon class="mr-2" color="warning">mdi-lock-clock</v-icon>
          <span class="font-weight-medium">5-Year Lock-in Tracker (44AD/44ADA)</span>
          <v-chip class="ml-2" size="x-small" color="warning" variant="tonal">
            Important
          </v-chip>
        </v-expansion-panel-title>
        <v-expansion-panel-text>
          <LockInTracker />
        </v-expansion-panel-text>
      </v-expansion-panel>
    </v-expansion-panels>

    <!-- Info Cards -->
    <v-row class="mb-6">
      <v-col cols="12" md="6">
        <v-card variant="outlined">
          <v-card-title>
            <v-icon class="mr-2" color="primary">mdi-information</v-icon>
            Section 44AD - Business
          </v-card-title>
          <v-card-text>
            <v-list density="compact">
              <v-list-item>
                <template #prepend>
                  <v-icon icon="mdi-check" color="success" size="small" />
                </template>
                <v-list-item-title>Turnover Limit</v-list-item-title>
                <v-list-item-subtitle>
                  Up to {{ formatINR(PRESUMPTIVE_TAX_LIMITS["44AD"].turnoverLimit) }}
                </v-list-item-subtitle>
              </v-list-item>
              <v-list-item>
                <template #prepend>
                  <v-icon icon="mdi-check" color="success" size="small" />
                </template>
                <v-list-item-title>Deemed Profit - Cash</v-list-item-title>
                <v-list-item-subtitle>8% of turnover</v-list-item-subtitle>
              </v-list-item>
              <v-list-item>
                <template #prepend>
                  <v-icon icon="mdi-check" color="success" size="small" />
                </template>
                <v-list-item-title>Deemed Profit - Digital</v-list-item-title>
                <v-list-item-subtitle>6% for digital/bank payments</v-list-item-subtitle>
              </v-list-item>
              <v-list-item>
                <template #prepend>
                  <v-icon icon="mdi-file-document" color="primary" size="small" />
                </template>
                <v-list-item-title>ITR Form</v-list-item-title>
                <v-list-item-subtitle>ITR-4 (Sugam)</v-list-item-subtitle>
              </v-list-item>
            </v-list>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" md="6">
        <v-card variant="outlined">
          <v-card-title>
            <v-icon class="mr-2" color="secondary">mdi-information</v-icon>
            Section 44ADA - Profession
          </v-card-title>
          <v-card-text>
            <v-list density="compact">
              <v-list-item>
                <template #prepend>
                  <v-icon icon="mdi-check" color="success" size="small" />
                </template>
                <v-list-item-title>Gross Receipts Limit</v-list-item-title>
                <v-list-item-subtitle>
                  Up to {{ formatINR(PRESUMPTIVE_TAX_LIMITS["44ADA"].receiptsLimit) }}
                </v-list-item-subtitle>
              </v-list-item>
              <v-list-item>
                <template #prepend>
                  <v-icon icon="mdi-check" color="success" size="small" />
                </template>
                <v-list-item-title>Deemed Profit</v-list-item-title>
                <v-list-item-subtitle>50% of gross receipts</v-list-item-subtitle>
              </v-list-item>
              <v-list-item>
                <template #prepend>
                  <v-icon icon="mdi-account-tie" color="secondary" size="small" />
                </template>
                <v-list-item-title>Eligible Professions</v-list-item-title>
                <v-list-item-subtitle>Legal, Medical, Engineering, Architects, CA, etc.</v-list-item-subtitle>
              </v-list-item>
              <v-list-item>
                <template #prepend>
                  <v-icon icon="mdi-file-document" color="primary" size="small" />
                </template>
                <v-list-item-title>ITR Form</v-list-item-title>
                <v-list-item-subtitle>ITR-4 (Sugam)</v-list-item-subtitle>
              </v-list-item>
            </v-list>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Empty State -->
    <v-card v-if="!isLoading && (!businessData || businessData.length === 0)" variant="outlined">
      <v-card-text class="text-center pa-8">
        <v-icon icon="mdi-store-outline" size="64" color="grey-lighten-1" class="mb-4" />
        <div class="text-h6 text-medium-emphasis mb-2">
          No business income for FY {{ selectedFinancialYear }}
        </div>
        <div class="text-body-2 text-medium-emphasis mb-4">
          Start by adding your business or professional income in the Business Details tab
        </div>
        <v-btn color="primary" variant="flat" @click="emit('go-to-details')">
          <v-icon icon="mdi-arrow-right" class="mr-2" />
          Go to Business Details
        </v-btn>
      </v-card-text>
    </v-card>
  </div>
</template>

<style scoped>
.business-overview-tab {
  width: 100%;
}
</style>
