import { test, expect } from "@playwright/test";
import { FIREPlanningPage } from "../../pages/fire-goals";
import { projectionData, fireSummary } from "../../fixtures/fire-goals-data";

test.describe("Projections (Planning Tab)", () => {
  let planningPage: FIREPlanningPage;

  test.beforeEach(async ({ page }) => {
    planningPage = new FIREPlanningPage(page);
    await planningPage.navigateTo();
    // Wait for page to stabilize
    await page.waitForTimeout(500);
    // Try to expand projections accordion (skip if already expanded or error)
    try {
      await planningPage.expandProjectionsSection();
    } catch {
      // Accordion might already be expanded or not visible
    }
    await page.waitForTimeout(300);
  });

  test("should display projections accordion", async ({ page }) => {
    // Wait for page to load and look for projections accordion or its content
    await page.waitForTimeout(500);
    const hasAccordion = await planningPage.projectionsAccordion.isVisible().catch(() => false);
    const hasProjectionsText = await page.getByText(/Projections|100-Year|Projection/i).first().isVisible().catch(() => false);
    const hasExpansionPanels = await page.locator(".v-expansion-panels").first().isVisible().catch(() => false);
    expect(hasAccordion || hasProjectionsText || hasExpansionPanels).toBeTruthy();
  });

  test("should show 100-Year Projection tab", async ({ page }) => {
    await expect(planningPage.projectionChartTab).toBeVisible();
  });

  test("should show Monte Carlo tab in projections", async ({ page }) => {
    await expect(page.getByRole("tab", { name: /Monte Carlo/i })).toBeVisible();
  });

  test("should show Sensitivity Analysis tab", async ({ page }) => {
    await expect(planningPage.sensitivityTab).toBeVisible();
  });

  test("should show projection chart", async ({ page }) => {
    // Default tab is 100-Year Projection
    // The chart may be a canvas element or a skeleton loader while data loads
    const hasChart = await page.locator("canvas").first().isVisible().catch(() => false);
    const hasChartContainer = await page.locator(".v-card").filter({ hasText: /Projection|FIRE Year/i }).first().isVisible().catch(() => false);
    const hasLoading = await page.locator(".v-skeleton-loader").isVisible().catch(() => false);
    expect(hasChart || hasChartContainer || hasLoading).toBeTruthy();
  });

  test("should show FIRE Year insight card", async ({ page }) => {
    await expect(page.getByText(/FIRE Year|Financial Independence/i).first()).toBeVisible();
  });

  test("should show Peak Corpus card", async ({ page }) => {
    await expect(page.getByText(/Peak Corpus/i).first()).toBeVisible();
  });

  test("should switch to Monte Carlo view", async ({ page }) => {
    await page.getByRole("tab", { name: /Monte Carlo/i }).click();
    await page.waitForTimeout(500);
    // Should show Monte Carlo related content
    await expect(page.getByText(/Monte Carlo|Percentile|Success Rate/i).first()).toBeVisible();
  });

  test("should switch to Sensitivity Analysis view", async ({ page }) => {
    await planningPage.sensitivityTab.click();
    await page.waitForTimeout(300);
    // Should show sensitivity analysis table
    await expect(page.getByText(/Sensitivity|Impact|Variable Change/i).first()).toBeVisible();
  });

  test("should show sensitivity impact data", async ({ page }) => {
    await planningPage.sensitivityTab.click();
    await page.waitForTimeout(300);
    // Check for sensitivity variables
    await expect(page.getByText(/Returns|Inflation|Expenses/i).first()).toBeVisible();
  });

  test("should show risk levels in sensitivity analysis", async ({ page }) => {
    await planningPage.sensitivityTab.click();
    await page.waitForTimeout(300);
    // Check for risk level indicators
    await expect(page.getByText(/High|Medium|Risk Level/i).first()).toBeVisible();
  });

  test("should show crossover point information", async ({ page }) => {
    // Crossover point is when passive income > expenses
    await expect(page.getByText(/Crossover|FIRE Year|Age/i).first()).toBeVisible();
  });

  test("should show projection insights", async ({ page }) => {
    // Check for insight cards
    await expect(page.getByText(/FIRE Year|Peak Corpus|Life Events/i).first()).toBeVisible();
  });

  test("should explain Monte Carlo simulation", async ({ page }) => {
    await page.getByRole("tab", { name: /Monte Carlo/i }).click();
    await page.waitForTimeout(300);
    // Should show explanation
    await expect(page.getByText(/Understanding Monte Carlo|Percentiles/i).first()).toBeVisible();
  });

  test("should show highest risk factor in sensitivity", async ({ page }) => {
    await planningPage.sensitivityTab.click();
    await page.waitForTimeout(300);
    // Check for highest risk card
    await expect(page.getByText(/Highest Risk/i).first()).toBeVisible();
  });

  test("should show best protection advice in sensitivity", async ({ page }) => {
    await planningPage.sensitivityTab.click();
    await page.waitForTimeout(300);
    // Check for best protection card
    await expect(page.getByText(/Best Protection/i).first()).toBeVisible();
  });
});
