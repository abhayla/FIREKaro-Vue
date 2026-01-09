import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export interface Alert {
  id: string
  alertType: 'BUDGET_WARNING' | 'BUDGET_EXCEEDED' | 'SAVINGS_GOAL' | 'SYSTEM'
  category: string | null
  percentage: number | null
  message: string
  isRead: boolean
  createdAt: string
}

export interface AlertPreferences {
  budgetAlerts: boolean
  overspendAlerts: boolean
  alertThreshold: number
}

export interface ToastNotification {
  id: string
  message: string
  type: 'success' | 'error' | 'warning' | 'info'
  timeout?: number
}

export const useNotificationsStore = defineStore('notifications', () => {
  // State
  const alerts = ref<Alert[]>([])
  const preferences = ref<AlertPreferences>({
    budgetAlerts: true,
    overspendAlerts: true,
    alertThreshold: 80,
  })
  const isLoading = ref(false)
  const toasts = ref<ToastNotification[]>([])

  // Getters
  const unreadCount = computed(() => alerts.value.filter((a) => !a.isRead).length)

  const unreadAlerts = computed(() => alerts.value.filter((a) => !a.isRead))

  const recentAlerts = computed(() => alerts.value.slice(0, 10))

  // Actions
  async function fetchAlerts() {
    isLoading.value = true
    try {
      const res = await fetch('/api/alerts')
      if (res.ok) {
        alerts.value = await res.json()
      }
    } catch (error) {
      console.error('Failed to fetch alerts:', error)
    } finally {
      isLoading.value = false
    }
  }

  async function fetchPreferences() {
    try {
      const res = await fetch('/api/alerts/preferences')
      if (res.ok) {
        preferences.value = await res.json()
      }
    } catch (error) {
      console.error('Failed to fetch preferences:', error)
    }
  }

  async function updatePreferences(newPrefs: Partial<AlertPreferences>) {
    try {
      const res = await fetch('/api/alerts/preferences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPrefs),
      })
      if (res.ok) {
        preferences.value = await res.json()
        showToast('Preferences updated', 'success')
      }
    } catch (error) {
      console.error('Failed to update preferences:', error)
      showToast('Failed to update preferences', 'error')
    }
  }

  async function markAsRead(id: string) {
    try {
      const res = await fetch(`/api/alerts/${id}/read`, { method: 'POST' })
      if (res.ok) {
        const alert = alerts.value.find((a) => a.id === id)
        if (alert) alert.isRead = true
      }
    } catch (error) {
      console.error('Failed to mark alert as read:', error)
    }
  }

  async function markAllAsRead() {
    try {
      const res = await fetch('/api/alerts/read-all', { method: 'POST' })
      if (res.ok) {
        alerts.value.forEach((a) => (a.isRead = true))
        showToast('All alerts marked as read', 'success')
      }
    } catch (error) {
      console.error('Failed to mark all as read:', error)
    }
  }

  async function deleteAlert(id: string) {
    try {
      const res = await fetch(`/api/alerts/${id}`, { method: 'DELETE' })
      if (res.ok) {
        alerts.value = alerts.value.filter((a) => a.id !== id)
      }
    } catch (error) {
      console.error('Failed to delete alert:', error)
    }
  }

  async function checkBudgetAlerts() {
    try {
      const res = await fetch('/api/alerts/check-budget', { method: 'POST' })
      if (res.ok) {
        const result = await res.json()
        if (result.alertsCreated > 0) {
          // Refresh alerts to show new ones
          await fetchAlerts()
        }
      }
    } catch (error) {
      console.error('Failed to check budget alerts:', error)
    }
  }

  // Toast notifications (in-app snackbar)
  function showToast(message: string, type: ToastNotification['type'] = 'info', timeout = 4000) {
    const id = crypto.randomUUID()
    toasts.value.push({ id, message, type, timeout })

    // Auto-remove after timeout
    if (timeout > 0) {
      setTimeout(() => {
        dismissToast(id)
      }, timeout)
    }
  }

  function dismissToast(id: string) {
    toasts.value = toasts.value.filter((t) => t.id !== id)
  }

  // Get alert icon
  function getAlertIcon(type: Alert['alertType']) {
    switch (type) {
      case 'BUDGET_WARNING':
        return 'mdi-alert'
      case 'BUDGET_EXCEEDED':
        return 'mdi-alert-circle'
      case 'SAVINGS_GOAL':
        return 'mdi-piggy-bank'
      default:
        return 'mdi-bell'
    }
  }

  // Get alert color
  function getAlertColor(type: Alert['alertType']) {
    switch (type) {
      case 'BUDGET_WARNING':
        return 'warning'
      case 'BUDGET_EXCEEDED':
        return 'error'
      case 'SAVINGS_GOAL':
        return 'success'
      default:
        return 'info'
    }
  }

  return {
    // State
    alerts,
    preferences,
    isLoading,
    toasts,

    // Getters
    unreadCount,
    unreadAlerts,
    recentAlerts,

    // Actions
    fetchAlerts,
    fetchPreferences,
    updatePreferences,
    markAsRead,
    markAllAsRead,
    deleteAlert,
    checkBudgetAlerts,
    showToast,
    dismissToast,
    getAlertIcon,
    getAlertColor,
  }
})
