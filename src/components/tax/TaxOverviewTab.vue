<script setup lang="ts">
import { computed } from "vue";
import { getCurrentFinancialYear } from "@/types/salary";
import {
  useAggregatedIncome,
  useDataCompletionStatus,
  useSmartSuggestionsEnhanced,
  useTaxComparison,
  formatINR,
} from "@/composables/useTax";
import TaxSummaryCards from "@/components/tax/TaxSummaryCards.vue";
import DataCompletionTracker from "@/components/tax/DataCompletionTracker.vue";
import IncomeBreakdownChart from "@/components/tax/IncomeBreakdownChart.vue";
import type { SmartSuggestionWithPriority, DataCompletionItem } from "@/composables/useTax";

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
  (e: "navigate-to", path: string): void;
  (e: "apply-suggestion", suggestion: SmartSuggestionWithPriority): void;
}>();

// Fetch aggregated data
const { data: aggregatedData, isLoading: aggregatedLoading } = useAggregatedIncome();
const { completionStatus, isLoading: completionLoading } = useDataCompletionStatus();
const { suggestions, isLoading: suggestionsLoading } = useSmartSuggestionsEnhanced();

// Get tax comparison for both regimes
const { data: comparison, isLoading: taxLoading } = useTaxComparison();

// Completion items from status
const completionItems = computed(() => completionStatus.value?.items ?? []);

// Combined loading state
const isLoading = computed(
  () => aggregatedLoading.value || completionLoading.value || suggestionsLoading.value || taxLoading.value
);

// Tax payable (use better regime)
const taxPayable = computed(() => {
  if (!comparison.value) return 0;
  return comparison.value.betterRegime === "NEW"
    ? comparison.value.newRegime.totalTaxLiability
    : comparison.value.oldRegime.totalTaxLiability;
});

// Top 3 recommendations (prioritized)
const topRecommendations = computed(() => {
  if (!suggestions.value) return [];
  // Sort by priority: high > medium > low, then by savings
  const priorityOrder = { high: 0, medium: 1, low: 2 };
  return [...suggestions.value]
    .sort((a, b) => {
      const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
      if (priorityDiff !== 0) return priorityDiff;
      return b.potentialSavings - a.potentialSavings;
    })
    .slice(0, 3);
});

// ITR form recommendation based on income sources
const itrFormRecommendation = computed(() => {
  if (!aggregatedData.value) return null;
  const data = aggregatedData.value;

  // ITR-1 (Sahaj): Salary + One house property + Other sources (up to 50L)
  if (
    data.grossTotalIncome <= 5000000 &&
    data.businessIncome === 0 &&
    data.capitalGainsLTCG === 0 &&
    data.capitalGainsSTCG === 0
  ) {
    return {
      form: "ITR-1 (Sahaj)",
      description: "Suitable for salaried individuals with income up to Rs. 50 lakh",
      icon: "mdi-file-document-outline",
      color: "success",
    };
  }

  // ITR-2: Capital gains, multiple properties, foreign assets
  if (data.businessIncome === 0 && (data.capitalGainsLTCG > 0 || data.capitalGainsSTCG > 0)) {
    return {
      form: "ITR-2",
      description: "For individuals with capital gains or multiple properties",
      icon: "mdi-file-document-multiple-outline",
      color: "info",
    };
  }

  // ITR-3: Business/Profession income
  if (data.businessIncome > 0) {
    return {
      form: "ITR-3",
      description: "For individuals with business or professional income",
      icon: "mdi-briefcase-outline",
      color: "warning",
    };
  }

  return {
    form: "ITR-2",
    description: "Based on your income sources",
    icon: "mdi-file-document-outline",
    color: "info",
  };
});

// Advance tax alert
const advanceTaxAlert = computed(() => {
  if (!aggregatedData.value || !comparison.value) return null;

  // Only TDS is available from aggregated data; advance tax payment status requires separate query
  const totalTaxPaid = aggregatedData.value.totalTDS;
  const taxDue = taxPayable.value - totalTaxPaid;

  if (taxDue <= 10000) return null;

  // Determine next due date based on current date
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();
  const [fyStart] = props.financialYear.split("-").map(Number);

  let nextDueDate = "";
  let percentage = 0;

  if (month >= 4 && month <= 6) {
    nextDueDate = `June 15, ${fyStart}`;
    percentage = 15;
  } else if (month >= 7 && month <= 9) {
    nextDueDate = `September 15, ${fyStart}`;
    percentage = 45;
  } else if (month >= 10 && month <= 12) {
    nextDueDate = `December 15, ${fyStart}`;
    percentage = 75;
  } else {
    nextDueDate = `March 15, ${fyStart + 1}`;
    percentage = 100;
  }

  return {
    taxDue,
    nextDueDate,
    percentage,
    message: `You may need to pay advance tax of ${formatINR(taxDue)} by ${nextDueDate}`,
  };
});

// Helper functions
const getPriorityColor = (priority: string) => {
  const colors: Record<string, string> = {
    high: "error",
    medium: "warning",
    low: "info",
  };
  return colors[priority] || "grey";
};

const getPriorityIcon = (priority: string) => {
  const icons: Record<string, string> = {
    high: "mdi-alert-circle",
    medium: "mdi-alert",
    low: "mdi-information",
  };
  return icons[priority] || "mdi-lightbulb";
};

// Map completion item IDs to navigation paths
const completionItemPaths: Record<string, string> = {
  salary: "/dashboard/salary",
  "80c": "/dashboard/investments/epf-ppf",
  "80d": "/dashboard/insurance/health",
  nps: "/dashboard/investments/nps",
  hra: "/dashboard/salary",
  home_loan: "/dashboard/liabilities/loans",
  capital_gains: "/dashboard/non-salary-income/capital-gains",
  other_income: "/dashboard/non-salary-income/other",
};

const handleCompletionItemClick = (item: DataCompletionItem) => {
  const path = completionItemPaths[item.id];
  if (path) {
    emit("navigate-to", path);
  }
};
</script>

<template>
  <div class="tax-overview-tab">
    <!-- Summary Cards -->
    <TaxSummaryCards
      :data="aggregatedData"
      :tax-payable="taxPayable"
      :loading="isLoading"
      class="mb-6"
    />

    <!-- Data Completion + Top Recommendations Row -->
    <v-row class="mb-6">
      <!-- Data Completion Tracker -->
      <v-col cols="12" lg="5">
        <DataCompletionTracker
          :items="completionItems"
          :loading="completionLoading"
          @item-click="handleCompletionItemClick"
        />
      </v-col>

      <!-- Top 3 Recommendations -->
      <v-col cols="12" lg="7">
        <v-card variant="outlined" :loading="suggestionsLoading" class="h-100">
          <v-card-title class="d-flex align-center text-subtitle-2">
            <v-icon icon="mdi-lightbulb-on" class="mr-2" color="amber" size="small" />
            TOP RECOMMENDATIONS
            <v-spacer />
            <v-btn
              v-if="suggestions && suggestions.length > 3"
              variant="text"
              size="small"
              color="primary"
              @click="emit('go-to-details')"
            >
              View All ({{ suggestions.length }})
            </v-btn>
          </v-card-title>

          <v-card-text>
            <!-- Recommendations List -->
            <div v-if="topRecommendations.length > 0" class="recommendations-list">
              <div
                v-for="(suggestion, index) in topRecommendations"
                :key="suggestion.id"
                :class="['recommendation-item', { 'mt-3': index > 0 }]"
              >
                <div class="d-flex align-start">
                  <v-avatar :color="getPriorityColor(suggestion.priority)" size="32" class="mr-3">
                    <v-icon color="white" size="small">{{ getPriorityIcon(suggestion.priority) }}</v-icon>
                  </v-avatar>
                  <div class="flex-grow-1">
                    <div class="d-flex align-center">
                      <span class="text-body-2 font-weight-medium">{{ suggestion.title }}</span>
                      <v-chip
                        :color="getPriorityColor(suggestion.priority)"
                        size="x-small"
                        variant="tonal"
                        class="ml-2"
                      >
                        {{ suggestion.priority }}
                      </v-chip>
                    </div>
                    <div class="text-caption text-medium-emphasis">{{ suggestion.description }}</div>
                    <div class="d-flex align-center mt-1">
                      <v-icon size="small" color="success" class="mr-1">mdi-cash</v-icon>
                      <span class="text-body-2 text-success font-weight-medium">
                        Save {{ formatINR(suggestion.potentialSavings) }}
                      </span>
                      <span class="text-caption text-medium-emphasis ml-2">
                        {{ suggestion.basedOn }}
                      </span>
                    </div>
                  </div>
                  <v-btn
                    icon
                    size="small"
                    variant="text"
                    color="primary"
                    @click="emit('apply-suggestion', suggestion)"
                  >
                    <v-icon size="small">mdi-arrow-right</v-icon>
                  </v-btn>
                </div>
              </div>
            </div>

            <!-- Empty State -->
            <div v-else-if="!suggestionsLoading" class="text-center py-4">
              <v-icon icon="mdi-check-circle" size="48" color="success" class="mb-2" />
              <div class="text-body-2 text-medium-emphasis">
                Your tax planning looks optimal!
              </div>
              <div class="text-caption text-medium-emphasis">
                No additional recommendations at this time.
              </div>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Regime Comparison + Income Chart Row -->
    <v-row class="mb-6">
      <!-- Regime Comparison Summary -->
      <v-col cols="12" lg="5">
        <v-card variant="outlined" :loading="taxLoading" class="h-100">
          <v-card-title class="d-flex align-center text-subtitle-2">
            <v-icon icon="mdi-scale-balance" class="mr-2" color="primary" size="small" />
            REGIME COMPARISON
          </v-card-title>

          <v-card-text v-if="comparison">
            <!-- Best Regime Banner -->
            <v-alert
              :color="comparison.betterRegime === 'NEW' ? 'primary' : 'secondary'"
              variant="tonal"
              density="compact"
              class="mb-4"
            >
              <div class="d-flex align-center">
                <v-icon icon="mdi-check-circle" class="mr-2" />
                <div>
                  <strong>{{ comparison.betterRegime === "NEW" ? "New" : "Old" }} Regime</strong>
                  is better for you
                </div>
              </div>
              <div class="text-caption mt-1">
                Save {{ formatINR(comparison.savingsAmount) }} ({{ comparison.savingsPercentage.toFixed(1) }}% less tax)
              </div>
            </v-alert>

            <!-- Side-by-side comparison -->
            <v-row dense>
              <v-col cols="6">
                <div class="regime-box" :class="{ 'is-better': comparison.betterRegime === 'OLD' }">
                  <div class="text-caption text-medium-emphasis">Old Regime</div>
                  <div class="text-h6 font-weight-bold text-currency">
                    {{ formatINR(comparison.oldRegime.totalTaxLiability) }}
                  </div>
                  <div class="text-caption">
                    Effective: {{ comparison.oldRegime.effectiveRate.toFixed(1) }}%
                  </div>
                </div>
              </v-col>
              <v-col cols="6">
                <div class="regime-box" :class="{ 'is-better': comparison.betterRegime === 'NEW' }">
                  <div class="text-caption text-medium-emphasis">New Regime</div>
                  <div class="text-h6 font-weight-bold text-currency">
                    {{ formatINR(comparison.newRegime.totalTaxLiability) }}
                  </div>
                  <div class="text-caption">
                    Effective: {{ comparison.newRegime.effectiveRate.toFixed(1) }}%
                  </div>
                </div>
              </v-col>
            </v-row>

            <v-btn
              variant="text"
              size="small"
              color="primary"
              block
              class="mt-4"
              @click="emit('go-to-details')"
            >
              <v-icon start size="small">mdi-calculator</v-icon>
              View Detailed Breakdown
            </v-btn>
          </v-card-text>

          <v-card-text v-else-if="!taxLoading" class="text-center py-8">
            <v-icon icon="mdi-scale-balance" size="48" color="grey-lighten-1" class="mb-2" />
            <div class="text-body-2 text-medium-emphasis">
              Add income data to see regime comparison
            </div>
          </v-card-text>
        </v-card>
      </v-col>

      <!-- Income Breakdown Chart -->
      <v-col cols="12" lg="7">
        <IncomeBreakdownChart :data="aggregatedData" :loading="aggregatedLoading" />
      </v-col>
    </v-row>

    <!-- ITR Form + Advance Tax Alerts Row -->
    <v-row>
      <!-- ITR Form Recommendation -->
      <v-col cols="12" md="6">
        <v-card v-if="itrFormRecommendation" variant="outlined">
          <v-card-text class="d-flex align-center">
            <v-avatar :color="itrFormRecommendation.color" size="48" class="mr-4">
              <v-icon color="white">{{ itrFormRecommendation.icon }}</v-icon>
            </v-avatar>
            <div>
              <div class="text-caption text-medium-emphasis text-uppercase">Recommended ITR Form</div>
              <div class="text-h6 font-weight-medium">{{ itrFormRecommendation.form }}</div>
              <div class="text-caption text-medium-emphasis">
                {{ itrFormRecommendation.description }}
              </div>
            </div>
          </v-card-text>
        </v-card>
      </v-col>

      <!-- Advance Tax Alert -->
      <v-col cols="12" md="6">
        <v-alert
          v-if="advanceTaxAlert"
          type="warning"
          variant="tonal"
          prominent
        >
          <template #prepend>
            <v-icon icon="mdi-calendar-alert" />
          </template>
          <div class="text-subtitle-2 font-weight-medium">Advance Tax Due</div>
          <div class="text-caption">{{ advanceTaxAlert.message }}</div>
          <template #append>
            <v-btn
              variant="flat"
              color="warning"
              size="small"
              @click="emit('go-to-details')"
            >
              Track Payments
            </v-btn>
          </template>
        </v-alert>

        <!-- No Advance Tax Due -->
        <v-alert
          v-else-if="aggregatedData && !advanceTaxAlert"
          type="success"
          variant="tonal"
        >
          <template #prepend>
            <v-icon icon="mdi-check-circle" />
          </template>
          <div class="text-subtitle-2 font-weight-medium">No Advance Tax Due</div>
          <div class="text-caption">
            Your TDS deductions cover your tax liability, or the balance is under Rs. 10,000.
          </div>
        </v-alert>
      </v-col>
    </v-row>

    <!-- Empty State -->
    <v-card
      v-if="!isLoading && !aggregatedData?.grossTotalIncome"
      variant="outlined"
      class="mt-6"
    >
      <v-card-text class="text-center pa-8">
        <v-icon icon="mdi-clipboard-text-outline" size="64" color="grey-lighten-1" class="mb-4" />
        <div class="text-h6 text-medium-emphasis mb-2">No income data for FY {{ financialYear }}</div>
        <div class="text-body-2 text-medium-emphasis mb-4">
          Start by adding your salary and other income details to see tax calculations.
        </div>
        <v-btn color="primary" variant="flat" @click="emit('navigate-to', '/dashboard/salary')">
          <v-icon start>mdi-briefcase</v-icon>
          Add Salary Details
        </v-btn>
      </v-card-text>
    </v-card>
  </div>
</template>

<style scoped>
.tax-overview-tab {
  width: 100%;
}

.recommendations-list {
  max-height: 280px;
  overflow-y: auto;
}

.recommendation-item {
  padding: 12px;
  border-radius: 8px;
  background: rgba(var(--v-theme-on-surface), 0.02);
  transition: background 0.2s ease;
}

.recommendation-item:hover {
  background: rgba(var(--v-theme-primary), 0.05);
}

.regime-box {
  padding: 16px;
  border-radius: 8px;
  background: rgba(var(--v-theme-on-surface), 0.04);
  text-align: center;
  transition: all 0.2s ease;
}

.regime-box.is-better {
  background: rgba(var(--v-theme-success), 0.1);
  border: 1px solid rgba(var(--v-theme-success), 0.3);
}

.text-currency {
  font-family: "Roboto Mono", monospace;
}
</style>
