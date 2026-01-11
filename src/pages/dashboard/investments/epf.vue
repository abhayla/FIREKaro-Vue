<script setup lang="ts">
import { ref, computed } from "vue";
import SectionHeader from "@/components/shared/SectionHeader.vue";
import FinancialYearSelector from "@/components/shared/FinancialYearSelector.vue";
import EPFOverviewTab from "@/components/investments/tabs/EPFOverviewTab.vue";
import EPFDetailsTab from "@/components/investments/tabs/EPFDetailsTab.vue";
import { useFinancialYear } from "@/composables/useSalary";

// Navigation tabs for investments section
const tabs = [
  { title: "Portfolio", route: "/dashboard/investments" },
  { title: "Stocks", route: "/dashboard/investments/stocks" },
  { title: "Mutual Funds", route: "/dashboard/investments/mutual-funds" },
  { title: "EPF", route: "/dashboard/investments/epf" },
  { title: "PPF", route: "/dashboard/investments/ppf" },
  { title: "NPS", route: "/dashboard/investments/nps" },
  { title: "ESOPs", route: "/dashboard/investments/esop" },
  { title: "Property", route: "/dashboard/investments/property" },
  { title: "Reports", route: "/dashboard/investments/reports" },
];

// Tab state (client-side switching)
const activeTab = ref("overview");

// Financial year navigation
const { selectedFinancialYear, setFinancialYear, financialYearOptions } = useFinancialYear();

// Navigate to previous FY
const goToPreviousFY = () => {
  const currentIndex = financialYearOptions.indexOf(selectedFinancialYear.value);
  if (currentIndex < financialYearOptions.length - 1) {
    setFinancialYear(financialYearOptions[currentIndex + 1]);
  }
};

// Navigate to next FY
const goToNextFY = () => {
  const currentIndex = financialYearOptions.indexOf(selectedFinancialYear.value);
  if (currentIndex > 0) {
    setFinancialYear(financialYearOptions[currentIndex - 1]);
  }
};

// Check if can navigate
const canGoPrevious = computed(() => {
  const currentIndex = financialYearOptions.indexOf(selectedFinancialYear.value);
  return currentIndex < financialYearOptions.length - 1;
});

const canGoNext = computed(() => {
  const currentIndex = financialYearOptions.indexOf(selectedFinancialYear.value);
  return currentIndex > 0;
});

// Dialog states
const showUpdateBalanceDialog = ref(false);

// Handle update balance from details tab
const handleUpdateBalance = () => {
  showUpdateBalanceDialog.value = true;
};
</script>

<template>
  <div>
    <SectionHeader
      title="Investments"
      subtitle="EPF & VPF"
      icon="mdi-briefcase"
      :tabs="tabs"
    />

    <!-- Tab Navigation + FY Selector -->
    <div class="d-flex justify-space-between align-center mb-4 flex-wrap ga-2">
      <!-- Tabs -->
      <v-tabs v-model="activeTab" color="primary" density="compact">
        <v-tab value="overview">Overview</v-tab>
        <v-tab value="details">Item Details</v-tab>
      </v-tabs>

      <!-- FY Navigation -->
      <div class="d-flex align-center ga-2">
        <v-btn
          icon="mdi-chevron-left"
          variant="text"
          size="small"
          :disabled="!canGoPrevious"
          title="Previous Financial Year"
          @click="goToPreviousFY"
        />
        <FinancialYearSelector
          v-model="selectedFinancialYear"
          :dense="true"
          @update:model-value="setFinancialYear"
        />
        <v-btn
          icon="mdi-chevron-right"
          variant="text"
          size="small"
          :disabled="!canGoNext"
          title="Next Financial Year"
          @click="goToNextFY"
        />
      </div>
    </div>

    <!-- Tab Content -->
    <v-window v-model="activeTab">
      <!-- Overview Tab -->
      <v-window-item value="overview">
        <EPFOverviewTab
          :financial-year="selectedFinancialYear"
          @go-to-details="activeTab = 'details'"
        />
      </v-window-item>

      <!-- Item Details Tab -->
      <v-window-item value="details">
        <EPFDetailsTab
          :financial-year="selectedFinancialYear"
          @update-balance="handleUpdateBalance"
        />
      </v-window-item>
    </v-window>

    <!-- Update Balance Dialog -->
    <v-dialog v-model="showUpdateBalanceDialog" max-width="500">
      <v-card>
        <v-card-title class="d-flex align-center">
          <v-icon icon="mdi-refresh" class="mr-2" color="primary" />
          Sync EPF from Salary
        </v-card-title>
        <v-card-text>
          <v-alert type="info" variant="tonal" density="compact" class="mb-4">
            This will sync your EPF contributions from your salary history for FY {{ selectedFinancialYear }}.
          </v-alert>
          <p class="text-body-2 text-medium-emphasis">
            Employee PF, Employer PF, and VPF values will be updated based on your monthly salary entries.
            Make sure your salary data is up to date.
          </p>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="showUpdateBalanceDialog = false">Cancel</v-btn>
          <v-btn color="primary" variant="flat" @click="showUpdateBalanceDialog = false">
            Sync Now
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>
