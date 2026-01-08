<script setup lang="ts">
import { ref, computed } from "vue";
import SectionHeader from "@/components/shared/SectionHeader.vue";
import OtherIncomeForm from "@/components/income/OtherIncomeForm.vue";
import {
  useOtherIncome,
  useAddOtherIncome,
  useUpdateOtherIncome,
  useDeleteOtherIncome,
  useInterestIncome,
  useDividendIncome,
  formatINR,
  formatINRLakhs,
} from "@/composables/useIncome";
import { useFinancialYear } from "@/composables/useSalary";
import { getFinancialYearOptions } from "@/types/salary";
import type { OtherIncome, OtherIncomeInput } from "@/types/income";

const tabs = [
  { title: "Overview", route: "/dashboard/non-salary-income" },
  { title: "Business", route: "/dashboard/non-salary-income/business" },
  { title: "Rental", route: "/dashboard/non-salary-income/rental" },
  {
    title: "Capital Gains",
    route: "/dashboard/non-salary-income/capital-gains",
  },
  { title: "Other", route: "/dashboard/non-salary-income/other" },
  { title: "Reports", route: "/dashboard/non-salary-income/reports" },
];

// Financial Year
const { selectedFinancialYear, setFinancialYear } = useFinancialYear();
const fyOptions = computed(() => getFinancialYearOptions());

// Data
const { data: otherData, isLoading } = useOtherIncome();
const { summary: interestSummary } = useInterestIncome();
const { summary: dividendSummary } = useDividendIncome();
const addMutation = useAddOtherIncome();
const updateMutation = useUpdateOtherIncome();
const deleteMutation = useDeleteOtherIncome();

// Form state
const showForm = ref(false);
const editingItem = ref<OtherIncome | null>(null);
const defaultCategory = ref<OtherIncome["category"]>("interest");
const deleteDialog = ref(false);
const deletingId = ref<string | null>(null);

// Summary stats
const totalInterest = computed(() => interestSummary.value?.totalInterest || 0);
const totalDividends = computed(
  () => dividendSummary.value?.totalDividends || 0,
);
const totalOther = computed(() => {
  return (
    otherData.value
      ?.filter((o) => !["interest", "dividend"].includes(o.category))
      .reduce((sum, o) => sum + o.grossAmount, 0) || 0
  );
});
const totalTds = computed(
  () => otherData.value?.reduce((sum, o) => sum + o.tdsDeducted, 0) || 0,
);

// Table headers
const headers = [
  { title: "Description", key: "description", sortable: true },
  { title: "Category", key: "category", sortable: true },
  { title: "Source", key: "sourceName" },
  { title: "Gross Amount", key: "grossAmount", align: "end" as const },
  { title: "TDS", key: "tdsDeducted", align: "end" as const },
  { title: "Net Amount", key: "netAmount", align: "end" as const },
  {
    title: "Actions",
    key: "actions",
    sortable: false,
    align: "center" as const,
  },
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
  <div>
    <SectionHeader
      title="Non-Salary Income"
      subtitle="Other Income Sources"
      icon="mdi-cash-plus"
      :tabs="tabs"
    />

    <!-- Controls -->
    <v-row class="mb-4" align="center">
      <v-col cols="12" sm="6" md="4">
        <v-select
          v-model="selectedFinancialYear"
          label="Financial Year"
          :items="fyOptions"
          density="compact"
          hide-details
          @update:model-value="setFinancialYear"
        />
      </v-col>
      <v-col cols="12" sm="6" md="8" class="text-sm-right">
        <v-btn
          color="primary"
          prepend-icon="mdi-plus"
          @click="openAddForm('interest')"
        >
          Add Income
        </v-btn>
      </v-col>
    </v-row>

    <!-- Summary Cards -->
    <v-row class="mb-4">
      <v-col cols="12" md="3">
        <v-card class="cursor-pointer" @click="openAddForm('interest')">
          <v-card-text>
            <div class="d-flex align-center">
              <v-avatar color="info" size="48" class="mr-3">
                <v-icon icon="mdi-percent" />
              </v-avatar>
              <div>
                <div class="text-body-2 text-medium-emphasis">
                  Interest Income
                </div>
                <div class="text-h5 font-weight-bold text-currency">
                  {{ formatINRLakhs(totalInterest) }}
                </div>
              </div>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
      <v-col cols="12" md="3">
        <v-card class="cursor-pointer" @click="openAddForm('dividend')">
          <v-card-text>
            <div class="d-flex align-center">
              <v-avatar color="warning" size="48" class="mr-3">
                <v-icon icon="mdi-cash-multiple" />
              </v-avatar>
              <div>
                <div class="text-body-2 text-medium-emphasis">
                  Dividend Income
                </div>
                <div class="text-h5 font-weight-bold text-currency">
                  {{ formatINRLakhs(totalDividends) }}
                </div>
              </div>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
      <v-col cols="12" md="3">
        <v-card class="cursor-pointer" @click="openAddForm('other')">
          <v-card-text>
            <div class="d-flex align-center">
              <v-avatar color="secondary" size="48" class="mr-3">
                <v-icon icon="mdi-dots-horizontal-circle" />
              </v-avatar>
              <div>
                <div class="text-body-2 text-medium-emphasis">
                  Other Sources
                </div>
                <div class="text-h5 font-weight-bold text-currency">
                  {{ formatINRLakhs(totalOther) }}
                </div>
              </div>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
      <v-col cols="12" md="3">
        <v-card>
          <v-card-text>
            <div class="d-flex align-center">
              <v-avatar color="error" size="48" class="mr-3">
                <v-icon icon="mdi-receipt" />
              </v-avatar>
              <div>
                <div class="text-body-2 text-medium-emphasis">TDS Deducted</div>
                <div
                  class="text-h5 font-weight-bold text-currency text-negative"
                >
                  {{ formatINRLakhs(totalTds) }}
                </div>
              </div>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Deductions Info -->
    <v-row v-if="interestSummary" class="mb-4">
      <v-col cols="12" md="6">
        <v-card variant="tonal" color="info">
          <v-card-text>
            <div class="d-flex justify-space-between align-center">
              <div>
                <div class="text-body-2 font-weight-medium">
                  80TTA Deduction
                </div>
                <div class="text-caption">
                  Savings bank interest (up to Rs.10,000)
                </div>
              </div>
              <div class="text-h6 text-currency font-weight-bold">
                {{ formatINR(interestSummary.deduction80TTA) }}
              </div>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
      <v-col cols="12" md="6">
        <v-card variant="tonal" color="secondary">
          <v-card-text>
            <div class="d-flex justify-space-between align-center">
              <div>
                <div class="text-body-2 font-weight-medium">
                  80TTB Deduction (Seniors)
                </div>
                <div class="text-caption">
                  Interest income for 60+ (up to Rs.50,000)
                </div>
              </div>
              <div class="text-h6 text-currency font-weight-bold">
                {{ formatINR(interestSummary.deduction80TTB) }}
              </div>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Income List -->
    <v-card>
      <v-card-title class="d-flex align-center">
        <v-icon class="mr-2">mdi-format-list-bulleted</v-icon>
        Other Income Sources
        <v-chip class="ml-2" size="small" color="grey">
          {{ selectedFinancialYear }}
        </v-chip>
      </v-card-title>

      <v-data-table
        :headers="headers"
        :items="otherData || []"
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
          <span v-if="item.sourceName" class="text-caption">{{
            item.sourceName
          }}</span>
          <span v-else class="text-caption text-medium-emphasis">-</span>
        </template>

        <template #item.grossAmount="{ item }">
          <span class="text-currency">{{ formatINR(item.grossAmount) }}</span>
        </template>

        <template #item.tdsDeducted="{ item }">
          <span v-if="item.tdsDeducted" class="text-currency text-negative">
            {{ formatINR(item.tdsDeducted) }}
          </span>
          <span v-else class="text-caption text-medium-emphasis">-</span>
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
          />
          <v-btn
            icon="mdi-delete"
            size="small"
            variant="text"
            color="error"
            @click="confirmDelete(item.id)"
          />
        </template>

        <template #no-data>
          <div class="text-center py-8">
            <v-icon icon="mdi-cash-off" size="64" color="grey-lighten-1" />
            <div class="text-body-1 text-medium-emphasis mt-4">
              No other income sources recorded
            </div>
            <v-btn
              color="primary"
              class="mt-4"
              @click="openAddForm('interest')"
            >
              Add Income
            </v-btn>
          </div>
        </template>
      </v-data-table>
    </v-card>

    <!-- Quick Add Cards -->
    <v-row class="mt-6">
      <v-col cols="12" md="4">
        <v-card
          variant="outlined"
          class="cursor-pointer"
          @click="openAddForm('interest')"
        >
          <v-card-text class="d-flex align-center">
            <v-avatar color="info" size="40" class="mr-3">
              <v-icon icon="mdi-percent" />
            </v-avatar>
            <div>
              <div class="text-body-2 font-weight-medium">
                Add Interest Income
              </div>
              <div class="text-caption text-medium-emphasis">
                FD, Savings, P2P, Bonds
              </div>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
      <v-col cols="12" md="4">
        <v-card
          variant="outlined"
          class="cursor-pointer"
          @click="openAddForm('dividend')"
        >
          <v-card-text class="d-flex align-center">
            <v-avatar color="warning" size="40" class="mr-3">
              <v-icon icon="mdi-cash-multiple" />
            </v-avatar>
            <div>
              <div class="text-body-2 font-weight-medium">
                Add Dividend Income
              </div>
              <div class="text-caption text-medium-emphasis">
                Stocks, Mutual Funds
              </div>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
      <v-col cols="12" md="4">
        <v-card
          variant="outlined"
          class="cursor-pointer"
          @click="openAddForm('commission')"
        >
          <v-card-text class="d-flex align-center">
            <v-avatar color="primary" size="40" class="mr-3">
              <v-icon icon="mdi-handshake" />
            </v-avatar>
            <div>
              <div class="text-body-2 font-weight-medium">Add Commission</div>
              <div class="text-caption text-medium-emphasis">
                Referral, Affiliate
              </div>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

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
          <v-btn color="error" variant="flat" @click="handleDelete"
            >Delete</v-btn
          >
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<style scoped>
.cursor-pointer {
  cursor: pointer;
}
.cursor-pointer:hover {
  background-color: rgba(0, 0, 0, 0.04);
}
</style>
