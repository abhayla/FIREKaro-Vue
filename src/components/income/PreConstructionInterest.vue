<script setup lang="ts">
import { ref, computed } from "vue";
import { formatINR } from "@/composables/useIncome";

interface PreConstructionPeriod {
  id: string;
  propertyName: string;
  constructionStartDate: string;
  constructionEndDate: string;
  possessionDate: string;
  totalInterestPaid: number;
  yearlyDeduction: number; // 1/5th of total
  yearsRemaining: number;
}

// Mock data - in production from API
const preConstructionPeriods = ref<PreConstructionPeriod[]>([
  {
    id: "1",
    propertyName: "2BHK Flat, Gurgaon",
    constructionStartDate: "2020-04-01",
    constructionEndDate: "2023-03-31",
    possessionDate: "2023-04-15",
    totalInterestPaid: 850000,
    yearlyDeduction: 170000,
    yearsRemaining: 3,
  },
]);

const showAddDialog = ref(false);
const newPeriod = ref({
  propertyName: "",
  constructionStartDate: "",
  constructionEndDate: "",
  possessionDate: "",
  totalInterestPaid: 0,
});

// Get current FY
function getCurrentFY(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  if (month >= 3) {
    return `${year}-${(year + 1).toString().slice(2)}`;
  }
  return `${year - 1}-${year.toString().slice(2)}`;
}

const currentFY = getCurrentFY();

// Calculate deduction schedule
function getDeductionSchedule(period: PreConstructionPeriod) {
  const possessionYear = new Date(period.possessionDate).getFullYear();
  const possessionMonth = new Date(period.possessionDate).getMonth();
  // FY starts April
  const startFYYear = possessionMonth >= 3 ? possessionYear : possessionYear - 1;

  const schedule = [];
  for (let i = 0; i < 5; i++) {
    const fyYear = startFYYear + i;
    const fy = `${fyYear}-${(fyYear + 1).toString().slice(2)}`;
    const currentYear = parseInt(currentFY.split("-")[0]);

    schedule.push({
      year: i + 1,
      fy,
      amount: period.yearlyDeduction,
      status: fyYear < currentYear ? "claimed" : fyYear === currentYear ? "current" : "upcoming",
    });
  }
  return schedule;
}

// Calculate total remaining deduction
const totalRemainingDeduction = computed(() => {
  return preConstructionPeriods.value.reduce(
    (sum, p) => sum + p.yearlyDeduction * p.yearsRemaining,
    0
  );
});

const currentYearDeduction = computed(() => {
  return preConstructionPeriods.value.reduce((sum, p) => {
    if (p.yearsRemaining > 0) {
      return sum + p.yearlyDeduction;
    }
    return sum;
  }, 0);
});

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function calculateYearlyDeduction(): number {
  return Math.round(newPeriod.value.totalInterestPaid / 5);
}

function addPeriod() {
  if (
    newPeriod.value.propertyName &&
    newPeriod.value.possessionDate &&
    newPeriod.value.totalInterestPaid > 0
  ) {
    const possessionYear = new Date(newPeriod.value.possessionDate).getFullYear();
    const currentYear = parseInt(currentFY.split("-")[0]);
    const yearsSincePossession = currentYear - possessionYear;
    const yearsRemaining = Math.max(0, 5 - yearsSincePossession);

    preConstructionPeriods.value.push({
      id: Date.now().toString(),
      ...newPeriod.value,
      yearlyDeduction: calculateYearlyDeduction(),
      yearsRemaining,
    });

    showAddDialog.value = false;
    newPeriod.value = {
      propertyName: "",
      constructionStartDate: "",
      constructionEndDate: "",
      possessionDate: "",
      totalInterestPaid: 0,
    };
  }
}

function removePeriod(id: string) {
  preConstructionPeriods.value = preConstructionPeriods.value.filter(
    (p) => p.id !== id
  );
}
</script>

<template>
  <v-card class="mb-4">
    <v-card-title class="d-flex align-center">
      <v-icon class="mr-2" color="info">mdi-calendar-clock</v-icon>
      Pre-Construction Interest Schedule
      <v-spacer />
      <v-btn
        color="primary"
        size="small"
        prepend-icon="mdi-plus"
        @click="showAddDialog = true"
      >
        Add Period
      </v-btn>
    </v-card-title>

    <v-card-text>
      <!-- Info Alert -->
      <v-alert type="info" variant="tonal" density="compact" class="mb-4">
        <div class="d-flex align-center">
          <v-icon class="mr-2">mdi-information</v-icon>
          <div>
            <strong>Pre-Construction Interest:</strong> Interest paid on home loan during
            the construction period (from loan disbursement to possession) can be claimed
            in <strong>5 equal installments</strong> starting from the year of possession.
          </div>
        </div>
      </v-alert>

      <!-- Summary Cards -->
      <v-row class="mb-4">
        <v-col cols="12" sm="6">
          <v-card variant="tonal" color="primary">
            <v-card-text class="text-center">
              <div class="text-h5 font-weight-bold text-currency">
                {{ formatINR(currentYearDeduction) }}
              </div>
              <div class="text-body-2">Claimable This Year (FY {{ currentFY }})</div>
            </v-card-text>
          </v-card>
        </v-col>
        <v-col cols="12" sm="6">
          <v-card variant="tonal" color="info">
            <v-card-text class="text-center">
              <div class="text-h5 font-weight-bold text-currency">
                {{ formatINR(totalRemainingDeduction) }}
              </div>
              <div class="text-body-2">Total Remaining Deduction</div>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <!-- Periods List -->
      <div v-if="preConstructionPeriods.length > 0">
        <v-expansion-panels variant="accordion">
          <v-expansion-panel
            v-for="period in preConstructionPeriods"
            :key="period.id"
          >
            <v-expansion-panel-title>
              <div class="d-flex align-center w-100">
                <v-icon class="mr-2" color="primary">mdi-home-outline</v-icon>
                <span class="flex-grow-1">{{ period.propertyName }}</span>
                <v-chip
                  size="small"
                  :color="period.yearsRemaining > 0 ? 'success' : 'grey'"
                  class="mr-2"
                >
                  {{ period.yearsRemaining > 0 ? `${period.yearsRemaining} yrs left` : 'Completed' }}
                </v-chip>
                <span class="text-currency font-weight-medium">
                  {{ formatINR(period.yearlyDeduction) }}/year
                </span>
              </div>
            </v-expansion-panel-title>

            <v-expansion-panel-text>
              <!-- Period Details -->
              <v-row class="mb-4">
                <v-col cols="6" md="3">
                  <div class="text-caption text-medium-emphasis">Construction Start</div>
                  <div>{{ formatDate(period.constructionStartDate) }}</div>
                </v-col>
                <v-col cols="6" md="3">
                  <div class="text-caption text-medium-emphasis">Construction End</div>
                  <div>{{ formatDate(period.constructionEndDate) }}</div>
                </v-col>
                <v-col cols="6" md="3">
                  <div class="text-caption text-medium-emphasis">Possession Date</div>
                  <div class="text-primary font-weight-medium">
                    {{ formatDate(period.possessionDate) }}
                  </div>
                </v-col>
                <v-col cols="6" md="3">
                  <div class="text-caption text-medium-emphasis">Total Interest</div>
                  <div class="text-currency">{{ formatINR(period.totalInterestPaid) }}</div>
                </v-col>
              </v-row>

              <!-- Deduction Schedule -->
              <div class="text-subtitle-2 mb-2">5-Year Deduction Schedule</div>
              <v-table density="compact">
                <thead>
                  <tr>
                    <th>Year</th>
                    <th>Financial Year</th>
                    <th class="text-end">Deduction Amount</th>
                    <th class="text-center">Status</th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="schedule in getDeductionSchedule(period)"
                    :key="schedule.fy"
                    :class="schedule.status === 'current' ? 'bg-primary-lighten-5' : ''"
                  >
                    <td>Year {{ schedule.year }}</td>
                    <td>FY {{ schedule.fy }}</td>
                    <td class="text-end text-currency">{{ formatINR(schedule.amount) }}</td>
                    <td class="text-center">
                      <v-chip
                        size="x-small"
                        :color="
                          schedule.status === 'claimed'
                            ? 'success'
                            : schedule.status === 'current'
                              ? 'primary'
                              : 'grey'
                        "
                      >
                        {{ schedule.status === 'claimed' ? 'Claimed' : schedule.status === 'current' ? 'Current' : 'Upcoming' }}
                      </v-chip>
                    </td>
                  </tr>
                </tbody>
                <tfoot>
                  <tr class="font-weight-bold">
                    <td colspan="2">Total</td>
                    <td class="text-end text-currency">{{ formatINR(period.totalInterestPaid) }}</td>
                    <td></td>
                  </tr>
                </tfoot>
              </v-table>

              <!-- Actions -->
              <div class="d-flex justify-end mt-4">
                <v-btn
                  color="error"
                  variant="text"
                  size="small"
                  prepend-icon="mdi-delete"
                  @click="removePeriod(period.id)"
                >
                  Remove
                </v-btn>
              </div>
            </v-expansion-panel-text>
          </v-expansion-panel>
        </v-expansion-panels>
      </div>

      <!-- Empty State -->
      <div v-else class="text-center py-6">
        <v-icon icon="mdi-calendar-blank" size="48" color="grey-lighten-1" />
        <div class="text-body-1 text-medium-emphasis mt-2">
          No pre-construction periods tracked
        </div>
        <div class="text-caption text-medium-emphasis">
          Track interest paid during property construction to claim deductions
        </div>
      </div>
    </v-card-text>

    <!-- Add Dialog -->
    <v-dialog v-model="showAddDialog" max-width="500">
      <v-card>
        <v-card-title>Add Pre-Construction Interest Period</v-card-title>
        <v-card-text>
          <v-text-field
            v-model="newPeriod.propertyName"
            label="Property Name"
            placeholder="e.g., 2BHK Flat, Whitefield"
          />
          <v-row>
            <v-col cols="6">
              <v-text-field
                v-model="newPeriod.constructionStartDate"
                label="Construction Start Date"
                type="date"
                hint="When loan was first disbursed"
                persistent-hint
              />
            </v-col>
            <v-col cols="6">
              <v-text-field
                v-model="newPeriod.constructionEndDate"
                label="Construction End Date"
                type="date"
                hint="End of construction period"
                persistent-hint
              />
            </v-col>
          </v-row>
          <v-text-field
            v-model="newPeriod.possessionDate"
            label="Possession Date"
            type="date"
            hint="Date when you received possession"
            persistent-hint
          />
          <v-text-field
            v-model.number="newPeriod.totalInterestPaid"
            label="Total Interest Paid During Construction"
            type="number"
            prefix="₹"
            hint="Total interest from construction start to end"
            persistent-hint
          />
          <v-alert
            v-if="newPeriod.totalInterestPaid > 0"
            type="info"
            variant="tonal"
            density="compact"
            class="mt-3"
          >
            <strong>Yearly Deduction:</strong>
            {{ formatINR(calculateYearlyDeduction()) }} per year for 5 years
          </v-alert>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="showAddDialog = false">Cancel</v-btn>
          <v-btn color="primary" variant="flat" @click="addPeriod">
            Add Period
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-card>
</template>
