<script setup lang="ts">
import { ref, computed, watch } from "vue";
import { formatINR } from "@/composables/useSalary";

type CopyMode = "import-prev-fy" | "copy-to-remaining" | "copy-from-prev" | "clear";

const props = defineProps<{
  modelValue: boolean;
  mode: CopyMode;
  sourceMonth?: string; // e.g., "Apr'24"
  targetMonth?: string; // e.g., "May'24"
  financialYear: string;
  previousFyData?: {
    employer: string;
    grossEarnings: number;
    deductions: number;
    netSalary: number;
    month: string;
  };
  remainingMonths?: string[]; // e.g., ["Jun'24", "Jul'24", ...]
}>();

const emit = defineEmits<{
  (e: "update:modelValue", value: boolean): void;
  (e: "confirm", options: CopyOptions): void;
}>();

interface CopyOptions {
  mode: CopyMode;
  includeEmployer: boolean;
  includePaidDays: boolean;
  includeEarnings: boolean;
  includeDeductions: boolean;
  includeEmployerContrib: boolean;
  targetScope: "single" | "all"; // For import-prev-fy: single month or all months
}

const dialog = computed({
  get: () => props.modelValue,
  set: (value) => emit("update:modelValue", value),
});

const isLoading = ref(false);

// Copy options
const includeEmployer = ref(true);
const includePaidDays = ref(true);
const includeEarnings = ref(true);
const includeDeductions = ref(true);
const includeEmployerContrib = ref(true);
const targetScope = ref<"single" | "all">("all");

// Reset options when dialog opens
watch(dialog, (value) => {
  if (value) {
    includeEmployer.value = true;
    includePaidDays.value = true;
    includeEarnings.value = true;
    includeDeductions.value = true;
    includeEmployerContrib.value = true;
    targetScope.value = "all";
  }
});

// Dialog title based on mode
const dialogTitle = computed(() => {
  switch (props.mode) {
    case "import-prev-fy":
      return "Import from Previous Year";
    case "copy-to-remaining":
      return "Copy to Remaining Months";
    case "copy-from-prev":
      return "Copy from Previous Month";
    case "clear":
      return "Clear Month Data";
    default:
      return "Copy Data";
  }
});

// Max width based on mode
const maxWidth = computed(() => {
  return props.mode === "clear" ? 450 : 600;
});

const closeDialog = () => {
  dialog.value = false;
};

const handleConfirm = async () => {
  isLoading.value = true;
  try {
    emit("confirm", {
      mode: props.mode,
      includeEmployer: includeEmployer.value,
      includePaidDays: includePaidDays.value,
      includeEarnings: includeEarnings.value,
      includeDeductions: includeDeductions.value,
      includeEmployerContrib: includeEmployerContrib.value,
      targetScope: targetScope.value,
    });
    dialog.value = false;
  } finally {
    isLoading.value = false;
  }
};

// Previous FY calculation
const previousFY = computed(() => {
  if (!props.financialYear) return "";
  const [startYear] = props.financialYear.split("-").map(Number);
  return `${startYear - 1}-${startYear.toString().slice(-2)}`;
});
</script>

<template>
  <v-dialog v-model="dialog" :max-width="maxWidth" persistent>
    <v-card>
      <v-card-title class="d-flex align-center justify-space-between">
        <span>{{ dialogTitle }}</span>
        <v-btn icon="mdi-close" variant="text" size="small" @click="closeDialog" />
      </v-card-title>

      <v-divider />

      <v-card-text class="pa-6">
        <!-- Import from Previous FY -->
        <template v-if="mode === 'import-prev-fy'">
          <v-alert type="info" variant="tonal" density="compact" class="mb-4">
            <v-icon icon="mdi-clipboard-text" class="mr-2" />
            Found salary data for {{ previousFyData?.month || "Mar" }} (FY {{ previousFY }})
          </v-alert>

          <v-card variant="outlined" class="mb-4">
            <v-card-text class="py-3">
              <div class="font-weight-medium mb-2">
                Employer: {{ previousFyData?.employer || "N/A" }}
              </div>
              <div class="d-flex ga-4 text-body-2 text-medium-emphasis">
                <span>Gross: {{ formatINR(previousFyData?.grossEarnings || 0) }}</span>
                <span>|</span>
                <span>Deductions: {{ formatINR(previousFyData?.deductions || 0) }}</span>
                <span>|</span>
                <span>Net: {{ formatINR(previousFyData?.netSalary || 0) }}</span>
              </div>
            </v-card-text>
          </v-card>

          <div class="mb-4">
            <div class="text-subtitle-2 mb-2">Import to:</div>
            <v-radio-group v-model="targetScope" density="compact" hide-details>
              <v-radio label="April only" value="single" />
              <v-radio value="all">
                <template #label>
                  All months (Apr → Mar)
                  <v-chip size="x-small" color="primary" variant="flat" class="ml-2">Recommended</v-chip>
                </template>
              </v-radio>
            </v-radio-group>
          </div>

          <div class="d-flex flex-wrap ga-4">
            <v-checkbox
              v-model="includeEmployer"
              label="Include Employer"
              density="compact"
              hide-details
            />
            <v-checkbox
              v-model="includePaidDays"
              label="Include Paid Days (adjusted per month)"
              density="compact"
              hide-details
            />
          </div>
        </template>

        <!-- Copy to Remaining Months -->
        <template v-else-if="mode === 'copy-to-remaining'">
          <p class="mb-2">
            Copy <strong>{{ sourceMonth }}</strong> data to remaining months?
          </p>
          <p class="text-medium-emphasis text-body-2 mb-4">
            This will copy to: {{ remainingMonths?.join(", ") || "remaining months" }}
            ({{ remainingMonths?.length || 0 }} months)
          </p>

          <div class="d-flex flex-column ga-2 mb-4">
            <v-checkbox
              v-model="includeEmployer"
              label="Employer"
              density="compact"
              hide-details
            />
            <v-checkbox
              v-model="includePaidDays"
              label="Paid Days (adjusted per month)"
              density="compact"
              hide-details
            />
            <v-checkbox
              v-model="includeEarnings"
              label="All Earnings"
              density="compact"
              hide-details
            />
            <v-checkbox
              v-model="includeDeductions"
              label="All Deductions"
              density="compact"
              hide-details
            />
            <v-checkbox
              v-model="includeEmployerContrib"
              label="All Employer Contributions"
              density="compact"
              hide-details
            />
          </div>

          <v-alert type="warning" variant="tonal" density="compact">
            <v-icon icon="mdi-alert" class="mr-2" size="small" />
            This will overwrite any existing data in those months.
          </v-alert>
        </template>

        <!-- Copy from Previous Month -->
        <template v-else-if="mode === 'copy-from-prev'">
          <p class="mb-4">
            Copy <strong>{{ sourceMonth }}</strong> data to <strong>{{ targetMonth }}</strong>?
          </p>

          <div class="d-flex flex-wrap ga-4">
            <v-checkbox
              v-model="includeEmployer"
              label="Employer"
              density="compact"
              hide-details
            />
            <v-checkbox
              v-model="includePaidDays"
              label="Paid Days"
              density="compact"
              hide-details
            />
            <v-checkbox
              v-model="includeEarnings"
              label="Earnings"
              density="compact"
              hide-details
            />
            <v-checkbox
              v-model="includeDeductions"
              label="Deductions"
              density="compact"
              hide-details
            />
            <v-checkbox
              v-model="includeEmployerContrib"
              label="Employer Contrib"
              density="compact"
              hide-details
            />
          </div>
        </template>

        <!-- Clear Month -->
        <template v-else-if="mode === 'clear'">
          <v-alert type="warning" variant="tonal" class="mb-4">
            <v-icon icon="mdi-alert" class="mr-2" />
            Clear all data for <strong>{{ targetMonth }}</strong>?
          </v-alert>
          <p class="text-body-2 text-medium-emphasis">
            This will reset all values to 0/empty.
          </p>
          <p class="text-body-2 text-medium-emphasis">
            This action cannot be undone (until you Cancel edit mode).
          </p>
        </template>
      </v-card-text>

      <v-divider />

      <v-card-actions class="pa-4">
        <v-spacer />
        <v-btn variant="text" @click="closeDialog">Cancel</v-btn>
        <v-btn
          :color="mode === 'clear' ? 'error' : 'primary'"
          variant="flat"
          :loading="isLoading"
          @click="handleConfirm"
        >
          {{ mode === "clear" ? "Clear" : mode === "import-prev-fy" ? "Import" : "Copy" }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
