<script setup lang="ts">
import SectionHeader from "@/components/shared/SectionHeader.vue";
import FamilyToggle from "@/components/shared/FamilyToggle.vue";

const tabs = [
  { title: "Overview", route: "/dashboard/liabilities" },
  { title: "Loans", route: "/dashboard/liabilities/loans" },
  { title: "Credit Cards", route: "/dashboard/liabilities/credit-cards" },
  { title: "Debt Payoff", route: "/dashboard/liabilities/debt-payoff" },
  { title: "Reports", route: "/dashboard/liabilities/reports" },
];
</script>

<template>
  <div>
    <SectionHeader
      title="Liabilities"
      subtitle="Track loans and debt"
      icon="mdi-credit-card-outline"
      :tabs="tabs"
    />
    <FamilyToggle class="mb-6" />
    <v-row>
      <v-col cols="12" md="4">
        <v-card class="pa-4">
          <div class="text-body-2 text-medium-emphasis">Total Debt</div>
          <div class="text-h5 font-weight-bold">Loading...</div>
        </v-card>
      </v-col>
      <v-col cols="12" md="4">
        <v-card class="pa-4">
          <div class="text-body-2 text-medium-emphasis">Monthly EMI</div>
          <div class="text-h5 font-weight-bold">Loading...</div>
        </v-card>
      </v-col>
      <v-col cols="12" md="4">
        <v-card class="pa-4">
          <div class="text-body-2 text-medium-emphasis">Debt-to-Income</div>
          <div class="text-h5 font-weight-bold">Loading...</div>
        </v-card>
      </v-col>
    </v-row>
    <v-card class="mt-6">
      <v-card-title>Liabilities Overview</v-card-title>
      <v-card-text>
        <p class="text-medium-emphasis">
          Track loans, credit cards, and create debt payoff strategies.
        </p>
      </v-card-text>
    </v-card>
  </div>
</template>
