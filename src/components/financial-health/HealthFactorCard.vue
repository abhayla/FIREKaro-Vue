<script setup lang="ts">
import { computed } from 'vue'
import type { HealthFactor } from '@/composables/useFinancialHealth'

const props = defineProps<{
  factor: HealthFactor
}>()

const percentage = computed(() => (props.factor.score / props.factor.maxScore) * 100)

const statusConfig = computed(() => {
  switch (props.factor.status) {
    case 'excellent': return { color: 'success', icon: 'mdi-check-circle' }
    case 'good': return { color: 'primary', icon: 'mdi-check' }
    case 'needs_improvement': return { color: 'warning', icon: 'mdi-alert' }
    case 'critical': return { color: 'error', icon: 'mdi-alert-circle' }
    default: return { color: 'grey', icon: 'mdi-minus' }
  }
})
</script>

<template>
  <v-card class="health-factor-card" variant="outlined">
    <v-card-text>
      <div class="d-flex align-center justify-space-between mb-2">
        <div class="d-flex align-center">
          <v-icon
            :icon="statusConfig.icon"
            :color="statusConfig.color"
            size="small"
            class="mr-2"
          />
          <span class="text-subtitle-2 font-weight-medium">{{ factor.name }}</span>
        </div>
        <span class="text-h6 font-weight-bold">
          {{ factor.score }}<span class="text-caption text-medium-emphasis">/{{ factor.maxScore }}</span>
        </span>
      </div>

      <v-progress-linear
        :model-value="percentage"
        :color="statusConfig.color"
        height="8"
        rounded
        class="mb-2"
      />

      <p class="text-body-2 text-medium-emphasis mb-0">
        {{ factor.description }}
      </p>

      <v-alert
        v-if="factor.recommendation"
        type="info"
        variant="tonal"
        density="compact"
        class="mt-3"
      >
        <template #prepend>
          <v-icon icon="mdi-lightbulb-outline" size="small" />
        </template>
        {{ factor.recommendation }}
      </v-alert>
    </v-card-text>
  </v-card>
</template>

<style scoped>
.health-factor-card {
  height: 100%;
}
</style>
