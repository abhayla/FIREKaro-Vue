<script setup lang="ts">
import { ref, computed, watch, nextTick } from "vue";
import { formatINRLakhs } from "@/composables/useSalary";

export interface EditableGridCellProps {
  /**
   * The value to display/edit
   */
  modelValue: number | string | null;
  /**
   * Type of input
   */
  type?: "number" | "text" | "currency";
  /**
   * Whether the cell is editable
   */
  editable?: boolean;
  /**
   * Placeholder text when empty
   */
  placeholder?: string;
  /**
   * Minimum value (for number/currency)
   */
  min?: number;
  /**
   * Maximum value (for number/currency)
   */
  max?: number;
  /**
   * Custom format function
   */
  formatFn?: (value: number | string | null) => string;
  /**
   * Whether this is a total cell (bold styling)
   */
  isTotal?: boolean;
  /**
   * Cell variant for different colors
   */
  variant?: "default" | "earning" | "deduction" | "employer" | "summary";
  /**
   * Whether to show loading state
   */
  loading?: boolean;
}

const props = withDefaults(defineProps<EditableGridCellProps>(), {
  type: "currency",
  editable: false,
  placeholder: "-",
  isTotal: false,
  variant: "default",
  loading: false,
});

const emit = defineEmits<{
  "update:modelValue": [value: number | string | null];
  blur: [];
  focus: [];
  click: [];
}>();

// Local state
const localValue = ref(props.modelValue);
const isEditing = ref(false);
const isPending = ref(false);
const inputRef = ref<HTMLInputElement | null>(null);

// Sync external changes
watch(
  () => props.modelValue,
  (newVal) => {
    if (!isEditing.value) {
      localValue.value = newVal;
    }
  }
);

// Format display value
const displayValue = computed(() => {
  const val = localValue.value;

  if (val === null || val === undefined || val === "") {
    return props.placeholder;
  }

  if (props.formatFn) {
    return props.formatFn(val);
  }

  if (props.type === "currency" || props.type === "number") {
    const numVal = Number(val);
    if (isNaN(numVal)) return props.placeholder;
    return props.type === "currency" ? formatINRLakhs(numVal) : numVal.toLocaleString("en-IN");
  }

  return String(val);
});

// Cell classes
const cellClasses = computed(() => {
  const classes: string[] = ["editable-grid-cell"];

  if (props.isTotal) classes.push("total-cell");
  if (props.editable && !isEditing.value) classes.push("editable-hover");
  if (isEditing.value) classes.push("editing");
  if (isPending.value || props.loading) classes.push("pending");
  if (localValue.value === null || localValue.value === "") classes.push("empty-cell");

  // Variant classes
  if (props.variant !== "default") {
    classes.push(`variant-${props.variant}`);
  }

  return classes;
});

// Handle cell click - enter edit mode
const handleCellClick = () => {
  emit("click");
  if (props.editable && !isEditing.value) {
    isEditing.value = true;
    nextTick(() => {
      inputRef.value?.focus();
      inputRef.value?.select();
    });
  }
};

// Handle input changes
const handleInput = (event: Event) => {
  const target = event.target as HTMLInputElement;
  const rawValue = target.value;

  if (props.type === "number" || props.type === "currency") {
    localValue.value = rawValue === "" ? null : Number(rawValue);
  } else {
    localValue.value = rawValue || null;
  }
};

// Handle blur - exit edit mode and emit
const handleBlur = () => {
  isEditing.value = false;
  emit("update:modelValue", localValue.value);
  emit("blur");
};

// Handle focus
const handleFocus = () => {
  emit("focus");
};

// Handle keyboard shortcuts
const handleKeydown = (event: KeyboardEvent) => {
  if (event.key === "Enter") {
    handleBlur();
    inputRef.value?.blur();
  } else if (event.key === "Escape") {
    localValue.value = props.modelValue; // Reset to original
    isEditing.value = false;
    inputRef.value?.blur();
  }
};

// AG Grid pattern: Mark as pending for async operations
const markAsPending = (pending: boolean) => {
  isPending.value = pending;
};

// Expose methods for parent components
defineExpose({
  markAsPending,
  focus: () => {
    isEditing.value = true;
    nextTick(() => {
      inputRef.value?.focus();
      inputRef.value?.select();
    });
  },
  blur: () => {
    handleBlur();
    inputRef.value?.blur();
  },
});
</script>

<template>
  <td :class="cellClasses" @click="handleCellClick">
    <!-- Edit Mode -->
    <template v-if="isEditing && editable">
      <input
        ref="inputRef"
        :value="localValue ?? ''"
        :type="type === 'currency' ? 'number' : type"
        :min="min"
        :max="max"
        :placeholder="placeholder"
        class="cell-input"
        @input="handleInput"
        @blur="handleBlur"
        @focus="handleFocus"
        @keydown="handleKeydown"
      />
    </template>

    <!-- Display Mode -->
    <template v-else>
      <span class="cell-value text-currency">{{ displayValue }}</span>
      <v-icon
        v-if="editable && !loading && !isPending"
        icon="mdi-pencil-outline"
        size="x-small"
        class="edit-icon"
      />
    </template>

    <!-- Loading/Pending Indicator -->
    <v-progress-circular
      v-if="loading || isPending"
      indeterminate
      size="14"
      width="2"
      class="pending-indicator"
    />
  </td>
</template>

<style scoped>
.editable-grid-cell {
  padding: 8px 10px;
  text-align: right;
  font-size: 0.8125rem;
  white-space: nowrap;
  border-bottom: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  transition: background-color 0.15s ease;
  position: relative;
}

.cell-value {
  font-variant-numeric: tabular-nums;
}

.empty-cell {
  color: rgba(var(--v-theme-on-surface), 0.3);
}

/* Editable hover state */
.editable-hover {
  cursor: pointer;
}

.editable-hover:hover {
  background-color: rgba(var(--v-theme-primary), 0.08);
}

.editable-hover:hover .edit-icon {
  opacity: 1;
}

/* Edit icon */
.edit-icon {
  position: absolute;
  right: 2px;
  top: 50%;
  transform: translateY(-50%);
  opacity: 0;
  transition: opacity 0.15s ease;
  color: rgba(var(--v-theme-primary), 0.7);
}

/* Editing state */
.editing {
  padding: 4px;
  background-color: rgba(var(--v-theme-primary), 0.04);
}

.cell-input {
  width: 100%;
  padding: 4px 6px;
  border: 1px solid rgb(var(--v-theme-primary));
  border-radius: 4px;
  background: rgb(var(--v-theme-surface));
  color: rgb(var(--v-theme-on-surface));
  font-size: 0.8125rem;
  font-variant-numeric: tabular-nums;
  text-align: right;
  outline: none;
}

.cell-input:focus {
  box-shadow: 0 0 0 2px rgba(var(--v-theme-primary), 0.2);
}

/* Total cell */
.total-cell {
  font-weight: 600;
  background-color: rgba(var(--v-theme-primary), 0.04);
}

/* Variant styles */
.variant-earning .cell-value {
  color: rgb(var(--v-theme-success));
}

.variant-deduction .cell-value {
  color: rgb(var(--v-theme-error));
}

.variant-employer .cell-value {
  color: rgb(var(--v-theme-info));
}

.variant-summary {
  font-weight: 600;
}

.variant-summary .cell-value {
  color: rgb(var(--v-theme-primary));
}

/* Pending state */
.pending {
  opacity: 0.7;
  pointer-events: none;
}

.pending-indicator {
  position: absolute;
  right: 4px;
  top: 50%;
  transform: translateY(-50%);
}

/* Remove number input spinners */
.cell-input[type="number"]::-webkit-outer-spin-button,
.cell-input[type="number"]::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

.cell-input[type="number"] {
  -moz-appearance: textfield;
}
</style>
