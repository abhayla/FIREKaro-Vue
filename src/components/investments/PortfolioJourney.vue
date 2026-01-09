<script setup lang="ts">
import { ref, computed } from 'vue'
import { Line } from 'vue-chartjs'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js'
import {
  usePortfolioJourney,
  useCreatePortfolioSnapshot,
  useDeletePortfolioSnapshot,
  formatINRCompact,
  formatINR,
  type PortfolioSnapshotInput
} from '@/composables/useInvestments'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler)

const { data: journey, isLoading, isError } = usePortfolioJourney()
const createSnapshot = useCreatePortfolioSnapshot()
const deleteSnapshot = useDeletePortfolioSnapshot()

// Dialog states
const showAddDialog = ref(false)
const showDeleteDialog = ref(false)
const deletingId = ref<string | null>(null)

// Form state
const newSnapshot = ref<PortfolioSnapshotInput>({
  date: '',
  totalValue: 0,
  notes: ''
})

// Chart data
const chartData = computed(() => {
  if (!journey.value?.snapshots) return null

  return {
    labels: journey.value.snapshots.map(s => {
      const date = new Date(s.date)
      return date.getFullYear().toString()
    }),
    datasets: [
      {
        label: 'Portfolio Value',
        data: journey.value.snapshots.map(s => s.totalValue),
        borderColor: '#10b981',
        backgroundColor: 'rgba(16, 185, 129, 0.2)',
        fill: true,
        tension: 0.3,
        pointRadius: 6,
        pointBackgroundColor: '#10b981',
        pointBorderColor: '#fff',
        pointBorderWidth: 2
      }
    ]
  }
})

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: false
    },
    tooltip: {
      callbacks: {
        label: (context: { raw: number }) => formatINR(context.raw)
      }
    }
  },
  scales: {
    y: {
      beginAtZero: true,
      ticks: {
        callback: (value: number) => formatINRCompact(value)
      }
    }
  }
}

// Calculate CAGR
const cagr = computed(() => {
  if (!journey.value || journey.value.yearsTracked < 1) return 0
  const { startValue, currentValue, yearsTracked } = journey.value
  if (startValue <= 0) return 0
  return (Math.pow(currentValue / startValue, 1 / yearsTracked) - 1) * 100
})

// Actions
async function handleAddSnapshot() {
  if (!newSnapshot.value.date || newSnapshot.value.totalValue <= 0) return

  await createSnapshot.mutateAsync(newSnapshot.value)
  showAddDialog.value = false
  resetForm()
}

function resetForm() {
  newSnapshot.value = { date: '', totalValue: 0, notes: '' }
}

function confirmDelete(id: string) {
  deletingId.value = id
  showDeleteDialog.value = true
}

async function handleDelete() {
  if (!deletingId.value) return
  await deleteSnapshot.mutateAsync(deletingId.value)
  showDeleteDialog.value = false
  deletingId.value = null
}

// Format date for display
function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'short'
  })
}

// Check if sample data
const isSampleData = computed(() => {
  return journey.value?.snapshots?.some(s => s.id.startsWith('sample-')) ?? false
})
</script>

<template>
  <v-card>
    <v-card-title class="d-flex align-center justify-space-between">
      <div class="d-flex align-center">
        <v-icon icon="mdi-timeline-clock" class="mr-2" />
        Portfolio Journey
      </div>
      <v-btn
        color="primary"
        variant="tonal"
        size="small"
        prepend-icon="mdi-plus"
        @click="showAddDialog = true"
      >
        Add Snapshot
      </v-btn>
    </v-card-title>

    <v-card-text>
      <!-- Sample Data Notice -->
      <v-alert
        v-if="isSampleData"
        type="info"
        variant="tonal"
        density="compact"
        class="mb-4"
      >
        Showing sample journey. Add your historical portfolio values to track your actual journey.
      </v-alert>

      <!-- Loading State -->
      <div v-if="isLoading" class="text-center py-4">
        <v-progress-circular indeterminate color="primary" size="32" />
      </div>

      <!-- Error State -->
      <v-alert v-else-if="isError" type="error" variant="tonal">
        Failed to load portfolio journey.
      </v-alert>

      <!-- Main Content -->
      <template v-else-if="journey && chartData">
        <!-- Summary Stats -->
        <v-row class="mb-4">
          <v-col cols="6" sm="3">
            <div class="text-center">
              <div class="text-body-2 text-medium-emphasis">Started With</div>
              <div class="text-h6 font-weight-bold">
                {{ formatINRCompact(journey.startValue) }}
              </div>
            </div>
          </v-col>
          <v-col cols="6" sm="3">
            <div class="text-center">
              <div class="text-body-2 text-medium-emphasis">Current Value</div>
              <div class="text-h6 font-weight-bold text-success">
                {{ formatINRCompact(journey.currentValue) }}
              </div>
            </div>
          </v-col>
          <v-col cols="6" sm="3">
            <div class="text-center">
              <div class="text-body-2 text-medium-emphasis">Total Growth</div>
              <div class="text-h6 font-weight-bold" :class="journey.totalGrowth >= 0 ? 'text-success' : 'text-error'">
                {{ journey.totalGrowthPercent.toFixed(0) }}%
              </div>
              <div class="text-caption text-medium-emphasis">
                {{ formatINRCompact(journey.totalGrowth) }}
              </div>
            </div>
          </v-col>
          <v-col cols="6" sm="3">
            <div class="text-center">
              <div class="text-body-2 text-medium-emphasis">CAGR</div>
              <div class="text-h6 font-weight-bold text-primary">
                {{ cagr.toFixed(1) }}%
              </div>
              <div class="text-caption text-medium-emphasis">
                over {{ journey.yearsTracked }} years
              </div>
            </div>
          </v-col>
        </v-row>

        <!-- Chart -->
        <div style="height: 300px" class="mb-4">
          <Line :data="chartData" :options="chartOptions as any" />
        </div>

        <!-- Timeline List -->
        <v-expansion-panels variant="accordion">
          <v-expansion-panel>
            <v-expansion-panel-title>
              <v-icon icon="mdi-history" class="mr-2" />
              Historical Snapshots ({{ journey.snapshots.length }})
            </v-expansion-panel-title>
            <v-expansion-panel-text>
              <v-list density="compact" class="bg-transparent">
                <v-list-item
                  v-for="(snapshot, index) in [...journey.snapshots].reverse()"
                  :key="snapshot.id"
                  class="px-0"
                >
                  <template #prepend>
                    <v-avatar
                      :color="index === 0 ? 'success' : 'grey'"
                      size="32"
                      class="mr-3"
                    >
                      <span class="text-caption font-weight-bold">
                        {{ new Date(snapshot.date).getFullYear() }}
                      </span>
                    </v-avatar>
                  </template>

                  <v-list-item-title>
                    {{ formatINRCompact(snapshot.totalValue) }}
                  </v-list-item-title>
                  <v-list-item-subtitle>
                    {{ formatDate(snapshot.date) }}
                    <span v-if="snapshot.notes" class="ml-1">- {{ snapshot.notes }}</span>
                  </v-list-item-subtitle>

                  <template #append>
                    <v-btn
                      v-if="!snapshot.id.startsWith('sample-')"
                      icon="mdi-delete"
                      variant="text"
                      size="small"
                      color="error"
                      @click.stop="confirmDelete(snapshot.id)"
                    />
                  </template>
                </v-list-item>
              </v-list>
            </v-expansion-panel-text>
          </v-expansion-panel>
        </v-expansion-panels>

        <!-- Journey Insight -->
        <v-alert
          v-if="journey.yearsTracked >= 5"
          type="success"
          variant="tonal"
          class="mt-4"
        >
          <v-icon icon="mdi-trophy" class="mr-1" />
          <strong>Long-term investor!</strong> You've been tracking your portfolio for
          {{ journey.yearsTracked }} years. Your wealth has grown
          {{ (journey.currentValue / journey.startValue).toFixed(1) }}x since the beginning.
        </v-alert>
      </template>
    </v-card-text>

    <!-- Add Snapshot Dialog -->
    <v-dialog v-model="showAddDialog" max-width="450">
      <v-card>
        <v-card-title class="d-flex align-center">
          <v-icon icon="mdi-camera-plus" class="mr-2" />
          Add Portfolio Snapshot
        </v-card-title>

        <v-card-text>
          <v-text-field
            v-model="newSnapshot.date"
            label="Date"
            type="date"
            variant="outlined"
            density="comfortable"
            class="mb-3"
          />

          <v-text-field
            v-model.number="newSnapshot.totalValue"
            label="Portfolio Value"
            type="number"
            prefix="₹"
            variant="outlined"
            density="comfortable"
            class="mb-3"
          />

          <v-textarea
            v-model="newSnapshot.notes"
            label="Notes (Optional)"
            placeholder="e.g., Market crash recovery, bonus investment, etc."
            rows="2"
            variant="outlined"
            density="comfortable"
          />

          <v-alert type="info" variant="tonal" density="compact">
            Add historical snapshots to visualize your wealth-building journey over time.
          </v-alert>
        </v-card-text>

        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="showAddDialog = false; resetForm()">
            Cancel
          </v-btn>
          <v-btn
            color="primary"
            variant="flat"
            :disabled="!newSnapshot.date || newSnapshot.totalValue <= 0"
            :loading="createSnapshot.isPending.value"
            @click="handleAddSnapshot"
          >
            Add Snapshot
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Delete Confirmation Dialog -->
    <v-dialog v-model="showDeleteDialog" max-width="400">
      <v-card>
        <v-card-title class="d-flex align-center">
          <v-icon icon="mdi-delete-alert" color="error" class="mr-2" />
          Delete Snapshot
        </v-card-title>

        <v-card-text>
          Are you sure you want to delete this portfolio snapshot?
        </v-card-text>

        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="showDeleteDialog = false">
            Cancel
          </v-btn>
          <v-btn
            color="error"
            variant="flat"
            :loading="deleteSnapshot.isPending.value"
            @click="handleDelete"
          >
            Delete
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-card>
</template>
