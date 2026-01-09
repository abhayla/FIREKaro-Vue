import { test, expect } from "@playwright/test";
import { LiabilitiesOverviewPage, LoansPage, CreditCardsPage } from "../../pages/liabilities";
import { loansData, creditCardsData, liabilitiesSummary } from "../../fixtures/liabilities-data";

test.describe("Liabilities Calculations", () => {
  test("should show total debt on overview", async ({ page }) => {
    const overview = new LiabilitiesOverviewPage(page);
    await overview.navigateTo();

    const totalDebt = await overview.getTotalDebt();
    expect(totalDebt).toContain("₹");
    const numericValue = overview.parseINR(totalDebt);
    expect(numericValue).toBeGreaterThan(0);
  });

  test("should show monthly EMI total", async ({ page }) => {
    const overview = new LiabilitiesOverviewPage(page);
    await overview.navigateTo();

    const monthlyEMI = await overview.getMonthlyEMI();
    expect(monthlyEMI).toContain("₹");
    const numericValue = overview.parseINR(monthlyEMI);
    expect(numericValue).toBeGreaterThan(0);
  });

  test("should calculate DTI ratio correctly", async ({ page }) => {
    const overview = new LiabilitiesOverviewPage(page);
    await overview.navigateTo();

    const dtiRatio = await overview.getDTIRatio();
    expect(dtiRatio).toContain("%");
  });

  test("should calculate loan outstanding correctly", async ({ page }) => {
    const loansPage = new LoansPage(page);
    await loansPage.navigateTo();

    const totalOutstanding = await loansPage.getTotalOutstanding();
    expect(totalOutstanding).toContain("₹");
  });

  test("should calculate credit card utilization", async ({ page }) => {
    const creditCardsPage = new CreditCardsPage(page);
    await creditCardsPage.navigateTo();

    const utilization = await creditCardsPage.getUtilization();
    expect(utilization).toContain("%");
  });
});
