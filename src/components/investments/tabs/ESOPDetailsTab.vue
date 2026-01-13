<script setup lang="ts">
import { ref, computed } from "vue";
import {
  useESOPGrants,
  useExerciseESOPGrant,
  formatINR,
  formatINRCompact,
  type ESOPGrant,
} from "@/composables/useInvestments";

const props = defineProps<{
  financialYear: string;
}>();

const emit = defineEmits<{
  (e: "add-grant"): void;
  (e: "edit-grant", grant: ESOPGrant): void;
}>();

// Data fetching
const { data: esopData, isLoading } = useESOPGrants();
const exerciseGrant = useExerciseESOPGrant();

// UI State
const searchQuery = ref("");
const showExerciseDialog = ref(false);
const selectedGrant = ref<ESOPGrant | null>(null);
const exerciseUnits = ref(0);

// Mock data for demo
const mockGrants: ESOPGrant[] = [
  {
    id: "1",
    grantType: "ESOP",
    grantDate: "2022-04-01",
    grantNumber: "ESOP-2022-001",
    companyName: "TechCorp India Pvt Ltd",
    companySymbol: undefined,
    totalUnits: 10000,
    grantPrice: 100,
    fairMarketValue: 150,
    currentFMV: 450,
    vestingScheduleType: "GRADED",
    vestingStartDate: "2022-04-01",
    cliffMonths: 12,
    totalVestingMonths: 48,
    vestingFrequency: 12,
    status: "PARTIALLY_VESTED",
    vestedUnits: 5000,
    exercisedUnits: 2000,
    exercisableUnits: 3000,
    unvestedUnits: 5000,
    forfeitedUnits: 0,
    perquisiteValue: 700000,
    taxPaid: 210000,
    isListedCompany: false,
    isStartup: true,
    planName: "ESOP 2022",
    vestingEvents: [
      {
        id: "v1",
        vestingDate: "2023-04-01",
        unitsVested: 2500,
        vestingPercentage: 25,
        fmvAtVesting: 200,
        exercisePrice: 100,
        perquisiteValue: 250000,
        isExercised: true,
        exerciseDate: "2023-06-15",
        unitsExercised: 2000,
        salePrice: 350,
        status: "EXERCISED",
      },
      {
        id: "v2",
        vestingDate: "2024-04-01",
        unitsVested: 2500,
        vestingPercentage: 25,
        fmvAtVesting: 350,
        exercisePrice: 100,
        perquisiteValue: 625000,
        isExercised: false,
        status: "VESTED",
      },
      {
        id: "v3",
        vestingDate: "2025-04-01",
        unitsVested: 2500,
        vestingPercentage: 25,
        fmvAtVesting: 450,
        exercisePrice: 100,
        perquisiteValue: 875000,
        isExercised: false,
        status: "PENDING",
      },
      {
        id: "v4",
        vestingDate: "2026-04-01",
        unitsVested: 2500,
        vestingPercentage: 25,
        fmvAtVesting: 450,
        exercisePrice: 100,
        perquisiteValue: 875000,
        isExercised: false,
        status: "PENDING",
      },
    ],
  },
  {
    id: "2",
    grantType: "RSU",
    grantDate: "2023-01-15",
    grantNumber: "RSU-2023-042",
    companyName: "Global Tech Ltd",
    companySymbol: "GTECH",
    totalUnits: 500,
    grantPrice: 0,
    fairMarketValue: 2500,
    currentFMV: 3200,
    vestingScheduleType: "CLIFF",
    vestingStartDate: "2023-01-15",
    cliffMonths: 24,
    totalVestingMonths: 24,
    vestingFrequency: 24,
    status: "ACTIVE",
    vestedUnits: 0,
    exercisedUnits: 0,
    exercisableUnits: 0,
    unvestedUnits: 500,
    forfeitedUnits: 0,
    perquisiteValue: 0,
    taxPaid: 0,
    isListedCompany: true,
    isStartup: false,
    planName: "RSU Plan 2023",
    vestingEvents: [
      {
        id: "v5",
        vestingDate: "2025-01-15",
        unitsVested: 500,
        vestingPercentage: 100,
        fmvAtVesting: 3200,
        exercisePrice: 0,
        perquisiteValue: 1600000,
        isExercised: false,
        status: "PENDING",
      },
    ],
  },
];

const grants = computed(() =>
  esopData.value?.grants?.length ? esopData.value.grants : mockGrants
);

// Filtered grants
const filteredGrants = computed(() => {
  if (!searchQuery.value) return grants.value;

  const query = searchQuery.value.toLowerCase();
  return grants.value.filter(
    (g) =>
      g.companyName.toLowerCase().includes(query) ||
      g.grantNumber?.toLowerCase().includes(query) ||
      g.grantType.toLowerCase().includes(query)
  );
});

// Summary
const summary = computed(() => ({
  totalGrants: filteredGrants.value.length,
  totalUnits: filteredGrants.value.reduce((sum, g) => sum + g.totalUnits, 0),
  exercisableUnits: filteredGrants.value.reduce((sum, g) => sum + g.exercisableUnits, 0),
  totalValue: filteredGrants.value.reduce(
    (sum, g) => sum + g.totalUnits * (g.currentFMV || g.fairMarketValue),
    0
  ),
}));

// Grant type colors
const grantTypeColor = (type: string) => {
  switch (type) {
    case "ESOP":
      return "primary";
    case "RSU":
      return "success";
    case "RSA":
      return "info";
    case "SAR":
      return "warning";
    case "PHANTOM":
      return "purple";
    default:
      return "grey";
  }
};

// Status colors
const statusColor = (status: string) => {
  switch (status) {
    case "ACTIVE":
      return "info";
    case "PARTIALLY_VESTED":
      return "warning";
    case "FULLY_VESTED":
      return "success";
    case "EXERCISED":
      return "primary";
    case "EXPIRED":
      return "error";
    case "CANCELLED":
      return "grey";
    case "FORFEITED":
      return "error";
    default:
      return "grey";
  }
};

// Vesting progress
const vestingProgress = (grant: ESOPGrant) => {
  return grant.totalUnits > 0 ? (grant.vestedUnits / grant.totalUnits) * 100 : 0;
};

// Days until next vesting
const daysUntilNextVesting = (grant: ESOPGrant) => {
  const nextEvent = grant.vestingEvents?.find((e) => e.status === "PENDING");
  if (!nextEvent) return null;
  const days = Math.ceil(
    (new Date(nextEvent.vestingDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );
  return days > 0 ? days : null;
};

// Open exercise dialog
const openExerciseDialog = (grant: ESOPGrant) => {
  selectedGrant.value = grant;
  exerciseUnits.value = grant.exercisableUnits;
  showExerciseDialog.value = true;
};

// Handle exercise
const handleExercise = async () => {
  if (!selectedGrant.value) return;
  await exerciseGrant.mutateAsync({
    grantId: selectedGrant.value.id,
    units: exerciseUnits.value,
  });
  showExerciseDialog.value = false;
};
</script>

<template>
  <div class="esop-details-tab">
    <!-- Loading State -->
    <template v-if="isLoading">
      <v-skeleton-loader type="card, card" />
    </template>

    <template v-else>
      <!-- Action Bar -->
      <v-card variant="outlined" class="mb-4">
        <v-card-text class="d-flex align-center justify-space-between flex-wrap gap-3">
          <div class="d-flex align-center gap-3">
            <v-chip color="primary" variant="tonal">
              <v-icon icon="mdi-file-document" class="mr-1" />
              {{ summary.totalGrants }} Grants
            </v-chip>
            <v-chip color="success" variant="tonal">
              <v-icon icon="mdi-currency-inr" class="mr-1" />
              {{ formatINRCompact(summary.totalValue) }}
            </v-chip>
            <v-chip v-if="summary.exercisableUnits > 0" color="warning" variant="tonal">
              <v-icon icon="mdi-hand-coin" class="mr-1" />
              {{ summary.exercisableUnits.toLocaleString() }} exercisable
            </v-chip>
          </div>

          <div class="d-flex gap-2">
            <v-text-field
              v-model="searchQuery"
              placeholder="Search grants..."
              prepend-inner-icon="mdi-magnify"
              variant="outlined"
              density="compact"
              hide-details
              style="max-width: 250px"
              clearable
            />
            <v-btn color="primary" variant="flat" prepend-icon="mdi-plus" @click="emit('add-grant')">
              Add Grant
            </v-btn>
          </div>
        </v-card-text>
      </v-card>

      <!-- Grants List -->
      <v-row>
        <v-col v-for="grant in filteredGrants" :key="grant.id" cols="12" lg="6">
          <v-card variant="outlined" class="h-100">
            <v-card-title class="d-flex align-center">
              <div>
                <div class="d-flex align-center gap-2">
                  <v-chip :color="grantTypeColor(grant.grantType)" size="small" label>
                    {{ grant.grantType }}
                  </v-chip>
                  <span class="text-h6">{{ grant.companyName }}</span>
                </div>
                <div class="text-caption text-medium-emphasis">
                  {{ grant.planName || `Grant #${grant.grantNumber}` }}
                </div>
              </div>
              <v-spacer />
              <v-chip :color="statusColor(grant.status)" size="small">
                {{ grant.status.replace("_", " ") }}
              </v-chip>
            </v-card-title>

            <v-card-text>
              <!-- Value Summary -->
              <v-row dense class="mb-3">
                <v-col cols="6">
                  <div class="text-caption text-medium-emphasis">Current Value</div>
                  <div class="text-h6 font-weight-bold text-currency">
                    {{ formatINR(grant.totalUnits * (grant.currentFMV || grant.fairMarketValue)) }}
                  </div>
                </v-col>
                <v-col cols="6">
                  <div class="text-caption text-medium-emphasis">Exercisable Value</div>
                  <div class="text-h6 font-weight-bold text-success text-currency">
                    {{ formatINR(grant.exercisableUnits * (grant.currentFMV || grant.fairMarketValue)) }}
                  </div>
                </v-col>
              </v-row>

              <!-- Vesting Progress -->
              <div class="mb-3">
                <div class="d-flex justify-space-between text-caption mb-1">
                  <span>Vesting Progress</span>
                  <span>{{ vestingProgress(grant).toFixed(0) }}%</span>
                </div>
                <v-progress-linear
                  :model-value="vestingProgress(grant)"
                  color="success"
                  height="8"
                  rounded
                />
              </div>

              <!-- Units Breakdown -->
              <v-row dense class="text-center mb-3">
                <v-col cols="3">
                  <div class="text-h6">{{ grant.totalUnits.toLocaleString() }}</div>
                  <div class="text-caption text-medium-emphasis">Total</div>
                </v-col>
                <v-col cols="3">
                  <div class="text-h6 text-success">{{ grant.vestedUnits.toLocaleString() }}</div>
                  <div class="text-caption text-medium-emphasis">Vested</div>
                </v-col>
                <v-col cols="3">
                  <div class="text-h6 text-warning">{{ grant.exercisableUnits.toLocaleString() }}</div>
                  <div class="text-caption text-medium-emphasis">Exercisable</div>
                </v-col>
                <v-col cols="3">
                  <div class="text-h6 text-info">{{ grant.unvestedUnits.toLocaleString() }}</div>
                  <div class="text-caption text-medium-emphasis">Unvested</div>
                </v-col>
              </v-row>

              <!-- Grant Details -->
              <v-divider class="my-3" />
              <div class="d-flex flex-wrap gap-2 text-caption">
                <v-chip size="x-small" variant="outlined">
                  Grant: {{ new Date(grant.grantDate).toLocaleDateString("en-IN") }}
                </v-chip>
                <v-chip v-if="grant.grantPrice > 0" size="x-small" variant="outlined">
                  Exercise: {{ formatINR(grant.grantPrice) }}
                </v-chip>
                <v-chip size="x-small" variant="outlined" color="success">
                  FMV: {{ formatINR(grant.currentFMV || grant.fairMarketValue) }}
                </v-chip>
                <v-chip
                  v-if="daysUntilNextVesting(grant)"
                  size="x-small"
                  variant="tonal"
                  color="info"
                >
                  Next vest: {{ daysUntilNextVesting(grant) }} days
                </v-chip>
                <v-chip v-if="grant.isStartup" size="x-small" color="purple" variant="tonal">
                  Startup
                </v-chip>
                <v-chip v-if="grant.isListedCompany" size="x-small" color="primary" variant="tonal">
                  Listed
                </v-chip>
              </div>

              <!-- Vesting Schedule -->
              <v-expansion-panels class="mt-4" variant="accordion">
                <v-expansion-panel>
                  <v-expansion-panel-title class="text-caption py-2">
                    <v-icon icon="mdi-calendar-clock" size="small" class="mr-2" />
                    Vesting Schedule
                  </v-expansion-panel-title>
                  <v-expansion-panel-text>
                    <v-table density="compact">
                      <thead>
                        <tr>
                          <th>Date</th>
                          <th class="text-right">Units</th>
                          <th class="text-right">FMV</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr
                          v-for="event in grant.vestingEvents"
                          :key="event.id"
                        >
                          <td class="text-caption">
                            {{ new Date(event.vestingDate).toLocaleDateString("en-IN") }}
                          </td>
                          <td class="text-right text-currency">
                            {{ event.unitsVested.toLocaleString() }}
                          </td>
                          <td class="text-right text-currency">
                            {{ formatINR(event.fmvAtVesting) }}
                          </td>
                          <td>
                            <v-chip
                              size="x-small"
                              :color="
                                event.status === 'EXERCISED'
                                  ? 'success'
                                  : event.status === 'VESTED'
                                  ? 'warning'
                                  : 'info'
                              "
                              variant="tonal"
                            >
                              {{ event.status }}
                            </v-chip>
                          </td>
                        </tr>
                      </tbody>
                    </v-table>
                  </v-expansion-panel-text>
                </v-expansion-panel>
              </v-expansion-panels>
            </v-card-text>

            <v-card-actions>
              <v-btn
                v-if="grant.exercisableUnits > 0"
                color="success"
                variant="tonal"
                @click="openExerciseDialog(grant)"
              >
                Exercise Options
              </v-btn>
              <v-spacer />
              <v-btn variant="text" size="small" icon="mdi-pencil" @click="emit('edit-grant', grant)" />
            </v-card-actions>
          </v-card>
        </v-col>
      </v-row>

      <!-- Empty State -->
      <v-card v-if="filteredGrants.length === 0" variant="outlined" class="pa-8 text-center">
        <v-icon icon="mdi-file-document-outline" size="64" color="grey" class="mb-4" />
        <h3 class="text-h6 mb-2">No grants found</h3>
        <p class="text-body-2 text-medium-emphasis mb-4">
          {{ searchQuery ? "Try a different search term" : "Add your first ESOP/RSU grant to get started" }}
        </p>
        <v-btn color="primary" variant="flat" prepend-icon="mdi-plus" @click="emit('add-grant')">
          Add Grant
        </v-btn>
      </v-card>
    </template>

    <!-- Exercise Dialog -->
    <v-dialog v-model="showExerciseDialog" max-width="500">
      <v-card v-if="selectedGrant">
        <v-card-title>Exercise Options</v-card-title>
        <v-card-text>
          <div class="mb-4">
            <div class="text-subtitle-2">{{ selectedGrant.companyName }}</div>
            <div class="text-caption text-medium-emphasis">{{ selectedGrant.planName }}</div>
          </div>

          <v-row dense class="mb-4">
            <v-col cols="6">
              <div class="text-caption text-medium-emphasis">Exercisable Units</div>
              <div class="text-h6">{{ selectedGrant.exercisableUnits.toLocaleString() }}</div>
            </v-col>
            <v-col cols="6">
              <div class="text-caption text-medium-emphasis">Exercise Price</div>
              <div class="text-h6">{{ formatINR(selectedGrant.grantPrice) }}</div>
            </v-col>
          </v-row>

          <v-text-field
            v-model.number="exerciseUnits"
            label="Units to Exercise"
            type="number"
            :max="selectedGrant.exercisableUnits"
            :rules="[
              (v: number) => v > 0 || 'Must be greater than 0',
              (v: number) => v <= selectedGrant!.exercisableUnits || 'Cannot exceed exercisable units',
            ]"
          />

          <v-alert type="info" variant="tonal" density="compact" class="mt-4">
            <div class="text-subtitle-2">Cost to Exercise</div>
            <div class="text-h6">{{ formatINR(exerciseUnits * selectedGrant.grantPrice) }}</div>
            <div class="text-caption mt-2">
              Current Value:
              {{ formatINR(exerciseUnits * (selectedGrant.currentFMV || selectedGrant.fairMarketValue)) }}
            </div>
          </v-alert>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="showExerciseDialog = false">Cancel</v-btn>
          <v-btn
            color="success"
            variant="flat"
            :loading="exerciseGrant.isPending.value"
            @click="handleExercise"
          >
            Exercise
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<style scoped>
.text-currency {
  font-family: "Roboto Mono", monospace;
}

.h-100 {
  height: 100%;
}
</style>
