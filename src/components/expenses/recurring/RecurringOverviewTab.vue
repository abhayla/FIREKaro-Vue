<script setup lang="ts">
import { computed } from 'vue'
import {
  useRecurringExpenses,
  formatINR,
  type RecurringExpense,
} from '@/composables/useExpenses'

const emit = defineEmits<{
  (e: 'go-to-details'): void
  (e: 'create-new'): void
}>()

// Fetch recurring data
const {
  recurring,
  stats: statsData,
  upcoming,
  isLoading: recurringLoading,
  isStatsLoading,
} = useRecurringExpenses()

// Stats computed values
const stats = computed(() => statsData.value ?? {
  totalActive: 0,
  totalPaused: 0,
  totalMonthlyAmount: 0,
  upcomingCount: 0,
})

const isLoading = computed(() => recurringLoading.value || isStatsLoading.value)

// Active recurring expenses
const activeExpenses = computed(() =>
  recurring.value?.filter((r: RecurringExpense) => !r.isPaused) ?? []
)

// Paused recurring expenses
const pausedExpenses = computed(() =>
  recurring.value?.filter((r: RecurringExpense) => r.isPaused) ?? []
)

// Upcoming expenses (next 7 days)
const upcomingThisWeek = computed(() => {
  const upcomingList = upcoming.value ?? []
  const weekFromNow = new Date()
  weekFromNow.setDate(weekFromNow.getDate() + 7)
  return upcomingList.filter((u: { nextOccurrence: string }) => new Date(u.nextOccurrence) <= weekFromNow)
})

// Format frequency for display
const formatFrequency = (freq: string) => {
  const map: Record<string, string> = {
    WEEKLY: 'Weekly',
    MONTHLY: 'Monthly',
    QUARTERLY: 'Quarterly',
    YEARLY: 'Yearly',
  }
  return map[freq] || freq
}

// Format date for display
const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

// Days until next occurrence
const daysUntil = (dateStr: string) => {
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  const target = new Date(dateStr)
  target.setHours(0, 0, 0, 0)
  const diff = Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  if (diff === 0) return 'Today'
  if (diff === 1) return 'Tomorrow'
  if (diff < 0) return 'Overdue'
  return `${diff} days`
}

// Get frequency color
const getFrequencyColor = (freq: string) => {
  const map: Record<string, string> = {
    WEEKLY: 'blue',
    MONTHLY: 'green',
    QUARTERLY: 'orange',
    YEARLY: 'purple',
  }
  return map[freq] || 'grey'
}

// Group recurring by frequency
const groupedByFrequency = computed(() => {
  const groups: Record<string, RecurringExpense[]> = {
    WEEKLY: [],
    MONTHLY: [],
    QUARTERLY: [],
    YEARLY: [],
  }

  const expenses = recurring.value ?? []
  expenses.forEach((exp: RecurringExpense) => {
    if (groups[exp.frequency]) {
      groups[exp.frequency].push(exp)
    }
  })

  return groups
})

// Monthly equivalent amount per frequency group
const monthlyEquivalents = computed(() => {
  const expenses = recurring.value?.filter((r: RecurringExpense) => !r.isPaused) ?? []
  let total = 0

  expenses.forEach((exp: RecurringExpense) => {
    switch (exp.frequency) {
      case 'WEEKLY':
        total += exp.amount * 4.33 // Avg weeks per month
        break
      case 'MONTHLY':
        total += exp.amount
        break
      case 'QUARTERLY':
        total += exp.amount / 3
        break
      case 'YEARLY':
        total += exp.amount / 12
        break
    }
  })

  return total
})
</script>

<template>
  <div>
    <!-- Loading State -->
    <div v-if="isLoading" class="text-center py-8">
      <v-progress-circular indeterminate color="primary" size="48" />
      <p class="mt-4 text-medium-emphasis">Loading recurring expenses...</p>
    </div>

    <!-- Empty State -->
    <v-card v-else-if="!recurring?.length" class="mb-6">
      <v-card-text class="text-center pa-8">
        <v-icon icon="mdi-repeat" size="80" color="primary" class="mb-4" />
        <h2 class="text-h5 mb-2">No Recurring Expenses</h2>
        <p class="text-medium-emphasis mb-6">
          Set up recurring expenses to automatically track regular bills and subscriptions.
        </p>

        <!-- Benefits -->
        <v-row class="mb-6" justify="center">
          <v-col cols="12" sm="4">
            <v-card variant="tonal" color="blue" class="pa-4">
              <v-icon icon="mdi-calendar-clock" size="32" />
              <div class="text-subtitle-1 font-weight-medium mt-2">Auto-Generate</div>
              <div class="text-caption">
                Expenses created automatically on schedule
              </div>
            </v-card>
          </v-col>
          <v-col cols="12" sm="4">
            <v-card variant="tonal" color="purple" class="pa-4">
              <v-icon icon="mdi-bell-ring" size="32" />
              <div class="text-subtitle-1 font-weight-medium mt-2">Reminders</div>
              <div class="text-caption">
                Get notified before bills are due
              </div>
            </v-card>
          </v-col>
          <v-col cols="12" sm="4">
            <v-card variant="tonal" color="green" class="pa-4">
              <v-icon icon="mdi-chart-timeline-variant" size="32" />
              <div class="text-subtitle-1 font-weight-medium mt-2">Track Trends</div>
              <div class="text-caption">
                See your recurring spending patterns
              </div>
            </v-card>
          </v-col>
        </v-row>

        <v-btn color="primary" size="large" @click="emit('create-new')">
          <v-icon icon="mdi-plus" class="mr-2" />
          Add Recurring Expense
        </v-btn>
      </v-card-text>
    </v-card>

    <!-- Overview Content -->
    <template v-else>
      <!-- Summary Cards -->
      <v-row class="mb-6">
        <v-col cols="12" sm="6" md="3">
          <v-card class="pa-4" variant="elevated">
            <div class="d-flex align-center mb-2">
              <v-avatar color="success" variant="tonal" size="36">
                <v-icon icon="mdi-repeat" size="20" />
              </v-avatar>
              <span class="text-body-2 text-medium-emphasis ml-2">Active</span>
            </div>
            <div class="text-h5 font-weight-bold text-success">
              {{ stats.totalActive }}
            </div>
            <div class="text-caption text-medium-emphasis">
              recurring expenses
            </div>
          </v-card>
        </v-col>
        <v-col cols="12" sm="6" md="3">
          <v-card class="pa-4" variant="elevated">
            <div class="d-flex align-center mb-2">
              <v-avatar color="warning" variant="tonal" size="36">
                <v-icon icon="mdi-pause-circle" size="20" />
              </v-avatar>
              <span class="text-body-2 text-medium-emphasis ml-2">Paused</span>
            </div>
            <div class="text-h5 font-weight-bold text-warning">
              {{ stats.totalPaused }}
            </div>
            <div class="text-caption text-medium-emphasis">
              on hold
            </div>
          </v-card>
        </v-col>
        <v-col cols="12" sm="6" md="3">
          <v-card class="pa-4" variant="elevated">
            <div class="d-flex align-center mb-2">
              <v-avatar color="error" variant="tonal" size="36">
                <v-icon icon="mdi-currency-inr" size="20" />
              </v-avatar>
              <span class="text-body-2 text-medium-emphasis ml-2">Monthly Total</span>
            </div>
            <div class="text-h5 font-weight-bold text-error">
              {{ formatINR(monthlyEquivalents) }}
            </div>
            <div class="text-caption text-medium-emphasis">
              estimated monthly
            </div>
          </v-card>
        </v-col>
        <v-col cols="12" sm="6" md="3">
          <v-card class="pa-4" variant="elevated">
            <div class="d-flex align-center mb-2">
              <v-avatar color="info" variant="tonal" size="36">
                <v-icon icon="mdi-calendar-check" size="20" />
              </v-avatar>
              <span class="text-body-2 text-medium-emphasis ml-2">Upcoming</span>
            </div>
            <div class="text-h5 font-weight-bold text-info">
              {{ stats.upcomingCount }}
            </div>
            <div class="text-caption text-medium-emphasis">
              in next 30 days
            </div>
          </v-card>
        </v-col>
      </v-row>

      <!-- Main Content Row -->
      <v-row class="mb-6">
        <!-- Upcoming This Week -->
        <v-col cols="12" md="6">
          <v-card>
            <v-card-title class="d-flex align-center">
              <v-icon icon="mdi-calendar-week" class="mr-2" />
              Due This Week
              <v-chip v-if="upcomingThisWeek.length" size="x-small" color="warning" class="ml-2">
                {{ upcomingThisWeek.length }}
              </v-chip>
            </v-card-title>
            <v-card-text>
              <div v-if="!upcomingThisWeek.length" class="text-center pa-4 text-medium-emphasis">
                <v-icon icon="mdi-check-circle" color="success" size="32" />
                <p class="mt-2">No expenses due this week</p>
              </div>
              <v-list v-else density="compact" lines="two">
                <v-list-item
                  v-for="item in upcomingThisWeek"
                  :key="item.id"
                >
                  <template #prepend>
                    <v-avatar :color="getFrequencyColor(item.frequency)" variant="tonal" size="36">
                      <v-icon icon="mdi-repeat" size="18" />
                    </v-avatar>
                  </template>
                  <v-list-item-title class="font-weight-medium">
                    {{ item.description }}
                  </v-list-item-title>
                  <v-list-item-subtitle>
                    {{ item.category }} &bull; {{ formatFrequency(item.frequency) }}
                  </v-list-item-subtitle>
                  <template #append>
                    <div class="text-right">
                      <div class="font-weight-bold text-error">
                        {{ formatINR(item.amount) }}
                      </div>
                      <div class="text-caption" :class="daysUntil(item.nextOccurrence) === 'Overdue' ? 'text-error' : 'text-medium-emphasis'">
                        {{ daysUntil(item.nextOccurrence) }}
                      </div>
                    </div>
                  </template>
                </v-list-item>
              </v-list>
            </v-card-text>
          </v-card>
        </v-col>

        <!-- Breakdown by Frequency -->
        <v-col cols="12" md="6">
          <v-card>
            <v-card-title>
              <v-icon icon="mdi-chart-timeline-variant" class="mr-2" />
              By Frequency
            </v-card-title>
            <v-card-text>
              <div
                v-for="(expenses, freq) in groupedByFrequency"
                :key="freq"
                class="mb-3"
              >
                <div class="d-flex align-center justify-space-between mb-1">
                  <div class="d-flex align-center">
                    <v-chip
                      size="small"
                      :color="getFrequencyColor(freq)"
                      variant="tonal"
                      class="mr-2"
                    >
                      {{ formatFrequency(freq) }}
                    </v-chip>
                    <span class="text-body-2">{{ expenses.length }} items</span>
                  </div>
                  <span class="font-weight-bold">
                    {{ formatINR(expenses.filter(e => !e.isPaused).reduce((sum, e) => sum + e.amount, 0)) }}
                  </span>
                </div>
                <v-progress-linear
                  v-if="recurring?.length"
                  :model-value="(expenses.length / recurring.length) * 100"
                  :color="getFrequencyColor(freq)"
                  height="4"
                  rounded
                />
              </div>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <!-- Recently Active + Paused -->
      <v-row class="mb-6">
        <!-- Recently Active -->
        <v-col cols="12" md="6">
          <v-card>
            <v-card-title class="d-flex align-center">
              <v-icon icon="mdi-lightning-bolt" class="mr-2" color="success" />
              Active Recurring
              <v-spacer />
              <v-btn
                variant="text"
                size="small"
                color="primary"
                @click="emit('go-to-details')"
              >
                View All
              </v-btn>
            </v-card-title>
            <v-card-text>
              <v-list v-if="activeExpenses.length" density="compact" lines="two">
                <v-list-item
                  v-for="item in activeExpenses.slice(0, 5)"
                  :key="item.id"
                >
                  <template #prepend>
                    <v-avatar :color="getFrequencyColor(item.frequency)" variant="tonal" size="32">
                      <v-icon icon="mdi-repeat" size="16" />
                    </v-avatar>
                  </template>
                  <v-list-item-title>{{ item.description }}</v-list-item-title>
                  <v-list-item-subtitle>
                    Next: {{ formatDate(item.nextOccurrence) }}
                  </v-list-item-subtitle>
                  <template #append>
                    <span class="font-weight-bold">{{ formatINR(item.amount) }}</span>
                  </template>
                </v-list-item>
              </v-list>
              <div v-else class="text-center pa-4 text-medium-emphasis">
                No active recurring expenses
              </div>
            </v-card-text>
          </v-card>
        </v-col>

        <!-- Paused -->
        <v-col cols="12" md="6">
          <v-card>
            <v-card-title class="d-flex align-center">
              <v-icon icon="mdi-pause-circle" class="mr-2" color="warning" />
              Paused
            </v-card-title>
            <v-card-text>
              <v-list v-if="pausedExpenses.length" density="compact" lines="two">
                <v-list-item
                  v-for="item in pausedExpenses.slice(0, 5)"
                  :key="item.id"
                >
                  <template #prepend>
                    <v-avatar color="grey" variant="tonal" size="32">
                      <v-icon icon="mdi-pause" size="16" />
                    </v-avatar>
                  </template>
                  <v-list-item-title class="text-medium-emphasis">
                    {{ item.description }}
                  </v-list-item-title>
                  <v-list-item-subtitle>
                    {{ formatFrequency(item.frequency) }} &bull; {{ item.category }}
                  </v-list-item-subtitle>
                  <template #append>
                    <span class="text-medium-emphasis">{{ formatINR(item.amount) }}</span>
                  </template>
                </v-list-item>
              </v-list>
              <div v-else class="text-center pa-4 text-medium-emphasis">
                <v-icon icon="mdi-check" color="success" />
                <p class="mt-1">No paused items</p>
              </div>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <!-- Quick Actions -->
      <v-card variant="outlined">
        <v-card-text class="d-flex align-center justify-space-between flex-wrap ga-2">
          <div>
            <div class="text-subtitle-2">Manage your recurring expenses</div>
            <div class="text-body-2 text-medium-emphasis">
              Add new subscriptions, bills, or regular payments
            </div>
          </div>
          <div class="d-flex ga-2">
            <v-btn variant="outlined" @click="emit('go-to-details')">
              <v-icon icon="mdi-format-list-bulleted" class="mr-1" />
              View All
            </v-btn>
            <v-btn color="primary" @click="emit('create-new')">
              <v-icon icon="mdi-plus" class="mr-1" />
              Add Recurring
            </v-btn>
          </div>
        </v-card-text>
      </v-card>
    </template>
  </div>
</template>
