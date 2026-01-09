import { test, expect } from "@playwright/test";
import { TaxPlanningOverviewPage } from "../../pages/tax-planning";

test.describe("Tax Planning Reports", () => {
  let overviewPage: TaxPlanningOverviewPage;

  test.beforeEach(async ({ page }) => {
    overviewPage = new TaxPlanningOverviewPage(page);
    await overviewPage.navigateTo();
  });

  test("should display tax summary cards", async ({ page }) => {
    await overviewPage.expectSummaryCardsVisible();
  });

  test("should show total income", async ({ page }) => {
    const totalIncome = await overviewPage.getTotalIncome();
    expect(totalIncome).toMatch(/₹|Rs\.?|\d/);
  });

  test("should show estimated tax", async ({ page }) => {
    const estimatedTax = await overviewPage.getEstimatedTax();
    expect(estimatedTax).toMatch(/₹|Rs\.?|\d/);
  });
});
