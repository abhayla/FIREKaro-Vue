<script setup lang="ts">
import { ref, computed } from "vue";
import SourceCards from "@/components/shared/SourceCards.vue";
import InterestIncomeForm from "@/components/income/InterestIncomeForm.vue";
import {
  useInterestIncomeAPI,
  useAddInterestIncome,
  useUpdateInterestIncome,
  useDeleteInterestIncome,
  formatINR,
} from "@/composables/useIncome";
import { useFinancialYear } from "@/composables/useSalary";
import type { InterestIncome, InterestIncomeInput } from "@/types/income";
import type { SourceCardData } from "@/components/shared/SourceCards.vue";

const { selectedFinancialYear } = useFinancialYear();

// Data
const { data: interestData, isLoading } = useInterestIncomeAPI();
const addMutation = useAddInterestIncome();
const updateMutation = useUpdateInterestIncome();
const deleteMutation = useDeleteInterestIncome();

// Form state
const showForm = ref(false);
const editingItem = ref<InterestIncome | null>(null);
const deleteDialog = ref(false);
const deletingId = ref<string | null>(null);
const selectedSourceId = ref<string | null>(null);

// Records from API
const records = computed(() => interestData.value?.records || []);

// Source cards for interest sources
const sourceCards = computed<SourceCardData[]>(() => {
  if (!records.value?.length) return [];
  return records.value.map((r) => ({
    id: r.id,
    name: r.institutionName,
    subtitle: getSourceTypeLabel(r.sourceType),
    amount: r.interestEarned,
    icon: getSourceTypeIcon(r.sourceType),
    color: getSourceTypeColor(r.sourceType),
    metadata: {
      Principal: r.principalAmount ? formatINR(r.principalAmount) : "—",
      Rate: r.interestRate ? `${r.interestRate.toFixed(2)}%` : "—",
    },
  }));
});

// Filtered data based on selected source
const filteredData = computed(() => {
  if (!records.value) return [];
  if (!selectedSourceId.value) return records.value;
  return records.value.filter((r) => r.id === selectedSourceId.value);
});

// Table headers
const headers = [
  { title: "Institution", key: "institutionName", sortable: true },
  { title: "Type", key: "sourceType", sortable: true },
  { title: "Principal", key: "principalAmount", align: "end" as const },
  { title: "Rate", key: "interestRate", align: "end" as const },
  { title: "Interest", key: "interestEarned", align: "end" as const },
  { title: "TDS", key: "tdsDeducted", align: "end" as const },
  { title: "Maturity", key: "maturityDate", sortable: true },
  { title: "Actions", key: "actions", sortable: false, align: "center" as const },
];

function openAddForm() {
  editingItem.value = null;
  showForm.value = true;
}

function openEditForm(item: InterestIncome) {
  editingItem.value = item;
  showForm.value = true;
}

function confirmDelete(id: string) {
  deletingId.value = id;
  deleteDialog.value = true;
}

async function handleSubmit(data: InterestIncomeInput) {
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

function handleEditSource(id: string) {
  const item = records.value?.find((r) => r.id === id);
  if (item) {
    openEditForm(item);
  }
}

function getSourceTypeLabel(type: string) {
  const labels: Record<string, string> = {
    FD: "Fixed Deposit",
    RD: "Recurring Deposit",
    SAVINGS: "Savings Account",
    P2P: "P2P Lending",
    BONDS: "Bonds",
    NSC: "National Savings Certificate",
    SCSS: "Senior Citizen Savings",
    PPF: "Public Provident Fund",
    OTHER: "Other",
  };
  return labels[type] || type;
}

function getSourceTypeColor(type: string) {
  const colors: Record<string, string> = {
    FD: "primary",
    RD: "primary",
    SAVINGS: "success",
    P2P: "warning",
    BONDS: "info",
    NSC: "secondary",
    SCSS: "orange",
    PPF: "teal",
    OTHER: "grey",
  };
  return colors[type] || "grey";
}

function getSourceTypeIcon(type: string) {
  const icons: Record<string, string> = {
    FD: "mdi-bank",
    RD: "mdi-bank-transfer",
    SAVINGS: "mdi-piggy-bank",
    P2P: "mdi-account-group",
    BONDS: "mdi-certificate",
    NSC: "mdi-certificate",
    SCSS: "mdi-account-star",
    PPF: "mdi-safe",
    OTHER: "mdi-cash",
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
  <div class="interest-details-tab">
    <!-- Action Bar -->
    <div class="d-flex justify-space-between align-center mb-4">
      <div class="text-h6">
        Interest Income Records
        <v-chip class="ml-2" size="small" color="primary">
          {{ selectedFinancialYear }}
        </v-chip>
      </div>
      <v-btn color="primary" prepend-icon="mdi-plus" @click="openAddForm">
        Add Interest Income
      </v-btn>
    </div>

    <!-- Source Cards -->
    <SourceCards
      v-if="records && records.length > 0"
      :sources="sourceCards"
      v-model="selectedSourceId"
      :show-all="true"
      all-label="All Sources"
      add-label="Add Interest"
      :columns="3"
      class="mb-6"
      @add="openAddForm"
      @edit="handleEditSource"
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

        <template #item.principalAmount="{ item }">
          <span class="text-currency">
            {{ item.principalAmount ? formatINR(item.principalAmount) : "—" }}
          </span>
        </template>

        <template #item.interestRate="{ item }">
          <span class="text-currency">{{ formatPercent(item.interestRate) }}</span>
        </template>

        <template #item.interestEarned="{ item }">
          <span class="text-currency text-positive font-weight-medium">
            {{ formatINR(item.interestEarned) }}
          </span>
        </template>

        <template #item.tdsDeducted="{ item }">
          <span :class="item.tdsDeducted > 0 ? 'text-negative' : ''">
            {{ item.tdsDeducted > 0 ? formatINR(item.tdsDeducted) : "—" }}
          </span>
        </template>

        <template #item.maturityDate="{ item }">
          <span>{{ formatDate(item.maturityDate) }}</span>
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
            <v-icon icon="mdi-bank-off" size="64" color="grey-lighten-1" />
            <div class="text-body-1 text-medium-emphasis mt-4">
              No interest income recorded
            </div>
            <v-btn color="primary" class="mt-4" @click="openAddForm">
              Add Interest Income
            </v-btn>
          </div>
        </template>
      </v-data-table>
    </v-card>

    <!-- Form Dialog -->
    <InterestIncomeForm
      v-model="showForm"
      :editing-item="editingItem"
      :fiscal-year="selectedFinancialYear"
      @submit="handleSubmit"
    />

    <!-- Delete Confirmation -->
    <v-dialog v-model="deleteDialog" max-width="400">
      <v-card>
        <v-card-title>Delete Interest Income?</v-card-title>
        <v-card-text>
          Are you sure you want to delete this interest income record? This
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
.interest-details-tab {
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
