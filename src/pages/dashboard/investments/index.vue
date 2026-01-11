<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import SectionHeader from '@/components/shared/SectionHeader.vue'
import PortfolioAllocationChart from '@/components/investments/PortfolioAllocationChart.vue'
import AssetForm from '@/components/investments/AssetForm.vue'
import {
  usePortfolio,
  useInvestments,
  useCreateInvestment,
  useYieldCalculations,
  formatINR,
  formatINRCompact,
  formatPercentage,
  type Investment
} from '@/composables/useInvestments'

const router = useRouter()

const tabs = [
  { title: 'Portfolio', route: '/dashboard/investments' },
  { title: 'Stocks', route: '/dashboard/investments/stocks' },
  { title: 'Mutual Funds', route: '/dashboard/investments/mutual-funds' },
  { title: 'EPF', route: '/dashboard/investments/epf' },
  { title: 'PPF', route: '/dashboard/investments/ppf' },
  { title: 'NPS', route: '/dashboard/investments/nps' },
  { title: 'ESOPs', route: '/dashboard/investments/esop' },
  { title: 'Property', route: '/dashboard/investments/property' },
  { title: 'Reports', route: '/dashboard/investments/reports' },
]

// Data fetching
const { data: portfolio, isLoading: portfolioLoading, error: portfolioError } = usePortfolio()
const { data: investments, isLoading: investmentsLoading } = useInvestments()
const { data: yields } = useYieldCalculations()
const createInvestment = useCreateInvestment()

// Add investment dialog
const showAddDialog = ref(false)

// Feature dialogs
const showCASDialog = ref(false)
const showBrokerDialog = ref(false)

const handleSaveInvestment = async (data: Partial<Investment>) => {
  await createInvestment.mutateAsync(data as any)
  showAddDialog.value = false
}

// Default portfolio data for loading/error states
const defaultPortfolio = {
  totalValue: 0,
  totalInvested: 0,
  totalReturns: 0,
  returnsPercentage: 0,
  xirr: 0,
  allocation: { equity: 40, debt: 30, gold: 10, realEstate: 15, cash: 5 },
  categoryBreakdown: {
    stocks: { value: 0, invested: 0, count: 0 },
    mutualFunds: { value: 0, invested: 0, count: 0 },
    fixedDeposits: { value: 0, invested: 0, count: 0 },
    bonds: { value: 0, invested: 0, count: 0 },
    gold: { value: 0, invested: 0, count: 0 },
    realEstate: { value: 0, invested: 0, count: 0 },
  }
}

const portfolioData = computed(() => portfolio.value ?? defaultPortfolio)

// Category cards configuration
const categoryCards = computed(() => [
  {
    title: 'Stocks & ETFs',
    value: portfolioData.value.categoryBreakdown.stocks.value,
    invested: portfolioData.value.categoryBreakdown.stocks.invested,
    count: portfolioData.value.categoryBreakdown.stocks.count,
    icon: 'mdi-chart-line',
    color: 'success',
    route: '/dashboard/investments/stocks'
  },
  {
    title: 'Mutual Funds',
    value: portfolioData.value.categoryBreakdown.mutualFunds.value,
    invested: portfolioData.value.categoryBreakdown.mutualFunds.invested,
    count: portfolioData.value.categoryBreakdown.mutualFunds.count,
    icon: 'mdi-chart-areaspline',
    color: 'primary',
    route: '/dashboard/investments/mutual-funds'
  },
  {
    title: 'Fixed Deposits',
    value: portfolioData.value.categoryBreakdown.fixedDeposits.value,
    invested: portfolioData.value.categoryBreakdown.fixedDeposits.invested,
    count: portfolioData.value.categoryBreakdown.fixedDeposits.count,
    icon: 'mdi-bank',
    color: 'info',
    route: '/dashboard/investments'
  },
  {
    title: 'Gold',
    value: portfolioData.value.categoryBreakdown.gold.value,
    invested: portfolioData.value.categoryBreakdown.gold.invested,
    count: portfolioData.value.categoryBreakdown.gold.count,
    icon: 'mdi-gold',
    color: 'warning',
    route: '/dashboard/investments'
  },
  {
    title: 'Real Estate',
    value: portfolioData.value.categoryBreakdown.realEstate.value,
    invested: portfolioData.value.categoryBreakdown.realEstate.invested,
    count: portfolioData.value.categoryBreakdown.realEstate.count,
    icon: 'mdi-home-city',
    color: 'purple',
    route: '/dashboard/investments/property'
  },
])

// Top holdings
const topHoldings = computed(() => {
  if (!investments.value) return []
  return [...investments.value]
    .sort((a, b) => b.currentValue - a.currentValue)
    .slice(0, 5)
})

const isLoading = computed(() => portfolioLoading.value || investmentsLoading.value)
</script>

<template>
  <div>
    <SectionHeader
      title="Investments"
      subtitle="Track your investment portfolio"
      icon="mdi-chart-line"
      :tabs="tabs"
    />

    <!-- Loading State -->
    <template v-if="isLoading">
      <v-row>
        <v-col v-for="n in 4" :key="n" cols="12" md="3">
          <v-skeleton-loader type="card" />
        </v-col>
      </v-row>
    </template>

    <!-- Error State -->
    <v-alert v-else-if="portfolioError" type="error" variant="tonal" class="mb-6">
      Failed to load portfolio data. Please try again.
    </v-alert>

    <!-- Main Content -->
    <template v-else>
      <!-- Summary Cards -->
      <v-row class="mb-6">
        <v-col cols="12" md="3">
          <v-card class="pa-4 h-100">
            <div class="d-flex align-center mb-2">
              <v-icon icon="mdi-wallet" color="primary" class="mr-2" />
              <span class="text-body-2 text-medium-emphasis">Total Portfolio</span>
            </div>
            <div class="text-h5 font-weight-bold">
              {{ formatINRCompact(portfolioData.totalValue) }}
            </div>
            <div class="text-caption text-medium-emphasis">
              Invested: {{ formatINRCompact(portfolioData.totalInvested) }}
            </div>
          </v-card>
        </v-col>
        <v-col cols="12" md="3">
          <v-card class="pa-4 h-100">
            <div class="d-flex align-center mb-2">
              <v-icon
                :icon="portfolioData.totalReturns >= 0 ? 'mdi-trending-up' : 'mdi-trending-down'"
                :color="portfolioData.totalReturns >= 0 ? 'success' : 'error'"
                class="mr-2"
              />
              <span class="text-body-2 text-medium-emphasis">Total Returns</span>
            </div>
            <div
              class="text-h5 font-weight-bold"
              :class="portfolioData.totalReturns >= 0 ? 'text-success' : 'text-error'"
            >
              {{ formatINRCompact(portfolioData.totalReturns) }}
            </div>
            <div
              class="text-caption"
              :class="portfolioData.totalReturns >= 0 ? 'text-success' : 'text-error'"
            >
              {{ formatPercentage(portfolioData.returnsPercentage) }}
            </div>
          </v-card>
        </v-col>
        <v-col cols="12" md="3">
          <v-card class="pa-4 h-100">
            <div class="d-flex align-center mb-2">
              <v-icon icon="mdi-chart-timeline-variant" color="info" class="mr-2" />
              <span class="text-body-2 text-medium-emphasis">XIRR</span>
            </div>
            <div class="text-h5 font-weight-bold">
              {{ portfolioData.xirr ? formatPercentage(portfolioData.xirr) : 'N/A' }}
            </div>
            <div class="text-caption text-medium-emphasis">Annualized Returns</div>
          </v-card>
        </v-col>
        <v-col cols="12" md="3">
          <v-card class="pa-4 h-100">
            <div class="d-flex align-center mb-2">
              <v-icon icon="mdi-pie-chart" color="warning" class="mr-2" />
              <span class="text-body-2 text-medium-emphasis">Equity %</span>
            </div>
            <div class="text-h5 font-weight-bold">
              {{ (portfolioData.allocation?.equity ?? 0).toFixed(1) }}%
            </div>
            <div class="text-caption text-medium-emphasis">
              Debt: {{ (portfolioData.allocation?.debt ?? 0).toFixed(1) }}%
            </div>
          </v-card>
        </v-col>
      </v-row>

      <!-- Yield Summary Card -->
      <v-card v-if="yields" variant="outlined" class="mb-6">
        <v-card-text class="d-flex flex-wrap ga-6 align-center">
          <div class="d-flex align-center">
            <v-icon icon="mdi-cash-multiple" color="success" class="mr-3" size="32" />
            <div>
              <div class="text-body-2 text-medium-emphasis">Dividend Yield</div>
              <div class="d-flex align-center">
                <span class="text-h6 font-weight-bold">{{ (yields?.dividendYield ?? 0).toFixed(2) }}%</span>
                <span class="text-caption text-medium-emphasis ml-2">
                  ({{ formatINRCompact(yields?.totalAnnualDividends ?? 0) }}/year)
                </span>
              </div>
            </div>
          </div>
          <v-divider vertical class="mx-2 d-none d-md-block" />
          <div class="d-flex align-center">
            <v-icon icon="mdi-home-city" color="purple" class="mr-3" size="32" />
            <div>
              <div class="text-body-2 text-medium-emphasis">Rental Yield</div>
              <div class="d-flex align-center">
                <span class="text-h6 font-weight-bold">{{ (yields?.rentalYield ?? 0).toFixed(2) }}%</span>
                <span class="text-caption text-medium-emphasis ml-2">
                  ({{ formatINRCompact(yields?.totalAnnualRent ?? 0) }}/year)
                </span>
              </div>
            </div>
          </div>
          <v-spacer />
          <v-chip
            v-if="(yields?.dividendYield ?? 0) > 0 || (yields?.rentalYield ?? 0) > 0"
            color="success"
            variant="tonal"
          >
            <v-icon icon="mdi-leaf" size="small" class="mr-1" />
            Passive Income: {{ formatINRCompact((yields?.totalAnnualDividends ?? 0) + (yields?.totalAnnualRent ?? 0)) }}/year
          </v-chip>
        </v-card-text>
      </v-card>

      <!-- Quick Actions -->
      <v-card variant="outlined" class="mb-6">
        <v-card-text class="d-flex gap-3 flex-wrap">
          <v-btn color="primary" variant="flat" prepend-icon="mdi-plus" @click="showAddDialog = true">
            Add Investment
          </v-btn>
          <v-btn variant="outlined" prepend-icon="mdi-file-import" @click="showCASDialog = true">
            Import CAS
          </v-btn>
          <v-btn variant="outlined" prepend-icon="mdi-sync" @click="showBrokerDialog = true">
            Sync Broker
          </v-btn>
          <v-btn variant="outlined" prepend-icon="mdi-scale-balance" :to="'/dashboard/investments/reports'">
            Rebalance Check
          </v-btn>
        </v-card-text>
      </v-card>

      <v-row>
        <!-- Asset Allocation Chart -->
        <v-col cols="12" md="5">
          <v-card class="h-100">
            <v-card-title class="text-subtitle-1">Asset Allocation</v-card-title>
            <v-card-text>
              <PortfolioAllocationChart
                :allocation="portfolioData.allocation"
                :total-value="portfolioData.totalValue"
                :height="280"
              />
            </v-card-text>
          </v-card>
        </v-col>

        <!-- Top Holdings -->
        <v-col cols="12" md="7">
          <v-card class="h-100">
            <v-card-title class="d-flex align-center justify-space-between">
              <span class="text-subtitle-1">Top Holdings</span>
              <v-btn variant="text" size="small" color="primary">View All</v-btn>
            </v-card-title>
            <v-card-text>
              <v-list v-if="topHoldings.length > 0" density="compact">
                <v-list-item
                  v-for="(holding, index) in topHoldings"
                  :key="holding.id"
                  class="px-0"
                >
                  <template #prepend>
                    <v-avatar color="primary" size="32" class="mr-3">
                      <span class="text-caption font-weight-bold">{{ index + 1 }}</span>
                    </v-avatar>
                  </template>

                  <v-list-item-title class="text-body-2 font-weight-medium">
                    {{ holding.name }}
                  </v-list-item-title>
                  <v-list-item-subtitle class="text-caption">
                    {{ holding.type.replace('_', ' ').toUpperCase() }}
                  </v-list-item-subtitle>

                  <template #append>
                    <div class="text-right">
                      <div class="text-body-2 font-weight-medium">
                        {{ formatINRCompact(holding.currentValue) }}
                      </div>
                      <div
                        class="text-caption"
                        :class="holding.currentValue >= holding.investedAmount ? 'text-success' : 'text-error'"
                      >
                        {{ formatPercentage(holding.investedAmount > 0 ? ((holding.currentValue - holding.investedAmount) / holding.investedAmount) * 100 : 0) }}
                      </div>
                    </div>
                  </template>
                </v-list-item>
              </v-list>

              <v-alert v-else type="info" variant="tonal" density="compact">
                No investments found. Add your first investment to get started.
              </v-alert>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <!-- Category Breakdown -->
      <v-row class="mt-4">
        <v-col cols="12">
          <h3 class="text-subtitle-1 font-weight-medium mb-3">Category Breakdown</h3>
        </v-col>
        <v-col
          v-for="category in categoryCards"
          :key="category.title"
          cols="12"
          sm="6"
          md="4"
          lg="2.4"
        >
          <v-card
            variant="outlined"
            class="category-card h-100"
            @click="router.push(category.route)"
          >
            <v-card-text class="text-center">
              <v-avatar :color="category.color" size="48" class="mb-3">
                <v-icon :icon="category.icon" color="white" />
              </v-avatar>
              <div class="text-body-2 font-weight-medium">{{ category.title }}</div>
              <div class="text-h6 font-weight-bold mt-1">
                {{ formatINRCompact(category.value) }}
              </div>
              <div
                v-if="category.invested > 0"
                class="text-caption"
                :class="category.value >= category.invested ? 'text-success' : 'text-error'"
              >
                {{ formatPercentage(category.invested > 0 ? ((category.value - category.invested) / category.invested) * 100 : 0) }}
              </div>
              <v-chip v-if="category.count > 0" size="x-small" class="mt-2" variant="tonal">
                {{ category.count }} holdings
              </v-chip>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <!-- Retirement Funds Quick View -->
      <v-row class="mt-4">
        <v-col cols="12">
          <v-card>
            <v-card-title class="d-flex align-center justify-space-between">
              <span class="text-subtitle-1">Retirement Funds</span>
              <v-btn variant="text" size="small" color="primary" :to="'/dashboard/investments/epf'">
                View Details
              </v-btn>
            </v-card-title>
            <v-card-text>
              <v-row>
                <v-col cols="12" md="4">
                  <v-card color="teal" variant="tonal" class="pa-4 text-center">
                    <v-icon icon="mdi-briefcase" size="32" class="mb-2" />
                    <div class="text-body-2 font-weight-medium">EPF</div>
                    <div class="text-h6 font-weight-bold">₹0</div>
                    <div class="text-caption text-medium-emphasis">8.25% interest</div>
                  </v-card>
                </v-col>
                <v-col cols="12" md="4">
                  <v-card color="teal" variant="tonal" class="pa-4 text-center">
                    <v-icon icon="mdi-piggy-bank" size="32" class="mb-2" />
                    <div class="text-body-2 font-weight-medium">PPF</div>
                    <div class="text-h6 font-weight-bold">₹0</div>
                    <div class="text-caption text-medium-emphasis">7.1% interest (EEE)</div>
                  </v-card>
                </v-col>
                <v-col cols="12" md="4">
                  <v-card color="orange" variant="tonal" class="pa-4 text-center" @click="router.push('/dashboard/investments/nps')">
                    <v-icon icon="mdi-account-cash" size="32" class="mb-2" />
                    <div class="text-body-2 font-weight-medium">NPS</div>
                    <div class="text-h6 font-weight-bold">₹0</div>
                    <div class="text-caption text-medium-emphasis">Market-linked</div>
                  </v-card>
                </v-col>
              </v-row>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </template>

    <!-- Add Investment Dialog -->
    <AssetForm
      v-model="showAddDialog"
      @save="handleSaveInvestment"
    />

    <!-- Import CAS Dialog -->
    <v-dialog v-model="showCASDialog" max-width="500">
      <v-card>
        <v-card-title class="d-flex align-center">
          <v-icon icon="mdi-file-import" color="primary" class="mr-2" />
          Import CAS Statement
        </v-card-title>
        <v-card-text>
          <v-alert type="info" variant="tonal" class="mb-4">
            <strong>Consolidated Account Statement (CAS)</strong> is a single document containing
            details of all your mutual fund investments across all AMCs.
          </v-alert>

          <div class="text-body-2 mb-4">
            <p class="mb-2"><strong>How to get your CAS:</strong></p>
            <ol class="pl-4">
              <li>Visit <strong>CAMS</strong> (CAMSOnline.com) or <strong>KFintech</strong> (KFintech.com)</li>
              <li>Request a detailed CAS with transaction history</li>
              <li>Download the password-protected PDF</li>
            </ol>
          </div>

          <v-alert type="warning" variant="tonal" density="compact">
            <v-icon icon="mdi-clock-outline" class="mr-1" />
            <strong>Coming Soon!</strong> CAS import feature is under development.
            We'll notify you when it's ready.
          </v-alert>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="showCASDialog = false">Close</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Sync Broker Dialog -->
    <v-dialog v-model="showBrokerDialog" max-width="500">
      <v-card>
        <v-card-title class="d-flex align-center">
          <v-icon icon="mdi-sync" color="success" class="mr-2" />
          Sync Broker Account
        </v-card-title>
        <v-card-text>
          <v-alert type="info" variant="tonal" class="mb-4">
            Connect your broker account to automatically import your stock and ETF holdings.
          </v-alert>

          <div class="text-body-2 mb-4">
            <p class="mb-2"><strong>Supported Brokers (Coming Soon):</strong></p>
            <v-row dense>
              <v-col cols="6">
                <v-chip variant="outlined" class="ma-1">
                  <v-icon icon="mdi-check-circle" color="grey" class="mr-1" size="small" />
                  Zerodha
                </v-chip>
              </v-col>
              <v-col cols="6">
                <v-chip variant="outlined" class="ma-1">
                  <v-icon icon="mdi-check-circle" color="grey" class="mr-1" size="small" />
                  Groww
                </v-chip>
              </v-col>
              <v-col cols="6">
                <v-chip variant="outlined" class="ma-1">
                  <v-icon icon="mdi-check-circle" color="grey" class="mr-1" size="small" />
                  Upstox
                </v-chip>
              </v-col>
              <v-col cols="6">
                <v-chip variant="outlined" class="ma-1">
                  <v-icon icon="mdi-check-circle" color="grey" class="mr-1" size="small" />
                  Angel One
                </v-chip>
              </v-col>
            </v-row>
          </div>

          <v-alert type="warning" variant="tonal" density="compact">
            <v-icon icon="mdi-clock-outline" class="mr-1" />
            <strong>Coming Soon!</strong> Broker sync feature is under development.
            We'll notify you when it's ready.
          </v-alert>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="showBrokerDialog = false">Close</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<style scoped>
.category-card {
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
}

.category-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
}
</style>
