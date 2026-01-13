<script setup lang="ts">
import { ref, computed } from "vue";
import FilterCards from "@/components/shared/FilterCards.vue";
import DividendIncomeForm from "@/components/income/DividendIncomeForm.vue";
import {
  useDividendIncomeAPI,
  useAddDividendIncome,
  useUpdateDividendIncome,
  useDeleteDividendIncome,
  formatINR,
} from "@/composables/useIncome";
import { useFinancialYear } from "@/composables/useSalary";
import type { DividendIncome, DividendIncomeInput } from "@/types/income";
import type { FilterCardData } from "@/components/shared/FilterCards.vue";

const { selectedFinancialYear } = useFinancialYear();

// Data
const { data: dividendData, isLoading } = useDividendIncomeAPI();
const addMutation = useAddDividendIncome();
const updateMutation = useUpdateDividendIncome();
const deleteMutation = useDeleteDividendIncome();

// Form state
const showForm = ref(false);
const editingItem = ref<DividendIncome | null>(null);
const deleteDialog = ref(false);
const deletingId = ref<string | null>(null);
const selectedFilter = ref<string | null>(null);

// Summary and records from API
const summary = computed(() => dividendData.value?.summary);
const records = computed(() => dividendData.value?.records || []);

// Filter options for source types
const filterOptions = computed<FilterCardData[]>(() => {
  if (!summary.value?.bySourceType?.length) return [];
  return summary.value.bySourceType.map((s) => ({
    id: s.type,
    label: getSourceTypeLabel(s.type),
    count: s.count,
    amount: s.dividend,
    icon: getSourceTypeIcon(s.type),
    color: getSourceTypeColor(s.type),
  }));
});

// Filtered data based on selected filter
const filteredData = computed(() => {
  if (!records.value) return [];
  if (!selectedFilter.value) return records.value;
  return records.value.filter((r) => r.sourceType === selectedFilter.value);
});

// Table headers
const headers = [
  { title: "Company/Fund", key: "companyOrFundName", sortable: true },
  { title: "Type", key: "sourceType", sortable: true },
  { title: "Symbol", key: "symbol" },
  { title: "Payment Date", key: "paymentDate", sortable: true },
  { title: "Amount", key: "dividendAmount", align: "end" as const },
  { title: "TDS", key: "tdsDeducted", align: "end" as const },
  { title: "Yield", key: "dividendYield", align: "end" as const },
  { title: "Actions", key: "actions", sortable: false, align: "center" as const },
];

function openAddForm() {
  editingItem.value = null;
  showForm.value = true;
}

function openEditForm(item: DividendIncome) {
  editingItem.value = item;
  showForm.value = true;
}

function confirmDelete(id: string) {
  deletingId.value = id;
  deleteDialog.value = true;
}

async function handleSubmit(data: DividendIncomeInput) {
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

function getSourceTypeLabel(type: string) {
  const labels: Record<string, string> = {
    STOCK: "Stock",
    MUTUAL_FUND: "Mutual Fund",
    REIT: "REIT",
    INVIT: "InvIT",
  };
  return labels[type] || type;
}

function getSourceTypeColor(type: string) {
  const colors: Record<string, string> = {
    STOCK: "primary",
    MUTUAL_FUND: "success",
    REIT: "info",
    INVIT: "secondary",
  };
  return colors[type] || "grey";
}

function getSourceTypeIcon(type: string) {
  const icons: Record<string, string> = {
    STOCK: "mdi-chart-line",
    MUTUAL_FUND: "mdi-bank",
    REIT: "mdi-home-city",
    INVIT: "mdi-office-building",
  };
  return icons[type] || "mdi-cash";
}

function formatDate(dateStr: string | null | undefined) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatPercent(value: number | null | undefined) {
  if (value === null || value === undefined) return "—";
  return `${value.toFixed(2)}%`;
}
</script>

<template>
  <div class="dividend-details-tab">
    <!-- Action Bar -->
    <div class="d-flex justify-space-between align-center mb-4">
      <div class="text-h6">
        Dividend Records
        <v-chip class="ml-2" size="small" color="primary">
          {{ selectedFinancialYear }}
        </v-chip>
        <span class="ml-2 text-body-2 text-medium-emphasis">
          {{ summary?.recordCount || 0 }} records
        </span>
      </div>
      <v-btn color="primary" prepend-icon="mdi-plus" @click="openAddForm">
        Add Dividend
      </v-btn>
    </div>

    <!-- Filter Cards -->
    <FilterCards
      v-if="records && records.length > 0"
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
        <template #item.sourceType="{ item }">
          <v-chip size="small" :color="getSourceTypeColor(item.sourceType)" variant="tonal">
            {{ getSourceTypeLabel(item.sourceType) }}
          </v-chip>
        </template>

        <template #item.symbol="{ item }">
          <span class="font-weight-medium">{{ item.symbol || "—" }}</span>
        </template>

        <template #item.paymentDate="{ item }">
          <span>{{ formatDate(item.paymentDate) }}</span>
        </template>

        <template #item.dividendAmount="{ item }">
          <span class="text-currency text-positive font-weight-medium">
            {{ formatINR(item.dividendAmount) }}
          </span>
        </template>

        <template #item.tdsDeducted="{ item }">
          <span :class="item.tdsDeducted > 0 ? 'text-negative' : ''">
            {{ item.tdsDeducted > 0 ? formatINR(item.tdsDeducted) : "—" }}
          </span>
        </template>

        <template #item.dividendYield="{ item }">
          <span class="text-currency">{{ formatPercent(item.dividendYield) }}</span>
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
            <v-icon icon="mdi-cash-remove" size="64" color="grey-lighten-1" />
            <div class="text-body-1 text-medium-emphasis mt-4">
              No dividend income recorded
            </div>
            <v-btn color="primary" class="mt-4" @click="openAddForm">
              Add Dividend
            </v-btn>
          </div>
        </template>
      </v-data-table>
    </v-card>

    <!-- Form Dialog -->
    <DividendIncomeForm
      v-model="showForm"
      :editing-item="editingItem"
      :fiscal-year="selectedFinancialYear"
      @submit="handleSubmit"
    />

    <!-- Delete Confirmation -->
    <v-dialog v-model="deleteDialog" max-width="400">
      <v-card>
        <v-card-title>Delete Dividend?</v-card-title>
        <v-card-text>
          Are you sure you want to delete this dividend record? This action
          cannot be undone.
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
.dividend-details-tab {
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
