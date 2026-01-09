<script setup lang="ts">
import { computed, ref } from "vue";
import { useRouter } from "vue-router";
import SectionHeader from "@/components/shared/SectionHeader.vue";
import SummaryMetricCards from "@/components/shared/SummaryMetricCards.vue";
import FinancialYearSelector from "@/components/shared/FinancialYearSelector.vue";
import EmployerCard from "@/components/salary/EmployerCard.vue";
import SalaryMonthlyGrid from "@/components/salary/SalaryMonthlyGrid.vue";
import SalaryChart from "@/components/salary/SalaryChart.vue";
import SalaryComparisonCard from "@/components/salary/SalaryComparisonCard.vue";
import SalaryComponentManager from "@/components/salary/SalaryComponentManager.vue";
import {
  useSalaryHistory,
  useSalarySummary,
  useFinancialYear,
  useSalaryComparison,
  useEmployerSalarySummaries,
  useEmployerSalaryGrid,
  formatINR,
  formatINRLakhs,
} from "@/composables/useSalary";
import { getCurrentFinancialYear } from "@/types/salary";
import type { MetricCard } from "@/components/shared/SummaryMetricCards.vue";

const router = useRouter();

const tabs = [
  { title: "Overview", route: "/dashboard/salary" },
  { title: "Current Salary", route: "/dashboard/salary/current" },
  { title: "Salary History", route: "/dashboard/salary/history" },
  { title: "Reports", route: "/dashboard/salary/reports" },
];

const { selectedFinancialYear, setFinancialYear } = useFinancialYear();

const { data: salaryHistory, isLoading: historyLoading } = useSalaryHistory();
const { summary, isLoading: summaryLoading } = useSalarySummary();
const { summaries: employerSummaries, isLoading: employersLoading } = useEmployerSalarySummaries();

// Selected employer for grid view
const selectedIncomeSourceId = ref<string | undefined>(undefined);
const showGrid = ref(false);

// Component manager dialog
const showComponentManager = ref(false);

// Grid data for selected employer
const { gridData, isLoading: gridLoading } = useEmployerSalaryGrid(selectedIncomeSourceId);

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

// Summary metrics for SummaryMetricCards
const metrics = computed<MetricCard[]>(() => {
  const data = summary.value;
  return [
    {
      label: "Monthly Gross (Avg)",
      value: data?.averageMonthlyGross || 0,
      icon: "mdi-cash",
      color: "success",
      format: "currency",
    },
    {
      label: "Monthly Net (Avg)",
      value: data?.averageMonthlyNet || 0,
      icon: "mdi-wallet",
      color: "primary",
      format: "currency",
    },
    {
      label: "Annual Gross (YTD)",
      value: data?.totalGrossEarnings || 0,
      icon: "mdi-chart-line",
      color: "info",
      format: "currency",
      subtitle: `${data?.monthsRecorded || 0} months recorded`,
    },
    {
      label: "TDS (YTD)",
      value: data?.totalTdsDeducted || 0,
      icon: "mdi-receipt-text",
      color: "warning",
      format: "currency",
    },
  ];
});

// Completion percentage
const completionPercent = computed(() => {
  if (!summary.value) return 0;
  return Math.round((summary.value.monthsRecorded / 12) * 100);
});

// View breakdown for an employer
const viewEmployerBreakdown = (incomeSourceId: string) => {
  selectedIncomeSourceId.value = incomeSourceId;
  showGrid.value = true;
};

// Close grid view
const closeGridView = () => {
  showGrid.value = false;
  selectedIncomeSourceId.value = undefined;
};

// Handle cell click in grid
const handleCellClick = (payload: { componentCode: string; monthIndex: number; value: number | null }) => {
  // Navigate to salary history page with month pre-selected
  router.push({
    path: "/dashboard/salary/history",
    query: {
      month: (payload.monthIndex + 1).toString(),
      incomeSourceId: selectedIncomeSourceId.value,
    },
  });
};
</script>

<template>
  <div>
    <SectionHeader
      title="Salary"
      subtitle="Track your salary income and history"
      icon="mdi-cash-multiple"
      :tabs="tabs"
    />

    <!-- FY Selector + Settings -->
    <div class="d-flex justify-end align-center ga-2 mb-4">
      <v-btn
        icon="mdi-cog"
        variant="text"
        size="small"
        title="Manage Salary Components"
        @click="showComponentManager = true"
      />
      <FinancialYearSelector
        v-model="selectedFinancialYear"
        :dense="true"
        @update:model-value="setFinancialYear"
      />
    </div>

    <!-- Summary Cards -->
    <SummaryMetricCards
      :metrics="metrics"
      :columns="4"
      :loading="isLoading"
      class="mb-6"
    />

    <!-- Employer Cards Section -->
    <v-card class="mb-6" variant="outlined">
      <v-card-title class="d-flex align-center justify-space-between">
        <div class="d-flex align-center">
          <v-icon icon="mdi-office-building" class="mr-2" color="primary" />
          Salary Sources
        </div>
        <v-btn
          color="primary"
          variant="tonal"
          size="small"
          prepend-icon="mdi-plus"
          to="/dashboard/salary/history"
        >
          Add Employer
        </v-btn>
      </v-card-title>
      <v-card-text>
        <v-row v-if="employersLoading">
          <v-col v-for="i in 2" :key="i" cols="12" md="6" lg="4">
            <v-skeleton-loader type="card" />
          </v-col>
        </v-row>
        <v-row v-else-if="employerSummaries && employerSummaries.length > 0">
          <v-col
            v-for="employer in employerSummaries"
            :key="employer.incomeSource.id"
            cols="12"
            md="6"
            lg="4"
          >
            <EmployerCard
              :summary="employer"
              @view-breakdown="viewEmployerBreakdown(employer.incomeSource.id)"
              @edit="router.push(`/dashboard/salary/history?incomeSourceId=${employer.incomeSource.id}`)"
            />
          </v-col>
        </v-row>
        <div v-else class="text-center pa-8">
          <v-icon icon="mdi-briefcase-off-outline" size="64" color="grey-lighten-1" class="mb-4" />
          <div class="text-h6 text-medium-emphasis mb-2">No employers added</div>
          <div class="text-body-2 text-medium-emphasis mb-4">
            Add your first employer to start tracking salary
          </div>
          <v-btn color="primary" variant="flat" to="/dashboard/salary/history">
            <v-icon icon="mdi-plus" class="mr-2" />
            Add Employer
          </v-btn>
        </div>
      </v-card-text>
    </v-card>

    <!-- Monthly Grid Dialog -->
    <v-dialog v-model="showGrid" max-width="1400" scrollable>
      <v-card>
        <v-card-title class="d-flex align-center justify-space-between">
          <div class="d-flex align-center">
            <v-icon icon="mdi-table" class="mr-2" color="primary" />
            {{ gridData?.employerName || "Salary" }} - Monthly Breakdown
          </div>
          <v-btn icon="mdi-close" variant="text" @click="closeGridView" />
        </v-card-title>
        <v-divider />
        <v-card-text class="pa-0">
          <SalaryMonthlyGrid
            :grid-data="gridData"
            :loading="gridLoading"
            :editable="true"
            @cell-click="handleCellClick"
          />
        </v-card-text>
      </v-card>
    </v-dialog>

    <!-- Data Completion Progress -->
    <v-card class="pa-4 mb-6" variant="outlined">
      <div class="d-flex align-center justify-space-between mb-2">
        <div class="d-flex align-center">
          <v-icon icon="mdi-calendar-check" class="mr-2" color="primary" />
          <span class="font-weight-medium">{{ selectedFinancialYear }} Data Completion</span>
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
    <v-row class="mb-6">
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
    <v-card variant="outlined">
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
              color="secondary"
              prepend-icon="mdi-cog"
              @click="showComponentManager = true"
            >
              Manage Components
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

    <!-- Salary Component Manager Dialog -->
    <SalaryComponentManager v-model="showComponentManager" />
  </div>
</template>
