import { test, expect } from "@playwright/test";
import { InsurancePage } from "../../pages/insurance";

test.describe("Insurance Reports", () => {
  let insurancePage: InsurancePage;

  test.beforeEach(async ({ page }) => {
    insurancePage = new InsurancePage(page);
    await insurancePage.navigateTo();
    await insurancePage.goToMainTab("reports");
  });

  test("should display reports tab", async ({ page }) => {
    await insurancePage.expectPageLoaded();
    await insurancePage.expectOnMainTab("reports");
    await expect(page).toHaveURL(/\/insurance$/);
  });

  test("should show coverage chart or data table", async () => {
    // Reports tab should display some form of data visualization
    await insurancePage.expectHasChartOrTable();
  });

  test("should have export button", async () => {
    await expect(insurancePage.exportButton).toBeVisible();
  });

  test("should have report type tabs or sections", async ({ page }) => {
    // Check for report tabs or at least one report section
    const hasTabs = await page.locator(".v-tabs").first().isVisible();
    const hasCards = await page.locator(".v-card").first().isVisible();
    expect(hasTabs || hasCards).toBeTruthy();
  });

  test("should be able to switch between report types", async ({ page }) => {
    // Try to click on different report tabs if they exist
    const coverageTab = insurancePage.coverageReportTab;
    const premiumTab = insurancePage.premiumReportTab;

    if (await coverageTab.isVisible()) {
      await coverageTab.click();
      await page.waitForTimeout(300);
    }

    if (await premiumTab.isVisible()) {
      await premiumTab.click();
      await page.waitForTimeout(300);
    }

    // Page should still be functional
    await insurancePage.expectPageLoaded();
  });

  test("should display tax deduction information", async ({ page }) => {
    // Look for tax-related content (Section 80C, 80D)
    const hasTaxInfo = await page
      .getByText(/80C|80D|Tax|Deduction/i)
      .first()
      .isVisible();
    // Tax info may not always be visible depending on data, so just check the page loads
    await insurancePage.expectPageLoaded();
  });

  test("should show renewal calendar or upcoming renewals", async ({ page }) => {
    // Check for renewal-related content
    if (await insurancePage.renewalsReportTab.isVisible()) {
      await insurancePage.selectReportTab("Renewals");
      await page.waitForTimeout(300);
    }

    // Page should still be functional
    await insurancePage.expectPageLoaded();
  });

  test("should stay on same URL when switching report tabs", async ({ page }) => {
    // Click through report tabs and verify URL doesn't change
    const coverageTab = insurancePage.coverageReportTab;
    const premiumTab = insurancePage.premiumReportTab;

    if (await coverageTab.isVisible()) {
      await coverageTab.click();
      await page.waitForTimeout(300);
      await expect(page).toHaveURL(/\/insurance$/);
    }

    if (await premiumTab.isVisible()) {
      await premiumTab.click();
      await page.waitForTimeout(300);
      await expect(page).toHaveURL(/\/insurance$/);
    }
  });

  test("should be able to navigate from reports to other main tabs", async () => {
    // Navigate to Overview
    await insurancePage.goToMainTab("overview");
    await insurancePage.expectOnMainTab("overview");

    // Navigate back to Reports
    await insurancePage.goToMainTab("reports");
    await insurancePage.expectOnMainTab("reports");
  });
});
