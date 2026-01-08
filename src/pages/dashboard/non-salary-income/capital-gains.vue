<script setup lang="ts">
import { ref, computed } from "vue";
import SectionHeader from "@/components/shared/SectionHeader.vue";
import CapitalGainsCalculator from "@/components/income/CapitalGainsCalculator.vue";
import {
  useCapitalGains,
  useAddCapitalGain,
  useUpdateCapitalGain,
  useDeleteCapitalGain,
  useCapitalGainsSummary,
  formatINR,
  formatINRLakhs,
} from "@/composables/useIncome";
import { useFinancialYear } from "@/composables/useSalary";
import { getFinancialYearOptions } from "@/types/salary";
import type { CapitalGain, CapitalGainInput } from "@/types/income";

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
const { data: capitalGainsData, isLoading } = useCapitalGains();
const { summary } = useCapitalGainsSummary();
const addMutation = useAddCapitalGain();
const updateMutation = useUpdateCapitalGain();
const deleteMutation = useDeleteCapitalGain();

// Form state
const showForm = ref(false);
const editingItem = ref<CapitalGain | null>(null);
const deleteDialog = ref(false);
const deletingId = ref<string | null>(null);

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

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}
</script>

<template>
  <div>
    <SectionHeader
      title="Non-Salary Income"
      subtitle="Capital Gains (STCG/LTCG)"
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
          Add Transaction
        </v-btn>
      </v-col>
    </v-row>

    <!-- Summary Cards -->
    <v-row class="mb-4">
      <v-col cols="12" md="3">
        <v-card>
          <v-card-text>
            <div class="d-flex align-center">
              <v-avatar color="info" size="48" class="mr-3">
                <v-icon icon="mdi-swap-horizontal" />
              </v-avatar>
              <div>
                <div class="text-body-2 text-medium-emphasis">Transactions</div>
                <div class="text-h5 font-weight-bold">
                  {{ summary?.totalTransactions || 0 }}
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
              <v-avatar color="warning" size="48" class="mr-3">
                <v-icon icon="mdi-clock-fast" />
              </v-avatar>
              <div>
                <div class="text-body-2 text-medium-emphasis">STCG</div>
                <div class="text-h5 font-weight-bold text-currency">
                  {{ formatINRLakhs(summary?.stcgTotal || 0) }}
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
              <v-avatar color="success" size="48" class="mr-3">
                <v-icon icon="mdi-clock-outline" />
              </v-avatar>
              <div>
                <div class="text-body-2 text-medium-emphasis">LTCG</div>
                <div class="text-h5 font-weight-bold text-currency">
                  {{ formatINRLakhs(summary?.ltcgTotal || 0) }}
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
                <v-icon icon="mdi-calculator" />
              </v-avatar>
              <div>
                <div class="text-body-2 text-medium-emphasis">
                  Estimated Tax
                </div>
                <div
                  class="text-h5 font-weight-bold text-currency text-negative"
                >
                  {{ formatINRLakhs(summary?.estimatedTax || 0) }}
                </div>
              </div>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Transactions List -->
    <v-card>
      <v-card-title class="d-flex align-center">
        <v-icon class="mr-2">mdi-trending-up</v-icon>
        Capital Gains Transactions
        <v-chip class="ml-2" size="small" color="success">
          {{ selectedFinancialYear }}
        </v-chip>
      </v-card-title>

      <v-data-table
        :headers="headers"
        :items="capitalGainsData || []"
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
            <span class="text-currency">{{
              formatINR(item.purchasePrice)
            }}</span>
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

    <!-- Tax Rates Info -->
    <v-row class="mt-6">
      <v-col cols="12">
        <v-card variant="outlined">
          <v-card-title>
            <v-icon class="mr-2" color="success">mdi-information</v-icon>
            Capital Gains Tax Rates (Post Budget 2024)
          </v-card-title>
          <v-card-text>
            <v-table density="compact">
              <thead>
                <tr>
                  <th>Asset Type</th>
                  <th>STCG Period</th>
                  <th>LTCG Period</th>
                  <th>STCG Rate</th>
                  <th>LTCG Rate</th>
                  <th>Notes</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>
                    <v-chip size="small" color="primary" variant="tonal"
                      >Equity/MF</v-chip
                    >
                  </td>
                  <td>&lt; 12 months</td>
                  <td>&gt;= 12 months</td>
                  <td class="text-warning font-weight-medium">20%</td>
                  <td class="text-success font-weight-medium">12.5%</td>
                  <td>LTCG exemption: Rs.1.25L</td>
                </tr>
                <tr>
                  <td>
                    <v-chip size="small" color="info" variant="tonal"
                      >Debt MF</v-chip
                    >
                  </td>
                  <td colspan="2">Any period</td>
                  <td colspan="2" class="text-center">Slab Rate</td>
                  <td>No LTCG benefit (post Apr 2023)</td>
                </tr>
                <tr>
                  <td>
                    <v-chip size="small" color="secondary" variant="tonal"
                      >Property</v-chip
                    >
                  </td>
                  <td>&lt; 24 months</td>
                  <td>&gt;= 24 months</td>
                  <td>Slab Rate</td>
                  <td class="text-success font-weight-medium">12.5%</td>
                  <td>Or 20% with indexation (pre-July 2024)</td>
                </tr>
                <tr>
                  <td>
                    <v-chip size="small" color="warning" variant="tonal"
                      >Gold</v-chip
                    >
                  </td>
                  <td>&lt; 24 months</td>
                  <td>&gt;= 24 months</td>
                  <td>Slab Rate</td>
                  <td class="text-success font-weight-medium">12.5%</td>
                  <td>No indexation post July 2024</td>
                </tr>
                <tr>
                  <td>
                    <v-chip size="small" color="purple" variant="tonal"
                      >Crypto</v-chip
                    >
                  </td>
                  <td colspan="2">Any period</td>
                  <td
                    colspan="2"
                    class="text-center text-error font-weight-medium"
                  >
                    30%
                  </td>
                  <td>Flat rate, no deductions</td>
                </tr>
              </tbody>
            </v-table>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

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
          <v-btn color="error" variant="flat" @click="handleDelete"
            >Delete</v-btn
          >
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>
