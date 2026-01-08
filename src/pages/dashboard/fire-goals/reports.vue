<script setup lang="ts">
import SectionHeader from "@/components/shared/SectionHeader.vue";

const tabs = [
  { title: "FIRE Dashboard", route: "/dashboard/fire-goals" },
  { title: "Calculators", route: "/dashboard/fire-goals/calculators" },
  { title: "Goals", route: "/dashboard/fire-goals/goals" },
  { title: "Projections", route: "/dashboard/fire-goals/projections" },
  { title: "Withdrawal", route: "/dashboard/fire-goals/withdrawal" },
  { title: "Reports", route: "/dashboard/fire-goals/reports" },
];
</script>

<template>
  <div>
    <SectionHeader
      title="FIRE & Goals"
      subtitle="FIRE Reports"
      icon="mdi-fire"
      :tabs="tabs"
    />
    <v-card class="mt-6">
      <v-card-title>FIRE Reports</v-card-title>
      <v-card-text>
        <v-alert type="info" variant="tonal"
          >View comprehensive FIRE progress reports and goal tracking.</v-alert
        >
      </v-card-text>
    </v-card>
  </div>
</template>
