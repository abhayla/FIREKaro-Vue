<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import {
  useCategories,
  formatINR,
  type RecurringExpense,
  type CreateRecurringExpenseInput,
  type RecurringFrequency,
  type RecurringEndType,
} from '@/composables/useExpenses'

const props = defineProps<{
  modelValue: boolean
  expense?: RecurringExpense | null
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  save: [data: CreateRecurringExpenseInput]
}>()

const isOpen = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
})

const isEditing = computed(() => !!props.expense)

// Fetch categories
const { data: categories } = useCategories()
const categoryList = computed(() => categories.value?.map((c) => c.name) ?? [])

// Form state
const form = ref<{
  amount: number
  description: string
  category: string
  subcategory: string
  merchant: string
  paymentMethod: string
  tags: string[]
  notes: string
  frequency: RecurringFrequency
  startDate: string
  endType: RecurringEndType
  endAfterCount: number | null
  endDate: string
}>({
  amount: 0,
  description: '',
  category: '',
  subcategory: '',
  merchant: '',
  paymentMethod: '',
  tags: [],
  notes: '',
  frequency: 'MONTHLY',
  startDate: new Date().toISOString().split('T')[0],
  endType: 'NEVER',
  endAfterCount: null,
  endDate: '',
})

// Tag input
const newTag = ref('')

// Reset form when dialog opens
watch(
  () => props.modelValue,
  (open) => {
    if (open && props.expense) {
      form.value = {
        amount: props.expense.amount,
        description: props.expense.description,
        category: props.expense.category,
        subcategory: props.expense.subcategory || '',
        merchant: props.expense.merchant || '',
        paymentMethod: props.expense.paymentMethod || '',
        tags: props.expense.tags || [],
        notes: props.expense.notes || '',
        frequency: props.expense.frequency,
        startDate: props.expense.startDate.split('T')[0],
        endType: props.expense.endType,
        endAfterCount: props.expense.endAfterCount ?? null,
        endDate: props.expense.endDate?.split('T')[0] || '',
      }
    } else if (open) {
      form.value = {
        amount: 0,
        description: '',
        category: '',
        subcategory: '',
        merchant: '',
        paymentMethod: '',
        tags: [],
        notes: '',
        frequency: 'MONTHLY',
        startDate: new Date().toISOString().split('T')[0],
        endType: 'NEVER',
        endAfterCount: null,
        endDate: '',
      }
    }
    newTag.value = ''
  }
)

// Frequency options
const frequencyOptions = [
  { title: 'Weekly', value: 'WEEKLY', icon: 'mdi-calendar-week', description: 'Every week' },
  { title: 'Monthly', value: 'MONTHLY', icon: 'mdi-calendar-month', description: 'Every month' },
  { title: 'Quarterly', value: 'QUARTERLY', icon: 'mdi-calendar-range', description: 'Every 3 months' },
  { title: 'Yearly', value: 'YEARLY', icon: 'mdi-calendar', description: 'Once a year' },
]

// End type options
const endTypeOptions = [
  { title: 'Never', value: 'NEVER', description: 'Continues indefinitely' },
  { title: 'After X occurrences', value: 'AFTER_OCCURRENCES', description: 'Ends after set number' },
  { title: 'On specific date', value: 'ON_DATE', description: 'Ends on a date' },
]

// Payment method options
const paymentMethods = [
  'UPI',
  'Credit Card',
  'Debit Card',
  'Net Banking',
  'Cash',
  'Auto-Debit',
  'Other',
]

// Monthly equivalent
const monthlyEquivalent = computed(() => {
  const amount = form.value.amount
  switch (form.value.frequency) {
    case 'WEEKLY':
      return amount * 4.33
    case 'MONTHLY':
      return amount
    case 'QUARTERLY':
      return amount / 3
    case 'YEARLY':
      return amount / 12
    default:
      return amount
  }
})

// Form validation
const formValid = computed(() => {
  const baseValid =
    form.value.amount > 0 &&
    form.value.description.trim() !== '' &&
    form.value.category !== '' &&
    form.value.startDate !== ''

  if (form.value.endType === 'AFTER_OCCURRENCES') {
    return baseValid && form.value.endAfterCount && form.value.endAfterCount > 0
  }

  if (form.value.endType === 'ON_DATE') {
    return baseValid && form.value.endDate !== ''
  }

  return baseValid
})

// Add tag
const addTag = () => {
  const tag = newTag.value.trim()
  if (tag && !form.value.tags.includes(tag)) {
    form.value.tags.push(tag)
  }
  newTag.value = ''
}

// Remove tag
const removeTag = (tag: string) => {
  form.value.tags = form.value.tags.filter((t) => t !== tag)
}

// Submit form
const handleSubmit = () => {
  if (!formValid.value) return

  const data: CreateRecurringExpenseInput = {
    amount: form.value.amount,
    description: form.value.description,
    category: form.value.category,
    frequency: form.value.frequency,
    startDate: form.value.startDate,
    endType: form.value.endType,
  }

  // Optional fields
  if (form.value.subcategory) data.subcategory = form.value.subcategory
  if (form.value.merchant) data.merchant = form.value.merchant
  if (form.value.paymentMethod) data.paymentMethod = form.value.paymentMethod
  if (form.value.tags.length > 0) data.tags = form.value.tags
  if (form.value.notes) data.notes = form.value.notes

  // End type specific fields
  if (form.value.endType === 'AFTER_OCCURRENCES' && form.value.endAfterCount) {
    data.endAfterCount = form.value.endAfterCount
  }
  if (form.value.endType === 'ON_DATE' && form.value.endDate) {
    data.endDate = form.value.endDate
  }

  emit('save', data)
  isOpen.value = false
}
</script>

<template>
  <v-dialog v-model="isOpen" max-width="600" persistent scrollable>
    <v-card>
      <v-card-title class="d-flex align-center pa-4">
        <v-icon icon="mdi-repeat" class="mr-2" />
        {{ isEditing ? 'Edit Recurring Expense' : 'Add Recurring Expense' }}
        <v-spacer />
        <v-btn icon="mdi-close" variant="text" @click="isOpen = false" />
      </v-card-title>

      <v-divider />

      <v-card-text class="pa-4" style="max-height: 70vh; overflow-y: auto">
        <v-form @submit.prevent="handleSubmit">
          <!-- Basic Info -->
          <div class="text-subtitle-2 mb-3">Basic Information</div>

          <v-row>
            <!-- Description -->
            <v-col cols="12">
              <v-text-field
                v-model="form.description"
                label="Description *"
                placeholder="e.g., Netflix Subscription, Rent, Phone Bill"
                :rules="[(v) => !!v || 'Description is required']"
              />
            </v-col>

            <!-- Amount -->
            <v-col cols="12" sm="6">
              <v-text-field
                v-model.number="form.amount"
                label="Amount *"
                type="number"
                prefix="₹"
                :rules="[(v) => v > 0 || 'Amount must be positive']"
              />
            </v-col>

            <!-- Category -->
            <v-col cols="12" sm="6">
              <v-select
                v-model="form.category"
                :items="categoryList"
                label="Category *"
                :rules="[(v) => !!v || 'Category is required']"
              />
            </v-col>

            <!-- Subcategory -->
            <v-col cols="12" sm="6">
              <v-text-field
                v-model="form.subcategory"
                label="Subcategory"
                placeholder="Optional subcategory"
              />
            </v-col>

            <!-- Merchant -->
            <v-col cols="12" sm="6">
              <v-text-field
                v-model="form.merchant"
                label="Merchant / Provider"
                placeholder="e.g., Netflix, Airtel, Landlord"
              />
            </v-col>
          </v-row>

          <v-divider class="my-4" />

          <!-- Frequency Settings -->
          <div class="text-subtitle-2 mb-3">Recurrence Settings</div>

          <v-row>
            <!-- Frequency -->
            <v-col cols="12">
              <div class="text-body-2 mb-2">Frequency *</div>
              <v-btn-toggle
                v-model="form.frequency"
                mandatory
                color="primary"
                density="compact"
                class="flex-wrap"
              >
                <v-btn
                  v-for="opt in frequencyOptions"
                  :key="opt.value"
                  :value="opt.value"
                  size="small"
                >
                  <v-icon :icon="opt.icon" size="16" class="mr-1" />
                  {{ opt.title }}
                </v-btn>
              </v-btn-toggle>
              <div class="text-caption text-medium-emphasis mt-1">
                Monthly equivalent: {{ formatINR(monthlyEquivalent) }}
              </div>
            </v-col>

            <!-- Start Date -->
            <v-col cols="12" sm="6">
              <v-text-field
                v-model="form.startDate"
                label="Start Date *"
                type="date"
                :rules="[(v) => !!v || 'Start date is required']"
              />
            </v-col>

            <!-- End Type -->
            <v-col cols="12" sm="6">
              <v-select
                v-model="form.endType"
                :items="endTypeOptions"
                item-title="title"
                item-value="value"
                label="End Condition"
              />
            </v-col>

            <!-- End After Count -->
            <v-col v-if="form.endType === 'AFTER_OCCURRENCES'" cols="12" sm="6">
              <v-text-field
                v-model.number="form.endAfterCount"
                label="Number of Occurrences *"
                type="number"
                min="1"
                :rules="[(v) => v > 0 || 'Must be at least 1']"
              />
            </v-col>

            <!-- End Date -->
            <v-col v-if="form.endType === 'ON_DATE'" cols="12" sm="6">
              <v-text-field
                v-model="form.endDate"
                label="End Date *"
                type="date"
                :rules="[(v) => !!v || 'End date is required']"
              />
            </v-col>
          </v-row>

          <v-divider class="my-4" />

          <!-- Additional Details -->
          <div class="text-subtitle-2 mb-3">Additional Details</div>

          <v-row>
            <!-- Payment Method -->
            <v-col cols="12" sm="6">
              <v-select
                v-model="form.paymentMethod"
                :items="paymentMethods"
                label="Payment Method"
                clearable
              />
            </v-col>

            <!-- Tags -->
            <v-col cols="12" sm="6">
              <v-text-field
                v-model="newTag"
                label="Add Tags"
                placeholder="Press Enter to add"
                @keydown.enter.prevent="addTag"
              >
                <template #append>
                  <v-btn icon="mdi-plus" variant="text" size="small" @click="addTag" />
                </template>
              </v-text-field>
              <div v-if="form.tags.length" class="mt-1">
                <v-chip
                  v-for="tag in form.tags"
                  :key="tag"
                  size="small"
                  closable
                  class="mr-1 mb-1"
                  @click:close="removeTag(tag)"
                >
                  {{ tag }}
                </v-chip>
              </div>
            </v-col>

            <!-- Notes -->
            <v-col cols="12">
              <v-textarea
                v-model="form.notes"
                label="Notes"
                placeholder="Any additional notes..."
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
          {{ isEditing ? 'Update' : 'Create' }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
