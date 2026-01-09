<script setup lang="ts">
import { onMounted, computed } from 'vue'
import { useNotificationsStore } from '@/stores/notifications'
import { formatDistanceToNow } from 'date-fns'

const notificationsStore = useNotificationsStore()

// Fetch alerts on mount
onMounted(() => {
  notificationsStore.fetchAlerts()
})

// Format relative time
const formatTime = (dateStr: string) => {
  try {
    return formatDistanceToNow(new Date(dateStr), { addSuffix: true })
  } catch {
    return ''
  }
}

// Has any alerts
const hasAlerts = computed(() => notificationsStore.alerts.length > 0)
</script>

<template>
  <v-menu location="bottom end" :close-on-content-click="false" max-width="400">
    <template #activator="{ props }">
      <v-btn icon variant="text" v-bind="props">
        <v-badge
          :content="notificationsStore.unreadCount"
          :model-value="notificationsStore.unreadCount > 0"
          color="error"
          floating
        >
          <v-icon icon="mdi-bell-outline" />
        </v-badge>
      </v-btn>
    </template>

    <v-card min-width="350">
      <v-card-title class="d-flex align-center py-3">
        <v-icon icon="mdi-bell" class="mr-2" />
        Notifications
        <v-spacer />
        <v-btn
          v-if="notificationsStore.unreadCount > 0"
          size="x-small"
          variant="text"
          color="primary"
          @click="notificationsStore.markAllAsRead"
        >
          Mark all read
        </v-btn>
      </v-card-title>

      <v-divider />

      <!-- Loading state -->
      <v-card-text v-if="notificationsStore.isLoading" class="text-center py-6">
        <v-progress-circular indeterminate color="primary" size="32" />
      </v-card-text>

      <!-- Empty state -->
      <v-card-text v-else-if="!hasAlerts" class="text-center py-8">
        <v-icon icon="mdi-bell-check-outline" size="48" color="grey" />
        <p class="text-medium-emphasis mt-2">No notifications</p>
      </v-card-text>

      <!-- Alert list -->
      <v-list v-else lines="two" density="compact" max-height="400" class="overflow-y-auto">
        <v-list-item
          v-for="alert in notificationsStore.recentAlerts"
          :key="alert.id"
          :class="{ 'bg-grey-lighten-4': !alert.isRead }"
          @click="notificationsStore.markAsRead(alert.id)"
        >
          <template #prepend>
            <v-avatar
              :color="notificationsStore.getAlertColor(alert.alertType)"
              size="32"
              variant="tonal"
            >
              <v-icon :icon="notificationsStore.getAlertIcon(alert.alertType)" size="18" />
            </v-avatar>
          </template>

          <v-list-item-title :class="{ 'font-weight-bold': !alert.isRead }">
            {{ alert.message }}
          </v-list-item-title>

          <v-list-item-subtitle>
            <v-chip
              v-if="alert.category"
              size="x-small"
              class="mr-1"
              variant="tonal"
            >
              {{ alert.category }}
            </v-chip>
            {{ formatTime(alert.createdAt) }}
          </v-list-item-subtitle>

          <template #append>
            <v-btn
              icon="mdi-close"
              size="x-small"
              variant="text"
              @click.stop="notificationsStore.deleteAlert(alert.id)"
            />
          </template>
        </v-list-item>
      </v-list>

      <v-divider v-if="hasAlerts" />

      <v-card-actions v-if="hasAlerts" class="justify-center">
        <v-btn
          size="small"
          variant="text"
          color="primary"
          to="/dashboard/expenses/budgets"
        >
          View Budget
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-menu>
</template>

<style scoped>
.bg-grey-lighten-4 {
  background-color: rgb(var(--v-theme-surface-variant)) !important;
}
</style>
