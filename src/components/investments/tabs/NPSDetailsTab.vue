<script setup lang="ts">
import { ref, computed } from "vue";
import InvestmentMonthlyGrid from "@/components/investments/shared/InvestmentMonthlyGrid.vue";
import { useNPS, formatINR, formatINRCompact, type NPSData } from "@/composables/useInvestments";
import { getCalendarMonthYear } from "@/composables/useSalary";

const props = defineProps<{
  financialYear: string;
}>();

const emit = defineEmits<{
  (e: "add-contribution"): void;
}>();

// Data fetching
const { data: npsData, isLoading } = useNPS();

// Mock data for demo
const mockNPSData: NPSData = {
  pranNumber: "PRAN1234567890",
  tier1Balance: 580000,
  tier2Balance: 120000,
  totalContributions: 480000,
  totalReturns: 220000,
  assetAllocation: {
    equityE: 50,
    corporateBondC: 30,
    governmentBondG: 15,
    alternativeA: 5,
  },
  pensionFundManager: "SBI Pension Fund",
  investmentChoice: "active",
  lastUpdated: "2024-12-20",
};

// Use real data or mock
const nps = computed(() => npsData.value ?? mockNPSData);

// Edit mode
const isEditMode = ref(false);

// Month names for the financial year
const monthNames = ["Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec", "Jan", "Feb", "Mar"];

// Generate mock monthly data for the grid
const generateMockMonthlyData = () => {
  const monthlyContribution = 5000;
  const employerContribution = 3000;
  const data: Record<string, number[]> = {
    tier1Employee: [],
    tier1Employer: [],
    tier2: [],
    total: [],
    runningBalance: [],
  };

  let runningBalance = 500000; // Starting balance

  for (let i = 0; i < 12; i++) {
    const tier1Employee = i < 8 ? monthlyContribution : 0;
    const tier1Employer = i < 8 ? employerContribution : 0;
    const tier2 = i < 8 ? 2000 : 0;
    const total = tier1Employee + tier1Employer + tier2;

    data.tier1Employee.push(tier1Employee);
    data.tier1Employer.push(tier1Employer);
    data.tier2.push(tier2);
    data.total.push(total);

    if (total > 0) {
      runningBalance += total + runningBalance * 0.008; // Approximate monthly growth
    }
    data.runningBalance.push(Math.round(runningBalance));
  }

  return data;
};

const monthlyData = ref(generateMockMonthlyData());

// Grid sections configuration (matching InvestmentMonthlyGrid interface)
const gridSections = computed(() => [
  {
    title: "Tier I Contributions",
    icon: "mdi-account-cash",
    iconColor: "orange",
    rows: [
      {
        code: "tier1Employee",
        label: "Employee Contribution",
        type: "currency" as const,
        values: monthlyData.value.tier1Employee,
        total: monthlyData.value.tier1Employee.reduce((a, b) => a + b, 0),
        editable: true,
        color: "primary" as const,
      },
      {
        code: "tier1Employer",
        label: "Employer Contribution",
        type: "currency" as const,
        values: monthlyData.value.tier1Employer,
        total: monthlyData.value.tier1Employer.reduce((a, b) => a + b, 0),
        editable: true,
        color: "info" as const,
      },
      {
        code: "tier1Total",
        label: "Tier I Total",
        type: "currency" as const,
        values: monthlyData.value.tier1Employee.map(
          (val, idx) => val + monthlyData.value.tier1Employer[idx]
        ),
        total: monthlyData.value.tier1Employee.reduce((a, b) => a + b, 0) +
          monthlyData.value.tier1Employer.reduce((a, b) => a + b, 0),
        isSummary: true,
        color: "warning" as const,
      },
    ],
  },
  {
    title: "Tier II Contributions",
    icon: "mdi-hand-coin",
    iconColor: "teal",
    rows: [
      {
        code: "tier2",
        label: "Tier II (Voluntary)",
        type: "currency" as const,
        values: monthlyData.value.tier2,
        total: monthlyData.value.tier2.reduce((a, b) => a + b, 0),
        editable: true,
        color: "success" as const,
      },
    ],
  },
]);

// Calculate FY totals
const fyTotals = computed(() => ({
  tier1Employee: monthlyData.value.tier1Employee.reduce((a, b) => a + b, 0),
  tier1Employer: monthlyData.value.tier1Employer.reduce((a, b) => a + b, 0),
  tier2: monthlyData.value.tier2.reduce((a, b) => a + b, 0),
  total: monthlyData.value.total.reduce((a, b) => a + b, 0),
  closingBalance: monthlyData.value.runningBalance[11] || 0,
}));

// Handle cell updates
const handleCellUpdate = (payload: { code: string; monthIndex: number; value: number }) => {
  const { code, monthIndex, value } = payload;

  if (code === "tier1Employee" || code === "tier1Employer" || code === "tier2") {
    monthlyData.value[code][monthIndex] = value;

    // Recalculate totals and running balance
    let runningBalance =
      monthIndex === 0
        ? 500000
        : monthlyData.value.runningBalance[monthIndex - 1];

    for (let i = monthIndex; i < 12; i++) {
      const total =
        monthlyData.value.tier1Employee[i] +
        monthlyData.value.tier1Employer[i] +
        monthlyData.value.tier2[i];

      monthlyData.value.total[i] = total;

      if (total > 0) {
        runningBalance += total + runningBalance * 0.008;
      }
      monthlyData.value.runningBalance[i] = Math.round(runningBalance);
    }
  }
};

// Toggle edit mode
const toggleEditMode = () => {
  isEditMode.value = !isEditMode.value;
};

// Save changes
const saveChanges = () => {
  // Here you would typically call an API to save the data
  console.log("Saving NPS data:", monthlyData.value);
  isEditMode.value = false;
};
</script>

<template>
  <div class="nps-details-tab">
    <!-- Loading State -->
    <template v-if="isLoading">
      <v-skeleton-loader type="table" />
    </template>

    <template v-else>
      <!-- Action Bar -->
      <v-card variant="outlined" class="mb-4">
        <v-card-text class="d-flex align-center justify-space-between flex-wrap gap-3">
          <div class="d-flex align-center gap-3">
            <v-chip color="primary" variant="tonal">
              <v-icon icon="mdi-card-account-details" class="mr-1" />
              PRAN: {{ nps.pranNumber }}
            </v-chip>
            <v-chip color="orange" variant="tonal">
              <v-icon icon="mdi-bank" class="mr-1" />
              {{ nps.pensionFundManager }}
            </v-chip>
          </div>

          <div class="d-flex gap-2">
            <v-btn
              v-if="!isEditMode"
              color="primary"
              variant="tonal"
              prepend-icon="mdi-pencil"
              @click="toggleEditMode"
            >
              Edit
            </v-btn>
            <template v-else>
              <v-btn variant="outlined" @click="toggleEditMode"> Cancel </v-btn>
              <v-btn color="primary" variant="flat" prepend-icon="mdi-content-save" @click="saveChanges">
                Save
              </v-btn>
            </template>
            <v-btn color="success" variant="flat" prepend-icon="mdi-plus" @click="emit('add-contribution')">
              Add Contribution
            </v-btn>
          </div>
        </v-card-text>
      </v-card>

      <!-- Monthly Grid -->
      <InvestmentMonthlyGrid
        :financial-year="financialYear"
        :sections="gridSections"
        :readonly="!isEditMode"
        @update="handleCellUpdate"
      />

      <!-- FY Summary Card -->
      <v-card variant="outlined" class="mt-4">
        <v-card-title class="text-subtitle-1">
          <v-icon icon="mdi-sigma" class="mr-2" color="primary" />
          FY {{ financialYear }} Summary
        </v-card-title>
        <v-card-text>
          <v-row>
            <v-col cols="12" md="2">
              <v-card color="primary" variant="tonal" class="pa-3 text-center">
                <div class="text-caption">Employee (Tier I)</div>
                <div class="text-h6 font-weight-bold">
                  {{ formatINRCompact(fyTotals.tier1Employee) }}
                </div>
              </v-card>
            </v-col>
            <v-col cols="12" md="2">
              <v-card color="info" variant="tonal" class="pa-3 text-center">
                <div class="text-caption">Employer (Tier I)</div>
                <div class="text-h6 font-weight-bold">
                  {{ formatINRCompact(fyTotals.tier1Employer) }}
                </div>
              </v-card>
            </v-col>
            <v-col cols="12" md="2">
              <v-card color="teal" variant="tonal" class="pa-3 text-center">
                <div class="text-caption">Tier II</div>
                <div class="text-h6 font-weight-bold">
                  {{ formatINRCompact(fyTotals.tier2) }}
                </div>
              </v-card>
            </v-col>
            <v-col cols="12" md="3">
              <v-card color="success" variant="tonal" class="pa-3 text-center">
                <div class="text-caption">Total FY Contribution</div>
                <div class="text-h6 font-weight-bold">
                  {{ formatINRCompact(fyTotals.total) }}
                </div>
              </v-card>
            </v-col>
            <v-col cols="12" md="3">
              <v-card color="warning" variant="tonal" class="pa-3 text-center">
                <div class="text-caption">Closing Balance</div>
                <div class="text-h6 font-weight-bold">
                  {{ formatINRCompact(fyTotals.closingBalance) }}
                </div>
              </v-card>
            </v-col>
          </v-row>

          <!-- Tax Benefits -->
          <v-row class="mt-4">
            <v-col cols="12" md="6">
              <v-alert type="success" variant="tonal" density="compact">
                <div class="text-subtitle-2 font-weight-bold mb-2">80CCD(1B) Deduction</div>
                <div class="d-flex justify-space-between">
                  <span>Self-contribution eligible:</span>
                  <span class="font-weight-medium">{{ formatINR(Math.min(fyTotals.tier1Employee, 50000)) }}</span>
                </div>
                <div class="d-flex justify-space-between mt-1 text-caption">
                  <span>Max deduction limit:</span>
                  <span>₹50,000</span>
                </div>
              </v-alert>
            </v-col>
            <v-col cols="12" md="6">
              <v-alert type="info" variant="tonal" density="compact">
                <div class="text-subtitle-2 font-weight-bold mb-2">80CCD(2) - Employer Contribution</div>
                <div class="d-flex justify-space-between">
                  <span>Employer contribution:</span>
                  <span class="font-weight-medium">{{ formatINR(fyTotals.tier1Employer) }}</span>
                </div>
                <div class="d-flex justify-space-between mt-1 text-caption">
                  <span>Limit:</span>
                  <span>Up to 10% of Basic + DA</span>
                </div>
              </v-alert>
            </v-col>
          </v-row>
        </v-card-text>
      </v-card>

      <!-- Contribution History Table -->
      <v-card variant="outlined" class="mt-4">
        <v-card-title class="text-subtitle-1">
          <v-icon icon="mdi-history" class="mr-2" />
          Recent Contributions
        </v-card-title>
        <v-card-text>
          <v-table density="compact">
            <thead>
              <tr>
                <th>Date</th>
                <th>Type</th>
                <th>Tier</th>
                <th class="text-right">Amount</th>
                <th>Reference</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>15-Dec-2024</td>
                <td>Employee</td>
                <td><v-chip size="x-small" color="orange">Tier I</v-chip></td>
                <td class="text-right font-weight-medium text-currency">{{ formatINR(5000) }}</td>
                <td class="text-caption">NPS/2024/12345</td>
              </tr>
              <tr>
                <td>15-Dec-2024</td>
                <td>Employer</td>
                <td><v-chip size="x-small" color="orange">Tier I</v-chip></td>
                <td class="text-right font-weight-medium text-currency">{{ formatINR(3000) }}</td>
                <td class="text-caption">NPS/2024/12346</td>
              </tr>
              <tr>
                <td>15-Dec-2024</td>
                <td>Voluntary</td>
                <td><v-chip size="x-small" color="teal">Tier II</v-chip></td>
                <td class="text-right font-weight-medium text-currency">{{ formatINR(2000) }}</td>
                <td class="text-caption">NPS/2024/12347</td>
              </tr>
              <tr>
                <td>15-Nov-2024</td>
                <td>Employee</td>
                <td><v-chip size="x-small" color="orange">Tier I</v-chip></td>
                <td class="text-right font-weight-medium text-currency">{{ formatINR(5000) }}</td>
                <td class="text-caption">NPS/2024/12340</td>
              </tr>
              <tr>
                <td>15-Nov-2024</td>
                <td>Employer</td>
                <td><v-chip size="x-small" color="orange">Tier I</v-chip></td>
                <td class="text-right font-weight-medium text-currency">{{ formatINR(3000) }}</td>
                <td class="text-caption">NPS/2024/12341</td>
              </tr>
            </tbody>
          </v-table>
        </v-card-text>
      </v-card>
    </template>
  </div>
</template>

<style scoped>
.text-currency {
  font-family: "Roboto Mono", monospace;
}
</style>
