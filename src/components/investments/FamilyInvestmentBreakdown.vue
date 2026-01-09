<script setup lang="ts">
import { computed } from 'vue'
import { formatINR, formatINRCompact } from '@/composables/useLiabilities'

interface FamilyMemberInvestment {
  memberId: string
  memberName: string
  relationship: string
  totalValue: number
  allocation: {
    equity: number
    debt: number
    gold: number
    realEstate: number
    cash: number
  }
  topHoldings: Array<{
    name: string
    value: number
    type: string
  }>
  returns: {
    absolute: number
    percentage: number
  }
}

interface Props {
  members: FamilyMemberInvestment[]
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  loading: false
})

const emit = defineEmits<{
  (e: 'select-member', memberId: string): void
}>()

const totalFamilyValue = computed(() => {
  return props.members?.reduce((sum, m) => sum + (m.totalValue ?? 0), 0) ?? 0
})

const sortedMembers = computed(() => {
  if (!props.members?.length) return []
  return [...props.members].sort((a, b) => (b.totalValue ?? 0) - (a.totalValue ?? 0))
})

function getContributionPercent(value: number): number {
  if (!totalFamilyValue.value || totalFamilyValue.value === 0) return 0
  return (value / totalFamilyValue.value) * 100
}

function getRelationshipColor(relationship: string): string {
  const colors: Record<string, string> = {
    'Self': 'primary',
    'Spouse': 'secondary',
    'Father': 'info',
    'Mother': 'info',
    'Son': 'success',
    'Daughter': 'success',
    'Brother': 'warning',
    'Sister': 'warning',
  }
  return colors[relationship] ?? 'grey'
}

function getRelationshipIcon(relationship: string): string {
  const icons: Record<string, string> = {
    'Self': 'mdi-account',
    'Spouse': 'mdi-account-heart',
    'Father': 'mdi-human-male',
    'Mother': 'mdi-human-female',
    'Son': 'mdi-human-male-child',
    'Daughter': 'mdi-human-female-girl',
    'Brother': 'mdi-human-male-male',
    'Sister': 'mdi-human-female-female',
  }
  return icons[relationship] ?? 'mdi-account'
}

function getAllocationChipColor(type: string): string {
  const colors: Record<string, string> = {
    equity: 'success',
    debt: 'info',
    gold: 'warning',
    realEstate: 'purple',
    cash: 'grey',
  }
  return colors[type] ?? 'grey'
}
</script>

<template>
  <v-card>
    <v-card-title class="d-flex align-center">
      <v-icon start>mdi-account-group</v-icon>
      Family Investment Breakdown
      <v-spacer />
      <div class="text-body-2 text-medium-emphasis">
        Total: <span class="text-currency font-weight-bold">{{ formatINRCompact(totalFamilyValue) }}</span>
      </div>
    </v-card-title>

    <v-card-text>
      <!-- Loading State -->
      <div v-if="loading" class="d-flex flex-column ga-4">
        <v-skeleton-loader
          v-for="i in 3"
          :key="i"
          type="list-item-avatar-three-line"
        />
      </div>

      <!-- Empty State -->
      <v-alert
        v-else-if="!members?.length"
        type="info"
        variant="tonal"
        class="mb-0"
      >
        <v-alert-title>No Family Investments</v-alert-title>
        Add family members and their investments to see the breakdown here.
      </v-alert>

      <!-- Member Cards -->
      <div v-else class="d-flex flex-column ga-4">
        <v-card
          v-for="member in sortedMembers"
          :key="member.memberId"
          variant="outlined"
          class="member-card"
          @click="emit('select-member', member.memberId)"
        >
          <v-card-text class="pa-4">
            <div class="d-flex align-start ga-4">
              <!-- Avatar -->
              <v-avatar
                :color="getRelationshipColor(member.relationship)"
                size="48"
              >
                <v-icon :icon="getRelationshipIcon(member.relationship)" />
              </v-avatar>

              <!-- Member Info -->
              <div class="flex-grow-1">
                <div class="d-flex align-center ga-2 mb-1">
                  <span class="text-h6">{{ member.memberName }}</span>
                  <v-chip
                    :color="getRelationshipColor(member.relationship)"
                    size="x-small"
                    label
                  >
                    {{ member.relationship }}
                  </v-chip>
                </div>

                <!-- Value and Contribution -->
                <div class="d-flex align-center ga-4 mb-3">
                  <div>
                    <div class="text-caption text-medium-emphasis">Portfolio Value</div>
                    <div class="text-currency text-h6">{{ formatINR(member.totalValue ?? 0) }}</div>
                  </div>
                  <v-divider vertical />
                  <div>
                    <div class="text-caption text-medium-emphasis">Family Share</div>
                    <div class="text-h6">{{ getContributionPercent(member.totalValue ?? 0).toFixed(1) }}%</div>
                  </div>
                  <v-divider vertical />
                  <div>
                    <div class="text-caption text-medium-emphasis">Returns</div>
                    <div
                      class="text-h6"
                      :class="(member.returns?.percentage ?? 0) >= 0 ? 'text-success' : 'text-error'"
                    >
                      {{ (member.returns?.percentage ?? 0) >= 0 ? '+' : '' }}{{ (member.returns?.percentage ?? 0).toFixed(1) }}%
                    </div>
                  </div>
                </div>

                <!-- Contribution Progress Bar -->
                <v-progress-linear
                  :model-value="getContributionPercent(member.totalValue ?? 0)"
                  :color="getRelationshipColor(member.relationship)"
                  height="6"
                  rounded
                  class="mb-3"
                />

                <!-- Allocation Chips -->
                <div class="d-flex flex-wrap ga-2 mb-3">
                  <v-chip
                    v-if="(member.allocation?.equity ?? 0) > 0"
                    :color="getAllocationChipColor('equity')"
                    size="small"
                    variant="tonal"
                  >
                    Equity: {{ (member.allocation?.equity ?? 0).toFixed(0) }}%
                  </v-chip>
                  <v-chip
                    v-if="(member.allocation?.debt ?? 0) > 0"
                    :color="getAllocationChipColor('debt')"
                    size="small"
                    variant="tonal"
                  >
                    Debt: {{ (member.allocation?.debt ?? 0).toFixed(0) }}%
                  </v-chip>
                  <v-chip
                    v-if="(member.allocation?.gold ?? 0) > 0"
                    :color="getAllocationChipColor('gold')"
                    size="small"
                    variant="tonal"
                  >
                    Gold: {{ (member.allocation?.gold ?? 0).toFixed(0) }}%
                  </v-chip>
                  <v-chip
                    v-if="(member.allocation?.realEstate ?? 0) > 0"
                    :color="getAllocationChipColor('realEstate')"
                    size="small"
                    variant="tonal"
                  >
                    Real Estate: {{ (member.allocation?.realEstate ?? 0).toFixed(0) }}%
                  </v-chip>
                  <v-chip
                    v-if="(member.allocation?.cash ?? 0) > 0"
                    :color="getAllocationChipColor('cash')"
                    size="small"
                    variant="tonal"
                  >
                    Cash: {{ (member.allocation?.cash ?? 0).toFixed(0) }}%
                  </v-chip>
                </div>

                <!-- Top Holdings -->
                <div v-if="member.topHoldings?.length" class="mt-2">
                  <div class="text-caption text-medium-emphasis mb-1">Top Holdings</div>
                  <div class="d-flex flex-wrap ga-2">
                    <v-chip
                      v-for="holding in member.topHoldings.slice(0, 3)"
                      :key="holding.name"
                      size="small"
                      variant="outlined"
                    >
                      {{ holding.name }}
                      <span class="text-currency ml-1">{{ formatINRCompact(holding.value ?? 0) }}</span>
                    </v-chip>
                  </div>
                </div>
              </div>

              <!-- Action Arrow -->
              <v-icon color="grey" class="mt-2">mdi-chevron-right</v-icon>
            </div>
          </v-card-text>
        </v-card>
      </div>
    </v-card-text>
  </v-card>
</template>

<style scoped>
.member-card {
  cursor: pointer;
  transition: all 0.2s ease;
}

.member-card:hover {
  border-color: rgb(var(--v-theme-primary));
  transform: translateX(4px);
}
</style>
