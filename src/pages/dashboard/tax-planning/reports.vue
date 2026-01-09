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
import SectionHeader from "@/components/shared/SectionHeader.vue";
import {
  useTaxComparison,
  useTaxSummary,
  useDeductionSummary,
  useAdvanceTaxEstimate,
  formatINR,
} from "@/composables/useTax";
import { useFinancialYear } from "@/composables/useSalary";
import {
  chartColors,
  doughnutChartOptions,
  barChartOptions,
} from "@/utils/chartTheme";
import { DEDUCTION_LIMITS, ITR_FORMS } from "@/types/tax";

ChartJS.register(
  ArcElement,
  BarElement,
  CategoryScale,
  LinearScale,
  Title,
  Tooltip,
  Legend,
);

const tabs = [
  { title: "Overview", route: "/dashboard/tax-planning" },
  { title: "Calculator", route: "/dashboard/tax-planning/calculator" },
  { title: "Deductions", route: "/dashboard/tax-planning/deductions" },
  { title: "Advance Tax", route: "/dashboard/tax-planning/advance-tax" },
  { title: "Scenarios", route: "/dashboard/tax-planning/scenarios" },
  { title: "Reports", route: "/dashboard/tax-planning/reports" },
];

const { selectedFinancialYear, financialYearOptions } = useFinancialYear();
const { data: comparison, isLoading: comparisonLoading } = useTaxComparison();
const { data: summary, isLoading: summaryLoading } = useTaxSummary();
const { data: deductionSummary, isLoading: deductionLoading } =
  useDeductionSummary();
const { data: advanceTax, isLoading: advanceTaxLoading } =
  useAdvanceTaxEstimate();

const activeReportTab = ref("summary");

const isLoading = computed(
  () =>
    comparisonLoading.value || summaryLoading.value || deductionLoading.value,
);

// Tax Distribution Chart Data
const taxDistributionChartData = computed(() => {
  if (!comparison.value) {
    return {
      labels: ["Tax on Income", "Surcharge", "Cess"],
      datasets: [
        {
          data: [0, 0, 0],
          backgroundColor: [
            chartColors.primary[0],
            chartColors.primary[3],
            chartColors.primary[1],
          ],
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
        data: [
          result.taxOnIncome,
          result.surcharge,
          result.healthEducationCess,
        ],
        backgroundColor: [
          chartColors.primary[0],
          chartColors.primary[3],
          chartColors.primary[1],
        ],
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
        data: [
          ds.section80C.total,
          ds.section80D.total,
          ds.section80CCD1B.total,
          ds.otherDeductions.total,
        ],
        backgroundColor: chartColors.primary[2],
      },
      {
        label: "Remaining",
        data: [
          ds.section80C.remaining,
          ds.section80D.remaining,
          ds.section80CCD1B.remaining,
          0,
        ],
        backgroundColor: "rgba(0,0,0,0.1)",
      },
    ],
  };
});

// Advance Tax Schedule
interface AdvanceTaxScheduleItem {
  quarter: number;
  quarterName?: string;
  dueDate: string;
  cumulativePercentage: number;
  cumulativeAmountDue: number;
  amountPaid: number;
  shortfall: number;
  status: string;
}

const advanceTaxSchedule = computed(() => {
  if (!advanceTax.value?.schedules) return [];
  return advanceTax.value.schedules.map((s: AdvanceTaxScheduleItem) => ({
    ...s,
    statusColor:
      s.status === "PAID"
        ? "success"
        : s.status === "OVERDUE"
          ? "error"
          : "warning",
  }));
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
    {
      title: "Effective Rate",
      value: `${
        comparison.value.betterRegime === "NEW"
          ? comparison.value.newRegime.effectiveRate.toFixed(1)
          : comparison.value.oldRegime.effectiveRate.toFixed(1)
      }%`,
      icon: "mdi-percent",
      color: "warning",
    },
    {
      title: "Tax Savings",
      value: formatINR(comparison.value.savingsAmount),
      icon: "mdi-piggy-bank",
      color: "success",
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
        financialYear: selectedFinancialYear.value,
        format: "pdf",
        includeScenarios: true,
        includeAdvanceTax: true,
      }),
    });

    if (!res.ok) throw new Error("Export failed");

    const { data } = await res.json();

    // Use jsPDF for client-side PDF generation
    const { default: jsPDF } = await import("jspdf");
    const { default: autoTable } = await import("jspdf-autotable");

    const doc = new jsPDF();

    // Title
    doc.setFontSize(18);
    doc.text(`Tax Report - FY ${selectedFinancialYear.value}`, 14, 20);
    doc.setFontSize(10);
    doc.text(`Generated: ${new Date().toLocaleDateString("en-IN")}`, 14, 28);

    // Tax Summary
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

    // Save PDF
    doc.save(`tax-report-${selectedFinancialYear.value}.pdf`);
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
        financialYear: selectedFinancialYear.value,
        format: "excel",
        includeScenarios: true,
        includeAdvanceTax: true,
      }),
    });

    if (!res.ok) throw new Error("Export failed");

    const { sheets } = await res.json();

    // Use xlsx for client-side Excel generation
    const XLSX = await import("xlsx");

    const workbook = XLSX.utils.book_new();

    // Summary sheet
    if (sheets.summary?.length) {
      const ws = XLSX.utils.aoa_to_sheet(sheets.summary);
      XLSX.utils.book_append_sheet(workbook, ws, "Summary");
    }

    // Scenarios sheet
    if (sheets.scenarios?.length > 1) {
      const ws = XLSX.utils.aoa_to_sheet(sheets.scenarios);
      XLSX.utils.book_append_sheet(workbook, ws, "Scenarios");
    }

    // Advance Tax sheet
    if (sheets.advanceTax?.length > 1) {
      const ws = XLSX.utils.aoa_to_sheet(sheets.advanceTax);
      XLSX.utils.book_append_sheet(workbook, ws, "Advance Tax");
    }

    // Save Excel
    XLSX.writeFile(workbook, `tax-report-${selectedFinancialYear.value}.xlsx`);
  } catch (error) {
    console.error("Excel export failed:", error);
    alert("Failed to generate Excel file. Please try again.");
  } finally {
    exportLoading.value = false;
  }
}
</script>

<template>
  <div>
    <SectionHeader
      title="Tax Planning"
      subtitle="Tax Reports & ITR Suggestions"
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
        <v-btn-group variant="outlined" density="compact">
          <v-btn
            prepend-icon="mdi-file-pdf-box"
            :loading="exportLoading"
            @click="exportToPDF"
          >
            PDF
          </v-btn>
          <v-btn
            prepend-icon="mdi-file-excel"
            :loading="exportLoading"
            @click="exportToExcel"
          >
            Excel
          </v-btn>
        </v-btn-group>
      </v-col>
    </v-row>

    <!-- Report Tabs -->
    <v-tabs v-model="activeReportTab" class="mb-6">
      <v-tab value="summary">Tax Summary</v-tab>
      <v-tab value="comparison">Regime Comparison</v-tab>
      <v-tab value="deductions">Deduction Utilization</v-tab>
      <v-tab value="advance-tax">Advance Tax</v-tab>
    </v-tabs>

    <v-window v-model="activeReportTab">
      <!-- Tax Summary Tab -->
      <v-window-item value="summary">
        <!-- Summary Cards -->
        <v-row class="mb-6">
          <v-col
            v-for="card in reportCards"
            :key="card.title"
            cols="12"
            sm="6"
            md="4"
            lg="2"
          >
            <v-card :loading="isLoading">
              <v-card-text class="text-center">
                <v-avatar :color="card.color" size="48" class="mb-2">
                  <v-icon :icon="card.icon" />
                </v-avatar>
                <div class="text-caption text-medium-emphasis">
                  {{ card.title }}
                </div>
                <div class="text-h6 font-weight-bold text-currency">
                  {{ card.value }}
                </div>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>

        <v-row>
          <!-- Tax Distribution -->
          <v-col cols="12" md="6">
            <v-card :loading="isLoading">
              <v-card-title>
                <v-icon class="mr-2">mdi-chart-pie</v-icon>
                Tax Distribution
              </v-card-title>
              <v-card-text>
                <div class="chart-container">
                  <Doughnut
                    :data="taxDistributionChartData"
                    :options="doughnutChartOptions"
                  />
                </div>
              </v-card-text>
            </v-card>
          </v-col>

          <!-- Tax Summary Table -->
          <v-col cols="12" md="6">
            <v-card :loading="summaryLoading">
              <v-card-title>
                <v-icon class="mr-2">mdi-table</v-icon>
                Tax Summary
              </v-card-title>
              <v-card-text v-if="summary">
                <v-table density="compact">
                  <tbody>
                    <tr>
                      <td class="text-body-2">Gross Total Income</td>
                      <td class="text-end text-currency">
                        {{ formatINR(summary.grossTotalIncome) }}
                      </td>
                    </tr>
                    <tr>
                      <td class="text-body-2">Less: Deductions</td>
                      <td class="text-end text-currency text-negative">
                        -{{ formatINR(summary.totalDeductions) }}
                      </td>
                    </tr>
                    <tr class="font-weight-medium">
                      <td>Taxable Income</td>
                      <td class="text-end text-currency">
                        {{ formatINR(summary.taxableIncome) }}
                      </td>
                    </tr>
                    <tr>
                      <td colspan="2"><v-divider /></td>
                    </tr>
                    <tr>
                      <td class="text-body-2">Tax on Income</td>
                      <td class="text-end text-currency">
                        {{ formatINR(summary.totalTax) }}
                      </td>
                    </tr>
                    <tr v-if="summary.tdsDeducted > 0">
                      <td class="text-body-2">Less: TDS Deducted</td>
                      <td class="text-end text-currency text-positive">
                        -{{ formatINR(summary.tdsDeducted) }}
                      </td>
                    </tr>
                    <tr v-if="summary.advanceTaxPaid > 0">
                      <td class="text-body-2">Less: Advance Tax Paid</td>
                      <td class="text-end text-currency text-positive">
                        -{{ formatINR(summary.advanceTaxPaid) }}
                      </td>
                    </tr>
                    <tr class="font-weight-bold">
                      <td>
                        {{
                          summary.refundDue > 0 ? "Refund Due" : "Tax Payable"
                        }}
                      </td>
                      <td
                        :class="[
                          'text-end',
                          'text-currency',
                          summary.refundDue > 0 ? 'text-success' : 'text-error',
                        ]"
                      >
                        {{
                          formatINR(
                            summary.refundDue > 0
                              ? summary.refundDue
                              : summary.selfAssessmentTax,
                          )
                        }}
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
            <v-card :loading="comparisonLoading">
              <v-card-title>
                <v-icon class="mr-2">mdi-chart-bar</v-icon>
                Old vs New Regime
              </v-card-title>
              <v-card-text>
                <div class="chart-container">
                  <Bar
                    :data="regimeComparisonChartData"
                    :options="barChartOptions"
                  />
                </div>
              </v-card-text>
            </v-card>
          </v-col>

          <v-col cols="12" md="6">
            <v-card :loading="comparisonLoading">
              <v-card-title>
                <v-icon class="mr-2">mdi-scale-balance</v-icon>
                Detailed Comparison
              </v-card-title>
              <v-card-text v-if="comparison">
                <v-table density="compact">
                  <thead>
                    <tr>
                      <th>Parameter</th>
                      <th class="text-end">Old Regime</th>
                      <th class="text-end">New Regime</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>Gross Income</td>
                      <td class="text-end text-currency">
                        {{ formatINR(comparison.oldRegime.grossTotalIncome) }}
                      </td>
                      <td class="text-end text-currency">
                        {{ formatINR(comparison.newRegime.grossTotalIncome) }}
                      </td>
                    </tr>
                    <tr>
                      <td>Deductions</td>
                      <td class="text-end text-currency">
                        {{ formatINR(comparison.oldRegime.totalDeductions) }}
                      </td>
                      <td class="text-end text-currency">
                        {{ formatINR(comparison.newRegime.totalDeductions) }}
                      </td>
                    </tr>
                    <tr>
                      <td>Taxable Income</td>
                      <td class="text-end text-currency">
                        {{ formatINR(comparison.oldRegime.taxableIncome) }}
                      </td>
                      <td class="text-end text-currency">
                        {{ formatINR(comparison.newRegime.taxableIncome) }}
                      </td>
                    </tr>
                    <tr>
                      <td>Tax on Income</td>
                      <td class="text-end text-currency">
                        {{ formatINR(comparison.oldRegime.taxOnIncome) }}
                      </td>
                      <td class="text-end text-currency">
                        {{ formatINR(comparison.newRegime.taxOnIncome) }}
                      </td>
                    </tr>
                    <tr>
                      <td>Surcharge</td>
                      <td class="text-end text-currency">
                        {{ formatINR(comparison.oldRegime.surcharge) }}
                      </td>
                      <td class="text-end text-currency">
                        {{ formatINR(comparison.newRegime.surcharge) }}
                      </td>
                    </tr>
                    <tr>
                      <td>Cess (4%)</td>
                      <td class="text-end text-currency">
                        {{
                          formatINR(comparison.oldRegime.healthEducationCess)
                        }}
                      </td>
                      <td class="text-end text-currency">
                        {{
                          formatINR(comparison.newRegime.healthEducationCess)
                        }}
                      </td>
                    </tr>
                    <tr class="font-weight-bold">
                      <td>Total Tax</td>
                      <td
                        :class="[
                          'text-end',
                          'text-currency',
                          comparison.betterRegime === 'OLD'
                            ? 'text-success'
                            : '',
                        ]"
                      >
                        {{ formatINR(comparison.oldRegime.totalTaxLiability) }}
                      </td>
                      <td
                        :class="[
                          'text-end',
                          'text-currency',
                          comparison.betterRegime === 'NEW'
                            ? 'text-success'
                            : '',
                        ]"
                      >
                        {{ formatINR(comparison.newRegime.totalTaxLiability) }}
                      </td>
                    </tr>
                    <tr>
                      <td>Effective Rate</td>
                      <td class="text-end">
                        {{ comparison.oldRegime.effectiveRate.toFixed(2) }}%
                      </td>
                      <td class="text-end">
                        {{ comparison.newRegime.effectiveRate.toFixed(2) }}%
                      </td>
                    </tr>
                  </tbody>
                </v-table>

                <v-alert
                  :color="
                    comparison.betterRegime === 'NEW' ? 'primary' : 'secondary'
                  "
                  variant="tonal"
                  class="mt-4"
                >
                  <template #prepend>
                    <v-icon icon="mdi-check-circle" />
                  </template>
                  <div class="text-body-2">
                    <strong>{{
                      comparison.betterRegime === "NEW"
                        ? "New Regime"
                        : "Old Regime"
                    }}</strong>
                    saves you
                    <strong>{{ formatINR(comparison.savingsAmount) }}</strong>
                    ({{ comparison.savingsPercentage.toFixed(1) }}% less tax)
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
            <v-card :loading="deductionLoading">
              <v-card-title>
                <v-icon class="mr-2">mdi-chart-bar</v-icon>
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
            <v-card :loading="deductionLoading">
              <v-card-title>
                <v-icon class="mr-2">mdi-format-list-checks</v-icon>
                Section-wise Summary
              </v-card-title>
              <v-card-text v-if="deductionSummary">
                <v-list>
                  <v-list-item>
                    <template #prepend>
                      <v-avatar color="primary" size="32">
                        <span class="text-caption">80C</span>
                      </v-avatar>
                    </template>
                    <v-list-item-title>Section 80C</v-list-item-title>
                    <v-list-item-subtitle>
                      {{ formatINR(deductionSummary.section80C.total) }} /
                      {{ formatINR(DEDUCTION_LIMITS.section80C) }}
                    </v-list-item-subtitle>
                    <template #append>
                      <v-chip
                        :color="
                          deductionSummary.section80C.utilizationPercent >= 100
                            ? 'success'
                            : 'warning'
                        "
                        size="small"
                      >
                        {{
                          deductionSummary.section80C.utilizationPercent.toFixed(
                            0,
                          )
                        }}%
                      </v-chip>
                    </template>
                  </v-list-item>

                  <v-list-item>
                    <template #prepend>
                      <v-avatar color="error" size="32">
                        <span class="text-caption">80D</span>
                      </v-avatar>
                    </template>
                    <v-list-item-title>Section 80D</v-list-item-title>
                    <v-list-item-subtitle>
                      {{ formatINR(deductionSummary.section80D.total) }} /
                      {{ formatINR(DEDUCTION_LIMITS.section80D) }}
                    </v-list-item-subtitle>
                    <template #append>
                      <v-chip
                        :color="
                          deductionSummary.section80D.utilizationPercent >= 100
                            ? 'success'
                            : 'warning'
                        "
                        size="small"
                      >
                        {{
                          deductionSummary.section80D.utilizationPercent.toFixed(
                            0,
                          )
                        }}%
                      </v-chip>
                    </template>
                  </v-list-item>

                  <v-list-item>
                    <template #prepend>
                      <v-avatar color="info" size="32">
                        <span class="text-caption">NPS</span>
                      </v-avatar>
                    </template>
                    <v-list-item-title>Section 80CCD(1B)</v-list-item-title>
                    <v-list-item-subtitle>
                      {{ formatINR(deductionSummary.section80CCD1B.total) }} /
                      {{ formatINR(DEDUCTION_LIMITS.section80CCD1B) }}
                    </v-list-item-subtitle>
                    <template #append>
                      <v-chip
                        :color="
                          deductionSummary.section80CCD1B.utilizationPercent >=
                          100
                            ? 'success'
                            : 'warning'
                        "
                        size="small"
                      >
                        {{
                          deductionSummary.section80CCD1B.utilizationPercent.toFixed(
                            0,
                          )
                        }}%
                      </v-chip>
                    </template>
                  </v-list-item>
                </v-list>

                <v-divider class="my-3" />

                <div class="d-flex justify-space-between align-center">
                  <span class="text-subtitle-2">Total Deductions</span>
                  <span class="text-h6 font-weight-bold text-currency">
                    {{ formatINR(deductionSummary.totalDeductions) }}
                  </span>
                </div>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>
      </v-window-item>

      <!-- Advance Tax Tab -->
      <v-window-item value="advance-tax">
        <v-row>
          <v-col cols="12">
            <v-card :loading="advanceTaxLoading">
              <v-card-title>
                <v-icon class="mr-2">mdi-calendar-clock</v-icon>
                Advance Tax Schedule - FY {{ selectedFinancialYear }}
              </v-card-title>
              <v-card-text v-if="advanceTax">
                <!-- Summary Cards -->
                <v-row class="mb-4">
                  <v-col cols="12" sm="6" md="3">
                    <v-card variant="outlined">
                      <v-card-text class="text-center">
                        <div class="text-caption text-medium-emphasis">
                          Estimated Tax
                        </div>
                        <div class="text-h6 text-currency">
                          {{ formatINR(advanceTax.estimatedTax) }}
                        </div>
                      </v-card-text>
                    </v-card>
                  </v-col>
                  <v-col cols="12" sm="6" md="3">
                    <v-card variant="outlined">
                      <v-card-text class="text-center">
                        <div class="text-caption text-medium-emphasis">
                          TDS Deducted
                        </div>
                        <div class="text-h6 text-currency text-positive">
                          {{ formatINR(advanceTax.tdsDeducted) }}
                        </div>
                      </v-card-text>
                    </v-card>
                  </v-col>
                  <v-col cols="12" sm="6" md="3">
                    <v-card variant="outlined">
                      <v-card-text class="text-center">
                        <div class="text-caption text-medium-emphasis">
                          Advance Tax Paid
                        </div>
                        <div class="text-h6 text-currency text-positive">
                          {{ formatINR(advanceTax.totalPaid) }}
                        </div>
                      </v-card-text>
                    </v-card>
                  </v-col>
                  <v-col cols="12" sm="6" md="3">
                    <v-card variant="outlined">
                      <v-card-text class="text-center">
                        <div class="text-caption text-medium-emphasis">
                          Remaining
                        </div>
                        <div class="text-h6 text-currency text-error">
                          {{ formatINR(advanceTax.remaining) }}
                        </div>
                      </v-card-text>
                    </v-card>
                  </v-col>
                </v-row>

                <!-- Schedule Table -->
                <v-table>
                  <thead>
                    <tr>
                      <th>Quarter</th>
                      <th>Due Date</th>
                      <th class="text-center">Cumulative %</th>
                      <th class="text-end">Amount Due</th>
                      <th class="text-end">Paid</th>
                      <th class="text-end">Shortfall</th>
                      <th class="text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr
                      v-for="schedule in advanceTaxSchedule"
                      :key="schedule.quarter"
                    >
                      <td>{{ schedule.quarterName }}</td>
                      <td>
                        {{
                          new Date(schedule.dueDate).toLocaleDateString(
                            "en-IN",
                            { day: "numeric", month: "short" },
                          )
                        }}
                      </td>
                      <td class="text-center">
                        {{ schedule.cumulativePercentage }}%
                      </td>
                      <td class="text-end text-currency">
                        {{ formatINR(schedule.cumulativeAmountDue) }}
                      </td>
                      <td class="text-end text-currency text-positive">
                        {{ formatINR(schedule.amountPaid) }}
                      </td>
                      <td class="text-end text-currency text-negative">
                        {{ formatINR(schedule.shortfall) }}
                      </td>
                      <td class="text-center">
                        <v-chip :color="schedule.statusColor" size="small">
                          {{ schedule.status }}
                        </v-chip>
                      </td>
                    </tr>
                  </tbody>
                </v-table>

                <!-- Interest Warning -->
                <v-alert
                  v-if="
                    advanceTax.interest234C > 0 || advanceTax.interest234B > 0
                  "
                  type="warning"
                  variant="tonal"
                  class="mt-4"
                >
                  <div class="d-flex justify-space-between">
                    <div>
                      <div class="text-body-2 font-weight-medium">
                        Interest Applicable
                      </div>
                      <div class="text-caption">
                        Interest u/s 234B:
                        {{ formatINR(advanceTax.interest234B) }} | Interest u/s
                        234C: {{ formatINR(advanceTax.interest234C) }}
                      </div>
                    </div>
                    <div class="text-end">
                      <div class="text-caption">Total Interest</div>
                      <div class="text-body-1 font-weight-bold">
                        {{
                          formatINR(
                            advanceTax.interest234B + advanceTax.interest234C,
                          )
                        }}
                      </div>
                    </div>
                  </div>
                </v-alert>
              </v-card-text>

              <v-card-text
                v-else-if="!advanceTaxLoading"
                class="text-center py-8"
              >
                <v-icon
                  icon="mdi-calendar-clock"
                  size="64"
                  color="grey-lighten-1"
                />
                <div class="text-body-1 text-medium-emphasis mt-4">
                  Advance tax is not applicable
                </div>
                <div class="text-caption text-medium-emphasis">
                  Advance tax is required if net tax liability exceeds ₹10,000
                </div>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>
      </v-window-item>
    </v-window>

    <!-- ITR Form Reference -->
    <v-row class="mt-6">
      <v-col cols="12">
        <v-card variant="outlined">
          <v-card-title class="text-subtitle-1">
            <v-icon class="mr-2">mdi-file-document-multiple</v-icon>
            ITR Form Reference
          </v-card-title>
          <v-card-text>
            <v-row>
              <v-col
                v-for="(form, key) in ITR_FORMS"
                :key="key"
                cols="12"
                sm="6"
                md="3"
              >
                <v-card variant="tonal" class="h-100">
                  <v-card-text>
                    <div class="d-flex align-center mb-2">
                      <v-chip color="primary" size="small">{{ key }}</v-chip>
                      <span class="text-caption ml-2">{{ form.name }}</span>
                    </div>
                    <div class="text-body-2 mb-2">{{ form.description }}</div>
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
      </v-col>
    </v-row>
  </div>
</template>

<style scoped>
.chart-container {
  height: 300px;
  position: relative;
}
</style>
