<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { Doughnut, Line } from 'vue-chartjs'
import {
  Chart as ChartJS,
  ArcElement,
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
  formatINR,
  formatINRCompact,
  formatPercentage,
  calculateNPSProjection,
  type NPSData
} from '@/composables/useInvestments'

ChartJS.register(
  ArcElement,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
)

const props = defineProps<{
  npsData?: NPSData | null
}>()

const emit = defineEmits<{
  update: [data: Partial<NPSData>]
}>()

// NPS Configuration
const NPS_CONFIG = {
  MIN_ANNUITY_PERCENTAGE: 40,
  SECTION_80CCD_1B_LIMIT: 50000,
  PENSION_FUND_MANAGERS: [
    'SBI Pension Fund',
    'LIC Pension Fund',
    'UTI Retirement Solutions',
    'HDFC Pension Fund',
    'ICICI Prudential PF',
    'Kotak Pension Fund',
    'Aditya Birla SL PF'
  ]
}

// Form state
const currentCorpus = ref(props.npsData?.tier1Balance ?? 0)
const tier2Balance = ref(props.npsData?.tier2Balance ?? 0)
const monthlyContribution = ref(5000)
const currentAge = ref(30)
const retirementAge = ref(60)
const expectedReturns = ref(10)
const annuityPercentage = ref(40)

// Asset allocation
const assetAllocation = ref({
  equityE: props.npsData?.assetAllocation?.equityE ?? 50,
  corporateBondC: props.npsData?.assetAllocation?.corporateBondC ?? 30,
  governmentBondG: props.npsData?.assetAllocation?.governmentBondG ?? 15,
  alternativeA: props.npsData?.assetAllocation?.alternativeA ?? 5
})

const investmentChoice = ref<'active' | 'auto'>(props.npsData?.investmentChoice ?? 'active')

// Allocation validation
const totalAllocation = computed(
  () =>
    assetAllocation.value.equityE +
    assetAllocation.value.corporateBondC +
    assetAllocation.value.governmentBondG +
    assetAllocation.value.alternativeA
)

const isAllocationValid = computed(() => totalAllocation.value === 100)

// Projection
const projection = computed(() =>
  calculateNPSProjection({
    currentCorpus: currentCorpus.value,
    monthlyContribution: monthlyContribution.value,
    currentAge: currentAge.value,
    retirementAge: retirementAge.value,
    expectedReturns: expectedReturns.value,
    annuityPercentage: annuityPercentage.value
  })
)

// Allocation Chart Data
const allocationChartData = computed(() => ({
  labels: ['Equity (E)', 'Corporate Bond (C)', 'Govt Bond (G)', 'Alternative (A)'],
  datasets: [
    {
      data: [
        assetAllocation.value.equityE,
        assetAllocation.value.corporateBondC,
        assetAllocation.value.governmentBondG,
        assetAllocation.value.alternativeA
      ],
      backgroundColor: ['#4CAF50', '#2196F3', '#FF9800', '#9C27B0'],
      borderWidth: 2,
      borderColor: '#ffffff'
    }
  ]
}))

const allocationChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  cutout: '60%',
  plugins: {
    legend: {
      position: 'bottom' as const
    }
  }
}

// Projection Chart Data
const projectionChartData = computed(() => {
  const years = retirementAge.value - currentAge.value
  const labels: string[] = []
  const corpusData: number[] = []

  let corpus = currentCorpus.value
  const monthlyRate = expectedReturns.value / 12 / 100

  for (let year = 0; year <= years; year++) {
    labels.push(`Age ${currentAge.value + year}`)
    corpusData.push(Math.round(corpus))

    for (let month = 0; month < 12; month++) {
      corpus = corpus * (1 + monthlyRate) + monthlyContribution.value
    }
  }

  return {
    labels,
    datasets: [
      {
        label: 'NPS Corpus',
        data: corpusData,
        borderColor: '#4CAF50',
        backgroundColor: 'rgba(76, 175, 80, 0.1)',
        fill: true,
        tension: 0.3
      }
    ]
  }
})

const projectionChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: false
    },
    tooltip: {
      callbacks: {
        label: (context: any) => formatINR(context.raw)
      }
    }
  },
  scales: {
    y: {
      beginAtZero: true,
      ticks: {
        callback: (value: any) => formatINRCompact(value)
      }
    }
  }
}

// Tax benefits calculation
const taxBenefits = computed(() => {
  const yearly = monthlyContribution.value * 12
  const section80CCD1B = Math.min(yearly, NPS_CONFIG.SECTION_80CCD_1B_LIMIT)
  const taxSaved30 = section80CCD1B * 0.3 // Assuming 30% tax bracket
  const taxSaved20 = section80CCD1B * 0.2 // Assuming 20% tax bracket

  return {
    yearlyContribution: yearly,
    section80CCD1B,
    taxSaved30,
    taxSaved20
  }
})

// Update dialog
const showUpdateDialog = ref(false)

const handleUpdate = () => {
  emit('update', {
    tier1Balance: currentCorpus.value,
    tier2Balance: tier2Balance.value,
    assetAllocation: assetAllocation.value,
    investmentChoice: investmentChoice.value
  })
  showUpdateDialog.value = false
}
</script>

<template>
  <div class="nps-calculator">
    <!-- Current Status Cards -->
    <v-row class="mb-4">
      <v-col cols="12" md="3">
        <v-card variant="outlined" class="pa-4 text-center">
          <div class="text-caption text-medium-emphasis">Tier 1 Balance</div>
          <div class="text-h5 font-weight-bold text-primary">
            {{ formatINRCompact(currentCorpus) }}
          </div>
          <v-btn
            variant="text"
            size="small"
            color="primary"
            class="mt-1"
            @click="showUpdateDialog = true"
          >
            Update
          </v-btn>
        </v-card>
      </v-col>
      <v-col cols="12" md="3">
        <v-card variant="outlined" class="pa-4 text-center">
          <div class="text-caption text-medium-emphasis">Tier 2 Balance</div>
          <div class="text-h5 font-weight-bold">
            {{ formatINRCompact(tier2Balance) }}
          </div>
          <div class="text-caption text-medium-emphasis">Optional</div>
        </v-card>
      </v-col>
      <v-col cols="12" md="3">
        <v-card variant="outlined" class="pa-4 text-center">
          <div class="text-caption text-medium-emphasis">Monthly SIP</div>
          <div class="text-h5 font-weight-bold">
            {{ formatINR(monthlyContribution) }}
          </div>
          <div class="text-caption text-medium-emphasis">
            {{ formatINR(monthlyContribution * 12) }}/year
          </div>
        </v-card>
      </v-col>
      <v-col cols="12" md="3">
        <v-card variant="outlined" class="pa-4 text-center">
          <div class="text-caption text-medium-emphasis">Projected at {{ retirementAge }}</div>
          <div class="text-h5 font-weight-bold text-success">
            {{ formatINRCompact(projection.projectedCorpus) }}
          </div>
        </v-card>
      </v-col>
    </v-row>

    <v-row>
      <!-- Asset Allocation -->
      <v-col cols="12" md="5">
        <v-card variant="outlined" class="h-100">
          <v-card-title class="text-subtitle-1 d-flex align-center justify-space-between">
            Asset Allocation
            <v-chip
              :color="isAllocationValid ? 'success' : 'error'"
              size="small"
              variant="tonal"
            >
              {{ totalAllocation }}%
            </v-chip>
          </v-card-title>
          <v-card-text>
            <div style="height: 180px" class="mb-4">
              <Doughnut :data="allocationChartData" :options="allocationChartOptions" />
            </div>

            <v-btn-toggle
              v-model="investmentChoice"
              mandatory
              density="compact"
              color="primary"
              class="mb-4 w-100"
            >
              <v-btn value="active" class="flex-grow-1">Active Choice</v-btn>
              <v-btn value="auto" class="flex-grow-1">Auto Choice</v-btn>
            </v-btn-toggle>

            <template v-if="investmentChoice === 'active'">
              <v-slider
                v-model="assetAllocation.equityE"
                :max="75"
                :min="0"
                label="Equity (E)"
                thumb-label
                color="success"
                density="compact"
              />
              <v-slider
                v-model="assetAllocation.corporateBondC"
                :max="100"
                :min="0"
                label="Corporate (C)"
                thumb-label
                color="primary"
                density="compact"
              />
              <v-slider
                v-model="assetAllocation.governmentBondG"
                :max="100"
                :min="0"
                label="Govt Bond (G)"
                thumb-label
                color="warning"
                density="compact"
              />
              <v-slider
                v-model="assetAllocation.alternativeA"
                :max="5"
                :min="0"
                label="Alternative (A)"
                thumb-label
                color="purple"
                density="compact"
              />
            </template>

            <v-alert v-if="investmentChoice === 'auto'" type="info" variant="tonal" density="compact">
              Auto Choice adjusts allocation based on your age. Equity reduces from 75% at age 35 to 15% at age 55.
            </v-alert>
          </v-card-text>
        </v-card>
      </v-col>

      <!-- Projection Calculator -->
      <v-col cols="12" md="7">
        <v-card variant="outlined" class="h-100">
          <v-card-title class="text-subtitle-1">Retirement Projection</v-card-title>
          <v-card-text>
            <v-row class="mb-2">
              <v-col cols="6">
                <v-text-field
                  v-model.number="monthlyContribution"
                  label="Monthly SIP"
                  type="number"
                  prefix="₹"
                  variant="outlined"
                  density="compact"
                  hide-details
                />
              </v-col>
              <v-col cols="6">
                <v-text-field
                  v-model.number="expectedReturns"
                  label="Expected Returns %"
                  type="number"
                  suffix="%"
                  variant="outlined"
                  density="compact"
                  hide-details
                />
              </v-col>
            </v-row>

            <v-row class="mb-2">
              <v-col cols="6">
                <v-slider
                  v-model="currentAge"
                  :min="18"
                  :max="55"
                  label="Current Age"
                  thumb-label="always"
                  density="compact"
                  color="primary"
                />
              </v-col>
              <v-col cols="6">
                <v-slider
                  v-model="retirementAge"
                  :min="55"
                  :max="70"
                  label="Retirement Age"
                  thumb-label="always"
                  density="compact"
                  color="success"
                />
              </v-col>
            </v-row>

            <div style="height: 200px" class="mb-4">
              <Line :data="projectionChartData" :options="projectionChartOptions" />
            </div>

            <v-slider
              v-model="annuityPercentage"
              :min="40"
              :max="100"
              :step="5"
              label="Annuity %"
              thumb-label="always"
              color="warning"
              density="compact"
              hint="Minimum 40% must be used for annuity"
              persistent-hint
            />
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Results Cards -->
    <v-row class="mt-4">
      <v-col cols="12" md="3">
        <v-card color="success" variant="tonal" class="pa-4 text-center">
          <div class="text-caption">Total Corpus</div>
          <div class="text-h6 font-weight-bold">
            {{ formatINRCompact(projection.projectedCorpus) }}
          </div>
        </v-card>
      </v-col>
      <v-col cols="12" md="3">
        <v-card color="primary" variant="tonal" class="pa-4 text-center">
          <div class="text-caption">Lumpsum ({{ 100 - annuityPercentage }}%)</div>
          <div class="text-h6 font-weight-bold">
            {{ formatINRCompact(projection.lumpsumWithdrawal) }}
          </div>
        </v-card>
      </v-col>
      <v-col cols="12" md="3">
        <v-card color="warning" variant="tonal" class="pa-4 text-center">
          <div class="text-caption">Annuity Purchase</div>
          <div class="text-h6 font-weight-bold">
            {{ formatINRCompact(projection.annuityInvestment) }}
          </div>
        </v-card>
      </v-col>
      <v-col cols="12" md="3">
        <v-card color="purple" variant="tonal" class="pa-4 text-center">
          <div class="text-caption">Est. Monthly Pension</div>
          <div class="text-h6 font-weight-bold">
            {{ formatINR(projection.estimatedMonthlyPension) }}
          </div>
        </v-card>
      </v-col>
    </v-row>

    <!-- Tax Benefits -->
    <v-card variant="outlined" class="mt-4">
      <v-card-title class="text-subtitle-1">Tax Benefits (Section 80CCD)</v-card-title>
      <v-card-text>
        <v-row>
          <v-col cols="12" md="6">
            <v-table density="compact">
              <tbody>
                <tr>
                  <td>Yearly Contribution</td>
                  <td class="text-right font-weight-medium">
                    {{ formatINR(taxBenefits.yearlyContribution) }}
                  </td>
                </tr>
                <tr>
                  <td>80CCD(1B) Deduction (Max ₹50K)</td>
                  <td class="text-right font-weight-medium">
                    {{ formatINR(taxBenefits.section80CCD1B) }}
                  </td>
                </tr>
              </tbody>
            </v-table>
          </v-col>
          <v-col cols="12" md="6">
            <v-alert type="success" variant="tonal" density="compact">
              <div class="d-flex justify-space-between">
                <span>Tax saved (30% bracket):</span>
                <strong>{{ formatINR(taxBenefits.taxSaved30) }}</strong>
              </div>
              <div class="d-flex justify-space-between mt-1">
                <span>Tax saved (20% bracket):</span>
                <strong>{{ formatINR(taxBenefits.taxSaved20) }}</strong>
              </div>
            </v-alert>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <!-- Update Dialog -->
    <v-dialog v-model="showUpdateDialog" max-width="400">
      <v-card>
        <v-card-title>Update NPS Balance</v-card-title>
        <v-card-text>
          <v-text-field
            v-model.number="currentCorpus"
            label="Tier 1 Balance"
            type="number"
            prefix="₹"
            variant="outlined"
            class="mb-3"
          />
          <v-text-field
            v-model.number="tier2Balance"
            label="Tier 2 Balance"
            type="number"
            prefix="₹"
            variant="outlined"
            hint="Optional voluntary account"
            persistent-hint
          />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="showUpdateDialog = false">Cancel</v-btn>
          <v-btn color="primary" variant="flat" @click="handleUpdate">Save</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>
