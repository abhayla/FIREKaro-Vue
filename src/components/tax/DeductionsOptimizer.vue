<script setup lang="ts">
import { computed } from "vue";
import type { DeductionSummary } from "@/types/tax";
import {
  DEDUCTION_LIMITS,
  SECTION_80C_CATEGORIES,
  SECTION_80D_CATEGORIES,
} from "@/types/tax";
import { formatINR } from "@/composables/useTax";

interface Props {
  summary: DeductionSummary | null;
  loading?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
});

const totalUtilization = computed(() => {
  if (!props.summary) return 0;
  const max80C = DEDUCTION_LIMITS.section80C;
  const max80D = DEDUCTION_LIMITS.section80D;
  const max80CCD1B = DEDUCTION_LIMITS.section80CCD1B;
  const totalMax = max80C + max80D + max80CCD1B;

  const current80C = Math.min(props.summary.section80C.total, max80C);
  const current80D = Math.min(props.summary.section80D.total, max80D);
  const current80CCD1B = Math.min(
    props.summary.section80CCD1B.total,
    max80CCD1B,
  );
  const totalCurrent = current80C + current80D + current80CCD1B;

  return (totalCurrent / totalMax) * 100;
});

const utilizationColor = computed(() => {
  if (totalUtilization.value >= 90) return "success";
  if (totalUtilization.value >= 50) return "warning";
  return "error";
});

const section80CProgress = computed(() => {
  if (!props.summary) return 0;
  return (props.summary.section80C.total / DEDUCTION_LIMITS.section80C) * 100;
});

const section80DProgress = computed(() => {
  if (!props.summary) return 0;
  return (props.summary.section80D.total / DEDUCTION_LIMITS.section80D) * 100;
});

const section80CCD1BProgress = computed(() => {
  if (!props.summary) return 0;
  return (
    (props.summary.section80CCD1B.total / DEDUCTION_LIMITS.section80CCD1B) * 100
  );
});

const potentialSavings = computed(() => {
  if (!props.summary) return 0;
  // At 30% tax bracket
  const unused80C = Math.max(
    0,
    DEDUCTION_LIMITS.section80C - props.summary.section80C.total,
  );
  const unused80D = Math.max(
    0,
    DEDUCTION_LIMITS.section80D - props.summary.section80D.total,
  );
  const unused80CCD1B = Math.max(
    0,
    DEDUCTION_LIMITS.section80CCD1B - props.summary.section80CCD1B.total,
  );

  return Math.round((unused80C + unused80D + unused80CCD1B) * 0.3);
});

const suggestions = computed(() => {
  if (!props.summary) return [];

  const items = [];

  // 80C suggestions
  if (props.summary.section80C.total < DEDUCTION_LIMITS.section80C) {
    const remaining =
      DEDUCTION_LIMITS.section80C - props.summary.section80C.total;
    items.push({
      section: "80C",
      icon: "mdi-piggy-bank",
      color: "primary",
      title: `Maximize 80C - ${formatINR(remaining)} remaining`,
      options: [
        "ELSS Mutual Funds",
        "PPF",
        "NPS (Tier 1)",
        "Life Insurance",
        "5-Year FD",
      ],
      potentialSavings: Math.round(remaining * 0.3),
    });
  }

  // 80D suggestions
  if (props.summary.section80D.total < DEDUCTION_LIMITS.section80D) {
    const remaining =
      DEDUCTION_LIMITS.section80D - props.summary.section80D.total;
    items.push({
      section: "80D",
      icon: "mdi-hospital-box",
      color: "error",
      title: `Health Insurance - ${formatINR(remaining)} remaining`,
      options: [
        "Self & Family Premium",
        "Parents Premium",
        "Preventive Checkup",
      ],
      potentialSavings: Math.round(remaining * 0.3),
    });
  }

  // 80CCD(1B) suggestions
  if (props.summary.section80CCD1B.total < DEDUCTION_LIMITS.section80CCD1B) {
    const remaining =
      DEDUCTION_LIMITS.section80CCD1B - props.summary.section80CCD1B.total;
    items.push({
      section: "80CCD(1B)",
      icon: "mdi-account-clock",
      color: "info",
      title: `NPS Additional - ${formatINR(remaining)} remaining`,
      options: ["NPS Tier 1 (Additional Rs.50K)"],
      potentialSavings: Math.round(remaining * 0.3),
    });
  }

  return items;
});
</script>

<template>
  <v-card :loading="loading">
    <v-card-title>
      <v-icon class="mr-2">mdi-tune</v-icon>
      Deductions Optimizer
    </v-card-title>

    <v-card-text v-if="summary">
      <!-- Overall Progress -->
      <v-alert :color="utilizationColor" variant="tonal" class="mb-4">
        <div class="d-flex align-center justify-space-between">
          <div>
            <div class="text-body-2 font-weight-medium">
              {{ totalUtilization.toFixed(0) }}% Deductions Utilized
            </div>
            <div class="text-caption">
              Total: {{ formatINR(summary.totalDeductions) }}
            </div>
          </div>
          <div v-if="potentialSavings > 0" class="text-end">
            <div class="text-caption">Potential Savings</div>
            <div class="text-body-1 font-weight-bold">
              {{ formatINR(potentialSavings) }}
            </div>
          </div>
        </div>
      </v-alert>

      <!-- Section-wise Progress -->
      <v-row class="mb-4">
        <v-col cols="12" md="4">
          <v-card variant="outlined">
            <v-card-text class="pb-2">
              <div class="d-flex justify-space-between align-center mb-2">
                <v-chip color="primary" size="small">Section 80C</v-chip>
                <span class="text-caption"
                  >{{ formatINR(DEDUCTION_LIMITS.section80C) }} limit</span
                >
              </div>
              <div class="text-h6 text-currency mb-2">
                {{ formatINR(summary.section80C.total) }}
              </div>
              <v-progress-linear
                :model-value="Math.min(section80CProgress, 100)"
                color="primary"
                height="8"
                rounded
              />
              <div class="text-caption text-medium-emphasis mt-1">
                {{
                  formatINR(
                    Math.max(
                      0,
                      DEDUCTION_LIMITS.section80C - summary.section80C.total,
                    ),
                  )
                }}
                remaining
              </div>
            </v-card-text>
          </v-card>
        </v-col>

        <v-col cols="12" md="4">
          <v-card variant="outlined">
            <v-card-text class="pb-2">
              <div class="d-flex justify-space-between align-center mb-2">
                <v-chip color="error" size="small">Section 80D</v-chip>
                <span class="text-caption"
                  >{{ formatINR(DEDUCTION_LIMITS.section80D) }} limit</span
                >
              </div>
              <div class="text-h6 text-currency mb-2">
                {{ formatINR(summary.section80D.total) }}
              </div>
              <v-progress-linear
                :model-value="Math.min(section80DProgress, 100)"
                color="error"
                height="8"
                rounded
              />
              <div class="text-caption text-medium-emphasis mt-1">
                {{
                  formatINR(
                    Math.max(
                      0,
                      DEDUCTION_LIMITS.section80D - summary.section80D.total,
                    ),
                  )
                }}
                remaining
              </div>
            </v-card-text>
          </v-card>
        </v-col>

        <v-col cols="12" md="4">
          <v-card variant="outlined">
            <v-card-text class="pb-2">
              <div class="d-flex justify-space-between align-center mb-2">
                <v-chip color="info" size="small">80CCD(1B)</v-chip>
                <span class="text-caption"
                  >{{ formatINR(DEDUCTION_LIMITS.section80CCD1B) }} limit</span
                >
              </div>
              <div class="text-h6 text-currency mb-2">
                {{ formatINR(summary.section80CCD1B.total) }}
              </div>
              <v-progress-linear
                :model-value="Math.min(section80CCD1BProgress, 100)"
                color="info"
                height="8"
                rounded
              />
              <div class="text-caption text-medium-emphasis mt-1">
                {{
                  formatINR(
                    Math.max(
                      0,
                      DEDUCTION_LIMITS.section80CCD1B -
                        summary.section80CCD1B.total,
                    ),
                  )
                }}
                remaining
              </div>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <!-- Optimization Suggestions -->
      <div v-if="suggestions.length">
        <div class="text-subtitle-2 mb-2">Optimization Suggestions</div>
        <v-expansion-panels variant="accordion">
          <v-expansion-panel
            v-for="suggestion in suggestions"
            :key="suggestion.section"
          >
            <v-expansion-panel-title>
              <div class="d-flex align-center">
                <v-avatar :color="suggestion.color" size="32" class="mr-3">
                  <v-icon :icon="suggestion.icon" size="small" />
                </v-avatar>
                <div>
                  <div class="text-body-2">{{ suggestion.title }}</div>
                  <div class="text-caption text-success">
                    Save up to {{ formatINR(suggestion.potentialSavings) }}
                  </div>
                </div>
              </div>
            </v-expansion-panel-title>
            <v-expansion-panel-text>
              <div class="text-body-2 mb-2">Suggested Investments:</div>
              <v-chip-group>
                <v-chip
                  v-for="option in suggestion.options"
                  :key="option"
                  size="small"
                  variant="outlined"
                >
                  {{ option }}
                </v-chip>
              </v-chip-group>
            </v-expansion-panel-text>
          </v-expansion-panel>
        </v-expansion-panels>
      </div>

      <!-- Fully Optimized -->
      <v-alert v-else type="success" variant="tonal">
        <div class="d-flex align-center">
          <v-icon icon="mdi-check-circle" class="mr-2" />
          Your deductions are fully optimized!
        </div>
      </v-alert>
    </v-card-text>

    <v-card-text v-else-if="!loading" class="text-center py-8">
      <v-icon icon="mdi-tune" size="64" color="grey-lighten-1" />
      <div class="text-body-1 text-medium-emphasis mt-4">
        No deduction data available
      </div>
    </v-card-text>
  </v-card>
</template>
