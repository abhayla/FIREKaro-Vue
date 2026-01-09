<script setup lang="ts">
import { ref, computed } from "vue";
import SectionHeader from "@/components/shared/SectionHeader.vue";
import {
  useInterestIncomeAPI,
  useAddInterestIncome,
  useUpdateInterestIncome,
  useDeleteInterestIncome,
  useFDMaturityCalendar,
  formatINR,
  formatINRLakhs,
} from "@/composables/useIncome";
import { useFinancialYear } from "@/composables/useSalary";
import { getFinancialYearOptions } from "@/types/salary";
import { INTEREST_DEDUCTION_LIMITS } from "@/types/income";
import type { InterestIncome, InterestIncomeInput } from "@/types/income";

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
const { data: interestData, isLoading } = useInterestIncomeAPI();
const addMutation = useAddInterestIncome();
const updateMutation = useUpdateInterestIncome();
const deleteMutation = useDeleteInterestIncome();

// FD Maturity Calendar (next 12 months)
const calendarStartDate = computed(() => new Date().toISOString().split("T")[0]);
const calendarEndDate = computed(() => {
  const date = new Date();
  date.setFullYear(date.getFullYear() + 1);
  return date.toISOString().split("T")[0];
});
const { data: calendarData } = useFDMaturityCalendar(
  calendarStartDate.value,
  calendarEndDate.value
);

// Form state
const showForm = ref(false);
const editingItem = ref<InterestIncome | null>(null);
const deleteDialog = ref(false);
const deletingId = ref<string | null>(null);

// Summary from API
const summary = computed(() => interestData.value?.summary);
const records = computed(() => interestData.value?.records || []);

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

function formatDate(dateStr: string | null | undefined) {
  if (!dateStr) return "-";
  return new Date(dateStr).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatPercent(value: number | null | undefined) {
  if (value === null || value === undefined) return "-";
  return `${value.toFixed(2)}%`;
}
</script>

<template>
  <div>
    <SectionHeader
      title="Non-Salary Income"
      subtitle="Interest Income"
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
          Add Interest Income
        </v-btn>
      </v-col>
    </v-row>

    <!-- Summary Cards -->
    <v-row class="mb-4">
      <v-col cols="12" sm="6" md="3">
        <v-card>
          <v-card-text>
            <div class="d-flex align-center">
              <v-avatar color="primary" size="48" class="mr-3">
                <v-icon icon="mdi-bank" />
              </v-avatar>
              <div>
                <div class="text-body-2 text-medium-emphasis">Total Interest</div>
                <div class="text-h5 font-weight-bold text-currency">
                  {{ formatINRLakhs(summary?.totalInterest || 0) }}
                </div>
              </div>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
      <v-col cols="12" sm="6" md="3">
        <v-card>
          <v-card-text>
            <div class="d-flex align-center">
              <v-avatar color="error" size="48" class="mr-3">
                <v-icon icon="mdi-receipt" />
              </v-avatar>
              <div>
                <div class="text-body-2 text-medium-emphasis">TDS Deducted</div>
                <div class="text-h5 font-weight-bold text-currency text-negative">
                  {{ formatINRLakhs(summary?.totalTDS || 0) }}
                </div>
              </div>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
      <v-col cols="12" sm="6" md="3">
        <v-card>
          <v-card-text>
            <div class="d-flex align-center">
              <v-avatar color="success" size="48" class="mr-3">
                <v-icon icon="mdi-shield-check" />
              </v-avatar>
              <div>
                <div class="text-body-2 text-medium-emphasis">80TTA Deduction</div>
                <div class="text-h5 font-weight-bold text-currency text-positive">
                  {{ formatINR(summary?.deduction80TTA || 0) }}
                </div>
                <div class="text-caption text-medium-emphasis">
                  Max {{ formatINR(INTEREST_DEDUCTION_LIMITS["80TTA"].limit) }}
                </div>
              </div>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
      <v-col cols="12" sm="6" md="3">
        <v-card>
          <v-card-text>
            <div class="d-flex align-center">
              <v-avatar color="orange" size="48" class="mr-3">
                <v-icon icon="mdi-account-star" />
              </v-avatar>
              <div>
                <div class="text-body-2 text-medium-emphasis">80TTB (Seniors)</div>
                <div class="text-h5 font-weight-bold text-currency text-positive">
                  {{ formatINR(summary?.deduction80TTB || 0) }}
                </div>
                <div class="text-caption text-medium-emphasis">
                  Max {{ formatINR(INTEREST_DEDUCTION_LIMITS["80TTB"].limit) }}
                </div>
              </div>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- FD Maturity Calendar -->
    <v-card class="mb-4" v-if="calendarData && calendarData.records.length > 0">
      <v-card-title class="d-flex align-center">
        <v-icon class="mr-2" color="warning">mdi-calendar-clock</v-icon>
        Upcoming FD/RD Maturities
        <v-chip class="ml-2" size="small" color="warning">
          {{ calendarData.records.length }} upcoming
        </v-chip>
      </v-card-title>
      <v-card-text>
        <v-timeline side="end" density="compact">
          <v-timeline-item
            v-for="maturity in calendarData.records.slice(0, 5)"
            :key="maturity.id"
            :dot-color="maturity.isAutoRenew ? 'success' : 'warning'"
            size="small"
          >
            <template #opposite>
              <span class="text-caption">{{ formatDate(maturity.maturityDate) }}</span>
            </template>
            <v-card variant="tonal" class="pa-2">
              <div class="d-flex justify-space-between align-center">
                <div>
                  <div class="font-weight-medium">{{ maturity.institutionName }}</div>
                  <div class="text-caption text-medium-emphasis">
                    {{ maturity.accountNumber || maturity.sourceType }}
                  </div>
                </div>
                <div class="text-right">
                  <div class="text-currency font-weight-bold">
                    {{ formatINR(maturity.maturityAmount || maturity.principalAmount || 0) }}
                  </div>
                  <v-chip
                    v-if="maturity.isAutoRenew"
                    size="x-small"
                    color="success"
                    variant="flat"
                  >
                    Auto-Renew
                  </v-chip>
                </div>
              </div>
            </v-card>
          </v-timeline-item>
        </v-timeline>
        <div v-if="calendarData.records.length > 5" class="text-center mt-2">
          <v-btn variant="text" size="small" color="primary">
            View All {{ calendarData.records.length }} Maturities
          </v-btn>
        </div>
      </v-card-text>
    </v-card>

    <!-- Interest Income List -->
    <v-card>
      <v-card-title class="d-flex align-center">
        <v-icon class="mr-2">mdi-percent</v-icon>
        Interest Income Records
        <v-chip class="ml-2" size="small" color="primary">
          {{ selectedFinancialYear }}
        </v-chip>
      </v-card-title>

      <v-data-table
        :headers="headers"
        :items="records"
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
            {{ item.principalAmount ? formatINR(item.principalAmount) : "-" }}
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
            {{ item.tdsDeducted > 0 ? formatINR(item.tdsDeducted) : "-" }}
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

    <!-- Info Cards -->
    <v-row class="mt-6">
      <v-col cols="12" md="6">
        <v-card variant="outlined">
          <v-card-title>
            <v-icon class="mr-2" color="success">mdi-shield-check</v-icon>
            Section 80TTA - Savings Interest
          </v-card-title>
          <v-card-text>
            <v-list density="compact">
              <v-list-item>
                <template #prepend>
                  <v-icon icon="mdi-check" color="success" size="small" />
                </template>
                <v-list-item-title>Eligibility</v-list-item-title>
                <v-list-item-subtitle>
                  Individuals & HUFs (below 60 years)
                </v-list-item-subtitle>
              </v-list-item>
              <v-list-item>
                <template #prepend>
                  <v-icon icon="mdi-check" color="success" size="small" />
                </template>
                <v-list-item-title>Deduction Limit</v-list-item-title>
                <v-list-item-subtitle>
                  Up to {{ formatINR(INTEREST_DEDUCTION_LIMITS["80TTA"].limit) }} per year
                </v-list-item-subtitle>
              </v-list-item>
              <v-list-item>
                <template #prepend>
                  <v-icon icon="mdi-check" color="success" size="small" />
                </template>
                <v-list-item-title>Applicable On</v-list-item-title>
                <v-list-item-subtitle>
                  Savings bank, co-op bank, post office accounts
                </v-list-item-subtitle>
              </v-list-item>
              <v-list-item>
                <template #prepend>
                  <v-icon icon="mdi-close" color="error" size="small" />
                </template>
                <v-list-item-title>Not Applicable</v-list-item-title>
                <v-list-item-subtitle>
                  FD, RD, corporate bonds, P2P lending
                </v-list-item-subtitle>
              </v-list-item>
            </v-list>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" md="6">
        <v-card variant="outlined">
          <v-card-title>
            <v-icon class="mr-2" color="orange">mdi-account-star</v-icon>
            Section 80TTB - Senior Citizens
          </v-card-title>
          <v-card-text>
            <v-list density="compact">
              <v-list-item>
                <template #prepend>
                  <v-icon icon="mdi-check" color="success" size="small" />
                </template>
                <v-list-item-title>Eligibility</v-list-item-title>
                <v-list-item-subtitle>
                  Senior Citizens (60+ years)
                </v-list-item-subtitle>
              </v-list-item>
              <v-list-item>
                <template #prepend>
                  <v-icon icon="mdi-check" color="success" size="small" />
                </template>
                <v-list-item-title>Deduction Limit</v-list-item-title>
                <v-list-item-subtitle>
                  Up to {{ formatINR(INTEREST_DEDUCTION_LIMITS["80TTB"].limit) }} per year
                </v-list-item-subtitle>
              </v-list-item>
              <v-list-item>
                <template #prepend>
                  <v-icon icon="mdi-check" color="success" size="small" />
                </template>
                <v-list-item-title>Applicable On</v-list-item-title>
                <v-list-item-subtitle>
                  All interest: Savings, FD, RD, post office schemes
                </v-list-item-subtitle>
              </v-list-item>
              <v-list-item>
                <template #prepend>
                  <v-icon icon="mdi-alert" color="warning" size="small" />
                </template>
                <v-list-item-title>Note</v-list-item-title>
                <v-list-item-subtitle>
                  80TTA and 80TTB are mutually exclusive
                </v-list-item-subtitle>
              </v-list-item>
            </v-list>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Form Dialog -->
    <v-dialog v-model="showForm" max-width="700" persistent>
      <v-card>
        <v-card-title class="d-flex align-center">
          <v-icon class="mr-2">mdi-percent</v-icon>
          {{ editingItem ? "Edit" : "Add" }} Interest Income
        </v-card-title>
        <v-card-text>
          <v-form>
            <v-row>
              <v-col cols="12" md="6">
                <v-select
                  label="Source Type"
                  :items="[
                    { title: 'Fixed Deposit (FD)', value: 'FD' },
                    { title: 'Recurring Deposit (RD)', value: 'RD' },
                    { title: 'Savings Account', value: 'SAVINGS' },
                    { title: 'P2P Lending', value: 'P2P' },
                    { title: 'Bonds', value: 'BONDS' },
                    { title: 'National Savings Certificate', value: 'NSC' },
                    { title: 'Senior Citizen Savings Scheme', value: 'SCSS' },
                    { title: 'Public Provident Fund', value: 'PPF' },
                    { title: 'Other', value: 'OTHER' },
                  ]"
                  item-title="title"
                  item-value="value"
                  required
                />
              </v-col>
              <v-col cols="12" md="6">
                <v-text-field label="Institution Name" required />
              </v-col>
              <v-col cols="12" md="6">
                <v-text-field label="Account Number" />
              </v-col>
              <v-col cols="12" md="6">
                <v-text-field label="Branch Name" />
              </v-col>
              <v-col cols="12" md="4">
                <v-text-field
                  label="Principal Amount"
                  type="number"
                  prefix="₹"
                />
              </v-col>
              <v-col cols="12" md="4">
                <v-text-field
                  label="Interest Rate"
                  type="number"
                  suffix="%"
                />
              </v-col>
              <v-col cols="12" md="4">
                <v-text-field
                  label="Interest Earned"
                  type="number"
                  prefix="₹"
                  required
                />
              </v-col>
              <v-col cols="12" md="4">
                <v-text-field
                  label="TDS Deducted"
                  type="number"
                  prefix="₹"
                />
              </v-col>
              <v-col cols="12" md="4">
                <v-text-field label="Deposit Date" type="date" />
              </v-col>
              <v-col cols="12" md="4">
                <v-text-field label="Maturity Date" type="date" />
              </v-col>
              <v-col cols="12" md="6">
                <v-checkbox
                  label="Auto-Renew on Maturity"
                  hide-details
                />
              </v-col>
              <v-col cols="12" md="6">
                <v-checkbox
                  label="Form 16A Received"
                  hide-details
                />
              </v-col>
            </v-row>
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="showForm = false">Cancel</v-btn>
          <v-btn color="primary" variant="flat">
            {{ editingItem ? "Update" : "Add" }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

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
