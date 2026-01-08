<script setup lang="ts">
import { computed } from 'vue'
import type { Goal } from '@/composables/useFIRE'
import { formatINR, getGoalStatusColor, getGoalStatusIcon, goalCategoryConfig } from '@/composables/useFIRE'
import { getFireProgressColor } from '@/utils/chartTheme'

const props = defineProps<{
  goal: Goal
}>()

const emit = defineEmits<{
  (e: 'edit', goal: Goal): void
  (e: 'delete', goal: Goal): void
  (e: 'view-details', goal: Goal): void
}>()

const statusColor = computed(() => getGoalStatusColor(props.goal.status))
const statusIcon = computed(() => getGoalStatusIcon(props.goal.status))
const progressColor = computed(() => getFireProgressColor(props.goal.progressPercent))

const categoryConfig = computed(() => goalCategoryConfig[props.goal.category] || goalCategoryConfig.other)

const targetDateFormatted = computed(() => {
  const date = new Date(props.goal.targetDate)
  return date.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })
})

const projectedDateFormatted = computed(() => {
  const date = new Date(props.goal.projectedDate)
  return date.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })
})

const timeRemainingText = computed(() => {
  if (props.goal.status === 'completed') return 'Completed'
  const months = props.goal.monthsRemaining
  if (months <= 0) return 'Overdue'
  if (months === 1) return '1 month'
  if (months < 12) return `${months} months`
  const years = Math.floor(months / 12)
  const remainingMonths = months % 12
  if (remainingMonths === 0) return `${years} year${years > 1 ? 's' : ''}`
  return `${years}y ${remainingMonths}m`
})

const projectionMessage = computed(() => {
  if (props.goal.status === 'completed') return 'Goal achieved!'
  if (props.goal.status === 'on_track') {
    const monthsEarly = Math.round(
      (new Date(props.goal.targetDate).getTime() - new Date(props.goal.projectedDate).getTime()) /
        (1000 * 60 * 60 * 24 * 30)
    )
    if (monthsEarly > 0) return `On pace to reach ${monthsEarly} month${monthsEarly > 1 ? 's' : ''} early!`
    return 'On track to reach your goal!'
  }
  if (props.goal.status === 'at_risk') {
    return 'Might miss target. Consider increasing SIP.'
  }
  return 'Off track. Review your savings plan.'
})

// Progress ring calculations
const radius = 40
const circumference = 2 * Math.PI * radius
const strokeDashoffset = computed(() => {
  return circumference - (props.goal.progressPercent / 100) * circumference
})
</script>

<template>
  <v-card class="goal-card h-100" :class="{ 'goal-completed': goal.status === 'completed' }">
    <v-card-text class="pa-4">
      <!-- Header -->
      <div class="d-flex align-center justify-space-between mb-3">
        <div class="d-flex align-center">
          <v-avatar :color="categoryConfig.color" size="40" class="mr-3">
            <v-icon :icon="goal.icon || categoryConfig.icon" color="white" />
          </v-avatar>
          <div>
            <div class="text-subtitle-1 font-weight-bold">{{ goal.name }}</div>
            <div class="text-caption text-medium-emphasis">{{ categoryConfig.label }}</div>
          </div>
        </div>
        <v-chip :color="statusColor" size="small" variant="tonal">
          <v-icon :icon="statusIcon" start size="14" />
          {{ goal.status.replace('_', ' ') }}
        </v-chip>
      </div>

      <!-- Progress Ring & Amount -->
      <div class="d-flex align-center justify-space-between mb-3">
        <div class="progress-ring">
          <svg width="100" height="100" viewBox="0 0 100 100">
            <!-- Background circle -->
            <circle
              cx="50"
              cy="50"
              :r="radius"
              fill="none"
              stroke="rgba(0,0,0,0.1)"
              stroke-width="8"
            />
            <!-- Progress circle -->
            <circle
              cx="50"
              cy="50"
              :r="radius"
              fill="none"
              :stroke="progressColor"
              stroke-width="8"
              stroke-linecap="round"
              :stroke-dasharray="circumference"
              :stroke-dashoffset="strokeDashoffset"
              transform="rotate(-90 50 50)"
              class="progress-circle"
            />
          </svg>
          <div class="progress-text">
            <div class="text-h6 font-weight-bold">{{ goal.progressPercent }}%</div>
          </div>
        </div>

        <div class="text-right">
          <div class="text-body-2 text-medium-emphasis">Current</div>
          <div class="text-h6 font-weight-bold text-currency">{{ formatINR(goal.currentAmount, true) }}</div>
          <div class="text-body-2 text-medium-emphasis">of {{ formatINR(goal.targetAmount, true) }}</div>
        </div>
      </div>

      <!-- Progress Bar -->
      <v-progress-linear
        :model-value="goal.progressPercent"
        :color="progressColor"
        height="8"
        rounded
        class="mb-3"
      />

      <!-- Details Row -->
      <v-row dense class="mb-3">
        <v-col cols="6">
          <div class="detail-item">
            <v-icon icon="mdi-calendar-check" size="16" class="mr-1" />
            <span class="text-caption">Target: {{ targetDateFormatted }}</span>
          </div>
        </v-col>
        <v-col cols="6">
          <div class="detail-item">
            <v-icon icon="mdi-clock-outline" size="16" class="mr-1" />
            <span class="text-caption">{{ timeRemainingText }}</span>
          </div>
        </v-col>
        <v-col cols="6">
          <div class="detail-item">
            <v-icon icon="mdi-cash-sync" size="16" class="mr-1" />
            <span class="text-caption">SIP: {{ formatINR(goal.monthlySIP, true) }}/mo</span>
          </div>
        </v-col>
        <v-col cols="6">
          <div class="detail-item">
            <v-icon icon="mdi-percent" size="16" class="mr-1" />
            <span class="text-caption">Returns: {{ goal.expectedReturn }}%</span>
          </div>
        </v-col>
      </v-row>

      <!-- Projection Message -->
      <v-alert
        :type="goal.status === 'on_track' || goal.status === 'completed' ? 'success' : goal.status === 'at_risk' ? 'warning' : 'error'"
        variant="tonal"
        density="compact"
        class="mb-3"
      >
        <div class="text-body-2">
          <v-icon icon="mdi-lightbulb" size="14" class="mr-1" />
          {{ projectionMessage }}
        </div>
      </v-alert>

      <!-- Actions -->
      <div class="d-flex ga-2">
        <v-btn
          variant="outlined"
          size="small"
          color="primary"
          class="flex-grow-1"
          @click="emit('view-details', goal)"
        >
          <v-icon icon="mdi-eye" start />
          Details
        </v-btn>
        <v-btn
          variant="outlined"
          size="small"
          icon="mdi-pencil"
          @click="emit('edit', goal)"
        />
        <v-btn
          variant="outlined"
          size="small"
          icon="mdi-delete"
          color="error"
          @click="emit('delete', goal)"
        />
      </div>
    </v-card-text>
  </v-card>
</template>

<style scoped>
.goal-card {
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.goal-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.12);
}

.goal-completed {
  border: 2px solid rgb(var(--v-theme-success));
}

.progress-ring {
  position: relative;
  width: 100px;
  height: 100px;
}

.progress-text {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
}

.progress-circle {
  transition: stroke-dashoffset 0.6s ease-in-out;
}

.detail-item {
  display: flex;
  align-items: center;
  color: rgba(var(--v-theme-on-surface), 0.7);
}
</style>
