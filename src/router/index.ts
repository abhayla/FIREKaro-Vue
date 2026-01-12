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
    // Income Section (moved to top-level /income)
    {
      path: "/income",
      component: () => import("@/layouts/DashboardLayout.vue"),
      meta: { requiresAuth: true },
      children: [
        {
          path: "",
          name: "income",
          component: () => import("@/pages/dashboard/income/index.vue"),
        },
        {
          path: "salary",
          name: "income-salary",
          component: () => import("@/pages/dashboard/salary/index.vue"),
        },
        {
          path: "business",
          name: "income-business",
          component: () => import("@/pages/dashboard/income/business.vue"),
        },
        {
          path: "rental",
          name: "income-rental",
          component: () => import("@/pages/dashboard/income/rental.vue"),
        },
        {
          path: "capital-gains",
          name: "income-capital-gains",
          component: () => import("@/pages/dashboard/income/capital-gains.vue"),
        },
        {
          path: "interest",
          name: "income-interest",
          component: () => import("@/pages/dashboard/income/interest.vue"),
        },
        {
          path: "dividends",
          name: "income-dividends",
          component: () => import("@/pages/dashboard/income/dividends.vue"),
        },
        {
          path: "other",
          name: "income-other",
          component: () => import("@/pages/dashboard/income/other.vue"),
        },
        {
          path: "reports",
          name: "income-reports",
          component: () => import("@/pages/dashboard/income/reports.vue"),
        },
      ],
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
// Section 2: Tax Planning (Income is at top-level /income)
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
        {
          path: "expenses/categories",
          name: "expenses-categories",
          component: () => import("@/pages/dashboard/expenses/categories.vue"),
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
          path: "investments/esop",
          name: "investments-esop",
          component: () => import("@/pages/dashboard/investments/esop.vue"),
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
        // Section 7: Insurance
        {
          path: "insurance",
          name: "insurance",
          component: () => import("@/pages/dashboard/insurance/index.vue"),
        },
        {
          path: "insurance/life",
          name: "insurance-life",
          component: () => import("@/pages/dashboard/insurance/life.vue"),
        },
        {
          path: "insurance/health",
          name: "insurance-health",
          component: () => import("@/pages/dashboard/insurance/health.vue"),
        },
        {
          path: "insurance/other",
          name: "insurance-other",
          component: () => import("@/pages/dashboard/insurance/other.vue"),
        },
        {
          path: "insurance/calculator",
          name: "insurance-calculator",
          component: () =>
            import("@/pages/dashboard/insurance/calculator.vue"),
        },
        {
          path: "insurance/reports",
          name: "insurance-reports",
          component: () => import("@/pages/dashboard/insurance/reports.vue"),
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
    // Legacy URL Redirects
    // Income section - /dashboard/income/* redirects to /income/*
    {
      path: "/dashboard/income",
      redirect: "/income",
    },
    {
      path: "/dashboard/income/:path(.*)",
      redirect: (to) => `/income/${to.params.path}`,
    },
    // Salary section - /dashboard/salary redirects to /income/salary
    {
      path: "/dashboard/salary",
      redirect: "/income/salary",
    },
    {
      path: "/dashboard/salary/current",
      redirect: "/income/salary",
    },
    {
      path: "/dashboard/salary/history",
      redirect: "/income/salary",
    },
    {
      path: "/dashboard/salary/reports",
      redirect: "/income/salary",
    },
    // Legacy non-salary-income redirects (now to /income)
    {
      path: "/dashboard/non-salary-income",
      redirect: "/income",
    },
    {
      path: "/dashboard/non-salary-income/:path(.*)",
      redirect: (to) => `/income/${to.params.path}`,
    },
    // Investment shortcut redirects
    {
      path: "/portfolio",
      redirect: "/dashboard/investments",
    },
    {
      path: "/esop",
      redirect: "/dashboard/investments/esop",
    },
    {
      path: "/property",
      redirect: "/dashboard/investments/property",
    },
    {
      path: "/retirement",
      redirect: "/dashboard/investments/epf-ppf",
    },
    {
      path: "/epf",
      redirect: "/dashboard/investments/epf-ppf",
    },
    {
      path: "/ppf",
      redirect: "/dashboard/investments/epf-ppf",
    },
    {
      path: "/nps",
      redirect: "/dashboard/investments/nps",
    },
    {
      path: "/stocks",
      redirect: "/dashboard/investments/stocks",
    },
    {
      path: "/mutual-funds",
      redirect: "/dashboard/investments/mutual-funds",
    },
  ],
});

// Auth guard - uses Better Auth's get-session endpoint
router.beforeEach(async (to, from, next) => {
  if (to.meta.requiresAuth) {
    try {
      const res = await fetch("/api/auth/get-session", {
        credentials: "include",
      });
      const data = await res.json();
      // Better Auth returns { session, user } format
      if (!data?.user) {
        // DEV MODE: Skip auth if backend unavailable
        if (import.meta.env.DEV) {
          console.warn('[DEV] Auth bypassed - no authenticated session')
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
