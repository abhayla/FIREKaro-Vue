<script setup lang="ts">
import { computed } from "vue";
import SummaryMetricCards from "@/components/shared/SummaryMetricCards.vue";
import YoYComparison from "@/components/shared/YoYComparison.vue";
import IncomeChart from "@/components/shared/IncomeChart.vue";
import {
  useInterestIncomeAPI,
  useFDMaturityCalendar,
  formatINR,
  formatINRLakhs,
} from "@/composables/useIncome";
import { useFinancialYear } from "@/composables/useSalary";
import { INTEREST_DEDUCTION_LIMITS } from "@/types/income";
import type { MetricCard } from "@/components/shared/SummaryMetricCards.vue";

const emit = defineEmits<{
  (e: "go-to-details"): void;
}>();

const { selectedFinancialYear } = useFinancialYear();
const { data: interestData, isLoading } = useInterestIncomeAPI();

// FD Maturity Calendar (next 12 months)
const calendarStartDate = computed(() => new Date().toISOString().split("T")[0]);
const calendarEndDate = computed(() => {
  const date = new Date();
  date.setFullYear(date.getFullYear() + 1);
  return date.toISOString().split("T")[0];
});
const { data: calendarData } = useFDMaturityCalendar(
  calendarStartDate.value,
  calendarEndDate.value
);

// Summary from API
const summary = computed(() => interestData.value?.summary);
const records = computed(() => interestData.value?.records || []);

// Summary metrics
const metrics = computed<MetricCard[]>(() => [
  {
    label: "Total Interest",
    value: summary.value?.totalInterest || 0,
    icon: "mdi-bank",
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
    label: "80TTA Deduction",
    value: summary.value?.deduction80TTA || 0,
    icon: "mdi-shield-check",
    color: "success",
    format: "currency",
    subtitle: `Max ${formatINR(INTEREST_DEDUCTION_LIMITS["80TTA"].limit)}`,
  },
  {
    label: "80TTB (Seniors)",
    value: summary.value?.deduction80TTB || 0,
    icon: "mdi-account-star",
    color: "orange",
    format: "currency",
    subtitle: `Max ${formatINR(INTEREST_DEDUCTION_LIMITS["80TTB"].limit)}`,
  },
]);

// Chart data - by source type
const chartData = computed(() => {
  if (!records.value?.length) return [];
  const byType: Record<string, { interest: number; tds: number }> = {};
  for (const r of records.value) {
    if (!byType[r.sourceType]) {
      byType[r.sourceType] = { interest: 0, tds: 0 };
    }
    byType[r.sourceType].interest += r.interestEarned;
    byType[r.sourceType].tds += r.tdsDeducted || 0;
  }
  return Object.entries(byType).map(([type, data]) => ({
    label: getSourceTypeLabel(type),
    primary: data.interest,
    secondary: data.tds,
  }));
});

const chartConfig = {
  title: "Interest Income by Source Type",
  icon: "mdi-chart-bar",
  primaryLabel: "Interest",
  primaryColor: "primary",
  secondaryLabel: "TDS",
  secondaryColor: "error",
  showStats: true,
};

// YoY comparison (would need API support for actual data)
const yoyData = computed(() => {
  return null; // Return null to show "No comparison data available"
});

// Interest breakdown by type
const interestByType = computed(() => {
  if (!records.value?.length) return [];
  const byType: Record<string, { count: number; amount: number }> = {};
  for (const r of records.value) {
    if (!byType[r.sourceType]) {
      byType[r.sourceType] = { count: 0, amount: 0 };
    }
    byType[r.sourceType].count++;
    byType[r.sourceType].amount += r.interestEarned;
  }
  const total = summary.value?.totalInterest || 1;
  return Object.entries(byType).map(([type, data]) => ({
    type,
    label: getSourceTypeLabel(type),
    ...data,
    percentage: (data.amount / total) * 100,
    color: getSourceTypeColor(type),
  }));
});

function getSourceTypeLabel(type: string) {
  const labels: Record<string, string> = {
    FD: "Fixed Deposit",
    RD: "Recurring Deposit",
    SAVINGS: "Savings Account",
    P2P: "P2P Lending",
    BONDS: "Bonds",
    NSC: "NSC",
    SCSS: "SCSS",
    PPF: "PPF",
    OTHER: "Other",
  };
  return labels[type] || type;
}

function getSourceTypeColor(type: string) {
  const colors: Record<string, string> = {
    FD: "primary",
    RD: "primary",
    SAVINGS: "success",
    P2P: "warning",
    BONDS: "info",
    NSC: "secondary",
    SCSS: "orange",
    PPF: "teal",
    OTHER: "grey",
  };
  return colors[type] || "grey";
}

function formatDate(dateStr: string | null | undefined) {
  if (!dateStr) return "-";
  return new Date(dateStr).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}
</script>

<template>
  <div class="interest-overview-tab">
    <!-- Summary Metric Cards -->
    <SummaryMetricCards
      :metrics="metrics"
      :columns="4"
      :loading="isLoading"
      class="mb-6"
    />

    <!-- Charts Row -->
    <v-row class="mb-6">
      <!-- Interest Income Chart -->
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
              <v-card-text v-if="interestByType.length > 0">
                <div v-for="item in interestByType" :key="item.type" class="mb-3">
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

    <!-- FD Maturity Calendar -->
    <v-card class="mb-6" v-if="calendarData && calendarData.records.length > 0">
      <v-card-title class="d-flex align-center">
        <v-icon class="mr-2" color="warning">mdi-calendar-clock</v-icon>
        Upcoming FD/RD Maturities
        <v-chip class="ml-2" size="small" color="warning">
          {{ calendarData.records.length }} upcoming
        </v-chip>
      </v-card-title>
      <v-card-text>
        <v-timeline side="end" density="compact">
          <v-timeline-item
            v-for="maturity in calendarData.records.slice(0, 5)"
            :key="maturity.id"
            :dot-color="maturity.isAutoRenew ? 'success' : 'warning'"
            size="small"
          >
            <template #opposite>
              <span class="text-caption">{{ formatDate(maturity.maturityDate) }}</span>
            </template>
            <v-card variant="tonal" class="pa-2">
              <div class="d-flex justify-space-between align-center">
                <div>
                  <div class="font-weight-medium">{{ maturity.institutionName }}</div>
                  <div class="text-caption text-medium-emphasis">
                    {{ maturity.accountNumber || maturity.sourceType }}
                  </div>
                </div>
                <div class="text-right">
                  <div class="text-currency font-weight-bold">
                    {{ formatINR(maturity.maturityAmount || maturity.principalAmount || 0) }}
                  </div>
                  <v-chip
                    v-if="maturity.isAutoRenew"
                    size="x-small"
                    color="success"
                    variant="flat"
                  >
                    Auto-Renew
                  </v-chip>
                </div>
              </div>
            </v-card>
          </v-timeline-item>
        </v-timeline>
        <div v-if="calendarData.records.length > 5" class="text-center mt-2">
          <v-btn variant="text" size="small" color="primary">
            View All {{ calendarData.records.length }} Maturities
          </v-btn>
        </div>
      </v-card-text>
    </v-card>

    <!-- Info Cards -->
    <v-row class="mb-6">
      <v-col cols="12" md="6">
        <v-card variant="outlined">
          <v-card-title>
            <v-icon class="mr-2" color="success">mdi-shield-check</v-icon>
            Section 80TTA - Savings Interest
          </v-card-title>
          <v-card-text>
            <v-list density="compact">
              <v-list-item>
                <template #prepend>
                  <v-icon icon="mdi-check" color="success" size="small" />
                </template>
                <v-list-item-title>Eligibility</v-list-item-title>
                <v-list-item-subtitle>
                  Individuals & HUFs (below 60 years)
                </v-list-item-subtitle>
              </v-list-item>
              <v-list-item>
                <template #prepend>
                  <v-icon icon="mdi-check" color="success" size="small" />
                </template>
                <v-list-item-title>Deduction Limit</v-list-item-title>
                <v-list-item-subtitle>
                  Up to {{ formatINR(INTEREST_DEDUCTION_LIMITS["80TTA"].limit) }} per year
                </v-list-item-subtitle>
              </v-list-item>
              <v-list-item>
                <template #prepend>
                  <v-icon icon="mdi-check" color="success" size="small" />
                </template>
                <v-list-item-title>Applicable On</v-list-item-title>
                <v-list-item-subtitle>
                  Savings bank, co-op bank, post office accounts
                </v-list-item-subtitle>
              </v-list-item>
              <v-list-item>
                <template #prepend>
                  <v-icon icon="mdi-close" color="error" size="small" />
                </template>
                <v-list-item-title>Not Applicable</v-list-item-title>
                <v-list-item-subtitle>
                  FD, RD, corporate bonds, P2P lending
                </v-list-item-subtitle>
              </v-list-item>
            </v-list>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" md="6">
        <v-card variant="outlined">
          <v-card-title>
            <v-icon class="mr-2" color="orange">mdi-account-star</v-icon>
            Section 80TTB - Senior Citizens
          </v-card-title>
          <v-card-text>
            <v-list density="compact">
              <v-list-item>
                <template #prepend>
                  <v-icon icon="mdi-check" color="success" size="small" />
                </template>
                <v-list-item-title>Eligibility</v-list-item-title>
                <v-list-item-subtitle>
                  Senior Citizens (60+ years)
                </v-list-item-subtitle>
              </v-list-item>
              <v-list-item>
                <template #prepend>
                  <v-icon icon="mdi-check" color="success" size="small" />
                </template>
                <v-list-item-title>Deduction Limit</v-list-item-title>
                <v-list-item-subtitle>
                  Up to {{ formatINR(INTEREST_DEDUCTION_LIMITS["80TTB"].limit) }} per year
                </v-list-item-subtitle>
              </v-list-item>
              <v-list-item>
                <template #prepend>
                  <v-icon icon="mdi-check" color="success" size="small" />
                </template>
                <v-list-item-title>Applicable On</v-list-item-title>
                <v-list-item-subtitle>
                  All interest: Savings, FD, RD, post office schemes
                </v-list-item-subtitle>
              </v-list-item>
              <v-list-item>
                <template #prepend>
                  <v-icon icon="mdi-alert" color="warning" size="small" />
                </template>
                <v-list-item-title>Note</v-list-item-title>
                <v-list-item-subtitle>
                  80TTA and 80TTB are mutually exclusive
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
        <v-icon icon="mdi-bank-off" size="64" color="grey-lighten-1" class="mb-4" />
        <div class="text-h6 text-medium-emphasis mb-2">
          No interest income for FY {{ selectedFinancialYear }}
        </div>
        <div class="text-body-2 text-medium-emphasis mb-4">
          Start by adding your FDs, savings account interest, and other interest income in the Interest Details tab
        </div>
        <v-btn color="primary" variant="flat" @click="emit('go-to-details')">
          <v-icon icon="mdi-arrow-right" class="mr-2" />
          Go to Interest Details
        </v-btn>
      </v-card-text>
    </v-card>
  </div>
</template>

<style scoped>
.interest-overview-tab {
  width: 100%;
}

.text-currency {
  font-family: "Roboto Mono", monospace;
}
</style>
