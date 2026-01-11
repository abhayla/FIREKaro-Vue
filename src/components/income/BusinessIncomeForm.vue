<script setup lang="ts">
import { ref, computed, watch } from "vue";
import type {
  BusinessIncome,
  BusinessIncomeInput,
  BusinessType,
  TaxationMethod,
} from "@/types/income";
import {
  PRESUMPTIVE_TAX_LIMITS,
  calculate44ADProfit,
  calculate44ADAProfit,
} from "@/types/income";
import { formatINR } from "@/composables/useIncome";
import {
  getCurrentFinancialYear,
  getFinancialYearOptions,
} from "@/types/salary";

interface Props {
  modelValue: boolean;
  editItem?: BusinessIncome | null;
}

const props = withDefaults(defineProps<Props>(), {
  editItem: null,
});

const emit = defineEmits<{
  (e: "update:modelValue", value: boolean): void;
  (e: "submit", data: BusinessIncomeInput): void;
}>();

const dialog = computed({
  get: () => props.modelValue,
  set: (val) => emit("update:modelValue", val),
});

const isEdit = computed(() => !!props.editItem);

// Form fields
const form = ref<{
  businessName: string;
  businessType: BusinessType;
  taxationMethod: TaxationMethod;
  financialYear: string;
  grossReceipts: number | null;
  digitalPaymentPercentage: number;
  totalExpenses: number | null;
  depreciation: number | null;
  isGstRegistered: boolean;
  gstin: string;
}>({
  businessName: "",
  businessType: "proprietorship",
  taxationMethod: "44AD",
  financialYear: getCurrentFinancialYear(),
  grossReceipts: null,
  digitalPaymentPercentage: 50,
  totalExpenses: null,
  depreciation: null,
  isGstRegistered: false,
  gstin: "",
});

const businessTypes: { value: BusinessType; title: string }[] = [
  { value: "proprietorship", title: "Proprietorship" },
  { value: "partnership", title: "Partnership" },
  { value: "freelance", title: "Freelance" },
  { value: "commission_agent", title: "Commission Agent" },
];

const taxationMethods: {
  value: TaxationMethod;
  title: string;
  subtitle: string;
}[] = [
  {
    value: "44AD",
    title: "Section 44AD",
    subtitle: "Business - 8% (6% digital)",
  },
  {
    value: "44ADA",
    title: "Section 44ADA",
    subtitle: "Profession - 50% deemed profit",
  },
  {
    value: "regular_books",
    title: "Regular Books",
    subtitle: "Maintain P&L statement",
  },
];

const fyOptions = computed(() => getFinancialYearOptions());

// Calculate deemed profit based on taxation method
const deemedProfit = computed(() => {
  const receipts = form.value.grossReceipts || 0;

  if (form.value.taxationMethod === "44AD") {
    const { deemedProfit } = calculate44ADProfit(
      receipts,
      form.value.digitalPaymentPercentage,
    );
    return deemedProfit;
  }

  if (form.value.taxationMethod === "44ADA") {
    return calculate44ADAProfit(receipts);
  }

  // Regular books - actual profit
  const expenses =
    (form.value.totalExpenses || 0) + (form.value.depreciation || 0);
  return receipts - expenses;
});

const effectiveRate = computed(() => {
  const receipts = form.value.grossReceipts || 0;
  if (receipts === 0) return 0;
  return (deemedProfit.value / receipts) * 100;
});

// Eligibility check
const eligibilityError = computed(() => {
  const receipts = form.value.grossReceipts || 0;

  if (form.value.taxationMethod === "44AD") {
    if (receipts > PRESUMPTIVE_TAX_LIMITS["44AD"].turnoverLimit) {
      return `Turnover exceeds Rs.2 Crore limit for 44AD. Consider switching to Regular Books.`;
    }
  }

  if (form.value.taxationMethod === "44ADA") {
    if (receipts > PRESUMPTIVE_TAX_LIMITS["44ADA"].receiptsLimit) {
      return `Gross receipts exceed Rs.50 Lakhs limit for 44ADA. Consider switching to Regular Books.`;
    }
  }

  return null;
});

// GSTIN validation
const gstinRules = [
  (v: string) => !form.value.isGstRegistered || !!v || "GSTIN is required",
  (v: string) =>
    !v ||
    /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(v) ||
    "Invalid GSTIN format",
];

// Populate form when editing
watch(
  () => props.editItem,
  (item) => {
    if (item) {
      form.value = {
        businessName: item.businessName,
        businessType: item.businessType,
        taxationMethod: item.taxationMethod,
        financialYear: item.financialYear,
        grossReceipts: item.grossReceipts,
        digitalPaymentPercentage: item.digitalPaymentPercentage,
        totalExpenses: item.totalExpenses || null,
        depreciation: item.depreciation || null,
        isGstRegistered: item.isGstRegistered,
        gstin: item.gstin || "",
      };
    } else {
      resetForm();
    }
  },
  { immediate: true },
);

function resetForm() {
  form.value = {
    businessName: "",
    businessType: "proprietorship",
    taxationMethod: "44AD",
    financialYear: getCurrentFinancialYear(),
    grossReceipts: null,
    digitalPaymentPercentage: 50,
    totalExpenses: null,
    depreciation: null,
    isGstRegistered: false,
    gstin: "",
  };
}

function handleSubmit() {
  const data: BusinessIncomeInput = {
    businessName: form.value.businessName,
    businessType: form.value.businessType,
    taxationMethod: form.value.taxationMethod,
    financialYear: form.value.financialYear,
    grossReceipts: form.value.grossReceipts || 0,
    digitalPaymentPercentage: form.value.digitalPaymentPercentage,
    totalExpenses: form.value.totalExpenses || undefined,
    depreciation: form.value.depreciation || undefined,
    isGstRegistered: form.value.isGstRegistered,
    gstin: form.value.gstin || undefined,
  };
  emit("submit", data);
  dialog.value = false;
}
</script>

<template>
  <v-dialog v-model="dialog" max-width="700" persistent>
    <v-card>
      <v-card-title class="d-flex align-center">
        <v-icon class="mr-2">mdi-store</v-icon>
        {{ isEdit ? "Edit" : "Add" }} Business/Profession Income
      </v-card-title>

      <v-card-text>
        <v-form @submit.prevent="handleSubmit">
          <v-row>
            <!-- Business Details -->
            <v-col cols="12">
              <div class="text-subtitle-2 mb-2 text-medium-emphasis">
                Business Details
              </div>
            </v-col>

            <v-col cols="12" md="6">
              <v-text-field
                v-model="form.businessName"
                label="Business/Firm Name *"
                required
                :rules="[(v) => !!v || 'Business name is required']"
              />
            </v-col>

            <v-col cols="12" md="6">
              <v-select
                v-model="form.businessType"
                label="Business Type *"
                :items="businessTypes"
                item-value="value"
                item-title="title"
                required
                :rules="[(v) => !!v || 'Business type is required']"
              />
            </v-col>

            <v-col cols="12" md="6">
              <v-select
                v-model="form.financialYear"
                label="Financial Year"
                :items="fyOptions"
              />
            </v-col>

            <!-- Taxation Method -->
            <v-col cols="12">
              <div class="text-subtitle-2 mb-2 text-medium-emphasis">
                Taxation Method
              </div>
              <v-radio-group v-model="form.taxationMethod" inline>
                <v-radio
                  v-for="method in taxationMethods"
                  :key="method.value"
                  :value="method.value"
                >
                  <template #label>
                    <div>
                      <div class="text-body-2">{{ method.title }}</div>
                      <div class="text-caption text-medium-emphasis">
                        {{ method.subtitle }}
                      </div>
                    </div>
                  </template>
                </v-radio>
              </v-radio-group>
            </v-col>

            <!-- Eligibility Warning -->
            <v-col v-if="eligibilityError" cols="12">
              <v-alert type="warning" variant="tonal" density="compact">
                {{ eligibilityError }}
              </v-alert>
            </v-col>

            <!-- Gross Receipts -->
            <v-col cols="12">
              <div class="text-subtitle-2 mb-2 text-medium-emphasis">
                Income Details
              </div>
            </v-col>

            <v-col cols="12" md="6">
              <v-text-field
                v-model.number="form.grossReceipts"
                label="Gross Receipts / Turnover *"
                type="number"
                prefix="Rs."
                required
                :rules="[(v) => v > 0 || 'Enter gross receipts']"
              />
            </v-col>

            <!-- Digital Payment % for 44AD -->
            <v-col v-if="form.taxationMethod === '44AD'" cols="12" md="6">
              <v-slider
                v-model="form.digitalPaymentPercentage"
                label="Digital Payments %"
                min="0"
                max="100"
                step="5"
                thumb-label
                class="mt-4"
              >
                <template #append>
                  <span class="text-body-2"
                    >{{ form.digitalPaymentPercentage }}%</span
                  >
                </template>
              </v-slider>
              <div class="text-caption text-medium-emphasis">
                Higher digital payments = Lower deemed profit (6% vs 8%)
              </div>
            </v-col>

            <!-- Regular Books - Expenses -->
            <template v-if="form.taxationMethod === 'regular_books'">
              <v-col cols="12" md="6">
                <v-text-field
                  v-model.number="form.totalExpenses"
                  label="Total Business Expenses"
                  type="number"
                  prefix="Rs."
                />
              </v-col>

              <v-col cols="12" md="6">
                <v-text-field
                  v-model.number="form.depreciation"
                  label="Depreciation"
                  type="number"
                  prefix="Rs."
                />
              </v-col>
            </template>

            <!-- Profit Summary -->
            <v-col cols="12">
              <v-card variant="tonal" color="primary" class="pa-4">
                <div class="d-flex justify-space-between align-center">
                  <div>
                    <div class="text-body-2 text-medium-emphasis">
                      {{
                        form.taxationMethod === "regular_books"
                          ? "Net Profit"
                          : "Deemed Profit"
                      }}
                    </div>
                    <div class="text-caption text-medium-emphasis">
                      Effective Rate: {{ effectiveRate.toFixed(1) }}%
                    </div>
                  </div>
                  <div class="text-h5 text-currency font-weight-bold">
                    {{ formatINR(deemedProfit) }}
                  </div>
                </div>
              </v-card>
            </v-col>

            <!-- GST Details -->
            <v-col cols="12">
              <div class="text-subtitle-2 mb-2 text-medium-emphasis">
                GST Registration
              </div>
            </v-col>

            <v-col cols="12">
              <v-switch
                v-model="form.isGstRegistered"
                label="GST Registered"
                color="primary"
                hide-details
              />
            </v-col>

            <v-col v-if="form.isGstRegistered" cols="12" md="6">
              <v-text-field
                v-model="form.gstin"
                label="GSTIN"
                placeholder="22AAAAA0000A1Z5"
                :rules="gstinRules"
              />
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
            !form.businessName || !form.grossReceipts || !!eligibilityError
          "
          @click="handleSubmit"
        >
          {{ isEdit ? "Update" : "Add" }} Business
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
