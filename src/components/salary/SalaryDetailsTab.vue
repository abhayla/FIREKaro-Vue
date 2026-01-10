<script setup lang="ts">
import { ref, computed, watch } from "vue";
import type { SalaryGridData, SalaryGridRow, SalaryComponentType, IncomeSource } from "@/types/salary";
import { FY_MONTHS, getCurrentFinancialYear } from "@/types/salary";
import { formatINRLakhs, useSalaryIncomeSources, useSalaryHistory, useSalaryComponents } from "@/composables/useSalary";
import CopyDataDialog from "./CopyDataDialog.vue";

const props = withDefaults(
  defineProps<{
    financialYear: string;
  }>(),
  {
    financialYear: () => getCurrentFinancialYear(),
  }
);

const emit = defineEmits<{
  (e: "add-employer"): void;
  (e: "manage-employers"): void;
  (e: "manage-components"): void;
  (e: "import-excel"): void;
  (e: "export-excel"): void;
}>();

// Edit mode state
const isEditMode = ref(false);
const hasUnsavedChanges = ref(false);

// Track expanded state for expandable rows
const expandedRows = ref<Set<string>>(new Set());

// Copy dialog state
type CopyMode = "import-prev-fy" | "copy-to-remaining" | "copy-from-prev" | "clear";
const showCopyDialog = ref(false);
const copyMode = ref<CopyMode>("copy-to-remaining");
const selectedMonthIndex = ref(0);

// Fetch data
const { data: incomeSources, isLoading: sourcesLoading } = useSalaryIncomeSources(props.financialYear);
const { data: salaryHistory, isLoading: historyLoading } = useSalaryHistory(props.financialYear);
const { components } = useSalaryComponents();

const isLoading = computed(() => sourcesLoading.value || historyLoading.value);

// Per-month employer selection (for edit mode)
const monthlyEmployers = ref<(string | null)[]>(Array(12).fill(null));

// Initialize monthly employers from salary history
watch(
  [salaryHistory, incomeSources],
  () => {
    if (salaryHistory.value && incomeSources.value) {
      const newMonthlyEmployers: (string | null)[] = Array(12).fill(null);

      for (const record of salaryHistory.value) {
        const monthIndex = record.month - 1; // Convert to 0-based index
        if (monthIndex >= 0 && monthIndex < 12 && record.incomeSourceId) {
          newMonthlyEmployers[monthIndex] = record.incomeSourceId;
        }
      }

      monthlyEmployers.value = newMonthlyEmployers;
    }
  },
  { immediate: true }
);

// Build grid data from salary history
const gridData = computed(() => {
  if (!salaryHistory.value || salaryHistory.value.length === 0) {
    return null;
  }

  const records = salaryHistory.value;
  const rows: SalaryGridRow[] = [];

  // Create month-indexed data
  const monthData: Map<number, typeof records[0]> = new Map();
  for (const record of records) {
    const monthIndex = record.month - 1;
    if (monthIndex >= 0 && monthIndex < 12) {
      monthData.set(monthIndex, record);
    }
  }

  // Initialize arrays
  const paidDays: (number | null)[] = Array(12).fill(null);
  const grossEarnings: (number | null)[] = Array(12).fill(null);
  const totalDeductions: (number | null)[] = Array(12).fill(null);
  const netSalary: (number | null)[] = Array(12).fill(null);

  // Fill data from records
  for (const [monthIndex, record] of monthData) {
    paidDays[monthIndex] = record.paidDays;
    grossEarnings[monthIndex] = record.grossEarnings;
    totalDeductions[monthIndex] = record.totalDeductions;
    netSalary[monthIndex] = record.netSalary;
  }

  // Build component rows from definitions
  const earningDefs = components.value.filter((c) => c.componentType === "EARNING" && !c.parentCode);
  const deductionDefs = components.value.filter((c) => c.componentType === "DEDUCTION" && !c.parentCode);
  const employerDefs = components.value.filter((c) => c.componentType === "EMPLOYER_CONTRIBUTION");

  // Map field names to component codes
  const fieldToCode: Record<string, string> = {
    basicSalary: "BASIC",
    hra: "HRA",
    conveyanceAllowance: "CONVEYANCE",
    medicalAllowance: "MEDICAL",
    specialAllowance: "SPECIAL",
    specialPay: "SPECIAL_PAY",
    epfDeduction: "EPF",
    vpfDeduction: "VPF",
    professionalTax: "PT",
    tdsDeduction: "TDS",
    otherDeductions: "OTHER_DED",
    employerPf: "EPF_ER",
    pensionFund: "PENSION",
    employerNps: "NPS_ER",
    superannuation: "SUPERANN",
  };

  const codeToField: Record<string, string> = Object.fromEntries(
    Object.entries(fieldToCode).map(([k, v]) => [v, k])
  );

  // Build earnings rows
  for (const def of earningDefs) {
    const field = codeToField[def.code];
    const values: (number | null)[] = Array(12).fill(null);
    let total = 0;

    for (const [monthIndex, record] of monthData) {
      const recordAny = record as unknown as Record<string, number>;
      const value = field ? recordAny[field] : 0;
      if (value && value > 0) {
        values[monthIndex] = value;
        total += value;
      }
    }

    if (total > 0) {
      rows.push({
        componentCode: def.code,
        componentName: def.name,
        componentType: def.componentType,
        isExpandable: def.isExpandable || false,
        displayOrder: def.displayOrder,
        values,
        total,
      });
    }
  }

  // Build deduction rows
  for (const def of deductionDefs) {
    const field = codeToField[def.code];
    const values: (number | null)[] = Array(12).fill(null);
    let total = 0;

    for (const [monthIndex, record] of monthData) {
      const recordAny = record as unknown as Record<string, number>;
      const value = field ? recordAny[field] : 0;
      if (value && value > 0) {
        values[monthIndex] = value;
        total += value;
      }
    }

    if (total > 0) {
      rows.push({
        componentCode: def.code,
        componentName: def.name,
        componentType: def.componentType,
        isExpandable: def.isExpandable || false,
        displayOrder: def.displayOrder,
        values,
        total,
      });
    }
  }

  // Build employer contribution rows
  for (const def of employerDefs) {
    const field = codeToField[def.code];
    const values: (number | null)[] = Array(12).fill(null);
    let total = 0;

    for (const [monthIndex, record] of monthData) {
      const recordAny = record as unknown as Record<string, number | undefined>;
      const value = field ? recordAny[field] : 0;
      if (value && value > 0) {
        values[monthIndex] = value;
        total += value;
      }
    }

    if (total > 0) {
      rows.push({
        componentCode: def.code,
        componentName: def.name,
        componentType: def.componentType,
        isExpandable: false,
        displayOrder: def.displayOrder,
        values,
        total,
      });
    }
  }

  return {
    financialYear: props.financialYear,
    incomeSourceId: "",
    employerName: "",
    rows,
    paidDays,
    totalPaidDays: paidDays.reduce((sum: number, v) => sum + (v || 0), 0),
    grossEarnings,
    totalGrossEarnings: grossEarnings.reduce((sum: number, v) => sum + (v || 0), 0),
    totalDeductions,
    totalTotalDeductions: totalDeductions.reduce((sum: number, v) => sum + (v || 0), 0),
    netSalary,
    totalNetSalary: netSalary.reduce((sum: number, v) => sum + (v || 0), 0),
  };
});

// Group rows by type
const earningRows = computed(() => gridData.value?.rows.filter((r) => r.componentType === "EARNING") || []);
const deductionRows = computed(() => gridData.value?.rows.filter((r) => r.componentType === "DEDUCTION") || []);
const employerRows = computed(() => gridData.value?.rows.filter((r) => r.componentType === "EMPLOYER_CONTRIBUTION") || []);

// Generate month headers
const monthHeaders = computed(() => {
  const [startYear, endYearShort] = props.financialYear.split("-");
  const endYear = 2000 + parseInt(endYearShort);

  return FY_MONTHS.map((m, index) => {
    const year = index < 9 ? parseInt(startYear) : endYear;
    return `${m.shortLabel}'${String(year).slice(-2)}`;
  });
});

// Get employer name for a month
const getEmployerName = (monthIndex: number): string => {
  const employerId = monthlyEmployers.value[monthIndex];
  if (!employerId || !incomeSources.value) return "-";

  const source = incomeSources.value.find((s) => s.id === employerId);
  return source?.sourceName?.substring(0, 6) || "-";
};

// Toggle expand for a row
const toggleExpand = (code: string) => {
  if (expandedRows.value.has(code)) {
    expandedRows.value.delete(code);
  } else {
    expandedRows.value.add(code);
  }
};

// Check if row is visible (for sub-components)
const isRowVisible = (row: SalaryGridRow): boolean => {
  if (!row.isSubComponent) return true;
  return row.parentCode ? expandedRows.value.has(row.parentCode) : false;
};

// Enter edit mode
const enterEditMode = () => {
  isEditMode.value = true;
  hasUnsavedChanges.value = false;
};

// Cancel edit mode
const cancelEditMode = () => {
  isEditMode.value = false;
  hasUnsavedChanges.value = false;
};

// Save changes
const saveChanges = async () => {
  // TODO: Implement save logic
  isEditMode.value = false;
  hasUnsavedChanges.value = false;
};

// Format value for display
const formatValue = (value: number | null): string => {
  if (value === null || value === undefined || value === 0) return "-";
  return formatINRLakhs(value);
};

// Get source month label for copy dialog
const sourceMonthLabel = computed(() => {
  return monthHeaders.value[selectedMonthIndex.value] || "";
});

// Get previous month label
const previousMonthLabel = computed(() => {
  if (selectedMonthIndex.value === 0) {
    // For April, previous is March of previous FY
    const [startYear] = props.financialYear.split("-").map(Number);
    return `Mar'${String(startYear).slice(-2)}`;
  }
  return monthHeaders.value[selectedMonthIndex.value - 1] || "";
});

// Get remaining months after selected
const remainingMonths = computed(() => {
  return monthHeaders.value.slice(selectedMonthIndex.value + 1);
});

// Check if this is the first month (April) - for Import from Prev FY option
const isFirstMonth = computed(() => selectedMonthIndex.value === 0);

// Previous FY data for import dialog
const previousFyData = computed(() => {
  // TODO: Fetch actual previous FY data
  const [startYear] = props.financialYear.split("-").map(Number);
  return {
    employer: incomeSources.value?.[0]?.sourceName || "Previous Employer",
    grossEarnings: 295967,
    deductions: 106959,
    netSalary: 189008,
    month: `Mar'${String(startYear).slice(-2)}`,
  };
});

// Column header menu handlers
const handleCopyToRemaining = (monthIndex: number) => {
  selectedMonthIndex.value = monthIndex;
  copyMode.value = "copy-to-remaining";
  showCopyDialog.value = true;
};

const handleCopyFromPrevious = (monthIndex: number) => {
  selectedMonthIndex.value = monthIndex;
  if (monthIndex === 0) {
    // For April, this becomes "Import from Prev FY"
    copyMode.value = "import-prev-fy";
  } else {
    copyMode.value = "copy-from-prev";
  }
  showCopyDialog.value = true;
};

const handleClearMonth = (monthIndex: number) => {
  selectedMonthIndex.value = monthIndex;
  copyMode.value = "clear";
  showCopyDialog.value = true;
};

// Handle copy dialog confirm
const handleCopyConfirm = (options: {
  mode: CopyMode;
  includeEmployer: boolean;
  includePaidDays: boolean;
  includeEarnings: boolean;
  includeDeductions: boolean;
  includeEmployerContrib: boolean;
  targetScope: "single" | "all";
}) => {
  console.log("Copy confirmed:", options);
  // TODO: Implement actual copy logic
  hasUnsavedChanges.value = true;
};

// Settings menu items
const settingsMenuItems = [
  { title: "Manage Employers", icon: "mdi-domain", action: () => emit("manage-employers") },
  { title: "Manage Salary Components", icon: "mdi-format-list-bulleted", action: () => emit("manage-components") },
  { divider: true },
  { title: "Import from Excel", icon: "mdi-file-excel", action: () => emit("import-excel") },
  { title: "Export to Excel", icon: "mdi-download", action: () => emit("export-excel") },
];
</script>

<template>
  <div class="salary-details-tab">
    <!-- Action Bar -->
    <div class="d-flex justify-space-between align-center mb-4">
      <div>
        <!-- Import from Previous FY (only show when empty) -->
        <v-btn
          v-if="isEditMode && (!gridData || gridData.rows.length === 0)"
          color="primary"
          variant="tonal"
          size="small"
          prepend-icon="mdi-clipboard-arrow-down"
        >
          Import from Mar'{{ parseInt(financialYear.split("-")[0]) - 1 }}
        </v-btn>
      </div>

      <div class="d-flex ga-2">
        <template v-if="isEditMode">
          <v-btn color="success" variant="flat" size="small" prepend-icon="mdi-check" @click="saveChanges">
            Save
          </v-btn>
          <v-btn color="error" variant="outlined" size="small" prepend-icon="mdi-close" @click="cancelEditMode">
            Cancel
          </v-btn>
        </template>
        <template v-else>
          <v-btn color="primary" variant="tonal" size="small" prepend-icon="mdi-pencil" @click="enterEditMode">
            Edit Mode
          </v-btn>
        </template>

        <v-menu>
          <template #activator="{ props: menuProps }">
            <v-btn icon="mdi-cog" variant="text" size="small" v-bind="menuProps" />
          </template>
          <v-list density="compact">
            <template v-for="(item, index) in settingsMenuItems" :key="index">
              <v-divider v-if="item.divider" />
              <v-list-item v-else @click="item.action">
                <template #prepend>
                  <v-icon :icon="item.icon" size="small" />
                </template>
                <v-list-item-title>{{ item.title }}</v-list-item-title>
              </v-list-item>
            </template>
          </v-list>
        </v-menu>

        <v-btn icon="mdi-download" variant="text" size="small" title="Export" @click="emit('export-excel')" />
      </div>
    </div>

    <!-- Salary Grid -->
    <v-card variant="outlined" :loading="isLoading">
      <div class="grid-wrapper">
        <table class="salary-grid">
          <!-- Header -->
          <thead>
            <tr>
              <th class="component-header sticky-column">Component</th>
              <th v-for="(header, index) in monthHeaders" :key="index" class="month-header">
                <template v-if="isEditMode">
                  <v-menu location="bottom">
                    <template #activator="{ props: menuProps }">
                      <div v-bind="menuProps" class="month-header-btn d-flex flex-column align-center">
                        <span>{{ header }}</span>
                        <v-icon icon="mdi-menu-down" size="x-small" class="mt-1" />
                      </div>
                    </template>
                    <v-list density="compact">
                      <!-- Copy to remaining months (only if not last month) -->
                      <v-list-item
                        v-if="index < 11"
                        @click="handleCopyToRemaining(index)"
                      >
                        <template #prepend>
                          <v-icon icon="mdi-content-copy" size="small" />
                        </template>
                        <v-list-item-title>Copy to remaining months</v-list-item-title>
                      </v-list-item>

                      <!-- Copy from previous / Import from Prev FY -->
                      <v-list-item @click="handleCopyFromPrevious(index)">
                        <template #prepend>
                          <v-icon icon="mdi-clipboard-arrow-down" size="small" />
                        </template>
                        <v-list-item-title>
                          {{ index === 0 ? `Import from ${previousMonthLabel} (Prev FY)` : `Copy from ${monthHeaders[index - 1]}` }}
                        </v-list-item-title>
                      </v-list-item>

                      <v-divider />

                      <!-- Clear this month -->
                      <v-list-item @click="handleClearMonth(index)">
                        <template #prepend>
                          <v-icon icon="mdi-delete-outline" size="small" color="error" />
                        </template>
                        <v-list-item-title class="text-error">Clear this month</v-list-item-title>
                      </v-list-item>
                    </v-list>
                  </v-menu>
                </template>
                <template v-else>
                  <div class="d-flex flex-column align-center">
                    <span>{{ header }}</span>
                  </div>
                </template>
              </th>
              <th class="total-header">Total</th>
              <th class="total-header">Bonus</th>
              <th class="total-header">Perks</th>
              <th class="total-header fy-total-header">FY Total</th>
            </tr>
          </thead>

          <tbody v-if="gridData">
            <!-- Employer Row -->
            <tr class="employer-row">
              <td class="component-cell sticky-column">Employer</td>
              <td v-for="(_, index) in 12" :key="`emp-${index}`" class="value-cell">
                <template v-if="isEditMode">
                  <v-select
                    v-model="monthlyEmployers[index]"
                    :items="incomeSources || []"
                    item-title="sourceName"
                    item-value="id"
                    density="compact"
                    variant="underlined"
                    hide-details
                    class="employer-select"
                  >
                    <template #append-item>
                      <v-divider />
                      <v-list-item @click="emit('add-employer')">
                        <template #prepend>
                          <v-icon icon="mdi-plus" color="primary" />
                        </template>
                        <v-list-item-title class="text-primary">Add New Employer...</v-list-item-title>
                      </v-list-item>
                    </template>
                  </v-select>
                </template>
                <template v-else>
                  {{ getEmployerName(index) }}
                </template>
              </td>
              <td class="total-cell">-</td>
              <td class="total-cell">-</td>
              <td class="total-cell">-</td>
              <td class="total-cell fy-total-cell">-</td>
            </tr>

            <!-- Paid Days Row -->
            <tr class="paid-days-row">
              <td class="component-cell sticky-column">Paid Days</td>
              <td v-for="(days, index) in gridData.paidDays" :key="`days-${index}`" class="value-cell">
                <template v-if="isEditMode">
                  <v-text-field
                    :model-value="days || ''"
                    type="number"
                    density="compact"
                    variant="underlined"
                    hide-details
                    class="value-input"
                  />
                </template>
                <template v-else>
                  {{ days !== null ? days : "-" }}
                </template>
              </td>
              <td class="total-cell font-weight-bold">{{ gridData.totalPaidDays }}</td>
              <td class="total-cell">-</td>
              <td class="total-cell">-</td>
              <td class="total-cell fy-total-cell">-</td>
            </tr>

            <!-- EARNINGS Section -->
            <tr class="section-header-row">
              <td colspan="17" class="section-header">
                <v-icon icon="mdi-plus-circle-outline" size="small" class="mr-2" color="success" />
                EARNINGS
              </td>
            </tr>

            <tr v-for="row in earningRows" :key="row.componentCode" class="data-row">
              <td class="component-cell sticky-column">
                <div class="d-flex align-center">
                  <v-btn
                    v-if="row.isExpandable"
                    icon
                    size="x-small"
                    variant="text"
                    @click.stop="toggleExpand(row.componentCode)"
                  >
                    <v-icon :icon="expandedRows.has(row.componentCode) ? 'mdi-chevron-down' : 'mdi-chevron-right'" size="small" />
                  </v-btn>
                  <span>{{ row.componentName }}</span>
                </div>
              </td>
              <td v-for="(value, index) in row.values" :key="`${row.componentCode}-${index}`" class="value-cell">
                <template v-if="isEditMode">
                  <v-text-field
                    :model-value="value || ''"
                    type="number"
                    density="compact"
                    variant="underlined"
                    hide-details
                    class="value-input"
                  />
                </template>
                <template v-else>
                  {{ formatValue(value) }}
                </template>
              </td>
              <td class="total-cell">{{ formatValue(row.total) }}</td>
              <td class="total-cell">-</td>
              <td class="total-cell">-</td>
              <td class="total-cell fy-total-cell font-weight-medium">{{ formatValue(row.total) }}</td>
            </tr>

            <!-- Gross Earnings Row -->
            <tr class="summary-row gross-row">
              <td class="component-cell sticky-column font-weight-bold">Gross (A)</td>
              <td v-for="(value, index) in gridData.grossEarnings" :key="`gross-${index}`" class="value-cell font-weight-medium">
                {{ formatValue(value) }}
              </td>
              <td class="total-cell font-weight-bold">{{ formatValue(gridData.totalGrossEarnings) }}</td>
              <td class="total-cell">-</td>
              <td class="total-cell">-</td>
              <td class="total-cell fy-total-cell font-weight-bold">{{ formatValue(gridData.totalGrossEarnings) }}</td>
            </tr>

            <!-- DEDUCTIONS Section -->
            <tr class="section-header-row">
              <td colspan="17" class="section-header">
                <v-icon icon="mdi-minus-circle-outline" size="small" class="mr-2" color="error" />
                DEDUCTIONS
              </td>
            </tr>

            <tr v-for="row in deductionRows" :key="row.componentCode" class="data-row">
              <td class="component-cell sticky-column">
                <div class="d-flex align-center">
                  <v-btn
                    v-if="row.isExpandable"
                    icon
                    size="x-small"
                    variant="text"
                    @click.stop="toggleExpand(row.componentCode)"
                  >
                    <v-icon :icon="expandedRows.has(row.componentCode) ? 'mdi-chevron-down' : 'mdi-chevron-right'" size="small" />
                  </v-btn>
                  <span>{{ row.componentName }}</span>
                </div>
              </td>
              <td v-for="(value, index) in row.values" :key="`${row.componentCode}-${index}`" class="value-cell">
                <template v-if="isEditMode">
                  <v-text-field
                    :model-value="value || ''"
                    type="number"
                    density="compact"
                    variant="underlined"
                    hide-details
                    class="value-input"
                  />
                </template>
                <template v-else>
                  {{ formatValue(value) }}
                </template>
              </td>
              <td class="total-cell">{{ formatValue(row.total) }}</td>
              <td class="total-cell">-</td>
              <td class="total-cell">-</td>
              <td class="total-cell fy-total-cell font-weight-medium">{{ formatValue(row.total) }}</td>
            </tr>

            <!-- Total Deductions Row -->
            <tr class="summary-row deductions-row">
              <td class="component-cell sticky-column font-weight-bold">Ded (B)</td>
              <td v-for="(value, index) in gridData.totalDeductions" :key="`ded-${index}`" class="value-cell font-weight-medium">
                {{ formatValue(value) }}
              </td>
              <td class="total-cell font-weight-bold">{{ formatValue(gridData.totalTotalDeductions) }}</td>
              <td class="total-cell">-</td>
              <td class="total-cell">-</td>
              <td class="total-cell fy-total-cell font-weight-bold">{{ formatValue(gridData.totalTotalDeductions) }}</td>
            </tr>

            <!-- EMPLOYER CONTRIBUTIONS Section -->
            <template v-if="employerRows.length > 0">
              <tr class="section-header-row">
                <td colspan="17" class="section-header">
                  <v-icon icon="mdi-office-building" size="small" class="mr-2" color="info" />
                  EMPLOYER CONTRIBUTIONS (Info Only)
                </td>
              </tr>

              <tr v-for="row in employerRows" :key="row.componentCode" class="data-row employer-contrib-row">
                <td class="component-cell sticky-column text-medium-emphasis">{{ row.componentName }}</td>
                <td v-for="(value, index) in row.values" :key="`${row.componentCode}-${index}`" class="value-cell text-medium-emphasis">
                  <template v-if="isEditMode">
                    <v-text-field
                      :model-value="value || ''"
                      type="number"
                      density="compact"
                      variant="underlined"
                      hide-details
                      class="value-input"
                    />
                  </template>
                  <template v-else>
                    {{ formatValue(value) }}
                  </template>
                </td>
                <td class="total-cell text-medium-emphasis">{{ formatValue(row.total) }}</td>
                <td class="total-cell">-</td>
                <td class="total-cell">-</td>
                <td class="total-cell fy-total-cell text-medium-emphasis">{{ formatValue(row.total) }}</td>
              </tr>
            </template>

            <!-- Net Salary Row -->
            <tr class="summary-row net-row">
              <td class="component-cell sticky-column font-weight-bold text-primary">Net (A-B)</td>
              <td v-for="(value, index) in gridData.netSalary" :key="`net-${index}`" class="value-cell font-weight-bold">
                {{ formatValue(value) }}
              </td>
              <td class="total-cell font-weight-bold text-primary">{{ formatValue(gridData.totalNetSalary) }}</td>
              <td class="total-cell">-</td>
              <td class="total-cell">-</td>
              <td class="total-cell fy-total-cell font-weight-bold text-primary">{{ formatValue(gridData.totalNetSalary) }}</td>
            </tr>
          </tbody>

          <!-- Empty State -->
          <tbody v-else-if="!isLoading">
            <tr>
              <td colspan="17" class="empty-state">
                <div class="d-flex flex-column align-center pa-8">
                  <v-icon icon="mdi-calendar-blank-outline" size="64" color="grey-lighten-1" class="mb-4" />
                  <div class="text-h6 text-medium-emphasis mb-2">No salary data for FY {{ financialYear }}</div>
                  <div class="text-body-2 text-medium-emphasis mb-4">
                    Start by adding your employer and salary entries
                  </div>
                  <div class="d-flex ga-2">
                    <v-btn color="primary" variant="flat" @click="emit('add-employer')">
                      <v-icon icon="mdi-plus" class="mr-2" />
                      Add Employer
                    </v-btn>
                    <v-btn color="secondary" variant="tonal" @click="enterEditMode">
                      <v-icon icon="mdi-pencil" class="mr-2" />
                      Enter Data
                    </v-btn>
                  </div>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </v-card>

    <!-- Bottom Actions -->
    <div class="d-flex justify-space-between align-center mt-4">
      <v-btn variant="text" size="small" prepend-icon="mdi-plus" @click="toggleExpand('custom')">
        Add Row
      </v-btn>
      <v-btn color="primary" variant="tonal" size="small" prepend-icon="mdi-domain-plus" @click="emit('add-employer')">
        Add Employer
      </v-btn>
    </div>

    <!-- Copy Data Dialog -->
    <CopyDataDialog
      v-model="showCopyDialog"
      :mode="copyMode"
      :source-month="sourceMonthLabel"
      :target-month="monthHeaders[selectedMonthIndex]"
      :financial-year="financialYear"
      :previous-fy-data="previousFyData"
      :remaining-months="remainingMonths"
      @confirm="handleCopyConfirm"
    />
  </div>
</template>

<style scoped>
.salary-details-tab {
  width: 100%;
}

.grid-wrapper {
  overflow-x: auto;
  max-width: 100%;
}

.salary-grid {
  width: 100%;
  border-collapse: collapse;
  min-width: 1400px;
  font-size: 0.8125rem;
}

/* Headers */
.component-header,
.month-header,
.total-header {
  padding: 12px 8px;
  text-align: center;
  font-weight: 600;
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.03em;
  background: rgba(var(--v-theme-on-surface), 0.04);
  border-bottom: 2px solid rgba(var(--v-border-color), var(--v-border-opacity));
}

.component-header {
  text-align: left;
  min-width: 160px;
}

.month-header {
  min-width: 72px;
}

.month-header-btn {
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 4px;
  transition: background-color 0.2s ease;
}

.month-header-btn:hover {
  background: rgba(var(--v-theme-primary), 0.12);
}

.total-header {
  min-width: 80px;
  background: rgba(var(--v-theme-primary), 0.04);
}

.fy-total-header {
  background: rgba(var(--v-theme-primary), 0.08);
}

/* Cells */
.component-cell {
  text-align: left;
  padding: 10px 12px;
  background: rgb(var(--v-theme-surface));
  border-bottom: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
}

.sticky-column {
  position: sticky;
  left: 0;
  z-index: 2;
  box-shadow: 2px 0 4px rgba(0, 0, 0, 0.05);
}

.value-cell {
  text-align: right;
  padding: 6px 8px;
  font-family: "Roboto Mono", monospace;
  border-bottom: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
}

.total-cell {
  text-align: right;
  padding: 6px 8px;
  font-family: "Roboto Mono", monospace;
  background: rgba(var(--v-theme-primary), 0.02);
  border-bottom: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
}

.fy-total-cell {
  background: rgba(var(--v-theme-primary), 0.06);
}

/* Section Headers */
.section-header-row .section-header {
  padding: 10px 12px;
  font-weight: 600;
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  background: rgba(var(--v-theme-on-surface), 0.03);
  color: rgb(var(--v-theme-on-surface-variant));
}

/* Special Rows */
.employer-row {
  background: rgba(var(--v-theme-info), 0.02);
}

.paid-days-row {
  background: rgba(var(--v-theme-primary), 0.02);
}

.summary-row {
  background: rgba(var(--v-theme-primary), 0.04);
}

.gross-row .component-cell,
.deductions-row .component-cell,
.net-row .component-cell {
  font-weight: 600;
}

.net-row {
  background: rgba(var(--v-theme-primary), 0.08);
}

.employer-contrib-row {
  background: rgba(var(--v-theme-on-surface), 0.01);
}

/* Data Rows Hover */
.data-row:hover {
  background: rgba(var(--v-theme-primary), 0.02);
}

.data-row:hover .sticky-column {
  background: rgba(var(--v-theme-primary), 0.04);
}

/* Input Fields */
.value-input {
  max-width: 72px;
  font-size: 0.75rem;
}

.value-input :deep(.v-field__input) {
  text-align: right;
  font-family: "Roboto Mono", monospace;
  padding: 2px 4px;
  min-height: 24px;
}

.employer-select {
  max-width: 72px;
  font-size: 0.7rem;
}

.employer-select :deep(.v-field__input) {
  padding: 2px 4px;
  min-height: 24px;
}

/* Empty State */
.empty-state {
  text-align: center;
  background: rgb(var(--v-theme-surface));
}
</style>
