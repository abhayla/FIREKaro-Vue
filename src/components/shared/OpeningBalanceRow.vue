<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    label?: string
    amount: number
    asOfDate?: string
    editable?: boolean
    loading?: boolean
  }>(),
  {
    label: 'Opening Balance',
    editable: false,
    loading: false,
  }
)

const emit = defineEmits<{
  (e: 'edit'): void
}>()

const formattedAmount = computed(() => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(props.amount)
})

const formattedDate = computed(() => {
  if (!props.asOfDate) return null
  return new Date(props.asOfDate).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
})
</script>

<template>
  <div class="opening-balance-row">
    <v-card variant="flat" class="opening-balance-card">
      <v-card-text class="d-flex align-center pa-3">
        <v-icon icon="mdi-arrow-right-bold-circle-outline" color="primary" class="mr-3" />
        <div class="flex-grow-1">
          <div class="text-caption text-medium-emphasis">{{ label }}</div>
          <div class="text-h6 font-weight-bold text-currency">
            <v-skeleton-loader v-if="loading" type="text" width="120" />
            <span v-else>{{ formattedAmount }}</span>
          </div>
          <div v-if="formattedDate" class="text-caption text-medium-emphasis">
            as of {{ formattedDate }}
          </div>
        </div>
        <v-btn
          v-if="editable && !loading"
          icon="mdi-pencil"
          size="small"
          variant="text"
          color="primary"
          @click="emit('edit')"
        />
      </v-card-text>
    </v-card>
  </div>
</template>

<style scoped>
.opening-balance-card {
  background: rgba(var(--v-theme-primary), 0.04);
  border: 1px dashed rgba(var(--v-theme-primary), 0.3);
  border-radius: 8px;
}
</style>
