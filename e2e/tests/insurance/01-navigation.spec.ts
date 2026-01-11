import { test, expect } from "@playwright/test";
import { InsurancePage } from "../../pages/insurance";

test.describe("Insurance Navigation", () => {
  let insurancePage: InsurancePage;

  test.beforeEach(async ({ page }) => {
    insurancePage = new InsurancePage(page);
    await insurancePage.navigateTo();
  });

  test("should load insurance page", async ({ page }) => {
    await insurancePage.expectPageLoaded();
    await expect(page).toHaveURL(/\/insurance$/);
  });

  test("should display all main navigation tabs", async ({ page }) => {
    await expect(insurancePage.overviewTab).toBeVisible();
    await expect(insurancePage.itemDetailsTab).toBeVisible();
    await expect(insurancePage.calculatorTab).toBeVisible();
    await expect(insurancePage.reportsTab).toBeVisible();
  });

  test("should show Overview tab as active by default", async () => {
    await insurancePage.expectOnMainTab("overview");
  });

  test("should navigate to Item Details tab", async ({ page }) => {
    await insurancePage.goToMainTab("details");
    await insurancePage.expectOnMainTab("details");
    // URL should remain the same (client-side navigation)
    await expect(page).toHaveURL(/\/insurance$/);
  });

  test("should navigate to Calculator tab", async ({ page }) => {
    await insurancePage.goToMainTab("calculator");
    await insurancePage.expectOnMainTab("calculator");
    await expect(page).toHaveURL(/\/insurance$/);
  });

  test("should navigate to Reports tab", async ({ page }) => {
    await insurancePage.goToMainTab("reports");
    await insurancePage.expectOnMainTab("reports");
    await expect(page).toHaveURL(/\/insurance$/);
  });

  test("should display sub-tabs within Item Details", async ({ page }) => {
    await insurancePage.goToMainTab("details");

    // Check all 5 sub-tabs are visible
    await expect(insurancePage.lifeSubTab).toBeVisible();
    await expect(insurancePage.healthSubTab).toBeVisible();
    await expect(insurancePage.motorSubTab).toBeVisible();
    await expect(insurancePage.homeSubTab).toBeVisible();
    await expect(insurancePage.travelSubTab).toBeVisible();
  });

  test("should navigate to Life sub-tab within Item Details", async ({ page }) => {
    await insurancePage.goToItemDetails("life");
    await insurancePage.expectOnMainTab("details");
    await insurancePage.expectOnSubTab("life");
    await expect(page).toHaveURL(/\/insurance$/);
  });

  test("should navigate to Health sub-tab within Item Details", async ({ page }) => {
    await insurancePage.goToItemDetails("health");
    await insurancePage.expectOnMainTab("details");
    await insurancePage.expectOnSubTab("health");
    await expect(page).toHaveURL(/\/insurance$/);
  });

  test("should navigate to Motor sub-tab within Item Details", async ({ page }) => {
    await insurancePage.goToItemDetails("motor");
    await insurancePage.expectOnMainTab("details");
    await insurancePage.expectOnSubTab("motor");
  });

  test("should navigate to Home sub-tab within Item Details", async ({ page }) => {
    await insurancePage.goToItemDetails("home");
    await insurancePage.expectOnMainTab("details");
    await insurancePage.expectOnSubTab("home");
  });

  test("should navigate to Travel sub-tab within Item Details", async ({ page }) => {
    await insurancePage.goToItemDetails("travel");
    await insurancePage.expectOnMainTab("details");
    await insurancePage.expectOnSubTab("travel");
  });

  test("should show summary cards on Overview tab", async () => {
    await insurancePage.expectOnMainTab("overview");
    await insurancePage.expectHasSummaryCards();
  });

  test("should be able to navigate between main tabs using tab clicks", async () => {
    // Start on Overview
    await insurancePage.expectOnMainTab("overview");

    // Go to Item Details
    await insurancePage.goToMainTab("details");
    await insurancePage.expectOnMainTab("details");

    // Go to Calculator
    await insurancePage.goToMainTab("calculator");
    await insurancePage.expectOnMainTab("calculator");

    // Go to Reports
    await insurancePage.goToMainTab("reports");
    await insurancePage.expectOnMainTab("reports");

    // Back to Overview
    await insurancePage.goToMainTab("overview");
    await insurancePage.expectOnMainTab("overview");
  });

  test("should be able to navigate between sub-tabs within Item Details", async () => {
    await insurancePage.goToMainTab("details");

    // Navigate through all sub-tabs
    await insurancePage.goToSubTab("life");
    await insurancePage.expectOnSubTab("life");

    await insurancePage.goToSubTab("health");
    await insurancePage.expectOnSubTab("health");

    await insurancePage.goToSubTab("motor");
    await insurancePage.expectOnSubTab("motor");

    await insurancePage.goToSubTab("home");
    await insurancePage.expectOnSubTab("home");

    await insurancePage.goToSubTab("travel");
    await insurancePage.expectOnSubTab("travel");
  });

  test("should handle legacy URLs by redirecting to main insurance page", async ({ page }) => {
    // Legacy URLs should redirect to main insurance page
    await page.goto("/dashboard/insurance/life");
    await page.waitForLoadState("domcontentloaded");
    await expect(page).toHaveURL(/\/insurance$/);

    await page.goto("/dashboard/insurance/health");
    await page.waitForLoadState("domcontentloaded");
    await expect(page).toHaveURL(/\/insurance$/);

    await page.goto("/dashboard/insurance/calculator");
    await page.waitForLoadState("domcontentloaded");
    await expect(page).toHaveURL(/\/insurance$/);

    await page.goto("/dashboard/insurance/reports");
    await page.waitForLoadState("domcontentloaded");
    await expect(page).toHaveURL(/\/insurance$/);
  });
});
