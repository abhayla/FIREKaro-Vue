<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { Goal, GoalCategory, CreateGoalInput } from '@/composables/useFIRE'
import { goalCategoryConfig, formatINR, calculateRecommendedSIP } from '@/composables/useFIRE'

const props = defineProps<{
  modelValue: boolean
  goal?: Goal | null
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'save', data: CreateGoalInput): void
}>()

const isEditing = computed(() => !!props.goal)

// Form data
const name = ref('')
const category = ref<GoalCategory>('OTHER')
const targetAmount = ref(0)
const currentAmount = ref(0)
const targetDate = ref('')
const monthlySIP = ref(0)
const expectedReturn = ref(10)

// Computed
const monthsRemaining = computed(() => {
  if (!targetDate.value) return 0
  const target = new Date(targetDate.value)
  const now = new Date()
  const months = (target.getFullYear() - now.getFullYear()) * 12 + (target.getMonth() - now.getMonth())
  return Math.max(0, months)
})

const recommendedSIP = computed(() => {
  return calculateRecommendedSIP(
    targetAmount.value,
    currentAmount.value,
    monthsRemaining.value,
    expectedReturn.value
  )
})

const projectedFinalAmount = computed(() => {
  if (monthlySIP.value <= 0 || monthsRemaining.value <= 0) return currentAmount.value

  const monthlyRate = expectedReturn.value / 100 / 12
  const n = monthsRemaining.value

  // Future value = PV(1+r)^n + PMT * ((1+r)^n - 1) / r
  const compoundedPrincipal = currentAmount.value * Math.pow(1 + monthlyRate, n)
  const sipFV = monthlySIP.value * ((Math.pow(1 + monthlyRate, n) - 1) / monthlyRate)

  return Math.round(compoundedPrincipal + sipFV)
})

const projectedStatus = computed(() => {
  const diff = projectedFinalAmount.value - targetAmount.value
  const percent = (diff / targetAmount.value) * 100

  if (percent >= 0) return { status: 'on_track', message: 'On track to meet goal', color: 'success' }
  if (percent >= -20) return { status: 'at_risk', message: 'Slightly below target', color: 'warning' }
  return { status: 'off_track', message: 'Will not meet target at current rate', color: 'error' }
})

// Category options
const categoryOptions = computed(() => {
  return Object.entries(goalCategoryConfig).map(([key, config]) => ({
    value: key,
    title: config.label,
    icon: config.icon,
    color: config.color
  }))
})

// Reset form function (defined before watch to avoid initialization error)
const resetForm = () => {
  name.value = ''
  category.value = 'OTHER'
  targetAmount.value = 0
  currentAmount.value = 0
  targetDate.value = ''
  monthlySIP.value = 0
  expectedReturn.value = 10
}

// Watch for goal changes (editing mode)
watch(
  () => props.goal,
  (newGoal) => {
    if (newGoal) {
      name.value = newGoal.goalName
      category.value = newGoal.category
      targetAmount.value = newGoal.targetAmount
      currentAmount.value = newGoal.currentAmount
      targetDate.value = newGoal.targetDate
      monthlySIP.value = newGoal.monthlyContribution
      expectedReturn.value = newGoal.expectedReturns
    } else {
      resetForm()
    }
  },
  { immediate: true }
)

const handleSave = () => {
  // Create goal input data directly using uppercase category
  const data: CreateGoalInput = {
    goalName: name.value,
    goalType: category.value,
    category: category.value,
    targetAmount: targetAmount.value,
    currentAmount: currentAmount.value,
    targetDate: targetDate.value,
    monthlyContribution: monthlySIP.value,
    expectedReturns: expectedReturn.value,
    icon: goalCategoryConfig[category.value]?.icon,
    color: goalCategoryConfig[category.value]?.color
  }
  emit('save', data)
  emit('update:modelValue', false)
}

const handleClose = () => {
  emit('update:modelValue', false)
  resetForm()
}

const useRecommendedSIP = () => {
  monthlySIP.value = recommendedSIP.value
}

// Min date for date picker (today)
const minDate = computed(() => {
  const today = new Date()
  return today.toISOString().split('T')[0]
})
</script>

<template>
  <v-dialog
    :model-value="modelValue"
    max-width="600"
    persistent
    @update:model-value="emit('update:modelValue', $event)"
  >
    <v-card>
      <v-card-title class="d-flex align-center">
        <v-icon :icon="isEditing ? 'mdi-pencil' : 'mdi-plus-circle'" class="mr-2" />
        {{ isEditing ? 'Edit Goal' : 'Create New Goal' }}
        <v-spacer />
        <v-btn icon="mdi-close" variant="text" density="compact" @click="handleClose" />
      </v-card-title>

      <v-divider />

      <v-card-text class="pa-4">
        <v-row>
          <!-- Goal Name -->
          <v-col cols="12">
            <v-text-field
              v-model="name"
              label="Goal Name"
              placeholder="e.g., House Down Payment"
              variant="outlined"
              density="comfortable"
              :rules="[v => !!v || 'Name is required']"
            />
          </v-col>

          <!-- Category -->
          <v-col cols="12" sm="6">
            <v-select
              v-model="category"
              :items="categoryOptions"
              item-value="value"
              item-title="title"
              label="Category"
              variant="outlined"
              density="comfortable"
            >
              <template #item="{ props: itemProps, item }">
                <v-list-item v-bind="itemProps">
                  <template #prepend>
                    <v-icon :icon="item.raw.icon" :color="item.raw.color" />
                  </template>
                </v-list-item>
              </template>
              <template #selection="{ item }">
                <div class="d-flex align-center">
                  <v-icon :icon="item.raw.icon" :color="item.raw.color" size="20" class="mr-2" />
                  {{ item.raw.title }}
                </div>
              </template>
            </v-select>
          </v-col>

          <!-- Target Date -->
          <v-col cols="12" sm="6">
            <v-text-field
              v-model="targetDate"
              label="Target Date"
              type="date"
              variant="outlined"
              density="comfortable"
              :min="minDate"
              :rules="[v => !!v || 'Target date is required']"
            />
          </v-col>

          <!-- Target Amount -->
          <v-col cols="12" sm="6">
            <v-text-field
              v-model.number="targetAmount"
              label="Target Amount"
              type="number"
              prefix="₹"
              variant="outlined"
              density="comfortable"
              :rules="[v => v > 0 || 'Amount must be greater than 0']"
            />
          </v-col>

          <!-- Current Amount -->
          <v-col cols="12" sm="6">
            <v-text-field
              v-model.number="currentAmount"
              label="Current Savings"
              type="number"
              prefix="₹"
              variant="outlined"
              density="comfortable"
            />
          </v-col>

          <!-- Expected Return -->
          <v-col cols="12">
            <div class="d-flex justify-space-between align-center mb-1">
              <span class="text-body-2">Expected Annual Return</span>
              <span class="text-body-2 font-weight-bold">{{ expectedReturn }}%</span>
            </div>
            <v-slider
              v-model="expectedReturn"
              :min="5"
              :max="18"
              :step="0.5"
              color="primary"
              thumb-label
              hide-details
            >
              <template #prepend>
                <span class="text-caption">Conservative</span>
              </template>
              <template #append>
                <span class="text-caption">Aggressive</span>
              </template>
            </v-slider>
          </v-col>

          <!-- Monthly SIP -->
          <v-col cols="12">
            <v-text-field
              v-model.number="monthlySIP"
              label="Monthly SIP"
              type="number"
              prefix="₹"
              variant="outlined"
              density="comfortable"
              :hint="`Recommended: ${formatINR(recommendedSIP)}`"
              persistent-hint
            >
              <template #append-inner>
                <v-btn
                  size="small"
                  variant="text"
                  color="primary"
                  @click="useRecommendedSIP"
                >
                  Use Recommended
                </v-btn>
              </template>
            </v-text-field>
          </v-col>
        </v-row>

        <!-- Projection Summary -->
        <v-alert
          v-if="targetAmount > 0 && monthsRemaining > 0"
          :type="projectedStatus.status === 'on_track' ? 'success' : projectedStatus.status === 'at_risk' ? 'warning' : 'error'"
          variant="tonal"
          class="mt-4"
        >
          <div class="d-flex justify-space-between align-center">
            <div>
              <div class="text-body-2 font-weight-medium">{{ projectedStatus.message }}</div>
              <div class="text-caption">
                Projected amount: {{ formatINR(projectedFinalAmount, true) }} in {{ monthsRemaining }} months
              </div>
            </div>
            <div class="text-right">
              <div class="text-h6 font-weight-bold" :class="`text-${projectedStatus.color}`">
                {{ Math.round((projectedFinalAmount / targetAmount) * 100) }}%
              </div>
              <div class="text-caption">of target</div>
            </div>
          </div>
        </v-alert>
      </v-card-text>

      <v-divider />

      <v-card-actions class="pa-4">
        <v-btn variant="text" @click="handleClose">Cancel</v-btn>
        <v-spacer />
        <v-btn
          color="primary"
          variant="elevated"
          :disabled="!name || !targetDate || targetAmount <= 0"
          @click="handleSave"
        >
          {{ isEditing ? 'Update Goal' : 'Create Goal' }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
