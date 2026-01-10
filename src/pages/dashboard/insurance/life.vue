<script setup lang="ts">
import { ref, computed } from 'vue'
import SectionHeader from '@/components/shared/SectionHeader.vue'
import InsurancePolicyCard from '@/components/insurance/InsurancePolicyCard.vue'
import InsurancePolicyForm from '@/components/insurance/InsurancePolicyForm.vue'
import {
  useInsurancePolicies,
  type InsurancePolicy,
  type CreatePolicyInput,
  formatINR,
  formatINRCompact,
} from '@/composables/useInsurance'

const tabs = [
  { title: 'Overview', route: '/dashboard/insurance' },
  { title: 'Life', route: '/dashboard/insurance/life' },
  { title: 'Health', route: '/dashboard/insurance/health' },
  { title: 'Other', route: '/dashboard/insurance/other' },
  { title: 'Calculator', route: '/dashboard/insurance/calculator' },
  { title: 'Reports', route: '/dashboard/insurance/reports' },
]

// Fetch life insurance policies
const { policies, isLoading, createPolicy, updatePolicy, deletePolicy } =
  useInsurancePolicies(ref('life'))

// Filter to only life insurance
const lifePolicies = computed(() => policies.value?.filter((p) => p.type === 'life') || [])
const activePolicies = computed(() => lifePolicies.value.filter((p) => p.status === 'active'))
const expiredPolicies = computed(() => lifePolicies.value.filter((p) => p.status !== 'active'))

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
const showExpired = ref(false)

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
const openAddPolicy = () => {
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
      await createPolicy.mutateAsync({ ...data, type: 'life' })
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

// View policy details
const viewPolicy = (policy: InsurancePolicy) => {
  // For now, just open edit dialog
  openEditPolicy(policy)
}
</script>

<template>
  <div>
    <SectionHeader
      title="Insurance"
      subtitle="Life Insurance Policies"
      icon="mdi-shield-check"
      :tabs="tabs"
    />

    <!-- Summary Stats -->
    <v-row class="mb-6">
      <v-col cols="12" sm="6" md="3">
        <v-card class="pa-4" variant="elevated">
          <div class="d-flex align-center">
            <v-avatar color="purple" size="40" class="mr-3">
              <v-icon icon="mdi-heart-pulse" color="white" />
            </v-avatar>
            <div>
              <div class="text-body-2 text-medium-emphasis">Total Coverage</div>
              <div class="text-h6 font-weight-bold text-success">
                {{ formatINRCompact(totalCoverage) }}
              </div>
            </div>
          </div>
        </v-card>
      </v-col>
      <v-col cols="12" sm="6" md="3">
        <v-card class="pa-4" variant="elevated">
          <div class="d-flex align-center">
            <v-avatar color="orange" size="40" class="mr-3">
              <v-icon icon="mdi-cash" color="white" />
            </v-avatar>
            <div>
              <div class="text-body-2 text-medium-emphasis">Annual Premium</div>
              <div class="text-h6 font-weight-bold">{{ formatINR(totalPremium) }}</div>
            </div>
          </div>
        </v-card>
      </v-col>
      <v-col cols="12" sm="6" md="3">
        <v-card class="pa-4" variant="elevated">
          <div class="d-flex align-center">
            <v-avatar color="green" size="40" class="mr-3">
              <v-icon icon="mdi-file-document-check" color="white" />
            </v-avatar>
            <div>
              <div class="text-body-2 text-medium-emphasis">Active Policies</div>
              <div class="text-h6 font-weight-bold">{{ activePolicies.length }}</div>
            </div>
          </div>
        </v-card>
      </v-col>
      <v-col cols="12" sm="6" md="3">
        <v-card class="pa-4">
          <v-btn color="primary" block size="large" @click="openAddPolicy">
            <v-icon icon="mdi-plus" class="mr-2" />
            Add Life Policy
          </v-btn>
        </v-card>
      </v-col>
    </v-row>

    <!-- Loading State -->
    <div v-if="isLoading" class="text-center py-8">
      <v-progress-circular indeterminate color="primary" size="48" />
      <p class="mt-4 text-medium-emphasis">Loading policies...</p>
    </div>

    <template v-else>
      <!-- Empty State -->
      <v-card v-if="lifePolicies.length === 0" class="text-center pa-8">
        <v-icon icon="mdi-heart-pulse" size="80" color="purple" class="mb-4" />
        <h2 class="text-h5 mb-2">No Life Insurance Policies</h2>
        <p class="text-medium-emphasis mb-6">
          Add your term insurance and other life insurance policies to track coverage.
        </p>
        <v-btn color="primary" size="large" @click="openAddPolicy">
          <v-icon icon="mdi-plus" class="mr-2" />
          Add Your First Policy
        </v-btn>
      </v-card>

      <!-- Active Policies -->
      <template v-else>
        <div class="d-flex align-center mb-3">
          <h3 class="text-h6">Active Policies</h3>
          <v-chip class="ml-2" size="small" color="success">{{ activePolicies.length }}</v-chip>
        </div>

        <v-row v-if="activePolicies.length > 0">
          <v-col
            v-for="policy in activePolicies"
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
        <v-alert v-else type="info" variant="tonal" class="mb-6">
          No active life insurance policies. Add a policy to get started.
        </v-alert>

        <!-- Expired Policies (Collapsible) -->
        <template v-if="expiredPolicies.length > 0">
          <v-divider class="my-6" />
          <div class="d-flex align-center mb-3">
            <v-btn
              variant="text"
              @click="showExpired = !showExpired"
            >
              <v-icon :icon="showExpired ? 'mdi-chevron-up' : 'mdi-chevron-down'" class="mr-2" />
              Expired/Cancelled Policies
            </v-btn>
            <v-chip class="ml-2" size="small" color="grey">{{ expiredPolicies.length }}</v-chip>
          </div>
          <v-expand-transition>
            <v-row v-if="showExpired">
              <v-col
                v-for="policy in expiredPolicies"
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
          </v-expand-transition>
        </template>
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
