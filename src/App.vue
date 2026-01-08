<script setup lang="ts">
import { useTheme } from 'vuetify'
import { useUiStore } from '@/stores/ui'
import { watch } from 'vue'

const theme = useTheme()
const uiStore = useUiStore()

// Sync Vuetify theme with store
watch(
  () => uiStore.isDarkMode,
  (isDark) => {
    theme.global.name.value = isDark ? 'dark' : 'light'
  },
  { immediate: true }
)
</script>

<template>
  <v-app>
    <router-view />
  </v-app>
</template>

<style scoped>
/* App-level styles */
</style>
