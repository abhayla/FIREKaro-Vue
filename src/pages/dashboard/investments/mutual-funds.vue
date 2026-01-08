<script setup lang="ts">
import { ref, computed } from 'vue'
import SectionHeader from '@/components/shared/SectionHeader.vue'
import FamilyToggle from '@/components/shared/FamilyToggle.vue'
import MutualFundCard from '@/components/investments/MutualFundCard.vue'
import AssetForm from '@/components/investments/AssetForm.vue'
import {
  useMutualFunds,
  useCreateInvestment,
  useDeleteInvestment,
  formatINR,
  formatINRCompact,
  formatPercentage,
  type MutualFund,
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
const { data: mutualFunds, isLoading, error } = useMutualFunds()
const createInvestment = useCreateInvestment()
const deleteInvestment = useDeleteInvestment()

// UI state
const showAddDialog = ref(false)
const editingFund = ref<MutualFund | null>(null)
const searchQuery = ref('')
const categoryFilter = ref<string | null>(null)
const sortBy = ref<'value' | 'returns' | 'name'>('value')
const showDeleteConfirm = ref(false)
const deletingId = ref<string | null>(null)

// Mock MF data for demo
const mockFunds: MutualFund[] = [
  {
    id: '1',
    schemeName: 'HDFC Flexi Cap Fund - Direct Growth',
    schemeCode: '118989',
    amcName: 'HDFC Mutual Fund',
    category: 'Equity',
    subCategory: 'Flexi Cap',
    units: 1250.456,
    nav: 1580.25,
    averageNav: 1420.50,
    investedValue: 1775850,
    currentValue: 1976112,
    pnl: 200262,
    pnlPercentage: 11.28,
    xirr: 14.5,
    sipAmount: 25000,
    sipDate: 5
  },
  {
    id: '2',
    schemeName: 'Axis Bluechip Fund - Direct Growth',
    schemeCode: '120503',
    amcName: 'Axis Mutual Fund',
    category: 'Equity',
    subCategory: 'Large Cap',
    units: 850.123,
    nav: 52.45,
    averageNav: 48.20,
    investedValue: 409759,
    currentValue: 445990,
    pnl: 36231,
    pnlPercentage: 8.84,
    xirr: 12.2,
    sipAmount: 10000,
    sipDate: 10
  },
  {
    id: '3',
    schemeName: 'Parag Parikh Flexi Cap Fund - Direct Growth',
    schemeCode: '122639',
    amcName: 'PPFAS Mutual Fund',
    category: 'Equity',
    subCategory: 'Flexi Cap',
    units: 520.789,
    nav: 68.50,
    averageNav: 55.80,
    investedValue: 290600,
    currentValue: 356740,
    pnl: 66140,
    pnlPercentage: 22.76,
    xirr: 18.5
  },
  {
    id: '4',
    schemeName: 'ICICI Prudential Corporate Bond Fund - Direct Growth',
    schemeCode: '120594',
    amcName: 'ICICI Prudential MF',
    category: 'Debt',
    subCategory: 'Corporate Bond',
    units: 4500.250,
    nav: 28.45,
    averageNav: 26.80,
    investedValue: 120607,
    currentValue: 128032,
    pnl: 7425,
    pnlPercentage: 6.15,
    xirr: 7.8
  },
  {
    id: '5',
    schemeName: 'SBI Gold Fund - Direct Growth',
    schemeCode: '119707',
    amcName: 'SBI Mutual Fund',
    category: 'Gold',
    subCategory: 'Gold ETF FOF',
    units: 2800.500,
    nav: 18.25,
    averageNav: 16.50,
    investedValue: 46208,
    currentValue: 51109,
    pnl: 4901,
    pnlPercentage: 10.61,
    xirr: 9.2
  }
]

// Use mock data if API returns empty/error
const fundsList = computed(() => {
  if (mutualFunds.value && mutualFunds.value.length > 0) {
    return mutualFunds.value
  }
  return mockFunds
})

// Available categories
const categories = computed(() => {
  const cats = new Set(fundsList.value.map((f) => f.category))
  return Array.from(cats)
})

// Filtered and sorted funds
const filteredFunds = computed(() => {
  let result = [...fundsList.value]

  // Filter by search
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(
      (f) =>
        f.schemeName.toLowerCase().includes(query) ||
        f.amcName.toLowerCase().includes(query)
    )
  }

  // Filter by category
  if (categoryFilter.value) {
    result = result.filter((f) => f.category === categoryFilter.value)
  }

  // Sort
  switch (sortBy.value) {
    case 'value':
      result.sort((a, b) => b.currentValue - a.currentValue)
      break
    case 'returns':
      result.sort((a, b) => (b.xirr ?? b.pnlPercentage) - (a.xirr ?? a.pnlPercentage))
      break
    case 'name':
      result.sort((a, b) => a.schemeName.localeCompare(b.schemeName))
      break
  }

  return result
})

// Summary calculations
const summary = computed(() => {
  const list = fundsList.value
  return {
    totalValue: list.reduce((acc, f) => acc + f.currentValue, 0),
    totalInvested: list.reduce((acc, f) => acc + f.investedValue, 0),
    totalPnl: list.reduce((acc, f) => acc + f.pnl, 0),
    totalSIP: list.reduce((acc, f) => acc + (f.sipAmount ?? 0), 0),
    fundCount: list.length
  }
})

const pnlPercentage = computed(() =>
  summary.value.totalInvested > 0
    ? (summary.value.totalPnl / summary.value.totalInvested) * 100
    : 0
)

// Actions
const handleSaveFund = async (data: Partial<Investment>) => {
  await createInvestment.mutateAsync({ ...data, type: 'mutual_fund' } as any)
  showAddDialog.value = false
  editingFund.value = null
}

const handleEdit = (fund: MutualFund) => {
  editingFund.value = fund
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
      subtitle="Mutual Fund Holdings"
      icon="mdi-chart-line"
      :tabs="tabs"
    />

    <FamilyToggle class="mb-6" />

    <!-- Summary Cards -->
    <v-row class="mb-6">
      <v-col cols="12" md="3">
        <v-card class="pa-4">
          <div class="text-body-2 text-medium-emphasis">Total Value</div>
          <div class="text-h5 font-weight-bold">{{ formatINRCompact(summary.totalValue) }}</div>
          <div class="text-caption text-medium-emphasis">
            {{ summary.fundCount }} funds
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
          <div class="text-body-2 text-medium-emphasis">Monthly SIP</div>
          <div class="text-h5 font-weight-bold text-primary">
            {{ formatINR(summary.totalSIP) }}
          </div>
        </v-card>
      </v-col>
    </v-row>

    <!-- Toolbar -->
    <v-card variant="outlined" class="mb-6">
      <v-card-text class="d-flex gap-3 flex-wrap align-center">
        <v-btn color="primary" variant="flat" prepend-icon="mdi-plus" @click="showAddDialog = true">
          Add Mutual Fund
        </v-btn>
        <v-btn variant="outlined" prepend-icon="mdi-file-import">
          Import CAS
        </v-btn>

        <v-spacer />

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

        <v-select
          v-model="sortBy"
          :items="[
            { title: 'By Value', value: 'value' },
            { title: 'By Returns', value: 'returns' },
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
    <v-alert v-else-if="error" type="info" variant="tonal" class="mb-6">
      Showing demo data. Connect your broker to see real holdings.
    </v-alert>

    <!-- Mutual Fund Cards Grid -->
    <v-row v-if="filteredFunds.length > 0">
      <v-col
        v-for="fund in filteredFunds"
        :key="fund.id"
        cols="12"
        sm="6"
        md="4"
        lg="3"
      >
        <MutualFundCard
          :fund="fund"
          show-actions
          @edit="handleEdit"
          @delete="handleDelete"
        />
      </v-col>
    </v-row>

    <!-- Empty State -->
    <v-card v-else variant="outlined" class="pa-8 text-center">
      <v-icon icon="mdi-chart-areaspline" size="64" color="grey" class="mb-4" />
      <h3 class="text-h6 mb-2">No mutual funds found</h3>
      <p class="text-body-2 text-medium-emphasis mb-4">
        {{ searchQuery || categoryFilter ? 'Try different filters' : 'Add your first mutual fund or import from CAS' }}
      </p>
      <div class="d-flex gap-3 justify-center">
        <v-btn color="primary" variant="flat" prepend-icon="mdi-plus" @click="showAddDialog = true">
          Add Fund
        </v-btn>
        <v-btn variant="outlined" prepend-icon="mdi-file-import">
          Import CAS
        </v-btn>
      </div>
    </v-card>

    <!-- Add/Edit Fund Dialog -->
    <AssetForm
      v-model="showAddDialog"
      :asset="editingFund as any"
      :is-editing="!!editingFund"
      @save="handleSaveFund"
    />

    <!-- Delete Confirmation Dialog -->
    <v-dialog v-model="showDeleteConfirm" max-width="400">
      <v-card>
        <v-card-title class="d-flex align-center">
          <v-icon icon="mdi-alert" color="error" class="mr-2" />
          Delete Mutual Fund
        </v-card-title>
        <v-card-text>
          Are you sure you want to delete this mutual fund? This action cannot be undone.
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
