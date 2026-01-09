<script setup lang="ts">
import { ref, watch, computed } from "vue";
import { useForm, useField } from "vee-validate";
import { toTypedSchema } from "@vee-validate/zod";
import { z } from "zod";

interface Payment {
  id?: string;
  paymentDate: string;
  amount: number;
  quarter: number;
  challanSerialNumber: string;
  bsrCode: string;
  bankName?: string;
  notes?: string;
}

const props = defineProps<{
  modelValue: boolean;
  payment?: Payment | null;
  financialYear: string;
  loading?: boolean;
}>();

const emit = defineEmits<{
  (e: "update:modelValue", value: boolean): void;
  (e: "save", data: Payment): void;
  (e: "cancel"): void;
}>();

const isOpen = computed({
  get: () => props.modelValue,
  set: (val) => emit("update:modelValue", val),
});

const isEditing = computed(() => !!props.payment?.id);

const schema = toTypedSchema(
  z.object({
    paymentDate: z.string().min(1, "Payment date is required"),
    amount: z.coerce.number().positive("Amount must be positive"),
    quarter: z.coerce.number().min(1).max(4, "Select a valid quarter"),
    challanSerialNumber: z.string().min(1, "Challan number is required"),
    bsrCode: z.string().min(1, "BSR code is required"),
    bankName: z.string().optional(),
    notes: z.string().optional(),
  })
);

const { handleSubmit, errors, resetForm, setValues } = useForm({
  validationSchema: schema,
  initialValues: {
    paymentDate: new Date().toISOString().split("T")[0],
    amount: 0,
    quarter: 1,
    challanSerialNumber: "",
    bsrCode: "",
    bankName: "",
    notes: "",
  },
});

const { value: paymentDate } = useField<string>("paymentDate");
const { value: amount } = useField<number>("amount");
const { value: quarter } = useField<number>("quarter");
const { value: challanSerialNumber } = useField<string>("challanSerialNumber");
const { value: bsrCode } = useField<string>("bsrCode");
const { value: bankName } = useField<string>("bankName");
const { value: notes } = useField<string>("notes");

const quarterOptions = [
  { title: "Q1 - June 15 (15%)", value: 1 },
  { title: "Q2 - September 15 (45%)", value: 2 },
  { title: "Q3 - December 15 (75%)", value: 3 },
  { title: "Q4 - March 15 (100%)", value: 4 },
];

// Watch for changes to payment prop (for editing)
watch(
  () => props.payment,
  (val) => {
    if (val) {
      setValues({
        paymentDate: val.paymentDate
          ? new Date(val.paymentDate).toISOString().split("T")[0]
          : new Date().toISOString().split("T")[0],
        amount: val.amount || 0,
        quarter: val.quarter || 1,
        challanSerialNumber: val.challanSerialNumber || "",
        bsrCode: val.bsrCode || "",
        bankName: val.bankName || "",
        notes: val.notes || "",
      });
    } else {
      resetForm();
    }
  },
  { immediate: true }
);

const onSubmit = handleSubmit((values) => {
  emit("save", {
    ...values,
    paymentDate: values.paymentDate,
    amount: Number(values.amount),
    quarter: Number(values.quarter),
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
    max-width="600"
    persistent
  >
    <v-card>
      <v-card-title class="d-flex align-center">
        <v-icon class="mr-2">{{ isEditing ? 'mdi-pencil' : 'mdi-plus' }}</v-icon>
        {{ isEditing ? 'Edit Payment' : 'Add Advance Tax Payment' }}
      </v-card-title>

      <v-card-text>
        <v-form @submit.prevent="onSubmit">
          <v-row>
            <v-col cols="12" sm="6">
              <v-text-field
                v-model="paymentDate"
                label="Payment Date"
                type="date"
                variant="outlined"
                density="comfortable"
                :error-messages="errors.paymentDate"
                required
              />
            </v-col>

            <v-col cols="12" sm="6">
              <v-select
                v-model="quarter"
                :items="quarterOptions"
                label="Quarter"
                variant="outlined"
                density="comfortable"
                :error-messages="errors.quarter"
                required
              />
            </v-col>

            <v-col cols="12">
              <v-text-field
                v-model.number="amount"
                label="Amount"
                type="number"
                variant="outlined"
                density="comfortable"
                prefix="₹"
                :error-messages="errors.amount"
                required
              />
            </v-col>

            <v-col cols="12" sm="6">
              <v-text-field
                v-model="challanSerialNumber"
                label="Challan Serial Number"
                variant="outlined"
                density="comfortable"
                :error-messages="errors.challanSerialNumber"
                hint="5-digit BSR challan number"
                persistent-hint
                required
              />
            </v-col>

            <v-col cols="12" sm="6">
              <v-text-field
                v-model="bsrCode"
                label="BSR Code"
                variant="outlined"
                density="comfortable"
                :error-messages="errors.bsrCode"
                hint="7-digit BSR code of the bank"
                persistent-hint
                required
              />
            </v-col>

            <v-col cols="12">
              <v-text-field
                v-model="bankName"
                label="Bank Name (Optional)"
                variant="outlined"
                density="comfortable"
                :error-messages="errors.bankName"
              />
            </v-col>

            <v-col cols="12">
              <v-textarea
                v-model="notes"
                label="Notes (Optional)"
                variant="outlined"
                density="comfortable"
                rows="2"
                :error-messages="errors.notes"
              />
            </v-col>
          </v-row>

          <v-alert
            type="info"
            variant="tonal"
            density="compact"
            class="mt-2"
          >
            <div class="text-caption">
              <strong>Tip:</strong> You can find the Challan Serial Number and BSR Code
              on your tax payment receipt (Challan 280).
            </div>
          </v-alert>
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
          {{ isEditing ? 'Update' : 'Save' }} Payment
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
