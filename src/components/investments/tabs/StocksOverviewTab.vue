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
  useStocks,
  formatINR,
  formatINRCompact,
  formatPercentage,
  type StockHolding,
} from "@/composables/useInvestments";

ChartJS.register(ArcElement, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const props = defineProps<{
  financialYear: string;
}>();

const emit = defineEmits<{
  (e: "go-to-details"): void;
  (e: "add-stock"): void;
}>();

// Data fetching
const { data: stocks, isLoading } = useStocks();

// Mock stock data for demo
const mockStocks: StockHolding[] = [
  {
    id: "1",
    symbol: "RELIANCE",
    name: "Reliance Industries Ltd",
    exchange: "NSE",
    quantity: 50,
    averagePrice: 2450,
    currentPrice: 2680,
    investedValue: 122500,
    currentValue: 134000,
    pnl: 11500,
    pnlPercentage: 9.39,
    dayChange: 15,
    dayChangePercentage: 0.56,
  },
  {
    id: "2",
    symbol: "TCS",
    name: "Tata Consultancy Services",
    exchange: "NSE",
    quantity: 25,
    averagePrice: 3200,
    currentPrice: 3580,
    investedValue: 80000,
    currentValue: 89500,
    pnl: 9500,
    pnlPercentage: 11.88,
    dayChange: -20,
    dayChangePercentage: -0.56,
  },
  {
    id: "3",
    symbol: "INFY",
    name: "Infosys Ltd",
    exchange: "NSE",
    quantity: 60,
    averagePrice: 1480,
    currentPrice: 1620,
    investedValue: 88800,
    currentValue: 97200,
    pnl: 8400,
    pnlPercentage: 9.46,
    dayChange: 8,
    dayChangePercentage: 0.5,
  },
  {
    id: "4",
    symbol: "HDFCBANK",
    name: "HDFC Bank Ltd",
    exchange: "NSE",
    quantity: 40,
    averagePrice: 1650,
    currentPrice: 1720,
    investedValue: 66000,
    currentValue: 68800,
    pnl: 2800,
    pnlPercentage: 4.24,
    dayChange: 5,
    dayChangePercentage: 0.29,
  },
];

// Use mock data if API returns empty/error
const stocksList = computed(() => {
  if (stocks.value && stocks.value.length > 0) {
    return stocks.value;
  }
  return mockStocks;
});

// Summary calculations
const summary = computed(() => {
  const list = stocksList.value;
  return {
    totalValue: list.reduce((acc, s) => acc + s.currentValue, 0),
    totalInvested: list.reduce((acc, s) => acc + s.investedValue, 0),
    totalPnl: list.reduce((acc, s) => acc + s.pnl, 0),
    dayChange: list.reduce((acc, s) => acc + s.dayChange * s.quantity, 0),
    holdingsCount: list.length,
  };
});

const pnlPercentage = computed(() =>
  summary.value.totalInvested > 0
    ? (summary.value.totalPnl / summary.value.totalInvested) * 100
    : 0
);

// Allocation chart data
const allocationChartData = computed(() => {
  const sortedStocks = [...stocksList.value].sort((a, b) => b.currentValue - a.currentValue);
  const topStocks = sortedStocks.slice(0, 5);
  const othersValue = sortedStocks.slice(5).reduce((acc, s) => acc + s.currentValue, 0);

  const labels = topStocks.map((s) => s.symbol);
  const data = topStocks.map((s) => s.currentValue);

  if (othersValue > 0) {
    labels.push("Others");
    data.push(othersValue);
  }

  return {
    labels,
    datasets: [
      {
        data,
        backgroundColor: ["#4CAF50", "#2196F3", "#FF9800", "#9C27B0", "#F44336", "#607D8B"],
        borderWidth: 2,
        borderColor: "#ffffff",
      },
    ],
  };
});

const allocationChartOptions = {
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
          const total = summary.value.totalValue;
          const percentage = ((ctx.raw / total) * 100).toFixed(1);
          return `${ctx.label}: ${formatINRCompact(ctx.raw)} (${percentage}%)`;
        },
      },
    },
  },
};

// Top performers
const topPerformers = computed(() =>
  [...stocksList.value].sort((a, b) => b.pnlPercentage - a.pnlPercentage).slice(0, 5)
);

// Performance chart data
const performanceChartData = computed(() => ({
  labels: topPerformers.value.map((s) => s.symbol),
  datasets: [
    {
      label: "P&L %",
      data: topPerformers.value.map((s) => s.pnlPercentage),
      backgroundColor: topPerformers.value.map((s) =>
        s.pnlPercentage >= 0 ? "rgba(76, 175, 80, 0.8)" : "rgba(244, 67, 54, 0.8)"
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
          return `${ctx.raw.toFixed(2)}%`;
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

// Sector allocation (mock - would come from actual sector data)
const sectorAllocation = computed(() => [
  { sector: "IT", value: 186700, percentage: 48 },
  { sector: "Banking", value: 68800, percentage: 18 },
  { sector: "Energy", value: 134000, percentage: 34 },
]);
</script>

<template>
  <div class="stocks-overview-tab">
    <!-- Loading State -->
    <template v-if="isLoading">
      <v-skeleton-loader type="card, card, card" />
    </template>

    <template v-else>
      <!-- Summary Cards Row -->
      <v-row class="mb-6">
        <v-col cols="12" sm="6" md="3">
          <v-card class="pa-4 text-center h-100">
            <v-icon icon="mdi-chart-line" size="32" color="primary" class="mb-2" />
            <div class="text-body-2 text-medium-emphasis">Total Value</div>
            <div class="text-h5 font-weight-bold">{{ formatINRCompact(summary.totalValue) }}</div>
            <div class="text-caption text-medium-emphasis">
              {{ summary.holdingsCount }} holdings
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
            <v-icon
              :icon="summary.dayChange >= 0 ? 'mdi-arrow-up-bold' : 'mdi-arrow-down-bold'"
              size="32"
              :color="summary.dayChange >= 0 ? 'success' : 'error'"
              class="mb-2"
            />
            <div class="text-body-2 text-medium-emphasis">Day Change</div>
            <div
              class="text-h5 font-weight-bold"
              :class="summary.dayChange >= 0 ? 'text-success' : 'text-error'"
            >
              {{ formatINR(summary.dayChange) }}
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
              Portfolio Allocation
            </v-card-title>
            <v-card-text>
              <div style="height: 250px">
                <Doughnut :data="allocationChartData" :options="allocationChartOptions" />
              </div>
            </v-card-text>
          </v-card>
        </v-col>

        <v-col cols="12" md="6">
          <v-card variant="outlined" class="h-100">
            <v-card-title class="text-subtitle-1">
              <v-icon icon="mdi-trophy" class="mr-2" color="warning" />
              Top Performers
            </v-card-title>
            <v-card-text>
              <div style="height: 250px">
                <Bar :data="performanceChartData" :options="performanceChartOptions" />
              </div>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <!-- Holdings and Sector Allocation -->
      <v-row class="mb-6">
        <v-col cols="12" md="4">
          <v-card variant="outlined" class="h-100">
            <v-card-title class="text-subtitle-1">
              <v-icon icon="mdi-view-list" class="mr-2" color="success" />
              Quick View
            </v-card-title>
            <v-card-text>
              <v-list density="compact">
                <v-list-item
                  v-for="stock in stocksList.slice(0, 5)"
                  :key="stock.id"
                  class="px-0"
                >
                  <template #prepend>
                    <v-avatar size="32" color="primary" variant="tonal">
                      {{ stock.symbol.substring(0, 2) }}
                    </v-avatar>
                  </template>
                  <v-list-item-title class="font-weight-medium">{{ stock.symbol }}</v-list-item-title>
                  <v-list-item-subtitle class="text-truncate">{{ stock.name }}</v-list-item-subtitle>
                  <template #append>
                    <div class="text-right">
                      <div class="text-body-2 font-weight-medium text-currency">
                        {{ formatINRCompact(stock.currentValue) }}
                      </div>
                      <div
                        class="text-caption"
                        :class="stock.pnlPercentage >= 0 ? 'text-success' : 'text-error'"
                      >
                        {{ formatPercentage(stock.pnlPercentage) }}
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
                View All Holdings
              </v-btn>
            </v-card-text>
          </v-card>
        </v-col>

        <v-col cols="12" md="4">
          <v-card variant="outlined" class="h-100">
            <v-card-title class="text-subtitle-1">
              <v-icon icon="mdi-domain" class="mr-2" color="teal" />
              Sector Allocation
            </v-card-title>
            <v-card-text>
              <v-list density="compact">
                <v-list-item v-for="sector in sectorAllocation" :key="sector.sector" class="px-0">
                  <v-list-item-title>{{ sector.sector }}</v-list-item-title>
                  <template #append>
                    <div class="text-right">
                      <div class="text-body-2 font-weight-medium text-currency">
                        {{ formatINRCompact(sector.value) }}
                      </div>
                      <div class="text-caption text-medium-emphasis">{{ sector.percentage }}%</div>
                    </div>
                  </template>
                  <template #default>
                    <v-progress-linear
                      :model-value="sector.percentage"
                      color="teal"
                      height="6"
                      rounded
                      class="mt-1"
                    />
                  </template>
                </v-list-item>
              </v-list>
            </v-card-text>
          </v-card>
        </v-col>

        <v-col cols="12" md="4">
          <v-card variant="outlined" class="h-100">
            <v-card-title class="text-subtitle-1">
              <v-icon icon="mdi-information" class="mr-2" color="info" />
              Tax Implications
            </v-card-title>
            <v-card-text>
              <v-alert type="info" variant="tonal" density="compact" class="mb-3">
                <div class="text-subtitle-2 font-weight-bold">Short Term (< 1 year)</div>
                <div class="text-body-2">15% tax on gains above ₹1L</div>
              </v-alert>
              <v-alert type="success" variant="tonal" density="compact" class="mb-3">
                <div class="text-subtitle-2 font-weight-bold">Long Term (> 1 year)</div>
                <div class="text-body-2">10% tax on gains above ₹1L</div>
              </v-alert>
              <v-alert type="warning" variant="tonal" density="compact">
                <div class="text-subtitle-2 font-weight-bold">STT Paid</div>
                <div class="text-body-2">Securities Transaction Tax included in brokerage</div>
              </v-alert>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <!-- Action Bar -->
      <v-card variant="outlined">
        <v-card-text class="d-flex gap-3 flex-wrap justify-center">
          <v-btn
            color="primary"
            variant="flat"
            prepend-icon="mdi-plus"
            @click="emit('add-stock')"
          >
            Add Stock
          </v-btn>
          <v-btn variant="outlined" prepend-icon="mdi-file-import">
            Import from Broker
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
