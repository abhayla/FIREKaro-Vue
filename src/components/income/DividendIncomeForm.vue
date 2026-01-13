<script setup lang="ts">
import { ref, watch, computed } from "vue";
import { useForm } from "vee-validate";
import { toTypedSchema } from "@vee-validate/zod";
import { z } from "zod";
import type { DividendIncome, DividendIncomeInput } from "@/types/income";

const props = defineProps<{
  modelValue: boolean;
  editingItem?: DividendIncome | null;
  loading?: boolean;
  fiscalYear: string;
}>();

const emit = defineEmits<{
  (e: "update:modelValue", value: boolean): void;
  (e: "submit", data: DividendIncomeInput): void;
  (e: "cancel"): void;
}>();

const isOpen = computed({
  get: () => props.modelValue,
  set: (value) => emit("update:modelValue", value),
});

const isEditing = computed(() => !!props.editingItem);

const sourceTypes = [
  { title: "Stock", value: "STOCK" },
  { title: "Mutual Fund", value: "MUTUAL_FUND" },
  { title: "REIT", value: "REIT" },
  { title: "InvIT", value: "INVIT" },
];

const dividendTypes = [
  { title: "Interim", value: "INTERIM" },
  { title: "Final", value: "FINAL" },
  { title: "Special", value: "SPECIAL" },
];

const schema = toTypedSchema(
  z.object({
    sourceType: z.enum(["STOCK", "MUTUAL_FUND", "REIT", "INVIT"]),
    companyOrFundName: z.string().min(1, "Company/Fund name is required"),
    symbol: z.string().optional(),
    isin: z.string().optional(),
    folioNumber: z.string().optional(),
    dividendType: z.enum(["INTERIM", "FINAL", "SPECIAL"]).optional(),
    paymentDate: z.string().optional(),
    dividendPerShare: z.coerce.number().positive().optional(),
    numberOfShares: z.coerce.number().positive().optional(),
    dividendAmount: z.coerce.number().positive("Dividend amount is required"),
    tdsDeducted: z.coerce.number().min(0).optional(),
    investmentValue: z.coerce.number().positive().optional(),
    dematAccount: z.string().optional(),
    brokerName: z.string().optional(),
  })
);

const { handleSubmit, resetForm, setValues, errors, defineField } = useForm({
  validationSchema: schema,
  initialValues: {
    sourceType: "STOCK" as const,
    companyOrFundName: "",
    symbol: "",
    isin: "",
    folioNumber: "",
    dividendType: undefined,
    paymentDate: "",
    dividendPerShare: undefined,
    numberOfShares: undefined,
    dividendAmount: undefined,
    tdsDeducted: undefined,
    investmentValue: undefined,
    dematAccount: "",
    brokerName: "",
  },
});

const [sourceType] = defineField("sourceType");
const [companyOrFundName] = defineField("companyOrFundName");
const [symbol] = defineField("symbol");
const [isin] = defineField("isin");
const [folioNumber] = defineField("folioNumber");
const [dividendType] = defineField("dividendType");
const [paymentDate] = defineField("paymentDate");
const [dividendPerShare] = defineField("dividendPerShare");
const [numberOfShares] = defineField("numberOfShares");
const [dividendAmount] = defineField("dividendAmount");
const [tdsDeducted] = defineField("tdsDeducted");
const [investmentValue] = defineField("investmentValue");
const [dematAccount] = defineField("dematAccount");
const [brokerName] = defineField("brokerName");

// Watch for editingItem changes to populate form
watch(
  () => props.editingItem,
  (item) => {
    if (item) {
      setValues({
        sourceType: item.sourceType as "STOCK" | "MUTUAL_FUND" | "REIT" | "INVIT",
        companyOrFundName: item.companyOrFundName,
        symbol: item.symbol || "",
        isin: item.isin || "",
        folioNumber: item.folioNumber || "",
        dividendType: item.dividendType as "INTERIM" | "FINAL" | "SPECIAL" | undefined,
        paymentDate: item.paymentDate ? item.paymentDate.split("T")[0] : "",
        dividendPerShare: item.dividendPerShare || undefined,
        numberOfShares: item.numberOfShares || undefined,
        dividendAmount: item.dividendAmount,
        tdsDeducted: item.tdsDeducted || undefined,
        investmentValue: item.investmentValue || undefined,
        dematAccount: item.dematAccount || "",
        brokerName: item.brokerName || "",
      });
    } else {
      resetForm();
    }
  },
  { immediate: true }
);

// Reset form when dialog closes
watch(
  () => props.modelValue,
  (open) => {
    if (!open && !props.editingItem) {
      resetForm();
    }
  }
);

const onSubmit = handleSubmit((values) => {
  const data: DividendIncomeInput = {
    fiscalYear: props.fiscalYear,
    sourceType: values.sourceType,
    companyOrFundName: values.companyOrFundName,
    symbol: values.symbol || undefined,
    isin: values.isin || undefined,
    folioNumber: values.folioNumber || undefined,
    dividendType: values.dividendType,
    paymentDate: values.paymentDate || undefined,
    dividendPerShare: values.dividendPerShare,
    numberOfShares: values.numberOfShares,
    dividendAmount: values.dividendAmount!,
    tdsDeducted: values.tdsDeducted || 0,
    investmentValue: values.investmentValue,
    dematAccount: values.dematAccount || undefined,
    brokerName: values.brokerName || undefined,
  };
  emit("submit", data);
});

function handleCancel() {
  resetForm();
  emit("cancel");
  emit("update:modelValue", false);
}
</script>

<template>
  <v-dialog v-model="isOpen" max-width="700" persistent>
    <v-card>
      <v-card-title class="d-flex align-center">
        <v-icon class="mr-2">mdi-cash-multiple</v-icon>
        {{ isEditing ? "Edit" : "Add" }} Dividend Income
      </v-card-title>
      <v-card-text>
        <v-form @submit.prevent="onSubmit">
          <v-row>
            <v-col cols="12" md="6">
              <v-select
                v-model="sourceType"
                label="Source Type *"
                :items="sourceTypes"
                item-title="title"
                item-value="value"
                :error-messages="errors.sourceType"
                required
              />
            </v-col>
            <v-col cols="12" md="6">
              <v-text-field
                v-model="companyOrFundName"
                label="Company/Fund Name *"
                :error-messages="errors.companyOrFundName"
                required
              />
            </v-col>
            <v-col cols="12" md="4">
              <v-text-field
                v-model="symbol"
                label="Symbol/Ticker"
                :error-messages="errors.symbol"
              />
            </v-col>
            <v-col cols="12" md="4">
              <v-text-field
                v-model="isin"
                label="ISIN"
                :error-messages="errors.isin"
              />
            </v-col>
            <v-col cols="12" md="4">
              <v-text-field
                v-model="folioNumber"
                label="Folio Number"
                hint="For mutual funds"
                :error-messages="errors.folioNumber"
              />
            </v-col>
            <v-col cols="12" md="6">
              <v-select
                v-model="dividendType"
                label="Dividend Type"
                :items="dividendTypes"
                item-title="title"
                item-value="value"
                clearable
                :error-messages="errors.dividendType"
              />
            </v-col>
            <v-col cols="12" md="6">
              <v-text-field
                v-model="paymentDate"
                label="Payment Date"
                type="date"
                :error-messages="errors.paymentDate"
              />
            </v-col>
            <v-col cols="12" md="4">
              <v-text-field
                v-model.number="dividendPerShare"
                label="Dividend Per Share"
                type="number"
                prefix="₹"
                :error-messages="errors.dividendPerShare"
              />
            </v-col>
            <v-col cols="12" md="4">
              <v-text-field
                v-model.number="numberOfShares"
                label="Number of Shares"
                type="number"
                :error-messages="errors.numberOfShares"
              />
            </v-col>
            <v-col cols="12" md="4">
              <v-text-field
                v-model.number="dividendAmount"
                label="Total Dividend *"
                type="number"
                prefix="₹"
                :error-messages="errors.dividendAmount"
                required
              />
            </v-col>
            <v-col cols="12" md="6">
              <v-text-field
                v-model.number="tdsDeducted"
                label="TDS Deducted"
                type="number"
                prefix="₹"
                :error-messages="errors.tdsDeducted"
              />
            </v-col>
            <v-col cols="12" md="6">
              <v-text-field
                v-model.number="investmentValue"
                label="Investment Value"
                type="number"
                prefix="₹"
                hint="For yield calculation"
                :error-messages="errors.investmentValue"
              />
            </v-col>
            <v-col cols="12" md="6">
              <v-text-field
                v-model="dematAccount"
                label="Demat Account"
                :error-messages="errors.dematAccount"
              />
            </v-col>
            <v-col cols="12" md="6">
              <v-text-field
                v-model="brokerName"
                label="Broker Name"
                :error-messages="errors.brokerName"
              />
            </v-col>
          </v-row>
        </v-form>
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn variant="text" @click="handleCancel" :disabled="loading">
          Cancel
        </v-btn>
        <v-btn
          color="primary"
          variant="flat"
          @click="onSubmit"
          :loading="loading"
        >
          {{ isEditing ? "Update" : "Add" }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
