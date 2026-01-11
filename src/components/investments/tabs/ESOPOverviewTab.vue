<script setup lang="ts">
import { computed } from "vue";
import { Doughnut, Bar } from "vue-chartjs";
import {
  Chart as ChartJS,
  ArcElement,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import {
  useESOPGrants,
  useESOPSummary,
  formatINR,
  formatINRCompact,
  type ESOPGrant,
} from "@/composables/useInvestments";

ChartJS.register(ArcElement, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const props = defineProps<{
  financialYear: string;
}>();

const emit = defineEmits<{
  (e: "go-to-details"): void;
  (e: "add-grant"): void;
}>();

// Data fetching
const { data: esopData, isLoading } = useESOPGrants();
const { data: summary } = useESOPSummary();

// Mock data for demo
const mockGrants: ESOPGrant[] = [
  {
    id: "1",
    grantType: "ESOP",
    grantDate: "2022-04-01",
    grantNumber: "ESOP-2022-001",
    companyName: "TechCorp India Pvt Ltd",
    companySymbol: undefined,
    totalUnits: 10000,
    grantPrice: 100,
    fairMarketValue: 150,
    currentFMV: 450,
    vestingScheduleType: "GRADED",
    vestingStartDate: "2022-04-01",
    cliffMonths: 12,
    totalVestingMonths: 48,
    vestingFrequency: 12,
    status: "PARTIALLY_VESTED",
    vestedUnits: 5000,
    exercisedUnits: 2000,
    exercisableUnits: 3000,
    unvestedUnits: 5000,
    forfeitedUnits: 0,
    perquisiteValue: 700000,
    taxPaid: 210000,
    isListedCompany: false,
    isStartup: true,
    planName: "ESOP 2022",
    vestingEvents: [],
  },
  {
    id: "2",
    grantType: "RSU",
    grantDate: "2023-01-15",
    grantNumber: "RSU-2023-042",
    companyName: "Global Tech Ltd",
    companySymbol: "GTECH",
    totalUnits: 500,
    grantPrice: 0,
    fairMarketValue: 2500,
    currentFMV: 3200,
    vestingScheduleType: "CLIFF",
    vestingStartDate: "2023-01-15",
    cliffMonths: 24,
    totalVestingMonths: 24,
    vestingFrequency: 24,
    status: "ACTIVE",
    vestedUnits: 0,
    exercisedUnits: 0,
    exercisableUnits: 0,
    unvestedUnits: 500,
    forfeitedUnits: 0,
    perquisiteValue: 0,
    taxPaid: 0,
    isListedCompany: true,
    isStartup: false,
    planName: "RSU Plan 2023",
    vestingEvents: [],
  },
];

const grants = computed(() =>
  esopData.value?.grants?.length ? esopData.value.grants : mockGrants
);

const mockSummary = computed(() => ({
  totalGrants: mockGrants.length,
  activeGrants: mockGrants.filter(
    (g) => g.status !== "EXERCISED" && g.status !== "CANCELLED"
  ).length,
  totalUnits: mockGrants.reduce((sum, g) => sum + g.totalUnits, 0),
  vestedUnits: mockGrants.reduce((sum, g) => sum + g.vestedUnits, 0),
  exercisedUnits: mockGrants.reduce((sum, g) => sum + g.exercisedUnits, 0),
  exercisableUnits: mockGrants.reduce((sum, g) => sum + g.exercisableUnits, 0),
  unvestedUnits: mockGrants.reduce((sum, g) => sum + g.unvestedUnits, 0),
  totalCurrentValue: mockGrants.reduce(
    (sum, g) => sum + g.totalUnits * (g.currentFMV || g.fairMarketValue),
    0
  ),
  vestedValue: mockGrants.reduce(
    (sum, g) => sum + g.vestedUnits * (g.currentFMV || g.fairMarketValue),
    0
  ),
  exercisableValue: mockGrants.reduce(
    (sum, g) => sum + g.exercisableUnits * (g.currentFMV || g.fairMarketValue),
    0
  ),
  unvestedValue: mockGrants.reduce(
    (sum, g) => sum + g.unvestedUnits * (g.currentFMV || g.fairMarketValue),
    0
  ),
  totalPerquisiteValue: mockGrants.reduce((sum, g) => sum + (g.perquisiteValue || 0), 0),
  totalTaxPaid: mockGrants.reduce((sum, g) => sum + g.taxPaid, 0),
  companies: [...new Set(mockGrants.map((g) => g.companyName))],
}));

const displaySummary = computed(() =>
  summary.value?.totalGrants ? summary.value : mockSummary.value
);

// Grant type distribution chart
const grantTypeChartData = computed(() => {
  const types: Record<string, number> = {};
  grants.value.forEach((g) => {
    const value = g.totalUnits * (g.currentFMV || g.fairMarketValue);
    types[g.grantType] = (types[g.grantType] || 0) + value;
  });

  return {
    labels: Object.keys(types),
    datasets: [
      {
        data: Object.values(types),
        backgroundColor: ["#2196F3", "#4CAF50", "#FF9800", "#9C27B0", "#F44336"],
        borderWidth: 2,
        borderColor: "#ffffff",
      },
    ],
  };
});

const grantTypeChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  cutout: "60%",
  plugins: {
    legend: {
      position: "right" as const,
    },
    tooltip: {
      callbacks: {
        label: (context: unknown) => {
          const ctx = context as { label: string; raw: number };
          return `${ctx.label}: ${formatINRCompact(ctx.raw)}`;
        },
      },
    },
  },
};

// Vesting status chart
const vestingStatusChartData = computed(() => ({
  labels: ["Exercised", "Exercisable", "Unvested"],
  datasets: [
    {
      label: "Units",
      data: [
        displaySummary.value.exercisedUnits,
        displaySummary.value.exercisableUnits,
        displaySummary.value.unvestedUnits,
      ],
      backgroundColor: ["#4CAF50", "#FF9800", "#2196F3"],
      borderRadius: 4,
    },
  ],
}));

const vestingStatusChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: false,
    },
  },
  scales: {
    y: {
      beginAtZero: true,
    },
  },
};

// Grant type color helper
const grantTypeColor = (type: string) => {
  switch (type) {
    case "ESOP":
      return "primary";
    case "RSU":
      return "success";
    case "RSA":
      return "info";
    case "SAR":
      return "warning";
    case "PHANTOM":
      return "purple";
    default:
      return "grey";
  }
};
</script>

<template>
  <div class="esop-overview-tab">
    <!-- Loading State -->
    <template v-if="isLoading">
      <v-skeleton-loader type="card, card, card" />
    </template>

    <template v-else>
      <!-- Summary Cards Row -->
      <v-row class="mb-6">
        <v-col cols="12" sm="6" md="3">
          <v-card class="pa-4 text-center h-100">
            <v-icon icon="mdi-cash-multiple" size="32" color="primary" class="mb-2" />
            <div class="text-body-2 text-medium-emphasis">Total Value</div>
            <div class="text-h5 font-weight-bold">
              {{ formatINRCompact(displaySummary.totalCurrentValue) }}
            </div>
            <div class="text-caption">{{ displaySummary.totalUnits.toLocaleString() }} units</div>
          </v-card>
        </v-col>
        <v-col cols="12" sm="6" md="3">
          <v-card class="pa-4 text-center h-100" color="success" variant="tonal">
            <v-icon icon="mdi-check-circle" size="32" class="mb-2" />
            <div class="text-body-2 text-medium-emphasis">Vested Value</div>
            <div class="text-h5 font-weight-bold">{{ formatINRCompact(displaySummary.vestedValue) }}</div>
            <div class="text-caption">{{ displaySummary.vestedUnits.toLocaleString() }} units</div>
          </v-card>
        </v-col>
        <v-col cols="12" sm="6" md="3">
          <v-card class="pa-4 text-center h-100" color="warning" variant="tonal">
            <v-icon icon="mdi-hand-coin" size="32" class="mb-2" />
            <div class="text-body-2 text-medium-emphasis">Exercisable</div>
            <div class="text-h5 font-weight-bold">{{ formatINRCompact(displaySummary.exercisableValue) }}</div>
            <div class="text-caption">{{ displaySummary.exercisableUnits.toLocaleString() }} units</div>
          </v-card>
        </v-col>
        <v-col cols="12" sm="6" md="3">
          <v-card class="pa-4 text-center h-100" variant="outlined">
            <v-icon icon="mdi-clock-outline" size="32" color="info" class="mb-2" />
            <div class="text-body-2 text-medium-emphasis">Unvested</div>
            <div class="text-h5 font-weight-bold">{{ formatINRCompact(displaySummary.unvestedValue) }}</div>
            <div class="text-caption">{{ displaySummary.unvestedUnits.toLocaleString() }} units</div>
          </v-card>
        </v-col>
      </v-row>

      <!-- Charts Row -->
      <v-row class="mb-6">
        <v-col cols="12" md="5">
          <v-card variant="outlined" class="h-100">
            <v-card-title class="text-subtitle-1">
              <v-icon icon="mdi-chart-pie" class="mr-2" color="primary" />
              Grant Type Distribution
            </v-card-title>
            <v-card-text>
              <div style="height: 250px">
                <Doughnut :data="grantTypeChartData" :options="grantTypeChartOptions" />
              </div>
            </v-card-text>
          </v-card>
        </v-col>

        <v-col cols="12" md="7">
          <v-card variant="outlined" class="h-100">
            <v-card-title class="text-subtitle-1">
              <v-icon icon="mdi-chart-bar" class="mr-2" color="success" />
              Vesting Status (Units)
            </v-card-title>
            <v-card-text>
              <div style="height: 250px">
                <Bar :data="vestingStatusChartData" :options="vestingStatusChartOptions" />
              </div>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <!-- Quick View and Summary -->
      <v-row class="mb-6">
        <v-col cols="12" md="6">
          <v-card variant="outlined" class="h-100">
            <v-card-title class="text-subtitle-1">
              <v-icon icon="mdi-view-list" class="mr-2" color="success" />
              Quick View
            </v-card-title>
            <v-card-text>
              <v-list density="compact">
                <v-list-item v-for="grant in grants.slice(0, 4)" :key="grant.id" class="px-0">
                  <template #prepend>
                    <v-avatar size="32" :color="grantTypeColor(grant.grantType)" variant="tonal">
                      {{ grant.grantType.charAt(0) }}
                    </v-avatar>
                  </template>
                  <v-list-item-title class="font-weight-medium">{{ grant.companyName }}</v-list-item-title>
                  <v-list-item-subtitle>{{ grant.planName || grant.grantNumber }}</v-list-item-subtitle>
                  <template #append>
                    <div class="text-right">
                      <div class="text-body-2 font-weight-medium text-currency">
                        {{ formatINRCompact(grant.totalUnits * (grant.currentFMV || grant.fairMarketValue)) }}
                      </div>
                      <div class="text-caption text-medium-emphasis">
                        {{ grant.totalUnits.toLocaleString() }} units
                      </div>
                    </div>
                  </template>
                </v-list-item>
              </v-list>
              <v-btn
                color="primary"
                variant="tonal"
                block
                class="mt-3"
                prepend-icon="mdi-view-list"
                @click="emit('go-to-details')"
              >
                View All Grants
              </v-btn>
            </v-card-text>
          </v-card>
        </v-col>

        <v-col cols="12" md="6">
          <v-card variant="outlined" class="h-100">
            <v-card-title class="text-subtitle-1">
              <v-icon icon="mdi-office-building" class="mr-2" color="info" />
              Grant Summary
            </v-card-title>
            <v-card-text>
              <v-row dense class="text-center mb-4">
                <v-col cols="4">
                  <div class="text-h4 font-weight-bold">{{ displaySummary.totalGrants }}</div>
                  <div class="text-caption text-medium-emphasis">Total Grants</div>
                </v-col>
                <v-col cols="4">
                  <div class="text-h4 font-weight-bold text-success">{{ displaySummary.activeGrants }}</div>
                  <div class="text-caption text-medium-emphasis">Active</div>
                </v-col>
                <v-col cols="4">
                  <div class="text-h4 font-weight-bold text-primary">{{ displaySummary.companies.length }}</div>
                  <div class="text-caption text-medium-emphasis">Companies</div>
                </v-col>
              </v-row>

              <v-divider class="my-3" />

              <v-list density="compact">
                <v-list-item v-if="displaySummary.totalTaxPaid > 0">
                  <v-list-item-title>Tax Paid (Perquisite)</v-list-item-title>
                  <template #append>
                    <span class="font-weight-medium text-warning text-currency">
                      {{ formatINR(displaySummary.totalTaxPaid) }}
                    </span>
                  </template>
                </v-list-item>
                <v-list-item>
                  <v-list-item-title>Total Perquisite Value</v-list-item-title>
                  <template #append>
                    <span class="font-weight-medium text-currency">
                      {{ formatINR(displaySummary.totalPerquisiteValue) }}
                    </span>
                  </template>
                </v-list-item>
              </v-list>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <!-- Tax Rules -->
      <v-card variant="outlined">
        <v-card-title class="text-subtitle-1">
          <v-icon icon="mdi-information" class="mr-2" color="info" />
          ESOP Tax Rules (India)
        </v-card-title>
        <v-card-text>
          <v-row>
            <v-col cols="12" md="3">
              <v-alert color="primary" variant="tonal" density="compact">
                <div class="text-subtitle-2 font-weight-bold">At Vesting</div>
                <div class="text-body-2 mt-1">
                  FMV - Exercise Price taxed as perquisite (salary income)
                </div>
              </v-alert>
            </v-col>
            <v-col cols="12" md="3">
              <v-alert color="success" variant="tonal" density="compact">
                <div class="text-subtitle-2 font-weight-bold">Listed (LTCG)</div>
                <div class="text-body-2 mt-1">
                  12.5% above ₹1.25L (after 12 months)
                </div>
              </v-alert>
            </v-col>
            <v-col cols="12" md="3">
              <v-alert color="warning" variant="tonal" density="compact">
                <div class="text-subtitle-2 font-weight-bold">Unlisted (LTCG)</div>
                <div class="text-body-2 mt-1">
                  12.5% (after 24 months, no indexation)
                </div>
              </v-alert>
            </v-col>
            <v-col cols="12" md="3">
              <v-alert color="purple" variant="tonal" density="compact">
                <div class="text-subtitle-2 font-weight-bold">Startup Benefit</div>
                <div class="text-body-2 mt-1">
                  Tax deferred for 4 years (DPIIT registered)
                </div>
              </v-alert>
            </v-col>
          </v-row>
        </v-card-text>
      </v-card>

      <!-- Action Bar -->
      <v-card variant="outlined" class="mt-6">
        <v-card-text class="d-flex gap-3 flex-wrap justify-center">
          <v-btn
            color="primary"
            variant="flat"
            prepend-icon="mdi-plus"
            @click="emit('add-grant')"
          >
            Add Grant
          </v-btn>
          <v-btn
            variant="tonal"
            prepend-icon="mdi-table"
            @click="emit('go-to-details')"
          >
            View Details
          </v-btn>
        </v-card-text>
      </v-card>
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
