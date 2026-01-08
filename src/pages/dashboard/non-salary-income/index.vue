<script setup lang="ts">
import { computed, ref } from "vue";
import SectionHeader from "@/components/shared/SectionHeader.vue";
import FamilyToggle from "@/components/shared/FamilyToggle.vue";
import IncomeSourceCard from "@/components/income/IncomeSourceCard.vue";
import IncomeSummaryChart from "@/components/income/IncomeSummaryChart.vue";
import BusinessIncomeForm from "@/components/income/BusinessIncomeForm.vue";
import RentalIncomeForm from "@/components/income/RentalIncomeForm.vue";
import CapitalGainsCalculator from "@/components/income/CapitalGainsCalculator.vue";
import OtherIncomeForm from "@/components/income/OtherIncomeForm.vue";
import {
  useBusinessIncome,
  useRentalIncome,
  useCapitalGains,
  useOtherIncome,
  useIncomeSummary,
  useAddBusinessIncome,
  useAddRentalIncome,
  useAddCapitalGain,
  useAddOtherIncome,
  formatINR,
} from "@/composables/useIncome";
import { useFinancialYear } from "@/composables/useSalary";
import { getFinancialYearOptions } from "@/types/salary";
import type { IncomeType } from "@/types/income";

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

// Data queries
const { data: businessData, isLoading: businessLoading } = useBusinessIncome();
const { data: rentalData, isLoading: rentalLoading } = useRentalIncome();
const { data: capitalGainsData, isLoading: cgLoading } = useCapitalGains();
const { data: otherData, isLoading: otherLoading } = useOtherIncome();
const { summary, isLoading: summaryLoading } = useIncomeSummary();

// Mutations
const addBusinessMutation = useAddBusinessIncome();
const addRentalMutation = useAddRentalIncome();
const addCapitalGainMutation = useAddCapitalGain();
const addOtherMutation = useAddOtherIncome();

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
const otherTotal = computed(
  () => otherData.value?.reduce((sum, o) => sum + o.grossAmount, 0) || 0,
);

const isLoading = computed(
  () =>
    businessLoading.value ||
    rentalLoading.value ||
    cgLoading.value ||
    otherLoading.value,
);

// Add income dialog
const showAddDialog = ref(false);
const selectedIncomeType = ref<IncomeType | null>(null);
const showBusinessForm = ref(false);
const showRentalForm = ref(false);
const showCapitalGainsForm = ref(false);
const showOtherForm = ref(false);

const incomeTypes = [
  {
    type: "business",
    title: "Business/Profession",
    subtitle: "44AD/44ADA",
    icon: "mdi-store",
    color: "primary",
  },
  {
    type: "rental",
    title: "Rental Income",
    subtitle: "House Property",
    icon: "mdi-home-city",
    color: "secondary",
  },
  {
    type: "capital_gains",
    title: "Capital Gains",
    subtitle: "STCG/LTCG",
    icon: "mdi-trending-up",
    color: "success",
  },
  {
    type: "interest",
    title: "Interest Income",
    subtitle: "FD/Savings/P2P",
    icon: "mdi-percent",
    color: "info",
  },
  {
    type: "dividend",
    title: "Dividend Income",
    subtitle: "Stocks/MF",
    icon: "mdi-cash-multiple",
    color: "warning",
  },
  {
    type: "other",
    title: "Other Sources",
    subtitle: "Commission/Gifts",
    icon: "mdi-dots-horizontal",
    color: "grey",
  },
];

function openAddDialog() {
  selectedIncomeType.value = null;
  showAddDialog.value = true;
}

function selectIncomeType(type: IncomeType) {
  showAddDialog.value = false;
  selectedIncomeType.value = type;

  switch (type) {
    case "business":
      showBusinessForm.value = true;
      break;
    case "rental":
      showRentalForm.value = true;
      break;
    case "capital_gains":
      showCapitalGainsForm.value = true;
      break;
    case "interest":
    case "dividend":
    case "other":
      showOtherForm.value = true;
      break;
  }
}

async function handleBusinessSubmit(
  data: Parameters<typeof addBusinessMutation.mutateAsync>[0],
) {
  await addBusinessMutation.mutateAsync(data);
}

async function handleRentalSubmit(
  data: Parameters<typeof addRentalMutation.mutateAsync>[0],
) {
  await addRentalMutation.mutateAsync(data);
}

async function handleCapitalGainSubmit(
  data: Parameters<typeof addCapitalGainMutation.mutateAsync>[0],
) {
  await addCapitalGainMutation.mutateAsync(data);
}

async function handleOtherSubmit(
  data: Parameters<typeof addOtherMutation.mutateAsync>[0],
) {
  await addOtherMutation.mutateAsync(data);
}
</script>

<template>
  <div>
    <SectionHeader
      title="Non-Salary Income"
      subtitle="Track all your income sources beyond salary"
      icon="mdi-cash-plus"
      :tabs="tabs"
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
      <v-col cols="12" sm="6" md="4">
        <FamilyToggle />
      </v-col>
      <v-col cols="12" md="4" class="text-md-right">
        <v-btn color="primary" prepend-icon="mdi-plus" @click="openAddDialog">
          Add Income Source
        </v-btn>
      </v-col>
    </v-row>

    <!-- Summary Cards -->
    <v-row>
      <v-col cols="12" md="6" lg="3">
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
          href="/dashboard/non-salary-income/business"
        />
      </v-col>
      <v-col cols="12" md="6" lg="3">
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
          href="/dashboard/non-salary-income/rental"
        />
      </v-col>
      <v-col cols="12" md="6" lg="3">
        <IncomeSourceCard
          type="capital_gains"
          title="Capital Gains"
          subtitle="STCG + LTCG"
          :amount="capitalGainsTotal"
          :count="capitalGainsData?.length || 0"
          :loading="cgLoading"
          href="/dashboard/non-salary-income/capital-gains"
        />
      </v-col>
      <v-col cols="12" md="6" lg="3">
        <IncomeSourceCard
          type="other"
          title="Other Sources"
          subtitle="Interest, Dividends, etc."
          :amount="otherTotal"
          :count="otherData?.length || 0"
          :loading="otherLoading"
          href="/dashboard/non-salary-income/other"
        />
      </v-col>
    </v-row>

    <!-- Total Summary Card -->
    <v-row class="mt-2">
      <v-col cols="12">
        <v-card color="primary" variant="flat">
          <v-card-text class="d-flex justify-space-between align-center">
            <div>
              <div class="text-body-2 text-white-secondary">
                Total Non-Salary Income ({{ selectedFinancialYear }})
              </div>
              <div class="text-caption text-white-secondary">
                {{
                  (businessData?.length || 0) +
                  (rentalData?.length || 0) +
                  (capitalGainsData?.length || 0) +
                  (otherData?.length || 0)
                }}
                sources
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
            Quick Actions
          </v-card-title>
          <v-card-text>
            <v-list>
              <v-list-item
                prepend-icon="mdi-store"
                title="Add Business Income"
                subtitle="44AD/44ADA presumptive taxation"
                @click="selectIncomeType('business')"
              >
                <template #append>
                  <v-icon icon="mdi-chevron-right" />
                </template>
              </v-list-item>

              <v-list-item
                prepend-icon="mdi-home-city"
                title="Add Rental Income"
                subtitle="House property with Section 24"
                @click="selectIncomeType('rental')"
              >
                <template #append>
                  <v-icon icon="mdi-chevron-right" />
                </template>
              </v-list-item>

              <v-list-item
                prepend-icon="mdi-trending-up"
                title="Add Capital Gains"
                subtitle="STCG/LTCG calculator"
                @click="selectIncomeType('capital_gains')"
              >
                <template #append>
                  <v-icon icon="mdi-chevron-right" />
                </template>
              </v-list-item>

              <v-list-item
                prepend-icon="mdi-percent"
                title="Add Interest/Dividend"
                subtitle="FD, Savings, Stock dividends"
                @click="selectIncomeType('interest')"
              >
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

    <!-- Add Income Type Dialog -->
    <v-dialog v-model="showAddDialog" max-width="500">
      <v-card>
        <v-card-title>Add Income Source</v-card-title>
        <v-card-text>
          <v-list>
            <v-list-item
              v-for="item in incomeTypes"
              :key="item.type"
              :prepend-icon="item.icon"
              :title="item.title"
              :subtitle="item.subtitle"
              @click="selectIncomeType(item.type as IncomeType)"
            >
              <template #prepend>
                <v-avatar :color="item.color" size="40">
                  <v-icon :icon="item.icon" color="white" />
                </v-avatar>
              </template>
              <template #append>
                <v-icon icon="mdi-chevron-right" />
              </template>
            </v-list-item>
          </v-list>
        </v-card-text>
        <v-card-actions>
          <v-btn variant="text" @click="showAddDialog = false">Cancel</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Form Dialogs -->
    <BusinessIncomeForm
      v-model="showBusinessForm"
      @submit="handleBusinessSubmit"
    />

    <RentalIncomeForm v-model="showRentalForm" @submit="handleRentalSubmit" />

    <CapitalGainsCalculator
      v-model="showCapitalGainsForm"
      @submit="handleCapitalGainSubmit"
    />

    <OtherIncomeForm
      v-model="showOtherForm"
      :default-category="
        selectedIncomeType === 'dividend'
          ? 'dividend'
          : selectedIncomeType === 'interest'
            ? 'interest'
            : 'other'
      "
      @submit="handleOtherSubmit"
    />
  </div>
</template>

<style scoped>
.text-white-secondary {
  color: rgba(255, 255, 255, 0.7);
}
</style>
