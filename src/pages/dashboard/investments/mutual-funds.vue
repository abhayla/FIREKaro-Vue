<script setup lang="ts">
import { ref } from "vue";
import SectionHeader from "@/components/shared/SectionHeader.vue";
import FinancialYearSelector from "@/components/shared/FinancialYearSelector.vue";
import MutualFundsOverviewTab from "@/components/investments/tabs/MutualFundsOverviewTab.vue";
import MutualFundsDetailsTab from "@/components/investments/tabs/MutualFundsDetailsTab.vue";
import AssetForm from "@/components/investments/AssetForm.vue";
import { useFinancialYear } from "@/composables/useSalary";
import { useCreateInvestment, type MutualFund, type Investment } from "@/composables/useInvestments";

// Active tab state
const activeTab = ref("overview");

// Financial year selection
const { selectedFinancialYear, setFinancialYear } = useFinancialYear();

// Mutations
const createInvestment = useCreateInvestment();

// Dialog state
const showAddDialog = ref(false);
const editingFund = ref<MutualFund | null>(null);

// Handle add fund
const handleAddFund = () => {
  editingFund.value = null;
  showAddDialog.value = true;
};

// Handle edit fund
const handleEditFund = (fund: MutualFund) => {
  editingFund.value = fund;
  showAddDialog.value = true;
};

// Handle save fund
const handleSaveFund = async (data: Partial<Investment>) => {
  await createInvestment.mutateAsync({ ...data, type: "mutual_fund" } as any);
  showAddDialog.value = false;
  editingFund.value = null;
};
</script>

<template>
  <div>
    <SectionHeader
      title="Investments"
      subtitle="Mutual Fund Holdings"
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
        <MutualFundsOverviewTab
          :financial-year="selectedFinancialYear"
          @go-to-details="activeTab = 'details'"
          @add-fund="handleAddFund"
        />
      </v-window-item>

      <v-window-item value="details">
        <MutualFundsDetailsTab
          :financial-year="selectedFinancialYear"
          @add-fund="handleAddFund"
          @edit-fund="handleEditFund"
        />
      </v-window-item>
    </v-window>

    <!-- Add/Edit Fund Dialog -->
    <AssetForm
      v-model="showAddDialog"
      :asset="editingFund as any"
      :is-editing="!!editingFund"
      @save="handleSaveFund"
    />
  </div>
</template>
