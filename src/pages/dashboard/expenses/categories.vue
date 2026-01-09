<script setup lang="ts">
import { ref, computed } from 'vue'
import SectionHeader from '@/components/shared/SectionHeader.vue'
import RuleEditor from '@/components/expenses/RuleEditor.vue'
import {
  useCategories,
  useExpenseRules,
  formatINR,
  type ExpenseRule,
  type RuleSuggestion,
} from '@/composables/useExpenses'

const tabs = [
  { title: 'Overview', route: '/dashboard/expenses' },
  { title: 'Track', route: '/dashboard/expenses/track' },
  { title: 'Budgets', route: '/dashboard/expenses/budgets' },
  { title: 'Reports', route: '/dashboard/expenses/reports' },
  { title: 'Categories', route: '/dashboard/expenses/categories' },
]

// Data fetching
const { data: categories, isLoading: categoriesLoading } = useCategories()
const {
  rules,
  suggestions,
  isLoading: rulesLoading,
  isSuggestionsLoading,
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
const activeTab = ref<'categories' | 'rules'>('rules')

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
  <div>
    <SectionHeader
      title="Expenses"
      subtitle="Manage categories and auto-categorization rules"
      icon="mdi-cart-outline"
      :tabs="tabs"
    />

    <!-- Tab Switch -->
    <v-btn-toggle v-model="activeTab" mandatory color="primary" class="mb-6">
      <v-btn value="rules">
        <v-icon icon="mdi-cog" class="mr-1" />
        Rules
      </v-btn>
      <v-btn value="categories">
        <v-icon icon="mdi-tag-multiple" class="mr-1" />
        Categories
      </v-btn>
    </v-btn-toggle>

    <!-- Rules Tab -->
    <div v-if="activeTab === 'rules'">
      <!-- Actions Bar -->
      <v-card class="mb-6" variant="outlined">
        <v-card-text class="d-flex align-center gap-3 flex-wrap">
          <v-btn color="primary" @click="openCreateRule">
            <v-icon icon="mdi-plus" class="mr-1" />
            Create Rule
          </v-btn>

          <v-spacer />

          <div class="text-right">
            <div class="text-caption text-medium-emphasis">Total Rules</div>
            <div class="text-h6 font-weight-bold">{{ rules?.length || 0 }}</div>
          </div>
        </v-card-text>
      </v-card>

      <!-- AI Suggestions -->
      <v-card v-if="suggestions?.length" class="mb-6">
        <v-card-title class="d-flex align-center">
          <v-icon icon="mdi-lightbulb" color="warning" class="mr-2" />
          Suggested Rules
          <v-chip size="x-small" class="ml-2" color="warning" variant="tonal">AI</v-chip>
        </v-card-title>
        <v-card-text>
          <v-alert type="info" variant="tonal" class="mb-4">
            Based on your recent expenses, here are some rules you might want to create.
          </v-alert>

          <v-list lines="two" density="compact">
            <v-list-item
              v-for="(suggestion, index) in suggestions"
              :key="index"
            >
              <template #prepend>
                <v-avatar color="warning" variant="tonal" size="36">
                  <v-icon icon="mdi-auto-fix" size="20" />
                </v-avatar>
              </template>

              <v-list-item-title>{{ suggestion.suggestion }}</v-list-item-title>
              <v-list-item-subtitle>
                {{ suggestion.matchCount }} matching expenses
              </v-list-item-subtitle>

              <template #append>
                <v-btn
                  size="small"
                  color="primary"
                  variant="tonal"
                  :loading="createRule.isPending.value"
                  @click="acceptSuggestion(suggestion)"
                >
                  Accept
                </v-btn>
              </template>
            </v-list-item>
          </v-list>
        </v-card-text>
      </v-card>

      <!-- Rules List -->
      <v-card>
        <v-card-title class="d-flex align-center">
          <v-icon icon="mdi-filter" class="mr-2" />
          Auto-Categorization Rules
        </v-card-title>

        <!-- Loading State -->
        <v-card-text v-if="rulesLoading" class="text-center pa-8">
          <v-progress-circular indeterminate color="primary" size="48" />
          <p class="mt-4 text-medium-emphasis">Loading rules...</p>
        </v-card-text>

        <!-- Empty State -->
        <v-card-text
          v-else-if="!sortedRules.length"
          class="text-center pa-8"
        >
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

        <!-- Rules Table -->
        <v-data-table
          v-else
          :items="sortedRules"
          :headers="[
            { title: 'Rule', key: 'name', sortable: false },
            { title: 'Conditions', key: 'conditions', sortable: false },
            { title: 'Target', key: 'targetCategory', sortable: false },
            { title: 'Applied', key: 'timesApplied', align: 'center', width: '100px' },
            { title: 'Active', key: 'isActive', align: 'center', width: '80px' },
            { title: 'Actions', key: 'actions', align: 'center', width: '120px', sortable: false },
          ]"
          class="elevation-0"
          item-value="id"
        >
          <template #item.name="{ item }">
            <div class="d-flex align-center">
              <v-chip
                v-if="item.priority > 0"
                size="x-small"
                color="primary"
                variant="tonal"
                class="mr-2"
              >
                P{{ item.priority }}
              </v-chip>
              <strong>{{ item.name }}</strong>
            </div>
          </template>

          <template #item.conditions="{ item }">
            <div class="text-body-2">
              <span v-for="(cond, i) in item.conditions" :key="i">
                <span v-if="i > 0" class="text-medium-emphasis"> AND </span>
                <code class="text-primary">{{ cond.field }}</code>
                {{ formatOperator(cond.operator) }}
                <code>"{{ Array.isArray(cond.value) ? cond.value.join(' - ') : cond.value }}"</code>
              </span>
            </div>
          </template>

          <template #item.targetCategory="{ item }">
            <v-chip size="small" color="primary" variant="tonal">
              {{ item.targetCategory }}
            </v-chip>
            <span v-if="item.targetSubcategory" class="text-caption text-medium-emphasis ml-1">
              / {{ item.targetSubcategory }}
            </span>
          </template>

          <template #item.timesApplied="{ item }">
            <v-chip size="small" variant="tonal">
              {{ item.timesApplied }}
            </v-chip>
          </template>

          <template #item.isActive="{ item }">
            <v-switch
              :model-value="item.isActive"
              color="success"
              hide-details
              density="compact"
              @update:model-value="handleToggleRule(item.id)"
            />
          </template>

          <template #item.actions="{ item }">
            <v-btn
              icon="mdi-pencil"
              size="small"
              variant="text"
              @click="openEditRule(item)"
            />
            <v-btn
              icon="mdi-delete"
              size="small"
              variant="text"
              color="error"
              @click="confirmDelete(item.id)"
            />
          </template>
        </v-data-table>
      </v-card>
    </div>

    <!-- Categories Tab -->
    <div v-else>
      <v-card>
        <v-card-title class="d-flex align-center">
          <v-icon icon="mdi-tag-multiple" class="mr-2" />
          Expense Categories
          <v-chip size="small" class="ml-2" color="info" variant="tonal">
            50/30/20 Budget
          </v-chip>
        </v-card-title>

        <!-- Loading State -->
        <v-card-text v-if="categoriesLoading" class="text-center pa-8">
          <v-progress-circular indeterminate color="primary" size="48" />
          <p class="mt-4 text-medium-emphasis">Loading categories...</p>
        </v-card-text>

        <!-- Categories Grid -->
        <v-card-text v-else>
          <v-row>
            <v-col
              v-for="category in categories"
              :key="category.id"
              cols="12"
              sm="6"
              md="4"
            >
              <v-card variant="outlined">
                <v-card-text>
                  <div class="d-flex align-center mb-3">
                    <v-avatar :color="category.color || 'primary'" variant="tonal" size="40">
                      <v-icon :icon="category.icon || 'mdi-tag'" size="20" />
                    </v-avatar>
                    <div class="ml-3">
                      <div class="font-weight-bold">{{ category.name }}</div>
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
                    <div class="text-caption text-medium-emphasis mb-1">Subcategories:</div>
                    <v-chip
                      v-for="sub in category.subcategories"
                      :key="sub"
                      size="x-small"
                      class="mr-1 mb-1"
                      variant="tonal"
                    >
                      {{ sub }}
                    </v-chip>
                  </div>
                </v-card-text>
              </v-card>
            </v-col>
          </v-row>

          <v-alert type="info" variant="tonal" class="mt-4">
            <v-icon icon="mdi-information" class="mr-2" />
            Categories are based on the 50/30/20 budget framework:
            <strong>Needs</strong> (50%), <strong>Wants</strong> (30%), <strong>Savings</strong> (20%).
          </v-alert>
        </v-card-text>
      </v-card>
    </div>

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
