<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { NetWorthHistoryPoint } from '@/composables/useFinancialHealth'
import { formatINR } from '@/composables/useFinancialHealth'

const props = withDefaults(defineProps<{
  data: NetWorthHistoryPoint[]
  height?: number
  showLegend?: boolean
}>(), {
  height: 300,
  showLegend: true
})

// Chart dimensions
const chartWidth = 600
const chartHeight = computed(() => props.height - 60)
const padding = { top: 20, right: 20, bottom: 40, left: 70 }

// Calculate chart data
const chartData = computed(() => {
  if (!props.data.length) return null

  const values = props.data.map(d => d.netWorth)
  const assetValues = props.data.map(d => d.assets)
  const liabilityValues = props.data.map(d => d.liabilities)

  const maxValue = Math.max(...assetValues, ...values) * 1.1
  const minValue = Math.min(...values, 0) * 1.1

  const xScale = (index: number) =>
    padding.left + (index / (props.data.length - 1)) * (chartWidth - padding.left - padding.right)

  const yScale = (value: number) =>
    padding.top + (1 - (value - minValue) / (maxValue - minValue)) * (chartHeight.value - padding.top - padding.bottom)

  // Generate path for net worth area
  const netWorthPath = props.data.map((d, i) => {
    const x = xScale(i)
    const y = yScale(d.netWorth)
    return `${i === 0 ? 'M' : 'L'} ${x} ${y}`
  }).join(' ')

  const netWorthAreaPath = netWorthPath +
    ` L ${xScale(props.data.length - 1)} ${yScale(0)}` +
    ` L ${xScale(0)} ${yScale(0)} Z`

  // Generate asset line
  const assetsPath = props.data.map((d, i) => {
    const x = xScale(i)
    const y = yScale(d.assets)
    return `${i === 0 ? 'M' : 'L'} ${x} ${y}`
  }).join(' ')

  // Generate liability line
  const liabilitiesPath = props.data.map((d, i) => {
    const x = xScale(i)
    const y = yScale(d.liabilities)
    return `${i === 0 ? 'M' : 'L'} ${x} ${y}`
  }).join(' ')

  // Y-axis ticks
  const yTicks = []
  const tickCount = 5
  for (let i = 0; i <= tickCount; i++) {
    const value = minValue + (maxValue - minValue) * (i / tickCount)
    yTicks.push({
      value,
      y: yScale(value),
      label: formatINR(value, true)
    })
  }

  // X-axis labels
  const xLabels = props.data.map((d, i) => ({
    x: xScale(i),
    label: new Date(d.date).toLocaleDateString('en-IN', { month: 'short' })
  }))

  // Data points for hover
  const points = props.data.map((d, i) => ({
    x: xScale(i),
    yNetWorth: yScale(d.netWorth),
    yAssets: yScale(d.assets),
    yLiabilities: yScale(d.liabilities),
    data: d
  }))

  return {
    netWorthPath,
    netWorthAreaPath,
    assetsPath,
    liabilitiesPath,
    yTicks,
    xLabels,
    points,
    zeroY: yScale(0)
  }
})

const hoveredPoint = ref<number | null>(null)

const tooltipData = computed(() => {
  if (hoveredPoint.value === null || !chartData.value) return null
  return chartData.value.points[hoveredPoint.value]
})
</script>

<template>
  <div class="net-worth-chart">
    <svg
      :viewBox="`0 0 ${chartWidth} ${height}`"
      preserveAspectRatio="xMidYMid meet"
      class="chart-svg"
    >
      <!-- Grid lines -->
      <g class="grid-lines">
        <line
          v-for="tick in chartData?.yTicks"
          :key="tick.value"
          :x1="padding.left"
          :x2="chartWidth - padding.right"
          :y1="tick.y"
          :y2="tick.y"
          stroke="currentColor"
          stroke-opacity="0.1"
        />
      </g>

      <!-- Zero line -->
      <line
        v-if="chartData"
        :x1="padding.left"
        :x2="chartWidth - padding.right"
        :y1="chartData.zeroY"
        :y2="chartData.zeroY"
        stroke="currentColor"
        stroke-opacity="0.3"
        stroke-dasharray="4,4"
      />

      <!-- Net worth area -->
      <path
        v-if="chartData"
        :d="chartData.netWorthAreaPath"
        fill="rgb(var(--v-theme-primary))"
        fill-opacity="0.1"
      />

      <!-- Net worth line -->
      <path
        v-if="chartData"
        :d="chartData.netWorthPath"
        fill="none"
        stroke="rgb(var(--v-theme-primary))"
        stroke-width="3"
        stroke-linecap="round"
        stroke-linejoin="round"
      />

      <!-- Assets line -->
      <path
        v-if="chartData"
        :d="chartData.assetsPath"
        fill="none"
        stroke="rgb(var(--v-theme-success))"
        stroke-width="2"
        stroke-dasharray="6,3"
        stroke-linecap="round"
      />

      <!-- Liabilities line -->
      <path
        v-if="chartData"
        :d="chartData.liabilitiesPath"
        fill="none"
        stroke="rgb(var(--v-theme-error))"
        stroke-width="2"
        stroke-dasharray="6,3"
        stroke-linecap="round"
      />

      <!-- Y-axis labels -->
      <g class="y-axis">
        <text
          v-for="tick in chartData?.yTicks"
          :key="tick.value"
          :x="padding.left - 8"
          :y="tick.y"
          text-anchor="end"
          dominant-baseline="middle"
          class="axis-label"
        >
          {{ tick.label }}
        </text>
      </g>

      <!-- X-axis labels -->
      <g class="x-axis">
        <text
          v-for="(label, i) in chartData?.xLabels"
          :key="i"
          :x="label.x"
          :y="height - 10"
          text-anchor="middle"
          class="axis-label"
        >
          {{ label.label }}
        </text>
      </g>

      <!-- Interactive points -->
      <g class="data-points">
        <circle
          v-for="(point, i) in chartData?.points"
          :key="i"
          :cx="point.x"
          :cy="point.yNetWorth"
          r="20"
          fill="transparent"
          @mouseenter="hoveredPoint = i"
          @mouseleave="hoveredPoint = null"
        />
        <circle
          v-for="(point, i) in chartData?.points"
          :key="`dot-${i}`"
          :cx="point.x"
          :cy="point.yNetWorth"
          r="5"
          fill="rgb(var(--v-theme-primary))"
          :opacity="hoveredPoint === i ? 1 : 0"
        />
      </g>
    </svg>

    <!-- Legend -->
    <div v-if="showLegend" class="chart-legend d-flex justify-center ga-4 mt-2">
      <div class="d-flex align-center">
        <div class="legend-line legend-networth mr-2" />
        <span class="text-caption">Net Worth</span>
      </div>
      <div class="d-flex align-center">
        <div class="legend-line legend-assets mr-2" />
        <span class="text-caption">Assets</span>
      </div>
      <div class="d-flex align-center">
        <div class="legend-line legend-liabilities mr-2" />
        <span class="text-caption">Liabilities</span>
      </div>
    </div>

    <!-- Tooltip -->
    <v-fade-transition>
      <v-card
        v-if="tooltipData"
        class="chart-tooltip"
        :style="{
          left: `${tooltipData.x}px`,
          top: `${tooltipData.yNetWorth - 10}px`
        }"
        elevation="4"
      >
        <v-card-text class="pa-2">
          <div class="text-caption text-medium-emphasis mb-1">
            {{ new Date(tooltipData.data.date).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' }) }}
          </div>
          <div class="text-body-2">
            <div class="d-flex justify-space-between">
              <span>Net Worth:</span>
              <strong class="text-primary ml-2">{{ formatINR(tooltipData.data.netWorth, true) }}</strong>
            </div>
            <div class="d-flex justify-space-between">
              <span>Assets:</span>
              <span class="text-success ml-2">{{ formatINR(tooltipData.data.assets, true) }}</span>
            </div>
            <div class="d-flex justify-space-between">
              <span>Liabilities:</span>
              <span class="text-error ml-2">{{ formatINR(tooltipData.data.liabilities, true) }}</span>
            </div>
          </div>
        </v-card-text>
      </v-card>
    </v-fade-transition>
  </div>
</template>

<style scoped>
.net-worth-chart {
  position: relative;
  width: 100%;
}

.chart-svg {
  width: 100%;
  height: auto;
}

.axis-label {
  font-size: 11px;
  fill: rgba(var(--v-theme-on-surface), 0.6);
}

.legend-line {
  width: 24px;
  height: 3px;
  border-radius: 2px;
}

.legend-networth {
  background: rgb(var(--v-theme-primary));
}

.legend-assets {
  background: rgb(var(--v-theme-success));
  background: repeating-linear-gradient(
    90deg,
    rgb(var(--v-theme-success)),
    rgb(var(--v-theme-success)) 6px,
    transparent 6px,
    transparent 9px
  );
}

.legend-liabilities {
  background: rgb(var(--v-theme-error));
  background: repeating-linear-gradient(
    90deg,
    rgb(var(--v-theme-error)),
    rgb(var(--v-theme-error)) 6px,
    transparent 6px,
    transparent 9px
  );
}

.chart-tooltip {
  position: absolute;
  transform: translate(-50%, -100%);
  pointer-events: none;
  z-index: 10;
  min-width: 160px;
}
</style>
