<script setup lang="ts">
import { computed } from "vue";
import type { DataCompletionItem } from "@/composables/useTax";

interface Props {
  items: DataCompletionItem[];
  loading?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
});

const emit = defineEmits<{
  (e: "item-click", item: DataCompletionItem): void;
}>();

// Calculate completion stats
const completedCount = computed(() => props.items.filter((item) => item.isComplete).length);
const totalCount = computed(() => props.items.length);
const completionPercent = computed(() =>
  totalCount.value > 0 ? (completedCount.value / totalCount.value) * 100 : 0
);

// Status color and text
const statusColor = computed(() => {
  const percent = completionPercent.value;
  if (percent === 100) return "success";
  if (percent >= 50) return "warning";
  return "info";
});

const statusText = computed(() => {
  const percent = completionPercent.value;
  if (percent === 100) return "All data provided";
  if (percent >= 75) return "Almost complete";
  if (percent >= 50) return "Partially complete";
  return "Add more data for accurate tax calculation";
});

// Icon for item based on category
const getIcon = (category: string): string => {
  const icons: Record<string, string> = {
    salary: "mdi-briefcase",
    "80C": "mdi-piggy-bank",
    "80D": "mdi-hospital-box",
    nps: "mdi-account-clock",
    hra: "mdi-home-city",
    homeLoan: "mdi-home",
    capitalGains: "mdi-chart-line",
    otherIncome: "mdi-cash-plus",
    default: "mdi-checkbox-marked-circle",
  };
  return icons[category] || icons.default;
};

const handleItemClick = (item: DataCompletionItem) => {
  emit("item-click", item);
};
</script>

<template>
  <v-card variant="outlined" :loading="loading">
    <v-card-text>
      <!-- Header -->
      <div class="d-flex align-center justify-space-between mb-4">
        <div class="d-flex align-center">
          <v-icon icon="mdi-clipboard-check-outline" class="mr-2" color="primary" />
          <span class="font-weight-medium text-uppercase text-caption tracking-wide">
            Data Completion
          </span>
        </div>
        <v-chip :color="statusColor" size="small" variant="flat">
          {{ completedCount }}/{{ totalCount }} sections
          <v-icon v-if="completionPercent === 100" icon="mdi-check" size="small" class="ml-1" />
        </v-chip>
      </div>

      <!-- Progress Bar -->
      <v-progress-linear
        :model-value="completionPercent"
        :color="statusColor"
        height="8"
        rounded
        class="mb-2"
      />
      <div class="text-caption text-medium-emphasis mb-4">
        {{ statusText }}
      </div>

      <!-- Completion Items Grid -->
      <div class="completion-grid">
        <v-tooltip v-for="item in items" :key="item.id" :text="item.description || item.label" location="top">
          <template #activator="{ props: tooltipProps }">
            <div
              v-bind="tooltipProps"
              :class="['completion-item', { 'is-completed': item.isComplete, 'is-clickable': !item.isComplete }]"
              @click="!item.isComplete ? handleItemClick(item) : undefined"
            >
              <v-icon
                :icon="item.isComplete ? 'mdi-check-circle' : getIcon(item.id)"
                :color="item.isComplete ? 'success' : 'grey'"
                size="20"
              />
              <span class="item-label">{{ item.label }}</span>
              <span v-if="item.value" class="item-value">
                {{ item.value }}
              </span>
            </div>
          </template>
        </v-tooltip>
      </div>

      <!-- Action hint for incomplete items -->
      <div v-if="completionPercent < 100" class="mt-4 text-center">
        <v-btn
          variant="text"
          color="primary"
          size="small"
          prepend-icon="mdi-arrow-right"
          @click="emit('item-click', items.find((i) => !i.isComplete) || items[0])"
        >
          Complete missing sections
        </v-btn>
      </div>
    </v-card-text>
  </v-card>
</template>

<style scoped>
.tracking-wide {
  letter-spacing: 0.05em;
}

.completion-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
}

@media (max-width: 960px) {
  .completion-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 600px) {
  .completion-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

.completion-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 12px 8px;
  border-radius: 8px;
  background: rgba(var(--v-theme-on-surface), 0.04);
  transition: all 0.2s ease;
  text-align: center;
  min-height: 72px;
}

.completion-item.is-completed {
  background: rgba(var(--v-theme-success), 0.08);
}

.completion-item.is-clickable {
  cursor: pointer;
}

.completion-item.is-clickable:hover {
  background: rgba(var(--v-theme-primary), 0.12);
  transform: translateY(-1px);
}

.item-label {
  font-size: 0.7rem;
  font-weight: 500;
  margin-top: 4px;
  color: rgb(var(--v-theme-on-surface-variant));
  line-height: 1.2;
}

.completion-item.is-completed .item-label {
  color: rgb(var(--v-theme-success));
}

.item-value {
  font-size: 0.65rem;
  color: rgb(var(--v-theme-on-surface-variant));
  opacity: 0.7;
  margin-top: 2px;
}
</style>
