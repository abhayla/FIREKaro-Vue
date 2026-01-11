<script setup lang="ts">
import { ref, computed, watch } from "vue";
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
  useEPF,
  formatINR,
  formatINRCompact,
  calculateEPFProjection,
  type EPFData,
} from "@/composables/useInvestments";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

const props = defineProps<{
  financialYear: string;
}>();

const emit = defineEmits<{
  (e: "go-to-details"): void;
}>();

// Data fetching
const { data: epfData, isLoading } = useEPF();

// Current EPF Interest Rate (FY 2024-25)
const EPF_INTEREST_RATE = 8.25;

// Mock data for demo when API returns empty
const mockEPFData: EPFData = {
  uan: "100123456789",
  establishmentCode: "MHBAN0012345",
  currentBalance: 1250000,
  employeeShare: 750000,
  employerShare: 500000,
  pensionFund: 180000,
  lastUpdated: "2024-12-15",
  monthlyContribution: {
    basic: 120000,
    employee: 14400,
    employerEPF: 10800,
    employerEPS: 3600,
    vpf: 5000,
  },
};

// Use real data or mock
const epf = computed(() => epfData.value ?? mockEPFData);

// Projection inputs
const currentAge = ref(30);
const retirementAge = ref(60);

// EPF contribution calculations
const employeeContribution = computed(() => epf.value.monthlyContribution.employee);
const employerEPFContribution = computed(() => epf.value.monthlyContribution.employerEPF);
const vpfContribution = computed(() => epf.value.monthlyContribution.vpf);
const totalMonthlyContribution = computed(
  () => employeeContribution.value + employerEPFContribution.value + vpfContribution.value
);

// Projection
const projection = computed(() =>
  calculateEPFProjection({
    currentBalance: epf.value.currentBalance,
    monthlyContribution: totalMonthlyContribution.value,
    currentAge: currentAge.value,
    retirementAge: retirementAge.value,
    interestRate: EPF_INTEREST_RATE,
  })
);

// Chart data
const chartData = computed(() => {
  const years = projection.value.yearsToRetirement;
  const labels: string[] = [];
  const corpusData: number[] = [];
  const contributionData: number[] = [];

  let corpus = epf.value.currentBalance;
  let contributions = epf.value.currentBalance;
  const monthlyRate = EPF_INTEREST_RATE / 12 / 100;

  for (let year = 0; year <= years; year++) {
    labels.push(`Year ${year}`);
    corpusData.push(Math.round(corpus));
    contributionData.push(Math.round(contributions));

    for (let month = 0; month < 12; month++) {
      corpus = corpus * (1 + monthlyRate) + totalMonthlyContribution.value;
      contributions += totalMonthlyContribution.value;
    }
  }

  return {
    labels,
    datasets: [
      {
        label: "Projected Corpus",
        data: corpusData,
        borderColor: "#4CAF50",
        backgroundColor: "rgba(76, 175, 80, 0.1)",
        fill: true,
        tension: 0.3,
      },
      {
        label: "Total Contributions",
        data: contributionData,
        borderColor: "#2196F3",
        backgroundColor: "rgba(33, 150, 243, 0.1)",
        fill: true,
        tension: 0.3,
      },
    ],
  };
});

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: "bottom" as const,
    },
    tooltip: {
      callbacks: {
        label: (context: unknown) => {
          const ctx = context as { dataset: { label: string }; raw: number };
          return `${ctx.dataset.label}: ${formatINR(ctx.raw)}`;
        },
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

// Data completion for FY (mock for now)
const fyMonthsCompleted = ref(8);
const fyCompletionPercent = computed(() => Math.round((fyMonthsCompleted.value / 12) * 100));
</script>

<template>
  <div class="epf-overview-tab">
    <!-- Loading State -->
    <template v-if="isLoading">
      <v-skeleton-loader type="card, card, card" />
    </template>

    <template v-else>
      <!-- Summary Cards Row -->
      <v-row class="mb-6">
        <v-col cols="12" sm="6" md="3">
          <v-card class="pa-4 text-center h-100">
            <v-icon icon="mdi-piggy-bank" size="32" color="primary" class="mb-2" />
            <div class="text-body-2 text-medium-emphasis">Current Balance</div>
            <div class="text-h5 font-weight-bold text-primary">
              {{ formatINRCompact(epf.currentBalance) }}
            </div>
            <div class="text-caption text-medium-emphasis">
              Last updated: {{ new Date(epf.lastUpdated).toLocaleDateString("en-IN") }}
            </div>
          </v-card>
        </v-col>
        <v-col cols="12" sm="6" md="3">
          <v-card class="pa-4 text-center h-100">
            <v-icon icon="mdi-cash-plus" size="32" color="success" class="mb-2" />
            <div class="text-body-2 text-medium-emphasis">Monthly Contribution</div>
            <div class="text-h5 font-weight-bold">
              {{ formatINR(totalMonthlyContribution) }}
            </div>
            <div class="text-caption text-medium-emphasis">Employee + Employer + VPF</div>
          </v-card>
        </v-col>
        <v-col cols="12" sm="6" md="3">
          <v-card class="pa-4 text-center h-100">
            <v-icon icon="mdi-percent" size="32" color="teal" class="mb-2" />
            <div class="text-body-2 text-medium-emphasis">Interest Rate</div>
            <div class="text-h5 font-weight-bold text-success">{{ EPF_INTEREST_RATE }}%</div>
            <div class="text-caption text-medium-emphasis">FY 2024-25</div>
          </v-card>
        </v-col>
        <v-col cols="12" sm="6" md="3">
          <v-card class="pa-4 text-center h-100">
            <v-icon icon="mdi-chart-timeline-variant" size="32" color="warning" class="mb-2" />
            <div class="text-body-2 text-medium-emphasis">Projected at 60</div>
            <div class="text-h5 font-weight-bold text-success">
              {{ formatINRCompact(projection.projectedCorpus) }}
            </div>
            <div class="text-caption text-medium-emphasis">
              {{ projection.yearsToRetirement }} years remaining
            </div>
          </v-card>
        </v-col>
      </v-row>

      <!-- Data Completion + Contribution Breakdown -->
      <v-row class="mb-6">
        <v-col cols="12" md="4">
          <v-card variant="outlined" class="h-100">
            <v-card-title class="text-subtitle-1">
              <v-icon icon="mdi-calendar-check" class="mr-2" color="primary" />
              FY {{ financialYear }} Data
            </v-card-title>
            <v-card-text>
              <div class="d-flex align-center mb-4">
                <v-progress-circular
                  :model-value="fyCompletionPercent"
                  :size="80"
                  :width="8"
                  color="primary"
                >
                  {{ fyMonthsCompleted }}/12
                </v-progress-circular>
                <div class="ml-4">
                  <div class="text-h6">{{ fyCompletionPercent }}%</div>
                  <div class="text-body-2 text-medium-emphasis">Months completed</div>
                </div>
              </div>
              <v-btn
                color="primary"
                variant="tonal"
                block
                prepend-icon="mdi-pencil"
                @click="emit('go-to-details')"
              >
                View/Edit Details
              </v-btn>
            </v-card-text>
          </v-card>
        </v-col>

        <v-col cols="12" md="8">
          <v-card variant="outlined" class="h-100">
            <v-card-title class="text-subtitle-1">
              <v-icon icon="mdi-chart-pie" class="mr-2" color="success" />
              Contribution Breakdown (Monthly)
            </v-card-title>
            <v-card-text>
              <v-table density="compact">
                <tbody>
                  <tr>
                    <td>
                      <v-icon icon="mdi-account" size="small" class="mr-2" color="primary" />
                      Employee PF (12%)
                    </td>
                    <td class="text-right font-weight-medium text-currency">
                      {{ formatINR(employeeContribution) }}
                    </td>
                    <td class="text-right text-caption text-medium-emphasis">80C eligible</td>
                  </tr>
                  <tr>
                    <td>
                      <v-icon icon="mdi-domain" size="small" class="mr-2" color="info" />
                      Employer EPF (3.67%)
                    </td>
                    <td class="text-right font-weight-medium text-currency">
                      {{ formatINR(employerEPFContribution) }}
                    </td>
                    <td class="text-right text-caption text-medium-emphasis">Tax-free</td>
                  </tr>
                  <tr>
                    <td>
                      <v-icon icon="mdi-shield-account" size="small" class="mr-2" color="warning" />
                      Employer EPS (8.33%)
                    </td>
                    <td class="text-right font-weight-medium text-currency">
                      {{ formatINR(epf.monthlyContribution.employerEPS) }}
                    </td>
                    <td class="text-right text-caption text-medium-emphasis">Pension fund</td>
                  </tr>
                  <tr>
                    <td>
                      <v-icon icon="mdi-plus-circle" size="small" class="mr-2" color="success" />
                      VPF (Voluntary)
                    </td>
                    <td class="text-right font-weight-medium text-currency">
                      {{ formatINR(vpfContribution) }}
                    </td>
                    <td class="text-right text-caption text-medium-emphasis">80C eligible</td>
                  </tr>
                  <tr class="bg-primary-lighten-5">
                    <td class="font-weight-bold">Total to EPF Account</td>
                    <td class="text-right font-weight-bold text-currency">
                      {{ formatINR(totalMonthlyContribution) }}
                    </td>
                    <td></td>
                  </tr>
                </tbody>
              </v-table>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <!-- Projection Chart -->
      <v-row class="mb-6">
        <v-col cols="12">
          <v-card variant="outlined">
            <v-card-title class="text-subtitle-1">
              <v-icon icon="mdi-chart-line" class="mr-2" color="success" />
              Retirement Projection
            </v-card-title>
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
        </v-col>
      </v-row>

      <!-- Tax Benefits Section -->
      <v-row>
        <v-col cols="12">
          <v-card variant="outlined">
            <v-card-title class="text-subtitle-1">
              <v-icon icon="mdi-shield-check" class="mr-2" color="success" />
              Section 80C Tax Benefits
            </v-card-title>
            <v-card-text>
              <v-row>
                <v-col cols="12" md="4">
                  <v-card color="teal" variant="tonal" class="pa-3">
                    <div class="text-subtitle-2 font-weight-bold mb-2">FY {{ financialYear }} Contribution</div>
                    <div class="d-flex justify-space-between">
                      <span>Employee PF (12 months)</span>
                      <span class="font-weight-medium">{{ formatINR(employeeContribution * 12) }}</span>
                    </div>
                    <div class="d-flex justify-space-between mt-1">
                      <span>VPF (12 months)</span>
                      <span class="font-weight-medium">{{ formatINR(vpfContribution * 12) }}</span>
                    </div>
                    <v-divider class="my-2" />
                    <div class="d-flex justify-space-between font-weight-bold">
                      <span>Total 80C from EPF</span>
                      <span>{{ formatINR((employeeContribution + vpfContribution) * 12) }}</span>
                    </div>
                  </v-card>
                </v-col>
                <v-col cols="12" md="4">
                  <v-alert type="info" variant="tonal" density="compact" class="h-100">
                    <div class="text-subtitle-2 font-weight-bold mb-2">80C Limit</div>
                    <div class="text-body-2">
                      EPF employee contribution and VPF qualify under Section 80C with a combined limit of
                      <strong>₹1.5 Lakhs</strong> per year (shared with PPF, ELSS, etc.)
                    </div>
                  </v-alert>
                </v-col>
                <v-col cols="12" md="4">
                  <v-alert type="warning" variant="tonal" density="compact" class="h-100">
                    <div class="text-subtitle-2 font-weight-bold mb-2">Taxable Interest</div>
                    <div class="text-body-2">
                      Interest on EPF/VPF contributions exceeding <strong>₹2.5 Lakhs/year</strong> is taxable
                      from FY 2021-22 onwards.
                    </div>
                  </v-alert>
                </v-col>
              </v-row>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </template>
  </div>
</template>

<style scoped>
.text-currency {
  font-family: "Roboto Mono", monospace;
}

.h-100 {
  height: 100%;
}
</style>
