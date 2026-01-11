<script setup lang="ts">
import { computed, ref, watch, onMounted } from 'vue'
import type { Goal, GoalMilestone } from '@/composables/useFIRE'
import { formatINR, getGoalStatusColor, getGoalStatusIcon, goalCategoryConfig } from '@/composables/useFIRE'
import { getFireProgressColor } from '@/utils/chartTheme'

const props = defineProps<{
  goal: Goal
  showCelebration?: boolean
}>()

const emit = defineEmits<{
  (e: 'edit', goal: Goal): void
  (e: 'delete', goal: Goal): void
  (e: 'view-details', goal: Goal): void
  (e: 'milestone-achieved', milestone: GoalMilestone): void
}>()

// Celebration state
const isConfettiActive = ref(false)
const celebratedMilestone = ref<GoalMilestone | null>(null)
const previousAchievedCount = ref(0)

const statusColor = computed(() => getGoalStatusColor(props.goal.status))
const statusIcon = computed(() => getGoalStatusIcon(props.goal.status))
const progressColor = computed(() => getFireProgressColor(props.goal.progressPercent))

const categoryConfig = computed(() => goalCategoryConfig[props.goal.category] || goalCategoryConfig.OTHER)

// Milestone helpers
const milestoneIcons: Record<number, string> = {
  25: 'mdi-medal-outline',
  50: 'mdi-medal',
  75: 'mdi-trophy-outline',
  100: 'mdi-trophy'
}

const milestoneColors: Record<number, string> = {
  25: '#cd7f32', // Bronze
  50: '#c0c0c0', // Silver
  75: '#ffd700', // Gold
  100: '#e91e63' // Pink/FIRE
}

// Calculate months remaining
const monthsRemaining = computed(() => {
  const target = new Date(props.goal.targetDate)
  const now = new Date()
  return Math.max(0, Math.round((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24 * 30)))
})

const targetDateFormatted = computed(() => {
  const date = new Date(props.goal.targetDate)
  return date.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })
})

const projectedDateFormatted = computed(() => {
  if (!props.goal.projectedDate) return null
  const date = new Date(props.goal.projectedDate)
  return date.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })
})

const timeRemainingText = computed(() => {
  if (props.goal.status === 'COMPLETED') return 'Completed'
  const months = monthsRemaining.value
  if (months <= 0) return 'Overdue'
  if (months === 1) return '1 month'
  if (months < 12) return `${months} months`
  const years = Math.floor(months / 12)
  const remMonths = months % 12
  if (remMonths === 0) return `${years} year${years > 1 ? 's' : ''}`
  return `${years}y ${remMonths}m`
})

const projectionMessage = computed(() => {
  if (props.goal.status === 'COMPLETED') return 'Goal achieved!'
  if (props.goal.currentInsight) return props.goal.currentInsight
  if (props.goal.status === 'ON_TRACK') {
    if (props.goal.projectedDate) {
      const monthsEarly = Math.round(
        (new Date(props.goal.targetDate).getTime() - new Date(props.goal.projectedDate).getTime()) /
          (1000 * 60 * 60 * 24 * 30)
      )
      if (monthsEarly > 0) return `On pace to reach ${monthsEarly} month${monthsEarly > 1 ? 's' : ''} early!`
    }
    return 'On track to reach your goal!'
  }
  if (props.goal.status === 'AT_RISK') {
    return 'Might miss target. Consider increasing SIP.'
  }
  return 'Off track. Review your savings plan.'
})

// Check for newly achieved milestones
const achievedMilestones = computed(() =>
  (props.goal.milestones || []).filter(m => m.achieved).sort((a, b) => b.percent - a.percent)
)

const latestMilestone = computed(() => achievedMilestones.value[0] || null)

// Watch for new milestone achievements
watch(
  () => achievedMilestones.value.length,
  (newCount) => {
    if (newCount > previousAchievedCount.value && props.showCelebration !== false) {
      // New milestone achieved - trigger celebration
      celebratedMilestone.value = achievedMilestones.value[0]
      triggerCelebration()
      emit('milestone-achieved', celebratedMilestone.value)
    }
    previousAchievedCount.value = newCount
  }
)

onMounted(() => {
  previousAchievedCount.value = achievedMilestones.value.length
})

function triggerCelebration() {
  isConfettiActive.value = true
  setTimeout(() => {
    isConfettiActive.value = false
    celebratedMilestone.value = null
  }, 3000)
}

// Progress ring calculations
const radius = 40
const circumference = 2 * Math.PI * radius
const strokeDashoffset = computed(() => {
  return circumference - (props.goal.progressPercent / 100) * circumference
})
</script>

<template>
  <v-card class="goal-card h-100" :class="{ 'goal-completed': goal.status === 'COMPLETED' }">
    <!-- Confetti Celebration Overlay -->
    <Transition name="confetti">
      <div v-if="isConfettiActive" class="confetti-overlay">
        <div class="confetti-container">
          <div v-for="i in 50" :key="i" class="confetti" :style="{ '--i': i }" />
        </div>
        <div class="celebration-message">
          <v-icon :icon="milestoneIcons[celebratedMilestone?.percent || 25]" size="48" :color="milestoneColors[celebratedMilestone?.percent || 25]" />
          <div class="text-h5 font-weight-bold mt-2">{{ celebratedMilestone?.percent }}% Milestone!</div>
          <div class="text-body-1">Keep up the great work!</div>
        </div>
      </div>
    </Transition>

    <v-card-text class="pa-4">
      <!-- Header -->
      <div class="d-flex align-center justify-space-between mb-3">
        <div class="d-flex align-center">
          <v-avatar :color="categoryConfig.color" size="40" class="mr-3">
            <v-icon :icon="goal.icon || categoryConfig.icon" color="white" />
          </v-avatar>
          <div>
            <div class="text-subtitle-1 font-weight-bold">{{ goal.goalName }}</div>
            <div class="text-caption text-medium-emphasis">{{ categoryConfig.label }}</div>
          </div>
        </div>
        <v-chip :color="statusColor" size="small" variant="tonal">
          <v-icon :icon="statusIcon" start size="14" />
          {{ goal.status.replace('_', ' ') }}
        </v-chip>
      </div>

      <!-- Milestone Badges -->
      <div v-if="goal.milestones?.length" class="d-flex justify-center ga-1 mb-3">
        <v-tooltip v-for="ms in [25, 50, 75, 100]" :key="ms" location="top">
          <template #activator="{ props: tooltipProps }">
            <v-avatar
              v-bind="tooltipProps"
              size="28"
              :class="['milestone-badge', { achieved: goal.progressPercent >= ms }]"
              :style="{ '--milestone-color': milestoneColors[ms] }"
            >
              <v-icon
                :icon="milestoneIcons[ms]"
                size="16"
                :color="goal.progressPercent >= ms ? milestoneColors[ms] : 'grey-lighten-1'"
              />
            </v-avatar>
          </template>
          <span>{{ ms }}% {{ goal.progressPercent >= ms ? 'Achieved!' : 'Not yet' }}</span>
        </v-tooltip>
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
            <span class="text-caption">SIP: {{ formatINR(goal.monthlyContribution || 0, true) }}/mo</span>
          </div>
        </v-col>
        <v-col cols="6">
          <div class="detail-item">
            <v-icon icon="mdi-percent" size="16" class="mr-1" />
            <span class="text-caption">Returns: {{ goal.expectedReturns }}%</span>
          </div>
        </v-col>
      </v-row>

      <!-- SIP Recommendation (if available) -->
      <v-alert
        v-if="goal.sipRecommended && goal.sipRecommended > (goal.monthlyContribution || 0)"
        type="info"
        variant="tonal"
        density="compact"
        class="mb-3"
      >
        <div class="text-body-2">
          <v-icon icon="mdi-trending-up" size="14" class="mr-1" />
          Increase SIP to {{ formatINR(goal.sipRecommended, true) }}/mo to reach goal on time
        </div>
      </v-alert>

      <!-- Projection Message -->
      <v-alert
        :type="goal.status === 'ON_TRACK' || goal.status === 'COMPLETED' ? 'success' : goal.status === 'AT_RISK' ? 'warning' : 'error'"
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
  position: relative;
  overflow: hidden;
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

/* Milestone Badges */
.milestone-badge {
  background: rgba(0, 0, 0, 0.05);
  border: 2px solid transparent;
  transition: all 0.3s ease;
}

.milestone-badge.achieved {
  background: rgba(var(--milestone-color), 0.1);
  border-color: var(--milestone-color);
  animation: badge-pop 0.5s ease;
}

@keyframes badge-pop {
  0% { transform: scale(1); }
  50% { transform: scale(1.2); }
  100% { transform: scale(1); }
}

/* Confetti Celebration Overlay */
.confetti-overlay {
  position: absolute;
  inset: 0;
  background: rgba(255, 255, 255, 0.95);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 10;
}

.confetti-container {
  position: absolute;
  inset: 0;
  overflow: hidden;
  pointer-events: none;
}

.confetti {
  position: absolute;
  width: 10px;
  height: 10px;
  background: var(--confetti-color, #ff5722);
  top: -10px;
  left: calc(var(--i) * 2%);
  animation: confetti-fall 3s ease-out forwards;
  animation-delay: calc(var(--i) * 0.02s);
}

.confetti:nth-child(5n) { background: #ff5722; border-radius: 50%; }
.confetti:nth-child(5n+1) { background: #ffd700; }
.confetti:nth-child(5n+2) { background: #4caf50; transform: rotate(45deg); }
.confetti:nth-child(5n+3) { background: #2196f3; border-radius: 50%; }
.confetti:nth-child(5n+4) { background: #e91e63; }

@keyframes confetti-fall {
  0% {
    transform: translateY(0) rotate(0deg);
    opacity: 1;
  }
  100% {
    transform: translateY(300px) rotate(720deg);
    opacity: 0;
  }
}

.celebration-message {
  text-align: center;
  z-index: 11;
  animation: celebration-appear 0.5s ease;
}

@keyframes celebration-appear {
  0% {
    transform: scale(0);
    opacity: 0;
  }
  50% {
    transform: scale(1.2);
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}

/* Confetti transition */
.confetti-enter-active {
  animation: fade-in 0.3s ease;
}

.confetti-leave-active {
  animation: fade-out 0.5s ease;
}

@keyframes fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes fade-out {
  from { opacity: 1; }
  to { opacity: 0; }
}
</style>
