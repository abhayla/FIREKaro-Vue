<script setup lang="ts">
import { computed } from "vue";
import type { RegimeComparison, TaxRegime } from "@/types/tax";
import { formatINR } from "@/composables/useTax";

interface Props {
  comparison: RegimeComparison | null;
  loading?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
});

const emit = defineEmits<{
  (e: "select-regime", regime: TaxRegime): void;
}>();

const betterRegimeLabel = computed(() =>
  props.comparison?.betterRegime === "NEW" ? "New Regime" : "Old Regime",
);

const savingsLabel = computed(() => {
  if (!props.comparison) return "";
  const amount = formatINR(props.comparison.savingsAmount);
  return `Save ${amount}`;
});
</script>

<template>
  <v-card :loading="loading">
    <v-card-title>
      <v-icon class="mr-2">mdi-scale-balance</v-icon>
      Regime Comparison
    </v-card-title>

    <v-card-text v-if="comparison">
      <!-- Recommendation Banner -->
      <v-alert
        :color="comparison.betterRegime === 'NEW' ? 'primary' : 'secondary'"
        variant="tonal"
        class="mb-4"
      >
        <template #prepend>
          <v-icon icon="mdi-check-circle" />
        </template>
        <div class="text-body-2 font-weight-medium">
          {{ betterRegimeLabel }} is better for you
        </div>
        <div class="text-caption">
          {{ savingsLabel }} ({{ comparison.savingsPercentage.toFixed(1) }}%
          less tax)
        </div>
      </v-alert>

      <!-- Side-by-side comparison -->
      <v-row>
        <!-- Old Regime -->
        <v-col cols="12" md="6">
          <v-card
            variant="outlined"
            :color="comparison.betterRegime === 'OLD' ? 'secondary' : 'grey'"
            @click="emit('select-regime', 'OLD')"
            class="cursor-pointer"
          >
            <v-card-text>
              <div class="d-flex align-center justify-space-between mb-2">
                <v-chip
                  :color="
                    comparison.betterRegime === 'OLD' ? 'secondary' : 'grey'
                  "
                  size="small"
                >
                  Old Regime
                </v-chip>
                <v-chip
                  v-if="comparison.betterRegime === 'OLD'"
                  color="success"
                  size="small"
                  variant="flat"
                >
                  Recommended
                </v-chip>
              </div>

              <div class="text-h4 text-currency font-weight-bold mb-2">
                {{ formatINR(comparison.oldRegime.totalTaxLiability) }}
              </div>

              <v-list density="compact" class="bg-transparent">
                <v-list-item class="px-0">
                  <v-list-item-title class="text-caption"
                    >Gross Income</v-list-item-title
                  >
                  <template #append>
                    <span class="text-currency">
                      {{ formatINR(comparison.oldRegime.grossTotalIncome) }}
                    </span>
                  </template>
                </v-list-item>
                <v-list-item class="px-0">
                  <v-list-item-title class="text-caption"
                    >Deductions</v-list-item-title
                  >
                  <template #append>
                    <span class="text-currency text-negative">
                      -{{ formatINR(comparison.oldRegime.totalDeductions) }}
                    </span>
                  </template>
                </v-list-item>
                <v-list-item class="px-0">
                  <v-list-item-title class="text-caption"
                    >Taxable Income</v-list-item-title
                  >
                  <template #append>
                    <span class="text-currency">
                      {{ formatINR(comparison.oldRegime.taxableIncome) }}
                    </span>
                  </template>
                </v-list-item>
                <v-divider class="my-1" />
                <v-list-item class="px-0">
                  <v-list-item-title class="text-caption font-weight-medium">
                    Effective Rate
                  </v-list-item-title>
                  <template #append>
                    <span class="font-weight-bold">
                      {{ comparison.oldRegime.effectiveRate.toFixed(1) }}%
                    </span>
                  </template>
                </v-list-item>
              </v-list>
            </v-card-text>
          </v-card>
        </v-col>

        <!-- New Regime -->
        <v-col cols="12" md="6">
          <v-card
            variant="outlined"
            :color="comparison.betterRegime === 'NEW' ? 'primary' : 'grey'"
            @click="emit('select-regime', 'NEW')"
            class="cursor-pointer"
          >
            <v-card-text>
              <div class="d-flex align-center justify-space-between mb-2">
                <v-chip
                  :color="
                    comparison.betterRegime === 'NEW' ? 'primary' : 'grey'
                  "
                  size="small"
                >
                  New Regime
                </v-chip>
                <v-chip
                  v-if="comparison.betterRegime === 'NEW'"
                  color="success"
                  size="small"
                  variant="flat"
                >
                  Recommended
                </v-chip>
              </div>

              <div class="text-h4 text-currency font-weight-bold mb-2">
                {{ formatINR(comparison.newRegime.totalTaxLiability) }}
              </div>

              <v-list density="compact" class="bg-transparent">
                <v-list-item class="px-0">
                  <v-list-item-title class="text-caption"
                    >Gross Income</v-list-item-title
                  >
                  <template #append>
                    <span class="text-currency">
                      {{ formatINR(comparison.newRegime.grossTotalIncome) }}
                    </span>
                  </template>
                </v-list-item>
                <v-list-item class="px-0">
                  <v-list-item-title class="text-caption"
                    >Standard Deduction</v-list-item-title
                  >
                  <template #append>
                    <span class="text-currency text-negative">
                      -{{ formatINR(comparison.newRegime.totalDeductions) }}
                    </span>
                  </template>
                </v-list-item>
                <v-list-item class="px-0">
                  <v-list-item-title class="text-caption"
                    >Taxable Income</v-list-item-title
                  >
                  <template #append>
                    <span class="text-currency">
                      {{ formatINR(comparison.newRegime.taxableIncome) }}
                    </span>
                  </template>
                </v-list-item>
                <v-divider class="my-1" />
                <v-list-item class="px-0">
                  <v-list-item-title class="text-caption font-weight-medium">
                    Effective Rate
                  </v-list-item-title>
                  <template #append>
                    <span class="font-weight-bold">
                      {{ comparison.newRegime.effectiveRate.toFixed(1) }}%
                    </span>
                  </template>
                </v-list-item>
              </v-list>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </v-card-text>

    <v-card-text v-else-if="!loading" class="text-center py-8">
      <v-icon icon="mdi-scale-balance" size="64" color="grey-lighten-1" />
      <div class="text-body-1 text-medium-emphasis mt-4">
        No comparison data available
      </div>
    </v-card-text>
  </v-card>
</template>

<style scoped>
.cursor-pointer {
  cursor: pointer;
}
.cursor-pointer:hover {
  background-color: rgba(0, 0, 0, 0.02);
}
</style>
