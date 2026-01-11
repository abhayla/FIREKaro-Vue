<script setup lang="ts">
import { ref } from "vue";
import SectionHeader from "@/components/shared/SectionHeader.vue";
import FinancialYearSelector from "@/components/shared/FinancialYearSelector.vue";
import ESOPOverviewTab from "@/components/investments/tabs/ESOPOverviewTab.vue";
import ESOPDetailsTab from "@/components/investments/tabs/ESOPDetailsTab.vue";
import { useFinancialYear } from "@/composables/useSalary";
import {
  useCreateESOPGrant,
  useExerciseESOPGrant,
  type ESOPGrant,
} from "@/composables/useInvestments";

const tabs = [
  { title: "Portfolio", route: "/dashboard/investments" },
  { title: "Stocks", route: "/dashboard/investments/stocks" },
  { title: "Mutual Funds", route: "/dashboard/investments/mutual-funds" },
  { title: "EPF", route: "/dashboard/investments/epf" },
  { title: "PPF", route: "/dashboard/investments/ppf" },
  { title: "NPS", route: "/dashboard/investments/nps" },
  { title: "ESOPs", route: "/dashboard/investments/esop" },
  { title: "Property", route: "/dashboard/investments/property" },
  { title: "Reports", route: "/dashboard/investments/reports" },
];

// Active tab state
const activeTab = ref("overview");

// Financial year selection
const { selectedFinancialYear, setFinancialYear } = useFinancialYear();

// Mutations
const createGrant = useCreateESOPGrant();
const exerciseGrant = useExerciseESOPGrant();

// Dialog state
const showAddDialog = ref(false);
const showExerciseDialog = ref(false);
const selectedGrant = ref<ESOPGrant | null>(null);
const exerciseUnits = ref(0);

// Handle add grant
const handleAddGrant = () => {
  showAddDialog.value = true;
};

// Handle exercise
const handleExercise = (grant: ESOPGrant) => {
  selectedGrant.value = grant;
  exerciseUnits.value = grant.exercisableUnits;
  showExerciseDialog.value = true;
};

// Confirm exercise
const confirmExercise = async () => {
  if (!selectedGrant.value) return;
  try {
    await exerciseGrant.mutateAsync({
      grantId: selectedGrant.value.id,
      units: exerciseUnits.value,
    });
    showExerciseDialog.value = false;
    selectedGrant.value = null;
  } catch (err) {
    console.error("Failed to exercise:", err);
  }
};

// Format INR
const formatINR = (value: number) => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
};
</script>

<template>
  <div>
    <SectionHeader
      title="Investments"
      subtitle="ESOPs & RSUs"
      icon="mdi-chart-line"
      :tabs="tabs"
    />

    <!-- Tab Navigation and FY Selector -->
    <div class="d-flex justify-space-between align-center mb-4 flex-wrap gap-3">
      <v-tabs v-model="activeTab" color="primary" density="compact">
        <v-tab value="overview">Overview</v-tab>
        <v-tab value="details">Item Details</v-tab>
      </v-tabs>

      <FinancialYearSelector v-model="selectedFinancialYear" :dense="true" />
    </div>

    <!-- Tab Content -->
    <v-window v-model="activeTab">
      <v-window-item value="overview">
        <ESOPOverviewTab
          :financial-year="selectedFinancialYear"
          @go-to-details="activeTab = 'details'"
          @add-grant="handleAddGrant"
        />
      </v-window-item>

      <v-window-item value="details">
        <ESOPDetailsTab
          :financial-year="selectedFinancialYear"
          @add-grant="handleAddGrant"
          @edit-grant="handleExercise"
        />
      </v-window-item>
    </v-window>

    <!-- Add Grant Dialog -->
    <v-dialog v-model="showAddDialog" max-width="600" persistent>
      <v-card>
        <v-card-title class="d-flex align-center">
          <v-icon icon="mdi-plus-circle" class="mr-2" />
          Add ESOP/RSU Grant
        </v-card-title>
        <v-card-text>
          <v-alert type="info" variant="tonal">
            Grant form will be implemented here. For now, grants can be added via the API.
          </v-alert>
        </v-card-text>
        <v-card-actions class="pa-4">
          <v-spacer />
          <v-btn variant="text" @click="showAddDialog = false">Close</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Exercise Dialog -->
    <v-dialog v-model="showExerciseDialog" max-width="500" persistent>
      <v-card v-if="selectedGrant">
        <v-card-title class="d-flex align-center">
          <v-icon icon="mdi-hand-coin" class="mr-2" />
          Exercise Options
        </v-card-title>
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
            variant="outlined"
            density="comfortable"
            :max="selectedGrant.exercisableUnits"
            :rules="[
              (v: number) => v > 0 || 'Must be greater than 0',
              (v: number) => v <= selectedGrant!.exercisableUnits || 'Cannot exceed exercisable units',
            ]"
          />

          <v-alert type="info" variant="tonal" density="compact" class="mt-4">
            <div class="text-subtitle-2">Cost to Exercise</div>
            <div class="text-h6 text-currency">
              {{ formatINR(exerciseUnits * selectedGrant.grantPrice) }}
            </div>
            <div class="text-caption mt-2">
              Current Value: {{ formatINR(exerciseUnits * (selectedGrant.currentFMV || selectedGrant.fairMarketValue)) }}
            </div>
          </v-alert>
        </v-card-text>
        <v-card-actions class="pa-4">
          <v-spacer />
          <v-btn variant="text" @click="showExerciseDialog = false">Cancel</v-btn>
          <v-btn
            color="success"
            variant="flat"
            :loading="exerciseGrant.isPending.value"
            @click="confirmExercise"
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
</style>
