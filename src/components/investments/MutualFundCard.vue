<script setup lang="ts">
import { computed } from 'vue'
import { formatINR, formatPercentage, type MutualFund } from '@/composables/useInvestments'

const props = defineProps<{
  fund: MutualFund
  showActions?: boolean
}>()

const emit = defineEmits<{
  edit: [fund: MutualFund]
  delete: [id: string]
}>()

const isProfit = computed(() => props.fund.pnl >= 0)

const categoryColor = computed(() => {
  const category = props.fund.category.toLowerCase()
  if (category.includes('equity')) return 'success'
  if (category.includes('debt')) return 'primary'
  if (category.includes('hybrid')) return 'warning'
  if (category.includes('gold')) return 'orange'
  return 'grey'
})

const categoryIcon = computed(() => {
  const category = props.fund.category.toLowerCase()
  if (category.includes('equity')) return 'mdi-trending-up'
  if (category.includes('debt')) return 'mdi-shield'
  if (category.includes('hybrid')) return 'mdi-scale-balance'
  if (category.includes('gold')) return 'mdi-gold'
  return 'mdi-chart-line'
})
</script>

<template>
  <v-card class="mutual-fund-card" variant="outlined">
    <v-card-text>
      <div class="d-flex align-start justify-space-between">
        <div class="d-flex align-center flex-grow-1" style="min-width: 0">
          <v-avatar :color="categoryColor" size="40" class="mr-3 flex-shrink-0">
            <v-icon :icon="categoryIcon" color="white" size="20" />
          </v-avatar>
          <div style="min-width: 0">
            <div class="text-subtitle-2 font-weight-medium text-truncate">{{ fund.schemeName }}</div>
            <div class="text-caption text-medium-emphasis">{{ fund.amcName }}</div>
          </div>
        </div>

        <v-menu v-if="showActions">
          <template #activator="{ props: menuProps }">
            <v-btn icon="mdi-dots-vertical" variant="text" size="small" v-bind="menuProps" />
          </template>
          <v-list density="compact">
            <v-list-item prepend-icon="mdi-pencil" title="Edit" @click="emit('edit', fund)" />
            <v-list-item
              prepend-icon="mdi-delete"
              title="Delete"
              class="text-error"
              @click="emit('delete', fund.id)"
            />
          </v-list>
        </v-menu>
      </div>

      <div class="d-flex gap-2 mt-2 flex-wrap">
        <v-chip :color="categoryColor" size="x-small" variant="tonal">
          {{ fund.category }}
        </v-chip>
        <v-chip v-if="fund.subCategory" size="x-small" variant="outlined">
          {{ fund.subCategory }}
        </v-chip>
        <v-chip v-if="fund.sipAmount" size="x-small" color="primary" variant="tonal">
          SIP: {{ formatINR(fund.sipAmount) }}
        </v-chip>
      </div>

      <v-divider class="my-3" />

      <v-row dense>
        <v-col cols="6">
          <div class="text-caption text-medium-emphasis">Units</div>
          <div class="text-body-2 font-weight-medium">{{ fund.units.toFixed(3) }}</div>
        </v-col>
        <v-col cols="6" class="text-right">
          <div class="text-caption text-medium-emphasis">NAV</div>
          <div class="text-body-2 font-weight-medium">₹{{ fund.nav.toFixed(2) }}</div>
        </v-col>
      </v-row>

      <v-row dense class="mt-2">
        <v-col cols="6">
          <div class="text-caption text-medium-emphasis">Avg NAV</div>
          <div class="text-body-2 font-weight-medium">₹{{ fund.averageNav.toFixed(2) }}</div>
        </v-col>
        <v-col cols="6" class="text-right">
          <div class="text-caption text-medium-emphasis">XIRR</div>
          <div
            v-if="fund.xirr !== undefined"
            class="text-body-2 font-weight-medium"
            :class="fund.xirr >= 0 ? 'text-success' : 'text-error'"
          >
            {{ formatPercentage(fund.xirr) }}
          </div>
          <div v-else class="text-body-2 text-medium-emphasis">-</div>
        </v-col>
      </v-row>

      <v-divider class="my-3" />

      <v-row dense>
        <v-col cols="6">
          <div class="text-caption text-medium-emphasis">Invested</div>
          <div class="text-body-1 font-weight-medium">{{ formatINR(fund.investedValue) }}</div>
        </v-col>
        <v-col cols="6" class="text-right">
          <div class="text-caption text-medium-emphasis">Current</div>
          <div class="text-body-1 font-weight-medium">{{ formatINR(fund.currentValue) }}</div>
        </v-col>
      </v-row>

      <v-card
        :color="isProfit ? 'success' : 'error'"
        variant="tonal"
        class="mt-3 pa-2 text-center"
      >
        <div class="text-caption">P&L</div>
        <div class="text-subtitle-1 font-weight-bold">
          {{ formatINR(fund.pnl) }}
          <span class="text-body-2">({{ formatPercentage(fund.pnlPercentage) }})</span>
        </div>
      </v-card>
    </v-card-text>
  </v-card>
</template>

<style scoped>
.mutual-fund-card {
  transition: transform 0.2s, box-shadow 0.2s;
}

.mutual-fund-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}
</style>
