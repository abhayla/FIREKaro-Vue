<script setup lang="ts">
import { ref, computed } from "vue";
import { useSalaryIncomeSources, useFinancialYear, formatINR } from "@/composables/useSalary";
import type { IncomeSource } from "@/types/salary";

const props = defineProps<{
  modelValue: boolean;
}>();

const emit = defineEmits<{
  (e: "update:modelValue", value: boolean): void;
  (e: "add-employer"): void;
  (e: "edit-employer", employer: IncomeSource): void;
}>();

const dialog = computed({
  get: () => props.modelValue,
  set: (value) => emit("update:modelValue", value),
});

const { selectedFinancialYear } = useFinancialYear();
const { data: incomeSources, isLoading } = useSalaryIncomeSources(selectedFinancialYear.value);

const confirmDeleteDialog = ref(false);
const employerToDelete = ref<IncomeSource | null>(null);

const closeDialog = () => {
  dialog.value = false;
};

const handleEdit = (employer: IncomeSource) => {
  emit("edit-employer", employer);
};

const handleSetPrimary = (employer: IncomeSource) => {
  // TODO: Implement set primary logic
  console.log("Set primary:", employer.id);
};

const confirmDelete = (employer: IncomeSource) => {
  employerToDelete.value = employer;
  confirmDeleteDialog.value = true;
};

const handleDelete = async () => {
  if (!employerToDelete.value) return;

  // TODO: Implement delete logic
  console.log("Delete:", employerToDelete.value.id);
  confirmDeleteDialog.value = false;
  employerToDelete.value = null;
};

const formatPeriod = (employer: IncomeSource): string => {
  // TODO: Extract actual start/end dates from employer metadata
  return "Apr 2024 → Present";
};
</script>

<template>
  <v-dialog v-model="dialog" max-width="700" scrollable>
    <v-card>
      <v-card-title class="d-flex align-center justify-space-between">
        <span>Manage Employers</span>
        <v-btn icon="mdi-close" variant="text" size="small" @click="closeDialog" />
      </v-card-title>

      <v-divider />

      <v-card-text class="pa-4">
        <div v-if="isLoading" class="d-flex justify-center py-8">
          <v-progress-circular indeterminate color="primary" />
        </div>

        <template v-else-if="incomeSources && incomeSources.length > 0">
          <v-card
            v-for="employer in incomeSources"
            :key="employer.id"
            :variant="employer.isPrimary ? 'tonal' : 'outlined'"
            :color="employer.isPrimary ? 'primary' : undefined"
            class="mb-3"
          >
            <v-card-text class="pa-4">
              <div class="d-flex align-start justify-space-between">
                <div class="flex-grow-1">
                  <div class="d-flex align-center mb-2">
                    <v-icon
                      v-if="employer.isPrimary"
                      icon="mdi-star"
                      color="primary"
                      size="small"
                      class="mr-2"
                    />
                    <span class="font-weight-bold text-body-1">{{ employer.sourceName }}</span>
                    <v-chip
                      v-if="employer.isPrimary"
                      color="primary"
                      size="x-small"
                      variant="flat"
                      class="ml-2"
                    >
                      PRIMARY
                    </v-chip>
                  </div>

                  <v-divider class="my-2" />

                  <div class="text-body-2 text-medium-emphasis">
                    <div class="d-flex flex-wrap ga-4 mb-1">
                      <span v-if="employer.description">
                        <v-icon icon="mdi-badge-account" size="x-small" class="mr-1" />
                        {{ employer.description }}
                      </span>
                    </div>
                    <div class="d-flex flex-wrap ga-4">
                      <span>
                        <v-icon icon="mdi-calendar-range" size="x-small" class="mr-1" />
                        {{ formatPeriod(employer) }}
                      </span>
                    </div>
                    <div v-if="employer.grossIncome > 0" class="mt-2">
                      <span class="text-success font-weight-medium">
                        Gross: {{ formatINR(employer.grossIncome) }}
                      </span>
                      <span class="mx-2">|</span>
                      <span class="text-primary font-weight-medium">
                        Net: {{ formatINR(employer.grossIncome - employer.deductions) }}
                      </span>
                    </div>
                  </div>
                </div>

                <div class="d-flex flex-column ga-1">
                  <v-btn
                    variant="text"
                    size="small"
                    color="primary"
                    @click="handleEdit(employer)"
                  >
                    Edit
                  </v-btn>
                  <v-btn
                    v-if="!employer.isPrimary"
                    variant="text"
                    size="small"
                    @click="handleSetPrimary(employer)"
                  >
                    Set as Primary
                  </v-btn>
                  <v-btn
                    v-if="!employer.isPrimary"
                    variant="text"
                    size="small"
                    color="error"
                    @click="confirmDelete(employer)"
                  >
                    <v-icon icon="mdi-delete" size="small" />
                  </v-btn>
                </div>
              </div>
            </v-card-text>
          </v-card>
        </template>

        <div v-else class="text-center py-8">
          <v-icon icon="mdi-domain-off" size="64" color="grey-lighten-1" class="mb-4" />
          <div class="text-h6 text-medium-emphasis mb-2">No employers added</div>
          <div class="text-body-2 text-medium-emphasis mb-4">
            Add your first employer to start tracking salary
          </div>
        </div>
      </v-card-text>

      <v-divider />

      <v-card-actions class="pa-4 d-flex justify-space-between">
        <v-btn
          color="primary"
          variant="tonal"
          prepend-icon="mdi-plus"
          @click="emit('add-employer')"
        >
          Add Employer
        </v-btn>
        <v-btn variant="text" @click="closeDialog">Close</v-btn>
      </v-card-actions>
    </v-card>

    <!-- Delete Confirmation Dialog -->
    <v-dialog v-model="confirmDeleteDialog" max-width="400">
      <v-card>
        <v-card-title class="text-h6">Delete Employer?</v-card-title>
        <v-card-text>
          <p>
            Are you sure you want to delete
            <strong>{{ employerToDelete?.sourceName }}</strong>?
          </p>
          <p class="text-error mt-2">
            This will also delete all salary data associated with this employer.
          </p>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="confirmDeleteDialog = false">Cancel</v-btn>
          <v-btn color="error" variant="flat" @click="handleDelete">Delete</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-dialog>
</template>
