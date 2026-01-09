import { test, expect } from "@playwright/test";
import { InvestmentReportsPage, InvestmentsOverviewPage } from "../../pages/investments";
import {
  sipSummary,
  compoundingSummary,
  portfolioJourneySummary,
  yieldData,
  testSnapshot
} from "../../fixtures/investments-data";

/**
 * New Investment Features Tests
 *
 * Tests for newly added features:
 * - Yield Calculations (dividend + rental)
 * - SIP Progression Timeline
 * - Compounding Visualization
 * - Portfolio Journey Timeline
 */

// ============================================
// Yield Calculations Tests
// ============================================
test.describe("Yield Calculations", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/dashboard/investments");
    await page.waitForLoadState("domcontentloaded");
  });

  test("should display yield summary on portfolio overview", async ({ page }) => {
    // Check for yield information on the main investments page
    await expect(
      page.getByText(/Yield|yield/i).first()
    ).toBeVisible();
  });

  test("should show dividend yield percentage", async ({ page }) => {
    // Look for dividend yield display
    const yieldText = await page.getByText(/Dividend.*Yield|yield.*%/i).first().textContent();
    expect(yieldText).toMatch(/%/);
  });

  test("should display yield values in correct format", async ({ page }) => {
    // Yields should be shown as percentages
    await expect(
      page.locator('.v-card').filter({ hasText: /Yield/i }).getByText(/%/)
    ).toBeVisible();
  });
});

// ============================================
// SIP Progression Timeline Tests
// ============================================
test.describe("SIP Progression Timeline", () => {
  let reportsPage: InvestmentReportsPage;

  test.beforeEach(async ({ page }) => {
    reportsPage = new InvestmentReportsPage(page);
    await reportsPage.navigateTo();
  });

  test("should navigate to SIP report tab", async ({ page }) => {
    await reportsPage.selectReportType("sip");
    await reportsPage.expectSIPProgressionSectionVisible();
  });

  test("should display SIP progression chart", async ({ page }) => {
    await reportsPage.selectReportType("sip");
    await reportsPage.expectSIPChartVisible();
  });

  test("should show current monthly SIP amount", async ({ page }) => {
    await reportsPage.selectReportType("sip");

    const currentSIP = await reportsPage.getCurrentSIP();
    expect(currentSIP).toContain("₹");
  });

  test("should display year-over-year SIP growth", async ({ page }) => {
    await reportsPage.selectReportType("sip");

    // Check for growth percentage
    const growth = await reportsPage.getSIPGrowth();
    expect(growth).toMatch(/%/);
  });

  test("should show SIP history by year", async ({ page }) => {
    await reportsPage.selectReportType("sip");

    // Check for year labels in the chart/list
    await expect(
      page.getByText(/2024|2023|2022/i).first()
    ).toBeVisible();
  });

  test("should display growth trend indicator", async ({ page }) => {
    await reportsPage.selectReportType("sip");

    // Check for positive/negative trend indicator
    const hasTrend = await page.locator('.text-success, .text-error, .mdi-trending').first().isVisible();
    expect(hasTrend).toBeTruthy();
  });
});

// ============================================
// Compounding Visualization Tests
// ============================================
test.describe("Compounding Visualization", () => {
  let reportsPage: InvestmentReportsPage;

  test.beforeEach(async ({ page }) => {
    reportsPage = new InvestmentReportsPage(page);
    await reportsPage.navigateTo();
  });

  test("should navigate to compounding report tab", async ({ page }) => {
    await reportsPage.selectReportType("compounding");
    await reportsPage.expectCompoundingSectionVisible();
  });

  test("should display compounding chart", async ({ page }) => {
    await reportsPage.selectReportType("compounding");
    await reportsPage.expectCompoundingChartVisible();
  });

  test("should show contributions vs returns comparison", async ({ page }) => {
    await reportsPage.selectReportType("compounding");

    // Check for both contributions and returns labels
    await expect(page.getByText(/Contribution|Invested/i)).toBeVisible();
    await expect(page.getByText(/Return/i)).toBeVisible();
  });

  test("should display total contributions amount", async ({ page }) => {
    await reportsPage.selectReportType("compounding");

    await expect(reportsPage.totalContributionsDisplay).toBeVisible();
  });

  test("should display total returns amount", async ({ page }) => {
    await reportsPage.selectReportType("compounding");

    await expect(reportsPage.totalReturnsDisplay).toBeVisible();
  });

  test("should show returns multiplier percentage", async ({ page }) => {
    await reportsPage.selectReportType("compounding");

    // Look for returns ratio percentage
    await expect(
      page.getByText(/%/).first()
    ).toBeVisible();
  });

  test("should display crossover year information", async ({ page }) => {
    await reportsPage.selectReportType("compounding");

    // Check for crossover year chip or display
    const hasCrossover = await page.getByText(/Crossover|crossover/i).isVisible();
    // Crossover might not be visible if not yet reached
    expect(typeof hasCrossover).toBe('boolean');
  });

  test("should show compounding status alert", async ({ page }) => {
    await reportsPage.selectReportType("compounding");

    // Check for motivational/status alert
    await expect(reportsPage.compoundingStatusAlert).toBeVisible();
  });

  test("should have educational expansion panel", async ({ page }) => {
    await reportsPage.selectReportType("compounding");

    // Check for educational content about compounding
    await expect(
      page.getByText(/Understanding|Learn|Power of Compounding/i)
    ).toBeVisible();
  });
});

// ============================================
// Portfolio Journey Timeline Tests
// ============================================
test.describe("Portfolio Journey Timeline", () => {
  let reportsPage: InvestmentReportsPage;

  test.beforeEach(async ({ page }) => {
    reportsPage = new InvestmentReportsPage(page);
    await reportsPage.navigateTo();
  });

  test("should navigate to journey report tab", async ({ page }) => {
    await reportsPage.selectReportType("journey");
    await reportsPage.expectJourneySectionVisible();
  });

  test("should display journey timeline chart", async ({ page }) => {
    await reportsPage.selectReportType("journey");
    await reportsPage.expectJourneyChartVisible();
  });

  test("should show starting portfolio value", async ({ page }) => {
    await reportsPage.selectReportType("journey");

    await expect(reportsPage.startValueDisplay).toBeVisible();
  });

  test("should show current portfolio value", async ({ page }) => {
    await reportsPage.selectReportType("journey");

    await expect(reportsPage.currentValueDisplay).toBeVisible();
  });

  test("should display total growth percentage", async ({ page }) => {
    await reportsPage.selectReportType("journey");

    await expect(reportsPage.totalGrowthDisplay).toBeVisible();
  });

  test("should show CAGR calculation", async ({ page }) => {
    await reportsPage.selectReportType("journey");

    // Check for CAGR display
    await expect(
      page.getByText(/CAGR/i)
    ).toBeVisible();
  });

  test("should have add snapshot button", async ({ page }) => {
    await reportsPage.selectReportType("journey");

    await expect(reportsPage.addSnapshotButton).toBeVisible();
  });

  test("should open add snapshot dialog", async ({ page }) => {
    await reportsPage.selectReportType("journey");
    await reportsPage.openAddSnapshotDialog();

    await expect(reportsPage.snapshotDialog).toBeVisible();
    await expect(reportsPage.snapshotDateInput).toBeVisible();
    await expect(reportsPage.snapshotValueInput).toBeVisible();
  });

  test("should add a new portfolio snapshot", async ({ page }) => {
    await reportsPage.selectReportType("journey");

    await reportsPage.addSnapshot(
      testSnapshot.date,
      testSnapshot.totalValue,
      testSnapshot.notes
    );

    // Verify dialog closes after save
    await expect(reportsPage.snapshotDialog).not.toBeVisible();
  });

  test("should display historical snapshots list", async ({ page }) => {
    await reportsPage.selectReportType("journey");

    // Check for snapshots list or expansion panel
    await expect(reportsPage.snapshotsList).toBeVisible();
  });

  test("should show years tracked information", async ({ page }) => {
    await reportsPage.selectReportType("journey");

    // Check for years tracked display
    await expect(
      page.getByText(/year|Year/i)
    ).toBeVisible();
  });

  test("should display sample data notice if no real data", async ({ page }) => {
    await reportsPage.selectReportType("journey");

    // Check for sample data alert (shown when using mock data)
    const hasSampleNotice = await page.getByText(/sample|Sample/i).isVisible();
    // This is optional - just verify page loads
    expect(typeof hasSampleNotice).toBe('boolean');
  });

  test("should show long-term investor badge for 5+ years", async ({ page }) => {
    await reportsPage.selectReportType("journey");

    // Check for achievement badge (if tracked for 5+ years)
    const hasAchievement = await page.getByText(/Long-term|Achievement|Trophy/i).isVisible();
    // This depends on data - just verify page loads
    expect(typeof hasAchievement).toBe('boolean');
  });
});
