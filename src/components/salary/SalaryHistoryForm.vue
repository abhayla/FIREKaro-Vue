<script setup lang="ts">
import { ref, computed, watch } from "vue";
import type { SalaryHistoryRecord, SalaryHistoryInput, IncomeSource } from "@/types/salary";
import {
  FY_MONTHS,
  getCurrentFinancialYear,
  getFinancialYearOptions,
} from "@/types/salary";
import {
  formatINR,
  useSalaryIncomeSources,
  useCreateIncomeSource,
  useSalaryComponents,
} from "@/composables/useSalary";

const props = defineProps<{
  modelValue: boolean;
  record?: SalaryHistoryRecord | null;
  financialYear?: string;
  preselectedMonth?: number;
  preselectedIncomeSourceId?: string;
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

// Get dynamic component definitions
const { earnings, deductions, employerContributions, getComponent } = useSalaryComponents();

// Employer/Income Source management
const { data: incomeSources, isLoading: loadingEmployers } = useSalaryIncomeSources();
const createEmployerMutation = useCreateIncomeSource();
const showNewEmployerDialog = ref(false);
const newEmployerName = ref("");

const employerOptions = computed(() => {
  const options = (incomeSources.value || []).map((src: IncomeSource) => ({
    title: src.sourceName,
    value: src.id,
    subtitle: src.isPrimary ? "Primary" : undefined,
  }));
  // Add "Add new employer" option
  options.push({
    title: "+ Add New Employer",
    value: "__new__",
    subtitle: undefined,
  });
  return options;
});

const handleEmployerChange = (value: string) => {
  if (value === "__new__") {
    showNewEmployerDialog.value = true;
    form.value.incomeSourceId = undefined;
  } else {
    form.value.incomeSourceId = value;
    // Set employer name from selected source
    const source = incomeSources.value?.find((s: IncomeSource) => s.id === value);
    if (source) {
      form.value.employerName = source.sourceName;
    }
  }
};

const createNewEmployer = async () => {
  if (!newEmployerName.value.trim()) return;

  try {
    const newSource = await createEmployerMutation.mutateAsync({
      sourceName: newEmployerName.value.trim(),
      financialYear: form.value.financialYear,
      isPrimary: !incomeSources.value?.length,
    });
    form.value.incomeSourceId = newSource.id;
    form.value.employerName = newSource.sourceName;
    showNewEmployerDialog.value = false;
    newEmployerName.value = "";
  } catch (error) {
    console.error("Failed to create employer:", error);
  }
};

// Form data
const form = ref<SalaryHistoryInput>({
  month: 1,
  year: new Date().getFullYear(),
  financialYear: props.financialYear || getCurrentFinancialYear(),
  incomeSourceId: undefined,
  employerName: undefined,
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

// Expandable sections state
const showOtherDeductions = ref(false);
const showOtherAllowances = ref(false);
const showEmployerContributions = ref(false);

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
          incomeSourceId: props.record.incomeSourceId,
          employerName: props.record.employerName,
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
        // Expand sections if they have values
        showOtherDeductions.value = !!(props.record.vpfDeduction || props.record.otherDeductions);
        showOtherAllowances.value = !!(props.record.specialPay || props.record.otherAllowances);
        showEmployerContributions.value = !!(props.record.employerPf || props.record.employerNps || props.record.pensionFund);
      } else {
        // Reset to defaults for new entry
        const initialMonth = props.preselectedMonth || 1;
        form.value = {
          month: initialMonth,
          year: new Date().getFullYear(),
          financialYear: props.financialYear || getCurrentFinancialYear(),
          incomeSourceId: props.preselectedIncomeSourceId || undefined,
          employerName: undefined,
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
        showOtherDeductions.value = false;
        showOtherAllowances.value = false;
        showEmployerContributions.value = false;

        // Set employer name if preselected
        if (props.preselectedIncomeSourceId) {
          const source = incomeSources.value?.find((s: IncomeSource) => s.id === props.preselectedIncomeSourceId);
          if (source) {
            form.value.employerName = source.sourceName;
          }
        }
        // Set default employer if only one exists
        else if (incomeSources.value?.length === 1) {
          form.value.incomeSourceId = incomeSources.value[0].id;
          form.value.employerName = incomeSources.value[0].sourceName;
        }
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

// Other deductions breakdown total
const otherDeductionsTotal = computed(() => {
  return (form.value.vpfDeduction || 0) + (form.value.otherDeductions || 0);
});

// Other allowances breakdown total
const otherAllowancesTotal = computed(() => {
  return (form.value.specialPay || 0) + (form.value.otherAllowances || 0);
});

// Total employer contributions
const totalEmployerContributions = computed(() => {
  return (
    (form.value.employerPf || 0) +
    (form.value.pensionFund || 0) +
    (form.value.employerNps || 0) +
    (form.value.superannuation || 0)
  );
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

// Check if a component has sync capability
const hasSyncTarget = (code: string): boolean => {
  const comp = getComponent(code);
  return !!comp?.syncTarget;
};

// Get sync tooltip text
const getSyncTooltip = (code: string): string => {
  const comp = getComponent(code);
  if (!comp?.syncTarget) return "";

  const targetMap: Record<string, string> = {
    EPF: "Syncs to EPF Account",
    VPF: "Syncs to EPF Account (VPF)",
    NPS_EMPLOYER: "Syncs to NPS Account",
    EPS: "Syncs to EPF Account (Pension)",
    SUPERANNUATION: "Syncs to Superannuation Fund",
  };
  return targetMap[comp.syncTarget] || "";
};
</script>

<template>
  <v-dialog v-model="isOpen" max-width="750" persistent data-testid="dialog-salary-form">
    <v-card>
      <v-card-title class="d-flex align-center justify-space-between bg-primary">
        <div class="d-flex align-center text-white">
          <v-icon :icon="isEditing ? 'mdi-pencil' : 'mdi-plus'" class="mr-2" />
          {{ isEditing ? "Edit Salary Entry" : "Add Salary Entry" }}
        </div>
        <v-btn icon="mdi-close" variant="text" color="white" @click="isOpen = false" />
      </v-card-title>

      <v-card-text class="pa-4">
        <v-form ref="formRef">
          <!-- Header Row: Employer + Month Selection -->
          <v-card variant="outlined" class="mb-4">
            <v-card-text class="pb-2">
              <v-row>
                <v-col cols="12" md="6">
                  <v-select
                    :model-value="form.incomeSourceId"
                    :items="employerOptions"
                    item-title="title"
                    item-value="value"
                    label="Employer"
                    density="comfortable"
                    variant="outlined"
                    :loading="loadingEmployers"
                    prepend-inner-icon="mdi-domain"
                    @update:model-value="handleEmployerChange"
                  >
                    <template #item="{ item, props: itemProps }">
                      <v-list-item v-bind="itemProps" :subtitle="item.raw.subtitle">
                        <template v-if="item.value === '__new__'" #prepend>
                          <v-icon color="primary">mdi-plus-circle</v-icon>
                        </template>
                      </v-list-item>
                    </template>
                  </v-select>
                </v-col>
                <v-col cols="6" md="3">
                  <v-select
                    v-model="form.financialYear"
                    :items="fyOptions"
                    label="Financial Year"
                    density="comfortable"
                    variant="outlined"
                    prepend-inner-icon="mdi-calendar-range"
                  />
                </v-col>
                <v-col cols="6" md="3">
                  <v-select
                    v-model="form.month"
                    :items="monthOptions"
                    label="Month"
                    density="comfortable"
                    variant="outlined"
                    prepend-inner-icon="mdi-calendar"
                  />
                </v-col>
              </v-row>
            </v-card-text>
          </v-card>

          <!-- EARNINGS Section -->
          <v-card variant="outlined" class="mb-4 earnings-section">
            <v-card-title class="d-flex align-center justify-space-between py-2 px-4 bg-success-lighten-5">
              <div class="d-flex align-center">
                <v-icon icon="mdi-plus-circle" color="success" class="mr-2" size="small" />
                <span class="text-subtitle-2 font-weight-bold">EARNINGS</span>
              </div>
              <v-chip color="success" size="small" variant="flat">
                {{ formatINR(grossEarnings) }}
              </v-chip>
            </v-card-title>
            <v-card-text class="pt-4">
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
                    class="currency-input"
                  />
                </v-col>
                <v-col cols="12" sm="6">
                  <v-text-field
                    v-model.number="form.hra"
                    label="House Rent Allowance (HRA)"
                    type="number"
                    prefix="₹"
                    density="comfortable"
                    variant="outlined"
                    :rules="[rules.positive]"
                    class="currency-input"
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
                    class="currency-input"
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
                    class="currency-input"
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
                    class="currency-input"
                  />
                </v-col>

                <!-- Other Allowances (expandable) -->
                <v-col cols="12" sm="6">
                  <v-text-field
                    :model-value="otherAllowancesTotal"
                    label="Other Allowances"
                    type="number"
                    prefix="₹"
                    density="comfortable"
                    variant="outlined"
                    readonly
                    class="expandable-field"
                    @click="showOtherAllowances = !showOtherAllowances"
                  >
                    <template #append-inner>
                      <v-icon
                        :icon="showOtherAllowances ? 'mdi-chevron-up' : 'mdi-chevron-down'"
                        size="small"
                        color="primary"
                      />
                    </template>
                  </v-text-field>
                </v-col>
              </v-row>

              <!-- Expandable Other Allowances -->
              <v-expand-transition>
                <div v-show="showOtherAllowances">
                  <v-card variant="flat" class="pa-3 mt-2 bg-grey-lighten-5 rounded">
                    <div class="text-caption text-medium-emphasis mb-2 d-flex align-center">
                      <v-icon icon="mdi-subdirectory-arrow-right" size="small" class="mr-1" />
                      Other Allowances Breakdown
                    </div>
                    <v-row dense>
                      <v-col cols="6">
                        <v-text-field
                          v-model.number="form.specialPay"
                          label="Special Pay / Arrears"
                          type="number"
                          prefix="₹"
                          density="compact"
                          variant="outlined"
                          :rules="[rules.positive]"
                        />
                      </v-col>
                      <v-col cols="6">
                        <v-text-field
                          v-model.number="form.otherAllowances"
                          label="Misc Allowances"
                          type="number"
                          prefix="₹"
                          density="compact"
                          variant="outlined"
                          :rules="[rules.positive]"
                        />
                      </v-col>
                    </v-row>
                  </v-card>
                </div>
              </v-expand-transition>
            </v-card-text>
          </v-card>

          <!-- DEDUCTIONS Section -->
          <v-card variant="outlined" class="mb-4 deductions-section">
            <v-card-title class="d-flex align-center justify-space-between py-2 px-4 bg-error-lighten-5">
              <div class="d-flex align-center">
                <v-icon icon="mdi-minus-circle" color="error" class="mr-2" size="small" />
                <span class="text-subtitle-2 font-weight-bold">DEDUCTIONS</span>
              </div>
              <v-chip color="error" size="small" variant="flat">
                {{ formatINR(totalDeductions) }}
              </v-chip>
            </v-card-title>
            <v-card-text class="pt-4">
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
                    class="currency-input"
                  >
                    <template #append-inner>
                      <v-tooltip :text="getSyncTooltip('EPF')">
                        <template #activator="{ props: tooltipProps }">
                          <v-icon v-bind="tooltipProps" color="primary" size="small">mdi-link</v-icon>
                        </template>
                      </v-tooltip>
                    </template>
                  </v-text-field>
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
                    class="currency-input"
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
                    class="currency-input"
                  />
                </v-col>

                <!-- Other Deductions (expandable - VPF, NPS, etc.) -->
                <v-col cols="12" sm="6">
                  <v-text-field
                    :model-value="otherDeductionsTotal"
                    label="Other Deductions"
                    type="number"
                    prefix="₹"
                    density="comfortable"
                    variant="outlined"
                    readonly
                    class="expandable-field"
                    @click="showOtherDeductions = !showOtherDeductions"
                  >
                    <template #append-inner>
                      <v-icon
                        :icon="showOtherDeductions ? 'mdi-chevron-up' : 'mdi-chevron-down'"
                        size="small"
                        color="primary"
                      />
                    </template>
                  </v-text-field>
                </v-col>
              </v-row>

              <!-- Expandable Other Deductions -->
              <v-expand-transition>
                <div v-show="showOtherDeductions">
                  <v-card variant="flat" class="pa-3 mt-2 bg-grey-lighten-5 rounded">
                    <div class="text-caption text-medium-emphasis mb-2 d-flex align-center">
                      <v-icon icon="mdi-subdirectory-arrow-right" size="small" class="mr-1" />
                      Other Deductions Breakdown
                    </div>
                    <v-row dense>
                      <v-col cols="6">
                        <v-text-field
                          v-model.number="form.vpfDeduction"
                          label="Voluntary PF (VPF)"
                          type="number"
                          prefix="₹"
                          density="compact"
                          variant="outlined"
                          :rules="[rules.positive]"
                        >
                          <template #append-inner>
                            <v-tooltip :text="getSyncTooltip('VPF')">
                              <template #activator="{ props: tooltipProps }">
                                <v-icon v-bind="tooltipProps" color="primary" size="x-small">mdi-link</v-icon>
                              </template>
                            </v-tooltip>
                          </template>
                        </v-text-field>
                      </v-col>
                      <v-col cols="6">
                        <v-text-field
                          v-model.number="form.otherDeductions"
                          label="Misc Deductions"
                          type="number"
                          prefix="₹"
                          density="compact"
                          variant="outlined"
                          :rules="[rules.positive]"
                        />
                      </v-col>
                    </v-row>
                  </v-card>
                </div>
              </v-expand-transition>
            </v-card-text>
          </v-card>

          <!-- NET SALARY Summary -->
          <v-card class="mb-4 net-salary-card" color="primary" variant="flat">
            <v-card-text class="d-flex align-center justify-space-between py-4">
              <div>
                <div class="text-caption text-white-darken-2">Paid Days: {{ form.paidDays }}</div>
                <div class="text-subtitle-1 font-weight-bold text-white">NET SALARY (A - B)</div>
              </div>
              <div class="text-h5 font-weight-bold text-white text-currency">
                {{ formatINR(netSalary) }}
              </div>
            </v-card-text>
          </v-card>

          <!-- Paid Days (inline edit) -->
          <v-row class="mb-2">
            <v-col cols="12" sm="4">
              <v-text-field
                v-model.number="form.paidDays"
                label="Paid Days"
                type="number"
                density="compact"
                variant="outlined"
                :rules="[rules.required, rules.positive]"
                prepend-inner-icon="mdi-calendar-check"
              />
            </v-col>
          </v-row>

          <!-- Employer Contributions (Collapsible) -->
          <v-card variant="outlined" class="employer-section">
            <v-card-title
              class="d-flex align-center justify-space-between py-2 px-4 cursor-pointer"
              @click="showEmployerContributions = !showEmployerContributions"
            >
              <div class="d-flex align-center">
                <v-icon icon="mdi-office-building" color="info" class="mr-2" size="small" />
                <span class="text-subtitle-2">EMPLOYER CONTRIBUTIONS</span>
                <v-chip size="x-small" variant="tonal" color="info" class="ml-2">
                  Optional
                </v-chip>
              </div>
              <div class="d-flex align-center">
                <span v-if="totalEmployerContributions > 0" class="text-caption text-info mr-2">
                  {{ formatINR(totalEmployerContributions) }}
                </span>
                <v-icon
                  :icon="showEmployerContributions ? 'mdi-chevron-up' : 'mdi-chevron-down'"
                  size="small"
                />
              </div>
            </v-card-title>

            <v-expand-transition>
              <div v-show="showEmployerContributions">
                <v-divider />
                <v-card-text class="pt-4">
                  <v-alert type="info" variant="tonal" density="compact" class="mb-4">
                    These are for tracking only - not deducted from your take-home pay.
                  </v-alert>

                  <v-row dense>
                    <v-col cols="12" sm="6">
                      <v-text-field
                        v-model.number="form.employerPf"
                        label="Employer PF (3.67%)"
                        type="number"
                        prefix="₹"
                        density="comfortable"
                        variant="outlined"
                        :rules="[rules.positive]"
                      >
                        <template #append-inner>
                          <v-tooltip text="Syncs to EPF Account">
                            <template #activator="{ props: tooltipProps }">
                              <v-icon v-bind="tooltipProps" color="primary" size="small">mdi-link</v-icon>
                            </template>
                          </v-tooltip>
                        </template>
                      </v-text-field>
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
                      >
                        <template #append-inner>
                          <v-tooltip text="Syncs to EPF Account (Pension)">
                            <template #activator="{ props: tooltipProps }">
                              <v-icon v-bind="tooltipProps" color="primary" size="small">mdi-link</v-icon>
                            </template>
                          </v-tooltip>
                        </template>
                      </v-text-field>
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
                      >
                        <template #append-inner>
                          <v-tooltip text="Syncs to NPS Account">
                            <template #activator="{ props: tooltipProps }">
                              <v-icon v-bind="tooltipProps" color="secondary" size="small">mdi-link</v-icon>
                            </template>
                          </v-tooltip>
                        </template>
                      </v-text-field>
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
                      >
                        <template #append-inner>
                          <v-tooltip text="Syncs to Superannuation Fund">
                            <template #activator="{ props: tooltipProps }">
                              <v-icon v-bind="tooltipProps" color="info" size="small">mdi-link</v-icon>
                            </template>
                          </v-tooltip>
                        </template>
                      </v-text-field>
                    </v-col>
                  </v-row>
                </v-card-text>
              </div>
            </v-expand-transition>
          </v-card>
        </v-form>
      </v-card-text>

      <v-divider />

      <v-card-actions class="pa-4">
        <v-chip size="small" variant="tonal" color="info">
          <v-icon icon="mdi-link" size="x-small" class="mr-1" />
          = Syncs to accounts
        </v-chip>
        <v-spacer />
        <v-btn variant="text" data-testid="btn-cancel" @click="isOpen = false">Cancel</v-btn>
        <v-btn color="primary" variant="flat" data-testid="btn-save" @click="handleSave">
          {{ isEditing ? "Update" : "Save Entry" }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>

  <!-- New Employer Dialog -->
  <v-dialog v-model="showNewEmployerDialog" max-width="400" persistent>
    <v-card>
      <v-card-title class="d-flex align-center bg-primary text-white">
        <v-icon icon="mdi-domain-plus" class="mr-2" />
        Add New Employer
      </v-card-title>
      <v-card-text class="pt-4">
        <v-text-field
          v-model="newEmployerName"
          label="Employer Name"
          placeholder="e.g., Infosys, TCS, Wipro"
          density="comfortable"
          variant="outlined"
          autofocus
          prepend-inner-icon="mdi-domain"
          @keyup.enter="createNewEmployer"
        />
        <div class="text-caption text-medium-emphasis">
          This will create a new salary income source for tracking this employer's salary separately.
        </div>
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn variant="text" @click="showNewEmployerDialog = false; newEmployerName = ''">
          Cancel
        </v-btn>
        <v-btn
          color="primary"
          variant="flat"
          :loading="createEmployerMutation.isPending.value"
          :disabled="!newEmployerName.trim()"
          @click="createNewEmployer"
        >
          Add Employer
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<style scoped>
.currency-input :deep(input) {
  font-family: 'JetBrains Mono', monospace;
}

.expandable-field {
  cursor: pointer;
}

.expandable-field :deep(.v-field) {
  background: rgba(var(--v-theme-primary), 0.02);
}

.expandable-field:hover :deep(.v-field) {
  background: rgba(var(--v-theme-primary), 0.05);
}

.earnings-section :deep(.v-card-title) {
  background: rgba(var(--v-theme-success), 0.08);
}

.deductions-section :deep(.v-card-title) {
  background: rgba(var(--v-theme-error), 0.08);
}

.employer-section :deep(.v-card-title) {
  background: rgba(var(--v-theme-info), 0.05);
}

.net-salary-card {
  background: linear-gradient(135deg, rgb(var(--v-theme-primary)) 0%, rgb(var(--v-theme-primary-darken-1)) 100%);
}

.cursor-pointer {
  cursor: pointer;
}
</style>
