<script setup lang="ts">
import { ref, watch, computed } from "vue";
import { useForm, useField } from "vee-validate";
import { toTypedSchema } from "@vee-validate/zod";
import { z } from "zod";
import { formatINR, calculateTax } from "@/composables/useTax";
import type { TaxRegime } from "@/types/tax";

interface Scenario {
  id?: string;
  name: string;
  description?: string;
  selectedRegime: string;
  incomeAdjustments?: Record<string, number>;
  deductionAdjustments?: Record<string, number>;
  totalGrossIncome?: number;
  totalDeductions?: number;
}

const props = defineProps<{
  modelValue: boolean;
  scenario?: Scenario | null;
  baseline: Scenario | null;
  loading?: boolean;
}>();

const emit = defineEmits<{
  (e: "update:modelValue", value: boolean): void;
  (e: "save", data: any): void;
  (e: "cancel"): void;
}>();

const isOpen = computed({
  get: () => props.modelValue,
  set: (val) => emit("update:modelValue", val),
});

const isEditing = computed(() => !!props.scenario?.id);

// Form schema
const schema = toTypedSchema(
  z.object({
    name: z.string().min(1, "Name is required").max(100),
    description: z.string().max(500).optional(),
    selectedRegime: z.enum(["OLD", "NEW"]),
  })
);

const { handleSubmit, errors, resetForm, setValues } = useForm({
  validationSchema: schema,
  initialValues: {
    name: "",
    description: "",
    selectedRegime: "NEW" as const,
  },
});

const { value: name } = useField<string>("name");
const { value: description } = useField<string>("description");
const { value: selectedRegime } = useField<string>("selectedRegime");

// Income adjustments
const incomeAdjustments = ref({
  salary: 0,
  business: 0,
  rental: 0,
  capitalGains: 0,
  other: 0,
});

// Deduction adjustments
const deductionAdjustments = ref({
  section80C: 0,
  section80D: 0,
  section80CCD1B: 0,
  section24: 0,
  section80TTA: 0,
});

// Deduction limits
const deductionLimits = {
  section80C: 150000,
  section80D: 25000,
  section80CCD1B: 50000,
  section24: 200000,
  section80TTA: 10000,
};

// Computed total income
const totalGrossIncome = computed(() => {
  const baseIncome = props.baseline?.totalGrossIncome ?? 0;
  const adjustments = Object.values(incomeAdjustments.value).reduce(
    (sum, val) => sum + val,
    0
  );
  return baseIncome + adjustments;
});

// Computed total deductions
const totalDeductions = computed(() => {
  const baseDeductions = props.baseline?.totalDeductions ?? 0;
  const entries = Object.entries(deductionAdjustments.value) as [keyof typeof deductionLimits, number][];
  const adjustments = entries.reduce(
    (sum, [key, val]) => sum + Math.min(val, deductionLimits[key] || val),
    0
  );
  return selectedRegime.value === "OLD" ? baseDeductions + adjustments : 75000; // New regime only has standard deduction
});

// Live tax calculation preview
const taxPreview = computed(() => {
  return calculateTax({
    grossIncome: totalGrossIncome.value,
    deductions: totalDeductions.value,
    regime: selectedRegime.value as TaxRegime,
  });
});

// Comparison to baseline
const taxDifference = computed(() => {
  if (!props.baseline) return 0;
  return taxPreview.value.totalTaxLiability - (props.baseline.totalDeductions ?? 0);
});

// Watch for changes to scenario prop (for editing)
watch(
  () => props.scenario,
  (val) => {
    if (val) {
      setValues({
        name: val.name || "",
        description: val.description || "",
        selectedRegime: (val.selectedRegime as "OLD" | "NEW") || "NEW",
      });

      // Set adjustments
      const incomeAdj = val.incomeAdjustments || {};
      incomeAdjustments.value = {
        salary: incomeAdj.salary || 0,
        business: incomeAdj.business || 0,
        rental: incomeAdj.rental || 0,
        capitalGains: incomeAdj.capitalGains || 0,
        other: incomeAdj.other || 0,
      };

      const deductionAdj = val.deductionAdjustments || {};
      deductionAdjustments.value = {
        section80C: deductionAdj.section80C || 0,
        section80D: deductionAdj.section80D || 0,
        section80CCD1B: deductionAdj.section80CCD1B || 0,
        section24: deductionAdj.section24 || 0,
        section80TTA: deductionAdj.section80TTA || 0,
      };
    } else {
      resetForm();
      incomeAdjustments.value = {
        salary: 0,
        business: 0,
        rental: 0,
        capitalGains: 0,
        other: 0,
      };
      deductionAdjustments.value = {
        section80C: 0,
        section80D: 0,
        section80CCD1B: 0,
        section24: 0,
        section80TTA: 0,
      };
    }
  },
  { immediate: true }
);

const onSubmit = handleSubmit((values) => {
  emit("save", {
    ...values,
    incomeAdjustments: incomeAdjustments.value,
    deductionAdjustments: deductionAdjustments.value,
  });
});

function handleCancel() {
  resetForm();
  emit("cancel");
}
</script>

<template>
  <v-dialog
    v-model="isOpen"
    max-width="800"
    persistent
    scrollable
  >
    <v-card>
      <v-card-title class="d-flex align-center">
        <v-icon class="mr-2">{{ isEditing ? 'mdi-pencil' : 'mdi-plus' }}</v-icon>
        {{ isEditing ? 'Edit Scenario' : 'Create New Scenario' }}
      </v-card-title>

      <v-card-text>
        <v-form @submit.prevent="onSubmit">
          <!-- Basic Info -->
          <v-row>
            <v-col cols="12" sm="8">
              <v-text-field
                v-model="name"
                label="Scenario Name"
                variant="outlined"
                density="comfortable"
                :error-messages="errors.name"
                placeholder="e.g., Max 80C Investment"
                required
              />
            </v-col>
            <v-col cols="12" sm="4">
              <v-select
                v-model="selectedRegime"
                :items="[
                  { title: 'New Regime', value: 'NEW' },
                  { title: 'Old Regime', value: 'OLD' },
                ]"
                label="Tax Regime"
                variant="outlined"
                density="comfortable"
                :error-messages="errors.selectedRegime"
              />
            </v-col>
            <v-col cols="12">
              <v-textarea
                v-model="description"
                label="Description (Optional)"
                variant="outlined"
                density="comfortable"
                rows="2"
                :error-messages="errors.description"
                placeholder="Describe what this scenario represents"
              />
            </v-col>
          </v-row>

          <v-divider class="my-4" />

          <!-- Income Adjustments -->
          <div class="text-subtitle-2 mb-3">
            <v-icon size="small" class="mr-1">mdi-cash-plus</v-icon>
            Income Adjustments
            <span class="text-caption text-medium-emphasis ml-2">
              (Add or subtract from baseline)
            </span>
          </div>

          <v-row dense>
            <v-col cols="6" sm="4">
              <v-text-field
                v-model.number="incomeAdjustments.salary"
                label="Salary"
                type="number"
                variant="outlined"
                density="compact"
                prefix="₹"
                hide-details
              />
            </v-col>
            <v-col cols="6" sm="4">
              <v-text-field
                v-model.number="incomeAdjustments.business"
                label="Business Income"
                type="number"
                variant="outlined"
                density="compact"
                prefix="₹"
                hide-details
              />
            </v-col>
            <v-col cols="6" sm="4">
              <v-text-field
                v-model.number="incomeAdjustments.rental"
                label="Rental Income"
                type="number"
                variant="outlined"
                density="compact"
                prefix="₹"
                hide-details
              />
            </v-col>
            <v-col cols="6" sm="4">
              <v-text-field
                v-model.number="incomeAdjustments.capitalGains"
                label="Capital Gains"
                type="number"
                variant="outlined"
                density="compact"
                prefix="₹"
                hide-details
              />
            </v-col>
            <v-col cols="6" sm="4">
              <v-text-field
                v-model.number="incomeAdjustments.other"
                label="Other Income"
                type="number"
                variant="outlined"
                density="compact"
                prefix="₹"
                hide-details
              />
            </v-col>
          </v-row>

          <v-divider class="my-4" />

          <!-- Deduction Adjustments (only for Old Regime) -->
          <div class="text-subtitle-2 mb-3">
            <v-icon size="small" class="mr-1">mdi-minus-circle</v-icon>
            Deduction Adjustments
            <span class="text-caption text-medium-emphasis ml-2">
              ({{ selectedRegime === 'OLD' ? 'Additional deductions to claim' : 'Not applicable in New Regime' }})
            </span>
          </div>

          <v-expand-transition>
            <div v-if="selectedRegime === 'OLD'">
              <v-row dense>
                <v-col cols="6" sm="4">
                  <v-text-field
                    v-model.number="deductionAdjustments.section80C"
                    label="Section 80C"
                    type="number"
                    variant="outlined"
                    density="compact"
                    prefix="₹"
                    :hint="`Limit: ${formatINR(deductionLimits.section80C)}`"
                    persistent-hint
                  />
                </v-col>
                <v-col cols="6" sm="4">
                  <v-text-field
                    v-model.number="deductionAdjustments.section80D"
                    label="Section 80D"
                    type="number"
                    variant="outlined"
                    density="compact"
                    prefix="₹"
                    :hint="`Limit: ${formatINR(deductionLimits.section80D)}`"
                    persistent-hint
                  />
                </v-col>
                <v-col cols="6" sm="4">
                  <v-text-field
                    v-model.number="deductionAdjustments.section80CCD1B"
                    label="80CCD(1B) NPS"
                    type="number"
                    variant="outlined"
                    density="compact"
                    prefix="₹"
                    :hint="`Limit: ${formatINR(deductionLimits.section80CCD1B)}`"
                    persistent-hint
                  />
                </v-col>
                <v-col cols="6" sm="4">
                  <v-text-field
                    v-model.number="deductionAdjustments.section24"
                    label="Section 24 (Home Loan)"
                    type="number"
                    variant="outlined"
                    density="compact"
                    prefix="₹"
                    :hint="`Limit: ${formatINR(deductionLimits.section24)}`"
                    persistent-hint
                  />
                </v-col>
                <v-col cols="6" sm="4">
                  <v-text-field
                    v-model.number="deductionAdjustments.section80TTA"
                    label="Section 80TTA"
                    type="number"
                    variant="outlined"
                    density="compact"
                    prefix="₹"
                    :hint="`Limit: ${formatINR(deductionLimits.section80TTA)}`"
                    persistent-hint
                  />
                </v-col>
              </v-row>
            </div>
            <v-alert v-else type="info" variant="tonal" density="compact">
              New Regime only allows standard deduction of Rs.75,000. Other deductions are not applicable.
            </v-alert>
          </v-expand-transition>

          <v-divider class="my-4" />

          <!-- Live Preview -->
          <v-card variant="tonal" color="primary">
            <v-card-title class="text-subtitle-2">
              <v-icon size="small" class="mr-1">mdi-eye</v-icon>
              Live Tax Preview
            </v-card-title>
            <v-card-text>
              <v-row>
                <v-col cols="6" sm="3">
                  <div class="text-caption text-medium-emphasis">Gross Income</div>
                  <div class="text-body-1 font-weight-medium text-currency">
                    {{ formatINR(totalGrossIncome) }}
                  </div>
                </v-col>
                <v-col cols="6" sm="3">
                  <div class="text-caption text-medium-emphasis">Deductions</div>
                  <div class="text-body-1 font-weight-medium text-currency text-negative">
                    -{{ formatINR(totalDeductions) }}
                  </div>
                </v-col>
                <v-col cols="6" sm="3">
                  <div class="text-caption text-medium-emphasis">Taxable Income</div>
                  <div class="text-body-1 font-weight-medium text-currency">
                    {{ formatINR(taxPreview.taxableIncome) }}
                  </div>
                </v-col>
                <v-col cols="6" sm="3">
                  <div class="text-caption text-medium-emphasis">Tax Liability</div>
                  <div class="text-body-1 font-weight-bold text-currency">
                    {{ formatINR(taxPreview.totalTaxLiability) }}
                  </div>
                </v-col>
              </v-row>
            </v-card-text>
          </v-card>
        </v-form>
      </v-card-text>

      <v-card-actions>
        <v-spacer />
        <v-btn
          variant="text"
          :disabled="loading"
          @click="handleCancel"
        >
          Cancel
        </v-btn>
        <v-btn
          color="primary"
          variant="flat"
          :loading="loading"
          @click="onSubmit"
        >
          {{ isEditing ? 'Update' : 'Create' }} Scenario
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
