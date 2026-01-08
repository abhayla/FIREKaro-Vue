<script setup lang="ts">
import { computed } from "vue";
import type { IncomeType } from "@/types/income";
import { formatINR } from "@/composables/useIncome";

interface Props {
  type: IncomeType;
  title: string;
  subtitle?: string;
  amount: number;
  secondaryLabel?: string;
  secondaryAmount?: number;
  count?: number;
  loading?: boolean;
  href?: string;
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
});

const emit = defineEmits<{
  (e: "click"): void;
  (e: "add"): void;
}>();

const iconMap: Record<IncomeType, string> = {
  business: "mdi-store",
  rental: "mdi-home-city",
  capital_gains: "mdi-trending-up",
  interest: "mdi-percent",
  dividend: "mdi-cash-multiple",
  other: "mdi-dots-horizontal-circle",
};

const colorMap: Record<IncomeType, string> = {
  business: "primary",
  rental: "secondary",
  capital_gains: "success",
  interest: "info",
  dividend: "warning",
  other: "grey",
};

const icon = computed(() => iconMap[props.type]);
const color = computed(() => colorMap[props.type]);
</script>

<template>
  <v-card :loading="loading" class="income-source-card" @click="emit('click')">
    <v-card-item>
      <template #prepend>
        <v-avatar :color="color" size="48">
          <v-icon :icon="icon" color="white" />
        </v-avatar>
      </template>

      <v-card-title class="text-body-1 font-weight-medium">
        {{ title }}
      </v-card-title>

      <v-card-subtitle v-if="subtitle" class="text-caption">
        {{ subtitle }}
      </v-card-subtitle>

      <template #append>
        <div class="text-right">
          <div class="text-h6 text-currency font-weight-bold">
            {{ formatINR(amount) }}
          </div>
          <div
            v-if="secondaryLabel && secondaryAmount !== undefined"
            class="text-caption text-medium-emphasis"
          >
            {{ secondaryLabel }}:
            <span class="text-currency">{{ formatINR(secondaryAmount) }}</span>
          </div>
        </div>
      </template>
    </v-card-item>

    <v-card-actions v-if="count !== undefined || href">
      <v-chip
        v-if="count !== undefined"
        size="small"
        variant="tonal"
        :color="color"
      >
        {{ count }} {{ count === 1 ? "source" : "sources" }}
      </v-chip>

      <v-spacer />

      <v-btn
        v-if="href"
        variant="text"
        color="primary"
        size="small"
        :to="href"
        append-icon="mdi-chevron-right"
      >
        View Details
      </v-btn>
    </v-card-actions>
  </v-card>
</template>

<style scoped>
.income-source-card {
  cursor: pointer;
  transition:
    transform 0.2s,
    box-shadow 0.2s;
}

.income-source-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}
</style>
