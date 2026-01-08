<script setup lang="ts">
import { computed } from 'vue'
import type { FreedomScore } from '@/composables/useFIRE'
import { getFireProgressColor } from '@/utils/chartTheme'

const props = defineProps<{
  score: FreedomScore
  loading?: boolean
}>()

const scoreColor = computed(() => getFireProgressColor(props.score.total))

const statusEmoji = computed(() => {
  switch (props.score.status) {
    case 'excellent': return ''
    case 'on_track': return ''
    case 'good': return ''
    case 'fair': return ''
    case 'needs_work': return ''
    default: return ''
  }
})

const domains = computed(() => [
  { key: 'save', label: 'SAVE', icon: 'mdi-piggy-bank', ...props.score.domains.save },
  { key: 'grow', label: 'GROW', icon: 'mdi-trending-up', ...props.score.domains.grow },
  { key: 'protect', label: 'PROTECT', icon: 'mdi-shield-check', ...props.score.domains.protect },
  { key: 'ready', label: 'READY', icon: 'mdi-rocket-launch', ...props.score.domains.ready }
])

const circumference = 2 * Math.PI * 80
const strokeDashoffset = computed(() => {
  return circumference - (props.score.total / 100) * circumference
})
</script>

<template>
  <v-card class="freedom-score-card" :loading="loading">
    <v-card-text class="pa-6">
      <!-- Score Gauge -->
      <div class="d-flex flex-column align-center mb-6">
        <div class="score-gauge">
          <svg width="200" height="200" viewBox="0 0 200 200">
            <!-- Background circle -->
            <circle
              cx="100"
              cy="100"
              r="80"
              fill="none"
              stroke="rgba(0,0,0,0.1)"
              stroke-width="12"
            />
            <!-- Progress circle -->
            <circle
              cx="100"
              cy="100"
              r="80"
              fill="none"
              :stroke="scoreColor"
              stroke-width="12"
              stroke-linecap="round"
              :stroke-dasharray="circumference"
              :stroke-dashoffset="strokeDashoffset"
              transform="rotate(-90 100 100)"
              class="progress-circle"
            />
          </svg>
          <div class="score-text">
            <div class="text-h2 font-weight-bold text-currency" :style="{ color: scoreColor }">
              {{ score.total }}
            </div>
            <div class="text-body-2 text-medium-emphasis">/100</div>
          </div>
        </div>
        <div class="text-h6 font-weight-medium mt-2">FIRE Freedom Score</div>
        <v-chip
          :color="score.status === 'excellent' ? 'success' : score.status === 'on_track' ? 'primary' : score.status === 'good' ? 'info' : score.status === 'fair' ? 'warning' : 'error'"
          size="small"
          class="mt-1"
        >
          {{ statusEmoji }} {{ score.status.replace('_', ' ').toUpperCase() }}
        </v-chip>
        <div class="text-body-2 text-medium-emphasis text-center mt-2" style="max-width: 300px">
          {{ score.message }}
        </div>
      </div>

      <!-- Domain Breakdown -->
      <v-row dense>
        <v-col
          v-for="domain in domains"
          :key="domain.key"
          cols="6"
          sm="3"
        >
          <div class="domain-card pa-3 rounded-lg text-center">
            <v-icon :icon="domain.icon" size="24" color="primary" class="mb-1" />
            <div class="text-caption font-weight-bold text-uppercase">{{ domain.label }}</div>
            <div class="text-h6 font-weight-bold text-currency">
              {{ domain.score }}<span class="text-body-2 text-medium-emphasis">/{{ domain.maxScore }}</span>
            </div>
            <v-progress-linear
              :model-value="(domain.score / domain.maxScore) * 100"
              :color="getFireProgressColor((domain.score / domain.maxScore) * 100)"
              height="4"
              rounded
              class="mt-1"
            />
          </div>
        </v-col>
      </v-row>

      <!-- Domain Details Expansion -->
      <v-expansion-panels variant="accordion" class="mt-4">
        <v-expansion-panel
          v-for="domain in domains"
          :key="domain.key"
        >
          <v-expansion-panel-title>
            <div class="d-flex align-center">
              <v-icon :icon="domain.icon" size="20" class="mr-2" />
              <span class="font-weight-medium">{{ domain.label }}</span>
              <v-spacer />
              <span class="text-body-2 mr-2">{{ domain.score }}/{{ domain.maxScore }}</span>
            </div>
          </v-expansion-panel-title>
          <v-expansion-panel-text>
            <v-list density="compact">
              <v-list-item
                v-for="factor in domain.factors"
                :key="factor.name"
              >
                <v-list-item-title class="text-body-2">{{ factor.name }}</v-list-item-title>
                <v-list-item-subtitle>{{ factor.description }}</v-list-item-subtitle>
                <template #append>
                  <span class="text-body-2 font-weight-medium">
                    {{ factor.score }}/{{ factor.maxScore }}
                  </span>
                </template>
              </v-list-item>
            </v-list>
          </v-expansion-panel-text>
        </v-expansion-panel>
      </v-expansion-panels>
    </v-card-text>
  </v-card>
</template>

<style scoped>
.freedom-score-card {
  overflow: visible;
}

.score-gauge {
  position: relative;
  width: 200px;
  height: 200px;
}

.score-text {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
}

.progress-circle {
  transition: stroke-dashoffset 0.8s ease-in-out;
}

.domain-card {
  background: rgba(var(--v-theme-surface-variant), 0.3);
  transition: background 0.2s ease;
}

.domain-card:hover {
  background: rgba(var(--v-theme-surface-variant), 0.5);
}
</style>
