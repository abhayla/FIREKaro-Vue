<script setup lang="ts">
import { ref, computed, watch } from "vue";
import { formatINRLakhs } from "@/composables/useSalary";

export type InvestmentCopyMode = "copy-to-remaining" | "copy-from-prev" | "import-prev-fy" | "clear";

export interface InvestmentCopyOptions {
  mode: InvestmentCopyMode;
  includeEmployeeContribution: boolean;
  includeEmployerContribution: boolean;
  includeVpf: boolean;
  includeInterest: boolean;
  selectedMonths: number[]; // FY month indices (0-11)
}

const props = defineProps<{
  modelValue: boolean;
  mode: InvestmentCopyMode;
  /**
   * Investment type for contextual display
   */
  investmentType: "EPF" | "PPF" | "NPS";
  /**
   * Source month name (e.g., "Apr'24")
   */
  sourceMonth?: string;
  /**
   * Target month name (e.g., "May'24")
   */
  targetMonth?: string;
  /**
   * Current financial year (e.g., "2025-26")
   */
  financialYear: string;
  /**
   * Preview data for import-prev-fy mode
   */
  previousFyData?: {
    totalContributions: number;
    employeeContribution: number;
    employerContribution: number;
    vpfContribution?: number;
    lastMonth: string;
  };
  /**
   * List of remaining months for copy-to-remaining mode
   */
  remainingMonths?: string[];
}>();

const emit = defineEmits<{
  "update:modelValue": [value: boolean];
  confirm: [options: InvestmentCopyOptions];
}>();

// FY months for month selection
const FY_MONTHS = [
  { short: "Apr", full: "April", index: 0 },
  { short: "May", full: "May", index: 1 },
  { short: "Jun", full: "June", index: 2 },
  { short: "Jul", full: "July", index: 3 },
  { short: "Aug", full: "August", index: 4 },
  { short: "Sep", full: "September", index: 5 },
  { short: "Oct", full: "October", index: 6 },
  { short: "Nov", full: "November", index: 7 },
  { short: "Dec", full: "December", index: 8 },
  { short: "Jan", full: "January", index: 9 },
  { short: "Feb", full: "February", index: 10 },
  { short: "Mar", full: "March", index: 11 },
];

const dialog = computed({
  get: () => props.modelValue,
  set: (value) => emit("update:modelValue", value),
});

const isLoading = ref(false);

// Copy options - what to include
const includeEmployeeContribution = ref(true);
const includeEmployerContribution = ref(true);
const includeVpf = ref(true);
const includeInterest = ref(false); // Usually don't copy interest

// Month selection for bulk operations
const selectedMonths = ref<number[]>([]);

// Reset options when dialog opens
watch(dialog, (value) => {
  if (value) {
    includeEmployeeContribution.value = true;
    includeEmployerContribution.value = props.investmentType === "EPF";
    includeVpf.value = props.investmentType === "EPF";
    includeInterest.value = false;
    selectedMonths.value = [];
  }
});

// Dialog title based on mode
const dialogTitle = computed(() => {
  const prefix = props.investmentType;
  switch (props.mode) {
    case "import-prev-fy":
      return `Import ${prefix} from Previous Year`;
    case "copy-to-remaining":
      return `Copy ${prefix} to Remaining Months`;
    case "copy-from-prev":
      return `Copy ${prefix} from Previous Month`;
    case "clear":
      return `Clear ${prefix} Data`;
    default:
      return `Copy ${prefix} Data`;
  }
});

// Previous FY string
const previousFY = computed(() => {
  if (!props.financialYear) return "";
  const [startYear] = props.financialYear.split("-").map(Number);
  return `${startYear - 1}-${startYear.toString().slice(-2)}`;
});

// Max width based on mode
const maxWidth = computed(() => {
  return props.mode === "clear" ? 450 : 600;
});

// Icon based on investment type
const investmentIcon = computed(() => {
  switch (props.investmentType) {
    case "EPF":
      return "mdi-bank";
    case "PPF":
      return "mdi-piggy-bank";
    case "NPS":
      return "mdi-account-cash";
    default:
      return "mdi-cash";
  }
});

// Show employer contribution option only for EPF
const showEmployerOption = computed(() => props.investmentType === "EPF");

// Show VPF option only for EPF
const showVpfOption = computed(() => props.investmentType === "EPF");

// Preview text for what will happen
const previewText = computed(() => {
  const fields: string[] = [];
  if (includeEmployeeContribution.value) {
    fields.push(props.investmentType === "EPF" ? "Employee" : "Contribution");
  }
  if (showEmployerOption.value && includeEmployerContribution.value) {
    fields.push("Employer");
  }
  if (showVpfOption.value && includeVpf.value) {
    fields.push("VPF");
  }

  switch (props.mode) {
    case "copy-to-remaining":
      return `Will copy ${fields.join(", ")} from ${props.sourceMonth} to ${
        selectedMonths.value.length || props.remainingMonths?.length || 0
      } months`;
    case "copy-from-prev":
      return `Will copy ${fields.join(", ")} from ${props.sourceMonth} to ${props.targetMonth}`;
    case "import-prev-fy":
      return `Will import ${fields.join(", ")} pattern from FY ${previousFY.value}`;
    case "clear":
      return `Will clear all ${props.investmentType} data for ${props.targetMonth}`;
    default:
      return "";
  }
});

const closeDialog = () => {
  dialog.value = false;
};

const handleConfirm = async () => {
  isLoading.value = true;
  try {
    emit("confirm", {
      mode: props.mode,
      includeEmployeeContribution: includeEmployeeContribution.value,
      includeEmployerContribution: includeEmployerContribution.value,
      includeVpf: includeVpf.value,
      includeInterest: includeInterest.value,
      selectedMonths: selectedMonths.value,
    });
    dialog.value = false;
  } finally {
    isLoading.value = false;
  }
};

// Select/deselect all months
const toggleAllMonths = () => {
  if (selectedMonths.value.length === 12) {
    selectedMonths.value = [];
  } else {
    selectedMonths.value = FY_MONTHS.map((m) => m.index);
  }
};
</script>

<template>
  <v-dialog v-model="dialog" :max-width="maxWidth" persistent>
    <v-card>
      <v-card-title class="d-flex align-center justify-space-between">
        <div class="d-flex align-center">
          <v-icon :icon="investmentIcon" class="mr-2" color="primary" />
          <span>{{ dialogTitle }}</span>
        </div>
        <v-btn icon="mdi-close" variant="text" size="small" @click="closeDialog" />
      </v-card-title>

      <v-divider />

      <v-card-text class="pa-6">
        <!-- Import from Previous FY -->
        <template v-if="mode === 'import-prev-fy'">
          <v-alert type="info" variant="tonal" density="compact" class="mb-4">
            <v-icon icon="mdi-clipboard-text" class="mr-2" />
            Found {{ investmentType }} data from FY {{ previousFY }}
          </v-alert>

          <v-card v-if="previousFyData" variant="outlined" class="mb-4">
            <v-card-text class="py-3">
              <div class="text-body-2">
                <div class="d-flex justify-space-between mb-2">
                  <span class="text-medium-emphasis">Total Contributions:</span>
                  <span class="font-weight-medium text-currency">
                    {{ formatINRLakhs(previousFyData.totalContributions) }}
                  </span>
                </div>
                <div class="d-flex justify-space-between mb-2">
                  <span class="text-medium-emphasis">
                    {{ investmentType === "EPF" ? "Employee:" : "Your Contribution:" }}
                  </span>
                  <span class="text-currency">
                    {{ formatINRLakhs(previousFyData.employeeContribution) }}
                  </span>
                </div>
                <div v-if="showEmployerOption" class="d-flex justify-space-between mb-2">
                  <span class="text-medium-emphasis">Employer:</span>
                  <span class="text-currency">
                    {{ formatINRLakhs(previousFyData.employerContribution) }}
                  </span>
                </div>
                <div v-if="showVpfOption && previousFyData.vpfContribution" class="d-flex justify-space-between">
                  <span class="text-medium-emphasis">VPF:</span>
                  <span class="text-currency">
                    {{ formatINRLakhs(previousFyData.vpfContribution) }}
                  </span>
                </div>
              </div>
            </v-card-text>
          </v-card>

          <div class="text-subtitle-2 mb-2">What to import:</div>
          <div class="d-flex flex-column ga-2 mb-4">
            <v-checkbox
              v-model="includeEmployeeContribution"
              :label="investmentType === 'EPF' ? 'Employee Contribution' : 'Your Contribution'"
              density="compact"
              hide-details
            />
            <v-checkbox
              v-if="showEmployerOption"
              v-model="includeEmployerContribution"
              label="Employer Contribution"
              density="compact"
              hide-details
            />
            <v-checkbox
              v-if="showVpfOption"
              v-model="includeVpf"
              label="VPF Contribution"
              density="compact"
              hide-details
            />
          </div>

          <v-alert type="warning" variant="tonal" density="compact">
            <v-icon icon="mdi-information" class="mr-2" size="small" />
            This will apply the same monthly pattern to FY {{ financialYear }}
          </v-alert>
        </template>

        <!-- Copy to Remaining Months -->
        <template v-else-if="mode === 'copy-to-remaining'">
          <p class="mb-2">
            Copy <strong>{{ sourceMonth }}</strong> contribution pattern to remaining months?
          </p>

          <div class="text-subtitle-2 mt-4 mb-2 d-flex align-center">
            Select months to copy to:
            <v-btn variant="text" size="x-small" class="ml-2" @click="toggleAllMonths">
              {{ selectedMonths.length === 12 ? "Deselect All" : "Select All" }}
            </v-btn>
          </div>

          <v-chip-group v-model="selectedMonths" multiple column class="mb-4">
            <v-chip
              v-for="month in FY_MONTHS"
              :key="month.index"
              :value="month.index"
              filter
              size="small"
            >
              {{ month.short }}
            </v-chip>
          </v-chip-group>

          <div class="text-subtitle-2 mb-2">What to copy:</div>
          <div class="d-flex flex-column ga-2 mb-4">
            <v-checkbox
              v-model="includeEmployeeContribution"
              :label="investmentType === 'EPF' ? 'Employee Contribution' : 'Your Contribution'"
              density="compact"
              hide-details
            />
            <v-checkbox
              v-if="showEmployerOption"
              v-model="includeEmployerContribution"
              label="Employer Contribution"
              density="compact"
              hide-details
            />
            <v-checkbox
              v-if="showVpfOption"
              v-model="includeVpf"
              label="VPF Contribution"
              density="compact"
              hide-details
            />
          </div>

          <v-alert type="warning" variant="tonal" density="compact">
            <v-icon icon="mdi-alert" class="mr-2" size="small" />
            This will overwrite any existing data in selected months.
          </v-alert>
        </template>

        <!-- Copy from Previous Month -->
        <template v-else-if="mode === 'copy-from-prev'">
          <p class="mb-4">
            Copy <strong>{{ sourceMonth }}</strong> data to <strong>{{ targetMonth }}</strong>?
          </p>

          <div class="text-subtitle-2 mb-2">What to copy:</div>
          <div class="d-flex flex-wrap ga-4 mb-4">
            <v-checkbox
              v-model="includeEmployeeContribution"
              :label="investmentType === 'EPF' ? 'Employee' : 'Contribution'"
              density="compact"
              hide-details
            />
            <v-checkbox
              v-if="showEmployerOption"
              v-model="includeEmployerContribution"
              label="Employer"
              density="compact"
              hide-details
            />
            <v-checkbox
              v-if="showVpfOption"
              v-model="includeVpf"
              label="VPF"
              density="compact"
              hide-details
            />
          </div>
        </template>

        <!-- Clear Month -->
        <template v-else-if="mode === 'clear'">
          <v-alert type="warning" variant="tonal" class="mb-4">
            <v-icon icon="mdi-alert" class="mr-2" />
            Clear all {{ investmentType }} data for <strong>{{ targetMonth }}</strong>?
          </v-alert>
          <p class="text-body-2 text-medium-emphasis">
            This will reset all contribution values to 0.
          </p>
          <p class="text-body-2 text-medium-emphasis">
            This action cannot be undone (until you Cancel edit mode).
          </p>
        </template>

        <!-- Preview Alert (Progressive Disclosure) -->
        <v-expand-transition>
          <v-alert
            v-if="mode !== 'clear' && previewText"
            type="info"
            variant="tonal"
            density="compact"
            class="mt-4"
          >
            <strong>Preview:</strong> {{ previewText }}
          </v-alert>
        </v-expand-transition>
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

<style scoped>
.text-currency {
  font-family: "Roboto Mono", monospace;
}
</style>
