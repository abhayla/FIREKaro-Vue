import { test, expect } from "@playwright/test";
import { FIREDashboardPage } from "../../pages/fire-goals";
import { fireCalculationData, fireSummary } from "../../fixtures/fire-goals-data";

test.describe("FIRE Dashboard (Overview Tab)", () => {
  let dashboardPage: FIREDashboardPage;

  test.beforeEach(async ({ page }) => {
    dashboardPage = new FIREDashboardPage(page);
    await dashboardPage.navigateToOverview();
  });

  test("should display FIRE dashboard overview", async ({ page }) => {
    await dashboardPage.expectPageLoaded();
    await dashboardPage.expectOverviewTabActive();
  });

  test("should show FIRE number (target corpus)", async ({ page }) => {
    await expect(dashboardPage.fireNumberCard).toBeVisible();
    const fireNumber = await dashboardPage.getFIRENumber();
    expect(fireNumber).toContain("₹");
  });

  test("should show current corpus", async ({ page }) => {
    await expect(dashboardPage.currentCorpusCard).toBeVisible();
    const corpus = await dashboardPage.getCurrentCorpus();
    expect(corpus).toContain("₹");
  });

  test("should show progress percentage", async ({ page }) => {
    await expect(dashboardPage.progressCard).toBeVisible();
    const progress = await dashboardPage.getProgress();
    expect(progress).toMatch(/%|\d/);
  });

  test("should display progress bar", async ({ page }) => {
    await expect(dashboardPage.progressBar).toBeVisible();
  });

  test("should show time to FIRE", async ({ page }) => {
    await expect(dashboardPage.yearsToFIRECard).toBeVisible();
  });

  test("should display FIRE variations (Lean/Fat)", async ({ page }) => {
    // Check for at least one FIRE variation in secondary metrics
    await expect(
      page.getByText(/Lean FIRE|Fat FIRE/i).first()
    ).toBeVisible();
  });

  test("should show Freedom Score card", async ({ page }) => {
    await expect(dashboardPage.freedomScoreCard).toBeVisible();
  });

  test("should show progress chart (Crossover Point)", async ({ page }) => {
    await expect(dashboardPage.progressChart).toBeVisible();
  });

  test("should show milestone bar", async ({ page }) => {
    await expect(dashboardPage.milestoneBar).toBeVisible();
  });

  test("should display 8 metric cards (4 primary + 4 secondary)", async ({ page }) => {
    // Primary metrics: FIRE Number, Current Corpus, Progress, Time to FIRE
    await expect(page.getByText(/FIRE Number/i).first()).toBeVisible();
    await expect(page.getByText(/Current Corpus/i).first()).toBeVisible();
    await expect(page.getByText(/Progress/i).first()).toBeVisible();
    await expect(page.getByText(/Time to FIRE/i).first()).toBeVisible();

    // Secondary metrics: Savings Rate, Monthly Passive, Lean FIRE, Fat FIRE
    await expect(page.getByText(/Savings Rate/i).first()).toBeVisible();
    await expect(page.getByText(/Monthly Passive/i).first()).toBeVisible();
    await expect(page.getByText(/Lean FIRE/i).first()).toBeVisible();
    await expect(page.getByText(/Fat FIRE/i).first()).toBeVisible();
  });

  test("should display Quick Actions section", async ({ page }) => {
    await expect(page.getByText(/Quick Actions/i).first()).toBeVisible();
  });

  test("should display FIRE Tip of the Day", async ({ page }) => {
    await expect(page.getByText(/Tip of the Day|Power of 1%/i).first()).toBeVisible();
  });

  test("should have Export button", async ({ page }) => {
    await expect(dashboardPage.exportButton).toBeVisible();
  });

  test("should open export menu on click", async ({ page }) => {
    await dashboardPage.openExportMenu();
    await expect(dashboardPage.exportPDFOption).toBeVisible();
    await expect(dashboardPage.exportExcelOption).toBeVisible();
  });

  test("should navigate to Planning tab from Quick Actions", async ({ page }) => {
    // Click on one of the quick action items
    const calculatorLink = page.getByRole("listitem").filter({ hasText: /FIRE Calculator/i });
    await calculatorLink.click();

    // Should navigate to Planning tab
    await expect(page).toHaveURL(/\?tab=planning/);
  });
});
