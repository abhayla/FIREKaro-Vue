<script setup lang="ts">
import { ref, computed } from 'vue'
import { Bar, Doughnut } from 'vue-chartjs'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js'
import SectionHeader from '@/components/shared/SectionHeader.vue'
import FamilyToggle from '@/components/shared/FamilyToggle.vue'
import {
  useLoans,
  useCreditCards,
  formatINR,
  formatINRCompact,
  getLoanTypeLabel,
  type Loan,
  type CreditCard
} from '@/composables/useLiabilities'

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
)

const tabs = [
  { title: 'Overview', route: '/dashboard/liabilities' },
  { title: 'Loans', route: '/dashboard/liabilities/loans' },
  { title: 'Credit Cards', route: '/dashboard/liabilities/credit-cards' },
  { title: 'Debt Payoff', route: '/dashboard/liabilities/debt-payoff' },
  { title: 'Reports', route: '/dashboard/liabilities/reports' },
]

// Data fetching
const { data: loans, isLoading: loansLoading } = useLoans()
const { data: creditCards, isLoading: cardsLoading } = useCreditCards()

// Mock data
const mockLoans: Loan[] = [
  {
    id: '1', userId: 'user1', loanType: 'home', lenderName: 'HDFC Bank',
    principalAmount: 5000000, outstandingPrincipal: 3200000, interestRate: 8.5,
    tenure: 240, emiAmount: 43391, emiDate: 5, startDate: '2020-06-01', endDate: '2040-05-31',
    totalInterestPaid: 850000, totalPrincipalPaid: 1800000, prepaymentsMade: 200000, isActive: true,
    section80C: 150000, section24: 200000
  },
  {
    id: '2', userId: 'user1', loanType: 'car', lenderName: 'ICICI Bank',
    principalAmount: 800000, outstandingPrincipal: 450000, interestRate: 9.5,
    tenure: 60, emiAmount: 16765, emiDate: 15, startDate: '2022-03-01', endDate: '2027-02-28',
    totalInterestPaid: 120000, totalPrincipalPaid: 350000, prepaymentsMade: 0, isActive: true
  },
  {
    id: '3', userId: 'user1', loanType: 'personal', lenderName: 'Axis Bank',
    principalAmount: 300000, outstandingPrincipal: 180000, interestRate: 14,
    tenure: 36, emiAmount: 10248, emiDate: 10, startDate: '2024-01-01', endDate: '2027-01-01',
    totalInterestPaid: 48000, totalPrincipalPaid: 120000, prepaymentsMade: 0, isActive: true
  }
]

const mockCreditCards: CreditCard[] = [
  {
    id: '1', userId: 'user1', cardName: 'HDFC Regalia', bankName: 'HDFC Bank',
    cardNumber: '****5678', cardType: 'VISA', creditLimit: 500000, availableLimit: 175000,
    currentOutstanding: 325000, utilizationPercent: 65, billingCycleDate: 15, paymentDueDate: 5,
    rewardPointsBalance: 12500, interestRateAPR: 42, annualFee: 2500, isActive: true,
    minimumDue: 16250, nextDueDate: '2026-02-05'
  },
  {
    id: '2', userId: 'user1', cardName: 'SBI SimplyCLICK', bankName: 'SBI Card',
    cardNumber: '****1234', cardType: 'MASTERCARD', creditLimit: 300000, availableLimit: 220000,
    currentOutstanding: 80000, utilizationPercent: 27, billingCycleDate: 20, paymentDueDate: 10,
    rewardPointsBalance: 5200, interestRateAPR: 39.6, annualFee: 499, isActive: true,
    minimumDue: 4000, nextDueDate: '2026-02-10'
  }
]

// Use mock data
const loansList = computed(() => loans.value?.length ? loans.value : mockLoans)
const cardsList = computed(() => creditCards.value?.length ? creditCards.value : mockCreditCards)

// Report type selection
const reportType = ref<'summary' | 'payments' | 'interest' | 'tax'>('summary')

// Date range
const dateRange = ref({
  start: new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0],
  end: new Date().toISOString().split('T')[0]
})

// Summary calculations
const summary = computed(() => {
  const totalLoanDebt = loansList.value.reduce((sum, l) => sum + l.outstandingPrincipal, 0)
  const totalCCDebt = cardsList.value.reduce((sum, c) => sum + c.currentOutstanding, 0)
  const totalPrincipalPaid = loansList.value.reduce((sum, l) => sum + l.totalPrincipalPaid, 0)
  const totalInterestPaid = loansList.value.reduce((sum, l) => sum + l.totalInterestPaid, 0)
  const totalEMI = loansList.value.reduce((sum, l) => sum + l.emiAmount, 0)
  const totalMinDue = cardsList.value.reduce((sum, c) => sum + c.minimumDue, 0)

  return {
    totalDebt: totalLoanDebt + totalCCDebt,
    totalLoanDebt,
    totalCCDebt,
    totalPrincipalPaid,
    totalInterestPaid,
    monthlyPayment: totalEMI + totalMinDue,
    yearlyPayment: (totalEMI + totalMinDue) * 12
  }
})

// Tax benefits calculation
const taxBenefits = computed(() => {
  let section80C = 0
  let section24 = 0
  let section80E = 0

  loansList.value.forEach(loan => {
    if (loan.section80C) section80C += loan.section80C
    if (loan.section24) section24 += loan.section24
    if (loan.section80E) section80E += loan.section80E
  })

  return {
    section80C: Math.min(section80C, 150000),
    section24: Math.min(section24, 200000),
    section80E,
    total: Math.min(section80C, 150000) + Math.min(section24, 200000) + section80E
  }
})

// Debt breakdown chart data
const debtBreakdownData = computed(() => ({
  labels: [
    ...loansList.value.map(l => getLoanTypeLabel(l.loanType)),
    ...cardsList.value.map(c => c.cardName)
  ],
  datasets: [{
    data: [
      ...loansList.value.map(l => l.outstandingPrincipal),
      ...cardsList.value.map(c => c.currentOutstanding)
    ],
    backgroundColor: [
      '#2196f3', '#4caf50', '#ff9800', '#f44336',
      '#9c27b0', '#00bcd4', '#795548', '#607d8b'
    ]
  }]
}))

// Monthly payment distribution
const paymentDistributionData = computed(() => ({
  labels: loansList.value.map(l => l.lenderName.split(' ')[0]),
  datasets: [
    {
      label: 'Principal',
      data: loansList.value.map(l => Math.round(l.emiAmount * 0.4)),
      backgroundColor: '#4caf50'
    },
    {
      label: 'Interest',
      data: loansList.value.map(l => Math.round(l.emiAmount * 0.6)),
      backgroundColor: '#ff9800'
    }
  ]
}))

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'bottom' as const
    }
  }
}

const barChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'top' as const
    }
  },
  scales: {
    x: {
      stacked: true
    },
    y: {
      stacked: true,
      ticks: {
        callback: (value: any) => formatINRCompact(value)
      }
    }
  }
}

// Loading state
const isLoading = computed(() => loansLoading.value || cardsLoading.value)

// Export handlers
const handleExport = (format: 'pdf' | 'excel' | 'csv') => {
  if (format === 'pdf') {
    window.print()
    return
  }

  // Generate CSV data based on report type
  let headers: string[] = []
  let rows: (string | number)[][] = []

  if (reportType.value === 'summary') {
    headers = ['Loan', 'Type', 'Original Amount', 'Outstanding', 'Interest Rate', 'EMI', 'Principal Paid', 'Interest Paid']
    rows = loansList.value.map(l => [
      l.lenderName,
      getLoanTypeLabel(l.loanType),
      l.principalAmount,
      l.outstandingPrincipal,
      l.interestRate,
      l.emiAmount,
      l.totalPrincipalPaid,
      l.totalInterestPaid
    ])
  } else if (reportType.value === 'payments') {
    headers = ['Date', 'Description', 'Amount', 'Status']
    // Mock payment history data
    rows = [
      ['Jan 5, 2026', 'HDFC Bank Home Loan EMI', 43391, 'Paid'],
      ['Jan 10, 2026', 'Axis Bank Personal Loan EMI', 10248, 'Paid'],
      ['Jan 15, 2026', 'ICICI Bank Car Loan EMI', 16765, 'Pending']
    ]
  } else if (reportType.value === 'interest') {
    headers = ['Loan', 'Interest Rate %', 'Total Interest Paid', 'Monthly Interest (Est.)']
    rows = loansList.value.map(l => [
      l.lenderName,
      l.interestRate,
      l.totalInterestPaid,
      Math.round(l.emiAmount * 0.6)
    ])
  } else if (reportType.value === 'tax') {
    headers = ['Deduction Section', 'Amount Claimed', 'Limit']
    rows = [
      ['Section 80C (Home Loan Principal)', taxBenefits.value.section80C, 150000],
      ['Section 24(b) (Home Loan Interest)', taxBenefits.value.section24, 200000],
      ['Section 80E (Education Loan Interest)', taxBenefits.value.section80E, 'No Limit']
    ]
  }

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell =>
      typeof cell === 'string' && cell.includes(',') ? `"${cell}"` : cell
    ).join(','))
  ].join('\n')

  const blob = new Blob([csvContent], { type: format === 'csv' ? 'text/csv' : 'application/vnd.ms-excel' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `debt-${reportType.value}-report-${new Date().toISOString().split('T')[0]}.${format === 'csv' ? 'csv' : 'xls'}`
  a.click()
  URL.revokeObjectURL(url)
}
</script>

<template>
  <div>
    <SectionHeader
      title="Liabilities"
      subtitle="Debt Reports"
      icon="mdi-credit-card-outline"
      :tabs="tabs"
    />

    <FamilyToggle class="mb-6" />

    <!-- Report Type Tabs -->
    <v-card variant="outlined" class="mb-6">
      <v-tabs v-model="reportType" color="primary">
        <v-tab value="summary">
          <v-icon icon="mdi-file-document" class="mr-2" />
          Debt Summary
        </v-tab>
        <v-tab value="payments">
          <v-icon icon="mdi-calendar-check" class="mr-2" />
          Payment History
        </v-tab>
        <v-tab value="interest">
          <v-icon icon="mdi-percent" class="mr-2" />
          Interest Analysis
        </v-tab>
        <v-tab value="tax">
          <v-icon icon="mdi-calculator" class="mr-2" />
          Tax Benefits
        </v-tab>
      </v-tabs>
    </v-card>

    <!-- Loading State -->
    <template v-if="isLoading">
      <v-row>
        <v-col cols="12">
          <v-skeleton-loader type="card, card" />
        </v-col>
      </v-row>
    </template>

    <template v-else>
      <!-- Debt Summary Report -->
      <v-window v-model="reportType">
        <v-window-item value="summary">
          <v-row>
            <!-- Summary Stats -->
            <v-col cols="12" md="4">
              <v-card variant="outlined" class="h-100">
                <v-card-title>Debt Overview</v-card-title>
                <v-card-text>
                  <v-list density="compact">
                    <v-list-item>
                      <v-list-item-title>Total Outstanding Debt</v-list-item-title>
                      <template #append>
                        <span class="font-weight-bold text-error">{{ formatINRCompact(summary.totalDebt) }}</span>
                      </template>
                    </v-list-item>
                    <v-list-item>
                      <v-list-item-title>Loan Outstanding</v-list-item-title>
                      <template #append>
                        <span class="font-weight-bold">{{ formatINRCompact(summary.totalLoanDebt) }}</span>
                      </template>
                    </v-list-item>
                    <v-list-item>
                      <v-list-item-title>Credit Card Outstanding</v-list-item-title>
                      <template #append>
                        <span class="font-weight-bold">{{ formatINRCompact(summary.totalCCDebt) }}</span>
                      </template>
                    </v-list-item>
                    <v-divider class="my-2" />
                    <v-list-item>
                      <v-list-item-title>Monthly Payment</v-list-item-title>
                      <template #append>
                        <span class="font-weight-bold text-primary">{{ formatINR(summary.monthlyPayment) }}</span>
                      </template>
                    </v-list-item>
                    <v-list-item>
                      <v-list-item-title>Yearly Payment</v-list-item-title>
                      <template #append>
                        <span class="font-weight-bold">{{ formatINRCompact(summary.yearlyPayment) }}</span>
                      </template>
                    </v-list-item>
                    <v-divider class="my-2" />
                    <v-list-item>
                      <v-list-item-title class="text-success">Principal Paid (Total)</v-list-item-title>
                      <template #append>
                        <span class="font-weight-bold text-success">{{ formatINRCompact(summary.totalPrincipalPaid) }}</span>
                      </template>
                    </v-list-item>
                    <v-list-item>
                      <v-list-item-title class="text-warning">Interest Paid (Total)</v-list-item-title>
                      <template #append>
                        <span class="font-weight-bold text-warning">{{ formatINRCompact(summary.totalInterestPaid) }}</span>
                      </template>
                    </v-list-item>
                  </v-list>
                </v-card-text>
              </v-card>
            </v-col>

            <!-- Debt Breakdown Chart -->
            <v-col cols="12" md="8">
              <v-card variant="outlined" class="h-100">
                <v-card-title>Debt Breakdown by Type</v-card-title>
                <v-card-text>
                  <div style="height: 300px">
                    <Doughnut :data="debtBreakdownData" :options="chartOptions" />
                  </div>
                </v-card-text>
              </v-card>
            </v-col>
          </v-row>

          <!-- Detailed Loan List -->
          <v-card variant="outlined" class="mt-6">
            <v-card-title>Loan Details</v-card-title>
            <v-card-text>
              <v-table density="compact">
                <thead>
                  <tr>
                    <th>Loan</th>
                    <th class="text-right">Original Amount</th>
                    <th class="text-right">Outstanding</th>
                    <th class="text-right">Rate</th>
                    <th class="text-right">EMI</th>
                    <th class="text-right">Paid (P)</th>
                    <th class="text-right">Paid (I)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="loan in loansList" :key="loan.id">
                    <td>
                      <div class="font-weight-medium">{{ loan.lenderName }}</div>
                      <div class="text-caption text-medium-emphasis">{{ getLoanTypeLabel(loan.loanType) }}</div>
                    </td>
                    <td class="text-right">{{ formatINRCompact(loan.principalAmount) }}</td>
                    <td class="text-right font-weight-bold text-error">{{ formatINRCompact(loan.outstandingPrincipal) }}</td>
                    <td class="text-right">{{ loan.interestRate }}%</td>
                    <td class="text-right">{{ formatINR(loan.emiAmount) }}</td>
                    <td class="text-right text-success">{{ formatINRCompact(loan.totalPrincipalPaid) }}</td>
                    <td class="text-right text-warning">{{ formatINRCompact(loan.totalInterestPaid) }}</td>
                  </tr>
                </tbody>
              </v-table>
            </v-card-text>
          </v-card>
        </v-window-item>

        <!-- Payment History -->
        <v-window-item value="payments">
          <v-card variant="outlined">
            <v-card-title class="d-flex align-center">
              Payment History
              <v-spacer />
              <v-text-field
                v-model="dateRange.start"
                label="From"
                type="date"
                variant="outlined"
                density="compact"
                hide-details
                style="max-width: 150px"
                class="mr-2"
              />
              <v-text-field
                v-model="dateRange.end"
                label="To"
                type="date"
                variant="outlined"
                density="compact"
                hide-details
                style="max-width: 150px"
              />
            </v-card-title>
            <v-card-text>
              <v-alert type="info" variant="tonal" class="mb-4">
                Payment history shows all EMI and credit card payments made during the selected period.
              </v-alert>

              <!-- Mock payment history -->
              <v-table density="compact">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Description</th>
                    <th class="text-right">Amount</th>
                    <th class="text-center">Status</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Jan 5, 2026</td>
                    <td>HDFC Bank Home Loan EMI</td>
                    <td class="text-right">{{ formatINR(43391) }}</td>
                    <td class="text-center"><v-chip color="success" size="x-small">Paid</v-chip></td>
                  </tr>
                  <tr>
                    <td>Jan 10, 2026</td>
                    <td>Axis Bank Personal Loan EMI</td>
                    <td class="text-right">{{ formatINR(10248) }}</td>
                    <td class="text-center"><v-chip color="success" size="x-small">Paid</v-chip></td>
                  </tr>
                  <tr>
                    <td>Jan 15, 2026</td>
                    <td>ICICI Bank Car Loan EMI</td>
                    <td class="text-right">{{ formatINR(16765) }}</td>
                    <td class="text-center"><v-chip color="warning" size="x-small">Pending</v-chip></td>
                  </tr>
                  <tr>
                    <td>Dec 5, 2025</td>
                    <td>HDFC Bank Home Loan EMI</td>
                    <td class="text-right">{{ formatINR(43391) }}</td>
                    <td class="text-center"><v-chip color="success" size="x-small">Paid</v-chip></td>
                  </tr>
                </tbody>
              </v-table>
            </v-card-text>
          </v-card>
        </v-window-item>

        <!-- Interest Analysis -->
        <v-window-item value="interest">
          <v-row>
            <v-col cols="12" md="6">
              <v-card variant="outlined" class="h-100">
                <v-card-title>Interest Paid by Loan</v-card-title>
                <v-card-text>
                  <v-list>
                    <v-list-item v-for="loan in loansList" :key="loan.id">
                      <v-list-item-title>{{ loan.lenderName }}</v-list-item-title>
                      <v-list-item-subtitle>
                        Rate: {{ loan.interestRate }}% | Total Interest: {{ formatINRCompact(loan.totalInterestPaid) }}
                      </v-list-item-subtitle>
                      <template #append>
                        <div class="text-right">
                          <div class="text-warning font-weight-bold">{{ formatINR(Math.round(loan.emiAmount * 0.6)) }}</div>
                          <div class="text-caption">per month</div>
                        </div>
                      </template>
                    </v-list-item>
                  </v-list>
                </v-card-text>
              </v-card>
            </v-col>
            <v-col cols="12" md="6">
              <v-card variant="outlined" class="h-100">
                <v-card-title>EMI Breakdown</v-card-title>
                <v-card-text>
                  <div style="height: 300px">
                    <Bar :data="paymentDistributionData" :options="barChartOptions" />
                  </div>
                </v-card-text>
              </v-card>
            </v-col>
          </v-row>

          <v-card variant="outlined" class="mt-6">
            <v-card-title>Interest Cost Analysis</v-card-title>
            <v-card-text>
              <v-row>
                <v-col cols="12" md="4">
                  <v-card color="warning" variant="tonal" class="pa-4 text-center">
                    <div class="text-h4 font-weight-bold">{{ formatINRCompact(summary.totalInterestPaid) }}</div>
                    <div class="text-body-2">Total Interest Paid (Till Date)</div>
                  </v-card>
                </v-col>
                <v-col cols="12" md="4">
                  <v-card color="error" variant="tonal" class="pa-4 text-center">
                    <div class="text-h4 font-weight-bold">~{{ formatINRCompact(summary.totalInterestPaid * 2.5) }}</div>
                    <div class="text-body-2">Estimated Total Interest (Lifetime)</div>
                  </v-card>
                </v-col>
                <v-col cols="12" md="4">
                  <v-card color="success" variant="tonal" class="pa-4 text-center">
                    <div class="text-h4 font-weight-bold">{{ formatINRCompact(50000 * 12) }}</div>
                    <div class="text-body-2">Potential Savings with Prepayment</div>
                  </v-card>
                </v-col>
              </v-row>
            </v-card-text>
          </v-card>
        </v-window-item>

        <!-- Tax Benefits -->
        <v-window-item value="tax">
          <v-card variant="outlined">
            <v-card-title>Tax Benefits from Loans (FY 2025-26)</v-card-title>
            <v-card-text>
              <v-row>
                <v-col cols="12" md="4">
                  <v-card color="primary" variant="tonal" class="pa-4">
                    <div class="d-flex align-center mb-2">
                      <v-icon icon="mdi-home" class="mr-2" />
                      <span class="text-subtitle-2">Section 80C</span>
                    </div>
                    <div class="text-h5 font-weight-bold">{{ formatINR(taxBenefits.section80C) }}</div>
                    <div class="text-caption">Home loan principal (max ₹1.5L)</div>
                  </v-card>
                </v-col>
                <v-col cols="12" md="4">
                  <v-card color="success" variant="tonal" class="pa-4">
                    <div class="d-flex align-center mb-2">
                      <v-icon icon="mdi-percent" class="mr-2" />
                      <span class="text-subtitle-2">Section 24(b)</span>
                    </div>
                    <div class="text-h5 font-weight-bold">{{ formatINR(taxBenefits.section24) }}</div>
                    <div class="text-caption">Home loan interest (max ₹2L)</div>
                  </v-card>
                </v-col>
                <v-col cols="12" md="4">
                  <v-card color="teal" variant="tonal" class="pa-4">
                    <div class="d-flex align-center mb-2">
                      <v-icon icon="mdi-school" class="mr-2" />
                      <span class="text-subtitle-2">Section 80E</span>
                    </div>
                    <div class="text-h5 font-weight-bold">{{ formatINR(taxBenefits.section80E) }}</div>
                    <div class="text-caption">Education loan interest (no limit)</div>
                  </v-card>
                </v-col>
              </v-row>

              <v-alert color="success" variant="tonal" class="mt-6">
                <div class="d-flex justify-space-between align-center">
                  <div>
                    <div class="text-subtitle-1 font-weight-bold">Total Tax Deductions Available</div>
                    <div class="text-body-2">Claim these deductions while filing ITR</div>
                  </div>
                  <div class="text-h4 font-weight-bold">{{ formatINR(taxBenefits.total) }}</div>
                </div>
              </v-alert>

              <v-table density="compact" class="mt-4">
                <thead>
                  <tr>
                    <th>Loan</th>
                    <th>Section</th>
                    <th class="text-right">Claimed</th>
                    <th class="text-right">Limit</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="loan in loansList.filter(l => l.section80C || l.section24 || l.section80E)" :key="loan.id">
                    <td>{{ loan.lenderName }}</td>
                    <td>
                      <v-chip v-if="loan.section80C" size="x-small" color="primary" class="mr-1">80C</v-chip>
                      <v-chip v-if="loan.section24" size="x-small" color="success" class="mr-1">24(b)</v-chip>
                      <v-chip v-if="loan.section80E" size="x-small" color="teal">80E</v-chip>
                    </td>
                    <td class="text-right">{{ formatINR((loan.section80C || 0) + (loan.section24 || 0) + (loan.section80E || 0)) }}</td>
                    <td class="text-right text-medium-emphasis">
                      {{ loan.section80C ? '₹1.5L' : '' }}
                      {{ loan.section24 ? '₹2L' : '' }}
                      {{ loan.section80E ? 'No limit' : '' }}
                    </td>
                  </tr>
                </tbody>
              </v-table>
            </v-card-text>
          </v-card>
        </v-window-item>
      </v-window>

      <!-- Export Options -->
      <v-card variant="outlined" class="mt-6">
        <v-card-text class="d-flex gap-3 flex-wrap align-center">
          <span class="text-body-2 text-medium-emphasis">Export Report:</span>
          <v-btn variant="outlined" prepend-icon="mdi-file-pdf-box" @click="handleExport('pdf')">
            PDF
          </v-btn>
          <v-btn variant="outlined" prepend-icon="mdi-file-excel" @click="handleExport('excel')">
            Excel
          </v-btn>
          <v-btn variant="outlined" prepend-icon="mdi-file-delimited" @click="handleExport('csv')">
            CSV
          </v-btn>
        </v-card-text>
      </v-card>
    </template>
  </div>
</template>
