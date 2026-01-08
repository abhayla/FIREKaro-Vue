<script setup lang="ts">
import { ref, computed, watch } from 'vue'
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
  formatINR,
  formatINRCompact,
  calculateEPFProjection,
  type EPFData
} from '@/composables/useInvestments'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler)

const props = defineProps<{
  epfData?: EPFData | null
}>()

const emit = defineEmits<{
  update: [data: Partial<EPFData>]
}>()

// Current EPF Interest Rate (FY 2024-25)
const EPF_INTEREST_RATE = 8.25

// Form state
const currentBalance = ref(props.epfData?.currentBalance ?? 0)
const monthlyBasic = ref(props.epfData?.monthlyContribution?.basic ?? 50000)
const vpfContribution = ref(props.epfData?.monthlyContribution?.vpf ?? 0)
const currentAge = ref(30)
const retirementAge = ref(60)

// EPF contribution calculations
const employeeContribution = computed(() => monthlyBasic.value * 0.12)
const employerEPFContribution = computed(() => monthlyBasic.value * 0.0367)
const employerEPSContribution = computed(() => Math.min(monthlyBasic.value * 0.0833, 1250))
const totalMonthlyContribution = computed(
  () => employeeContribution.value + employerEPFContribution.value + vpfContribution.value
)

// Projection
const projection = computed(() =>
  calculateEPFProjection({
    currentBalance: currentBalance.value,
    monthlyContribution: totalMonthlyContribution.value,
    currentAge: currentAge.value,
    retirementAge: retirementAge.value,
    interestRate: EPF_INTEREST_RATE
  })
)

// Chart data
const chartData = computed(() => {
  const years = projection.value.yearsToRetirement
  const labels: string[] = []
  const corpusData: number[] = []
  const contributionData: number[] = []

  let corpus = currentBalance.value
  let contributions = currentBalance.value
  const monthlyRate = EPF_INTEREST_RATE / 12 / 100

  for (let year = 0; year <= years; year++) {
    labels.push(`Year ${year}`)
    corpusData.push(Math.round(corpus))
    contributionData.push(Math.round(contributions))

    for (let month = 0; month < 12; month++) {
      corpus = corpus * (1 + monthlyRate) + totalMonthlyContribution.value
      contributions += totalMonthlyContribution.value
    }
  }

  return {
    labels,
    datasets: [
      {
        label: 'Projected Corpus',
        data: corpusData,
        borderColor: '#4CAF50',
        backgroundColor: 'rgba(76, 175, 80, 0.1)',
        fill: true,
        tension: 0.3
      },
      {
        label: 'Total Contributions',
        data: contributionData,
        borderColor: '#2196F3',
        backgroundColor: 'rgba(33, 150, 243, 0.1)',
        fill: true,
        tension: 0.3
      }
    ]
  }
})

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'bottom' as const
    },
    tooltip: {
      callbacks: {
        label: (context: any) => `${context.dataset.label}: ${formatINR(context.raw)}`
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

const showUpdateDialog = ref(false)

const handleUpdateBalance = () => {
  emit('update', {
    currentBalance: currentBalance.value,
    monthlyContribution: {
      basic: monthlyBasic.value,
      employee: employeeContribution.value,
      employerEPF: employerEPFContribution.value,
      employerEPS: employerEPSContribution.value,
      vpf: vpfContribution.value
    }
  })
  showUpdateDialog.value = false
}
</script>

<template>
  <div class="epf-calculator">
    <!-- Current Status -->
    <v-row class="mb-4">
      <v-col cols="12" md="3">
        <v-card variant="outlined" class="pa-4 text-center">
          <div class="text-caption text-medium-emphasis">Current Balance</div>
          <div class="text-h5 font-weight-bold text-primary">
            {{ formatINRCompact(currentBalance) }}
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
          <div class="text-caption text-medium-emphasis">Monthly Contribution</div>
          <div class="text-h5 font-weight-bold">
            {{ formatINR(totalMonthlyContribution) }}
          </div>
          <div class="text-caption text-medium-emphasis">
            Employee + Employer + VPF
          </div>
        </v-card>
      </v-col>
      <v-col cols="12" md="3">
        <v-card variant="outlined" class="pa-4 text-center">
          <div class="text-caption text-medium-emphasis">Interest Rate</div>
          <div class="text-h5 font-weight-bold text-success">{{ EPF_INTEREST_RATE }}%</div>
          <div class="text-caption text-medium-emphasis">FY 2024-25</div>
        </v-card>
      </v-col>
      <v-col cols="12" md="3">
        <v-card variant="outlined" class="pa-4 text-center">
          <div class="text-caption text-medium-emphasis">Projected at 60</div>
          <div class="text-h5 font-weight-bold text-success">
            {{ formatINRCompact(projection.projectedCorpus) }}
          </div>
          <div class="text-caption text-medium-emphasis">
            {{ projection.yearsToRetirement }} years
          </div>
        </v-card>
      </v-col>
    </v-row>

    <!-- Contribution Breakdown -->
    <v-card variant="outlined" class="mb-4">
      <v-card-title class="text-subtitle-1">Contribution Breakdown (Monthly)</v-card-title>
      <v-card-text>
        <v-row>
          <v-col cols="12" md="6">
            <v-text-field
              v-model.number="monthlyBasic"
              label="Monthly Basic Salary"
              type="number"
              prefix="₹"
              variant="outlined"
              density="comfortable"
              hint="EPF contributions are calculated on this"
              persistent-hint
            />
          </v-col>
          <v-col cols="12" md="6">
            <v-text-field
              v-model.number="vpfContribution"
              label="VPF Contribution"
              type="number"
              prefix="₹"
              variant="outlined"
              density="comfortable"
              hint="Voluntary Provident Fund"
              persistent-hint
            />
          </v-col>
        </v-row>

        <v-table density="compact" class="mt-4">
          <tbody>
            <tr>
              <td>Employee Contribution (12%)</td>
              <td class="text-right font-weight-medium">{{ formatINR(employeeContribution) }}</td>
            </tr>
            <tr>
              <td>Employer EPF (3.67%)</td>
              <td class="text-right font-weight-medium">{{ formatINR(employerEPFContribution) }}</td>
            </tr>
            <tr>
              <td>Employer EPS (8.33% up to ₹15K ceiling)</td>
              <td class="text-right font-weight-medium">{{ formatINR(employerEPSContribution) }}</td>
            </tr>
            <tr>
              <td>VPF</td>
              <td class="text-right font-weight-medium">{{ formatINR(vpfContribution) }}</td>
            </tr>
            <tr class="bg-primary-lighten-5">
              <td class="font-weight-bold">Total to EPF</td>
              <td class="text-right font-weight-bold">{{ formatINR(totalMonthlyContribution) }}</td>
            </tr>
          </tbody>
        </v-table>
      </v-card-text>
    </v-card>

    <!-- Projection Calculator -->
    <v-card variant="outlined" class="mb-4">
      <v-card-title class="text-subtitle-1">Retirement Projection</v-card-title>
      <v-card-text>
        <v-row class="mb-4">
          <v-col cols="12" md="6">
            <v-slider
              v-model="currentAge"
              :min="20"
              :max="55"
              :step="1"
              label="Current Age"
              thumb-label="always"
              color="primary"
            />
          </v-col>
          <v-col cols="12" md="6">
            <v-slider
              v-model="retirementAge"
              :min="55"
              :max="70"
              :step="1"
              label="Retirement Age"
              thumb-label="always"
              color="success"
            />
          </v-col>
        </v-row>

        <div style="height: 300px">
          <Line :data="chartData" :options="chartOptions" />
        </div>

        <v-row class="mt-4">
          <v-col cols="12" md="4">
            <v-card color="success" variant="tonal" class="pa-3 text-center">
              <div class="text-caption">Projected Corpus</div>
              <div class="text-h6 font-weight-bold">
                {{ formatINRCompact(projection.projectedCorpus) }}
              </div>
            </v-card>
          </v-col>
          <v-col cols="12" md="4">
            <v-card color="primary" variant="tonal" class="pa-3 text-center">
              <div class="text-caption">Total Contributions</div>
              <div class="text-h6 font-weight-bold">
                {{ formatINRCompact(projection.totalContributions) }}
              </div>
            </v-card>
          </v-col>
          <v-col cols="12" md="4">
            <v-card color="warning" variant="tonal" class="pa-3 text-center">
              <div class="text-caption">Interest Earned</div>
              <div class="text-h6 font-weight-bold">
                {{ formatINRCompact(projection.totalInterest) }}
              </div>
            </v-card>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <!-- Update Balance Dialog -->
    <v-dialog v-model="showUpdateDialog" max-width="400">
      <v-card>
        <v-card-title>Update EPF Balance</v-card-title>
        <v-card-text>
          <v-text-field
            v-model.number="currentBalance"
            label="Current EPF Balance"
            type="number"
            prefix="₹"
            variant="outlined"
            hint="Enter your latest EPF balance from EPFO portal"
            persistent-hint
          />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="showUpdateDialog = false">Cancel</v-btn>
          <v-btn color="primary" variant="flat" @click="handleUpdateBalance">Save</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>
