<script setup lang="ts">
import { ref } from 'vue'
import SectionHeader from '@/components/shared/SectionHeader.vue'
import FamilyToggle from '@/components/shared/FamilyToggle.vue'
import NPSCalculator from '@/components/investments/NPSCalculator.vue'
import {
  useNPS,
  useUpdateNPS,
  formatINRCompact,
  type NPSData
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
const { data: npsData, isLoading } = useNPS()
const updateNPS = useUpdateNPS()

// Mock data for demo
const mockNPSData: NPSData = {
  pranNumber: 'PRAN1234567890',
  tier1Balance: 580000,
  tier2Balance: 120000,
  totalContributions: 480000,
  totalReturns: 220000,
  assetAllocation: {
    equityE: 50,
    corporateBondC: 30,
    governmentBondG: 15,
    alternativeA: 5
  },
  pensionFundManager: 'SBI Pension Fund',
  investmentChoice: 'active',
  lastUpdated: '2024-12-20'
}

// Use mock data if API returns empty
const nps = ref(npsData.value ?? mockNPSData)

// Handlers
const handleNPSUpdate = async (data: Partial<NPSData>) => {
  await updateNPS.mutateAsync(data)
}
</script>

<template>
  <div>
    <SectionHeader
      title="Investments"
      subtitle="National Pension System"
      icon="mdi-chart-line"
      :tabs="tabs"
    />

    <FamilyToggle class="mb-6" />

    <!-- Summary Cards -->
    <v-row class="mb-6">
      <v-col cols="12" md="3">
        <v-card class="pa-4 text-center">
          <v-icon icon="mdi-account-cash" size="32" color="orange" class="mb-2" />
          <div class="text-body-2 text-medium-emphasis">Total NPS Corpus</div>
          <div class="text-h5 font-weight-bold">
            {{ formatINRCompact(mockNPSData.tier1Balance + (mockNPSData.tier2Balance ?? 0)) }}
          </div>
          <div class="text-caption text-success">
            +{{ formatINRCompact(mockNPSData.totalReturns) }} returns
          </div>
        </v-card>
      </v-col>
      <v-col cols="12" md="3">
        <v-card class="pa-4 text-center" color="orange" variant="tonal">
          <v-icon icon="mdi-numeric-1-circle" size="32" class="mb-2" />
          <div class="text-body-2 text-medium-emphasis">Tier I (Retirement)</div>
          <div class="text-h5 font-weight-bold">{{ formatINRCompact(mockNPSData.tier1Balance) }}</div>
          <div class="text-caption">Lock-in till 60</div>
        </v-card>
      </v-col>
      <v-col cols="12" md="3">
        <v-card class="pa-4 text-center" variant="outlined">
          <v-icon icon="mdi-numeric-2-circle" size="32" color="primary" class="mb-2" />
          <div class="text-body-2 text-medium-emphasis">Tier II (Flexible)</div>
          <div class="text-h5 font-weight-bold">{{ formatINRCompact(mockNPSData.tier2Balance ?? 0) }}</div>
          <div class="text-caption">No lock-in</div>
        </v-card>
      </v-col>
      <v-col cols="12" md="3">
        <v-card class="pa-4 text-center">
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
          PRAN: {{ mockNPSData.pranNumber }}
        </v-chip>
        <v-chip color="orange" variant="tonal">
          <v-icon icon="mdi-bank" class="mr-1" />
          {{ mockNPSData.pensionFundManager }}
        </v-chip>
        <v-chip :color="mockNPSData.investmentChoice === 'active' ? 'success' : 'info'" variant="tonal">
          <v-icon icon="mdi-tune" class="mr-1" />
          {{ mockNPSData.investmentChoice === 'active' ? 'Active Choice' : 'Auto Choice' }}
        </v-chip>
        <v-chip variant="outlined">
          <v-icon icon="mdi-calendar" class="mr-1" />
          Updated: {{ new Date(mockNPSData.lastUpdated).toLocaleDateString('en-IN') }}
        </v-chip>
      </v-card-text>
    </v-card>

    <!-- Loading State -->
    <template v-if="isLoading">
      <v-skeleton-loader type="card, card" />
    </template>

    <!-- NPS Calculator -->
    <template v-else>
      <NPSCalculator :nps-data="mockNPSData" @update="handleNPSUpdate" />
    </template>

    <!-- NPS Info Cards -->
    <v-row class="mt-6">
      <v-col cols="12" md="6">
        <v-card variant="outlined" class="h-100">
          <v-card-title class="text-subtitle-1">
            <v-icon icon="mdi-information" class="mr-2" />
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
  </div>
</template>
