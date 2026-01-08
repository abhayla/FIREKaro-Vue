<script setup lang="ts">
import { computed } from 'vue'
import { useUiStore } from '@/stores/ui'
import { useUserStore } from '@/stores/user'

const uiStore = useUiStore()
const userStore = useUserStore()

const viewMode = computed({
  get: () => (uiStore.isFamilyView ? 'family' : 'personal'),
  set: (value: string) => {
    if (value === 'family' && !uiStore.isFamilyView) {
      uiStore.toggleFamilyView()
    } else if (value === 'personal' && uiStore.isFamilyView) {
      uiStore.toggleFamilyView()
    }
  },
})

const selectedMember = computed({
  get: () => uiStore.selectedFamilyMemberId ?? 'all',
  set: (value: string) => {
    uiStore.setSelectedFamilyMember(value === 'all' ? null : value)
  },
})
</script>

<template>
  <v-card variant="outlined" class="family-toggle pa-3">
    <div class="d-flex align-center gap-4 flex-wrap">
      <!-- View Mode Toggle -->
      <v-btn-toggle
        v-model="viewMode"
        mandatory
        density="compact"
        color="primary"
        variant="outlined"
      >
        <v-btn value="personal" size="small">
          <v-icon icon="mdi-account" class="mr-1" size="small" />
          Personal
        </v-btn>
        <v-btn value="family" size="small">
          <v-icon icon="mdi-account-group" class="mr-1" size="small" />
          Family
        </v-btn>
      </v-btn-toggle>

      <!-- Family Member Selector (when in family view) -->
      <v-select
        v-if="uiStore.isFamilyView"
        v-model="selectedMember"
        :items="[
          { title: 'All Members', value: 'all' },
          ...userStore.familyMembers.map((m) => ({
            title: m.name,
            value: m.id,
            subtitle: m.relationship,
          })),
        ]"
        item-title="title"
        item-value="value"
        label="View for"
        density="compact"
        variant="outlined"
        hide-details
        style="max-width: 200px"
      />
    </div>
  </v-card>
</template>

<style scoped>
.family-toggle {
  background: rgb(var(--v-theme-surface-variant));
}
</style>
