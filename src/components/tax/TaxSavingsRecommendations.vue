<script setup lang="ts">
import { computed } from "vue";
import type { TaxOptimizationSuggestion } from "@/types/tax";
import { formatINR } from "@/composables/useTax";

interface Props {
  suggestions: TaxOptimizationSuggestion[] | null;
  loading?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
});

const emit = defineEmits<{
  (e: "apply", suggestion: TaxOptimizationSuggestion): void;
}>();

const totalPotentialSavings = computed(
  () => props.suggestions?.reduce((sum, s) => sum + s.potentialSavings, 0) || 0,
);

const sortedSuggestions = computed(() => {
  if (!props.suggestions) return [];
  return [...props.suggestions].sort((a, b) => {
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });
});

function getPriorityColor(priority: string) {
  switch (priority) {
    case "high":
      return "error";
    case "medium":
      return "warning";
    case "low":
      return "success";
    default:
      return "grey";
  }
}

function getCategoryIcon(category: string) {
  switch (category) {
    case "deduction":
      return "mdi-minus-circle";
    case "investment":
      return "mdi-trending-up";
    case "restructure":
      return "mdi-swap-horizontal";
    case "timing":
      return "mdi-clock-outline";
    default:
      return "mdi-lightbulb";
  }
}

function getCategoryColor(category: string) {
  switch (category) {
    case "deduction":
      return "primary";
    case "investment":
      return "success";
    case "restructure":
      return "warning";
    case "timing":
      return "info";
    default:
      return "grey";
  }
}
</script>

<template>
  <v-card :loading="loading">
    <v-card-title>
      <v-icon class="mr-2">mdi-lightbulb</v-icon>
      Tax Savings Recommendations
    </v-card-title>

    <v-card-text v-if="sortedSuggestions.length">
      <!-- Total Savings Banner -->
      <v-alert
        v-if="totalPotentialSavings > 0"
        color="success"
        variant="tonal"
        class="mb-4"
      >
        <div class="d-flex align-center justify-space-between">
          <div>
            <div class="text-body-2 font-weight-medium">
              {{ sortedSuggestions.length }} optimization opportunities found
            </div>
            <div class="text-caption">
              Based on your income and current deductions
            </div>
          </div>
          <div class="text-end">
            <div class="text-caption">Potential Tax Savings</div>
            <div class="text-h5 font-weight-bold">
              {{ formatINR(totalPotentialSavings) }}
            </div>
          </div>
        </div>
      </v-alert>

      <!-- Suggestions List -->
      <v-list>
        <v-list-item
          v-for="suggestion in sortedSuggestions"
          :key="suggestion.id"
          class="mb-2"
        >
          <template #prepend>
            <v-avatar :color="getCategoryColor(suggestion.category)" size="40">
              <v-icon :icon="getCategoryIcon(suggestion.category)" />
            </v-avatar>
          </template>

          <v-list-item-title class="font-weight-medium">
            {{ suggestion.title }}
          </v-list-item-title>
          <v-list-item-subtitle>
            {{ suggestion.description }}
          </v-list-item-subtitle>

          <template #append>
            <div class="d-flex align-center">
              <div class="text-end mr-4">
                <v-chip
                  :color="getPriorityColor(suggestion.priority)"
                  size="x-small"
                  class="mb-1"
                >
                  {{ suggestion.priority }}
                </v-chip>
                <div class="text-body-2 font-weight-bold text-positive">
                  +{{ formatINR(suggestion.potentialSavings) }}
                </div>
              </div>
              <v-btn
                variant="outlined"
                color="primary"
                size="small"
                @click="emit('apply', suggestion)"
              >
                {{ suggestion.action }}
              </v-btn>
            </div>
          </template>
        </v-list-item>
      </v-list>

      <!-- Section Details -->
      <v-expansion-panels variant="accordion" class="mt-4">
        <v-expansion-panel
          v-for="suggestion in sortedSuggestions"
          :key="suggestion.id"
        >
          <v-expansion-panel-title>
            <div class="d-flex align-center">
              <v-chip
                :color="getCategoryColor(suggestion.category)"
                size="small"
                class="mr-2"
              >
                {{ suggestion.section }}
              </v-chip>
              <span>{{ suggestion.title }}</span>
            </div>
          </v-expansion-panel-title>
          <v-expansion-panel-text>
            <v-row>
              <v-col cols="6">
                <div class="text-caption text-medium-emphasis">Current</div>
                <div class="text-body-1 text-currency">
                  {{ formatINR(suggestion.currentValue) }}
                </div>
              </v-col>
              <v-col cols="6">
                <div class="text-caption text-medium-emphasis">Suggested</div>
                <div class="text-body-1 text-currency text-positive">
                  {{ formatINR(suggestion.suggestedValue) }}
                </div>
              </v-col>
            </v-row>
            <v-divider class="my-3" />
            <div class="d-flex justify-space-between align-center">
              <div>
                <div class="text-caption text-medium-emphasis">Tax Savings</div>
                <div class="text-h6 font-weight-bold text-positive">
                  {{ formatINR(suggestion.potentialSavings) }}
                </div>
              </div>
              <v-btn color="primary" @click="emit('apply', suggestion)">
                {{ suggestion.action }}
              </v-btn>
            </div>
          </v-expansion-panel-text>
        </v-expansion-panel>
      </v-expansion-panels>
    </v-card-text>

    <v-card-text v-else-if="!loading" class="text-center py-8">
      <v-icon icon="mdi-check-circle" size="64" color="success" />
      <div class="text-body-1 text-medium-emphasis mt-4">
        Your tax planning is optimized!
      </div>
      <div class="text-caption text-medium-emphasis">
        No additional savings opportunities found
      </div>
    </v-card-text>
  </v-card>
</template>
