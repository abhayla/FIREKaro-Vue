<script setup lang="ts">
import { ref, computed } from "vue";
import SectionHeader from "@/components/shared/SectionHeader.vue";
import CapitalGainsOverviewTab from "@/components/income/CapitalGainsOverviewTab.vue";
import CapitalGainsDetailsTab from "@/components/income/CapitalGainsDetailsTab.vue";
import { useFinancialYear } from "@/composables/useSalary";
import { getFinancialYearOptions } from "@/types/salary";

// Financial Year
const { selectedFinancialYear, setFinancialYear } = useFinancialYear();
const fyOptions = computed(() => getFinancialYearOptions());

// Tab state
const activeTab = ref(0);

function goToDetails() {
  activeTab.value = 1;
}
</script>

<template>
  <div>
    <SectionHeader
      title="Income"
      subtitle="Capital Gains (STCG/LTCG)"
      icon="mdi-cash-plus"
    />

    <!-- Controls Row -->
    <v-row class="mb-4" align="center">
      <v-col cols="12" sm="6" md="4">
        <v-select
          v-model="selectedFinancialYear"
          label="Financial Year"
          :items="fyOptions"
          density="compact"
          hide-details
          @update:model-value="setFinancialYear"
        />
      </v-col>
    </v-row>

    <!-- Tab Navigation -->
    <v-tabs v-model="activeTab" class="mb-6" color="primary">
      <v-tab :value="0">
        <v-icon start>mdi-chart-box</v-icon>
        Overview
      </v-tab>
      <v-tab :value="1">
        <v-icon start>mdi-trending-up</v-icon>
        Capital Gains Details
      </v-tab>
    </v-tabs>

    <!-- Tab Content -->
    <v-tabs-window v-model="activeTab">
      <v-tabs-window-item :value="0">
        <CapitalGainsOverviewTab @go-to-details="goToDetails" />
      </v-tabs-window-item>
      <v-tabs-window-item :value="1">
        <CapitalGainsDetailsTab />
      </v-tabs-window-item>
    </v-tabs-window>
  </div>
</template>
