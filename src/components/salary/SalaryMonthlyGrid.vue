<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { SalaryGridData, SalaryGridRow, SalaryComponentType } from '@/types/salary'
import { formatINRLakhs } from '@/composables/useSalary'
import FYMonthHeader from '@/components/shared/FYMonthHeader.vue'
import SalaryGridCell from './SalaryGridCell.vue'

const props = withDefaults(
  defineProps<{
    gridData: SalaryGridData | null
    loading?: boolean
    editable?: boolean
  }>(),
  {
    loading: false,
    editable: true,
  }
)

const emit = defineEmits<{
  (e: 'cell-click', payload: { componentCode: string; monthIndex: number; value: number | null }): void
  (e: 'add-month', monthIndex: number): void
}>()

// Track expanded state for expandable rows
const expandedRows = ref<Set<string>>(new Set())

const toggleExpand = (code: string) => {
  if (expandedRows.value.has(code)) {
    expandedRows.value.delete(code)
  } else {
    expandedRows.value.add(code)
  }
}

// Group rows by component type
const earningRows = computed(() =>
  props.gridData?.rows.filter((r) => r.componentType === 'EARNING') || []
)

const deductionRows = computed(() =>
  props.gridData?.rows.filter((r) => r.componentType === 'DEDUCTION') || []
)

const employerRows = computed(() =>
  props.gridData?.rows.filter((r) => r.componentType === 'EMPLOYER_CONTRIBUTION') || []
)

// Check if a sub-component row should be visible
const isRowVisible = (row: SalaryGridRow): boolean => {
  if (!row.isSubComponent) return true
  return row.parentCode ? expandedRows.value.has(row.parentCode) : false
}

// Get row classes
const getRowClasses = (row: SalaryGridRow): string[] => {
  const classes: string[] = ['salary-row']
  if (row.isSubComponent) classes.push('sub-component-row')
  if (row.isExpandable) classes.push('expandable-row')
  return classes
}

// Handle cell click
const handleCellClick = (componentCode: string, monthIndex: number, value: number | null) => {
  if (!props.editable) return
  emit('cell-click', { componentCode, monthIndex, value })
}

// Format section totals
const formatTotal = (value: number | null) => {
  if (value === null || value === undefined) return '-'
  return formatINRLakhs(value)
}
</script>

<template>
  <div class="salary-monthly-grid">
    <v-card variant="outlined" :loading="loading">
      <div class="grid-wrapper">
        <table class="grid-table">
          <FYMonthHeader
            :financial-year="gridData?.financialYear"
            :sticky-first-column="true"
            first-column-label="Component"
          />

          <tbody v-if="gridData">
            <!-- Paid Days Row -->
            <tr class="paid-days-row section-header-row">
              <td class="component-cell sticky-column">Paid Days</td>
              <td
                v-for="(days, index) in gridData.paidDays"
                :key="`days-${index}`"
                class="value-cell text-currency"
              >
                {{ days !== null ? days : '-' }}
              </td>
              <td class="total-cell text-currency font-weight-bold">
                {{ gridData.totalPaidDays }}
              </td>
            </tr>

            <!-- EARNINGS Section -->
            <tr class="section-header-row">
              <td colspan="14" class="section-header">
                <v-icon icon="mdi-plus-circle-outline" size="small" class="mr-2" color="success" />
                EARNINGS
              </td>
            </tr>

            <template v-for="row in earningRows" :key="row.componentCode">
              <tr v-if="isRowVisible(row)" :class="getRowClasses(row)">
                <td class="component-cell sticky-column">
                  <div class="d-flex align-center">
                    <v-btn
                      v-if="row.isExpandable"
                      icon
                      size="x-small"
                      variant="text"
                      @click.stop="toggleExpand(row.componentCode)"
                    >
                      <v-icon
                        :icon="expandedRows.has(row.componentCode) ? 'mdi-chevron-down' : 'mdi-chevron-right'"
                        size="small"
                      />
                    </v-btn>
                    <span :class="{ 'ml-6': row.isSubComponent, 'text-medium-emphasis': row.isSubComponent }">
                      {{ row.isSubComponent ? `└─ ${row.componentName}` : row.componentName }}
                    </span>
                  </div>
                </td>
                <SalaryGridCell
                  v-for="(value, monthIndex) in row.values"
                  :key="`${row.componentCode}-${monthIndex}`"
                  :value="value"
                  :editable="editable && !row.isSubComponent"
                  component-type="EARNING"
                  @click="handleCellClick(row.componentCode, monthIndex, value)"
                />
                <SalaryGridCell
                  :value="row.total"
                  :is-total="true"
                  component-type="EARNING"
                />
              </tr>
            </template>

            <!-- Gross Earnings Row -->
            <tr class="summary-row gross-row">
              <td class="component-cell sticky-column font-weight-bold">Gross Earnings (A)</td>
              <SalaryGridCell
                v-for="(value, index) in gridData.grossEarnings"
                :key="`gross-${index}`"
                :value="value"
                component-type="SUMMARY"
              />
              <SalaryGridCell
                :value="gridData.totalGrossEarnings"
                :is-total="true"
                component-type="SUMMARY"
              />
            </tr>

            <!-- DEDUCTIONS Section -->
            <tr class="section-header-row">
              <td colspan="14" class="section-header">
                <v-icon icon="mdi-minus-circle-outline" size="small" class="mr-2" color="error" />
                DEDUCTIONS
              </td>
            </tr>

            <template v-for="row in deductionRows" :key="row.componentCode">
              <tr v-if="isRowVisible(row)" :class="getRowClasses(row)">
                <td class="component-cell sticky-column">
                  <div class="d-flex align-center">
                    <v-btn
                      v-if="row.isExpandable"
                      icon
                      size="x-small"
                      variant="text"
                      @click.stop="toggleExpand(row.componentCode)"
                    >
                      <v-icon
                        :icon="expandedRows.has(row.componentCode) ? 'mdi-chevron-down' : 'mdi-chevron-right'"
                        size="small"
                      />
                    </v-btn>
                    <span :class="{ 'ml-6': row.isSubComponent, 'text-medium-emphasis': row.isSubComponent }">
                      {{ row.isSubComponent ? `└─ ${row.componentName}` : row.componentName }}
                    </span>
                  </div>
                </td>
                <SalaryGridCell
                  v-for="(value, monthIndex) in row.values"
                  :key="`${row.componentCode}-${monthIndex}`"
                  :value="value"
                  :editable="editable && !row.isSubComponent"
                  component-type="DEDUCTION"
                  @click="handleCellClick(row.componentCode, monthIndex, value)"
                />
                <SalaryGridCell
                  :value="row.total"
                  :is-total="true"
                  component-type="DEDUCTION"
                />
              </tr>
            </template>

            <!-- Total Deductions Row -->
            <tr class="summary-row deductions-row">
              <td class="component-cell sticky-column font-weight-bold">Total Deductions (B)</td>
              <SalaryGridCell
                v-for="(value, index) in gridData.totalDeductions"
                :key="`deductions-${index}`"
                :value="value"
                component-type="DEDUCTION"
              />
              <SalaryGridCell
                :value="gridData.totalTotalDeductions"
                :is-total="true"
                component-type="DEDUCTION"
              />
            </tr>

            <!-- Net Salary Row -->
            <tr class="summary-row net-row">
              <td class="component-cell sticky-column font-weight-bold text-primary">Net Salary (A-B)</td>
              <SalaryGridCell
                v-for="(value, index) in gridData.netSalary"
                :key="`net-${index}`"
                :value="value"
                component-type="SUMMARY"
              />
              <SalaryGridCell
                :value="gridData.totalNetSalary"
                :is-total="true"
                component-type="SUMMARY"
              />
            </tr>

            <!-- EMPLOYER CONTRIBUTIONS Section (if any) -->
            <template v-if="employerRows.length > 0">
              <tr class="section-header-row">
                <td colspan="14" class="section-header">
                  <v-icon icon="mdi-office-building" size="small" class="mr-2" color="info" />
                  EMPLOYER CONTRIBUTIONS (Info Only)
                </td>
              </tr>

              <template v-for="row in employerRows" :key="row.componentCode">
                <tr v-if="isRowVisible(row)" :class="getRowClasses(row)">
                  <td class="component-cell sticky-column">
                    <span class="text-medium-emphasis">{{ row.componentName }}</span>
                  </td>
                  <SalaryGridCell
                    v-for="(value, monthIndex) in row.values"
                    :key="`${row.componentCode}-${monthIndex}`"
                    :value="value"
                    :editable="editable"
                    component-type="EMPLOYER_CONTRIBUTION"
                    @click="handleCellClick(row.componentCode, monthIndex, value)"
                  />
                  <SalaryGridCell
                    :value="row.total"
                    :is-total="true"
                    component-type="EMPLOYER_CONTRIBUTION"
                  />
                </tr>
              </template>
            </template>
          </tbody>

          <!-- Empty State -->
          <tbody v-else-if="!loading">
            <tr>
              <td colspan="14" class="empty-state">
                <div class="d-flex flex-column align-center pa-8">
                  <v-icon icon="mdi-calendar-blank-outline" size="64" color="grey-lighten-1" class="mb-4" />
                  <div class="text-h6 text-medium-emphasis mb-2">No salary data</div>
                  <div class="text-body-2 text-medium-emphasis mb-4">
                    Start by adding salary entries for each month
                  </div>
                  <v-btn color="primary" variant="flat" @click="emit('add-month', 0)">
                    <v-icon icon="mdi-plus" class="mr-2" />
                    Add First Entry
                  </v-btn>
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
.salary-monthly-grid {
  width: 100%;
}

.grid-wrapper {
  overflow-x: auto;
  max-width: 100%;
}

.grid-table {
  width: 100%;
  border-collapse: collapse;
  min-width: 1100px;
}

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
  border-bottom: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
}

.total-cell {
  text-align: right;
  padding: 8px 10px;
  font-size: 0.8125rem;
  background-color: rgba(var(--v-theme-primary), 0.04);
  border-bottom: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
}

.section-header-row .section-header {
  padding: 12px;
  font-weight: 600;
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  background: rgba(var(--v-theme-on-surface), 0.03);
  color: rgb(var(--v-theme-on-surface-variant));
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

.sub-component-row {
  background: rgba(var(--v-theme-on-surface), 0.01);
}

.expandable-row .component-cell {
  cursor: pointer;
}

.empty-state {
  text-align: center;
  background: rgb(var(--v-theme-surface));
}

/* Hover states */
.salary-row:hover {
  background: rgba(var(--v-theme-primary), 0.02);
}

.salary-row:hover .sticky-column {
  background: rgba(var(--v-theme-primary), 0.04);
}
</style>
