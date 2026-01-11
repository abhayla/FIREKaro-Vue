<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import SectionHeader from '@/components/shared/SectionHeader.vue'
import CategoryPieChart from '@/components/expenses/CategoryPieChart.vue'
import MonthlyTrendChart from '@/components/expenses/MonthlyTrendChart.vue'
import {
  useExpenses,
  useBudgets,
  formatINR,
  getCurrentMonth,
} from '@/composables/useExpenses'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import * as XLSX from 'xlsx'

// Section-level tabs for expenses navigation
const expensesTabs = [
  { title: 'Overview', route: '/expenses' },
  { title: 'Track', route: '/expenses/track' },
  { title: 'Budgets', route: '/expenses/budgets' },
  { title: 'Categories', route: '/expenses/categories' },
  { title: 'Reports', route: '/expenses/reports' },
]

// Period type
type PeriodType = 'monthly' | 'quarterly' | 'yearly' | 'custom'
const selectedPeriod = ref<PeriodType>('monthly')

// Month navigation
const selectedMonth = ref(getCurrentMonth())

// Date range for custom period
const customStartDate = ref('')
const customEndDate = ref('')

// Fetch data
const { expenses, totalExpenses, expensesByCategory, isLoading } = useExpenses(selectedMonth)
const { currentBudget, budgetUsage } = useBudgets(selectedMonth)

// Navigate months
const goToPreviousMonth = () => {
  const [year, month] = selectedMonth.value.split('-').map(Number)
  const newDate = new Date(year, month - 2, 1)
  selectedMonth.value = `${newDate.getFullYear()}-${String(newDate.getMonth() + 1).padStart(2, '0')}`
}

const goToNextMonth = () => {
  const [year, month] = selectedMonth.value.split('-').map(Number)
  const newDate = new Date(year, month, 1)
  selectedMonth.value = `${newDate.getFullYear()}-${String(newDate.getMonth() + 1).padStart(2, '0')}`
}

const canGoNext = computed(() => {
  const [year, month] = selectedMonth.value.split('-').map(Number)
  const current = new Date(year, month - 1)
  const now = new Date()
  return current < new Date(now.getFullYear(), now.getMonth())
})

// Month name
const monthName = computed(() => {
  const [year, month] = selectedMonth.value.split('-').map(Number)
  return new Date(year, month - 1).toLocaleString('en-IN', { month: 'long', year: 'numeric' })
})

// Period display name
const periodName = computed(() => {
  switch (selectedPeriod.value) {
    case 'monthly':
      return monthName.value
    case 'quarterly':
      return `Q${Math.ceil(new Date().getMonth() / 3)} ${new Date().getFullYear()}`
    case 'yearly':
      return `FY ${new Date().getFullYear()}-${String(new Date().getFullYear() + 1).slice(-2)}`
    case 'custom':
      return customStartDate.value && customEndDate.value
        ? `${customStartDate.value} to ${customEndDate.value}`
        : 'Select dates'
    default:
      return ''
  }
})

// Top expenses
const topExpenses = computed(() => {
  if (!expenses.value) return []
  return [...expenses.value]
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 5)
})

// Payment method breakdown
const paymentMethodBreakdown = computed(() => {
  if (!expenses.value) return []
  const breakdown = expenses.value.reduce(
    (acc, expense) => {
      const method = expense.paymentMethod || 'Other'
      acc[method] = (acc[method] || 0) + expense.amount
      return acc
    },
    {} as Record<string, number>
  )
  return Object.entries(breakdown)
    .map(([method, amount]) => ({
      method,
      amount,
      percentage: totalExpenses.value ? (amount / totalExpenses.value) * 100 : 0,
    }))
    .sort((a, b) => b.amount - a.amount)
})

// Payment method icon
const getPaymentMethodIcon = (method: string) => {
  const icons: Record<string, string> = {
    UPI: 'mdi-cellphone-nfc',
    'Credit Card': 'mdi-credit-card',
    'Debit Card': 'mdi-credit-card-outline',
    Cash: 'mdi-cash',
    'Net Banking': 'mdi-bank',
    Wallet: 'mdi-wallet',
    Other: 'mdi-dots-horizontal',
  }
  return icons[method] || 'mdi-cash'
}

// Mock trend data
const trendData = computed(() => {
  const months = []
  const now = new Date()

  for (let i = 5; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const monthStr = date.toLocaleString('en-IN', { month: 'short' })

    const total = Math.floor(Math.random() * 50000) + 30000
    months.push({
      month: monthStr,
      total,
      needs: Math.floor(total * 0.5),
      wants: Math.floor(total * 0.3),
      savings: Math.floor(total * 0.2),
    })
  }

  return months
})

// Trend stats
const trendStats = computed(() => {
  if (trendData.value.length < 2) return { avg: 0, trend: 0 }
  const avg = trendData.value.reduce((sum, m) => sum + m.total, 0) / trendData.value.length
  const lastTwo = trendData.value.slice(-2)
  const trend = lastTwo[0].total > 0 ? ((lastTwo[1].total - lastTwo[0].total) / lastTwo[0].total) * 100 : 0
  return { avg, trend }
})

// Export functions
const downloadFile = (content: string, filename: string, mimeType: string) => {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

const exportToPDF = () => {
  if (!expenses.value) return

  const doc = new jsPDF()
  const pageWidth = doc.internal.pageSize.getWidth()

  doc.setFontSize(20)
  doc.setTextColor(33, 33, 33)
  doc.text('Expense Report', pageWidth / 2, 20, { align: 'center' })

  doc.setFontSize(12)
  doc.setTextColor(100, 100, 100)
  doc.text(periodName.value, pageWidth / 2, 28, { align: 'center' })

  doc.setFontSize(14)
  doc.setTextColor(33, 33, 33)
  doc.text('Summary', 14, 40)

  doc.setFontSize(10)
  doc.setTextColor(60, 60, 60)
  const summaryY = 48
  doc.text(`Total Expenses: ${formatINR(totalExpenses.value)}`, 14, summaryY)
  doc.text(`Number of Transactions: ${expenses.value.length}`, 14, summaryY + 6)
  doc.text(
    `Average Transaction: ${formatINR(expenses.value.length ? totalExpenses.value / expenses.value.length : 0)}`,
    14,
    summaryY + 12
  )

  if (currentBudget.value) {
    doc.text(`Budget Usage: ${budgetUsage.value?.total.toFixed(0) || 0}%`, 14, summaryY + 18)
  }

  doc.setFontSize(14)
  doc.setTextColor(33, 33, 33)
  doc.text('Spending by Category', 14, summaryY + 32)

  const categoryData = Object.entries(expensesByCategory.value).map(([category, amount]) => [
    category,
    formatINR(amount as number),
    `${(((amount as number) / totalExpenses.value) * 100).toFixed(1)}%`,
  ])

  autoTable(doc, {
    startY: summaryY + 38,
    head: [['Category', 'Amount', '% of Total']],
    body: categoryData,
    theme: 'striped',
    headStyles: { fillColor: [66, 66, 66] },
    margin: { left: 14 },
  })

  const finalY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY || summaryY + 80
  doc.setFontSize(14)
  doc.setTextColor(33, 33, 33)
  doc.text('Expense Details', 14, finalY + 10)

  const expenseData = expenses.value.map((e) => [
    new Date(e.date).toLocaleDateString('en-IN'),
    e.description,
    e.category,
    e.merchant || '-',
    formatINR(e.amount),
  ])

  autoTable(doc, {
    startY: finalY + 16,
    head: [['Date', 'Description', 'Category', 'Merchant', 'Amount']],
    body: expenseData,
    theme: 'striped',
    headStyles: { fillColor: [66, 66, 66] },
    margin: { left: 14 },
    columnStyles: {
      0: { cellWidth: 25 },
      1: { cellWidth: 50 },
      2: { cellWidth: 35 },
      3: { cellWidth: 35 },
      4: { cellWidth: 30 },
    },
  })

  const pageCount = doc.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.setFontSize(8)
    doc.setTextColor(150, 150, 150)
    doc.text(
      `Generated by FIREKaro on ${new Date().toLocaleDateString('en-IN')} | Page ${i} of ${pageCount}`,
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: 'center' }
    )
  }

  doc.save(`expense-report-${selectedMonth.value}.pdf`)
}

const exportToExcel = () => {
  if (!expenses.value) return

  const summaryData = [
    ['FIREKaro Expense Report'],
    [periodName.value],
    [''],
    ['Summary'],
    ['Total Expenses', totalExpenses.value],
    ['Number of Transactions', expenses.value.length],
    ['Average Transaction', expenses.value.length ? totalExpenses.value / expenses.value.length : 0],
    ['Budget Usage (%)', budgetUsage.value?.total || 0],
    [''],
    ['Category Breakdown'],
    ['Category', 'Amount', '% of Total'],
    ...Object.entries(expensesByCategory.value).map(([category, amount]) => [
      category,
      amount,
      ((amount as number) / totalExpenses.value) * 100,
    ]),
  ]

  const expenseHeaders = ['Date', 'Description', 'Category', 'Subcategory', 'Merchant', 'Amount', 'Payment Method', 'Tags']
  const expenseData = expenses.value.map((e) => [
    new Date(e.date).toLocaleDateString('en-IN'),
    e.description,
    e.category,
    e.subcategory || '',
    e.merchant || '',
    e.amount,
    e.paymentMethod || '',
    e.tags?.join(', ') || '',
  ])

  const wb = XLSX.utils.book_new()

  const summarySheet = XLSX.utils.aoa_to_sheet(summaryData)
  summarySheet['!cols'] = [{ wch: 25 }, { wch: 15 }, { wch: 15 }]
  XLSX.utils.book_append_sheet(wb, summarySheet, 'Summary')

  const expensesSheet = XLSX.utils.aoa_to_sheet([expenseHeaders, ...expenseData])
  expensesSheet['!cols'] = [
    { wch: 12 },
    { wch: 40 },
    { wch: 20 },
    { wch: 20 },
    { wch: 20 },
    { wch: 12 },
    { wch: 15 },
    { wch: 20 },
  ]
  XLSX.utils.book_append_sheet(wb, expensesSheet, 'Expenses')

  XLSX.writeFile(wb, `expense-report-${selectedMonth.value}.xlsx`)
}

const exportToCSV = () => {
  if (!expenses.value) return

  const headers = ['Date', 'Description', 'Category', 'Amount', 'Merchant', 'Payment Method']
  const rows = expenses.value.map((e) => [
    e.date,
    e.description,
    e.category,
    e.amount.toString(),
    e.merchant || '',
    e.paymentMethod || '',
  ])

  const csvContent = [headers, ...rows].map((row) => row.join(',')).join('\n')
  downloadFile(csvContent, `expenses-${selectedMonth.value}.csv`, 'text/csv')
}

const exportToJSON = () => {
  if (!expenses.value) return
  const jsonContent = JSON.stringify(expenses.value, null, 2)
  downloadFile(jsonContent, `expenses-${selectedMonth.value}.json`, 'application/json')
}
</script>

<template>
  <div>
    <SectionHeader
      title="Expenses"
      subtitle="Track and manage your spending"
      icon="mdi-cart-outline"
      :tabs="expensesTabs"
    />

    <!-- Period Selector + Month Navigator -->
    <v-card class="mb-6" variant="outlined">
      <v-card-text class="d-flex align-center justify-space-between flex-wrap ga-3">
        <!-- Period Type -->
        <v-btn-toggle v-model="selectedPeriod" mandatory density="compact" color="primary">
          <v-btn value="monthly">Monthly</v-btn>
          <v-btn value="quarterly">Quarterly</v-btn>
          <v-btn value="yearly">Yearly</v-btn>
          <v-btn value="custom">Custom</v-btn>
        </v-btn-toggle>

        <!-- Month Navigator (for monthly view) -->
        <div v-if="selectedPeriod === 'monthly'" class="d-flex align-center ga-2">
          <v-btn icon="mdi-chevron-left" variant="text" size="small" @click="goToPreviousMonth" />
          <v-chip color="primary" variant="tonal">
            <v-icon icon="mdi-calendar" class="mr-1" />
            {{ monthName }}
          </v-chip>
          <v-btn icon="mdi-chevron-right" variant="text" size="small" :disabled="!canGoNext" @click="goToNextMonth" />
        </div>

        <!-- Export Button -->
        <v-menu>
          <template #activator="{ props: menuProps }">
            <v-btn variant="outlined" v-bind="menuProps">
              <v-icon icon="mdi-download" class="mr-1" />
              Export
            </v-btn>
          </template>
          <v-list density="compact">
            <v-list-item @click="exportToPDF">
              <template #prepend>
                <v-icon icon="mdi-file-pdf-box" color="error" />
              </template>
              <v-list-item-title>Export as PDF</v-list-item-title>
            </v-list-item>
            <v-list-item @click="exportToExcel">
              <template #prepend>
                <v-icon icon="mdi-microsoft-excel" color="success" />
              </template>
              <v-list-item-title>Export as Excel</v-list-item-title>
            </v-list-item>
            <v-divider />
            <v-list-item @click="exportToCSV">
              <template #prepend>
                <v-icon icon="mdi-file-delimited" />
              </template>
              <v-list-item-title>Export as CSV</v-list-item-title>
            </v-list-item>
            <v-list-item @click="exportToJSON">
              <template #prepend>
                <v-icon icon="mdi-code-json" />
              </template>
              <v-list-item-title>Export as JSON</v-list-item-title>
            </v-list-item>
          </v-list>
        </v-menu>
      </v-card-text>
    </v-card>

    <!-- Loading State -->
    <div v-if="isLoading" class="text-center py-8">
      <v-progress-circular indeterminate color="primary" size="48" />
      <p class="mt-4 text-medium-emphasis">Loading report data...</p>
    </div>

    <template v-else>
      <!-- Report Title Card -->
      <v-card class="mb-6" variant="tonal" color="primary">
        <v-card-text class="d-flex align-center">
          <v-icon icon="mdi-file-document" size="24" class="mr-3" />
          <span class="text-body-1 font-weight-medium">Expense Report - {{ periodName }}</span>
        </v-card-text>
      </v-card>

      <!-- Summary Cards -->
      <v-row class="mb-6">
        <v-col cols="12" sm="6" md="3">
          <v-card variant="outlined">
            <v-card-text class="text-center">
              <div class="text-body-2 text-medium-emphasis">Total Expenses</div>
              <div class="text-h5 font-weight-bold text-error mt-1">
                {{ formatINR(totalExpenses) }}
              </div>
            </v-card-text>
          </v-card>
        </v-col>
        <v-col cols="12" sm="6" md="3">
          <v-card variant="outlined">
            <v-card-text class="text-center">
              <div class="text-body-2 text-medium-emphasis">Transactions</div>
              <div class="text-h5 font-weight-bold mt-1">
                {{ expenses?.length || 0 }}
              </div>
            </v-card-text>
          </v-card>
        </v-col>
        <v-col cols="12" sm="6" md="3">
          <v-card variant="outlined">
            <v-card-text class="text-center">
              <div class="text-body-2 text-medium-emphasis">Avg. Transaction</div>
              <div class="text-h5 font-weight-bold mt-1">
                {{ formatINR(expenses?.length ? totalExpenses / expenses.length : 0) }}
              </div>
            </v-card-text>
          </v-card>
        </v-col>
        <v-col cols="12" sm="6" md="3">
          <v-card variant="outlined">
            <v-card-text class="text-center">
              <div class="text-body-2 text-medium-emphasis">Budget Usage</div>
              <div class="text-h5 font-weight-bold mt-1" :class="budgetUsage && budgetUsage.total > 100 ? 'text-error' : 'text-success'">
                {{ budgetUsage?.total.toFixed(0) || '--' }}%
              </div>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <!-- Charts Row -->
      <v-row class="mb-6">
        <!-- Category Breakdown -->
        <v-col cols="12" md="6">
          <CategoryPieChart :data="expensesByCategory" title="Spending by Category" />
        </v-col>

        <!-- Monthly Trend -->
        <v-col cols="12" md="6">
          <v-card>
            <v-card-title class="d-flex align-center justify-space-between">
              <span>
                <v-icon icon="mdi-chart-line" class="mr-2" />
                6-Month Trend
              </span>
              <div class="d-flex ga-4">
                <div class="text-right">
                  <div class="text-caption text-medium-emphasis">Monthly Avg</div>
                  <div class="text-body-2 font-weight-bold">{{ formatINR(trendStats.avg) }}</div>
                </div>
                <div class="text-right">
                  <div class="text-caption text-medium-emphasis">Trend</div>
                  <div
                    class="text-body-2 font-weight-bold"
                    :class="trendStats.trend >= 0 ? 'text-error' : 'text-success'"
                  >
                    <v-icon :icon="trendStats.trend >= 0 ? 'mdi-trending-up' : 'mdi-trending-down'" size="16" />
                    {{ Math.abs(trendStats.trend).toFixed(1) }}%
                  </div>
                </div>
              </div>
            </v-card-title>
            <v-card-text>
              <MonthlyTrendChart :data="trendData" show-breakdown />
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <!-- Top Expenses & Payment Methods -->
      <v-row class="mb-6">
        <!-- Top Expenses -->
        <v-col cols="12" md="6">
          <v-card>
            <v-card-title>
              <v-icon icon="mdi-trending-up" class="mr-2" />
              Top Expenses
            </v-card-title>
            <v-card-text v-if="topExpenses.length === 0" class="text-center pa-8">
              <v-icon icon="mdi-receipt-text-outline" size="48" color="grey" />
              <p class="text-medium-emphasis mt-2">No expenses this period</p>
            </v-card-text>
            <v-list v-else lines="two" density="compact">
              <v-list-item v-for="(expense, index) in topExpenses" :key="expense.id">
                <template #prepend>
                  <v-avatar color="primary" variant="tonal" size="32">
                    <span class="text-body-2 font-weight-bold">{{ index + 1 }}</span>
                  </v-avatar>
                </template>
                <v-list-item-title>{{ expense.description }}</v-list-item-title>
                <v-list-item-subtitle>
                  {{ expense.category }} &bull; {{ new Date(expense.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) }}
                </v-list-item-subtitle>
                <template #append>
                  <span class="text-body-2 font-weight-bold text-error">
                    {{ formatINR(expense.amount) }}
                  </span>
                </template>
              </v-list-item>
            </v-list>
          </v-card>
        </v-col>

        <!-- Payment Methods -->
        <v-col cols="12" md="6">
          <v-card>
            <v-card-title>
              <v-icon icon="mdi-credit-card-multiple" class="mr-2" />
              Payment Methods
            </v-card-title>
            <v-card-text v-if="paymentMethodBreakdown.length === 0" class="text-center pa-8">
              <v-icon icon="mdi-credit-card-off" size="48" color="grey" />
              <p class="text-medium-emphasis mt-2">No expenses this period</p>
            </v-card-text>
            <v-list v-else lines="two" density="compact">
              <v-list-item v-for="item in paymentMethodBreakdown" :key="item.method">
                <template #prepend>
                  <v-avatar color="primary" variant="tonal" size="32">
                    <v-icon :icon="getPaymentMethodIcon(item.method)" size="18" />
                  </v-avatar>
                </template>
                <v-list-item-title>{{ item.method }}</v-list-item-title>
                <v-list-item-subtitle>
                  {{ item.percentage.toFixed(0) }}% of total
                </v-list-item-subtitle>
                <template #append>
                  <span class="text-body-2 font-weight-bold">
                    {{ formatINR(item.amount) }}
                  </span>
                </template>
              </v-list-item>
            </v-list>
          </v-card>
        </v-col>
      </v-row>
    </template>
  </div>
</template>
