<script setup lang="ts">
import { ref, computed } from "vue";
import { useRouter } from "vue-router";
import SectionHeader from "@/components/shared/SectionHeader.vue";
import FinancialYearSelector from "@/components/shared/FinancialYearSelector.vue";
import TaxOverviewTab from "@/components/tax/TaxOverviewTab.vue";
import TaxDetailsTab from "@/components/tax/TaxDetailsTab.vue";
import { useFinancialYear } from "@/composables/useSalary";
import type { SmartSuggestionWithPriority } from "@/composables/useTax";

const router = useRouter();

// Tab state
const activeTab = ref("overview");
const detailsTabRef = ref<InstanceType<typeof TaxDetailsTab> | null>(null);

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

// Handle navigation to specific section in details tab
const handleGoToDetails = () => {
  activeTab.value = "details";
};

// Handle navigation from overview tab
const handleNavigateTo = (path: string) => {
  router.push(path);
};

// Handle apply suggestion - switch to details and open scenarios section
const handleApplySuggestion = (suggestion: SmartSuggestionWithPriority) => {
  activeTab.value = "details";
  // Wait for tab switch then open scenarios section
  setTimeout(() => {
    if (detailsTabRef.value) {
      detailsTabRef.value.openSection("scenarios");
    }
  }, 100);
};
</script>

<template>
  <div>
    <SectionHeader
      title="Tax Planning"
      subtitle="Optimize your taxes with regime comparison and smart suggestions"
      icon="mdi-calculator-variant"
    />

    <!-- Tab Navigation + FY Selector -->
    <div class="d-flex justify-space-between align-center flex-wrap gap-2 mb-4">
      <!-- Tabs -->
      <v-tabs v-model="activeTab" color="primary" density="compact">
        <v-tab value="overview">
          <v-icon start size="small">mdi-chart-box</v-icon>
          Overview
        </v-tab>
        <v-tab value="details">
          <v-icon start size="small">mdi-cog</v-icon>
          Tax Details
        </v-tab>
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
        <TaxOverviewTab
          :financial-year="selectedFinancialYear"
          @go-to-details="handleGoToDetails"
          @navigate-to="handleNavigateTo"
          @apply-suggestion="handleApplySuggestion"
        />
      </v-window-item>

      <!-- Tax Details Tab -->
      <v-window-item value="details">
        <TaxDetailsTab
          ref="detailsTabRef"
          :financial-year="selectedFinancialYear"
        />
      </v-window-item>
    </v-window>
  </div>
</template>
