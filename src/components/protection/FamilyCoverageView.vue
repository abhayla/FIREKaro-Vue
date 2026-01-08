<script setup lang="ts">
import { computed } from 'vue'
import { formatINRCompact } from '@/composables/useProtection'

interface FamilyMember {
  id: string
  name: string
  lifeCoverage: number
  healthCoverage: number
  totalPolicies: number
}

const props = defineProps<{
  members: FamilyMember[]
  isLoading?: boolean
}>()

const emit = defineEmits<{
  selectMember: [memberId: string]
}>()

// Calculate totals
const totals = computed(() => {
  return props.members.reduce(
    (acc, member) => {
      acc.lifeCoverage += member.lifeCoverage
      acc.healthCoverage += member.healthCoverage
      acc.totalPolicies += member.totalPolicies
      return acc
    },
    { lifeCoverage: 0, healthCoverage: 0, totalPolicies: 0 }
  )
})

// Get coverage status
const getCoverageStatus = (member: FamilyMember) => {
  // Simple logic: consider adequate if both life and health > 0
  if (member.lifeCoverage > 0 && member.healthCoverage > 0) {
    return { color: 'success', icon: 'mdi-check-circle', label: 'Covered' }
  } else if (member.lifeCoverage > 0 || member.healthCoverage > 0) {
    return { color: 'warning', icon: 'mdi-alert-circle', label: 'Partial' }
  }
  return { color: 'error', icon: 'mdi-close-circle', label: 'Not Covered' }
}

// Member icons
const getMemberIcon = (name: string) => {
  const lowName = name.toLowerCase()
  if (lowName === 'self') return 'mdi-account'
  if (lowName.includes('spouse') || lowName.includes('wife') || lowName.includes('husband'))
    return 'mdi-account-heart'
  if (lowName.includes('child') || lowName.includes('son') || lowName.includes('daughter'))
    return 'mdi-account-child'
  if (lowName.includes('parent') || lowName.includes('mother') || lowName.includes('father'))
    return 'mdi-account-supervisor'
  return 'mdi-account'
}
</script>

<template>
  <v-card>
    <v-card-title>
      <v-icon icon="mdi-account-group" class="mr-2" />
      Family Coverage Overview
    </v-card-title>

    <v-card-text>
      <!-- Loading State -->
      <div v-if="isLoading" class="text-center py-4">
        <v-progress-circular indeterminate color="primary" />
      </div>

      <!-- No Members State -->
      <div v-else-if="members.length === 0" class="text-center py-4">
        <v-icon icon="mdi-account-group-outline" size="48" color="grey" class="mb-2" />
        <p class="text-medium-emphasis">No family members found</p>
      </div>

      <template v-else>
        <!-- Total Summary -->
        <v-row class="mb-4">
          <v-col cols="4" class="text-center">
            <div class="text-h5 font-weight-bold text-purple">
              {{ formatINRCompact(totals.lifeCoverage) }}
            </div>
            <div class="text-caption text-medium-emphasis">Total Life Cover</div>
          </v-col>
          <v-col cols="4" class="text-center">
            <div class="text-h5 font-weight-bold text-blue">
              {{ formatINRCompact(totals.healthCoverage) }}
            </div>
            <div class="text-caption text-medium-emphasis">Total Health Cover</div>
          </v-col>
          <v-col cols="4" class="text-center">
            <div class="text-h5 font-weight-bold">
              {{ totals.totalPolicies }}
            </div>
            <div class="text-caption text-medium-emphasis">Total Policies</div>
          </v-col>
        </v-row>

        <v-divider class="mb-4" />

        <!-- Family Members Grid -->
        <v-row>
          <v-col
            v-for="member in members"
            :key="member.id"
            cols="12"
            sm="6"
            md="4"
          >
            <v-card
              variant="outlined"
              class="pa-3 cursor-pointer h-100"
              @click="emit('selectMember', member.id)"
            >
              <div class="d-flex align-center mb-3">
                <v-avatar color="primary" size="40" class="mr-3">
                  <v-icon :icon="getMemberIcon(member.name)" color="white" />
                </v-avatar>
                <div class="flex-grow-1">
                  <div class="font-weight-medium">{{ member.name }}</div>
                  <div class="text-caption text-medium-emphasis">
                    {{ member.totalPolicies }} {{ member.totalPolicies === 1 ? 'policy' : 'policies' }}
                  </div>
                </div>
                <v-chip
                  :color="getCoverageStatus(member).color"
                  size="x-small"
                  variant="tonal"
                >
                  <v-icon :icon="getCoverageStatus(member).icon" size="x-small" class="mr-1" />
                  {{ getCoverageStatus(member).label }}
                </v-chip>
              </div>

              <div class="d-flex justify-space-between text-body-2 mb-1">
                <span class="text-medium-emphasis">
                  <v-icon icon="mdi-heart-pulse" size="14" class="mr-1" />
                  Life
                </span>
                <span :class="member.lifeCoverage > 0 ? 'text-success font-weight-medium' : 'text-error'">
                  {{ member.lifeCoverage > 0 ? formatINRCompact(member.lifeCoverage) : 'None' }}
                </span>
              </div>

              <div class="d-flex justify-space-between text-body-2">
                <span class="text-medium-emphasis">
                  <v-icon icon="mdi-hospital-box" size="14" class="mr-1" />
                  Health
                </span>
                <span :class="member.healthCoverage > 0 ? 'text-success font-weight-medium' : 'text-error'">
                  {{ member.healthCoverage > 0 ? formatINRCompact(member.healthCoverage) : 'None' }}
                </span>
              </div>
            </v-card>
          </v-col>
        </v-row>

        <!-- Coverage Legend -->
        <div class="d-flex justify-center gap-4 mt-4 text-caption">
          <div class="d-flex align-center">
            <v-icon icon="mdi-check-circle" color="success" size="16" class="mr-1" />
            Covered
          </div>
          <div class="d-flex align-center">
            <v-icon icon="mdi-alert-circle" color="warning" size="16" class="mr-1" />
            Partial
          </div>
          <div class="d-flex align-center">
            <v-icon icon="mdi-close-circle" color="error" size="16" class="mr-1" />
            Not Covered
          </div>
        </div>
      </template>
    </v-card-text>
  </v-card>
</template>

<style scoped>
.cursor-pointer {
  cursor: pointer;
  transition: border-color 0.2s;
}
.cursor-pointer:hover {
  border-color: rgb(var(--v-theme-primary));
}
</style>
