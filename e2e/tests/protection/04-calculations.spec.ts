import { test, expect } from "@playwright/test";
import { ProtectionOverviewPage } from "../../pages/protection";
import { coverageSummary, coverageNeedCalculation } from "../../fixtures/protection-data";

test.describe("Protection Calculations", () => {
  test("should show total coverage", async ({ page }) => {
    const overview = new ProtectionOverviewPage(page);
    await overview.navigateTo();

    const totalCoverage = await overview.getTotalCoverage();
    expect(totalCoverage).toContain("₹");
  });

  test("should show annual premium", async ({ page }) => {
    const overview = new ProtectionOverviewPage(page);
    await overview.navigateTo();

    const annualPremium = await overview.getAnnualPremium();
    expect(annualPremium).toContain("₹");
  });
});
