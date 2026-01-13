<script setup lang="ts">
import { ref, computed } from "vue";
import SectionHeader from "@/components/shared/SectionHeader.vue";
import FinancialYearSelector from "@/components/shared/FinancialYearSelector.vue";
import PPFOverviewTab from "@/components/investments/tabs/PPFOverviewTab.vue";
import PPFDetailsTab from "@/components/investments/tabs/PPFDetailsTab.vue";
import { useFinancialYear } from "@/composables/useSalary";
import { formatINR } from "@/composables/useInvestments";

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
const showAddDepositDialog = ref(false);
const depositAmount = ref(0);

// PPF Config
const PPF_CONFIG = {
  MAX_DEPOSIT: 150000,
  MIN_DEPOSIT: 500,
};

// Handle add deposit from details tab
const handleAddDeposit = () => {
  depositAmount.value = 12500; // Default to monthly SIP amount
  showAddDepositDialog.value = true;
};

// Confirm deposit
const confirmDeposit = () => {
  // TODO: Call API to add deposit
  console.log("Adding deposit:", depositAmount.value);
  showAddDepositDialog.value = false;
  depositAmount.value = 0;
};
</script>

<template>
  <div>
    <SectionHeader
      title="Investments"
      subtitle="PPF (Public Provident Fund)"
      icon="mdi-bank"
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
        <PPFOverviewTab
          :financial-year="selectedFinancialYear"
          @go-to-details="activeTab = 'details'"
        />
      </v-window-item>

      <!-- Item Details Tab -->
      <v-window-item value="details">
        <PPFDetailsTab
          :financial-year="selectedFinancialYear"
          @add-deposit="handleAddDeposit"
        />
      </v-window-item>
    </v-window>

    <!-- Add Deposit Dialog -->
    <v-dialog v-model="showAddDepositDialog" max-width="400">
      <v-card>
        <v-card-title class="d-flex align-center">
          <v-icon icon="mdi-plus" class="mr-2" color="primary" />
          Add PPF Deposit
        </v-card-title>
        <v-card-text>
          <v-alert type="info" variant="tonal" density="compact" class="mb-4">
            FY {{ selectedFinancialYear }} limit: {{ formatINR(PPF_CONFIG.MAX_DEPOSIT) }}
          </v-alert>
          <v-text-field
            v-model.number="depositAmount"
            label="Deposit Amount"
            type="number"
            prefix="₹"
            variant="outlined"
            :min="PPF_CONFIG.MIN_DEPOSIT"
            :max="PPF_CONFIG.MAX_DEPOSIT"
            :rules="[
              (v) => v >= PPF_CONFIG.MIN_DEPOSIT || `Min ${formatINR(PPF_CONFIG.MIN_DEPOSIT)}`,
              (v) => v <= PPF_CONFIG.MAX_DEPOSIT || `Max ${formatINR(PPF_CONFIG.MAX_DEPOSIT)}`,
            ]"
            hint="Deposit before 5th of month to maximize interest"
            persistent-hint
          />
          <v-text-field
            label="Deposit Date"
            type="date"
            variant="outlined"
            class="mt-4"
            :model-value="new Date().toISOString().split('T')[0]"
          />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="showAddDepositDialog = false">Cancel</v-btn>
          <v-btn
            color="primary"
            variant="flat"
            :disabled="depositAmount < PPF_CONFIG.MIN_DEPOSIT || depositAmount > PPF_CONFIG.MAX_DEPOSIT"
            @click="confirmDeposit"
          >
            Add Deposit
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>
