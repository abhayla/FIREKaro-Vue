<script setup lang="ts">
import { computed } from 'vue'
import PolicyTypeSubTab from '@/components/insurance/PolicyTypeSubTab.vue'
import {
  type InsurancePolicy,
  type InsuranceType,
  getInsuranceTypeIcon,
  getInsuranceTypeColor,
} from '@/composables/useInsurance'

const props = defineProps<{
  activeSubTab: string
}>()

const emit = defineEmits<{
  'update:active-sub-tab': [value: string]
  'add-policy': [type: InsuranceType]
  'edit-policy': [policy: InsurancePolicy]
  'delete-policy': [policy: InsurancePolicy]
}>()

// Sub-tab definitions
const subTabs = [
  { value: 'life', label: 'Life', icon: getInsuranceTypeIcon('life'), color: getInsuranceTypeColor('life') },
  { value: 'health', label: 'Health', icon: getInsuranceTypeIcon('health'), color: getInsuranceTypeColor('health') },
  { value: 'motor', label: 'Motor', icon: getInsuranceTypeIcon('motor'), color: getInsuranceTypeColor('motor') },
  { value: 'home', label: 'Home', icon: getInsuranceTypeIcon('home'), color: getInsuranceTypeColor('home') },
  { value: 'travel', label: 'Travel', icon: getInsuranceTypeIcon('travel'), color: getInsuranceTypeColor('travel') },
]

// Local tab state synced with parent
const localActiveTab = computed({
  get: () => props.activeSubTab,
  set: (value: string) => emit('update:active-sub-tab', value),
})

// Event handlers - bubble up to parent
const handleAddPolicy = (type: InsuranceType) => {
  emit('add-policy', type)
}

const handleEditPolicy = (policy: InsurancePolicy) => {
  emit('edit-policy', policy)
}

const handleDeletePolicy = (policy: InsurancePolicy) => {
  emit('delete-policy', policy)
}
</script>

<template>
  <div>
    <!-- Sub-tabs for insurance types -->
    <v-tabs
      v-model="localActiveTab"
      density="compact"
      color="primary"
      class="mb-2"
    >
      <v-tab
        v-for="tab in subTabs"
        :key="tab.value"
        :value="tab.value"
      >
        <v-icon :icon="tab.icon" :color="localActiveTab === tab.value ? tab.color : undefined" class="mr-2" size="small" />
        {{ tab.label }}
      </v-tab>
    </v-tabs>

    <v-divider />

    <!-- Sub-tab content -->
    <v-window v-model="localActiveTab">
      <v-window-item
        v-for="tab in subTabs"
        :key="tab.value"
        :value="tab.value"
      >
        <PolicyTypeSubTab
          :type="(tab.value as InsuranceType)"
          @add-policy="handleAddPolicy"
          @edit-policy="handleEditPolicy"
          @delete-policy="handleDeletePolicy"
        />
      </v-window-item>
    </v-window>
  </div>
</template>
