import { test, expect } from "@playwright/test";
import {
  FIREDashboardPage,
  FIREPlanningPage,
} from "../../pages/fire-goals";

test.describe("FIRE & Goals Navigation", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/fire-goals");
    await page.waitForLoadState("domcontentloaded");
    await page.locator(".v-card").first().waitFor({ state: "visible", timeout: 10000 }).catch(() => {});
  });

  test("should load FIRE dashboard page", async ({ page }) => {
    const dashboard = new FIREDashboardPage(page);
    await expect(dashboard.pageTitle).toBeVisible();
    await expect(page).toHaveURL(/\/fire-goals/);
  });

  test("should display two main tabs (Overview + Planning)", async ({ page }) => {
    await expect(page.getByRole("tab", { name: /Overview/i })).toBeVisible();
    await expect(page.getByRole("tab", { name: /Planning/i })).toBeVisible();
  });

  test("should default to Overview tab", async ({ page }) => {
    const dashboard = new FIREDashboardPage(page);
    await dashboard.expectOverviewTabActive();
  });

  test("should switch to Planning tab via click", async ({ page }) => {
    const dashboard = new FIREDashboardPage(page);
    await dashboard.switchToPlanningTab();
    await dashboard.expectPlanningTabActive();
    await expect(page).toHaveURL(/\?tab=planning/);
  });

  test("should switch back to Overview tab", async ({ page }) => {
    const dashboard = new FIREDashboardPage(page);
    // Go to Planning first
    await dashboard.switchToPlanningTab();
    await dashboard.expectPlanningTabActive();

    // Switch back to Overview
    await dashboard.switchToOverviewTab();
    await dashboard.expectOverviewTabActive();
  });

  test("should navigate directly to Planning tab via URL", async ({ page }) => {
    const planningPage = new FIREPlanningPage(page);
    await planningPage.navigateTo();
    await planningPage.expectPageLoaded();
    await expect(page).toHaveURL(/\?tab=planning/);
  });

  test("should show FIRE number card on Overview tab", async ({ page }) => {
    const dashboard = new FIREDashboardPage(page);
    await expect(dashboard.fireNumberCard).toBeVisible();
  });

  test("should show correct active tab indicator on Overview", async ({ page }) => {
    const overviewTab = page.getByRole("tab", { name: /Overview/i });
    await expect(overviewTab).toHaveAttribute("aria-selected", "true");
  });

  test("should show correct active tab indicator on Planning", async ({ page }) => {
    await page.goto("/fire-goals?tab=planning");
    await page.waitForLoadState("domcontentloaded");

    const planningTab = page.getByRole("tab", { name: /Planning/i });
    await expect(planningTab).toHaveAttribute("aria-selected", "true");

    const overviewTab = page.getByRole("tab", { name: /Overview/i });
    await expect(overviewTab).toHaveAttribute("aria-selected", "false");
  });

  // Legacy URL redirect tests - /dashboard/fire-goals/* should redirect to /fire-goals
  test("should redirect /dashboard/fire-goals to /fire-goals", async ({ page }) => {
    await page.goto("/dashboard/fire-goals");
    await page.waitForLoadState("domcontentloaded");
    await expect(page).toHaveURL(/\/fire-goals/);
  });

  test("should redirect /dashboard/fire-goals/calculators to /fire-goals?tab=planning", async ({ page }) => {
    await page.goto("/dashboard/fire-goals/calculators");
    await page.waitForLoadState("domcontentloaded");
    await expect(page).toHaveURL(/\/fire-goals.*\?tab=planning/);
  });

  test("should redirect /dashboard/fire-goals/goals to /fire-goals?tab=planning", async ({ page }) => {
    await page.goto("/dashboard/fire-goals/goals");
    await page.waitForLoadState("domcontentloaded");
    await expect(page).toHaveURL(/\/fire-goals.*\?tab=planning/);
  });

  test("should redirect /dashboard/fire-goals/projections to /fire-goals?tab=planning", async ({ page }) => {
    await page.goto("/dashboard/fire-goals/projections");
    await page.waitForLoadState("domcontentloaded");
    await expect(page).toHaveURL(/\/fire-goals.*\?tab=planning/);
  });

  test("should redirect /dashboard/fire-goals/withdrawal to /fire-goals?tab=planning", async ({ page }) => {
    await page.goto("/dashboard/fire-goals/withdrawal");
    await page.waitForLoadState("domcontentloaded");
    await expect(page).toHaveURL(/\/fire-goals.*\?tab=planning/);
  });

  test("should redirect /dashboard/fire-goals/reports to /fire-goals", async ({ page }) => {
    await page.goto("/dashboard/fire-goals/reports");
    await page.waitForLoadState("domcontentloaded");
    await expect(page).toHaveURL(/\/fire-goals(?:\?|$)/);
  });

  test("should preserve browser history on tab navigation", async ({ page }) => {
    const dashboard = new FIREDashboardPage(page);

    // Navigate Overview -> Planning
    await dashboard.switchToPlanningTab();
    await expect(page).toHaveURL(/\?tab=planning/);

    // Use browser back button
    await page.goBack();
    await dashboard.expectOverviewTabActive();
  });
});
