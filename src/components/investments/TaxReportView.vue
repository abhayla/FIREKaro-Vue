<script setup lang="ts">
import { computed, ref } from 'vue'
import { formatINR, formatINRCompact } from '@/composables/useLiabilities'
import type { TaxReportData } from '@/composables/useInvestments'

interface Props {
  report: TaxReportData | null
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  loading: false
})

const showTransactions = ref(false)

const summaryCards = computed(() => {
  if (!props.report) return []

  return [
    {
      label: 'Total Capital Gains',
      value: props.report.capitalGains.totalGain,
      icon: 'mdi-chart-line',
      color: 'primary',
    },
    {
      label: 'Estimated Tax',
      value: props.report.capitalGains.totalTax,
      icon: 'mdi-calculator',
      color: 'warning',
    },
    {
      label: 'TDS Deducted',
      value: props.report.summary.totalTdsDeducted,
      icon: 'mdi-bank-check',
      color: 'info',
    },
    {
      label: 'Net Tax Payable',
      value: props.report.summary.netTaxPayable,
      icon: props.report.summary.netTaxPayable >= 0 ? 'mdi-currency-inr' : 'mdi-cash-refund',
      color: props.report.summary.netTaxPayable >= 0 ? 'error' : 'success',
    },
  ]
})

function getGainTypeColor(type: string): string {
  return type === 'STCG' ? 'warning' : 'info'
}
</script>

<template>
  <div class="tax-report-view">
    <!-- Loading State -->
    <template v-if="loading">
      <v-skeleton-loader type="card" class="mb-4" />
      <v-skeleton-loader type="table" />
    </template>

    <!-- No Data State -->
    <v-alert
      v-else-if="!report"
      type="info"
      variant="tonal"
    >
      <v-alert-title>No Tax Report Data</v-alert-title>
      Generate a tax report to view capital gains summary.
    </v-alert>

    <!-- Report Content -->
    <template v-else>
      <!-- Header -->
      <div class="d-flex align-center justify-space-between mb-4">
        <div>
          <h3 class="text-h6">Capital Gains Tax Report</h3>
          <div class="text-caption text-medium-emphasis">
            Financial Year: {{ report.financialYear }} | Generated: {{ new Date(report.generatedAt).toLocaleDateString('en-IN') }}
          </div>
        </div>
        <v-chip color="primary" variant="tonal">
          <v-icon start size="small">mdi-calendar</v-icon>
          FY {{ report.financialYear }}
        </v-chip>
      </div>

      <!-- Summary Cards -->
      <div class="summary-grid mb-6">
        <v-card
          v-for="card in summaryCards"
          :key="card.label"
          variant="outlined"
          class="summary-card"
        >
          <v-card-text class="pa-4">
            <div class="d-flex align-center ga-3">
              <v-avatar :color="card.color" variant="tonal" size="40">
                <v-icon :icon="card.icon" />
              </v-avatar>
              <div>
                <div class="text-caption text-medium-emphasis">{{ card.label }}</div>
                <div class="text-h6 text-currency" :class="`text-${card.color}`">
                  {{ formatINR(card.value) }}
                </div>
              </div>
            </div>
          </v-card-text>
        </v-card>
      </div>

      <!-- Capital Gains Breakdown -->
      <v-row class="mb-4">
        <!-- Short Term Capital Gains -->
        <v-col cols="12" md="6">
          <v-card variant="outlined">
            <v-card-title class="d-flex align-center">
              <v-icon start color="warning">mdi-clock-fast</v-icon>
              Short Term Capital Gains (STCG)
            </v-card-title>
            <v-card-text>
              <v-table density="comfortable">
                <thead>
                  <tr>
                    <th>Type</th>
                    <th class="text-right">Gain</th>
                    <th class="text-right">Tax Rate</th>
                    <th class="text-right">Tax</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>
                      <div class="d-flex align-center ga-2">
                        <v-icon size="small" color="success">mdi-chart-line</v-icon>
                        Equity/Equity MF
                      </div>
                    </td>
                    <td class="text-right text-currency">{{ formatINR(report.capitalGains.shortTerm.equity.gain) }}</td>
                    <td class="text-right">{{ report.capitalGains.shortTerm.equity.taxRate }}</td>
                    <td class="text-right text-currency text-warning">{{ formatINR(report.capitalGains.shortTerm.equity.estimatedTax) }}</td>
                  </tr>
                  <tr>
                    <td>
                      <div class="d-flex align-center ga-2">
                        <v-icon size="small" color="info">mdi-gold</v-icon>
                        Other Assets
                      </div>
                    </td>
                    <td class="text-right text-currency">{{ formatINR(report.capitalGains.shortTerm.other.gain) }}</td>
                    <td class="text-right">{{ report.capitalGains.shortTerm.other.taxRate }}</td>
                    <td class="text-right text-currency text-warning">{{ formatINR(report.capitalGains.shortTerm.other.estimatedTax) }}</td>
                  </tr>
                  <tr class="font-weight-bold bg-surface-variant">
                    <td>Total STCG</td>
                    <td class="text-right text-currency">{{ formatINR(report.capitalGains.shortTerm.total) }}</td>
                    <td></td>
                    <td class="text-right text-currency text-warning">{{ formatINR(report.capitalGains.shortTerm.totalTax) }}</td>
                  </tr>
                </tbody>
              </v-table>
            </v-card-text>
          </v-card>
        </v-col>

        <!-- Long Term Capital Gains -->
        <v-col cols="12" md="6">
          <v-card variant="outlined">
            <v-card-title class="d-flex align-center">
              <v-icon start color="info">mdi-clock-outline</v-icon>
              Long Term Capital Gains (LTCG)
            </v-card-title>
            <v-card-text>
              <v-table density="comfortable">
                <thead>
                  <tr>
                    <th>Type</th>
                    <th class="text-right">Gain</th>
                    <th class="text-right">Tax Rate</th>
                    <th class="text-right">Tax</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>
                      <div class="d-flex align-center ga-2">
                        <v-icon size="small" color="success">mdi-chart-line</v-icon>
                        Equity/Equity MF
                      </div>
                      <div class="text-caption text-medium-emphasis">
                        Exemption: {{ formatINR(report.capitalGains.longTerm.equity.exemption) }}
                      </div>
                    </td>
                    <td class="text-right">
                      <div class="text-currency">{{ formatINR(report.capitalGains.longTerm.equity.gain) }}</div>
                      <div class="text-caption text-success">Taxable: {{ formatINR(report.capitalGains.longTerm.equity.taxableGain) }}</div>
                    </td>
                    <td class="text-right">{{ report.capitalGains.longTerm.equity.taxRate }}</td>
                    <td class="text-right text-currency text-warning">{{ formatINR(report.capitalGains.longTerm.equity.estimatedTax) }}</td>
                  </tr>
                  <tr>
                    <td>
                      <div class="d-flex align-center ga-2">
                        <v-icon size="small" color="info">mdi-gold</v-icon>
                        Other Assets
                      </div>
                    </td>
                    <td class="text-right text-currency">{{ formatINR(report.capitalGains.longTerm.other.gain) }}</td>
                    <td class="text-right">{{ report.capitalGains.longTerm.other.taxRate }}</td>
                    <td class="text-right text-currency text-warning">{{ formatINR(report.capitalGains.longTerm.other.estimatedTax) }}</td>
                  </tr>
                  <tr class="font-weight-bold bg-surface-variant">
                    <td>Total LTCG</td>
                    <td class="text-right text-currency">{{ formatINR(report.capitalGains.longTerm.total) }}</td>
                    <td></td>
                    <td class="text-right text-currency text-warning">{{ formatINR(report.capitalGains.longTerm.totalTax) }}</td>
                  </tr>
                </tbody>
              </v-table>

              <!-- LTCG Exemption Note -->
              <v-alert
                type="info"
                variant="tonal"
                density="compact"
                class="mt-3"
              >
                <template #prepend>
                  <v-icon size="small">mdi-information</v-icon>
                </template>
                LTCG on equity up to ₹1.25 Lakh is exempt (Budget 2024-25)
              </v-alert>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <!-- Other Income -->
      <v-row class="mb-4">
        <!-- Dividend Income -->
        <v-col cols="12" md="6">
          <v-card variant="outlined">
            <v-card-title class="d-flex align-center">
              <v-icon start color="success">mdi-cash-multiple</v-icon>
              Dividend Income
            </v-card-title>
            <v-card-text>
              <div class="d-flex justify-space-between mb-2">
                <span class="text-medium-emphasis">Total Dividends</span>
                <span class="text-currency font-weight-medium">{{ formatINR(report.dividendIncome.total) }}</span>
              </div>
              <div class="d-flex justify-space-between mb-2">
                <span class="text-medium-emphasis">TDS Deducted</span>
                <span class="text-currency text-success">{{ formatINR(report.dividendIncome.tdsDeducted) }}</span>
              </div>
              <div class="d-flex justify-space-between mb-2">
                <span class="text-medium-emphasis">Tax Rate</span>
                <span>{{ report.dividendIncome.taxRate }}</span>
              </div>
              <v-divider class="my-2" />
              <div class="d-flex justify-space-between">
                <span class="text-medium-emphasis">Transactions</span>
                <v-chip size="small" color="primary">{{ report.dividendIncome.transactions }}</v-chip>
              </div>
            </v-card-text>
          </v-card>
        </v-col>

        <!-- ESOP Income -->
        <v-col cols="12" md="6">
          <v-card variant="outlined">
            <v-card-title class="d-flex align-center">
              <v-icon start color="purple">mdi-briefcase-account</v-icon>
              ESOP/RSU Income
            </v-card-title>
            <v-card-text>
              <div class="d-flex justify-space-between mb-2">
                <span class="text-medium-emphasis">Perquisite Value</span>
                <span class="text-currency font-weight-medium">{{ formatINR(report.esopIncome.perquisiteValue) }}</span>
              </div>
              <div class="d-flex justify-space-between mb-2">
                <span class="text-medium-emphasis">TDS Deducted</span>
                <span class="text-currency text-success">{{ formatINR(report.esopIncome.tdsDeducted) }}</span>
              </div>
              <div class="d-flex justify-space-between mb-2">
                <span class="text-medium-emphasis">Tax Rate</span>
                <span>{{ report.esopIncome.taxRate }}</span>
              </div>
              <v-divider class="my-2" />
              <div class="d-flex justify-space-between mb-2">
                <span class="text-medium-emphasis">Exercises</span>
                <v-chip size="small" color="purple">{{ report.esopIncome.exercises }}</v-chip>
              </div>
              <v-alert
                type="warning"
                variant="tonal"
                density="compact"
                class="mt-2"
              >
                <template #prepend>
                  <v-icon size="small">mdi-alert</v-icon>
                </template>
                {{ report.esopIncome.note }}
              </v-alert>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <!-- Transactions Table -->
      <v-card v-if="report.transactions?.length" variant="outlined">
        <v-card-title class="d-flex align-center justify-space-between">
          <div class="d-flex align-center">
            <v-icon start>mdi-format-list-bulleted</v-icon>
            Capital Gains Transactions
          </div>
          <v-btn
            variant="text"
            size="small"
            @click="showTransactions = !showTransactions"
          >
            {{ showTransactions ? 'Hide' : 'Show' }}
            <v-icon end>{{ showTransactions ? 'mdi-chevron-up' : 'mdi-chevron-down' }}</v-icon>
          </v-btn>
        </v-card-title>

        <v-expand-transition>
          <v-card-text v-if="showTransactions">
            <v-data-table
              :headers="[
                { title: 'Asset', key: 'assetName' },
                { title: 'Type', key: 'gainType' },
                { title: 'Purchase', key: 'purchaseDate' },
                { title: 'Sale', key: 'saleDate' },
                { title: 'Gain', key: 'taxableGain', align: 'end' },
                { title: 'Tax', key: 'estimatedTax', align: 'end' },
              ]"
              :items="report.transactions"
              density="compact"
              class="elevation-0"
            >
              <template #item.gainType="{ value }">
                <v-chip :color="getGainTypeColor(value)" size="small" label>
                  {{ value }}
                </v-chip>
              </template>
              <template #item.purchaseDate="{ value }">
                {{ new Date(value).toLocaleDateString('en-IN') }}
              </template>
              <template #item.saleDate="{ value }">
                {{ new Date(value).toLocaleDateString('en-IN') }}
              </template>
              <template #item.taxableGain="{ value }">
                <span class="text-currency" :class="value >= 0 ? 'text-success' : 'text-error'">
                  {{ formatINR(value) }}
                </span>
              </template>
              <template #item.estimatedTax="{ value }">
                <span class="text-currency text-warning">{{ formatINR(value) }}</span>
              </template>
            </v-data-table>
          </v-card-text>
        </v-expand-transition>
      </v-card>

      <!-- Tax Rules Reference -->
      <v-expansion-panels class="mt-4">
        <v-expansion-panel>
          <v-expansion-panel-title>
            <v-icon start>mdi-book-open-variant</v-icon>
            Tax Rules Reference (Budget 2024-25)
          </v-expansion-panel-title>
          <v-expansion-panel-text>
            <v-table density="compact">
              <thead>
                <tr>
                  <th>Asset Type</th>
                  <th>Holding Period</th>
                  <th>STCG Rate</th>
                  <th>LTCG Rate</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Listed Equity / Equity MF</td>
                  <td>12 months</td>
                  <td>20%</td>
                  <td>12.5% (above ₹1.25L)</td>
                </tr>
                <tr>
                  <td>Debt MF / Gold / Property</td>
                  <td>24 months (36 for property)</td>
                  <td>Slab Rate</td>
                  <td>12.5% (no indexation)</td>
                </tr>
                <tr>
                  <td>Unlisted Shares</td>
                  <td>24 months</td>
                  <td>Slab Rate</td>
                  <td>12.5%</td>
                </tr>
              </tbody>
            </v-table>
          </v-expansion-panel-text>
        </v-expansion-panel>
      </v-expansion-panels>
    </template>
  </div>
</template>

<style scoped>
.summary-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}

@media (max-width: 960px) {
  .summary-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 600px) {
  .summary-grid {
    grid-template-columns: 1fr;
  }
}

.summary-card {
  transition: all 0.2s ease;
}

.summary-card:hover {
  border-color: rgb(var(--v-theme-primary));
}
</style>
