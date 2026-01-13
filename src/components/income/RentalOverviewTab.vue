<script setup lang="ts">
import { computed } from "vue";
import SummaryMetricCards from "@/components/shared/SummaryMetricCards.vue";
import YoYComparison from "@/components/shared/YoYComparison.vue";
import IncomeChart from "@/components/shared/IncomeChart.vue";
import PreConstructionInterest from "@/components/income/PreConstructionInterest.vue";
import CoOwnerSplit from "@/components/income/CoOwnerSplit.vue";
import {
  useRentalIncome,
  formatINR,
  formatINRLakhs,
} from "@/composables/useIncome";
import { useFinancialYear } from "@/composables/useSalary";
import { SECTION_24_LIMITS } from "@/types/income";
import type { MetricCard } from "@/components/shared/SummaryMetricCards.vue";
import { ref } from "vue";

const emit = defineEmits<{
  (e: "go-to-details"): void;
}>();

const { selectedFinancialYear } = useFinancialYear();
const { data: rentalData, isLoading } = useRentalIncome();

// Tools tab
const activeToolTab = ref("pre-construction");

// Summary stats
const totalGrossRent = computed(
  () => rentalData.value?.reduce((sum, r) => sum + r.annualRent, 0) || 0
);
const totalNetIncome = computed(
  () => rentalData.value?.reduce((sum, r) => sum + r.netAnnualValue, 0) || 0
);
const totalDeductions = computed(
  () =>
    rentalData.value?.reduce(
      (sum, r) => sum + r.standardDeduction + r.housingLoanInterest,
      0
    ) || 0
);
const propertyCount = computed(() => rentalData.value?.length || 0);

// Summary metrics
const metrics = computed<MetricCard[]>(() => [
  {
    label: "Total Properties",
    value: propertyCount.value,
    icon: "mdi-home-city",
    color: "secondary",
    format: "number",
    subtitle: `FY ${selectedFinancialYear.value}`,
  },
  {
    label: "Gross Annual Rent",
    value: totalGrossRent.value,
    icon: "mdi-cash",
    color: "info",
    format: "currency",
    subtitle: "Total rental income",
  },
  {
    label: "Section 24 Deductions",
    value: totalDeductions.value,
    icon: "mdi-minus-circle",
    color: "warning",
    format: "currency",
    subtitle: "Standard + Interest",
  },
  {
    label: "Taxable Income",
    value: totalNetIncome.value,
    icon: "mdi-check-circle",
    color: totalNetIncome.value >= 0 ? "success" : "error",
    format: "currency",
    subtitle: "Net rental income",
  },
]);

// Chart data - by property
const chartData = computed(() => {
  if (!rentalData.value?.length) return [];
  return rentalData.value.map((r) => ({
    label: r.propertyName.substring(0, 10),
    primary: r.annualRent,
    secondary: r.netAnnualValue,
  }));
});

const chartConfig = {
  title: "Rental Income Overview",
  icon: "mdi-chart-bar",
  primaryLabel: "Gross Rent",
  primaryColor: "info",
  secondaryLabel: "Net Income",
  secondaryColor: "success",
  showStats: true,
};

// YoY comparison (would need API support for actual data)
const yoyData = computed(() => {
  return null; // Return null to show "No comparison data available"
});

// Property breakdown by type
const propertyByType = computed(() => {
  if (!rentalData.value?.length) return [];
  const byType: Record<string, { count: number; amount: number }> = {};
  for (const r of rentalData.value) {
    if (!byType[r.propertyType]) {
      byType[r.propertyType] = { count: 0, amount: 0 };
    }
    byType[r.propertyType].count++;
    byType[r.propertyType].amount += r.netAnnualValue;
  }
  return Object.entries(byType).map(([type, data]) => ({
    type,
    label: getPropertyTypeLabel(type),
    ...data,
    percentage:
      totalNetIncome.value !== 0
        ? Math.abs((data.amount / totalNetIncome.value) * 100)
        : 0,
    color: getPropertyTypeColor(type),
  }));
});

function getPropertyTypeLabel(type: string) {
  switch (type) {
    case "residential":
      return "Residential";
    case "commercial":
      return "Commercial";
    case "land":
      return "Land";
    default:
      return type;
  }
}

function getPropertyTypeColor(type: string) {
  switch (type) {
    case "residential":
      return "primary";
    case "commercial":
      return "secondary";
    case "land":
      return "warning";
    default:
      return "grey";
  }
}
</script>

<template>
  <div class="rental-overview-tab">
    <!-- Summary Metric Cards -->
    <SummaryMetricCards
      :metrics="metrics"
      :columns="4"
      :loading="isLoading"
      class="mb-6"
    />

    <!-- Charts Row -->
    <v-row class="mb-6">
      <!-- Rental Income Chart -->
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

          <!-- Property Type Breakdown -->
          <v-col cols="12">
            <v-card variant="outlined">
              <v-card-title class="text-subtitle-2">
                <v-icon icon="mdi-chart-pie" class="mr-2" color="primary" size="small" />
                BY PROPERTY TYPE
              </v-card-title>
              <v-card-text v-if="propertyByType.length > 0">
                <div v-for="item in propertyByType" :key="item.type" class="mb-3">
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

    <!-- Tools Section -->
    <v-expansion-panels class="mb-6">
      <v-expansion-panel>
        <v-expansion-panel-title>
          <v-icon class="mr-2" color="secondary">mdi-calculator-variant</v-icon>
          <span class="font-weight-medium">Rental Income Tools & Calculators</span>
          <v-chip class="ml-2" size="x-small" color="secondary" variant="tonal">
            Utilities
          </v-chip>
        </v-expansion-panel-title>
        <v-expansion-panel-text>
          <v-tabs v-model="activeToolTab" color="primary" class="mb-4">
            <v-tab value="pre-construction">Pre-Construction Interest</v-tab>
            <v-tab value="co-owner">Co-Owner Split Calculator</v-tab>
          </v-tabs>

          <v-tabs-window v-model="activeToolTab">
            <v-tabs-window-item value="pre-construction">
              <PreConstructionInterest />
            </v-tabs-window-item>
            <v-tabs-window-item value="co-owner">
              <CoOwnerSplit />
            </v-tabs-window-item>
          </v-tabs-window>
        </v-expansion-panel-text>
      </v-expansion-panel>
    </v-expansion-panels>

    <!-- Section 24 Info Card -->
    <v-row class="mb-6">
      <v-col cols="12">
        <v-card variant="outlined">
          <v-card-title>
            <v-icon class="mr-2" color="secondary">mdi-information</v-icon>
            Section 24 - Income from House Property
          </v-card-title>
          <v-card-text>
            <v-row>
              <v-col cols="12" md="4">
                <v-list density="compact">
                  <v-list-subheader>Standard Deduction</v-list-subheader>
                  <v-list-item>
                    <template #prepend>
                      <v-icon icon="mdi-check" color="success" size="small" />
                    </template>
                    <v-list-item-title>30% of NAV</v-list-item-title>
                    <v-list-item-subtitle>
                      Automatic for let-out property
                    </v-list-item-subtitle>
                  </v-list-item>
                </v-list>
              </v-col>
              <v-col cols="12" md="4">
                <v-list density="compact">
                  <v-list-subheader>Interest on Housing Loan</v-list-subheader>
                  <v-list-item>
                    <template #prepend>
                      <v-icon icon="mdi-check" color="success" size="small" />
                    </template>
                    <v-list-item-title>Self-Occupied</v-list-item-title>
                    <v-list-item-subtitle>
                      Max {{ formatINR(SECTION_24_LIMITS.selfOccupiedInterestLimit) }}/year
                    </v-list-item-subtitle>
                  </v-list-item>
                  <v-list-item>
                    <template #prepend>
                      <v-icon icon="mdi-check" color="success" size="small" />
                    </template>
                    <v-list-item-title>Let-Out Property</v-list-item-title>
                    <v-list-item-subtitle>
                      No limit on interest deduction
                    </v-list-item-subtitle>
                  </v-list-item>
                </v-list>
              </v-col>
              <v-col cols="12" md="4">
                <v-list density="compact">
                  <v-list-subheader>Loss from House Property</v-list-subheader>
                  <v-list-item>
                    <template #prepend>
                      <v-icon icon="mdi-alert" color="warning" size="small" />
                    </template>
                    <v-list-item-title>Set-off Limit</v-list-item-title>
                    <v-list-item-subtitle>
                      Max {{ formatINR(200000) }} against other income
                    </v-list-item-subtitle>
                  </v-list-item>
                  <v-list-item>
                    <template #prepend>
                      <v-icon icon="mdi-calendar" color="info" size="small" />
                    </template>
                    <v-list-item-title>Carry Forward</v-list-item-title>
                    <v-list-item-subtitle>
                      Excess loss for 8 years
                    </v-list-item-subtitle>
                  </v-list-item>
                </v-list>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Empty State -->
    <v-card
      v-if="!isLoading && (!rentalData || rentalData.length === 0)"
      variant="outlined"
    >
      <v-card-text class="text-center pa-8">
        <v-icon icon="mdi-home-off" size="64" color="grey-lighten-1" class="mb-4" />
        <div class="text-h6 text-medium-emphasis mb-2">
          No rental income for FY {{ selectedFinancialYear }}
        </div>
        <div class="text-body-2 text-medium-emphasis mb-4">
          Start by adding your rental properties in the Rental Details tab
        </div>
        <v-btn color="primary" variant="flat" @click="emit('go-to-details')">
          <v-icon icon="mdi-arrow-right" class="mr-2" />
          Go to Rental Details
        </v-btn>
      </v-card-text>
    </v-card>
  </div>
</template>

<style scoped>
.rental-overview-tab {
  width: 100%;
}
</style>
