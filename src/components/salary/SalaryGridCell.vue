<script setup lang="ts">
import { computed } from 'vue'
import { formatINRLakhs } from '@/composables/useSalary'

const props = withDefaults(
  defineProps<{
    value: number | null
    editable?: boolean
    isTotal?: boolean
    isEmpty?: boolean
    componentType?: 'EARNING' | 'DEDUCTION' | 'EMPLOYER_CONTRIBUTION' | 'SUMMARY'
  }>(),
  {
    editable: false,
    isTotal: false,
    isEmpty: false,
    componentType: 'EARNING',
  }
)

const emit = defineEmits<{
  (e: 'click'): void
}>()

const displayValue = computed(() => {
  if (props.value === null || props.value === undefined) {
    return '-'
  }
  return formatINRLakhs(props.value)
})

const cellClasses = computed(() => {
  const classes: string[] = ['salary-grid-cell']

  if (props.isTotal) classes.push('total-cell')
  if (props.isEmpty || props.value === null) classes.push('empty-cell')
  if (props.editable) classes.push('editable-cell')

  // Color based on component type
  if (props.componentType === 'DEDUCTION') classes.push('deduction-cell')
  else if (props.componentType === 'EMPLOYER_CONTRIBUTION') classes.push('employer-cell')
  else if (props.componentType === 'SUMMARY') classes.push('summary-cell')

  return classes
})
</script>

<template>
  <td
    :class="cellClasses"
    @click="editable && emit('click')"
  >
    <span class="cell-value text-currency">{{ displayValue }}</span>
  </td>
</template>

<style scoped>
.salary-grid-cell {
  padding: 8px 10px;
  text-align: right;
  font-size: 0.8125rem;
  white-space: nowrap;
  border-bottom: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  transition: background-color 0.15s ease;
}

.cell-value {
  font-variant-numeric: tabular-nums;
}

.empty-cell {
  color: rgba(var(--v-theme-on-surface), 0.3);
}

.editable-cell {
  cursor: pointer;
}

.editable-cell:hover {
  background-color: rgba(var(--v-theme-primary), 0.08);
}

.total-cell {
  font-weight: 600;
  background-color: rgba(var(--v-theme-primary), 0.04);
}

.deduction-cell .cell-value {
  color: rgb(var(--v-theme-error));
}

.employer-cell .cell-value {
  color: rgb(var(--v-theme-info));
}

.summary-cell {
  font-weight: 600;
}

.summary-cell .cell-value {
  color: rgb(var(--v-theme-primary));
}
</style>
