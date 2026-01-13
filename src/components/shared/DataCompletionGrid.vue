<script setup lang="ts">
import { computed } from "vue";

const props = withDefaults(
  defineProps<{
    /**
     * Array of 12 booleans indicating completion for each FY month (Apr-Mar)
     */
    completion: boolean[];
    /**
     * Title for the card
     */
    title?: string;
    /**
     * Icon to display in the title
     */
    icon?: string;
    /**
     * Whether to show the progress bar
     */
    showProgress?: boolean;
    /**
     * Size of the month icons
     */
    iconSize?: number | string;
  }>(),
  {
    title: "Data Completion",
    icon: "mdi-calendar-check",
    showProgress: true,
    iconSize: "small",
  }
);

// FY months: April (index 0) to March (index 11)
const FY_MONTHS = [
  { short: "Apr", full: "April" },
  { short: "May", full: "May" },
  { short: "Jun", full: "June" },
  { short: "Jul", full: "July" },
  { short: "Aug", full: "August" },
  { short: "Sep", full: "September" },
  { short: "Oct", full: "October" },
  { short: "Nov", full: "November" },
  { short: "Dec", full: "December" },
  { short: "Jan", full: "January" },
  { short: "Feb", full: "February" },
  { short: "Mar", full: "March" },
];

const completedCount = computed(() => {
  return props.completion?.filter(Boolean).length ?? 0;
});

const completionPercentage = computed(() => {
  if (!props.completion?.length) return 0;
  return Math.round((completedCount.value / 12) * 100);
});

const completionColor = computed(() => {
  const pct = completionPercentage.value;
  if (pct >= 100) return "success";
  if (pct >= 75) return "info";
  if (pct >= 50) return "warning";
  return "error";
});

const completionLabel = computed(() => {
  if (completionPercentage.value === 100) {
    return "Complete!";
  }
  return `${completedCount.value}/12 months`;
});
</script>

<template>
  <v-card variant="outlined">
    <v-card-title class="text-subtitle-1 d-flex align-center">
      <v-icon :icon="icon" class="mr-2" color="primary" />
      {{ title }}
      <v-chip size="small" class="ml-2" :color="completionColor" variant="tonal">
        <v-icon
          v-if="completionPercentage === 100"
          icon="mdi-check-circle"
          size="x-small"
          class="mr-1"
        />
        {{ completionLabel }}
      </v-chip>
    </v-card-title>
    <v-card-text>
      <!-- Month Grid -->
      <div class="completion-grid">
        <div
          v-for="(month, index) in FY_MONTHS"
          :key="index"
          class="month-cell"
          :class="{ completed: completion?.[index] }"
        >
          <v-tooltip :text="month.full" location="top">
            <template #activator="{ props: tooltipProps }">
              <div v-bind="tooltipProps" class="d-flex flex-column align-center">
                <v-icon
                  :icon="completion?.[index] ? 'mdi-check-circle' : 'mdi-circle-outline'"
                  :color="completion?.[index] ? 'success' : 'grey-lighten-1'"
                  :size="iconSize"
                />
                <span class="month-label">{{ month.short }}</span>
              </div>
            </template>
          </v-tooltip>
        </div>
      </div>

      <!-- Progress Bar -->
      <v-progress-linear
        v-if="showProgress"
        :model-value="completionPercentage"
        :color="completionColor"
        height="8"
        rounded
        class="mt-3"
      >
        <template #default>
          <span class="text-caption font-weight-medium">{{ completionPercentage }}%</span>
        </template>
      </v-progress-linear>
    </v-card-text>
  </v-card>
</template>

<style scoped>
.completion-grid {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 8px;
}

@media (max-width: 600px) {
  .completion-grid {
    grid-template-columns: repeat(4, 1fr);
  }
}

.month-cell {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 8px 4px;
  border-radius: 8px;
  background: rgba(var(--v-theme-surface-variant), 0.3);
  transition: all 0.2s ease;
}

.month-cell.completed {
  background: rgba(var(--v-theme-success), 0.08);
}

.month-cell:hover {
  transform: scale(1.05);
}

.month-label {
  font-size: 0.7rem;
  font-weight: 500;
  margin-top: 4px;
  color: rgba(var(--v-theme-on-surface), 0.7);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.month-cell.completed .month-label {
  color: rgb(var(--v-theme-success));
}
</style>
