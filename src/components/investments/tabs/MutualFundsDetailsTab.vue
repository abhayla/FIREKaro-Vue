<script setup lang="ts">
import { ref, computed } from "vue";
import {
  useMutualFunds,
  useDeleteInvestment,
  formatINR,
  formatINRCompact,
  formatPercentage,
  type MutualFund,
} from "@/composables/useInvestments";

const props = defineProps<{
  financialYear: string;
}>();

const emit = defineEmits<{
  (e: "add-fund"): void;
  (e: "edit-fund", fund: MutualFund): void;
}>();

// Data fetching
const { data: mutualFunds, isLoading } = useMutualFunds();
const deleteInvestment = useDeleteInvestment();

// UI state
const searchQuery = ref("");
const categoryFilter = ref<string | null>(null);
const sortBy = ref<{ key: string; order: "asc" | "desc" }[]>([{ key: "currentValue", order: "desc" }]);
const showDeleteConfirm = ref(false);
const deletingFund = ref<MutualFund | null>(null);

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

// Categories for filter
const categories = computed(() => {
  const cats = new Set(fundsList.value.map((f) => f.category));
  return Array.from(cats);
});

// Filtered funds
const filteredFunds = computed(() => {
  let result = fundsList.value;

  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    result = result.filter(
      (f) =>
        f.schemeName.toLowerCase().includes(query) ||
        f.amcName.toLowerCase().includes(query)
    );
  }

  if (categoryFilter.value) {
    result = result.filter((f) => f.category === categoryFilter.value);
  }

  return result;
});

// Table headers
const headers = [
  { title: "Scheme", key: "schemeName", sortable: true, minWidth: "250px" },
  { title: "Category", key: "category", sortable: true },
  { title: "Units", key: "units", align: "end" as const, sortable: true },
  { title: "NAV", key: "nav", align: "end" as const, sortable: true },
  { title: "Avg NAV", key: "averageNav", align: "end" as const, sortable: true },
  { title: "Invested", key: "investedValue", align: "end" as const, sortable: true },
  { title: "Current Value", key: "currentValue", align: "end" as const, sortable: true },
  { title: "P&L", key: "pnl", align: "end" as const, sortable: true },
  { title: "XIRR", key: "xirr", align: "end" as const, sortable: true },
  { title: "SIP", key: "sipAmount", align: "end" as const, sortable: true },
  { title: "Actions", key: "actions", align: "center" as const, sortable: false },
];

// Summary calculations
const summary = computed(() => {
  const list = filteredFunds.value;
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

// Delete handling
const handleDeleteClick = (fund: MutualFund) => {
  deletingFund.value = fund;
  showDeleteConfirm.value = true;
};

const confirmDelete = async () => {
  if (deletingFund.value) {
    await deleteInvestment.mutateAsync(deletingFund.value.id);
  }
  showDeleteConfirm.value = false;
  deletingFund.value = null;
};

// Category color helper
const getCategoryColor = (category: string) => {
  switch (category) {
    case "Equity":
      return "success";
    case "Debt":
      return "primary";
    case "Gold":
      return "warning";
    case "Hybrid":
      return "purple";
    default:
      return "grey";
  }
};
</script>

<template>
  <div class="mutual-funds-details-tab">
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
              <v-icon icon="mdi-chart-areaspline" class="mr-1" />
              {{ summary.fundCount }} Funds
            </v-chip>
            <v-chip
              :color="summary.totalPnl >= 0 ? 'success' : 'error'"
              variant="tonal"
            >
              <v-icon :icon="summary.totalPnl >= 0 ? 'mdi-trending-up' : 'mdi-trending-down'" class="mr-1" />
              {{ formatPercentage(pnlPercentage) }}
            </v-chip>
          </div>

          <div class="d-flex gap-2 flex-wrap">
            <v-text-field
              v-model="searchQuery"
              placeholder="Search funds..."
              prepend-inner-icon="mdi-magnify"
              variant="outlined"
              density="compact"
              hide-details
              style="max-width: 250px"
              clearable
            />
            <v-select
              v-model="categoryFilter"
              :items="[{ title: 'All Categories', value: null }, ...categories.map((c) => ({ title: c, value: c }))]"
              label="Category"
              variant="outlined"
              density="compact"
              hide-details
              style="max-width: 150px"
            />
            <v-btn color="primary" variant="flat" prepend-icon="mdi-plus" @click="emit('add-fund')">
              Add Fund
            </v-btn>
          </div>
        </v-card-text>
      </v-card>

      <!-- Data Table -->
      <v-card variant="outlined">
        <v-data-table
          :headers="headers"
          :items="filteredFunds"
          :sort-by="sortBy"
          item-value="id"
          density="comfortable"
          hover
          class="mf-table"
        >
          <!-- Scheme Column -->
          <template #item.schemeName="{ item }">
            <div class="d-flex align-center gap-2 py-2">
              <v-avatar
                size="32"
                :color="getCategoryColor(item.category)"
                variant="tonal"
              >
                {{ item.category.charAt(0) }}
              </v-avatar>
              <div>
                <div class="font-weight-medium text-truncate" style="max-width: 250px">
                  {{ item.schemeName }}
                </div>
                <div class="text-caption text-medium-emphasis">{{ item.amcName }}</div>
              </div>
            </div>
          </template>

          <!-- Category Column -->
          <template #item.category="{ item }">
            <v-chip
              size="small"
              :color="getCategoryColor(item.category)"
              variant="tonal"
            >
              {{ item.subCategory }}
            </v-chip>
          </template>

          <!-- Units Column -->
          <template #item.units="{ item }">
            <span class="text-currency">{{ item.units.toFixed(3) }}</span>
          </template>

          <!-- NAV Column -->
          <template #item.nav="{ item }">
            <span class="text-currency">{{ formatINR(item.nav) }}</span>
          </template>

          <!-- Avg NAV Column -->
          <template #item.averageNav="{ item }">
            <span class="text-currency">{{ formatINR(item.averageNav) }}</span>
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
            <div class="text-right">
              <div
                class="text-currency font-weight-medium"
                :class="item.pnl >= 0 ? 'text-success' : 'text-error'"
              >
                {{ item.pnl >= 0 ? "+" : "" }}{{ formatINRCompact(item.pnl) }}
              </div>
              <div
                class="text-caption"
                :class="item.pnlPercentage >= 0 ? 'text-success' : 'text-error'"
              >
                {{ formatPercentage(item.pnlPercentage) }}
              </div>
            </div>
          </template>

          <!-- XIRR Column -->
          <template #item.xirr="{ item }">
            <v-chip
              v-if="item.xirr"
              size="small"
              :color="item.xirr >= 0 ? 'success' : 'error'"
              variant="tonal"
            >
              {{ item.xirr.toFixed(1) }}%
            </v-chip>
            <span v-else class="text-medium-emphasis">-</span>
          </template>

          <!-- SIP Column -->
          <template #item.sipAmount="{ item }">
            <div v-if="item.sipAmount" class="text-right">
              <div class="text-currency text-primary font-weight-medium">
                {{ formatINR(item.sipAmount) }}
              </div>
              <div class="text-caption text-medium-emphasis">{{ item.sipDate }}th</div>
            </div>
            <span v-else class="text-medium-emphasis">-</span>
          </template>

          <!-- Actions Column -->
          <template #item.actions="{ item }">
            <div class="d-flex gap-1 justify-center">
              <v-btn
                icon="mdi-pencil"
                size="small"
                variant="text"
                color="primary"
                @click="emit('edit-fund', item)"
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
                  <div class="text-caption text-medium-emphasis">Monthly SIP</div>
                  <div class="text-h6 font-weight-bold text-currency text-primary">
                    {{ formatINR(summary.totalSIP) }}
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
          Delete Mutual Fund
        </v-card-title>
        <v-card-text>
          Are you sure you want to delete
          <strong>{{ deletingFund?.schemeName }}</strong>?
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

.mf-table :deep(.v-data-table__td) {
  white-space: nowrap;
}
</style>
