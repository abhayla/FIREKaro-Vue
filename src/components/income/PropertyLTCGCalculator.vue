<script setup lang="ts">
import { ref, computed, watch } from "vue";
import { formatINR } from "@/composables/useIncome";

// Cost Inflation Index (CII) values from 2001-02 onwards
const CII_INDEX: Record<string, number> = {
  "2001-02": 100,
  "2002-03": 105,
  "2003-04": 109,
  "2004-05": 113,
  "2005-06": 117,
  "2006-07": 122,
  "2007-08": 129,
  "2008-09": 137,
  "2009-10": 148,
  "2010-11": 167,
  "2011-12": 184,
  "2012-13": 200,
  "2013-14": 220,
  "2014-15": 240,
  "2015-16": 254,
  "2016-17": 264,
  "2017-18": 272,
  "2018-19": 280,
  "2019-20": 289,
  "2020-21": 301,
  "2021-22": 317,
  "2022-23": 331,
  "2023-24": 348,
  "2024-25": 363,
  "2025-26": 377,
};

// Available FY options for purchase
const purchaseFYOptions = computed(() => {
  return Object.keys(CII_INDEX)
    .filter((fy) => {
      // Only show years before July 2024 cutoff
      const year = parseInt(fy.split("-")[0]);
      return year < 2024;
    })
    .sort()
    .reverse();
});

// Available FY options for sale (current and previous)
const saleFYOptions = computed(() => {
  return Object.keys(CII_INDEX).sort().reverse().slice(0, 5);
});

// Form data
const purchasePrice = ref<number | null>(null);
const purchaseFY = ref<string>("2020-21");
const salePrice = ref<number | null>(null);
const saleFY = ref<string>("2024-25");
const expenses = ref<number>(0);
const showResults = ref(false);

// Budget 2024 cutoff date
const BUDGET_2024_CUTOFF = new Date("2024-07-23");

// Calculations
const calculations = computed(() => {
  if (!purchasePrice.value || !salePrice.value) {
    return null;
  }

  const purchaseCII = CII_INDEX[purchaseFY.value] || 100;
  const saleCII = CII_INDEX[saleFY.value] || 363;

  // Option A: 12.5% flat rate (no indexation) - Post July 2024 rule
  const gainWithoutIndexation = salePrice.value - purchasePrice.value - expenses.value;
  const taxOptionA = Math.max(0, gainWithoutIndexation * 0.125);

  // Option B: 20% with CII indexation - Pre July 2024 rule
  const indexedCost = (purchasePrice.value * saleCII) / purchaseCII;
  const gainWithIndexation = salePrice.value - indexedCost - expenses.value;
  const taxOptionB = Math.max(0, gainWithIndexation * 0.20);

  // Determine better option
  const betterOption = taxOptionA <= taxOptionB ? "A" : "B";
  const savings = Math.abs(taxOptionA - taxOptionB);

  return {
    // Input summary
    purchasePrice: purchasePrice.value,
    salePrice: salePrice.value,
    expenses: expenses.value,
    purchaseCII,
    saleCII,

    // Option A: 12.5% flat
    gainWithoutIndexation,
    taxOptionA,

    // Option B: 20% with CII
    indexedCost,
    gainWithIndexation,
    taxOptionB,

    // Comparison
    betterOption,
    savings,
    savingsPercent: ((savings / Math.max(taxOptionA, taxOptionB)) * 100).toFixed(1),
  };
});

function calculate() {
  if (purchasePrice.value && salePrice.value) {
    showResults.value = true;
  }
}

function reset() {
  purchasePrice.value = null;
  salePrice.value = null;
  expenses.value = 0;
  purchaseFY.value = "2020-21";
  saleFY.value = "2024-25";
  showResults.value = false;
}
</script>

<template>
  <v-card class="mb-4">
    <v-card-title class="d-flex align-center">
      <v-icon class="mr-2" color="secondary">mdi-home-analytics</v-icon>
      Property LTCG Calculator
      <v-chip class="ml-2" size="small" color="warning" variant="tonal">
        Budget 2024
      </v-chip>
    </v-card-title>
    <v-card-subtitle>
      Compare 12.5% flat rate vs 20% with CII indexation for properties purchased before July 23, 2024
    </v-card-subtitle>

    <v-card-text>
      <v-alert type="info" variant="tonal" density="compact" class="mb-4">
        <strong>Budget 2024 Change:</strong> Properties purchased before July 23, 2024 can choose between
        12.5% flat rate (no indexation) OR 20% with Cost Inflation Index (CII) indexation.
        Properties purchased after this date only get 12.5% flat rate.
      </v-alert>

      <v-row>
        <v-col cols="12" md="6">
          <v-text-field
            v-model.number="purchasePrice"
            label="Purchase Price"
            type="number"
            prefix="₹"
            hint="Original purchase price of property"
            persistent-hint
          />
        </v-col>
        <v-col cols="12" md="6">
          <v-select
            v-model="purchaseFY"
            label="Purchase Financial Year"
            :items="purchaseFYOptions"
            hint="Year when property was purchased"
            persistent-hint
          />
        </v-col>
        <v-col cols="12" md="6">
          <v-text-field
            v-model.number="salePrice"
            label="Sale Price"
            type="number"
            prefix="₹"
            hint="Price at which property was sold"
            persistent-hint
          />
        </v-col>
        <v-col cols="12" md="6">
          <v-select
            v-model="saleFY"
            label="Sale Financial Year"
            :items="saleFYOptions"
            hint="Year when property was sold"
            persistent-hint
          />
        </v-col>
        <v-col cols="12" md="6">
          <v-text-field
            v-model.number="expenses"
            label="Transfer Expenses"
            type="number"
            prefix="₹"
            hint="Brokerage, stamp duty, legal fees etc."
            persistent-hint
          />
        </v-col>
        <v-col cols="12" md="6" class="d-flex align-center">
          <v-btn color="primary" size="large" @click="calculate" class="mr-2">
            Calculate
          </v-btn>
          <v-btn variant="outlined" @click="reset">
            Reset
          </v-btn>
        </v-col>
      </v-row>

      <!-- Results -->
      <v-expand-transition>
        <div v-if="showResults && calculations">
          <v-divider class="my-4" />

          <v-row>
            <!-- Option A: 12.5% Flat -->
            <v-col cols="12" md="6">
              <v-card
                :variant="calculations.betterOption === 'A' ? 'elevated' : 'outlined'"
                :color="calculations.betterOption === 'A' ? 'success' : undefined"
                :class="calculations.betterOption === 'A' ? 'border-success' : ''"
              >
                <v-card-title class="d-flex align-center">
                  <span :class="calculations.betterOption === 'A' ? 'text-success' : ''">
                    Option A: 12.5% Flat Rate
                  </span>
                  <v-chip
                    v-if="calculations.betterOption === 'A'"
                    class="ml-2"
                    size="small"
                    color="success"
                  >
                    BETTER
                  </v-chip>
                </v-card-title>
                <v-card-text>
                  <v-list density="compact" class="bg-transparent">
                    <v-list-item>
                      <v-list-item-title>Sale Price</v-list-item-title>
                      <template #append>
                        <span class="text-currency">{{ formatINR(calculations.salePrice) }}</span>
                      </template>
                    </v-list-item>
                    <v-list-item>
                      <v-list-item-title>Purchase Price</v-list-item-title>
                      <template #append>
                        <span class="text-currency">- {{ formatINR(calculations.purchasePrice) }}</span>
                      </template>
                    </v-list-item>
                    <v-list-item v-if="calculations.expenses > 0">
                      <v-list-item-title>Expenses</v-list-item-title>
                      <template #append>
                        <span class="text-currency">- {{ formatINR(calculations.expenses) }}</span>
                      </template>
                    </v-list-item>
                    <v-divider class="my-2" />
                    <v-list-item>
                      <v-list-item-title class="font-weight-bold">Capital Gain</v-list-item-title>
                      <template #append>
                        <span class="text-currency font-weight-bold">
                          {{ formatINR(calculations.gainWithoutIndexation) }}
                        </span>
                      </template>
                    </v-list-item>
                    <v-list-item>
                      <v-list-item-title>Tax @ 12.5%</v-list-item-title>
                      <template #append>
                        <span class="text-currency text-error font-weight-bold text-h6">
                          {{ formatINR(calculations.taxOptionA) }}
                        </span>
                      </template>
                    </v-list-item>
                  </v-list>
                </v-card-text>
              </v-card>
            </v-col>

            <!-- Option B: 20% with CII -->
            <v-col cols="12" md="6">
              <v-card
                :variant="calculations.betterOption === 'B' ? 'elevated' : 'outlined'"
                :color="calculations.betterOption === 'B' ? 'success' : undefined"
                :class="calculations.betterOption === 'B' ? 'border-success' : ''"
              >
                <v-card-title class="d-flex align-center">
                  <span :class="calculations.betterOption === 'B' ? 'text-success' : ''">
                    Option B: 20% with Indexation
                  </span>
                  <v-chip
                    v-if="calculations.betterOption === 'B'"
                    class="ml-2"
                    size="small"
                    color="success"
                  >
                    BETTER
                  </v-chip>
                </v-card-title>
                <v-card-text>
                  <v-list density="compact" class="bg-transparent">
                    <v-list-item>
                      <v-list-item-title>Sale Price</v-list-item-title>
                      <template #append>
                        <span class="text-currency">{{ formatINR(calculations.salePrice) }}</span>
                      </template>
                    </v-list-item>
                    <v-list-item>
                      <v-list-item-title>
                        Indexed Cost
                        <v-tooltip location="top">
                          <template #activator="{ props }">
                            <v-icon v-bind="props" size="small" class="ml-1">mdi-information</v-icon>
                          </template>
                          <div>
                            {{ formatINR(calculations.purchasePrice) }} × {{ calculations.saleCII }} / {{ calculations.purchaseCII }}
                            <br />
                            = {{ formatINR(calculations.indexedCost) }}
                          </div>
                        </v-tooltip>
                      </v-list-item-title>
                      <template #append>
                        <span class="text-currency">- {{ formatINR(calculations.indexedCost) }}</span>
                      </template>
                    </v-list-item>
                    <v-list-item v-if="calculations.expenses > 0">
                      <v-list-item-title>Expenses</v-list-item-title>
                      <template #append>
                        <span class="text-currency">- {{ formatINR(calculations.expenses) }}</span>
                      </template>
                    </v-list-item>
                    <v-divider class="my-2" />
                    <v-list-item>
                      <v-list-item-title class="font-weight-bold">Indexed Capital Gain</v-list-item-title>
                      <template #append>
                        <span class="text-currency font-weight-bold">
                          {{ formatINR(calculations.gainWithIndexation) }}
                        </span>
                      </template>
                    </v-list-item>
                    <v-list-item>
                      <v-list-item-title>Tax @ 20%</v-list-item-title>
                      <template #append>
                        <span class="text-currency text-error font-weight-bold text-h6">
                          {{ formatINR(calculations.taxOptionB) }}
                        </span>
                      </template>
                    </v-list-item>
                  </v-list>
                  <div class="text-caption text-medium-emphasis mt-2">
                    CII: {{ purchaseFY }} = {{ calculations.purchaseCII }}, {{ saleFY }} = {{ calculations.saleCII }}
                  </div>
                </v-card-text>
              </v-card>
            </v-col>
          </v-row>

          <!-- Savings Summary -->
          <v-alert
            :type="calculations.betterOption === 'A' ? 'success' : 'success'"
            variant="tonal"
            class="mt-4"
          >
            <div class="d-flex align-center">
              <v-icon class="mr-2">mdi-piggy-bank</v-icon>
              <div>
                <strong>
                  You save {{ formatINR(calculations.savings) }} ({{ calculations.savingsPercent }}%)
                  with Option {{ calculations.betterOption }}
                </strong>
                <div class="text-body-2">
                  <template v-if="calculations.betterOption === 'A'">
                    The 12.5% flat rate is better because the property appreciated significantly
                    and indexation benefit doesn't offset the higher 20% rate.
                  </template>
                  <template v-else>
                    The 20% with indexation is better because the CII adjustment reduces
                    your taxable gain substantially.
                  </template>
                </div>
              </div>
            </div>
          </v-alert>
        </div>
      </v-expand-transition>
    </v-card-text>
  </v-card>
</template>

<style scoped>
.border-success {
  border: 2px solid rgb(var(--v-theme-success)) !important;
}
</style>
