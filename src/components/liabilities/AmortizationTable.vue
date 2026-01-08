<script setup lang="ts">
import { ref, computed } from 'vue'
import {
  type AmortizationEntry,
  type Loan,
  generateAmortizationSchedule,
  formatINR,
  formatDate
} from '@/composables/useLiabilities'

const props = defineProps<{
  loan: Loan
  schedule?: AmortizationEntry[]
}>()

// Generate schedule if not provided
const amortizationSchedule = computed(() => {
  if (props.schedule && props.schedule.length > 0) {
    return props.schedule
  }
  return generateAmortizationSchedule(
    props.loan.principalAmount,
    props.loan.interestRate,
    props.loan.tenure,
    new Date(props.loan.startDate)
  )
})

// Pagination
const itemsPerPage = ref(12)
const currentPage = ref(1)

const paginatedSchedule = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value
  const end = start + itemsPerPage.value
  return amortizationSchedule.value.slice(start, end)
})

const totalPages = computed(() => {
  return Math.ceil(amortizationSchedule.value.length / itemsPerPage.value)
})

// Summary calculations
const totalInterest = computed(() => {
  return amortizationSchedule.value.reduce((sum, entry) => sum + entry.interest, 0)
})

const totalPrincipal = computed(() => {
  return amortizationSchedule.value.reduce((sum, entry) => sum + entry.principal, 0)
})

// Cumulative values for chart
const cumulativeData = computed(() => {
  let cumulativePrincipal = 0
  let cumulativeInterest = 0
  return amortizationSchedule.value.map(entry => {
    cumulativePrincipal += entry.principal
    cumulativeInterest += entry.interest
    return {
      month: entry.month,
      cumulativePrincipal,
      cumulativeInterest,
      balance: entry.closingBalance
    }
  })
})

// View mode
const viewMode = ref<'table' | 'yearly'>('table')

// Yearly summary
const yearlySummary = computed(() => {
  const years: { year: number; principal: number; interest: number; closing: number }[] = []
  let currentYear = 0
  let yearPrincipal = 0
  let yearInterest = 0
  let lastClosing = 0

  amortizationSchedule.value.forEach((entry, index) => {
    const entryYear = Math.floor(index / 12) + 1
    if (entryYear !== currentYear) {
      if (currentYear > 0) {
        years.push({
          year: currentYear,
          principal: yearPrincipal,
          interest: yearInterest,
          closing: lastClosing
        })
      }
      currentYear = entryYear
      yearPrincipal = 0
      yearInterest = 0
    }
    yearPrincipal += entry.principal
    yearInterest += entry.interest
    lastClosing = entry.closingBalance
  })

  // Add last year
  if (yearPrincipal > 0 || yearInterest > 0) {
    years.push({
      year: currentYear,
      principal: yearPrincipal,
      interest: yearInterest,
      closing: lastClosing
    })
  }

  return years
})
</script>

<template>
  <v-card variant="outlined">
    <v-card-title class="d-flex align-center">
      <v-icon icon="mdi-table" class="mr-2" />
      Amortization Schedule
      <v-spacer />
      <v-btn-toggle v-model="viewMode" mandatory density="compact" variant="outlined">
        <v-btn value="table" size="small">
          <v-icon icon="mdi-table" size="small" />
          Monthly
        </v-btn>
        <v-btn value="yearly" size="small">
          <v-icon icon="mdi-calendar" size="small" />
          Yearly
        </v-btn>
      </v-btn-toggle>
    </v-card-title>

    <v-card-text>
      <!-- Summary Cards -->
      <v-row class="mb-4">
        <v-col cols="6" sm="3">
          <v-card variant="tonal" color="primary" class="pa-3 text-center">
            <div class="text-caption">EMI Amount</div>
            <div class="text-h6 font-weight-bold">{{ formatINR(loan.emiAmount) }}</div>
          </v-card>
        </v-col>
        <v-col cols="6" sm="3">
          <v-card variant="tonal" color="info" class="pa-3 text-center">
            <div class="text-caption">Total Principal</div>
            <div class="text-h6 font-weight-bold">{{ formatINR(totalPrincipal) }}</div>
          </v-card>
        </v-col>
        <v-col cols="6" sm="3">
          <v-card variant="tonal" color="warning" class="pa-3 text-center">
            <div class="text-caption">Total Interest</div>
            <div class="text-h6 font-weight-bold">{{ formatINR(totalInterest) }}</div>
          </v-card>
        </v-col>
        <v-col cols="6" sm="3">
          <v-card variant="tonal" color="success" class="pa-3 text-center">
            <div class="text-caption">Total Payable</div>
            <div class="text-h6 font-weight-bold">{{ formatINR(totalPrincipal + totalInterest) }}</div>
          </v-card>
        </v-col>
      </v-row>

      <!-- Monthly Table View -->
      <template v-if="viewMode === 'table'">
        <v-table density="compact" fixed-header height="400">
          <thead>
            <tr>
              <th class="text-center">Month</th>
              <th class="text-right">Opening Balance</th>
              <th class="text-right">EMI</th>
              <th class="text-right">Principal</th>
              <th class="text-right">Interest</th>
              <th class="text-right">Closing Balance</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="entry in paginatedSchedule"
              :key="entry.month"
              :class="{ 'bg-grey-lighten-4': entry.month % 2 === 0 }"
            >
              <td class="text-center">
                <v-chip size="x-small" variant="outlined">{{ entry.month }}</v-chip>
              </td>
              <td class="text-right">{{ formatINR(entry.openingBalance) }}</td>
              <td class="text-right font-weight-medium">{{ formatINR(entry.emi) }}</td>
              <td class="text-right text-success">{{ formatINR(entry.principal) }}</td>
              <td class="text-right text-warning">{{ formatINR(entry.interest) }}</td>
              <td class="text-right font-weight-medium">{{ formatINR(entry.closingBalance) }}</td>
            </tr>
          </tbody>
        </v-table>

        <!-- Pagination -->
        <div class="d-flex justify-center align-center mt-4">
          <v-pagination
            v-model="currentPage"
            :length="totalPages"
            :total-visible="5"
            density="compact"
          />
          <v-select
            v-model="itemsPerPage"
            :items="[12, 24, 36, 60]"
            label="Per page"
            variant="outlined"
            density="compact"
            hide-details
            style="max-width: 100px"
            class="ml-4"
          />
        </div>
      </template>

      <!-- Yearly Summary View -->
      <template v-else>
        <v-table density="compact">
          <thead>
            <tr>
              <th class="text-center">Year</th>
              <th class="text-right">Principal Paid</th>
              <th class="text-right">Interest Paid</th>
              <th class="text-right">Total Paid</th>
              <th class="text-right">Closing Balance</th>
              <th class="text-center">Progress</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="year in yearlySummary" :key="year.year">
              <td class="text-center">
                <v-chip size="small" color="primary" variant="tonal">
                  Year {{ year.year }}
                </v-chip>
              </td>
              <td class="text-right text-success font-weight-medium">
                {{ formatINR(year.principal) }}
              </td>
              <td class="text-right text-warning">{{ formatINR(year.interest) }}</td>
              <td class="text-right font-weight-bold">
                {{ formatINR(year.principal + year.interest) }}
              </td>
              <td class="text-right">{{ formatINR(year.closing) }}</td>
              <td class="text-center" style="width: 150px">
                <v-progress-linear
                  :model-value="((loan.principalAmount - year.closing) / loan.principalAmount) * 100"
                  color="success"
                  height="8"
                  rounded
                />
              </td>
            </tr>
          </tbody>
        </v-table>
      </template>

      <!-- Interest vs Principal Breakdown -->
      <v-alert type="info" variant="tonal" class="mt-4">
        <div class="d-flex justify-space-between flex-wrap">
          <div>
            <strong>Interest to Principal Ratio:</strong>
            {{ ((totalInterest / totalPrincipal) * 100).toFixed(1) }}%
          </div>
          <div>
            <strong>Effective Cost:</strong>
            You pay {{ formatINR(totalInterest) }} extra over the loan tenure.
          </div>
        </div>
      </v-alert>
    </v-card-text>
  </v-card>
</template>
