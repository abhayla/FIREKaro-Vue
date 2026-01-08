<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  month: string
  categories?: string[]
  selectedCategory?: string | null
}>()

const emit = defineEmits<{
  'update:month': [value: string]
  'update:selectedCategory': [value: string | null]
}>()

// Parse current month
const [currentYear, currentMonth] = props.month.split('-').map(Number)

// Month name
const monthName = computed(() => {
  const date = new Date(currentYear, currentMonth - 1)
  return date.toLocaleString('en-IN', { month: 'long', year: 'numeric' })
})

// Month options (last 12 months + next 1 month)
const monthOptions = computed(() => {
  const options = []
  const now = new Date()

  // Next month
  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1)
  options.push({
    title: nextMonth.toLocaleString('en-IN', { month: 'long', year: 'numeric' }),
    value: `${nextMonth.getFullYear()}-${String(nextMonth.getMonth() + 1).padStart(2, '0')}`,
  })

  // Current and past 11 months
  for (let i = 0; i < 12; i++) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
    options.push({
      title: date.toLocaleString('en-IN', { month: 'long', year: 'numeric' }),
      value: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`,
    })
  }

  return options
})

// Navigation
const goToPreviousMonth = () => {
  const date = new Date(currentYear, currentMonth - 2, 1)
  emit(
    'update:month',
    `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
  )
}

const goToNextMonth = () => {
  const date = new Date(currentYear, currentMonth, 1)
  emit(
    'update:month',
    `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
  )
}

const goToCurrentMonth = () => {
  const now = new Date()
  emit(
    'update:month',
    `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  )
}

// Check if current month is selected
const isCurrentMonth = computed(() => {
  const now = new Date()
  return (
    currentYear === now.getFullYear() && currentMonth === now.getMonth() + 1
  )
})

// Category items
const categoryItems = computed(() => {
  if (!props.categories) return []
  return [
    { title: 'All Categories', value: null },
    ...props.categories.map((c) => ({ title: c, value: c })),
  ]
})
</script>

<template>
  <v-card variant="outlined" class="pa-3">
    <div class="d-flex align-center gap-3 flex-wrap">
      <!-- Month Navigation -->
      <div class="d-flex align-center">
        <v-btn
          icon="mdi-chevron-left"
          variant="text"
          size="small"
          @click="goToPreviousMonth"
          title="Previous month"
        />

        <v-select
          :model-value="month"
          :items="monthOptions"
          item-title="title"
          item-value="value"
          density="compact"
          hide-details
          variant="outlined"
          style="min-width: 180px"
          @update:model-value="emit('update:month', $event)"
        />

        <v-btn
          icon="mdi-chevron-right"
          variant="text"
          size="small"
          @click="goToNextMonth"
          title="Next month"
        />

        <v-btn
          v-if="!isCurrentMonth"
          variant="text"
          size="small"
          class="ml-1"
          @click="goToCurrentMonth"
        >
          Today
        </v-btn>
      </div>

      <v-divider vertical class="mx-2" />

      <!-- Category Filter -->
      <v-select
        v-if="categories && categories.length > 0"
        :model-value="selectedCategory"
        :items="categoryItems"
        item-title="title"
        item-value="value"
        label="Category"
        density="compact"
        hide-details
        variant="outlined"
        clearable
        style="max-width: 200px"
        @update:model-value="emit('update:selectedCategory', $event)"
      />

      <v-spacer />

      <!-- Month Display -->
      <div class="text-body-2 font-weight-medium">
        <v-icon icon="mdi-calendar" size="16" class="mr-1" />
        {{ monthName }}
      </div>
    </div>
  </v-card>
</template>
