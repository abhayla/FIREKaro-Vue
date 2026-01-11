<script setup lang="ts">
import { ref, computed, watch } from "vue";
import type { OtherIncome, OtherIncomeInput } from "@/types/income";
import { formatINR } from "@/composables/useIncome";
import {
  getCurrentFinancialYear,
  getFinancialYearOptions,
} from "@/types/salary";

interface Props {
  modelValue: boolean;
  editItem?: OtherIncome | null;
  defaultCategory?: OtherIncome["category"];
}

const props = withDefaults(defineProps<Props>(), {
  editItem: null,
  defaultCategory: "interest",
});

const emit = defineEmits<{
  (e: "update:modelValue", value: boolean): void;
  (e: "submit", data: OtherIncomeInput): void;
}>();

const dialog = computed({
  get: () => props.modelValue,
  set: (val) => emit("update:modelValue", val),
});

const isEdit = computed(() => !!props.editItem);

// Form fields
const form = ref<{
  category: OtherIncome["category"];
  subcategory: string;
  description: string;
  financialYear: string;
  grossAmount: number | null;
  tdsDeducted: number | null;
  sourceName: string;
  sourceType: string;
}>({
  category: props.defaultCategory,
  subcategory: "",
  description: "",
  financialYear: getCurrentFinancialYear(),
  grossAmount: null,
  tdsDeducted: null,
  sourceName: "",
  sourceType: "",
});

const categories = [
  { value: "interest", title: "Interest Income", icon: "mdi-percent" },
  { value: "dividend", title: "Dividend Income", icon: "mdi-cash-multiple" },
  { value: "commission", title: "Commission", icon: "mdi-handshake" },
  { value: "royalty", title: "Royalty", icon: "mdi-crown" },
  { value: "pension", title: "Pension", icon: "mdi-account-clock" },
  { value: "gift", title: "Gift", icon: "mdi-gift" },
  { value: "agricultural", title: "Agricultural Income", icon: "mdi-sprout" },
  { value: "other", title: "Other", icon: "mdi-dots-horizontal" },
];

const subcategoryOptions = computed(() => {
  switch (form.value.category) {
    case "interest":
      return [
        { value: "fd", title: "Fixed Deposit (FD)" },
        { value: "rd", title: "Recurring Deposit (RD)" },
        { value: "savings", title: "Savings Account" },
        { value: "p2p", title: "P2P Lending" },
        { value: "bonds", title: "Bonds/Debentures" },
        { value: "nsc", title: "NSC/Post Office" },
        { value: "other", title: "Other Interest" },
      ];
    case "dividend":
      return [
        { value: "stock", title: "Stock Dividend" },
        { value: "mf", title: "Mutual Fund Dividend" },
        { value: "reit", title: "REIT/InvIT" },
        { value: "other", title: "Other Dividend" },
      ];
    case "commission":
      return [
        { value: "referral", title: "Referral Bonus" },
        { value: "finder", title: "Finder's Fee" },
        { value: "affiliate", title: "Affiliate Commission" },
        { value: "other", title: "Other Commission" },
      ];
    case "pension":
      return [
        { value: "commuted", title: "Commuted Pension" },
        { value: "uncommuted", title: "Uncommuted Pension" },
        { value: "family", title: "Family Pension" },
      ];
    default:
      return [];
  }
});

const fyOptions = computed(() => getFinancialYearOptions());

const netAmount = computed(() => {
  return (form.value.grossAmount || 0) - (form.value.tdsDeducted || 0);
});

// 80TTA/80TTB eligibility info
const deductionInfo = computed(() => {
  if (form.value.category !== "interest") return null;
  if (form.value.subcategory !== "savings") return null;

  return {
    section: "80TTA / 80TTB",
    limit80TTA: 10000,
    limit80TTB: 50000,
    note: "80TTA: Rs.10,000 for non-seniors | 80TTB: Rs.50,000 for seniors (60+)",
  };
});

// Populate form when editing
watch(
  () => props.editItem,
  (item) => {
    if (item) {
      form.value = {
        category: item.category,
        subcategory: item.subcategory || "",
        description: item.description,
        financialYear: item.financialYear,
        grossAmount: item.grossAmount,
        tdsDeducted: item.tdsDeducted,
        sourceName: item.sourceName || "",
        sourceType: item.sourceType || "",
      };
    } else {
      resetForm();
    }
  },
  { immediate: true },
);

// Reset subcategory when category changes
watch(
  () => form.value.category,
  () => {
    if (!isEdit.value) {
      form.value.subcategory = "";
    }
  },
);

function resetForm() {
  form.value = {
    category: props.defaultCategory,
    subcategory: "",
    description: "",
    financialYear: getCurrentFinancialYear(),
    grossAmount: null,
    tdsDeducted: null,
    sourceName: "",
    sourceType: "",
  };
}

function handleSubmit() {
  const data: OtherIncomeInput = {
    category: form.value.category,
    subcategory: form.value.subcategory || undefined,
    description: form.value.description,
    financialYear: form.value.financialYear,
    grossAmount: form.value.grossAmount || 0,
    tdsDeducted: form.value.tdsDeducted || undefined,
    sourceName: form.value.sourceName || undefined,
    sourceType: form.value.sourceType || undefined,
  };
  emit("submit", data);
  dialog.value = false;
}
</script>

<template>
  <v-dialog v-model="dialog" max-width="600" persistent>
    <v-card>
      <v-card-title class="d-flex align-center">
        <v-icon class="mr-2">mdi-cash-plus</v-icon>
        {{ isEdit ? "Edit" : "Add" }} Other Income
      </v-card-title>

      <v-card-text>
        <v-form @submit.prevent="handleSubmit">
          <v-row>
            <!-- Category -->
            <v-col cols="12">
              <v-select
                v-model="form.category"
                label="Income Category *"
                :items="categories"
                item-value="value"
                item-title="title"
                required
                :rules="[(v) => !!v || 'Income category is required']"
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

            <!-- Subcategory -->
            <v-col v-if="subcategoryOptions.length > 0" cols="12" md="6">
              <v-select
                v-model="form.subcategory"
                label="Type"
                :items="subcategoryOptions"
                item-value="value"
                item-title="title"
                clearable
              />
            </v-col>

            <v-col cols="12" :md="subcategoryOptions.length > 0 ? 6 : 12">
              <v-select
                v-model="form.financialYear"
                label="Financial Year"
                :items="fyOptions"
              />
            </v-col>

            <!-- Description -->
            <v-col cols="12">
              <v-text-field
                v-model="form.description"
                label="Description *"
                placeholder="e.g., SBI FD Interest, HDFC Savings Interest"
                required
                :rules="[(v) => !!v || 'Description is required']"
              />
            </v-col>

            <!-- Source Details -->
            <v-col cols="12" md="6">
              <v-text-field
                v-model="form.sourceName"
                label="Source/Institution Name"
                placeholder="e.g., SBI, HDFC Bank"
              />
            </v-col>

            <v-col cols="12" md="6">
              <v-text-field
                v-model="form.sourceType"
                label="Account/Reference"
                placeholder="e.g., Account ending 1234"
              />
            </v-col>

            <!-- Amounts -->
            <v-col cols="12">
              <div class="text-subtitle-2 mb-2 text-medium-emphasis">
                Income Amount
              </div>
            </v-col>

            <v-col cols="12" md="6">
              <v-text-field
                v-model.number="form.grossAmount"
                label="Gross Amount *"
                type="number"
                prefix="Rs."
                required
                :rules="[(v) => v > 0 || 'Enter amount']"
              />
            </v-col>

            <v-col cols="12" md="6">
              <v-text-field
                v-model.number="form.tdsDeducted"
                label="TDS Deducted"
                type="number"
                prefix="Rs."
                hint="Tax deducted at source (if any)"
              />
            </v-col>

            <!-- Net Amount -->
            <v-col cols="12">
              <v-card variant="tonal" color="primary" class="pa-4">
                <div class="d-flex justify-space-between align-center">
                  <div>
                    <div class="text-body-2 text-medium-emphasis">
                      Net Amount Received
                    </div>
                    <div
                      v-if="form.tdsDeducted"
                      class="text-caption text-medium-emphasis"
                    >
                      After TDS: {{ formatINR(form.tdsDeducted || 0) }}
                    </div>
                  </div>
                  <div class="text-h5 text-currency font-weight-bold">
                    {{ formatINR(netAmount) }}
                  </div>
                </div>
              </v-card>
            </v-col>

            <!-- Deduction Info -->
            <v-col v-if="deductionInfo" cols="12">
              <v-alert type="info" variant="tonal" density="compact">
                <div class="text-body-2 font-weight-medium">
                  {{ deductionInfo.section }}
                </div>
                <div class="text-caption">{{ deductionInfo.note }}</div>
              </v-alert>
            </v-col>

            <!-- Agricultural Income Note -->
            <v-col v-if="form.category === 'agricultural'" cols="12">
              <v-alert type="info" variant="tonal" density="compact">
                <div class="text-body-2 font-weight-medium">
                  Agricultural Income is Exempt
                </div>
                <div class="text-caption">
                  Agricultural income is exempt under Section 10(1) but is added
                  for rate calculation if total income exceeds Rs.5,000 and
                  total taxable income exceeds basic exemption limit.
                </div>
              </v-alert>
            </v-col>

            <!-- Gift Exemption Note -->
            <v-col v-if="form.category === 'gift'" cols="12">
              <v-alert type="info" variant="tonal" density="compact">
                <div class="text-body-2 font-weight-medium">Gift Tax Rules</div>
                <div class="text-caption">
                  Gifts from relatives (spouse, siblings, parents, in-laws,
                  etc.) are fully exempt. Gifts from non-relatives above
                  Rs.50,000 in a year are taxable.
                </div>
              </v-alert>
            </v-col>

            <!-- Lottery/Winnings Note -->
            <v-col
              v-if="form.category === 'other' && form.subcategory === 'lottery'"
              cols="12"
            >
              <v-alert type="warning" variant="tonal" density="compact">
                <div class="text-body-2 font-weight-medium">30% Flat Tax</div>
                <div class="text-caption">
                  Lottery, game show winnings, and betting income are taxed at
                  30% flat rate (plus surcharge and cess). No deductions
                  allowed.
                </div>
              </v-alert>
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
          :disabled="!form.description || !form.grossAmount"
          @click="handleSubmit"
        >
          {{ isEdit ? "Update" : "Add" }} Income
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
