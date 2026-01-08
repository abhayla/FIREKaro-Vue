<script setup lang="ts">
import { computed } from "vue";
import { formatINR, formatINRLakhs } from "@/composables/useSalary";

interface ComparisonData {
  currentFY: string;
  previousFY: string;
  currentGross: number;
  previousGross: number;
  currentNet: number;
  previousNet: number;
  grossGrowth: number;
  netGrowth: number;
  grossGrowthPercent: number;
  netGrowthPercent: number;
}

const props = defineProps<{
  comparison: ComparisonData | null;
  loading?: boolean;
}>();

const hasGrowth = computed(() => {
  if (!props.comparison) return false;
  return props.comparison.grossGrowthPercent > 0;
});

const growthColor = computed(() => {
  if (!props.comparison) return "grey";
  return props.comparison.grossGrowthPercent >= 0 ? "success" : "error";
});

const growthIcon = computed(() => {
  if (!props.comparison) return "mdi-minus";
  return props.comparison.grossGrowthPercent >= 0
    ? "mdi-trending-up"
    : "mdi-trending-down";
});
</script>

<template>
  <v-card :loading="loading">
    <v-card-title class="d-flex align-center">
      <v-icon icon="mdi-compare-horizontal" class="mr-2" />
      Year-over-Year Comparison
    </v-card-title>

    <v-card-text v-if="!comparison && !loading">
      <v-alert type="info" variant="tonal">
        Add salary data for multiple financial years to see comparison.
      </v-alert>
    </v-card-text>

    <v-card-text v-else-if="comparison">
      <!-- Growth Summary -->
      <div class="d-flex align-center justify-center mb-4">
        <v-chip :color="growthColor" size="large" variant="flat" class="px-6">
          <v-icon :icon="growthIcon" start />
          <span class="text-h6 font-weight-bold">
            {{ comparison.grossGrowthPercent >= 0 ? "+" : ""
            }}{{ comparison.grossGrowthPercent.toFixed(1) }}%
          </span>
          <span class="ml-2 text-body-2">YoY Growth</span>
        </v-chip>
      </div>

      <!-- Comparison Grid -->
      <v-row dense>
        <!-- Current FY -->
        <v-col cols="12" sm="6">
          <v-card variant="tonal" color="primary" class="pa-4">
            <div class="text-overline text-medium-emphasis mb-1">
              {{ comparison.currentFY }}
            </div>
            <div class="text-h5 font-weight-bold">
              {{ formatINRLakhs(comparison.currentGross) }}
            </div>
            <div class="text-caption text-medium-emphasis">Gross Earnings</div>
            <v-divider class="my-3" />
            <div class="d-flex justify-space-between">
              <span class="text-body-2">Net Salary</span>
              <span class="font-weight-medium">{{
                formatINRLakhs(comparison.currentNet)
              }}</span>
            </div>
          </v-card>
        </v-col>

        <!-- Previous FY -->
        <v-col cols="12" sm="6">
          <v-card variant="outlined" class="pa-4">
            <div class="text-overline text-medium-emphasis mb-1">
              {{ comparison.previousFY }}
            </div>
            <div class="text-h5 font-weight-bold">
              {{ formatINRLakhs(comparison.previousGross) }}
            </div>
            <div class="text-caption text-medium-emphasis">Gross Earnings</div>
            <v-divider class="my-3" />
            <div class="d-flex justify-space-between">
              <span class="text-body-2">Net Salary</span>
              <span class="font-weight-medium">{{
                formatINRLakhs(comparison.previousNet)
              }}</span>
            </div>
          </v-card>
        </v-col>
      </v-row>

      <!-- Growth Details -->
      <v-card variant="tonal" class="mt-4 pa-4">
        <div class="text-subtitle-2 font-weight-bold mb-3">Growth Analysis</div>
        <v-row dense>
          <v-col cols="6">
            <div class="text-caption text-medium-emphasis">Gross Growth</div>
            <div class="d-flex align-center">
              <v-icon
                :icon="
                  comparison.grossGrowth >= 0
                    ? 'mdi-arrow-up'
                    : 'mdi-arrow-down'
                "
                :color="comparison.grossGrowth >= 0 ? 'success' : 'error'"
                size="small"
                class="mr-1"
              />
              <span
                :class="
                  comparison.grossGrowth >= 0 ? 'text-success' : 'text-error'
                "
                class="font-weight-medium"
              >
                {{ formatINR(Math.abs(comparison.grossGrowth)) }}
              </span>
            </div>
          </v-col>
          <v-col cols="6">
            <div class="text-caption text-medium-emphasis">Net Growth</div>
            <div class="d-flex align-center">
              <v-icon
                :icon="
                  comparison.netGrowth >= 0 ? 'mdi-arrow-up' : 'mdi-arrow-down'
                "
                :color="comparison.netGrowth >= 0 ? 'success' : 'error'"
                size="small"
                class="mr-1"
              />
              <span
                :class="
                  comparison.netGrowth >= 0 ? 'text-success' : 'text-error'
                "
                class="font-weight-medium"
              >
                {{ formatINR(Math.abs(comparison.netGrowth)) }}
              </span>
            </div>
          </v-col>
        </v-row>

        <v-progress-linear
          v-if="hasGrowth"
          :model-value="Math.min(comparison.grossGrowthPercent, 100)"
          color="success"
          height="8"
          rounded
          class="mt-3"
        >
          <template #default>
            <span class="text-caption"
              >{{ comparison.grossGrowthPercent.toFixed(1) }}%</span
            >
          </template>
        </v-progress-linear>
      </v-card>
    </v-card-text>
  </v-card>
</template>
