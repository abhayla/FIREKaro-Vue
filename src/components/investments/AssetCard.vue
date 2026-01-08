<script setup lang="ts">
import { computed } from 'vue'
import { formatINR, formatPercentage } from '@/composables/useInvestments'

interface Asset {
  id: string
  name: string
  type: string
  currentValue: number
  investedAmount: number
  category?: string
  icon?: string
}

const props = defineProps<{
  asset: Asset
  showActions?: boolean
}>()

const emit = defineEmits<{
  edit: [asset: Asset]
  delete: [id: string]
}>()

const pnl = computed(() => props.asset.currentValue - props.asset.investedAmount)
const pnlPercentage = computed(() =>
  props.asset.investedAmount > 0
    ? ((props.asset.currentValue - props.asset.investedAmount) / props.asset.investedAmount) * 100
    : 0
)
const isProfit = computed(() => pnl.value >= 0)

const typeIcon = computed(() => {
  if (props.asset.icon) return props.asset.icon
  const iconMap: Record<string, string> = {
    stock: 'mdi-chart-line',
    mutual_fund: 'mdi-chart-areaspline',
    fd: 'mdi-bank',
    bond: 'mdi-certificate',
    gold: 'mdi-gold',
    real_estate: 'mdi-home-city',
    epf: 'mdi-briefcase',
    ppf: 'mdi-piggy-bank',
    nps: 'mdi-account-cash',
    other: 'mdi-cash-multiple'
  }
  return iconMap[props.asset.type] || 'mdi-cash-multiple'
})

const typeColor = computed(() => {
  const colorMap: Record<string, string> = {
    stock: 'success',
    mutual_fund: 'primary',
    fd: 'info',
    bond: 'info',
    gold: 'warning',
    real_estate: 'purple',
    epf: 'teal',
    ppf: 'teal',
    nps: 'orange',
    other: 'grey'
  }
  return colorMap[props.asset.type] || 'grey'
})
</script>

<template>
  <v-card class="asset-card" variant="outlined">
    <v-card-text>
      <div class="d-flex align-start justify-space-between">
        <div class="d-flex align-center">
          <v-avatar :color="typeColor" size="40" class="mr-3">
            <v-icon :icon="typeIcon" color="white" size="20" />
          </v-avatar>
          <div>
            <div class="text-subtitle-1 font-weight-medium">{{ asset.name }}</div>
            <v-chip size="x-small" variant="tonal" :color="typeColor" class="mt-1">
              {{ asset.type.replace('_', ' ').toUpperCase() }}
            </v-chip>
          </div>
        </div>

        <v-menu v-if="showActions">
          <template #activator="{ props: menuProps }">
            <v-btn icon="mdi-dots-vertical" variant="text" size="small" v-bind="menuProps" />
          </template>
          <v-list density="compact">
            <v-list-item prepend-icon="mdi-pencil" title="Edit" @click="emit('edit', asset)" />
            <v-list-item
              prepend-icon="mdi-delete"
              title="Delete"
              class="text-error"
              @click="emit('delete', asset.id)"
            />
          </v-list>
        </v-menu>
      </div>

      <v-divider class="my-3" />

      <div class="d-flex justify-space-between align-end">
        <div>
          <div class="text-caption text-medium-emphasis">Current Value</div>
          <div class="text-h6 font-weight-bold">{{ formatINR(asset.currentValue) }}</div>
        </div>
        <div class="text-right">
          <div class="text-caption text-medium-emphasis">P&L</div>
          <div
            class="text-subtitle-1 font-weight-medium"
            :class="isProfit ? 'text-success' : 'text-error'"
          >
            {{ formatINR(pnl) }}
            <span class="text-caption">({{ formatPercentage(pnlPercentage) }})</span>
          </div>
        </div>
      </div>

      <v-progress-linear
        :model-value="100"
        :color="isProfit ? 'success' : 'error'"
        height="4"
        rounded
        class="mt-3"
      />
    </v-card-text>
  </v-card>
</template>

<style scoped>
.asset-card {
  transition: transform 0.2s, box-shadow 0.2s;
}

.asset-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}
</style>
