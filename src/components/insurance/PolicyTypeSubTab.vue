<script setup lang="ts">
import { ref, computed } from 'vue'
import InsurancePolicyCard from '@/components/insurance/InsurancePolicyCard.vue'
import {
  useInsurancePolicies,
  type InsurancePolicy,
  type InsuranceType,
  formatINR,
  formatINRCompact,
  getInsuranceTypeIcon,
  getInsuranceTypeColor,
} from '@/composables/useInsurance'

const props = defineProps<{
  type: InsuranceType
}>()

const emit = defineEmits<{
  'add-policy': [type: InsuranceType]
  'edit-policy': [policy: InsurancePolicy]
  'delete-policy': [policy: InsurancePolicy]
}>()

// Fetch policies for this type
const typeRef = computed(() => props.type)
const { policies, isLoading } = useInsurancePolicies(typeRef)

// Filter policies
const typePolicies = computed(() => policies.value?.filter((p) => p.type === props.type) || [])
const activePolicies = computed(() => typePolicies.value.filter((p) => p.status === 'active'))
const expiredPolicies = computed(() => typePolicies.value.filter((p) => p.status !== 'active'))

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

// Health-specific: coverage type breakdown
const coverageTypeCounts = computed(() => {
  if (props.type !== 'health') return null
  const counts = { individual: 0, family: 0, floater: 0 }
  activePolicies.value.forEach((p) => {
    if (p.coverageType) counts[p.coverageType]++
  })
  return counts
})

// UI state
const showExpired = ref(false)

// Type-specific labels
const typeLabels: Record<InsuranceType, { singular: string; plural: string; emptyMessage: string }> = {
  life: {
    singular: 'Life Insurance',
    plural: 'Life Insurance Policies',
    emptyMessage: 'Add your term insurance and other life insurance policies to track coverage.',
  },
  health: {
    singular: 'Health Insurance',
    plural: 'Health Insurance Policies',
    emptyMessage: 'Add your health insurance policies to track medical coverage.',
  },
  motor: {
    singular: 'Motor Insurance',
    plural: 'Motor Insurance Policies',
    emptyMessage: 'Add your vehicle insurance policies (car, bike, etc.).',
  },
  home: {
    singular: 'Home Insurance',
    plural: 'Home Insurance Policies',
    emptyMessage: 'Add your property insurance policies to protect your home.',
  },
  travel: {
    singular: 'Travel Insurance',
    plural: 'Travel Insurance Policies',
    emptyMessage: 'Add your travel insurance policies for trip protection.',
  },
}

const typeLabel = computed(() => typeLabels[props.type])
const typeIcon = computed(() => getInsuranceTypeIcon(props.type))
const typeColor = computed(() => getInsuranceTypeColor(props.type))

// Event handlers
const handleAddPolicy = () => {
  emit('add-policy', props.type)
}

const handleEditPolicy = (policy: InsurancePolicy) => {
  emit('edit-policy', policy)
}

const handleViewPolicy = (policy: InsurancePolicy) => {
  // For now, view = edit
  emit('edit-policy', policy)
}

const handleDeletePolicy = (policy: InsurancePolicy) => {
  emit('delete-policy', policy)
}
</script>

<template>
  <div class="py-4">
    <!-- Summary Stats -->
    <v-row class="mb-6">
      <v-col cols="12" sm="6" md="3">
        <v-card class="pa-4" variant="elevated">
          <div class="d-flex align-center">
            <v-avatar :color="typeColor" size="40" class="mr-3">
              <v-icon :icon="typeIcon" color="white" />
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
          <v-btn color="primary" block size="large" @click="handleAddPolicy">
            <v-icon icon="mdi-plus" class="mr-2" />
            Add {{ typeLabel.singular }}
          </v-btn>
        </v-card>
      </v-col>
    </v-row>

    <!-- Health-specific: Coverage Type Breakdown -->
    <v-row v-if="type === 'health' && coverageTypeCounts && activePolicies.length > 0" class="mb-6">
      <v-col cols="12">
        <v-card>
          <v-card-title class="text-subtitle-1">
            <v-icon icon="mdi-account-group" class="mr-2" />
            Coverage Type Breakdown
          </v-card-title>
          <v-card-text>
            <div class="d-flex flex-wrap gap-4">
              <v-chip
                v-if="coverageTypeCounts.individual > 0"
                color="blue"
                variant="tonal"
                size="large"
              >
                <v-icon icon="mdi-account" class="mr-1" />
                Individual: {{ coverageTypeCounts.individual }}
              </v-chip>
              <v-chip
                v-if="coverageTypeCounts.family > 0"
                color="purple"
                variant="tonal"
                size="large"
              >
                <v-icon icon="mdi-account-multiple" class="mr-1" />
                Family: {{ coverageTypeCounts.family }}
              </v-chip>
              <v-chip
                v-if="coverageTypeCounts.floater > 0"
                color="green"
                variant="tonal"
                size="large"
              >
                <v-icon icon="mdi-account-group" class="mr-1" />
                Family Floater: {{ coverageTypeCounts.floater }}
              </v-chip>
            </div>
          </v-card-text>
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
      <v-card v-if="typePolicies.length === 0" class="text-center pa-8">
        <v-icon :icon="typeIcon" size="80" :color="typeColor" class="mb-4" />
        <h2 class="text-h5 mb-2">No {{ typeLabel.plural }}</h2>
        <p class="text-medium-emphasis mb-6">
          {{ typeLabel.emptyMessage }}
        </p>

        <!-- Health-specific recommendations -->
        <v-alert v-if="type === 'health'" type="info" variant="tonal" class="mb-6 text-left">
          <div class="text-subtitle-2 mb-2">Recommended Coverage (2025)</div>
          <ul class="text-body-2">
            <li>Metro cities: Minimum ₹10L per adult</li>
            <li>Tier-1 cities: Minimum ₹7.5L per adult</li>
            <li>Children: ₹5L each</li>
            <li>Senior parents: ₹15L each (with senior citizen plan)</li>
          </ul>
        </v-alert>

        <v-btn color="primary" size="large" @click="handleAddPolicy">
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
              @view="handleViewPolicy"
              @edit="handleEditPolicy"
              @delete="handleDeletePolicy"
            />
          </v-col>
        </v-row>
        <v-alert v-else type="info" variant="tonal" class="mb-6">
          No active {{ type }} insurance policies. Add a policy to get started.
        </v-alert>

        <!-- Expired Policies (Collapsible) -->
        <template v-if="expiredPolicies.length > 0">
          <v-divider class="my-6" />
          <div class="d-flex align-center mb-3">
            <v-btn variant="text" @click="showExpired = !showExpired">
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
                  @view="handleViewPolicy"
                  @edit="handleEditPolicy"
                  @delete="handleDeletePolicy"
                />
              </v-col>
            </v-row>
          </v-expand-transition>
        </template>
      </template>
    </template>
  </div>
</template>
