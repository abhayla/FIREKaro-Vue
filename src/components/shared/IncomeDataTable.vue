<script setup lang="ts">
import { computed } from "vue";
import { formatINRLakhs } from "@/composables/useSalary";

export interface TableColumn {
  key: string;
  title: string;
  sortable?: boolean;
  align?: "start" | "center" | "end";
  width?: string | number;
  format?: "currency" | "date" | "percent" | "none";
}

const props = withDefaults(
  defineProps<{
    items: Record<string, unknown>[];
    columns: TableColumn[];
    loading?: boolean;
    itemsPerPage?: number;
    showSelect?: boolean;
    emptyText?: string;
    emptyIcon?: string;
  }>(),
  {
    loading: false,
    itemsPerPage: 10,
    showSelect: false,
    emptyText: "No records found",
    emptyIcon: "mdi-table-off",
  }
);

const emit = defineEmits<{
  (e: "edit", item: Record<string, unknown>): void;
  (e: "delete", item: Record<string, unknown>): void;
  (e: "row-click", item: Record<string, unknown>): void;
}>();

// Convert columns to v-data-table headers format
const headers = computed(() => {
  const cols = props.columns.map((col) => ({
    key: col.key,
    title: col.title,
    sortable: col.sortable ?? true,
    align: col.align ?? "start",
    width: col.width,
  }));

  // Add actions column
  cols.push({
    key: "actions",
    title: "Actions",
    sortable: false,
    align: "center" as const,
    width: 100,
  });

  return cols;
});

const formatValue = (value: unknown, format?: string): string => {
  if (value === null || value === undefined) return "-";

  switch (format) {
    case "currency":
      return formatINRLakhs(Number(value));
    case "date":
      if (typeof value === "string" || value instanceof Date) {
        return new Date(value).toLocaleDateString("en-IN", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        });
      }
      return String(value);
    case "percent":
      return `${Number(value).toFixed(1)}%`;
    default:
      return String(value);
  }
};

const getColumnFormat = (key: string): string | undefined => {
  return props.columns.find((c) => c.key === key)?.format;
};

// Handler for row click event
const handleRowClick = (
  _event: Event,
  data: { item: Record<string, unknown> }
) => {
  emit("row-click", data.item);
};
</script>

<template>
  <v-card variant="outlined" class="income-data-table">
    <v-data-table
      :headers="headers"
      :items="items"
      :loading="loading"
      :items-per-page="itemsPerPage"
      hover
      class="elevation-0"
      @click:row="handleRowClick"
    >
      <!-- Dynamic column slots -->
      <template v-for="col in columns" :key="col.key" #[`item.${col.key}`]="{ value }">
        <span :class="{ 'text-currency': col.format === 'currency' }">
          {{ formatValue(value, col.format) }}
        </span>
      </template>

      <!-- Actions column -->
      <template #item.actions="{ item }">
        <div class="d-flex justify-center ga-1">
          <v-btn
            icon="mdi-pencil"
            size="small"
            variant="text"
            color="primary"
            @click.stop="emit('edit', item)"
          >
            <v-icon size="small">mdi-pencil</v-icon>
            <v-tooltip activator="parent" location="top">Edit</v-tooltip>
          </v-btn>
          <v-btn
            icon="mdi-delete"
            size="small"
            variant="text"
            color="error"
            @click.stop="emit('delete', item)"
          >
            <v-icon size="small">mdi-delete</v-icon>
            <v-tooltip activator="parent" location="top">Delete</v-tooltip>
          </v-btn>
        </div>
      </template>

      <!-- Empty state -->
      <template #no-data>
        <div class="text-center pa-8">
          <v-icon :icon="emptyIcon" size="64" color="grey-lighten-1" class="mb-4" />
          <div class="text-body-1 text-medium-emphasis">{{ emptyText }}</div>
        </div>
      </template>

      <!-- Loading state -->
      <template #loading>
        <v-skeleton-loader type="table-row@5" />
      </template>

      <!-- Footer slot for summary -->
      <template #bottom>
        <slot name="footer" />
      </template>
    </v-data-table>
  </v-card>
</template>

<style scoped>
.income-data-table {
  overflow: hidden;
}

.income-data-table :deep(.v-data-table__tr:hover) {
  cursor: pointer;
}

.text-currency {
  font-family: "Roboto Mono", monospace;
}
</style>
