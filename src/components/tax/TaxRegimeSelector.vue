<script setup lang="ts">
import { computed } from "vue";
import type { TaxRegime } from "@/types/tax";

interface Props {
  modelValue: TaxRegime;
  disabled?: boolean;
  showDescription?: boolean;
}

interface Emits {
  (e: "update:modelValue", value: TaxRegime): void;
}

const props = withDefaults(defineProps<Props>(), {
  disabled: false,
  showDescription: true,
});

const emit = defineEmits<Emits>();

const selectedRegime = computed({
  get: () => props.modelValue,
  set: (value: TaxRegime) => emit("update:modelValue", value),
});

const regimeOptions = [
  {
    value: "OLD" as TaxRegime,
    label: "Old Regime",
    shortLabel: "Old",
    color: "secondary",
    icon: "mdi-file-document-multiple",
    features: [
      "Multiple deductions (80C, 80D, HRA, etc.)",
      "Standard deduction of Rs.50,000",
      "Higher tax rates",
      "Good for high deductions",
    ],
    limits: [
      { label: "80C", value: "Rs.1.5L" },
      { label: "80D", value: "Rs.25K-75K" },
      { label: "HRA", value: "Variable" },
      { label: "NPS", value: "Rs.50K extra" },
    ],
  },
  {
    value: "NEW" as TaxRegime,
    label: "New Regime",
    shortLabel: "New",
    color: "primary",
    icon: "mdi-lightning-bolt",
    features: [
      "Lower tax rates across slabs",
      "Standard deduction of Rs.75,000",
      "No other deductions",
      "Simpler filing process",
    ],
    limits: [
      { label: "0-3L", value: "Nil" },
      { label: "3-7L", value: "5%" },
      { label: "7-10L", value: "10%" },
      { label: "15L+", value: "30%" },
    ],
  },
];

const selectedOption = computed(() =>
  regimeOptions.find((o) => o.value === selectedRegime.value),
);
</script>

<template>
  <div>
    <!-- Compact Toggle -->
    <v-btn-toggle
      v-model="selectedRegime"
      mandatory
      :disabled="disabled"
      color="primary"
      variant="outlined"
      divided
    >
      <v-btn
        v-for="option in regimeOptions"
        :key="option.value"
        :value="option.value"
      >
        <v-icon start :icon="option.icon" />
        {{ option.shortLabel }}
      </v-btn>
    </v-btn-toggle>

    <!-- Detailed Description -->
    <v-expand-transition>
      <div v-if="showDescription && selectedOption" class="mt-4">
        <v-card variant="outlined" :color="selectedOption.color">
          <v-card-text>
            <div class="d-flex align-center mb-3">
              <v-avatar :color="selectedOption.color" size="40" class="mr-3">
                <v-icon :icon="selectedOption.icon" />
              </v-avatar>
              <div>
                <div class="text-subtitle-1 font-weight-medium">
                  {{ selectedOption.label }}
                </div>
                <div class="text-caption text-medium-emphasis">
                  {{
                    selectedOption.value === "NEW"
                      ? "Default from FY 2023-24"
                      : "Optional"
                  }}
                </div>
              </div>
            </div>

            <v-row>
              <v-col cols="12" md="6">
                <div class="text-caption text-medium-emphasis mb-2">
                  Key Features
                </div>
                <v-list density="compact" class="bg-transparent pa-0">
                  <v-list-item
                    v-for="(feature, idx) in selectedOption.features"
                    :key="idx"
                    class="px-0"
                  >
                    <template #prepend>
                      <v-icon icon="mdi-check" size="small" color="success" />
                    </template>
                    <v-list-item-title class="text-body-2">{{
                      feature
                    }}</v-list-item-title>
                  </v-list-item>
                </v-list>
              </v-col>
              <v-col cols="12" md="6">
                <div class="text-caption text-medium-emphasis mb-2">
                  {{
                    selectedOption.value === "OLD"
                      ? "Deduction Limits"
                      : "Tax Slabs"
                  }}
                </div>
                <v-chip-group>
                  <v-chip
                    v-for="limit in selectedOption.limits"
                    :key="limit.label"
                    size="small"
                    variant="outlined"
                  >
                    {{ limit.label }}: {{ limit.value }}
                  </v-chip>
                </v-chip-group>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>
      </div>
    </v-expand-transition>
  </div>
</template>
