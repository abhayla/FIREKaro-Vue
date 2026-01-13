<script setup lang="ts">
import { ref, computed } from "vue";
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
  useMutualFunds,
  formatINR,
  formatINRCompact,
  formatPercentage,
  type MutualFund,
} from "@/composables/useInvestments";

ChartJS.register(ArcElement, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const props = defineProps<{
  financialYear: string;
}>();

const emit = defineEmits<{
  (e: "go-to-details"): void;
  (e: "add-fund"): void;
}>();

// Data fetching
const { data: mutualFunds, isLoading } = useMutualFunds();

// Mock MF data for demo
const mockFunds: MutualFund[] = [
  {
    id: "1",
    schemeName: "HDFC Flexi Cap Fund - Direct Growth",
    schemeCode: "118989",
    amcName: "HDFC Mutual Fund",
    category: "Equity",
    subCategory: "Flexi Cap",
    units: 1250.456,
    nav: 1580.25,
    averageNav: 1420.5,
    investedValue: 1775850,
    currentValue: 1976112,
    pnl: 200262,
    pnlPercentage: 11.28,
    xirr: 14.5,
    sipAmount: 25000,
    sipDate: 5,
  },
  {
    id: "2",
    schemeName: "Axis Bluechip Fund - Direct Growth",
    schemeCode: "120503",
    amcName: "Axis Mutual Fund",
    category: "Equity",
    subCategory: "Large Cap",
    units: 850.123,
    nav: 52.45,
    averageNav: 48.2,
    investedValue: 409759,
    currentValue: 445990,
    pnl: 36231,
    pnlPercentage: 8.84,
    xirr: 12.2,
    sipAmount: 10000,
    sipDate: 10,
  },
  {
    id: "3",
    schemeName: "Parag Parikh Flexi Cap Fund - Direct Growth",
    schemeCode: "122639",
    amcName: "PPFAS Mutual Fund",
    category: "Equity",
    subCategory: "Flexi Cap",
    units: 520.789,
    nav: 68.5,
    averageNav: 55.8,
    investedValue: 290600,
    currentValue: 356740,
    pnl: 66140,
    pnlPercentage: 22.76,
    xirr: 18.5,
  },
  {
    id: "4",
    schemeName: "ICICI Prudential Corporate Bond Fund - Direct Growth",
    schemeCode: "120594",
    amcName: "ICICI Prudential MF",
    category: "Debt",
    subCategory: "Corporate Bond",
    units: 4500.25,
    nav: 28.45,
    averageNav: 26.8,
    investedValue: 120607,
    currentValue: 128032,
    pnl: 7425,
    pnlPercentage: 6.15,
    xirr: 7.8,
  },
  {
    id: "5",
    schemeName: "SBI Gold Fund - Direct Growth",
    schemeCode: "119707",
    amcName: "SBI Mutual Fund",
    category: "Gold",
    subCategory: "Gold ETF FOF",
    units: 2800.5,
    nav: 18.25,
    averageNav: 16.5,
    investedValue: 46208,
    currentValue: 51109,
    pnl: 4901,
    pnlPercentage: 10.61,
    xirr: 9.2,
  },
];

// Use mock data if API returns empty/error
const fundsList = computed(() => {
  if (mutualFunds.value && mutualFunds.value.length > 0) {
    return mutualFunds.value;
  }
  return mockFunds;
});

// Summary calculations
const summary = computed(() => {
  const list = fundsList.value;
  return {
    totalValue: list.reduce((acc, f) => acc + f.currentValue, 0),
    totalInvested: list.reduce((acc, f) => acc + f.investedValue, 0),
    totalPnl: list.reduce((acc, f) => acc + f.pnl, 0),
    totalSIP: list.reduce((acc, f) => acc + (f.sipAmount ?? 0), 0),
    fundCount: list.length,
  };
});

const pnlPercentage = computed(() =>
  summary.value.totalInvested > 0
    ? (summary.value.totalPnl / summary.value.totalInvested) * 100
    : 0
);

// Category allocation
const categoryAllocation = computed(() => {
  const categories: Record<string, number> = {};
  fundsList.value.forEach((fund) => {
    const cat = fund.category;
    categories[cat] = (categories[cat] || 0) + fund.currentValue;
  });
  return Object.entries(categories).map(([category, value]) => ({
    category,
    value,
    percentage: (value / summary.value.totalValue) * 100,
  }));
});

// Category chart data
const categoryChartData = computed(() => ({
  labels: categoryAllocation.value.map((c) => c.category),
  datasets: [
    {
      data: categoryAllocation.value.map((c) => c.value),
      backgroundColor: ["#4CAF50", "#2196F3", "#FF9800", "#9C27B0", "#F44336"],
      borderWidth: 2,
      borderColor: "#ffffff",
    },
  ],
}));

const categoryChartOptions = {
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
          const percentage = ((ctx.raw / summary.value.totalValue) * 100).toFixed(1);
          return `${ctx.label}: ${formatINRCompact(ctx.raw)} (${percentage}%)`;
        },
      },
    },
  },
};

// Top performers by XIRR
const topPerformers = computed(() =>
  [...fundsList.value].sort((a, b) => (b.xirr ?? 0) - (a.xirr ?? 0)).slice(0, 5)
);

// Performance chart data
const performanceChartData = computed(() => ({
  labels: topPerformers.value.map((f) => f.schemeName.split(" ")[0]),
  datasets: [
    {
      label: "XIRR %",
      data: topPerformers.value.map((f) => f.xirr ?? 0),
      backgroundColor: topPerformers.value.map((f) =>
        (f.xirr ?? 0) >= 0 ? "rgba(76, 175, 80, 0.8)" : "rgba(244, 67, 54, 0.8)"
      ),
      borderRadius: 4,
    },
  ],
}));

const performanceChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  indexAxis: "y" as const,
  plugins: {
    legend: {
      display: false,
    },
    tooltip: {
      callbacks: {
        label: (context: unknown) => {
          const ctx = context as { raw: number };
          return `XIRR: ${ctx.raw.toFixed(2)}%`;
        },
      },
    },
  },
  scales: {
    x: {
      ticks: {
        callback: (value: unknown) => `${value}%`,
      },
    },
  },
};

// SIP summary
const sipFunds = computed(() => fundsList.value.filter((f) => f.sipAmount && f.sipAmount > 0));
</script>

<template>
  <div class="mutual-funds-overview-tab">
    <!-- Loading State -->
    <template v-if="isLoading">
      <v-skeleton-loader type="card, card, card" />
    </template>

    <template v-else>
      <!-- Summary Cards Row -->
      <v-row class="mb-6">
        <v-col cols="12" sm="6" md="3">
          <v-card class="pa-4 text-center h-100">
            <v-icon icon="mdi-chart-areaspline" size="32" color="primary" class="mb-2" />
            <div class="text-body-2 text-medium-emphasis">Total Value</div>
            <div class="text-h5 font-weight-bold">{{ formatINRCompact(summary.totalValue) }}</div>
            <div class="text-caption text-medium-emphasis">
              {{ summary.fundCount }} funds
            </div>
          </v-card>
        </v-col>
        <v-col cols="12" sm="6" md="3">
          <v-card class="pa-4 text-center h-100">
            <v-icon icon="mdi-cash-multiple" size="32" color="info" class="mb-2" />
            <div class="text-body-2 text-medium-emphasis">Invested</div>
            <div class="text-h5 font-weight-bold">{{ formatINRCompact(summary.totalInvested) }}</div>
          </v-card>
        </v-col>
        <v-col cols="12" sm="6" md="3">
          <v-card class="pa-4 text-center h-100">
            <v-icon
              :icon="summary.totalPnl >= 0 ? 'mdi-trending-up' : 'mdi-trending-down'"
              size="32"
              :color="summary.totalPnl >= 0 ? 'success' : 'error'"
              class="mb-2"
            />
            <div class="text-body-2 text-medium-emphasis">Total P&L</div>
            <div
              class="text-h5 font-weight-bold"
              :class="summary.totalPnl >= 0 ? 'text-success' : 'text-error'"
            >
              {{ formatINRCompact(summary.totalPnl) }}
            </div>
            <div
              class="text-caption"
              :class="pnlPercentage >= 0 ? 'text-success' : 'text-error'"
            >
              {{ formatPercentage(pnlPercentage) }}
            </div>
          </v-card>
        </v-col>
        <v-col cols="12" sm="6" md="3">
          <v-card class="pa-4 text-center h-100">
            <v-icon icon="mdi-calendar-sync" size="32" color="warning" class="mb-2" />
            <div class="text-body-2 text-medium-emphasis">Monthly SIP</div>
            <div class="text-h5 font-weight-bold text-primary">
              {{ formatINR(summary.totalSIP) }}
            </div>
          </v-card>
        </v-col>
      </v-row>

      <!-- Charts Row -->
      <v-row class="mb-6">
        <v-col cols="12" md="6">
          <v-card variant="outlined" class="h-100">
            <v-card-title class="text-subtitle-1">
              <v-icon icon="mdi-chart-pie" class="mr-2" color="primary" />
              Category Allocation
            </v-card-title>
            <v-card-text>
              <div style="height: 250px">
                <Doughnut :data="categoryChartData" :options="categoryChartOptions" />
              </div>
            </v-card-text>
          </v-card>
        </v-col>

        <v-col cols="12" md="6">
          <v-card variant="outlined" class="h-100">
            <v-card-title class="text-subtitle-1">
              <v-icon icon="mdi-trophy" class="mr-2" color="warning" />
              Top Performers (XIRR)
            </v-card-title>
            <v-card-text>
              <div style="height: 250px">
                <Bar :data="performanceChartData" :options="performanceChartOptions" />
              </div>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <!-- Funds List and SIP Info -->
      <v-row class="mb-6">
        <v-col cols="12" md="6">
          <v-card variant="outlined" class="h-100">
            <v-card-title class="text-subtitle-1">
              <v-icon icon="mdi-view-list" class="mr-2" color="success" />
              Quick View
            </v-card-title>
            <v-card-text>
              <v-list density="compact">
                <v-list-item
                  v-for="fund in fundsList.slice(0, 5)"
                  :key="fund.id"
                  class="px-0"
                >
                  <template #prepend>
                    <v-avatar
                      size="32"
                      :color="fund.category === 'Equity' ? 'success' : fund.category === 'Debt' ? 'primary' : 'warning'"
                      variant="tonal"
                    >
                      {{ fund.category.charAt(0) }}
                    </v-avatar>
                  </template>
                  <v-list-item-title class="font-weight-medium text-truncate" style="max-width: 250px">
                    {{ fund.schemeName }}
                  </v-list-item-title>
                  <v-list-item-subtitle>{{ fund.category }} - {{ fund.subCategory }}</v-list-item-subtitle>
                  <template #append>
                    <div class="text-right">
                      <div class="text-body-2 font-weight-medium text-currency">
                        {{ formatINRCompact(fund.currentValue) }}
                      </div>
                      <div
                        class="text-caption"
                        :class="fund.pnlPercentage >= 0 ? 'text-success' : 'text-error'"
                      >
                        {{ formatPercentage(fund.pnlPercentage) }}
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
                View All Funds
              </v-btn>
            </v-card-text>
          </v-card>
        </v-col>

        <v-col cols="12" md="6">
          <v-card variant="outlined" class="h-100">
            <v-card-title class="text-subtitle-1">
              <v-icon icon="mdi-calendar-sync" class="mr-2" color="warning" />
              Active SIPs
            </v-card-title>
            <v-card-text>
              <v-list density="compact">
                <v-list-item
                  v-for="fund in sipFunds"
                  :key="fund.id"
                  class="px-0"
                >
                  <v-list-item-title class="font-weight-medium text-truncate" style="max-width: 250px">
                    {{ fund.schemeName }}
                  </v-list-item-title>
                  <v-list-item-subtitle>
                    Every {{ fund.sipDate }}{{ ["st", "nd", "rd"][((fund.sipDate ?? 1) - 1) % 10] || "th" }}
                  </v-list-item-subtitle>
                  <template #append>
                    <div class="text-right">
                      <div class="text-body-2 font-weight-medium text-currency text-primary">
                        {{ formatINR(fund.sipAmount ?? 0) }}
                      </div>
                      <div class="text-caption text-medium-emphasis">/month</div>
                    </div>
                  </template>
                </v-list-item>
              </v-list>

              <v-divider class="my-3" />

              <div class="d-flex justify-space-between align-center">
                <span class="text-body-2 text-medium-emphasis">Total Monthly SIP</span>
                <span class="text-h6 font-weight-bold text-primary text-currency">
                  {{ formatINR(summary.totalSIP) }}
                </span>
              </div>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <!-- Tax Info -->
      <v-row>
        <v-col cols="12">
          <v-card variant="outlined">
            <v-card-title class="text-subtitle-1">
              <v-icon icon="mdi-information" class="mr-2" color="info" />
              Tax Implications (Equity Funds)
            </v-card-title>
            <v-card-text>
              <v-row>
                <v-col cols="12" md="4">
                  <v-alert type="info" variant="tonal" density="compact">
                    <div class="text-subtitle-2 font-weight-bold">Short Term (< 1 year)</div>
                    <div class="text-body-2">15% tax on gains</div>
                  </v-alert>
                </v-col>
                <v-col cols="12" md="4">
                  <v-alert type="success" variant="tonal" density="compact">
                    <div class="text-subtitle-2 font-weight-bold">Long Term (> 1 year)</div>
                    <div class="text-body-2">10% tax on gains above ₹1L</div>
                  </v-alert>
                </v-col>
                <v-col cols="12" md="4">
                  <v-alert type="warning" variant="tonal" density="compact">
                    <div class="text-subtitle-2 font-weight-bold">ELSS (Tax Saving)</div>
                    <div class="text-body-2">80C deduction up to ₹1.5L, 3-year lock-in</div>
                  </v-alert>
                </v-col>
              </v-row>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <!-- Action Bar -->
      <v-card variant="outlined" class="mt-6">
        <v-card-text class="d-flex gap-3 flex-wrap justify-center">
          <v-btn
            color="primary"
            variant="flat"
            prepend-icon="mdi-plus"
            @click="emit('add-fund')"
          >
            Add Mutual Fund
          </v-btn>
          <v-btn variant="outlined" prepend-icon="mdi-file-import">
            Import CAS
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
