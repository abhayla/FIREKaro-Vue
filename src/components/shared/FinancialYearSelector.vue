<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    modelValue: string
    yearsBack?: number
    yearsFuture?: number
    label?: string
    dense?: boolean
  }>(),
  {
    yearsBack: 5,
    yearsFuture: 1,
    label: 'Financial Year',
    dense: false,
  }
)

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
}>()

// Get current FY: if month >= April, use current year, else use previous year
const getCurrentFY = (): string => {
  const now = new Date()
  const month = now.getMonth() // 0-indexed (Jan = 0, Apr = 3)
  const year = now.getFullYear()

  if (month >= 3) {
    // April onwards
    return `${year}-${String(year + 1).slice(-2)}`
  } else {
    // Jan-Mar
    return `${year - 1}-${String(year).slice(-2)}`
  }
}

const financialYears = computed(() => {
  const currentFY = getCurrentFY()
  const [startYear] = currentFY.split('-').map((y) => parseInt(y))
  const years: { title: string; value: string }[] = []

  // Generate years from past to future
  const firstYear = startYear - props.yearsBack
  const lastYear = startYear + props.yearsFuture

  for (let year = lastYear; year >= firstYear; year--) {
    const fyString = `${year}-${String(year + 1).slice(-2)}`
    years.push({
      title: `FY ${fyString}`,
      value: fyString,
    })
  }

  return years
})

const selectedValue = computed({
  get: () => props.modelValue,
  set: (value: string) => emit('update:modelValue', value),
})
</script>

<template>
  <v-select
    v-model="selectedValue"
    :items="financialYears"
    item-title="title"
    item-value="value"
    :label="label"
    :density="dense ? 'compact' : 'default'"
    variant="outlined"
    hide-details
    class="fy-selector"
  >
    <template #prepend-inner>
      <v-icon icon="mdi-calendar-range" size="small" class="mr-1" />
    </template>
  </v-select>
</template>

<style scoped>
.fy-selector {
  max-width: 180px;
}
</style>
