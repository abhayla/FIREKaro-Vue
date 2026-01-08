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
  formatINR,
  formatINRCompact,
  calculatePPFMaturity,
  type PPFData
} from '@/composables/useInvestments'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler)

const props = defineProps<{
  ppfData?: PPFData | null
}>()

const emit = defineEmits<{
  update: [data: Partial<PPFData>]
  deposit: [amount: number]
}>()

// PPF Rules
const PPF_CONFIG = {
  INTEREST_RATE: 7.1,
  MIN_DEPOSIT: 500,
  MAX_DEPOSIT: 150000,
  TENURE_YEARS: 15,
  WITHDRAWAL_YEAR: 7,
  LOAN_START_YEAR: 3,
  LOAN_END_YEAR: 6
}

// Form state
const currentBalance = ref(props.ppfData?.currentBalance ?? 0)
const totalDeposits = ref(props.ppfData?.totalDeposits ?? 0)
const currentFYDeposits = ref(props.ppfData?.currentFYDeposits ?? 0)
const yearlyDeposit = ref(150000) // Max for projection
const yearsRemaining = ref(10)

// Calculations
const totalInterestEarned = computed(() => currentBalance.value - totalDeposits.value)
const remainingFYLimit = computed(() => PPF_CONFIG.MAX_DEPOSIT - currentFYDeposits.value)

// PPF Maturity Projection
const projection = computed(() =>
  calculatePPFMaturity({
    currentBalance: currentBalance.value,
    yearlyDeposit: yearlyDeposit.value,
    yearsRemaining: yearsRemaining.value,
    interestRate: PPF_CONFIG.INTEREST_RATE
  })
)

// Chart Data
const chartData = computed(() => ({
  labels: projection.value.yearlyBreakdown.map((y) => `Year ${y.year}`),
  datasets: [
    {
      label: 'Balance',
      data: projection.value.yearlyBreakdown.map((y) => y.balance),
      borderColor: '#4CAF50',
      backgroundColor: 'rgba(76, 175, 80, 0.1)',
      fill: true,
      tension: 0.3
    }
  ]
}))

const chartOptions = {
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

// Deposit dialog
const showDepositDialog = ref(false)
const depositAmount = ref(0)

const handleDeposit = () => {
  if (depositAmount.value > 0 && depositAmount.value <= remainingFYLimit.value) {
    emit('deposit', depositAmount.value)
    currentFYDeposits.value += depositAmount.value
    currentBalance.value += depositAmount.value
    totalDeposits.value += depositAmount.value
    showDepositDialog.value = false
    depositAmount.value = 0
  }
}

// Withdrawal eligibility
const canWithdraw = computed(() => {
  if (!props.ppfData?.openingDate) return false
  const openingYear = new Date(props.ppfData.openingDate).getFullYear()
  const currentYear = new Date().getFullYear()
  return currentYear - openingYear >= 6
})

// Loan eligibility
const loanEligibility = computed(() => {
  if (!props.ppfData?.openingDate) return { eligible: false, maxAmount: 0 }
  const openingYear = new Date(props.ppfData.openingDate).getFullYear()
  const currentYear = new Date().getFullYear()
  const accountAge = currentYear - openingYear

  if (accountAge >= PPF_CONFIG.LOAN_START_YEAR && accountAge <= PPF_CONFIG.LOAN_END_YEAR) {
    // Max 25% of balance at end of 2nd preceding FY
    const maxLoanAmount = currentBalance.value * 0.25
    return { eligible: true, maxAmount: maxLoanAmount }
  }
  return { eligible: false, maxAmount: 0 }
})
</script>

<template>
  <div class="ppf-tracker">
    <!-- Current Status Cards -->
    <v-row class="mb-4">
      <v-col cols="12" md="3">
        <v-card variant="outlined" class="pa-4 text-center">
          <div class="text-caption text-medium-emphasis">Current Balance</div>
          <div class="text-h5 font-weight-bold text-primary">
            {{ formatINRCompact(currentBalance) }}
          </div>
        </v-card>
      </v-col>
      <v-col cols="12" md="3">
        <v-card variant="outlined" class="pa-4 text-center">
          <div class="text-caption text-medium-emphasis">Interest Earned</div>
          <div class="text-h5 font-weight-bold text-success">
            {{ formatINRCompact(totalInterestEarned) }}
          </div>
        </v-card>
      </v-col>
      <v-col cols="12" md="3">
        <v-card variant="outlined" class="pa-4 text-center">
          <div class="text-caption text-medium-emphasis">FY Deposits</div>
          <div class="text-h5 font-weight-bold">
            {{ formatINR(currentFYDeposits) }}
          </div>
          <div class="text-caption text-medium-emphasis">
            Limit: ₹{{ (PPF_CONFIG.MAX_DEPOSIT / 100000).toFixed(1) }}L
          </div>
        </v-card>
      </v-col>
      <v-col cols="12" md="3">
        <v-card variant="outlined" class="pa-4 text-center">
          <div class="text-caption text-medium-emphasis">Interest Rate</div>
          <div class="text-h5 font-weight-bold text-success">{{ PPF_CONFIG.INTEREST_RATE }}%</div>
          <div class="text-caption text-medium-emphasis">Tax-free (EEE)</div>
        </v-card>
      </v-col>
    </v-row>

    <!-- Actions Row -->
    <v-row class="mb-4">
      <v-col cols="12">
        <v-card variant="outlined">
          <v-card-text class="d-flex gap-3 flex-wrap">
            <v-btn
              color="primary"
              variant="flat"
              prepend-icon="mdi-plus"
              :disabled="remainingFYLimit <= 0"
              @click="showDepositDialog = true"
            >
              Add Deposit
            </v-btn>
            <v-chip v-if="remainingFYLimit > 0" color="info" variant="tonal">
              FY Limit Remaining: {{ formatINR(remainingFYLimit) }}
            </v-chip>
            <v-chip v-else color="success" variant="tonal">
              <v-icon icon="mdi-check" class="mr-1" />
              FY Limit Reached
            </v-chip>
            <v-chip :color="canWithdraw ? 'success' : 'warning'" variant="tonal">
              <v-icon :icon="canWithdraw ? 'mdi-check' : 'mdi-lock'" class="mr-1" />
              Partial Withdrawal: {{ canWithdraw ? 'Eligible' : 'Not Yet' }}
            </v-chip>
            <v-chip :color="loanEligibility.eligible ? 'success' : 'grey'" variant="tonal">
              <v-icon :icon="loanEligibility.eligible ? 'mdi-check' : 'mdi-lock'" class="mr-1" />
              Loan: {{ loanEligibility.eligible ? 'Eligible' : 'Not Available' }}
            </v-chip>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Maturity Projection -->
    <v-card variant="outlined" class="mb-4">
      <v-card-title class="text-subtitle-1">Maturity Projection</v-card-title>
      <v-card-text>
        <v-row class="mb-4">
          <v-col cols="12" md="6">
            <v-slider
              v-model="yearlyDeposit"
              :min="PPF_CONFIG.MIN_DEPOSIT"
              :max="PPF_CONFIG.MAX_DEPOSIT"
              :step="5000"
              label="Yearly Deposit"
              thumb-label="always"
              color="primary"
            >
              <template #thumb-label="{ modelValue }">
                {{ formatINRCompact(modelValue) }}
              </template>
            </v-slider>
          </v-col>
          <v-col cols="12" md="6">
            <v-slider
              v-model="yearsRemaining"
              :min="1"
              :max="15"
              :step="1"
              label="Years to Maturity"
              thumb-label="always"
              color="success"
            />
          </v-col>
        </v-row>

        <div style="height: 250px" class="mb-4">
          <Line :data="chartData" :options="chartOptions" />
        </div>

        <v-row>
          <v-col cols="12" md="4">
            <v-card color="success" variant="tonal" class="pa-3 text-center">
              <div class="text-caption">Maturity Value</div>
              <div class="text-h6 font-weight-bold">
                {{ formatINRCompact(projection.maturityValue) }}
              </div>
            </v-card>
          </v-col>
          <v-col cols="12" md="4">
            <v-card color="primary" variant="tonal" class="pa-3 text-center">
              <div class="text-caption">Total Deposits</div>
              <div class="text-h6 font-weight-bold">
                {{ formatINRCompact(projection.totalDeposits) }}
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

    <!-- PPF Rules Reference -->
    <v-card variant="outlined">
      <v-card-title class="text-subtitle-1">PPF Rules Quick Reference</v-card-title>
      <v-card-text>
        <v-table density="compact">
          <tbody>
            <tr>
              <td>Interest Rate</td>
              <td class="font-weight-medium">{{ PPF_CONFIG.INTEREST_RATE }}% p.a.</td>
              <td class="text-caption text-medium-emphasis">Revised quarterly by Govt</td>
            </tr>
            <tr>
              <td>Min Deposit</td>
              <td class="font-weight-medium">{{ formatINR(PPF_CONFIG.MIN_DEPOSIT) }}/year</td>
              <td class="text-caption text-medium-emphasis">Required to keep account active</td>
            </tr>
            <tr>
              <td>Max Deposit</td>
              <td class="font-weight-medium">{{ formatINR(PPF_CONFIG.MAX_DEPOSIT) }}/year</td>
              <td class="text-caption text-medium-emphasis">Section 80C limit</td>
            </tr>
            <tr>
              <td>Lock-in Period</td>
              <td class="font-weight-medium">{{ PPF_CONFIG.TENURE_YEARS }} years</td>
              <td class="text-caption text-medium-emphasis">From end of FY of opening</td>
            </tr>
            <tr>
              <td>Partial Withdrawal</td>
              <td class="font-weight-medium">Year {{ PPF_CONFIG.WITHDRAWAL_YEAR }} onwards</td>
              <td class="text-caption text-medium-emphasis">Max 50% of 4th preceding year balance</td>
            </tr>
            <tr>
              <td>Loan Facility</td>
              <td class="font-weight-medium">Year {{ PPF_CONFIG.LOAN_START_YEAR }}-{{ PPF_CONFIG.LOAN_END_YEAR }}</td>
              <td class="text-caption text-medium-emphasis">Max 25% at PPF rate + 1%</td>
            </tr>
            <tr>
              <td>Tax Status</td>
              <td class="font-weight-medium text-success">EEE</td>
              <td class="text-caption text-medium-emphasis">Exempt at all stages</td>
            </tr>
          </tbody>
        </v-table>
      </v-card-text>
    </v-card>

    <!-- Deposit Dialog -->
    <v-dialog v-model="showDepositDialog" max-width="400">
      <v-card>
        <v-card-title>Add PPF Deposit</v-card-title>
        <v-card-text>
          <v-alert type="info" variant="tonal" density="compact" class="mb-4">
            Remaining FY limit: {{ formatINR(remainingFYLimit) }}
          </v-alert>
          <v-text-field
            v-model.number="depositAmount"
            label="Deposit Amount"
            type="number"
            prefix="₹"
            variant="outlined"
            :max="remainingFYLimit"
            :rules="[
              (v) => v >= PPF_CONFIG.MIN_DEPOSIT || `Min ₹${PPF_CONFIG.MIN_DEPOSIT}`,
              (v) => v <= remainingFYLimit || 'Exceeds FY limit'
            ]"
          />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="showDepositDialog = false">Cancel</v-btn>
          <v-btn
            color="primary"
            variant="flat"
            :disabled="depositAmount < PPF_CONFIG.MIN_DEPOSIT || depositAmount > remainingFYLimit"
            @click="handleDeposit"
          >
            Deposit
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>
