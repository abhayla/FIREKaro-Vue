<script setup lang="ts">
import { ref, computed } from "vue";
import SectionHeader from "@/components/shared/SectionHeader.vue";
import RentalIncomeForm from "@/components/income/RentalIncomeForm.vue";
import PreConstructionInterest from "@/components/income/PreConstructionInterest.vue";
import CoOwnerSplit from "@/components/income/CoOwnerSplit.vue";
import {
  useRentalIncome,
  useAddRentalIncome,
  useUpdateRentalIncome,
  useDeleteRentalIncome,
  formatINR,
  formatINRLakhs,
} from "@/composables/useIncome";
import { useFinancialYear } from "@/composables/useSalary";
import { getFinancialYearOptions } from "@/types/salary";
import { SECTION_24_LIMITS } from "@/types/income";
import type { RentalIncome, RentalIncomeInput } from "@/types/income";

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
const { data: rentalData, isLoading } = useRentalIncome();
const addMutation = useAddRentalIncome();
const updateMutation = useUpdateRentalIncome();
const deleteMutation = useDeleteRentalIncome();

// Form state
const showForm = ref(false);
const editingItem = ref<RentalIncome | null>(null);
const deleteDialog = ref(false);
const deletingId = ref<string | null>(null);

// Tools tab
const activeToolTab = ref("pre-construction");

// Summary stats
const totalGrossRent = computed(
  () => rentalData.value?.reduce((sum, r) => sum + r.annualRent, 0) || 0,
);
const totalNetIncome = computed(
  () => rentalData.value?.reduce((sum, r) => sum + r.netAnnualValue, 0) || 0,
);
const totalDeductions = computed(
  () =>
    rentalData.value?.reduce(
      (sum, r) => sum + r.standardDeduction + r.housingLoanInterest,
      0,
    ) || 0,
);
const propertyCount = computed(() => rentalData.value?.length || 0);

// Table headers
const headers = [
  { title: "Property", key: "propertyName", sortable: true },
  { title: "Type", key: "propertyType", sortable: true },
  { title: "Monthly Rent", key: "monthlyRent", align: "end" as const },
  { title: "Annual Rent", key: "annualRent", align: "end" as const },
  { title: "Deductions", key: "deductions", align: "end" as const },
  { title: "Taxable Income", key: "netAnnualValue", align: "end" as const },
  { title: "Tenant", key: "tenantName" },
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
  editingItem.value = null;
}

async function handleDelete() {
  if (deletingId.value) {
    await deleteMutation.mutateAsync(deletingId.value);
    deleteDialog.value = false;
    deletingId.value = null;
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
</script>

<template>
  <div>
    <SectionHeader
      title="Non-Salary Income"
      subtitle="Rental & House Property Income"
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
          Add Property
        </v-btn>
      </v-col>
    </v-row>

    <!-- Summary Cards -->
    <v-row class="mb-4">
      <v-col cols="12" md="3">
        <v-card>
          <v-card-text>
            <div class="d-flex align-center">
              <v-avatar color="secondary" size="48" class="mr-3">
                <v-icon icon="mdi-home-city" />
              </v-avatar>
              <div>
                <div class="text-body-2 text-medium-emphasis">Properties</div>
                <div class="text-h5 font-weight-bold">{{ propertyCount }}</div>
              </div>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
      <v-col cols="12" md="3">
        <v-card>
          <v-card-text>
            <div class="d-flex align-center">
              <v-avatar color="info" size="48" class="mr-3">
                <v-icon icon="mdi-cash" />
              </v-avatar>
              <div>
                <div class="text-body-2 text-medium-emphasis">
                  Gross Annual Rent
                </div>
                <div class="text-h5 font-weight-bold text-currency">
                  {{ formatINRLakhs(totalGrossRent) }}
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
                <v-icon icon="mdi-minus-circle" />
              </v-avatar>
              <div>
                <div class="text-body-2 text-medium-emphasis">
                  Section 24 Deductions
                </div>
                <div
                  class="text-h5 font-weight-bold text-currency text-negative"
                >
                  {{ formatINRLakhs(totalDeductions) }}
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
                <v-icon icon="mdi-check-circle" />
              </v-avatar>
              <div>
                <div class="text-body-2 text-medium-emphasis">
                  Taxable Income
                </div>
                <div
                  class="text-h5 font-weight-bold text-currency"
                  :class="
                    totalNetIncome >= 0 ? 'text-positive' : 'text-negative'
                  "
                >
                  {{ formatINRLakhs(totalNetIncome) }}
                </div>
              </div>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Tools Section -->
    <v-row class="mb-4">
      <v-col cols="12">
        <v-expansion-panels>
          <v-expansion-panel>
            <v-expansion-panel-title>
              <v-icon class="mr-2" color="secondary">mdi-calculator-variant</v-icon>
              <span class="font-weight-medium">Rental Income Tools & Calculators</span>
            </v-expansion-panel-title>
            <v-expansion-panel-text>
              <v-tabs v-model="activeToolTab" color="primary" class="mb-4">
                <v-tab value="pre-construction">Pre-Construction Interest</v-tab>
                <v-tab value="co-owner">Co-Owner Split Calculator</v-tab>
              </v-tabs>

              <v-tabs-window v-model="activeToolTab">
                <v-tabs-window-item value="pre-construction">
                  <PreConstructionInterest />
                </v-tabs-window-item>
                <v-tabs-window-item value="co-owner">
                  <CoOwnerSplit />
                </v-tabs-window-item>
              </v-tabs-window>
            </v-expansion-panel-text>
          </v-expansion-panel>
        </v-expansion-panels>
      </v-col>
    </v-row>

    <!-- Property List -->
    <v-card>
      <v-card-title class="d-flex align-center">
        <v-icon class="mr-2">mdi-home-city</v-icon>
        Rental Properties
        <v-chip class="ml-2" size="small" color="secondary">
          {{ selectedFinancialYear }}
        </v-chip>
      </v-card-title>

      <v-data-table
        :headers="headers"
        :items="rentalData || []"
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
            :class="
              item.netAnnualValue >= 0 ? 'text-positive' : 'text-negative'
            "
          >
            {{ formatINR(item.netAnnualValue) }}
          </span>
        </template>

        <template #item.tenantName="{ item }">
          <span v-if="item.tenantName" class="text-caption">{{
            item.tenantName
          }}</span>
          <span v-else class="text-caption text-medium-emphasis">-</span>
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

    <!-- Info Card -->
    <v-row class="mt-6">
      <v-col cols="12">
        <v-card variant="outlined">
          <v-card-title>
            <v-icon class="mr-2" color="secondary">mdi-information</v-icon>
            Section 24 - Income from House Property
          </v-card-title>
          <v-card-text>
            <v-row>
              <v-col cols="12" md="4">
                <v-list density="compact">
                  <v-list-subheader>Standard Deduction</v-list-subheader>
                  <v-list-item>
                    <template #prepend>
                      <v-icon icon="mdi-check" color="success" size="small" />
                    </template>
                    <v-list-item-title>30% of NAV</v-list-item-title>
                    <v-list-item-subtitle
                      >Automatic for let-out property</v-list-item-subtitle
                    >
                  </v-list-item>
                </v-list>
              </v-col>
              <v-col cols="12" md="4">
                <v-list density="compact">
                  <v-list-subheader>Interest on Housing Loan</v-list-subheader>
                  <v-list-item>
                    <template #prepend>
                      <v-icon icon="mdi-check" color="success" size="small" />
                    </template>
                    <v-list-item-title>Self-Occupied</v-list-item-title>
                    <v-list-item-subtitle
                      >Max
                      {{
                        formatINR(SECTION_24_LIMITS.selfOccupiedInterestLimit)
                      }}/year</v-list-item-subtitle
                    >
                  </v-list-item>
                  <v-list-item>
                    <template #prepend>
                      <v-icon icon="mdi-check" color="success" size="small" />
                    </template>
                    <v-list-item-title>Let-Out Property</v-list-item-title>
                    <v-list-item-subtitle
                      >No limit on interest deduction</v-list-item-subtitle
                    >
                  </v-list-item>
                </v-list>
              </v-col>
              <v-col cols="12" md="4">
                <v-list density="compact">
                  <v-list-subheader>Loss from House Property</v-list-subheader>
                  <v-list-item>
                    <template #prepend>
                      <v-icon icon="mdi-alert" color="warning" size="small" />
                    </template>
                    <v-list-item-title>Set-off Limit</v-list-item-title>
                    <v-list-item-subtitle
                      >Max {{ formatINR(200000) }} against other
                      income</v-list-item-subtitle
                    >
                  </v-list-item>
                  <v-list-item>
                    <template #prepend>
                      <v-icon icon="mdi-calendar" color="info" size="small" />
                    </template>
                    <v-list-item-title>Carry Forward</v-list-item-title>
                    <v-list-item-subtitle
                      >Excess loss for 8 years</v-list-item-subtitle
                    >
                  </v-list-item>
                </v-list>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

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
          <v-btn color="error" variant="flat" @click="handleDelete"
            >Delete</v-btn
          >
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>
