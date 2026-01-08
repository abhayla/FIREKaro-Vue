<script setup lang="ts">
import SectionHeader from "@/components/shared/SectionHeader.vue";

const tabs = [
  { title: "Portfolio", route: "/dashboard/investments" },
  { title: "Stocks", route: "/dashboard/investments/stocks" },
  { title: "Mutual Funds", route: "/dashboard/investments/mutual-funds" },
  { title: "EPF & PPF", route: "/dashboard/investments/epf-ppf" },
  { title: "NPS", route: "/dashboard/investments/nps" },
  { title: "Property", route: "/dashboard/investments/property" },
  { title: "Reports", route: "/dashboard/investments/reports" },
];
</script>

<template>
  <div>
    <SectionHeader
      title="Investments"
      subtitle="EPF & PPF Accounts"
      icon="mdi-chart-line"
      :tabs="tabs"
    />
    <v-card class="mt-6">
      <v-card-title>EPF & PPF</v-card-title>
      <v-card-text>
        <v-alert type="info" variant="tonal"
          >Track your EPF, VPF, and PPF contributions with projections.</v-alert
        >
      </v-card-text>
    </v-card>
  </div>
</template>
