import { test, expect } from "@playwright/test";
import { FIREDashboardPage } from "../../pages/fire-goals";
import { fireCalculationData, fireSummary } from "../../fixtures/fire-goals-data";

test.describe("FIRE Dashboard", () => {
  let dashboardPage: FIREDashboardPage;

  test.beforeEach(async ({ page }) => {
    dashboardPage = new FIREDashboardPage(page);
    await dashboardPage.navigateTo();
  });

  test("should display FIRE dashboard", async ({ page }) => {
    await dashboardPage.expectPageLoaded();
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

  test("should show years to FIRE", async ({ page }) => {
    await expect(dashboardPage.yearsToFIRECard).toBeVisible();
  });

  test("should display FIRE variations (Lean/Fat/Coast)", async ({ page }) => {
    // Check for at least one FIRE variation
    await expect(
      page.getByText(/Lean FIRE|Fat FIRE|Coast FIRE/i).first()
    ).toBeVisible();
  });

  test("should show progress chart", async ({ page }) => {
    await expect(dashboardPage.progressChart).toBeVisible();
  });
});
