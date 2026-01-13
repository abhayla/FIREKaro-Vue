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
  // Allow retries for flaky navigation tests
  test.describe.configure({ retries: 2 });

  test.beforeEach(async ({ page }) => {
    await page.goto("/tax-planning", { timeout: 45000 });
    await page.waitForLoadState("domcontentloaded");
    await page.locator(".v-card, .v-tabs").first().waitFor({ state: "visible", timeout: 15000 }).catch(() => {});
  });

  test("should load tax planning page with Overview tab active", async ({ page }) => {
    const overview = new TaxPlanningOverviewPage(page);
    await expect(overview.pageTitle).toBeVisible();
    await expect(page).toHaveURL(/\/tax-planning$/);
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
    await expect(page).toHaveURL(/\/tax-planning$/);
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

    // Calculator section should already be expanded by default (initialSection: "calculator")
    await taxDetails.expectCalculatorExpanded();

    // Expand Deductions section (should start collapsed)
    await taxDetails.deductionsHeader.click();
    await page.waitForTimeout(300);
    await taxDetails.expectDeductionsExpanded();
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

    // Wait for tabs to be ready
    await page.waitForTimeout(500);

    // Initially Overview is active
    await expect(overview.overviewTab).toHaveAttribute("aria-selected", "true");

    // Switch to Tax Details
    await overview.taxDetailsTab.click();
    await page.waitForTimeout(500);

    // Now Tax Details is active
    await expect(overview.taxDetailsTab).toHaveAttribute("aria-selected", "true");
  });

  test("old route /tax-planning/calculator redirects to main page", async ({ page }) => {
    await page.goto("/tax-planning/calculator", { timeout: 45000 });
    await page.waitForURL(/\/tax-planning$/, { timeout: 15000 });
    await expect(page).toHaveURL(/\/tax-planning$/);
  });

  test("old route /tax-planning/deductions redirects to main page", async ({ page }) => {
    await page.goto("/tax-planning/deductions", { timeout: 45000 });
    await page.waitForURL(/\/tax-planning$/, { timeout: 15000 });
    await expect(page).toHaveURL(/\/tax-planning$/);
  });

  test("old route /tax-planning/scenarios redirects to main page", async ({ page }) => {
    await page.goto("/tax-planning/scenarios", { timeout: 45000 });
    await page.waitForURL(/\/tax-planning$/, { timeout: 15000 });
    await expect(page).toHaveURL(/\/tax-planning$/);
  });

  test("old route /tax-planning/advance-tax redirects to main page", async ({ page }) => {
    await page.goto("/tax-planning/advance-tax", { timeout: 45000 });
    await page.waitForURL(/\/tax-planning$/, { timeout: 15000 });
    await expect(page).toHaveURL(/\/tax-planning$/);
  });

  test("old route /tax-planning/reports redirects to main page", async ({ page }) => {
    await page.goto("/tax-planning/reports", { timeout: 45000 });
    await page.waitForURL(/\/tax-planning$/, { timeout: 15000 });
    await expect(page).toHaveURL(/\/tax-planning$/);
  });
});
