<script setup lang="ts">
import { ref, computed, watch } from "vue";
import { useCreateIncomeSource, useFinancialYear } from "@/composables/useSalary";

const props = defineProps<{
  modelValue: boolean;
  quickMode?: boolean;
}>();

const emit = defineEmits<{
  (e: "update:modelValue", value: boolean): void;
  (e: "saved", employer: { id: string; name: string }): void;
}>();

const dialog = computed({
  get: () => props.modelValue,
  set: (value) => emit("update:modelValue", value),
});

const { selectedFinancialYear } = useFinancialYear();
const createIncomeSource = useCreateIncomeSource();

const isLoading = ref(false);
const currentlyWorking = ref(true);

// Form data
const formData = ref({
  companyName: "",
  employeeId: "",
  designation: "",
  startDate: "",
  endDate: "",
  panEmployer: "",
  tanEmployer: "",
  uan: "",
  pfAccountNumber: "",
  npsPran: "",
  isPrimary: false,
});

// Form errors
const errors = ref<Record<string, string>>({});

// Reset form when dialog opens
watch(dialog, (value) => {
  if (value) {
    formData.value = {
      companyName: "",
      employeeId: "",
      designation: "",
      startDate: "",
      endDate: "",
      panEmployer: "",
      tanEmployer: "",
      uan: "",
      pfAccountNumber: "",
      npsPran: "",
      isPrimary: false,
    };
    errors.value = {};
    currentlyWorking.value = true;
  }
});

// Clear end date when currently working is checked
watch(currentlyWorking, (value) => {
  if (value) {
    formData.value.endDate = "";
  }
});

// Validate form
const validateForm = (): boolean => {
  errors.value = {};

  if (!formData.value.companyName.trim()) {
    errors.value.companyName = "Company name is required";
  }

  if (!formData.value.startDate) {
    errors.value.startDate = "Start date is required";
  }

  if (!props.quickMode) {
    // PAN validation
    if (formData.value.panEmployer && !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(formData.value.panEmployer.toUpperCase())) {
      errors.value.panEmployer = "Invalid PAN format";
    }

    // TAN validation
    if (formData.value.tanEmployer && !/^[A-Z]{4}[0-9]{5}[A-Z]{1}$/.test(formData.value.tanEmployer.toUpperCase())) {
      errors.value.tanEmployer = "Invalid TAN format";
    }

    // UAN validation
    if (formData.value.uan && !/^[0-9]{12}$/.test(formData.value.uan)) {
      errors.value.uan = "UAN must be 12 digits";
    }

    // PRAN validation
    if (formData.value.npsPran && !/^[0-9]{12}$/.test(formData.value.npsPran)) {
      errors.value.npsPran = "PRAN must be 12 digits";
    }
  }

  return Object.keys(errors.value).length === 0;
};

const onSubmit = async () => {
  if (!validateForm()) return;

  isLoading.value = true;
  try {
    const result = await createIncomeSource.mutateAsync({
      sourceName: formData.value.companyName,
      description: formData.value.designation || undefined,
      financialYear: selectedFinancialYear.value,
      isPrimary: formData.value.isPrimary || false,
    });

    emit("saved", { id: result.id, name: formData.value.companyName });
    dialog.value = false;
  } catch (error) {
    console.error("Failed to create employer:", error);
  } finally {
    isLoading.value = false;
  }
};

const closeDialog = () => {
  dialog.value = false;
};
</script>

<template>
  <v-dialog v-model="dialog" :max-width="quickMode ? 500 : 700" persistent>
    <v-card>
      <v-card-title class="d-flex align-center justify-space-between">
        <span>{{ quickMode ? "Quick Add Employer" : "Add New Employer" }}</span>
        <v-btn icon="mdi-close" variant="text" size="small" @click="closeDialog" />
      </v-card-title>

      <v-divider />

      <v-card-text class="pa-6">
        <v-form @submit.prevent="onSubmit">
          <!-- Company Name -->
          <v-text-field
            v-model="formData.companyName"
            label="Employer/Company Name"
            :error-messages="errors.companyName"
            placeholder="Cognizant Technology Solutions India Pvt Ltd"
            variant="outlined"
            density="comfortable"
            class="mb-4"
            required
          />

          <!-- Quick Mode: Only dates -->
          <template v-if="quickMode">
            <v-row>
              <v-col cols="6">
                <v-text-field
                  v-model="formData.startDate"
                  label="Start Date"
                  :error-messages="errors.startDate"
                  type="month"
                  variant="outlined"
                  density="comfortable"
                  required
                />
              </v-col>
              <v-col cols="6">
                <v-text-field
                  v-model="formData.endDate"
                  label="End Date"
                  :error-messages="errors.endDate"
                  type="month"
                  variant="outlined"
                  density="comfortable"
                  :disabled="currentlyWorking"
                />
              </v-col>
            </v-row>

            <v-checkbox
              v-model="currentlyWorking"
              label="Currently working here"
              density="compact"
              hide-details
              class="mb-4"
            />

            <v-alert type="info" variant="tonal" density="compact" class="mt-4">
              <v-icon icon="mdi-information" class="mr-2" />
              You can add more details (Employee ID, PAN, UAN) later from Settings
            </v-alert>
          </template>

          <!-- Full Mode: All fields -->
          <template v-else>
            <v-row>
              <v-col cols="6">
                <v-text-field
                  v-model="formData.employeeId"
                  label="Employee ID"
                  :error-messages="errors.employeeId"
                  placeholder="702518"
                  variant="outlined"
                  density="comfortable"
                />
              </v-col>
              <v-col cols="6">
                <v-text-field
                  v-model="formData.designation"
                  label="Designation"
                  :error-messages="errors.designation"
                  placeholder="Functional Architect"
                  variant="outlined"
                  density="comfortable"
                />
              </v-col>
            </v-row>

            <v-row>
              <v-col cols="6">
                <v-text-field
                  v-model="formData.startDate"
                  label="Start Date"
                  :error-messages="errors.startDate"
                  type="month"
                  variant="outlined"
                  density="comfortable"
                  required
                />
              </v-col>
              <v-col cols="6">
                <v-text-field
                  v-model="formData.endDate"
                  label="End Date"
                  :error-messages="errors.endDate"
                  type="month"
                  variant="outlined"
                  density="comfortable"
                  :disabled="currentlyWorking"
                />
                <v-checkbox
                  v-model="currentlyWorking"
                  label="Currently working here"
                  density="compact"
                  hide-details
                  class="mt-n2"
                />
              </v-col>
            </v-row>

            <v-row>
              <v-col cols="6">
                <v-text-field
                  v-model="formData.panEmployer"
                  label="PAN (Employer)"
                  :error-messages="errors.panEmployer"
                  placeholder="AAACR1234A"
                  variant="outlined"
                  density="comfortable"
                  class="text-uppercase"
                />
              </v-col>
              <v-col cols="6">
                <v-text-field
                  v-model="formData.tanEmployer"
                  label="TAN (Employer)"
                  :error-messages="errors.tanEmployer"
                  placeholder="BLRC12345E"
                  variant="outlined"
                  density="comfortable"
                  class="text-uppercase"
                />
              </v-col>
            </v-row>

            <v-row>
              <v-col cols="6">
                <v-text-field
                  v-model="formData.uan"
                  label="UAN (Universal Account Number)"
                  :error-messages="errors.uan"
                  placeholder="100072381181"
                  variant="outlined"
                  density="comfortable"
                />
              </v-col>
              <v-col cols="6">
                <v-text-field
                  v-model="formData.pfAccountNumber"
                  label="PF Account Number"
                  :error-messages="errors.pfAccountNumber"
                  placeholder="BGBNG00123450000123"
                  variant="outlined"
                  density="comfortable"
                />
              </v-col>
            </v-row>

            <v-row>
              <v-col cols="6">
                <v-text-field
                  v-model="formData.npsPran"
                  label="NPS PRAN (if applicable)"
                  :error-messages="errors.npsPran"
                  placeholder="110001613538"
                  variant="outlined"
                  density="comfortable"
                />
              </v-col>
              <v-col cols="6" class="d-flex align-center">
                <v-checkbox
                  v-model="formData.isPrimary"
                  label="Set as Primary Employer"
                  density="compact"
                  hide-details
                />
              </v-col>
            </v-row>
          </template>
        </v-form>
      </v-card-text>

      <v-divider />

      <v-card-actions class="pa-4">
        <v-spacer />
        <v-btn variant="text" @click="closeDialog">Cancel</v-btn>
        <v-btn color="primary" variant="flat" :loading="isLoading" @click="onSubmit">
          {{ quickMode ? "Add" : "Save Employer" }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<style scoped>
.text-uppercase :deep(input) {
  text-transform: uppercase;
}
</style>
