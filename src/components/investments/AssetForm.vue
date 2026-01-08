<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useForm } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import { z } from 'zod'
import type { Investment } from '@/composables/useInvestments'

const props = defineProps<{
  modelValue: boolean
  asset?: Investment | null
  isEditing?: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  save: [data: Partial<Investment>]
}>()

const dialog = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const assetTypes = [
  { title: 'Stock', value: 'stock' },
  { title: 'Mutual Fund', value: 'mutual_fund' },
  { title: 'Fixed Deposit', value: 'fd' },
  { title: 'Bond', value: 'bond' },
  { title: 'Gold', value: 'gold' },
  { title: 'Real Estate', value: 'real_estate' },
  { title: 'Other', value: 'other' }
]

const categories = [
  { title: 'Equity', value: 'equity' },
  { title: 'Debt', value: 'debt' },
  { title: 'Hybrid', value: 'hybrid' },
  { title: 'Gold', value: 'gold' },
  { title: 'Real Estate', value: 'real_estate' },
  { title: 'Cash', value: 'cash' }
]

const schema = toTypedSchema(
  z.object({
    name: z.string().min(1, 'Name is required'),
    type: z.enum(['stock', 'mutual_fund', 'fd', 'bond', 'gold', 'real_estate', 'other']),
    category: z.enum(['equity', 'debt', 'hybrid', 'gold', 'real_estate', 'cash']),
    investedAmount: z.number().min(0, 'Amount must be positive'),
    currentValue: z.number().min(0, 'Value must be positive'),
    units: z.number().optional(),
    purchasePrice: z.number().optional(),
    currentPrice: z.number().optional(),
    purchaseDate: z.string().min(1, 'Purchase date is required'),
    notes: z.string().optional()
  })
)

const { handleSubmit, resetForm, defineField, errors } = useForm({
  validationSchema: schema,
  initialValues: {
    name: '',
    type: 'stock' as const,
    category: 'equity' as const,
    investedAmount: 0,
    currentValue: 0,
    units: undefined,
    purchasePrice: undefined,
    currentPrice: undefined,
    purchaseDate: new Date().toISOString().split('T')[0],
    notes: ''
  }
})

const [name] = defineField('name')
const [type] = defineField('type')
const [category] = defineField('category')
const [investedAmount] = defineField('investedAmount')
const [currentValue] = defineField('currentValue')
const [units] = defineField('units')
const [purchasePrice] = defineField('purchasePrice')
const [currentPrice] = defineField('currentPrice')
const [purchaseDate] = defineField('purchaseDate')
const [notes] = defineField('notes')

watch(
  () => props.asset,
  (newAsset) => {
    if (newAsset) {
      resetForm({
        values: {
          name: newAsset.name,
          type: newAsset.type,
          category: newAsset.category,
          investedAmount: newAsset.investedAmount,
          currentValue: newAsset.currentValue,
          units: newAsset.units,
          purchasePrice: newAsset.purchasePrice,
          currentPrice: newAsset.currentPrice,
          purchaseDate: newAsset.purchaseDate,
          notes: newAsset.notes || ''
        }
      })
    } else {
      resetForm()
    }
  },
  { immediate: true }
)

const loading = ref(false)

const onSubmit = handleSubmit(async (values) => {
  loading.value = true
  try {
    emit('save', values)
    dialog.value = false
  } finally {
    loading.value = false
  }
})

const closeDialog = () => {
  dialog.value = false
  resetForm()
}
</script>

<template>
  <v-dialog v-model="dialog" max-width="600" persistent>
    <v-card>
      <v-card-title class="d-flex align-center">
        <v-icon icon="mdi-cash-plus" class="mr-2" />
        {{ isEditing ? 'Edit Investment' : 'Add Investment' }}
      </v-card-title>

      <v-card-text>
        <v-form @submit.prevent="onSubmit">
          <v-row>
            <v-col cols="12">
              <v-text-field
                v-model="name"
                label="Name"
                placeholder="e.g., HDFC Bank, Axis Bluechip Fund"
                :error-messages="errors.name"
                variant="outlined"
                density="comfortable"
              />
            </v-col>

            <v-col cols="12" md="6">
              <v-select
                v-model="type"
                :items="assetTypes"
                label="Type"
                :error-messages="errors.type"
                variant="outlined"
                density="comfortable"
              />
            </v-col>

            <v-col cols="12" md="6">
              <v-select
                v-model="category"
                :items="categories"
                label="Category"
                :error-messages="errors.category"
                variant="outlined"
                density="comfortable"
              />
            </v-col>

            <v-col cols="12" md="6">
              <v-text-field
                v-model.number="investedAmount"
                label="Invested Amount"
                type="number"
                prefix="₹"
                :error-messages="errors.investedAmount"
                variant="outlined"
                density="comfortable"
              />
            </v-col>

            <v-col cols="12" md="6">
              <v-text-field
                v-model.number="currentValue"
                label="Current Value"
                type="number"
                prefix="₹"
                :error-messages="errors.currentValue"
                variant="outlined"
                density="comfortable"
              />
            </v-col>

            <v-col cols="12" md="4">
              <v-text-field
                v-model.number="units"
                label="Units (optional)"
                type="number"
                variant="outlined"
                density="comfortable"
              />
            </v-col>

            <v-col cols="12" md="4">
              <v-text-field
                v-model.number="purchasePrice"
                label="Purchase Price (optional)"
                type="number"
                prefix="₹"
                variant="outlined"
                density="comfortable"
              />
            </v-col>

            <v-col cols="12" md="4">
              <v-text-field
                v-model.number="currentPrice"
                label="Current Price (optional)"
                type="number"
                prefix="₹"
                variant="outlined"
                density="comfortable"
              />
            </v-col>

            <v-col cols="12" md="6">
              <v-text-field
                v-model="purchaseDate"
                label="Purchase Date"
                type="date"
                :error-messages="errors.purchaseDate"
                variant="outlined"
                density="comfortable"
              />
            </v-col>

            <v-col cols="12">
              <v-textarea
                v-model="notes"
                label="Notes (optional)"
                rows="2"
                variant="outlined"
                density="comfortable"
              />
            </v-col>
          </v-row>
        </v-form>
      </v-card-text>

      <v-card-actions class="pa-4">
        <v-spacer />
        <v-btn variant="text" @click="closeDialog">Cancel</v-btn>
        <v-btn color="primary" variant="flat" :loading="loading" @click="onSubmit">
          {{ isEditing ? 'Update' : 'Add' }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
