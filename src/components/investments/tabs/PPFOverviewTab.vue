<script setup lang="ts">
import { ref, computed } from "vue";
import { Line } from "vue-chartjs";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import {
  usePPF,
  formatINR,
  formatINRCompact,
  calculatePPFMaturity,
  type PPFData,
} from "@/composables/useInvestments";
import DataCompletionGrid from "@/components/shared/DataCompletionGrid.vue";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

const props = defineProps<{
  financialYear: string;
}>();

const emit = defineEmits<{
  (e: "go-to-details"): void;
}>();

// Data fetching
const { data: ppfData, isLoading } = usePPF();

// PPF Rules
const PPF_CONFIG = {
  INTEREST_RATE: 7.1,
  MIN_DEPOSIT: 500,
  MAX_DEPOSIT: 150000,
  TENURE_YEARS: 15,
  WITHDRAWAL_YEAR: 7,
  LOAN_START_YEAR: 3,
  LOAN_END_YEAR: 6,
};

// Mock data for demo when API returns empty
const mockPPFData: PPFData = {
  accountNumber: "PPF123456789",
  accountHolderName: "John Doe",
  bankOrPostOffice: "SBI",
  openingDate: "2018-04-01",
  maturityDate: "2033-03-31",
  currentBalance: 850000,
  totalDeposits: 720000,
  totalInterestEarned: 130000,
  currentFYDeposits: 100000,
  currentFY: "2024-25",
  hasActiveLoan: false,
  loanAmount: 0,
  isExtended: false,
};

// Use real data or mock
const ppf = computed(() => ppfData.value ?? mockPPFData);

// Projection inputs
const yearlyDeposit = ref(150000);
const yearsRemaining = ref(10);

// Calculations
const totalInterestEarned = computed(() => ppf.value.currentBalance - ppf.value.totalDeposits);
const remainingFYLimit = computed(() => PPF_CONFIG.MAX_DEPOSIT - ppf.value.currentFYDeposits);

// PPF Maturity Projection
const projection = computed(() =>
  calculatePPFMaturity({
    currentBalance: ppf.value.currentBalance,
    yearlyDeposit: yearlyDeposit.value,
    yearsRemaining: yearsRemaining.value,
    interestRate: PPF_CONFIG.INTEREST_RATE,
  })
);

// Chart Data
const chartData = computed(() => ({
  labels: projection.value.yearlyBreakdown.map((y) => `Year ${y.year}`),
  datasets: [
    {
      label: "Balance",
      data: projection.value.yearlyBreakdown.map((y) => y.balance),
      borderColor: "#4CAF50",
      backgroundColor: "rgba(76, 175, 80, 0.1)",
      fill: true,
      tension: 0.3,
    },
  ],
}));

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: false,
    },
    tooltip: {
      callbacks: {
        label: (context: unknown) => formatINR((context as { raw: number }).raw),
      },
    },
  },
  scales: {
    y: {
      beginAtZero: true,
      ticks: {
        callback: (value: unknown) => formatINRCompact(value as number),
      },
    },
  },
};

// Withdrawal eligibility
const accountAge = computed(() => {
  if (!ppf.value.openingDate) return 0;
  const openingYear = new Date(ppf.value.openingDate).getFullYear();
  const currentYear = new Date().getFullYear();
  return currentYear - openingYear;
});

const canWithdraw = computed(() => accountAge.value >= 6);

// Loan eligibility
const loanEligibility = computed(() => {
  if (accountAge.value >= PPF_CONFIG.LOAN_START_YEAR && accountAge.value <= PPF_CONFIG.LOAN_END_YEAR) {
    const maxLoanAmount = ppf.value.currentBalance * 0.25;
    return { eligible: true, maxAmount: maxLoanAmount };
  }
  return { eligible: false, maxAmount: 0 };
});

// Time to maturity
const yearsToMaturity = computed(() => {
  if (!ppf.value.openingDate) return PPF_CONFIG.TENURE_YEARS;
  return Math.max(0, PPF_CONFIG.TENURE_YEARS - accountAge.value);
});

// Data completion for FY - tracks which months have deposit data
// TODO: Replace with actual data from API when available
const fyDataCompletion = computed(() => {
  // Mock data: PPF deposits are less frequent (quarterly or annual)
  // In production, this would come from the PPF deposit history API
  return [true, false, false, true, false, false, true, false, false, true, false, false];
});
</script>

<template>
  <div class="ppf-overview-tab">
    <!-- Loading State -->
    <template v-if="isLoading">
      <v-skeleton-loader type="card, card, card" />
    </template>

    <template v-else>
      <!-- Summary Cards Row -->
      <v-row class="mb-6">
        <v-col cols="12" sm="6" md="3">
          <v-card class="pa-4 text-center h-100">
            <v-icon icon="mdi-bank" size="32" color="primary" class="mb-2" />
            <div class="text-body-2 text-medium-emphasis">Current Balance</div>
            <div class="text-h5 font-weight-bold text-primary">
              {{ formatINRCompact(ppf.currentBalance) }}
            </div>
            <div class="text-caption text-medium-emphasis">
              {{ ppf.bankOrPostOffice }} - {{ ppf.accountNumber?.slice(-4) }}
            </div>
          </v-card>
        </v-col>
        <v-col cols="12" sm="6" md="3">
          <v-card class="pa-4 text-center h-100">
            <v-icon icon="mdi-trending-up" size="32" color="success" class="mb-2" />
            <div class="text-body-2 text-medium-emphasis">Interest Earned</div>
            <div class="text-h5 font-weight-bold text-success">
              {{ formatINRCompact(totalInterestEarned) }}
            </div>
            <div class="text-caption text-medium-emphasis">Tax-free (EEE)</div>
          </v-card>
        </v-col>
        <v-col cols="12" sm="6" md="3">
          <v-card class="pa-4 text-center h-100">
            <v-icon icon="mdi-calendar-clock" size="32" color="warning" class="mb-2" />
            <div class="text-body-2 text-medium-emphasis">FY {{ financialYear }} Deposits</div>
            <div class="text-h5 font-weight-bold">
              {{ formatINR(ppf.currentFYDeposits) }}
            </div>
            <div class="text-caption" :class="remainingFYLimit > 0 ? 'text-info' : 'text-success'">
              {{ remainingFYLimit > 0 ? `₹${(remainingFYLimit / 1000).toFixed(0)}K remaining` : "Limit reached" }}
            </div>
          </v-card>
        </v-col>
        <v-col cols="12" sm="6" md="3">
          <v-card class="pa-4 text-center h-100">
            <v-icon icon="mdi-percent" size="32" color="teal" class="mb-2" />
            <div class="text-body-2 text-medium-emphasis">Interest Rate</div>
            <div class="text-h5 font-weight-bold text-success">{{ PPF_CONFIG.INTEREST_RATE }}%</div>
            <div class="text-caption text-medium-emphasis">Govt. guaranteed</div>
          </v-card>
        </v-col>
      </v-row>

      <!-- Data Completion + Account Status + Eligibility -->
      <v-row class="mb-6">
        <v-col cols="12" md="4">
          <DataCompletionGrid
            :completion="fyDataCompletion"
            :title="`FY ${financialYear} Deposits`"
            icon="mdi-calendar-check"
          />
          <v-btn
            color="primary"
            variant="tonal"
            block
            prepend-icon="mdi-pencil"
            class="mt-3"
            @click="emit('go-to-details')"
          >
            View/Edit Details
          </v-btn>
        </v-col>
        <v-col cols="12" md="4">
          <v-card variant="outlined" class="h-100">
            <v-card-title class="text-subtitle-1">
              <v-icon icon="mdi-account-details" class="mr-2" color="primary" />
              Account Status
            </v-card-title>
            <v-card-text>
              <div class="d-flex justify-space-between mb-2">
                <span class="text-medium-emphasis">Account Age</span>
                <span class="font-weight-medium">{{ accountAge }} years</span>
              </div>
              <div class="d-flex justify-space-between mb-2">
                <span class="text-medium-emphasis">Years to Maturity</span>
                <span class="font-weight-medium">{{ yearsToMaturity }} years</span>
              </div>
              <div class="d-flex justify-space-between mb-2">
                <span class="text-medium-emphasis">Maturity Date</span>
                <span class="font-weight-medium">
                  {{ new Date(ppf.maturityDate).toLocaleDateString("en-IN", { month: "short", year: "numeric" }) }}
                </span>
              </div>
            </v-card-text>
          </v-card>
        </v-col>

        <v-col cols="12" md="4">
          <v-card variant="outlined" class="h-100">
            <v-card-title class="text-subtitle-1">
              <v-icon icon="mdi-shield-check" class="mr-2" color="success" />
              Eligibility Status
            </v-card-title>
            <v-card-text>
              <div class="d-flex flex-column gap-3">
                <v-card
                  :color="canWithdraw ? 'success' : 'warning'"
                  variant="tonal"
                  class="pa-2 text-center"
                >
                  <v-icon :icon="canWithdraw ? 'mdi-check-circle' : 'mdi-lock'" size="20" class="mb-1" />
                  <div class="text-caption font-weight-bold">Withdrawal</div>
                  <div class="text-caption">
                    {{ canWithdraw ? "Year 7+" : `In ${7 - accountAge}y` }}
                  </div>
                </v-card>
                <v-card
                  :color="loanEligibility.eligible ? 'success' : 'grey'"
                  variant="tonal"
                  class="pa-2 text-center"
                >
                  <v-icon :icon="loanEligibility.eligible ? 'mdi-check-circle' : 'mdi-lock'" size="20" class="mb-1" />
                  <div class="text-caption font-weight-bold">Loan</div>
                  <div class="text-caption">
                    {{ loanEligibility.eligible ? "Available" : accountAge < 3 ? `In ${3 - accountAge}y` : "N/A" }}
                  </div>
                </v-card>
                <v-card color="primary" variant="tonal" class="pa-2 text-center">
                  <v-icon icon="mdi-infinity" size="20" class="mb-1" />
                  <div class="text-caption font-weight-bold">Extension</div>
                  <div class="text-caption">
                    {{ ppf.isExtended ? "Extended" : "At maturity" }}
                  </div>
                </v-card>
              </div>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <!-- Maturity Projection -->
      <v-row class="mb-6">
        <v-col cols="12">
          <v-card variant="outlined">
            <v-card-title class="text-subtitle-1">
              <v-icon icon="mdi-chart-line" class="mr-2" color="success" />
              Maturity Projection
            </v-card-title>
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
                    label="Years to Project"
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
                    <div class="text-caption">Projected Value</div>
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
        </v-col>
      </v-row>

      <!-- PPF Rules Reference -->
      <v-row>
        <v-col cols="12">
          <v-card variant="outlined">
            <v-card-title class="text-subtitle-1">
              <v-icon icon="mdi-information" class="mr-2" color="info" />
              PPF Rules Quick Reference
            </v-card-title>
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
        </v-col>
      </v-row>
    </template>
  </div>
</template>

<style scoped>
.h-100 {
  height: 100%;
}
</style>
