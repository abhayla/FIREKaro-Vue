<script setup lang="ts">
import { ref, computed } from "vue";
import { formatINR } from "@/composables/useIncome";

// Step tracking
const currentStep = ref(1);
const totalSteps = 3;

// Form data
const commissionAmount = ref<number>(0);
const isRegularCommission = ref<boolean | null>(null);
const commissionSource = ref("");
const tdsDeducted = ref<number>(0);

// Commission classification results
const classification = computed(() => {
  if (isRegularCommission.value === null) return null;

  if (isRegularCommission.value) {
    // Regular commission = Business income under 44AD
    return {
      category: "business",
      section: "44AD",
      itrForm: "ITR-4",
      profitRate: 0.05, // 5% for commission agents
      deemedProfit: commissionAmount.value * 0.05,
      taxBasis: "Deemed profit @ 5% of gross commission",
      benefits: [
        "No need to maintain books of accounts",
        "No audit required (if under limits)",
        "Simplified ITR-4 filing",
        "Flat 5% deemed profit rate",
      ],
      limitations: [
        "Cannot claim actual expenses",
        "5-year lock-in if switching to regular books",
        "Turnover limit: ₹2 Cr (₹3 Cr if digital > 95%)",
      ],
    };
  } else {
    // Occasional commission = Income from Other Sources
    return {
      category: "other",
      section: "Income from Other Sources",
      itrForm: "ITR-1/ITR-2",
      profitRate: 1, // Full amount taxable
      deemedProfit: commissionAmount.value,
      taxBasis: "Full amount taxable at slab rates",
      benefits: [
        "Can be reported in ITR-1 (if only income source)",
        "No business registration needed",
        "Simpler compliance",
      ],
      limitations: [
        "Full amount is taxable (no deductions)",
        "Cannot claim business expenses",
        "Higher tax if in higher slab",
      ],
    };
  }
});

// Estimated tax calculation (simplified)
const estimatedTax = computed(() => {
  if (!classification.value) return 0;

  const taxableAmount = classification.value.deemedProfit;

  // Simplified tax calculation (assuming 30% slab)
  // In production, this would use actual tax slabs
  if (taxableAmount <= 250000) return 0;
  if (taxableAmount <= 500000) return (taxableAmount - 250000) * 0.05;
  if (taxableAmount <= 750000)
    return 12500 + (taxableAmount - 500000) * 0.10;
  if (taxableAmount <= 1000000)
    return 37500 + (taxableAmount - 750000) * 0.15;
  if (taxableAmount <= 1250000)
    return 75000 + (taxableAmount - 1000000) * 0.20;
  if (taxableAmount <= 1500000)
    return 125000 + (taxableAmount - 1250000) * 0.25;
  return 187500 + (taxableAmount - 1500000) * 0.30;
});

function nextStep() {
  if (currentStep.value < totalSteps) {
    currentStep.value++;
  }
}

function prevStep() {
  if (currentStep.value > 1) {
    currentStep.value--;
  }
}

function reset() {
  currentStep.value = 1;
  commissionAmount.value = 0;
  isRegularCommission.value = null;
  commissionSource.value = "";
  tdsDeducted.value = 0;
}

function selectRegular(value: boolean) {
  isRegularCommission.value = value;
  nextStep();
}
</script>

<template>
  <v-card class="mb-4">
    <v-card-title class="d-flex align-center">
      <v-icon class="mr-2" color="primary">mdi-wizard-hat</v-icon>
      Commission Income Wizard
    </v-card-title>

    <v-card-text>
      <!-- Progress Indicator -->
      <v-stepper
        v-model="currentStep"
        :items="['Type', 'Details', 'Result']"
        hide-actions
        alt-labels
        flat
        class="mb-4"
      />

      <!-- Step 1: Commission Type -->
      <div v-if="currentStep === 1">
        <div class="text-h6 mb-4">Is this Regular or Occasional Commission?</div>

        <v-alert type="info" variant="tonal" density="compact" class="mb-4">
          <strong>Why it matters:</strong> Regular commission income is treated as
          Business Income (eligible for 44AD), while occasional commission is
          taxed under "Income from Other Sources".
        </v-alert>

        <v-row>
          <v-col cols="12" md="6">
            <v-card
              variant="outlined"
              class="pa-4 cursor-pointer h-100"
              :class="isRegularCommission === true ? 'border-primary bg-primary-lighten-5' : ''"
              @click="selectRegular(true)"
            >
              <div class="d-flex align-center mb-3">
                <v-avatar color="primary" size="40" class="mr-3">
                  <v-icon>mdi-calendar-repeat</v-icon>
                </v-avatar>
                <div class="text-h6">Regular Commission</div>
              </div>
              <div class="text-body-2 text-medium-emphasis mb-3">
                You receive commission on a regular/recurring basis as your
                primary or significant income source.
              </div>
              <v-list density="compact" class="bg-transparent">
                <v-list-item class="px-0">
                  <template #prepend>
                    <v-icon size="small" color="success">mdi-check</v-icon>
                  </template>
                  Insurance/Real Estate Agent
                </v-list-item>
                <v-list-item class="px-0">
                  <template #prepend>
                    <v-icon size="small" color="success">mdi-check</v-icon>
                  </template>
                  MLM/Direct Selling
                </v-list-item>
                <v-list-item class="px-0">
                  <template #prepend>
                    <v-icon size="small" color="success">mdi-check</v-icon>
                  </template>
                  Regular Affiliate Income
                </v-list-item>
              </v-list>
              <v-chip class="mt-2" color="primary" size="small">
                Taxed as Business Income
              </v-chip>
            </v-card>
          </v-col>

          <v-col cols="12" md="6">
            <v-card
              variant="outlined"
              class="pa-4 cursor-pointer h-100"
              :class="isRegularCommission === false ? 'border-secondary bg-secondary-lighten-5' : ''"
              @click="selectRegular(false)"
            >
              <div class="d-flex align-center mb-3">
                <v-avatar color="secondary" size="40" class="mr-3">
                  <v-icon>mdi-calendar-question</v-icon>
                </v-avatar>
                <div class="text-h6">Occasional Commission</div>
              </div>
              <div class="text-body-2 text-medium-emphasis mb-3">
                One-time or infrequent commission that is not your regular
                business activity.
              </div>
              <v-list density="compact" class="bg-transparent">
                <v-list-item class="px-0">
                  <template #prepend>
                    <v-icon size="small" color="success">mdi-check</v-icon>
                  </template>
                  One-time referral bonus
                </v-list-item>
                <v-list-item class="px-0">
                  <template #prepend>
                    <v-icon size="small" color="success">mdi-check</v-icon>
                  </template>
                  Occasional freelance fee
                </v-list-item>
                <v-list-item class="px-0">
                  <template #prepend>
                    <v-icon size="small" color="success">mdi-check</v-icon>
                  </template>
                  Infrequent brokerage
                </v-list-item>
              </v-list>
              <v-chip class="mt-2" color="secondary" size="small">
                Taxed as Other Income
              </v-chip>
            </v-card>
          </v-col>
        </v-row>
      </div>

      <!-- Step 2: Commission Details -->
      <div v-else-if="currentStep === 2">
        <div class="text-h6 mb-4">Enter Commission Details</div>

        <v-text-field
          v-model.number="commissionAmount"
          label="Commission Amount Received"
          type="number"
          prefix="₹"
          hint="Total commission received in the financial year"
          persistent-hint
          class="mb-4"
        />

        <v-text-field
          v-model="commissionSource"
          label="Commission Source"
          placeholder="e.g., LIC Agency, Amazon Affiliate, Real Estate"
          hint="Name of company or platform"
          persistent-hint
          class="mb-4"
        />

        <v-text-field
          v-model.number="tdsDeducted"
          label="TDS Deducted (if any)"
          type="number"
          prefix="₹"
          hint="TDS deducted at source (usually 5% u/s 194H)"
          persistent-hint
        />

        <div class="d-flex gap-2 mt-4">
          <v-btn variant="outlined" @click="prevStep">Back</v-btn>
          <v-btn
            color="primary"
            :disabled="commissionAmount <= 0"
            @click="nextStep"
          >
            See Result
          </v-btn>
        </div>
      </div>

      <!-- Step 3: Result -->
      <div v-else-if="currentStep === 3 && classification">
        <div class="text-h6 mb-4">Tax Classification Result</div>

        <!-- Classification Card -->
        <v-card
          :color="classification.category === 'business' ? 'primary' : 'secondary'"
          variant="tonal"
          class="mb-4"
        >
          <v-card-text>
            <div class="d-flex align-center mb-3">
              <v-avatar
                :color="classification.category === 'business' ? 'primary' : 'secondary'"
                size="48"
                class="mr-3"
              >
                <v-icon>
                  {{ classification.category === 'business' ? 'mdi-store' : 'mdi-cash' }}
                </v-icon>
              </v-avatar>
              <div>
                <div class="text-h5">
                  {{ classification.category === 'business' ? 'Business Income' : 'Income from Other Sources' }}
                </div>
                <div class="text-body-2">
                  {{ classification.section }} | {{ classification.itrForm }}
                </div>
              </div>
            </div>
          </v-card-text>
        </v-card>

        <!-- Calculation Summary -->
        <v-card variant="outlined" class="mb-4">
          <v-card-title class="text-body-1">Tax Calculation</v-card-title>
          <v-card-text>
            <v-table density="compact">
              <tbody>
                <tr>
                  <td>Gross Commission</td>
                  <td class="text-end text-currency">{{ formatINR(commissionAmount) }}</td>
                </tr>
                <tr v-if="classification.category === 'business'">
                  <td>Deemed Profit Rate</td>
                  <td class="text-end">{{ (classification.profitRate * 100).toFixed(0) }}%</td>
                </tr>
                <tr class="font-weight-bold">
                  <td>Taxable Amount</td>
                  <td class="text-end text-currency">{{ formatINR(classification.deemedProfit) }}</td>
                </tr>
                <tr v-if="tdsDeducted > 0">
                  <td>TDS Already Deducted</td>
                  <td class="text-end text-currency text-negative">-{{ formatINR(tdsDeducted) }}</td>
                </tr>
              </tbody>
            </v-table>
          </v-card-text>
        </v-card>

        <!-- Benefits & Limitations -->
        <v-row>
          <v-col cols="12" md="6">
            <v-card variant="outlined" color="success">
              <v-card-title class="text-body-1">
                <v-icon class="mr-1" size="small">mdi-thumb-up</v-icon>
                Benefits
              </v-card-title>
              <v-card-text>
                <v-list density="compact" class="bg-transparent">
                  <v-list-item
                    v-for="(benefit, index) in classification.benefits"
                    :key="index"
                    class="px-0"
                  >
                    <template #prepend>
                      <v-icon size="small" color="success">mdi-check-circle</v-icon>
                    </template>
                    <v-list-item-title class="text-body-2">{{ benefit }}</v-list-item-title>
                  </v-list-item>
                </v-list>
              </v-card-text>
            </v-card>
          </v-col>
          <v-col cols="12" md="6">
            <v-card variant="outlined" color="warning">
              <v-card-title class="text-body-1">
                <v-icon class="mr-1" size="small">mdi-alert</v-icon>
                Limitations
              </v-card-title>
              <v-card-text>
                <v-list density="compact" class="bg-transparent">
                  <v-list-item
                    v-for="(limitation, index) in classification.limitations"
                    :key="index"
                    class="px-0"
                  >
                    <template #prepend>
                      <v-icon size="small" color="warning">mdi-alert-circle</v-icon>
                    </template>
                    <v-list-item-title class="text-body-2">{{ limitation }}</v-list-item-title>
                  </v-list-item>
                </v-list>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>

        <!-- Action Buttons -->
        <v-alert
          :type="classification.category === 'business' ? 'info' : 'success'"
          variant="tonal"
          class="mt-4"
        >
          <template v-if="classification.category === 'business'">
            <strong>Recommended:</strong> Add this commission under
            <router-link to="/dashboard/non-salary-income/business">Business Income</router-link>
            section and select "Commission Agent" as business type.
          </template>
          <template v-else>
            <strong>Recommended:</strong> Add this as "Commission" category in
            the Other Income form below.
          </template>
        </v-alert>

        <div class="d-flex gap-2 mt-4">
          <v-btn variant="outlined" @click="prevStep">Back</v-btn>
          <v-btn variant="outlined" @click="reset">Start Over</v-btn>
        </div>
      </div>
    </v-card-text>
  </v-card>
</template>

<style scoped>
.cursor-pointer {
  cursor: pointer;
  transition: all 0.2s;
}
.cursor-pointer:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}
.border-primary {
  border-color: rgb(var(--v-theme-primary)) !important;
  border-width: 2px !important;
}
.border-secondary {
  border-color: rgb(var(--v-theme-secondary)) !important;
  border-width: 2px !important;
}
</style>
