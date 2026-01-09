<script setup lang="ts">
import { formatINR } from "@/composables/useTax";

interface Suggestion {
  category: string;
  name: string;
  description: string;
  potentialSavings: number;
  percentageSavings: number;
  selectedRegime: string;
  incomeAdjustments?: Record<string, number>;
  deductionAdjustments?: Record<string, number>;
  reason?: string;
}

const props = defineProps<{
  suggestions: Suggestion[];
  loading?: boolean;
  disabled?: boolean;
}>();

const emit = defineEmits<{
  (e: "apply", suggestion: Suggestion): void;
}>();

function getCategoryIcon(category: string): string {
  const icons: Record<string, string> = {
    MAX_80C: "mdi-piggy-bank",
    MAX_NPS: "mdi-bank",
    MAX_80D: "mdi-medical-bag",
    REGIME_SWITCH: "mdi-swap-horizontal",
    COMBINED_OPTIMAL: "mdi-star",
  };
  return icons[category] || "mdi-lightbulb";
}

function getCategoryColor(category: string): string {
  const colors: Record<string, string> = {
    MAX_80C: "purple",
    MAX_NPS: "blue",
    MAX_80D: "green",
    REGIME_SWITCH: "orange",
    COMBINED_OPTIMAL: "amber",
  };
  return colors[category] || "primary";
}

function getCategoryTitle(category: string): string {
  const titles: Record<string, string> = {
    MAX_80C: "Maximize 80C",
    MAX_NPS: "Add NPS Contribution",
    MAX_80D: "Health Insurance",
    REGIME_SWITCH: "Switch Tax Regime",
    COMBINED_OPTIMAL: "Optimal Strategy",
  };
  return titles[category] || category;
}
</script>

<template>
  <v-card>
    <v-card-title class="d-flex align-center">
      <v-icon class="mr-2" color="amber">mdi-magic-staff</v-icon>
      Smart Suggestions
      <v-chip size="x-small" color="info" variant="tonal" class="ml-2">
        AI-Powered
      </v-chip>
    </v-card-title>

    <v-card-subtitle>
      Tax optimization suggestions based on your current income and deduction profile.
    </v-card-subtitle>

    <v-card-text>
      <v-skeleton-loader v-if="loading" type="card, card" />

      <div v-else-if="suggestions.length > 0" class="suggestions-grid">
        <v-card
          v-for="suggestion in suggestions"
          :key="suggestion.category"
          :color="getCategoryColor(suggestion.category)"
          variant="tonal"
          class="suggestion-card"
        >
          <v-card-text class="pa-4">
            <div class="d-flex align-start">
              <v-avatar
                :color="getCategoryColor(suggestion.category)"
                size="40"
                class="mr-3"
              >
                <v-icon color="white">{{ getCategoryIcon(suggestion.category) }}</v-icon>
              </v-avatar>

              <div class="flex-grow-1">
                <div class="text-subtitle-2 font-weight-medium">
                  {{ getCategoryTitle(suggestion.category) }}
                </div>
                <div class="text-caption text-medium-emphasis mb-2">
                  {{ suggestion.description }}
                </div>

                <div v-if="suggestion.potentialSavings > 0" class="d-flex align-center mb-2">
                  <v-icon size="small" color="success" class="mr-1">mdi-arrow-down</v-icon>
                  <span class="text-body-2 text-success font-weight-medium">
                    Save {{ formatINR(suggestion.potentialSavings) }}
                  </span>
                  <span class="text-caption text-medium-emphasis ml-1">
                    ({{ suggestion.percentageSavings.toFixed(1) }}% less)
                  </span>
                </div>

                <div v-if="suggestion.reason" class="text-caption text-medium-emphasis mb-2">
                  <v-icon size="x-small" class="mr-1">mdi-information</v-icon>
                  {{ suggestion.reason }}
                </div>

                <v-btn
                  size="small"
                  variant="flat"
                  :color="getCategoryColor(suggestion.category)"
                  :disabled="disabled"
                  @click="emit('apply', suggestion)"
                >
                  <v-icon start size="small">mdi-plus</v-icon>
                  Create Scenario
                </v-btn>
              </div>
            </div>
          </v-card-text>
        </v-card>
      </div>

      <v-alert
        v-else
        type="info"
        variant="tonal"
      >
        <div class="d-flex align-center">
          <v-icon class="mr-2">mdi-information</v-icon>
          <div>
            <strong>No suggestions available.</strong>
            <div class="text-caption">
              Add more income and deduction data to get personalized optimization suggestions.
            </div>
          </div>
        </div>
      </v-alert>

      <!-- Tip Card -->
      <v-card variant="outlined" class="mt-4" v-if="suggestions.length > 0">
        <v-card-text class="d-flex align-center pa-3">
          <v-icon color="info" class="mr-2">mdi-lightbulb-on</v-icon>
          <div class="text-caption text-medium-emphasis">
            <strong>Tip:</strong> Click "Create Scenario" to create a what-if scenario based on the suggestion.
            You can then compare multiple scenarios side-by-side.
          </div>
        </v-card-text>
      </v-card>
    </v-card-text>
  </v-card>
</template>

<style scoped>
.suggestions-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
}

.suggestion-card {
  height: 100%;
}
</style>
