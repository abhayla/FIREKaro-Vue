<script setup lang="ts">
import { ref, computed } from "vue";
import { formatINRCompact, formatINR } from "@/composables/useInvestments";

const props = defineProps<{
  financialYear: string;
}>();

const emit = defineEmits<{
  (e: "add-deposit"): void;
}>();

// Edit mode state
const isEditMode = ref(false);
const hasUnsavedChanges = ref(false);

// PPF Config
const PPF_CONFIG = {
  MAX_DEPOSIT: 150000,
  MIN_DEPOSIT: 500,
};

// Mock PPF transaction/deposit data - in real app, this would come from API
interface PPFYearlyRecord {
  financialYear: string;
  openingBalance: number;
  deposits: number;
  interestEarned: number;
  closingBalance: number;
  depositCount: number;
}

const mockYearlyData = ref<PPFYearlyRecord[]>([
  { financialYear: "2018-19", openingBalance: 0, deposits: 150000, interestEarned: 5325, closingBalance: 155325, depositCount: 12 },
  { financialYear: "2019-20", openingBalance: 155325, deposits: 150000, interestEarned: 16503, closingBalance: 321828, depositCount: 12 },
  { financialYear: "2020-21", openingBalance: 321828, deposits: 150000, interestEarned: 28640, closingBalance: 500468, depositCount: 12 },
  { financialYear: "2021-22", openingBalance: 500468, deposits: 150000, interestEarned: 40158, closingBalance: 690626, depositCount: 12 },
  { financialYear: "2022-23", openingBalance: 690626, deposits: 150000, interestEarned: 52274, closingBalance: 892900, depositCount: 12 },
  { financialYear: "2023-24", openingBalance: 892900, deposits: 100000, interestEarned: 57100, closingBalance: 1050000, depositCount: 8 },
  { financialYear: "2024-25", openingBalance: 1050000, deposits: 75000, interestEarned: 0, closingBalance: 1125000, depositCount: 6 },
]);

// Current FY data
const currentFYData = computed(() => {
  return mockYearlyData.value.find((r) => r.financialYear === props.financialYear);
});

// Calculate totals
const totals = computed(() => ({
  totalDeposits: mockYearlyData.value.reduce((sum, r) => sum + r.deposits, 0),
  totalInterest: mockYearlyData.value.reduce((sum, r) => sum + r.interestEarned, 0),
  currentBalance: mockYearlyData.value[mockYearlyData.value.length - 1]?.closingBalance || 0,
}));

// Remaining FY limit
const remainingFYLimit = computed(() => {
  const currentDeposits = currentFYData.value?.deposits || 0;
  return Math.max(0, PPF_CONFIG.MAX_DEPOSIT - currentDeposits);
});

// Format value for display
const formatValue = (value: number | null): string => {
  if (value === null || value === undefined) return "-";
  if (value === 0) return "-";
  return formatINRCompact(value);
};

// Enter edit mode
const enterEditMode = () => {
  isEditMode.value = true;
  hasUnsavedChanges.value = false;
};

// Cancel edit mode
const cancelEditMode = () => {
  isEditMode.value = false;
  hasUnsavedChanges.value = false;
};

// Save changes
const saveChanges = async () => {
  // TODO: Implement save logic to backend
  isEditMode.value = false;
  hasUnsavedChanges.value = false;
};
</script>

<template>
  <div class="ppf-details-tab">
    <!-- Action Bar -->
    <div class="d-flex justify-space-between align-center mb-4">
      <div class="d-flex ga-2 align-center">
        <v-btn
          color="primary"
          variant="flat"
          size="small"
          prepend-icon="mdi-plus"
          :disabled="remainingFYLimit <= 0"
          @click="emit('add-deposit')"
        >
          Add Deposit
        </v-btn>
        <v-chip
          v-if="remainingFYLimit > 0"
          color="info"
          variant="tonal"
          size="small"
        >
          FY Limit: {{ formatINR(remainingFYLimit) }} remaining
        </v-chip>
        <v-chip v-else color="success" variant="tonal" size="small">
          <v-icon icon="mdi-check" size="small" class="mr-1" />
          FY Limit Reached
        </v-chip>
      </div>

      <div class="d-flex ga-2">
        <template v-if="isEditMode">
          <v-btn color="success" variant="flat" size="small" prepend-icon="mdi-check" @click="saveChanges">
            Save
          </v-btn>
          <v-btn color="error" variant="outlined" size="small" prepend-icon="mdi-close" @click="cancelEditMode">
            Cancel
          </v-btn>
        </template>
        <template v-else>
          <v-btn color="primary" variant="tonal" size="small" prepend-icon="mdi-pencil" @click="enterEditMode">
            Edit Mode
          </v-btn>
        </template>

        <v-btn icon="mdi-download" variant="text" size="small" title="Export" />
      </div>
    </div>

    <!-- PPF Year-wise History Grid -->
    <v-card variant="outlined" class="mb-4">
      <v-card-title class="text-subtitle-1">
        <v-icon icon="mdi-history" class="mr-2" color="primary" />
        Year-wise Contribution History
      </v-card-title>
      <v-card-text class="pa-0">
        <v-table density="comfortable" hover>
          <thead>
            <tr>
              <th class="text-left">Financial Year</th>
              <th class="text-right">Opening Balance</th>
              <th class="text-right">Deposits</th>
              <th class="text-right">Interest Earned</th>
              <th class="text-right">Closing Balance</th>
              <th class="text-center">Deposit Count</th>
              <th v-if="isEditMode" class="text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="record in mockYearlyData"
              :key="record.financialYear"
              :class="{ 'bg-primary-lighten-5': record.financialYear === financialYear }"
            >
              <td>
                <span class="font-weight-medium">{{ record.financialYear }}</span>
                <v-chip
                  v-if="record.financialYear === financialYear"
                  color="primary"
                  variant="tonal"
                  size="x-small"
                  class="ml-2"
                >
                  Current
                </v-chip>
              </td>
              <td class="text-right text-currency">{{ formatValue(record.openingBalance) }}</td>
              <td class="text-right text-currency font-weight-medium text-primary">
                {{ formatValue(record.deposits) }}
              </td>
              <td class="text-right text-currency text-success">{{ formatValue(record.interestEarned) }}</td>
              <td class="text-right text-currency font-weight-bold">{{ formatValue(record.closingBalance) }}</td>
              <td class="text-center">
                <v-chip
                  :color="record.depositCount >= 12 ? 'success' : 'warning'"
                  variant="tonal"
                  size="small"
                >
                  {{ record.depositCount }}/12
                </v-chip>
              </td>
              <td v-if="isEditMode" class="text-center">
                <v-btn icon="mdi-pencil" variant="text" size="small" color="primary" />
                <v-btn icon="mdi-delete" variant="text" size="small" color="error" />
              </td>
            </tr>
          </tbody>
          <tfoot>
            <tr class="bg-grey-lighten-4">
              <td class="font-weight-bold">Total</td>
              <td class="text-right">-</td>
              <td class="text-right text-currency font-weight-bold text-primary">
                {{ formatValue(totals.totalDeposits) }}
              </td>
              <td class="text-right text-currency font-weight-bold text-success">
                {{ formatValue(totals.totalInterest) }}
              </td>
              <td class="text-right text-currency font-weight-bold">
                {{ formatValue(totals.currentBalance) }}
              </td>
              <td></td>
              <td v-if="isEditMode"></td>
            </tr>
          </tfoot>
        </v-table>
      </v-card-text>
    </v-card>

    <!-- Current FY Monthly Deposits (if available) -->
    <v-card variant="outlined" class="mb-4">
      <v-card-title class="text-subtitle-1">
        <v-icon icon="mdi-calendar-month" class="mr-2" color="success" />
        FY {{ financialYear }} Monthly Deposits
      </v-card-title>
      <v-card-text>
        <v-row>
          <v-col v-for="month in 12" :key="month" cols="6" sm="4" md="3" lg="2">
            <v-card
              variant="outlined"
              class="pa-3 text-center"
              :class="month <= (currentFYData?.depositCount || 0) ? 'border-success' : ''"
            >
              <div class="text-caption text-medium-emphasis">
                {{ ["Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec", "Jan", "Feb", "Mar"][month - 1] }}
              </div>
              <div
                v-if="month <= (currentFYData?.depositCount || 0)"
                class="text-body-2 font-weight-medium text-success"
              >
                {{ formatINRCompact(12500) }}
              </div>
              <div v-else class="text-body-2 text-medium-emphasis">-</div>
              <v-icon
                v-if="month <= (currentFYData?.depositCount || 0)"
                icon="mdi-check-circle"
                size="small"
                color="success"
                class="mt-1"
              />
            </v-card>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <!-- Summary Cards -->
    <v-card variant="outlined">
      <v-card-title class="text-subtitle-1">
        <v-icon icon="mdi-chart-box" class="mr-2" color="primary" />
        Account Summary
      </v-card-title>
      <v-card-text>
        <v-row>
          <v-col cols="6" md="3">
            <div class="text-caption text-medium-emphasis">Total Deposits</div>
            <div class="text-h6 font-weight-bold text-primary">
              {{ formatINRCompact(totals.totalDeposits) }}
            </div>
            <div class="text-caption text-medium-emphasis">Since opening</div>
          </v-col>
          <v-col cols="6" md="3">
            <div class="text-caption text-medium-emphasis">Total Interest</div>
            <div class="text-h6 font-weight-bold text-success">
              {{ formatINRCompact(totals.totalInterest) }}
            </div>
            <div class="text-caption text-success">Tax-free</div>
          </v-col>
          <v-col cols="6" md="3">
            <div class="text-caption text-medium-emphasis">Current Balance</div>
            <div class="text-h6 font-weight-bold">
              {{ formatINRCompact(totals.currentBalance) }}
            </div>
            <div class="text-caption text-medium-emphasis">As of today</div>
          </v-col>
          <v-col cols="6" md="3">
            <div class="text-caption text-medium-emphasis">Return Rate</div>
            <div class="text-h6 font-weight-bold text-success">
              {{ ((totals.totalInterest / totals.totalDeposits) * 100).toFixed(1) }}%
            </div>
            <div class="text-caption text-medium-emphasis">Absolute return</div>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <!-- Info Alert -->
    <v-alert type="info" variant="tonal" density="compact" class="mt-4">
      <div class="text-body-2">
        <strong>Tip:</strong> PPF interest is calculated on minimum balance between 5th and end of each month.
        Deposit before 5th to maximize interest for that month.
      </div>
    </v-alert>
  </div>
</template>

<style scoped>
.ppf-details-tab {
  width: 100%;
}

.text-currency {
  font-family: "Roboto Mono", monospace;
}

.border-success {
  border-color: rgb(var(--v-theme-success)) !important;
}
</style>
