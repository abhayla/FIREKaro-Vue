<script setup lang="ts">
import { ref, computed } from "vue";
import SourceCards from "@/components/shared/SourceCards.vue";
import BusinessIncomeForm from "@/components/income/BusinessIncomeForm.vue";
import {
  useBusinessIncome,
  useAddBusinessIncome,
  useUpdateBusinessIncome,
  useDeleteBusinessIncome,
  formatINR,
} from "@/composables/useIncome";
import { useFinancialYear } from "@/composables/useSalary";
import type { BusinessIncome, BusinessIncomeInput } from "@/types/income";
import type { SourceCardData } from "@/components/shared/SourceCards.vue";

const { selectedFinancialYear } = useFinancialYear();

// Data
const { data: businessData, isLoading } = useBusinessIncome();
const addMutation = useAddBusinessIncome();
const updateMutation = useUpdateBusinessIncome();
const deleteMutation = useDeleteBusinessIncome();

// Form state
const showForm = ref(false);
const editingItem = ref<BusinessIncome | null>(null);
const deleteDialog = ref(false);
const deletingId = ref<string | null>(null);
const selectedSourceId = ref<string | null>(null);

// Source cards for business entities
const sourceCards = computed<SourceCardData[]>(() => {
  if (!businessData.value) return [];
  return businessData.value.map((b) => ({
    id: b.id,
    name: b.businessName,
    subtitle: getTaxationLabel(b.taxationMethod),
    amount: b.deemedProfit,
    icon: getBusinessIcon(b.businessType),
    color: getTaxationColor(b.taxationMethod),
    metadata: {
      "Gross Receipts": formatINR(b.grossReceipts),
      "Profit Rate": `${(b.deemedProfitRate * 100).toFixed(1)}%`,
    },
  }));
});

// Filtered data based on selected source
const filteredData = computed(() => {
  if (!businessData.value) return [];
  if (!selectedSourceId.value) return businessData.value;
  return businessData.value.filter((b) => b.id === selectedSourceId.value);
});

// Table headers
const headers = [
  { title: "Business Name", key: "businessName", sortable: true },
  { title: "Type", key: "businessType", sortable: true },
  { title: "Taxation", key: "taxationMethod", sortable: true },
  { title: "Gross Receipts", key: "grossReceipts", align: "end" as const },
  { title: "Profit Rate", key: "deemedProfitRate", align: "end" as const },
  { title: "Taxable Profit", key: "deemedProfit", align: "end" as const },
  { title: "GST", key: "isGstRegistered", align: "center" as const },
  { title: "Actions", key: "actions", sortable: false, align: "center" as const },
];

function openAddForm() {
  editingItem.value = null;
  showForm.value = true;
}

function openEditForm(item: BusinessIncome) {
  editingItem.value = item;
  showForm.value = true;
}

function confirmDelete(id: string) {
  deletingId.value = id;
  deleteDialog.value = true;
}

async function handleSubmit(data: BusinessIncomeInput) {
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
  const item = businessData.value?.find((b) => b.id === id);
  if (item) {
    openEditForm(item);
  }
}

function getTaxationLabel(method: string) {
  switch (method) {
    case "44AD":
      return "Sec 44AD";
    case "44ADA":
      return "Sec 44ADA";
    case "regular_books":
      return "Regular";
    default:
      return method;
  }
}

function getTaxationColor(method: string) {
  switch (method) {
    case "44AD":
      return "primary";
    case "44ADA":
      return "secondary";
    default:
      return "grey";
  }
}

function getBusinessTypeLabel(type: string) {
  switch (type) {
    case "proprietorship":
      return "Proprietorship";
    case "partnership":
      return "Partnership";
    case "freelance":
      return "Freelance";
    case "commission_agent":
      return "Commission Agent";
    default:
      return type;
  }
}

function getBusinessIcon(type: string) {
  switch (type) {
    case "proprietorship":
      return "mdi-store";
    case "partnership":
      return "mdi-handshake";
    case "freelance":
      return "mdi-laptop";
    case "commission_agent":
      return "mdi-account-cash";
    default:
      return "mdi-briefcase";
  }
}
</script>

<template>
  <div class="business-details-tab">
    <!-- Action Bar -->
    <div class="d-flex justify-space-between align-center mb-4">
      <div class="text-h6">
        Business Income Records
        <v-chip class="ml-2" size="small" color="primary">
          {{ selectedFinancialYear }}
        </v-chip>
      </div>
      <v-btn color="primary" prepend-icon="mdi-plus" @click="openAddForm">
        Add Business
      </v-btn>
    </div>

    <!-- Source Cards -->
    <SourceCards
      v-if="businessData && businessData.length > 0"
      :sources="sourceCards"
      v-model="selectedSourceId"
      :show-all="true"
      all-label="All Businesses"
      add-label="Add Business"
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
        <template #item.businessType="{ item }">
          <v-chip size="small" variant="tonal">
            {{ getBusinessTypeLabel(item.businessType) }}
          </v-chip>
        </template>

        <template #item.taxationMethod="{ item }">
          <v-chip
            size="small"
            :color="getTaxationColor(item.taxationMethod)"
          >
            {{ getTaxationLabel(item.taxationMethod) }}
          </v-chip>
        </template>

        <template #item.grossReceipts="{ item }">
          <span class="text-currency">{{ formatINR(item.grossReceipts) }}</span>
        </template>

        <template #item.deemedProfitRate="{ item }">
          <span class="text-currency">{{ (item.deemedProfitRate * 100).toFixed(1) }}%</span>
        </template>

        <template #item.deemedProfit="{ item }">
          <span class="text-currency text-positive font-weight-medium">
            {{ formatINR(item.deemedProfit) }}
          </span>
        </template>

        <template #item.isGstRegistered="{ item }">
          <v-icon
            :icon="item.isGstRegistered ? 'mdi-check-circle' : 'mdi-close-circle'"
            :color="item.isGstRegistered ? 'success' : 'grey'"
            size="small"
          />
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
            <v-icon icon="mdi-store-off" size="64" color="grey-lighten-1" />
            <div class="text-body-1 text-medium-emphasis mt-4">
              No business income recorded
            </div>
            <v-btn color="primary" class="mt-4" @click="openAddForm">
              Add Business
            </v-btn>
          </div>
        </template>
      </v-data-table>
    </v-card>

    <!-- Form Dialog -->
    <BusinessIncomeForm
      v-model="showForm"
      :edit-item="editingItem"
      @submit="handleSubmit"
    />

    <!-- Delete Confirmation -->
    <v-dialog v-model="deleteDialog" max-width="400">
      <v-card>
        <v-card-title>Delete Business?</v-card-title>
        <v-card-text>
          Are you sure you want to delete this business income record? This
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
.business-details-tab {
  width: 100%;
}

.text-currency {
  font-family: "Roboto Mono", monospace;
}

.text-positive {
  color: rgb(var(--v-theme-success));
}
</style>
