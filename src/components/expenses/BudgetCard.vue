<script setup lang="ts">
import { computed } from 'vue'
import { formatINR, type Budget } from '@/composables/useExpenses'

const props = defineProps<{
  budget: Budget
}>()

const emit = defineEmits<{
  edit: []
}>()

// Calculate percentages
const needsPercent = computed(() =>
  props.budget.needsLimit > 0
    ? Math.min(100, (props.budget.needsActual / props.budget.needsLimit) * 100)
    : 0
)
const wantsPercent = computed(() =>
  props.budget.wantsLimit > 0
    ? Math.min(100, (props.budget.wantsActual / props.budget.wantsLimit) * 100)
    : 0
)
const savingsPercent = computed(() =>
  props.budget.savingsLimit > 0
    ? Math.min(100, (props.budget.savingsActual / props.budget.savingsLimit) * 100)
    : 0
)

// Overall stats
const totalSpent = computed(
  () => props.budget.needsActual + props.budget.wantsActual + props.budget.savingsActual
)
const totalBudget = computed(
  () => props.budget.needsLimit + props.budget.wantsLimit + props.budget.savingsLimit
)
const overallPercent = computed(() =>
  totalBudget.value > 0 ? Math.min(100, (totalSpent.value / totalBudget.value) * 100) : 0
)

// Status colors
const getStatusColor = (percent: number) => {
  if (percent >= 100) return 'error'
  if (percent >= 80) return 'warning'
  return 'success'
}

// Month name
const monthName = computed(() => {
  const date = new Date(props.budget.year, props.budget.month - 1)
  return date.toLocaleString('en-IN', { month: 'long', year: 'numeric' })
})
</script>

<template>
  <v-card>
    <v-card-title class="d-flex align-center">
      <v-icon icon="mdi-chart-pie" class="mr-2" />
      {{ monthName }} Budget
      <v-spacer />
      <v-btn icon="mdi-pencil" variant="text" size="small" @click="emit('edit')" />
    </v-card-title>

    <v-card-text>
      <!-- Overall Progress -->
      <div class="mb-4">
        <div class="d-flex justify-space-between mb-1">
          <span class="text-body-2">Overall Spending</span>
          <span class="text-body-2 font-weight-medium text-currency">
            {{ formatINR(totalSpent) }} / {{ formatINR(totalBudget) }}
          </span>
        </div>
        <v-progress-linear
          :model-value="overallPercent"
          :color="getStatusColor(overallPercent)"
          height="8"
          rounded
        />
        <div class="text-caption text-right mt-1" :class="`text-${getStatusColor(overallPercent)}`">
          {{ overallPercent.toFixed(0) }}% used
        </div>
      </div>

      <v-divider class="my-4" />

      <!-- 50/30/20 Breakdown -->
      <div class="text-subtitle-2 mb-3">50/30/20 Rule Breakdown</div>

      <!-- Needs (50%) -->
      <div class="budget-category mb-3">
        <div class="d-flex justify-space-between align-center mb-1">
          <div class="d-flex align-center">
            <v-avatar color="blue" size="24" class="mr-2">
              <v-icon icon="mdi-home" size="14" />
            </v-avatar>
            <span class="text-body-2">Needs (50%)</span>
          </div>
          <span class="text-body-2 text-currency">
            {{ formatINR(budget.needsActual) }} / {{ formatINR(budget.needsLimit) }}
          </span>
        </div>
        <v-progress-linear
          :model-value="needsPercent"
          :color="getStatusColor(needsPercent)"
          height="6"
          rounded
        />
        <div class="d-flex justify-space-between text-caption mt-1">
          <span class="text-medium-emphasis">Essential expenses</span>
          <span :class="`text-${getStatusColor(needsPercent)}`">
            {{ needsPercent.toFixed(0) }}%
          </span>
        </div>
      </div>

      <!-- Wants (30%) -->
      <div class="budget-category mb-3">
        <div class="d-flex justify-space-between align-center mb-1">
          <div class="d-flex align-center">
            <v-avatar color="purple" size="24" class="mr-2">
              <v-icon icon="mdi-shopping" size="14" />
            </v-avatar>
            <span class="text-body-2">Wants (30%)</span>
          </div>
          <span class="text-body-2 text-currency">
            {{ formatINR(budget.wantsActual) }} / {{ formatINR(budget.wantsLimit) }}
          </span>
        </div>
        <v-progress-linear
          :model-value="wantsPercent"
          :color="getStatusColor(wantsPercent)"
          height="6"
          rounded
        />
        <div class="d-flex justify-space-between text-caption mt-1">
          <span class="text-medium-emphasis">Discretionary spending</span>
          <span :class="`text-${getStatusColor(wantsPercent)}`">
            {{ wantsPercent.toFixed(0) }}%
          </span>
        </div>
      </div>

      <!-- Savings (20%) -->
      <div class="budget-category">
        <div class="d-flex justify-space-between align-center mb-1">
          <div class="d-flex align-center">
            <v-avatar color="green" size="24" class="mr-2">
              <v-icon icon="mdi-piggy-bank" size="14" />
            </v-avatar>
            <span class="text-body-2">Savings (20%)</span>
          </div>
          <span class="text-body-2 text-currency">
            {{ formatINR(budget.savingsActual) }} / {{ formatINR(budget.savingsLimit) }}
          </span>
        </div>
        <v-progress-linear
          :model-value="savingsPercent"
          color="success"
          height="6"
          rounded
        />
        <div class="d-flex justify-space-between text-caption mt-1">
          <span class="text-medium-emphasis">Savings & investments</span>
          <span class="text-success">{{ savingsPercent.toFixed(0) }}%</span>
        </div>
      </div>
    </v-card-text>

    <!-- Alerts -->
    <v-card-text v-if="needsPercent >= 80 || wantsPercent >= 80" class="pt-0">
      <v-alert
        v-if="needsPercent >= 100"
        type="error"
        variant="tonal"
        density="compact"
        class="mb-2"
      >
        <v-icon icon="mdi-alert" class="mr-1" />
        Needs budget exceeded!
      </v-alert>
      <v-alert
        v-else-if="needsPercent >= 80"
        type="warning"
        variant="tonal"
        density="compact"
        class="mb-2"
      >
        <v-icon icon="mdi-alert" class="mr-1" />
        Needs budget at {{ needsPercent.toFixed(0) }}%
      </v-alert>

      <v-alert
        v-if="wantsPercent >= 100"
        type="error"
        variant="tonal"
        density="compact"
      >
        <v-icon icon="mdi-alert" class="mr-1" />
        Wants budget exceeded!
      </v-alert>
      <v-alert
        v-else-if="wantsPercent >= 80"
        type="warning"
        variant="tonal"
        density="compact"
      >
        <v-icon icon="mdi-alert" class="mr-1" />
        Wants budget at {{ wantsPercent.toFixed(0) }}%
      </v-alert>
    </v-card-text>
  </v-card>
</template>
