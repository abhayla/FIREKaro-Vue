<script setup lang="ts">
import { ref, computed } from "vue";
import SummaryMetricCards from "@/components/shared/SummaryMetricCards.vue";
import YoYComparison from "@/components/shared/YoYComparison.vue";
import IncomeChart from "@/components/shared/IncomeChart.vue";
import BrokerCSVImport from "@/components/income/BrokerCSVImport.vue";
import PropertyLTCGCalculator from "@/components/income/PropertyLTCGCalculator.vue";
import Section54Dashboard from "@/components/income/Section54Dashboard.vue";
import {
  useCapitalGains,
  useCapitalGainsSummary,
  useAddCapitalGain,
  formatINR,
  formatINRLakhs,
} from "@/composables/useIncome";
import { useFinancialYear } from "@/composables/useSalary";
import type { MetricCard } from "@/components/shared/SummaryMetricCards.vue";

const emit = defineEmits<{
  (e: "go-to-details"): void;
}>();

const { selectedFinancialYear } = useFinancialYear();
const { data: capitalGainsData, isLoading } = useCapitalGains();
const { summary } = useCapitalGainsSummary();
const addMutation = useAddCapitalGain();

// Tools tab
const activeToolTab = ref("import");

// Summary metrics
const metrics = computed<MetricCard[]>(() => [
  {
    label: "Transactions",
    value: summary.value?.totalTransactions || 0,
    icon: "mdi-swap-horizontal",
    color: "info",
    format: "number",
    subtitle: `FY ${selectedFinancialYear.value}`,
  },
  {
    label: "STCG",
    value: summary.value?.stcgTotal || 0,
    icon: "mdi-clock-fast",
    color: "warning",
    format: "currency",
    subtitle: "Short-term gains",
  },
  {
    label: "LTCG",
    value: summary.value?.ltcgTotal || 0,
    icon: "mdi-clock-outline",
    color: "success",
    format: "currency",
    subtitle: "Long-term gains",
  },
  {
    label: "Estimated Tax",
    value: summary.value?.estimatedTax || 0,
    icon: "mdi-calculator",
    color: "error",
    format: "currency",
    subtitle: "Tax liability",
  },
]);

// Chart data - by asset type
const chartData = computed(() => {
  if (!capitalGainsData.value?.length) return [];
  const byType: Record<string, { stcg: number; ltcg: number }> = {};
  for (const cg of capitalGainsData.value) {
    if (!byType[cg.assetType]) {
      byType[cg.assetType] = { stcg: 0, ltcg: 0 };
    }
    if (cg.gainType === "STCG") {
      byType[cg.assetType].stcg += cg.taxableGain;
    } else {
      byType[cg.assetType].ltcg += cg.taxableGain;
    }
  }
  return Object.entries(byType).map(([type, data]) => ({
    label: getAssetTypeLabel(type),
    primary: data.stcg,
    secondary: data.ltcg,
  }));
});

const chartConfig = {
  title: "Capital Gains by Asset Type",
  icon: "mdi-chart-bar",
  primaryLabel: "STCG",
  primaryColor: "warning",
  secondaryLabel: "LTCG",
  secondaryColor: "success",
  showStats: true,
};

// YoY comparison (would need API support for actual data)
const yoyData = computed(() => {
  return null; // Return null to show "No comparison data available"
});

// Gains breakdown by type
const gainsByType = computed(() => {
  if (!capitalGainsData.value?.length) return [];
  const byType: Record<string, { count: number; amount: number }> = {};
  for (const cg of capitalGainsData.value) {
    if (!byType[cg.assetType]) {
      byType[cg.assetType] = { count: 0, amount: 0 };
    }
    byType[cg.assetType].count++;
    byType[cg.assetType].amount += cg.taxableGain;
  }
  const total =
    capitalGainsData.value.reduce((sum, cg) => sum + cg.taxableGain, 0) || 1;
  return Object.entries(byType).map(([type, data]) => ({
    type,
    label: getAssetTypeLabel(type),
    ...data,
    percentage: Math.abs((data.amount / total) * 100),
    color: getAssetTypeColor(type),
  }));
});

function getAssetTypeLabel(type: string) {
  switch (type) {
    case "equity":
      return "Equity";
    case "debt_mf":
      return "Debt MF";
    case "property":
      return "Property";
    case "gold":
      return "Gold";
    case "crypto":
      return "Crypto";
    default:
      return "Other";
  }
}

function getAssetTypeColor(type: string) {
  switch (type) {
    case "equity":
      return "primary";
    case "debt_mf":
      return "info";
    case "property":
      return "secondary";
    case "gold":
      return "warning";
    case "crypto":
      return "purple";
    default:
      return "grey";
  }
}

// Handle CSV import
interface ImportedGain {
  assetName: string;
  symbol: string;
  purchaseDate: string;
  purchasePrice: number;
  saleDate: string;
  salePrice: number;
  holdingPeriodMonths: number;
  gainType: "STCG" | "LTCG";
  gain: number;
}

async function handleCSVImport(gains: ImportedGain[]) {
  for (const gain of gains) {
    await addMutation.mutateAsync({
      assetType: "equity",
      assetName: gain.assetName,
      financialYear: selectedFinancialYear.value,
      purchaseDate: gain.purchaseDate,
      purchasePrice: gain.purchasePrice,
      saleDate: gain.saleDate,
      salePrice: gain.salePrice,
      purchaseExpenses: 0,
      saleExpenses: 0,
    });
  }
}
</script>

<template>
  <div class="capital-gains-overview-tab">
    <!-- Summary Metric Cards -->
    <SummaryMetricCards
      :metrics="metrics"
      :columns="4"
      :loading="isLoading"
      class="mb-6"
    />

    <!-- Charts Row -->
    <v-row class="mb-6">
      <!-- Capital Gains Chart -->
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

          <!-- Asset Type Breakdown -->
          <v-col cols="12">
            <v-card variant="outlined">
              <v-card-title class="text-subtitle-2">
                <v-icon icon="mdi-chart-pie" class="mr-2" color="primary" size="small" />
                BY ASSET TYPE
              </v-card-title>
              <v-card-text v-if="gainsByType.length > 0">
                <div v-for="item in gainsByType" :key="item.type" class="mb-3">
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
          <span class="font-weight-medium">Capital Gains Tools & Calculators</span>
          <v-chip class="ml-2" size="x-small" color="info" variant="tonal">
            Budget 2024
          </v-chip>
        </v-expansion-panel-title>
        <v-expansion-panel-text>
          <v-tabs v-model="activeToolTab" color="primary" class="mb-4">
            <v-tab value="import">
              <v-icon start>mdi-file-upload</v-icon>
              Import from Broker
            </v-tab>
            <v-tab value="ltcg">
              <v-icon start>mdi-calculator</v-icon>
              Property LTCG Calculator
            </v-tab>
            <v-tab value="exemptions">
              <v-icon start>mdi-shield-home</v-icon>
              Section 54/54F Tracker
            </v-tab>
          </v-tabs>

          <v-tabs-window v-model="activeToolTab">
            <v-tabs-window-item value="import">
              <BrokerCSVImport @import="handleCSVImport" />
            </v-tabs-window-item>
            <v-tabs-window-item value="ltcg">
              <PropertyLTCGCalculator />
            </v-tabs-window-item>
            <v-tabs-window-item value="exemptions">
              <Section54Dashboard />
            </v-tabs-window-item>
          </v-tabs-window>
        </v-expansion-panel-text>
      </v-expansion-panel>
    </v-expansion-panels>

    <!-- Tax Rates Info -->
    <v-row class="mb-6">
      <v-col cols="12">
        <v-card variant="outlined">
          <v-card-title>
            <v-icon class="mr-2" color="success">mdi-information</v-icon>
            Capital Gains Tax Rates (Post Budget 2024)
          </v-card-title>
          <v-card-text>
            <v-table density="compact">
              <thead>
                <tr>
                  <th>Asset Type</th>
                  <th>STCG Period</th>
                  <th>LTCG Period</th>
                  <th>STCG Rate</th>
                  <th>LTCG Rate</th>
                  <th>Notes</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>
                    <v-chip size="small" color="primary" variant="tonal">Equity/MF</v-chip>
                  </td>
                  <td>&lt; 12 months</td>
                  <td>&gt;= 12 months</td>
                  <td class="text-warning font-weight-medium">20%</td>
                  <td class="text-success font-weight-medium">12.5%</td>
                  <td>LTCG exemption: Rs.1.25L</td>
                </tr>
                <tr>
                  <td>
                    <v-chip size="small" color="info" variant="tonal">Debt MF</v-chip>
                  </td>
                  <td colspan="2">Any period</td>
                  <td colspan="2" class="text-center">Slab Rate</td>
                  <td>No LTCG benefit (post Apr 2023)</td>
                </tr>
                <tr>
                  <td>
                    <v-chip size="small" color="secondary" variant="tonal">Property</v-chip>
                  </td>
                  <td>&lt; 24 months</td>
                  <td>&gt;= 24 months</td>
                  <td>Slab Rate</td>
                  <td class="text-success font-weight-medium">12.5%</td>
                  <td>Or 20% with indexation (pre-July 2024)</td>
                </tr>
                <tr>
                  <td>
                    <v-chip size="small" color="warning" variant="tonal">Gold</v-chip>
                  </td>
                  <td>&lt; 24 months</td>
                  <td>&gt;= 24 months</td>
                  <td>Slab Rate</td>
                  <td class="text-success font-weight-medium">12.5%</td>
                  <td>No indexation post July 2024</td>
                </tr>
                <tr>
                  <td>
                    <v-chip size="small" color="purple" variant="tonal">Crypto</v-chip>
                  </td>
                  <td colspan="2">Any period</td>
                  <td colspan="2" class="text-center text-error font-weight-medium">30%</td>
                  <td>Flat rate, no deductions</td>
                </tr>
              </tbody>
            </v-table>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Empty State -->
    <v-card
      v-if="!isLoading && (!capitalGainsData || capitalGainsData.length === 0)"
      variant="outlined"
    >
      <v-card-text class="text-center pa-8">
        <v-icon icon="mdi-chart-line" size="64" color="grey-lighten-1" class="mb-4" />
        <div class="text-h6 text-medium-emphasis mb-2">
          No capital gains for FY {{ selectedFinancialYear }}
        </div>
        <div class="text-body-2 text-medium-emphasis mb-4">
          Start by adding your capital gains transactions in the Capital Gains Details tab
        </div>
        <v-btn color="primary" variant="flat" @click="emit('go-to-details')">
          <v-icon icon="mdi-arrow-right" class="mr-2" />
          Go to Capital Gains Details
        </v-btn>
      </v-card-text>
    </v-card>
  </div>
</template>

<style scoped>
.capital-gains-overview-tab {
  width: 100%;
}
</style>
