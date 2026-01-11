<script setup lang="ts">
import { ref, computed } from 'vue'
import CategoryPieChart from '@/components/expenses/CategoryPieChart.vue'
import MonthlyTrendChart from '@/components/expenses/MonthlyTrendChart.vue'
import {
  useExpenses,
  useBudgets,
  formatINR,
  type Expense,
} from '@/composables/useExpenses'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import * as XLSX from 'xlsx'

const props = defineProps<{
  selectedMonth: string
}>()

const emit = defineEmits<{
  (e: 'go-to-details'): void
}>()

// Fetch data
const { expenses, totalExpenses, expensesByCategory, isLoading } = useExpenses(
  computed(() => props.selectedMonth)
)
const { currentBudget, budgetUsage } = useBudgets(computed(() => props.selectedMonth))

// Month name
const monthName = computed(() => {
  const [year, month] = props.selectedMonth.split('-').map(Number)
  return new Date(year, month - 1).toLocaleString('en-IN', { month: 'long', year: 'numeric' })
})

// Mock trend data (in real app, would fetch from API)
const trendData = computed(() => {
  const months = []
  const now = new Date()

  for (let i = 5; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const monthStr = date.toLocaleString('en-IN', { month: 'short' })

    // Generate mock data (in real app, this would come from API)
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

// Top expenses
const topExpenses = computed(() => {
  if (!expenses.value) return []
  return [...expenses.value]
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 5)
})

// Recent expenses
const recentExpenses = computed(() => {
  if (!expenses.value) return []
  return [...expenses.value]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5)
})

// Payment method breakdown
const paymentMethodBreakdown = computed(() => {
  if (!expenses.value) return {}
  return expenses.value.reduce(
    (acc, expense) => {
      const method = expense.paymentMethod || 'Other'
      acc[method] = (acc[method] || 0) + expense.amount
      return acc
    },
    {} as Record<string, number>
  )
})

// Export functions
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
  downloadFile(csvContent, `expenses-${props.selectedMonth}.csv`, 'text/csv')
}

const exportToJSON = () => {
  if (!expenses.value) return
  const jsonContent = JSON.stringify(expenses.value, null, 2)
  downloadFile(jsonContent, `expenses-${props.selectedMonth}.json`, 'application/json')
}

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

// Export to PDF
const exportToPDF = () => {
  if (!expenses.value) return

  const doc = new jsPDF()
  const pageWidth = doc.internal.pageSize.getWidth()

  // Title
  doc.setFontSize(20)
  doc.setTextColor(33, 33, 33)
  doc.text('Expense Report', pageWidth / 2, 20, { align: 'center' })

  // Subtitle
  doc.setFontSize(12)
  doc.setTextColor(100, 100, 100)
  doc.text(monthName.value, pageWidth / 2, 28, { align: 'center' })

  // Summary section
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

  // Category breakdown
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

  // Expense details
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

  // Footer
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

  doc.save(`expense-report-${props.selectedMonth}.pdf`)
}

// Export to Excel
const exportToExcel = () => {
  if (!expenses.value) return

  // Summary sheet data
  const summaryData = [
    ['FIREKaro Expense Report'],
    [monthName.value],
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

  // Expense details sheet data
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

  // Create workbook
  const wb = XLSX.utils.book_new()

  // Summary sheet
  const summarySheet = XLSX.utils.aoa_to_sheet(summaryData)
  summarySheet['!cols'] = [{ wch: 25 }, { wch: 15 }, { wch: 15 }]
  XLSX.utils.book_append_sheet(wb, summarySheet, 'Summary')

  // Expenses sheet
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

  // Budget sheet (if budget exists)
  if (currentBudget.value) {
    const budget = currentBudget.value
    const budgetData = [
      ['Budget Analysis'],
      [monthName.value],
      [''],
      ['Category', 'Budget', 'Actual', 'Remaining', 'Usage %'],
      [
        'Needs (50%)',
        budget.needsLimit,
        budget.needsActual,
        budget.needsLimit - budget.needsActual,
        budget.needsLimit > 0 ? (budget.needsActual / budget.needsLimit) * 100 : 0,
      ],
      [
        'Wants (30%)',
        budget.wantsLimit,
        budget.wantsActual,
        budget.wantsLimit - budget.wantsActual,
        budget.wantsLimit > 0 ? (budget.wantsActual / budget.wantsLimit) * 100 : 0,
      ],
      [
        'Savings (20%)',
        budget.savingsLimit,
        budget.savingsActual,
        budget.savingsLimit - budget.savingsActual,
        budget.savingsLimit > 0 ? (budget.savingsActual / budget.savingsLimit) * 100 : 0,
      ],
      [''],
      ['Total Income', budget.income],
      ['Total Spent', budget.needsActual + budget.wantsActual + budget.savingsActual],
      ['Remaining', budget.income - (budget.needsActual + budget.wantsActual + budget.savingsActual)],
    ]
    const budgetSheet = XLSX.utils.aoa_to_sheet(budgetData)
    budgetSheet['!cols'] = [{ wch: 15 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 12 }]
    XLSX.utils.book_append_sheet(wb, budgetSheet, 'Budget')
  }

  // Save file
  XLSX.writeFile(wb, `expense-report-${props.selectedMonth}.xlsx`)
}

// Print report
const printReport = () => {
  window.print()
}
</script>

<template>
  <div>
    <!-- Loading State -->
    <div v-if="isLoading" class="text-center py-8">
      <v-progress-circular indeterminate color="primary" size="48" />
      <p class="mt-4 text-medium-emphasis">Loading expense data...</p>
    </div>

    <template v-else>
      <!-- Summary Cards -->
      <v-row class="mb-6">
        <v-col cols="12" sm="6" md="3">
          <v-card variant="outlined">
            <v-card-text class="text-center">
              <v-icon icon="mdi-cash-minus" size="32" color="error" class="mb-2" />
              <div class="text-body-2 text-medium-emphasis">Total Expenses</div>
              <div class="text-h5 font-weight-bold text-error">
                {{ formatINR(totalExpenses) }}
              </div>
            </v-card-text>
          </v-card>
        </v-col>
        <v-col cols="12" sm="6" md="3">
          <v-card variant="outlined">
            <v-card-text class="text-center">
              <v-icon icon="mdi-receipt-text-outline" size="32" color="primary" class="mb-2" />
              <div class="text-body-2 text-medium-emphasis">Transactions</div>
              <div class="text-h5 font-weight-bold">
                {{ expenses?.length || 0 }}
              </div>
            </v-card-text>
          </v-card>
        </v-col>
        <v-col cols="12" sm="6" md="3">
          <v-card variant="outlined">
            <v-card-text class="text-center">
              <v-icon icon="mdi-calculator" size="32" color="info" class="mb-2" />
              <div class="text-body-2 text-medium-emphasis">Avg. Transaction</div>
              <div class="text-h5 font-weight-bold">
                {{ formatINR(expenses?.length ? totalExpenses / expenses.length : 0) }}
              </div>
            </v-card-text>
          </v-card>
        </v-col>
        <v-col cols="12" sm="6" md="3">
          <v-card variant="outlined">
            <v-card-text class="text-center">
              <v-icon icon="mdi-target" size="32" :color="budgetUsage && budgetUsage.total > 100 ? 'error' : 'success'" class="mb-2" />
              <div class="text-body-2 text-medium-emphasis">Budget Usage</div>
              <div class="text-h5 font-weight-bold" :class="budgetUsage && budgetUsage.total > 100 ? 'text-error' : 'text-success'">
                {{ budgetUsage?.total.toFixed(0) || '--' }}%
              </div>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <!-- Export Actions -->
      <v-card class="mb-6" variant="outlined">
        <v-card-text class="d-flex align-center justify-space-between flex-wrap ga-2">
          <div class="text-body-1">
            <v-icon icon="mdi-file-chart" class="mr-1" />
            {{ monthName }} Report
          </div>
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
              <v-divider />
              <v-list-item @click="printReport">
                <template #prepend>
                  <v-icon icon="mdi-printer" />
                </template>
                <v-list-item-title>Print Report</v-list-item-title>
              </v-list-item>
            </v-list>
          </v-menu>
        </v-card-text>
      </v-card>

      <!-- Charts Row -->
      <v-row class="mb-6">
        <!-- Category Breakdown -->
        <v-col cols="12" md="6">
          <CategoryPieChart
            :data="expensesByCategory"
            title="Spending by Category"
          />
        </v-col>

        <!-- Monthly Trend -->
        <v-col cols="12" md="6">
          <MonthlyTrendChart
            :data="trendData"
            title="6-Month Trend"
            show-breakdown
          />
        </v-col>
      </v-row>

      <!-- Recent Expenses & Top Expenses -->
      <v-row class="mb-6">
        <!-- Recent Expenses -->
        <v-col cols="12" md="6">
          <v-card>
            <v-card-title class="d-flex align-center justify-space-between">
              <span>
                <v-icon icon="mdi-clock-outline" class="mr-2" />
                Recent Expenses
              </span>
              <v-btn size="small" variant="text" color="primary" @click="emit('go-to-details')">
                View All
              </v-btn>
            </v-card-title>
            <v-card-text v-if="recentExpenses.length === 0" class="text-center pa-8">
              <v-icon icon="mdi-receipt-text-outline" size="48" color="grey" />
              <p class="text-medium-emphasis mt-2">No expenses this month</p>
              <v-btn color="primary" class="mt-2" @click="emit('go-to-details')">
                Add Expense
              </v-btn>
            </v-card-text>
            <v-list v-else lines="two" density="compact">
              <v-list-item
                v-for="expense in recentExpenses"
                :key="expense.id"
              >
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

        <!-- Top Expenses -->
        <v-col cols="12" md="6">
          <v-card>
            <v-card-title>
              <v-icon icon="mdi-trending-up" class="mr-2" />
              Top Expenses
            </v-card-title>
            <v-card-text v-if="topExpenses.length === 0" class="text-center pa-8">
              <v-icon icon="mdi-receipt-text-outline" size="48" color="grey" />
              <p class="text-medium-emphasis mt-2">No expenses this month</p>
            </v-card-text>
            <v-list v-else lines="two" density="compact">
              <v-list-item
                v-for="(expense, index) in topExpenses"
                :key="expense.id"
              >
                <template #prepend>
                  <v-avatar color="primary" variant="tonal" size="32">
                    <span class="text-body-2 font-weight-bold">{{ index + 1 }}</span>
                  </v-avatar>
                </template>
                <v-list-item-title>{{ expense.description }}</v-list-item-title>
                <v-list-item-subtitle>
                  {{ expense.category }}
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
      </v-row>

      <!-- Budget vs Actual -->
      <v-card v-if="currentBudget">
        <v-card-title>
          <v-icon icon="mdi-scale-balance" class="mr-2" />
          Budget vs Actual
        </v-card-title>
        <v-card-text>
          <v-row>
            <!-- Needs -->
            <v-col cols="12" md="4">
              <div class="text-center mb-3">
                <v-avatar color="blue" size="48">
                  <v-icon icon="mdi-home" />
                </v-avatar>
                <div class="text-subtitle-1 font-weight-medium mt-2">Needs (50%)</div>
              </div>
              <div class="d-flex justify-space-between mb-2">
                <span class="text-body-2">Budget</span>
                <span class="font-weight-medium">{{ formatINR(currentBudget.needsLimit) }}</span>
              </div>
              <div class="d-flex justify-space-between mb-2">
                <span class="text-body-2">Actual</span>
                <span class="font-weight-medium" :class="currentBudget.needsActual > currentBudget.needsLimit ? 'text-error' : ''">
                  {{ formatINR(currentBudget.needsActual) }}
                </span>
              </div>
              <v-progress-linear
                :model-value="currentBudget.needsLimit > 0 ? (currentBudget.needsActual / currentBudget.needsLimit) * 100 : 0"
                :color="currentBudget.needsActual > currentBudget.needsLimit ? 'error' : 'blue'"
                height="8"
                rounded
              />
            </v-col>

            <!-- Wants -->
            <v-col cols="12" md="4">
              <div class="text-center mb-3">
                <v-avatar color="purple" size="48">
                  <v-icon icon="mdi-shopping" />
                </v-avatar>
                <div class="text-subtitle-1 font-weight-medium mt-2">Wants (30%)</div>
              </div>
              <div class="d-flex justify-space-between mb-2">
                <span class="text-body-2">Budget</span>
                <span class="font-weight-medium">{{ formatINR(currentBudget.wantsLimit) }}</span>
              </div>
              <div class="d-flex justify-space-between mb-2">
                <span class="text-body-2">Actual</span>
                <span class="font-weight-medium" :class="currentBudget.wantsActual > currentBudget.wantsLimit ? 'text-error' : ''">
                  {{ formatINR(currentBudget.wantsActual) }}
                </span>
              </div>
              <v-progress-linear
                :model-value="currentBudget.wantsLimit > 0 ? (currentBudget.wantsActual / currentBudget.wantsLimit) * 100 : 0"
                :color="currentBudget.wantsActual > currentBudget.wantsLimit ? 'error' : 'purple'"
                height="8"
                rounded
              />
            </v-col>

            <!-- Savings -->
            <v-col cols="12" md="4">
              <div class="text-center mb-3">
                <v-avatar color="green" size="48">
                  <v-icon icon="mdi-piggy-bank" />
                </v-avatar>
                <div class="text-subtitle-1 font-weight-medium mt-2">Savings (20%)</div>
              </div>
              <div class="d-flex justify-space-between mb-2">
                <span class="text-body-2">Target</span>
                <span class="font-weight-medium">{{ formatINR(currentBudget.savingsLimit) }}</span>
              </div>
              <div class="d-flex justify-space-between mb-2">
                <span class="text-body-2">Actual</span>
                <span class="font-weight-medium text-success">
                  {{ formatINR(currentBudget.savingsActual) }}
                </span>
              </div>
              <v-progress-linear
                :model-value="currentBudget.savingsLimit > 0 ? (currentBudget.savingsActual / currentBudget.savingsLimit) * 100 : 0"
                color="green"
                height="8"
                rounded
              />
            </v-col>
          </v-row>
        </v-card-text>
      </v-card>

      <!-- Empty State for no budget -->
      <v-card v-else class="text-center pa-6">
        <v-icon icon="mdi-target" size="48" color="grey" />
        <p class="text-medium-emphasis mt-2">No budget set for this month</p>
        <v-btn color="primary" variant="outlined" to="/expenses/budgets" class="mt-2">
          Set Budget
        </v-btn>
      </v-card>
    </template>
  </div>
</template>

<style>
@media print {
  .v-navigation-drawer,
  .v-app-bar,
  .section-header,
  .v-btn-toggle,
  .v-menu {
    display: none !important;
  }
}
</style>
