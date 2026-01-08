<script setup lang="ts">
import { computed } from "vue";
import SectionHeader from "@/components/shared/SectionHeader.vue";
import FamilyToggle from "@/components/shared/FamilyToggle.vue";
import SalaryChart from "@/components/salary/SalaryChart.vue";
import SalaryComparisonCard from "@/components/salary/SalaryComparisonCard.vue";
import {
  useSalaryHistory,
  useSalarySummary,
  useFinancialYear,
  useSalaryComparison,
  formatINR,
  formatINRLakhs,
} from "@/composables/useSalary";
import {
  getCurrentFinancialYear,
  getFinancialYearOptions,
} from "@/types/salary";

const tabs = [
  { title: "Overview", route: "/dashboard/salary" },
  { title: "Current Salary", route: "/dashboard/salary/current" },
  { title: "Salary History", route: "/dashboard/salary/history" },
  { title: "Reports", route: "/dashboard/salary/reports" },
];

const { selectedFinancialYear, setFinancialYear } = useFinancialYear();
const fyOptions = getFinancialYearOptions();

const { data: salaryHistory, isLoading: historyLoading } = useSalaryHistory();
const { summary, isLoading: summaryLoading } = useSalarySummary();

// Get previous FY for comparison
const currentFY = getCurrentFinancialYear();
const previousFY = computed(() => {
  const [startYear] = currentFY.split("-").map(Number);
  return `${startYear - 1}-${startYear.toString().slice(-2)}`;
});

const { comparison, isLoading: comparisonLoading } = useSalaryComparison(
  currentFY,
  previousFY.value,
);

// Loading state
const isLoading = computed(() => historyLoading.value || summaryLoading.value);

// Summary metrics
const metrics = computed(() => {
  if (!summary.value) {
    return {
      monthlyGross: 0,
      monthlyNet: 0,
      annualGross: 0,
      tdsYtd: 0,
    };
  }
  return {
    monthlyGross: summary.value.averageMonthlyGross,
    monthlyNet: summary.value.averageMonthlyNet,
    annualGross: summary.value.totalGrossEarnings,
    tdsYtd: summary.value.totalTdsDeducted,
  };
});

// Completion percentage
const completionPercent = computed(() => {
  if (!summary.value) return 0;
  return Math.round((summary.value.monthsRecorded / 12) * 100);
});
</script>

<template>
  <div>
    <SectionHeader
      title="Salary"
      subtitle="Track your salary income and history"
      icon="mdi-cash-multiple"
      :tabs="tabs"
    />

    <FamilyToggle class="mb-6" />

    <!-- FY Selector -->
    <div class="d-flex justify-end mb-4">
      <v-select
        v-model="selectedFinancialYear"
        :items="fyOptions"
        label="Financial Year"
        density="compact"
        variant="outlined"
        style="max-width: 150px"
        hide-details
        @update:model-value="setFinancialYear"
      />
    </div>

    <!-- Summary Cards -->
    <v-row>
      <v-col cols="12" md="6" lg="3">
        <v-card class="pa-4" :loading="isLoading">
          <div class="d-flex align-center justify-space-between">
            <div>
              <div class="text-body-2 text-medium-emphasis">
                Monthly Gross (Avg)
              </div>
              <div class="text-h5 font-weight-bold">
                {{ isLoading ? "..." : formatINR(metrics.monthlyGross) }}
              </div>
            </div>
            <v-avatar color="success" variant="tonal" size="48">
              <v-icon icon="mdi-cash" />
            </v-avatar>
          </div>
        </v-card>
      </v-col>
      <v-col cols="12" md="6" lg="3">
        <v-card class="pa-4" :loading="isLoading">
          <div class="d-flex align-center justify-space-between">
            <div>
              <div class="text-body-2 text-medium-emphasis">
                Monthly Net (Avg)
              </div>
              <div class="text-h5 font-weight-bold">
                {{ isLoading ? "..." : formatINR(metrics.monthlyNet) }}
              </div>
            </div>
            <v-avatar color="primary" variant="tonal" size="48">
              <v-icon icon="mdi-wallet" />
            </v-avatar>
          </div>
        </v-card>
      </v-col>
      <v-col cols="12" md="6" lg="3">
        <v-card class="pa-4" :loading="isLoading">
          <div class="d-flex align-center justify-space-between">
            <div>
              <div class="text-body-2 text-medium-emphasis">
                Annual Gross (YTD)
              </div>
              <div class="text-h5 font-weight-bold">
                {{ isLoading ? "..." : formatINRLakhs(metrics.annualGross) }}
              </div>
            </div>
            <v-avatar color="info" variant="tonal" size="48">
              <v-icon icon="mdi-chart-line" />
            </v-avatar>
          </div>
        </v-card>
      </v-col>
      <v-col cols="12" md="6" lg="3">
        <v-card class="pa-4" :loading="isLoading">
          <div class="d-flex align-center justify-space-between">
            <div>
              <div class="text-body-2 text-medium-emphasis">TDS (YTD)</div>
              <div class="text-h5 font-weight-bold">
                {{ isLoading ? "..." : formatINRLakhs(metrics.tdsYtd) }}
              </div>
            </div>
            <v-avatar color="warning" variant="tonal" size="48">
              <v-icon icon="mdi-receipt-text" />
            </v-avatar>
          </div>
        </v-card>
      </v-col>
    </v-row>

    <!-- Data Completion Progress -->
    <v-card class="mt-6 pa-4">
      <div class="d-flex align-center justify-space-between mb-2">
        <div class="d-flex align-center">
          <v-icon icon="mdi-calendar-check" class="mr-2" color="primary" />
          <span class="font-weight-medium"
            >{{ selectedFinancialYear }} Data Completion</span
          >
        </div>
        <v-chip
          :color="completionPercent === 100 ? 'success' : 'warning'"
          size="small"
        >
          {{ summary?.monthsRecorded || 0 }}/12 months
        </v-chip>
      </div>
      <v-progress-linear
        :model-value="completionPercent"
        :color="completionPercent === 100 ? 'success' : 'primary'"
        height="8"
        rounded
      />
      <div class="d-flex justify-space-between mt-2">
        <span class="text-caption text-medium-emphasis">Apr</span>
        <span class="text-caption text-medium-emphasis">Mar</span>
      </div>
    </v-card>

    <!-- Charts Row -->
    <v-row class="mt-2">
      <v-col cols="12" lg="8">
        <SalaryChart :records="salaryHistory || []" :loading="historyLoading" />
      </v-col>
      <v-col cols="12" lg="4">
        <SalaryComparisonCard
          :comparison="comparison"
          :loading="comparisonLoading"
        />
      </v-col>
    </v-row>

    <!-- Quick Actions -->
    <v-card class="mt-6">
      <v-card-title>Quick Actions</v-card-title>
      <v-card-text>
        <v-row>
          <v-col cols="12" sm="6" md="3">
            <v-btn
              block
              variant="tonal"
              color="primary"
              prepend-icon="mdi-plus"
              to="/dashboard/salary/history"
            >
              Add Salary Entry
            </v-btn>
          </v-col>
          <v-col cols="12" sm="6" md="3">
            <v-btn
              block
              variant="tonal"
              color="info"
              prepend-icon="mdi-eye"
              to="/dashboard/salary/current"
            >
              View Breakdown
            </v-btn>
          </v-col>
          <v-col cols="12" sm="6" md="3">
            <v-btn
              block
              variant="tonal"
              color="success"
              prepend-icon="mdi-file-excel"
              disabled
            >
              Import Excel
            </v-btn>
          </v-col>
          <v-col cols="12" sm="6" md="3">
            <v-btn
              block
              variant="tonal"
              color="warning"
              prepend-icon="mdi-file-pdf-box"
              to="/dashboard/salary/reports"
            >
              Generate Report
            </v-btn>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>
  </div>
</template>
