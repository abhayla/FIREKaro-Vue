<script setup lang="ts">
import { computed } from 'vue'
import {
  type CoverageAnalysis,
  formatINRCompact,
} from '@/composables/useProtection'

const props = defineProps<{
  analysis: CoverageAnalysis | null | undefined
  isLoading?: boolean
}>()

const emit = defineEmits<{
  calculate: []
  viewRecommendations: []
}>()

const statusConfig = computed(() => {
  if (!props.analysis) return null

  const { status } = props.analysis.overall
  switch (status) {
    case 'adequate':
      return {
        color: 'success',
        icon: 'mdi-shield-check',
        title: 'Coverage Adequate',
        bgClass: 'bg-success-subtle',
      }
    case 'partial':
      return {
        color: 'warning',
        icon: 'mdi-shield-alert',
        title: 'Coverage Gaps Found',
        bgClass: 'bg-warning-subtle',
      }
    case 'critical':
      return {
        color: 'error',
        icon: 'mdi-shield-off',
        title: 'Critical Coverage Gap',
        bgClass: 'bg-error-subtle',
      }
    default:
      return null
  }
})

const getProgressColor = (percentage: number) => {
  if (percentage >= 70) return 'success'
  if (percentage >= 40) return 'warning'
  return 'error'
}
</script>

<template>
  <div>
    <!-- Loading State -->
    <v-card v-if="isLoading" class="pa-4">
      <v-skeleton-loader type="article" />
    </v-card>

    <!-- No Analysis State -->
    <v-card v-else-if="!analysis" class="text-center pa-6">
      <v-icon icon="mdi-calculator-variant" size="64" color="primary" class="mb-4" />
      <h3 class="text-h6 mb-2">Check Your Coverage Adequacy</h3>
      <p class="text-medium-emphasis mb-4">
        Use our HLV calculator to determine if your insurance coverage is adequate for your
        family's needs.
      </p>
      <v-btn color="primary" @click="emit('calculate')">
        <v-icon icon="mdi-calculator" class="mr-2" />
        Calculate Now
      </v-btn>
    </v-card>

    <!-- Coverage Analysis Results -->
    <v-card v-else>
      <v-card-title class="d-flex align-center">
        <v-icon
          :icon="statusConfig?.icon"
          :color="statusConfig?.color"
          class="mr-2"
        />
        {{ statusConfig?.title }}
        <v-spacer />
        <v-chip :color="statusConfig?.color" variant="tonal">
          Score: {{ analysis.overall.score.toFixed(0) }}%
        </v-chip>
      </v-card-title>

      <v-card-text>
        <p class="text-body-2 text-medium-emphasis mb-4">
          {{ analysis.overall.message }}
        </p>

        <!-- Life Insurance Gap -->
        <div class="mb-4">
          <div class="d-flex align-center justify-space-between mb-1">
            <div class="d-flex align-center">
              <v-icon icon="mdi-heart-pulse" color="purple" size="20" class="mr-2" />
              <span class="font-weight-medium">Life Insurance</span>
            </div>
            <span class="text-body-2">
              {{ formatINRCompact(analysis.life.current) }} /
              {{ formatINRCompact(analysis.life.recommended) }}
            </span>
          </div>
          <v-progress-linear
            :model-value="analysis.life.percentage"
            :color="getProgressColor(analysis.life.percentage)"
            height="12"
            rounded
          >
            <template #default>
              <span class="text-caption font-weight-medium">
                {{ analysis.life.percentage.toFixed(0) }}%
              </span>
            </template>
          </v-progress-linear>
          <div v-if="analysis.life.gap > 0" class="text-caption text-error mt-1">
            Gap: {{ formatINRCompact(analysis.life.gap) }}
          </div>
        </div>

        <!-- Health Insurance Gap -->
        <div class="mb-4">
          <div class="d-flex align-center justify-space-between mb-1">
            <div class="d-flex align-center">
              <v-icon icon="mdi-hospital-box" color="blue" size="20" class="mr-2" />
              <span class="font-weight-medium">Health Insurance</span>
            </div>
            <span class="text-body-2">
              {{ formatINRCompact(analysis.health.current) }} /
              {{ formatINRCompact(analysis.health.recommended) }}
            </span>
          </div>
          <v-progress-linear
            :model-value="analysis.health.percentage"
            :color="getProgressColor(analysis.health.percentage)"
            height="12"
            rounded
          >
            <template #default>
              <span class="text-caption font-weight-medium">
                {{ analysis.health.percentage.toFixed(0) }}%
              </span>
            </template>
          </v-progress-linear>
          <div v-if="analysis.health.gap > 0" class="text-caption text-error mt-1">
            Gap: {{ formatINRCompact(analysis.health.gap) }}
          </div>
        </div>

        <!-- Life Insurance Breakdown (if gap exists) -->
        <v-expand-transition>
          <div v-if="analysis.life.gap > 0">
            <v-divider class="my-3" />
            <div class="text-subtitle-2 mb-2">Life Coverage Breakdown (HLV Method)</div>
            <div class="text-body-2">
              <div class="d-flex justify-space-between py-1">
                <span class="text-medium-emphasis">Income Replacement (15x)</span>
                <span>{{ formatINRCompact(analysis.life.breakdown.incomeReplacement) }}</span>
              </div>
              <div class="d-flex justify-space-between py-1">
                <span class="text-medium-emphasis">Outstanding Liabilities</span>
                <span>{{ formatINRCompact(analysis.life.breakdown.liabilities) }}</span>
              </div>
              <div class="d-flex justify-space-between py-1">
                <span class="text-medium-emphasis">Children's Future</span>
                <span>{{ formatINRCompact(analysis.life.breakdown.childrenFuture) }}</span>
              </div>
              <div class="d-flex justify-space-between py-1">
                <span class="text-medium-emphasis">Emergency Buffer</span>
                <span>{{ formatINRCompact(analysis.life.breakdown.emergencyBuffer) }}</span>
              </div>
            </div>
          </div>
        </v-expand-transition>
      </v-card-text>

      <v-divider />

      <v-card-actions>
        <v-btn variant="text" @click="emit('calculate')">
          <v-icon icon="mdi-refresh" class="mr-1" />
          Recalculate
        </v-btn>
        <v-spacer />
        <v-btn
          v-if="analysis.overall.status !== 'adequate'"
          color="primary"
          @click="emit('viewRecommendations')"
        >
          <v-icon icon="mdi-lightbulb-on" class="mr-1" />
          View Recommendations
        </v-btn>
      </v-card-actions>
    </v-card>
  </div>
</template>
