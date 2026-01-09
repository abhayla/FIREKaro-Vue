<script setup lang="ts">
import { ref, computed } from 'vue'
import SectionHeader from '@/components/shared/SectionHeader.vue'
import {
  useESOPGrants,
  useESOPSummary,
  useCreateESOPGrant,
  useExerciseESOPGrant,
  useUpdateESOPFMV,
  formatINRCompact,
  formatINR,
  type ESOPGrant,
  type ESOPVestingEvent
} from '@/composables/useInvestments'

const tabs = [
  { title: 'Portfolio', route: '/dashboard/investments' },
  { title: 'Stocks', route: '/dashboard/investments/stocks' },
  { title: 'Mutual Funds', route: '/dashboard/investments/mutual-funds' },
  { title: 'EPF & PPF', route: '/dashboard/investments/epf-ppf' },
  { title: 'NPS', route: '/dashboard/investments/nps' },
  { title: 'ESOPs', route: '/dashboard/investments/esop' },
  { title: 'Property', route: '/dashboard/investments/property' },
  { title: 'Reports', route: '/dashboard/investments/reports' },
]

// Data fetching
const { data: esopData, isLoading } = useESOPGrants()
const { data: summary } = useESOPSummary()
const createGrant = useCreateESOPGrant()
const exerciseGrant = useExerciseESOPGrant()
const updateFMV = useUpdateESOPFMV()

// Mock data for demo
const mockGrants: ESOPGrant[] = [
  {
    id: '1',
    grantType: 'ESOP',
    grantDate: '2022-04-01',
    grantNumber: 'ESOP-2022-001',
    companyName: 'TechCorp India Pvt Ltd',
    companySymbol: undefined,
    totalUnits: 10000,
    grantPrice: 100,
    fairMarketValue: 150,
    currentFMV: 450,
    vestingScheduleType: 'GRADED',
    vestingStartDate: '2022-04-01',
    cliffMonths: 12,
    totalVestingMonths: 48,
    vestingFrequency: 12,
    status: 'PARTIALLY_VESTED',
    vestedUnits: 5000,
    exercisedUnits: 2000,
    exercisableUnits: 3000,
    unvestedUnits: 5000,
    forfeitedUnits: 0,
    perquisiteValue: 700000,
    taxPaid: 210000,
    isListedCompany: false,
    isStartup: true,
    planName: 'ESOP 2022',
    vestingEvents: [
      { id: 'v1', vestingDate: '2023-04-01', unitsVested: 2500, vestingPercentage: 25, fmvAtVesting: 200, exercisePrice: 100, perquisiteValue: 250000, isExercised: true, exerciseDate: '2023-06-15', unitsExercised: 2000, salePrice: 350, status: 'EXERCISED' },
      { id: 'v2', vestingDate: '2024-04-01', unitsVested: 2500, vestingPercentage: 25, fmvAtVesting: 350, exercisePrice: 100, perquisiteValue: 625000, isExercised: false, status: 'VESTED' },
      { id: 'v3', vestingDate: '2025-04-01', unitsVested: 2500, vestingPercentage: 25, fmvAtVesting: 450, exercisePrice: 100, perquisiteValue: 875000, isExercised: false, status: 'PENDING' },
      { id: 'v4', vestingDate: '2026-04-01', unitsVested: 2500, vestingPercentage: 25, fmvAtVesting: 450, exercisePrice: 100, perquisiteValue: 875000, isExercised: false, status: 'PENDING' },
    ]
  },
  {
    id: '2',
    grantType: 'RSU',
    grantDate: '2023-01-15',
    grantNumber: 'RSU-2023-042',
    companyName: 'Global Tech Ltd',
    companySymbol: 'GTECH',
    totalUnits: 500,
    grantPrice: 0,
    fairMarketValue: 2500,
    currentFMV: 3200,
    vestingScheduleType: 'CLIFF',
    vestingStartDate: '2023-01-15',
    cliffMonths: 24,
    totalVestingMonths: 24,
    vestingFrequency: 24,
    status: 'ACTIVE',
    vestedUnits: 0,
    exercisedUnits: 0,
    exercisableUnits: 0,
    unvestedUnits: 500,
    forfeitedUnits: 0,
    perquisiteValue: 0,
    taxPaid: 0,
    isListedCompany: true,
    isStartup: false,
    planName: 'RSU Plan 2023',
    vestingEvents: [
      { id: 'v5', vestingDate: '2025-01-15', unitsVested: 500, vestingPercentage: 100, fmvAtVesting: 3200, exercisePrice: 0, perquisiteValue: 1600000, isExercised: false, status: 'PENDING' },
    ]
  }
]

const grants = computed(() => esopData.value?.grants?.length ? esopData.value.grants : mockGrants)

const mockSummary = computed(() => ({
  totalGrants: mockGrants.length,
  activeGrants: mockGrants.filter(g => g.status !== 'EXERCISED' && g.status !== 'CANCELLED').length,
  totalUnits: mockGrants.reduce((sum, g) => sum + g.totalUnits, 0),
  vestedUnits: mockGrants.reduce((sum, g) => sum + g.vestedUnits, 0),
  exercisedUnits: mockGrants.reduce((sum, g) => sum + g.exercisedUnits, 0),
  exercisableUnits: mockGrants.reduce((sum, g) => sum + g.exercisableUnits, 0),
  unvestedUnits: mockGrants.reduce((sum, g) => sum + g.unvestedUnits, 0),
  totalCurrentValue: mockGrants.reduce((sum, g) => sum + g.totalUnits * (g.currentFMV || g.fairMarketValue), 0),
  vestedValue: mockGrants.reduce((sum, g) => sum + g.vestedUnits * (g.currentFMV || g.fairMarketValue), 0),
  exercisableValue: mockGrants.reduce((sum, g) => sum + g.exercisableUnits * (g.currentFMV || g.fairMarketValue), 0),
  unvestedValue: mockGrants.reduce((sum, g) => sum + g.unvestedUnits * (g.currentFMV || g.fairMarketValue), 0),
  totalPerquisiteValue: mockGrants.reduce((sum, g) => sum + (g.perquisiteValue || 0), 0),
  totalTaxPaid: mockGrants.reduce((sum, g) => sum + g.taxPaid, 0),
  companies: [...new Set(mockGrants.map(g => g.companyName))]
}))

const displaySummary = computed(() => summary.value?.totalGrants ? summary.value : mockSummary.value)

// Dialogs
const showAddDialog = ref(false)
const showExerciseDialog = ref(false)
const selectedGrant = ref<ESOPGrant | null>(null)
const exerciseUnits = ref(0)

// Grant type colors
const grantTypeColor = (type: string) => {
  switch (type) {
    case 'ESOP': return 'primary'
    case 'RSU': return 'success'
    case 'RSA': return 'info'
    case 'SAR': return 'warning'
    case 'PHANTOM': return 'purple'
    default: return 'grey'
  }
}

// Status colors
const statusColor = (status: string) => {
  switch (status) {
    case 'ACTIVE': return 'info'
    case 'PARTIALLY_VESTED': return 'warning'
    case 'FULLY_VESTED': return 'success'
    case 'EXERCISED': return 'primary'
    case 'EXPIRED': return 'error'
    case 'CANCELLED': return 'grey'
    case 'FORFEITED': return 'error'
    default: return 'grey'
  }
}

// Format vesting progress
const vestingProgress = (grant: ESOPGrant) => {
  return grant.totalUnits > 0 ? (grant.vestedUnits / grant.totalUnits) * 100 : 0
}

// Calculate days until next vesting
const daysUntilNextVesting = (grant: ESOPGrant) => {
  const nextEvent = grant.vestingEvents?.find(e => e.status === 'PENDING')
  if (!nextEvent) return null
  const days = Math.ceil((new Date(nextEvent.vestingDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
  return days > 0 ? days : null
}

// Open exercise dialog
const openExerciseDialog = (grant: ESOPGrant) => {
  selectedGrant.value = grant
  exerciseUnits.value = grant.exercisableUnits
  showExerciseDialog.value = true
}

// Handle exercise
const handleExercise = async () => {
  if (!selectedGrant.value) return
  await exerciseGrant.mutateAsync({
    grantId: selectedGrant.value.id,
    units: exerciseUnits.value
  })
  showExerciseDialog.value = false
}
</script>

<template>
  <div>
    <SectionHeader
      title="Investments"
      subtitle="ESOPs & RSUs"
      icon="mdi-chart-line"
      :tabs="tabs"
    />

    <!-- Summary Cards -->
    <v-row class="mb-6">
      <v-col cols="12" md="3">
        <v-card class="pa-4 text-center">
          <v-icon icon="mdi-cash-multiple" size="32" color="primary" class="mb-2" />
          <div class="text-body-2 text-medium-emphasis">Total Value</div>
          <div class="text-h5 font-weight-bold">
            {{ formatINRCompact(displaySummary.totalCurrentValue) }}
          </div>
          <div class="text-caption">{{ displaySummary.totalUnits.toLocaleString() }} units</div>
        </v-card>
      </v-col>
      <v-col cols="12" md="3">
        <v-card class="pa-4 text-center" color="success" variant="tonal">
          <v-icon icon="mdi-check-circle" size="32" class="mb-2" />
          <div class="text-body-2 text-medium-emphasis">Vested Value</div>
          <div class="text-h5 font-weight-bold">{{ formatINRCompact(displaySummary.vestedValue) }}</div>
          <div class="text-caption">{{ displaySummary.vestedUnits.toLocaleString() }} units</div>
        </v-card>
      </v-col>
      <v-col cols="12" md="3">
        <v-card class="pa-4 text-center" color="warning" variant="tonal">
          <v-icon icon="mdi-hand-coin" size="32" class="mb-2" />
          <div class="text-body-2 text-medium-emphasis">Exercisable</div>
          <div class="text-h5 font-weight-bold">{{ formatINRCompact(displaySummary.exercisableValue) }}</div>
          <div class="text-caption">{{ displaySummary.exercisableUnits.toLocaleString() }} units</div>
        </v-card>
      </v-col>
      <v-col cols="12" md="3">
        <v-card class="pa-4 text-center" variant="outlined">
          <v-icon icon="mdi-clock-outline" size="32" color="info" class="mb-2" />
          <div class="text-body-2 text-medium-emphasis">Unvested</div>
          <div class="text-h5 font-weight-bold">{{ formatINRCompact(displaySummary.unvestedValue) }}</div>
          <div class="text-caption">{{ displaySummary.unvestedUnits.toLocaleString() }} units</div>
        </v-card>
      </v-col>
    </v-row>

    <!-- Quick Actions -->
    <v-card variant="outlined" class="mb-6">
      <v-card-text class="d-flex gap-2 flex-wrap">
        <v-btn color="primary" prepend-icon="mdi-plus" @click="showAddDialog = true">
          Add Grant
        </v-btn>
        <v-chip color="info" variant="tonal">
          <v-icon icon="mdi-office-building" class="mr-1" />
          {{ displaySummary.companies.length }} {{ displaySummary.companies.length === 1 ? 'Company' : 'Companies' }}
        </v-chip>
        <v-chip color="success" variant="tonal">
          <v-icon icon="mdi-file-document" class="mr-1" />
          {{ displaySummary.activeGrants }} Active Grants
        </v-chip>
        <v-chip v-if="displaySummary.totalTaxPaid > 0" color="warning" variant="tonal">
          <v-icon icon="mdi-receipt" class="mr-1" />
          Tax Paid: {{ formatINRCompact(displaySummary.totalTaxPaid) }}
        </v-chip>
      </v-card-text>
    </v-card>

    <!-- Loading State -->
    <template v-if="isLoading">
      <v-skeleton-loader type="card, card" />
    </template>

    <!-- Grants List -->
    <template v-else>
      <v-row>
        <v-col v-for="grant in grants" :key="grant.id" cols="12" lg="6">
          <v-card variant="outlined" class="h-100">
            <v-card-title class="d-flex align-center">
              <div>
                <div class="d-flex align-center gap-2">
                  <v-chip :color="grantTypeColor(grant.grantType)" size="small" label>
                    {{ grant.grantType }}
                  </v-chip>
                  <span class="text-h6">{{ grant.companyName }}</span>
                </div>
                <div class="text-caption text-medium-emphasis">
                  {{ grant.planName || `Grant #${grant.grantNumber}` }}
                </div>
              </div>
              <v-spacer />
              <v-chip :color="statusColor(grant.status)" size="small">
                {{ grant.status.replace('_', ' ') }}
              </v-chip>
            </v-card-title>

            <v-card-text>
              <!-- Value Summary -->
              <v-row dense class="mb-3">
                <v-col cols="6">
                  <div class="text-caption text-medium-emphasis">Current Value</div>
                  <div class="text-h6 font-weight-bold text-currency">
                    {{ formatINR(grant.totalUnits * (grant.currentFMV || grant.fairMarketValue)) }}
                  </div>
                </v-col>
                <v-col cols="6">
                  <div class="text-caption text-medium-emphasis">Exercisable Value</div>
                  <div class="text-h6 font-weight-bold text-success text-currency">
                    {{ formatINR(grant.exercisableUnits * (grant.currentFMV || grant.fairMarketValue)) }}
                  </div>
                </v-col>
              </v-row>

              <!-- Vesting Progress -->
              <div class="mb-3">
                <div class="d-flex justify-space-between text-caption mb-1">
                  <span>Vesting Progress</span>
                  <span>{{ vestingProgress(grant).toFixed(0) }}%</span>
                </div>
                <v-progress-linear
                  :model-value="vestingProgress(grant)"
                  color="success"
                  height="8"
                  rounded
                />
              </div>

              <!-- Units Breakdown -->
              <v-row dense class="text-center mb-3">
                <v-col cols="3">
                  <div class="text-h6">{{ grant.totalUnits.toLocaleString() }}</div>
                  <div class="text-caption text-medium-emphasis">Total</div>
                </v-col>
                <v-col cols="3">
                  <div class="text-h6 text-success">{{ grant.vestedUnits.toLocaleString() }}</div>
                  <div class="text-caption text-medium-emphasis">Vested</div>
                </v-col>
                <v-col cols="3">
                  <div class="text-h6 text-warning">{{ grant.exercisableUnits.toLocaleString() }}</div>
                  <div class="text-caption text-medium-emphasis">Exercisable</div>
                </v-col>
                <v-col cols="3">
                  <div class="text-h6 text-info">{{ grant.unvestedUnits.toLocaleString() }}</div>
                  <div class="text-caption text-medium-emphasis">Unvested</div>
                </v-col>
              </v-row>

              <!-- Grant Details -->
              <v-divider class="my-3" />
              <div class="d-flex flex-wrap gap-2 text-caption">
                <v-chip size="x-small" variant="outlined">
                  Grant: {{ new Date(grant.grantDate).toLocaleDateString('en-IN') }}
                </v-chip>
                <v-chip v-if="grant.grantPrice > 0" size="x-small" variant="outlined">
                  Exercise: {{ formatINR(grant.grantPrice) }}
                </v-chip>
                <v-chip size="x-small" variant="outlined" color="success">
                  FMV: {{ formatINR(grant.currentFMV || grant.fairMarketValue) }}
                </v-chip>
                <v-chip v-if="daysUntilNextVesting(grant)" size="x-small" variant="tonal" color="info">
                  Next vest: {{ daysUntilNextVesting(grant) }} days
                </v-chip>
                <v-chip v-if="grant.isStartup" size="x-small" color="purple" variant="tonal">
                  Startup
                </v-chip>
                <v-chip v-if="grant.isListedCompany" size="x-small" color="primary" variant="tonal">
                  Listed
                </v-chip>
              </div>
            </v-card-text>

            <v-card-actions>
              <v-btn
                v-if="grant.exercisableUnits > 0"
                color="success"
                variant="tonal"
                @click="openExerciseDialog(grant)"
              >
                Exercise Options
              </v-btn>
              <v-spacer />
              <v-btn variant="text" size="small">
                View Schedule
              </v-btn>
              <v-btn variant="text" size="small" icon="mdi-pencil" />
            </v-card-actions>
          </v-card>
        </v-col>
      </v-row>
    </template>

    <!-- Info Cards -->
    <v-row class="mt-6">
      <v-col cols="12" md="6">
        <v-card variant="outlined" class="h-100">
          <v-card-title class="text-subtitle-1">
            <v-icon icon="mdi-information" class="mr-2" />
            ESOP Tax Rules (India)
          </v-card-title>
          <v-card-text>
            <v-table density="compact">
              <tbody>
                <tr>
                  <td class="font-weight-bold">At Vesting</td>
                  <td>FMV - Exercise Price taxed as perquisite (salary income)</td>
                </tr>
                <tr>
                  <td class="font-weight-bold">At Exercise/Sale</td>
                  <td>Sale Price - FMV at vesting = Capital Gains</td>
                </tr>
                <tr>
                  <td>Listed (STCG)</td>
                  <td>20% if sold within 12 months of vesting</td>
                </tr>
                <tr>
                  <td>Listed (LTCG)</td>
                  <td>12.5% above Rs 1.25L exemption</td>
                </tr>
                <tr>
                  <td>Unlisted (STCG)</td>
                  <td>Slab rate if sold within 24 months</td>
                </tr>
                <tr>
                  <td>Unlisted (LTCG)</td>
                  <td>12.5% (no indexation from 2024)</td>
                </tr>
                <tr>
                  <td class="text-success font-weight-bold">Startup Benefit</td>
                  <td class="text-success">Tax deferral for 4 years or exit (DPIIT registered)</td>
                </tr>
              </tbody>
            </v-table>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" md="6">
        <v-card variant="outlined" class="h-100">
          <v-card-title class="text-subtitle-1">
            <v-icon icon="mdi-chart-timeline-variant" class="mr-2" />
            Vesting Schedule Types
          </v-card-title>
          <v-card-text>
            <v-list density="compact">
              <v-list-item>
                <template #prepend>
                  <v-avatar color="primary" size="32">C</v-avatar>
                </template>
                <v-list-item-title>Cliff Vesting</v-list-item-title>
                <v-list-item-subtitle>All units vest at once after cliff period (e.g., 100% after 2 years)</v-list-item-subtitle>
              </v-list-item>
              <v-list-item>
                <template #prepend>
                  <v-avatar color="success" size="32">G</v-avatar>
                </template>
                <v-list-item-title>Graded Vesting</v-list-item-title>
                <v-list-item-subtitle>Units vest gradually (e.g., 25% per year over 4 years)</v-list-item-subtitle>
              </v-list-item>
              <v-list-item>
                <template #prepend>
                  <v-avatar color="warning" size="32">H</v-avatar>
                </template>
                <v-list-item-title>Hybrid (Cliff + Graded)</v-list-item-title>
                <v-list-item-subtitle>Initial cliff, then graded (e.g., 25% at year 1, then monthly)</v-list-item-subtitle>
              </v-list-item>
              <v-list-item>
                <template #prepend>
                  <v-avatar color="info" size="32">M</v-avatar>
                </template>
                <v-list-item-title>Milestone-based</v-list-item-title>
                <v-list-item-subtitle>Vest on achieving specific targets (IPO, revenue, etc.)</v-list-item-subtitle>
              </v-list-item>
            </v-list>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Exercise Dialog -->
    <v-dialog v-model="showExerciseDialog" max-width="500">
      <v-card v-if="selectedGrant">
        <v-card-title>Exercise Options</v-card-title>
        <v-card-text>
          <div class="mb-4">
            <div class="text-subtitle-2">{{ selectedGrant.companyName }}</div>
            <div class="text-caption text-medium-emphasis">{{ selectedGrant.planName }}</div>
          </div>

          <v-row dense class="mb-4">
            <v-col cols="6">
              <div class="text-caption text-medium-emphasis">Exercisable Units</div>
              <div class="text-h6">{{ selectedGrant.exercisableUnits.toLocaleString() }}</div>
            </v-col>
            <v-col cols="6">
              <div class="text-caption text-medium-emphasis">Exercise Price</div>
              <div class="text-h6">{{ formatINR(selectedGrant.grantPrice) }}</div>
            </v-col>
          </v-row>

          <v-text-field
            v-model.number="exerciseUnits"
            label="Units to Exercise"
            type="number"
            :max="selectedGrant.exercisableUnits"
            :rules="[v => v > 0 || 'Must be greater than 0', v => v <= selectedGrant!.exercisableUnits || 'Cannot exceed exercisable units']"
          />

          <v-alert type="info" variant="tonal" density="compact" class="mt-4">
            <div class="text-subtitle-2">Cost to Exercise</div>
            <div class="text-h6">{{ formatINR(exerciseUnits * selectedGrant.grantPrice) }}</div>
            <div class="text-caption mt-2">
              Current Value: {{ formatINR(exerciseUnits * (selectedGrant.currentFMV || selectedGrant.fairMarketValue)) }}
            </div>
          </v-alert>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="showExerciseDialog = false">Cancel</v-btn>
          <v-btn
            color="success"
            variant="flat"
            :loading="exerciseGrant.isPending.value"
            @click="handleExercise"
          >
            Exercise
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Add Grant Dialog (placeholder) -->
    <v-dialog v-model="showAddDialog" max-width="600">
      <v-card>
        <v-card-title>Add ESOP/RSU Grant</v-card-title>
        <v-card-text>
          <v-alert type="info" variant="tonal">
            Grant form will be implemented here. For now, grants can be added via the API.
          </v-alert>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="showAddDialog = false">Close</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>
