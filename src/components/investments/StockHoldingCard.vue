<script setup lang="ts">
import { computed } from 'vue'
import { formatINR, formatPercentage, type StockHolding } from '@/composables/useInvestments'

const props = defineProps<{
  stock: StockHolding
  showActions?: boolean
}>()

const emit = defineEmits<{
  edit: [stock: StockHolding]
  delete: [id: string]
}>()

const isProfit = computed(() => props.stock.pnl >= 0)
const isDayPositive = computed(() => props.stock.dayChange >= 0)
</script>

<template>
  <v-card class="stock-holding-card" variant="outlined">
    <v-card-text>
      <div class="d-flex align-start justify-space-between">
        <div class="d-flex align-center">
          <v-avatar color="primary" size="40" class="mr-3">
            <span class="text-body-2 font-weight-bold">{{ stock.symbol.slice(0, 2) }}</span>
          </v-avatar>
          <div>
            <div class="text-subtitle-1 font-weight-medium">{{ stock.symbol }}</div>
            <div class="text-caption text-medium-emphasis">{{ stock.name }}</div>
          </div>
        </div>

        <div class="d-flex align-center gap-2">
          <v-chip
            :color="stock.exchange === 'NSE' ? 'primary' : 'orange'"
            size="x-small"
            variant="tonal"
          >
            {{ stock.exchange }}
          </v-chip>
          <v-menu v-if="showActions">
            <template #activator="{ props: menuProps }">
              <v-btn icon="mdi-dots-vertical" variant="text" size="small" v-bind="menuProps" />
            </template>
            <v-list density="compact">
              <v-list-item prepend-icon="mdi-pencil" title="Edit" @click="emit('edit', stock)" />
              <v-list-item
                prepend-icon="mdi-delete"
                title="Delete"
                class="text-error"
                @click="emit('delete', stock.id)"
              />
            </v-list>
          </v-menu>
        </div>
      </div>

      <v-divider class="my-3" />

      <v-row dense>
        <v-col cols="6">
          <div class="text-caption text-medium-emphasis">Qty</div>
          <div class="text-body-2 font-weight-medium">{{ stock.quantity }}</div>
        </v-col>
        <v-col cols="6" class="text-right">
          <div class="text-caption text-medium-emphasis">Avg Price</div>
          <div class="text-body-2 font-weight-medium">{{ formatINR(stock.averagePrice) }}</div>
        </v-col>
      </v-row>

      <v-row dense class="mt-2">
        <v-col cols="6">
          <div class="text-caption text-medium-emphasis">LTP</div>
          <div class="text-body-2 font-weight-medium">
            {{ formatINR(stock.currentPrice) }}
            <v-chip
              :color="isDayPositive ? 'success' : 'error'"
              size="x-small"
              variant="tonal"
              class="ml-1"
            >
              {{ formatPercentage(stock.dayChangePercentage) }}
            </v-chip>
          </div>
        </v-col>
        <v-col cols="6" class="text-right">
          <div class="text-caption text-medium-emphasis">Day Change</div>
          <div
            class="text-body-2 font-weight-medium"
            :class="isDayPositive ? 'text-success' : 'text-error'"
          >
            {{ formatINR(stock.dayChange * stock.quantity) }}
          </div>
        </v-col>
      </v-row>

      <v-divider class="my-3" />

      <v-row dense>
        <v-col cols="6">
          <div class="text-caption text-medium-emphasis">Invested</div>
          <div class="text-body-1 font-weight-medium">{{ formatINR(stock.investedValue) }}</div>
        </v-col>
        <v-col cols="6" class="text-right">
          <div class="text-caption text-medium-emphasis">Current</div>
          <div class="text-body-1 font-weight-medium">{{ formatINR(stock.currentValue) }}</div>
        </v-col>
      </v-row>

      <v-card
        :color="isProfit ? 'success' : 'error'"
        variant="tonal"
        class="mt-3 pa-2 text-center"
      >
        <div class="text-caption">P&L</div>
        <div class="text-subtitle-1 font-weight-bold">
          {{ formatINR(stock.pnl) }}
          <span class="text-body-2">({{ formatPercentage(stock.pnlPercentage) }})</span>
        </div>
      </v-card>
    </v-card-text>
  </v-card>
</template>

<style scoped>
.stock-holding-card {
  transition: transform 0.2s, box-shadow 0.2s;
}

.stock-holding-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}
</style>
