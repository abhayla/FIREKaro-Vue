<script setup lang="ts">
import { computed } from "vue";
import { useUiStore } from "@/stores/ui";
import { useUserStore } from "@/stores/user";

const uiStore = useUiStore();
const userStore = useUserStore();

const viewMode = computed({
  get: () => (uiStore.isFamilyView ? "family" : "personal"),
  set: (value: string) => {
    if (value === "family" && !uiStore.isFamilyView) {
      uiStore.toggleFamilyView();
    } else if (value === "personal" && uiStore.isFamilyView) {
      uiStore.toggleFamilyView();
    }
  },
});

const selectedMember = computed({
  get: () => uiStore.selectedFamilyMemberId ?? "all",
  set: (value: string) => {
    uiStore.setSelectedFamilyMember(value === "all" ? null : value);
  },
});

const selectedMemberName = computed(() => {
  if (!uiStore.isFamilyView) return null;
  if (!uiStore.selectedFamilyMemberId) return "All Members";
  const member = userStore.familyMembers.find(
    (m) => m.id === uiStore.selectedFamilyMemberId
  );
  return member?.name ?? "All Members";
});

const tooltipText = computed(() => {
  if (!uiStore.isFamilyView) return "Personal View";
  return `Family: ${selectedMemberName.value}`;
});
</script>

<template>
  <v-menu location="bottom end" :close-on-content-click="false" min-width="280">
    <template #activator="{ props }">
      <v-btn
        v-bind="props"
        :color="uiStore.isFamilyView ? 'primary' : 'default'"
        variant="text"
        icon
      >
        <v-icon>
          {{ uiStore.isFamilyView ? "mdi-account-group" : "mdi-account" }}
        </v-icon>
        <v-tooltip activator="parent" location="bottom">
          {{ tooltipText }}
        </v-tooltip>
      </v-btn>
    </template>

    <v-card>
      <v-card-title class="d-flex align-center py-3">
        <v-icon icon="mdi-account-switch" class="mr-2" size="small" />
        View Mode
      </v-card-title>

      <v-divider />

      <v-card-text>
        <!-- View Mode Toggle -->
        <v-btn-toggle
          v-model="viewMode"
          mandatory
          density="compact"
          color="primary"
          variant="outlined"
          class="mb-4"
          style="width: 100%"
        >
          <v-btn value="personal" style="flex: 1">
            <v-icon icon="mdi-account" class="mr-1" size="small" />
            Personal
          </v-btn>
          <v-btn value="family" style="flex: 1">
            <v-icon icon="mdi-account-group" class="mr-1" size="small" />
            Family
          </v-btn>
        </v-btn-toggle>

        <!-- Family Member Selector -->
        <v-select
          v-if="uiStore.isFamilyView"
          v-model="selectedMember"
          :items="[
            { title: 'All Members', value: 'all' },
            ...userStore.familyMembers.map((m) => ({
              title: m.name,
              value: m.id,
              subtitle: m.relationship,
            })),
          ]"
          item-title="title"
          item-value="value"
          label="View for"
          density="compact"
          variant="outlined"
          hide-details
        />
      </v-card-text>
    </v-card>
  </v-menu>
</template>
