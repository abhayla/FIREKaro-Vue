<script setup lang="ts">
import { ref, computed, watch } from "vue";
import SectionHeader from "@/components/shared/SectionHeader.vue";
import TaxRegimeSelector from "@/components/tax/TaxRegimeSelector.vue";
import TaxBreakdownTable from "@/components/tax/TaxBreakdownTable.vue";
import TaxComparisonCard from "@/components/tax/TaxComparisonCard.vue";
import {
  useTaxComparison,
  useTaxCalculation,
  calculateTax,
  compareRegimes,
  formatINR,
} from "@/composables/useTax";
import { useFinancialYear } from "@/composables/useSalary";
import type {
  TaxRegime,
  TaxCalculationResult,
  RegimeComparison,
} from "@/types/tax";
import { DEDUCTION_LIMITS } from "@/types/tax";

const tabs = [
  { title: "Overview", route: "/dashboard/tax-planning" },
  { title: "Calculator", route: "/dashboard/tax-planning/calculator" },
  { title: "Deductions", route: "/dashboard/tax-planning/deductions" },
  { title: "Reports", route: "/dashboard/tax-planning/reports" },
];

const { selectedFinancialYear, financialYearOptions } = useFinancialYear();
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
  { immediate: true },
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
    financialYear: selectedFinancialYear.value,
  };
});

// Active data based on mode
const activeComparison = computed(() =>
  calculatorMode.value === "api" ? apiComparison.value : manualComparison.value,
);

const activeCalculation = computed(() => {
  if (calculatorMode.value === "api") {
    return selectedRegime.value === "NEW"
      ? apiComparison.value?.newRegime
      : apiComparison.value?.oldRegime;
  }
  return manualCalculation.value;
});

const isLoading = computed(
  () => calculatorMode.value === "api" && apiLoading.value,
);

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
  <div>
    <SectionHeader
      title="Tax Planning"
      subtitle="Old vs New Regime Calculator"
      icon="mdi-calculator-variant"
      :tabs="tabs"
    />

    <!-- Mode Toggle & FY Selector -->
    <v-row class="mb-6" align="center">
      <v-col cols="12" sm="4" md="3">
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
      <v-col cols="12" sm="4" md="3">
        <v-btn-toggle
          v-model="calculatorMode"
          mandatory
          color="primary"
          variant="outlined"
          divided
          density="compact"
        >
          <v-btn value="api">
            <v-icon start>mdi-database</v-icon>
            From Data
          </v-btn>
          <v-btn value="manual">
            <v-icon start>mdi-pencil</v-icon>
            Manual
          </v-btn>
        </v-btn-toggle>
      </v-col>
      <v-col cols="12" sm="4" md="3">
        <v-btn
          variant="text"
          prepend-icon="mdi-refresh"
          @click="resetCalculator"
        >
          Reset
        </v-btn>
      </v-col>
    </v-row>

    <v-row>
      <!-- Left: Input Panel -->
      <v-col cols="12" md="5" lg="4">
        <v-card>
          <v-card-title>
            <v-icon class="mr-2">mdi-form-textbox</v-icon>
            Income & Deductions
          </v-card-title>
          <v-card-text>
            <!-- Regime Selector -->
            <div class="mb-4">
              <div class="text-subtitle-2 mb-2">Select Tax Regime</div>
              <TaxRegimeSelector
                v-model="selectedRegime"
                :show-description="false"
              />
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
              <div class="text-caption text-medium-emphasis mb-2">
                Quick Select
              </div>
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
              <div
                v-if="selectedRegime === 'OLD' || calculatorMode === 'manual'"
              >
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
                >
                  <template #append-inner>
                    <v-chip
                      v-if="section80C >= DEDUCTION_LIMITS.section80C"
                      color="success"
                      size="x-small"
                    >
                      Max
                    </v-chip>
                  </template>
                </v-text-field>

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
                New regime offers lower rates but only allows standard deduction
                of ₹75,000. Other deductions are not applicable.
              </div>
            </v-alert>
          </v-card-text>
        </v-card>
      </v-col>

      <!-- Right: Results Panel -->
      <v-col cols="12" md="7" lg="8">
        <!-- Tax Breakdown -->
        <TaxBreakdownTable
          :result="activeCalculation ?? null"
          :loading="isLoading"
          :show-slabs="true"
          :show-deductions="selectedRegime === 'OLD'"
          class="mb-6"
        />

        <!-- Regime Comparison -->
        <TaxComparisonCard
          :comparison="activeComparison ?? null"
          :loading="isLoading"
          @select-regime="selectedRegime = $event"
        />

        <!-- Tax Slabs Reference -->
        <v-card class="mt-6" variant="outlined">
          <v-card-title class="text-subtitle-1">
            <v-icon class="mr-2">mdi-table</v-icon>
            Tax Slabs Reference (FY 2024-25)
          </v-card-title>
          <v-card-text>
            <v-row>
              <v-col cols="12" md="6">
                <div class="text-subtitle-2 mb-2">Old Regime</div>
                <v-table density="compact">
                  <thead>
                    <tr>
                      <th>Income Slab</th>
                      <th class="text-end">Rate</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>Up to ₹2.5L</td>
                      <td class="text-end">Nil</td>
                    </tr>
                    <tr>
                      <td>₹2.5L - ₹5L</td>
                      <td class="text-end">5%</td>
                    </tr>
                    <tr>
                      <td>₹5L - ₹10L</td>
                      <td class="text-end">20%</td>
                    </tr>
                    <tr>
                      <td>Above ₹10L</td>
                      <td class="text-end">30%</td>
                    </tr>
                  </tbody>
                </v-table>
              </v-col>
              <v-col cols="12" md="6">
                <div class="text-subtitle-2 mb-2">New Regime</div>
                <v-table density="compact">
                  <thead>
                    <tr>
                      <th>Income Slab</th>
                      <th class="text-end">Rate</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>Up to ₹3L</td>
                      <td class="text-end">Nil</td>
                    </tr>
                    <tr>
                      <td>₹3L - ₹7L</td>
                      <td class="text-end">5%</td>
                    </tr>
                    <tr>
                      <td>₹7L - ₹10L</td>
                      <td class="text-end">10%</td>
                    </tr>
                    <tr>
                      <td>₹10L - ₹12L</td>
                      <td class="text-end">15%</td>
                    </tr>
                    <tr>
                      <td>₹12L - ₹15L</td>
                      <td class="text-end">20%</td>
                    </tr>
                    <tr>
                      <td>Above ₹15L</td>
                      <td class="text-end">30%</td>
                    </tr>
                  </tbody>
                </v-table>
              </v-col>
            </v-row>

            <v-alert type="info" variant="tonal" density="compact" class="mt-4">
              <div class="text-caption">
                <strong>Note:</strong> Tax rebate u/s 87A available if taxable
                income ≤ ₹7L (New) or ≤ ₹5L (Old). 4% Health & Education Cess
                applies on total tax. Surcharge applicable for income above
                ₹50L.
              </div>
            </v-alert>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </div>
</template>
