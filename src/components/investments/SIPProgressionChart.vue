<script setup lang="ts">
import { computed } from 'vue'
import { Bar } from 'vue-chartjs'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js'
import { useSIPHistory, formatINR, formatINRCompact } from '@/composables/useInvestments'

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend)

const { data: sipHistory, isLoading, isError } = useSIPHistory()

// Chart data
const chartData = computed(() => {
  if (!sipHistory.value?.yearlyData) return null

  return {
    labels: sipHistory.value.yearlyData.map(d => d.year.toString()),
    datasets: [
      {
        label: 'Monthly SIP Amount',
        data: sipHistory.value.yearlyData.map(d => d.monthlySIP),
        backgroundColor: '#1867c0',
        borderRadius: 6
      }
    ]
  }
})

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: false
    },
    tooltip: {
      callbacks: {
        label: (context: { raw: number }) => formatINR(context.raw)
      }
    }
  },
  scales: {
    y: {
      beginAtZero: true,
      ticks: {
        callback: (value: number) => formatINRCompact(value)
      }
    }
  }
}

// Calculate key metrics
const metrics = computed(() => {
  if (!sipHistory.value) return null

  const data = sipHistory.value.yearlyData
  const firstYear = data[0]
  const lastYear = data[data.length - 1]
  const multiplier = firstYear.monthlySIP > 0
    ? lastYear.monthlySIP / firstYear.monthlySIP
    : 0

  return {
    startSIP: firstYear.monthlySIP,
    currentSIP: lastYear.monthlySIP,
    multiplier: multiplier.toFixed(1),
    totalYears: data.length,
    avgGrowth: sipHistory.value.averageGrowthRate
  }
})
</script>

<template>
  <v-card>
    <v-card-title class="d-flex align-center">
      <v-icon icon="mdi-chart-timeline-variant-shimmer" class="mr-2" />
      SIP Progression Timeline
      <v-spacer />
      <v-chip v-if="sipHistory" color="success" variant="tonal" size="small">
        <v-icon icon="mdi-trending-up" size="small" class="mr-1" />
        {{ sipHistory.averageGrowthRate.toFixed(0) }}% avg. growth
      </v-chip>
    </v-card-title>

    <v-card-text>
      <!-- Loading State -->
      <div v-if="isLoading" class="text-center py-4">
        <v-progress-circular indeterminate color="primary" size="32" />
      </div>

      <!-- Error State -->
      <v-alert v-else-if="isError" type="error" variant="tonal">
        Failed to load SIP history.
      </v-alert>

      <!-- Main Content -->
      <template v-else-if="sipHistory && chartData">
        <!-- Summary Metrics -->
        <v-row class="mb-4">
          <v-col cols="6" sm="3">
            <div class="text-center">
              <div class="text-body-2 text-medium-emphasis">Started With</div>
              <div class="text-h6 font-weight-bold">
                {{ formatINRCompact(metrics?.startSIP || 0) }}
              </div>
              <div class="text-caption text-medium-emphasis">{{ sipHistory.startYear }}</div>
            </div>
          </v-col>
          <v-col cols="6" sm="3">
            <div class="text-center">
              <div class="text-body-2 text-medium-emphasis">Current SIP</div>
              <div class="text-h6 font-weight-bold text-primary">
                {{ formatINRCompact(sipHistory.currentMonthlySIP) }}
              </div>
              <div class="text-caption text-medium-emphasis">per month</div>
            </div>
          </v-col>
          <v-col cols="6" sm="3">
            <div class="text-center">
              <div class="text-body-2 text-medium-emphasis">Growth</div>
              <div class="text-h6 font-weight-bold text-success">
                {{ metrics?.multiplier }}x
              </div>
              <div class="text-caption text-medium-emphasis">over {{ metrics?.totalYears }} years</div>
            </div>
          </v-col>
          <v-col cols="6" sm="3">
            <div class="text-center">
              <div class="text-body-2 text-medium-emphasis">Total Contributed</div>
              <div class="text-h6 font-weight-bold">
                {{ formatINRCompact(sipHistory.totalContributed) }}
              </div>
              <div class="text-caption text-medium-emphasis">via SIPs</div>
            </div>
          </v-col>
        </v-row>

        <!-- Chart -->
        <div style="height: 280px">
          <Bar :data="chartData" :options="chartOptions as any" />
        </div>

        <!-- Year-over-Year Table -->
        <v-expansion-panels class="mt-4" variant="accordion">
          <v-expansion-panel>
            <v-expansion-panel-title>
              <v-icon icon="mdi-table" class="mr-2" />
              Year-over-Year Details
            </v-expansion-panel-title>
            <v-expansion-panel-text>
              <v-table density="compact">
                <thead>
                  <tr>
                    <th>Year</th>
                    <th class="text-right">Monthly SIP</th>
                    <th class="text-right">Yearly Total</th>
                    <th class="text-right">SIPs</th>
                    <th class="text-right">Growth</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="row in sipHistory.yearlyData" :key="row.year">
                    <td>{{ row.year }}</td>
                    <td class="text-right font-weight-medium">{{ formatINRCompact(row.monthlySIP) }}</td>
                    <td class="text-right">{{ formatINRCompact(row.yearlyContribution) }}</td>
                    <td class="text-right">{{ row.sipCount }}</td>
                    <td class="text-right">
                      <v-chip
                        v-if="row.growthPercent !== undefined"
                        :color="row.growthPercent >= 0 ? 'success' : 'error'"
                        size="x-small"
                        variant="tonal"
                      >
                        {{ row.growthPercent >= 0 ? '+' : '' }}{{ row.growthPercent.toFixed(0) }}%
                      </v-chip>
                      <span v-else class="text-caption text-medium-emphasis">-</span>
                    </td>
                  </tr>
                </tbody>
              </v-table>
            </v-expansion-panel-text>
          </v-expansion-panel>
        </v-expansion-panels>

        <!-- Insight -->
        <v-alert type="info" variant="tonal" density="compact" class="mt-4">
          <v-icon icon="mdi-lightbulb" class="mr-1" />
          <strong>Your SIP discipline:</strong> You've grown your monthly investments from
          {{ formatINRCompact(metrics?.startSIP || 0) }} to {{ formatINRCompact(sipHistory.currentMonthlySIP) }}
          - a {{ metrics?.multiplier }}x increase over {{ metrics?.totalYears }} years!
        </v-alert>
      </template>
    </v-card-text>
  </v-card>
</template>
