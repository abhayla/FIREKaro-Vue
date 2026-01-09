<script setup lang="ts">
import { ref, computed, watch } from "vue";
import SectionHeader from "@/components/shared/SectionHeader.vue";
import AdvanceTaxTimeline from "@/components/tax/AdvanceTaxTimeline.vue";
import AdvanceTaxPaymentForm from "@/components/tax/AdvanceTaxPaymentForm.vue";
import InterestCalculator from "@/components/tax/InterestCalculator.vue";
import {
  useAdvanceTaxEstimate,
  useCreateAdvanceTaxEstimate,
  useRecalculateAdvanceTax,
  useAdvanceTaxPayments,
  useAddAdvanceTaxPayment,
  useDeleteAdvanceTaxPayment,
  formatINR,
} from "@/composables/useTax";
import { useFinancialYear } from "@/composables/useSalary";

const tabs = [
  { title: "Overview", route: "/dashboard/tax-planning" },
  { title: "Calculator", route: "/dashboard/tax-planning/calculator" },
  { title: "Deductions", route: "/dashboard/tax-planning/deductions" },
  { title: "Advance Tax", route: "/dashboard/tax-planning/advance-tax" },
  { title: "Scenarios", route: "/dashboard/tax-planning/scenarios" },
  { title: "Reports", route: "/dashboard/tax-planning/reports" },
];

const { selectedFinancialYear, financialYearOptions } = useFinancialYear();

// Data queries
const { data: estimate, isLoading: estimateLoading, refetch: refetchEstimate } = useAdvanceTaxEstimate();
const { data: payments, isLoading: paymentsLoading } = useAdvanceTaxPayments();

// Mutations
const createEstimate = useCreateAdvanceTaxEstimate();
const recalculate = useRecalculateAdvanceTax();
const addPayment = useAddAdvanceTaxPayment();
const deletePayment = useDeleteAdvanceTaxPayment();

// UI state
const showPaymentForm = ref(false);
const editingPayment = ref<any>(null);
const deleteDialog = ref(false);
const paymentToDelete = ref<string | null>(null);

// Computed values
const hasEstimate = computed(() => !!estimate.value?.id);

const totalPaid = computed(() => {
  return payments.value?.reduce((sum: number, p: any) => sum + (p.amount || 0), 0) ?? 0;
});

const remainingTax = computed(() => {
  const net = estimate.value?.netTaxLiability ?? 0;
  return Math.max(0, net - totalPaid.value);
});

const totalInterest = computed(() => {
  return (estimate.value?.interest234B ?? 0) + (estimate.value?.interest234C ?? 0);
});

const advanceTaxRequired = computed(() => {
  return estimate.value?.advanceTaxRequired ?? false;
});

interface Payment {
  id: string;
  paymentDate: string | Date;
  quarter: number;
  amount: number;
  challanSerialNumber: string;
  bsrCode: string;
}

const paymentHeaders = [
  { title: "Date", key: "paymentDate", sortable: true },
  { title: "Quarter", key: "quarter", sortable: true },
  { title: "Amount", key: "amount", align: "end" as const },
  { title: "Challan No.", key: "challanSerialNumber" },
  { title: "BSR Code", key: "bsrCode" },
  { title: "Actions", key: "actions", sortable: false, align: "end" as const },
];

// Create estimate for current FY if not exists
async function handleCreateEstimate() {
  try {
    await createEstimate.mutateAsync({
      financialYear: selectedFinancialYear.value,
      selectedRegime: "NEW",
    });
  } catch (error) {
    console.error("Failed to create estimate:", error);
  }
}

// Recalculate advance tax
async function handleRecalculate() {
  if (!estimate.value?.id) return;
  try {
    await recalculate.mutateAsync(estimate.value.id);
  } catch (error) {
    console.error("Failed to recalculate:", error);
  }
}

// Open payment form
function openPaymentForm(payment?: any) {
  editingPayment.value = payment || null;
  showPaymentForm.value = true;
}

// Save payment
async function handleSavePayment(paymentData: any) {
  if (!estimate.value?.id) return;

  try {
    await addPayment.mutateAsync({
      estimateId: estimate.value.id,
      ...paymentData,
    });
    showPaymentForm.value = false;
    editingPayment.value = null;
  } catch (error) {
    console.error("Failed to save payment:", error);
  }
}

// Delete payment
function confirmDelete(paymentId: string) {
  paymentToDelete.value = paymentId;
  deleteDialog.value = true;
}

async function handleDeletePayment() {
  if (!paymentToDelete.value || !estimate.value?.id) return;

  try {
    await deletePayment.mutateAsync({
      estimateId: estimate.value.id,
      paymentId: paymentToDelete.value,
    });
    deleteDialog.value = false;
    paymentToDelete.value = null;
  } catch (error) {
    console.error("Failed to delete payment:", error);
  }
}

function formatDate(date: string | Date) {
  return new Date(date).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function getQuarterLabel(quarter: number) {
  const labels: Record<number, string> = {
    1: "Q1 (Jun)",
    2: "Q2 (Sep)",
    3: "Q3 (Dec)",
    4: "Q4 (Mar)",
  };
  return labels[quarter] || `Q${quarter}`;
}
</script>

<template>
  <div>
    <SectionHeader
      title="Tax Planning"
      subtitle="Advance Tax Schedule & Payments"
      icon="mdi-calendar-clock"
      :tabs="tabs"
    />

    <!-- Controls Row -->
    <v-row class="mb-6" align="center">
      <v-col cols="12" sm="6" md="4">
        <v-select
          v-model="selectedFinancialYear"
          :items="financialYearOptions"
          label="Financial Year"
          variant="outlined"
          density="compact"
          hide-details
          prepend-inner-icon="mdi-calendar"
        />
      </v-col>
      <v-col cols="12" md="4" class="text-md-end">
        <v-btn
          v-if="hasEstimate"
          color="primary"
          variant="tonal"
          prepend-icon="mdi-refresh"
          :loading="recalculate.isPending.value"
          @click="handleRecalculate"
        >
          Recalculate
        </v-btn>
      </v-col>
    </v-row>

    <!-- No Estimate State -->
    <v-card v-if="!hasEstimate && !estimateLoading" class="mb-6">
      <v-card-text class="text-center py-12">
        <v-icon icon="mdi-calendar-clock" size="64" color="grey-lighten-1" class="mb-4" />
        <h3 class="text-h6 mb-2">No Advance Tax Estimate</h3>
        <p class="text-body-2 text-medium-emphasis mb-4">
          Create an advance tax estimate for {{ selectedFinancialYear }} to track your quarterly payments.
        </p>
        <v-btn
          color="primary"
          prepend-icon="mdi-plus"
          :loading="createEstimate.isPending.value"
          @click="handleCreateEstimate"
        >
          Create Estimate
        </v-btn>
      </v-card-text>
    </v-card>

    <!-- Loading State -->
    <v-skeleton-loader v-else-if="estimateLoading" type="card, card, table" />

    <!-- Main Content -->
    <template v-else-if="hasEstimate">
      <!-- Summary Cards -->
      <v-row class="mb-6">
        <v-col cols="12" sm="6" md="3">
          <v-card class="pa-4">
            <div class="d-flex align-center mb-2">
              <v-avatar color="primary" size="40" class="mr-3">
                <v-icon>mdi-calculator</v-icon>
              </v-avatar>
              <div>
                <div class="text-body-2 text-medium-emphasis">Net Tax Liability</div>
                <div class="text-h5 font-weight-bold text-currency">
                  {{ formatINR(estimate?.netTaxLiability ?? 0) }}
                </div>
              </div>
            </div>
            <v-chip
              v-if="advanceTaxRequired"
              color="warning"
              size="x-small"
              prepend-icon="mdi-alert"
            >
              Advance Tax Required
            </v-chip>
            <v-chip v-else color="success" size="x-small" prepend-icon="mdi-check">
              Below Threshold
            </v-chip>
          </v-card>
        </v-col>

        <v-col cols="12" sm="6" md="3">
          <v-card class="pa-4">
            <div class="d-flex align-center mb-2">
              <v-avatar color="success" size="40" class="mr-3">
                <v-icon>mdi-cash-check</v-icon>
              </v-avatar>
              <div>
                <div class="text-body-2 text-medium-emphasis">Total Paid</div>
                <div class="text-h5 font-weight-bold text-currency text-success">
                  {{ formatINR(totalPaid) }}
                </div>
              </div>
            </div>
            <div class="text-caption text-medium-emphasis">
              {{ payments?.length ?? 0 }} payment(s) recorded
            </div>
          </v-card>
        </v-col>

        <v-col cols="12" sm="6" md="3">
          <v-card class="pa-4">
            <div class="d-flex align-center mb-2">
              <v-avatar :color="remainingTax > 0 ? 'warning' : 'success'" size="40" class="mr-3">
                <v-icon>{{ remainingTax > 0 ? 'mdi-clock-alert' : 'mdi-check-circle' }}</v-icon>
              </v-avatar>
              <div>
                <div class="text-body-2 text-medium-emphasis">Remaining</div>
                <div class="text-h5 font-weight-bold text-currency" :class="remainingTax > 0 ? 'text-warning' : 'text-success'">
                  {{ formatINR(remainingTax) }}
                </div>
              </div>
            </div>
            <div class="text-caption text-medium-emphasis">
              {{ remainingTax > 0 ? 'Balance to be paid' : 'Fully paid!' }}
            </div>
          </v-card>
        </v-col>

        <v-col cols="12" sm="6" md="3">
          <v-card class="pa-4" :class="totalInterest > 0 ? 'bg-error-lighten-5' : ''">
            <div class="d-flex align-center mb-2">
              <v-avatar :color="totalInterest > 0 ? 'error' : 'grey'" size="40" class="mr-3">
                <v-icon>mdi-percent</v-icon>
              </v-avatar>
              <div>
                <div class="text-body-2 text-medium-emphasis">Interest (234B+C)</div>
                <div class="text-h5 font-weight-bold text-currency" :class="totalInterest > 0 ? 'text-error' : ''">
                  {{ formatINR(totalInterest) }}
                </div>
              </div>
            </div>
            <div v-if="totalInterest > 0" class="text-caption text-error">
              234B: {{ formatINR(estimate?.interest234B ?? 0) }} |
              234C: {{ formatINR(estimate?.interest234C ?? 0) }}
            </div>
            <div v-else class="text-caption text-medium-emphasis">
              No interest liability
            </div>
          </v-card>
        </v-col>
      </v-row>

      <!-- Quarterly Timeline -->
      <v-row class="mb-6">
        <v-col cols="12" lg="8">
          <AdvanceTaxTimeline
            :schedules="estimate?.schedules ?? []"
            :financial-year="selectedFinancialYear"
          />
        </v-col>

        <v-col cols="12" lg="4">
          <InterestCalculator
            :estimate="estimate ?? null"
            :total-paid="totalPaid"
          />
        </v-col>
      </v-row>

      <!-- Payment History -->
      <v-card>
        <v-card-title class="d-flex align-center">
          <v-icon class="mr-2">mdi-history</v-icon>
          Payment History
          <v-spacer />
          <v-btn
            color="primary"
            variant="tonal"
            prepend-icon="mdi-plus"
            @click="openPaymentForm()"
          >
            Add Payment
          </v-btn>
        </v-card-title>

        <v-data-table
          :headers="paymentHeaders"
          :items="payments ?? []"
          :loading="paymentsLoading"
          :items-per-page="10"
          class="elevation-0"
        >
          <template #[`item.paymentDate`]="{ item }">
            {{ formatDate((item as Payment).paymentDate) }}
          </template>

          <template #[`item.quarter`]="{ item }">
            <v-chip size="small" color="primary" variant="tonal">
              {{ getQuarterLabel((item as Payment).quarter) }}
            </v-chip>
          </template>

          <template #[`item.amount`]="{ item }">
            <span class="text-currency font-weight-medium">
              {{ formatINR((item as Payment).amount) }}
            </span>
          </template>

          <template #[`item.actions`]="{ item }">
            <v-btn
              icon="mdi-delete"
              size="small"
              variant="text"
              color="error"
              @click="confirmDelete((item as Payment).id)"
            />
          </template>

          <template #no-data>
            <div class="text-center py-8">
              <v-icon icon="mdi-cash-off" size="48" color="grey-lighten-1" class="mb-2" />
              <div class="text-body-2 text-medium-emphasis">
                No payments recorded yet
              </div>
            </div>
          </template>
        </v-data-table>
      </v-card>

      <!-- Educational Info -->
      <v-card variant="outlined" class="mt-6">
        <v-card-title class="text-subtitle-1">
          <v-icon class="mr-2">mdi-information</v-icon>
          Advance Tax Rules
        </v-card-title>
        <v-card-text>
          <v-row>
            <v-col cols="12" md="6">
              <div class="text-subtitle-2 mb-2">Due Dates</div>
              <v-table density="compact">
                <tbody>
                  <tr>
                    <td>Q1 - June 15</td>
                    <td class="text-end">15% of tax</td>
                  </tr>
                  <tr>
                    <td>Q2 - September 15</td>
                    <td class="text-end">45% of tax (cumulative)</td>
                  </tr>
                  <tr>
                    <td>Q3 - December 15</td>
                    <td class="text-end">75% of tax (cumulative)</td>
                  </tr>
                  <tr>
                    <td>Q4 - March 15</td>
                    <td class="text-end">100% of tax</td>
                  </tr>
                </tbody>
              </v-table>
            </v-col>
            <v-col cols="12" md="6">
              <div class="text-subtitle-2 mb-2">Interest Provisions</div>
              <ul class="text-body-2 text-medium-emphasis">
                <li><strong>Section 234B:</strong> 1% per month if &lt;90% paid by March 31</li>
                <li><strong>Section 234C:</strong> 1% per month for deferment in any quarter</li>
                <li><strong>Threshold:</strong> Advance tax required if liability exceeds ₹10,000</li>
              </ul>
            </v-col>
          </v-row>
        </v-card-text>
      </v-card>
    </template>

    <!-- Payment Form Dialog -->
    <AdvanceTaxPaymentForm
      v-model="showPaymentForm"
      :payment="editingPayment"
      :financial-year="selectedFinancialYear"
      :loading="addPayment.isPending.value"
      @save="handleSavePayment"
      @cancel="showPaymentForm = false; editingPayment = null"
    />

    <!-- Delete Confirmation Dialog -->
    <v-dialog v-model="deleteDialog" max-width="400">
      <v-card>
        <v-card-title>Delete Payment?</v-card-title>
        <v-card-text>
          Are you sure you want to delete this payment record? This action cannot be undone.
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="deleteDialog = false">Cancel</v-btn>
          <v-btn
            color="error"
            variant="flat"
            :loading="deletePayment.isPending.value"
            @click="handleDeletePayment"
          >
            Delete
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>
