<script setup lang="ts">
import { computed } from "vue";
import { formatINRLakhs } from "@/composables/useSalary";

export interface FilterCardData {
  id: string;
  label: string;
  count: number;
  amount: number;
  icon?: string;
  color?: string;
}

const props = withDefaults(
  defineProps<{
    filters: FilterCardData[];
    modelValue?: string | null;
    showAll?: boolean;
    allLabel?: string;
    loading?: boolean;
    compact?: boolean;
  }>(),
  {
    modelValue: null,
    showAll: true,
    allLabel: "All",
    loading: false,
    compact: false,
  }
);

const emit = defineEmits<{
  (e: "update:modelValue", value: string | null): void;
}>();

const totalCount = computed(() => {
  return props.filters.reduce((sum, f) => sum + f.count, 0);
});

const totalAmount = computed(() => {
  return props.filters.reduce((sum, f) => sum + f.amount, 0);
});

const isSelected = (id: string | null) => props.modelValue === id;

const selectFilter = (id: string | null) => {
  emit("update:modelValue", id);
};
</script>

<template>
  <div class="filter-cards">
    <!-- Compact Mode (Chip-style) -->
    <template v-if="compact">
      <div class="d-flex flex-wrap ga-2">
        <v-chip
          v-if="showAll"
          :color="isSelected(null) ? 'primary' : 'default'"
          :variant="isSelected(null) ? 'flat' : 'outlined'"
          @click="selectFilter(null)"
        >
          {{ allLabel }}
          <v-badge :content="totalCount" inline color="grey" class="ml-1" />
        </v-chip>
        <v-chip
          v-for="filter in filters"
          :key="filter.id"
          :color="isSelected(filter.id) ? (filter.color ?? 'primary') : 'default'"
          :variant="isSelected(filter.id) ? 'flat' : 'outlined'"
          @click="selectFilter(filter.id)"
        >
          <v-icon v-if="filter.icon" :icon="filter.icon" start size="small" />
          {{ filter.label }}
          <v-badge :content="filter.count" inline color="grey" class="ml-1" />
        </v-chip>
      </div>
    </template>

    <!-- Card Mode -->
    <template v-else>
      <v-row dense>
        <!-- All Filter Card -->
        <v-col v-if="showAll" cols="12" sm="6" md="4" lg="3">
          <v-card
            variant="outlined"
            :class="['filter-card', { 'is-selected': isSelected(null) }]"
            @click="selectFilter(null)"
          >
            <v-card-text class="pa-3">
              <div class="d-flex align-center justify-space-between">
                <div class="d-flex align-center">
                  <v-avatar color="primary" size="36" class="mr-2">
                    <v-icon icon="mdi-view-grid" size="small" color="white" />
                  </v-avatar>
                  <div>
                    <div class="text-subtitle-2">{{ allLabel }}</div>
                    <div class="text-caption text-medium-emphasis">
                      {{ totalCount }} items
                    </div>
                  </div>
                </div>
                <div class="text-right">
                  <div class="text-subtitle-1 font-weight-bold text-currency">
                    {{ formatINRLakhs(totalAmount) }}
                  </div>
                  <v-icon
                    v-if="isSelected(null)"
                    icon="mdi-check-circle"
                    color="primary"
                    size="16"
                  />
                </div>
              </div>
            </v-card-text>
          </v-card>
        </v-col>

        <!-- Individual Filter Cards -->
        <v-col
          v-for="filter in filters"
          :key="filter.id"
          cols="12"
          sm="6"
          md="4"
          lg="3"
        >
          <v-card
            variant="outlined"
            :class="['filter-card', { 'is-selected': isSelected(filter.id) }]"
            @click="selectFilter(filter.id)"
          >
            <v-card-text class="pa-3">
              <div class="d-flex align-center justify-space-between">
                <div class="d-flex align-center">
                  <v-avatar :color="filter.color ?? 'secondary'" size="36" class="mr-2">
                    <v-icon :icon="filter.icon ?? 'mdi-tag'" size="small" color="white" />
                  </v-avatar>
                  <div>
                    <div class="text-subtitle-2">{{ filter.label }}</div>
                    <div class="text-caption text-medium-emphasis">
                      {{ filter.count }} {{ filter.count === 1 ? "item" : "items" }}
                    </div>
                  </div>
                </div>
                <div class="text-right">
                  <div class="text-subtitle-1 font-weight-bold text-currency">
                    {{ formatINRLakhs(filter.amount) }}
                  </div>
                  <v-icon
                    v-if="isSelected(filter.id)"
                    icon="mdi-check-circle"
                    :color="filter.color ?? 'primary'"
                    size="16"
                  />
                </div>
              </div>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </template>

    <!-- Loading State -->
    <v-row v-if="loading && !compact" dense>
      <v-col v-for="i in 4" :key="i" cols="12" sm="6" md="3">
        <v-skeleton-loader type="card" height="80" />
      </v-col>
    </v-row>

    <div v-if="loading && compact" class="d-flex ga-2">
      <v-skeleton-loader v-for="i in 4" :key="i" type="chip" />
    </div>
  </div>
</template>

<style scoped>
.filter-card {
  cursor: pointer;
  transition: all 0.2s ease;
}

.filter-card:hover {
  border-color: rgb(var(--v-theme-primary));
  box-shadow: 0 2px 8px rgba(var(--v-theme-primary), 0.1);
}

.filter-card.is-selected {
  border-color: rgb(var(--v-theme-primary));
  border-width: 2px;
  background: rgba(var(--v-theme-primary), 0.04);
}

.text-currency {
  font-family: "Roboto Mono", monospace;
}
</style>
