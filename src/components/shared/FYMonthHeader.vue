<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    financialYear?: string // e.g., "2025-26"
    showTotal?: boolean
    stickyFirstColumn?: boolean
    firstColumnLabel?: string
  }>(),
  {
    showTotal: true,
    stickyFirstColumn: true,
    firstColumnLabel: 'Component',
  }
)

// FY months: April (index 0) to March (index 11)
const FY_MONTHS = [
  { short: 'Apr', full: 'April', index: 0 },
  { short: 'May', full: 'May', index: 1 },
  { short: 'Jun', full: 'June', index: 2 },
  { short: 'Jul', full: 'July', index: 3 },
  { short: 'Aug', full: 'August', index: 4 },
  { short: 'Sep', full: 'September', index: 5 },
  { short: 'Oct', full: 'October', index: 6 },
  { short: 'Nov', full: 'November', index: 7 },
  { short: 'Dec', full: 'December', index: 8 },
  { short: 'Jan', full: 'January', index: 9 },
  { short: 'Feb', full: 'February', index: 10 },
  { short: 'Mar', full: 'March', index: 11 },
]

const monthHeaders = computed(() => {
  if (!props.financialYear) {
    return FY_MONTHS.map((m) => m.short)
  }

  const [startYear, endYear] = props.financialYear.split('-').map((y) => parseInt(y))
  const fullStartYear = startYear > 100 ? startYear : 2000 + startYear
  const fullEndYear = endYear > 100 ? endYear : 2000 + endYear

  return FY_MONTHS.map((m) => {
    const year = m.index < 9 ? fullStartYear : fullEndYear // Apr-Dec = start year, Jan-Mar = end year
    return `${m.short}'${String(year).slice(-2)}`
  })
})
</script>

<template>
  <thead class="fy-month-header">
    <tr>
      <th
        :class="[
          'component-column',
          { 'sticky-column': stickyFirstColumn },
        ]"
      >
        {{ firstColumnLabel }}
      </th>
      <th
        v-for="(header, index) in monthHeaders"
        :key="index"
        class="month-column"
      >
        {{ header }}
      </th>
      <th v-if="showTotal" class="total-column">
        Total
      </th>
    </tr>
  </thead>
</template>

<style scoped>
.fy-month-header {
  background: rgb(var(--v-theme-surface));
  position: sticky;
  top: 0;
  z-index: 2;
}

.fy-month-header th {
  padding: 12px 8px;
  text-align: right;
  font-weight: 600;
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.025em;
  color: rgb(var(--v-theme-on-surface-variant));
  white-space: nowrap;
  border-bottom: 2px solid rgba(var(--v-border-color), var(--v-border-opacity));
}

.component-column {
  text-align: left !important;
  min-width: 160px;
  background: rgb(var(--v-theme-surface));
}

.sticky-column {
  position: sticky;
  left: 0;
  z-index: 3;
  box-shadow: 2px 0 4px rgba(0, 0, 0, 0.05);
}

.month-column {
  min-width: 70px;
  max-width: 90px;
}

.total-column {
  min-width: 80px;
  font-weight: 700;
  background: rgba(var(--v-theme-primary), 0.04);
}
</style>
