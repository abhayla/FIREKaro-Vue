<script setup lang="ts">
import { computed } from "vue";
import SummaryMetricCards from "@/components/shared/SummaryMetricCards.vue";
import type { MetricCard } from "@/components/shared/SummaryMetricCards.vue";
import type { AggregatedTaxData } from "@/composables/useTax";
import { formatINR } from "@/composables/useTax";

interface Props {
  data: AggregatedTaxData | null | undefined;
  taxPayable: number;
  loading?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
});

// Calculate net due or refund
const netDueRefund = computed(() => {
  if (!props.data) return 0;
  return props.taxPayable - props.data.totalTDS;
});

// Format for display
const formatCompact = (value: number): string => {
  if (value >= 10000000) {
    return `${(value / 10000000).toFixed(2)} Cr`;
  } else if (value >= 100000) {
    return `${(value / 100000).toFixed(2)} L`;
  }
  return formatINR(value);
};

// Tax summary metrics
const metrics = computed<MetricCard[]>(() => {
  const data = props.data;
  const grossIncome = data?.grossTotalIncome ?? 0;
  const tds = data?.totalTDS ?? 0;
  const due = netDueRefund.value;

  return [
    {
      label: "Gross Total Income",
      value: grossIncome,
      icon: "mdi-cash-multiple",
      color: "success",
      format: "currency",
      subtitle: grossIncome > 0 ? `From all sources` : "No income data",
    },
    {
      label: "Tax Payable",
      value: props.taxPayable,
      icon: "mdi-calculator",
      color: "warning",
      format: "currency",
      subtitle:
        props.taxPayable > 0 && grossIncome > 0
          ? `Effective: ${((props.taxPayable / grossIncome) * 100).toFixed(1)}%`
          : "Based on current data",
    },
    {
      label: "TDS Deducted",
      value: tds,
      icon: "mdi-bank-check",
      color: "info",
      format: "currency",
      subtitle: "TDS deducted at source",
    },
    {
      label: due >= 0 ? "Tax Due" : "Refund Expected",
      value: Math.abs(due),
      icon: due >= 0 ? "mdi-alert-circle" : "mdi-cash-refund",
      color: due >= 0 ? "error" : "primary",
      format: "currency",
      subtitle:
        due >= 0
          ? due > 10000
            ? "Consider advance tax payment"
            : "Pay before filing"
          : "Claim when filing ITR",
    },
  ];
});
</script>

<template>
  <SummaryMetricCards :metrics="metrics" :columns="4" :loading="loading" />
</template>
