<script setup lang="ts">
import { ref, computed } from 'vue'
import RuleEditor from '@/components/expenses/RuleEditor.vue'
import {
  useCategories,
  useExpenseRules,
  type ExpenseRule,
  type RuleSuggestion,
} from '@/composables/useExpenses'

const props = defineProps<{
  modelValue: boolean
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
}>()

const isOpen = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
})

// Data fetching
const { data: categories, isLoading: categoriesLoading } = useCategories()
const {
  rules,
  suggestions,
  isLoading: rulesLoading,
  createRule,
  deleteRule,
  toggleRule,
  refetchSuggestions,
} = useExpenseRules()

// UI state
const showRuleEditor = ref(false)
const editingRule = ref<ExpenseRule | null>(null)
const deleteConfirmDialog = ref(false)
const deletingRuleId = ref<string | null>(null)
const activeTab = ref<'rules' | 'categories'>('rules')

// Snackbar
const snackbar = ref({
  show: false,
  message: '',
  color: 'success',
})

const showMessage = (message: string, color = 'success') => {
  snackbar.value = { show: true, message, color }
}

// Open create rule dialog
const openCreateRule = () => {
  editingRule.value = null
  showRuleEditor.value = true
}

// Open edit rule dialog
const openEditRule = (rule: ExpenseRule) => {
  editingRule.value = rule
  showRuleEditor.value = true
}

// Confirm delete
const confirmDelete = (id: string) => {
  deletingRuleId.value = id
  deleteConfirmDialog.value = true
}

// Delete rule
const handleDeleteRule = async () => {
  if (!deletingRuleId.value) return
  try {
    await deleteRule.mutateAsync(deletingRuleId.value)
    showMessage('Rule deleted successfully')
    deleteConfirmDialog.value = false
    deletingRuleId.value = null
  } catch {
    showMessage('Failed to delete rule', 'error')
  }
}

// Toggle rule active status
const handleToggleRule = async (id: string) => {
  try {
    await toggleRule.mutateAsync(id)
    showMessage('Rule status updated')
  } catch {
    showMessage('Failed to update rule', 'error')
  }
}

// Accept suggestion
const acceptSuggestion = async (suggestion: RuleSuggestion) => {
  try {
    await createRule.mutateAsync({
      name: suggestion.suggestion.replace('Create rule for ', '').split(' → ')[0],
      isActive: true,
      priority: 0,
      conditions: suggestion.conditions,
      targetCategory: suggestion.targetCategory,
      applyTags: [],
    })
    showMessage('Rule created from suggestion')
    refetchSuggestions()
  } catch {
    showMessage('Failed to create rule', 'error')
  }
}

// Format operator for display
const formatOperator = (op: string) => {
  const ops: Record<string, string> = {
    equals: '=',
    contains: 'contains',
    startsWith: 'starts with',
    endsWith: 'ends with',
    greaterThan: '>',
    lessThan: '<',
    between: 'between',
  }
  return ops[op] || op
}

// Get category type color
const getCategoryTypeColor = (type: string) => {
  switch (type) {
    case 'needs':
      return 'success'
    case 'wants':
      return 'warning'
    case 'savings':
      return 'info'
    default:
      return 'grey'
  }
}

// Sorted rules by priority
const sortedRules = computed(() => {
  if (!rules.value) return []
  return [...rules.value].sort((a, b) => b.priority - a.priority)
})
</script>

<template>
  <v-dialog v-model="isOpen" max-width="900" scrollable>
    <v-card>
      <v-card-title class="d-flex align-center justify-space-between">
        <span>
          <v-icon icon="mdi-cog" class="mr-2" />
          Categories & Rules
        </span>
        <v-btn icon="mdi-close" variant="text" @click="isOpen = false" />
      </v-card-title>

      <v-divider />

      <!-- Tab Switch -->
      <v-card-text class="pb-0">
        <v-btn-toggle v-model="activeTab" mandatory color="primary" density="compact">
          <v-btn value="rules" size="small">
            <v-icon icon="mdi-filter" class="mr-1" size="small" />
            Rules
          </v-btn>
          <v-btn value="categories" size="small">
            <v-icon icon="mdi-tag-multiple" class="mr-1" size="small" />
            Categories
          </v-btn>
        </v-btn-toggle>
      </v-card-text>

      <v-card-text style="max-height: 600px; overflow-y: auto">
        <!-- Rules Tab -->
        <div v-if="activeTab === 'rules'">
          <!-- Actions Bar -->
          <div class="d-flex align-center justify-space-between mb-4">
            <v-btn color="primary" size="small" @click="openCreateRule">
              <v-icon icon="mdi-plus" class="mr-1" size="small" />
              Create Rule
            </v-btn>
            <div class="text-body-2 text-medium-emphasis">
              {{ rules?.length || 0 }} rules
            </div>
          </div>

          <!-- AI Suggestions -->
          <v-alert v-if="suggestions?.length" type="info" variant="tonal" class="mb-4">
            <div class="d-flex align-center justify-space-between">
              <span>
                <v-icon icon="mdi-lightbulb" class="mr-1" />
                {{ suggestions.length }} suggested rules based on your expenses
              </span>
            </div>
            <div class="mt-2">
              <v-chip
                v-for="(suggestion, index) in suggestions.slice(0, 3)"
                :key="index"
                size="small"
                class="mr-1 mb-1"
                variant="outlined"
                @click="acceptSuggestion(suggestion)"
              >
                {{ suggestion.suggestion.substring(0, 40) }}...
                <v-icon icon="mdi-plus" size="x-small" class="ml-1" />
              </v-chip>
            </div>
          </v-alert>

          <!-- Rules List -->
          <div v-if="rulesLoading" class="text-center pa-8">
            <v-progress-circular indeterminate color="primary" size="32" />
          </div>

          <div v-else-if="!sortedRules.length" class="text-center pa-8">
            <v-icon icon="mdi-filter-off" size="48" color="grey" />
            <p class="text-medium-emphasis mt-2">No rules yet. Create one to auto-categorize expenses.</p>
          </div>

          <v-list v-else lines="two" density="compact">
            <v-list-item
              v-for="rule in sortedRules"
              :key="rule.id"
              :class="{ 'opacity-50': !rule.isActive }"
            >
              <template #prepend>
                <v-switch
                  :model-value="rule.isActive"
                  color="success"
                  hide-details
                  density="compact"
                  class="mr-2"
                  @update:model-value="handleToggleRule(rule.id)"
                />
              </template>

              <v-list-item-title class="font-weight-medium">
                {{ rule.name }}
                <v-chip v-if="rule.priority > 0" size="x-small" color="primary" variant="tonal" class="ml-1">
                  P{{ rule.priority }}
                </v-chip>
              </v-list-item-title>
              <v-list-item-subtitle>
                <span v-for="(cond, i) in rule.conditions" :key="i">
                  <span v-if="i > 0"> AND </span>
                  <code>{{ cond.field }}</code> {{ formatOperator(cond.operator) }}
                  <code>"{{ Array.isArray(cond.value) ? cond.value.join('-') : cond.value }}"</code>
                </span>
                →
                <v-chip size="x-small" color="primary" variant="tonal">{{ rule.targetCategory }}</v-chip>
              </v-list-item-subtitle>

              <template #append>
                <v-chip size="x-small" variant="tonal" class="mr-2">{{ rule.timesApplied }}x</v-chip>
                <v-btn icon="mdi-pencil" size="x-small" variant="text" @click="openEditRule(rule)" />
                <v-btn icon="mdi-delete" size="x-small" variant="text" color="error" @click="confirmDelete(rule.id)" />
              </template>
            </v-list-item>
          </v-list>
        </div>

        <!-- Categories Tab -->
        <div v-else>
          <div v-if="categoriesLoading" class="text-center pa-8">
            <v-progress-circular indeterminate color="primary" size="32" />
          </div>

          <v-row v-else>
            <v-col
              v-for="category in categories"
              :key="category.id"
              cols="12"
              sm="6"
            >
              <v-card variant="outlined" density="compact">
                <v-card-text class="pa-3">
                  <div class="d-flex align-center">
                    <v-avatar :color="category.color || 'primary'" variant="tonal" size="32">
                      <v-icon :icon="category.icon || 'mdi-tag'" size="16" />
                    </v-avatar>
                    <div class="ml-2">
                      <div class="text-body-2 font-weight-medium">{{ category.name }}</div>
                      <v-chip
                        size="x-small"
                        :color="getCategoryTypeColor(category.type)"
                        variant="tonal"
                      >
                        {{ category.type.toUpperCase() }}
                      </v-chip>
                    </div>
                  </div>
                  <div v-if="category.subcategories?.length" class="mt-2">
                    <v-chip
                      v-for="sub in category.subcategories?.slice(0, 3)"
                      :key="sub"
                      size="x-small"
                      class="mr-1"
                      variant="text"
                    >
                      {{ sub }}
                    </v-chip>
                    <span v-if="(category.subcategories?.length || 0) > 3" class="text-caption text-medium-emphasis">
                      +{{ (category.subcategories?.length || 0) - 3 }} more
                    </span>
                  </div>
                </v-card-text>
              </v-card>
            </v-col>
          </v-row>

          <v-alert type="info" variant="tonal" class="mt-4" density="compact">
            <v-icon icon="mdi-information" size="small" class="mr-1" />
            Categories follow 50/30/20: <strong>Needs</strong>, <strong>Wants</strong>, <strong>Savings</strong>
          </v-alert>
        </div>
      </v-card-text>

      <v-divider />

      <v-card-actions>
        <v-spacer />
        <v-btn variant="text" @click="isOpen = false">Close</v-btn>
      </v-card-actions>
    </v-card>

    <!-- Rule Editor Dialog -->
    <RuleEditor
      v-model="showRuleEditor"
      :rule="editingRule"
      @saved="showMessage(editingRule ? 'Rule updated successfully' : 'Rule created successfully')"
    />

    <!-- Delete Confirmation Dialog -->
    <v-dialog v-model="deleteConfirmDialog" max-width="400">
      <v-card>
        <v-card-title class="d-flex align-center">
          <v-icon icon="mdi-delete-alert" color="error" class="mr-2" />
          Delete Rule
        </v-card-title>
        <v-card-text>
          Are you sure you want to delete this rule?
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="deleteConfirmDialog = false">Cancel</v-btn>
          <v-btn
            color="error"
            variant="elevated"
            :loading="deleteRule.isPending.value"
            @click="handleDeleteRule"
          >
            Delete
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Snackbar -->
    <v-snackbar
      v-model="snackbar.show"
      :color="snackbar.color"
      :timeout="3000"
    >
      {{ snackbar.message }}
    </v-snackbar>
  </v-dialog>
</template>
