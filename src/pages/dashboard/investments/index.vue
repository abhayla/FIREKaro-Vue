<script setup lang="ts">
import SectionHeader from "@/components/shared/SectionHeader.vue";
import FamilyToggle from "@/components/shared/FamilyToggle.vue";

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
      subtitle="Track your investment portfolio"
      icon="mdi-chart-line"
      :tabs="tabs"
    />

    <FamilyToggle class="mb-6" />

    <v-row>
      <v-col cols="12" md="3">
        <v-card class="pa-4">
          <div class="text-body-2 text-medium-emphasis">Total Portfolio</div>
          <div class="text-h5 font-weight-bold">Loading...</div>
        </v-card>
      </v-col>
      <v-col cols="12" md="3">
        <v-card class="pa-4">
          <div class="text-body-2 text-medium-emphasis">Equity</div>
          <div class="text-h5 font-weight-bold">Loading...</div>
        </v-card>
      </v-col>
      <v-col cols="12" md="3">
        <v-card class="pa-4">
          <div class="text-body-2 text-medium-emphasis">Debt</div>
          <div class="text-h5 font-weight-bold">Loading...</div>
        </v-card>
      </v-col>
      <v-col cols="12" md="3">
        <v-card class="pa-4">
          <div class="text-body-2 text-medium-emphasis">Returns (XIRR)</div>
          <div class="text-h5 font-weight-bold">Loading...</div>
        </v-card>
      </v-col>
    </v-row>

    <v-card class="mt-6">
      <v-card-title>Portfolio Overview</v-card-title>
      <v-card-text>
        <p class="text-medium-emphasis">
          Track stocks, mutual funds, EPF, PPF, NPS, and property investments
          with asset allocation analysis.
        </p>
      </v-card-text>
    </v-card>
  </div>
</template>
