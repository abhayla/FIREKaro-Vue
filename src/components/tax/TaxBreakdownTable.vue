<script setup lang="ts">
import { computed } from "vue";
import type { TaxCalculationResult } from "@/types/tax";
import { formatINR } from "@/composables/useTax";

interface Props {
  result: TaxCalculationResult | null;
  loading?: boolean;
  showSlabs?: boolean;
  showDeductions?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  showSlabs: true,
  showDeductions: true,
});

const regimeLabel = computed(() =>
  props.result?.regime === "NEW" ? "New Regime" : "Old Regime",
);

const regimeColor = computed(() =>
  props.result?.regime === "NEW" ? "primary" : "secondary",
);
</script>

<template>
  <v-card :loading="loading">
    <v-card-title class="d-flex align-center">
      <v-icon class="mr-2">mdi-calculator</v-icon>
      Tax Calculation Breakdown
      <v-chip v-if="result" class="ml-2" :color="regimeColor" size="small">
        {{ regimeLabel }}
      </v-chip>
    </v-card-title>

    <v-card-text v-if="result">
      <!-- Summary -->
      <v-row class="mb-4">
        <v-col cols="6" md="3">
          <div class="text-caption text-medium-emphasis">Gross Income</div>
          <div class="text-h6 text-currency">
            {{ formatINR(result.grossTotalIncome) }}
          </div>
        </v-col>
        <v-col cols="6" md="3">
          <div class="text-caption text-medium-emphasis">Deductions</div>
          <div class="text-h6 text-currency text-negative">
            -{{ formatINR(result.totalDeductions) }}
          </div>
        </v-col>
        <v-col cols="6" md="3">
          <div class="text-caption text-medium-emphasis">Taxable Income</div>
          <div class="text-h6 text-currency">
            {{ formatINR(result.taxableIncome) }}
          </div>
        </v-col>
        <v-col cols="6" md="3">
          <div class="text-caption text-medium-emphasis">Total Tax</div>
          <div class="text-h6 text-currency font-weight-bold text-error">
            {{ formatINR(result.totalTaxLiability) }}
          </div>
        </v-col>
      </v-row>

      <!-- Slab-wise Breakdown -->
      <div v-if="showSlabs && result.slabBreakdown.length" class="mb-4">
        <div class="text-subtitle-2 mb-2">Tax Slab Breakdown</div>
        <v-table density="compact">
          <thead>
            <tr>
              <th>Income Slab</th>
              <th class="text-end">Income</th>
              <th class="text-center">Rate</th>
              <th class="text-end">Tax</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(slab, idx) in result.slabBreakdown" :key="idx">
              <td>{{ slab.slab }}</td>
              <td class="text-end text-currency">
                {{ formatINR(slab.income) }}
              </td>
              <td class="text-center">{{ slab.rate }}%</td>
              <td class="text-end text-currency">{{ formatINR(slab.tax) }}</td>
            </tr>
          </tbody>
          <tfoot>
            <tr class="font-weight-bold">
              <td>Total Tax on Income</td>
              <td></td>
              <td></td>
              <td class="text-end text-currency">
                {{ formatINR(result.taxOnIncome) }}
              </td>
            </tr>
          </tfoot>
        </v-table>
      </div>

      <!-- Tax Components -->
      <div class="mb-4">
        <div class="text-subtitle-2 mb-2">Tax Components</div>
        <v-list density="compact">
          <v-list-item>
            <v-list-item-title>Tax on Income</v-list-item-title>
            <template #append>
              <span class="text-currency">{{
                formatINR(result.taxOnIncome)
              }}</span>
            </template>
          </v-list-item>
          <v-list-item v-if="result.surcharge > 0">
            <v-list-item-title>Surcharge</v-list-item-title>
            <template #append>
              <span class="text-currency">{{
                formatINR(result.surcharge)
              }}</span>
            </template>
          </v-list-item>
          <v-list-item>
            <v-list-item-title>Health & Education Cess (4%)</v-list-item-title>
            <template #append>
              <span class="text-currency">{{
                formatINR(result.healthEducationCess)
              }}</span>
            </template>
          </v-list-item>
          <v-divider />
          <v-list-item>
            <v-list-item-title class="font-weight-bold"
              >Total Tax Liability</v-list-item-title
            >
            <template #append>
              <span class="text-currency text-h6 font-weight-bold text-error">
                {{ formatINR(result.totalTaxLiability) }}
              </span>
            </template>
          </v-list-item>
        </v-list>
      </div>

      <!-- Deduction Breakdown (Old Regime) -->
      <div
        v-if="
          showDeductions &&
          result.regime === 'OLD' &&
          result.deductionBreakdown.length
        "
      >
        <div class="text-subtitle-2 mb-2">Deductions Claimed</div>
        <v-table density="compact">
          <thead>
            <tr>
              <th>Section</th>
              <th class="text-end">Claimed</th>
              <th class="text-end">Limit</th>
              <th class="text-end">Allowed</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(ded, idx) in result.deductionBreakdown" :key="idx">
              <td>
                <div>{{ ded.section }}</div>
                <div class="text-caption text-medium-emphasis">
                  {{ ded.label }}
                </div>
              </td>
              <td class="text-end text-currency">
                {{ formatINR(ded.claimed) }}
              </td>
              <td class="text-end text-currency">{{ formatINR(ded.limit) }}</td>
              <td class="text-end text-currency text-positive">
                {{ formatINR(ded.allowed) }}
              </td>
            </tr>
          </tbody>
        </v-table>
      </div>

      <!-- Effective Rate -->
      <v-alert type="info" variant="tonal" class="mt-4">
        <div class="d-flex align-center justify-space-between">
          <span>Effective Tax Rate</span>
          <span class="text-h6 font-weight-bold"
            >{{ result.effectiveRate.toFixed(2) }}%</span
          >
        </div>
      </v-alert>
    </v-card-text>

    <v-card-text v-else-if="!loading" class="text-center py-8">
      <v-icon icon="mdi-calculator" size="64" color="grey-lighten-1" />
      <div class="text-body-1 text-medium-emphasis mt-4">
        No tax calculation data available
      </div>
    </v-card-text>
  </v-card>
</template>
