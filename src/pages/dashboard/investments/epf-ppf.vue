<script setup lang="ts">
import { ref } from 'vue'
import SectionHeader from '@/components/shared/SectionHeader.vue'
import FamilyToggle from '@/components/shared/FamilyToggle.vue'
import EPFCalculator from '@/components/investments/EPFCalculator.vue'
import PPFTracker from '@/components/investments/PPFTracker.vue'
import {
  useEPF,
  usePPF,
  useUpdateEPF,
  useUpdatePPF,
  formatINRCompact,
  type EPFData,
  type PPFData
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
const { data: epfData, isLoading: epfLoading } = useEPF()
const { data: ppfData, isLoading: ppfLoading } = usePPF()
const updateEPF = useUpdateEPF()
const updatePPF = useUpdatePPF()

// Active tab
const activeTab = ref('epf')

// Mock data for demo
const mockEPFData: EPFData = {
  uan: '100123456789',
  establishmentCode: 'MHBAN0012345',
  currentBalance: 1250000,
  employeeShare: 750000,
  employerShare: 500000,
  pensionFund: 180000,
  lastUpdated: '2024-12-15',
  monthlyContribution: {
    basic: 120000,
    employee: 14400,
    employerEPF: 10800,
    employerEPS: 3600,
    vpf: 5000
  }
}

const mockPPFData: PPFData = {
  accountNumber: 'PPF123456789',
  accountHolderName: 'John Doe',
  bankOrPostOffice: 'SBI',
  openingDate: '2018-04-01',
  maturityDate: '2033-03-31',
  currentBalance: 850000,
  totalDeposits: 720000,
  totalInterestEarned: 130000,
  currentFYDeposits: 100000,
  currentFY: '2024-25',
  hasActiveLoan: false,
  loanAmount: 0,
  isExtended: false
}

// Use mock data if API returns empty
const epf = ref(epfData.value ?? mockEPFData)
const ppf = ref(ppfData.value ?? mockPPFData)

// Handlers
const handleEPFUpdate = async (data: Partial<EPFData>) => {
  await updateEPF.mutateAsync(data)
}

const handlePPFUpdate = async (data: Partial<PPFData>) => {
  await updatePPF.mutateAsync(data)
}

const handlePPFDeposit = async (amount: number) => {
  // In real app, this would call API
  console.log('PPF Deposit:', amount)
}

// Summary
const totalRetirement = ref(2100000) // EPF + PPF
</script>

<template>
  <div>
    <SectionHeader
      title="Investments"
      subtitle="EPF & PPF Accounts"
      icon="mdi-chart-line"
      :tabs="tabs"
    />

    <FamilyToggle class="mb-6" />

    <!-- Summary Cards -->
    <v-row class="mb-6">
      <v-col cols="12" md="3">
        <v-card class="pa-4 text-center">
          <v-icon icon="mdi-piggy-bank" size="32" color="teal" class="mb-2" />
          <div class="text-body-2 text-medium-emphasis">Total Retirement</div>
          <div class="text-h5 font-weight-bold">{{ formatINRCompact(totalRetirement) }}</div>
          <div class="text-caption text-medium-emphasis">EPF + PPF</div>
        </v-card>
      </v-col>
      <v-col cols="12" md="3">
        <v-card
          class="pa-4 text-center cursor-pointer"
          :variant="activeTab === 'epf' ? 'elevated' : 'outlined'"
          @click="activeTab = 'epf'"
        >
          <v-icon icon="mdi-briefcase" size="32" color="teal" class="mb-2" />
          <div class="text-body-2 text-medium-emphasis">EPF Balance</div>
          <div class="text-h5 font-weight-bold">{{ formatINRCompact(mockEPFData.currentBalance) }}</div>
          <div class="text-caption text-success">8.25% interest</div>
        </v-card>
      </v-col>
      <v-col cols="12" md="3">
        <v-card
          class="pa-4 text-center cursor-pointer"
          :variant="activeTab === 'ppf' ? 'elevated' : 'outlined'"
          @click="activeTab = 'ppf'"
        >
          <v-icon icon="mdi-bank" size="32" color="teal" class="mb-2" />
          <div class="text-body-2 text-medium-emphasis">PPF Balance</div>
          <div class="text-h5 font-weight-bold">{{ formatINRCompact(mockPPFData.currentBalance) }}</div>
          <div class="text-caption text-success">7.1% interest (EEE)</div>
        </v-card>
      </v-col>
      <v-col cols="12" md="3">
        <v-card class="pa-4 text-center">
          <v-icon icon="mdi-shield-check" size="32" color="success" class="mb-2" />
          <div class="text-body-2 text-medium-emphasis">Section 80C</div>
          <div class="text-h5 font-weight-bold">₹1.5L</div>
          <div class="text-caption text-medium-emphasis">Max deduction limit</div>
        </v-card>
      </v-col>
    </v-row>

    <!-- Tab Selection -->
    <v-tabs v-model="activeTab" color="teal" class="mb-6">
      <v-tab value="epf">
        <v-icon icon="mdi-briefcase" class="mr-2" />
        EPF / VPF
      </v-tab>
      <v-tab value="ppf">
        <v-icon icon="mdi-bank" class="mr-2" />
        PPF
      </v-tab>
    </v-tabs>

    <!-- Loading State -->
    <template v-if="epfLoading || ppfLoading">
      <v-skeleton-loader type="card, card" />
    </template>

    <!-- Tab Content -->
    <template v-else>
      <v-window v-model="activeTab">
        <v-window-item value="epf">
          <EPFCalculator :epf-data="mockEPFData" @update="handleEPFUpdate" />
        </v-window-item>

        <v-window-item value="ppf">
          <PPFTracker
            :ppf-data="mockPPFData"
            @update="handlePPFUpdate"
            @deposit="handlePPFDeposit"
          />
        </v-window-item>
      </v-window>
    </template>

    <!-- Tax Benefits Info -->
    <v-card variant="outlined" class="mt-6">
      <v-card-title class="text-subtitle-1">
        <v-icon icon="mdi-information" class="mr-2" />
        Tax Benefits Summary
      </v-card-title>
      <v-card-text>
        <v-row>
          <v-col cols="12" md="4">
            <v-card color="teal" variant="tonal" class="pa-3">
              <div class="text-subtitle-2 font-weight-bold">Section 80C</div>
              <div class="text-body-2 mt-2">
                <div class="d-flex justify-space-between">
                  <span>EPF Employee Share</span>
                  <span>₹{{ (mockEPFData.monthlyContribution.employee * 12).toLocaleString('en-IN') }}</span>
                </div>
                <div class="d-flex justify-space-between mt-1">
                  <span>VPF</span>
                  <span>₹{{ (mockEPFData.monthlyContribution.vpf * 12).toLocaleString('en-IN') }}</span>
                </div>
                <div class="d-flex justify-space-between mt-1">
                  <span>PPF</span>
                  <span>₹{{ mockPPFData.currentFYDeposits.toLocaleString('en-IN') }}</span>
                </div>
                <v-divider class="my-2" />
                <div class="d-flex justify-space-between font-weight-bold">
                  <span>Total</span>
                  <span>₹{{ ((mockEPFData.monthlyContribution.employee * 12) + (mockEPFData.monthlyContribution.vpf * 12) + mockPPFData.currentFYDeposits).toLocaleString('en-IN') }}</span>
                </div>
              </div>
            </v-card>
          </v-col>
          <v-col cols="12" md="4">
            <v-alert type="success" variant="tonal" density="compact" class="h-100">
              <div class="text-subtitle-2 font-weight-bold mb-2">EPF Benefits</div>
              <ul class="text-body-2 pl-4">
                <li>Tax-free interest (up to ₹2.5L contribution)</li>
                <li>Employer contribution is additional benefit</li>
                <li>EPS provides pension after retirement</li>
                <li>Partial withdrawal allowed for specific needs</li>
              </ul>
            </v-alert>
          </v-col>
          <v-col cols="12" md="4">
            <v-alert type="success" variant="tonal" density="compact" class="h-100">
              <div class="text-subtitle-2 font-weight-bold mb-2">PPF Benefits (EEE)</div>
              <ul class="text-body-2 pl-4">
                <li>Contribution: Tax deductible under 80C</li>
                <li>Interest: Tax-free</li>
                <li>Maturity: Completely tax-free</li>
                <li>Loan facility from Year 3-6</li>
              </ul>
            </v-alert>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>
  </div>
</template>

<style scoped>
.cursor-pointer {
  cursor: pointer;
}
</style>
