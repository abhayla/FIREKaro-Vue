<script setup lang="ts">
import { ref, computed } from "vue";
import SummaryMetricCards from "@/components/shared/SummaryMetricCards.vue";
import YoYComparison from "@/components/shared/YoYComparison.vue";
import IncomeChart from "@/components/shared/IncomeChart.vue";
import CommissionWizard from "@/components/income/CommissionWizard.vue";
import GiftExemptionCalc from "@/components/income/GiftExemptionCalc.vue";
import LotteryTaxCalc from "@/components/income/LotteryTaxCalc.vue";
import {
  useOtherIncome,
  useInterestIncome,
  useDividendIncome,
  formatINR,
  formatINRLakhs,
} from "@/composables/useIncome";
import { useFinancialYear } from "@/composables/useSalary";
import type { MetricCard } from "@/components/shared/SummaryMetricCards.vue";

const emit = defineEmits<{
  (e: "go-to-details"): void;
}>();

const { selectedFinancialYear } = useFinancialYear();
const { data: otherData, isLoading } = useOtherIncome();
const { summary: interestSummary } = useInterestIncome();
const { summary: dividendSummary } = useDividendIncome();

// Tools tab
const activeToolTab = ref("commission");

// Summary stats
const totalInterest = computed(() => interestSummary.value?.totalInterest || 0);
const totalDividends = computed(() => dividendSummary.value?.totalDividends || 0);
const totalOther = computed(() => {
  return (
    otherData.value
      ?.filter((o) => !["interest", "dividend"].includes(o.category))
      .reduce((sum, o) => sum + o.grossAmount, 0) || 0
  );
});
const totalTds = computed(
  () => otherData.value?.reduce((sum, o) => sum + o.tdsDeducted, 0) || 0
);
const totalIncome = computed(() => totalInterest.value + totalDividends.value + totalOther.value);

// Summary metrics
const metrics = computed<MetricCard[]>(() => [
  {
    label: "Interest Income",
    value: totalInterest.value,
    icon: "mdi-percent",
    color: "info",
    format: "currency",
    subtitle: "FD, Savings, Bonds",
  },
  {
    label: "Dividend Income",
    value: totalDividends.value,
    icon: "mdi-cash-multiple",
    color: "warning",
    format: "currency",
    subtitle: "Stocks, MFs",
  },
  {
    label: "Other Sources",
    value: totalOther.value,
    icon: "mdi-dots-horizontal-circle",
    color: "secondary",
    format: "currency",
    subtitle: "Commission, Royalty, etc.",
  },
  {
    label: "TDS Deducted",
    value: totalTds.value,
    icon: "mdi-receipt",
    color: "error",
    format: "currency",
    subtitle: "Tax at source",
  },
]);

// Chart data - by category
const chartData = computed(() => {
  if (!otherData.value?.length) return [];
  const byCategory: Record<string, number> = {};
  for (const o of otherData.value) {
    if (!byCategory[o.category]) {
      byCategory[o.category] = 0;
    }
    byCategory[o.category] += o.grossAmount;
  }
  return Object.entries(byCategory).map(([category, amount]) => ({
    label: getCategoryLabel(category),
    primary: amount,
    secondary: 0,
  }));
});

const chartConfig = {
  title: "Other Income by Category",
  icon: "mdi-chart-bar",
  primaryLabel: "Amount",
  primaryColor: "secondary",
  showStats: true,
};

// YoY comparison (would need API support for actual data)
const yoyData = computed(() => {
  return null; // Return null to show "No comparison data available"
});

// Category breakdown
const categoryBreakdown = computed(() => {
  if (!otherData.value?.length) return [];
  const byCategory: Record<string, { count: number; amount: number }> = {};
  for (const o of otherData.value) {
    if (!byCategory[o.category]) {
      byCategory[o.category] = { count: 0, amount: 0 };
    }
    byCategory[o.category].count++;
    byCategory[o.category].amount += o.grossAmount;
  }
  const total = otherData.value.reduce((sum, o) => sum + o.grossAmount, 0) || 1;
  return Object.entries(byCategory).map(([category, data]) => ({
    category,
    label: getCategoryLabel(category),
    ...data,
    percentage: (data.amount / total) * 100,
    color: getCategoryColor(category),
  }));
});

function getCategoryLabel(category: string) {
  switch (category) {
    case "interest":
      return "Interest";
    case "dividend":
      return "Dividend";
    case "commission":
      return "Commission";
    case "royalty":
      return "Royalty";
    case "pension":
      return "Pension";
    case "gift":
      return "Gift";
    case "agricultural":
      return "Agricultural";
    default:
      return "Other";
  }
}

function getCategoryColor(category: string) {
  switch (category) {
    case "interest":
      return "info";
    case "dividend":
      return "warning";
    case "commission":
      return "primary";
    case "royalty":
      return "purple";
    case "pension":
      return "secondary";
    case "gift":
      return "pink";
    case "agricultural":
      return "success";
    default:
      return "grey";
  }
}
</script>

<template>
  <div class="other-overview-tab">
    <!-- Summary Metric Cards -->
    <SummaryMetricCards
      :metrics="metrics"
      :columns="4"
      :loading="isLoading"
      class="mb-6"
    />

    <!-- Charts Row -->
    <v-row class="mb-6">
      <!-- Other Income Chart -->
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

          <!-- Category Breakdown -->
          <v-col cols="12">
            <v-card variant="outlined">
              <v-card-title class="text-subtitle-2">
                <v-icon icon="mdi-chart-pie" class="mr-2" color="primary" size="small" />
                BY CATEGORY
              </v-card-title>
              <v-card-text v-if="categoryBreakdown.length > 0">
                <div v-for="item in categoryBreakdown" :key="item.category" class="mb-3">
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
                    :color="item.color"
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

    <!-- Deductions Info -->
    <v-row v-if="interestSummary" class="mb-6">
      <v-col cols="12" md="6">
        <v-card variant="tonal" color="info">
          <v-card-text>
            <div class="d-flex justify-space-between align-center">
              <div>
                <div class="text-body-2 font-weight-medium">80TTA Deduction</div>
                <div class="text-caption">
                  Savings bank interest (up to Rs.10,000)
                </div>
              </div>
              <div class="text-h6 text-currency font-weight-bold">
                {{ formatINR(interestSummary.deduction80TTA) }}
              </div>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
      <v-col cols="12" md="6">
        <v-card variant="tonal" color="secondary">
          <v-card-text>
            <div class="d-flex justify-space-between align-center">
              <div>
                <div class="text-body-2 font-weight-medium">80TTB Deduction (Seniors)</div>
                <div class="text-caption">
                  Interest income for 60+ (up to Rs.50,000)
                </div>
              </div>
              <div class="text-h6 text-currency font-weight-bold">
                {{ formatINR(interestSummary.deduction80TTB) }}
              </div>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Tools Section -->
    <v-expansion-panels class="mb-6">
      <v-expansion-panel>
        <v-expansion-panel-title>
          <v-icon class="mr-2" color="primary">mdi-calculator-variant</v-icon>
          <span class="font-weight-medium">Income Classification Tools & Calculators</span>
          <v-chip class="ml-2" size="x-small" color="primary" variant="tonal">
            Utilities
          </v-chip>
        </v-expansion-panel-title>
        <v-expansion-panel-text>
          <v-tabs v-model="activeToolTab" color="primary" class="mb-4">
            <v-tab value="commission">Commission Wizard</v-tab>
            <v-tab value="gift">Gift Exemption</v-tab>
            <v-tab value="lottery">Lottery/Winnings Tax</v-tab>
          </v-tabs>

          <v-tabs-window v-model="activeToolTab">
            <v-tabs-window-item value="commission">
              <CommissionWizard />
            </v-tabs-window-item>
            <v-tabs-window-item value="gift">
              <GiftExemptionCalc />
            </v-tabs-window-item>
            <v-tabs-window-item value="lottery">
              <LotteryTaxCalc />
            </v-tabs-window-item>
          </v-tabs-window>
        </v-expansion-panel-text>
      </v-expansion-panel>
    </v-expansion-panels>

    <!-- Quick Add Cards -->
    <v-row class="mb-6">
      <v-col cols="12" md="4">
        <v-card
          variant="outlined"
          class="cursor-pointer"
          @click="emit('go-to-details')"
        >
          <v-card-text class="d-flex align-center">
            <v-avatar color="info" size="40" class="mr-3">
              <v-icon icon="mdi-percent" />
            </v-avatar>
            <div>
              <div class="text-body-2 font-weight-medium">Add Interest Income</div>
              <div class="text-caption text-medium-emphasis">
                FD, Savings, P2P, Bonds
              </div>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
      <v-col cols="12" md="4">
        <v-card
          variant="outlined"
          class="cursor-pointer"
          @click="emit('go-to-details')"
        >
          <v-card-text class="d-flex align-center">
            <v-avatar color="warning" size="40" class="mr-3">
              <v-icon icon="mdi-cash-multiple" />
            </v-avatar>
            <div>
              <div class="text-body-2 font-weight-medium">Add Dividend Income</div>
              <div class="text-caption text-medium-emphasis">
                Stocks, Mutual Funds
              </div>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
      <v-col cols="12" md="4">
        <v-card
          variant="outlined"
          class="cursor-pointer"
          @click="emit('go-to-details')"
        >
          <v-card-text class="d-flex align-center">
            <v-avatar color="primary" size="40" class="mr-3">
              <v-icon icon="mdi-handshake" />
            </v-avatar>
            <div>
              <div class="text-body-2 font-weight-medium">Add Commission</div>
              <div class="text-caption text-medium-emphasis">
                Referral, Affiliate
              </div>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Empty State -->
    <v-card
      v-if="!isLoading && (!otherData || otherData.length === 0)"
      variant="outlined"
    >
      <v-card-text class="text-center pa-8">
        <v-icon icon="mdi-cash-off" size="64" color="grey-lighten-1" class="mb-4" />
        <div class="text-h6 text-medium-emphasis mb-2">
          No other income for FY {{ selectedFinancialYear }}
        </div>
        <div class="text-body-2 text-medium-emphasis mb-4">
          Start by adding your commission, pension, gifts, or other income sources in the Other Income Details tab
        </div>
        <v-btn color="primary" variant="flat" @click="emit('go-to-details')">
          <v-icon icon="mdi-arrow-right" class="mr-2" />
          Go to Other Income Details
        </v-btn>
      </v-card-text>
    </v-card>
  </div>
</template>

<style scoped>
.other-overview-tab {
  width: 100%;
}

.cursor-pointer {
  cursor: pointer;
}

.cursor-pointer:hover {
  background-color: rgba(0, 0, 0, 0.04);
}

.text-currency {
  font-family: "Roboto Mono", monospace;
}
</style>
