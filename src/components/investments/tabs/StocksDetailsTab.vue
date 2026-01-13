<script setup lang="ts">
import { ref, computed } from "vue";
import {
  useStocks,
  useDeleteInvestment,
  formatINR,
  formatINRCompact,
  formatPercentage,
  type StockHolding,
} from "@/composables/useInvestments";

const props = defineProps<{
  financialYear: string;
}>();

const emit = defineEmits<{
  (e: "add-stock"): void;
  (e: "edit-stock", stock: StockHolding): void;
}>();

// Data fetching
const { data: stocks, isLoading } = useStocks();
const deleteInvestment = useDeleteInvestment();

// UI state
const searchQuery = ref("");
const sortBy = ref<{ key: string; order: "asc" | "desc" }[]>([{ key: "currentValue", order: "desc" }]);
const showDeleteConfirm = ref(false);
const deletingStock = ref<StockHolding | null>(null);

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

// Filtered stocks
const filteredStocks = computed(() => {
  if (!searchQuery.value) return stocksList.value;

  const query = searchQuery.value.toLowerCase();
  return stocksList.value.filter(
    (s) =>
      s.symbol.toLowerCase().includes(query) ||
      s.name.toLowerCase().includes(query)
  );
});

// Table headers
const headers = [
  { title: "Symbol", key: "symbol", sortable: true },
  { title: "Name", key: "name", sortable: true },
  { title: "Qty", key: "quantity", align: "end" as const, sortable: true },
  { title: "Avg Price", key: "averagePrice", align: "end" as const, sortable: true },
  { title: "Current Price", key: "currentPrice", align: "end" as const, sortable: true },
  { title: "Invested", key: "investedValue", align: "end" as const, sortable: true },
  { title: "Current Value", key: "currentValue", align: "end" as const, sortable: true },
  { title: "P&L", key: "pnl", align: "end" as const, sortable: true },
  { title: "P&L %", key: "pnlPercentage", align: "end" as const, sortable: true },
  { title: "Day Change", key: "dayChange", align: "end" as const, sortable: true },
  { title: "Actions", key: "actions", align: "center" as const, sortable: false },
];

// Summary calculations
const summary = computed(() => {
  const list = filteredStocks.value;
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

// Delete handling
const handleDeleteClick = (stock: StockHolding) => {
  deletingStock.value = stock;
  showDeleteConfirm.value = true;
};

const confirmDelete = async () => {
  if (deletingStock.value) {
    await deleteInvestment.mutateAsync(deletingStock.value.id);
  }
  showDeleteConfirm.value = false;
  deletingStock.value = null;
};
</script>

<template>
  <div class="stocks-details-tab">
    <!-- Loading State -->
    <template v-if="isLoading">
      <v-skeleton-loader type="table" />
    </template>

    <template v-else>
      <!-- Action Bar -->
      <v-card variant="outlined" class="mb-4">
        <v-card-text class="d-flex align-center justify-space-between flex-wrap gap-3">
          <div class="d-flex align-center gap-3">
            <v-chip color="primary" variant="tonal">
              <v-icon icon="mdi-chart-line" class="mr-1" />
              {{ summary.holdingsCount }} Holdings
            </v-chip>
            <v-chip
              :color="summary.totalPnl >= 0 ? 'success' : 'error'"
              variant="tonal"
            >
              <v-icon :icon="summary.totalPnl >= 0 ? 'mdi-trending-up' : 'mdi-trending-down'" class="mr-1" />
              {{ formatPercentage(pnlPercentage) }}
            </v-chip>
          </div>

          <div class="d-flex gap-2">
            <v-text-field
              v-model="searchQuery"
              placeholder="Search stocks..."
              prepend-inner-icon="mdi-magnify"
              variant="outlined"
              density="compact"
              hide-details
              style="max-width: 250px"
              clearable
            />
            <v-btn color="primary" variant="flat" prepend-icon="mdi-plus" @click="emit('add-stock')">
              Add Stock
            </v-btn>
          </div>
        </v-card-text>
      </v-card>

      <!-- Data Table -->
      <v-card variant="outlined">
        <v-data-table
          :headers="headers"
          :items="filteredStocks"
          :sort-by="sortBy"
          item-value="id"
          density="comfortable"
          hover
          class="stocks-table"
        >
          <!-- Symbol Column -->
          <template #item.symbol="{ item }">
            <div class="d-flex align-center gap-2">
              <v-avatar size="32" color="primary" variant="tonal">
                {{ item.symbol.substring(0, 2) }}
              </v-avatar>
              <div>
                <div class="font-weight-bold">{{ item.symbol }}</div>
                <div class="text-caption text-medium-emphasis">{{ item.exchange }}</div>
              </div>
            </div>
          </template>

          <!-- Name Column -->
          <template #item.name="{ item }">
            <span class="text-truncate" style="max-width: 200px; display: block">
              {{ item.name }}
            </span>
          </template>

          <!-- Quantity Column -->
          <template #item.quantity="{ item }">
            <span class="text-currency">{{ item.quantity }}</span>
          </template>

          <!-- Average Price Column -->
          <template #item.averagePrice="{ item }">
            <span class="text-currency">{{ formatINR(item.averagePrice) }}</span>
          </template>

          <!-- Current Price Column -->
          <template #item.currentPrice="{ item }">
            <span class="text-currency">{{ formatINR(item.currentPrice) }}</span>
          </template>

          <!-- Invested Column -->
          <template #item.investedValue="{ item }">
            <span class="text-currency">{{ formatINRCompact(item.investedValue) }}</span>
          </template>

          <!-- Current Value Column -->
          <template #item.currentValue="{ item }">
            <span class="text-currency font-weight-medium">{{ formatINRCompact(item.currentValue) }}</span>
          </template>

          <!-- P&L Column -->
          <template #item.pnl="{ item }">
            <span
              class="text-currency font-weight-medium"
              :class="item.pnl >= 0 ? 'text-success' : 'text-error'"
            >
              {{ item.pnl >= 0 ? "+" : "" }}{{ formatINRCompact(item.pnl) }}
            </span>
          </template>

          <!-- P&L % Column -->
          <template #item.pnlPercentage="{ item }">
            <v-chip
              size="small"
              :color="item.pnlPercentage >= 0 ? 'success' : 'error'"
              variant="tonal"
            >
              <v-icon
                :icon="item.pnlPercentage >= 0 ? 'mdi-arrow-up' : 'mdi-arrow-down'"
                size="x-small"
                class="mr-1"
              />
              {{ formatPercentage(item.pnlPercentage) }}
            </v-chip>
          </template>

          <!-- Day Change Column -->
          <template #item.dayChange="{ item }">
            <div class="text-right">
              <div
                class="text-currency text-body-2"
                :class="item.dayChange >= 0 ? 'text-success' : 'text-error'"
              >
                {{ item.dayChange >= 0 ? "+" : "" }}{{ formatINR(item.dayChange) }}
              </div>
              <div
                class="text-caption"
                :class="item.dayChangePercentage >= 0 ? 'text-success' : 'text-error'"
              >
                ({{ formatPercentage(item.dayChangePercentage) }})
              </div>
            </div>
          </template>

          <!-- Actions Column -->
          <template #item.actions="{ item }">
            <div class="d-flex gap-1 justify-center">
              <v-btn
                icon="mdi-pencil"
                size="small"
                variant="text"
                color="primary"
                @click="emit('edit-stock', item)"
              />
              <v-btn
                icon="mdi-delete"
                size="small"
                variant="text"
                color="error"
                @click="handleDeleteClick(item)"
              />
            </div>
          </template>

          <!-- Footer -->
          <template #bottom>
            <v-divider />
            <div class="pa-4">
              <v-row>
                <v-col cols="12" md="3">
                  <div class="text-caption text-medium-emphasis">Total Invested</div>
                  <div class="text-h6 font-weight-bold text-currency">
                    {{ formatINRCompact(summary.totalInvested) }}
                  </div>
                </v-col>
                <v-col cols="12" md="3">
                  <div class="text-caption text-medium-emphasis">Current Value</div>
                  <div class="text-h6 font-weight-bold text-currency">
                    {{ formatINRCompact(summary.totalValue) }}
                  </div>
                </v-col>
                <v-col cols="12" md="3">
                  <div class="text-caption text-medium-emphasis">Total P&L</div>
                  <div
                    class="text-h6 font-weight-bold text-currency"
                    :class="summary.totalPnl >= 0 ? 'text-success' : 'text-error'"
                  >
                    {{ summary.totalPnl >= 0 ? "+" : "" }}{{ formatINRCompact(summary.totalPnl) }}
                    ({{ formatPercentage(pnlPercentage) }})
                  </div>
                </v-col>
                <v-col cols="12" md="3">
                  <div class="text-caption text-medium-emphasis">Day Change</div>
                  <div
                    class="text-h6 font-weight-bold text-currency"
                    :class="summary.dayChange >= 0 ? 'text-success' : 'text-error'"
                  >
                    {{ summary.dayChange >= 0 ? "+" : "" }}{{ formatINR(summary.dayChange) }}
                  </div>
                </v-col>
              </v-row>
            </div>
          </template>
        </v-data-table>
      </v-card>
    </template>

    <!-- Delete Confirmation Dialog -->
    <v-dialog v-model="showDeleteConfirm" max-width="400">
      <v-card>
        <v-card-title class="d-flex align-center">
          <v-icon icon="mdi-alert" color="error" class="mr-2" />
          Delete Stock
        </v-card-title>
        <v-card-text>
          Are you sure you want to delete
          <strong>{{ deletingStock?.symbol }}</strong> ({{ deletingStock?.name }})?
          This action cannot be undone.
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="showDeleteConfirm = false">Cancel</v-btn>
          <v-btn color="error" variant="flat" @click="confirmDelete">Delete</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<style scoped>
.text-currency {
  font-family: "Roboto Mono", monospace;
}

.stocks-table :deep(.v-data-table__td) {
  white-space: nowrap;
}
</style>
