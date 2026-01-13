import { test, expect } from "@playwright/test";
import { FIREPlanningPage } from "../../pages/fire-goals";
import { projectionData, fireSummary } from "../../fixtures/fire-goals-data";

test.describe("Projections (Planning Tab)", () => {
  let planningPage: FIREPlanningPage;

  test.beforeEach(async ({ page }) => {
    planningPage = new FIREPlanningPage(page);
    await planningPage.navigateTo();
    // Expand projections accordion
    await planningPage.expandProjectionsSection();
    await page.waitForTimeout(300);
  });

  test("should display projections accordion", async ({ page }) => {
    await expect(planningPage.projectionsAccordion).toBeVisible();
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
    await expect(planningPage.projectionChart).toBeVisible();
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
