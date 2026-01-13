<script setup lang="ts">
import { ref, computed } from "vue";
import { formatINR, formatINRCompact, formatPercentage } from "@/composables/useInvestments";

export interface TableColumn {
  key: string;
  label: string;
  type: "text" | "currency" | "percent" | "date" | "number";
  sortable?: boolean;
  align?: "left" | "right" | "center";
  width?: string;
  format?: (value: unknown) => string;
}

export interface TableAction {
  icon: string;
  label: string;
  color?: string;
  action: "edit" | "delete" | "view" | "custom";
  customHandler?: (item: unknown) => void;
}

const props = withDefaults(
  defineProps<{
    items: Record<string, unknown>[];
    columns: TableColumn[];
    loading?: boolean;
    searchable?: boolean;
    searchPlaceholder?: string;
    itemKey?: string;
    actions?: TableAction[];
    emptyTitle?: string;
    emptySubtitle?: string;
    emptyIcon?: string;
    addButtonText?: string;
    showAddButton?: boolean;
    sortable?: boolean;
    dense?: boolean;
  }>(),
  {
    loading: false,
    searchable: true,
    searchPlaceholder: "Search...",
    itemKey: "id",
    emptyTitle: "No items found",
    emptySubtitle: "Add your first item to get started",
    emptyIcon: "mdi-package-variant",
    addButtonText: "Add Item",
    showAddButton: true,
    sortable: true,
    dense: false,
  }
);

const emit = defineEmits<{
  (e: "add"): void;
  (e: "edit", item: Record<string, unknown>): void;
  (e: "delete", item: Record<string, unknown>): void;
  (e: "view", item: Record<string, unknown>): void;
  (e: "row-click", item: Record<string, unknown>): void;
}>();

// Search state
const searchQuery = ref("");

// Sort state
const sortBy = ref<string>("");
const sortDesc = ref(false);

// Filtered and sorted items
const filteredItems = computed(() => {
  let result = [...props.items];

  // Filter by search
  if (searchQuery.value && props.searchable) {
    const query = searchQuery.value.toLowerCase();
    result = result.filter((item) =>
      props.columns.some((col) => {
        const value = item[col.key];
        if (value == null) return false;
        return String(value).toLowerCase().includes(query);
      })
    );
  }

  // Sort
  if (sortBy.value && props.sortable) {
    result.sort((a, b) => {
      const aVal = a[sortBy.value];
      const bVal = b[sortBy.value];

      if (aVal == null && bVal == null) return 0;
      if (aVal == null) return 1;
      if (bVal == null) return -1;

      let comparison = 0;
      if (typeof aVal === "number" && typeof bVal === "number") {
        comparison = aVal - bVal;
      } else {
        comparison = String(aVal).localeCompare(String(bVal));
      }

      return sortDesc.value ? -comparison : comparison;
    });
  }

  return result;
});

// Format cell value
const formatCellValue = (item: Record<string, unknown>, column: TableColumn): string => {
  const value = item[column.key];

  if (value == null) return "-";

  // Use custom formatter if provided
  if (column.format) {
    return column.format(value);
  }

  switch (column.type) {
    case "currency":
      return formatINRCompact(value as number);
    case "percent":
      return formatPercentage(value as number);
    case "date":
      return new Date(value as string).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    case "number":
      return (value as number).toLocaleString("en-IN");
    default:
      return String(value);
  }
};

// Get cell class
const getCellClass = (column: TableColumn, item: Record<string, unknown>): string => {
  const classes: string[] = [];

  if (column.align) {
    classes.push(`text-${column.align}`);
  } else if (column.type === "currency" || column.type === "percent" || column.type === "number") {
    classes.push("text-right");
  }

  if (column.type === "currency" || column.type === "number") {
    classes.push("text-currency");
  }

  // Color for percent values
  if (column.type === "percent") {
    const value = item[column.key] as number;
    if (value > 0) classes.push("text-success");
    else if (value < 0) classes.push("text-error");
  }

  return classes.join(" ");
};

// Toggle sort
const toggleSort = (column: TableColumn) => {
  if (!column.sortable && column.sortable !== undefined) return;

  if (sortBy.value === column.key) {
    if (sortDesc.value) {
      sortBy.value = "";
      sortDesc.value = false;
    } else {
      sortDesc.value = true;
    }
  } else {
    sortBy.value = column.key;
    sortDesc.value = false;
  }
};

// Handle action click
const handleAction = (action: TableAction, item: Record<string, unknown>) => {
  switch (action.action) {
    case "edit":
      emit("edit", item);
      break;
    case "delete":
      emit("delete", item);
      break;
    case "view":
      emit("view", item);
      break;
    case "custom":
      action.customHandler?.(item);
      break;
  }
};

// Get sort icon
const getSortIcon = (column: TableColumn): string => {
  if (sortBy.value !== column.key) return "mdi-unfold-more-horizontal";
  return sortDesc.value ? "mdi-arrow-down" : "mdi-arrow-up";
};
</script>

<template>
  <div class="investment-data-table">
    <!-- Toolbar -->
    <v-card variant="outlined" class="mb-4">
      <v-card-text class="d-flex gap-3 flex-wrap align-center">
        <v-btn
          v-if="showAddButton"
          color="primary"
          variant="flat"
          prepend-icon="mdi-plus"
          @click="emit('add')"
        >
          {{ addButtonText }}
        </v-btn>

        <v-spacer />

        <v-text-field
          v-if="searchable"
          v-model="searchQuery"
          :placeholder="searchPlaceholder"
          prepend-inner-icon="mdi-magnify"
          variant="outlined"
          density="compact"
          hide-details
          style="max-width: 250px"
          clearable
        />

        <slot name="toolbar-actions" />
      </v-card-text>
    </v-card>

    <!-- Loading State -->
    <template v-if="loading">
      <v-skeleton-loader type="table" />
    </template>

    <!-- Data Table -->
    <v-card v-else-if="filteredItems.length > 0" variant="outlined">
      <v-table :density="dense ? 'compact' : 'default'" hover>
        <thead>
          <tr>
            <th
              v-for="column in columns"
              :key="column.key"
              :class="[
                column.align ? `text-${column.align}` : '',
                { 'cursor-pointer': column.sortable !== false && sortable },
              ]"
              :style="column.width ? { width: column.width } : {}"
              @click="column.sortable !== false && sortable && toggleSort(column)"
            >
              <div class="d-flex align-center" :class="column.align === 'right' ? 'justify-end' : ''">
                {{ column.label }}
                <v-icon
                  v-if="column.sortable !== false && sortable"
                  :icon="getSortIcon(column)"
                  size="small"
                  class="ml-1"
                />
              </div>
            </th>
            <th v-if="actions && actions.length > 0" class="text-center" style="width: 100px">
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="item in filteredItems"
            :key="String(item[itemKey])"
            class="cursor-pointer"
            @click="emit('row-click', item)"
          >
            <td
              v-for="column in columns"
              :key="column.key"
              :class="getCellClass(column, item)"
            >
              <slot :name="`cell-${column.key}`" :item="item" :value="item[column.key]">
                {{ formatCellValue(item, column) }}
              </slot>
            </td>
            <td v-if="actions && actions.length > 0" class="text-center">
              <v-btn
                v-for="action in actions"
                :key="action.action"
                :icon="action.icon"
                :color="action.color"
                variant="text"
                size="small"
                :title="action.label"
                @click.stop="handleAction(action, item)"
              />
            </td>
          </tr>
        </tbody>
      </v-table>
    </v-card>

    <!-- Empty State -->
    <v-card v-else variant="outlined" class="pa-8 text-center">
      <v-icon :icon="emptyIcon" size="64" color="grey" class="mb-4" />
      <h3 class="text-h6 mb-2">{{ emptyTitle }}</h3>
      <p class="text-body-2 text-medium-emphasis mb-4">
        {{ searchQuery ? "Try a different search term" : emptySubtitle }}
      </p>
      <v-btn
        v-if="showAddButton && !searchQuery"
        color="primary"
        variant="flat"
        prepend-icon="mdi-plus"
        @click="emit('add')"
      >
        {{ addButtonText }}
      </v-btn>
    </v-card>
  </div>
</template>

<style scoped>
.investment-data-table {
  width: 100%;
}

.cursor-pointer {
  cursor: pointer;
}

.text-currency {
  font-family: "Roboto Mono", monospace;
}

th {
  font-weight: 600 !important;
  text-transform: uppercase;
  font-size: 0.75rem !important;
  letter-spacing: 0.03em;
}
</style>
