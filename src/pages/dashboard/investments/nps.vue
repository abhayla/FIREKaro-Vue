<script setup lang="ts">
import { ref } from "vue";
import SectionHeader from "@/components/shared/SectionHeader.vue";
import FinancialYearSelector from "@/components/shared/FinancialYearSelector.vue";
import NPSOverviewTab from "@/components/investments/tabs/NPSOverviewTab.vue";
import NPSDetailsTab from "@/components/investments/tabs/NPSDetailsTab.vue";
import { useFinancialYear } from "@/composables/useSalary";
import { useNPS, useUpdateNPS, type NPSData } from "@/composables/useInvestments";

// Active tab state
const activeTab = ref("overview");

// Financial year selection
const { selectedFinancialYear, setFinancialYear } = useFinancialYear();

// Data fetching
const updateNPS = useUpdateNPS();

// Dialog state
const showContributionDialog = ref(false);

// Contribution form data
const contributionForm = ref({
  type: "employee" as "employee" | "employer" | "voluntary",
  tier: "1" as "1" | "2",
  amount: 0,
  date: new Date().toISOString().substring(0, 10),
  reference: "",
});

// Handle NPS update
const handleNPSUpdate = async (data: Partial<NPSData>) => {
  await updateNPS.mutateAsync(data);
};

// Handle add contribution
const handleAddContribution = () => {
  showContributionDialog.value = true;
};

// Save contribution
const saveContribution = async () => {
  // Here you would call the API to save the contribution
  console.log("Saving contribution:", contributionForm.value);
  showContributionDialog.value = false;
  // Reset form
  contributionForm.value = {
    type: "employee",
    tier: "1",
    amount: 0,
    date: new Date().toISOString().substring(0, 10),
    reference: "",
  };
};
</script>

<template>
  <div>
    <SectionHeader
      title="Investments"
      subtitle="National Pension System"
      icon="mdi-chart-line"
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
        <NPSOverviewTab
          :financial-year="selectedFinancialYear"
          @go-to-details="activeTab = 'details'"
        />
      </v-window-item>

      <v-window-item value="details">
        <NPSDetailsTab
          :financial-year="selectedFinancialYear"
          @add-contribution="handleAddContribution"
        />
      </v-window-item>
    </v-window>

    <!-- Add Contribution Dialog -->
    <v-dialog v-model="showContributionDialog" max-width="500">
      <v-card>
        <v-card-title class="d-flex align-center">
          <v-icon icon="mdi-plus" class="mr-2" color="primary" />
          Add NPS Contribution
        </v-card-title>
        <v-card-text>
          <v-form @submit.prevent="saveContribution">
            <v-select
              v-model="contributionForm.type"
              :items="[
                { title: 'Employee Contribution', value: 'employee' },
                { title: 'Employer Contribution', value: 'employer' },
                { title: 'Voluntary Contribution', value: 'voluntary' },
              ]"
              label="Contribution Type"
              variant="outlined"
              class="mb-3"
            />

            <v-btn-toggle
              v-model="contributionForm.tier"
              mandatory
              color="primary"
              class="mb-4 w-100"
            >
              <v-btn value="1" class="flex-grow-1">
                <v-icon icon="mdi-numeric-1-circle" class="mr-1" />
                Tier I
              </v-btn>
              <v-btn value="2" class="flex-grow-1" :disabled="contributionForm.type === 'employer'">
                <v-icon icon="mdi-numeric-2-circle" class="mr-1" />
                Tier II
              </v-btn>
            </v-btn-toggle>

            <v-text-field
              v-model.number="contributionForm.amount"
              label="Amount"
              type="number"
              prefix="₹"
              variant="outlined"
              class="mb-3"
              :rules="[(v: number) => v > 0 || 'Amount must be greater than 0']"
            />

            <v-text-field
              v-model="contributionForm.date"
              label="Contribution Date"
              type="date"
              variant="outlined"
              class="mb-3"
            />

            <v-text-field
              v-model="contributionForm.reference"
              label="Reference Number"
              variant="outlined"
              placeholder="NPS/2024/XXXXX"
              hint="Optional transaction reference"
              persistent-hint
            />
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="showContributionDialog = false">Cancel</v-btn>
          <v-btn color="primary" variant="flat" @click="saveContribution">
            Add Contribution
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>
