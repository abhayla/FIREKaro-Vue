<script setup lang="ts">
import { computed } from "vue";
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

const tabs = [
  { title: "Overview", route: "/dashboard/non-salary-income" },
  { title: "Business", route: "/dashboard/non-salary-income/business" },
  { title: "Rental", route: "/dashboard/non-salary-income/rental" },
  {
    title: "Capital Gains",
    route: "/dashboard/non-salary-income/capital-gains",
  },
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
        <v-btn variant="outlined" prepend-icon="mdi-download" class="mr-2">
          Export PDF
        </v-btn>
        <v-btn variant="outlined" prepend-icon="mdi-microsoft-excel">
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
