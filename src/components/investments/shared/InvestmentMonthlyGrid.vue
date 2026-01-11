<script setup lang="ts">
import { ref, computed } from "vue";
import { FY_MONTHS } from "@/types/salary";
import { formatINRCompact } from "@/composables/useInvestments";

export interface GridRow {
  code: string;
  label: string;
  type: "currency" | "number" | "text";
  values: (number | null)[];
  total: number;
  editable?: boolean;
  isSummary?: boolean;
  color?: "success" | "error" | "info" | "warning" | "primary";
}

export interface GridSection {
  title: string;
  icon: string;
  iconColor: string;
  rows: GridRow[];
}

const props = withDefaults(
  defineProps<{
    financialYear: string;
    sections: GridSection[];
    loading?: boolean;
    readonly?: boolean;
    showTotalColumn?: boolean;
    showFYTotalColumn?: boolean;
  }>(),
  {
    loading: false,
    readonly: true,
    showTotalColumn: true,
    showFYTotalColumn: true,
  }
);

const emit = defineEmits<{
  (e: "update", payload: { code: string; monthIndex: number; value: number }): void;
  (e: "edit-mode-change", isEditing: boolean): void;
}>();

// Edit mode state
const isEditMode = ref(false);
const hasUnsavedChanges = ref(false);

// Generate month headers based on FY
const monthHeaders = computed(() => {
  const [startYear, endYearShort] = props.financialYear.split("-");
  const endYear = 2000 + parseInt(endYearShort);

  return FY_MONTHS.map((m, index) => {
    const year = index < 9 ? parseInt(startYear) : endYear;
    return `${m.shortLabel}'${String(year).slice(-2)}`;
  });
});

// Enter edit mode
const enterEditMode = () => {
  if (props.readonly) return;
  isEditMode.value = true;
  hasUnsavedChanges.value = false;
  emit("edit-mode-change", true);
};

// Cancel edit mode
const cancelEditMode = () => {
  isEditMode.value = false;
  hasUnsavedChanges.value = false;
  emit("edit-mode-change", false);
};

// Save changes
const saveChanges = async () => {
  isEditMode.value = false;
  hasUnsavedChanges.value = false;
  emit("edit-mode-change", false);
};

// Format value for display
const formatValue = (value: number | null, type: "currency" | "number" | "text"): string => {
  if (value === null || value === undefined) return "-";
  if (type === "currency") {
    if (value === 0) return "-";
    return formatINRCompact(value);
  }
  if (type === "number") {
    return value.toLocaleString("en-IN");
  }
  return String(value);
};

// Handle value update
const handleValueUpdate = (code: string, monthIndex: number, newValue: string) => {
  const numValue = parseFloat(newValue) || 0;
  emit("update", { code, monthIndex, value: numValue });
  hasUnsavedChanges.value = true;
};

// Get row class based on properties
const getRowClass = (row: GridRow): string => {
  const classes: string[] = ["data-row"];
  if (row.isSummary) classes.push("summary-row");
  if (row.color) classes.push(`row-${row.color}`);
  return classes.join(" ");
};
</script>

<template>
  <div class="investment-monthly-grid">
    <!-- Action Bar -->
    <div v-if="!readonly" class="d-flex justify-end align-center mb-4 ga-2">
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
    </div>

    <!-- Grid -->
    <v-card variant="outlined" :loading="loading">
      <div class="grid-wrapper">
        <table class="monthly-grid">
          <!-- Header -->
          <thead>
            <tr>
              <th class="component-header sticky-column">Component</th>
              <th v-for="(header, index) in monthHeaders" :key="index" class="month-header">
                {{ header }}
              </th>
              <th v-if="showTotalColumn" class="total-header">Total</th>
              <th v-if="showFYTotalColumn" class="total-header fy-total-header">FY Total</th>
            </tr>
          </thead>

          <tbody v-if="sections.length > 0">
            <template v-for="section in sections" :key="section.title">
              <!-- Section Header -->
              <tr class="section-header-row">
                <td :colspan="14 + (showTotalColumn ? 1 : 0) + (showFYTotalColumn ? 1 : 0)" class="section-header">
                  <v-icon :icon="section.icon" size="small" class="mr-2" :color="section.iconColor" />
                  {{ section.title }}
                </td>
              </tr>

              <!-- Section Rows -->
              <tr v-for="row in section.rows" :key="row.code" :class="getRowClass(row)">
                <td class="component-cell sticky-column" :class="{ 'font-weight-bold': row.isSummary }">
                  {{ row.label }}
                </td>
                <td v-for="(value, index) in row.values" :key="`${row.code}-${index}`" class="value-cell">
                  <template v-if="isEditMode && row.editable !== false && !row.isSummary">
                    <v-text-field
                      :model-value="value || ''"
                      type="number"
                      density="compact"
                      variant="underlined"
                      hide-details
                      class="value-input"
                      @update:model-value="handleValueUpdate(row.code, index, $event)"
                    />
                  </template>
                  <template v-else>
                    <span :class="{ 'font-weight-medium': row.isSummary }">
                      {{ formatValue(value, row.type) }}
                    </span>
                  </template>
                </td>
                <td v-if="showTotalColumn" class="total-cell" :class="{ 'font-weight-bold': row.isSummary }">
                  {{ formatValue(row.total, row.type) }}
                </td>
                <td v-if="showFYTotalColumn" class="total-cell fy-total-cell" :class="{ 'font-weight-bold': row.isSummary }">
                  {{ formatValue(row.total, row.type) }}
                </td>
              </tr>
            </template>
          </tbody>

          <!-- Empty State -->
          <tbody v-else-if="!loading">
            <tr>
              <td :colspan="14 + (showTotalColumn ? 1 : 0) + (showFYTotalColumn ? 1 : 0)" class="empty-state">
                <div class="d-flex flex-column align-center pa-8">
                  <v-icon icon="mdi-calendar-blank-outline" size="64" color="grey-lighten-1" class="mb-4" />
                  <div class="text-h6 text-medium-emphasis mb-2">No data for FY {{ financialYear }}</div>
                  <div class="text-body-2 text-medium-emphasis">
                    Start by adding your contribution details
                  </div>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </v-card>
  </div>
</template>

<style scoped>
.investment-monthly-grid {
  width: 100%;
}

.grid-wrapper {
  overflow-x: auto;
  max-width: 100%;
}

.monthly-grid {
  width: 100%;
  border-collapse: collapse;
  min-width: 1100px;
  font-size: 0.8125rem;
}

/* Headers - matched with SalaryMonthlyGrid */
.component-header,
.month-header,
.total-header {
  padding: 12px 10px;
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
  padding: 12px;
}

.month-header {
  min-width: 72px;
}

.total-header {
  min-width: 80px;
  background: rgba(var(--v-theme-primary), 0.04);
}

.fy-total-header {
  background: rgba(var(--v-theme-primary), 0.08);
}

/* Cells - aligned with SalaryMonthlyGrid */
.component-cell {
  text-align: left;
  padding: 10px 12px;
  font-size: 0.8125rem;
  min-width: 160px;
  background: rgb(var(--v-theme-surface));
  border-bottom: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
}

.sticky-column {
  position: sticky;
  left: 0;
  z-index: 1;
  box-shadow: 2px 0 4px rgba(0, 0, 0, 0.05);
}

.value-cell {
  text-align: right;
  padding: 8px 10px;
  font-size: 0.8125rem;
  font-family: "Roboto Mono", monospace;
  border-bottom: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
}

.total-cell {
  text-align: right;
  padding: 8px 10px;
  font-size: 0.8125rem;
  font-family: "Roboto Mono", monospace;
  background: rgba(var(--v-theme-primary), 0.04);
  border-bottom: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
}

.fy-total-cell {
  background: rgba(var(--v-theme-primary), 0.06);
}

/* Section Headers - matched with SalaryMonthlyGrid */
.section-header-row .section-header {
  padding: 12px;
  font-weight: 600;
  font-size: 0.75rem;
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

.row-success {
  background: rgba(var(--v-theme-success), 0.04);
}

.row-error {
  background: rgba(var(--v-theme-error), 0.04);
}

.row-info {
  background: rgba(var(--v-theme-info), 0.04);
}

.row-warning {
  background: rgba(var(--v-theme-warning), 0.04);
}

.row-primary {
  background: rgba(var(--v-theme-primary), 0.08);
}

/* Data Rows Hover - matched with SalaryMonthlyGrid */
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

/* Empty State */
.empty-state {
  text-align: center;
  background: rgb(var(--v-theme-surface));
}
</style>
