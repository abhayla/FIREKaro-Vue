<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import SectionHeader from '@/components/shared/SectionHeader.vue'
import FIREOverviewTab from '@/components/fire/FIREOverviewTab.vue'
import FIREPlanningTab from '@/components/fire/FIREPlanningTab.vue'
import { useFIREExport, type FIREExportData } from '@/composables/useFIRE'
import { formatINR } from '@/utils/formatters'

// URL-based tab navigation
const route = useRoute()
const router = useRouter()

// Computed property for active tab synced with URL query param
const activeTab = computed({
  get: () => (route.query.tab as string) || 'overview',
  set: (tab: string) => {
    router.push({
      query: { ...route.query, tab: tab === 'overview' ? undefined : tab }
    })
  }
})

// Handle navigation from Overview to Planning tab
const goToPlanning = () => {
  activeTab.value = 'planning'
}

// Export functionality
const showExportMenu = ref(false)
const isExporting = ref(false)
const exportError = ref<string | null>(null)

// Use the export composable
const { refetch: fetchExportData } = useFIREExport('json')

const handleExport = async (format: 'pdf' | 'excel') => {
  showExportMenu.value = false
  isExporting.value = true
  exportError.value = null

  try {
    const { data } = await fetchExportData()
    if (!data?.data) {
      throw new Error('No export data available')
    }

    const exportData = data.data

    if (format === 'pdf') {
      await generatePDF(exportData)
    } else {
      await generateExcel(exportData)
    }
  } catch (err) {
    console.error('Export failed:', err)
    exportError.value = `Failed to export as ${format.toUpperCase()}`
  } finally {
    isExporting.value = false
  }
}

// Generate PDF report
async function generatePDF(data: FIREExportData) {
  // Dynamically import jspdf
  const { default: jsPDF } = await import('jspdf')
  const doc = new jsPDF()

  const pageWidth = doc.internal.pageSize.getWidth()
  let y = 20

  // Title
  doc.setFontSize(24)
  doc.setTextColor(255, 87, 34) // Fire orange
  doc.text('FIRE Journey Report', pageWidth / 2, y, { align: 'center' })
  y += 15

  // Subtitle
  doc.setFontSize(10)
  doc.setTextColor(100)
  doc.text(`Generated on ${new Date(data.reportInfo.generatedAt).toLocaleDateString('en-IN')}`, pageWidth / 2, y, { align: 'center' })
  y += 10
  doc.text(`For: ${data.reportInfo.userName}`, pageWidth / 2, y, { align: 'center' })
  y += 15

  // Summary Section
  doc.setFontSize(16)
  doc.setTextColor(0)
  doc.text('Summary', 20, y)
  y += 10

  doc.setFontSize(11)
  const summaryItems = [
    `Current Age: ${data.summary.currentAge}`,
    `Target Retirement Age: ${data.summary.targetRetirementAge}`,
    `Years to FIRE: ${data.summary.yearsToFIRE.toFixed(1)}`,
    `FIRE Number: ${formatINR(data.summary.fireNumber)}`,
    `Current Corpus: ${formatINR(data.summary.currentCorpus)}`,
    `Progress: ${data.summary.progressPercent.toFixed(1)}%`,
    `Freedom Score: ${data.summary.freedomScore}/100`,
    `Savings Rate: ${data.summary.savingsRate.toFixed(1)}%`,
    `Monthly Passive Income: ${formatINR(data.summary.monthlyPassiveIncome)}`
  ]

  summaryItems.forEach(item => {
    doc.text(item, 25, y)
    y += 7
  })
  y += 5

  // FIRE Variants Section
  doc.setFontSize(16)
  doc.text('FIRE Variants', 20, y)
  y += 10

  doc.setFontSize(11)
  const variants = [
    `Lean FIRE (60%): ${formatINR(data.fireVariants.leanFIRE)}`,
    `Regular FIRE (100%): ${formatINR(data.fireVariants.regularFIRE)}`,
    `Fat FIRE (150%): ${formatINR(data.fireVariants.fatFIRE)}`,
    `Coast FIRE: ${formatINR(data.fireVariants.coastFIRE)}`,
    `Barista FIRE: ${formatINR(data.fireVariants.baristaFIRE)}`
  ]

  variants.forEach(item => {
    doc.text(item, 25, y)
    y += 7
  })
  y += 5

  // Freedom Score Breakdown
  doc.setFontSize(16)
  doc.text('Freedom Score Breakdown', 20, y)
  y += 10

  doc.setFontSize(11)
  const scoreItems = [
    `Save: ${data.freedomScore.save}/25`,
    `Grow: ${data.freedomScore.grow}/25`,
    `Protect: ${data.freedomScore.protect}/25`,
    `Ready: ${data.freedomScore.ready}/25`,
    `Total: ${data.freedomScore.total}/100`
  ]

  scoreItems.forEach(item => {
    doc.text(item, 25, y)
    y += 7
  })
  y += 5

  // Goals Summary
  if (data.goalsSummary) {
    doc.setFontSize(16)
    doc.text('Goals Summary', 20, y)
    y += 10

    doc.setFontSize(11)
    const goalSummary = data.goalsSummary as Record<string, number>
    doc.text(`Total Goals: ${goalSummary.total || 0}`, 25, y)
    y += 7
    doc.text(`Completed: ${goalSummary.completed || 0}`, 25, y)
    y += 7
    doc.text(`On Track: ${goalSummary.onTrack || 0}`, 25, y)
    y += 7
    doc.text(`At Risk: ${goalSummary.atRisk || 0}`, 25, y)
    y += 7
    doc.text(`Off Track: ${goalSummary.offTrack || 0}`, 25, y)
    y += 10
  }

  // Recommendations
  if (data.recommendations?.length) {
    // Check if we need a new page
    if (y > 250) {
      doc.addPage()
      y = 20
    }

    doc.setFontSize(16)
    doc.text('Recommendations', 20, y)
    y += 10

    doc.setFontSize(11)
    data.recommendations.forEach((rec, i) => {
      const lines = doc.splitTextToSize(`${i + 1}. ${rec}`, pageWidth - 50)
      lines.forEach((line: string) => {
        if (y > 280) {
          doc.addPage()
          y = 20
        }
        doc.text(line, 25, y)
        y += 6
      })
      y += 2
    })
  }

  // Footer
  const pageCount = doc.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.setFontSize(8)
    doc.setTextColor(150)
    doc.text(
      `Page ${i} of ${pageCount} | Generated by FIREKaro`,
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: 'center' }
    )
  }

  // Download
  const filename = `fire-report-${new Date().toISOString().split('T')[0]}.pdf`
  doc.save(filename)
}

// Generate Excel report
async function generateExcel(data: FIREExportData) {
  // Dynamically import xlsx
  const XLSX = await import('xlsx')

  const wb = XLSX.utils.book_new()

  // Summary Sheet
  const summaryData = [
    ['FIRE Journey Report'],
    [`Generated: ${new Date(data.reportInfo.generatedAt).toLocaleDateString('en-IN')}`],
    [`User: ${data.reportInfo.userName}`],
    [],
    ['Summary'],
    ['Metric', 'Value'],
    ['Current Age', data.summary.currentAge],
    ['Target Retirement Age', data.summary.targetRetirementAge],
    ['Years to FIRE', data.summary.yearsToFIRE.toFixed(1)],
    ['FIRE Number', data.summary.fireNumber],
    ['Current Corpus', data.summary.currentCorpus],
    ['Progress %', data.summary.progressPercent.toFixed(1)],
    ['Freedom Score', `${data.summary.freedomScore}/100`],
    ['Savings Rate %', data.summary.savingsRate.toFixed(1)],
    ['Monthly Passive Income', data.summary.monthlyPassiveIncome],
    [],
    ['FIRE Variants'],
    ['Variant', 'Target Corpus'],
    ['Lean FIRE (60%)', data.fireVariants.leanFIRE],
    ['Regular FIRE (100%)', data.fireVariants.regularFIRE],
    ['Fat FIRE (150%)', data.fireVariants.fatFIRE],
    ['Coast FIRE', data.fireVariants.coastFIRE],
    ['Barista FIRE', data.fireVariants.baristaFIRE],
    [],
    ['Freedom Score Breakdown'],
    ['Domain', 'Score', 'Max'],
    ['Save', data.freedomScore.save, 25],
    ['Grow', data.freedomScore.grow, 25],
    ['Protect', data.freedomScore.protect, 25],
    ['Ready', data.freedomScore.ready, 25],
    ['Total', data.freedomScore.total, 100]
  ]

  const wsSummary = XLSX.utils.aoa_to_sheet(summaryData)
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Summary')

  // Goals Sheet
  if (data.goals?.length) {
    const goalsHeaders = ['Name', 'Category', 'Target Amount', 'Current Amount', 'Progress %', 'Target Date', 'Status', 'Monthly SIP', 'Recommended SIP']
    const goalsRows = data.goals.map((g: Record<string, unknown>) => [
      g.name,
      g.category,
      g.targetAmount,
      g.currentAmount,
      (g.progress as number)?.toFixed(1),
      g.targetDate,
      g.status,
      g.monthlyContribution,
      g.sipRecommended
    ])

    const wsGoals = XLSX.utils.aoa_to_sheet([goalsHeaders, ...goalsRows])
    XLSX.utils.book_append_sheet(wb, wsGoals, 'Goals')
  }

  // Portfolio Sheet
  if (data.portfolioSummary) {
    const portfolio = data.portfolioSummary as Record<string, unknown>
    const portfolioData = [
      ['Portfolio Summary'],
      [],
      ['Total Value', portfolio.total || 0],
      [],
      ['Investments'],
      ['Count', (portfolio.investments as Record<string, unknown>)?.count || 0],
      ['Total Value', (portfolio.investments as Record<string, unknown>)?.totalValue || 0],
      [],
      ['EPF'],
      ['Balance', (portfolio.epf as Record<string, unknown>)?.balance || 'N/A'],
      [],
      ['PPF'],
      ['Count', (portfolio.ppf as Record<string, unknown>)?.count || 0],
      ['Total Balance', (portfolio.ppf as Record<string, unknown>)?.totalBalance || 0],
      [],
      ['NPS'],
      ['Count', (portfolio.nps as Record<string, unknown>)?.count || 0],
      ['Total Corpus', (portfolio.nps as Record<string, unknown>)?.totalCorpus || 0]
    ]

    const wsPortfolio = XLSX.utils.aoa_to_sheet(portfolioData)
    XLSX.utils.book_append_sheet(wb, wsPortfolio, 'Portfolio')
  }

  // Assumptions Sheet
  if (data.assumptions) {
    const assumptions = data.assumptions as Record<string, number>
    const assumptionsData = [
      ['Assumptions'],
      [],
      ['Parameter', 'Value'],
      ['Safe Withdrawal Rate %', assumptions.safeWithdrawalRate],
      ['Expected Returns %', assumptions.expectedReturns],
      ['General Inflation %', assumptions.generalInflation],
      ['Healthcare Inflation %', assumptions.healthcareInflation]
    ]

    const wsAssumptions = XLSX.utils.aoa_to_sheet(assumptionsData)
    XLSX.utils.book_append_sheet(wb, wsAssumptions, 'Assumptions')
  }

  // Recommendations Sheet
  if (data.recommendations?.length) {
    const recsData = [
      ['Recommendations'],
      [],
      ...data.recommendations.map((r, i) => [`${i + 1}. ${r}`])
    ]

    const wsRecs = XLSX.utils.aoa_to_sheet(recsData)
    XLSX.utils.book_append_sheet(wb, wsRecs, 'Recommendations')
  }

  // Download
  const filename = `fire-report-${new Date().toISOString().split('T')[0]}.xlsx`
  XLSX.writeFile(wb, filename)
}
</script>

<template>
  <div>
    <SectionHeader
      title="FIRE & Goals"
      subtitle="Your path to Financial Independence"
      icon="mdi-fire"
    />

    <!-- Tab Navigation + Export -->
    <div class="d-flex justify-space-between align-center mb-4 flex-wrap ga-2">
      <!-- Tabs -->
      <v-tabs v-model="activeTab" color="primary" density="compact">
        <v-tab value="overview">
          <v-icon icon="mdi-view-dashboard" start />
          Overview
        </v-tab>
        <v-tab value="planning">
          <v-icon icon="mdi-target" start />
          Planning
        </v-tab>
      </v-tabs>

      <!-- Export Menu -->
      <v-menu v-model="showExportMenu" :close-on-content-click="false">
        <template #activator="{ props }">
          <v-btn
            v-bind="props"
            variant="outlined"
            size="small"
            prepend-icon="mdi-download"
            :loading="isExporting"
            :disabled="isExporting"
          >
            {{ isExporting ? 'Exporting...' : 'Export' }}
            <v-icon v-if="!isExporting" icon="mdi-chevron-down" end />
          </v-btn>
        </template>
        <v-list density="compact">
          <v-list-item
            prepend-icon="mdi-file-pdf-box"
            title="Export as PDF"
            subtitle="Full FIRE report with charts"
            @click="handleExport('pdf')"
          />
          <v-list-item
            prepend-icon="mdi-file-excel"
            title="Export as Excel"
            subtitle="Raw data in spreadsheet format"
            @click="handleExport('excel')"
          />
        </v-list>
      </v-menu>
    </div>

    <!-- Export Error Snackbar -->
    <v-snackbar v-model="exportError" color="error" :timeout="5000">
      {{ exportError }}
      <template #actions>
        <v-btn variant="text" @click="exportError = null">Close</v-btn>
      </template>
    </v-snackbar>

    <!-- Tab Content -->
    <v-window v-model="activeTab">
      <!-- Overview Tab -->
      <v-window-item value="overview">
        <FIREOverviewTab @go-to-planning="goToPlanning" />
      </v-window-item>

      <!-- Planning Tab -->
      <v-window-item value="planning">
        <FIREPlanningTab />
      </v-window-item>
    </v-window>
  </div>
</template>
