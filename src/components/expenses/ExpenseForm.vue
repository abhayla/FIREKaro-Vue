<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import {
  useCategories,
  useAICategorization,
  type CreateExpenseInput,
  type Expense,
} from '@/composables/useExpenses'

const props = defineProps<{
  modelValue: boolean
  expense?: Expense | null
  prefillData?: Partial<CreateExpenseInput> | null
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  save: [data: CreateExpenseInput]
}>()

const isOpen = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
})

const isEditing = computed(() => !!props.expense)

// Form state
const form = ref<CreateExpenseInput>({
  amount: 0,
  description: '',
  category: '',
  subcategory: '',
  date: new Date().toISOString().split('T')[0],
  merchant: '',
  paymentMethod: 'UPI',
  tags: [],
  isRecurring: false,
  notes: '',
})

// Reset form when dialog opens
watch(
  () => props.modelValue,
  (open) => {
    if (open && props.expense) {
      // Editing existing expense
      form.value = {
        amount: props.expense.amount,
        description: props.expense.description,
        category: props.expense.category,
        subcategory: props.expense.subcategory || '',
        date: props.expense.date.split('T')[0],
        merchant: props.expense.merchant || '',
        paymentMethod: props.expense.paymentMethod || 'UPI',
        tags: props.expense.tags || [],
        isRecurring: props.expense.isRecurring || false,
        notes: props.expense.notes || '',
      }
    } else if (open && props.prefillData) {
      // Creating new expense with prefilled data (e.g., from receipt scan)
      form.value = {
        amount: props.prefillData.amount ?? 0,
        description: props.prefillData.description ?? '',
        category: props.prefillData.category ?? '',
        subcategory: props.prefillData.subcategory ?? '',
        date: props.prefillData.date ?? new Date().toISOString().split('T')[0],
        merchant: props.prefillData.merchant ?? '',
        paymentMethod: props.prefillData.paymentMethod ?? 'UPI',
        tags: props.prefillData.tags ?? [],
        isRecurring: props.prefillData.isRecurring ?? false,
        notes: props.prefillData.notes ?? '',
      }
    } else if (open) {
      // Creating new expense with blank form
      form.value = {
        amount: 0,
        description: '',
        category: '',
        subcategory: '',
        date: new Date().toISOString().split('T')[0],
        merchant: '',
        paymentMethod: 'UPI',
        tags: [],
        isRecurring: false,
        notes: '',
      }
    }
  }
)

// Categories
const { data: categories, isLoading: categoriesLoading } = useCategories()

const categoryItems = computed(() =>
  categories.value?.map((c) => ({
    title: c.name,
    value: c.name,
    icon: c.icon,
  })) ?? []
)

const subcategoryItems = computed(() => {
  if (!form.value.category || !categories.value) return []
  const cat = categories.value.find((c) => c.name === form.value.category)
  return cat?.subcategories?.map((s) => ({ title: s, value: s })) ?? []
})

// AI Categorization
const aiCategorizeMutation = useAICategorization()
const aiSuggestion = ref<string | null>(null)

const categorizeWithAI = async () => {
  if (!form.value.description.trim()) return
  try {
    const result = await aiCategorizeMutation.mutateAsync(form.value.description)
    if (result.category) {
      form.value.category = result.category
      if (result.subcategory) {
        form.value.subcategory = result.subcategory
      }
      aiSuggestion.value = `AI suggested: ${result.category}${result.subcategory ? ` > ${result.subcategory}` : ''} (${Math.round(result.confidence * 100)}% confidence)`
    }
  } catch {
    aiSuggestion.value = 'AI categorization failed. Please select manually.'
  }
}

// Payment methods
const paymentMethods = [
  { title: 'UPI', value: 'UPI' },
  { title: 'Credit Card', value: 'Credit Card' },
  { title: 'Debit Card', value: 'Debit Card' },
  { title: 'Cash', value: 'Cash' },
  { title: 'Net Banking', value: 'Net Banking' },
  { title: 'Wallet', value: 'Wallet' },
]

// Form validation
const formValid = computed(() => {
  return (
    form.value.amount > 0 &&
    form.value.description.trim() !== '' &&
    form.value.category !== '' &&
    form.value.date !== ''
  )
})

// Submit
const handleSubmit = () => {
  if (!formValid.value) return
  emit('save', { ...form.value })
  isOpen.value = false
}

// Tag input
const tagInput = ref('')
const addTag = () => {
  const tag = tagInput.value.trim()
  if (tag && !form.value.tags?.includes(tag)) {
    form.value.tags = [...(form.value.tags || []), tag]
  }
  tagInput.value = ''
}
const removeTag = (tag: string) => {
  form.value.tags = form.value.tags?.filter((t) => t !== tag)
}
</script>

<template>
  <v-dialog v-model="isOpen" max-width="600" persistent>
    <v-card>
      <v-card-title class="d-flex align-center pa-4">
        <v-icon icon="mdi-cart-plus" class="mr-2" />
        {{ isEditing ? 'Edit Expense' : 'Add Expense' }}
        <v-spacer />
        <v-btn icon="mdi-close" variant="text" @click="isOpen = false" />
      </v-card-title>

      <v-divider />

      <v-card-text class="pa-4">
        <v-form @submit.prevent="handleSubmit">
          <v-row>
            <!-- Amount -->
            <v-col cols="12" sm="6">
              <v-text-field
                v-model.number="form.amount"
                label="Amount"
                type="number"
                prefix="₹"
                :rules="[(v) => v > 0 || 'Amount must be greater than 0']"
                required
              />
            </v-col>

            <!-- Date -->
            <v-col cols="12" sm="6">
              <v-text-field v-model="form.date" label="Date" type="date" required />
            </v-col>

            <!-- Description with AI -->
            <v-col cols="12">
              <v-text-field
                v-model="form.description"
                label="Description"
                placeholder="e.g., Swiggy order, Uber ride, Groceries"
                :rules="[(v) => !!v.trim() || 'Description is required']"
                required
              >
                <template #append-inner>
                  <v-btn
                    icon="mdi-robot"
                    variant="text"
                    size="small"
                    :loading="aiCategorizeMutation.isPending.value"
                    :disabled="!form.description.trim()"
                    @click="categorizeWithAI"
                    title="AI Categorize"
                  />
                </template>
              </v-text-field>
              <v-alert
                v-if="aiSuggestion"
                type="info"
                variant="tonal"
                density="compact"
                class="mt-n2 mb-2"
                closable
                @click:close="aiSuggestion = null"
              >
                {{ aiSuggestion }}
              </v-alert>
            </v-col>

            <!-- Category -->
            <v-col cols="12" sm="6">
              <v-select
                v-model="form.category"
                :items="categoryItems"
                :loading="categoriesLoading"
                label="Category"
                :rules="[(v) => !!v || 'Category is required']"
                required
              />
            </v-col>

            <!-- Subcategory -->
            <v-col cols="12" sm="6">
              <v-select
                v-model="form.subcategory"
                :items="subcategoryItems"
                :disabled="!form.category || subcategoryItems.length === 0"
                label="Subcategory"
                clearable
              />
            </v-col>

            <!-- Merchant -->
            <v-col cols="12" sm="6">
              <v-text-field
                v-model="form.merchant"
                label="Merchant"
                placeholder="e.g., Swiggy, Amazon"
              />
            </v-col>

            <!-- Payment Method -->
            <v-col cols="12" sm="6">
              <v-select
                v-model="form.paymentMethod"
                :items="paymentMethods"
                label="Payment Method"
              />
            </v-col>

            <!-- Tags -->
            <v-col cols="12">
              <v-text-field
                v-model="tagInput"
                label="Tags"
                placeholder="Type and press Enter to add"
                @keydown.enter.prevent="addTag"
              >
                <template #append-inner>
                  <v-btn
                    icon="mdi-plus"
                    variant="text"
                    size="small"
                    :disabled="!tagInput.trim()"
                    @click="addTag"
                  />
                </template>
              </v-text-field>
              <div v-if="form.tags?.length" class="d-flex flex-wrap gap-1 mt-n2">
                <v-chip
                  v-for="tag in form.tags"
                  :key="tag"
                  size="small"
                  closable
                  @click:close="removeTag(tag)"
                >
                  {{ tag }}
                </v-chip>
              </div>
            </v-col>

            <!-- Recurring -->
            <v-col cols="12">
              <v-checkbox
                v-model="form.isRecurring"
                label="This is a recurring expense"
                hide-details
              />
            </v-col>

            <!-- Notes -->
            <v-col cols="12">
              <v-textarea
                v-model="form.notes"
                label="Notes (optional)"
                rows="2"
                auto-grow
              />
            </v-col>
          </v-row>
        </v-form>
      </v-card-text>

      <v-divider />

      <v-card-actions class="pa-4">
        <v-spacer />
        <v-btn variant="text" @click="isOpen = false">Cancel</v-btn>
        <v-btn
          color="primary"
          variant="elevated"
          :disabled="!formValid"
          @click="handleSubmit"
        >
          {{ isEditing ? 'Update' : 'Add Expense' }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
