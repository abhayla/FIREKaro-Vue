<script setup lang="ts">
import { ref, computed } from "vue";
import FilterCards from "@/components/shared/FilterCards.vue";
import CapitalGainsCalculator from "@/components/income/CapitalGainsCalculator.vue";
import {
  useCapitalGains,
  useAddCapitalGain,
  useUpdateCapitalGain,
  useDeleteCapitalGain,
  formatINR,
} from "@/composables/useIncome";
import { useFinancialYear } from "@/composables/useSalary";
import type { CapitalGain, CapitalGainInput } from "@/types/income";
import type { FilterCardData } from "@/components/shared/FilterCards.vue";

const { selectedFinancialYear } = useFinancialYear();

// Data
const { data: capitalGainsData, isLoading } = useCapitalGains();
const addMutation = useAddCapitalGain();
const updateMutation = useUpdateCapitalGain();
const deleteMutation = useDeleteCapitalGain();

// Form state
const showForm = ref(false);
const editingItem = ref<CapitalGain | null>(null);
const deleteDialog = ref(false);
const deletingId = ref<string | null>(null);
const selectedFilter = ref<string | null>(null);

// Filter options for asset types
const filterOptions = computed<FilterCardData[]>(() => {
  if (!capitalGainsData.value?.length) return [];
  const byType: Record<string, { count: number; amount: number }> = {};
  for (const cg of capitalGainsData.value) {
    if (!byType[cg.assetType]) {
      byType[cg.assetType] = { count: 0, amount: 0 };
    }
    byType[cg.assetType].count++;
    byType[cg.assetType].amount += cg.taxableGain;
  }
  return Object.entries(byType).map(([type, data]) => ({
    id: type,
    label: getAssetTypeLabel(type),
    count: data.count,
    amount: data.amount,
    icon: getAssetTypeIcon(type),
    color: getAssetTypeColor(type),
  }));
});

// Filtered data based on selected filter
const filteredData = computed(() => {
  if (!capitalGainsData.value) return [];
  if (!selectedFilter.value) return capitalGainsData.value;
  return capitalGainsData.value.filter((cg) => cg.assetType === selectedFilter.value);
});

// Table headers
const headers = [
  { title: "Asset", key: "assetName", sortable: true },
  { title: "Type", key: "assetType", sortable: true },
  { title: "Purchase", key: "purchasePrice", align: "end" as const },
  { title: "Sale", key: "salePrice", align: "end" as const },
  { title: "Holding", key: "holdingPeriodMonths", align: "center" as const },
  { title: "Gain Type", key: "gainType", align: "center" as const },
  { title: "Taxable Gain", key: "taxableGain", align: "end" as const },
  { title: "Tax", key: "estimatedTax", align: "end" as const },
  { title: "Actions", key: "actions", sortable: false, align: "center" as const },
];

function openAddForm() {
  editingItem.value = null;
  showForm.value = true;
}

function openEditForm(item: CapitalGain) {
  editingItem.value = item;
  showForm.value = true;
}

function confirmDelete(id: string) {
  deletingId.value = id;
  deleteDialog.value = true;
}

async function handleSubmit(data: CapitalGainInput) {
  if (editingItem.value) {
    await updateMutation.mutateAsync({ id: editingItem.value.id, data });
  } else {
    await addMutation.mutateAsync(data);
  }
  showForm.value = false;
  editingItem.value = null;
}

async function handleDelete() {
  if (deletingId.value) {
    await deleteMutation.mutateAsync(deletingId.value);
    deleteDialog.value = false;
    deletingId.value = null;
  }
}

function getAssetTypeLabel(type: string) {
  switch (type) {
    case "equity":
      return "Equity";
    case "debt_mf":
      return "Debt MF";
    case "property":
      return "Property";
    case "gold":
      return "Gold";
    case "crypto":
      return "Crypto";
    default:
      return "Other";
  }
}

function getAssetTypeColor(type: string) {
  switch (type) {
    case "equity":
      return "primary";
    case "debt_mf":
      return "info";
    case "property":
      return "secondary";
    case "gold":
      return "warning";
    case "crypto":
      return "purple";
    default:
      return "grey";
  }
}

function getAssetTypeIcon(type: string) {
  switch (type) {
    case "equity":
      return "mdi-chart-line";
    case "debt_mf":
      return "mdi-bank";
    case "property":
      return "mdi-home";
    case "gold":
      return "mdi-gold";
    case "crypto":
      return "mdi-bitcoin";
    default:
      return "mdi-cash";
  }
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}
</script>

<template>
  <div class="capital-gains-details-tab">
    <!-- Action Bar -->
    <div class="d-flex justify-space-between align-center mb-4">
      <div class="text-h6">
        Capital Gains Transactions
        <v-chip class="ml-2" size="small" color="success">
          {{ selectedFinancialYear }}
        </v-chip>
      </div>
      <v-btn color="primary" prepend-icon="mdi-plus" @click="openAddForm">
        Add Transaction
      </v-btn>
    </div>

    <!-- Filter Cards -->
    <FilterCards
      v-if="capitalGainsData && capitalGainsData.length > 0"
      :filters="filterOptions"
      v-model="selectedFilter"
      :show-all="true"
      all-label="All Types"
      class="mb-6"
    />

    <!-- Data Table -->
    <v-card variant="outlined">
      <v-data-table
        :headers="headers"
        :items="filteredData"
        :loading="isLoading"
        :items-per-page="10"
        hover
      >
        <template #item.assetType="{ item }">
          <v-chip
            size="small"
            :color="getAssetTypeColor(item.assetType)"
            variant="tonal"
          >
            {{ getAssetTypeLabel(item.assetType) }}
          </v-chip>
        </template>

        <template #item.purchasePrice="{ item }">
          <div>
            <span class="text-currency">{{ formatINR(item.purchasePrice) }}</span>
            <div class="text-caption text-medium-emphasis">
              {{ formatDate(item.purchaseDate) }}
            </div>
          </div>
        </template>

        <template #item.salePrice="{ item }">
          <div>
            <span class="text-currency">{{ formatINR(item.salePrice) }}</span>
            <div class="text-caption text-medium-emphasis">
              {{ formatDate(item.saleDate) }}
            </div>
          </div>
        </template>

        <template #item.holdingPeriodMonths="{ item }">
          {{ item.holdingPeriodMonths }} mo
        </template>

        <template #item.gainType="{ item }">
          <v-chip
            size="small"
            :color="item.gainType === 'LTCG' ? 'success' : 'warning'"
          >
            {{ item.gainType }}
          </v-chip>
        </template>

        <template #item.taxableGain="{ item }">
          <span
            class="text-currency font-weight-medium"
            :class="item.taxableGain >= 0 ? 'text-positive' : 'text-negative'"
          >
            {{ formatINR(item.taxableGain) }}
          </span>
        </template>

        <template #item.estimatedTax="{ item }">
          <span class="text-currency text-negative">
            {{ formatINR(item.estimatedTax) }}
          </span>
        </template>

        <template #item.actions="{ item }">
          <v-btn
            icon="mdi-pencil"
            size="small"
            variant="text"
            @click="openEditForm(item)"
          >
            <v-icon size="small">mdi-pencil</v-icon>
            <v-tooltip activator="parent" location="top">Edit</v-tooltip>
          </v-btn>
          <v-btn
            icon="mdi-delete"
            size="small"
            variant="text"
            color="error"
            @click="confirmDelete(item.id)"
          >
            <v-icon size="small">mdi-delete</v-icon>
            <v-tooltip activator="parent" location="top">Delete</v-tooltip>
          </v-btn>
        </template>

        <template #no-data>
          <div class="text-center py-8">
            <v-icon icon="mdi-chart-line" size="64" color="grey-lighten-1" />
            <div class="text-body-1 text-medium-emphasis mt-4">
              No capital gains transactions recorded
            </div>
            <v-btn color="primary" class="mt-4" @click="openAddForm">
              Add Transaction
            </v-btn>
          </div>
        </template>
      </v-data-table>
    </v-card>

    <!-- Form Dialog -->
    <CapitalGainsCalculator
      v-model="showForm"
      :edit-item="editingItem"
      @submit="handleSubmit"
    />

    <!-- Delete Confirmation -->
    <v-dialog v-model="deleteDialog" max-width="400">
      <v-card>
        <v-card-title>Delete Transaction?</v-card-title>
        <v-card-text>
          Are you sure you want to delete this capital gains transaction? This
          action cannot be undone.
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="deleteDialog = false">Cancel</v-btn>
          <v-btn color="error" variant="flat" @click="handleDelete">Delete</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<style scoped>
.capital-gains-details-tab {
  width: 100%;
}

.text-currency {
  font-family: "Roboto Mono", monospace;
}

.text-positive {
  color: rgb(var(--v-theme-success));
}

.text-negative {
  color: rgb(var(--v-theme-error));
}
</style>
