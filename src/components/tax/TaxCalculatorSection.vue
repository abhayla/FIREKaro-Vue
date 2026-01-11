<script setup lang="ts">
import { ref, computed, watch } from "vue";
import TaxRegimeSelector from "@/components/tax/TaxRegimeSelector.vue";
import TaxBreakdownTable from "@/components/tax/TaxBreakdownTable.vue";
import TaxComparisonCard from "@/components/tax/TaxComparisonCard.vue";
import {
  useTaxComparison,
  calculateTax,
  compareRegimes,
  formatINR,
} from "@/composables/useTax";
import type {
  TaxRegime,
  TaxCalculationResult,
  RegimeComparison,
} from "@/types/tax";
import { DEDUCTION_LIMITS } from "@/types/tax";

const props = defineProps<{
  financialYear: string;
}>();

const { data: apiComparison, isLoading: apiLoading } = useTaxComparison();

// Calculator Mode
const calculatorMode = ref<"api" | "manual">("api");

// Manual Calculator State
const selectedRegime = ref<TaxRegime>("NEW");
const grossIncome = ref<number>(0);
const section80C = ref<number>(0);
const section80D = ref<number>(0);
const section80CCD1B = ref<number>(0);
const homeLoanInterest = ref<number>(0);
const otherDeductions = ref<number>(0);

// Initialize from API data when available
watch(
  apiComparison,
  (val) => {
    if (val && calculatorMode.value === "api") {
      grossIncome.value = val.oldRegime.grossTotalIncome;
    }
  },
  { immediate: true }
);

// Total Deductions for Old Regime
const totalDeductions = computed(() => {
  return (
    Math.min(section80C.value, DEDUCTION_LIMITS.section80C) +
    Math.min(section80D.value, DEDUCTION_LIMITS.section80D) +
    Math.min(section80CCD1B.value, DEDUCTION_LIMITS.section80CCD1B) +
    Math.min(homeLoanInterest.value, DEDUCTION_LIMITS.section24) +
    otherDeductions.value
  );
});

// Manual Calculation Results
const manualCalculation = computed<TaxCalculationResult | null>(() => {
  if (calculatorMode.value === "api" || grossIncome.value <= 0) return null;

  return calculateTax({
    grossIncome: grossIncome.value,
    deductions: totalDeductions.value,
    regime: selectedRegime.value,
  });
});

const manualComparison = computed<RegimeComparison | null>(() => {
  if (calculatorMode.value === "api" || grossIncome.value <= 0) return null;

  const result = compareRegimes(grossIncome.value, totalDeductions.value);
  return {
    ...result,
    financialYear: props.financialYear,
  };
});

// Active data based on mode
const activeComparison = computed(() =>
  calculatorMode.value === "api" ? apiComparison.value : manualComparison.value
);

const activeCalculation = computed(() => {
  if (calculatorMode.value === "api") {
    return selectedRegime.value === "NEW"
      ? apiComparison.value?.newRegime
      : apiComparison.value?.oldRegime;
  }
  return manualCalculation.value;
});

const isLoading = computed(() => calculatorMode.value === "api" && apiLoading.value);

// Preset income values for quick selection
const incomePresets = [
  { label: "5L", value: 500000 },
  { label: "10L", value: 1000000 },
  { label: "15L", value: 1500000 },
  { label: "20L", value: 2000000 },
  { label: "30L", value: 3000000 },
  { label: "50L", value: 5000000 },
];

function applyPreset(value: number) {
  grossIncome.value = value;
  if (calculatorMode.value === "api") {
    calculatorMode.value = "manual";
  }
}

function resetCalculator() {
  grossIncome.value = apiComparison.value?.oldRegime.grossTotalIncome || 0;
  section80C.value = 0;
  section80D.value = 0;
  section80CCD1B.value = 0;
  homeLoanInterest.value = 0;
  otherDeductions.value = 0;
  calculatorMode.value = "api";
}
</script>

<template>
  <div class="tax-calculator-section">
    <!-- Mode Toggle -->
    <div class="d-flex align-center flex-wrap gap-2 mb-4">
      <v-btn-toggle
        v-model="calculatorMode"
        mandatory
        color="primary"
        variant="outlined"
        divided
        density="compact"
      >
        <v-btn value="api" size="small">
          <v-icon start size="small">mdi-database</v-icon>
          From Data
        </v-btn>
        <v-btn value="manual" size="small">
          <v-icon start size="small">mdi-pencil</v-icon>
          Manual
        </v-btn>
      </v-btn-toggle>
      <v-btn variant="text" size="small" prepend-icon="mdi-refresh" @click="resetCalculator">
        Reset
      </v-btn>
    </div>

    <v-row>
      <!-- Left: Input Panel -->
      <v-col cols="12" md="5">
        <v-card variant="outlined">
          <v-card-text>
            <!-- Regime Selector -->
            <div class="mb-4">
              <div class="text-subtitle-2 mb-2">Select Tax Regime</div>
              <TaxRegimeSelector v-model="selectedRegime" :show-description="false" />
            </div>

            <!-- Gross Income -->
            <v-text-field
              v-model.number="grossIncome"
              label="Gross Total Income"
              type="number"
              variant="outlined"
              density="comfortable"
              prefix="₹"
              hint="Total income from all sources"
              persistent-hint
              :disabled="calculatorMode === 'api'"
              class="mb-2"
            />

            <!-- Quick Presets -->
            <div class="mb-4">
              <div class="text-caption text-medium-emphasis mb-2">Quick Select</div>
              <v-chip-group>
                <v-chip
                  v-for="preset in incomePresets"
                  :key="preset.value"
                  size="small"
                  variant="outlined"
                  @click="applyPreset(preset.value)"
                >
                  ₹{{ preset.label }}
                </v-chip>
              </v-chip-group>
            </div>

            <v-divider class="my-4" />

            <!-- Deductions (Only for Old Regime or Manual Mode) -->
            <v-expand-transition>
              <div v-if="selectedRegime === 'OLD' || calculatorMode === 'manual'">
                <div class="text-subtitle-2 mb-3">
                  Deductions (Old Regime Only)
                  <v-chip size="x-small" class="ml-2">
                    Total: {{ formatINR(totalDeductions) }}
                  </v-chip>
                </div>

                <v-text-field
                  v-model.number="section80C"
                  label="Section 80C"
                  type="number"
                  variant="outlined"
                  density="compact"
                  prefix="₹"
                  :hint="`Limit: ${formatINR(DEDUCTION_LIMITS.section80C)}`"
                  persistent-hint
                  class="mb-3"
                />

                <v-text-field
                  v-model.number="section80D"
                  label="Section 80D (Health Insurance)"
                  type="number"
                  variant="outlined"
                  density="compact"
                  prefix="₹"
                  :hint="`Limit: ${formatINR(DEDUCTION_LIMITS.section80D)}`"
                  persistent-hint
                  class="mb-3"
                />

                <v-text-field
                  v-model.number="section80CCD1B"
                  label="Section 80CCD(1B) - NPS"
                  type="number"
                  variant="outlined"
                  density="compact"
                  prefix="₹"
                  :hint="`Limit: ${formatINR(DEDUCTION_LIMITS.section80CCD1B)}`"
                  persistent-hint
                  class="mb-3"
                />

                <v-text-field
                  v-model.number="homeLoanInterest"
                  label="Section 24 - Home Loan Interest"
                  type="number"
                  variant="outlined"
                  density="compact"
                  prefix="₹"
                  :hint="`Limit: ${formatINR(DEDUCTION_LIMITS.section24)}`"
                  persistent-hint
                  class="mb-3"
                />

                <v-text-field
                  v-model.number="otherDeductions"
                  label="Other Deductions"
                  type="number"
                  variant="outlined"
                  density="compact"
                  prefix="₹"
                  hint="80E, 80G, 80TTA, etc."
                  persistent-hint
                />
              </div>
            </v-expand-transition>

            <!-- New Regime Notice -->
            <v-alert
              v-if="selectedRegime === 'NEW'"
              type="info"
              variant="tonal"
              density="compact"
              class="mt-4"
            >
              <div class="text-caption">
                New regime offers lower rates but only allows standard deduction of ₹75,000.
                Other deductions are not applicable.
              </div>
            </v-alert>
          </v-card-text>
        </v-card>
      </v-col>

      <!-- Right: Results Panel -->
      <v-col cols="12" md="7">
        <!-- Tax Breakdown -->
        <TaxBreakdownTable
          :result="activeCalculation ?? null"
          :loading="isLoading"
          :show-slabs="true"
          :show-deductions="selectedRegime === 'OLD'"
          class="mb-4"
        />

        <!-- Regime Comparison -->
        <TaxComparisonCard
          :comparison="activeComparison ?? null"
          :loading="isLoading"
          @select-regime="selectedRegime = $event"
        />
      </v-col>
    </v-row>
  </div>
</template>
