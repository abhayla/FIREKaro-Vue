<script setup lang="ts">
import { ref, computed, watch } from "vue";
import type {
  RentalIncome,
  RentalIncomeInput,
  PropertyType,
} from "@/types/income";
import {
  calculateSection24Deductions,
  SECTION_24_LIMITS,
} from "@/types/income";
import { formatINR } from "@/composables/useIncome";
import {
  getCurrentFinancialYear,
  getFinancialYearOptions,
} from "@/types/salary";

interface Props {
  modelValue: boolean;
  editItem?: RentalIncome | null;
}

const props = withDefaults(defineProps<Props>(), {
  editItem: null,
});

const emit = defineEmits<{
  (e: "update:modelValue", value: boolean): void;
  (e: "submit", data: RentalIncomeInput): void;
}>();

const dialog = computed({
  get: () => props.modelValue,
  set: (val) => emit("update:modelValue", val),
});

const isEdit = computed(() => !!props.editItem);

// Form fields
const form = ref<{
  propertyName: string;
  propertyType: PropertyType;
  propertyAddress: string;
  financialYear: string;
  monthlyRent: number | null;
  vacancyMonths: number;
  tenantName: string;
  tenantStartDate: string;
  municipalTaxesPaid: number | null;
  housingLoanInterest: number | null;
  isLetOut: boolean;
}>({
  propertyName: "",
  propertyType: "residential",
  propertyAddress: "",
  financialYear: getCurrentFinancialYear(),
  monthlyRent: null,
  vacancyMonths: 0,
  tenantName: "",
  tenantStartDate: "",
  municipalTaxesPaid: null,
  housingLoanInterest: null,
  isLetOut: true,
});

const propertyTypes: { value: PropertyType; title: string }[] = [
  { value: "residential", title: "Residential" },
  { value: "commercial", title: "Commercial" },
  { value: "land", title: "Land/Plot" },
];

const fyOptions = computed(() => getFinancialYearOptions());

// Calculate annual rent and deductions
const annualRent = computed(() => {
  const monthly = form.value.monthlyRent || 0;
  const occupiedMonths = 12 - form.value.vacancyMonths;
  return monthly * occupiedMonths;
});

const section24Calc = computed(() => {
  return calculateSection24Deductions(
    annualRent.value,
    form.value.municipalTaxesPaid || 0,
    form.value.housingLoanInterest || 0,
    form.value.isLetOut,
  );
});

// Populate form when editing
watch(
  () => props.editItem,
  (item) => {
    if (item) {
      form.value = {
        propertyName: item.propertyName,
        propertyType: item.propertyType,
        propertyAddress: item.propertyAddress,
        financialYear: item.financialYear,
        monthlyRent: item.monthlyRent,
        vacancyMonths: item.vacancyMonths,
        tenantName: item.tenantName || "",
        tenantStartDate: item.tenantStartDate || "",
        municipalTaxesPaid: item.municipalTaxesPaid,
        housingLoanInterest: item.housingLoanInterest,
        isLetOut: item.isLetOut,
      };
    } else {
      resetForm();
    }
  },
  { immediate: true },
);

function resetForm() {
  form.value = {
    propertyName: "",
    propertyType: "residential",
    propertyAddress: "",
    financialYear: getCurrentFinancialYear(),
    monthlyRent: null,
    vacancyMonths: 0,
    tenantName: "",
    tenantStartDate: "",
    municipalTaxesPaid: null,
    housingLoanInterest: null,
    isLetOut: true,
  };
}

function handleSubmit() {
  const data: RentalIncomeInput = {
    propertyName: form.value.propertyName,
    propertyType: form.value.propertyType,
    propertyAddress: form.value.propertyAddress,
    financialYear: form.value.financialYear,
    monthlyRent: form.value.monthlyRent || 0,
    vacancyMonths: form.value.vacancyMonths,
    tenantName: form.value.tenantName || undefined,
    tenantStartDate: form.value.tenantStartDate || undefined,
    municipalTaxesPaid: form.value.municipalTaxesPaid || undefined,
    housingLoanInterest: form.value.housingLoanInterest || undefined,
    isLetOut: form.value.isLetOut,
  };
  emit("submit", data);
  dialog.value = false;
}
</script>

<template>
  <v-dialog v-model="dialog" max-width="700" persistent>
    <v-card>
      <v-card-title class="d-flex align-center">
        <v-icon class="mr-2">mdi-home-city</v-icon>
        {{ isEdit ? "Edit" : "Add" }} Rental Income
      </v-card-title>

      <v-card-text>
        <v-form @submit.prevent="handleSubmit">
          <v-row>
            <!-- Property Details -->
            <v-col cols="12">
              <div class="text-subtitle-2 mb-2 text-medium-emphasis">
                Property Details
              </div>
            </v-col>

            <v-col cols="12" md="6">
              <v-text-field
                v-model="form.propertyName"
                label="Property Name *"
                placeholder="e.g., Green Tower Apt"
                required
                :rules="[(v) => !!v || 'Property name is required']"
              />
            </v-col>

            <v-col cols="12" md="6">
              <v-select
                v-model="form.propertyType"
                label="Property Type"
                :items="propertyTypes"
                item-value="value"
                item-title="title"
              />
            </v-col>

            <v-col cols="12">
              <v-textarea
                v-model="form.propertyAddress"
                label="Property Address"
                rows="2"
              />
            </v-col>

            <v-col cols="12" md="6">
              <v-select
                v-model="form.financialYear"
                label="Financial Year"
                :items="fyOptions"
              />
            </v-col>

            <v-col cols="12" md="6">
              <v-switch
                v-model="form.isLetOut"
                label="Property is let out (rented)"
                color="primary"
                hide-details
              />
            </v-col>

            <!-- Rental Income -->
            <v-col cols="12">
              <div class="text-subtitle-2 mb-2 text-medium-emphasis">
                Rental Income
              </div>
            </v-col>

            <v-col cols="12" md="4">
              <v-text-field
                v-model.number="form.monthlyRent"
                label="Monthly Rent *"
                type="number"
                prefix="Rs."
                required
                :rules="[(v) => v > 0 || 'Enter monthly rent']"
              />
            </v-col>

            <v-col cols="12" md="4">
              <v-select
                v-model="form.vacancyMonths"
                label="Vacancy Months"
                :items="[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]"
              />
            </v-col>

            <v-col cols="12" md="4">
              <v-text-field
                :model-value="formatINR(annualRent)"
                label="Annual Rent"
                readonly
                variant="outlined"
                bg-color="grey-lighten-4"
              />
            </v-col>

            <!-- Tenant Details -->
            <v-col cols="12">
              <div class="text-subtitle-2 mb-2 text-medium-emphasis">
                Tenant Details (Optional)
              </div>
            </v-col>

            <v-col cols="12" md="6">
              <v-text-field
                v-model="form.tenantName"
                label="Tenant Name"
                placeholder="Mr. Sharma"
              />
            </v-col>

            <v-col cols="12" md="6">
              <v-text-field
                v-model="form.tenantStartDate"
                label="Tenancy Start Date"
                type="date"
              />
            </v-col>

            <!-- Section 24 Deductions -->
            <v-col cols="12">
              <div class="text-subtitle-2 mb-2 text-medium-emphasis">
                Section 24 Deductions
              </div>
            </v-col>

            <v-col cols="12" md="6">
              <v-text-field
                v-model.number="form.municipalTaxesPaid"
                label="Municipal Taxes Paid"
                type="number"
                prefix="Rs."
                hint="Property tax, water tax, etc."
              />
            </v-col>

            <v-col cols="12" md="6">
              <v-text-field
                v-model.number="form.housingLoanInterest"
                label="Housing Loan Interest"
                type="number"
                prefix="Rs."
                :hint="
                  form.isLetOut
                    ? 'No limit for let-out property'
                    : `Max Rs.${formatINR(SECTION_24_LIMITS.selfOccupiedInterestLimit)} for self-occupied`
                "
              />
            </v-col>

            <!-- Section 24 Calculation Summary -->
            <v-col cols="12">
              <v-card variant="outlined" class="pa-4">
                <div class="text-subtitle-2 mb-3">Section 24 Calculation</div>

                <v-table density="compact" class="mb-4">
                  <tbody>
                    <tr>
                      <td>Gross Annual Value (GAV)</td>
                      <td class="text-right text-currency">
                        {{ formatINR(annualRent) }}
                      </td>
                    </tr>
                    <tr>
                      <td>Less: Municipal Taxes</td>
                      <td class="text-right text-currency text-negative">
                        -{{ formatINR(form.municipalTaxesPaid || 0) }}
                      </td>
                    </tr>
                    <tr>
                      <td>Net Annual Value (NAV)</td>
                      <td class="text-right text-currency font-weight-medium">
                        {{
                          formatINR(annualRent - (form.municipalTaxesPaid || 0))
                        }}
                      </td>
                    </tr>
                    <tr>
                      <td>Less: Standard Deduction (30%)</td>
                      <td class="text-right text-currency text-negative">
                        -{{ formatINR(section24Calc.standardDeduction) }}
                      </td>
                    </tr>
                    <tr>
                      <td>Less: Interest on Loan</td>
                      <td class="text-right text-currency text-negative">
                        -{{ formatINR(section24Calc.allowableInterest) }}
                      </td>
                    </tr>
                  </tbody>
                </v-table>

                <v-divider class="mb-3" />

                <div class="d-flex justify-space-between align-center">
                  <div>
                    <div class="text-body-2 font-weight-medium">
                      Taxable Rental Income
                    </div>
                    <div class="text-caption text-medium-emphasis">
                      Total Deduction:
                      {{ formatINR(section24Calc.totalDeduction) }}
                    </div>
                  </div>
                  <div
                    class="text-h5 text-currency font-weight-bold"
                    :class="
                      section24Calc.netAnnualValue >= 0
                        ? 'text-positive'
                        : 'text-negative'
                    "
                  >
                    {{ formatINR(section24Calc.netAnnualValue) }}
                  </div>
                </div>

                <v-alert
                  v-if="section24Calc.netAnnualValue < 0"
                  type="info"
                  variant="tonal"
                  density="compact"
                  class="mt-3"
                >
                  Negative rental income (loss) can be set off against other
                  income heads up to Rs.2 lakhs
                </v-alert>
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
          :disabled="!form.propertyName || !form.monthlyRent"
          @click="handleSubmit"
        >
          {{ isEdit ? "Update" : "Add" }} Property
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
