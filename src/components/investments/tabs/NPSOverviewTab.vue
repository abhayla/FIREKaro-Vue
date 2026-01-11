<script setup lang="ts">
import { ref, computed } from "vue";
import { Doughnut, Line } from "vue-chartjs";
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
  Filler,
} from "chart.js";
import {
  useNPS,
  formatINR,
  formatINRCompact,
  calculateNPSProjection,
  type NPSData,
} from "@/composables/useInvestments";

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
);

const props = defineProps<{
  financialYear: string;
}>();

const emit = defineEmits<{
  (e: "go-to-details"): void;
}>();

// Data fetching
const { data: npsData, isLoading } = useNPS();

// Mock data for demo
const mockNPSData: NPSData = {
  pranNumber: "PRAN1234567890",
  tier1Balance: 580000,
  tier2Balance: 120000,
  totalContributions: 480000,
  totalReturns: 220000,
  assetAllocation: {
    equityE: 50,
    corporateBondC: 30,
    governmentBondG: 15,
    alternativeA: 5,
  },
  pensionFundManager: "SBI Pension Fund",
  investmentChoice: "active",
  lastUpdated: "2024-12-20",
};

// Use real data or mock
const nps = computed(() => npsData.value ?? mockNPSData);

// Total corpus
const totalCorpus = computed(() => nps.value.tier1Balance + (nps.value.tier2Balance ?? 0));

// Projection inputs
const currentAge = ref(30);
const retirementAge = ref(60);
const monthlyContribution = ref(5000);
const expectedReturns = ref(10);
const annuityPercentage = ref(40);

// Projection
const projection = computed(() =>
  calculateNPSProjection({
    currentCorpus: nps.value.tier1Balance,
    monthlyContribution: monthlyContribution.value,
    currentAge: currentAge.value,
    retirementAge: retirementAge.value,
    expectedReturns: expectedReturns.value,
    annuityPercentage: annuityPercentage.value,
  })
);

// Asset Allocation Chart
const allocationChartData = computed(() => ({
  labels: ["Equity (E)", "Corporate Bond (C)", "Govt Bond (G)", "Alternative (A)"],
  datasets: [
    {
      data: [
        nps.value.assetAllocation?.equityE ?? 50,
        nps.value.assetAllocation?.corporateBondC ?? 30,
        nps.value.assetAllocation?.governmentBondG ?? 15,
        nps.value.assetAllocation?.alternativeA ?? 5,
      ],
      backgroundColor: ["#4CAF50", "#2196F3", "#FF9800", "#9C27B0"],
      borderWidth: 2,
      borderColor: "#ffffff",
    },
  ],
}));

const allocationChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  cutout: "60%",
  plugins: {
    legend: {
      position: "bottom" as const,
    },
  },
};

// Projection Chart
const projectionChartData = computed(() => {
  const years = retirementAge.value - currentAge.value;
  const labels: string[] = [];
  const corpusData: number[] = [];

  let corpus = nps.value.tier1Balance;
  const monthlyRate = expectedReturns.value / 12 / 100;

  for (let year = 0; year <= years; year++) {
    labels.push(`Age ${currentAge.value + year}`);
    corpusData.push(Math.round(corpus));

    for (let month = 0; month < 12; month++) {
      corpus = corpus * (1 + monthlyRate) + monthlyContribution.value;
    }
  }

  return {
    labels,
    datasets: [
      {
        label: "NPS Corpus",
        data: corpusData,
        borderColor: "#4CAF50",
        backgroundColor: "rgba(76, 175, 80, 0.1)",
        fill: true,
        tension: 0.3,
      },
    ],
  };
});

const projectionChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: false,
    },
    tooltip: {
      callbacks: {
        label: (context: unknown) => {
          const ctx = context as { raw: number };
          return formatINR(ctx.raw);
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

// Tax benefits calculation
const taxBenefits = computed(() => {
  const yearly = monthlyContribution.value * 12;
  const section80CCD1B = Math.min(yearly, 50000);
  const taxSaved30 = section80CCD1B * 0.3;
  const taxSaved20 = section80CCD1B * 0.2;

  return {
    yearlyContribution: yearly,
    section80CCD1B,
    taxSaved30,
    taxSaved20,
  };
});

// Data completion for FY (mock for now)
const fyMonthsCompleted = ref(8);
const fyCompletionPercent = computed(() => Math.round((fyMonthsCompleted.value / 12) * 100));
</script>

<template>
  <div class="nps-overview-tab">
    <!-- Loading State -->
    <template v-if="isLoading">
      <v-skeleton-loader type="card, card, card" />
    </template>

    <template v-else>
      <!-- Summary Cards Row -->
      <v-row class="mb-6">
        <v-col cols="12" sm="6" md="3">
          <v-card class="pa-4 text-center h-100">
            <v-icon icon="mdi-account-cash" size="32" color="orange" class="mb-2" />
            <div class="text-body-2 text-medium-emphasis">Total NPS Corpus</div>
            <div class="text-h5 font-weight-bold">
              {{ formatINRCompact(totalCorpus) }}
            </div>
            <div class="text-caption text-success">
              +{{ formatINRCompact(nps.totalReturns) }} returns
            </div>
          </v-card>
        </v-col>
        <v-col cols="12" sm="6" md="3">
          <v-card class="pa-4 text-center h-100" color="orange" variant="tonal">
            <v-icon icon="mdi-numeric-1-circle" size="32" class="mb-2" />
            <div class="text-body-2 text-medium-emphasis">Tier I (Retirement)</div>
            <div class="text-h5 font-weight-bold">{{ formatINRCompact(nps.tier1Balance) }}</div>
            <div class="text-caption">Lock-in till 60</div>
          </v-card>
        </v-col>
        <v-col cols="12" sm="6" md="3">
          <v-card class="pa-4 text-center h-100" variant="outlined">
            <v-icon icon="mdi-numeric-2-circle" size="32" color="primary" class="mb-2" />
            <div class="text-body-2 text-medium-emphasis">Tier II (Flexible)</div>
            <div class="text-h5 font-weight-bold">{{ formatINRCompact(nps.tier2Balance ?? 0) }}</div>
            <div class="text-caption">No lock-in</div>
          </v-card>
        </v-col>
        <v-col cols="12" sm="6" md="3">
          <v-card class="pa-4 text-center h-100">
            <v-icon icon="mdi-shield-check" size="32" color="success" class="mb-2" />
            <div class="text-body-2 text-medium-emphasis">80CCD(1B)</div>
            <div class="text-h5 font-weight-bold">₹50K</div>
            <div class="text-caption text-medium-emphasis">Additional deduction</div>
          </v-card>
        </v-col>
      </v-row>

      <!-- Account Info -->
      <v-card variant="outlined" class="mb-6">
        <v-card-text class="d-flex gap-4 flex-wrap">
          <v-chip color="primary" variant="tonal">
            <v-icon icon="mdi-card-account-details" class="mr-1" />
            PRAN: {{ nps.pranNumber }}
          </v-chip>
          <v-chip color="orange" variant="tonal">
            <v-icon icon="mdi-bank" class="mr-1" />
            {{ nps.pensionFundManager }}
          </v-chip>
          <v-chip :color="nps.investmentChoice === 'active' ? 'success' : 'info'" variant="tonal">
            <v-icon icon="mdi-tune" class="mr-1" />
            {{ nps.investmentChoice === "active" ? "Active Choice" : "Auto Choice" }}
          </v-chip>
          <v-chip variant="outlined">
            <v-icon icon="mdi-calendar" class="mr-1" />
            Updated: {{ new Date(nps.lastUpdated).toLocaleDateString("en-IN") }}
          </v-chip>
        </v-card-text>
      </v-card>

      <!-- Data Completion + Asset Allocation -->
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

        <v-col cols="12" md="4">
          <v-card variant="outlined" class="h-100">
            <v-card-title class="text-subtitle-1">
              <v-icon icon="mdi-chart-pie" class="mr-2" color="success" />
              Asset Allocation
            </v-card-title>
            <v-card-text>
              <div style="height: 200px">
                <Doughnut :data="allocationChartData" :options="allocationChartOptions" />
              </div>
            </v-card-text>
          </v-card>
        </v-col>

        <v-col cols="12" md="4">
          <v-card variant="outlined" class="h-100">
            <v-card-title class="text-subtitle-1">
              <v-icon icon="mdi-cash-multiple" class="mr-2" color="teal" />
              Monthly Contribution
            </v-card-title>
            <v-card-text>
              <v-text-field
                v-model.number="monthlyContribution"
                label="Monthly SIP"
                type="number"
                prefix="₹"
                variant="outlined"
                density="compact"
                class="mb-3"
              />
              <v-table density="compact">
                <tbody>
                  <tr>
                    <td>Monthly</td>
                    <td class="text-right font-weight-medium text-currency">
                      {{ formatINR(monthlyContribution) }}
                    </td>
                  </tr>
                  <tr>
                    <td>Yearly</td>
                    <td class="text-right font-weight-medium text-currency">
                      {{ formatINR(monthlyContribution * 12) }}
                    </td>
                  </tr>
                  <tr class="bg-success-lighten-5">
                    <td class="font-weight-bold">80CCD(1B) Eligible</td>
                    <td class="text-right font-weight-bold text-currency">
                      {{ formatINR(taxBenefits.section80CCD1B) }}
                    </td>
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
                <v-col cols="12" md="4">
                  <v-slider
                    v-model="currentAge"
                    :min="18"
                    :max="55"
                    :step="1"
                    label="Current Age"
                    thumb-label="always"
                    color="primary"
                  />
                </v-col>
                <v-col cols="12" md="4">
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
                <v-col cols="12" md="4">
                  <v-slider
                    v-model="expectedReturns"
                    :min="6"
                    :max="15"
                    :step="0.5"
                    label="Expected Returns %"
                    thumb-label="always"
                    color="warning"
                  />
                </v-col>
              </v-row>

              <div style="height: 250px">
                <Line :data="projectionChartData" :options="projectionChartOptions" />
              </div>

              <v-row class="mt-4">
                <v-col cols="12" md="3">
                  <v-card color="success" variant="tonal" class="pa-3 text-center">
                    <div class="text-caption">Projected Corpus</div>
                    <div class="text-h6 font-weight-bold">
                      {{ formatINRCompact(projection.projectedCorpus) }}
                    </div>
                  </v-card>
                </v-col>
                <v-col cols="12" md="3">
                  <v-card color="primary" variant="tonal" class="pa-3 text-center">
                    <div class="text-caption">Lumpsum ({{ 100 - annuityPercentage }}%)</div>
                    <div class="text-h6 font-weight-bold">
                      {{ formatINRCompact(projection.lumpsumWithdrawal) }}
                    </div>
                  </v-card>
                </v-col>
                <v-col cols="12" md="3">
                  <v-card color="warning" variant="tonal" class="pa-3 text-center">
                    <div class="text-caption">Annuity Purchase</div>
                    <div class="text-h6 font-weight-bold">
                      {{ formatINRCompact(projection.annuityInvestment) }}
                    </div>
                  </v-card>
                </v-col>
                <v-col cols="12" md="3">
                  <v-card color="purple" variant="tonal" class="pa-3 text-center">
                    <div class="text-caption">Est. Monthly Pension</div>
                    <div class="text-h6 font-weight-bold">
                      {{ formatINR(projection.estimatedMonthlyPension) }}
                    </div>
                  </v-card>
                </v-col>
              </v-row>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <!-- Tax Benefits & Info Cards -->
      <v-row>
        <v-col cols="12" md="6">
          <v-card variant="outlined" class="h-100">
            <v-card-title class="text-subtitle-1">
              <v-icon icon="mdi-shield-check" class="mr-2" color="success" />
              NPS Tax Benefits
            </v-card-title>
            <v-card-text>
              <v-table density="compact">
                <tbody>
                  <tr>
                    <td>Section 80CCD(1)</td>
                    <td>Up to 10% of salary (within 80C limit of ₹1.5L)</td>
                  </tr>
                  <tr>
                    <td class="font-weight-bold text-success">Section 80CCD(1B)</td>
                    <td class="font-weight-bold text-success">Additional ₹50,000 (over 80C)</td>
                  </tr>
                  <tr>
                    <td>Section 80CCD(2)</td>
                    <td>Employer contribution up to 10% of salary</td>
                  </tr>
                  <tr>
                    <td>At Maturity</td>
                    <td>60% lumpsum tax-free, 40% must buy annuity</td>
                  </tr>
                </tbody>
              </v-table>
              <v-alert type="success" variant="tonal" density="compact" class="mt-4">
                <div class="d-flex justify-space-between">
                  <span>Tax saved (30% bracket):</span>
                  <strong>{{ formatINR(taxBenefits.taxSaved30) }}</strong>
                </div>
                <div class="d-flex justify-space-between mt-1">
                  <span>Tax saved (20% bracket):</span>
                  <strong>{{ formatINR(taxBenefits.taxSaved20) }}</strong>
                </div>
              </v-alert>
            </v-card-text>
          </v-card>
        </v-col>

        <v-col cols="12" md="6">
          <v-card variant="outlined" class="h-100">
            <v-card-title class="text-subtitle-1">
              <v-icon icon="mdi-chart-pie" class="mr-2" />
              Asset Classes Explained
            </v-card-title>
            <v-card-text>
              <v-list density="compact">
                <v-list-item>
                  <template #prepend>
                    <v-avatar color="success" size="32">E</v-avatar>
                  </template>
                  <v-list-item-title>Equity (E)</v-list-item-title>
                  <v-list-item-subtitle>High risk, high return. Max 75% (50% after 50 yrs)</v-list-item-subtitle>
                </v-list-item>
                <v-list-item>
                  <template #prepend>
                    <v-avatar color="primary" size="32">C</v-avatar>
                  </template>
                  <v-list-item-title>Corporate Bonds (C)</v-list-item-title>
                  <v-list-item-subtitle>Medium risk. Fixed income from companies</v-list-item-subtitle>
                </v-list-item>
                <v-list-item>
                  <template #prepend>
                    <v-avatar color="warning" size="32">G</v-avatar>
                  </template>
                  <v-list-item-title>Government Bonds (G)</v-list-item-title>
                  <v-list-item-subtitle>Low risk. Sovereign guarantee</v-list-item-subtitle>
                </v-list-item>
                <v-list-item>
                  <template #prepend>
                    <v-avatar color="purple" size="32">A</v-avatar>
                  </template>
                  <v-list-item-title>Alternative (A)</v-list-item-title>
                  <v-list-item-subtitle>REITs, InvITs, etc. Max 5%</v-list-item-subtitle>
                </v-list-item>
              </v-list>
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
