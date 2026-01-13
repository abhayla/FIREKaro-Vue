<script setup lang="ts">
import { ref } from 'vue'
import SectionHeader from '@/components/shared/SectionHeader.vue'
import InsuranceOverviewTab from '@/components/insurance/InsuranceOverviewTab.vue'
import InsuranceDetailsTab from '@/components/insurance/InsuranceDetailsTab.vue'
import InsuranceCalculatorTab from '@/components/insurance/InsuranceCalculatorTab.vue'
import InsuranceReportsTab from '@/components/insurance/InsuranceReportsTab.vue'
import InsurancePolicyForm from '@/components/insurance/InsurancePolicyForm.vue'
import CoverageAdequacyWizard from '@/components/insurance/CoverageAdequacyWizard.vue'
import {
  useInsurancePolicies,
  type InsurancePolicy,
  type InsuranceType,
  type CreatePolicyInput,
} from '@/composables/useInsurance'

// Tab state
const activeTab = ref('overview')
const activeSubTab = ref('life')

// Data for dialogs
const { coverageByType, createPolicy, updatePolicy, deletePolicy } = useInsurancePolicies()

// Dialog states
const showPolicyForm = ref(false)
const showCalculator = ref(false)
const editingPolicy = ref<InsurancePolicy | null>(null)
const preSelectedType = ref<InsuranceType | null>(null)

// Snackbar
const snackbar = ref({
  show: false,
  message: '',
  color: 'success',
})

const showMessage = (message: string, color = 'success') => {
  snackbar.value = { show: true, message, color }
}

// Navigation handlers
const handleGoToDetails = (subTab?: string) => {
  if (subTab) {
    activeSubTab.value = subTab
  }
  activeTab.value = 'details'
}

const handleOpenCalculator = () => {
  activeTab.value = 'calculator'
}

// Policy form handlers
const handleAddPolicy = (type?: InsuranceType) => {
  editingPolicy.value = null
  preSelectedType.value = type || null
  showPolicyForm.value = true
}

const handleEditPolicy = (policy: InsurancePolicy) => {
  editingPolicy.value = policy
  preSelectedType.value = null
  showPolicyForm.value = true
}

const handleSavePolicy = async (data: CreatePolicyInput) => {
  try {
    if (editingPolicy.value) {
      await updatePolicy.mutateAsync({ id: editingPolicy.value.id, ...data })
      showMessage('Policy updated successfully')
    } else {
      // If adding from a specific type tab, use that type
      const policyData = preSelectedType.value ? { ...data, type: preSelectedType.value } : data
      await createPolicy.mutateAsync(policyData)
      showMessage('Policy added successfully')
    }
    showPolicyForm.value = false
    editingPolicy.value = null
    preSelectedType.value = null
  } catch {
    showMessage('Failed to save policy', 'error')
  }
}

const handleDeletePolicy = async (policy: InsurancePolicy) => {
  if (confirm(`Are you sure you want to delete "${policy.policyName}"?`)) {
    try {
      await deletePolicy.mutateAsync(policy.id)
      showMessage('Policy deleted successfully')
    } catch {
      showMessage('Failed to delete policy', 'error')
    }
  }
}

// Calculator wizard handlers
const handleOpenWizard = () => {
  showCalculator.value = true
}

const handleCalculated = (result: unknown) => {
  console.log('Coverage calculated:', result)
}
</script>

<template>
  <div>
    <SectionHeader
      title="Insurance"
      subtitle="Insurance coverage analysis"
      icon="mdi-shield-check"
    />

    <!-- Tab Navigation -->
    <v-tabs v-model="activeTab" color="primary" density="compact" class="mb-4">
      <v-tab value="overview">Overview</v-tab>
      <v-tab value="details">Item Details</v-tab>
      <v-tab value="calculator">Calculator</v-tab>
      <v-tab value="reports">Reports</v-tab>
    </v-tabs>

    <!-- Tab Content -->
    <v-window v-model="activeTab">
      <!-- Overview Tab -->
      <v-window-item value="overview">
        <InsuranceOverviewTab
          @go-to-details="handleGoToDetails"
          @add-policy="handleAddPolicy()"
          @edit-policy="handleEditPolicy"
          @delete-policy="handleDeletePolicy"
          @open-calculator="handleOpenCalculator"
        />
      </v-window-item>

      <!-- Item Details Tab -->
      <v-window-item value="details">
        <InsuranceDetailsTab
          v-model:active-sub-tab="activeSubTab"
          @add-policy="handleAddPolicy"
          @edit-policy="handleEditPolicy"
          @delete-policy="handleDeletePolicy"
        />
      </v-window-item>

      <!-- Calculator Tab -->
      <v-window-item value="calculator">
        <InsuranceCalculatorTab
          @open-wizard="handleOpenWizard"
        />
      </v-window-item>

      <!-- Reports Tab -->
      <v-window-item value="reports">
        <InsuranceReportsTab />
      </v-window-item>
    </v-window>

    <!-- Policy Form Dialog -->
    <InsurancePolicyForm
      v-model="showPolicyForm"
      :policy="editingPolicy"
      :default-type="preSelectedType"
      @save="handleSavePolicy"
    />

    <!-- Coverage Calculator Wizard -->
    <CoverageAdequacyWizard
      v-model="showCalculator"
      :existing-life-cover="coverageByType?.life"
      :existing-health-cover="coverageByType?.health"
      @calculated="handleCalculated"
    />

    <!-- Snackbar -->
    <v-snackbar
      v-model="snackbar.show"
      :color="snackbar.color"
      :timeout="3000"
      location="bottom right"
    >
      {{ snackbar.message }}
      <template #actions>
        <v-btn variant="text" @click="snackbar.show = false">Close</v-btn>
      </template>
    </v-snackbar>
  </div>
</template>
