<script setup lang="ts">
import { ref, computed } from 'vue'
import SectionHeader from '@/components/shared/SectionHeader.vue'
import GoalCard from '@/components/fire/GoalCard.vue'
import GoalForm from '@/components/fire/GoalForm.vue'
import { useGoals, useCreateGoal, useUpdateGoal, useDeleteGoal, formatINR, goalCategoryConfig } from '@/composables/useFIRE'
import type { Goal, CreateGoalInput } from '@/composables/useFIRE'

const tabs = [
  { title: 'FIRE Dashboard', route: '/dashboard/fire-goals' },
  { title: 'Calculators', route: '/dashboard/fire-goals/calculators' },
  { title: 'Goals', route: '/dashboard/fire-goals/goals' },
  { title: 'Projections', route: '/dashboard/fire-goals/projections' },
  { title: 'Withdrawal', route: '/dashboard/fire-goals/withdrawal' },
  { title: 'Reports', route: '/dashboard/fire-goals/reports' },
]

const { data: goals, isLoading } = useGoals()
const createGoalMutation = useCreateGoal()
const updateGoalMutation = useUpdateGoal()
const deleteGoalMutation = useDeleteGoal()

// Form dialog state
const showForm = ref(false)
const editingGoal = ref<Goal | null>(null)

// View filter
const statusFilter = ref<string[]>([])
const categoryFilter = ref<string[]>([])

// Computed filtered goals
const filteredGoals = computed(() => {
  if (!goals.value) return []

  return goals.value.filter(goal => {
    if (statusFilter.value.length > 0 && !statusFilter.value.includes(goal.status)) {
      return false
    }
    if (categoryFilter.value.length > 0 && !categoryFilter.value.includes(goal.category)) {
      return false
    }
    return true
  })
})

// Stats
const totalTargetAmount = computed(() => {
  if (!goals.value) return 0
  return goals.value.reduce((sum, g) => sum + g.targetAmount, 0)
})

const totalCurrentAmount = computed(() => {
  if (!goals.value) return 0
  return goals.value.reduce((sum, g) => sum + g.currentAmount, 0)
})

const completedGoals = computed(() => {
  if (!goals.value) return 0
  return goals.value.filter(g => g.status === 'completed').length
})

const onTrackGoals = computed(() => {
  if (!goals.value) return 0
  return goals.value.filter(g => g.status === 'on_track').length
})

// Actions
const openCreateForm = () => {
  editingGoal.value = null
  showForm.value = true
}

const handleEdit = (goal: Goal) => {
  editingGoal.value = goal
  showForm.value = true
}

const handleDelete = async (goal: Goal) => {
  if (confirm(`Are you sure you want to delete "${goal.name}"?`)) {
    await deleteGoalMutation.mutateAsync(goal.id)
  }
}

const handleViewDetails = (goal: Goal) => {
  // Could open a detail dialog or navigate to detail page
  console.log('View details for', goal.name)
}

const handleSave = async (data: CreateGoalInput) => {
  if (editingGoal.value) {
    await updateGoalMutation.mutateAsync({ id: editingGoal.value.id, data })
  } else {
    await createGoalMutation.mutateAsync(data)
  }
  showForm.value = false
  editingGoal.value = null
}

// Category options for filter
const categoryOptions = Object.entries(goalCategoryConfig).map(([key, config]) => ({
  value: key,
  title: config.label
}))
</script>

<template>
  <div>
    <SectionHeader
      title="FIRE & Goals"
      subtitle="Financial Goals"
      icon="mdi-fire"
      :tabs="tabs"
    />

    <!-- Stats Row -->
    <v-row class="mb-6">
      <v-col cols="6" sm="3">
        <v-card class="pa-4 text-center">
          <div class="text-body-2 text-medium-emphasis">Total Goals</div>
          <div class="text-h5 font-weight-bold">{{ goals?.length || 0 }}</div>
        </v-card>
      </v-col>
      <v-col cols="6" sm="3">
        <v-card class="pa-4 text-center">
          <div class="text-body-2 text-medium-emphasis">Completed</div>
          <div class="text-h5 font-weight-bold text-success">{{ completedGoals }}</div>
        </v-card>
      </v-col>
      <v-col cols="6" sm="3">
        <v-card class="pa-4 text-center">
          <div class="text-body-2 text-medium-emphasis">Total Target</div>
          <div class="text-h5 font-weight-bold text-currency">{{ formatINR(totalTargetAmount, true) }}</div>
        </v-card>
      </v-col>
      <v-col cols="6" sm="3">
        <v-card class="pa-4 text-center">
          <div class="text-body-2 text-medium-emphasis">Saved So Far</div>
          <div class="text-h5 font-weight-bold text-primary text-currency">{{ formatINR(totalCurrentAmount, true) }}</div>
        </v-card>
      </v-col>
    </v-row>

    <!-- Filters & Actions -->
    <v-card class="mb-6">
      <v-card-text>
        <div class="d-flex flex-wrap align-center ga-4">
          <v-select
            v-model="statusFilter"
            :items="[
              { title: 'On Track', value: 'on_track' },
              { title: 'At Risk', value: 'at_risk' },
              { title: 'Off Track', value: 'off_track' },
              { title: 'Completed', value: 'completed' }
            ]"
            label="Status"
            multiple
            chips
            closable-chips
            variant="outlined"
            density="compact"
            hide-details
            clearable
            style="max-width: 300px"
          />

          <v-select
            v-model="categoryFilter"
            :items="categoryOptions"
            item-value="value"
            item-title="title"
            label="Category"
            multiple
            chips
            closable-chips
            variant="outlined"
            density="compact"
            hide-details
            clearable
            style="max-width: 300px"
          />

          <v-spacer />

          <v-btn color="primary" prepend-icon="mdi-plus" @click="openCreateForm">
            Add Goal
          </v-btn>
        </div>
      </v-card-text>
    </v-card>

    <!-- Loading State -->
    <div v-if="isLoading" class="text-center py-8">
      <v-progress-circular indeterminate color="primary" size="48" />
      <p class="text-body-2 text-medium-emphasis mt-4">Loading goals...</p>
    </div>

    <!-- Empty State -->
    <v-card v-else-if="!goals || goals.length === 0" class="pa-8 text-center">
      <v-icon icon="mdi-flag-checkered" size="64" color="primary" class="mb-4" />
      <div class="text-h6 mb-2">No Goals Yet</div>
      <div class="text-body-2 text-medium-emphasis mb-4">
        Set your first financial goal to start tracking your progress toward financial independence.
      </div>
      <v-btn color="primary" prepend-icon="mdi-plus" @click="openCreateForm">
        Create Your First Goal
      </v-btn>
    </v-card>

    <!-- Goals Grid -->
    <v-row v-else>
      <v-col
        v-for="goal in filteredGoals"
        :key="goal.id"
        cols="12"
        sm="6"
        lg="4"
      >
        <GoalCard
          :goal="goal"
          @edit="handleEdit"
          @delete="handleDelete"
          @view-details="handleViewDetails"
        />
      </v-col>
    </v-row>

    <!-- No Results -->
    <v-alert
      v-if="goals && goals.length > 0 && filteredGoals.length === 0"
      type="info"
      variant="tonal"
      class="mt-4"
    >
      No goals match your current filters. Try adjusting the filters or
      <v-btn variant="text" size="small" @click="statusFilter = []; categoryFilter = []">clear all filters</v-btn>.
    </v-alert>

    <!-- Goal Form Dialog -->
    <GoalForm
      v-model="showForm"
      :goal="editingGoal"
      @save="handleSave"
    />

    <!-- Goal Templates Section -->
    <v-card class="mt-6">
      <v-card-title class="d-flex align-center">
        <v-icon icon="mdi-content-copy" class="mr-2" />
        Quick Start Templates
      </v-card-title>
      <v-card-text>
        <v-chip-group>
          <v-chip
            v-for="(config, key) in goalCategoryConfig"
            :key="key"
            :prepend-icon="config.icon"
            variant="outlined"
            @click="editingGoal = null; showForm = true"
          >
            {{ config.label }}
          </v-chip>
        </v-chip-group>
      </v-card-text>
    </v-card>
  </div>
</template>
