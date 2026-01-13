<script setup lang="ts">
import { ref, computed } from 'vue'
import SectionHeader from '@/components/shared/SectionHeader.vue'
import RuleEditor from '@/components/expenses/RuleEditor.vue'
import {
  useCategories,
  useExpenseRules,
  type ExpenseRule,
  type RuleSuggestion,
} from '@/composables/useExpenses'

// Section-level tabs for expenses navigation
const expensesTabs = [
  { title: 'Overview', route: '/expenses' },
  { title: 'Track', route: '/expenses/track' },
  { title: 'Budgets', route: '/expenses/budgets' },
  { title: 'Categories', route: '/expenses/categories' },
  { title: 'Reports', route: '/expenses/reports' },
]

// Tab state
const activeTab = ref('rules')

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
const getCategoryTypeColor = (type?: string) => {
  switch (type?.toLowerCase()) {
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
  <div>
    <SectionHeader
      title="Expenses"
      subtitle="Track and manage your spending"
      icon="mdi-cart-outline"
      :tabs="expensesTabs"
    />

    <!-- Tab Navigation -->
    <div class="d-flex justify-space-between align-center mb-4 flex-wrap ga-2">
      <v-tabs v-model="activeTab" color="primary" density="compact">
        <v-tab value="rules">
          <v-icon icon="mdi-filter" class="mr-1" size="small" />
          Rules
        </v-tab>
        <v-tab value="categories">
          <v-icon icon="mdi-tag-multiple" class="mr-1" size="small" />
          Categories
        </v-tab>
      </v-tabs>

      <v-btn v-if="activeTab === 'rules'" color="primary" @click="openCreateRule">
        <v-icon icon="mdi-plus" class="mr-1" />
        Create Rule
      </v-btn>
    </div>

    <!-- Tab Content -->
    <v-window v-model="activeTab">
      <!-- Rules Tab -->
      <v-window-item value="rules">
        <!-- AI Suggestions -->
        <v-card v-if="suggestions?.length" class="mb-6" variant="tonal" color="info">
          <v-card-text>
            <div class="d-flex align-center mb-2">
              <v-icon icon="mdi-lightbulb" class="mr-2" />
              <span class="font-weight-medium">
                {{ suggestions.length }} suggested rules based on your expenses
              </span>
            </div>
            <div class="d-flex flex-wrap ga-2">
              <v-chip
                v-for="(suggestion, index) in suggestions.slice(0, 5)"
                :key="index"
                variant="elevated"
                color="white"
                @click="acceptSuggestion(suggestion)"
              >
                {{ suggestion.suggestion.substring(0, 50) }}{{ suggestion.suggestion.length > 50 ? '...' : '' }}
                <v-icon icon="mdi-plus-circle" size="small" class="ml-1" />
              </v-chip>
            </div>
          </v-card-text>
        </v-card>

        <!-- Rules List -->
        <v-card>
          <v-card-title class="d-flex align-center justify-space-between">
            <span>
              <v-icon icon="mdi-filter" class="mr-2" />
              Auto-Categorization Rules
            </span>
            <v-chip size="small" variant="tonal">
              {{ rules?.length || 0 }} rules
            </v-chip>
          </v-card-title>

          <v-divider />

          <v-card-text v-if="rulesLoading" class="text-center pa-8">
            <v-progress-circular indeterminate color="primary" size="48" />
            <p class="mt-4 text-medium-emphasis">Loading rules...</p>
          </v-card-text>

          <v-card-text v-else-if="!sortedRules.length" class="text-center pa-8">
            <v-icon icon="mdi-filter-off" size="64" color="grey" />
            <h3 class="text-h6 mt-4">No Rules Yet</h3>
            <p class="text-medium-emphasis mt-2">
              Create rules to automatically categorize your expenses based on merchant, description, or amount.
            </p>
            <v-btn color="primary" class="mt-4" @click="openCreateRule">
              <v-icon icon="mdi-plus" class="mr-1" />
              Create Your First Rule
            </v-btn>
          </v-card-text>

          <v-list v-else lines="two">
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
                  Priority {{ rule.priority }}
                </v-chip>
              </v-list-item-title>
              <v-list-item-subtitle>
                <span v-for="(cond, i) in rule.conditions" :key="i">
                  <span v-if="i > 0" class="mx-1 text-primary">AND</span>
                  <code class="bg-grey-lighten-4 px-1 rounded">{{ cond.field }}</code>
                  {{ formatOperator(cond.operator) }}
                  <code class="bg-grey-lighten-4 px-1 rounded">"{{ Array.isArray(cond.value) ? cond.value.join('-') : cond.value }}"</code>
                </span>
                <v-icon icon="mdi-arrow-right" size="small" class="mx-1" />
                <v-chip size="x-small" color="primary" variant="tonal">{{ rule.targetCategory }}</v-chip>
              </v-list-item-subtitle>

              <template #append>
                <div class="d-flex align-center ga-1">
                  <v-chip size="x-small" variant="tonal" color="success">
                    {{ rule.timesApplied }}x applied
                  </v-chip>
                  <v-btn icon="mdi-pencil" size="small" variant="text" @click="openEditRule(rule)" />
                  <v-btn icon="mdi-delete" size="small" variant="text" color="error" @click="confirmDelete(rule.id)" />
                </div>
              </template>
            </v-list-item>
          </v-list>
        </v-card>
      </v-window-item>

      <!-- Categories Tab -->
      <v-window-item value="categories">
        <v-card v-if="categoriesLoading">
          <v-card-text class="text-center pa-8">
            <v-progress-circular indeterminate color="primary" size="48" />
            <p class="mt-4 text-medium-emphasis">Loading categories...</p>
          </v-card-text>
        </v-card>

        <template v-else>
          <!-- 50/30/20 Explanation -->
          <v-card class="mb-6" variant="tonal" color="primary">
            <v-card-text>
              <div class="d-flex align-center mb-2">
                <v-icon icon="mdi-information" class="mr-2" />
                <span class="font-weight-medium">Categories follow the 50/30/20 budgeting rule</span>
              </div>
              <v-row dense>
                <v-col cols="12" sm="4">
                  <div class="d-flex align-center">
                    <v-avatar color="success" size="24" class="mr-2">
                      <span class="text-caption font-weight-bold">50</span>
                    </v-avatar>
                    <span><strong>Needs</strong> - Essential expenses</span>
                  </div>
                </v-col>
                <v-col cols="12" sm="4">
                  <div class="d-flex align-center">
                    <v-avatar color="warning" size="24" class="mr-2">
                      <span class="text-caption font-weight-bold">30</span>
                    </v-avatar>
                    <span><strong>Wants</strong> - Discretionary spending</span>
                  </div>
                </v-col>
                <v-col cols="12" sm="4">
                  <div class="d-flex align-center">
                    <v-avatar color="info" size="24" class="mr-2">
                      <span class="text-caption font-weight-bold">20</span>
                    </v-avatar>
                    <span><strong>Savings</strong> - Investments & savings</span>
                  </div>
                </v-col>
              </v-row>
            </v-card-text>
          </v-card>

          <!-- Category Cards -->
          <v-row>
            <v-col
              v-for="category in categories"
              :key="category.id"
              cols="12"
              sm="6"
              md="4"
            >
              <v-card variant="outlined" class="h-100">
                <v-card-text>
                  <div class="d-flex align-center mb-3">
                    <v-avatar :color="category.color || 'primary'" variant="tonal" size="40">
                      <v-icon :icon="category.icon || 'mdi-tag'" />
                    </v-avatar>
                    <div class="ml-3">
                      <div class="text-subtitle-1 font-weight-medium">{{ category.name }}</div>
                      <v-chip
                        size="x-small"
                        :color="getCategoryTypeColor(category.type)"
                        variant="tonal"
                      >
                        {{ (category.type ?? 'needs').toUpperCase() }}
                      </v-chip>
                    </div>
                  </div>

                  <div v-if="category.subcategories?.length" class="mt-3">
                    <div class="text-caption text-medium-emphasis mb-1">Subcategories</div>
                    <div class="d-flex flex-wrap ga-1">
                      <v-chip
                        v-for="sub in category.subcategories"
                        :key="sub"
                        size="x-small"
                        variant="outlined"
                      >
                        {{ sub }}
                      </v-chip>
                    </div>
                  </div>
                </v-card-text>
              </v-card>
            </v-col>
          </v-row>
        </template>
      </v-window-item>
    </v-window>

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
          Are you sure you want to delete this rule? This action cannot be undone.
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
      location="bottom right"
    >
      {{ snackbar.message }}
      <template #actions>
        <v-btn variant="text" @click="snackbar.show = false">Close</v-btn>
      </template>
    </v-snackbar>
  </div>
</template>
