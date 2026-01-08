<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { formatINR, type Budget, type CreateBudgetInput } from '@/composables/useExpenses'

const props = defineProps<{
  modelValue: boolean
  budget?: Budget | null
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  save: [data: CreateBudgetInput]
}>()

const isOpen = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
})

const isEditing = computed(() => !!props.budget)

// Get current month/year
const now = new Date()
const currentMonth = now.getMonth() + 1
const currentYear = now.getFullYear()

// Form state
const form = ref<{
  month: number
  year: number
  income: number
  needsPercentage: number
  wantsPercentage: number
  savingsPercentage: number
}>({
  month: currentMonth,
  year: currentYear,
  income: 0,
  needsPercentage: 50,
  wantsPercentage: 30,
  savingsPercentage: 20,
})

// Reset form when dialog opens
watch(
  () => props.modelValue,
  (open) => {
    if (open && props.budget) {
      const totalLimit =
        props.budget.needsLimit + props.budget.wantsLimit + props.budget.savingsLimit
      form.value = {
        month: props.budget.month,
        year: props.budget.year,
        income: props.budget.income,
        needsPercentage:
          totalLimit > 0 ? Math.round((props.budget.needsLimit / totalLimit) * 100) : 50,
        wantsPercentage:
          totalLimit > 0 ? Math.round((props.budget.wantsLimit / totalLimit) * 100) : 30,
        savingsPercentage:
          totalLimit > 0 ? Math.round((props.budget.savingsLimit / totalLimit) * 100) : 20,
      }
    } else if (open) {
      form.value = {
        month: currentMonth,
        year: currentYear,
        income: 0,
        needsPercentage: 50,
        wantsPercentage: 30,
        savingsPercentage: 20,
      }
    }
  }
)

// Month options
const monthOptions = [
  { title: 'January', value: 1 },
  { title: 'February', value: 2 },
  { title: 'March', value: 3 },
  { title: 'April', value: 4 },
  { title: 'May', value: 5 },
  { title: 'June', value: 6 },
  { title: 'July', value: 7 },
  { title: 'August', value: 8 },
  { title: 'September', value: 9 },
  { title: 'October', value: 10 },
  { title: 'November', value: 11 },
  { title: 'December', value: 12 },
]

// Year options (current year and next)
const yearOptions = [currentYear, currentYear + 1]

// Computed amounts
const needsAmount = computed(() =>
  Math.round((form.value.income * form.value.needsPercentage) / 100)
)
const wantsAmount = computed(() =>
  Math.round((form.value.income * form.value.wantsPercentage) / 100)
)
const savingsAmount = computed(() =>
  Math.round((form.value.income * form.value.savingsPercentage) / 100)
)

// Total percentage
const totalPercentage = computed(
  () =>
    form.value.needsPercentage + form.value.wantsPercentage + form.value.savingsPercentage
)

// Form validation
const formValid = computed(() => {
  return (
    form.value.income > 0 &&
    form.value.needsPercentage >= 0 &&
    form.value.wantsPercentage >= 0 &&
    form.value.savingsPercentage >= 0 &&
    totalPercentage.value === 100
  )
})

// Auto-adjust savings to make total 100%
const adjustSavings = () => {
  const remaining = 100 - form.value.needsPercentage - form.value.wantsPercentage
  if (remaining >= 0 && remaining <= 100) {
    form.value.savingsPercentage = remaining
  }
}

// Apply preset
const applyPreset = (needs: number, wants: number, savings: number) => {
  form.value.needsPercentage = needs
  form.value.wantsPercentage = wants
  form.value.savingsPercentage = savings
}

// Submit
const handleSubmit = () => {
  if (!formValid.value) return
  emit('save', {
    month: form.value.month,
    year: form.value.year,
    income: form.value.income,
    needsPercentage: form.value.needsPercentage,
    wantsPercentage: form.value.wantsPercentage,
    savingsPercentage: form.value.savingsPercentage,
  })
  isOpen.value = false
}
</script>

<template>
  <v-dialog v-model="isOpen" max-width="500" persistent>
    <v-card>
      <v-card-title class="d-flex align-center pa-4">
        <v-icon icon="mdi-chart-pie" class="mr-2" />
        {{ isEditing ? 'Edit Budget' : 'Create Budget' }}
        <v-spacer />
        <v-btn icon="mdi-close" variant="text" @click="isOpen = false" />
      </v-card-title>

      <v-divider />

      <v-card-text class="pa-4">
        <v-form @submit.prevent="handleSubmit">
          <v-row>
            <!-- Month & Year -->
            <v-col cols="6">
              <v-select
                v-model="form.month"
                :items="monthOptions"
                item-title="title"
                item-value="value"
                label="Month"
                :disabled="isEditing"
              />
            </v-col>
            <v-col cols="6">
              <v-select
                v-model="form.year"
                :items="yearOptions"
                label="Year"
                :disabled="isEditing"
              />
            </v-col>

            <!-- Income -->
            <v-col cols="12">
              <v-text-field
                v-model.number="form.income"
                label="Monthly Income"
                type="number"
                prefix="₹"
                :rules="[(v) => v > 0 || 'Income is required']"
                hint="Enter your total monthly income"
              />
            </v-col>
          </v-row>

          <!-- Presets -->
          <div class="mb-4">
            <div class="text-subtitle-2 mb-2">Budget Presets</div>
            <v-btn-group density="compact" variant="outlined">
              <v-btn size="small" @click="applyPreset(50, 30, 20)">
                50/30/20
              </v-btn>
              <v-btn size="small" @click="applyPreset(60, 20, 20)">
                60/20/20
              </v-btn>
              <v-btn size="small" @click="applyPreset(70, 20, 10)">
                70/20/10
              </v-btn>
            </v-btn-group>
          </div>

          <!-- Budget Allocation -->
          <div class="text-subtitle-2 mb-3">Budget Allocation</div>

          <!-- Needs -->
          <div class="mb-4">
            <div class="d-flex justify-space-between align-center mb-1">
              <span class="text-body-2">
                <v-icon icon="mdi-home" color="blue" size="16" class="mr-1" />
                Needs
              </span>
              <span class="text-body-2 font-weight-medium">
                {{ form.needsPercentage }}% = {{ formatINR(needsAmount) }}
              </span>
            </div>
            <v-slider
              v-model="form.needsPercentage"
              :max="100"
              :step="5"
              color="blue"
              hide-details
              @update:model-value="adjustSavings"
            />
          </div>

          <!-- Wants -->
          <div class="mb-4">
            <div class="d-flex justify-space-between align-center mb-1">
              <span class="text-body-2">
                <v-icon icon="mdi-shopping" color="purple" size="16" class="mr-1" />
                Wants
              </span>
              <span class="text-body-2 font-weight-medium">
                {{ form.wantsPercentage }}% = {{ formatINR(wantsAmount) }}
              </span>
            </div>
            <v-slider
              v-model="form.wantsPercentage"
              :max="100"
              :step="5"
              color="purple"
              hide-details
              @update:model-value="adjustSavings"
            />
          </div>

          <!-- Savings -->
          <div class="mb-4">
            <div class="d-flex justify-space-between align-center mb-1">
              <span class="text-body-2">
                <v-icon icon="mdi-piggy-bank" color="green" size="16" class="mr-1" />
                Savings
              </span>
              <span class="text-body-2 font-weight-medium">
                {{ form.savingsPercentage }}% = {{ formatINR(savingsAmount) }}
              </span>
            </div>
            <v-slider
              v-model="form.savingsPercentage"
              :max="100"
              :step="5"
              color="green"
              hide-details
            />
          </div>

          <!-- Total Check -->
          <v-alert
            v-if="totalPercentage !== 100"
            type="error"
            variant="tonal"
            density="compact"
          >
            Total must equal 100% (currently {{ totalPercentage }}%)
          </v-alert>
          <v-alert v-else type="success" variant="tonal" density="compact">
            Budget allocation: {{ formatINR(form.income) }}
          </v-alert>
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
          {{ isEditing ? 'Update' : 'Create Budget' }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
