<script setup lang="ts">
import { ref, computed } from 'vue'
import { formatINR, formatDate, type Expense } from '@/composables/useExpenses'
import ExpenseCard from './ExpenseCard.vue'

const props = defineProps<{
  expenses: Expense[]
  loading?: boolean
}>()

const emit = defineEmits<{
  edit: [expense: Expense]
  delete: [id: string]
}>()

// View mode: list or table
const viewMode = ref<'list' | 'table'>('list')

// Search/filter
const search = ref('')
const selectedCategory = ref<string | null>(null)

// Get unique categories
const categories = computed(() => {
  const cats = new Set(props.expenses.map((e) => e.category))
  return Array.from(cats).sort()
})

// Filtered expenses
const filteredExpenses = computed(() => {
  let result = [...props.expenses]

  // Filter by search
  if (search.value) {
    const searchLower = search.value.toLowerCase()
    result = result.filter(
      (e) =>
        e.description.toLowerCase().includes(searchLower) ||
        e.merchant?.toLowerCase().includes(searchLower) ||
        e.category.toLowerCase().includes(searchLower)
    )
  }

  // Filter by category
  if (selectedCategory.value) {
    result = result.filter((e) => e.category === selectedCategory.value)
  }

  // Sort by date (newest first)
  result.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  return result
})

// Table headers
const headers = [
  { title: 'Date', key: 'date', width: '120px' },
  { title: 'Description', key: 'description' },
  { title: 'Category', key: 'category', width: '150px' },
  { title: 'Amount', key: 'amount', align: 'end' as const, width: '130px' },
  { title: '', key: 'actions', width: '80px', sortable: false },
]

// Total
const totalAmount = computed(() =>
  filteredExpenses.value.reduce((sum, e) => sum + e.amount, 0)
)
</script>

<template>
  <div class="expense-list">
    <!-- Toolbar -->
    <div class="d-flex align-center gap-3 mb-4 flex-wrap">
      <!-- Search -->
      <v-text-field
        v-model="search"
        prepend-inner-icon="mdi-magnify"
        placeholder="Search expenses..."
        density="compact"
        hide-details
        clearable
        style="max-width: 300px"
      />

      <!-- Category Filter -->
      <v-select
        v-model="selectedCategory"
        :items="categories"
        label="Category"
        density="compact"
        hide-details
        clearable
        style="max-width: 200px"
      />

      <v-spacer />

      <!-- View Toggle -->
      <v-btn-toggle v-model="viewMode" mandatory density="compact" color="primary">
        <v-btn value="list" size="small">
          <v-icon icon="mdi-view-list" />
        </v-btn>
        <v-btn value="table" size="small">
          <v-icon icon="mdi-table" />
        </v-btn>
      </v-btn-toggle>

      <!-- Summary -->
      <div class="text-body-2">
        <span class="text-medium-emphasis">{{ filteredExpenses.length }} expenses</span>
        <span class="font-weight-bold ml-2 text-currency">{{ formatINR(totalAmount) }}</span>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="text-center py-8">
      <v-progress-circular indeterminate color="primary" />
      <p class="mt-2 text-medium-emphasis">Loading expenses...</p>
    </div>

    <!-- Empty State -->
    <v-card v-else-if="filteredExpenses.length === 0" variant="outlined" class="pa-8 text-center">
      <v-icon icon="mdi-receipt-text-outline" size="64" color="grey" />
      <h3 class="text-h6 mt-4">No expenses found</h3>
      <p class="text-medium-emphasis">
        {{ search || selectedCategory ? 'Try adjusting your filters' : 'Add your first expense to get started' }}
      </p>
    </v-card>

    <!-- List View -->
    <template v-else-if="viewMode === 'list'">
      <ExpenseCard
        v-for="expense in filteredExpenses"
        :key="expense.id"
        :expense="expense"
        @edit="emit('edit', $event)"
        @delete="emit('delete', $event)"
      />
    </template>

    <!-- Table View -->
    <v-data-table
      v-else
      :headers="headers"
      :items="filteredExpenses"
      :items-per-page="25"
      class="elevation-1"
    >
      <!-- eslint-disable vue/valid-v-slot -->
      <template #item.date="{ item }">
        {{ formatDate(item.date) }}
      </template>

      <template #item.description="{ item }">
        <div>
          <span class="font-weight-medium">{{ item.description }}</span>
          <v-chip
            v-if="item.isRecurring"
            size="x-small"
            color="info"
            variant="tonal"
            class="ml-2"
          >
            Recurring
          </v-chip>
        </div>
        <div v-if="item.merchant" class="text-caption text-medium-emphasis">
          {{ item.merchant }}
        </div>
      </template>

      <template #item.category="{ item }">
        <div>{{ item.category }}</div>
        <div v-if="item.subcategory" class="text-caption text-medium-emphasis">
          {{ item.subcategory }}
        </div>
      </template>

      <template #item.amount="{ item }">
        <span class="font-weight-bold text-negative text-currency">-{{ formatINR(item.amount) }}</span>
      </template>

      <template #item.actions="{ item }">
      <!-- eslint-enable vue/valid-v-slot -->
        <v-menu>
          <template #activator="{ props: menuProps }">
            <v-btn icon="mdi-dots-vertical" variant="text" size="small" v-bind="menuProps" />
          </template>
          <v-list density="compact">
            <v-list-item @click="emit('edit', item)">
              <template #prepend>
                <v-icon icon="mdi-pencil" size="small" />
              </template>
              <v-list-item-title>Edit</v-list-item-title>
            </v-list-item>
            <v-list-item @click="emit('delete', item.id)" class="text-error">
              <template #prepend>
                <v-icon icon="mdi-delete" size="small" />
              </template>
              <v-list-item-title>Delete</v-list-item-title>
            </v-list-item>
          </v-list>
        </v-menu>
      </template>

      <template #bottom>
        <div class="d-flex justify-space-between align-center pa-4 bg-surface-variant">
          <span class="text-body-2">{{ filteredExpenses.length }} expenses</span>
          <span class="text-h6 font-weight-bold text-currency">Total: {{ formatINR(totalAmount) }}</span>
        </div>
      </template>
    </v-data-table>
  </div>
</template>
