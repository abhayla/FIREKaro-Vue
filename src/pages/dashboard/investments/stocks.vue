<script setup lang="ts">
import { ref } from "vue";
import SectionHeader from "@/components/shared/SectionHeader.vue";
import FinancialYearSelector from "@/components/shared/FinancialYearSelector.vue";
import StocksOverviewTab from "@/components/investments/tabs/StocksOverviewTab.vue";
import StocksDetailsTab from "@/components/investments/tabs/StocksDetailsTab.vue";
import AssetForm from "@/components/investments/AssetForm.vue";
import { useFinancialYear } from "@/composables/useSalary";
import { useCreateInvestment, type StockHolding, type Investment } from "@/composables/useInvestments";

// Active tab state
const activeTab = ref("overview");

// Financial year selection
const { selectedFinancialYear, setFinancialYear } = useFinancialYear();

// Mutations
const createInvestment = useCreateInvestment();

// Dialog state
const showAddDialog = ref(false);
const editingStock = ref<StockHolding | null>(null);

// Handle add stock
const handleAddStock = () => {
  editingStock.value = null;
  showAddDialog.value = true;
};

// Handle edit stock
const handleEditStock = (stock: StockHolding) => {
  editingStock.value = stock;
  showAddDialog.value = true;
};

// Handle save stock
const handleSaveStock = async (data: Partial<Investment>) => {
  await createInvestment.mutateAsync({ ...data, type: "stock" } as any);
  showAddDialog.value = false;
  editingStock.value = null;
};
</script>

<template>
  <div>
    <SectionHeader
      title="Investments"
      subtitle="Stock Holdings"
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
        <StocksOverviewTab
          :financial-year="selectedFinancialYear"
          @go-to-details="activeTab = 'details'"
          @add-stock="handleAddStock"
        />
      </v-window-item>

      <v-window-item value="details">
        <StocksDetailsTab
          :financial-year="selectedFinancialYear"
          @add-stock="handleAddStock"
          @edit-stock="handleEditStock"
        />
      </v-window-item>
    </v-window>

    <!-- Add/Edit Stock Dialog -->
    <AssetForm
      v-model="showAddDialog"
      :asset="editingStock as any"
      :is-editing="!!editingStock"
      @save="handleSaveStock"
    />
  </div>
</template>
