<script setup lang="ts">
import { ref, computed } from "vue";
import DeductionCategory from "@/components/tax/DeductionCategory.vue";
import DeductionsOptimizer from "@/components/tax/DeductionsOptimizer.vue";
import {
  useDeductions,
  useDeductionSummary,
  useAddDeduction,
  useUpdateDeduction,
  useDeleteDeduction,
  formatINR,
} from "@/composables/useTax";
import {
  DEDUCTION_LIMITS,
  SECTION_80C_CATEGORIES,
  SECTION_80D_CATEGORIES,
} from "@/types/tax";
import type {
  DeductionSection,
  DeductionInput,
  DeductionCategoryDetail,
} from "@/types/tax";

const props = defineProps<{
  financialYear: string;
}>();

const { data: deductions, isLoading: deductionsLoading } = useDeductions();
const { data: summary, isLoading: summaryLoading } = useDeductionSummary();
const addDeductionMutation = useAddDeduction();
const updateDeductionMutation = useUpdateDeduction();
const deleteDeductionMutation = useDeleteDeduction();

// Dialog state
const showDeductionDialog = ref(false);
const editingDeduction = ref<{ id: string; section: DeductionSection } | null>(null);

// Form state
const deductionForm = ref<DeductionInput>({
  section: "80C",
  category: "",
  description: "",
  amount: 0,
});

// Computed categories for display
const section80CData = computed<DeductionCategoryDetail>(() => {
  if (summary.value?.section80C) return summary.value.section80C;
  return {
    section: "80C",
    label: "Section 80C",
    items: [],
    total: 0,
    limit: DEDUCTION_LIMITS.section80C,
    remaining: DEDUCTION_LIMITS.section80C,
    utilizationPercent: 0,
  };
});

const section80DData = computed<DeductionCategoryDetail>(() => {
  if (summary.value?.section80D) return summary.value.section80D;
  return {
    section: "80D",
    label: "Section 80D - Health Insurance",
    items: [],
    total: 0,
    limit: DEDUCTION_LIMITS.section80D,
    remaining: DEDUCTION_LIMITS.section80D,
    utilizationPercent: 0,
  };
});

const section80CCD1BData = computed<DeductionCategoryDetail>(() => {
  if (summary.value?.section80CCD1B) return summary.value.section80CCD1B;
  return {
    section: "80CCD(1B)",
    label: "Section 80CCD(1B) - NPS",
    items: [],
    total: 0,
    limit: DEDUCTION_LIMITS.section80CCD1B,
    remaining: DEDUCTION_LIMITS.section80CCD1B,
    utilizationPercent: 0,
  };
});

const section24Data = computed<DeductionCategoryDetail>(() => {
  if (summary.value?.section24) return summary.value.section24;
  return {
    section: "24",
    label: "Section 24 - Home Loan Interest",
    items: [],
    total: 0,
    limit: DEDUCTION_LIMITS.section24,
    remaining: DEDUCTION_LIMITS.section24,
    utilizationPercent: 0,
  };
});

const otherDeductionsData = computed<DeductionCategoryDetail>(() => {
  if (summary.value?.otherDeductions) return summary.value.otherDeductions;
  return {
    section: "Other",
    label: "Other Deductions (80E, 80G, 80TTA)",
    items: [],
    total: 0,
    limit: Infinity,
    remaining: Infinity,
    utilizationPercent: 0,
  };
});

const totalDeductions = computed(() => summary.value?.totalDeductions || 0);

const potentialTaxSavings = computed(() => {
  // At 30% tax bracket
  return Math.round(totalDeductions.value * 0.3);
});

// Category options for the form
const categoryOptions = computed(() => {
  switch (deductionForm.value.section) {
    case "80C":
      return SECTION_80C_CATEGORIES.map((c) => ({
        title: c.label,
        value: c.value,
      }));
    case "80D":
      return SECTION_80D_CATEGORIES.map((c) => ({
        title: c.label,
        value: c.value,
      }));
    default:
      return [
        { title: "NPS Contribution", value: "nps" },
        { title: "Education Loan Interest", value: "education_loan" },
        { title: "Donations", value: "donations" },
        { title: "Other", value: "other" },
      ];
  }
});

const sectionOptions = [
  { title: "Section 80C (PPF, ELSS, etc.)", value: "80C" as DeductionSection },
  { title: "Section 80D (Health Insurance)", value: "80D" as DeductionSection },
  { title: "Section 80CCD(1B) (NPS)", value: "80CCD1B" as DeductionSection },
  { title: "Section 24 (Home Loan Interest)", value: "80E" as DeductionSection },
  { title: "Section 80G (Donations)", value: "80G" as DeductionSection },
  { title: "Section 80TTA (Savings Interest)", value: "80TTA" as DeductionSection },
];

function openAddDialog(section: DeductionSection) {
  editingDeduction.value = null;
  deductionForm.value = {
    section,
    category: "",
    description: "",
    amount: 0,
  };
  showDeductionDialog.value = true;
}

function openEditDialog(id: string, section: DeductionSection) {
  const item = deductions.value?.find((d) => d.id === id);
  if (!item) return;

  editingDeduction.value = { id, section };
  deductionForm.value = {
    section: item.section,
    category: item.category,
    description: item.description,
    amount: item.amount,
  };
  showDeductionDialog.value = true;
}

async function saveDeduction() {
  if (editingDeduction.value) {
    await updateDeductionMutation.mutateAsync({
      id: editingDeduction.value.id,
      data: deductionForm.value,
    });
  } else {
    await addDeductionMutation.mutateAsync(deductionForm.value);
  }
  showDeductionDialog.value = false;
}

async function deleteDeduction(id: string) {
  await deleteDeductionMutation.mutateAsync(id);
}

const isLoading = computed(() => deductionsLoading.value || summaryLoading.value);
const isSaving = computed(
  () => addDeductionMutation.isPending.value || updateDeductionMutation.isPending.value
);
</script>

<template>
  <div class="deductions-section">
    <!-- Summary Cards -->
    <v-row class="mb-4">
      <v-col cols="12" sm="4">
        <v-card variant="outlined" class="pa-3">
          <div class="d-flex align-center">
            <v-avatar color="primary" size="36" class="mr-3">
              <v-icon size="20">mdi-minus-circle-multiple</v-icon>
            </v-avatar>
            <div>
              <div class="text-caption text-medium-emphasis">Total Deductions</div>
              <div class="text-h6 font-weight-bold text-currency">
                {{ formatINR(totalDeductions) }}
              </div>
            </div>
          </div>
        </v-card>
      </v-col>

      <v-col cols="12" sm="4">
        <v-card variant="outlined" class="pa-3">
          <div class="d-flex align-center">
            <v-avatar color="success" size="36" class="mr-3">
              <v-icon size="20">mdi-piggy-bank</v-icon>
            </v-avatar>
            <div>
              <div class="text-caption text-medium-emphasis">Tax Savings (Est.)</div>
              <div class="text-h6 font-weight-bold text-currency text-success">
                {{ formatINR(potentialTaxSavings) }}
              </div>
            </div>
          </div>
        </v-card>
      </v-col>

      <v-col cols="12" sm="4">
        <v-card variant="outlined" class="pa-3">
          <div class="d-flex align-center">
            <v-avatar color="warning" size="36" class="mr-3">
              <v-icon size="20">mdi-alert-circle</v-icon>
            </v-avatar>
            <div>
              <div class="text-caption text-medium-emphasis">80C Remaining</div>
              <div class="text-h6 font-weight-bold text-currency">
                {{ formatINR(section80CData.remaining) }}
              </div>
            </div>
          </div>
          <v-progress-linear
            :model-value="section80CData.utilizationPercent"
            color="warning"
            height="4"
            rounded
            class="mt-2"
          />
        </v-card>
      </v-col>
    </v-row>

    <!-- Add Button -->
    <div class="mb-4">
      <v-btn color="primary" prepend-icon="mdi-plus" @click="openAddDialog('80C')">
        Add Deduction
      </v-btn>
    </div>

    <v-row>
      <!-- Left: Deduction Categories -->
      <v-col cols="12" lg="8">
        <DeductionCategory
          :category="section80CData"
          :editable="true"
          class="mb-3"
          @add="openAddDialog('80C')"
          @edit="openEditDialog($event, '80C')"
          @delete="deleteDeduction"
        />

        <DeductionCategory
          :category="section80DData"
          :editable="true"
          class="mb-3"
          @add="openAddDialog('80D')"
          @edit="openEditDialog($event, '80D')"
          @delete="deleteDeduction"
        />

        <DeductionCategory
          :category="section80CCD1BData"
          :editable="true"
          class="mb-3"
          @add="openAddDialog('80CCD1B')"
          @edit="openEditDialog($event, '80CCD1B')"
          @delete="deleteDeduction"
        />

        <DeductionCategory
          :category="section24Data"
          :editable="true"
          class="mb-3"
          @add="openAddDialog('80E')"
          @edit="openEditDialog($event, '80E')"
          @delete="deleteDeduction"
        />

        <DeductionCategory
          :category="otherDeductionsData"
          :editable="true"
          @add="openAddDialog('80G')"
          @edit="openEditDialog($event, '80G')"
          @delete="deleteDeduction"
        />
      </v-col>

      <!-- Right: Optimizer -->
      <v-col cols="12" lg="4">
        <DeductionsOptimizer :summary="summary ?? null" :loading="summaryLoading" />
      </v-col>
    </v-row>

    <!-- Add/Edit Deduction Dialog -->
    <v-dialog v-model="showDeductionDialog" max-width="500">
      <v-card>
        <v-card-title>
          {{ editingDeduction ? "Edit Deduction" : "Add Deduction" }}
        </v-card-title>
        <v-card-text>
          <v-select
            v-model="deductionForm.section"
            :items="sectionOptions"
            item-title="title"
            item-value="value"
            label="Section"
            variant="outlined"
            density="comfortable"
            class="mb-3"
          />

          <v-select
            v-model="deductionForm.category"
            :items="categoryOptions"
            item-title="title"
            item-value="value"
            label="Category"
            variant="outlined"
            density="comfortable"
            class="mb-3"
          />

          <v-text-field
            v-model="deductionForm.description"
            label="Description (Optional)"
            variant="outlined"
            density="comfortable"
            class="mb-3"
          />

          <v-text-field
            v-model.number="deductionForm.amount"
            label="Amount"
            type="number"
            variant="outlined"
            density="comfortable"
            prefix="₹"
          />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="showDeductionDialog = false">Cancel</v-btn>
          <v-btn color="primary" variant="flat" :loading="isSaving" @click="saveDeduction">
            {{ editingDeduction ? "Update" : "Add" }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>
