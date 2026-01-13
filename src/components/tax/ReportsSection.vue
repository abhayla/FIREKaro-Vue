<script setup lang="ts">
import { ref, computed } from "vue";
import { Doughnut, Bar } from "vue-chartjs";
import {
  Chart as ChartJS,
  ArcElement,
  BarElement,
  CategoryScale,
  LinearScale,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import {
  useTaxComparison,
  useTaxSummary,
  useDeductionSummary,
  formatINR,
} from "@/composables/useTax";
import { chartColors, doughnutChartOptions, barChartOptions } from "@/utils/chartTheme";
import { DEDUCTION_LIMITS, ITR_FORMS } from "@/types/tax";

ChartJS.register(ArcElement, BarElement, CategoryScale, LinearScale, Title, Tooltip, Legend);

const props = defineProps<{
  financialYear: string;
}>();

const { data: comparison, isLoading: comparisonLoading } = useTaxComparison();
const { data: summary, isLoading: summaryLoading } = useTaxSummary();
const { data: deductionSummary, isLoading: deductionLoading } = useDeductionSummary();

const activeReportTab = ref("summary");

const isLoading = computed(
  () => comparisonLoading.value || summaryLoading.value || deductionLoading.value
);

// Tax Distribution Chart Data
const taxDistributionChartData = computed(() => {
  if (!comparison.value) {
    return {
      labels: ["Tax on Income", "Surcharge", "Cess"],
      datasets: [
        {
          data: [0, 0, 0],
          backgroundColor: [chartColors.primary[0], chartColors.primary[3], chartColors.primary[1]],
          borderWidth: 0,
        },
      ],
    };
  }

  const result =
    comparison.value.betterRegime === "NEW"
      ? comparison.value.newRegime
      : comparison.value.oldRegime;

  return {
    labels: ["Tax on Income", "Surcharge", "Health & Education Cess"],
    datasets: [
      {
        data: [result.taxOnIncome, result.surcharge, result.healthEducationCess],
        backgroundColor: [chartColors.primary[0], chartColors.primary[3], chartColors.primary[1]],
        borderWidth: 0,
      },
    ],
  };
});

// Regime Comparison Chart Data
const regimeComparisonChartData = computed(() => {
  if (!comparison.value) {
    return {
      labels: ["Old Regime", "New Regime"],
      datasets: [
        {
          label: "Tax Liability",
          data: [0, 0],
          backgroundColor: [chartColors.primary[1], chartColors.primary[0]],
        },
      ],
    };
  }

  return {
    labels: ["Old Regime", "New Regime"],
    datasets: [
      {
        label: "Tax Liability",
        data: [
          comparison.value.oldRegime.totalTaxLiability,
          comparison.value.newRegime.totalTaxLiability,
        ],
        backgroundColor: [chartColors.primary[1], chartColors.primary[0]],
      },
    ],
  };
});

// Deduction Utilization Chart Data
const deductionUtilizationChartData = computed(() => {
  if (!deductionSummary.value) {
    return {
      labels: ["80C", "80D", "80CCD(1B)", "Other"],
      datasets: [
        {
          label: "Utilized",
          data: [0, 0, 0, 0],
          backgroundColor: chartColors.primary[2],
        },
        {
          label: "Remaining",
          data: [
            DEDUCTION_LIMITS.section80C,
            DEDUCTION_LIMITS.section80D,
            DEDUCTION_LIMITS.section80CCD1B,
            0,
          ],
          backgroundColor: "rgba(0,0,0,0.1)",
        },
      ],
    };
  }

  const ds = deductionSummary.value;
  return {
    labels: ["80C", "80D", "80CCD(1B)", "Other"],
    datasets: [
      {
        label: "Utilized",
        data: [ds.section80C.total, ds.section80D.total, ds.section80CCD1B.total, ds.otherDeductions.total],
        backgroundColor: chartColors.primary[2],
      },
      {
        label: "Remaining",
        data: [ds.section80C.remaining, ds.section80D.remaining, ds.section80CCD1B.remaining, 0],
        backgroundColor: "rgba(0,0,0,0.1)",
      },
    ],
  };
});

// Report Cards Data
const reportCards = computed(() => {
  if (!summary.value || !comparison.value) return [];

  return [
    {
      title: "Gross Total Income",
      value: formatINR(summary.value.grossTotalIncome),
      icon: "mdi-cash-multiple",
      color: "primary",
    },
    {
      title: "Total Deductions",
      value: formatINR(summary.value.totalDeductions),
      icon: "mdi-minus-circle",
      color: "secondary",
    },
    {
      title: "Taxable Income",
      value: formatINR(summary.value.taxableIncome),
      icon: "mdi-calculator",
      color: "info",
    },
    {
      title: "Tax Payable",
      value: formatINR(summary.value.totalTax),
      icon: "mdi-currency-inr",
      color: "error",
    },
  ];
});

// Export functions
const exportLoading = ref(false);

async function exportToPDF() {
  exportLoading.value = true;
  try {
    const res = await fetch("/api/tax-planning/reports/export", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        financialYear: props.financialYear,
        format: "pdf",
        includeScenarios: true,
        includeAdvanceTax: true,
      }),
    });

    if (!res.ok) throw new Error("Export failed");

    const { data } = await res.json();

    const { default: jsPDF } = await import("jspdf");
    const { default: autoTable } = await import("jspdf-autotable");

    const doc = new jsPDF();

    doc.setFontSize(18);
    doc.text(`Tax Report - FY ${props.financialYear}`, 14, 20);
    doc.setFontSize(10);
    doc.text(`Generated: ${new Date().toLocaleDateString("en-IN")}`, 14, 28);

    if (data.taxSummary) {
      doc.setFontSize(14);
      doc.text("Tax Summary", 14, 40);

      autoTable(doc, {
        startY: 45,
        head: [["Parameter", "Value"]],
        body: [
          ["Selected Regime", data.taxSummary.selectedRegime],
          ["Total Gross Income", formatINR(data.taxSummary.totalGrossIncome)],
          ["Total Deductions", formatINR(data.taxSummary.totalDeductions)],
          ["Taxable Income", formatINR(data.taxSummary.taxableIncome)],
          ["Total Tax Liability", formatINR(data.taxSummary.totalTaxLiability)],
        ],
      });
    }

    doc.save(`tax-report-${props.financialYear}.pdf`);
  } catch (error) {
    console.error("PDF export failed:", error);
    alert("Failed to generate PDF. Please try again.");
  } finally {
    exportLoading.value = false;
  }
}

async function exportToExcel() {
  exportLoading.value = true;
  try {
    const res = await fetch("/api/tax-planning/reports/export", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        financialYear: props.financialYear,
        format: "excel",
        includeScenarios: true,
        includeAdvanceTax: true,
      }),
    });

    if (!res.ok) throw new Error("Export failed");

    const { sheets } = await res.json();

    const XLSX = await import("xlsx");

    const workbook = XLSX.utils.book_new();

    if (sheets.summary?.length) {
      const ws = XLSX.utils.aoa_to_sheet(sheets.summary);
      XLSX.utils.book_append_sheet(workbook, ws, "Summary");
    }

    if (sheets.scenarios?.length > 1) {
      const ws = XLSX.utils.aoa_to_sheet(sheets.scenarios);
      XLSX.utils.book_append_sheet(workbook, ws, "Scenarios");
    }

    if (sheets.advanceTax?.length > 1) {
      const ws = XLSX.utils.aoa_to_sheet(sheets.advanceTax);
      XLSX.utils.book_append_sheet(workbook, ws, "Advance Tax");
    }

    XLSX.writeFile(workbook, `tax-report-${props.financialYear}.xlsx`);
  } catch (error) {
    console.error("Excel export failed:", error);
    alert("Failed to generate Excel file. Please try again.");
  } finally {
    exportLoading.value = false;
  }
}
</script>

<template>
  <div class="reports-section">
    <!-- Export Buttons -->
    <div class="mb-4">
      <v-btn-group variant="outlined" density="compact">
        <v-btn prepend-icon="mdi-file-pdf-box" :loading="exportLoading" @click="exportToPDF">
          Export PDF
        </v-btn>
        <v-btn prepend-icon="mdi-file-excel" :loading="exportLoading" @click="exportToExcel">
          Export Excel
        </v-btn>
      </v-btn-group>
    </div>

    <!-- Report Tabs -->
    <v-tabs v-model="activeReportTab" class="mb-4">
      <v-tab value="summary">Tax Summary</v-tab>
      <v-tab value="comparison">Regime Comparison</v-tab>
      <v-tab value="deductions">Deduction Utilization</v-tab>
    </v-tabs>

    <v-window v-model="activeReportTab">
      <!-- Tax Summary Tab -->
      <v-window-item value="summary">
        <v-row class="mb-4">
          <v-col v-for="card in reportCards" :key="card.title" cols="6" md="3">
            <v-card variant="outlined" :loading="isLoading">
              <v-card-text class="text-center pa-3">
                <v-avatar :color="card.color" size="40" class="mb-2">
                  <v-icon :icon="card.icon" size="20" />
                </v-avatar>
                <div class="text-caption text-medium-emphasis">{{ card.title }}</div>
                <div class="text-subtitle-1 font-weight-bold text-currency">{{ card.value }}</div>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>

        <v-row>
          <v-col cols="12" md="6">
            <v-card variant="outlined" :loading="isLoading">
              <v-card-title class="text-subtitle-2">
                <v-icon class="mr-2" size="18">mdi-chart-pie</v-icon>
                Tax Distribution
              </v-card-title>
              <v-card-text>
                <div class="chart-container">
                  <Doughnut :data="taxDistributionChartData" :options="doughnutChartOptions" />
                </div>
              </v-card-text>
            </v-card>
          </v-col>

          <v-col cols="12" md="6">
            <v-card variant="outlined" :loading="summaryLoading">
              <v-card-title class="text-subtitle-2">
                <v-icon class="mr-2" size="18">mdi-table</v-icon>
                Tax Summary
              </v-card-title>
              <v-card-text v-if="summary">
                <v-table density="compact">
                  <tbody>
                    <tr>
                      <td class="text-body-2">Gross Total Income</td>
                      <td class="text-end text-currency">{{ formatINR(summary.grossTotalIncome) }}</td>
                    </tr>
                    <tr>
                      <td class="text-body-2">Less: Deductions</td>
                      <td class="text-end text-currency text-negative">-{{ formatINR(summary.totalDeductions) }}</td>
                    </tr>
                    <tr class="font-weight-medium">
                      <td>Taxable Income</td>
                      <td class="text-end text-currency">{{ formatINR(summary.taxableIncome) }}</td>
                    </tr>
                    <tr>
                      <td colspan="2"><v-divider /></td>
                    </tr>
                    <tr>
                      <td class="text-body-2">Tax on Income</td>
                      <td class="text-end text-currency">{{ formatINR(summary.totalTax) }}</td>
                    </tr>
                    <tr v-if="summary.tdsDeducted > 0">
                      <td class="text-body-2">Less: TDS Deducted</td>
                      <td class="text-end text-currency text-positive">-{{ formatINR(summary.tdsDeducted) }}</td>
                    </tr>
                    <tr class="font-weight-bold">
                      <td>{{ summary.refundDue > 0 ? "Refund Due" : "Tax Payable" }}</td>
                      <td
                        :class="['text-end', 'text-currency', summary.refundDue > 0 ? 'text-success' : 'text-error']"
                      >
                        {{ formatINR(summary.refundDue > 0 ? summary.refundDue : summary.selfAssessmentTax) }}
                      </td>
                    </tr>
                  </tbody>
                </v-table>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>
      </v-window-item>

      <!-- Regime Comparison Tab -->
      <v-window-item value="comparison">
        <v-row>
          <v-col cols="12" md="6">
            <v-card variant="outlined" :loading="comparisonLoading">
              <v-card-title class="text-subtitle-2">
                <v-icon class="mr-2" size="18">mdi-chart-bar</v-icon>
                Old vs New Regime
              </v-card-title>
              <v-card-text>
                <div class="chart-container">
                  <Bar :data="regimeComparisonChartData" :options="barChartOptions" />
                </div>
              </v-card-text>
            </v-card>
          </v-col>

          <v-col cols="12" md="6">
            <v-card variant="outlined" :loading="comparisonLoading">
              <v-card-title class="text-subtitle-2">
                <v-icon class="mr-2" size="18">mdi-scale-balance</v-icon>
                Detailed Comparison
              </v-card-title>
              <v-card-text v-if="comparison">
                <v-table density="compact">
                  <thead>
                    <tr>
                      <th>Parameter</th>
                      <th class="text-end">Old</th>
                      <th class="text-end">New</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>Gross Income</td>
                      <td class="text-end text-currency">{{ formatINR(comparison.oldRegime.grossTotalIncome) }}</td>
                      <td class="text-end text-currency">{{ formatINR(comparison.newRegime.grossTotalIncome) }}</td>
                    </tr>
                    <tr>
                      <td>Deductions</td>
                      <td class="text-end text-currency">{{ formatINR(comparison.oldRegime.totalDeductions) }}</td>
                      <td class="text-end text-currency">{{ formatINR(comparison.newRegime.totalDeductions) }}</td>
                    </tr>
                    <tr>
                      <td>Taxable Income</td>
                      <td class="text-end text-currency">{{ formatINR(comparison.oldRegime.taxableIncome) }}</td>
                      <td class="text-end text-currency">{{ formatINR(comparison.newRegime.taxableIncome) }}</td>
                    </tr>
                    <tr class="font-weight-bold">
                      <td>Total Tax</td>
                      <td
                        :class="['text-end', 'text-currency', comparison.betterRegime === 'OLD' ? 'text-success' : '']"
                      >
                        {{ formatINR(comparison.oldRegime.totalTaxLiability) }}
                      </td>
                      <td
                        :class="['text-end', 'text-currency', comparison.betterRegime === 'NEW' ? 'text-success' : '']"
                      >
                        {{ formatINR(comparison.newRegime.totalTaxLiability) }}
                      </td>
                    </tr>
                  </tbody>
                </v-table>

                <v-alert
                  :color="comparison.betterRegime === 'NEW' ? 'primary' : 'secondary'"
                  variant="tonal"
                  density="compact"
                  class="mt-3"
                >
                  <div class="text-body-2">
                    <strong>{{ comparison.betterRegime === "NEW" ? "New Regime" : "Old Regime" }}</strong>
                    saves you
                    <strong>{{ formatINR(comparison.savingsAmount) }}</strong>
                  </div>
                </v-alert>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>
      </v-window-item>

      <!-- Deduction Utilization Tab -->
      <v-window-item value="deductions">
        <v-row>
          <v-col cols="12" md="6">
            <v-card variant="outlined" :loading="deductionLoading">
              <v-card-title class="text-subtitle-2">
                <v-icon class="mr-2" size="18">mdi-chart-bar</v-icon>
                Deduction Utilization
              </v-card-title>
              <v-card-text>
                <div class="chart-container">
                  <Bar
                    :data="deductionUtilizationChartData"
                    :options="{
                      ...barChartOptions,
                      indexAxis: 'y',
                      scales: {
                        ...barChartOptions.scales,
                        x: { ...barChartOptions.scales.x, stacked: true },
                        y: { ...barChartOptions.scales.y, stacked: true },
                      },
                    }"
                  />
                </div>
              </v-card-text>
            </v-card>
          </v-col>

          <v-col cols="12" md="6">
            <v-card variant="outlined" :loading="deductionLoading">
              <v-card-title class="text-subtitle-2">
                <v-icon class="mr-2" size="18">mdi-format-list-checks</v-icon>
                Section-wise Summary
              </v-card-title>
              <v-card-text v-if="deductionSummary">
                <v-list density="compact">
                  <v-list-item>
                    <template #prepend>
                      <v-avatar color="primary" size="28">
                        <span class="text-caption">80C</span>
                      </v-avatar>
                    </template>
                    <v-list-item-title class="text-body-2">Section 80C</v-list-item-title>
                    <v-list-item-subtitle>
                      {{ formatINR(deductionSummary.section80C.total) }} /
                      {{ formatINR(DEDUCTION_LIMITS.section80C) }}
                    </v-list-item-subtitle>
                    <template #append>
                      <v-chip
                        :color="deductionSummary.section80C.utilizationPercent >= 100 ? 'success' : 'warning'"
                        size="x-small"
                      >
                        {{ deductionSummary.section80C.utilizationPercent.toFixed(0) }}%
                      </v-chip>
                    </template>
                  </v-list-item>

                  <v-list-item>
                    <template #prepend>
                      <v-avatar color="error" size="28">
                        <span class="text-caption">80D</span>
                      </v-avatar>
                    </template>
                    <v-list-item-title class="text-body-2">Section 80D</v-list-item-title>
                    <v-list-item-subtitle>
                      {{ formatINR(deductionSummary.section80D.total) }} /
                      {{ formatINR(DEDUCTION_LIMITS.section80D) }}
                    </v-list-item-subtitle>
                    <template #append>
                      <v-chip
                        :color="deductionSummary.section80D.utilizationPercent >= 100 ? 'success' : 'warning'"
                        size="x-small"
                      >
                        {{ deductionSummary.section80D.utilizationPercent.toFixed(0) }}%
                      </v-chip>
                    </template>
                  </v-list-item>

                  <v-list-item>
                    <template #prepend>
                      <v-avatar color="info" size="28">
                        <span class="text-caption">NPS</span>
                      </v-avatar>
                    </template>
                    <v-list-item-title class="text-body-2">Section 80CCD(1B)</v-list-item-title>
                    <v-list-item-subtitle>
                      {{ formatINR(deductionSummary.section80CCD1B.total) }} /
                      {{ formatINR(DEDUCTION_LIMITS.section80CCD1B) }}
                    </v-list-item-subtitle>
                    <template #append>
                      <v-chip
                        :color="deductionSummary.section80CCD1B.utilizationPercent >= 100 ? 'success' : 'warning'"
                        size="x-small"
                      >
                        {{ deductionSummary.section80CCD1B.utilizationPercent.toFixed(0) }}%
                      </v-chip>
                    </template>
                  </v-list-item>
                </v-list>

                <v-divider class="my-2" />

                <div class="d-flex justify-space-between align-center">
                  <span class="text-body-2">Total Deductions</span>
                  <span class="text-subtitle-1 font-weight-bold text-currency">
                    {{ formatINR(deductionSummary.totalDeductions) }}
                  </span>
                </div>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>
      </v-window-item>
    </v-window>

    <!-- ITR Form Reference -->
    <v-card variant="outlined" class="mt-4">
      <v-card-title class="text-subtitle-2">
        <v-icon class="mr-2" size="18">mdi-file-document-multiple</v-icon>
        ITR Form Reference
      </v-card-title>
      <v-card-text>
        <v-row dense>
          <v-col v-for="(form, key) in ITR_FORMS" :key="key" cols="12" sm="6" md="3">
            <v-card variant="tonal" class="h-100">
              <v-card-text class="pa-3">
                <div class="d-flex align-center mb-1">
                  <v-chip color="primary" size="x-small">{{ key }}</v-chip>
                  <span class="text-caption ml-2">{{ form.name }}</span>
                </div>
                <div class="text-caption mb-1">{{ form.description }}</div>
                <div class="text-caption text-success">
                  <v-icon size="x-small">mdi-check</v-icon>
                  {{ form.eligibility.slice(0, 2).join(", ") }}
                </div>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>
  </div>
</template>

<style scoped>
.chart-container {
  height: 200px;
  position: relative;
}
</style>
