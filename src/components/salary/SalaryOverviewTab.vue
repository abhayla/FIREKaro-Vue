<script setup lang="ts">
import { computed } from "vue";
import { getCurrentFinancialYear } from "@/types/salary";
import {
  useSalarySummary,
  useSalaryComparison,
  useSalaryHistory,
  useSalaryIncomeSources,
  formatINR,
  formatINRLakhs,
} from "@/composables/useSalary";
import SummaryMetricCards from "@/components/shared/SummaryMetricCards.vue";
import SalaryChart from "@/components/salary/SalaryChart.vue";
import type { MetricCard } from "@/components/shared/SummaryMetricCards.vue";

const props = withDefaults(
  defineProps<{
    financialYear: string;
  }>(),
  {
    financialYear: () => getCurrentFinancialYear(),
  }
);

const emit = defineEmits<{
  (e: "go-to-details"): void;
}>();

// Fetch data
const { summary, isLoading: summaryLoading } = useSalarySummary(props.financialYear);
const { data: salaryHistory, isLoading: historyLoading } = useSalaryHistory(props.financialYear);
const { data: incomeSources, isLoading: sourcesLoading } = useSalaryIncomeSources(props.financialYear);

// Calculate previous FY
const previousFY = computed(() => {
  const [startYear] = props.financialYear.split("-").map(Number);
  return `${startYear - 1}-${startYear.toString().slice(-2)}`;
});

const { comparison, isLoading: comparisonLoading } = useSalaryComparison(props.financialYear, previousFY.value);

const isLoading = computed(() => summaryLoading.value || historyLoading.value);

// Summary metrics for cards
const metrics = computed<MetricCard[]>(() => {
  const data = summary.value;
  return [
    {
      label: "FY Gross",
      value: data?.totalGrossEarnings || 0,
      icon: "mdi-cash",
      color: "success",
      format: "currency",
      subtitle: data ? `Avg: ${formatINRLakhs(data.averageMonthlyGross)}/mo` : undefined,
    },
    {
      label: "FY Net",
      value: data?.totalNetSalary || 0,
      icon: "mdi-wallet",
      color: "primary",
      format: "currency",
      subtitle: data ? `Avg: ${formatINRLakhs(data.averageMonthlyNet)}/mo` : undefined,
    },
    {
      label: "TDS Paid",
      value: data?.totalTdsDeducted || 0,
      icon: "mdi-bank",
      color: "warning",
      format: "currency",
      subtitle: data && data.totalGrossEarnings > 0
        ? `~${((data.totalTdsDeducted / data.totalGrossEarnings) * 100).toFixed(1)}% of Gross`
        : undefined,
    },
    {
      label: "EPF + VPF",
      value: (data?.totalEpfContribution || 0) + (data?.totalVpfContribution || 0),
      icon: "mdi-piggy-bank",
      color: "info",
      format: "currency",
      subtitle: "EPF+VPF (80C)",
    },
  ];
});

// Data completion for 12 months
const monthCompletion = computed(() => {
  if (!salaryHistory.value) return Array(12).fill(false);

  const completed = Array(12).fill(false);
  for (const record of salaryHistory.value) {
    const monthIndex = record.month - 1;
    if (monthIndex >= 0 && monthIndex < 12) {
      completed[monthIndex] = true;
    }
  }
  return completed;
});

const monthsCompleted = computed(() => monthCompletion.value.filter(Boolean).length);

// Employer breakdown
const employerBreakdown = computed(() => {
  if (!salaryHistory.value || !incomeSources.value) return [];

  const breakdown = incomeSources.value.map((source) => {
    const sourceRecords = salaryHistory.value!.filter((r) => r.incomeSourceId === source.id);
    const totalGross = sourceRecords.reduce((sum, r) => sum + r.grossEarnings, 0);
    return {
      id: source.id,
      name: source.sourceName,
      amount: totalGross,
    };
  });

  const total = breakdown.reduce((sum, b) => sum + b.amount, 0);
  return breakdown.map((b) => ({
    ...b,
    percentage: total > 0 ? (b.amount / total) * 100 : 0,
  }));
});

// Deductions breakdown
const deductionsBreakdown = computed(() => {
  if (!salaryHistory.value) return [];

  const records = salaryHistory.value;
  const tds = records.reduce((sum, r) => sum + r.tdsDeduction, 0);
  const epf = records.reduce((sum, r) => sum + r.epfDeduction, 0);
  const vpf = records.reduce((sum, r) => sum + (r.vpfDeduction || 0), 0);
  const pt = records.reduce((sum, r) => sum + r.professionalTax, 0);
  const other = records.reduce((sum, r) => sum + r.otherDeductions, 0);

  const items = [
    { name: "TDS", amount: tds, color: "warning" },
    { name: "VPF", amount: vpf, color: "info" },
    { name: "EPF (12%)", amount: epf, color: "primary" },
    { name: "PT", amount: pt, color: "secondary" },
    { name: "Other", amount: other, color: "grey" },
  ].filter((item) => item.amount > 0);

  const total = items.reduce((sum, i) => sum + i.amount, 0);
  return items.map((item) => ({
    ...item,
    percentage: total > 0 ? (item.amount / total) * 100 : 0,
  }));
});

// Month labels
const monthLabels = ["Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec", "Jan", "Feb", "Mar"];
</script>

<template>
  <div class="salary-overview-tab">
    <!-- Summary Metric Cards -->
    <SummaryMetricCards :metrics="metrics" :columns="4" :loading="isLoading" class="mb-6" />

    <!-- Data Completion Card -->
    <v-card class="mb-6" variant="outlined">
      <v-card-text>
        <div class="d-flex align-center justify-space-between mb-3">
          <div class="d-flex align-center">
            <v-icon icon="mdi-calendar-check" class="mr-2" color="primary" />
            <span class="font-weight-medium">DATA COMPLETION</span>
          </div>
          <v-chip :color="monthsCompleted === 12 ? 'success' : 'warning'" size="small" variant="flat">
            {{ monthsCompleted }}/12 months
            <v-icon v-if="monthsCompleted === 12" icon="mdi-check" size="small" class="ml-1" />
          </v-chip>
        </div>

        <div class="completion-grid">
          <div
            v-for="(completed, index) in monthCompletion"
            :key="index"
            :class="['completion-cell', { 'is-completed': completed }]"
          >
            <v-icon v-if="completed" icon="mdi-check" size="small" color="success" />
            <span class="month-label">{{ monthLabels[index] }}</span>
          </div>
        </div>
      </v-card-text>
    </v-card>

    <!-- Charts Row -->
    <v-row class="mb-6">
      <!-- Monthly Salary Trend -->
      <v-col cols="12" lg="8">
        <v-card variant="outlined" class="fill-height">
          <v-card-title class="d-flex align-center justify-space-between">
            <div class="d-flex align-center">
              <v-icon icon="mdi-chart-line" class="mr-2" color="primary" />
              MONTHLY SALARY TREND
            </div>
            <v-btn-toggle density="compact" variant="outlined" divided>
              <v-btn value="gross" size="small">Gross</v-btn>
              <v-btn value="net" size="small">Net</v-btn>
              <v-btn value="both" size="small">Both</v-btn>
            </v-btn-toggle>
          </v-card-title>
          <v-card-text>
            <SalaryChart :records="salaryHistory || []" :loading="historyLoading" />
          </v-card-text>
        </v-card>
      </v-col>

      <!-- YoY Comparison & Employer Breakdown -->
      <v-col cols="12" lg="4">
        <v-row>
          <!-- Year-on-Year Comparison -->
          <v-col cols="12">
            <v-card variant="outlined">
              <v-card-title class="text-subtitle-2">
                <v-icon icon="mdi-compare-horizontal" class="mr-2" color="primary" size="small" />
                YEAR-ON-YEAR COMPARISON
              </v-card-title>
              <v-card-text v-if="comparison">
                <div class="text-caption text-medium-emphasis mb-2">
                  FY {{ financialYear }} vs FY {{ previousFY }}
                </div>
                <div class="d-flex justify-space-between align-center mb-2">
                  <span>Gross:</span>
                  <div class="d-flex align-center">
                    <v-icon
                      :icon="comparison.grossGrowth >= 0 ? 'mdi-arrow-up' : 'mdi-arrow-down'"
                      :color="comparison.grossGrowth >= 0 ? 'success' : 'error'"
                      size="small"
                    />
                    <span :class="comparison.grossGrowth >= 0 ? 'text-success' : 'text-error'" class="font-weight-medium">
                      {{ formatINRLakhs(Math.abs(comparison.grossGrowth)) }}
                      ({{ comparison.grossGrowthPercent >= 0 ? "+" : "" }}{{ comparison.grossGrowthPercent.toFixed(1) }}%)
                    </span>
                  </div>
                </div>
                <div class="d-flex justify-space-between align-center">
                  <span>Net:</span>
                  <div class="d-flex align-center">
                    <v-icon
                      :icon="comparison.netGrowth >= 0 ? 'mdi-arrow-up' : 'mdi-arrow-down'"
                      :color="comparison.netGrowth >= 0 ? 'success' : 'error'"
                      size="small"
                    />
                    <span :class="comparison.netGrowth >= 0 ? 'text-success' : 'text-error'" class="font-weight-medium">
                      {{ formatINRLakhs(Math.abs(comparison.netGrowth)) }}
                      ({{ comparison.netGrowthPercent >= 0 ? "+" : "" }}{{ comparison.netGrowthPercent.toFixed(1) }}%)
                    </span>
                  </div>
                </div>
              </v-card-text>
              <v-card-text v-else-if="comparisonLoading">
                <v-skeleton-loader type="text" />
              </v-card-text>
              <v-card-text v-else class="text-medium-emphasis text-center">
                No comparison data available
              </v-card-text>
            </v-card>
          </v-col>

          <!-- Employer Breakdown -->
          <v-col cols="12">
            <v-card variant="outlined">
              <v-card-title class="text-subtitle-2">
                <v-icon icon="mdi-domain" class="mr-2" color="primary" size="small" />
                EMPLOYER BREAKDOWN
              </v-card-title>
              <v-card-text v-if="employerBreakdown.length > 0">
                <div v-for="employer in employerBreakdown" :key="employer.id" class="mb-2">
                  <div class="d-flex justify-space-between align-center mb-1">
                    <span class="text-truncate" style="max-width: 150px">{{ employer.name }}</span>
                    <span class="font-weight-medium">
                      {{ formatINRLakhs(employer.amount) }} ({{ employer.percentage.toFixed(0) }}%)
                    </span>
                  </div>
                  <v-progress-linear
                    :model-value="employer.percentage"
                    height="6"
                    rounded
                    color="primary"
                  />
                </div>
              </v-card-text>
              <v-card-text v-else-if="sourcesLoading">
                <v-skeleton-loader type="text" />
              </v-card-text>
              <v-card-text v-else class="text-medium-emphasis text-center">
                No employers added
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>
      </v-col>
    </v-row>

    <!-- Deductions Breakdown -->
    <v-card variant="outlined" class="mb-6">
      <v-card-title class="text-subtitle-2">
        <v-icon icon="mdi-minus-circle" class="mr-2" color="error" size="small" />
        DEDUCTIONS BREAKDOWN
      </v-card-title>
      <v-card-text v-if="deductionsBreakdown.length > 0">
        <div v-for="item in deductionsBreakdown" :key="item.name" class="mb-3">
          <div class="d-flex justify-space-between align-center mb-1">
            <span>{{ item.name }}</span>
            <span class="font-weight-medium text-currency">
              {{ formatINRLakhs(item.amount) }} ({{ item.percentage.toFixed(0) }}%)
            </span>
          </div>
          <v-progress-linear
            :model-value="item.percentage"
            height="8"
            rounded
            :color="item.color"
          />
        </div>
      </v-card-text>
      <v-card-text v-else class="text-medium-emphasis text-center pa-8">
        <v-icon icon="mdi-information-outline" size="48" color="grey-lighten-1" class="mb-2" />
        <div>No deductions data available</div>
      </v-card-text>
    </v-card>

    <!-- Empty State (when no data at all) -->
    <v-card v-if="!isLoading && (!salaryHistory || salaryHistory.length === 0)" variant="outlined">
      <v-card-text class="text-center pa-8">
        <v-icon icon="mdi-clipboard-outline" size="64" color="grey-lighten-1" class="mb-4" />
        <div class="text-h6 text-medium-emphasis mb-2">No salary data for FY {{ financialYear }}</div>
        <div class="text-body-2 text-medium-emphasis mb-4">
          Start by adding your salary details in the Salary Details tab
        </div>
        <v-btn color="primary" variant="flat" @click="emit('go-to-details')">
          <v-icon icon="mdi-arrow-right" class="mr-2" />
          Go to Salary Details
        </v-btn>
      </v-card-text>
    </v-card>
  </div>
</template>

<style scoped>
.salary-overview-tab {
  width: 100%;
}

.completion-grid {
  display: grid;
  grid-template-columns: repeat(12, 1fr);
  gap: 4px;
}

.completion-cell {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 8px 4px;
  border-radius: 4px;
  background: rgba(var(--v-theme-on-surface), 0.04);
  transition: all 0.2s ease;
}

.completion-cell.is-completed {
  background: rgba(var(--v-theme-success), 0.1);
}

.completion-cell .month-label {
  font-size: 0.7rem;
  margin-top: 2px;
  color: rgb(var(--v-theme-on-surface-variant));
}

.completion-cell.is-completed .month-label {
  color: rgb(var(--v-theme-success));
  font-weight: 500;
}

.text-currency {
  font-family: "Roboto Mono", monospace;
}
</style>
