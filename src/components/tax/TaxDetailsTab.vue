<script setup lang="ts">
import { ref, computed } from "vue";
import { getCurrentFinancialYear } from "@/types/salary";
import TaxCalculatorSection from "@/components/tax/TaxCalculatorSection.vue";
import DeductionsSection from "@/components/tax/DeductionsSection.vue";
import ScenariosSection from "@/components/tax/ScenariosSection.vue";
import AdvanceTaxSection from "@/components/tax/AdvanceTaxSection.vue";
import ReportsSection from "@/components/tax/ReportsSection.vue";

const props = withDefaults(
  defineProps<{
    financialYear: string;
    initialSection?: string;
  }>(),
  {
    financialYear: () => getCurrentFinancialYear(),
    initialSection: "calculator",
  }
);

// Accordion panels state - array for multiple open panels
const openPanels = ref<string[]>([props.initialSection]);

// Expand/Collapse all
const allExpanded = computed(() => openPanels.value.length === 5);

const toggleAll = () => {
  if (allExpanded.value) {
    openPanels.value = [];
  } else {
    openPanels.value = ["calculator", "deductions", "scenarios", "advance-tax", "reports"];
  }
};

// Section definitions
const sections = [
  {
    id: "calculator",
    title: "Tax Calculator",
    subtitle: "Old vs New Regime comparison and calculation",
    icon: "mdi-calculator-variant",
    color: "primary",
  },
  {
    id: "deductions",
    title: "Deductions",
    subtitle: "Manage 80C, 80D, NPS, and other deductions",
    icon: "mdi-minus-circle-multiple",
    color: "secondary",
  },
  {
    id: "scenarios",
    title: "What-If Scenarios",
    subtitle: "Create and compare tax optimization scenarios",
    icon: "mdi-compare",
    color: "info",
  },
  {
    id: "advance-tax",
    title: "Advance Tax",
    subtitle: "Track quarterly payments and interest calculations",
    icon: "mdi-calendar-clock",
    color: "warning",
  },
  {
    id: "reports",
    title: "Reports & Export",
    subtitle: "Tax summary, charts, and PDF/Excel export",
    icon: "mdi-file-document-multiple",
    color: "success",
  },
];

// Expose method to open a specific section
const openSection = (sectionId: string) => {
  if (!openPanels.value.includes(sectionId)) {
    openPanels.value.push(sectionId);
  }
};

defineExpose({ openSection });
</script>

<template>
  <div class="tax-details-tab">
    <!-- Header with Expand/Collapse All -->
    <div class="d-flex align-center justify-space-between mb-4">
      <div class="d-flex align-center">
        <v-icon icon="mdi-format-list-bulleted" class="mr-2" color="primary" />
        <span class="text-subtitle-1 font-weight-medium">Tax Details</span>
      </div>
      <v-btn
        variant="text"
        size="small"
        :prepend-icon="allExpanded ? 'mdi-unfold-less-horizontal' : 'mdi-unfold-more-horizontal'"
        @click="toggleAll"
      >
        {{ allExpanded ? "Collapse All" : "Expand All" }}
      </v-btn>
    </div>

    <!-- Accordion Panels -->
    <v-expansion-panels v-model="openPanels" multiple variant="accordion" class="accordion-panels">
      <v-expansion-panel
        v-for="section in sections"
        :key="section.id"
        :value="section.id"
        class="accordion-section"
      >
        <v-expansion-panel-title class="py-4">
          <div class="d-flex align-center">
            <v-avatar :color="section.color" size="36" class="mr-3">
              <v-icon :icon="section.icon" size="20" color="white" />
            </v-avatar>
            <div>
              <div class="text-subtitle-1 font-weight-medium">{{ section.title }}</div>
              <div class="text-caption text-medium-emphasis">{{ section.subtitle }}</div>
            </div>
          </div>
        </v-expansion-panel-title>

        <v-expansion-panel-text>
          <div class="section-content pa-2">
            <!-- Calculator Section -->
            <TaxCalculatorSection
              v-if="section.id === 'calculator'"
              :financial-year="financialYear"
            />

            <!-- Deductions Section -->
            <DeductionsSection
              v-else-if="section.id === 'deductions'"
              :financial-year="financialYear"
            />

            <!-- Scenarios Section -->
            <ScenariosSection
              v-else-if="section.id === 'scenarios'"
              :financial-year="financialYear"
            />

            <!-- Advance Tax Section -->
            <AdvanceTaxSection
              v-else-if="section.id === 'advance-tax'"
              :financial-year="financialYear"
            />

            <!-- Reports Section -->
            <ReportsSection
              v-else-if="section.id === 'reports'"
              :financial-year="financialYear"
            />
          </div>
        </v-expansion-panel-text>
      </v-expansion-panel>
    </v-expansion-panels>
  </div>
</template>

<style scoped>
.tax-details-tab {
  width: 100%;
}

.accordion-panels {
  border-radius: 8px;
}

.accordion-section {
  margin-bottom: 8px;
  border-radius: 8px !important;
  overflow: hidden;
}

.accordion-section::before {
  box-shadow: none !important;
}

.section-content {
  background: rgba(var(--v-theme-surface-variant), 0.3);
  border-radius: 8px;
  margin-top: 8px;
}

:deep(.v-expansion-panel-text__wrapper) {
  padding: 8px 16px 16px;
}
</style>
