<script setup lang="ts">
import { ref, computed } from "vue";
import SectionHeader from "@/components/shared/SectionHeader.vue";
import FinancialYearSelector from "@/components/shared/FinancialYearSelector.vue";
import SalaryOverviewTab from "@/components/salary/SalaryOverviewTab.vue";
import SalaryDetailsTab from "@/components/salary/SalaryDetailsTab.vue";
import AddEmployerDialog from "@/components/salary/AddEmployerDialog.vue";
import ManageEmployersDialog from "@/components/salary/ManageEmployersDialog.vue";
import SalaryComponentManager from "@/components/salary/SalaryComponentManager.vue";
import { useFinancialYear } from "@/composables/useSalary";
import { getCurrentFinancialYear } from "@/types/salary";

// Tab state
const activeTab = ref("overview");

// Financial year navigation
const { selectedFinancialYear, setFinancialYear, financialYearOptions } = useFinancialYear();

// Dialog states
const showAddEmployerDialog = ref(false);
const showQuickAddEmployerDialog = ref(false);
const showManageEmployersDialog = ref(false);
const showComponentManager = ref(false);

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

// Handle employer saved
const handleEmployerSaved = (employer: { id: string; name: string }) => {
  console.log("Employer saved:", employer);
  showAddEmployerDialog.value = false;
  showQuickAddEmployerDialog.value = false;
};

// Handle add employer from dropdown
const handleAddEmployerFromDropdown = () => {
  showQuickAddEmployerDialog.value = true;
};

// Handle export
const handleExport = () => {
  // TODO: Implement export
  console.log("Export to Excel");
};

// Handle import
const handleImport = () => {
  // TODO: Implement import
  console.log("Import from Excel");
};
</script>

<template>
  <div>
    <SectionHeader
      title="Salary"
      subtitle="Track your salary income and history"
      icon="mdi-cash-multiple"
    />

    <!-- Tab Navigation + FY Selector -->
    <div class="d-flex justify-space-between align-center mb-4">
      <!-- Tabs -->
      <v-tabs v-model="activeTab" color="primary" density="compact">
        <v-tab value="overview">Overview</v-tab>
        <v-tab value="details">Salary Details</v-tab>
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
        <SalaryOverviewTab
          :financial-year="selectedFinancialYear"
          @go-to-details="activeTab = 'details'"
        />
      </v-window-item>

      <!-- Salary Details Tab -->
      <v-window-item value="details">
        <SalaryDetailsTab
          :financial-year="selectedFinancialYear"
          @add-employer="showAddEmployerDialog = true"
          @manage-employers="showManageEmployersDialog = true"
          @manage-components="showComponentManager = true"
          @import-excel="handleImport"
          @export-excel="handleExport"
        />
      </v-window-item>
    </v-window>

    <!-- Add Employer Dialog (Full) -->
    <AddEmployerDialog
      v-model="showAddEmployerDialog"
      @saved="handleEmployerSaved"
    />

    <!-- Add Employer Dialog (Quick - from dropdown) -->
    <AddEmployerDialog
      v-model="showQuickAddEmployerDialog"
      :quick-mode="true"
      @saved="handleEmployerSaved"
    />

    <!-- Manage Employers Dialog -->
    <ManageEmployersDialog
      v-model="showManageEmployersDialog"
      @add-employer="showAddEmployerDialog = true"
    />

    <!-- Salary Component Manager Dialog -->
    <SalaryComponentManager v-model="showComponentManager" />
  </div>
</template>
