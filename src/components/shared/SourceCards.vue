<script setup lang="ts">
import { formatINRLakhs } from "@/composables/useSalary";

export interface SourceCardData {
  id: string;
  name: string;
  subtitle?: string;
  amount: number;
  icon?: string;
  color?: string;
  badge?: string | number;
  metadata?: Record<string, string | number>;
}

const props = withDefaults(
  defineProps<{
    sources: SourceCardData[];
    modelValue?: string | null;
    showAll?: boolean;
    allLabel?: string;
    loading?: boolean;
    addLabel?: string;
    columns?: 2 | 3 | 4 | 6;
  }>(),
  {
    modelValue: null,
    showAll: true,
    allLabel: "All Sources",
    loading: false,
    addLabel: "Add Source",
    columns: 4,
  }
);

const emit = defineEmits<{
  (e: "update:modelValue", value: string | null): void;
  (e: "add"): void;
  (e: "edit", id: string): void;
}>();

const totalAmount = computed(() => {
  return props.sources.reduce((sum, s) => sum + s.amount, 0);
});

const isSelected = (id: string | null) => props.modelValue === id;

const selectSource = (id: string | null) => {
  emit("update:modelValue", id);
};

import { computed } from "vue";
</script>

<template>
  <div class="source-cards">
    <div class="d-flex align-center justify-space-between mb-3">
      <span class="text-subtitle-2 text-medium-emphasis">
        {{ sources.length }} {{ sources.length === 1 ? "Source" : "Sources" }}
      </span>
      <v-btn
        color="primary"
        variant="tonal"
        size="small"
        prepend-icon="mdi-plus"
        @click="emit('add')"
      >
        {{ addLabel }}
      </v-btn>
    </div>

    <v-row dense>
      <!-- All Sources Card -->
      <v-col v-if="showAll" :cols="12" :sm="6" :md="12 / columns">
        <v-card
          variant="outlined"
          :class="['source-card', { 'is-selected': isSelected(null) }]"
          @click="selectSource(null)"
        >
          <v-card-text class="pa-3">
            <div class="d-flex align-center">
              <v-avatar color="primary" size="40" class="mr-3">
                <v-icon icon="mdi-view-grid" color="white" />
              </v-avatar>
              <div class="flex-grow-1 overflow-hidden">
                <div class="text-subtitle-2 text-truncate">{{ allLabel }}</div>
                <div class="text-h6 font-weight-bold text-currency">
                  {{ formatINRLakhs(totalAmount) }}
                </div>
              </div>
              <v-icon
                v-if="isSelected(null)"
                icon="mdi-check-circle"
                color="primary"
                size="20"
              />
            </div>
          </v-card-text>
        </v-card>
      </v-col>

      <!-- Individual Source Cards -->
      <v-col
        v-for="source in sources"
        :key="source.id"
        :cols="12"
        :sm="6"
        :md="12 / columns"
      >
        <v-card
          variant="outlined"
          :class="['source-card', { 'is-selected': isSelected(source.id) }]"
          @click="selectSource(source.id)"
        >
          <v-card-text class="pa-3">
            <div class="d-flex align-center">
              <v-avatar :color="source.color ?? 'secondary'" size="40" class="mr-3">
                <v-icon :icon="source.icon ?? 'mdi-domain'" color="white" />
              </v-avatar>
              <div class="flex-grow-1 overflow-hidden">
                <div class="d-flex align-center">
                  <span class="text-subtitle-2 text-truncate">{{ source.name }}</span>
                  <v-chip
                    v-if="source.badge"
                    size="x-small"
                    color="primary"
                    variant="tonal"
                    class="ml-2"
                  >
                    {{ source.badge }}
                  </v-chip>
                </div>
                <div v-if="source.subtitle" class="text-caption text-medium-emphasis text-truncate">
                  {{ source.subtitle }}
                </div>
                <div class="text-h6 font-weight-bold text-currency">
                  {{ formatINRLakhs(source.amount) }}
                </div>
              </div>
              <div class="d-flex flex-column align-center">
                <v-icon
                  v-if="isSelected(source.id)"
                  icon="mdi-check-circle"
                  color="primary"
                  size="20"
                />
                <v-btn
                  icon="mdi-pencil"
                  size="x-small"
                  variant="text"
                  class="mt-1"
                  @click.stop="emit('edit', source.id)"
                />
              </div>
            </div>

            <!-- Optional Metadata -->
            <div v-if="source.metadata && Object.keys(source.metadata).length > 0" class="mt-2 pt-2 border-t">
              <div
                v-for="(value, key) in source.metadata"
                :key="key"
                class="d-flex justify-space-between text-caption"
              >
                <span class="text-medium-emphasis">{{ key }}:</span>
                <span class="font-weight-medium">{{ value }}</span>
              </div>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Loading State -->
    <v-row v-if="loading" dense>
      <v-col v-for="i in 3" :key="i" cols="12" sm="6" md="4">
        <v-skeleton-loader type="card" />
      </v-col>
    </v-row>

    <!-- Empty State -->
    <v-card v-if="!loading && sources.length === 0" variant="outlined" class="text-center pa-6">
      <v-icon icon="mdi-folder-outline" size="48" color="grey-lighten-1" class="mb-2" />
      <div class="text-body-2 text-medium-emphasis mb-3">No sources added yet</div>
      <v-btn color="primary" variant="flat" prepend-icon="mdi-plus" @click="emit('add')">
        {{ addLabel }}
      </v-btn>
    </v-card>
  </div>
</template>

<style scoped>
.source-card {
  cursor: pointer;
  transition: all 0.2s ease;
}

.source-card:hover {
  border-color: rgb(var(--v-theme-primary));
  box-shadow: 0 2px 8px rgba(var(--v-theme-primary), 0.1);
}

.source-card.is-selected {
  border-color: rgb(var(--v-theme-primary));
  border-width: 2px;
  background: rgba(var(--v-theme-primary), 0.04);
}

.border-t {
  border-top: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
}

.text-currency {
  font-family: "Roboto Mono", monospace;
}
</style>
