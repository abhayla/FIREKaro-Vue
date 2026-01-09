<script setup lang="ts">
import { computed, ref } from "vue";
import { formatINR } from "@/composables/useTax";

interface AdvanceTaxEstimate {
  id: string;
  netTaxLiability: number;
  advanceTaxRequired: boolean;
  interest234B: number;
  interest234C: number;
  schedules?: Array<{
    quarter: number;
    shortfall: number;
    interest234C: number;
  }>;
}

const props = defineProps<{
  estimate: AdvanceTaxEstimate | null;
  totalPaid: number;
}>();

// What-if calculator
const whatIfAmount = ref<number>(0);
const whatIfMonth = ref<number>(new Date().getMonth() + 1);

const monthOptions = [
  { title: "April", value: 4 },
  { title: "May", value: 5 },
  { title: "June", value: 6 },
  { title: "July", value: 7 },
  { title: "August", value: 8 },
  { title: "September", value: 9 },
  { title: "October", value: 10 },
  { title: "November", value: 11 },
  { title: "December", value: 12 },
  { title: "January", value: 1 },
  { title: "February", value: 2 },
  { title: "March", value: 3 },
];

const totalInterest = computed(() => {
  return (props.estimate?.interest234B ?? 0) + (props.estimate?.interest234C ?? 0);
});

const percentagePaid = computed(() => {
  if (!props.estimate?.netTaxLiability) return 0;
  return Math.min(100, (props.totalPaid / props.estimate.netTaxLiability) * 100);
});

const is90PercentPaid = computed(() => percentagePaid.value >= 90);

// Calculate potential interest savings if additional payment is made
const potentialSavings = computed(() => {
  if (!props.estimate || whatIfAmount.value <= 0) return 0;

  const netLiability = props.estimate.netTaxLiability;
  const currentPaid = props.totalPaid;
  const newTotalPaid = currentPaid + whatIfAmount.value;

  // Simplified calculation - assuming payment in current month
  // Would reduce 234B interest if it brings total to >= 90%
  const currentPercentage = (currentPaid / netLiability) * 100;
  const newPercentage = (newTotalPaid / netLiability) * 100;

  if (currentPercentage >= 90) return 0; // Already at 90%+

  // If payment would bring us to 90%+, calculate saved interest
  if (newPercentage >= 90) {
    // Months from current month to March
    const monthsRemaining = whatIfMonth.value <= 3
      ? 4 - whatIfMonth.value
      : 16 - whatIfMonth.value; // Wrap around

    const shortfall = netLiability * 0.9 - currentPaid;
    const interestSaved = shortfall * 0.01 * monthsRemaining;
    return Math.max(0, interestSaved);
  }

  // Partial reduction
  const monthsRemaining = whatIfMonth.value <= 3
    ? 4 - whatIfMonth.value
    : 16 - whatIfMonth.value;

  return whatIfAmount.value * 0.01 * monthsRemaining;
});
</script>

<template>
  <v-card>
    <v-card-title>
      <v-icon class="mr-2">mdi-calculator-variant</v-icon>
      Interest Calculator
    </v-card-title>

    <v-card-text v-if="estimate">
      <!-- Current Status -->
      <div class="mb-4">
        <div class="text-subtitle-2 mb-2">Payment Status</div>
        <div class="d-flex align-center mb-2">
          <div class="flex-grow-1 mr-3">
            <v-progress-linear
              :model-value="percentagePaid"
              :color="is90PercentPaid ? 'success' : percentagePaid >= 75 ? 'warning' : 'error'"
              height="20"
              rounded
            >
              <template #default>
                <span class="text-caption font-weight-medium">
                  {{ percentagePaid.toFixed(1) }}%
                </span>
              </template>
            </v-progress-linear>
          </div>
          <v-chip
            :color="is90PercentPaid ? 'success' : 'warning'"
            size="small"
          >
            {{ is90PercentPaid ? 'OK' : '< 90%' }}
          </v-chip>
        </div>
        <div class="text-caption text-medium-emphasis">
          {{ formatINR(totalPaid) }} of {{ formatINR(estimate.netTaxLiability) }}
        </div>
      </div>

      <v-divider class="my-4" />

      <!-- Interest Breakdown -->
      <div class="mb-4">
        <div class="text-subtitle-2 mb-2">Interest Breakdown</div>

        <v-list density="compact" class="pa-0">
          <v-list-item class="px-0">
            <template #prepend>
              <v-icon
                :color="estimate.interest234B > 0 ? 'error' : 'success'"
                size="small"
              >
                {{ estimate.interest234B > 0 ? 'mdi-alert' : 'mdi-check' }}
              </v-icon>
            </template>
            <v-list-item-title class="text-body-2">
              Section 234B
            </v-list-item-title>
            <v-list-item-subtitle class="text-caption">
              Interest on default (if &lt;90% by Mar 31)
            </v-list-item-subtitle>
            <template #append>
              <span
                class="text-currency"
                :class="estimate.interest234B > 0 ? 'text-error' : 'text-success'"
              >
                {{ formatINR(estimate.interest234B) }}
              </span>
            </template>
          </v-list-item>

          <v-list-item class="px-0">
            <template #prepend>
              <v-icon
                :color="estimate.interest234C > 0 ? 'warning' : 'success'"
                size="small"
              >
                {{ estimate.interest234C > 0 ? 'mdi-alert' : 'mdi-check' }}
              </v-icon>
            </template>
            <v-list-item-title class="text-body-2">
              Section 234C
            </v-list-item-title>
            <v-list-item-subtitle class="text-caption">
              Interest on deferment (quarterly shortfalls)
            </v-list-item-subtitle>
            <template #append>
              <span
                class="text-currency"
                :class="estimate.interest234C > 0 ? 'text-warning' : 'text-success'"
              >
                {{ formatINR(estimate.interest234C) }}
              </span>
            </template>
          </v-list-item>

          <v-divider class="my-2" />

          <v-list-item class="px-0">
            <template #prepend>
              <v-icon color="primary" size="small">mdi-sigma</v-icon>
            </template>
            <v-list-item-title class="text-body-2 font-weight-medium">
              Total Interest
            </v-list-item-title>
            <template #append>
              <span
                class="text-currency font-weight-bold"
                :class="totalInterest > 0 ? 'text-error' : 'text-success'"
              >
                {{ formatINR(totalInterest) }}
              </span>
            </template>
          </v-list-item>
        </v-list>
      </div>

      <v-divider class="my-4" />

      <!-- What-If Calculator -->
      <div>
        <div class="text-subtitle-2 mb-2">
          <v-icon size="small" class="mr-1">mdi-lightbulb</v-icon>
          What-If Calculator
        </div>
        <div class="text-caption text-medium-emphasis mb-3">
          See how much interest you can save by making an additional payment.
        </div>

        <v-row dense>
          <v-col cols="6">
            <v-text-field
              v-model.number="whatIfAmount"
              label="Additional Payment"
              type="number"
              variant="outlined"
              density="compact"
              prefix="₹"
              hide-details
            />
          </v-col>
          <v-col cols="6">
            <v-select
              v-model="whatIfMonth"
              :items="monthOptions"
              label="Payment Month"
              variant="outlined"
              density="compact"
              hide-details
            />
          </v-col>
        </v-row>

        <v-alert
          v-if="whatIfAmount > 0"
          :type="potentialSavings > 0 ? 'success' : 'info'"
          variant="tonal"
          density="compact"
          class="mt-3"
        >
          <template v-if="potentialSavings > 0">
            <div class="text-body-2">
              You could save approximately
              <strong class="text-success">{{ formatINR(potentialSavings) }}</strong>
              in interest!
            </div>
          </template>
          <template v-else>
            <div class="text-body-2">
              This payment won't significantly reduce your interest liability.
            </div>
          </template>
        </v-alert>
      </div>
    </v-card-text>

    <v-card-text v-else class="text-center py-8">
      <v-icon icon="mdi-calculator" size="48" color="grey-lighten-1" />
      <div class="text-body-2 text-medium-emphasis mt-2">
        No estimate data available
      </div>
    </v-card-text>
  </v-card>
</template>
