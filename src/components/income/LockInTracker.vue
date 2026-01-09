<script setup lang="ts">
import { ref, computed } from "vue";

interface LockInPeriod {
  id: string;
  scheme: "44AD" | "44ADA";
  startYear: string; // FY like "2022-23"
  businessName: string;
  status: "active" | "completed" | "broken";
  brokenYear?: string;
}

// Mock data - in production this would come from the API based on business income history
const lockInPeriods = ref<LockInPeriod[]>([
  {
    id: "1",
    scheme: "44AD",
    startYear: "2022-23",
    businessName: "Freelance Consulting",
    status: "active",
  },
]);

// Add new lock-in tracking
const showAddDialog = ref(false);
const newLockIn = ref({
  scheme: "44AD" as "44AD" | "44ADA",
  startYear: "2024-25",
  businessName: "",
});

// Get current financial year
function getCurrentFY(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  // FY starts April 1
  if (month >= 3) {
    return `${year}-${(year + 1).toString().slice(2)}`;
  }
  return `${year - 1}-${year.toString().slice(2)}`;
}

const currentFY = getCurrentFY();

// Calculate year number in lock-in period (1-5)
function getYearNumber(startYear: string): number {
  const startYearNum = parseInt(startYear.split("-")[0]);
  const currentYearNum = parseInt(currentFY.split("-")[0]);
  return currentYearNum - startYearNum + 1;
}

// Calculate end year of lock-in period
function getEndYear(startYear: string): string {
  const startYearNum = parseInt(startYear.split("-")[0]);
  const endYearNum = startYearNum + 4; // 5-year period
  return `${endYearNum}-${(endYearNum + 1).toString().slice(2)}`;
}

// Generate year markers for timeline
function getYearMarkers(startYear: string): { year: string; number: number; isCurrent: boolean; isPast: boolean }[] {
  const markers = [];
  const startYearNum = parseInt(startYear.split("-")[0]);

  for (let i = 0; i < 5; i++) {
    const yearNum = startYearNum + i;
    const fy = `${yearNum}-${(yearNum + 1).toString().slice(2)}`;
    const currentYearNum = parseInt(currentFY.split("-")[0]);

    markers.push({
      year: fy,
      number: i + 1,
      isCurrent: fy === currentFY,
      isPast: yearNum < currentYearNum,
    });
  }
  return markers;
}

// Get progress percentage
function getProgress(startYear: string): number {
  const yearNum = getYearNumber(startYear);
  return Math.min(100, (yearNum / 5) * 100);
}

// Get status color
function getStatusColor(status: string): string {
  switch (status) {
    case "active":
      return "success";
    case "completed":
      return "info";
    case "broken":
      return "error";
    default:
      return "grey";
  }
}

// Get remaining years message
function getRemainingMessage(startYear: string, status: string): string {
  if (status === "completed") return "Lock-in period completed";
  if (status === "broken") return "Lock-in broken - regular books required for 5 years";

  const yearNum = getYearNumber(startYear);
  if (yearNum > 5) return "Lock-in period completed";

  const remaining = 5 - yearNum;
  const endYear = getEndYear(startYear);

  if (remaining === 0) {
    return `Final year - Stay on presumptive until FY ${endYear}`;
  }
  return `${remaining} year${remaining > 1 ? "s" : ""} remaining - Stay until FY ${endYear}`;
}

// Available FY options
const fyOptions = computed(() => {
  const currentYear = parseInt(currentFY.split("-")[0]);
  const options = [];
  for (let i = currentYear - 5; i <= currentYear; i++) {
    options.push(`${i}-${(i + 1).toString().slice(2)}`);
  }
  return options.reverse();
});

function addLockIn() {
  if (newLockIn.value.businessName && newLockIn.value.startYear) {
    lockInPeriods.value.push({
      id: Date.now().toString(),
      ...newLockIn.value,
      status: "active",
    });
    showAddDialog.value = false;
    newLockIn.value = {
      scheme: "44AD",
      startYear: "2024-25",
      businessName: "",
    };
  }
}

function markAsBroken(id: string) {
  const period = lockInPeriods.value.find((p) => p.id === id);
  if (period) {
    period.status = "broken";
    period.brokenYear = currentFY;
  }
}

function removeLockIn(id: string) {
  lockInPeriods.value = lockInPeriods.value.filter((p) => p.id !== id);
}
</script>

<template>
  <v-card class="mb-4">
    <v-card-title class="d-flex align-center">
      <v-icon class="mr-2" color="warning">mdi-lock-clock</v-icon>
      5-Year Lock-in Tracker
      <v-chip class="ml-2" size="small" color="warning" variant="tonal">
        44AD/44ADA
      </v-chip>
      <v-spacer />
      <v-btn
        color="primary"
        size="small"
        prepend-icon="mdi-plus"
        @click="showAddDialog = true"
      >
        Track Scheme
      </v-btn>
    </v-card-title>

    <v-card-text>
      <!-- Warning Banner -->
      <v-alert type="warning" variant="tonal" density="compact" class="mb-4">
        <div class="d-flex align-center">
          <v-icon class="mr-2">mdi-alert</v-icon>
          <div>
            <strong>Important:</strong> Once you opt for presumptive taxation (44AD/44ADA),
            if you switch to regular books, you <strong>cannot return</strong> to presumptive
            taxation for the next <strong>5 assessment years</strong>.
          </div>
        </div>
      </v-alert>

      <!-- Lock-in Periods -->
      <div v-if="lockInPeriods.length > 0">
        <v-expansion-panels variant="accordion">
          <v-expansion-panel
            v-for="period in lockInPeriods"
            :key="period.id"
          >
            <v-expansion-panel-title>
              <div class="d-flex align-center w-100">
                <v-chip
                  size="small"
                  :color="period.scheme === '44AD' ? 'primary' : 'secondary'"
                  class="mr-2"
                >
                  {{ period.scheme }}
                </v-chip>
                <span class="flex-grow-1">{{ period.businessName }}</span>
                <v-chip
                  size="small"
                  :color="getStatusColor(period.status)"
                  class="mr-2"
                >
                  {{ period.status === "active" ? `Year ${getYearNumber(period.startYear)} of 5` : period.status }}
                </v-chip>
                <span class="text-caption text-medium-emphasis">
                  Started FY {{ period.startYear }}
                </span>
              </div>
            </v-expansion-panel-title>

            <v-expansion-panel-text>
              <!-- Timeline Visualization -->
              <div class="mb-4">
                <div class="text-subtitle-2 mb-2">Lock-in Timeline</div>

                <!-- Progress Bar -->
                <v-progress-linear
                  :model-value="getProgress(period.startYear)"
                  :color="period.status === 'broken' ? 'error' : 'success'"
                  height="12"
                  rounded
                  class="mb-2"
                />

                <!-- Year Markers -->
                <div class="d-flex justify-space-between">
                  <div
                    v-for="marker in getYearMarkers(period.startYear)"
                    :key="marker.year"
                    class="text-center"
                    style="flex: 1"
                  >
                    <v-chip
                      :size="marker.isCurrent ? 'small' : 'x-small'"
                      :color="marker.isCurrent ? 'primary' : marker.isPast ? 'success' : 'grey'"
                      :variant="marker.isCurrent ? 'elevated' : 'tonal'"
                    >
                      {{ marker.number }}
                    </v-chip>
                    <div class="text-caption mt-1" :class="marker.isCurrent ? 'font-weight-bold' : 'text-medium-emphasis'">
                      {{ marker.year }}
                    </div>
                  </div>
                </div>
              </div>

              <!-- Status Message -->
              <v-alert
                :type="period.status === 'active' ? 'info' : period.status === 'completed' ? 'success' : 'error'"
                variant="tonal"
                density="compact"
                class="mb-3"
              >
                <div class="d-flex align-center">
                  <v-icon class="mr-2">
                    {{ period.status === 'active' ? 'mdi-timer-sand' : period.status === 'completed' ? 'mdi-check-circle' : 'mdi-alert-circle' }}
                  </v-icon>
                  <span>{{ getRemainingMessage(period.startYear, period.status) }}</span>
                </div>
              </v-alert>

              <!-- Broken Warning (if switching) -->
              <v-alert
                v-if="period.status === 'broken'"
                type="error"
                variant="tonal"
                density="compact"
                class="mb-3"
              >
                <strong>Consequence:</strong> You switched to regular books in FY {{ period.brokenYear }}.
                You must maintain books of accounts and get them audited for the next 5 years
                (until FY {{ getEndYear(period.brokenYear || currentFY) }}).
              </v-alert>

              <!-- Details -->
              <v-row>
                <v-col cols="6" md="3">
                  <div class="text-caption text-medium-emphasis">Scheme</div>
                  <div class="font-weight-medium">Section {{ period.scheme }}</div>
                </v-col>
                <v-col cols="6" md="3">
                  <div class="text-caption text-medium-emphasis">Start Year</div>
                  <div>FY {{ period.startYear }}</div>
                </v-col>
                <v-col cols="6" md="3">
                  <div class="text-caption text-medium-emphasis">End Year</div>
                  <div>FY {{ getEndYear(period.startYear) }}</div>
                </v-col>
                <v-col cols="6" md="3">
                  <div class="text-caption text-medium-emphasis">Current Year</div>
                  <div class="text-primary font-weight-medium">
                    Year {{ Math.min(5, getYearNumber(period.startYear)) }} of 5
                  </div>
                </v-col>
              </v-row>

              <!-- Actions -->
              <div class="d-flex justify-end mt-4 gap-2">
                <v-btn
                  v-if="period.status === 'active'"
                  color="warning"
                  variant="outlined"
                  size="small"
                  prepend-icon="mdi-alert"
                  @click="markAsBroken(period.id)"
                >
                  Switched to Regular Books
                </v-btn>
                <v-btn
                  color="error"
                  variant="text"
                  size="small"
                  prepend-icon="mdi-delete"
                  @click="removeLockIn(period.id)"
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
        <v-icon icon="mdi-lock-open-outline" size="48" color="grey-lighten-1" />
        <div class="text-body-1 text-medium-emphasis mt-2">
          No presumptive taxation schemes being tracked
        </div>
        <div class="text-caption text-medium-emphasis">
          Track your 44AD/44ADA commitment to avoid accidental lock-in violations
        </div>
      </div>

      <!-- Info Section -->
      <v-divider class="my-4" />

      <div class="text-subtitle-2 mb-2">
        <v-icon size="small" class="mr-1">mdi-information</v-icon>
        Understanding the 5-Year Rule
      </div>

      <v-row>
        <v-col cols="12" md="6">
          <v-card variant="outlined" density="compact">
            <v-card-text class="text-caption">
              <div class="font-weight-medium mb-1">If you stay on 44AD/44ADA:</div>
              <ul class="pl-4">
                <li>No books of accounts required</li>
                <li>No audit required (if within limits)</li>
                <li>Simplified ITR-4 filing</li>
              </ul>
            </v-card-text>
          </v-card>
        </v-col>
        <v-col cols="12" md="6">
          <v-card variant="outlined" density="compact" color="error">
            <v-card-text class="text-caption">
              <div class="font-weight-medium mb-1">If you switch to regular books:</div>
              <ul class="pl-4">
                <li>Must maintain books for 5 years</li>
                <li>Tax audit required if turnover > Rs.1 Cr</li>
                <li>Cannot return to presumptive for 5 years</li>
              </ul>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </v-card-text>

    <!-- Add Dialog -->
    <v-dialog v-model="showAddDialog" max-width="450">
      <v-card>
        <v-card-title>Track Presumptive Taxation Scheme</v-card-title>
        <v-card-text>
          <v-select
            v-model="newLockIn.scheme"
            label="Scheme"
            :items="[
              { title: 'Section 44AD - Business', value: '44AD' },
              { title: 'Section 44ADA - Profession', value: '44ADA' },
            ]"
            item-title="title"
            item-value="value"
          />
          <v-text-field
            v-model="newLockIn.businessName"
            label="Business/Profession Name"
            placeholder="e.g., Freelance Consulting"
          />
          <v-select
            v-model="newLockIn.startYear"
            label="Started Using Presumptive Taxation From"
            :items="fyOptions"
            hint="The first FY you opted for 44AD/44ADA"
            persistent-hint
          />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="showAddDialog = false">Cancel</v-btn>
          <v-btn color="primary" variant="flat" @click="addLockIn">
            Track Scheme
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-card>
</template>
