<script setup lang="ts">
import SectionHeader from "@/components/shared/SectionHeader.vue";

const tabs = [
  { title: "Overview", route: "/dashboard/expenses" },
  { title: "Track", route: "/dashboard/expenses/track" },
  { title: "Budgets", route: "/dashboard/expenses/budgets" },
  { title: "Reports", route: "/dashboard/expenses/reports" },
];
</script>

<template>
  <div>
    <SectionHeader
      title="Expenses"
      subtitle="Budget management"
      icon="mdi-cart-outline"
      :tabs="tabs"
    />

    <v-card class="mt-6">
      <v-card-title>Budget Management</v-card-title>
      <v-card-text>
        <v-alert type="info" variant="tonal" class="mb-4">
          Set and track budgets by category with in-app alerts.
        </v-alert>
      </v-card-text>
    </v-card>
  </div>
</template>
