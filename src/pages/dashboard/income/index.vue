<script setup lang="ts">
import { computed } from "vue";
import SectionHeader from "@/components/shared/SectionHeader.vue";
import IncomeSourceCard from "@/components/income/IncomeSourceCard.vue";
import IncomeSummaryChart from "@/components/income/IncomeSummaryChart.vue";
import {
  useBusinessIncome,
  useRentalIncome,
  useCapitalGains,
  useOtherIncome,
  useInterestIncomeAPI,
  useDividendIncomeAPI,
  useIncomeSummary,
  formatINR,
} from "@/composables/useIncome";
import { useFinancialYear } from "@/composables/useSalary";
import { getFinancialYearOptions } from "@/types/salary";
import { useRouter } from "vue-router";

const router = useRouter();

// Advance Tax Due Dates for FY 2024-25
const ADVANCE_TAX_DATES = [
  { date: "2024-06-15", quarter: "Q1", percentage: 15 },
  { date: "2024-09-15", quarter: "Q2", percentage: 45 },
  { date: "2024-12-15", quarter: "Q3", percentage: 75 },
  { date: "2025-03-15", quarter: "Q4", percentage: 100 },
];

// Financial Year
const { selectedFinancialYear, setFinancialYear } = useFinancialYear();
const fyOptions = computed(() => getFinancialYearOptions());

// Data queries
const { data: businessData, isLoading: businessLoading } = useBusinessIncome();
const { data: rentalData, isLoading: rentalLoading } = useRentalIncome();
const { data: capitalGainsData, isLoading: cgLoading } = useCapitalGains();
const { data: interestData, isLoading: interestLoading } = useInterestIncomeAPI();
const { data: dividendData, isLoading: dividendLoading } = useDividendIncomeAPI();
const { data: otherData, isLoading: otherLoading } = useOtherIncome();
const { summary, isLoading: summaryLoading } = useIncomeSummary();

// Computed totals
const businessTotal = computed(
  () => businessData.value?.reduce((sum, b) => sum + b.deemedProfit, 0) || 0,
);
const rentalTotal = computed(
  () => rentalData.value?.reduce((sum, r) => sum + r.netAnnualValue, 0) || 0,
);
const capitalGainsTotal = computed(
  () =>
    capitalGainsData.value?.reduce((sum, cg) => sum + cg.taxableGain, 0) || 0,
);
const interestTotal = computed(
  () => interestData.value?.summary?.totalInterest || 0,
);
const dividendTotal = computed(
  () => dividendData.value?.summary?.totalDividend || 0,
);
const otherTotal = computed(
  () => otherData.value?.reduce((sum, o) => sum + o.grossAmount, 0) || 0,
);

const isLoading = computed(
  () =>
    businessLoading.value ||
    rentalLoading.value ||
    cgLoading.value ||
    interestLoading.value ||
    dividendLoading.value ||
    otherLoading.value,
);

// ============================================
// Filing Readiness Score
// ============================================
const filingReadinessItems = computed(() => [
  {
    id: "business",
    label: "Business income declared",
    completed: (businessData.value?.length || 0) > 0 || businessTotal.value === 0,
    icon: "mdi-store",
  },
  {
    id: "rental",
    label: "Rental income added",
    completed: (rentalData.value?.length || 0) > 0 || rentalTotal.value === 0,
    icon: "mdi-home-city",
  },
  {
    id: "capital_gains",
    label: "Capital gains computed",
    completed: (capitalGainsData.value?.length || 0) > 0,
    icon: "mdi-trending-up",
  },
  {
    id: "interest",
    label: "Interest income recorded",
    completed: (interestData.value?.records?.length || 0) > 0,
    icon: "mdi-percent",
  },
  {
    id: "dividend",
    label: "Dividend income recorded",
    completed: (dividendData.value?.records?.length || 0) > 0,
    icon: "mdi-cash-multiple",
  },
  {
    id: "other",
    label: "Other income recorded",
    completed: (otherData.value?.length || 0) > 0,
    icon: "mdi-dots-horizontal",
  },
]);

const filingReadinessScore = computed(() => {
  const completed = filingReadinessItems.value.filter((item) => item.completed).length;
  return Math.round((completed / filingReadinessItems.value.length) * 100);
});

// ============================================
// Tax Optimization (Old vs New Regime)
// ============================================
const taxOptimization = computed(() => {
  const totalIncome = summary.value?.totalGrossIncome || 0;

  // Simplified calculation for demonstration
  // Old regime with deductions (assumed 80C: 1.5L, 80D: 25K, Section 24: 2L)
  const assumedDeductions = 375000; // Rs 3.75L common deductions
  const oldRegimeTaxable = Math.max(0, totalIncome - assumedDeductions);
  const oldRegimeTax = calculateTax(oldRegimeTaxable, "old");

  // New regime (no deductions, lower slabs)
  const newRegimeTax = calculateTax(totalIncome, "new");

  const betterRegime = oldRegimeTax <= newRegimeTax ? "old" : "new";
  const savings = Math.abs(oldRegimeTax - newRegimeTax);

  return {
    oldRegimeTax,
    newRegimeTax,
    betterRegime,
    savings,
    totalIncome,
  };
});

function calculateTax(income: number, regime: "old" | "new"): number {
  // Simplified tax calculation
  if (regime === "new") {
    // New regime slabs FY 2024-25
    if (income <= 300000) return 0;
    if (income <= 700000) return (income - 300000) * 0.05;
    if (income <= 1000000) return 20000 + (income - 700000) * 0.10;
    if (income <= 1200000) return 50000 + (income - 1000000) * 0.15;
    if (income <= 1500000) return 80000 + (income - 1200000) * 0.20;
    return 140000 + (income - 1500000) * 0.30;
  } else {
    // Old regime slabs
    if (income <= 250000) return 0;
    if (income <= 500000) return (income - 250000) * 0.05;
    if (income <= 1000000) return 12500 + (income - 500000) * 0.20;
    return 112500 + (income - 1000000) * 0.30;
  }
}

// ============================================
// Smart Alerts
// ============================================
const smartAlerts = computed(() => {
  const alerts: Array<{
    type: "warning" | "info" | "error";
    icon: string;
    title: string;
    message: string;
    action?: { label: string; route: string };
  }> = [];

  const today = new Date();

  // Check advance tax due dates
  for (const taxDate of ADVANCE_TAX_DATES) {
    const dueDate = new Date(taxDate.date);
    const daysUntil = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (daysUntil > 0 && daysUntil <= 30) {
      alerts.push({
        type: "warning",
        icon: "mdi-calendar-clock",
        title: `Advance Tax ${taxDate.quarter} Due`,
        message: `${taxDate.percentage}% advance tax due in ${daysUntil} days (${taxDate.date})`,
        action: { label: "Calculate Tax", route: "/dashboard/tax-planning" },
      });
      break; // Only show nearest due date
    }
  }

  // Check for missing data
  if ((businessData.value?.length || 0) === 0 && (rentalData.value?.length || 0) === 0) {
    alerts.push({
      type: "info",
      icon: "mdi-lightbulb-outline",
      title: "No Income Sources Added",
      message: "Add your business or rental income to get accurate tax calculations",
      action: { label: "Add Income", route: "/dashboard/income/business" },
    });
  }

  // Capital gains reminder
  if ((capitalGainsData.value?.length || 0) === 0) {
    alerts.push({
      type: "info",
      icon: "mdi-trending-up",
      title: "Track Your Investments",
      message: "Record your stock/mutual fund sales to calculate capital gains tax",
      action: { label: "Add Capital Gains", route: "/dashboard/income/capital-gains" },
    });
  }

  // ITR filing reminder (July deadline)
  const itrDeadline = new Date(`${today.getFullYear()}-07-31`);
  if (today < itrDeadline) {
    const daysUntilITR = Math.ceil((itrDeadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    if (daysUntilITR <= 60 && daysUntilITR > 0) {
      alerts.push({
        type: daysUntilITR <= 15 ? "error" : "warning",
        icon: "mdi-file-document-alert",
        title: "ITR Filing Deadline",
        message: `File your ITR within ${daysUntilITR} days to avoid late fees`,
        action: { label: "View Reports", route: "/dashboard/income/reports" },
      });
    }
  }

  return alerts;
});

// Income type cards for hub navigation
const incomeTypeCards = [
  {
    type: "business",
    title: "Business Income",
    subtitle: "44AD/44ADA Presumptive",
    icon: "mdi-store",
    color: "primary",
    route: "/dashboard/income/business",
  },
  {
    type: "rental",
    title: "Rental Income",
    subtitle: "House Property",
    icon: "mdi-home-city",
    color: "secondary",
    route: "/dashboard/income/rental",
  },
  {
    type: "capital_gains",
    title: "Capital Gains",
    subtitle: "STCG/LTCG",
    icon: "mdi-trending-up",
    color: "success",
    route: "/dashboard/income/capital-gains",
  },
  {
    type: "interest",
    title: "Interest Income",
    subtitle: "FD/Savings/P2P",
    icon: "mdi-percent",
    color: "info",
    route: "/dashboard/income/interest",
  },
  {
    type: "dividend",
    title: "Dividend Income",
    subtitle: "Stocks/MF",
    icon: "mdi-cash-multiple",
    color: "warning",
    route: "/dashboard/income/dividends",
  },
  {
    type: "other",
    title: "Other Sources",
    subtitle: "Commission/Gifts",
    icon: "mdi-dots-horizontal",
    color: "grey",
    route: "/dashboard/income/other",
  },
];

function navigateToIncomeType(route: string) {
  router.push(route);
}
</script>

<template>
  <div>
    <SectionHeader
      title="Income"
      subtitle="Track all your income sources beyond salary"
      icon="mdi-cash-plus"
    />

    <!-- Controls Row -->
    <v-row class="mb-4" align="center">
      <v-col cols="12" sm="6" md="4">
        <v-select
          v-model="selectedFinancialYear"
          label="Financial Year"
          :items="fyOptions"
          density="compact"
          hide-details
          @update:model-value="setFinancialYear"
        />
      </v-col>
    </v-row>

    <!-- Summary Cards - Row 1 -->
    <v-row>
      <v-col cols="12" sm="6" lg="4">
        <IncomeSourceCard
          type="business"
          title="Business Income"
          subtitle="44AD/44ADA Presumptive"
          :amount="businessTotal"
          secondary-label="Gross Receipts"
          :secondary-amount="
            businessData?.reduce((s, b) => s + b.grossReceipts, 0) || 0
          "
          :count="businessData?.length || 0"
          :loading="businessLoading"
          href="/dashboard/income/business"
        />
      </v-col>
      <v-col cols="12" sm="6" lg="4">
        <IncomeSourceCard
          type="rental"
          title="Rental Income"
          subtitle="House Property"
          :amount="rentalTotal"
          secondary-label="Gross Rent"
          :secondary-amount="
            rentalData?.reduce((s, r) => s + r.annualRent, 0) || 0
          "
          :count="rentalData?.length || 0"
          :loading="rentalLoading"
          href="/dashboard/income/rental"
        />
      </v-col>
      <v-col cols="12" sm="6" lg="4">
        <IncomeSourceCard
          type="capital_gains"
          title="Capital Gains"
          subtitle="STCG + LTCG"
          :amount="capitalGainsTotal"
          :count="capitalGainsData?.length || 0"
          :loading="cgLoading"
          href="/dashboard/income/capital-gains"
        />
      </v-col>
      <v-col cols="12" sm="6" lg="4">
        <IncomeSourceCard
          type="interest"
          title="Interest Income"
          subtitle="FD/Savings/P2P"
          :amount="interestTotal"
          secondary-label="80TTA/80TTB Deduction"
          :secondary-amount="
            (interestData?.summary?.deduction80TTA || 0) + (interestData?.summary?.deduction80TTB || 0)
          "
          :count="interestData?.records?.length || 0"
          :loading="interestLoading"
          href="/dashboard/income/interest"
        />
      </v-col>
      <v-col cols="12" sm="6" lg="4">
        <IncomeSourceCard
          type="dividend"
          title="Dividend Income"
          subtitle="Stocks/MF"
          :amount="dividendTotal"
          secondary-label="TDS Deducted"
          :secondary-amount="dividendData?.summary?.totalTDS || 0"
          :count="dividendData?.records?.length || 0"
          :loading="dividendLoading"
          href="/dashboard/income/dividends"
        />
      </v-col>
      <v-col cols="12" sm="6" lg="4">
        <IncomeSourceCard
          type="other"
          title="Other Income"
          subtitle="Commission/Gifts"
          :amount="otherTotal"
          :count="otherData?.length || 0"
          :loading="otherLoading"
          href="/dashboard/income/other"
        />
      </v-col>
    </v-row>

    <!-- Smart Alerts -->
    <v-row v-if="smartAlerts.length > 0" class="mt-4">
      <v-col cols="12">
        <v-alert
          v-for="(alert, index) in smartAlerts.slice(0, 3)"
          :key="index"
          :type="alert.type"
          variant="tonal"
          :class="index > 0 ? 'mt-2' : ''"
          density="compact"
        >
          <div class="d-flex align-center justify-space-between">
            <div>
              <strong>{{ alert.title }}</strong>
              <div class="text-body-2">{{ alert.message }}</div>
            </div>
            <v-btn
              v-if="alert.action"
              size="small"
              variant="tonal"
              :to="alert.action.route"
            >
              {{ alert.action.label }}
            </v-btn>
          </div>
        </v-alert>
      </v-col>
    </v-row>

    <!-- User Delight Cards: Tax Optimization & Filing Readiness -->
    <v-row class="mt-4">
      <!-- Tax Optimization Card -->
      <v-col cols="12" md="6">
        <v-card>
          <v-card-title class="d-flex align-center">
            <v-icon class="mr-2" color="info">mdi-scale-balance</v-icon>
            Tax Regime Comparison
          </v-card-title>
          <v-card-text>
            <v-row>
              <v-col cols="6">
                <v-card
                  :variant="taxOptimization.betterRegime === 'old' ? 'elevated' : 'outlined'"
                  :color="taxOptimization.betterRegime === 'old' ? 'success' : undefined"
                  class="text-center pa-3"
                >
                  <div class="text-caption text-medium-emphasis">Old Regime</div>
                  <div class="text-h6 text-currency font-weight-bold">
                    {{ formatINR(taxOptimization.oldRegimeTax) }}
                  </div>
                  <v-chip
                    v-if="taxOptimization.betterRegime === 'old'"
                    size="x-small"
                    color="success"
                    class="mt-1"
                  >
                    BETTER
                  </v-chip>
                </v-card>
              </v-col>
              <v-col cols="6">
                <v-card
                  :variant="taxOptimization.betterRegime === 'new' ? 'elevated' : 'outlined'"
                  :color="taxOptimization.betterRegime === 'new' ? 'success' : undefined"
                  class="text-center pa-3"
                >
                  <div class="text-caption text-medium-emphasis">New Regime</div>
                  <div class="text-h6 text-currency font-weight-bold">
                    {{ formatINR(taxOptimization.newRegimeTax) }}
                  </div>
                  <v-chip
                    v-if="taxOptimization.betterRegime === 'new'"
                    size="x-small"
                    color="success"
                    class="mt-1"
                  >
                    BETTER
                  </v-chip>
                </v-card>
              </v-col>
            </v-row>
            <v-alert
              v-if="taxOptimization.savings > 0"
              type="success"
              variant="tonal"
              density="compact"
              class="mt-3"
            >
              <div class="d-flex align-center">
                <v-icon class="mr-2">mdi-piggy-bank</v-icon>
                <span>
                  Save <strong>{{ formatINR(taxOptimization.savings) }}</strong> with
                  {{ taxOptimization.betterRegime === 'old' ? 'Old' : 'New' }} Regime
                </span>
              </div>
            </v-alert>
            <div class="text-caption text-medium-emphasis mt-2">
              * Based on non-salary income only. Add salary for complete picture.
            </div>
          </v-card-text>
          <v-card-actions>
            <v-btn
              variant="text"
              color="primary"
              to="/dashboard/tax-planning"
              prepend-icon="mdi-calculator"
            >
              Full Tax Calculator
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-col>

      <!-- Filing Readiness Score -->
      <v-col cols="12" md="6">
        <v-card>
          <v-card-title class="d-flex align-center">
            <v-icon class="mr-2" color="success">mdi-clipboard-check</v-icon>
            Filing Readiness Score
            <v-spacer />
            <v-chip
              :color="filingReadinessScore >= 80 ? 'success' : filingReadinessScore >= 50 ? 'warning' : 'error'"
              size="small"
            >
              {{ filingReadinessScore }}%
            </v-chip>
          </v-card-title>
          <v-card-text>
            <v-progress-linear
              :model-value="filingReadinessScore"
              :color="filingReadinessScore >= 80 ? 'success' : filingReadinessScore >= 50 ? 'warning' : 'error'"
              height="12"
              rounded
              class="mb-4"
            />
            <v-list density="compact" class="bg-transparent">
              <v-list-item
                v-for="item in filingReadinessItems"
                :key="item.id"
                class="px-0"
              >
                <template #prepend>
                  <v-icon
                    :icon="item.completed ? 'mdi-check-circle' : 'mdi-circle-outline'"
                    :color="item.completed ? 'success' : 'grey'"
                    size="small"
                    class="mr-2"
                  />
                </template>
                <v-list-item-title
                  :class="item.completed ? '' : 'text-medium-emphasis'"
                >
                  {{ item.label }}
                </v-list-item-title>
              </v-list-item>
            </v-list>
          </v-card-text>
          <v-card-actions>
            <v-btn
              variant="text"
              color="primary"
              to="/dashboard/income/reports"
              prepend-icon="mdi-file-document"
            >
              View Full Report
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>

    <!-- Total Summary Card -->
    <v-row class="mt-4">
      <v-col cols="12">
        <v-card color="primary" variant="flat">
          <v-card-text class="d-flex justify-space-between align-center">
            <div>
              <div class="text-body-2 text-white-secondary">
                Total Income ({{ selectedFinancialYear }})
              </div>
              <div class="text-caption text-white-secondary">
                {{
                  (businessData?.length || 0) +
                  (rentalData?.length || 0) +
                  (capitalGainsData?.length || 0) +
                  (interestData?.records?.length || 0) +
                  (dividendData?.records?.length || 0) +
                  (otherData?.length || 0)
                }}
                records across 6 income types
              </div>
            </div>
            <div class="text-h4 text-white text-currency font-weight-bold">
              {{ formatINR(summary?.totalGrossIncome || 0) }}
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Charts & Details -->
    <v-row class="mt-4">
      <v-col cols="12" md="6">
        <IncomeSummaryChart :summary="summary" :loading="summaryLoading" />
      </v-col>

      <v-col cols="12" md="6">
        <v-card>
          <v-card-title>
            <v-icon class="mr-2">mdi-lightbulb</v-icon>
            Quick Navigation
          </v-card-title>
          <v-card-text>
            <v-list>
              <v-list-item
                v-for="item in incomeTypeCards"
                :key="item.type"
                :prepend-icon="item.icon"
                :title="item.title"
                :subtitle="item.subtitle"
                :to="item.route"
              >
                <template #prepend>
                  <v-avatar :color="item.color" size="36" class="mr-3">
                    <v-icon :icon="item.icon" color="white" size="small" />
                  </v-avatar>
                </template>
                <template #append>
                  <v-icon icon="mdi-chevron-right" />
                </template>
              </v-list-item>
            </v-list>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Info Cards -->
    <v-row class="mt-4">
      <v-col cols="12" md="4">
        <v-card variant="tonal" color="primary">
          <v-card-text>
            <div class="d-flex align-center mb-2">
              <v-icon class="mr-2">mdi-information</v-icon>
              <span class="text-body-2 font-weight-medium">Section 44AD</span>
            </div>
            <div class="text-caption">
              For business with turnover up to Rs.2 Crore. Deemed profit: 8% (6%
              for digital payments). File ITR-4.
            </div>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" md="4">
        <v-card variant="tonal" color="secondary">
          <v-card-text>
            <div class="d-flex align-center mb-2">
              <v-icon class="mr-2">mdi-information</v-icon>
              <span class="text-body-2 font-weight-medium">Section 44ADA</span>
            </div>
            <div class="text-caption">
              For professionals with receipts up to Rs.50 Lakhs. Deemed profit:
              50% of gross receipts. File ITR-4.
            </div>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" md="4">
        <v-card variant="tonal" color="success">
          <v-card-text>
            <div class="d-flex align-center mb-2">
              <v-icon class="mr-2">mdi-information</v-icon>
              <span class="text-body-2 font-weight-medium"
                >Capital Gains (Post July 2024)</span
              >
            </div>
            <div class="text-caption">
              Equity LTCG: 12.5% (above Rs.1.25L). Equity STCG: 20%.
              Property/Gold LTCG: 12.5% flat.
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

  </div>
</template>

<style scoped>
.text-white-secondary {
  color: rgba(255, 255, 255, 0.7);
}
</style>
