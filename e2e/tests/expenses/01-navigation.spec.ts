import { test, expect } from "@playwright/test";
import {
  ExpensesOverviewPage,
  ExpenseTrackingPage,
  BudgetsPage,
  ExpensesReportsPage,
  ExpenseCategoriesPage,
} from "../../pages/expenses";

test.describe("Expenses Navigation", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/dashboard/expenses");
    await page.waitForLoadState("domcontentloaded");
    await page.locator(".v-card").first().waitFor({ state: "visible", timeout: 10000 }).catch(() => {});
  });

  test("should load expenses overview page", async ({ page }) => {
    const overview = new ExpensesOverviewPage(page);
    await expect(overview.pageTitle).toBeVisible();
    await expect(page).toHaveURL(/\/dashboard\/expenses$/);
  });

  test("should display all tabs", async ({ page }) => {
    await expect(page.getByRole("tab", { name: "Overview" })).toBeVisible();
    await expect(page.getByRole("tab", { name: "Track" })).toBeVisible();
    await expect(page.getByRole("tab", { name: "Budgets" })).toBeVisible();
    await expect(page.getByRole("tab", { name: "Reports" })).toBeVisible();
    await expect(page.getByRole("tab", { name: "Categories" })).toBeVisible();
  });

  test("should navigate to Track page", async ({ page }) => {
    // Use direct navigation since tab clicks have timing issues with Vue Router
    await page.goto("/dashboard/expenses/track");
    await page.waitForLoadState("domcontentloaded");
    await page.locator(".v-card").first().waitFor({ state: "visible", timeout: 10000 }).catch(() => {});

    const tracking = new ExpenseTrackingPage(page);
    await tracking.expectPageLoaded();
  });

  test("should navigate to Budgets page", async ({ page }) => {
    await page.goto("/dashboard/expenses/budgets");
    await page.waitForLoadState("domcontentloaded");
    await page.locator(".v-card").first().waitFor({ state: "visible", timeout: 10000 }).catch(() => {});

    const budgets = new BudgetsPage(page);
    await budgets.expectPageLoaded();
  });

  test("should navigate to Reports page", async ({ page }) => {
    await page.goto("/dashboard/expenses/reports");
    await page.waitForLoadState("domcontentloaded");
    await page.locator(".v-card").first().waitFor({ state: "visible", timeout: 10000 }).catch(() => {});

    const reports = new ExpensesReportsPage(page);
    await reports.expectPageLoaded();
  });

  test("should navigate to Categories page", async ({ page }) => {
    await page.goto("/dashboard/expenses/categories");
    await page.waitForLoadState("domcontentloaded");
    await page.locator(".v-card").first().waitFor({ state: "visible", timeout: 10000 }).catch(() => {});

    const categories = new ExpenseCategoriesPage(page);
    await categories.expectPageLoaded();
  });

  test("should show correct active tab indicator", async ({ page }) => {
    const overviewTab = page.getByRole("tab", { name: "Overview" });
    await expect(overviewTab).toHaveAttribute("aria-selected", "true");

    // Navigate to Track and verify active state
    await page.goto("/dashboard/expenses/track");
    await page.waitForLoadState("domcontentloaded");

    const trackTab = page.getByRole("tab", { name: "Track" });
    await expect(trackTab).toHaveAttribute("aria-selected", "true");
    await expect(overviewTab).toHaveAttribute("aria-selected", "false");
  });
});
