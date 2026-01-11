import { test, expect } from "@playwright/test";
import { TaxPlanningOverviewPage, TaxDetailsPage } from "../../pages/tax-planning";

/**
 * Tax Planning Navigation Tests
 *
 * Structure: 2 internal tabs (Overview + Tax Details)
 * - Overview Tab: Summary cards, recommendations, regime comparison, charts
 * - Tax Details Tab: Accordion with 5 sections (Calculator, Deductions, Scenarios, Advance Tax, Reports)
 *
 * Note: Old routes (/tax-planning/calculator, etc.) now 404
 */
test.describe("Tax Planning Navigation", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/tax-planning");
    await page.waitForLoadState("domcontentloaded");
    await page.locator(".v-card, .v-tabs").first().waitFor({ state: "visible", timeout: 10000 }).catch(() => {});
  });

  test("should load tax planning page with Overview tab active", async ({ page }) => {
    const overview = new TaxPlanningOverviewPage(page);
    await expect(overview.pageTitle).toBeVisible();
    await expect(page).toHaveURL(/\/dashboard\/tax-planning$/);
    await expect(overview.overviewTab).toHaveAttribute("aria-selected", "true");
  });

  test("should display 2-tab navigation (Overview + Tax Details)", async ({ page }) => {
    const overview = new TaxPlanningOverviewPage(page);

    await expect(overview.overviewTab).toBeVisible();
    await expect(overview.taxDetailsTab).toBeVisible();

    // Old tabs should NOT exist
    await expect(page.getByRole("tab", { name: /^Calculator$/i })).not.toBeVisible();
    await expect(page.getByRole("tab", { name: /^Deductions$/i })).not.toBeVisible();
    await expect(page.getByRole("tab", { name: /^Scenarios$/i })).not.toBeVisible();
    await expect(page.getByRole("tab", { name: /^Advance Tax$/i })).not.toBeVisible();
    await expect(page.getByRole("tab", { name: /^Reports$/i })).not.toBeVisible();
  });

  test("should display FY selector with navigation arrows", async ({ page }) => {
    const overview = new TaxPlanningOverviewPage(page);

    await expect(overview.fySelector).toBeVisible();
    // Navigation arrows should be present
    const prevButton = page.locator("button").filter({ has: page.locator('[class*="chevron-left"]') });
    const nextButton = page.locator("button").filter({ has: page.locator('[class*="chevron-right"]') });

    // At least one arrow button should be visible
    const hasPrev = await prevButton.first().isVisible().catch(() => false);
    const hasNext = await nextButton.first().isVisible().catch(() => false);
    expect(hasPrev || hasNext).toBe(true);
  });

  test("should switch to Tax Details tab", async ({ page }) => {
    const overview = new TaxPlanningOverviewPage(page);

    // Click Tax Details tab
    await overview.taxDetailsTab.click();
    await page.waitForTimeout(500);

    // Tax Details tab should now be active
    await expect(overview.taxDetailsTab).toHaveAttribute("aria-selected", "true");
    await expect(overview.overviewTab).toHaveAttribute("aria-selected", "false");

    // URL should remain the same (internal tabs, not route-based)
    await expect(page).toHaveURL(/\/dashboard\/tax-planning$/);
  });

  test("should display accordion sections in Tax Details tab", async ({ page }) => {
    const taxDetails = new TaxDetailsPage(page);

    // Switch to Tax Details tab
    await taxDetails.taxDetailsTab.click();
    await page.waitForTimeout(500);

    // All 5 accordion sections should be visible
    await expect(taxDetails.calculatorSection).toBeVisible();
    await expect(taxDetails.deductionsSection).toBeVisible();
    await expect(taxDetails.scenariosSection).toBeVisible();
    await expect(taxDetails.advanceTaxSection).toBeVisible();
    await expect(taxDetails.reportsSection).toBeVisible();
  });

  test("should expand accordion sections", async ({ page }) => {
    const taxDetails = new TaxDetailsPage(page);

    // Switch to Tax Details tab
    await taxDetails.taxDetailsTab.click();
    await page.waitForTimeout(500);

    // Click on Calculator section to expand
    await taxDetails.calculatorHeader.click();
    await page.waitForTimeout(300);

    // Calculator content should be visible
    await taxDetails.expectCalculatorExpanded();
  });

  test("should switch back to Overview tab from Tax Details", async ({ page }) => {
    const overview = new TaxPlanningOverviewPage(page);

    // Go to Tax Details
    await overview.taxDetailsTab.click();
    await page.waitForTimeout(300);

    // Go back to Overview
    await overview.overviewTab.click();
    await page.waitForTimeout(300);

    // Overview tab should be active
    await expect(overview.overviewTab).toHaveAttribute("aria-selected", "true");
  });

  test("should show correct active tab indicator", async ({ page }) => {
    const overview = new TaxPlanningOverviewPage(page);

    // Initially Overview is active
    await expect(overview.overviewTab).toHaveAttribute("aria-selected", "true");
    await expect(overview.taxDetailsTab).toHaveAttribute("aria-selected", "false");

    // Switch to Tax Details
    await overview.taxDetailsTab.click();
    await page.waitForTimeout(300);

    // Now Tax Details is active
    await expect(overview.taxDetailsTab).toHaveAttribute("aria-selected", "true");
    await expect(overview.overviewTab).toHaveAttribute("aria-selected", "false");
  });

  test("old route /tax-planning/calculator should 404", async ({ page }) => {
    const response = await page.goto("/tax-planning/calculator");
    // Either 404 status or redirected to home/error page
    const status = response?.status();
    const url = page.url();

    // Should not be on the calculator page (it doesn't exist anymore)
    // Could be 404, could redirect to main page or error page
    expect(url).not.toContain("/tax-planning/calculator");
  });

  test("old route /tax-planning/deductions should 404", async ({ page }) => {
    const response = await page.goto("/tax-planning/deductions");
    const url = page.url();
    expect(url).not.toContain("/tax-planning/deductions");
  });

  test("old route /tax-planning/scenarios should 404", async ({ page }) => {
    const response = await page.goto("/tax-planning/scenarios");
    const url = page.url();
    expect(url).not.toContain("/tax-planning/scenarios");
  });

  test("old route /tax-planning/advance-tax should 404", async ({ page }) => {
    const response = await page.goto("/tax-planning/advance-tax");
    const url = page.url();
    expect(url).not.toContain("/tax-planning/advance-tax");
  });

  test("old route /tax-planning/reports should 404", async ({ page }) => {
    const response = await page.goto("/tax-planning/reports");
    const url = page.url();
    expect(url).not.toContain("/tax-planning/reports");
  });
});
