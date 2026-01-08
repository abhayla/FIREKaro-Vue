<script setup lang="ts">
import { computed } from "vue";
import type { DeductionCategoryDetail } from "@/types/tax";
import { formatINR } from "@/composables/useTax";

interface Props {
  category: DeductionCategoryDetail;
  editable?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  editable: false,
});

const emit = defineEmits<{
  (e: "add"): void;
  (e: "edit", id: string): void;
  (e: "delete", id: string): void;
}>();

const progressColor = computed(() => {
  if (props.category.utilizationPercent >= 90) return "success";
  if (props.category.utilizationPercent >= 50) return "warning";
  return "error";
});

const isAtLimit = computed(() => props.category.utilizationPercent >= 100);
</script>

<template>
  <v-card variant="outlined">
    <v-card-text>
      <!-- Header -->
      <div class="d-flex align-center justify-space-between mb-3">
        <div>
          <div class="text-subtitle-1 font-weight-medium">
            {{ category.label }}
          </div>
          <div class="text-caption text-medium-emphasis">
            {{ category.section }}
          </div>
        </div>
        <v-btn
          v-if="editable && !isAtLimit"
          icon="mdi-plus"
          size="small"
          variant="tonal"
          color="primary"
          @click="emit('add')"
        />
      </div>

      <!-- Progress -->
      <div class="mb-3">
        <div class="d-flex justify-space-between text-body-2 mb-1">
          <span>
            {{ formatINR(category.total) }} of {{ formatINR(category.limit) }}
          </span>
          <span :class="`text-${progressColor}`">
            {{ category.utilizationPercent.toFixed(0) }}%
          </span>
        </div>
        <v-progress-linear
          :model-value="category.utilizationPercent"
          :color="progressColor"
          height="8"
          rounded
        />
        <div
          v-if="category.remaining > 0"
          class="text-caption text-medium-emphasis mt-1"
        >
          {{ formatINR(category.remaining) }} remaining
        </div>
        <div v-else class="text-caption text-success mt-1">
          <v-icon icon="mdi-check-circle" size="small" class="mr-1" />
          Fully utilized
        </div>
      </div>

      <!-- Items -->
      <v-list v-if="category.items.length" density="compact" class="pa-0">
        <v-list-item v-for="item in category.items" :key="item.id" class="px-0">
          <v-list-item-title class="text-body-2">
            {{ item.description || item.category }}
          </v-list-item-title>
          <template #append>
            <span class="text-currency mr-2">{{ formatINR(item.amount) }}</span>
            <div v-if="editable" class="d-flex">
              <v-btn
                icon="mdi-pencil"
                size="x-small"
                variant="text"
                @click="emit('edit', item.id)"
              />
              <v-btn
                icon="mdi-delete"
                size="x-small"
                variant="text"
                color="error"
                @click="emit('delete', item.id)"
              />
            </div>
          </template>
        </v-list-item>
      </v-list>

      <!-- Empty state -->
      <div v-else class="text-center py-4">
        <v-icon
          icon="mdi-file-document-outline"
          size="32"
          color="grey-lighten-1"
        />
        <div class="text-caption text-medium-emphasis mt-2">
          No deductions added yet
        </div>
        <v-btn
          v-if="editable"
          variant="text"
          color="primary"
          size="small"
          class="mt-2"
          @click="emit('add')"
        >
          Add Deduction
        </v-btn>
      </div>
    </v-card-text>
  </v-card>
</template>
