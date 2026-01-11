<script setup lang="ts">
import { ref, watch, computed } from "vue";
import { useForm } from "vee-validate";
import { toTypedSchema } from "@vee-validate/zod";
import { z } from "zod";
import type { InterestIncome, InterestIncomeInput } from "@/types/income";

const props = defineProps<{
  modelValue: boolean;
  editingItem?: InterestIncome | null;
  loading?: boolean;
  fiscalYear: string;
}>();

const emit = defineEmits<{
  (e: "update:modelValue", value: boolean): void;
  (e: "submit", data: InterestIncomeInput): void;
  (e: "cancel"): void;
}>();

const isOpen = computed({
  get: () => props.modelValue,
  set: (value) => emit("update:modelValue", value),
});

const isEditing = computed(() => !!props.editingItem);

const sourceTypes = [
  { title: "Fixed Deposit (FD)", value: "FD" },
  { title: "Recurring Deposit (RD)", value: "RD" },
  { title: "Savings Account", value: "SAVINGS" },
  { title: "P2P Lending", value: "P2P" },
  { title: "Bonds", value: "BONDS" },
  { title: "National Savings Certificate", value: "NSC" },
  { title: "Senior Citizen Savings Scheme", value: "SCSS" },
  { title: "Public Provident Fund", value: "PPF" },
  { title: "Other", value: "OTHER" },
];

const schema = toTypedSchema(
  z.object({
    sourceType: z.enum(["FD", "RD", "SAVINGS", "P2P", "BONDS", "NSC", "SCSS", "PPF", "OTHER"]),
    institutionName: z.string().optional(),
    accountNumber: z.string().optional(),
    branchName: z.string().optional(),
    principalAmount: z.coerce.number().positive("Principal amount is required"),
    interestRate: z.coerce.number().min(0, "Interest rate is required").max(100, "Interest rate must be between 0-100"),
    interestEarned: z.coerce.number().positive().optional(),
    tdsDeducted: z.coerce.number().min(0).optional(),
    depositDate: z.string().optional(),
    maturityDate: z.string().optional(),
    isAutoRenew: z.boolean().optional(),
    form16AReceived: z.boolean().optional(),
  })
);

const { handleSubmit, resetForm, setValues, errors, defineField } = useForm({
  validationSchema: schema,
  initialValues: {
    sourceType: "FD" as const,
    institutionName: "",
    accountNumber: "",
    branchName: "",
    principalAmount: undefined,
    interestRate: undefined,
    interestEarned: undefined,
    tdsDeducted: undefined,
    depositDate: "",
    maturityDate: "",
    isAutoRenew: false,
    form16AReceived: false,
  },
});

const [sourceType] = defineField("sourceType");
const [institutionName] = defineField("institutionName");
const [accountNumber] = defineField("accountNumber");
const [branchName] = defineField("branchName");
const [principalAmount] = defineField("principalAmount");
const [interestRate] = defineField("interestRate");
const [interestEarned] = defineField("interestEarned");
const [tdsDeducted] = defineField("tdsDeducted");
const [depositDate] = defineField("depositDate");
const [maturityDate] = defineField("maturityDate");
const [isAutoRenew] = defineField("isAutoRenew");
const [form16AReceived] = defineField("form16AReceived");

// Watch for editingItem changes to populate form
watch(
  () => props.editingItem,
  (item) => {
    if (item) {
      setValues({
        sourceType: item.sourceType as "FD" | "RD" | "SAVINGS" | "P2P" | "BONDS" | "NSC" | "SCSS" | "PPF" | "OTHER",
        institutionName: item.institutionName,
        accountNumber: item.accountNumber || "",
        branchName: item.branchName || "",
        principalAmount: item.principalAmount || undefined,
        interestRate: item.interestRate || undefined,
        interestEarned: item.interestEarned,
        tdsDeducted: item.tdsDeducted || undefined,
        depositDate: item.depositDate ? item.depositDate.split("T")[0] : "",
        maturityDate: item.maturityDate ? item.maturityDate.split("T")[0] : "",
        isAutoRenew: item.isAutoRenew || false,
        form16AReceived: item.form16AReceived || false,
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
  const data: InterestIncomeInput = {
    fiscalYear: props.fiscalYear,
    sourceType: values.sourceType,
    institutionName: values.institutionName || undefined,
    accountNumber: values.accountNumber || undefined,
    branchName: values.branchName || undefined,
    principalAmount: values.principalAmount!,
    interestRate: values.interestRate!,
    interestEarned: values.interestEarned || undefined,
    tdsDeducted: values.tdsDeducted || 0,
    depositDate: values.depositDate || undefined,
    maturityDate: values.maturityDate || undefined,
    isAutoRenew: values.isAutoRenew || false,
    form16AReceived: values.form16AReceived || false,
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
        <v-icon class="mr-2">mdi-percent</v-icon>
        {{ isEditing ? "Edit" : "Add" }} Interest Income
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
                v-model="institutionName"
                label="Institution Name"
                :error-messages="errors.institutionName"
              />
            </v-col>
            <v-col cols="12" md="6">
              <v-text-field
                v-model="accountNumber"
                label="Account Number"
                :error-messages="errors.accountNumber"
              />
            </v-col>
            <v-col cols="12" md="6">
              <v-text-field
                v-model="branchName"
                label="Branch Name"
                :error-messages="errors.branchName"
              />
            </v-col>
            <v-col cols="12" md="4">
              <v-text-field
                v-model.number="principalAmount"
                label="Principal Amount *"
                type="number"
                prefix="₹"
                :error-messages="errors.principalAmount"
                required
              />
            </v-col>
            <v-col cols="12" md="4">
              <v-text-field
                v-model.number="interestRate"
                label="Interest Rate *"
                type="number"
                suffix="%"
                :error-messages="errors.interestRate"
                required
              />
            </v-col>
            <v-col cols="12" md="4">
              <v-text-field
                v-model.number="interestEarned"
                label="Interest Earned"
                type="number"
                prefix="₹"
                :error-messages="errors.interestEarned"
              />
            </v-col>
            <v-col cols="12" md="4">
              <v-text-field
                v-model.number="tdsDeducted"
                label="TDS Deducted"
                type="number"
                prefix="₹"
                :error-messages="errors.tdsDeducted"
              />
            </v-col>
            <v-col cols="12" md="4">
              <v-text-field
                v-model="depositDate"
                label="Deposit Date"
                type="date"
                :error-messages="errors.depositDate"
              />
            </v-col>
            <v-col cols="12" md="4">
              <v-text-field
                v-model="maturityDate"
                label="Maturity Date"
                type="date"
                :error-messages="errors.maturityDate"
              />
            </v-col>
            <v-col cols="12" md="6">
              <v-checkbox
                v-model="isAutoRenew"
                label="Auto-Renew on Maturity"
                hide-details
              />
            </v-col>
            <v-col cols="12" md="6">
              <v-checkbox
                v-model="form16AReceived"
                label="Form 16A Received"
                hide-details
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
