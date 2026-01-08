<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(defineProps<{
  score: number
  maxScore?: number
  size?: 'small' | 'medium' | 'large'
  showTrend?: boolean
  trend?: 'improving' | 'stable' | 'declining'
  trendValue?: number
}>(), {
  maxScore: 100,
  size: 'medium',
  showTrend: false,
  trend: 'stable'
})

const percentage = computed(() => (props.score / props.maxScore) * 100)

const status = computed(() => {
  if (percentage.value >= 90) return { label: 'Excellent', color: 'success' }
  if (percentage.value >= 70) return { label: 'Good', color: 'primary' }
  if (percentage.value >= 50) return { label: 'Needs Work', color: 'warning' }
  return { label: 'Critical', color: 'error' }
})

const sizeConfig = computed(() => {
  switch (props.size) {
    case 'small': return { width: 120, strokeWidth: 8, fontSize: 'text-h5' }
    case 'large': return { width: 200, strokeWidth: 12, fontSize: 'text-h3' }
    default: return { width: 160, strokeWidth: 10, fontSize: 'text-h4' }
  }
})

const trendIcon = computed(() => {
  switch (props.trend) {
    case 'improving': return 'mdi-trending-up'
    case 'declining': return 'mdi-trending-down'
    default: return 'mdi-trending-neutral'
  }
})

const trendColor = computed(() => {
  switch (props.trend) {
    case 'improving': return 'success'
    case 'declining': return 'error'
    default: return 'grey'
  }
})
</script>

<template>
  <div class="health-score-gauge d-flex flex-column align-center">
    <v-progress-circular
      :model-value="percentage"
      :size="sizeConfig.width"
      :width="sizeConfig.strokeWidth"
      :color="status.color"
      bg-color="grey-lighten-3"
    >
      <div class="d-flex flex-column align-center">
        <span :class="[sizeConfig.fontSize, 'font-weight-bold']">{{ score }}</span>
        <span class="text-caption text-medium-emphasis">/{{ maxScore }}</span>
      </div>
    </v-progress-circular>

    <v-chip
      :color="status.color"
      size="small"
      class="mt-3"
    >
      {{ status.label }}
    </v-chip>

    <div v-if="showTrend" class="d-flex align-center mt-2">
      <v-icon :icon="trendIcon" :color="trendColor" size="small" class="mr-1" />
      <span v-if="trendValue !== undefined" class="text-caption" :class="`text-${trendColor}`">
        {{ trendValue > 0 ? '+' : '' }}{{ trendValue }} pts
      </span>
      <span v-else class="text-caption text-medium-emphasis">
        {{ trend === 'improving' ? 'Improving' : trend === 'declining' ? 'Declining' : 'Stable' }}
      </span>
    </div>
  </div>
</template>

<style scoped>
.health-score-gauge {
  padding: 16px;
}
</style>
