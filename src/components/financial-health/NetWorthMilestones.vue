<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import {
  useNetWorthMilestones,
  useCreateMilestone,
  useDeleteMilestone,
  useMilestoneProgress,
  DEFAULT_MILESTONE_SUGGESTIONS,
  formatINR,
  type NetWorthMilestoneInput
} from '@/composables/useFinancialHealth'

const props = defineProps<{
  currentNetWorth: number
}>()

// Data fetching
const { data: milestones, isLoading } = useNetWorthMilestones()
const createMilestone = useCreateMilestone()
const deleteMilestone = useDeleteMilestone()

// Milestone progress tracking
const netWorthRef = computed(() => props.currentNetWorth)
const { milestoneProgress, nextMilestone, achievedMilestones, pendingMilestones } = useMilestoneProgress(netWorthRef)

// Dialog state
const showAddDialog = ref(false)
const showDeleteDialog = ref(false)
const milestoneToDelete = ref<string | null>(null)

// Form state
const newMilestone = ref<NetWorthMilestoneInput>({
  targetAmount: 0,
  name: ''
})
const customAmount = ref('')

// Available suggestions (filter out already added ones)
const availableSuggestions = computed(() => {
  if (!milestones.value) return DEFAULT_MILESTONE_SUGGESTIONS
  const existingAmounts = new Set(milestones.value.map(m => m.targetAmount))
  return DEFAULT_MILESTONE_SUGGESTIONS.filter(s => !existingAmounts.has(s.amount))
})

// Celebration state for newly achieved milestones
const showCelebration = ref(false)
const celebratedMilestone = ref<string | null>(null)

// Watch for newly achieved milestones
watch(milestoneProgress, (progress) => {
  const justAchieved = progress.find(m => m.justAchieved && m.id !== celebratedMilestone.value)
  if (justAchieved) {
    celebratedMilestone.value = justAchieved.id
    showCelebration.value = true
    setTimeout(() => {
      showCelebration.value = false
    }, 5000)
  }
}, { immediate: true })

// Actions
function selectSuggestion(suggestion: { amount: number; name: string }) {
  newMilestone.value = {
    targetAmount: suggestion.amount,
    name: suggestion.name
  }
  customAmount.value = formatAmount(suggestion.amount)
}

function formatAmount(amount: number): string {
  return amount.toString()
}

function parseAmount(value: string): number {
  // Handle lakhs and crores notation
  const cleaned = value.toLowerCase().replace(/[₹,\s]/g, '')
  if (cleaned.endsWith('cr') || cleaned.endsWith('crore')) {
    return parseFloat(cleaned) * 10000000
  }
  if (cleaned.endsWith('l') || cleaned.endsWith('lakh') || cleaned.endsWith('lakhs')) {
    return parseFloat(cleaned) * 100000
  }
  if (cleaned.endsWith('k')) {
    return parseFloat(cleaned) * 1000
  }
  return parseFloat(cleaned) || 0
}

function onCustomAmountChange() {
  const amount = parseAmount(customAmount.value)
  if (amount > 0) {
    newMilestone.value.targetAmount = amount
    // Auto-generate name if not set
    if (!newMilestone.value.name) {
      newMilestone.value.name = formatINR(amount, true).replace('₹', '').trim()
    }
  }
}

async function handleAddMilestone() {
  if (newMilestone.value.targetAmount <= 0 || !newMilestone.value.name.trim()) return

  await createMilestone.mutateAsync(newMilestone.value)
  showAddDialog.value = false
  resetForm()
}

function resetForm() {
  newMilestone.value = { targetAmount: 0, name: '' }
  customAmount.value = ''
}

function confirmDelete(id: string) {
  milestoneToDelete.value = id
  showDeleteDialog.value = true
}

async function handleDelete() {
  if (!milestoneToDelete.value) return
  await deleteMilestone.mutateAsync(milestoneToDelete.value)
  showDeleteDialog.value = false
  milestoneToDelete.value = null
}

function getProgressColor(progress: number): string {
  if (progress >= 100) return 'success'
  if (progress >= 75) return 'lime'
  if (progress >= 50) return 'warning'
  if (progress >= 25) return 'orange'
  return 'grey'
}

function formatDaysRemaining(days: number | null): string {
  if (days === null) return 'Unknown'
  if (days === 0) return 'Achieved!'
  if (days < 30) return `~${days} days`
  if (days < 365) return `~${Math.round(days / 30)} months`
  const years = Math.floor(days / 365)
  const months = Math.round((days % 365) / 30)
  if (months === 0) return `~${years} year${years > 1 ? 's' : ''}`
  return `~${years}y ${months}m`
}
</script>

<template>
  <v-card>
    <v-card-title class="d-flex align-center justify-space-between">
      <div class="d-flex align-center">
        <v-icon icon="mdi-flag-checkered" class="mr-2" />
        Net Worth Milestones
      </div>
      <v-btn
        color="primary"
        variant="tonal"
        size="small"
        prepend-icon="mdi-plus"
        @click="showAddDialog = true"
      >
        Add Milestone
      </v-btn>
    </v-card-title>

    <v-card-text>
      <!-- Loading State -->
      <div v-if="isLoading" class="text-center py-4">
        <v-progress-circular indeterminate color="primary" size="32" />
      </div>

      <!-- Empty State -->
      <v-alert
        v-else-if="!milestones?.length"
        type="info"
        variant="tonal"
        class="mb-4"
      >
        <template #prepend>
          <v-icon icon="mdi-information" />
        </template>
        <div class="font-weight-medium">No milestones set yet</div>
        <div class="text-body-2">
          Add your first net worth milestone to track your wealth-building journey!
        </div>
      </v-alert>

      <!-- Milestones Grid -->
      <template v-else>
        <!-- Achieved Milestones -->
        <div v-if="achievedMilestones.length" class="mb-4">
          <div class="text-body-2 text-medium-emphasis mb-2 d-flex align-center">
            <v-icon icon="mdi-check-circle" color="success" size="small" class="mr-1" />
            Achieved ({{ achievedMilestones.length }})
          </div>
          <div class="d-flex flex-wrap ga-2">
            <v-chip
              v-for="milestone in achievedMilestones"
              :key="milestone.id"
              color="success"
              variant="flat"
              size="large"
              closable
              @click:close="confirmDelete(milestone.id)"
            >
              <v-icon icon="mdi-trophy" size="small" class="mr-1" />
              {{ milestone.name }}
              <span class="text-caption ml-1 opacity-80">
                ({{ formatINR(milestone.targetAmount, true) }})
              </span>
            </v-chip>
          </div>
        </div>

        <!-- Pending Milestones -->
        <div v-if="pendingMilestones.length">
          <div class="text-body-2 text-medium-emphasis mb-2 d-flex align-center">
            <v-icon icon="mdi-target" size="small" class="mr-1" />
            In Progress ({{ pendingMilestones.length }})
          </div>

          <v-row>
            <v-col
              v-for="milestone in pendingMilestones"
              :key="milestone.id"
              cols="12"
              sm="6"
              md="4"
            >
              <v-card variant="outlined" class="pa-3">
                <div class="d-flex justify-space-between align-start mb-2">
                  <div>
                    <div class="font-weight-medium">{{ milestone.name }}</div>
                    <div class="text-body-2 text-medium-emphasis">
                      {{ formatINR(milestone.targetAmount, true) }}
                    </div>
                  </div>
                  <v-btn
                    icon="mdi-close"
                    variant="text"
                    size="x-small"
                    @click="confirmDelete(milestone.id)"
                  />
                </div>

                <v-progress-linear
                  :model-value="milestone.progress"
                  :color="getProgressColor(milestone.progress)"
                  height="8"
                  rounded
                  class="mb-2"
                />

                <div class="d-flex justify-space-between text-caption">
                  <span>{{ milestone.progress.toFixed(1) }}%</span>
                  <span class="text-medium-emphasis">
                    {{ formatINR(milestone.remaining, true) }} to go
                  </span>
                </div>
              </v-card>
            </v-col>
          </v-row>
        </div>

        <!-- Next Milestone Alert -->
        <v-alert
          v-if="nextMilestone"
          type="info"
          variant="tonal"
          class="mt-4"
        >
          <template #prepend>
            <v-icon icon="mdi-target" />
          </template>
          <div class="d-flex flex-wrap align-center justify-space-between">
            <div>
              <strong>Next: {{ nextMilestone.name }}</strong>
              <span class="mx-1">-</span>
              <span>{{ formatINR(nextMilestone.remaining, true) }} away</span>
            </div>
            <v-chip size="small" color="info" variant="flat" class="mt-1 mt-sm-0">
              <v-icon icon="mdi-clock-outline" size="x-small" class="mr-1" />
              {{ formatDaysRemaining(nextMilestone.daysToReach) }}
            </v-chip>
          </div>
        </v-alert>

        <!-- All Achieved Alert -->
        <v-alert
          v-else-if="achievedMilestones.length && !pendingMilestones.length"
          type="success"
          variant="tonal"
          class="mt-4"
        >
          <template #prepend>
            <v-icon icon="mdi-party-popper" />
          </template>
          <strong>Congratulations!</strong> You've achieved all your milestones!
          <div class="text-body-2 mt-1">
            Set new goals to continue your wealth-building journey.
          </div>
        </v-alert>
      </template>
    </v-card-text>

    <!-- Add Milestone Dialog -->
    <v-dialog v-model="showAddDialog" max-width="500">
      <v-card>
        <v-card-title class="d-flex align-center">
          <v-icon icon="mdi-flag-plus" class="mr-2" />
          Add Net Worth Milestone
        </v-card-title>

        <v-card-text>
          <!-- Quick Select Suggestions -->
          <div v-if="availableSuggestions.length" class="mb-4">
            <div class="text-body-2 text-medium-emphasis mb-2">Quick Select</div>
            <div class="d-flex flex-wrap ga-2">
              <v-chip
                v-for="suggestion in availableSuggestions"
                :key="suggestion.amount"
                :color="newMilestone.targetAmount === suggestion.amount ? 'primary' : undefined"
                :variant="newMilestone.targetAmount === suggestion.amount ? 'flat' : 'outlined'"
                @click="selectSuggestion(suggestion)"
              >
                {{ suggestion.name }}
              </v-chip>
            </div>
          </div>

          <v-divider v-if="availableSuggestions.length" class="mb-4" />

          <!-- Custom Amount -->
          <v-text-field
            v-model="customAmount"
            label="Target Amount"
            placeholder="e.g., 50L, 1Cr, 2500000"
            hint="Enter amount (supports: 10L, 1Cr, 2500000)"
            persistent-hint
            prepend-inner-icon="mdi-currency-inr"
            @blur="onCustomAmountChange"
            @keyup.enter="onCustomAmountChange"
          />

          <div v-if="newMilestone.targetAmount > 0" class="text-body-2 text-success mb-4">
            Target: {{ formatINR(newMilestone.targetAmount) }}
          </div>

          <!-- Milestone Name -->
          <v-text-field
            v-model="newMilestone.name"
            label="Milestone Name"
            placeholder="e.g., First Crore, 50 Lakhs"
            prepend-inner-icon="mdi-label"
          />
        </v-card-text>

        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="showAddDialog = false; resetForm()">
            Cancel
          </v-btn>
          <v-btn
            color="primary"
            variant="flat"
            :disabled="newMilestone.targetAmount <= 0 || !newMilestone.name.trim()"
            :loading="createMilestone.isPending.value"
            @click="handleAddMilestone"
          >
            Add Milestone
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Delete Confirmation Dialog -->
    <v-dialog v-model="showDeleteDialog" max-width="400">
      <v-card>
        <v-card-title class="d-flex align-center">
          <v-icon icon="mdi-delete-alert" color="error" class="mr-2" />
          Delete Milestone
        </v-card-title>

        <v-card-text>
          Are you sure you want to delete this milestone? This action cannot be undone.
        </v-card-text>

        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="showDeleteDialog = false">
            Cancel
          </v-btn>
          <v-btn
            color="error"
            variant="flat"
            :loading="deleteMilestone.isPending.value"
            @click="handleDelete"
          >
            Delete
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Celebration Overlay -->
    <v-overlay
      v-model="showCelebration"
      class="align-center justify-center"
      contained
    >
      <v-card class="pa-6 text-center" max-width="400">
        <v-icon icon="mdi-party-popper" color="warning" size="64" class="mb-4" />
        <div class="text-h5 font-weight-bold mb-2">Milestone Achieved!</div>
        <div class="text-body-1 text-medium-emphasis mb-4">
          Congratulations on reaching your wealth-building goal!
        </div>
        <v-btn color="primary" variant="flat" @click="showCelebration = false">
          Continue
        </v-btn>
      </v-card>
    </v-overlay>
  </v-card>
</template>
