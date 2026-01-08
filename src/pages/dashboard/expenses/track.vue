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
      subtitle="Add and track expenses"
      icon="mdi-cart-outline"
      :tabs="tabs"
    />

    <v-card class="mt-6">
      <v-card-title>Track Expenses</v-card-title>
      <v-card-text>
        <v-alert type="info" variant="tonal" class="mb-4">
          Add expenses manually or use AI categorization for quick entry.
        </v-alert>
      </v-card-text>
    </v-card>
  </div>
</template>
