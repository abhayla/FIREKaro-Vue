<script setup lang="ts">
import { computed } from "vue";
import SectionHeader from "@/components/shared/SectionHeader.vue";
import {
  useSalaryHistory,
  useSalarySummary,
  useFinancialYear,
  formatINR,
  formatINRLakhs,
} from "@/composables/useSalary";
import { getFinancialYearOptions, getShortMonthName } from "@/types/salary";

const tabs = [
  { title: "Overview", route: "/dashboard/salary" },
  { title: "Current Salary", route: "/dashboard/salary/current" },
  { title: "Salary History", route: "/dashboard/salary/history" },
  { title: "Reports", route: "/dashboard/salary/reports" },
];

const { selectedFinancialYear, setFinancialYear } = useFinancialYear();
const fyOptions = getFinancialYearOptions();

const { data: salaryHistory, isLoading } = useSalaryHistory();
const { summary } = useSalarySummary();

// Yearly breakdown for report
const yearlyBreakdown = computed(() => {
  if (!salaryHistory.value) return [];

  return salaryHistory.value.map((record) => ({
    month: `${getShortMonthName(record.month)}'${record.year.toString().slice(-2)}`,
    basic: record.basicSalary,
    hra: record.hra,
    allowances:
      record.conveyanceAllowance +
      record.medicalAllowance +
      record.specialAllowance,
    gross: record.grossEarnings,
    epf: record.epfDeduction,
    tds: record.tdsDeduction,
    net: record.netSalary,
  }));
});

// Tax savings summary
const taxSavings = computed(() => {
  if (!salaryHistory.value) return null;

  const totalEpf = salaryHistory.value.reduce(
    (sum, r) => sum + r.epfDeduction,
    0,
  );
  const totalVpf = salaryHistory.value.reduce(
    (sum, r) => sum + (r.vpfDeduction || 0),
    0,
  );
  const totalEmployerNps = salaryHistory.value.reduce(
    (sum, r) => sum + (r.employerNps || 0),
    0,
  );

  return {
    section80C: {
      epf: totalEpf,
      vpf: totalVpf,
      total: totalEpf + totalVpf,
      limit: 150000,
      utilized: Math.min(totalEpf + totalVpf, 150000),
    },
    section80CCD2: {
      employerNps: totalEmployerNps,
      // 10% of basic for old regime
      basicTotal: salaryHistory.value.reduce(
        (sum, r) => sum + r.basicSalary,
        0,
      ),
    },
    professionalTax: salaryHistory.value.reduce(
      (sum, r) => sum + r.professionalTax,
      0,
    ),
  };
});
</script>

<template>
  <div>
    <SectionHeader
      title="Salary"
      subtitle="Salary reports and analytics"
      icon="mdi-cash-multiple"
      :tabs="tabs"
    />

    <!-- FY Selector -->
    <div class="d-flex justify-end mb-4">
      <v-select
        v-model="selectedFinancialYear"
        :items="fyOptions"
        label="Financial Year"
        density="compact"
        variant="outlined"
        style="max-width: 150px"
        hide-details
        @update:model-value="setFinancialYear"
      />
    </div>

    <!-- Summary Cards -->
    <v-row v-if="summary">
      <v-col cols="12" md="6" lg="3">
        <v-card class="pa-4 text-center" color="success" variant="tonal">
          <v-icon icon="mdi-cash-multiple" size="36" class="mb-2" />
          <div class="text-h5 font-weight-bold">
            {{ formatINRLakhs(summary.totalGrossEarnings) }}
          </div>
          <div class="text-body-2">Total Gross Earnings</div>
        </v-card>
      </v-col>
      <v-col cols="12" md="6" lg="3">
        <v-card class="pa-4 text-center" color="primary" variant="tonal">
          <v-icon icon="mdi-wallet" size="36" class="mb-2" />
          <div class="text-h5 font-weight-bold">
            {{ formatINRLakhs(summary.totalNetSalary) }}
          </div>
          <div class="text-body-2">Total Net Salary</div>
        </v-card>
      </v-col>
      <v-col cols="12" md="6" lg="3">
        <v-card class="pa-4 text-center" color="warning" variant="tonal">
          <v-icon icon="mdi-bank" size="36" class="mb-2" />
          <div class="text-h5 font-weight-bold">
            {{ formatINRLakhs(summary.totalTdsDeducted) }}
          </div>
          <div class="text-body-2">Total TDS Deducted</div>
        </v-card>
      </v-col>
      <v-col cols="12" md="6" lg="3">
        <v-card class="pa-4 text-center" color="info" variant="tonal">
          <v-icon icon="mdi-piggy-bank" size="36" class="mb-2" />
          <div class="text-h5 font-weight-bold">
            {{ formatINRLakhs(summary.totalEpfContribution) }}
          </div>
          <div class="text-body-2">Total EPF Contribution</div>
        </v-card>
      </v-col>
    </v-row>

    <!-- Monthly Breakdown Table -->
    <v-card class="mt-6" :loading="isLoading">
      <v-card-title class="d-flex align-center justify-space-between">
        <div class="d-flex align-center">
          <v-icon icon="mdi-table" class="mr-2" />
          Monthly Breakdown Report - {{ selectedFinancialYear }}
        </div>
        <v-btn
          variant="tonal"
          color="success"
          prepend-icon="mdi-file-excel"
          size="small"
          disabled
        >
          Export Excel
        </v-btn>
      </v-card-title>

      <v-data-table
        :headers="[
          { title: 'Month', key: 'month' },
          { title: 'Basic', key: 'basic', align: 'end' },
          { title: 'HRA', key: 'hra', align: 'end' },
          { title: 'Allowances', key: 'allowances', align: 'end' },
          { title: 'Gross', key: 'gross', align: 'end' },
          { title: 'EPF', key: 'epf', align: 'end' },
          { title: 'TDS', key: 'tds', align: 'end' },
          { title: 'Net', key: 'net', align: 'end' },
        ]"
        :items="yearlyBreakdown"
        density="comfortable"
        :items-per-page="-1"
        hide-default-footer
      >
        <template #item.basic="{ item }">
          {{ formatINR(item.basic) }}
        </template>
        <template #item.hra="{ item }">
          {{ formatINR(item.hra) }}
        </template>
        <template #item.allowances="{ item }">
          {{ formatINR(item.allowances) }}
        </template>
        <template #item.gross="{ item }">
          <span class="text-success font-weight-medium">{{
            formatINR(item.gross)
          }}</span>
        </template>
        <template #item.epf="{ item }">
          {{ formatINR(item.epf) }}
        </template>
        <template #item.tds="{ item }">
          {{ formatINR(item.tds) }}
        </template>
        <template #item.net="{ item }">
          <span class="font-weight-bold">{{ formatINR(item.net) }}</span>
        </template>

        <template #no-data>
          <v-alert type="info" variant="tonal" class="ma-4">
            No salary data for {{ selectedFinancialYear }}. Add salary records
            to generate reports.
          </v-alert>
        </template>
      </v-data-table>
    </v-card>

    <!-- Tax Deductions Summary -->
    <v-card v-if="taxSavings" class="mt-6">
      <v-card-title class="d-flex align-center">
        <v-icon icon="mdi-shield-check" class="mr-2" color="success" />
        Tax Deductions Summary - {{ selectedFinancialYear }}
      </v-card-title>

      <v-card-text>
        <v-row>
          <!-- Section 80C -->
          <v-col cols="12" md="6">
            <v-card variant="outlined" class="pa-4">
              <div class="text-subtitle-1 font-weight-bold mb-3">
                Section 80C
              </div>
              <v-list density="compact" class="bg-transparent">
                <v-list-item>
                  <v-list-item-title>EPF (Employee)</v-list-item-title>
                  <template #append>
                    <span class="font-weight-medium">{{
                      formatINR(taxSavings.section80C.epf)
                    }}</span>
                  </template>
                </v-list-item>
                <v-list-item>
                  <v-list-item-title>VPF</v-list-item-title>
                  <template #append>
                    <span class="font-weight-medium">{{
                      formatINR(taxSavings.section80C.vpf)
                    }}</span>
                  </template>
                </v-list-item>
              </v-list>
              <v-divider class="my-2" />
              <div class="d-flex justify-space-between align-center">
                <span class="font-weight-bold">Total 80C (via Salary)</span>
                <v-chip color="success">{{
                  formatINR(taxSavings.section80C.total)
                }}</v-chip>
              </div>
              <v-progress-linear
                :model-value="
                  (taxSavings.section80C.utilized /
                    taxSavings.section80C.limit) *
                  100
                "
                color="success"
                height="8"
                rounded
                class="mt-3"
              />
              <div class="text-caption text-medium-emphasis mt-1">
                {{ formatINR(taxSavings.section80C.utilized) }} of
                {{ formatINR(taxSavings.section80C.limit) }} limit utilized
              </div>
            </v-card>
          </v-col>

          <!-- Section 80CCD(2) -->
          <v-col cols="12" md="6">
            <v-card variant="outlined" class="pa-4">
              <div class="text-subtitle-1 font-weight-bold mb-3">
                Section 80CCD(2) - Employer NPS
              </div>
              <v-list density="compact" class="bg-transparent">
                <v-list-item>
                  <v-list-item-title
                    >Employer NPS Contribution</v-list-item-title
                  >
                  <template #append>
                    <span class="font-weight-medium">{{
                      formatINR(taxSavings.section80CCD2.employerNps)
                    }}</span>
                  </template>
                </v-list-item>
              </v-list>
              <v-alert
                v-if="taxSavings.section80CCD2.employerNps > 0"
                type="info"
                variant="tonal"
                density="compact"
                class="mt-3"
              >
                This is an additional deduction over and above the 80C limit of
                ₹1.5L
              </v-alert>
              <v-alert
                v-else
                type="warning"
                variant="tonal"
                density="compact"
                class="mt-3"
              >
                No employer NPS contributions recorded. This could be additional
                tax savings!
              </v-alert>
            </v-card>
          </v-col>

          <!-- Professional Tax -->
          <v-col cols="12">
            <v-card variant="outlined" class="pa-4">
              <div class="d-flex justify-space-between align-center">
                <div>
                  <div class="text-subtitle-1 font-weight-bold">
                    Professional Tax
                  </div>
                  <div class="text-caption text-medium-emphasis">
                    Deductible under Section 16(iii)
                  </div>
                </div>
                <v-chip color="info" size="large">{{
                  formatINR(taxSavings.professionalTax)
                }}</v-chip>
              </div>
            </v-card>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <!-- Export Options -->
    <v-card class="mt-6">
      <v-card-title>Export Options</v-card-title>
      <v-card-text>
        <v-row>
          <v-col cols="12" sm="6" md="3">
            <v-btn
              block
              variant="tonal"
              color="success"
              prepend-icon="mdi-file-excel"
              disabled
            >
              Export to Excel
            </v-btn>
          </v-col>
          <v-col cols="12" sm="6" md="3">
            <v-btn
              block
              variant="tonal"
              color="error"
              prepend-icon="mdi-file-pdf-box"
              disabled
            >
              Export to PDF
            </v-btn>
          </v-col>
          <v-col cols="12" sm="6" md="3">
            <v-btn
              block
              variant="tonal"
              color="info"
              prepend-icon="mdi-printer"
              disabled
            >
              Print Report
            </v-btn>
          </v-col>
          <v-col cols="12" sm="6" md="3">
            <v-btn
              block
              variant="tonal"
              prepend-icon="mdi-share-variant"
              disabled
            >
              Share Report
            </v-btn>
          </v-col>
        </v-row>
        <v-alert type="info" variant="tonal" class="mt-4">
          Export functionality will be available soon. Currently viewing live
          data from the API.
        </v-alert>
      </v-card-text>
    </v-card>
  </div>
</template>
