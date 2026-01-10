<script setup lang="ts">
import { ref, computed } from 'vue'
import SectionHeader from '@/components/shared/SectionHeader.vue'
import InsuranceSummaryCard from '@/components/insurance/InsuranceSummaryCard.vue'
import CoverageGapAlert from '@/components/insurance/CoverageGapAlert.vue'
import FamilyCoverageView from '@/components/insurance/FamilyCoverageView.vue'
import InsurancePolicyCard from '@/components/insurance/InsurancePolicyCard.vue'
import InsurancePolicyForm from '@/components/insurance/InsurancePolicyForm.vue'
import CoverageAdequacyWizard from '@/components/insurance/CoverageAdequacyWizard.vue'
import {
  useInsurancePolicies,
  useInsuranceSummary,
  useCoverageAnalysis,
  useFamilyPolicies,
  type InsurancePolicy,
  type CreatePolicyInput,
  formatINRCompact,
  getInsuranceTypeIcon,
  getInsuranceTypeColor,
} from '@/composables/useInsurance'
import { useRouter } from 'vue-router'

const router = useRouter()

const tabs = [
  { title: 'Overview', route: '/dashboard/insurance' },
  { title: 'Life', route: '/dashboard/insurance/life' },
  { title: 'Health', route: '/dashboard/insurance/health' },
  { title: 'Other', route: '/dashboard/insurance/other' },
  { title: 'Calculator', route: '/dashboard/insurance/calculator' },
  { title: 'Reports', route: '/dashboard/insurance/reports' },
]

// Data fetching
const { activePolicies, expiringPolicies, coverageByType, isLoading, createPolicy, deletePolicy } =
  useInsurancePolicies()
const { data: summary, isLoading: summaryLoading } = useInsuranceSummary()
const { data: coverageAnalysis, isLoading: analysisLoading } = useCoverageAnalysis()
const { familyCoverage } = useFamilyPolicies()

// Dialogs
const showPolicyForm = ref(false)
const showCalculator = ref(false)
const editingPolicy = ref<InsurancePolicy | null>(null)

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

const handleSavePolicy = async (data: CreatePolicyInput) => {
  try {
    await createPolicy.mutateAsync(data)
    showMessage('Policy added successfully')
    showPolicyForm.value = false
  } catch {
    showMessage('Failed to add policy', 'error')
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

// Navigate to type-specific page
const viewPoliciesByType = (type: string) => {
  if (type === 'life') {
    router.push('/dashboard/insurance/life')
  } else if (type === 'health') {
    router.push('/dashboard/insurance/health')
  } else {
    router.push('/dashboard/insurance/other')
  }
}

// Recent/expiring policies (show up to 4)
const displayPolicies = computed(() => {
  const expiring = expiringPolicies.value || []
  const active = activePolicies.value || []
  // Prioritize expiring policies, then recent
  return [...expiring, ...active.filter((p) => !expiring.includes(p))].slice(0, 4)
})

// Quick stats for types with coverage
const coverageStats = computed(() => {
  if (!coverageByType.value) return []
  return [
    { type: 'life', label: 'Life', value: coverageByType.value.life },
    { type: 'health', label: 'Health', value: coverageByType.value.health },
    { type: 'motor', label: 'Motor', value: coverageByType.value.motor },
    { type: 'home', label: 'Home', value: coverageByType.value.home },
    { type: 'travel', label: 'Travel', value: coverageByType.value.travel },
  ].filter((s) => s.value > 0)
})
</script>

<template>
  <div>
    <SectionHeader
      title="Insurance"
      subtitle="Insurance coverage analysis"
      icon="mdi-shield-check"
      :tabs="tabs"
    />

    <!-- Loading State -->
    <div v-if="isLoading && summaryLoading" class="text-center py-8">
      <v-progress-circular indeterminate color="primary" size="48" />
      <p class="mt-4 text-medium-emphasis">Loading insurance data...</p>
    </div>

    <template v-else>
      <!-- Summary Cards -->
      <InsuranceSummaryCard
        :summary="summary"
        :is-loading="summaryLoading"
        class="mb-6"
        @view-renewals="router.push('/dashboard/insurance/life')"
      />

      <v-row>
        <!-- Coverage Gap Analysis -->
        <v-col cols="12" md="6">
          <CoverageGapAlert
            :analysis="coverageAnalysis"
            :is-loading="analysisLoading"
            @calculate="showCalculator = true"
            @view-recommendations="router.push('/dashboard/insurance/calculator')"
          />
        </v-col>

        <!-- Quick Coverage by Type -->
        <v-col cols="12" md="6">
          <v-card>
            <v-card-title class="d-flex align-center">
              <v-icon icon="mdi-chart-donut" class="mr-2" />
              Coverage by Type
              <v-spacer />
              <v-btn variant="text" size="small" color="primary" @click="openAddPolicy">
                <v-icon icon="mdi-plus" class="mr-1" />
                Add Policy
              </v-btn>
            </v-card-title>
            <v-card-text>
              <div v-if="coverageStats.length === 0" class="text-center py-4">
                <v-icon icon="mdi-shield-off-outline" size="48" color="grey" class="mb-2" />
                <p class="text-medium-emphasis">No active policies</p>
                <v-btn color="primary" size="small" class="mt-2" @click="openAddPolicy">
                  Add Your First Policy
                </v-btn>
              </div>
              <div v-else>
                <div
                  v-for="stat in coverageStats"
                  :key="stat.type"
                  class="d-flex align-center mb-3 cursor-pointer"
                  @click="viewPoliciesByType(stat.type)"
                >
                  <v-avatar :color="getInsuranceTypeColor(stat.type as any)" size="36" class="mr-3">
                    <v-icon :icon="getInsuranceTypeIcon(stat.type as any)" color="white" size="18" />
                  </v-avatar>
                  <div class="flex-grow-1">
                    <div class="text-body-2 font-weight-medium">{{ stat.label }}</div>
                    <div class="text-h6 font-weight-bold">{{ formatINRCompact(stat.value) }}</div>
                  </div>
                  <v-icon icon="mdi-chevron-right" size="20" />
                </div>
              </div>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <!-- Family Coverage Overview -->
      <v-row class="mt-2">
        <v-col cols="12">
          <FamilyCoverageView
            :members="familyCoverage"
            :is-loading="isLoading"
            @select-member="(id) => console.log('Selected member:', id)"
          />
        </v-col>
      </v-row>

      <!-- Recent/Expiring Policies -->
      <v-row v-if="displayPolicies.length > 0" class="mt-2">
        <v-col cols="12">
          <div class="d-flex align-center mb-3">
            <h3 class="text-h6">
              <v-icon icon="mdi-clock-alert-outline" class="mr-2" />
              Policies Requiring Attention
            </h3>
            <v-spacer />
            <v-btn variant="text" size="small" to="/dashboard/insurance/life">
              View All
              <v-icon icon="mdi-chevron-right" class="ml-1" />
            </v-btn>
          </div>
          <v-row>
            <v-col
              v-for="policy in displayPolicies"
              :key="policy.id"
              cols="12"
              sm="6"
              lg="3"
            >
              <InsurancePolicyCard
                :policy="policy"
                @view="router.push(`/dashboard/insurance/${policy.type === 'motor' || policy.type === 'home' || policy.type === 'travel' ? 'other' : policy.type}`)"
                @edit="editingPolicy = $event; showPolicyForm = true"
                @delete="handleDeletePolicy"
              />
            </v-col>
          </v-row>
        </v-col>
      </v-row>

      <!-- Quick Actions -->
      <v-row class="mt-4">
        <v-col cols="12">
          <v-card variant="outlined">
            <v-card-text>
              <div class="text-subtitle-2 mb-3">Quick Actions</div>
              <div class="d-flex flex-wrap gap-2">
                <v-btn variant="tonal" color="primary" @click="openAddPolicy">
                  <v-icon icon="mdi-plus" class="mr-2" />
                  Add Policy
                </v-btn>
                <v-btn variant="tonal" color="secondary" @click="showCalculator = true">
                  <v-icon icon="mdi-calculator" class="mr-2" />
                  Check Adequacy
                </v-btn>
                <v-btn variant="tonal" to="/dashboard/insurance/reports">
                  <v-icon icon="mdi-chart-bar" class="mr-2" />
                  View Reports
                </v-btn>
              </div>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </template>

    <!-- Policy Form Dialog -->
    <InsurancePolicyForm
      v-model="showPolicyForm"
      :policy="editingPolicy"
      @save="handleSavePolicy"
    />

    <!-- Coverage Calculator Wizard -->
    <CoverageAdequacyWizard
      v-model="showCalculator"
      :existing-life-cover="coverageByType?.life"
      :existing-health-cover="coverageByType?.health"
      @calculated="(result) => console.log('Calculated:', result)"
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

<style scoped>
.cursor-pointer {
  cursor: pointer;
  transition: background-color 0.2s;
}
.cursor-pointer:hover {
  background-color: rgba(var(--v-theme-primary), 0.08);
  border-radius: 8px;
}
</style>
