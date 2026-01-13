<script setup lang="ts">
import { computed } from 'vue'
import InsuranceSummaryCard from '@/components/insurance/InsuranceSummaryCard.vue'
import CoverageGapAlert from '@/components/insurance/CoverageGapAlert.vue'
import InsurancePolicyCard from '@/components/insurance/InsurancePolicyCard.vue'
import {
  useInsurancePolicies,
  useInsuranceSummary,
  useCoverageAnalysis,
  type InsurancePolicy,
  type InsuranceType,
  formatINRCompact,
  getInsuranceTypeIcon,
  getInsuranceTypeColor,
} from '@/composables/useInsurance'

const emit = defineEmits<{
  'go-to-details': [subTab?: string]
  'add-policy': []
  'edit-policy': [policy: InsurancePolicy]
  'delete-policy': [policy: InsurancePolicy]
  'open-calculator': []
}>()

// Data fetching
const { activePolicies, expiringPolicies, coverageByType, isLoading } = useInsurancePolicies()
const { data: summary, isLoading: summaryLoading } = useInsuranceSummary()
const { data: coverageAnalysis, isLoading: analysisLoading } = useCoverageAnalysis()

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
    { type: 'life' as InsuranceType, label: 'Life', value: coverageByType.value.life },
    { type: 'health' as InsuranceType, label: 'Health', value: coverageByType.value.health },
    { type: 'motor' as InsuranceType, label: 'Motor', value: coverageByType.value.motor },
    { type: 'home' as InsuranceType, label: 'Home', value: coverageByType.value.home },
    { type: 'travel' as InsuranceType, label: 'Travel', value: coverageByType.value.travel },
  ].filter((s) => s.value > 0)
})

// Event handlers
const handleAddPolicy = () => {
  emit('add-policy')
}

const handleViewRenewals = () => {
  emit('go-to-details', 'life')
}

const handleOpenCalculator = () => {
  emit('open-calculator')
}

const viewPoliciesByType = (type: string) => {
  emit('go-to-details', type)
}

const handleViewPolicy = (policy: InsurancePolicy) => {
  emit('edit-policy', policy)
}

const handleEditPolicy = (policy: InsurancePolicy) => {
  emit('edit-policy', policy)
}

const handleDeletePolicy = (policy: InsurancePolicy) => {
  emit('delete-policy', policy)
}

const goToItemDetails = () => {
  emit('go-to-details')
}
</script>

<template>
  <div class="py-4">
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
        @view-renewals="handleViewRenewals"
      />

      <v-row>
        <!-- Coverage Gap Analysis -->
        <v-col cols="12" md="6">
          <CoverageGapAlert
            :analysis="coverageAnalysis"
            :is-loading="analysisLoading"
            @calculate="handleOpenCalculator"
            @view-recommendations="handleOpenCalculator"
          />
        </v-col>

        <!-- Quick Coverage by Type -->
        <v-col cols="12" md="6">
          <v-card>
            <v-card-title class="d-flex align-center">
              <v-icon icon="mdi-chart-donut" class="mr-2" />
              Coverage by Type
              <v-spacer />
              <v-btn variant="text" size="small" color="primary" @click="handleAddPolicy">
                <v-icon icon="mdi-plus" class="mr-1" />
                Add Policy
              </v-btn>
            </v-card-title>
            <v-card-text>
              <div v-if="coverageStats.length === 0" class="text-center py-4">
                <v-icon icon="mdi-shield-off-outline" size="48" color="grey" class="mb-2" />
                <p class="text-medium-emphasis">No active policies</p>
                <v-btn color="primary" size="small" class="mt-2" @click="handleAddPolicy">
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
                  <v-avatar :color="getInsuranceTypeColor(stat.type)" size="36" class="mr-3">
                    <v-icon :icon="getInsuranceTypeIcon(stat.type)" color="white" size="18" />
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

      <!-- Recent/Expiring Policies -->
      <v-row v-if="displayPolicies.length > 0" class="mt-2">
        <v-col cols="12">
          <div class="d-flex align-center mb-3">
            <h3 class="text-h6">
              <v-icon icon="mdi-clock-alert-outline" class="mr-2" />
              Policies Requiring Attention
            </h3>
            <v-spacer />
            <v-btn variant="text" size="small" @click="goToItemDetails">
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
                @view="handleViewPolicy"
                @edit="handleEditPolicy"
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
                <v-btn variant="tonal" color="primary" @click="handleAddPolicy">
                  <v-icon icon="mdi-plus" class="mr-2" />
                  Add Policy
                </v-btn>
                <v-btn variant="tonal" color="secondary" @click="handleOpenCalculator">
                  <v-icon icon="mdi-calculator" class="mr-2" />
                  Check Adequacy
                </v-btn>
                <v-btn variant="tonal" @click="goToItemDetails">
                  <v-icon icon="mdi-format-list-bulleted" class="mr-2" />
                  View All Policies
                </v-btn>
              </div>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </template>
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
