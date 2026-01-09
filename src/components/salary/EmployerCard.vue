<script setup lang="ts">
import { computed } from 'vue'
import type { EmployerSalarySummary } from '@/types/salary'
import { formatINR } from '@/composables/useSalary'

const props = defineProps<{
  summary: EmployerSalarySummary
}>()

const emit = defineEmits<{
  (e: 'view-breakdown'): void
  (e: 'edit'): void
}>()

const completionColor = computed(() => {
  const pct = props.summary.completionPercentage
  if (pct >= 100) return 'success'
  if (pct >= 50) return 'warning'
  return 'error'
})

const completionText = computed(() => {
  return `${props.summary.monthsRecorded}/${props.summary.totalMonths} months`
})

const statusIcon = computed(() => {
  if (props.summary.completionPercentage >= 100) return 'mdi-check-circle'
  return 'mdi-clock-outline'
})
</script>

<template>
  <v-card variant="outlined" class="employer-card h-100">
    <v-card-text class="pa-4">
      <!-- Header -->
      <div class="d-flex align-start justify-space-between mb-3">
        <div>
          <div class="d-flex align-center">
            <span class="text-h6 font-weight-bold">{{ summary.incomeSource.sourceName }}</span>
            <v-chip
              v-if="summary.incomeSource.isPrimary"
              size="x-small"
              color="primary"
              variant="flat"
              class="ml-2"
            >
              Primary
            </v-chip>
          </div>
          <div class="text-caption text-medium-emphasis mt-1">
            <v-icon icon="mdi-briefcase-outline" size="x-small" class="mr-1" />
            {{ summary.incomeSource.status === 'ACTIVE' ? 'Active' : 'Inactive' }}
          </div>
        </div>
        <v-btn
          icon="mdi-pencil-outline"
          size="small"
          variant="text"
          color="primary"
          @click="emit('edit')"
        />
      </div>

      <!-- Summary Stats -->
      <div class="stats-grid mb-4">
        <div class="stat-item">
          <div class="text-caption text-medium-emphasis">Gross Earnings</div>
          <div class="text-subtitle-1 font-weight-bold text-currency">
            {{ formatINR(summary.grossEarnings) }}
          </div>
        </div>
        <div class="stat-item">
          <div class="text-caption text-medium-emphasis">Net Salary</div>
          <div class="text-subtitle-1 font-weight-bold text-currency text-primary">
            {{ formatINR(summary.netSalary) }}
          </div>
        </div>
      </div>

      <!-- Completion Progress -->
      <div class="completion-section mb-4">
        <div class="d-flex align-center justify-space-between mb-1">
          <span class="text-caption text-medium-emphasis">Completion</span>
          <span class="text-caption font-weight-medium" :class="`text-${completionColor}`">
            <v-icon :icon="statusIcon" size="x-small" class="mr-1" />
            {{ completionText }}
          </span>
        </div>
        <v-progress-linear
          :model-value="summary.completionPercentage"
          :color="completionColor"
          height="6"
          rounded
        />
      </div>

      <!-- Actions -->
      <v-btn
        block
        variant="tonal"
        color="primary"
        @click="emit('view-breakdown')"
      >
        <v-icon icon="mdi-table" class="mr-2" />
        View Monthly Breakdown
      </v-btn>
    </v-card-text>
  </v-card>
</template>

<style scoped>
.employer-card {
  transition: all 0.2s ease;
}

.employer-card:hover {
  border-color: rgb(var(--v-theme-primary));
  box-shadow: 0 4px 12px rgba(var(--v-theme-primary), 0.1);
}

.stats-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.stat-item {
  padding: 8px 0;
}

.completion-section {
  padding-top: 8px;
  border-top: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
}
</style>
