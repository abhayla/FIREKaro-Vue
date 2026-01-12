import { test, expect } from "@playwright/test";
import { SalaryOverviewPage } from "../../pages/salary";

/**
 * Tests for Salary Overview Tab - Charts and Visual Components
 * Tests coverage for: Monthly Salary Trend Chart, YoY Comparison,
 * Employer Breakdown, Deductions Breakdown, Empty State
 */

test.describe("Salary Overview - Charts and Visual Components", () => {
  let overviewPage: SalaryOverviewPage;

  test.beforeEach(async ({ page }) => {
    overviewPage = new SalaryOverviewPage(page);
    await overviewPage.navigateTo();
  });

  test("should display Monthly Salary Trend section", async ({ page }) => {
    // The monthly salary trend card should be visible
    await expect(overviewPage.monthlySalaryTrendCard).toBeVisible();
  });

  test("should display SalaryChart component in Monthly Salary Trend", async ({ page }) => {
    // Check that chart section contains the SalaryChart component
    const trendCard = overviewPage.monthlySalaryTrendCard;
    // SalaryChart component has "Salary Trend" title or chart-bars
    const hasSalaryTrend = await trendCard.getByText("Salary Trend").isVisible().catch(() => false);
    const hasChartBars = await trendCard.locator(".chart-bars, .bar-container").first().isVisible().catch(() => false);
    const hasNoDataAlert = await trendCard.getByText(/No salary data/i).isVisible().catch(() => false);
    expect(hasSalaryTrend || hasChartBars || hasNoDataAlert).toBeTruthy();
  });

  test("should display chart toggle buttons (Gross/Net/Both)", async ({ page }) => {
    const trendCard = overviewPage.monthlySalaryTrendCard;

    // There are two v-btn-toggle elements - one in the card title, one in SalaryChart
    // Both should have Gross/Net/Both buttons
    const btnToggles = trendCard.locator(".v-btn-toggle");
    const toggleCount = await btnToggles.count();
    expect(toggleCount).toBeGreaterThanOrEqual(1);

    // Check for button text content anywhere in the trend card
    await expect(trendCard.getByText("Gross").first()).toBeVisible();
    await expect(trendCard.getByText("Net").first()).toBeVisible();
    await expect(trendCard.getByText("Both").first()).toBeVisible();
  });

  test("should have clickable toggle buttons", async ({ page }) => {
    const trendCard = overviewPage.monthlySalaryTrendCard;

    // Find the first v-btn-toggle (in the card title)
    const btnToggle = trendCard.locator(".v-btn-toggle").first();

    // Click each button in the toggle group
    const grossBtn = btnToggle.locator(".v-btn").filter({ hasText: "Gross" });
    const netBtn = btnToggle.locator(".v-btn").filter({ hasText: "Net" });
    const bothBtn = btnToggle.locator(".v-btn").filter({ hasText: "Both" });

    await grossBtn.click();
    await page.waitForTimeout(300);

    await netBtn.click();
    await page.waitForTimeout(300);

    await bothBtn.click();
    await page.waitForTimeout(300);

    // Buttons should still be visible after clicking
    await expect(btnToggle).toBeVisible();
  });

  test("should display Year-on-Year Comparison card", async ({ page }) => {
    await expect(overviewPage.yoyComparisonCard).toBeVisible();
  });

  test("should show FY comparison text in YoY card", async ({ page }) => {
    const yoyCard = overviewPage.yoyComparisonCard;

    // Should show comparison between current and previous FY
    await expect(yoyCard.getByText(/FY.*vs.*FY/i)).toBeVisible();
  });

  test("should show Gross and Net comparison values in YoY card", async ({ page }) => {
    const yoyCard = overviewPage.yoyComparisonCard;

    // Should show Gross label
    await expect(yoyCard.getByText(/Gross:/i)).toBeVisible();

    // Should show Net label
    await expect(yoyCard.getByText(/Net:/i)).toBeVisible();
  });

  test("should show percentage change indicators in YoY card", async ({ page }) => {
    const yoyCard = overviewPage.yoyComparisonCard;

    // Should show percentage values in format like "(+0.0%)" or "(-3.1%)"
    // The percentage text contains the pattern: (sign + number + %)
    const hasPercentage =
      (await yoyCard.getByText(/\([+-]?\d+\.\d+%\)/).first().isVisible().catch(() => false)) ||
      (await yoyCard.getByText(/No comparison data/i).isVisible().catch(() => false));
    expect(hasPercentage).toBeTruthy();
  });

  test("should display Employer Breakdown card", async ({ page }) => {
    await expect(overviewPage.employerBreakdownCard).toBeVisible();
  });

  test("should show employer names or empty message in Employer Breakdown", async ({ page }) => {
    const employerCard = overviewPage.employerBreakdownCard;

    // Scroll the card into view first
    await employerCard.scrollIntoViewIfNeeded();
    await page.waitForTimeout(300);

    // Should have either employer entries (progress bars or text) or "No employers added" message
    const hasProgressBar = await employerCard.locator(".v-progress-linear").first().isVisible().catch(() => false);
    const hasNoEmployersMsg = await employerCard.getByText(/No employers added/i).isVisible().catch(() => false);
    const hasEmployerText = await employerCard.locator(".text-truncate").first().isVisible().catch(() => false);

    expect(hasProgressBar || hasNoEmployersMsg || hasEmployerText).toBeTruthy();
  });

  test("should show employer contribution amounts in Employer Breakdown", async ({ page }) => {
    const employerCard = overviewPage.employerBreakdownCard;

    // Should show amounts in lakhs format like "5.0L" or "0L" or "No employers"
    const hasLakhsFormat = await employerCard.getByText(/[\d.]+L/).first().isVisible().catch(() => false);
    const hasNoEmployers = await employerCard.getByText(/No employers added/i).isVisible().catch(() => false);

    expect(hasLakhsFormat || hasNoEmployers).toBeTruthy();
  });

  test("should show employer contribution percentages in Employer Breakdown", async ({ page }) => {
    const employerCard = overviewPage.employerBreakdownCard;

    // Scroll the card into view first
    await employerCard.scrollIntoViewIfNeeded();
    await page.waitForTimeout(300);

    // Should show percentage values like "(100%)" or no employers message
    const hasPercentage = await employerCard.getByText(/\(\d+%\)/).first().isVisible().catch(() => false);
    const hasNoEmployers = await employerCard.getByText(/No employers added/i).isVisible().catch(() => false);

    expect(hasPercentage || hasNoEmployers).toBeTruthy();
  });

  test("should display Deductions Breakdown card", async ({ page }) => {
    await expect(overviewPage.deductionsBreakdownCard).toBeVisible();
  });

  test("should show deduction categories in Deductions Breakdown", async ({ page }) => {
    const deductionsCard = overviewPage.deductionsBreakdownCard;

    // Should show common deduction types or no data message
    const hasTDS = await deductionsCard.getByText(/TDS|Income Tax/i).isVisible().catch(() => false);
    const hasEPF = await deductionsCard.getByText(/EPF|Provident Fund/i).isVisible().catch(() => false);
    const hasVPF = await deductionsCard.getByText(/VPF/i).isVisible().catch(() => false);
    const hasNoData = await deductionsCard.getByText(/No deductions data/i).isVisible().catch(() => false);

    // At least one should be visible
    expect(hasTDS || hasEPF || hasVPF || hasNoData).toBeTruthy();
  });

  test("should show progress bars or empty state in Deductions Breakdown", async ({ page }) => {
    const deductionsCard = overviewPage.deductionsBreakdownCard;

    // Scroll the card into view first
    await deductionsCard.scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);

    // Should have progress bar elements or no data message
    // v-progress-linear renders as a div with role=progressbar
    const hasProgressBar = await deductionsCard.locator("[role='progressbar'], .v-progress-linear").first().isVisible().catch(() => false);
    const hasNoData = await deductionsCard.getByText(/No deductions data/i).isVisible().catch(() => false);
    // Also check for deduction names (TDS, EPF, PT) which would indicate data exists
    const hasDeductionData = await deductionsCard.getByText(/TDS|EPF|PT/i).first().isVisible().catch(() => false);

    expect(hasProgressBar || hasNoData || hasDeductionData).toBeTruthy();
  });

  test("should show deduction amounts and percentages or empty state", async ({ page }) => {
    const deductionsCard = overviewPage.deductionsBreakdownCard;

    // Scroll the card into view first
    await deductionsCard.scrollIntoViewIfNeeded();
    await page.waitForTimeout(300);

    // Should show amounts in lakhs format (like "0.31L" or "1.5L") or no data message
    const hasLakhsFormat = await deductionsCard.getByText(/\d+\.\d+L/).first().isVisible().catch(() => false);
    const hasPercentage = await deductionsCard.getByText(/\d+%/).first().isVisible().catch(() => false);
    const hasNoData = await deductionsCard.getByText(/No deductions data/i).isVisible().catch(() => false);
    const hasCurrencyValue = await deductionsCard.locator(".text-currency").first().isVisible().catch(() => false);

    expect((hasLakhsFormat || hasCurrencyValue) || hasNoData).toBeTruthy();
  });
});

test.describe("Salary Overview - Empty State", () => {
  let overviewPage: SalaryOverviewPage;

  test.beforeEach(async ({ page }) => {
    overviewPage = new SalaryOverviewPage(page);
    await overviewPage.navigateTo();
  });

  test("should handle FY selection for empty data", async ({ page }) => {
    // Try to navigate to an old FY that likely has no data
    const fySelector = page.locator(".v-select").first();
    await fySelector.click();
    await page.waitForTimeout(300);

    // Look for any FY option
    const options = page.getByRole("option");
    const optionsCount = await options.count();

    if (optionsCount > 0) {
      // Select the last option (oldest FY)
      await options.last().click();
      await page.waitForTimeout(1000);

      // Page should still load without errors
      await expect(overviewPage.monthlySalaryTrendCard).toBeVisible();
    }
  });

  test("should show empty state or data for FY", async ({ page }) => {
    // Navigate to old FY with likely no data
    const fySelector = page.locator(".v-select").first();
    await fySelector.click();
    await page.waitForTimeout(300);

    const options = page.getByRole("option");
    const optionsCount = await options.count();

    if (optionsCount > 1) {
      // Select the last option (oldest FY available)
      await options.last().click();
      await page.waitForTimeout(1000);

      // Either empty state card or regular cards should be visible
      const hasEmptyState = await page.getByText(/No salary data/i).isVisible().catch(() => false);
      const hasDataCards = await overviewPage.monthlySalaryTrendCard.isVisible().catch(() => false);

      expect(hasEmptyState || hasDataCards).toBeTruthy();
    }
  });
});

test.describe("Salary Overview - Summary Cards Stats", () => {
  let overviewPage: SalaryOverviewPage;

  test.beforeEach(async ({ page }) => {
    overviewPage = new SalaryOverviewPage(page);
    await overviewPage.navigateTo();
  });

  test("should display FY Gross summary card with Avg subtitle", async ({ page }) => {
    // FY Gross card should show "Avg:" in subtitle
    const fyGrossCard = overviewPage.fyGrossCard;
    await expect(fyGrossCard).toBeVisible();

    // Check for Avg subtitle pattern
    const hasAvg = await fyGrossCard.getByText(/Avg:/i).isVisible().catch(() => false);
    expect(hasAvg).toBeTruthy();
  });

  test("should display FY Net summary card with Avg subtitle", async ({ page }) => {
    // FY Net card should show "Avg:" in subtitle
    const fyNetCard = overviewPage.fyNetCard;
    await expect(fyNetCard).toBeVisible();

    // Check for Avg subtitle pattern
    const hasAvg = await fyNetCard.getByText(/Avg:/i).isVisible().catch(() => false);
    expect(hasAvg).toBeTruthy();
  });

  test("should display EPF + VPF card with 80C subtitle", async ({ page }) => {
    // EPF + VPF card should show "(80C)" in subtitle
    const epfCard = overviewPage.epfVpfCard;
    await expect(epfCard).toBeVisible();

    // Check for 80C mention
    const has80C = await epfCard.getByText(/80C/i).isVisible().catch(() => false);
    expect(has80C).toBeTruthy();
  });
});
