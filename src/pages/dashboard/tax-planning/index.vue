<script setup lang="ts">
import { computed } from "vue";
import SectionHeader from "@/components/shared/SectionHeader.vue";
import FamilyToggle from "@/components/shared/FamilyToggle.vue";
import TaxComparisonCard from "@/components/tax/TaxComparisonCard.vue";
import TaxSavingsRecommendations from "@/components/tax/TaxSavingsRecommendations.vue";
import {
  useTaxComparison,
  useTaxSummary,
  useTaxOptimizations,
  useITRRecommendation,
  formatINR,
} from "@/composables/useTax";
import { useFinancialYear } from "@/composables/useSalary";

const tabs = [
  { title: "Overview", route: "/dashboard/tax-planning" },
  { title: "Calculator", route: "/dashboard/tax-planning/calculator" },
  { title: "Deductions", route: "/dashboard/tax-planning/deductions" },
  { title: "Reports", route: "/dashboard/tax-planning/reports" },
];

const { selectedFinancialYear, financialYearOptions } = useFinancialYear();
const { data: comparison, isLoading: comparisonLoading } = useTaxComparison();
const { data: summary, isLoading: summaryLoading } = useTaxSummary();
const { data: optimizations, isLoading: optimizationsLoading } =
  useTaxOptimizations();
const { data: itrRecommendation, isLoading: itrLoading } =
  useITRRecommendation();

const isLoading = computed(
  () => comparisonLoading.value || summaryLoading.value,
);

const betterRegimeLabel = computed(() =>
  comparison.value?.betterRegime === "NEW" ? "New Regime" : "Old Regime",
);

const taxSavings = computed(() => comparison.value?.savingsAmount || 0);
</script>

<template>
  <div>
    <SectionHeader
      title="Tax Planning"
      subtitle="Optimize your taxes with Old vs New regime comparison"
      icon="mdi-calculator-variant"
      :tabs="tabs"
    />

    <!-- Controls Row -->
    <v-row class="mb-6" align="center">
      <v-col cols="12" sm="6" md="4">
        <v-select
          v-model="selectedFinancialYear"
          :items="financialYearOptions"
          label="Financial Year"
          variant="outlined"
          density="compact"
          hide-details
          prepend-inner-icon="mdi-calendar"
        />
      </v-col>
      <v-col cols="12" sm="6" md="4">
        <FamilyToggle />
      </v-col>
    </v-row>

    <!-- Summary Cards -->
    <v-row class="mb-6">
      <v-col cols="12" md="4">
        <v-card class="pa-4" :loading="comparisonLoading">
          <div class="d-flex align-center mb-2">
            <v-avatar color="secondary" size="40" class="mr-3">
              <v-icon>mdi-file-document-multiple</v-icon>
            </v-avatar>
            <div>
              <div class="text-body-2 text-medium-emphasis">Old Regime Tax</div>
              <div class="text-h5 font-weight-bold text-currency">
                {{
                  comparison
                    ? formatINR(comparison.oldRegime.totalTaxLiability)
                    : "..."
                }}
              </div>
            </div>
          </div>
          <div class="text-caption text-medium-emphasis">
            Effective Rate:
            {{ comparison?.oldRegime.effectiveRate.toFixed(1) || "0" }}%
          </div>
        </v-card>
      </v-col>

      <v-col cols="12" md="4">
        <v-card class="pa-4" :loading="comparisonLoading">
          <div class="d-flex align-center mb-2">
            <v-avatar color="primary" size="40" class="mr-3">
              <v-icon>mdi-lightning-bolt</v-icon>
            </v-avatar>
            <div>
              <div class="text-body-2 text-medium-emphasis">New Regime Tax</div>
              <div class="text-h5 font-weight-bold text-currency">
                {{
                  comparison
                    ? formatINR(comparison.newRegime.totalTaxLiability)
                    : "..."
                }}
              </div>
            </div>
          </div>
          <div class="text-caption text-medium-emphasis">
            Effective Rate:
            {{ comparison?.newRegime.effectiveRate.toFixed(1) || "0" }}%
          </div>
        </v-card>
      </v-col>

      <v-col cols="12" md="4">
        <v-card class="pa-4 bg-success-lighten-5" :loading="comparisonLoading">
          <div class="d-flex align-center mb-2">
            <v-avatar color="success" size="40" class="mr-3">
              <v-icon>mdi-check-circle</v-icon>
            </v-avatar>
            <div>
              <div class="text-body-2 text-medium-emphasis">Recommended</div>
              <div class="text-h5 font-weight-bold">
                {{ comparison ? betterRegimeLabel : "..." }}
              </div>
            </div>
          </div>
          <div v-if="taxSavings > 0" class="text-caption text-success">
            Save {{ formatINR(taxSavings) }} ({{
              comparison?.savingsPercentage.toFixed(1)
            }}% less)
          </div>
        </v-card>
      </v-col>
    </v-row>

    <!-- Quick Actions -->
    <v-row class="mb-6">
      <v-col cols="12">
        <v-card>
          <v-card-text>
            <div class="text-subtitle-2 mb-3">Quick Actions</div>
            <div class="d-flex flex-wrap ga-2">
              <v-btn
                color="primary"
                variant="tonal"
                prepend-icon="mdi-calculator"
                to="/dashboard/tax-planning/calculator"
              >
                Calculate Tax
              </v-btn>
              <v-btn
                color="secondary"
                variant="tonal"
                prepend-icon="mdi-minus-circle-multiple"
                to="/dashboard/tax-planning/deductions"
              >
                Manage Deductions
              </v-btn>
              <v-btn
                variant="tonal"
                prepend-icon="mdi-file-chart"
                to="/dashboard/tax-planning/reports"
              >
                View Reports
              </v-btn>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Main Content Grid -->
    <v-row>
      <!-- Left Column: Regime Comparison -->
      <v-col cols="12" lg="8">
        <TaxComparisonCard
          :comparison="comparison ?? null"
          :loading="comparisonLoading"
          class="mb-6"
        />

        <!-- ITR Recommendation -->
        <v-card :loading="itrLoading">
          <v-card-title>
            <v-icon class="mr-2">mdi-file-document-check</v-icon>
            ITR Form Recommendation
          </v-card-title>
          <v-card-text v-if="itrRecommendation">
            <v-alert color="info" variant="tonal" class="mb-4">
              <template #prepend>
                <v-avatar color="info" size="48">
                  <span class="text-h6">{{
                    itrRecommendation.recommendedForm
                  }}</span>
                </v-avatar>
              </template>
              <div class="ml-2">
                <div class="text-subtitle-1 font-weight-medium">
                  {{ itrRecommendation.recommendedForm }} -
                  {{ itrRecommendation.formName }}
                </div>
                <div class="text-caption">
                  Due Date:
                  {{
                    new Date(itrRecommendation.dueDate).toLocaleDateString(
                      "en-IN",
                      { day: "numeric", month: "short", year: "numeric" },
                    )
                  }}
                </div>
              </div>
            </v-alert>

            <v-row>
              <v-col cols="12" md="6">
                <div class="text-subtitle-2 mb-2 text-success">
                  <v-icon size="small" class="mr-1">mdi-check</v-icon>
                  Eligibility Reasons
                </div>
                <v-list density="compact" class="pa-0">
                  <v-list-item
                    v-for="(
                      reason, idx
                    ) in itrRecommendation.eligibilityReasons"
                    :key="idx"
                    class="px-0"
                  >
                    <template #prepend>
                      <v-icon
                        icon="mdi-check-circle"
                        color="success"
                        size="small"
                      />
                    </template>
                    <v-list-item-title class="text-body-2">{{
                      reason
                    }}</v-list-item-title>
                  </v-list-item>
                </v-list>
              </v-col>
              <v-col
                v-if="itrRecommendation.ineligibilityReasons.length"
                cols="12"
                md="6"
              >
                <div class="text-subtitle-2 mb-2 text-warning">
                  <v-icon size="small" class="mr-1">mdi-alert</v-icon>
                  Not Applicable For
                </div>
                <v-list density="compact" class="pa-0">
                  <v-list-item
                    v-for="(
                      reason, idx
                    ) in itrRecommendation.ineligibilityReasons"
                    :key="idx"
                    class="px-0"
                  >
                    <template #prepend>
                      <v-icon
                        icon="mdi-close-circle"
                        color="warning"
                        size="small"
                      />
                    </template>
                    <v-list-item-title class="text-body-2">{{
                      reason
                    }}</v-list-item-title>
                  </v-list-item>
                </v-list>
              </v-col>
            </v-row>
          </v-card-text>
          <v-card-text v-else-if="!itrLoading" class="text-center py-8">
            <v-icon
              icon="mdi-file-document-check"
              size="48"
              color="grey-lighten-1"
            />
            <div class="text-body-2 text-medium-emphasis mt-2">
              Add income sources to get ITR recommendation
            </div>
          </v-card-text>
        </v-card>
      </v-col>

      <!-- Right Column: Optimizations -->
      <v-col cols="12" lg="4">
        <TaxSavingsRecommendations
          :suggestions="optimizations ?? null"
          :loading="optimizationsLoading"
          class="mb-6"
        />

        <!-- Tax Summary Card -->
        <v-card v-if="summary" :loading="summaryLoading">
          <v-card-title>
            <v-icon class="mr-2">mdi-chart-box</v-icon>
            Tax Summary
          </v-card-title>
          <v-card-text>
            <v-list density="compact">
              <v-list-item>
                <v-list-item-title class="text-caption"
                  >Gross Total Income</v-list-item-title
                >
                <template #append>
                  <span class="text-currency">{{
                    formatINR(summary.grossTotalIncome)
                  }}</span>
                </template>
              </v-list-item>
              <v-list-item>
                <v-list-item-title class="text-caption"
                  >Total Deductions</v-list-item-title
                >
                <template #append>
                  <span class="text-currency text-negative"
                    >-{{ formatINR(summary.totalDeductions) }}</span
                  >
                </template>
              </v-list-item>
              <v-list-item>
                <v-list-item-title class="text-caption"
                  >Taxable Income</v-list-item-title
                >
                <template #append>
                  <span class="text-currency">{{
                    formatINR(summary.taxableIncome)
                  }}</span>
                </template>
              </v-list-item>
              <v-divider class="my-2" />
              <v-list-item>
                <v-list-item-title class="text-caption font-weight-medium"
                  >Total Tax</v-list-item-title
                >
                <template #append>
                  <span class="text-currency font-weight-bold text-error">{{
                    formatINR(summary.totalTax)
                  }}</span>
                </template>
              </v-list-item>
              <v-list-item v-if="summary.tdsDeducted > 0">
                <v-list-item-title class="text-caption"
                  >TDS Deducted</v-list-item-title
                >
                <template #append>
                  <span class="text-currency text-positive"
                    >-{{ formatINR(summary.tdsDeducted) }}</span
                  >
                </template>
              </v-list-item>
              <v-list-item v-if="summary.refundDue > 0">
                <v-list-item-title
                  class="text-caption font-weight-medium text-success"
                  >Refund Due</v-list-item-title
                >
                <template #append>
                  <span class="text-currency font-weight-bold text-success">{{
                    formatINR(summary.refundDue)
                  }}</span>
                </template>
              </v-list-item>
              <v-list-item v-else-if="summary.selfAssessmentTax > 0">
                <v-list-item-title
                  class="text-caption font-weight-medium text-error"
                  >Tax Payable</v-list-item-title
                >
                <template #append>
                  <span class="text-currency font-weight-bold text-error">{{
                    formatINR(summary.selfAssessmentTax)
                  }}</span>
                </template>
              </v-list-item>
            </v-list>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Educational Info -->
    <v-row class="mt-6">
      <v-col cols="12">
        <v-card variant="outlined">
          <v-card-title class="text-subtitle-1">
            <v-icon class="mr-2">mdi-information</v-icon>
            Understanding Tax Regimes
          </v-card-title>
          <v-card-text>
            <v-row>
              <v-col cols="12" md="6">
                <div class="text-subtitle-2 mb-2">Old Regime</div>
                <ul class="text-body-2 text-medium-emphasis">
                  <li>Multiple deductions available (80C, 80D, HRA, etc.)</li>
                  <li>Standard deduction of Rs.50,000</li>
                  <li>Good if your total deductions exceed Rs.3.75L</li>
                  <li>Requires maintaining proofs for all deductions</li>
                </ul>
              </v-col>
              <v-col cols="12" md="6">
                <div class="text-subtitle-2 mb-2">
                  New Regime (Default from FY 2023-24)
                </div>
                <ul class="text-body-2 text-medium-emphasis">
                  <li>Lower tax rates with more slabs</li>
                  <li>Standard deduction of Rs.75,000</li>
                  <li>No other deductions except employer NPS</li>
                  <li>Simpler filing with less documentation</li>
                </ul>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </div>
</template>
