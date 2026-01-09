<script setup lang="ts">
import { computed } from "vue";
import { formatINR } from "@/composables/useTax";

interface Scenario {
  id: string;
  name: string;
  selectedRegime: string;
  totalGrossIncome: number;
  totalDeductions: number;
  taxableIncome: number;
  totalTaxLiability: number;
  taxDifferenceFromBaseline: number;
  percentageSavings: number;
  isBaseline?: boolean;
}

const props = defineProps<{
  modelValue: boolean;
  scenarios: Scenario[];
  baseline: Scenario | null;
}>();

const emit = defineEmits<{
  (e: "update:modelValue", value: boolean): void;
  (e: "close"): void;
}>();

const isOpen = computed({
  get: () => props.modelValue,
  set: (val) => emit("update:modelValue", val),
});

// Find the best scenario (lowest tax)
const bestScenarioId = computed(() => {
  if (props.scenarios.length === 0) return null;
  return props.scenarios.reduce((best, current) =>
    current.totalTaxLiability < best.totalTaxLiability ? current : best
  ).id;
});

// Comparison rows
const comparisonRows = computed(() => [
  {
    label: "Tax Regime",
    key: "selectedRegime",
    format: (val: string) => (val === "NEW" ? "New Regime" : "Old Regime"),
    isChip: true,
  },
  {
    label: "Gross Income",
    key: "totalGrossIncome",
    format: formatINR,
    isCurrency: true,
  },
  {
    label: "Deductions",
    key: "totalDeductions",
    format: (val: number) => `-${formatINR(val)}`,
    isCurrency: true,
    isNegative: true,
  },
  {
    label: "Taxable Income",
    key: "taxableIncome",
    format: formatINR,
    isCurrency: true,
  },
  {
    label: "Tax Liability",
    key: "totalTaxLiability",
    format: formatINR,
    isCurrency: true,
    isBold: true,
  },
  {
    label: "vs Baseline",
    key: "taxDifferenceFromBaseline",
    format: (val: number) => {
      if (val === 0) return "Same";
      return val < 0 ? `Save ${formatINR(Math.abs(val))}` : `+${formatINR(val)}`;
    },
    getDiffClass: (val: number) => {
      if (val < 0) return "text-success";
      if (val > 0) return "text-error";
      return "";
    },
  },
  {
    label: "% Difference",
    key: "percentageSavings",
    format: (val: number) => `${Math.abs(val).toFixed(1)}%`,
    getDiffClass: (val: number) => {
      if (val > 0) return "text-success";
      if (val < 0) return "text-error";
      return "";
    },
  },
]);

function getValue(scenario: Scenario, key: string): string | number | boolean | undefined {
  return scenario[key as keyof Scenario];
}

function formatValue(row: typeof comparisonRows.value[0], value: string | number | boolean | undefined): string {
  if (value === undefined || value === null) return '-';
  return row.format(value as never);
}
</script>

<template>
  <v-dialog
    v-model="isOpen"
    max-width="900"
    scrollable
  >
    <v-card>
      <v-card-title class="d-flex align-center">
        <v-icon class="mr-2">mdi-compare</v-icon>
        Compare Scenarios
        <v-spacer />
        <v-btn icon="mdi-close" variant="text" @click="emit('close')" />
      </v-card-title>

      <v-card-text>
        <v-table v-if="scenarios.length > 0" density="comfortable">
          <thead>
            <tr>
              <th class="text-left">Parameter</th>
              <th
                v-if="baseline"
                class="text-center"
              >
                <v-chip color="primary" size="small" variant="tonal">
                  <v-icon start size="small">mdi-anchor</v-icon>
                  Baseline
                </v-chip>
              </th>
              <th
                v-for="scenario in scenarios"
                :key="scenario.id"
                class="text-center"
              >
                <div class="d-flex align-center justify-center">
                  <span>{{ scenario.name }}</span>
                  <v-chip
                    v-if="scenario.id === bestScenarioId"
                    color="success"
                    size="x-small"
                    class="ml-1"
                  >
                    BEST
                  </v-chip>
                </div>
              </th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in comparisonRows" :key="row.key">
              <td class="text-medium-emphasis">{{ row.label }}</td>

              <!-- Baseline column -->
              <td v-if="baseline" class="text-center">
                <template v-if="row.isChip">
                  <v-chip
                    :color="getValue(baseline, row.key) === 'NEW' ? 'primary' : 'secondary'"
                    size="small"
                  >
                    {{ formatValue(row, getValue(baseline, row.key)) }}
                  </v-chip>
                </template>
                <template v-else-if="row.key === 'taxDifferenceFromBaseline' || row.key === 'percentageSavings'">
                  <span class="text-medium-emphasis">-</span>
                </template>
                <template v-else>
                  <span
                    :class="{
                      'text-currency': row.isCurrency,
                      'font-weight-bold': row.isBold,
                      'text-negative': row.isNegative,
                    }"
                  >
                    {{ formatValue(row, getValue(baseline, row.key)) }}
                  </span>
                </template>
              </td>

              <!-- Scenario columns -->
              <td
                v-for="scenario in scenarios"
                :key="`${scenario.id}-${row.key}`"
                class="text-center"
                :class="{
                  'bg-success-lighten-5': scenario.id === bestScenarioId && row.key === 'totalTaxLiability',
                }"
              >
                <template v-if="row.isChip">
                  <v-chip
                    :color="getValue(scenario, row.key) === 'NEW' ? 'primary' : 'secondary'"
                    size="small"
                  >
                    {{ formatValue(row, getValue(scenario, row.key)) }}
                  </v-chip>
                </template>
                <template v-else>
                  <span
                    :class="{
                      'text-currency': row.isCurrency,
                      'font-weight-bold': row.isBold,
                      'text-negative': row.isNegative,
                      [row.getDiffClass ? row.getDiffClass(getValue(scenario, row.key) as number) : '']: true,
                    }"
                  >
                    {{ formatValue(row, getValue(scenario, row.key)) }}
                  </span>
                </template>
              </td>
            </tr>
          </tbody>
        </v-table>

        <v-alert
          v-else
          type="info"
          variant="tonal"
        >
          Select at least 2 scenarios to compare.
        </v-alert>

        <!-- Recommendation -->
        <v-alert
          v-if="bestScenarioId"
          type="success"
          variant="tonal"
          class="mt-4"
        >
          <div class="d-flex align-center">
            <v-icon class="mr-2">mdi-lightbulb</v-icon>
            <div>
              <strong>Recommendation:</strong>
              "{{ scenarios.find(s => s.id === bestScenarioId)?.name }}" results in the lowest tax liability.
              <span v-if="scenarios.find(s => s.id === bestScenarioId)?.taxDifferenceFromBaseline">
                You could save
                <strong class="text-success">
                  {{ formatINR(Math.abs(scenarios.find(s => s.id === bestScenarioId)?.taxDifferenceFromBaseline ?? 0)) }}
                </strong>
                compared to your current position.
              </span>
            </div>
          </div>
        </v-alert>
      </v-card-text>

      <v-card-actions>
        <v-spacer />
        <v-btn variant="flat" color="primary" @click="emit('close')">
          Close
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
