<script setup lang="ts">
import { computed } from 'vue'
import type { ExpenseCoverage } from '@/composables/useFIRE'
import { formatINR } from '@/composables/useFIRE'

const props = defineProps<{
  data: ExpenseCoverage
  loading?: boolean
}>()

const sortedCategories = computed(() => {
  if (!props.data?.categories?.length) return []
  return [...props.data.categories].sort((a, b) => {
    // Fully covered first, then by coverage percent
    if (a.covered && !b.covered) return -1
    if (!a.covered && b.covered) return 1
    return b.coveragePercent - a.coveragePercent
  })
})

const getStatusIcon = (category: ExpenseCoverage['categories'][0]) => {
  if (category.covered) return 'mdi-check-circle'
  if (category.coveragePercent > 0) return 'mdi-lock-open-outline'
  return 'mdi-lock'
}

const getStatusColor = (category: ExpenseCoverage['categories'][0]) => {
  if (category.covered) return 'success'
  if (category.coveragePercent > 0) return 'warning'
  return 'grey'
}
</script>

<template>
  <v-card :loading="loading">
    <v-card-title class="d-flex align-center">
      <v-icon icon="mdi-trophy" class="mr-2" />
      Expense Coverage Unlocks
    </v-card-title>

    <v-card-text>
      <!-- Summary -->
      <v-alert color="success" variant="tonal" class="mb-4">
        <div class="d-flex align-center justify-space-between">
          <div>
            <div class="text-body-1 font-weight-bold">
              Your investments now cover {{ formatINR(data?.totalCovered ?? 0) }}/month!
            </div>
            <div class="text-body-2 text-medium-emphasis">
              {{ (data?.coveragePercent ?? 0).toFixed(1) }}% of your monthly expenses are permanently funded
            </div>
          </div>
          <div class="text-h4 font-weight-bold text-success">
            {{ (data?.coveragePercent ?? 0).toFixed(1) }}%
          </div>
        </div>
        <v-progress-linear
          :model-value="data?.coveragePercent ?? 0"
          color="success"
          height="8"
          rounded
          class="mt-3"
        />
      </v-alert>

      <!-- Expense Categories Grid -->
      <v-row dense>
        <v-col
          v-for="category in sortedCategories"
          :key="category.name"
          cols="6"
          sm="4"
          md="3"
        >
          <v-card
            :color="category.covered ? 'success' : undefined"
            :variant="category.covered ? 'tonal' : 'outlined'"
            class="expense-category pa-3 h-100"
            :class="{ 'unlocked': category.covered, 'partial': !category.covered && category.coveragePercent > 0 }"
          >
            <div class="d-flex align-center justify-space-between mb-2">
              <v-icon
                :icon="category.icon"
                :color="getStatusColor(category)"
                size="24"
              />
              <v-icon
                :icon="getStatusIcon(category)"
                :color="getStatusColor(category)"
                size="18"
              />
            </div>

            <div class="text-body-2 font-weight-medium mb-1">{{ category.name }}</div>
            <div class="text-h6 font-weight-bold text-currency mb-1">
              {{ formatINR(category.amount ?? 0, true) }}
            </div>

            <v-progress-linear
              :model-value="category.coveragePercent"
              :color="getStatusColor(category)"
              height="6"
              rounded
              class="mb-1"
            />

            <div class="text-caption" :class="category.covered ? 'text-success' : 'text-medium-emphasis'">
              <span v-if="category.covered">Fully Covered!</span>
              <span v-else-if="category.coveragePercent > 0">{{ category.coveragePercent }}% covered</span>
              <span v-else>Locked</span>
            </div>
          </v-card>
        </v-col>
      </v-row>

      <!-- Motivation Message -->
      <v-sheet rounded class="pa-4 mt-4 text-center" color="surface-variant">
        <v-icon icon="mdi-lightbulb" color="warning" size="32" class="mb-2" />
        <div class="text-body-1">
          <span v-if="(data?.coveragePercent ?? 0) < 25">
            Keep investing! Each expense you "unlock" brings you closer to freedom.
          </span>
          <span v-else-if="(data?.coveragePercent ?? 0) < 50">
            Great start! You're building a foundation of passive income.
          </span>
          <span v-else-if="(data?.coveragePercent ?? 0) < 75">
            Halfway there! Your investments are working hard for you.
          </span>
          <span v-else-if="(data?.coveragePercent ?? 0) < 100">
            Almost there! Financial independence is within sight!
          </span>
          <span v-else>
            Congratulations! Your investments cover all your expenses!
          </span>
        </div>
      </v-sheet>
    </v-card-text>
  </v-card>
</template>

<style scoped>
.expense-category {
  transition: all 0.3s ease;
}

.expense-category.unlocked {
  border: 2px solid rgb(var(--v-theme-success));
}

.expense-category.partial {
  border: 2px dashed rgb(var(--v-theme-warning));
}

.expense-category:not(.unlocked):not(.partial) {
  opacity: 0.7;
}
</style>
