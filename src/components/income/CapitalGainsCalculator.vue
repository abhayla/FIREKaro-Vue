<script setup lang="ts">
import { ref, computed, watch } from "vue";
import type { CapitalGain, CapitalGainInput, AssetType } from "@/types/income";
import {
  calculateIndexedCost,
  calculateHoldingPeriod,
  determineGainType,
  CAPITAL_GAINS_TAX_RATES,
  CII_INDEX,
} from "@/types/income";
import { formatINR } from "@/composables/useIncome";
import {
  getCurrentFinancialYear,
  getFinancialYearOptions,
} from "@/types/salary";

interface Props {
  modelValue: boolean;
  editItem?: CapitalGain | null;
}

const props = withDefaults(defineProps<Props>(), {
  editItem: null,
});

const emit = defineEmits<{
  (e: "update:modelValue", value: boolean): void;
  (e: "submit", data: CapitalGainInput): void;
}>();

const dialog = computed({
  get: () => props.modelValue,
  set: (val) => emit("update:modelValue", val),
});

const isEdit = computed(() => !!props.editItem);

// Form fields
const form = ref<{
  assetType: AssetType;
  assetName: string;
  financialYear: string;
  purchaseDate: string;
  purchasePrice: number | null;
  saleDate: string;
  salePrice: number | null;
  purchaseExpenses: number | null;
  saleExpenses: number | null;
  improvementCost: number | null;
  useIndexation: boolean;
  exemptionClaimed: number | null;
  exemptionSection: "54" | "54F" | "54EC" | null;
}>({
  assetType: "equity",
  assetName: "",
  financialYear: getCurrentFinancialYear(),
  purchaseDate: "",
  purchasePrice: null,
  saleDate: "",
  salePrice: null,
  purchaseExpenses: null,
  saleExpenses: null,
  improvementCost: null,
  useIndexation: false,
  exemptionClaimed: null,
  exemptionSection: null,
});

const assetTypes: { value: AssetType; title: string; icon: string }[] = [
  { value: "equity", title: "Equity/Stocks/Equity MF", icon: "mdi-chart-line" },
  { value: "debt_mf", title: "Debt Mutual Fund", icon: "mdi-file-document" },
  { value: "property", title: "Property/Real Estate", icon: "mdi-home" },
  { value: "gold", title: "Gold/Silver", icon: "mdi-gold" },
  { value: "crypto", title: "Cryptocurrency", icon: "mdi-bitcoin" },
  { value: "other", title: "Other Assets", icon: "mdi-package-variant" },
];

const exemptionSections = [
  {
    value: "54",
    title: "Section 54",
    subtitle: "Purchase new residential property",
  },
  {
    value: "54F",
    title: "Section 54F",
    subtitle: "Sale of any asset (non-house property)",
  },
  {
    value: "54EC",
    title: "Section 54EC",
    subtitle: "Invest in specified bonds",
  },
];

const fyOptions = computed(() => getFinancialYearOptions());

// Calculations
const holdingPeriod = computed(() => {
  if (!form.value.purchaseDate || !form.value.saleDate) return 0;
  return calculateHoldingPeriod(form.value.purchaseDate, form.value.saleDate);
});

const gainType = computed(() => {
  return determineGainType(form.value.assetType, holdingPeriod.value);
});

const totalCost = computed(() => {
  const purchase = form.value.purchasePrice || 0;
  const purchaseExp = form.value.purchaseExpenses || 0;
  const improvement = form.value.improvementCost || 0;
  return purchase + purchaseExp + improvement;
});

const indexedCost = computed(() => {
  if (
    !form.value.useIndexation ||
    !form.value.purchaseDate ||
    !form.value.saleDate
  ) {
    return totalCost.value;
  }
  return calculateIndexedCost(
    totalCost.value,
    form.value.purchaseDate,
    form.value.saleDate,
  );
});

const saleProceeds = computed(() => {
  const sale = form.value.salePrice || 0;
  const saleExp = form.value.saleExpenses || 0;
  return sale - saleExp;
});

const grossGain = computed(() => {
  return (
    saleProceeds.value -
    (form.value.useIndexation ? indexedCost.value : totalCost.value)
  );
});

const taxableGain = computed(() => {
  const gain = grossGain.value;
  const exemption = form.value.exemptionClaimed || 0;

  // LTCG exemption for equity (Rs.1.25L)
  if (form.value.assetType === "equity" && gainType.value === "LTCG") {
    const ltcgExemption = CAPITAL_GAINS_TAX_RATES.equity.ltcgExemption;
    return Math.max(0, gain - ltcgExemption - exemption);
  }

  return Math.max(0, gain - exemption);
});

const estimatedTax = computed(() => {
  const gain = taxableGain.value;
  if (gain <= 0) return 0;

  const type = form.value.assetType;
  const isLTCG = gainType.value === "LTCG";

  // Equity
  if (type === "equity") {
    return isLTCG ? gain * 0.125 : gain * 0.2; // 12.5% LTCG, 20% STCG (post July 2024)
  }

  // Debt MF post April 2023 - slab rate (assume 30% for calculation)
  if (type === "debt_mf") {
    return gain * 0.3; // At slab rate
  }

  // Property/Gold/Others
  if (["property", "gold", "other"].includes(type)) {
    if (isLTCG) {
      // 12.5% flat or 20% with indexation - show 12.5% as default
      return gain * 0.125;
    }
    return gain * 0.3; // STCG at slab rate
  }

  // Crypto - 30% flat
  if (type === "crypto") {
    return gain * 0.3;
  }

  return gain * 0.3;
});

// Can use indexation?
const canUseIndexation = computed(() => {
  // Only for LTCG on property/gold bought before July 2024
  if (gainType.value !== "LTCG") return false;
  if (!["property", "gold"].includes(form.value.assetType)) return false;

  // Check if purchased before July 23, 2024
  if (!form.value.purchaseDate) return false;
  const purchaseDate = new Date(form.value.purchaseDate);
  const cutoffDate = new Date("2024-07-23");
  return purchaseDate < cutoffDate;
});

// Reset indexation when not available
watch(canUseIndexation, (canUse) => {
  if (!canUse) {
    form.value.useIndexation = false;
  }
});

// Populate form when editing
watch(
  () => props.editItem,
  (item) => {
    if (item) {
      form.value = {
        assetType: item.assetType,
        assetName: item.assetName,
        financialYear: item.financialYear,
        purchaseDate: item.purchaseDate.substring(0, 10),
        purchasePrice: item.purchasePrice,
        saleDate: item.saleDate.substring(0, 10),
        salePrice: item.salePrice,
        purchaseExpenses: item.purchaseExpenses || null,
        saleExpenses: item.saleExpenses || null,
        improvementCost: item.improvementCost || null,
        useIndexation: item.useIndexation,
        exemptionClaimed: item.exemptionClaimed || null,
        exemptionSection: item.exemptionSection || null,
      };
    } else {
      resetForm();
    }
  },
  { immediate: true },
);

function resetForm() {
  form.value = {
    assetType: "equity",
    assetName: "",
    financialYear: getCurrentFinancialYear(),
    purchaseDate: "",
    purchasePrice: null,
    saleDate: "",
    salePrice: null,
    purchaseExpenses: null,
    saleExpenses: null,
    improvementCost: null,
    useIndexation: false,
    exemptionClaimed: null,
    exemptionSection: null,
  };
}

function handleSubmit() {
  const data: CapitalGainInput = {
    assetType: form.value.assetType,
    assetName: form.value.assetName,
    financialYear: form.value.financialYear,
    purchaseDate: form.value.purchaseDate,
    purchasePrice: form.value.purchasePrice || 0,
    saleDate: form.value.saleDate,
    salePrice: form.value.salePrice || 0,
    purchaseExpenses: form.value.purchaseExpenses || undefined,
    saleExpenses: form.value.saleExpenses || undefined,
    improvementCost: form.value.improvementCost || undefined,
    useIndexation: form.value.useIndexation,
    exemptionClaimed: form.value.exemptionClaimed || undefined,
    exemptionSection: form.value.exemptionSection || undefined,
  };
  emit("submit", data);
  dialog.value = false;
}
</script>

<template>
  <v-dialog v-model="dialog" max-width="800" persistent scrollable>
    <v-card>
      <v-card-title class="d-flex align-center">
        <v-icon class="mr-2">mdi-trending-up</v-icon>
        {{ isEdit ? "Edit" : "Add" }} Capital Gain Transaction
      </v-card-title>

      <v-card-text style="max-height: 70vh">
        <v-form @submit.prevent="handleSubmit">
          <v-row>
            <!-- Asset Type -->
            <v-col cols="12">
              <div class="text-subtitle-2 mb-2 text-medium-emphasis">
                Asset Details
              </div>
            </v-col>

            <v-col cols="12" md="6">
              <v-select
                v-model="form.assetType"
                label="Asset Type"
                :items="assetTypes"
                item-value="value"
                item-title="title"
              >
                <template #item="{ props: itemProps, item }">
                  <v-list-item v-bind="itemProps">
                    <template #prepend>
                      <v-icon :icon="item.raw.icon" />
                    </template>
                  </v-list-item>
                </template>
              </v-select>
            </v-col>

            <v-col cols="12" md="6">
              <v-text-field
                v-model="form.assetName"
                label="Asset Name/Description"
                placeholder="e.g., Reliance Industries Ltd"
                :rules="[(v) => !!v || 'Asset name is required']"
              />
            </v-col>

            <v-col cols="12" md="6">
              <v-select
                v-model="form.financialYear"
                label="Sale Financial Year"
                :items="fyOptions"
              />
            </v-col>

            <!-- Purchase Details -->
            <v-col cols="12">
              <div class="text-subtitle-2 mb-2 text-medium-emphasis">
                Purchase Details
              </div>
            </v-col>

            <v-col cols="12" md="4">
              <v-text-field
                v-model="form.purchaseDate"
                label="Purchase Date"
                type="date"
                :rules="[(v) => !!v || 'Required']"
              />
            </v-col>

            <v-col cols="12" md="4">
              <v-text-field
                v-model.number="form.purchasePrice"
                label="Purchase Price"
                type="number"
                prefix="Rs."
                :rules="[(v) => v > 0 || 'Required']"
              />
            </v-col>

            <v-col cols="12" md="4">
              <v-text-field
                v-model.number="form.purchaseExpenses"
                label="Purchase Expenses"
                type="number"
                prefix="Rs."
                hint="Brokerage, stamp duty, etc."
              />
            </v-col>

            <!-- Sale Details -->
            <v-col cols="12">
              <div class="text-subtitle-2 mb-2 text-medium-emphasis">
                Sale Details
              </div>
            </v-col>

            <v-col cols="12" md="4">
              <v-text-field
                v-model="form.saleDate"
                label="Sale Date"
                type="date"
                :rules="[(v) => !!v || 'Required']"
              />
            </v-col>

            <v-col cols="12" md="4">
              <v-text-field
                v-model.number="form.salePrice"
                label="Sale Price"
                type="number"
                prefix="Rs."
                :rules="[(v) => v > 0 || 'Required']"
              />
            </v-col>

            <v-col cols="12" md="4">
              <v-text-field
                v-model.number="form.saleExpenses"
                label="Sale Expenses"
                type="number"
                prefix="Rs."
                hint="Brokerage, etc."
              />
            </v-col>

            <!-- Improvement Cost -->
            <v-col cols="12" md="6">
              <v-text-field
                v-model.number="form.improvementCost"
                label="Improvement Cost (if any)"
                type="number"
                prefix="Rs."
                hint="Capital expenditure on the asset"
              />
            </v-col>

            <!-- Indexation -->
            <v-col v-if="canUseIndexation" cols="12" md="6">
              <v-switch
                v-model="form.useIndexation"
                label="Use Cost Inflation Indexation"
                color="primary"
                hint="Available for property/gold bought before July 23, 2024"
                persistent-hint
              />
            </v-col>

            <!-- Gain Type & Holding Period -->
            <v-col cols="12">
              <v-row>
                <v-col cols="6" md="3">
                  <v-chip
                    :color="gainType === 'LTCG' ? 'success' : 'warning'"
                    size="large"
                  >
                    {{ gainType }}
                  </v-chip>
                </v-col>
                <v-col cols="6" md="3">
                  <div class="text-caption text-medium-emphasis">
                    Holding Period
                  </div>
                  <div class="text-body-1 font-weight-medium">
                    {{ holdingPeriod }} months
                  </div>
                </v-col>
              </v-row>
            </v-col>

            <!-- Exemptions -->
            <v-col v-if="gainType === 'LTCG' && grossGain > 0" cols="12">
              <v-expansion-panels variant="accordion">
                <v-expansion-panel
                  title="Claim Exemption (Section 54/54F/54EC)"
                >
                  <v-expansion-panel-text>
                    <v-row>
                      <v-col cols="12" md="6">
                        <v-select
                          v-model="form.exemptionSection"
                          label="Exemption Section"
                          :items="exemptionSections"
                          item-value="value"
                          item-title="title"
                          clearable
                        >
                          <template #item="{ props: itemProps, item }">
                            <v-list-item v-bind="itemProps">
                              <v-list-item-subtitle>{{
                                item.raw.subtitle
                              }}</v-list-item-subtitle>
                            </v-list-item>
                          </template>
                        </v-select>
                      </v-col>
                      <v-col cols="12" md="6">
                        <v-text-field
                          v-model.number="form.exemptionClaimed"
                          label="Exemption Amount"
                          type="number"
                          prefix="Rs."
                          :disabled="!form.exemptionSection"
                        />
                      </v-col>
                    </v-row>
                  </v-expansion-panel-text>
                </v-expansion-panel>
              </v-expansion-panels>
            </v-col>

            <!-- Calculation Summary -->
            <v-col cols="12">
              <v-card variant="outlined" class="pa-4">
                <div class="text-subtitle-2 mb-3">
                  Capital Gains Calculation
                </div>

                <v-table density="compact" class="mb-4">
                  <tbody>
                    <tr>
                      <td>Sale Proceeds</td>
                      <td class="text-right text-currency">
                        {{ formatINR(saleProceeds) }}
                      </td>
                    </tr>
                    <tr>
                      <td>
                        Less:
                        {{
                          form.useIndexation
                            ? "Indexed Cost"
                            : "Cost of Acquisition"
                        }}
                      </td>
                      <td class="text-right text-currency text-negative">
                        -{{
                          formatINR(
                            form.useIndexation ? indexedCost : totalCost,
                          )
                        }}
                      </td>
                    </tr>
                    <tr v-if="form.useIndexation">
                      <td class="pl-6 text-caption text-medium-emphasis">
                        (Original Cost: {{ formatINR(totalCost) }})
                      </td>
                      <td></td>
                    </tr>
                    <tr>
                      <td>Gross {{ gainType }}</td>
                      <td
                        class="text-right text-currency font-weight-medium"
                        :class="
                          grossGain >= 0 ? 'text-positive' : 'text-negative'
                        "
                      >
                        {{ formatINR(grossGain) }}
                      </td>
                    </tr>
                    <tr
                      v-if="form.assetType === 'equity' && gainType === 'LTCG'"
                    >
                      <td>Less: LTCG Exemption (Rs.1.25L)</td>
                      <td class="text-right text-currency text-negative">
                        -{{
                          formatINR(
                            Math.min(
                              grossGain,
                              CAPITAL_GAINS_TAX_RATES.equity.ltcgExemption,
                            ),
                          )
                        }}
                      </td>
                    </tr>
                    <tr v-if="form.exemptionClaimed">
                      <td>
                        Less: Section {{ form.exemptionSection }} Exemption
                      </td>
                      <td class="text-right text-currency text-negative">
                        -{{ formatINR(form.exemptionClaimed) }}
                      </td>
                    </tr>
                  </tbody>
                </v-table>

                <v-divider class="mb-3" />

                <div class="d-flex justify-space-between align-center mb-2">
                  <div>
                    <div class="text-body-2 font-weight-medium">
                      Taxable {{ gainType }}
                    </div>
                  </div>
                  <div
                    class="text-h5 text-currency font-weight-bold"
                    :class="
                      taxableGain >= 0 ? 'text-positive' : 'text-negative'
                    "
                  >
                    {{ formatINR(taxableGain) }}
                  </div>
                </div>

                <div class="d-flex justify-space-between align-center">
                  <div>
                    <div class="text-body-2 text-medium-emphasis">
                      Estimated Tax
                    </div>
                    <div class="text-caption text-medium-emphasis">
                      {{
                        form.assetType === "equity"
                          ? gainType === "LTCG"
                            ? "@ 12.5%"
                            : "@ 20%"
                          : gainType === "LTCG"
                            ? "@ 12.5%"
                            : "@ Slab Rate"
                      }}
                    </div>
                  </div>
                  <div
                    class="text-h6 text-currency font-weight-bold text-error"
                  >
                    {{ formatINR(estimatedTax) }}
                  </div>
                </div>
              </v-card>
            </v-col>
          </v-row>
        </v-form>
      </v-card-text>

      <v-card-actions>
        <v-btn variant="text" @click="dialog = false">Cancel</v-btn>
        <v-spacer />
        <v-btn
          color="primary"
          variant="flat"
          :disabled="
            !form.assetName ||
            !form.purchaseDate ||
            !form.purchasePrice ||
            !form.saleDate ||
            !form.salePrice
          "
          @click="handleSubmit"
        >
          {{ isEdit ? "Update" : "Add" }} Transaction
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
