<script setup lang="ts">
import { computed } from "vue";
import { useRoute, useRouter } from "vue-router";

interface Tab {
  title: string;
  route: string;
  icon?: string;
}

const props = defineProps<{
  title: string;
  subtitle?: string;
  icon?: string;
  tabs?: Tab[];
}>();

const route = useRoute();
const router = useRouter();

const activeTab = computed(() => {
  if (!props.tabs) return 0;
  const index = props.tabs.findIndex((tab) => route.path === tab.route);
  return index === -1 ? 0 : index;
});

const navigateToTab = (tabRoute: string) => {
  router.push(tabRoute);
};
</script>

<template>
  <div class="section-header mb-6">
    <!-- Title Row -->
    <div class="d-flex align-center mb-4">
      <v-icon v-if="icon" :icon="icon" size="32" color="primary" class="mr-3" />
      <div>
        <h1 class="text-h5 font-weight-bold">{{ title }}</h1>
        <p v-if="subtitle" class="text-body-2 text-medium-emphasis mt-1">
          {{ subtitle }}
        </p>
      </div>
    </div>

    <!-- Tabs -->
    <v-tabs
      v-if="tabs && tabs.length > 0"
      :model-value="activeTab"
      color="primary"
      slider-color="primary"
    >
      <v-tab
        v-for="(tab, index) in tabs"
        :key="tab.route"
        :value="index"
        @click="navigateToTab(tab.route)"
      >
        <v-icon v-if="tab.icon" :icon="tab.icon" class="mr-2" size="small" />
        {{ tab.title }}
      </v-tab>
    </v-tabs>
  </div>
</template>

<style scoped>
.section-header {
  border-bottom: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  padding-bottom: 0;
}
</style>
