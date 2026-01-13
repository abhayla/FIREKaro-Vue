<script setup lang="ts">
import { ref, computed } from "vue";
import FilterCards from "@/components/shared/FilterCards.vue";
import OtherIncomeForm from "@/components/income/OtherIncomeForm.vue";
import {
  useOtherIncome,
  useAddOtherIncome,
  useUpdateOtherIncome,
  useDeleteOtherIncome,
  formatINR,
} from "@/composables/useIncome";
import { useFinancialYear } from "@/composables/useSalary";
import type { OtherIncome, OtherIncomeInput } from "@/types/income";
import type { FilterCardData } from "@/components/shared/FilterCards.vue";

const { selectedFinancialYear } = useFinancialYear();

// Data
const { data: otherData, isLoading } = useOtherIncome();
const addMutation = useAddOtherIncome();
const updateMutation = useUpdateOtherIncome();
const deleteMutation = useDeleteOtherIncome();

// Form state
const showForm = ref(false);
const editingItem = ref<OtherIncome | null>(null);
const defaultCategory = ref<OtherIncome["category"]>("interest");
const deleteDialog = ref(false);
const deletingId = ref<string | null>(null);
const selectedFilter = ref<string | null>(null);

// Filter options for categories
const filterOptions = computed<FilterCardData[]>(() => {
  if (!otherData.value?.length) return [];
  const byCategory: Record<string, { count: number; amount: number }> = {};
  for (const o of otherData.value) {
    if (!byCategory[o.category]) {
      byCategory[o.category] = { count: 0, amount: 0 };
    }
    byCategory[o.category].count++;
    byCategory[o.category].amount += o.grossAmount;
  }
  return Object.entries(byCategory).map(([category, data]) => ({
    id: category,
    label: getCategoryLabel(category),
    count: data.count,
    amount: data.amount,
    icon: getCategoryIcon(category),
    color: getCategoryColor(category),
  }));
});

// Filtered data based on selected filter
const filteredData = computed(() => {
  if (!otherData.value) return [];
  if (!selectedFilter.value) return otherData.value;
  return otherData.value.filter((o) => o.category === selectedFilter.value);
});

// Table headers
const headers = [
  { title: "Description", key: "description", sortable: true },
  { title: "Category", key: "category", sortable: true },
  { title: "Source", key: "sourceName" },
  { title: "Gross Amount", key: "grossAmount", align: "end" as const },
  { title: "TDS", key: "tdsDeducted", align: "end" as const },
  { title: "Net Amount", key: "netAmount", align: "end" as const },
  { title: "Actions", key: "actions", sortable: false, align: "center" as const },
];

function openAddForm(category: OtherIncome["category"] = "interest") {
  editingItem.value = null;
  defaultCategory.value = category;
  showForm.value = true;
}

function openEditForm(item: OtherIncome) {
  editingItem.value = item;
  defaultCategory.value = item.category;
  showForm.value = true;
}

function confirmDelete(id: string) {
  deletingId.value = id;
  deleteDialog.value = true;
}

async function handleSubmit(data: OtherIncomeInput) {
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

function getCategoryLabel(category: string) {
  switch (category) {
    case "interest":
      return "Interest";
    case "dividend":
      return "Dividend";
    case "commission":
      return "Commission";
    case "royalty":
      return "Royalty";
    case "pension":
      return "Pension";
    case "gift":
      return "Gift";
    case "agricultural":
      return "Agricultural";
    default:
      return "Other";
  }
}

function getCategoryColor(category: string) {
  switch (category) {
    case "interest":
      return "info";
    case "dividend":
      return "warning";
    case "commission":
      return "primary";
    case "royalty":
      return "purple";
    case "pension":
      return "secondary";
    case "gift":
      return "pink";
    case "agricultural":
      return "success";
    default:
      return "grey";
  }
}

function getCategoryIcon(category: string) {
  switch (category) {
    case "interest":
      return "mdi-percent";
    case "dividend":
      return "mdi-cash-multiple";
    case "commission":
      return "mdi-handshake";
    case "royalty":
      return "mdi-crown";
    case "pension":
      return "mdi-account-clock";
    case "gift":
      return "mdi-gift";
    case "agricultural":
      return "mdi-sprout";
    default:
      return "mdi-dots-horizontal";
  }
}
</script>

<template>
  <div class="other-details-tab">
    <!-- Action Bar -->
    <div class="d-flex justify-space-between align-center mb-4">
      <div class="text-h6">
        Other Income Sources
        <v-chip class="ml-2" size="small" color="grey">
          {{ selectedFinancialYear }}
        </v-chip>
      </div>
      <v-btn color="primary" prepend-icon="mdi-plus" @click="openAddForm('interest')">
        Add Income
      </v-btn>
    </div>

    <!-- Filter Cards -->
    <FilterCards
      v-if="otherData && otherData.length > 0"
      :filters="filterOptions"
      v-model="selectedFilter"
      :show-all="true"
      all-label="All Categories"
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
        <template #item.category="{ item }">
          <v-chip
            size="small"
            :color="getCategoryColor(item.category)"
            variant="tonal"
          >
            <v-icon start size="small" :icon="getCategoryIcon(item.category)" />
            {{ getCategoryLabel(item.category) }}
          </v-chip>
        </template>

        <template #item.sourceName="{ item }">
          <span v-if="item.sourceName" class="text-caption">{{ item.sourceName }}</span>
          <span v-else class="text-caption text-medium-emphasis">—</span>
        </template>

        <template #item.grossAmount="{ item }">
          <span class="text-currency">{{ formatINR(item.grossAmount) }}</span>
        </template>

        <template #item.tdsDeducted="{ item }">
          <span v-if="item.tdsDeducted" class="text-currency text-negative">
            {{ formatINR(item.tdsDeducted) }}
          </span>
          <span v-else class="text-caption text-medium-emphasis">—</span>
        </template>

        <template #item.netAmount="{ item }">
          <span class="text-currency font-weight-medium text-positive">
            {{ formatINR(item.netAmount) }}
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
            <v-icon icon="mdi-cash-off" size="64" color="grey-lighten-1" />
            <div class="text-body-1 text-medium-emphasis mt-4">
              No other income sources recorded
            </div>
            <v-btn color="primary" class="mt-4" @click="openAddForm('interest')">
              Add Income
            </v-btn>
          </div>
        </template>
      </v-data-table>
    </v-card>

    <!-- Form Dialog -->
    <OtherIncomeForm
      v-model="showForm"
      :edit-item="editingItem"
      :default-category="defaultCategory"
      @submit="handleSubmit"
    />

    <!-- Delete Confirmation -->
    <v-dialog v-model="deleteDialog" max-width="400">
      <v-card>
        <v-card-title>Delete Income Entry?</v-card-title>
        <v-card-text>
          Are you sure you want to delete this income entry? This action cannot
          be undone.
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
.other-details-tab {
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
