<script setup lang="ts">
import { ref, computed } from 'vue'
import SectionHeader from '@/components/shared/SectionHeader.vue'
import StockHoldingCard from '@/components/investments/StockHoldingCard.vue'
import AssetForm from '@/components/investments/AssetForm.vue'
import {
  useStocks,
  useCreateInvestment,
  useDeleteInvestment,
  formatINR,
  formatINRCompact,
  formatPercentage,
  type StockHolding,
  type Investment
} from '@/composables/useInvestments'

const tabs = [
  { title: 'Portfolio', route: '/dashboard/investments' },
  { title: 'Stocks', route: '/dashboard/investments/stocks' },
  { title: 'Mutual Funds', route: '/dashboard/investments/mutual-funds' },
  { title: 'EPF & PPF', route: '/dashboard/investments/epf-ppf' },
  { title: 'NPS', route: '/dashboard/investments/nps' },
  { title: 'Property', route: '/dashboard/investments/property' },
  { title: 'Reports', route: '/dashboard/investments/reports' },
]

// Data fetching
const { data: stocks, isLoading, error } = useStocks()
const createInvestment = useCreateInvestment()
const deleteInvestment = useDeleteInvestment()

// UI state
const showAddDialog = ref(false)
const editingStock = ref<StockHolding | null>(null)
const searchQuery = ref('')
const sortBy = ref<'value' | 'pnl' | 'name'>('value')
const showDeleteConfirm = ref(false)
const deletingId = ref<string | null>(null)

// Mock stock data for demo
const mockStocks: StockHolding[] = [
  {
    id: '1',
    symbol: 'RELIANCE',
    name: 'Reliance Industries Ltd',
    exchange: 'NSE',
    quantity: 50,
    averagePrice: 2450,
    currentPrice: 2680,
    investedValue: 122500,
    currentValue: 134000,
    pnl: 11500,
    pnlPercentage: 9.39,
    dayChange: 15,
    dayChangePercentage: 0.56
  },
  {
    id: '2',
    symbol: 'TCS',
    name: 'Tata Consultancy Services',
    exchange: 'NSE',
    quantity: 25,
    averagePrice: 3200,
    currentPrice: 3580,
    investedValue: 80000,
    currentValue: 89500,
    pnl: 9500,
    pnlPercentage: 11.88,
    dayChange: -20,
    dayChangePercentage: -0.56
  },
  {
    id: '3',
    symbol: 'INFY',
    name: 'Infosys Ltd',
    exchange: 'NSE',
    quantity: 60,
    averagePrice: 1480,
    currentPrice: 1620,
    investedValue: 88800,
    currentValue: 97200,
    pnl: 8400,
    pnlPercentage: 9.46,
    dayChange: 8,
    dayChangePercentage: 0.50
  },
  {
    id: '4',
    symbol: 'HDFCBANK',
    name: 'HDFC Bank Ltd',
    exchange: 'NSE',
    quantity: 40,
    averagePrice: 1650,
    currentPrice: 1720,
    investedValue: 66000,
    currentValue: 68800,
    pnl: 2800,
    pnlPercentage: 4.24,
    dayChange: 5,
    dayChangePercentage: 0.29
  }
]

// Use mock data if API returns empty/error
const stocksList = computed(() => {
  if (stocks.value && stocks.value.length > 0) {
    return stocks.value
  }
  return mockStocks
})

// Filtered and sorted stocks
const filteredStocks = computed(() => {
  let result = [...stocksList.value]

  // Filter by search
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(
      (s) =>
        s.symbol.toLowerCase().includes(query) ||
        s.name.toLowerCase().includes(query)
    )
  }

  // Sort
  switch (sortBy.value) {
    case 'value':
      result.sort((a, b) => b.currentValue - a.currentValue)
      break
    case 'pnl':
      result.sort((a, b) => b.pnlPercentage - a.pnlPercentage)
      break
    case 'name':
      result.sort((a, b) => a.symbol.localeCompare(b.symbol))
      break
  }

  return result
})

// Summary calculations
const summary = computed(() => {
  const list = stocksList.value
  return {
    totalValue: list.reduce((acc, s) => acc + s.currentValue, 0),
    totalInvested: list.reduce((acc, s) => acc + s.investedValue, 0),
    totalPnl: list.reduce((acc, s) => acc + s.pnl, 0),
    dayChange: list.reduce((acc, s) => acc + s.dayChange * s.quantity, 0),
    holdingsCount: list.length
  }
})

const pnlPercentage = computed(() =>
  summary.value.totalInvested > 0
    ? (summary.value.totalPnl / summary.value.totalInvested) * 100
    : 0
)

// Actions
const handleSaveStock = async (data: Partial<Investment>) => {
  await createInvestment.mutateAsync({ ...data, type: 'stock' } as any)
  showAddDialog.value = false
  editingStock.value = null
}

const handleEdit = (stock: StockHolding) => {
  editingStock.value = stock
  showAddDialog.value = true
}

const handleDelete = (id: string) => {
  deletingId.value = id
  showDeleteConfirm.value = true
}

const confirmDelete = async () => {
  if (deletingId.value) {
    await deleteInvestment.mutateAsync(deletingId.value)
  }
  showDeleteConfirm.value = false
  deletingId.value = null
}
</script>

<template>
  <div>
    <SectionHeader
      title="Investments"
      subtitle="Stock Holdings"
      icon="mdi-chart-line"
      :tabs="tabs"
    />

    <!-- Summary Cards -->
    <v-row class="mb-6">
      <v-col cols="12" md="3">
        <v-card class="pa-4">
          <div class="text-body-2 text-medium-emphasis">Total Value</div>
          <div class="text-h5 font-weight-bold">{{ formatINRCompact(summary.totalValue) }}</div>
          <div class="text-caption text-medium-emphasis">
            {{ summary.holdingsCount }} holdings
          </div>
        </v-card>
      </v-col>
      <v-col cols="12" md="3">
        <v-card class="pa-4">
          <div class="text-body-2 text-medium-emphasis">Invested</div>
          <div class="text-h5 font-weight-bold">{{ formatINRCompact(summary.totalInvested) }}</div>
        </v-card>
      </v-col>
      <v-col cols="12" md="3">
        <v-card class="pa-4">
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
      <v-col cols="12" md="3">
        <v-card class="pa-4">
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

    <!-- Toolbar -->
    <v-card variant="outlined" class="mb-6">
      <v-card-text class="d-flex gap-3 flex-wrap align-center">
        <v-btn color="primary" variant="flat" prepend-icon="mdi-plus" @click="showAddDialog = true">
          Add Stock
        </v-btn>

        <v-spacer />

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

        <v-select
          v-model="sortBy"
          :items="[
            { title: 'By Value', value: 'value' },
            { title: 'By P&L %', value: 'pnl' },
            { title: 'By Name', value: 'name' }
          ]"
          label="Sort"
          variant="outlined"
          density="compact"
          hide-details
          style="max-width: 150px"
        />
      </v-card-text>
    </v-card>

    <!-- Loading State -->
    <template v-if="isLoading">
      <v-row>
        <v-col v-for="n in 4" :key="n" cols="12" sm="6" md="4" lg="3">
          <v-skeleton-loader type="card" />
        </v-col>
      </v-row>
    </template>

    <!-- Error State -->
    <v-alert v-else-if="error" type="error" variant="tonal" class="mb-6">
      Failed to load stocks. Showing demo data.
    </v-alert>

    <!-- Stock Holdings Grid -->
    <v-row v-if="filteredStocks.length > 0">
      <v-col
        v-for="stock in filteredStocks"
        :key="stock.id"
        cols="12"
        sm="6"
        md="4"
        lg="3"
      >
        <StockHoldingCard
          :stock="stock"
          show-actions
          @edit="handleEdit"
          @delete="handleDelete"
        />
      </v-col>
    </v-row>

    <!-- Empty State -->
    <v-card v-else variant="outlined" class="pa-8 text-center">
      <v-icon icon="mdi-chart-line" size="64" color="grey" class="mb-4" />
      <h3 class="text-h6 mb-2">No stocks found</h3>
      <p class="text-body-2 text-medium-emphasis mb-4">
        {{ searchQuery ? 'Try a different search term' : 'Add your first stock holding to get started' }}
      </p>
      <v-btn color="primary" variant="flat" prepend-icon="mdi-plus" @click="showAddDialog = true">
        Add Stock
      </v-btn>
    </v-card>

    <!-- Add/Edit Stock Dialog -->
    <AssetForm
      v-model="showAddDialog"
      :asset="editingStock as any"
      :is-editing="!!editingStock"
      @save="handleSaveStock"
    />

    <!-- Delete Confirmation Dialog -->
    <v-dialog v-model="showDeleteConfirm" max-width="400">
      <v-card>
        <v-card-title class="d-flex align-center">
          <v-icon icon="mdi-alert" color="error" class="mr-2" />
          Delete Stock
        </v-card-title>
        <v-card-text>
          Are you sure you want to delete this stock? This action cannot be undone.
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
