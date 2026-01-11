<script setup lang="ts">
import { ref, computed } from "vue";
import { useRouter, useRoute } from "vue-router";
import { useUiStore } from "@/stores/ui";
import { useUserStore } from "@/stores/user";
import AlertNotificationBell from "@/components/shared/AlertNotificationBell.vue";
import AppBarFamilyToggle from "@/components/shared/AppBarFamilyToggle.vue";

const router = useRouter();
const route = useRoute();
const uiStore = useUiStore();
const userStore = useUserStore();

// Fetch user session on mount
userStore.fetchSession();

// Navigation sections (9 sections from Feature-Reorganization-Plan)
const sections = [
  {
    title: "Salary",
    icon: "mdi-cash-multiple",
    route: "/dashboard/salary",
    // Single page with 2 tabs (Overview + Salary Details) - no sub-pages needed
  },
  {
    title: "Non-Salary Income",
    icon: "mdi-cash-plus",
    route: "/dashboard/non-salary-income",
    children: [
      { title: "Overview", route: "/dashboard/non-salary-income" },
      {
        title: "Business Income",
        route: "/dashboard/non-salary-income/business",
      },
      { title: "Rental Income", route: "/dashboard/non-salary-income/rental" },
      {
        title: "Capital Gains",
        route: "/dashboard/non-salary-income/capital-gains",
      },
      { title: "Other Sources", route: "/dashboard/non-salary-income/other" },
      { title: "Reports", route: "/dashboard/non-salary-income/reports" },
    ],
  },
  {
    title: "Tax Planning",
    icon: "mdi-calculator-variant",
    route: "/tax-planning",
    // Single page with 2 tabs (Overview + Tax Details) - no sub-pages needed
  },
  {
    title: "Expenses",
    icon: "mdi-cart-outline",
    route: "/dashboard/expenses",
    children: [
      { title: "Overview", route: "/dashboard/expenses" },
      { title: "Track Expenses", route: "/dashboard/expenses/track" },
      { title: "Budgets", route: "/dashboard/expenses/budgets" },
      { title: "Reports", route: "/dashboard/expenses/reports" },
      { title: "Categories & Rules", route: "/dashboard/expenses/categories" },
    ],
  },
  {
    title: "Investments",
    icon: "mdi-chart-line",
    route: "/dashboard/investments",
    children: [
      { title: "Portfolio", route: "/dashboard/investments" },
      { title: "Stocks", route: "/dashboard/investments/stocks" },
      { title: "Mutual Funds", route: "/dashboard/investments/mutual-funds" },
      { title: "EPF & PPF", route: "/dashboard/investments/epf-ppf" },
      { title: "NPS", route: "/dashboard/investments/nps" },
      { title: "Property", route: "/dashboard/investments/property" },
      { title: "Reports", route: "/dashboard/investments/reports" },
    ],
  },
  {
    title: "Liabilities",
    icon: "mdi-credit-card-outline",
    route: "/dashboard/liabilities",
    children: [
      { title: "Overview", route: "/dashboard/liabilities" },
      { title: "Loans", route: "/dashboard/liabilities/loans" },
      { title: "Credit Cards", route: "/dashboard/liabilities/credit-cards" },
      { title: "Debt Payoff", route: "/dashboard/liabilities/debt-payoff" },
      { title: "Reports", route: "/dashboard/liabilities/reports" },
    ],
  },
  {
    title: "Insurance",
    icon: "mdi-shield-check",
    route: "/dashboard/insurance",
    children: [
      { title: "Overview", route: "/dashboard/insurance" },
      { title: "Life Insurance", route: "/dashboard/insurance/life" },
      { title: "Health Insurance", route: "/dashboard/insurance/health" },
      { title: "Other Insurance", route: "/dashboard/insurance/other" },
      {
        title: "Coverage Calculator",
        route: "/dashboard/insurance/calculator",
      },
      { title: "Reports", route: "/dashboard/insurance/reports" },
    ],
  },
  {
    title: "Financial Health",
    icon: "mdi-heart-pulse",
    route: "/dashboard/financial-health",
    children: [
      { title: "Health Score", route: "/dashboard/financial-health" },
      { title: "Net Worth", route: "/dashboard/financial-health/net-worth" },
      { title: "Cash Flow", route: "/dashboard/financial-health/cash-flow" },
      { title: "Banking", route: "/dashboard/financial-health/banking" },
      {
        title: "Emergency Fund",
        route: "/dashboard/financial-health/emergency-fund",
      },
      { title: "Reports", route: "/dashboard/financial-health/reports" },
    ],
  },
  {
    title: "FIRE & Goals",
    icon: "mdi-fire",
    route: "/dashboard/fire-goals",
    children: [
      { title: "FIRE Dashboard", route: "/dashboard/fire-goals" },
      { title: "Calculators", route: "/dashboard/fire-goals/calculators" },
      { title: "Goals", route: "/dashboard/fire-goals/goals" },
      { title: "Projections", route: "/dashboard/fire-goals/projections" },
      {
        title: "Withdrawal Strategy",
        route: "/dashboard/fire-goals/withdrawal",
      },
      { title: "Reports", route: "/dashboard/fire-goals/reports" },
    ],
  },
];

// Check if a section is active
const isSectionActive = (section: (typeof sections)[0]) => {
  return route.path.startsWith(section.route);
};

// Navigate to route
const navigateTo = (path: string) => {
  router.push(path);
};

// User menu
const userMenuOpen = ref(false);

const handleSignOut = async () => {
  await userStore.signOut();
  router.push("/auth/signin");
};
</script>

<template>
  <v-layout>
    <!-- Navigation Drawer (Sidebar) -->
    <v-navigation-drawer
      v-model="uiStore.sidebarOpen"
      :rail="uiStore.sidebarMini"
      rail-width="72"
      width="280"
      permanent
      class="sidebar"
    >
      <!-- Logo Section -->
      <div class="sidebar-header pa-4">
        <div class="d-flex align-center">
          <div class="logo-container">
            <v-icon icon="mdi-fire" size="28" color="fire-orange" />
          </div>
          <transition name="fade">
            <div v-if="!uiStore.sidebarMini" class="ml-3">
              <span class="text-h6 font-weight-bold">FIRE</span>
              <span class="text-h6 font-weight-bold text-gradient">Karo</span>
            </div>
          </transition>
        </div>
      </div>

      <v-divider />

      <!-- Navigation List -->
      <v-list density="compact" nav open-strategy="single">
        <!-- Dashboard Home -->
        <v-list-item
          prepend-icon="mdi-view-dashboard"
          title="Dashboard"
          :to="'/dashboard'"
          exact
          rounded="lg"
          class="mb-1"
        />

        <v-divider class="my-2" />

        <!-- 9 Sections -->
        <template v-for="section in sections" :key="section.title">
          <v-list-group
            v-if="!uiStore.sidebarMini"
            :value="section.title"
            :prepend-icon="section.icon"
          >
            <template #activator="{ props }">
              <v-list-item
                v-bind="props"
                :title="section.title"
                :active="isSectionActive(section)"
                rounded="lg"
              />
            </template>

            <v-list-item
              v-for="child in section.children"
              :key="child.route"
              :title="child.title"
              :to="child.route"
              rounded="lg"
              class="ml-4"
            />
          </v-list-group>

          <!-- Mini mode - just icons -->
          <v-list-item
            v-else
            :prepend-icon="section.icon"
            :to="section.route"
            :active="isSectionActive(section)"
            rounded="lg"
            class="mb-1"
          />
        </template>
      </v-list>

      <!-- Bottom Actions -->
      <template #append>
        <div class="pa-2">
          <v-btn
            :icon="
              uiStore.sidebarMini ? 'mdi-chevron-right' : 'mdi-chevron-left'
            "
            variant="text"
            size="small"
            block
            @click="uiStore.toggleMiniMode"
          />
        </div>
      </template>
    </v-navigation-drawer>

    <!-- App Bar -->
    <v-app-bar flat color="surface" border="b">
      <v-app-bar-nav-icon @click="uiStore.toggleSidebar" />

      <v-toolbar-title class="text-body-1">
        <!-- Breadcrumb or current page title could go here -->
      </v-toolbar-title>

      <v-spacer />

      <!-- Family View Toggle -->
      <AppBarFamilyToggle />

      <!-- Dark Mode Toggle -->
      <v-btn
        :icon="uiStore.isDarkMode ? 'mdi-weather-sunny' : 'mdi-weather-night'"
        variant="text"
        @click="uiStore.toggleDarkMode"
      >
        <v-icon>{{
          uiStore.isDarkMode ? "mdi-weather-sunny" : "mdi-weather-night"
        }}</v-icon>
        <v-tooltip activator="parent" location="bottom">
          {{ uiStore.isDarkMode ? "Light Mode" : "Dark Mode" }}
        </v-tooltip>
      </v-btn>

      <!-- Notification Bell -->
      <AlertNotificationBell />

      <!-- User Menu -->
      <v-menu v-model="userMenuOpen" :close-on-content-click="false">
        <template #activator="{ props }">
          <v-btn v-bind="props" icon variant="text" class="ml-2">
            <v-avatar
              v-if="userStore.user?.image"
              :image="userStore.user.image"
              size="32"
            />
            <v-avatar v-else color="primary" size="32">
              <span class="text-body-2">{{ userStore.userInitials }}</span>
            </v-avatar>
          </v-btn>
        </template>

        <v-card min-width="200">
          <v-card-text class="pb-0">
            <div class="text-subtitle-1 font-weight-medium">
              {{ userStore.userName }}
            </div>
            <div class="text-body-2 text-medium-emphasis">
              {{ userStore.user?.email }}
            </div>
          </v-card-text>
          <v-divider class="my-2" />
          <v-list density="compact">
            <v-list-item
              prepend-icon="mdi-account-cog"
              title="Settings"
              @click="navigateTo('/dashboard/settings')"
            />
            <v-list-item
              prepend-icon="mdi-logout"
              title="Sign Out"
              @click="handleSignOut"
            />
          </v-list>
        </v-card>
      </v-menu>
    </v-app-bar>

    <!-- Main Content -->
    <v-main>
      <v-container fluid class="pa-6">
        <router-view />
      </v-container>
    </v-main>
  </v-layout>
</template>

<style scoped>
.sidebar {
  background: rgb(var(--v-theme-sidebar-bg)) !important;
  border-right: 1px solid rgba(var(--v-border-color), 0.08) !important;
  transition: background var(--transition-base, 200ms);
}

.sidebar-header {
  min-height: 64px;
  display: flex;
  align-items: center;
  border-bottom: 1px solid rgba(var(--v-border-color), 0.08);
}

.logo-container {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(var(--v-theme-fire-orange), 0.1);
  border-radius: 12px;
  flex-shrink: 0;
}

/* Navigation item styling */
:deep(.v-list-item) {
  margin: 2px 8px;
  border-radius: 12px !important;
  transition: all 150ms cubic-bezier(0.4, 0, 0.2, 1);
}

:deep(.v-list-item:hover) {
  background: rgb(var(--v-theme-sidebar-hover));
}

:deep(.v-list-item--active) {
  background: rgb(var(--v-theme-sidebar-active)) !important;
}

:deep(.v-list-item--active)::before {
  opacity: 0;
}

:deep(.v-list-item--active) .v-list-item__prepend .v-icon {
  color: rgb(var(--v-theme-primary));
}

/* Group items indentation */
:deep(.v-list-group__items .v-list-item) {
  padding-left: 48px !important;
}

/* Mini mode adjustments */
.v-navigation-drawer--rail :deep(.v-list-item) {
  margin: 4px 8px;
  justify-content: center;
}

/* Fade transition for logo text */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 150ms cubic-bezier(0.4, 0, 0.2, 1);
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* Divider styling */
:deep(.v-divider) {
  opacity: 0.08;
}
</style>
