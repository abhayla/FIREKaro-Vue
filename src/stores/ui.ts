import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useUiStore = defineStore('ui', () => {
  // State
  const sidebarOpen = ref(true)
  const sidebarMini = ref(false)
  const isDarkMode = ref(false)
  const isFamilyView = ref(false)
  const selectedFamilyMemberId = ref<string | null>(null)

  // Computed
  const sidebarWidth = computed(() => {
    if (!sidebarOpen.value) return 0
    return sidebarMini.value ? 72 : 280
  })

  // Actions
  function toggleSidebar() {
    sidebarOpen.value = !sidebarOpen.value
  }

  function toggleMiniMode() {
    sidebarMini.value = !sidebarMini.value
  }

  function toggleDarkMode() {
    isDarkMode.value = !isDarkMode.value
    localStorage.setItem('darkMode', String(isDarkMode.value))
  }

  function toggleFamilyView() {
    isFamilyView.value = !isFamilyView.value
    if (!isFamilyView.value) {
      selectedFamilyMemberId.value = null
    }
  }

  function setSelectedFamilyMember(id: string | null) {
    selectedFamilyMemberId.value = id
  }

  // Initialize from localStorage
  function initFromStorage() {
    const savedDarkMode = localStorage.getItem('darkMode')
    if (savedDarkMode !== null) {
      isDarkMode.value = savedDarkMode === 'true'
    } else {
      // Check system preference
      isDarkMode.value = window.matchMedia('(prefers-color-scheme: dark)').matches
    }
  }

  // Call init
  initFromStorage()

  return {
    // State
    sidebarOpen,
    sidebarMini,
    isDarkMode,
    isFamilyView,
    selectedFamilyMemberId,
    // Computed
    sidebarWidth,
    // Actions
    toggleSidebar,
    toggleMiniMode,
    toggleDarkMode,
    toggleFamilyView,
    setSelectedFamilyMember,
  }
})
