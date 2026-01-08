<script setup lang="ts">
import { computed } from 'vue'
import { formatINR, formatINRCompact, formatPercentage, type Property } from '@/composables/useInvestments'

const props = defineProps<{
  property: Property
  showActions?: boolean
}>()

const emit = defineEmits<{
  edit: [property: Property]
  delete: [id: string]
}>()

const isProfit = computed(() => props.property.appreciation >= 0)

const typeIcon = computed(() => {
  const iconMap: Record<string, string> = {
    residential: 'mdi-home',
    commercial: 'mdi-office-building',
    land: 'mdi-terrain',
    other: 'mdi-home-city'
  }
  return iconMap[props.property.type] || 'mdi-home-city'
})

const typeColor = computed(() => {
  const colorMap: Record<string, string> = {
    residential: 'primary',
    commercial: 'success',
    land: 'warning',
    other: 'grey'
  }
  return colorMap[props.property.type] || 'grey'
})

const netEquity = computed(() =>
  props.property.currentValue - (props.property.loanOutstanding ?? 0)
)

const rentalYield = computed(() => {
  if (!props.property.rentalIncome || props.property.currentValue === 0) return 0
  return (props.property.rentalIncome * 12 / props.property.currentValue) * 100
})
</script>

<template>
  <v-card class="property-card" variant="outlined">
    <v-card-text>
      <div class="d-flex align-start justify-space-between">
        <div class="d-flex align-center">
          <v-avatar :color="typeColor" size="48" class="mr-3">
            <v-icon :icon="typeIcon" color="white" size="24" />
          </v-avatar>
          <div>
            <div class="text-subtitle-1 font-weight-medium">{{ property.name }}</div>
            <div class="text-caption text-medium-emphasis">{{ property.address }}</div>
          </div>
        </div>

        <div class="d-flex align-center gap-2">
          <v-chip :color="typeColor" size="small" variant="tonal" class="text-capitalize">
            {{ property.type }}
          </v-chip>
          <v-menu v-if="showActions">
            <template #activator="{ props: menuProps }">
              <v-btn icon="mdi-dots-vertical" variant="text" size="small" v-bind="menuProps" />
            </template>
            <v-list density="compact">
              <v-list-item prepend-icon="mdi-pencil" title="Edit" @click="emit('edit', property)" />
              <v-list-item
                prepend-icon="mdi-delete"
                title="Delete"
                class="text-error"
                @click="emit('delete', property.id)"
              />
            </v-list>
          </v-menu>
        </div>
      </div>

      <v-divider class="my-3" />

      <v-row dense>
        <v-col cols="6">
          <div class="text-caption text-medium-emphasis">Purchase Price</div>
          <div class="text-body-2 font-weight-medium">{{ formatINRCompact(property.purchasePrice) }}</div>
        </v-col>
        <v-col cols="6" class="text-right">
          <div class="text-caption text-medium-emphasis">Purchase Date</div>
          <div class="text-body-2 font-weight-medium">
            {{ new Date(property.purchaseDate).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }) }}
          </div>
        </v-col>
      </v-row>

      <v-row dense class="mt-2">
        <v-col cols="6">
          <div class="text-caption text-medium-emphasis">Registration + Stamp</div>
          <div class="text-body-2 font-weight-medium">
            {{ formatINRCompact(property.registrationCost + property.stampDuty) }}
          </div>
        </v-col>
        <v-col cols="6" class="text-right">
          <div class="text-caption text-medium-emphasis">Total Cost</div>
          <div class="text-body-2 font-weight-medium">
            {{ formatINRCompact(property.purchasePrice + property.registrationCost + property.stampDuty) }}
          </div>
        </v-col>
      </v-row>

      <v-divider class="my-3" />

      <v-row dense>
        <v-col cols="6">
          <div class="text-caption text-medium-emphasis">Current Value</div>
          <div class="text-h6 font-weight-bold text-primary">
            {{ formatINRCompact(property.currentValue) }}
          </div>
        </v-col>
        <v-col cols="6" class="text-right">
          <div class="text-caption text-medium-emphasis">Appreciation</div>
          <div
            class="text-h6 font-weight-bold"
            :class="isProfit ? 'text-success' : 'text-error'"
          >
            {{ formatPercentage(property.appreciationPercentage) }}
          </div>
        </v-col>
      </v-row>

      <template v-if="property.loanOutstanding || property.rentalIncome">
        <v-divider class="my-3" />

        <v-row dense>
          <v-col v-if="property.loanOutstanding" cols="6">
            <div class="text-caption text-medium-emphasis">Loan Outstanding</div>
            <div class="text-body-2 font-weight-medium text-error">
              {{ formatINRCompact(property.loanOutstanding) }}
            </div>
          </v-col>
          <v-col v-if="property.rentalIncome" cols="6" :class="property.loanOutstanding ? 'text-right' : ''">
            <div class="text-caption text-medium-emphasis">Monthly Rent</div>
            <div class="text-body-2 font-weight-medium text-success">
              {{ formatINR(property.rentalIncome) }}
            </div>
          </v-col>
        </v-row>

        <v-row dense class="mt-2" v-if="property.loanOutstanding || property.rentalIncome">
          <v-col cols="6">
            <div class="text-caption text-medium-emphasis">Net Equity</div>
            <div class="text-body-1 font-weight-bold">
              {{ formatINRCompact(netEquity) }}
            </div>
          </v-col>
          <v-col v-if="property.rentalIncome" cols="6" class="text-right">
            <div class="text-caption text-medium-emphasis">Rental Yield</div>
            <div class="text-body-1 font-weight-medium text-success">
              {{ rentalYield.toFixed(1) }}% p.a.
            </div>
          </v-col>
        </v-row>
      </template>

      <v-card
        :color="isProfit ? 'success' : 'error'"
        variant="tonal"
        class="mt-3 pa-2 text-center"
      >
        <div class="text-caption">Total Gain</div>
        <div class="text-subtitle-1 font-weight-bold">
          {{ formatINRCompact(property.appreciation) }}
        </div>
      </v-card>
    </v-card-text>
  </v-card>
</template>

<style scoped>
.property-card {
  transition: transform 0.2s, box-shadow 0.2s;
}

.property-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}
</style>
