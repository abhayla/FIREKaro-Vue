<script setup lang="ts">
import { ref, computed } from "vue";
import SectionHeader from "@/components/shared/SectionHeader.vue";
import IncomeSummaryChart from "@/components/income/IncomeSummaryChart.vue";
import {
  useIncomeSummary,
  useBusinessIncome,
  useRentalIncome,
  useCapitalGains,
  useOtherIncome,
  formatINR,
  formatINRLakhs,
} from "@/composables/useIncome";
import { useFinancialYear } from "@/composables/useSalary";
import { getFinancialYearOptions } from "@/types/salary";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

const tabs = [
  { title: "Overview", route: "/dashboard/non-salary-income" },
  { title: "Business", route: "/dashboard/non-salary-income/business" },
  { title: "Rental", route: "/dashboard/non-salary-income/rental" },
  { title: "Capital Gains", route: "/dashboard/non-salary-income/capital-gains" },
  { title: "Interest", route: "/dashboard/non-salary-income/interest" },
  { title: "Dividends", route: "/dashboard/non-salary-income/dividends" },
  { title: "Other", route: "/dashboard/non-salary-income/other" },
  { title: "Reports", route: "/dashboard/non-salary-income/reports" },
];

// Financial Year
const { selectedFinancialYear, setFinancialYear } = useFinancialYear();
const fyOptions = computed(() => getFinancialYearOptions());

// Data
const { summary, isLoading: summaryLoading } = useIncomeSummary();
const { data: businessData } = useBusinessIncome();
const { data: rentalData } = useRentalIncome();
const { data: capitalGainsData } = useCapitalGains();
const { data: otherData } = useOtherIncome();

// Detailed breakdown
const breakdownItems = computed(() => {
  const items = [];

  // Business Income
  if (businessData.value?.length) {
    for (const business of businessData.value) {
      items.push({
        category: "Business",
        description: `${business.businessName} (${business.taxationMethod})`,
        grossAmount: business.grossReceipts,
        deductions: business.grossReceipts - business.deemedProfit,
        taxableAmount: business.deemedProfit,
        icon: "mdi-store",
        color: "primary",
      });
    }
  }

  // Rental Income
  if (rentalData.value?.length) {
    for (const rental of rentalData.value) {
      items.push({
        category: "Rental",
        description: `${rental.propertyName} (${rental.propertyType})`,
        grossAmount: rental.annualRent,
        deductions: rental.standardDeduction + rental.housingLoanInterest,
        taxableAmount: rental.netAnnualValue,
        icon: "mdi-home-city",
        color: "secondary",
      });
    }
  }

  // Capital Gains
  if (capitalGainsData.value?.length) {
    for (const cg of capitalGainsData.value) {
      items.push({
        category: "Capital Gains",
        description: `${cg.assetName} (${cg.gainType})`,
        grossAmount: cg.grossGain,
        deductions: cg.grossGain - cg.taxableGain,
        taxableAmount: cg.taxableGain,
        icon: "mdi-trending-up",
        color: "success",
      });
    }
  }

  // Other Income
  if (otherData.value?.length) {
    for (const other of otherData.value) {
      items.push({
        category: getCategoryLabel(other.category),
        description: other.description,
        grossAmount: other.grossAmount,
        deductions: other.tdsDeducted,
        taxableAmount: other.grossAmount,
        icon: getCategoryIcon(other.category),
        color: getCategoryColor(other.category),
      });
    }
  }

  return items;
});

const totalGross = computed(() =>
  breakdownItems.value.reduce((sum, item) => sum + item.grossAmount, 0),
);
const totalDeductions = computed(() =>
  breakdownItems.value.reduce((sum, item) => sum + item.deductions, 0),
);
const totalTaxable = computed(() =>
  breakdownItems.value.reduce((sum, item) => sum + item.taxableAmount, 0),
);

function getCategoryLabel(category: string) {
  switch (category) {
    case "interest":
      return "Interest";
    case "dividend":
      return "Dividend";
    case "commission":
      return "Commission";
    case "royalty":
      return "Royalty";
    case "pension":
      return "Pension";
    case "gift":
      return "Gift";
    case "agricultural":
      return "Agricultural";
    default:
      return "Other";
  }
}

function getCategoryColor(category: string) {
  switch (category) {
    case "interest":
      return "info";
    case "dividend":
      return "warning";
    case "commission":
      return "primary";
    case "royalty":
      return "purple";
    case "pension":
      return "secondary";
    case "gift":
      return "pink";
    case "agricultural":
      return "success";
    default:
      return "grey";
  }
}

function getCategoryIcon(category: string) {
  switch (category) {
    case "interest":
      return "mdi-percent";
    case "dividend":
      return "mdi-cash-multiple";
    case "commission":
      return "mdi-handshake";
    case "royalty":
      return "mdi-crown";
    case "pension":
      return "mdi-account-clock";
    case "gift":
      return "mdi-gift";
    case "agricultural":
      return "mdi-sprout";
    default:
      return "mdi-dots-horizontal";
  }
}

// Export state
const isExportingPdf = ref(false);
const isExportingExcel = ref(false);

// Format currency for exports (plain number)
function formatCurrencyPlain(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

// PDF Export
async function exportToPDF() {
  isExportingPdf.value = true;

  try {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    // Title
    doc.setFontSize(20);
    doc.setTextColor(33, 150, 243); // Primary color
    doc.text("FIREKaro - Non-Salary Income Report", pageWidth / 2, 20, { align: "center" });

    // Subtitle
    doc.setFontSize(12);
    doc.setTextColor(100);
    doc.text(`Financial Year: ${selectedFinancialYear.value}`, pageWidth / 2, 28, { align: "center" });
    doc.text(`Generated on: ${new Date().toLocaleDateString("en-IN")}`, pageWidth / 2, 34, { align: "center" });

    // Summary Section
    doc.setFontSize(14);
    doc.setTextColor(0);
    doc.text("Summary", 14, 48);

    autoTable(doc, {
      startY: 52,
      head: [["Category", "Amount"]],
      body: [
        ["Total Gross Income", formatCurrencyPlain(totalGross.value)],
        ["Total Deductions", formatCurrencyPlain(totalDeductions.value)],
        ["Net Taxable Income", formatCurrencyPlain(totalTaxable.value)],
      ],
      theme: "grid",
      headStyles: { fillColor: [33, 150, 243] },
      styles: { fontSize: 10 },
    });

    // Income Breakdown
    const finalY = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY || 80;
    doc.setFontSize(14);
    doc.text("Detailed Income Breakdown", 14, finalY + 15);

    autoTable(doc, {
      startY: finalY + 20,
      head: [["Category", "Description", "Gross Amount", "Deductions", "Taxable Amount"]],
      body: breakdownItems.value.map((item) => [
        item.category,
        item.description,
        formatCurrencyPlain(item.grossAmount),
        item.deductions > 0 ? `-${formatCurrencyPlain(item.deductions)}` : "-",
        formatCurrencyPlain(item.taxableAmount),
      ]),
      theme: "striped",
      headStyles: { fillColor: [33, 150, 243] },
      styles: { fontSize: 9 },
      columnStyles: {
        2: { halign: "right" },
        3: { halign: "right" },
        4: { halign: "right" },
      },
    });

    // Footer
    const pageHeight = doc.internal.pageSize.getHeight();
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text("Generated by FIREKaro - Your FIRE Journey Partner", pageWidth / 2, pageHeight - 10, { align: "center" });

    // Save
    doc.save(`FIREKaro_Income_Report_${selectedFinancialYear.value}.pdf`);
  } catch (error) {
    console.error("PDF export error:", error);
  } finally {
    isExportingPdf.value = false;
  }
}

// Excel Export
async function exportToExcel() {
  isExportingExcel.value = true;

  try {
    const wb = XLSX.utils.book_new();

    // Summary Sheet
    const summaryData = [
      ["FIREKaro - Non-Salary Income Report"],
      [`Financial Year: ${selectedFinancialYear.value}`],
      [`Generated on: ${new Date().toLocaleDateString("en-IN")}`],
      [],
      ["Summary"],
      ["Category", "Amount"],
      ["Total Gross Income", totalGross.value],
      ["Total Deductions", totalDeductions.value],
      ["Net Taxable Income", totalTaxable.value],
    ];
    const summaryWs = XLSX.utils.aoa_to_sheet(summaryData);
    summaryWs["!cols"] = [{ wch: 25 }, { wch: 20 }];
    XLSX.utils.book_append_sheet(wb, summaryWs, "Summary");

    // Detailed Breakdown Sheet
    const breakdownData = [
      ["Category", "Description", "Gross Amount", "Deductions", "Taxable Amount"],
      ...breakdownItems.value.map((item) => [
        item.category,
        item.description,
        item.grossAmount,
        item.deductions > 0 ? -item.deductions : 0,
        item.taxableAmount,
      ]),
      [],
      ["TOTAL", "", totalGross.value, -totalDeductions.value, totalTaxable.value],
    ];
    const breakdownWs = XLSX.utils.aoa_to_sheet(breakdownData);
    breakdownWs["!cols"] = [
      { wch: 15 },
      { wch: 35 },
      { wch: 15 },
      { wch: 15 },
      { wch: 15 },
    ];
    XLSX.utils.book_append_sheet(wb, breakdownWs, "Detailed Breakdown");

    // Business Income Sheet (if exists)
    if (businessData.value?.length) {
      const businessSheetData = [
        ["Business/Profession Income"],
        [],
        ["Business Name", "Type", "Taxation Method", "Gross Receipts", "Deemed Profit"],
        ...businessData.value.map((b) => [
          b.businessName,
          b.businessType,
          b.taxationMethod,
          b.grossReceipts,
          b.deemedProfit,
        ]),
      ];
      const businessWs = XLSX.utils.aoa_to_sheet(businessSheetData);
      XLSX.utils.book_append_sheet(wb, businessWs, "Business Income");
    }

    // Rental Income Sheet (if exists)
    if (rentalData.value?.length) {
      const rentalSheetData = [
        ["Rental Income"],
        [],
        ["Property Name", "Type", "Annual Rent", "Std Deduction", "Loan Interest", "Net Income"],
        ...rentalData.value.map((r) => [
          r.propertyName,
          r.propertyType,
          r.annualRent,
          r.standardDeduction,
          r.housingLoanInterest,
          r.netAnnualValue,
        ]),
      ];
      const rentalWs = XLSX.utils.aoa_to_sheet(rentalSheetData);
      XLSX.utils.book_append_sheet(wb, rentalWs, "Rental Income");
    }

    // Capital Gains Sheet (if exists)
    if (capitalGainsData.value?.length) {
      const cgSheetData = [
        ["Capital Gains"],
        [],
        ["Asset Name", "Type", "Gain Type", "Purchase Price", "Sale Price", "Taxable Gain", "Tax"],
        ...capitalGainsData.value.map((cg) => [
          cg.assetName,
          cg.assetType,
          cg.gainType,
          cg.purchasePrice,
          cg.salePrice,
          cg.taxableGain,
          cg.estimatedTax,
        ]),
      ];
      const cgWs = XLSX.utils.aoa_to_sheet(cgSheetData);
      XLSX.utils.book_append_sheet(wb, cgWs, "Capital Gains");
    }

    // Save
    XLSX.writeFile(wb, `FIREKaro_Income_Report_${selectedFinancialYear.value}.xlsx`);
  } catch (error) {
    console.error("Excel export error:", error);
  } finally {
    isExportingExcel.value = false;
  }
}

// Trend data for chart (monthly breakdown - mock for now)
const monthlyTrendData = computed(() => {
  // In production, this would aggregate actual data by month
  // For now, we'll show category-wise distribution
  return [
    { month: "Apr", business: 0, rental: 0, capitalGains: 0, interest: 0, other: 0 },
    { month: "May", business: 0, rental: 0, capitalGains: 0, interest: 0, other: 0 },
    { month: "Jun", business: 0, rental: 0, capitalGains: 0, interest: 0, other: 0 },
    { month: "Jul", business: 0, rental: 0, capitalGains: 0, interest: 0, other: 0 },
    { month: "Aug", business: 0, rental: 0, capitalGains: 0, interest: 0, other: 0 },
    { month: "Sep", business: 0, rental: 0, capitalGains: 0, interest: 0, other: 0 },
    { month: "Oct", business: 0, rental: 0, capitalGains: 0, interest: 0, other: 0 },
    { month: "Nov", business: 0, rental: 0, capitalGains: 0, interest: 0, other: 0 },
    { month: "Dec", business: 0, rental: 0, capitalGains: 0, interest: 0, other: 0 },
    { month: "Jan", business: 0, rental: 0, capitalGains: 0, interest: 0, other: 0 },
    { month: "Feb", business: 0, rental: 0, capitalGains: 0, interest: 0, other: 0 },
    { month: "Mar", business: 0, rental: 0, capitalGains: 0, interest: 0, other: 0 },
  ];
});

// Year-over-year comparison
const yoyComparisonData = computed(() => {
  const currentFY = selectedFinancialYear.value;
  const currentTotal = totalTaxable.value;

  // Mock previous year data - in production, this would fetch from API
  const prevYearTotal = currentTotal * 0.85; // Assume 15% growth

  return {
    currentYear: currentFY,
    currentTotal,
    previousYear: getPreviousFY(currentFY),
    previousTotal: prevYearTotal,
    growth: currentTotal > 0 ? ((currentTotal - prevYearTotal) / prevYearTotal) * 100 : 0,
  };
});

function getPreviousFY(fy: string): string {
  const [start] = fy.split("-").map(Number);
  return `${start - 1}-${(start).toString().slice(2)}`;
}
</script>

<template>
  <div>
    <SectionHeader
      title="Non-Salary Income"
      subtitle="Income Reports & Analytics"
      icon="mdi-cash-plus"
      :tabs="tabs"
    />

    <!-- Controls -->
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
      <v-col cols="12" sm="6" md="8" class="text-sm-right">
        <v-btn
          variant="outlined"
          prepend-icon="mdi-file-pdf-box"
          class="mr-2"
          :loading="isExportingPdf"
          @click="exportToPDF"
        >
          Export PDF
        </v-btn>
        <v-btn
          variant="outlined"
          prepend-icon="mdi-microsoft-excel"
          color="success"
          :loading="isExportingExcel"
          @click="exportToExcel"
        >
          Export Excel
        </v-btn>
      </v-col>
    </v-row>

    <!-- Summary Cards -->
    <v-row class="mb-4">
      <v-col cols="12" md="4">
        <v-card color="info" variant="flat">
          <v-card-text class="text-white">
            <div class="text-body-2 opacity-80">Total Gross Income</div>
            <div class="text-h4 text-currency font-weight-bold">
              {{ formatINRLakhs(totalGross) }}
            </div>
            <div class="text-caption opacity-60">
              {{ breakdownItems.length }} sources
            </div>
          </v-card-text>
        </v-card>
      </v-col>
      <v-col cols="12" md="4">
        <v-card color="warning" variant="flat">
          <v-card-text class="text-white">
            <div class="text-body-2 opacity-80">Total Deductions</div>
            <div class="text-h4 text-currency font-weight-bold">
              {{ formatINRLakhs(totalDeductions) }}
            </div>
            <div class="text-caption opacity-60">
              Section 24, Exemptions, etc.
            </div>
          </v-card-text>
        </v-card>
      </v-col>
      <v-col cols="12" md="4">
        <v-card color="success" variant="flat">
          <v-card-text class="text-white">
            <div class="text-body-2 opacity-80">Total Taxable Income</div>
            <div class="text-h4 text-currency font-weight-bold">
              {{ formatINRLakhs(totalTaxable) }}
            </div>
            <div class="text-caption opacity-60">
              {{ selectedFinancialYear }}
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Year-over-Year Comparison -->
    <v-row class="mb-4">
      <v-col cols="12">
        <v-card variant="outlined">
          <v-card-title class="text-body-1">
            <v-icon class="mr-2" color="info">mdi-chart-line</v-icon>
            Year-over-Year Comparison
          </v-card-title>
          <v-card-text>
            <v-row align="center">
              <v-col cols="12" sm="4" class="text-center">
                <div class="text-caption text-medium-emphasis">
                  {{ yoyComparisonData.previousYear }}
                </div>
                <div class="text-h5 text-currency">
                  {{ formatINRLakhs(yoyComparisonData.previousTotal) }}
                </div>
              </v-col>
              <v-col cols="12" sm="4" class="text-center">
                <v-chip
                  :color="yoyComparisonData.growth >= 0 ? 'success' : 'error'"
                  size="large"
                  variant="elevated"
                >
                  <v-icon start>
                    {{ yoyComparisonData.growth >= 0 ? 'mdi-trending-up' : 'mdi-trending-down' }}
                  </v-icon>
                  {{ yoyComparisonData.growth >= 0 ? '+' : '' }}{{ yoyComparisonData.growth.toFixed(1) }}%
                </v-chip>
                <div class="text-caption text-medium-emphasis mt-1">
                  {{ yoyComparisonData.growth >= 0 ? 'Income Growth' : 'Income Decline' }}
                </div>
              </v-col>
              <v-col cols="12" sm="4" class="text-center">
                <div class="text-caption text-medium-emphasis">
                  {{ yoyComparisonData.currentYear }}
                </div>
                <div class="text-h5 text-currency text-primary font-weight-bold">
                  {{ formatINRLakhs(yoyComparisonData.currentTotal) }}
                </div>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Chart & Summary -->
    <v-row>
      <v-col cols="12" md="6">
        <IncomeSummaryChart :summary="summary" :loading="summaryLoading" />
      </v-col>

      <v-col cols="12" md="6">
        <v-card>
          <v-card-title>
            <v-icon class="mr-2">mdi-chart-bar</v-icon>
            Income by Category
          </v-card-title>
          <v-card-text>
            <v-list density="compact">
              <v-list-item v-if="summary?.businessIncome">
                <template #prepend>
                  <v-avatar color="primary" size="32">
                    <v-icon icon="mdi-store" size="small" />
                  </v-avatar>
                </template>
                <v-list-item-title>Business/Profession</v-list-item-title>
                <template #append>
                  <span class="text-currency">{{
                    formatINR(summary.businessIncome)
                  }}</span>
                </template>
              </v-list-item>

              <v-list-item v-if="summary?.rentalIncome">
                <template #prepend>
                  <v-avatar color="secondary" size="32">
                    <v-icon icon="mdi-home-city" size="small" />
                  </v-avatar>
                </template>
                <v-list-item-title>Rental Income</v-list-item-title>
                <template #append>
                  <span class="text-currency">{{
                    formatINR(summary.rentalIncome)
                  }}</span>
                </template>
              </v-list-item>

              <v-list-item v-if="summary?.capitalGains">
                <template #prepend>
                  <v-avatar color="success" size="32">
                    <v-icon icon="mdi-trending-up" size="small" />
                  </v-avatar>
                </template>
                <v-list-item-title>Capital Gains</v-list-item-title>
                <template #append>
                  <span class="text-currency">{{
                    formatINR(summary.capitalGains)
                  }}</span>
                </template>
              </v-list-item>

              <v-list-item v-if="summary?.interestIncome">
                <template #prepend>
                  <v-avatar color="info" size="32">
                    <v-icon icon="mdi-percent" size="small" />
                  </v-avatar>
                </template>
                <v-list-item-title>Interest Income</v-list-item-title>
                <template #append>
                  <span class="text-currency">{{
                    formatINR(summary.interestIncome)
                  }}</span>
                </template>
              </v-list-item>

              <v-list-item v-if="summary?.dividendIncome">
                <template #prepend>
                  <v-avatar color="warning" size="32">
                    <v-icon icon="mdi-cash-multiple" size="small" />
                  </v-avatar>
                </template>
                <v-list-item-title>Dividend Income</v-list-item-title>
                <template #append>
                  <span class="text-currency">{{
                    formatINR(summary.dividendIncome)
                  }}</span>
                </template>
              </v-list-item>

              <v-list-item v-if="summary?.otherIncome">
                <template #prepend>
                  <v-avatar color="grey" size="32">
                    <v-icon icon="mdi-dots-horizontal" size="small" />
                  </v-avatar>
                </template>
                <v-list-item-title>Other Income</v-list-item-title>
                <template #append>
                  <span class="text-currency">{{
                    formatINR(summary.otherIncome)
                  }}</span>
                </template>
              </v-list-item>

              <v-divider class="my-2" />

              <v-list-item>
                <template #prepend>
                  <v-avatar color="primary" size="32">
                    <v-icon icon="mdi-sigma" size="small" />
                  </v-avatar>
                </template>
                <v-list-item-title class="font-weight-bold"
                  >Total</v-list-item-title
                >
                <template #append>
                  <span class="text-currency text-h6 font-weight-bold">
                    {{ formatINR(summary?.totalGrossIncome || 0) }}
                  </span>
                </template>
              </v-list-item>
            </v-list>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Detailed Breakdown -->
    <v-card class="mt-6">
      <v-card-title>
        <v-icon class="mr-2">mdi-format-list-bulleted</v-icon>
        Detailed Income Breakdown
      </v-card-title>

      <v-data-table
        :headers="[
          { title: 'Category', key: 'category' },
          { title: 'Description', key: 'description' },
          { title: 'Gross Amount', key: 'grossAmount', align: 'end' },
          { title: 'Deductions', key: 'deductions', align: 'end' },
          { title: 'Taxable Amount', key: 'taxableAmount', align: 'end' },
        ]"
        :items="breakdownItems"
        :items-per-page="15"
        hover
      >
        <template #item.category="{ item }">
          <v-chip size="small" :color="item.color" variant="tonal">
            <v-icon start size="small" :icon="item.icon" />
            {{ item.category }}
          </v-chip>
        </template>

        <template #item.grossAmount="{ item }">
          <span class="text-currency">{{ formatINR(item.grossAmount) }}</span>
        </template>

        <template #item.deductions="{ item }">
          <span class="text-currency text-negative">
            {{ item.deductions > 0 ? `-${formatINR(item.deductions)}` : "-" }}
          </span>
        </template>

        <template #item.taxableAmount="{ item }">
          <span
            class="text-currency font-weight-medium"
            :class="item.taxableAmount >= 0 ? 'text-positive' : 'text-negative'"
          >
            {{ formatINR(item.taxableAmount) }}
          </span>
        </template>

        <template #bottom>
          <v-divider />
          <div class="d-flex justify-end pa-4 bg-grey-lighten-5">
            <div class="mr-8">
              <span class="text-body-2 text-medium-emphasis">Gross Total:</span>
              <span class="text-currency font-weight-bold ml-2">{{
                formatINR(totalGross)
              }}</span>
            </div>
            <div class="mr-8">
              <span class="text-body-2 text-medium-emphasis"
                >Total Deductions:</span
              >
              <span class="text-currency font-weight-bold text-negative ml-2">{{
                formatINR(totalDeductions)
              }}</span>
            </div>
            <div>
              <span class="text-body-2 text-medium-emphasis">Net Taxable:</span>
              <span class="text-currency font-weight-bold text-positive ml-2">{{
                formatINR(totalTaxable)
              }}</span>
            </div>
          </div>
        </template>

        <template #no-data>
          <div class="text-center py-8">
            <v-icon
              icon="mdi-file-document-outline"
              size="64"
              color="grey-lighten-1"
            />
            <div class="text-body-1 text-medium-emphasis mt-4">
              No income data available for reports
            </div>
            <v-btn
              color="primary"
              class="mt-4"
              to="/dashboard/non-salary-income"
            >
              Add Income Sources
            </v-btn>
          </div>
        </template>
      </v-data-table>
    </v-card>

    <!-- ITR Recommendation -->
    <v-card class="mt-6" variant="outlined">
      <v-card-title>
        <v-icon class="mr-2" color="primary">mdi-file-document-check</v-icon>
        ITR Form Recommendation
      </v-card-title>
      <v-card-text>
        <v-alert
          :type="summary?.businessCount ? 'info' : 'success'"
          variant="tonal"
        >
          <div class="text-body-2 font-weight-medium">
            {{
              summary?.businessCount
                ? "ITR-4 (Sugam) Recommended"
                : summary?.capitalGainTransactions
                  ? "ITR-2 Recommended"
                  : summary?.rentalCount && summary.rentalCount > 1
                    ? "ITR-2 Recommended"
                    : "ITR-1 (Sahaj) May Be Applicable"
            }}
          </div>
          <div class="text-caption mt-1">
            {{
              summary?.businessCount
                ? "You have business/professional income under presumptive taxation (44AD/44ADA)."
                : summary?.capitalGainTransactions
                  ? "You have capital gains which require ITR-2."
                  : summary?.rentalCount && summary.rentalCount > 1
                    ? "Multiple house properties require ITR-2."
                    : "Based on your income sources, you may be eligible for the simpler ITR-1 form."
            }}
          </div>
        </v-alert>
      </v-card-text>
    </v-card>
  </div>
</template>
