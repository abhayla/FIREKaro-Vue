<script setup lang="ts">
import { computed } from 'vue'
import type { AssetCategory, LiabilityCategory } from '@/composables/useFinancialHealth'
import { formatINR } from '@/composables/useFinancialHealth'

const props = defineProps<{
  assets: AssetCategory[]
  liabilities: LiabilityCategory[]
  totalAssets: number
  totalLiabilities: number
  netWorth: number
}>()

// Default colors for categories
const defaultAssetColors = ['#4CAF50', '#2196F3', '#9C27B0', '#FF9800', '#00BCD4', '#E91E63']
const defaultLiabilityColors = ['#F44336', '#FF5722', '#795548', '#9E9E9E']

const assetsWithColors = computed(() =>
  props.assets.map((a, i) => ({
    ...a,
    color: a.color || defaultAssetColors[i % defaultAssetColors.length]
  }))
)

const liabilitiesWithColors = computed(() =>
  props.liabilities.map((l, i) => ({
    ...l,
    color: l.color || defaultLiabilityColors[i % defaultLiabilityColors.length]
  }))
)
</script>

<template>
  <v-card variant="outlined">
    <v-card-title class="d-flex align-center">
      <v-icon icon="mdi-chart-pie" class="mr-2" />
      Net Worth Breakdown
    </v-card-title>

    <v-card-text>
      <v-row>
        <!-- Assets Column -->
        <v-col cols="12" md="6">
          <div class="d-flex align-center justify-space-between mb-3">
            <span class="text-subtitle-1 font-weight-medium text-success">
              <v-icon icon="mdi-arrow-up-bold" size="small" class="mr-1" />
              Assets
            </span>
            <span class="text-h6 font-weight-bold text-success">
              {{ formatINR(totalAssets, true) }}
            </span>
          </div>

          <div class="asset-list">
            <div
              v-for="asset in assetsWithColors"
              :key="asset.category"
              class="breakdown-item mb-3"
            >
              <div class="d-flex align-center justify-space-between mb-1">
                <div class="d-flex align-center">
                  <div
                    class="color-dot mr-2"
                    :style="{ backgroundColor: asset.color }"
                  />
                  <span class="text-body-2">{{ asset.category }}</span>
                </div>
                <span class="text-body-2 font-weight-medium">
                  {{ formatINR(asset.amount, true) }}
                </span>
              </div>
              <v-progress-linear
                :model-value="asset.percentage"
                :color="asset.color"
                height="6"
                rounded
              />
              <div class="text-caption text-medium-emphasis text-right mt-1">
                {{ asset.percentage.toFixed(1) }}%
              </div>
            </div>
          </div>
        </v-col>

        <!-- Liabilities Column -->
        <v-col cols="12" md="6">
          <div class="d-flex align-center justify-space-between mb-3">
            <span class="text-subtitle-1 font-weight-medium text-error">
              <v-icon icon="mdi-arrow-down-bold" size="small" class="mr-1" />
              Liabilities
            </span>
            <span class="text-h6 font-weight-bold text-error">
              {{ formatINR(totalLiabilities, true) }}
            </span>
          </div>

          <div class="liability-list">
            <div
              v-for="liability in liabilitiesWithColors"
              :key="liability.category"
              class="breakdown-item mb-3"
            >
              <div class="d-flex align-center justify-space-between mb-1">
                <div class="d-flex align-center">
                  <div
                    class="color-dot mr-2"
                    :style="{ backgroundColor: liability.color }"
                  />
                  <span class="text-body-2">{{ liability.category }}</span>
                </div>
                <span class="text-body-2 font-weight-medium">
                  {{ formatINR(liability.amount, true) }}
                </span>
              </div>
              <v-progress-linear
                :model-value="liability.percentage"
                :color="liability.color"
                height="6"
                rounded
              />
              <div class="text-caption text-medium-emphasis text-right mt-1">
                {{ liability.percentage.toFixed(1) }}%
              </div>
            </div>

            <v-alert
              v-if="liabilities.length === 0"
              type="success"
              variant="tonal"
              density="compact"
            >
              <v-icon icon="mdi-party-popper" class="mr-2" />
              No liabilities - debt free!
            </v-alert>
          </div>
        </v-col>
      </v-row>

      <!-- Net Worth Summary -->
      <v-divider class="my-4" />

      <div class="d-flex align-center justify-space-between">
        <span class="text-h6">Net Worth</span>
        <span
          class="text-h5 font-weight-bold"
          :class="netWorth >= 0 ? 'text-primary' : 'text-error'"
        >
          {{ formatINR(netWorth, true) }}
        </span>
      </div>
    </v-card-text>
  </v-card>
</template>

<style scoped>
.color-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
}

.breakdown-item {
  padding: 8px 0;
}
</style>
