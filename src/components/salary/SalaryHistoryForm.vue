<script setup lang="ts">
import { ref, computed, watch } from "vue";
import type { SalaryHistoryRecord, SalaryHistoryInput } from "@/types/salary";
import {
  FY_MONTHS,
  getCurrentFinancialYear,
  getFinancialYearOptions,
} from "@/types/salary";
import { formatINR } from "@/composables/useSalary";

const props = defineProps<{
  modelValue: boolean;
  record?: SalaryHistoryRecord | null;
  financialYear?: string;
}>();

const emit = defineEmits<{
  (e: "update:modelValue", value: boolean): void;
  (e: "save", data: SalaryHistoryInput): void;
}>();

const isOpen = computed({
  get: () => props.modelValue,
  set: (value) => emit("update:modelValue", value),
});

const isEditing = computed(() => !!props.record);

// Form data
const form = ref<SalaryHistoryInput>({
  month: 1,
  year: new Date().getFullYear(),
  financialYear: props.financialYear || getCurrentFinancialYear(),
  basicSalary: 0,
  hra: 0,
  conveyanceAllowance: 0,
  medicalAllowance: 0,
  specialAllowance: 0,
  specialPay: 0,
  otherAllowances: 0,
  epfDeduction: 0,
  vpfDeduction: 0,
  professionalTax: 0,
  tdsDeduction: 0,
  otherDeductions: 0,
  paidDays: 30,
  employerPf: 0,
  employerNps: 0,
  pensionFund: 0,
  superannuation: 0,
});

// Reset form when dialog opens
watch(
  () => props.modelValue,
  (open) => {
    if (open) {
      if (props.record) {
        form.value = {
          month: props.record.month,
          year: props.record.year,
          financialYear: props.record.financialYear,
          basicSalary: props.record.basicSalary,
          hra: props.record.hra,
          conveyanceAllowance: props.record.conveyanceAllowance,
          medicalAllowance: props.record.medicalAllowance,
          specialAllowance: props.record.specialAllowance,
          specialPay: props.record.specialPay || 0,
          otherAllowances: props.record.otherAllowances || 0,
          epfDeduction: props.record.epfDeduction,
          vpfDeduction: props.record.vpfDeduction || 0,
          professionalTax: props.record.professionalTax,
          tdsDeduction: props.record.tdsDeduction,
          otherDeductions: props.record.otherDeductions || 0,
          paidDays: props.record.paidDays,
          employerPf: props.record.employerPf || 0,
          employerNps: props.record.employerNps || 0,
          pensionFund: props.record.pensionFund || 0,
          superannuation: props.record.superannuation || 0,
        };
      } else {
        // Reset to defaults for new entry
        form.value = {
          month: 1,
          year: new Date().getFullYear(),
          financialYear: props.financialYear || getCurrentFinancialYear(),
          basicSalary: 0,
          hra: 0,
          conveyanceAllowance: 0,
          medicalAllowance: 0,
          specialAllowance: 0,
          specialPay: 0,
          otherAllowances: 0,
          epfDeduction: 0,
          vpfDeduction: 0,
          professionalTax: 0,
          tdsDeduction: 0,
          otherDeductions: 0,
          paidDays: 30,
          employerPf: 0,
          employerNps: 0,
          pensionFund: 0,
          superannuation: 0,
        };
      }
    }
  },
);

// Calculate year from FY and month
function calculateYearFromFY(fy: string, month: number): number {
  const [startYear] = fy.split("-").map(Number);
  // Months 1-9 (Apr-Dec) are in startYear, months 10-12 (Jan-Mar) are in startYear+1
  return month <= 9 ? startYear : startYear + 1;
}

// Update year based on month or FY selection
watch(
  [() => form.value.month, () => form.value.financialYear],
  ([month, fy]) => {
    form.value.year = calculateYearFromFY(fy, month);
  },
  { immediate: true },
);

// Computed totals
const grossEarnings = computed(() => {
  return (
    (form.value.basicSalary || 0) +
    (form.value.hra || 0) +
    (form.value.conveyanceAllowance || 0) +
    (form.value.medicalAllowance || 0) +
    (form.value.specialAllowance || 0) +
    (form.value.specialPay || 0) +
    (form.value.otherAllowances || 0)
  );
});

const totalDeductions = computed(() => {
  return (
    (form.value.epfDeduction || 0) +
    (form.value.vpfDeduction || 0) +
    (form.value.professionalTax || 0) +
    (form.value.tdsDeduction || 0) +
    (form.value.otherDeductions || 0)
  );
});

const netSalary = computed(() => {
  return grossEarnings.value - totalDeductions.value;
});

// Month options
const monthOptions = FY_MONTHS.map((m) => ({
  title: m.label,
  value: m.value,
}));

const fyOptions = getFinancialYearOptions();

// Form validation
const formRef = ref<HTMLFormElement | null>(null);
const rules = {
  required: (v: number | string) =>
    (v !== null && v !== undefined && v !== "") || "Required",
  positive: (v: number) => v >= 0 || "Must be 0 or greater",
};

const handleSave = () => {
  emit("save", form.value);
  isOpen.value = false;
};

// Show/hide employer contributions section
const showEmployerContributions = ref(false);
</script>

<template>
  <v-dialog v-model="isOpen" max-width="700" persistent>
    <v-card>
      <v-card-title class="d-flex align-center justify-space-between">
        <div class="d-flex align-center">
          <v-icon :icon="isEditing ? 'mdi-pencil' : 'mdi-plus'" class="mr-2" />
          {{ isEditing ? "Edit Salary" : "Add Salary Entry" }}
        </div>
        <v-btn icon="mdi-close" variant="text" @click="isOpen = false" />
      </v-card-title>

      <v-divider />

      <v-card-text class="pa-4">
        <v-form ref="formRef">
          <!-- Month & Year Selection -->
          <v-row>
            <v-col cols="12" sm="4">
              <v-select
                v-model="form.financialYear"
                :items="fyOptions"
                label="Financial Year"
                density="comfortable"
                variant="outlined"
              />
            </v-col>
            <v-col cols="12" sm="4">
              <v-select
                v-model="form.month"
                :items="monthOptions"
                label="Month"
                density="comfortable"
                variant="outlined"
              />
            </v-col>
            <v-col cols="12" sm="4">
              <v-text-field
                v-model.number="form.paidDays"
                label="Paid Days"
                type="number"
                density="comfortable"
                variant="outlined"
                :rules="[rules.required, rules.positive]"
              />
            </v-col>
          </v-row>

          <!-- Earnings Section -->
          <div class="mt-4">
            <div class="d-flex align-center justify-space-between mb-2">
              <span class="text-subtitle-2 font-weight-bold text-success"
                >EARNINGS</span
              >
              <v-chip color="success" size="small" variant="tonal">
                {{ formatINR(grossEarnings) }}
              </v-chip>
            </div>

            <v-row dense>
              <v-col cols="12" sm="6">
                <v-text-field
                  v-model.number="form.basicSalary"
                  label="Basic Salary *"
                  type="number"
                  prefix="₹"
                  density="comfortable"
                  variant="outlined"
                  :rules="[rules.required, rules.positive]"
                />
              </v-col>
              <v-col cols="12" sm="6">
                <v-text-field
                  v-model.number="form.hra"
                  label="House Rent Allowance"
                  type="number"
                  prefix="₹"
                  density="comfortable"
                  variant="outlined"
                  :rules="[rules.positive]"
                />
              </v-col>
              <v-col cols="12" sm="6">
                <v-text-field
                  v-model.number="form.conveyanceAllowance"
                  label="Conveyance Allowance"
                  type="number"
                  prefix="₹"
                  density="comfortable"
                  variant="outlined"
                  :rules="[rules.positive]"
                />
              </v-col>
              <v-col cols="12" sm="6">
                <v-text-field
                  v-model.number="form.medicalAllowance"
                  label="Medical Allowance"
                  type="number"
                  prefix="₹"
                  density="comfortable"
                  variant="outlined"
                  :rules="[rules.positive]"
                />
              </v-col>
              <v-col cols="12" sm="6">
                <v-text-field
                  v-model.number="form.specialAllowance"
                  label="Special Allowance"
                  type="number"
                  prefix="₹"
                  density="comfortable"
                  variant="outlined"
                  :rules="[rules.positive]"
                />
              </v-col>
              <v-col cols="12" sm="6">
                <v-text-field
                  v-model.number="form.specialPay"
                  label="Special Pay / Arrears"
                  type="number"
                  prefix="₹"
                  density="comfortable"
                  variant="outlined"
                  :rules="[rules.positive]"
                />
              </v-col>
              <v-col cols="12" sm="6">
                <v-text-field
                  v-model.number="form.otherAllowances"
                  label="Other Allowances"
                  type="number"
                  prefix="₹"
                  density="comfortable"
                  variant="outlined"
                  :rules="[rules.positive]"
                />
              </v-col>
            </v-row>
          </div>

          <v-divider class="my-4" />

          <!-- Deductions Section -->
          <div>
            <div class="d-flex align-center justify-space-between mb-2">
              <span class="text-subtitle-2 font-weight-bold text-error"
                >DEDUCTIONS</span
              >
              <v-chip color="error" size="small" variant="tonal">
                {{ formatINR(totalDeductions) }}
              </v-chip>
            </div>

            <v-row dense>
              <v-col cols="12" sm="6">
                <v-text-field
                  v-model.number="form.epfDeduction"
                  label="Provident Fund (EPF)"
                  type="number"
                  prefix="₹"
                  density="comfortable"
                  variant="outlined"
                  :rules="[rules.positive]"
                  hint="Syncs to EPF Account"
                  persistent-hint
                />
              </v-col>
              <v-col cols="12" sm="6">
                <v-text-field
                  v-model.number="form.vpfDeduction"
                  label="Voluntary PF (VPF)"
                  type="number"
                  prefix="₹"
                  density="comfortable"
                  variant="outlined"
                  :rules="[rules.positive]"
                  hint="Syncs to EPF Account"
                  persistent-hint
                />
              </v-col>
              <v-col cols="12" sm="6">
                <v-text-field
                  v-model.number="form.professionalTax"
                  label="Professional Tax"
                  type="number"
                  prefix="₹"
                  density="comfortable"
                  variant="outlined"
                  :rules="[rules.positive]"
                />
              </v-col>
              <v-col cols="12" sm="6">
                <v-text-field
                  v-model.number="form.tdsDeduction"
                  label="Income Tax (TDS)"
                  type="number"
                  prefix="₹"
                  density="comfortable"
                  variant="outlined"
                  :rules="[rules.positive]"
                />
              </v-col>
              <v-col cols="12" sm="6">
                <v-text-field
                  v-model.number="form.otherDeductions"
                  label="Other Deductions"
                  type="number"
                  prefix="₹"
                  density="comfortable"
                  variant="outlined"
                  :rules="[rules.positive]"
                />
              </v-col>
            </v-row>
          </div>

          <v-divider class="my-4" />

          <!-- Net Salary Display -->
          <div
            class="d-flex align-center justify-space-between py-3 px-4 bg-primary rounded"
          >
            <span class="text-subtitle-1 font-weight-bold text-white"
              >NET SALARY</span
            >
            <span class="text-h6 font-weight-bold text-white">{{
              formatINR(netSalary)
            }}</span>
          </div>

          <!-- Employer Contributions (Collapsible) -->
          <div class="mt-4">
            <v-btn
              variant="text"
              color="info"
              size="small"
              :prepend-icon="
                showEmployerContributions
                  ? 'mdi-chevron-up'
                  : 'mdi-chevron-down'
              "
              @click="showEmployerContributions = !showEmployerContributions"
            >
              Employer Contributions (Optional)
            </v-btn>

            <v-expand-transition>
              <div v-show="showEmployerContributions" class="mt-3">
                <v-alert
                  type="info"
                  variant="tonal"
                  density="compact"
                  class="mb-3"
                >
                  These are for tracking only - not deducted from your take-home
                  pay.
                </v-alert>

                <v-row dense>
                  <v-col cols="12" sm="6">
                    <v-text-field
                      v-model.number="form.employerPf"
                      label="Employer PF"
                      type="number"
                      prefix="₹"
                      density="comfortable"
                      variant="outlined"
                      :rules="[rules.positive]"
                    />
                  </v-col>
                  <v-col cols="12" sm="6">
                    <v-text-field
                      v-model.number="form.pensionFund"
                      label="Pension Fund (EPS)"
                      type="number"
                      prefix="₹"
                      density="comfortable"
                      variant="outlined"
                      :rules="[rules.positive]"
                    />
                  </v-col>
                  <v-col cols="12" sm="6">
                    <v-text-field
                      v-model.number="form.employerNps"
                      label="NPS (Employer)"
                      type="number"
                      prefix="₹"
                      density="comfortable"
                      variant="outlined"
                      :rules="[rules.positive]"
                      hint="80CCD(2) - 10%/14% of Basic"
                      persistent-hint
                    />
                  </v-col>
                  <v-col cols="12" sm="6">
                    <v-text-field
                      v-model.number="form.superannuation"
                      label="Superannuation"
                      type="number"
                      prefix="₹"
                      density="comfortable"
                      variant="outlined"
                      :rules="[rules.positive]"
                    />
                  </v-col>
                </v-row>
              </div>
            </v-expand-transition>
          </div>
        </v-form>
      </v-card-text>

      <v-divider />

      <v-card-actions class="pa-4">
        <v-spacer />
        <v-btn variant="text" @click="isOpen = false">Cancel</v-btn>
        <v-btn color="primary" variant="flat" @click="handleSave">
          {{ isEditing ? "Update" : "Save" }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
