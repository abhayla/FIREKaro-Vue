<script setup lang="ts">
import { computed } from "vue";
import SectionHeader from "@/components/shared/SectionHeader.vue";
import SalaryBreakdownCard from "@/components/salary/SalaryBreakdownCard.vue";
import {
  useLatestSalary,
  useFinancialYear,
  formatINR,
} from "@/composables/useSalary";
import { getShortMonthName, getFinancialYearOptions } from "@/types/salary";

const tabs = [
  { title: "Overview", route: "/dashboard/salary" },
  { title: "Current Salary", route: "/dashboard/salary/current" },
  { title: "Salary History", route: "/dashboard/salary/history" },
  { title: "Reports", route: "/dashboard/salary/reports" },
];

const { selectedFinancialYear, setFinancialYear } = useFinancialYear();
const fyOptions = getFinancialYearOptions();

const { latestSalary, isLoading } = useLatestSalary();

// Display month info
const salaryPeriod = computed(() => {
  if (!latestSalary.value) return "No data";
  const month = getShortMonthName(latestSalary.value.month);
  const year = latestSalary.value.year;
  return `${month} ${year}`;
});

// EPF/Tax calculations for display
const taxInfo = computed(() => {
  if (!latestSalary.value) return null;
  const epfRate =
    latestSalary.value.basicSalary > 0
      ? (
          (latestSalary.value.epfDeduction / latestSalary.value.basicSalary) *
          100
        ).toFixed(1)
      : "0";

  const effectiveTaxRate =
    latestSalary.value.grossEarnings > 0
      ? (
          (latestSalary.value.tdsDeduction / latestSalary.value.grossEarnings) *
          100
        ).toFixed(1)
      : "0";

  return {
    epfRate,
    effectiveTaxRate,
    epfContribution: latestSalary.value.epfDeduction,
    tds: latestSalary.value.tdsDeduction,
  };
});
</script>

<template>
  <div>
    <SectionHeader
      title="Salary"
      subtitle="Current salary breakdown"
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

    <!-- Current Period Info -->
    <v-alert v-if="latestSalary" type="info" variant="tonal" class="mb-4">
      <template #prepend>
        <v-icon icon="mdi-calendar-month" />
      </template>
      Showing salary breakdown for <strong>{{ salaryPeriod }}</strong> ({{
        latestSalary.paidDays
      }}
      paid days)
    </v-alert>

    <v-row>
      <!-- Main Breakdown Card -->
      <v-col cols="12" lg="7">
        <SalaryBreakdownCard :salary="latestSalary" :loading="isLoading" />
      </v-col>

      <!-- Side Info Cards -->
      <v-col cols="12" lg="5">
        <!-- Tax Info Card -->
        <v-card class="mb-4">
          <v-card-title class="d-flex align-center">
            <v-icon icon="mdi-calculator" class="mr-2" color="warning" />
            Tax Information
          </v-card-title>
          <v-card-text>
            <v-list density="compact" class="bg-transparent">
              <v-list-item>
                <template #prepend>
                  <v-icon icon="mdi-percent" color="info" />
                </template>
                <v-list-item-title>Effective Tax Rate</v-list-item-title>
                <template #append>
                  <v-chip size="small" color="warning" variant="tonal">
                    {{ taxInfo?.effectiveTaxRate || 0 }}%
                  </v-chip>
                </template>
              </v-list-item>
              <v-list-item>
                <template #prepend>
                  <v-icon icon="mdi-piggy-bank" color="success" />
                </template>
                <v-list-item-title>EPF Rate (Employee)</v-list-item-title>
                <template #append>
                  <v-chip size="small" color="success" variant="tonal">
                    {{ taxInfo?.epfRate || 0 }}%
                  </v-chip>
                </template>
              </v-list-item>
              <v-list-item>
                <template #prepend>
                  <v-icon icon="mdi-bank" color="primary" />
                </template>
                <v-list-item-title>Monthly TDS</v-list-item-title>
                <template #append>
                  <span class="font-weight-medium">{{
                    formatINR(taxInfo?.tds || 0)
                  }}</span>
                </template>
              </v-list-item>
              <v-list-item>
                <template #prepend>
                  <v-icon icon="mdi-safe" color="info" />
                </template>
                <v-list-item-title>Monthly EPF</v-list-item-title>
                <template #append>
                  <span class="font-weight-medium">{{
                    formatINR(taxInfo?.epfContribution || 0)
                  }}</span>
                </template>
              </v-list-item>
            </v-list>
          </v-card-text>
        </v-card>

        <!-- 80C Deductions Card -->
        <v-card class="mb-4">
          <v-card-title class="d-flex align-center">
            <v-icon icon="mdi-shield-check" class="mr-2" color="success" />
            Section 80C (via Salary)
          </v-card-title>
          <v-card-text>
            <v-list density="compact" class="bg-transparent">
              <v-list-item>
                <v-list-item-title>EPF (Employee)</v-list-item-title>
                <template #append>
                  <span class="font-weight-medium text-success">
                    {{ formatINR(latestSalary?.epfDeduction || 0) }}/mo
                  </span>
                </template>
              </v-list-item>
              <v-list-item>
                <v-list-item-title>VPF (If any)</v-list-item-title>
                <template #append>
                  <span class="font-weight-medium text-success">
                    {{ formatINR(latestSalary?.vpfDeduction || 0) }}/mo
                  </span>
                </template>
              </v-list-item>
            </v-list>
            <v-divider class="my-2" />
            <div class="d-flex justify-space-between align-center">
              <span class="text-body-2">Monthly 80C via Salary</span>
              <v-chip color="success" size="small">
                {{
                  formatINR(
                    (latestSalary?.epfDeduction || 0) +
                      (latestSalary?.vpfDeduction || 0),
                  )
                }}
              </v-chip>
            </div>
            <v-progress-linear
              :model-value="
                Math.min(
                  ((((latestSalary?.epfDeduction || 0) +
                    (latestSalary?.vpfDeduction || 0)) *
                    12) /
                    150000) *
                    100,
                  100,
                )
              "
              color="success"
              height="6"
              rounded
              class="mt-2"
            />
            <div class="text-caption text-medium-emphasis mt-1">
              Projected yearly:
              {{
                formatINR(
                  ((latestSalary?.epfDeduction || 0) +
                    (latestSalary?.vpfDeduction || 0)) *
                    12,
                )
              }}
              of ₹1,50,000 limit
            </div>
          </v-card-text>
        </v-card>

        <!-- Actions Card -->
        <v-card>
          <v-card-title class="d-flex align-center">
            <v-icon icon="mdi-cog" class="mr-2" />
            Actions
          </v-card-title>
          <v-card-text>
            <v-btn
              block
              variant="tonal"
              color="primary"
              prepend-icon="mdi-history"
              to="/dashboard/salary/history"
              class="mb-2"
            >
              View Full History
            </v-btn>
            <v-btn
              block
              variant="tonal"
              color="info"
              prepend-icon="mdi-pencil"
              to="/dashboard/salary/history"
            >
              Edit Salary Data
            </v-btn>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </div>
</template>
