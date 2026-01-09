<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import RuleConditionBuilder from './RuleConditionBuilder.vue'
import {
  useCategories,
  useExpenseRules,
  type ExpenseRule,
  type RuleCondition,
  type CreateRuleInput,
} from '@/composables/useExpenses'

const props = defineProps<{
  modelValue: boolean
  rule?: ExpenseRule | null
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  saved: []
}>()

const { data: categories } = useCategories()
const { createRule, updateRule, testRule } = useExpenseRules()

// Form state
const name = ref('')
const isActive = ref(true)
const priority = ref(0)
const conditions = ref<RuleCondition[]>([
  { field: 'merchant', operator: 'contains', value: '' },
])
const targetCategory = ref('')
const targetSubcategory = ref<string | null>(null)
const applyTags = ref<string[]>([])
const tagInput = ref('')

// Test result
const testResult = ref<{
  matches: number
  total: number
  matchPercentage: number
  matchedExpenses: Array<{ description: string; merchant?: string; amount: number }>
} | null>(null)

// Dialog state
const dialog = computed({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', v),
})

const isEditing = computed(() => !!props.rule)

// Category options
const categoryOptions = computed(
  () => categories.value?.map((c) => ({ title: c.name, value: c.name })) ?? []
)

// Subcategory options based on selected category
const subcategoryOptions = computed(() => {
  const cat = categories.value?.find((c) => c.name === targetCategory.value)
  if (!cat?.subcategories?.length) return []
  return cat.subcategories.map((s) => ({ title: s, value: s }))
})

// Validation
const isValid = computed(() => {
  if (!name.value.trim()) return false
  if (!targetCategory.value) return false
  if (conditions.value.length === 0) return false
  return conditions.value.every(
    (c) =>
      c.value !== '' &&
      (Array.isArray(c.value) ? c.value[0] !== 0 || c.value[1] !== 0 : true)
  )
})

// Reset form
const resetForm = () => {
  name.value = ''
  isActive.value = true
  priority.value = 0
  conditions.value = [{ field: 'merchant', operator: 'contains', value: '' }]
  targetCategory.value = ''
  targetSubcategory.value = null
  applyTags.value = []
  tagInput.value = ''
  testResult.value = null
}

// Populate form when editing
watch(
  () => props.rule,
  (rule) => {
    if (rule) {
      name.value = rule.name
      isActive.value = rule.isActive
      priority.value = rule.priority
      conditions.value = [...rule.conditions]
      targetCategory.value = rule.targetCategory
      targetSubcategory.value = rule.targetSubcategory ?? null
      applyTags.value = rule.applyTags ?? []
    } else {
      resetForm()
    }
  },
  { immediate: true }
)

// Add condition
const addCondition = () => {
  conditions.value.push({ field: 'description', operator: 'contains', value: '' })
}

// Update condition
const updateCondition = (index: number, condition: RuleCondition) => {
  conditions.value[index] = condition
}

// Delete condition
const deleteCondition = (index: number) => {
  conditions.value.splice(index, 1)
}

// Add tag
const addTag = () => {
  const tag = tagInput.value.trim()
  if (tag && !applyTags.value.includes(tag)) {
    applyTags.value.push(tag)
  }
  tagInput.value = ''
}

// Remove tag
const removeTag = (index: number) => {
  applyTags.value.splice(index, 1)
}

// Test rule
const handleTest = async () => {
  try {
    testResult.value = await testRule.mutateAsync(conditions.value)
  } catch (error) {
    console.error('Failed to test rule:', error)
  }
}

// Save rule
const handleSave = async () => {
  const data: CreateRuleInput = {
    name: name.value,
    isActive: isActive.value,
    priority: priority.value,
    conditions: conditions.value,
    targetCategory: targetCategory.value,
    targetSubcategory: targetSubcategory.value,
    applyTags: applyTags.value,
  }

  try {
    if (isEditing.value && props.rule) {
      await updateRule.mutateAsync({ id: props.rule.id, ...data })
    } else {
      await createRule.mutateAsync(data)
    }
    emit('saved')
    dialog.value = false
  } catch (error) {
    console.error('Failed to save rule:', error)
  }
}

// Close dialog
const handleClose = () => {
  resetForm()
  dialog.value = false
}
</script>

<template>
  <v-dialog v-model="dialog" max-width="700" persistent>
    <v-card>
      <v-card-title class="d-flex align-center">
        <v-icon :icon="isEditing ? 'mdi-pencil' : 'mdi-plus'" class="mr-2" />
        {{ isEditing ? 'Edit Rule' : 'Create Rule' }}
        <v-spacer />
        <v-btn icon="mdi-close" variant="text" @click="handleClose" />
      </v-card-title>

      <v-divider />

      <v-card-text class="pa-4">
        <!-- Basic Info -->
        <v-row class="mb-4">
          <v-col cols="12" sm="8">
            <v-text-field
              v-model="name"
              label="Rule Name"
              placeholder="e.g., Food Delivery Apps"
              hide-details
            />
          </v-col>
          <v-col cols="6" sm="2">
            <v-text-field
              v-model.number="priority"
              type="number"
              label="Priority"
              hide-details
              hint="Higher = checked first"
            />
          </v-col>
          <v-col cols="6" sm="2" class="d-flex align-center justify-center">
            <v-switch v-model="isActive" label="Active" color="success" hide-details />
          </v-col>
        </v-row>

        <!-- Conditions -->
        <div class="mb-4">
          <div class="d-flex align-center mb-2">
            <h4 class="text-subtitle-1 font-weight-bold">Conditions</h4>
            <v-chip size="x-small" class="ml-2" color="info" variant="tonal">
              Match all (AND)
            </v-chip>
            <v-spacer />
            <v-btn
              size="small"
              variant="text"
              color="primary"
              @click="addCondition"
            >
              <v-icon icon="mdi-plus" class="mr-1" />
              Add Condition
            </v-btn>
          </div>

          <RuleConditionBuilder
            v-for="(condition, index) in conditions"
            :key="index"
            :condition="condition"
            :index="index"
            :can-delete="conditions.length > 1"
            @update="updateCondition(index, $event)"
            @delete="deleteCondition(index)"
          />
        </div>

        <!-- Target Category -->
        <v-row class="mb-4">
          <v-col cols="12" sm="6">
            <v-select
              v-model="targetCategory"
              :items="categoryOptions"
              label="Target Category"
              placeholder="Select category"
              hide-details
            />
          </v-col>
          <v-col cols="12" sm="6">
            <v-select
              v-model="targetSubcategory"
              :items="subcategoryOptions"
              :disabled="!subcategoryOptions.length"
              label="Subcategory (optional)"
              clearable
              hide-details
            />
          </v-col>
        </v-row>

        <!-- Tags -->
        <div class="mb-4">
          <h4 class="text-subtitle-1 font-weight-bold mb-2">Apply Tags (optional)</h4>
          <div class="d-flex align-center gap-2">
            <v-text-field
              v-model="tagInput"
              label="Add tag"
              density="compact"
              hide-details
              @keyup.enter="addTag"
            />
            <v-btn variant="outlined" @click="addTag">Add</v-btn>
          </div>
          <div v-if="applyTags.length" class="mt-2">
            <v-chip
              v-for="(tag, index) in applyTags"
              :key="tag"
              closable
              class="mr-1 mb-1"
              size="small"
              @click:close="removeTag(index)"
            >
              {{ tag }}
            </v-chip>
          </div>
        </div>

        <!-- Test Result -->
        <v-expand-transition>
          <v-alert
            v-if="testResult"
            :type="testResult.matches > 0 ? 'success' : 'warning'"
            variant="tonal"
            class="mb-4"
          >
            <div class="d-flex align-center">
              <div>
                <strong>{{ testResult.matches }}</strong> of
                <strong>{{ testResult.total }}</strong> recent expenses match
                ({{ testResult.matchPercentage.toFixed(1) }}%)
              </div>
              <v-spacer />
              <v-btn size="small" variant="text" @click="testResult = null">
                Dismiss
              </v-btn>
            </div>
            <div v-if="testResult.matchedExpenses.length" class="mt-2 text-body-2">
              <strong>Examples:</strong>
              <ul class="mt-1 pl-4">
                <li v-for="(exp, i) in testResult.matchedExpenses.slice(0, 3)" :key="i">
                  {{ exp.merchant || exp.description }} - ₹{{ exp.amount.toLocaleString('en-IN') }}
                </li>
              </ul>
            </div>
          </v-alert>
        </v-expand-transition>
      </v-card-text>

      <v-divider />

      <v-card-actions class="pa-4">
        <v-btn
          variant="outlined"
          :loading="testRule.isPending.value"
          :disabled="!isValid"
          @click="handleTest"
        >
          <v-icon icon="mdi-test-tube" class="mr-1" />
          Test Rule
        </v-btn>
        <v-spacer />
        <v-btn variant="text" @click="handleClose">Cancel</v-btn>
        <v-btn
          color="primary"
          :loading="createRule.isPending.value || updateRule.isPending.value"
          :disabled="!isValid"
          @click="handleSave"
        >
          {{ isEditing ? 'Save Changes' : 'Create Rule' }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
