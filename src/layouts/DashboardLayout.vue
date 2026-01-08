<script setup lang="ts">
import { ref, computed } from "vue";
import { useRouter, useRoute } from "vue-router";
import { useUiStore } from "@/stores/ui";
import { useUserStore } from "@/stores/user";

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
    children: [
      { title: "Overview", route: "/dashboard/salary" },
      { title: "Current Salary", route: "/dashboard/salary/current" },
      { title: "Salary History", route: "/dashboard/salary/history" },
      { title: "Reports", route: "/dashboard/salary/reports" },
    ],
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
    route: "/dashboard/tax-planning",
    children: [
      { title: "Overview", route: "/dashboard/tax-planning" },
      { title: "Tax Calculator", route: "/dashboard/tax-planning/calculator" },
      { title: "Deductions", route: "/dashboard/tax-planning/deductions" },
      { title: "Reports", route: "/dashboard/tax-planning/reports" },
    ],
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
    title: "Protection",
    icon: "mdi-shield-check",
    route: "/dashboard/protection",
    children: [
      { title: "Overview", route: "/dashboard/protection" },
      { title: "Life Insurance", route: "/dashboard/protection/life" },
      { title: "Health Insurance", route: "/dashboard/protection/health" },
      { title: "Other Insurance", route: "/dashboard/protection/other" },
      {
        title: "Coverage Calculator",
        route: "/dashboard/protection/calculator",
      },
      { title: "Reports", route: "/dashboard/protection/reports" },
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

// Track expanded sections
const expandedSections = ref<string[]>([]);

// Check if a section is active
const isSectionActive = (section: (typeof sections)[0]) => {
  return route.path.startsWith(section.route);
};

// Toggle section expansion
const toggleSection = (title: string) => {
  const index = expandedSections.value.indexOf(title);
  if (index === -1) {
    expandedSections.value.push(title);
  } else {
    expandedSections.value.splice(index, 1);
  }
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
      color="surface"
      class="sidebar"
    >
      <!-- Logo Section -->
      <div class="sidebar-header pa-4">
        <div class="d-flex align-center">
          <v-icon icon="mdi-fire" size="32" color="fire-orange" class="mr-2" />
          <span v-if="!uiStore.sidebarMini" class="text-h6 font-weight-bold">
            FIREKaro
          </span>
        </div>
      </div>

      <v-divider />

      <!-- Navigation List -->
      <v-list density="compact" nav>
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
      <v-btn
        :icon="uiStore.isFamilyView ? 'mdi-account-group' : 'mdi-account'"
        :color="uiStore.isFamilyView ? 'primary' : 'default'"
        variant="text"
        @click="uiStore.toggleFamilyView"
      >
        <v-icon>{{
          uiStore.isFamilyView ? "mdi-account-group" : "mdi-account"
        }}</v-icon>
        <v-tooltip activator="parent" location="bottom">
          {{ uiStore.isFamilyView ? "Family View" : "Personal View" }}
        </v-tooltip>
      </v-btn>

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
  border-right: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
}

.sidebar-header {
  min-height: 64px;
  display: flex;
  align-items: center;
}
</style>
