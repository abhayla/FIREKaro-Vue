<script setup lang="ts">
import { ref, computed } from 'vue'
import SectionHeader from '@/components/shared/SectionHeader.vue'
import InsurancePolicyCard from '@/components/protection/InsurancePolicyCard.vue'
import InsurancePolicyForm from '@/components/protection/InsurancePolicyForm.vue'
import {
  useInsurancePolicies,
  type InsurancePolicy,
  type CreatePolicyInput,
  type InsuranceType,
  formatINR,
  formatINRCompact,
  getInsuranceTypeIcon,
  getInsuranceTypeColor,
} from '@/composables/useProtection'

const tabs = [
  { title: 'Overview', route: '/dashboard/protection' },
  { title: 'Life', route: '/dashboard/protection/life' },
  { title: 'Health', route: '/dashboard/protection/health' },
  { title: 'Other', route: '/dashboard/protection/other' },
  { title: 'Calculator', route: '/dashboard/protection/calculator' },
  { title: 'Reports', route: '/dashboard/protection/reports' },
]

// Other insurance types
const otherTypes: InsuranceType[] = ['motor', 'home', 'travel']

// Fetch all policies and filter to other types
const { policies, isLoading, createPolicy, updatePolicy, deletePolicy } =
  useInsurancePolicies()

const otherPolicies = computed(
  () => policies.value?.filter((p) => otherTypes.includes(p.type)) || []
)
const activePolicies = computed(() =>
  otherPolicies.value.filter((p) => p.status === 'active')
)

// Group by type
const motorPolicies = computed(() =>
  activePolicies.value.filter((p) => p.type === 'motor')
)
const homePolicies = computed(() =>
  activePolicies.value.filter((p) => p.type === 'home')
)
const travelPolicies = computed(() =>
  activePolicies.value.filter((p) => p.type === 'travel')
)

// Summary stats
const totalCoverage = computed(() =>
  activePolicies.value.reduce((sum, p) => sum + p.sumAssured, 0)
)
const totalPremium = computed(() =>
  activePolicies.value.reduce((sum, p) => {
    const multiplier = { monthly: 12, quarterly: 4, 'half-yearly': 2, yearly: 1 }
    return sum + p.premium * multiplier[p.paymentFrequency]
  }, 0)
)

// Dialogs
const showPolicyForm = ref(false)
const editingPolicy = ref<InsurancePolicy | null>(null)
const selectedTypeFilter = ref<InsuranceType | 'all'>('all')

// Snackbar
const snackbar = ref({
  show: false,
  message: '',
  color: 'success',
})

const showMessage = (message: string, color = 'success') => {
  snackbar.value = { show: true, message, color }
}

// Policy actions
const openAddPolicy = (type?: InsuranceType) => {
  editingPolicy.value = null
  showPolicyForm.value = true
}

const openEditPolicy = (policy: InsurancePolicy) => {
  editingPolicy.value = policy
  showPolicyForm.value = true
}

const handleSavePolicy = async (data: CreatePolicyInput) => {
  try {
    if (editingPolicy.value) {
      await updatePolicy.mutateAsync({ id: editingPolicy.value.id, ...data })
      showMessage('Policy updated successfully')
    } else {
      await createPolicy.mutateAsync(data)
      showMessage('Policy added successfully')
    }
    showPolicyForm.value = false
    editingPolicy.value = null
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

const viewPolicy = (policy: InsurancePolicy) => {
  openEditPolicy(policy)
}

// Filter options
const typeFilters: { title: string; value: InsuranceType | 'all'; icon: string; color: string }[] = [
  { title: 'All', value: 'all', icon: 'mdi-filter-outline', color: 'primary' },
  { title: 'Motor', value: 'motor', icon: 'mdi-car', color: 'orange' },
  { title: 'Home', value: 'home', icon: 'mdi-home-outline', color: 'green' },
  { title: 'Travel', value: 'travel', icon: 'mdi-airplane', color: 'cyan' },
]

// Filtered policies based on selected type
const filteredPolicies = computed(() => {
  if (selectedTypeFilter.value === 'all') return activePolicies.value
  return activePolicies.value.filter((p) => p.type === selectedTypeFilter.value)
})
</script>

<template>
  <div>
    <SectionHeader
      title="Protection"
      subtitle="Motor, Home & Travel Insurance"
      icon="mdi-shield-check"
      :tabs="tabs"
    />

    <!-- Summary Stats -->
    <v-row class="mb-6">
      <v-col cols="12" sm="6" md="3">
        <v-card class="pa-4" variant="elevated">
          <div class="d-flex align-center">
            <v-avatar color="orange" size="40" class="mr-3">
              <v-icon icon="mdi-car" color="white" />
            </v-avatar>
            <div>
              <div class="text-body-2 text-medium-emphasis">Motor</div>
              <div class="text-h6 font-weight-bold">{{ motorPolicies.length }} policies</div>
            </div>
          </div>
        </v-card>
      </v-col>
      <v-col cols="12" sm="6" md="3">
        <v-card class="pa-4" variant="elevated">
          <div class="d-flex align-center">
            <v-avatar color="green" size="40" class="mr-3">
              <v-icon icon="mdi-home-outline" color="white" />
            </v-avatar>
            <div>
              <div class="text-body-2 text-medium-emphasis">Home</div>
              <div class="text-h6 font-weight-bold">{{ homePolicies.length }} policies</div>
            </div>
          </div>
        </v-card>
      </v-col>
      <v-col cols="12" sm="6" md="3">
        <v-card class="pa-4" variant="elevated">
          <div class="d-flex align-center">
            <v-avatar color="cyan" size="40" class="mr-3">
              <v-icon icon="mdi-airplane" color="white" />
            </v-avatar>
            <div>
              <div class="text-body-2 text-medium-emphasis">Travel</div>
              <div class="text-h6 font-weight-bold">{{ travelPolicies.length }} policies</div>
            </div>
          </div>
        </v-card>
      </v-col>
      <v-col cols="12" sm="6" md="3">
        <v-card class="pa-4">
          <v-btn color="primary" block size="large" @click="openAddPolicy()">
            <v-icon icon="mdi-plus" class="mr-2" />
            Add Policy
          </v-btn>
        </v-card>
      </v-col>
    </v-row>

    <!-- Total Coverage Summary -->
    <v-row v-if="activePolicies.length > 0" class="mb-6">
      <v-col cols="12" md="6">
        <v-card class="pa-4">
          <div class="text-body-2 text-medium-emphasis">Total Coverage</div>
          <div class="text-h4 font-weight-bold text-success">
            {{ formatINRCompact(totalCoverage) }}
          </div>
        </v-card>
      </v-col>
      <v-col cols="12" md="6">
        <v-card class="pa-4">
          <div class="text-body-2 text-medium-emphasis">Total Annual Premium</div>
          <div class="text-h4 font-weight-bold">{{ formatINR(totalPremium) }}</div>
        </v-card>
      </v-col>
    </v-row>

    <!-- Filter Buttons -->
    <div class="mb-4">
      <v-btn-toggle v-model="selectedTypeFilter" mandatory variant="outlined" divided>
        <v-btn
          v-for="filter in typeFilters"
          :key="filter.value"
          :value="filter.value"
          size="small"
        >
          <v-icon :icon="filter.icon" :color="selectedTypeFilter === filter.value ? filter.color : undefined" class="mr-1" size="18" />
          {{ filter.title }}
          <v-badge
            v-if="filter.value !== 'all'"
            :content="filter.value === 'motor' ? motorPolicies.length : filter.value === 'home' ? homePolicies.length : travelPolicies.length"
            :color="filter.color"
            inline
            class="ml-1"
          />
        </v-btn>
      </v-btn-toggle>
    </div>

    <!-- Loading State -->
    <div v-if="isLoading" class="text-center py-8">
      <v-progress-circular indeterminate color="primary" size="48" />
      <p class="mt-4 text-medium-emphasis">Loading policies...</p>
    </div>

    <template v-else>
      <!-- Empty State -->
      <v-card v-if="otherPolicies.length === 0" class="text-center pa-8">
        <v-icon icon="mdi-shield-car" size="80" color="orange" class="mb-4" />
        <h2 class="text-h5 mb-2">No Motor, Home or Travel Policies</h2>
        <p class="text-medium-emphasis mb-6">
          Add your vehicle, property, or travel insurance policies.
        </p>
        <div class="d-flex flex-wrap justify-center gap-3">
          <v-btn color="orange" @click="openAddPolicy('motor')">
            <v-icon icon="mdi-car" class="mr-2" />
            Add Motor Insurance
          </v-btn>
          <v-btn color="green" @click="openAddPolicy('home')">
            <v-icon icon="mdi-home" class="mr-2" />
            Add Home Insurance
          </v-btn>
          <v-btn color="cyan" @click="openAddPolicy('travel')">
            <v-icon icon="mdi-airplane" class="mr-2" />
            Add Travel Insurance
          </v-btn>
        </div>
      </v-card>

      <!-- Filtered Policies -->
      <template v-else>
        <div v-if="filteredPolicies.length === 0" class="text-center py-8">
          <v-icon icon="mdi-file-document-outline" size="48" color="grey" class="mb-2" />
          <p class="text-medium-emphasis">No {{ selectedTypeFilter }} policies found</p>
        </div>

        <v-row v-else>
          <v-col
            v-for="policy in filteredPolicies"
            :key="policy.id"
            cols="12"
            sm="6"
            lg="4"
          >
            <InsurancePolicyCard
              :policy="policy"
              @view="viewPolicy"
              @edit="openEditPolicy"
              @delete="handleDeletePolicy"
            />
          </v-col>
        </v-row>
      </template>
    </template>

    <!-- Policy Form Dialog -->
    <InsurancePolicyForm
      v-model="showPolicyForm"
      :policy="editingPolicy"
      @save="handleSavePolicy"
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
