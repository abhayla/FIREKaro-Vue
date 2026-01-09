<script setup lang="ts">
import { computed } from 'vue'
import type { RuleCondition } from '@/composables/useExpenses'

const props = defineProps<{
  condition: RuleCondition
  index: number
  canDelete: boolean
}>()

const emit = defineEmits<{
  update: [condition: RuleCondition]
  delete: []
}>()

// Field options
const fieldOptions = [
  { title: 'Merchant', value: 'merchant' },
  { title: 'Description', value: 'description' },
  { title: 'Amount', value: 'amount' },
  { title: 'Payment Method', value: 'paymentMethod' },
]

// Operator options based on field type
const operatorOptions = computed(() => {
  if (props.condition.field === 'amount') {
    return [
      { title: 'Equals', value: 'equals' },
      { title: 'Greater than', value: 'greaterThan' },
      { title: 'Less than', value: 'lessThan' },
      { title: 'Between', value: 'between' },
    ]
  }
  return [
    { title: 'Equals', value: 'equals' },
    { title: 'Contains', value: 'contains' },
    { title: 'Starts with', value: 'startsWith' },
    { title: 'Ends with', value: 'endsWith' },
  ]
})

// Show between inputs for amount
const showBetween = computed(
  () => props.condition.field === 'amount' && props.condition.operator === 'between'
)

// Show text input for text fields
const showTextInput = computed(
  () => props.condition.field !== 'amount' || props.condition.operator === 'equals'
)

// Between values
const betweenMin = computed({
  get: () => (Array.isArray(props.condition.value) ? props.condition.value[0] : 0),
  set: (val) => {
    const max = Array.isArray(props.condition.value) ? props.condition.value[1] : 0
    emit('update', { ...props.condition, value: [Number(val), max] })
  },
})

const betweenMax = computed({
  get: () => (Array.isArray(props.condition.value) ? props.condition.value[1] : 0),
  set: (val) => {
    const min = Array.isArray(props.condition.value) ? props.condition.value[0] : 0
    emit('update', { ...props.condition, value: [min, Number(val)] })
  },
})

// Update field
const updateField = (field: RuleCondition['field']) => {
  // Reset operator and value when field changes
  const isAmount = field === 'amount'
  emit('update', {
    ...props.condition,
    field,
    operator: 'equals',
    value: isAmount ? 0 : '',
  })
}

// Update operator
const updateOperator = (operator: RuleCondition['operator']) => {
  // Reset value if switching to/from between
  let value = props.condition.value
  if (operator === 'between') {
    value = [0, 0]
  } else if (Array.isArray(props.condition.value)) {
    value = props.condition.field === 'amount' ? 0 : ''
  }
  emit('update', { ...props.condition, operator, value })
}

// Update value
const updateValue = (value: string | number) => {
  emit('update', { ...props.condition, value })
}
</script>

<template>
  <v-card variant="outlined" class="mb-2">
    <v-card-text class="pa-3">
      <v-row align="center" dense>
        <!-- Field selector -->
        <v-col cols="12" sm="3">
          <v-select
            :model-value="condition.field"
            :items="fieldOptions"
            label="Field"
            density="compact"
            hide-details
            @update:model-value="updateField"
          />
        </v-col>

        <!-- Operator selector -->
        <v-col cols="12" sm="3">
          <v-select
            :model-value="condition.operator"
            :items="operatorOptions"
            label="Operator"
            density="compact"
            hide-details
            @update:model-value="updateOperator"
          />
        </v-col>

        <!-- Value input -->
        <v-col cols="12" :sm="canDelete ? 5 : 6">
          <!-- Between inputs -->
          <div v-if="showBetween" class="d-flex align-center gap-2">
            <v-text-field
              v-model.number="betweenMin"
              type="number"
              label="Min"
              density="compact"
              hide-details
              prefix="₹"
            />
            <span class="text-medium-emphasis">to</span>
            <v-text-field
              v-model.number="betweenMax"
              type="number"
              label="Max"
              density="compact"
              hide-details
              prefix="₹"
            />
          </div>

          <!-- Amount input (not between) -->
          <v-text-field
            v-else-if="condition.field === 'amount'"
            :model-value="condition.value"
            type="number"
            label="Value"
            density="compact"
            hide-details
            prefix="₹"
            @update:model-value="updateValue(Number($event))"
          />

          <!-- Text input -->
          <v-text-field
            v-else
            :model-value="condition.value"
            label="Value"
            density="compact"
            hide-details
            :placeholder="condition.operator === 'contains' ? 'e.g., swiggy, zomato' : 'Enter value'"
            @update:model-value="updateValue($event)"
          />
        </v-col>

        <!-- Delete button -->
        <v-col v-if="canDelete" cols="12" sm="1" class="text-right">
          <v-btn
            icon="mdi-close"
            size="small"
            variant="text"
            color="error"
            @click="emit('delete')"
          />
        </v-col>
      </v-row>
    </v-card-text>
  </v-card>
</template>
