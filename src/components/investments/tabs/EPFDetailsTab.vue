<script setup lang="ts">
import { ref, computed } from "vue";
import { FY_MONTHS } from "@/types/salary";
import { formatINRCompact, formatINR } from "@/composables/useInvestments";

const props = defineProps<{
  financialYear: string;
}>();

const emit = defineEmits<{
  (e: "update-balance"): void;
}>();

// Edit mode state
const isEditMode = ref(false);
const hasUnsavedChanges = ref(false);

// Mock EPF monthly data - in real app, this would come from API based on salary history
interface EPFMonthlyRecord {
  month: number; // 1-12 (FY month, 1=April)
  basicSalary: number | null;
  employeePF: number | null;
  employerPF: number | null;
  employerEPS: number | null;
  vpf: number | null;
  totalContribution: number | null;
  runningBalance: number | null;
}

const mockMonthlyData = ref<EPFMonthlyRecord[]>([
  { month: 1, basicSalary: 120000, employeePF: 14400, employerPF: 4404, employerEPS: 9996, vpf: 5000, totalContribution: 33800, runningBalance: 1233800 },
  { month: 2, basicSalary: 120000, employeePF: 14400, employerPF: 4404, employerEPS: 9996, vpf: 5000, totalContribution: 33800, runningBalance: 1267600 },
  { month: 3, basicSalary: 120000, employeePF: 14400, employerPF: 4404, employerEPS: 9996, vpf: 5000, totalContribution: 33800, runningBalance: 1301400 },
  { month: 4, basicSalary: 120000, employeePF: 14400, employerPF: 4404, employerEPS: 9996, vpf: 5000, totalContribution: 33800, runningBalance: 1335200 },
  { month: 5, basicSalary: 120000, employeePF: 14400, employerPF: 4404, employerEPS: 9996, vpf: 5000, totalContribution: 33800, runningBalance: 1369000 },
  { month: 6, basicSalary: 125000, employeePF: 15000, employerPF: 4588, employerEPS: 10412, vpf: 5000, totalContribution: 35000, runningBalance: 1404000 },
  { month: 7, basicSalary: 125000, employeePF: 15000, employerPF: 4588, employerEPS: 10412, vpf: 5000, totalContribution: 35000, runningBalance: 1439000 },
  { month: 8, basicSalary: 125000, employeePF: 15000, employerPF: 4588, employerEPS: 10412, vpf: 5000, totalContribution: 35000, runningBalance: 1474000 },
  { month: 9, basicSalary: null, employeePF: null, employerPF: null, employerEPS: null, vpf: null, totalContribution: null, runningBalance: null },
  { month: 10, basicSalary: null, employeePF: null, employerPF: null, employerEPS: null, vpf: null, totalContribution: null, runningBalance: null },
  { month: 11, basicSalary: null, employeePF: null, employerPF: null, employerEPS: null, vpf: null, totalContribution: null, runningBalance: null },
  { month: 12, basicSalary: null, employeePF: null, employerPF: null, employerEPS: null, vpf: null, totalContribution: null, runningBalance: null },
]);

// Generate month headers based on FY
const monthHeaders = computed(() => {
  const [startYear, endYearShort] = props.financialYear.split("-");
  const endYear = 2000 + parseInt(endYearShort);

  return FY_MONTHS.map((m, index) => {
    const year = index < 9 ? parseInt(startYear) : endYear;
    return `${m.shortLabel}'${String(year).slice(-2)}`;
  });
});

// Row definitions
interface GridRowDef {
  code: string;
  label: string;
  icon: string;
  iconColor: string;
  dataKey: keyof EPFMonthlyRecord;
  editable: boolean;
  isSummary?: boolean;
  isSection?: boolean;
  sectionTitle?: string;
}

const rowDefinitions: GridRowDef[] = [
  { code: "basic", label: "Basic Salary", icon: "mdi-currency-inr", iconColor: "primary", dataKey: "basicSalary", editable: false },
  { code: "section_employee", label: "", icon: "", iconColor: "", dataKey: "basicSalary", editable: false, isSection: true, sectionTitle: "EMPLOYEE CONTRIBUTION" },
  { code: "employee_pf", label: "Employee PF (12%)", icon: "mdi-account", iconColor: "primary", dataKey: "employeePF", editable: true },
  { code: "section_employer", label: "", icon: "", iconColor: "", dataKey: "basicSalary", editable: false, isSection: true, sectionTitle: "EMPLOYER CONTRIBUTION" },
  { code: "employer_pf", label: "Employer EPF (3.67%)", icon: "mdi-domain", iconColor: "info", dataKey: "employerPF", editable: true },
  { code: "employer_eps", label: "Employer EPS (8.33%)", icon: "mdi-shield-account", iconColor: "warning", dataKey: "employerEPS", editable: true },
  { code: "section_vpf", label: "", icon: "", iconColor: "", dataKey: "basicSalary", editable: false, isSection: true, sectionTitle: "VOLUNTARY CONTRIBUTION" },
  { code: "vpf", label: "VPF", icon: "mdi-plus-circle", iconColor: "success", dataKey: "vpf", editable: true },
  { code: "total", label: "Total Contribution", icon: "mdi-sigma", iconColor: "primary", dataKey: "totalContribution", editable: false, isSummary: true },
  { code: "balance", label: "Running Balance", icon: "mdi-bank", iconColor: "teal", dataKey: "runningBalance", editable: false, isSummary: true },
];

// Get row values for a specific row definition
const getRowValues = (rowDef: GridRowDef): (number | null)[] => {
  return mockMonthlyData.value.map((record) => record[rowDef.dataKey] as number | null);
};

// Calculate row total
const getRowTotal = (rowDef: GridRowDef): number => {
  return mockMonthlyData.value.reduce((sum, record) => {
    const value = record[rowDef.dataKey] as number | null;
    return sum + (value || 0);
  }, 0);
};

// Format value for display
const formatValue = (value: number | null): string => {
  if (value === null || value === undefined) return "-";
  if (value === 0) return "-";
  return formatINRCompact(value);
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
  // TODO: Implement save logic to backend
  isEditMode.value = false;
  hasUnsavedChanges.value = false;
};

// Handle value update
const handleValueUpdate = (rowCode: string, monthIndex: number, newValue: string) => {
  const numValue = parseFloat(newValue) || 0;
  const rowDef = rowDefinitions.find((r) => r.code === rowCode);
  if (rowDef && rowDef.editable) {
    mockMonthlyData.value[monthIndex][rowDef.dataKey] = numValue as never;
    hasUnsavedChanges.value = true;

    // Recalculate total contribution for this month
    const record = mockMonthlyData.value[monthIndex];
    record.totalContribution =
      (record.employeePF || 0) +
      (record.employerPF || 0) +
      (record.vpf || 0);
  }
};

// Summary totals
const summaryTotals = computed(() => ({
  employeePF: mockMonthlyData.value.reduce((sum, r) => sum + (r.employeePF || 0), 0),
  employerPF: mockMonthlyData.value.reduce((sum, r) => sum + (r.employerPF || 0), 0),
  employerEPS: mockMonthlyData.value.reduce((sum, r) => sum + (r.employerEPS || 0), 0),
  vpf: mockMonthlyData.value.reduce((sum, r) => sum + (r.vpf || 0), 0),
  totalContribution: mockMonthlyData.value.reduce((sum, r) => sum + (r.totalContribution || 0), 0),
}));

// Check which months have data
const monthsWithData = computed(() =>
  mockMonthlyData.value.filter((r) => r.employeePF !== null).length
);
</script>

<template>
  <div class="epf-details-tab">
    <!-- Action Bar -->
    <div class="d-flex justify-space-between align-center mb-4">
      <div>
        <v-chip color="info" variant="tonal" size="small">
          <v-icon icon="mdi-calendar-check" size="small" class="mr-1" />
          {{ monthsWithData }}/12 months with data
        </v-chip>
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

        <v-btn
          icon="mdi-refresh"
          variant="text"
          size="small"
          title="Sync from Salary"
          @click="emit('update-balance')"
        />
        <v-btn icon="mdi-download" variant="text" size="small" title="Export" />
      </div>
    </div>

    <!-- EPF Grid -->
    <v-card variant="outlined">
      <div class="grid-wrapper">
        <table class="epf-grid">
          <!-- Header -->
          <thead>
            <tr>
              <th class="component-header sticky-column">Component</th>
              <th v-for="(header, index) in monthHeaders" :key="index" class="month-header">
                {{ header }}
              </th>
              <th class="total-header">FY Total</th>
            </tr>
          </thead>

          <tbody>
            <template v-for="rowDef in rowDefinitions" :key="rowDef.code">
              <!-- Section Header Row -->
              <tr v-if="rowDef.isSection" class="section-header-row">
                <td colspan="14" class="section-header">
                  <v-icon
                    :icon="rowDef.code === 'section_employee' ? 'mdi-account' : rowDef.code === 'section_employer' ? 'mdi-domain' : 'mdi-plus-circle'"
                    size="small"
                    class="mr-2"
                    :color="rowDef.code === 'section_employee' ? 'primary' : rowDef.code === 'section_employer' ? 'info' : 'success'"
                  />
                  {{ rowDef.sectionTitle }}
                </td>
              </tr>

              <!-- Data Row -->
              <tr
                v-else
                :class="[
                  'data-row',
                  { 'summary-row': rowDef.isSummary },
                  { 'total-row': rowDef.code === 'total' },
                  { 'balance-row': rowDef.code === 'balance' },
                ]"
              >
                <td class="component-cell sticky-column" :class="{ 'font-weight-bold': rowDef.isSummary }">
                  <div class="d-flex align-center">
                    <v-icon :icon="rowDef.icon" size="small" :color="rowDef.iconColor" class="mr-2" />
                    {{ rowDef.label }}
                  </div>
                </td>
                <td
                  v-for="(value, index) in getRowValues(rowDef)"
                  :key="`${rowDef.code}-${index}`"
                  class="value-cell"
                >
                  <template v-if="isEditMode && rowDef.editable && !rowDef.isSummary">
                    <v-text-field
                      :model-value="value || ''"
                      type="number"
                      density="compact"
                      variant="underlined"
                      hide-details
                      class="value-input"
                      @update:model-value="handleValueUpdate(rowDef.code, index, $event)"
                    />
                  </template>
                  <template v-else>
                    <span :class="{ 'font-weight-medium': rowDef.isSummary }">
                      {{ formatValue(value) }}
                    </span>
                  </template>
                </td>
                <td class="total-cell" :class="{ 'font-weight-bold': rowDef.isSummary }">
                  {{ rowDef.code === 'balance' ? formatValue(mockMonthlyData[monthsWithData - 1]?.runningBalance || null) : formatValue(getRowTotal(rowDef)) }}
                </td>
              </tr>
            </template>
          </tbody>
        </table>
      </div>
    </v-card>

    <!-- FY Summary -->
    <v-card variant="outlined" class="mt-4">
      <v-card-title class="text-subtitle-1">
        <v-icon icon="mdi-chart-box" class="mr-2" color="primary" />
        FY {{ financialYear }} Summary
      </v-card-title>
      <v-card-text>
        <v-row>
          <v-col cols="6" md="2">
            <div class="text-caption text-medium-emphasis">Employee PF</div>
            <div class="text-h6 font-weight-bold text-primary">
              {{ formatINRCompact(summaryTotals.employeePF) }}
            </div>
            <div class="text-caption text-success">80C eligible</div>
          </v-col>
          <v-col cols="6" md="2">
            <div class="text-caption text-medium-emphasis">Employer EPF</div>
            <div class="text-h6 font-weight-bold text-info">
              {{ formatINRCompact(summaryTotals.employerPF) }}
            </div>
            <div class="text-caption text-medium-emphasis">Tax-free</div>
          </v-col>
          <v-col cols="6" md="2">
            <div class="text-caption text-medium-emphasis">Employer EPS</div>
            <div class="text-h6 font-weight-bold text-warning">
              {{ formatINRCompact(summaryTotals.employerEPS) }}
            </div>
            <div class="text-caption text-medium-emphasis">Pension fund</div>
          </v-col>
          <v-col cols="6" md="2">
            <div class="text-caption text-medium-emphasis">VPF</div>
            <div class="text-h6 font-weight-bold text-success">
              {{ formatINRCompact(summaryTotals.vpf) }}
            </div>
            <div class="text-caption text-success">80C eligible</div>
          </v-col>
          <v-col cols="12" md="4">
            <v-card color="primary" variant="tonal" class="pa-3 text-center">
              <div class="text-caption">Total FY Contribution</div>
              <div class="text-h5 font-weight-bold">
                {{ formatINRCompact(summaryTotals.totalContribution) }}
              </div>
            </v-card>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <!-- Info Alert -->
    <v-alert type="info" variant="tonal" density="compact" class="mt-4">
      <div class="text-body-2">
        <strong>Note:</strong> EPF contributions are automatically synced from your salary data.
        VPF can be edited manually. Use "Sync from Salary" to pull latest data.
      </div>
    </v-alert>
  </div>
</template>

<style scoped>
.epf-details-tab {
  width: 100%;
}

.grid-wrapper {
  overflow-x: auto;
  max-width: 100%;
}

.epf-grid {
  width: 100%;
  border-collapse: collapse;
  min-width: 1100px;
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
  min-width: 180px;
}

.month-header {
  min-width: 72px;
}

.total-header {
  min-width: 90px;
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
  padding: 6px 12px;
  font-family: "Roboto Mono", monospace;
  background: rgba(var(--v-theme-primary), 0.06);
  border-bottom: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
}

/* Section Headers */
.section-header-row .section-header {
  padding: 8px 12px;
  font-weight: 600;
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  background: rgba(var(--v-theme-on-surface), 0.03);
  color: rgb(var(--v-theme-on-surface-variant));
}

/* Special Rows */
.summary-row {
  background: rgba(var(--v-theme-primary), 0.04);
}

.summary-row .component-cell {
  font-weight: 600;
}

.total-row {
  background: rgba(var(--v-theme-primary), 0.06);
}

.balance-row {
  background: rgba(var(--v-theme-teal), 0.06);
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
</style>
