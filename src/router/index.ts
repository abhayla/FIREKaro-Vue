import { createRouter, createWebHistory } from "vue-router";

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: "/",
      name: "home",
      component: () => import("@/pages/index.vue"),
    },
    {
      path: "/auth/signin",
      name: "signin",
      component: () => import("@/pages/auth/signin.vue"),
    },
    {
      path: "/dashboard",
      component: () => import("@/layouts/DashboardLayout.vue"),
      meta: { requiresAuth: true },
      children: [
        {
          path: "",
          name: "dashboard",
          component: () => import("@/pages/dashboard/index.vue"),
        },
        // Section 1: Salary
        {
          path: "salary",
          name: "salary",
          component: () => import("@/pages/dashboard/salary/index.vue"),
        },
        {
          path: "salary/current",
          name: "salary-current",
          component: () => import("@/pages/dashboard/salary/current.vue"),
        },
        {
          path: "salary/history",
          name: "salary-history",
          component: () => import("@/pages/dashboard/salary/history.vue"),
        },
        {
          path: "salary/reports",
          name: "salary-reports",
          component: () => import("@/pages/dashboard/salary/reports.vue"),
        },
        // Section 2: Non-Salary Income
        {
          path: "non-salary-income",
          name: "non-salary-income",
          component: () =>
            import("@/pages/dashboard/non-salary-income/index.vue"),
        },
        {
          path: "non-salary-income/business",
          name: "non-salary-income-business",
          component: () =>
            import("@/pages/dashboard/non-salary-income/business.vue"),
        },
        {
          path: "non-salary-income/rental",
          name: "non-salary-income-rental",
          component: () =>
            import("@/pages/dashboard/non-salary-income/rental.vue"),
        },
        {
          path: "non-salary-income/capital-gains",
          name: "non-salary-income-capital-gains",
          component: () =>
            import("@/pages/dashboard/non-salary-income/capital-gains.vue"),
        },
        {
          path: "non-salary-income/other",
          name: "non-salary-income-other",
          component: () =>
            import("@/pages/dashboard/non-salary-income/other.vue"),
        },
        {
          path: "non-salary-income/reports",
          name: "non-salary-income-reports",
          component: () =>
            import("@/pages/dashboard/non-salary-income/reports.vue"),
        },
        // Section 3: Tax Planning
        {
          path: "tax-planning",
          name: "tax-planning",
          component: () => import("@/pages/dashboard/tax-planning/index.vue"),
        },
        {
          path: "tax-planning/calculator",
          name: "tax-planning-calculator",
          component: () =>
            import("@/pages/dashboard/tax-planning/calculator.vue"),
        },
        {
          path: "tax-planning/deductions",
          name: "tax-planning-deductions",
          component: () =>
            import("@/pages/dashboard/tax-planning/deductions.vue"),
        },
        {
          path: "tax-planning/reports",
          name: "tax-planning-reports",
          component: () => import("@/pages/dashboard/tax-planning/reports.vue"),
        },
        // Section 4: Expenses
        {
          path: "expenses",
          name: "expenses",
          component: () => import("@/pages/dashboard/expenses/index.vue"),
        },
        {
          path: "expenses/track",
          name: "expenses-track",
          component: () => import("@/pages/dashboard/expenses/track.vue"),
        },
        {
          path: "expenses/budgets",
          name: "expenses-budgets",
          component: () => import("@/pages/dashboard/expenses/budgets.vue"),
        },
        {
          path: "expenses/reports",
          name: "expenses-reports",
          component: () => import("@/pages/dashboard/expenses/reports.vue"),
        },
        // Section 5: Investments
        {
          path: "investments",
          name: "investments",
          component: () => import("@/pages/dashboard/investments/index.vue"),
        },
        {
          path: "investments/stocks",
          name: "investments-stocks",
          component: () => import("@/pages/dashboard/investments/stocks.vue"),
        },
        {
          path: "investments/mutual-funds",
          name: "investments-mutual-funds",
          component: () =>
            import("@/pages/dashboard/investments/mutual-funds.vue"),
        },
        {
          path: "investments/epf-ppf",
          name: "investments-epf-ppf",
          component: () => import("@/pages/dashboard/investments/epf-ppf.vue"),
        },
        {
          path: "investments/nps",
          name: "investments-nps",
          component: () => import("@/pages/dashboard/investments/nps.vue"),
        },
        {
          path: "investments/property",
          name: "investments-property",
          component: () => import("@/pages/dashboard/investments/property.vue"),
        },
        {
          path: "investments/reports",
          name: "investments-reports",
          component: () => import("@/pages/dashboard/investments/reports.vue"),
        },
        // Section 6: Liabilities
        {
          path: "liabilities",
          name: "liabilities",
          component: () => import("@/pages/dashboard/liabilities/index.vue"),
        },
        {
          path: "liabilities/loans",
          name: "liabilities-loans",
          component: () => import("@/pages/dashboard/liabilities/loans.vue"),
        },
        {
          path: "liabilities/credit-cards",
          name: "liabilities-credit-cards",
          component: () =>
            import("@/pages/dashboard/liabilities/credit-cards.vue"),
        },
        {
          path: "liabilities/debt-payoff",
          name: "liabilities-debt-payoff",
          component: () =>
            import("@/pages/dashboard/liabilities/debt-payoff.vue"),
        },
        {
          path: "liabilities/reports",
          name: "liabilities-reports",
          component: () => import("@/pages/dashboard/liabilities/reports.vue"),
        },
        // Section 7: Protection
        {
          path: "protection",
          name: "protection",
          component: () => import("@/pages/dashboard/protection/index.vue"),
        },
        {
          path: "protection/life",
          name: "protection-life",
          component: () => import("@/pages/dashboard/protection/life.vue"),
        },
        {
          path: "protection/health",
          name: "protection-health",
          component: () => import("@/pages/dashboard/protection/health.vue"),
        },
        {
          path: "protection/other",
          name: "protection-other",
          component: () => import("@/pages/dashboard/protection/other.vue"),
        },
        {
          path: "protection/calculator",
          name: "protection-calculator",
          component: () =>
            import("@/pages/dashboard/protection/calculator.vue"),
        },
        {
          path: "protection/reports",
          name: "protection-reports",
          component: () => import("@/pages/dashboard/protection/reports.vue"),
        },
        // Section 8: Financial Health
        {
          path: "financial-health",
          name: "financial-health",
          component: () =>
            import("@/pages/dashboard/financial-health/index.vue"),
        },
        {
          path: "financial-health/net-worth",
          name: "financial-health-net-worth",
          component: () =>
            import("@/pages/dashboard/financial-health/net-worth.vue"),
        },
        {
          path: "financial-health/cash-flow",
          name: "financial-health-cash-flow",
          component: () =>
            import("@/pages/dashboard/financial-health/cash-flow.vue"),
        },
        {
          path: "financial-health/banking",
          name: "financial-health-banking",
          component: () =>
            import("@/pages/dashboard/financial-health/banking.vue"),
        },
        {
          path: "financial-health/emergency-fund",
          name: "financial-health-emergency-fund",
          component: () =>
            import("@/pages/dashboard/financial-health/emergency-fund.vue"),
        },
        {
          path: "financial-health/reports",
          name: "financial-health-reports",
          component: () =>
            import("@/pages/dashboard/financial-health/reports.vue"),
        },
        // Section 9: FIRE & Goals
        {
          path: "fire-goals",
          name: "fire-goals",
          component: () => import("@/pages/dashboard/fire-goals/index.vue"),
        },
        {
          path: "fire-goals/calculators",
          name: "fire-goals-calculators",
          component: () =>
            import("@/pages/dashboard/fire-goals/calculators.vue"),
        },
        {
          path: "fire-goals/goals",
          name: "fire-goals-goals",
          component: () => import("@/pages/dashboard/fire-goals/goals.vue"),
        },
        {
          path: "fire-goals/projections",
          name: "fire-goals-projections",
          component: () =>
            import("@/pages/dashboard/fire-goals/projections.vue"),
        },
        {
          path: "fire-goals/withdrawal",
          name: "fire-goals-withdrawal",
          component: () =>
            import("@/pages/dashboard/fire-goals/withdrawal.vue"),
        },
        {
          path: "fire-goals/reports",
          name: "fire-goals-reports",
          component: () => import("@/pages/dashboard/fire-goals/reports.vue"),
        },
      ],
    },
  ],
});

// Auth guard
router.beforeEach(async (to, from, next) => {
  if (to.meta.requiresAuth) {
    try {
      const res = await fetch("/api/auth/session");
      const session = await res.json();
      if (!session?.user) {
        // DEV MODE: Skip auth if backend unavailable
        if (import.meta.env.DEV) {
          console.warn('[DEV] Auth bypassed - backend not available')
          return next()
        }
        return next('/auth/signin')
      }
    } catch {
      // DEV MODE: Skip auth if backend unavailable
      if (import.meta.env.DEV) {
        console.warn('[DEV] Auth bypassed - backend not available')
        return next()
      }
      return next('/auth/signin')
    }
  }
  next();
});

export default router;
