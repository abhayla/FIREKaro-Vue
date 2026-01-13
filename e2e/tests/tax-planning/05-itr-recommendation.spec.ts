import { test, expect } from "@playwright/test";
import { TaxPlanningOverviewPage } from "../../pages/tax-planning";
import { itrRecommendation } from "../../fixtures/tax-planning-data";

test.describe("ITR Recommendation", () => {
  let overviewPage: TaxPlanningOverviewPage;

  test.beforeEach(async ({ page }) => {
    overviewPage = new TaxPlanningOverviewPage(page);
    await overviewPage.navigateTo();
  });

  test("should display ITR recommendation card", async ({ page }) => {
    await expect(overviewPage.itrFormCard).toBeVisible();
  });

  test("should show appropriate ITR form recommendation", async ({ page }) => {
    // Based on income types, should recommend appropriate ITR
    // For presumptive business income, ITR-4 is typically recommended
    const itrCardText = await overviewPage.itrFormCard.textContent();
    expect(itrCardText).toMatch(/ITR-\d|ITR \d/i);
  });

  test("should explain ITR recommendation reason", async ({ page }) => {
    const itrCard = overviewPage.itrFormCard;
    await expect(itrCard).toBeVisible();

    // Card should contain explanation
    const text = await itrCard.textContent();
    expect(text?.length).toBeGreaterThan(20);
  });
});
