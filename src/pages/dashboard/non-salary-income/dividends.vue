<script setup lang="ts">
import { ref, computed } from "vue";
import SectionHeader from "@/components/shared/SectionHeader.vue";
import {
  useDividendIncomeAPI,
  useAddDividendIncome,
  useUpdateDividendIncome,
  useDeleteDividendIncome,
  formatINR,
  formatINRLakhs,
} from "@/composables/useIncome";
import { useFinancialYear } from "@/composables/useSalary";
import { getFinancialYearOptions } from "@/types/salary";
import { DIVIDEND_TDS_THRESHOLD } from "@/types/income";
import type { DividendIncome, DividendIncomeInput } from "@/types/income";

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
const { data: dividendData, isLoading } = useDividendIncomeAPI();
const addMutation = useAddDividendIncome();
const updateMutation = useUpdateDividendIncome();
const deleteMutation = useDeleteDividendIncome();

// Form state
const showForm = ref(false);
const editingItem = ref<DividendIncome | null>(null);
const deleteDialog = ref(false);
const deletingId = ref<string | null>(null);

// Summary from API
const summary = computed(() => dividendData.value?.summary);
const records = computed(() => dividendData.value?.records || []);

// TDS threshold alert
const companiesAboveThreshold = computed(
  () => summary.value?.companiesAboveThreshold || []
);

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
      subtitle="Dividend Income"
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
          Add Dividend
        </v-btn>
      </v-col>
    </v-row>

    <!-- TDS Threshold Alert -->
    <v-alert
      v-if="companiesAboveThreshold.length > 0"
      type="warning"
      variant="tonal"
      class="mb-4"
      icon="mdi-alert"
    >
      <div class="font-weight-medium">TDS Threshold Alert</div>
      <div class="text-body-2">
        {{ companiesAboveThreshold.length }} company/fund(s) have dividends exceeding
        {{ formatINR(DIVIDEND_TDS_THRESHOLD.threshold) }}. TDS at {{ DIVIDEND_TDS_THRESHOLD.tdsRate * 100 }}%
        should be deducted.
      </div>
      <v-list density="compact" class="mt-2 bg-transparent">
        <v-list-item
          v-for="item in companiesAboveThreshold"
          :key="item.company"
          class="px-0"
        >
          <template #prepend>
            <v-icon icon="mdi-domain" size="small" class="mr-2" />
          </template>
          <v-list-item-title>{{ item.company }}</v-list-item-title>
          <template #append>
            <span class="text-caption">
              {{ formatINR(item.amount) }} (Expected TDS: {{ formatINR(item.expectedTDS) }})
            </span>
          </template>
        </v-list-item>
      </v-list>
    </v-alert>

    <!-- Summary Cards -->
    <v-row class="mb-4">
      <v-col cols="12" sm="6" md="3">
        <v-card>
          <v-card-text>
            <div class="d-flex align-center">
              <v-avatar color="primary" size="48" class="mr-3">
                <v-icon icon="mdi-cash-multiple" />
              </v-avatar>
              <div>
                <div class="text-body-2 text-medium-emphasis">Total Dividends</div>
                <div class="text-h5 font-weight-bold text-currency">
                  {{ formatINRLakhs(summary?.totalDividend || 0) }}
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
                <v-icon icon="mdi-cash-check" />
              </v-avatar>
              <div>
                <div class="text-body-2 text-medium-emphasis">Net Dividend</div>
                <div class="text-h5 font-weight-bold text-currency text-positive">
                  {{ formatINRLakhs(summary?.netDividend || 0) }}
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
              <v-avatar color="info" size="48" class="mr-3">
                <v-icon icon="mdi-percent" />
              </v-avatar>
              <div>
                <div class="text-body-2 text-medium-emphasis">Avg Yield</div>
                <div class="text-h5 font-weight-bold text-currency">
                  {{ formatPercent(summary?.avgYield) }}
                </div>
              </div>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Source Type Breakdown -->
    <v-row class="mb-4" v-if="summary?.bySourceType && summary.bySourceType.length > 1">
      <v-col cols="12">
        <v-card>
          <v-card-title>
            <v-icon class="mr-2">mdi-chart-pie</v-icon>
            Dividend Breakdown by Type
          </v-card-title>
          <v-card-text>
            <v-row>
              <v-col
                v-for="source in summary.bySourceType"
                :key="source.type"
                cols="6"
                md="3"
              >
                <v-card variant="tonal" :color="getSourceTypeColor(source.type)">
                  <v-card-text class="text-center">
                    <div class="text-h6 font-weight-bold">
                      {{ formatINR(source.dividend) }}
                    </div>
                    <div class="text-body-2">{{ getSourceTypeLabel(source.type) }}</div>
                    <div class="text-caption text-medium-emphasis">
                      {{ source.count }} record(s)
                    </div>
                  </v-card-text>
                </v-card>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Dividend List -->
    <v-card>
      <v-card-title class="d-flex align-center">
        <v-icon class="mr-2">mdi-cash-multiple</v-icon>
        Dividend Records
        <v-chip class="ml-2" size="small" color="primary">
          {{ selectedFinancialYear }}
        </v-chip>
        <v-spacer />
        <span class="text-body-2 text-medium-emphasis">
          {{ summary?.recordCount || 0 }} records
        </span>
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

        <template #item.symbol="{ item }">
          <span class="font-weight-medium">{{ item.symbol || "-" }}</span>
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
            {{ item.tdsDeducted > 0 ? formatINR(item.tdsDeducted) : "-" }}
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

    <!-- Info Cards -->
    <v-row class="mt-6">
      <v-col cols="12" md="6">
        <v-card variant="outlined">
          <v-card-title>
            <v-icon class="mr-2" color="primary">mdi-information</v-icon>
            Dividend Taxation Rules
          </v-card-title>
          <v-card-text>
            <v-list density="compact">
              <v-list-item>
                <template #prepend>
                  <v-icon icon="mdi-check" color="success" size="small" />
                </template>
                <v-list-item-title>Tax Rate</v-list-item-title>
                <v-list-item-subtitle>
                  Taxed at applicable slab rate (no special rates)
                </v-list-item-subtitle>
              </v-list-item>
              <v-list-item>
                <template #prepend>
                  <v-icon icon="mdi-check" color="success" size="small" />
                </template>
                <v-list-item-title>TDS Threshold</v-list-item-title>
                <v-list-item-subtitle>
                  {{ DIVIDEND_TDS_THRESHOLD.tdsRate * 100 }}% TDS if dividend exceeds
                  {{ formatINR(DIVIDEND_TDS_THRESHOLD.threshold) }} per company
                </v-list-item-subtitle>
              </v-list-item>
              <v-list-item>
                <template #prepend>
                  <v-icon icon="mdi-check" color="success" size="small" />
                </template>
                <v-list-item-title>Reporting</v-list-item-title>
                <v-list-item-subtitle>
                  Report under "Income from Other Sources"
                </v-list-item-subtitle>
              </v-list-item>
              <v-list-item>
                <template #prepend>
                  <v-icon icon="mdi-file-document" color="primary" size="small" />
                </template>
                <v-list-item-title>ITR Form</v-list-item-title>
                <v-list-item-subtitle>ITR-2 or ITR-3</v-list-item-subtitle>
              </v-list-item>
            </v-list>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" md="6">
        <v-card variant="outlined">
          <v-card-title>
            <v-icon class="mr-2" color="info">mdi-lightbulb</v-icon>
            Dividend Yield Tips
          </v-card-title>
          <v-card-text>
            <v-list density="compact">
              <v-list-item>
                <template #prepend>
                  <v-icon icon="mdi-trending-up" color="success" size="small" />
                </template>
                <v-list-item-title>Good Yield</v-list-item-title>
                <v-list-item-subtitle>
                  Generally 2-4% is considered healthy for stocks
                </v-list-item-subtitle>
              </v-list-item>
              <v-list-item>
                <template #prepend>
                  <v-icon icon="mdi-alert" color="warning" size="small" />
                </template>
                <v-list-item-title>Very High Yield</v-list-item-title>
                <v-list-item-subtitle>
                  &gt;10% yield may indicate stock price decline or special dividend
                </v-list-item-subtitle>
              </v-list-item>
              <v-list-item>
                <template #prepend>
                  <v-icon icon="mdi-calendar" color="info" size="small" />
                </template>
                <v-list-item-title>Ex-Dividend Date</v-list-item-title>
                <v-list-item-subtitle>
                  Must hold before ex-date to receive dividend
                </v-list-item-subtitle>
              </v-list-item>
              <v-list-item>
                <template #prepend>
                  <v-icon icon="mdi-home-city" color="secondary" size="small" />
                </template>
                <v-list-item-title>REITs/InvITs</v-list-item-title>
                <v-list-item-subtitle>
                  Required to distribute 90% of income as dividends
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
          <v-icon class="mr-2">mdi-cash-multiple</v-icon>
          {{ editingItem ? "Edit" : "Add" }} Dividend Income
        </v-card-title>
        <v-card-text>
          <v-form>
            <v-row>
              <v-col cols="12" md="6">
                <v-select
                  label="Source Type"
                  :items="[
                    { title: 'Stock', value: 'STOCK' },
                    { title: 'Mutual Fund', value: 'MUTUAL_FUND' },
                    { title: 'REIT', value: 'REIT' },
                    { title: 'InvIT', value: 'INVIT' },
                  ]"
                  item-title="title"
                  item-value="value"
                  required
                />
              </v-col>
              <v-col cols="12" md="6">
                <v-text-field label="Company/Fund Name" required />
              </v-col>
              <v-col cols="12" md="4">
                <v-text-field label="Symbol/Ticker" />
              </v-col>
              <v-col cols="12" md="4">
                <v-text-field label="ISIN" />
              </v-col>
              <v-col cols="12" md="4">
                <v-text-field label="Folio Number" hint="For mutual funds" />
              </v-col>
              <v-col cols="12" md="6">
                <v-select
                  label="Dividend Type"
                  :items="[
                    { title: 'Interim', value: 'INTERIM' },
                    { title: 'Final', value: 'FINAL' },
                    { title: 'Special', value: 'SPECIAL' },
                  ]"
                  item-title="title"
                  item-value="value"
                />
              </v-col>
              <v-col cols="12" md="6">
                <v-text-field label="Payment Date" type="date" required />
              </v-col>
              <v-col cols="12" md="4">
                <v-text-field
                  label="Dividend Per Share"
                  type="number"
                  prefix="₹"
                />
              </v-col>
              <v-col cols="12" md="4">
                <v-text-field
                  label="Number of Shares"
                  type="number"
                />
              </v-col>
              <v-col cols="12" md="4">
                <v-text-field
                  label="Total Dividend"
                  type="number"
                  prefix="₹"
                  required
                />
              </v-col>
              <v-col cols="12" md="6">
                <v-text-field
                  label="TDS Deducted"
                  type="number"
                  prefix="₹"
                />
              </v-col>
              <v-col cols="12" md="6">
                <v-text-field
                  label="Investment Value"
                  type="number"
                  prefix="₹"
                  hint="For yield calculation"
                />
              </v-col>
              <v-col cols="12" md="6">
                <v-text-field label="Demat Account" />
              </v-col>
              <v-col cols="12" md="6">
                <v-text-field label="Broker Name" />
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
