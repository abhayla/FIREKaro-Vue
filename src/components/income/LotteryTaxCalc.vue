<script setup lang="ts">
import { ref, computed } from "vue";
import { formatINR } from "@/composables/useIncome";

// Tax rates for winnings
const LOTTERY_TAX_RATE = 0.30; // 30%
const CESS_RATE = 0.04; // 4% Health & Education Cess
const SURCHARGE_THRESHOLD = 5000000; // ₹50 lakhs
const SURCHARGE_RATE = 0.10; // 10% surcharge

// Types of winnings
const WINNING_TYPES = [
  { value: "lottery", label: "Lottery", icon: "mdi-ticket" },
  { value: "game_show", label: "Game Show/Quiz", icon: "mdi-television-classic" },
  { value: "betting", label: "Betting/Gambling", icon: "mdi-dice-multiple" },
  { value: "horse_race", label: "Horse Racing", icon: "mdi-horse" },
  { value: "card_game", label: "Card Games", icon: "mdi-cards-playing" },
  { value: "crossword", label: "Crossword/Puzzle", icon: "mdi-puzzle" },
  { value: "online_gaming", label: "Online Gaming", icon: "mdi-gamepad-variant" },
];

// Form data
const winningAmount = ref<number>(0);
const winningType = ref("lottery");
const tdsAlreadyDeducted = ref<number>(0);
const showResults = ref(false);

// Tax calculation
const taxCalculation = computed(() => {
  if (winningAmount.value <= 0) return null;

  const grossWinnings = winningAmount.value;

  // Basic tax at 30%
  const basicTax = grossWinnings * LOTTERY_TAX_RATE;

  // Surcharge (if applicable for winnings > 50 lakhs)
  let surcharge = 0;
  if (grossWinnings > SURCHARGE_THRESHOLD) {
    surcharge = basicTax * SURCHARGE_RATE;
  }

  // Tax after surcharge
  const taxAfterSurcharge = basicTax + surcharge;

  // Health & Education Cess
  const cess = taxAfterSurcharge * CESS_RATE;

  // Total tax
  const totalTax = taxAfterSurcharge + cess;

  // Effective tax rate
  const effectiveRate = (totalTax / grossWinnings) * 100;

  // Net amount after tax
  const netAmount = grossWinnings - totalTax;

  // TDS status
  const expectedTDS = grossWinnings * 0.30; // TDS is 30% without surcharge/cess
  const tdsShortfall = Math.max(0, totalTax - tdsAlreadyDeducted.value);

  return {
    grossWinnings,
    basicTax,
    surcharge,
    taxAfterSurcharge,
    cess,
    totalTax,
    effectiveRate,
    netAmount,
    expectedTDS,
    tdsAlreadyDeducted: tdsAlreadyDeducted.value,
    tdsShortfall,
    hasSurcharge: grossWinnings > SURCHARGE_THRESHOLD,
  };
});

function calculate() {
  if (winningAmount.value > 0) {
    showResults.value = true;
  }
}

function reset() {
  winningAmount.value = 0;
  winningType.value = "lottery";
  tdsAlreadyDeducted.value = 0;
  showResults.value = false;
}
</script>

<template>
  <v-card class="mb-4">
    <v-card-title class="d-flex align-center">
      <v-icon class="mr-2" color="warning">mdi-cash-100</v-icon>
      Lottery & Game Show Tax Calculator
      <v-chip class="ml-2" size="small" color="error" variant="tonal">
        30% Flat
      </v-chip>
    </v-card-title>

    <v-card-text>
      <!-- Warning Banner -->
      <v-alert type="warning" variant="tonal" class="mb-4">
        <div class="d-flex align-center">
          <v-icon class="mr-2">mdi-alert</v-icon>
          <div>
            <strong>High Tax Category:</strong> Winnings from lottery, game shows,
            gambling, betting, etc. are taxed at a flat rate of <strong>30%</strong>
            (+ surcharge + cess) under Section 115BB. No deductions or exemptions allowed!
          </div>
        </div>
      </v-alert>

      <v-row>
        <v-col cols="12" md="6">
          <!-- Winning Type Selection -->
          <div class="text-subtitle-2 mb-2">Type of Winning</div>
          <v-chip-group v-model="winningType" mandatory selected-class="bg-primary">
            <v-chip
              v-for="type in WINNING_TYPES"
              :key="type.value"
              :value="type.value"
              filter
              variant="outlined"
            >
              <v-icon start size="small">{{ type.icon }}</v-icon>
              {{ type.label }}
            </v-chip>
          </v-chip-group>
        </v-col>
      </v-row>

      <v-row class="mt-4">
        <v-col cols="12" md="6">
          <v-text-field
            v-model.number="winningAmount"
            label="Gross Winning Amount"
            type="number"
            prefix="₹"
            hint="Total prize money won (before any deductions)"
            persistent-hint
          />
        </v-col>
        <v-col cols="12" md="6">
          <v-text-field
            v-model.number="tdsAlreadyDeducted"
            label="TDS Already Deducted"
            type="number"
            prefix="₹"
            hint="TDS deducted by the payer (30% under Section 194B)"
            persistent-hint
          />
        </v-col>
      </v-row>

      <div class="d-flex gap-2 mt-4">
        <v-btn color="primary" :disabled="winningAmount <= 0" @click="calculate">
          Calculate Tax
        </v-btn>
        <v-btn variant="outlined" @click="reset">Reset</v-btn>
      </div>

      <!-- Results -->
      <v-expand-transition>
        <div v-if="showResults && taxCalculation">
          <v-divider class="my-4" />

          <!-- Tax Breakdown Card -->
          <v-card variant="outlined" class="mb-4">
            <v-card-title class="text-body-1">
              <v-icon class="mr-1" size="small">mdi-calculator</v-icon>
              Tax Calculation Breakdown
            </v-card-title>
            <v-card-text>
              <v-table density="compact">
                <tbody>
                  <tr>
                    <td>Gross Winnings</td>
                    <td class="text-end text-currency font-weight-medium">
                      {{ formatINR(taxCalculation.grossWinnings) }}
                    </td>
                  </tr>
                  <tr>
                    <td>Tax @ 30%</td>
                    <td class="text-end text-currency">
                      {{ formatINR(taxCalculation.basicTax) }}
                    </td>
                  </tr>
                  <tr v-if="taxCalculation.hasSurcharge">
                    <td>
                      Surcharge @ 10%
                      <v-chip size="x-small" color="warning" class="ml-1">
                        >₹50L
                      </v-chip>
                    </td>
                    <td class="text-end text-currency">
                      {{ formatINR(taxCalculation.surcharge) }}
                    </td>
                  </tr>
                  <tr>
                    <td>Health & Education Cess @ 4%</td>
                    <td class="text-end text-currency">
                      {{ formatINR(taxCalculation.cess) }}
                    </td>
                  </tr>
                  <tr class="font-weight-bold bg-error-lighten-5">
                    <td>Total Tax Liability</td>
                    <td class="text-end text-currency text-error">
                      {{ formatINR(taxCalculation.totalTax) }}
                    </td>
                  </tr>
                  <tr class="font-weight-bold bg-success-lighten-5">
                    <td>Net Amount (After Tax)</td>
                    <td class="text-end text-currency text-success">
                      {{ formatINR(taxCalculation.netAmount) }}
                    </td>
                  </tr>
                </tbody>
              </v-table>

              <v-alert
                type="info"
                variant="tonal"
                density="compact"
                class="mt-3"
              >
                <strong>Effective Tax Rate:</strong>
                {{ taxCalculation.effectiveRate.toFixed(2) }}%
              </v-alert>
            </v-card-text>
          </v-card>

          <!-- TDS Reconciliation -->
          <v-card variant="outlined" class="mb-4">
            <v-card-title class="text-body-1">
              <v-icon class="mr-1" size="small">mdi-receipt</v-icon>
              TDS Reconciliation
            </v-card-title>
            <v-card-text>
              <v-table density="compact">
                <tbody>
                  <tr>
                    <td>Total Tax Liability</td>
                    <td class="text-end text-currency">
                      {{ formatINR(taxCalculation.totalTax) }}
                    </td>
                  </tr>
                  <tr>
                    <td>TDS Already Deducted</td>
                    <td class="text-end text-currency text-success">
                      -{{ formatINR(taxCalculation.tdsAlreadyDeducted) }}
                    </td>
                  </tr>
                  <tr class="font-weight-bold">
                    <td>
                      {{ taxCalculation.tdsShortfall > 0 ? 'Additional Tax Payable' : 'Tax Status' }}
                    </td>
                    <td
                      class="text-end text-currency"
                      :class="taxCalculation.tdsShortfall > 0 ? 'text-error' : 'text-success'"
                    >
                      {{ taxCalculation.tdsShortfall > 0 ? formatINR(taxCalculation.tdsShortfall) : 'Fully Covered' }}
                    </td>
                  </tr>
                </tbody>
              </v-table>

              <v-alert
                v-if="taxCalculation.tdsShortfall > 0"
                type="warning"
                variant="tonal"
                density="compact"
                class="mt-3"
              >
                <strong>Action Required:</strong> You need to pay
                {{ formatINR(taxCalculation.tdsShortfall) }} as self-assessment tax
                while filing ITR.
              </v-alert>

              <v-alert
                v-else-if="taxCalculation.tdsAlreadyDeducted > taxCalculation.totalTax"
                type="success"
                variant="tonal"
                density="compact"
                class="mt-3"
              >
                <strong>Refund Due:</strong> You have excess TDS of
                {{ formatINR(taxCalculation.tdsAlreadyDeducted - taxCalculation.totalTax) }}
                which will be refunded after filing ITR.
              </v-alert>
            </v-card-text>
          </v-card>

          <!-- Important Notes -->
          <v-card variant="outlined" color="info">
            <v-card-title class="text-body-1">
              <v-icon class="mr-1" size="small">mdi-information</v-icon>
              Important Points
            </v-card-title>
            <v-card-text>
              <v-list density="compact" class="bg-transparent">
                <v-list-item>
                  <template #prepend>
                    <v-icon size="small" color="error">mdi-close-circle</v-icon>
                  </template>
                  <v-list-item-title class="text-body-2">
                    No deductions (Section 80C, 80D, etc.) can be claimed against this income
                  </v-list-item-title>
                </v-list-item>
                <v-list-item>
                  <template #prepend>
                    <v-icon size="small" color="error">mdi-close-circle</v-icon>
                  </template>
                  <v-list-item-title class="text-body-2">
                    No expenses can be deducted from the winnings
                  </v-list-item-title>
                </v-list-item>
                <v-list-item>
                  <template #prepend>
                    <v-icon size="small" color="error">mdi-close-circle</v-icon>
                  </template>
                  <v-list-item-title class="text-body-2">
                    Basic exemption limit does not apply to this income
                  </v-list-item-title>
                </v-list-item>
                <v-list-item>
                  <template #prepend>
                    <v-icon size="small" color="info">mdi-information</v-icon>
                  </template>
                  <v-list-item-title class="text-body-2">
                    TDS is deducted if winnings exceed ₹10,000 (Section 194B)
                  </v-list-item-title>
                </v-list-item>
                <v-list-item>
                  <template #prepend>
                    <v-icon size="small" color="info">mdi-information</v-icon>
                  </template>
                  <v-list-item-title class="text-body-2">
                    Report under "Income from Other Sources" in ITR
                  </v-list-item-title>
                </v-list-item>
              </v-list>
            </v-card-text>
          </v-card>
        </div>
      </v-expand-transition>

      <!-- Tax Rate Reference -->
      <v-divider class="my-4" />

      <div class="text-subtitle-2 mb-2">
        <v-icon size="small" class="mr-1">mdi-percent</v-icon>
        Tax Rates Summary (Section 115BB)
      </div>

      <v-table density="compact">
        <thead>
          <tr>
            <th>Component</th>
            <th class="text-center">Rate</th>
            <th>Applicability</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Base Tax</td>
            <td class="text-center font-weight-bold">30%</td>
            <td>All winnings</td>
          </tr>
          <tr>
            <td>Surcharge</td>
            <td class="text-center">10%</td>
            <td>If winnings > ₹50 lakhs</td>
          </tr>
          <tr>
            <td>Health & Education Cess</td>
            <td class="text-center">4%</td>
            <td>On tax + surcharge</td>
          </tr>
          <tr class="font-weight-bold bg-grey-lighten-4">
            <td>Effective Rate</td>
            <td class="text-center">31.2% - 34.32%</td>
            <td>Depending on amount</td>
          </tr>
        </tbody>
      </v-table>
    </v-card-text>
  </v-card>
</template>
