import { test, expect } from "@playwright/test";
import { InsuranceOverviewPage, LifeInsurancePage, HealthInsurancePage, InsuranceReportsPage, InsuranceCalculatorPage } from "../../pages/insurance";

test.describe("Insurance Navigation", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/dashboard/insurance");
    await page.waitForLoadState("domcontentloaded");
    await page.locator(".v-card").first().waitFor({ state: "visible", timeout: 10000 }).catch(() => {});
  });

  test("should load insurance overview page", async ({ page }) => {
    const overview = new InsuranceOverviewPage(page);
    await expect(overview.pageTitle).toBeVisible();
    await expect(page).toHaveURL(/\/dashboard\/protection$/);
  });

  test("should display all navigation tabs", async ({ page }) => {
    await expect(page.getByRole("tab", { name: "Overview" })).toBeVisible();
    await expect(page.getByRole("tab", { name: /Life/i })).toBeVisible();
    await expect(page.getByRole("tab", { name: /Health/i })).toBeVisible();
    await expect(page.getByRole("tab", { name: /Other/i })).toBeVisible();
    await expect(page.getByRole("tab", { name: /Calculator/i })).toBeVisible();
    await expect(page.getByRole("tab", { name: /Reports/i })).toBeVisible();
  });

  test("should navigate to Life Insurance page", async ({ page }) => {
    const lifePage = new LifeInsurancePage(page);
    await lifePage.navigateTo();
    await expect(page).toHaveURL(/\/dashboard\/protection\/life/);
    await lifePage.expectPageLoaded();
  });

  test("should navigate to Health Insurance page", async ({ page }) => {
    const healthPage = new HealthInsurancePage(page);
    await healthPage.navigateTo();
    await expect(page).toHaveURL(/\/dashboard\/protection\/health/);
    await healthPage.expectPageLoaded();
  });

  test("should navigate to Other Insurance page", async ({ page }) => {
    await page.goto("/dashboard/insurance/other");
    await page.waitForLoadState("domcontentloaded");
    await page.locator(".v-card").first().waitFor({ state: "visible", timeout: 10000 }).catch(() => {});
    await expect(page).toHaveURL(/\/dashboard\/protection\/other/);
  });

  test("should navigate to Calculator page", async ({ page }) => {
    const calculatorPage = new InsuranceCalculatorPage(page);
    await calculatorPage.navigateTo();
    await expect(page).toHaveURL(/\/dashboard\/protection\/calculator/);
    await calculatorPage.expectPageLoaded();
  });

  test("should navigate to Reports page", async ({ page }) => {
    const reportsPage = new InsuranceReportsPage(page);
    await reportsPage.navigateTo();
    await expect(page).toHaveURL(/\/dashboard\/protection\/reports/);
    await reportsPage.expectPageLoaded();
  });

  test("should show correct active tab indicator on overview", async ({ page }) => {
    const overviewTab = page.getByRole("tab", { name: "Overview" });
    await expect(overviewTab).toHaveAttribute("aria-selected", "true");
  });

  test("should show correct active tab indicator when navigating to life page", async ({ page }) => {
    await page.goto("/dashboard/insurance/life");
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(500); // Wait for tab state to update

    const lifeTab = page.getByRole("tab", { name: /Life/i });
    await expect(lifeTab).toHaveAttribute("aria-selected", "true");
  });

  test("should show summary cards on overview page", async ({ page }) => {
    const overview = new InsuranceOverviewPage(page);
    await overview.expectHasSummaryCards();
  });

  test("should be able to navigate between tabs using tab clicks", async ({ page }) => {
    // Click on Life tab
    await page.getByRole("tab", { name: /Life/i }).click();
    await page.waitForTimeout(500);
    await expect(page).toHaveURL(/\/dashboard\/protection\/life/);

    // Click back to Overview
    await page.getByRole("tab", { name: "Overview" }).click();
    await page.waitForTimeout(500);
    await expect(page).toHaveURL(/\/dashboard\/protection$/);
  });
});
