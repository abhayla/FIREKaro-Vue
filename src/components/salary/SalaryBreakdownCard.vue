<script setup lang="ts">
import { computed } from "vue";
import type { SalaryHistoryRecord } from "@/types/salary";
import { formatINR } from "@/composables/useSalary";

const props = defineProps<{
  salary: SalaryHistoryRecord | null;
  loading?: boolean;
}>();

const earnings = computed(() => {
  if (!props.salary) return [];
  return [
    { label: "Basic Salary", amount: props.salary.basicSalary },
    { label: "House Rent Allowance", amount: props.salary.hra },
    { label: "Conveyance Allowance", amount: props.salary.conveyanceAllowance },
    { label: "Medical Allowance", amount: props.salary.medicalAllowance },
    { label: "Special Allowance", amount: props.salary.specialAllowance },
    { label: "Special Pay", amount: props.salary.specialPay || 0 },
    { label: "Other Allowances", amount: props.salary.otherAllowances || 0 },
  ].filter((e) => e.amount > 0);
});

const deductions = computed(() => {
  if (!props.salary) return [];
  return [
    {
      label: "Provident Fund (EPF)",
      amount: props.salary.epfDeduction,
      sync: "EPF Account",
    },
    {
      label: "Voluntary PF (VPF)",
      amount: props.salary.vpfDeduction || 0,
      sync: "EPF Account",
    },
    { label: "Professional Tax", amount: props.salary.professionalTax },
    { label: "Income Tax (TDS)", amount: props.salary.tdsDeduction },
    { label: "Other Deductions", amount: props.salary.otherDeductions || 0 },
  ].filter((d) => d.amount > 0);
});

const employerContributions = computed(() => {
  if (!props.salary) return [];
  return [
    {
      label: "Employer PF",
      amount: props.salary.employerPf || 0,
      sync: "EPF Account",
    },
    {
      label: "Pension Fund (EPS)",
      amount: props.salary.pensionFund || 0,
      sync: "EPF Account",
    },
    {
      label: "NPS (Employer)",
      amount: props.salary.employerNps || 0,
      sync: "NPS Account",
    },
    { label: "Superannuation", amount: props.salary.superannuation || 0 },
  ].filter((c) => c.amount > 0);
});
</script>

<template>
  <v-card :loading="loading">
    <v-card-title class="d-flex align-center">
      <v-icon icon="mdi-cash-check" class="mr-2" color="success" />
      Salary Breakdown
    </v-card-title>

    <v-card-text v-if="!salary && !loading">
      <v-alert type="info" variant="tonal">
        No salary data available. Add your salary details to see the breakdown.
      </v-alert>
    </v-card-text>

    <v-card-text v-else>
      <!-- Earnings Section -->
      <div class="mb-4">
        <div class="d-flex align-center justify-space-between mb-2">
          <span class="text-subtitle-2 font-weight-bold text-success"
            >EARNINGS</span
          >
          <v-chip color="success" size="small" variant="tonal">
            {{ formatINR(salary?.grossEarnings || 0) }}
          </v-chip>
        </div>
        <v-list density="compact" class="bg-transparent">
          <v-list-item v-for="item in earnings" :key="item.label" class="px-0">
            <template #prepend>
              <v-icon icon="mdi-plus" size="small" color="success" />
            </template>
            <v-list-item-title class="text-body-2">{{
              item.label
            }}</v-list-item-title>
            <template #append>
              <span class="text-body-2 font-weight-medium">{{
                formatINR(item.amount)
              }}</span>
            </template>
          </v-list-item>
        </v-list>
      </div>

      <v-divider class="my-3" />

      <!-- Deductions Section -->
      <div class="mb-4">
        <div class="d-flex align-center justify-space-between mb-2">
          <span class="text-subtitle-2 font-weight-bold text-error"
            >DEDUCTIONS</span
          >
          <v-chip color="error" size="small" variant="tonal">
            {{ formatINR(salary?.totalDeductions || 0) }}
          </v-chip>
        </div>
        <v-list density="compact" class="bg-transparent">
          <v-list-item
            v-for="item in deductions"
            :key="item.label"
            class="px-0"
          >
            <template #prepend>
              <v-icon icon="mdi-minus" size="small" color="error" />
            </template>
            <v-list-item-title class="text-body-2">
              {{ item.label }}
              <v-tooltip v-if="item.sync" location="top">
                <template #activator="{ props: tooltipProps }">
                  <v-icon
                    v-bind="tooltipProps"
                    icon="mdi-link"
                    size="x-small"
                    class="ml-1"
                  />
                </template>
                Syncs to {{ item.sync }}
              </v-tooltip>
            </v-list-item-title>
            <template #append>
              <span class="text-body-2 font-weight-medium">{{
                formatINR(item.amount)
              }}</span>
            </template>
          </v-list-item>
        </v-list>
      </div>

      <v-divider class="my-3" />

      <!-- Net Salary -->
      <div
        class="d-flex align-center justify-space-between py-2 bg-primary rounded px-3"
      >
        <span class="text-subtitle-1 font-weight-bold text-white"
          >NET SALARY</span
        >
        <span class="text-h6 font-weight-bold text-white">
          {{ formatINR(salary?.netSalary || 0) }}
        </span>
      </div>

      <!-- Employer Contributions (Info Only) -->
      <div v-if="employerContributions.length > 0" class="mt-4">
        <div class="d-flex align-center justify-space-between mb-2">
          <span class="text-subtitle-2 font-weight-bold text-info">
            EMPLOYER CONTRIBUTIONS
            <v-tooltip location="top">
              <template #activator="{ props: tooltipProps }">
                <v-icon
                  v-bind="tooltipProps"
                  icon="mdi-information"
                  size="x-small"
                  class="ml-1"
                />
              </template>
              Info only - not deducted from your take-home pay
            </v-tooltip>
          </span>
        </div>
        <v-list density="compact" class="bg-transparent">
          <v-list-item
            v-for="item in employerContributions"
            :key="item.label"
            class="px-0"
          >
            <template #prepend>
              <v-icon icon="mdi-office-building" size="small" color="info" />
            </template>
            <v-list-item-title class="text-body-2">
              {{ item.label }}
              <v-tooltip v-if="item.sync" location="top">
                <template #activator="{ props: tooltipProps }">
                  <v-icon
                    v-bind="tooltipProps"
                    icon="mdi-link"
                    size="x-small"
                    class="ml-1"
                  />
                </template>
                Syncs to {{ item.sync }}
              </v-tooltip>
            </v-list-item-title>
            <template #append>
              <span class="text-body-2 font-weight-medium">{{
                formatINR(item.amount)
              }}</span>
            </template>
          </v-list-item>
        </v-list>
      </div>
    </v-card-text>
  </v-card>
</template>
