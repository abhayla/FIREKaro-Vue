<script setup lang="ts">
import { ref, computed } from "vue";
import SectionHeader from "@/components/shared/SectionHeader.vue";
import BusinessIncomeForm from "@/components/income/BusinessIncomeForm.vue";
import LockInTracker from "@/components/income/LockInTracker.vue";
import {
  useBusinessIncome,
  useAddBusinessIncome,
  useUpdateBusinessIncome,
  useDeleteBusinessIncome,
  formatINR,
  formatINRLakhs,
} from "@/composables/useIncome";
import { useFinancialYear } from "@/composables/useSalary";
import { getFinancialYearOptions } from "@/types/salary";
import { PRESUMPTIVE_TAX_LIMITS } from "@/types/income";
import type { BusinessIncome, BusinessIncomeInput } from "@/types/income";

const tabs = [
  { title: "Overview", route: "/dashboard/non-salary-income" },
  { title: "Business", route: "/dashboard/non-salary-income/business" },
  { title: "Rental", route: "/dashboard/non-salary-income/rental" },
  { title: "Capital Gains", route: "/dashboard/non-salary-income/capital-gains" },
  { title: "Interest", route: "/dashboard/non-salary-income/interest" },
  { title: "Dividends", route: "/dashboard/non-salary-income/dividends" },
  { title: "Other", route: "/dashboard/non-salary-income/other" },
  { title: "Reports", route: "/dashboard/non-salary-income/reports" },
];

// Financial Year
const { selectedFinancialYear, setFinancialYear } = useFinancialYear();
const fyOptions = computed(() => getFinancialYearOptions());

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

// Summary stats
const totalGrossReceipts = computed(
  () => businessData.value?.reduce((sum, b) => sum + b.grossReceipts, 0) || 0,
);
const totalDeemedProfit = computed(
  () => businessData.value?.reduce((sum, b) => sum + b.deemedProfit, 0) || 0,
);
const businessCount = computed(() => businessData.value?.length || 0);

// Table headers
const headers = [
  { title: "Business Name", key: "businessName", sortable: true },
  { title: "Type", key: "businessType", sortable: true },
  { title: "Taxation", key: "taxationMethod", sortable: true },
  { title: "Gross Receipts", key: "grossReceipts", align: "end" as const },
  { title: "Profit Rate", key: "deemedProfitRate", align: "end" as const },
  { title: "Taxable Profit", key: "deemedProfit", align: "end" as const },
  { title: "GST", key: "isGstRegistered", align: "center" as const },
  {
    title: "Actions",
    key: "actions",
    sortable: false,
    align: "center" as const,
  },
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
  editingItem.value = null;
}

async function handleDelete() {
  if (deletingId.value) {
    await deleteMutation.mutateAsync(deletingId.value);
    deleteDialog.value = false;
    deletingId.value = null;
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
</script>

<template>
  <div>
    <SectionHeader
      title="Non-Salary Income"
      subtitle="Business & Professional Income"
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
        <v-btn color="primary" prepend-icon="mdi-plus" @click="openAddForm">
          Add Business
        </v-btn>
      </v-col>
    </v-row>

    <!-- Summary Cards -->
    <v-row class="mb-4">
      <v-col cols="12" md="4">
        <v-card>
          <v-card-text>
            <div class="d-flex align-center">
              <v-avatar color="primary" size="48" class="mr-3">
                <v-icon icon="mdi-store" />
              </v-avatar>
              <div>
                <div class="text-body-2 text-medium-emphasis">Businesses</div>
                <div class="text-h5 font-weight-bold">{{ businessCount }}</div>
              </div>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
      <v-col cols="12" md="4">
        <v-card>
          <v-card-text>
            <div class="d-flex align-center">
              <v-avatar color="info" size="48" class="mr-3">
                <v-icon icon="mdi-cash" />
              </v-avatar>
              <div>
                <div class="text-body-2 text-medium-emphasis">
                  Total Gross Receipts
                </div>
                <div class="text-h5 font-weight-bold text-currency">
                  {{ formatINRLakhs(totalGrossReceipts) }}
                </div>
              </div>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
      <v-col cols="12" md="4">
        <v-card>
          <v-card-text>
            <div class="d-flex align-center">
              <v-avatar color="success" size="48" class="mr-3">
                <v-icon icon="mdi-trending-up" />
              </v-avatar>
              <div>
                <div class="text-body-2 text-medium-emphasis">
                  Taxable Profit
                </div>
                <div
                  class="text-h5 font-weight-bold text-currency text-positive"
                >
                  {{ formatINRLakhs(totalDeemedProfit) }}
                </div>
              </div>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- 5-Year Lock-in Tracker -->
    <v-row class="mb-4">
      <v-col cols="12">
        <v-expansion-panels>
          <v-expansion-panel>
            <v-expansion-panel-title>
              <v-icon class="mr-2" color="warning">mdi-lock-clock</v-icon>
              <span class="font-weight-medium">5-Year Lock-in Tracker (44AD/44ADA)</span>
              <v-chip class="ml-2" size="x-small" color="warning" variant="tonal">
                Important
              </v-chip>
            </v-expansion-panel-title>
            <v-expansion-panel-text>
              <LockInTracker />
            </v-expansion-panel-text>
          </v-expansion-panel>
        </v-expansion-panels>
      </v-col>
    </v-row>

    <!-- Business List -->
    <v-card>
      <v-card-title class="d-flex align-center">
        <v-icon class="mr-2">mdi-store</v-icon>
        Business/Profession Income
        <v-chip class="ml-2" size="small" color="primary">
          {{ selectedFinancialYear }}
        </v-chip>
      </v-card-title>

      <v-data-table
        :headers="headers"
        :items="businessData || []"
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
            :color="
              item.taxationMethod === '44AD'
                ? 'primary'
                : item.taxationMethod === '44ADA'
                  ? 'secondary'
                  : 'grey'
            "
          >
            {{ getTaxationLabel(item.taxationMethod) }}
          </v-chip>
        </template>

        <template #item.grossReceipts="{ item }">
          <span class="text-currency">{{ formatINR(item.grossReceipts) }}</span>
        </template>

        <template #item.deemedProfitRate="{ item }">
          <span class="text-currency"
            >{{ (item.deemedProfitRate * 100).toFixed(1) }}%</span
          >
        </template>

        <template #item.deemedProfit="{ item }">
          <span class="text-currency text-positive font-weight-medium">
            {{ formatINR(item.deemedProfit) }}
          </span>
        </template>

        <template #item.isGstRegistered="{ item }">
          <v-icon
            :icon="
              item.isGstRegistered ? 'mdi-check-circle' : 'mdi-close-circle'
            "
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

    <!-- Info Cards -->
    <v-row class="mt-6">
      <v-col cols="12" md="6">
        <v-card variant="outlined">
          <v-card-title>
            <v-icon class="mr-2" color="primary">mdi-information</v-icon>
            Section 44AD - Business
          </v-card-title>
          <v-card-text>
            <v-list density="compact">
              <v-list-item>
                <template #prepend>
                  <v-icon icon="mdi-check" color="success" size="small" />
                </template>
                <v-list-item-title>Turnover Limit</v-list-item-title>
                <v-list-item-subtitle
                  >Up to
                  {{
                    formatINR(PRESUMPTIVE_TAX_LIMITS["44AD"].turnoverLimit)
                  }}</v-list-item-subtitle
                >
              </v-list-item>
              <v-list-item>
                <template #prepend>
                  <v-icon icon="mdi-check" color="success" size="small" />
                </template>
                <v-list-item-title>Deemed Profit - Cash</v-list-item-title>
                <v-list-item-subtitle>8% of turnover</v-list-item-subtitle>
              </v-list-item>
              <v-list-item>
                <template #prepend>
                  <v-icon icon="mdi-check" color="success" size="small" />
                </template>
                <v-list-item-title>Deemed Profit - Digital</v-list-item-title>
                <v-list-item-subtitle
                  >6% for digital/bank payments</v-list-item-subtitle
                >
              </v-list-item>
              <v-list-item>
                <template #prepend>
                  <v-icon
                    icon="mdi-file-document"
                    color="primary"
                    size="small"
                  />
                </template>
                <v-list-item-title>ITR Form</v-list-item-title>
                <v-list-item-subtitle>ITR-4 (Sugam)</v-list-item-subtitle>
              </v-list-item>
            </v-list>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" md="6">
        <v-card variant="outlined">
          <v-card-title>
            <v-icon class="mr-2" color="secondary">mdi-information</v-icon>
            Section 44ADA - Profession
          </v-card-title>
          <v-card-text>
            <v-list density="compact">
              <v-list-item>
                <template #prepend>
                  <v-icon icon="mdi-check" color="success" size="small" />
                </template>
                <v-list-item-title>Gross Receipts Limit</v-list-item-title>
                <v-list-item-subtitle
                  >Up to
                  {{
                    formatINR(PRESUMPTIVE_TAX_LIMITS["44ADA"].receiptsLimit)
                  }}</v-list-item-subtitle
                >
              </v-list-item>
              <v-list-item>
                <template #prepend>
                  <v-icon icon="mdi-check" color="success" size="small" />
                </template>
                <v-list-item-title>Deemed Profit</v-list-item-title>
                <v-list-item-subtitle
                  >50% of gross receipts</v-list-item-subtitle
                >
              </v-list-item>
              <v-list-item>
                <template #prepend>
                  <v-icon
                    icon="mdi-account-tie"
                    color="secondary"
                    size="small"
                  />
                </template>
                <v-list-item-title>Eligible Professions</v-list-item-title>
                <v-list-item-subtitle
                  >Legal, Medical, Engineering, Architects, CA,
                  etc.</v-list-item-subtitle
                >
              </v-list-item>
              <v-list-item>
                <template #prepend>
                  <v-icon
                    icon="mdi-file-document"
                    color="primary"
                    size="small"
                  />
                </template>
                <v-list-item-title>ITR Form</v-list-item-title>
                <v-list-item-subtitle>ITR-4 (Sugam)</v-list-item-subtitle>
              </v-list-item>
            </v-list>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

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
          <v-btn color="error" variant="flat" @click="handleDelete"
            >Delete</v-btn
          >
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>
