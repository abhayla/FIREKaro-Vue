<script setup lang="ts">
import { computed } from "vue";
import type { SalaryHistoryRecord } from "@/types/salary";
import { getShortMonthName } from "@/types/salary";
import { formatINR, formatINRLakhs } from "@/composables/useSalary";

const props = defineProps<{
  records: SalaryHistoryRecord[];
  loading?: boolean;
}>();

const emit = defineEmits<{
  (e: "edit", record: SalaryHistoryRecord): void;
  (e: "delete", record: SalaryHistoryRecord): void;
  (e: "add"): void;
}>();

const headers = [
  { title: "Month", key: "monthDisplay", sortable: false },
  { title: "Paid Days", key: "paidDays", align: "center" as const },
  { title: "Gross", key: "grossEarnings", align: "end" as const },
  { title: "Deductions", key: "totalDeductions", align: "end" as const },
  { title: "Net", key: "netSalary", align: "end" as const },
  { title: "TDS", key: "tdsDeduction", align: "end" as const },
  {
    title: "Actions",
    key: "actions",
    sortable: false,
    align: "center" as const,
  },
];

const tableItems = computed(() => {
  return props.records.map((record) => ({
    ...record,
    monthDisplay: `${getShortMonthName(record.month)}'${record.year.toString().slice(-2)}`,
  }));
});

// Calculate totals for footer
const totals = computed(() => {
  if (!props.records.length) return null;
  return {
    paidDays: props.records.reduce((sum, r) => sum + r.paidDays, 0),
    grossEarnings: props.records.reduce((sum, r) => sum + r.grossEarnings, 0),
    totalDeductions: props.records.reduce(
      (sum, r) => sum + r.totalDeductions,
      0,
    ),
    netSalary: props.records.reduce((sum, r) => sum + r.netSalary, 0),
    tdsDeduction: props.records.reduce((sum, r) => sum + r.tdsDeduction, 0),
  };
});
</script>

<template>
  <v-card>
    <v-card-title class="d-flex align-center justify-space-between">
      <div class="d-flex align-center">
        <v-icon icon="mdi-table" class="mr-2" />
        Monthly Salary History
      </div>
      <v-btn
        color="primary"
        variant="tonal"
        size="small"
        prepend-icon="mdi-plus"
        @click="emit('add')"
      >
        Add Month
      </v-btn>
    </v-card-title>

    <v-data-table
      :headers="headers"
      :items="tableItems"
      :loading="loading"
      density="comfortable"
      class="salary-history-table"
      :items-per-page="12"
      :items-per-page-options="[12, 24, -1]"
    >
      <template #item.grossEarnings="{ item }">
        <span class="text-success font-weight-medium">{{
          formatINR(item.grossEarnings)
        }}</span>
      </template>

      <template #item.totalDeductions="{ item }">
        <span class="text-error font-weight-medium">{{
          formatINR(item.totalDeductions)
        }}</span>
      </template>

      <template #item.netSalary="{ item }">
        <span class="font-weight-bold">{{ formatINR(item.netSalary) }}</span>
      </template>

      <template #item.tdsDeduction="{ item }">
        <span class="text-medium-emphasis">{{
          formatINR(item.tdsDeduction)
        }}</span>
      </template>

      <template #item.actions="{ item }">
        <v-btn
          icon="mdi-pencil"
          variant="text"
          size="small"
          @click="emit('edit', item)"
        />
        <v-btn
          icon="mdi-delete"
          variant="text"
          size="small"
          color="error"
          @click="emit('delete', item)"
        />
      </template>

      <template #bottom>
        <v-divider />
        <div
          v-if="totals"
          class="d-flex align-center justify-space-between pa-4 bg-grey-lighten-4"
        >
          <div class="d-flex align-center">
            <v-icon icon="mdi-sigma" class="mr-2" />
            <span class="font-weight-bold">TOTALS</span>
          </div>
          <div class="d-flex ga-6">
            <div class="text-center">
              <div class="text-caption text-medium-emphasis">Days</div>
              <div class="font-weight-medium">{{ totals.paidDays }}</div>
            </div>
            <div class="text-center">
              <div class="text-caption text-medium-emphasis">Gross</div>
              <div class="font-weight-bold text-success">
                {{ formatINRLakhs(totals.grossEarnings) }}
              </div>
            </div>
            <div class="text-center">
              <div class="text-caption text-medium-emphasis">Deductions</div>
              <div class="font-weight-medium text-error">
                {{ formatINRLakhs(totals.totalDeductions) }}
              </div>
            </div>
            <div class="text-center">
              <div class="text-caption text-medium-emphasis">Net</div>
              <div class="font-weight-bold">
                {{ formatINRLakhs(totals.netSalary) }}
              </div>
            </div>
            <div class="text-center">
              <div class="text-caption text-medium-emphasis">TDS</div>
              <div class="font-weight-medium">
                {{ formatINRLakhs(totals.tdsDeduction) }}
              </div>
            </div>
          </div>
        </div>
      </template>

      <template #no-data>
        <v-alert type="info" variant="tonal" class="ma-4">
          No salary history records found. Click "Add Month" to add your first
          entry.
        </v-alert>
      </template>
    </v-data-table>
  </v-card>
</template>

<style scoped>
.salary-history-table :deep(.v-data-table__th) {
  font-weight: 600 !important;
  white-space: nowrap;
}
</style>
