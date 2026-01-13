<script setup lang="ts">
import { ref, computed } from "vue";
import SourceCards from "@/components/shared/SourceCards.vue";
import RentalIncomeForm from "@/components/income/RentalIncomeForm.vue";
import {
  useRentalIncome,
  useAddRentalIncome,
  useUpdateRentalIncome,
  useDeleteRentalIncome,
  formatINR,
} from "@/composables/useIncome";
import { useFinancialYear } from "@/composables/useSalary";
import type { RentalIncome, RentalIncomeInput } from "@/types/income";
import type { SourceCardData } from "@/components/shared/SourceCards.vue";

const { selectedFinancialYear } = useFinancialYear();

// Data
const { data: rentalData, isLoading } = useRentalIncome();
const addMutation = useAddRentalIncome();
const updateMutation = useUpdateRentalIncome();
const deleteMutation = useDeleteRentalIncome();

// Form state
const showForm = ref(false);
const editingItem = ref<RentalIncome | null>(null);
const deleteDialog = ref(false);
const deletingId = ref<string | null>(null);
const selectedSourceId = ref<string | null>(null);

// Source cards for properties
const sourceCards = computed<SourceCardData[]>(() => {
  if (!rentalData.value) return [];
  return rentalData.value.map((r) => ({
    id: r.id,
    name: r.propertyName,
    subtitle: getPropertyTypeLabel(r.propertyType),
    amount: r.netAnnualValue,
    icon: getPropertyIcon(r.propertyType),
    color: getPropertyTypeColor(r.propertyType),
    metadata: {
      "Monthly Rent": formatINR(r.monthlyRent),
      Tenant: r.tenantName || "—",
    },
  }));
});

// Filtered data based on selected source
const filteredData = computed(() => {
  if (!rentalData.value) return [];
  if (!selectedSourceId.value) return rentalData.value;
  return rentalData.value.filter((r) => r.id === selectedSourceId.value);
});

// Table headers
const headers = [
  { title: "Property", key: "propertyName", sortable: true },
  { title: "Type", key: "propertyType", sortable: true },
  { title: "Monthly Rent", key: "monthlyRent", align: "end" as const },
  { title: "Annual Rent", key: "annualRent", align: "end" as const },
  { title: "Deductions", key: "deductions", align: "end" as const },
  { title: "Taxable Income", key: "netAnnualValue", align: "end" as const },
  { title: "Tenant", key: "tenantName" },
  { title: "Actions", key: "actions", sortable: false, align: "center" as const },
];

function openAddForm() {
  editingItem.value = null;
  showForm.value = true;
}

function openEditForm(item: RentalIncome) {
  editingItem.value = item;
  showForm.value = true;
}

function confirmDelete(id: string) {
  deletingId.value = id;
  deleteDialog.value = true;
}

async function handleSubmit(data: RentalIncomeInput) {
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
  const item = rentalData.value?.find((r) => r.id === id);
  if (item) {
    openEditForm(item);
  }
}

function getPropertyTypeLabel(type: string) {
  switch (type) {
    case "residential":
      return "Residential";
    case "commercial":
      return "Commercial";
    case "land":
      return "Land";
    default:
      return type;
  }
}

function getPropertyTypeColor(type: string) {
  switch (type) {
    case "residential":
      return "primary";
    case "commercial":
      return "secondary";
    case "land":
      return "warning";
    default:
      return "grey";
  }
}

function getPropertyIcon(type: string) {
  switch (type) {
    case "residential":
      return "mdi-home";
    case "commercial":
      return "mdi-office-building";
    case "land":
      return "mdi-terrain";
    default:
      return "mdi-home-city";
  }
}
</script>

<template>
  <div class="rental-details-tab">
    <!-- Action Bar -->
    <div class="d-flex justify-space-between align-center mb-4">
      <div class="text-h6">
        Rental Properties
        <v-chip class="ml-2" size="small" color="secondary">
          {{ selectedFinancialYear }}
        </v-chip>
      </div>
      <v-btn color="primary" prepend-icon="mdi-plus" @click="openAddForm">
        Add Property
      </v-btn>
    </div>

    <!-- Source Cards -->
    <SourceCards
      v-if="rentalData && rentalData.length > 0"
      :sources="sourceCards"
      v-model="selectedSourceId"
      :show-all="true"
      all-label="All Properties"
      add-label="Add Property"
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
        <template #item.propertyType="{ item }">
          <v-chip
            size="small"
            :color="getPropertyTypeColor(item.propertyType)"
            variant="tonal"
          >
            {{ getPropertyTypeLabel(item.propertyType) }}
          </v-chip>
        </template>

        <template #item.monthlyRent="{ item }">
          <span class="text-currency">{{ formatINR(item.monthlyRent) }}</span>
        </template>

        <template #item.annualRent="{ item }">
          <span class="text-currency">{{ formatINR(item.annualRent) }}</span>
        </template>

        <template #item.deductions="{ item }">
          <span class="text-currency text-negative">
            {{ formatINR(item.standardDeduction + item.housingLoanInterest) }}
          </span>
        </template>

        <template #item.netAnnualValue="{ item }">
          <span
            class="text-currency font-weight-medium"
            :class="item.netAnnualValue >= 0 ? 'text-positive' : 'text-negative'"
          >
            {{ formatINR(item.netAnnualValue) }}
          </span>
        </template>

        <template #item.tenantName="{ item }">
          <span v-if="item.tenantName" class="text-caption">
            {{ item.tenantName }}
          </span>
          <span v-else class="text-caption text-medium-emphasis">—</span>
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
            <v-icon icon="mdi-home-off" size="64" color="grey-lighten-1" />
            <div class="text-body-1 text-medium-emphasis mt-4">
              No rental properties recorded
            </div>
            <v-btn color="primary" class="mt-4" @click="openAddForm">
              Add Property
            </v-btn>
          </div>
        </template>
      </v-data-table>
    </v-card>

    <!-- Form Dialog -->
    <RentalIncomeForm
      v-model="showForm"
      :edit-item="editingItem"
      @submit="handleSubmit"
    />

    <!-- Delete Confirmation -->
    <v-dialog v-model="deleteDialog" max-width="400">
      <v-card>
        <v-card-title>Delete Property?</v-card-title>
        <v-card-text>
          Are you sure you want to delete this rental property record? This
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
.rental-details-tab {
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
