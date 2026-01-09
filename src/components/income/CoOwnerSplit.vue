<script setup lang="ts">
import { ref, computed, watch } from "vue";
import { formatINR } from "@/composables/useIncome";

interface CoOwner {
  id: string;
  name: string;
  pan: string;
  ownershipPercent: number;
  isMainOwner: boolean;
}

interface PropertySplit {
  grossRent: number;
  municipalTax: number;
  standardDeduction: number;
  loanInterest: number;
  preConstructionInterest: number;
}

// Form data
const propertyName = ref("");
const coOwners = ref<CoOwner[]>([
  { id: "1", name: "", pan: "", ownershipPercent: 100, isMainOwner: true },
]);
const propertySplit = ref<PropertySplit>({
  grossRent: 0,
  municipalTax: 0,
  standardDeduction: 0,
  loanInterest: 0,
  preConstructionInterest: 0,
});

const showResults = ref(false);

// Validate ownership totals to 100%
const totalOwnership = computed(() =>
  coOwners.value.reduce((sum, o) => sum + o.ownershipPercent, 0)
);

const ownershipValid = computed(() => Math.abs(totalOwnership.value - 100) < 0.01);

// Calculate NAV
const netAnnualValue = computed(() => {
  const nav = propertySplit.value.grossRent - propertySplit.value.municipalTax;
  return Math.max(0, nav);
});

// Calculate standard deduction (30% of NAV)
const calculatedStandardDeduction = computed(() => {
  return Math.round(netAnnualValue.value * 0.3);
});

// Auto-update standard deduction
watch(netAnnualValue, (nav) => {
  propertySplit.value.standardDeduction = Math.round(nav * 0.3);
});

// Total deductions
const totalDeductions = computed(() => {
  return (
    propertySplit.value.standardDeduction +
    propertySplit.value.loanInterest +
    propertySplit.value.preConstructionInterest
  );
});

// Net taxable income
const netTaxableIncome = computed(() => {
  return netAnnualValue.value - totalDeductions.value;
});

// Calculate per-owner breakdown
const ownerBreakdown = computed(() => {
  return coOwners.value.map((owner) => {
    const percent = owner.ownershipPercent / 100;
    return {
      ...owner,
      grossRent: Math.round(propertySplit.value.grossRent * percent),
      municipalTax: Math.round(propertySplit.value.municipalTax * percent),
      nav: Math.round(netAnnualValue.value * percent),
      standardDeduction: Math.round(propertySplit.value.standardDeduction * percent),
      loanInterest: Math.round(propertySplit.value.loanInterest * percent),
      preConstructionInterest: Math.round(propertySplit.value.preConstructionInterest * percent),
      totalDeductions: Math.round(totalDeductions.value * percent),
      taxableIncome: Math.round(netTaxableIncome.value * percent),
    };
  });
});

function addCoOwner() {
  coOwners.value.push({
    id: Date.now().toString(),
    name: "",
    pan: "",
    ownershipPercent: 0,
    isMainOwner: false,
  });
}

function removeCoOwner(id: string) {
  if (coOwners.value.length > 1) {
    coOwners.value = coOwners.value.filter((o) => o.id !== id);
  }
}

function calculateSplit() {
  if (ownershipValid.value && propertySplit.value.grossRent > 0) {
    showResults.value = true;
  }
}

function reset() {
  propertyName.value = "";
  coOwners.value = [
    { id: "1", name: "", pan: "", ownershipPercent: 100, isMainOwner: true },
  ];
  propertySplit.value = {
    grossRent: 0,
    municipalTax: 0,
    standardDeduction: 0,
    loanInterest: 0,
    preConstructionInterest: 0,
  };
  showResults.value = false;
}
</script>

<template>
  <v-card class="mb-4">
    <v-card-title class="d-flex align-center">
      <v-icon class="mr-2" color="secondary">mdi-account-group</v-icon>
      Co-Owner Deduction Split Calculator
    </v-card-title>

    <v-card-text>
      <!-- Info Alert -->
      <v-alert type="info" variant="tonal" density="compact" class="mb-4">
        <div class="d-flex align-center">
          <v-icon class="mr-2">mdi-information</v-icon>
          <div>
            When a property has multiple co-owners, rental income and deductions are
            split based on <strong>ownership percentage</strong>. Each co-owner reports
            their share in their individual ITR.
          </div>
        </div>
      </v-alert>

      <!-- Property Details -->
      <v-text-field
        v-model="propertyName"
        label="Property Name"
        placeholder="e.g., 3BHK Flat, Indiranagar"
        class="mb-4"
      />

      <!-- Co-Owners Section -->
      <div class="text-subtitle-2 mb-2">Co-Owners</div>
      <v-card
        v-for="(owner, index) in coOwners"
        :key="owner.id"
        variant="outlined"
        class="mb-3 pa-3"
      >
        <v-row align="center">
          <v-col cols="12" sm="4">
            <v-text-field
              v-model="owner.name"
              :label="`Owner ${index + 1} Name`"
              density="compact"
              hide-details
            />
          </v-col>
          <v-col cols="12" sm="3">
            <v-text-field
              v-model="owner.pan"
              label="PAN"
              density="compact"
              hide-details
              placeholder="AAAAA0000A"
              :rules="[(v: string) => /^[A-Z]{5}[0-9]{4}[A-Z]$/.test(v) || !v || 'Invalid PAN']"
            />
          </v-col>
          <v-col cols="8" sm="3">
            <v-text-field
              v-model.number="owner.ownershipPercent"
              label="Ownership %"
              type="number"
              density="compact"
              hide-details
              suffix="%"
              :min="0"
              :max="100"
            />
          </v-col>
          <v-col cols="4" sm="2" class="text-right">
            <v-btn
              v-if="coOwners.length > 1"
              icon="mdi-delete"
              size="small"
              color="error"
              variant="text"
              @click="removeCoOwner(owner.id)"
            />
          </v-col>
        </v-row>
      </v-card>

      <!-- Add Co-Owner Button -->
      <v-btn
        variant="outlined"
        size="small"
        prepend-icon="mdi-plus"
        class="mb-4"
        @click="addCoOwner"
      >
        Add Co-Owner
      </v-btn>

      <!-- Ownership Validation -->
      <v-alert
        :type="ownershipValid ? 'success' : 'error'"
        variant="tonal"
        density="compact"
        class="mb-4"
      >
        <template #prepend>
          <v-icon :icon="ownershipValid ? 'mdi-check-circle' : 'mdi-alert-circle'" />
        </template>
        Total Ownership: {{ totalOwnership.toFixed(1) }}%
        <span v-if="!ownershipValid" class="ml-2">(must equal 100%)</span>
      </v-alert>

      <v-divider class="my-4" />

      <!-- Income & Deduction Inputs -->
      <div class="text-subtitle-2 mb-2">Property Income & Deductions</div>
      <v-row>
        <v-col cols="12" md="6">
          <v-text-field
            v-model.number="propertySplit.grossRent"
            label="Gross Annual Rent Received"
            type="number"
            prefix="₹"
            hint="Total rent received in the year"
            persistent-hint
          />
        </v-col>
        <v-col cols="12" md="6">
          <v-text-field
            v-model.number="propertySplit.municipalTax"
            label="Municipal Taxes Paid"
            type="number"
            prefix="₹"
            hint="Property tax, water tax, etc."
            persistent-hint
          />
        </v-col>
        <v-col cols="12" md="6">
          <v-text-field
            v-model.number="propertySplit.standardDeduction"
            label="Standard Deduction (30% of NAV)"
            type="number"
            prefix="₹"
            hint="Auto-calculated as 30% of NAV"
            persistent-hint
            readonly
            bg-color="grey-lighten-4"
          />
        </v-col>
        <v-col cols="12" md="6">
          <v-text-field
            v-model.number="propertySplit.loanInterest"
            label="Housing Loan Interest"
            type="number"
            prefix="₹"
            hint="Interest paid on home loan"
            persistent-hint
          />
        </v-col>
        <v-col cols="12" md="6">
          <v-text-field
            v-model.number="propertySplit.preConstructionInterest"
            label="Pre-Construction Interest (1/5th)"
            type="number"
            prefix="₹"
            hint="This year's share of pre-construction interest"
            persistent-hint
          />
        </v-col>
      </v-row>

      <!-- Calculate Button -->
      <div class="d-flex gap-2 mt-4">
        <v-btn
          color="primary"
          :disabled="!ownershipValid || propertySplit.grossRent <= 0"
          @click="calculateSplit"
        >
          Calculate Split
        </v-btn>
        <v-btn variant="outlined" @click="reset">Reset</v-btn>
      </div>

      <!-- Results -->
      <v-expand-transition>
        <div v-if="showResults" class="mt-6">
          <v-divider class="mb-4" />

          <!-- Summary Card -->
          <v-card variant="tonal" color="primary" class="mb-4">
            <v-card-text>
              <v-row>
                <v-col cols="6" md="3" class="text-center">
                  <div class="text-h6 text-currency">{{ formatINR(propertySplit.grossRent) }}</div>
                  <div class="text-caption">Gross Rent</div>
                </v-col>
                <v-col cols="6" md="3" class="text-center">
                  <div class="text-h6 text-currency">{{ formatINR(netAnnualValue) }}</div>
                  <div class="text-caption">Net Annual Value</div>
                </v-col>
                <v-col cols="6" md="3" class="text-center">
                  <div class="text-h6 text-currency text-negative">-{{ formatINR(totalDeductions) }}</div>
                  <div class="text-caption">Total Deductions</div>
                </v-col>
                <v-col cols="6" md="3" class="text-center">
                  <div class="text-h6 text-currency" :class="netTaxableIncome >= 0 ? 'text-positive' : 'text-negative'">
                    {{ formatINR(netTaxableIncome) }}
                  </div>
                  <div class="text-caption">Net Taxable Income</div>
                </v-col>
              </v-row>
            </v-card-text>
          </v-card>

          <!-- Per-Owner Breakdown -->
          <div class="text-subtitle-2 mb-2">Per-Owner Tax Summary</div>
          <v-table density="compact">
            <thead>
              <tr>
                <th>Co-Owner</th>
                <th class="text-center">Share</th>
                <th class="text-end">Gross Rent</th>
                <th class="text-end">NAV</th>
                <th class="text-end">Deductions</th>
                <th class="text-end">Taxable Income</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="owner in ownerBreakdown" :key="owner.id">
                <td>
                  <div>{{ owner.name || 'Unnamed' }}</div>
                  <div class="text-caption text-medium-emphasis">{{ owner.pan || 'No PAN' }}</div>
                </td>
                <td class="text-center">
                  <v-chip size="small" color="primary" variant="tonal">
                    {{ owner.ownershipPercent }}%
                  </v-chip>
                </td>
                <td class="text-end text-currency">{{ formatINR(owner.grossRent) }}</td>
                <td class="text-end text-currency">{{ formatINR(owner.nav) }}</td>
                <td class="text-end text-currency text-negative">-{{ formatINR(owner.totalDeductions) }}</td>
                <td class="text-end text-currency font-weight-medium" :class="owner.taxableIncome >= 0 ? 'text-positive' : 'text-negative'">
                  {{ formatINR(owner.taxableIncome) }}
                </td>
              </tr>
            </tbody>
          </v-table>

          <!-- Detailed Breakdown -->
          <v-expansion-panels class="mt-4" variant="accordion">
            <v-expansion-panel
              v-for="owner in ownerBreakdown"
              :key="owner.id"
            >
              <v-expansion-panel-title>
                <v-icon class="mr-2">mdi-account</v-icon>
                {{ owner.name || 'Unnamed' }} - Detailed Breakdown
              </v-expansion-panel-title>
              <v-expansion-panel-text>
                <v-table density="compact">
                  <tbody>
                    <tr>
                      <td>Gross Annual Rent ({{ owner.ownershipPercent }}%)</td>
                      <td class="text-end text-currency">{{ formatINR(owner.grossRent) }}</td>
                    </tr>
                    <tr>
                      <td>Less: Municipal Taxes</td>
                      <td class="text-end text-currency text-negative">-{{ formatINR(owner.municipalTax) }}</td>
                    </tr>
                    <tr class="font-weight-medium">
                      <td>Net Annual Value (NAV)</td>
                      <td class="text-end text-currency">{{ formatINR(owner.nav) }}</td>
                    </tr>
                    <tr>
                      <td>Less: Standard Deduction (30%)</td>
                      <td class="text-end text-currency text-negative">-{{ formatINR(owner.standardDeduction) }}</td>
                    </tr>
                    <tr>
                      <td>Less: Housing Loan Interest</td>
                      <td class="text-end text-currency text-negative">-{{ formatINR(owner.loanInterest) }}</td>
                    </tr>
                    <tr v-if="owner.preConstructionInterest > 0">
                      <td>Less: Pre-Construction Interest</td>
                      <td class="text-end text-currency text-negative">-{{ formatINR(owner.preConstructionInterest) }}</td>
                    </tr>
                    <tr class="font-weight-bold bg-grey-lighten-4">
                      <td>Income from House Property</td>
                      <td class="text-end text-currency" :class="owner.taxableIncome >= 0 ? 'text-positive' : 'text-negative'">
                        {{ formatINR(owner.taxableIncome) }}
                      </td>
                    </tr>
                  </tbody>
                </v-table>

                <v-alert
                  v-if="owner.taxableIncome < 0"
                  type="info"
                  variant="tonal"
                  density="compact"
                  class="mt-3"
                >
                  <strong>Loss from House Property:</strong>
                  Up to ₹2,00,000 can be set off against other income.
                  Balance can be carried forward for 8 years.
                </v-alert>
              </v-expansion-panel-text>
            </v-expansion-panel>
          </v-expansion-panels>
        </div>
      </v-expand-transition>
    </v-card-text>
  </v-card>
</template>
