<script setup lang="ts">
import { computed } from 'vue'
import { getFIREMilestones, type FIREMilestone } from '@/composables/useFIRE'
import { getFireProgressColor } from '@/utils/chartTheme'

const props = defineProps<{
  progressPercent: number
}>()

const milestones = computed(() => getFIREMilestones(props.progressPercent))

const getMilestoneColor = (milestone: FIREMilestone) => {
  if (milestone.achieved) return getFireProgressColor(milestone.percent)
  return 'rgba(0,0,0,0.2)'
}

const getMilestoneIcon = (milestone: FIREMilestone, index: number) => {
  if (milestone.achieved) {
    if (index === 0) return 'mdi-medal-outline'
    if (index === 1) return 'mdi-medal'
    if (index === 2) return 'mdi-trophy-outline'
    return 'mdi-trophy'
  }
  return 'mdi-circle-outline'
}
</script>

<template>
  <v-card>
    <v-card-title class="d-flex align-center">
      <v-icon icon="mdi-flag-checkered" class="mr-2" />
      FIRE Milestones
    </v-card-title>

    <v-card-text>
      <div class="milestone-bar">
        <!-- Progress track -->
        <div class="milestone-track">
          <div
            class="milestone-progress"
            :style="{ width: `${Math.min(100, progressPercent)}%`, background: getFireProgressColor(progressPercent) }"
          />
        </div>

        <!-- Milestone markers -->
        <div class="milestone-markers">
          <div
            v-for="(milestone, index) in milestones"
            :key="milestone.percent"
            class="milestone-marker"
            :style="{ left: `${milestone.percent}%` }"
          >
            <v-tooltip location="top">
              <template #activator="{ props: tooltipProps }">
                <div
                  v-bind="tooltipProps"
                  class="marker-dot"
                  :class="{ 'achieved': milestone.achieved }"
                  :style="{ background: getMilestoneColor(milestone) }"
                >
                  <v-icon
                    :icon="getMilestoneIcon(milestone, index)"
                    size="16"
                    :color="milestone.achieved ? 'white' : 'grey'"
                  />
                </div>
              </template>
              <span>
                {{ milestone.label }}
                <span v-if="milestone.achieved"> - Achieved!</span>
                <span v-else> - {{ (milestone.percent - progressPercent).toFixed(1) }}% to go</span>
              </span>
            </v-tooltip>
            <div class="marker-label text-caption" :class="{ 'font-weight-bold': milestone.achieved }">
              {{ milestone.label }}
            </div>
          </div>
        </div>
      </div>

      <!-- Current Progress -->
      <div class="text-center mt-4">
        <div class="text-h4 font-weight-bold" :style="{ color: getFireProgressColor(progressPercent) }">
          {{ progressPercent.toFixed(1) }}%
        </div>
        <div class="text-body-2 text-medium-emphasis">to Financial Independence</div>
      </div>

      <!-- Milestone Cards -->
      <v-row dense class="mt-4">
        <v-col
          v-for="(milestone, index) in milestones"
          :key="milestone.percent"
          cols="3"
        >
          <v-card
            :color="milestone.achieved ? 'success' : undefined"
            :variant="milestone.achieved ? 'tonal' : 'outlined'"
            class="pa-2 text-center milestone-card"
            :class="{ 'achieved': milestone.achieved }"
          >
            <v-icon
              :icon="getMilestoneIcon(milestone, index)"
              :color="milestone.achieved ? 'success' : 'grey'"
              size="24"
            />
            <div class="text-body-2 font-weight-bold">{{ milestone.label }}</div>
            <div v-if="milestone.achieved" class="text-caption text-success">
              <v-icon icon="mdi-check" size="12" /> Done
            </div>
            <div v-else class="text-caption text-medium-emphasis">
              {{ (milestone.percent - progressPercent).toFixed(0) }}% away
            </div>
          </v-card>
        </v-col>
      </v-row>

      <!-- Next Milestone Message -->
      <v-alert
        v-if="progressPercent < 100"
        type="info"
        variant="tonal"
        density="compact"
        class="mt-4"
      >
        <template #prepend>
          <v-icon icon="mdi-target" />
        </template>
        <span v-if="progressPercent < 25">
          <strong>Next milestone:</strong> 25% - You're building the foundation!
        </span>
        <span v-else-if="progressPercent < 50">
          <strong>Next milestone:</strong> 50% - Halfway to FIRE!
        </span>
        <span v-else-if="progressPercent < 75">
          <strong>Next milestone:</strong> 75% - The finish line is in sight!
        </span>
        <span v-else>
          <strong>Final stretch:</strong> 100% - FIRE awaits!
        </span>
      </v-alert>

      <v-alert
        v-else
        type="success"
        variant="tonal"
        density="compact"
        class="mt-4"
      >
        <template #prepend>
          <v-icon icon="mdi-party-popper" />
        </template>
        <strong>Congratulations!</strong> You've achieved Financial Independence!
      </v-alert>
    </v-card-text>
  </v-card>
</template>

<style scoped>
.milestone-bar {
  position: relative;
  padding-top: 40px;
  padding-bottom: 20px;
}

.milestone-track {
  height: 8px;
  background: rgba(0, 0, 0, 0.1);
  border-radius: 4px;
  position: relative;
  overflow: hidden;
}

.milestone-progress {
  height: 100%;
  border-radius: 4px;
  transition: width 0.5s ease;
}

.milestone-markers {
  position: relative;
  height: 40px;
}

.milestone-marker {
  position: absolute;
  transform: translateX(-50%);
  text-align: center;
}

.marker-dot {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto -20px;
  position: relative;
  top: -20px;
  border: 3px solid white;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  transition: transform 0.2s ease;
}

.marker-dot.achieved {
  transform: scale(1.1);
}

.marker-dot:hover {
  transform: scale(1.2);
}

.marker-label {
  margin-top: 24px;
  white-space: nowrap;
}

.milestone-card {
  transition: transform 0.2s ease;
}

.milestone-card.achieved {
  transform: scale(1.02);
}
</style>
