import { test, expect } from "@playwright/test";
import { EpfPpfPage } from "../../pages/investments";
import { epfPpfData, getRetirementProjection } from "../../fixtures/investments-data";

test.describe("EPF & PPF Accounts", () => {
  let epfPpfPage: EpfPpfPage;

  test.beforeEach(async ({ page }) => {
    epfPpfPage = new EpfPpfPage(page);
    await epfPpfPage.navigateTo();
  });

  test("should display EPF/PPF page correctly", async ({ page }) => {
    await epfPpfPage.expectPageLoaded();
  });

  test("should show EPF card", async ({ page }) => {
    await epfPpfPage.expectEpfCardVisible();
    const epfBalance = await epfPpfPage.getEpfBalance();
    expect(epfBalance).toContain("₹");
  });

  test("should show PPF card", async ({ page }) => {
    await epfPpfPage.expectPpfCardVisible();
    const ppfBalance = await epfPpfPage.getPpfBalance();
    expect(ppfBalance).toContain("₹");
  });

  test("should show summary cards", async ({ page }) => {
    await expect(epfPpfPage.totalBalanceCard).toBeVisible();
    await expect(epfPpfPage.annualContributionCard).toBeVisible();
    await expect(epfPpfPage.projectedMaturityCard).toBeVisible();
  });

  test("should edit EPF contribution", async ({ page }) => {
    await epfPpfPage.editEpf();
    await epfPpfPage.expectFormDialogVisible();

    const epfData = epfPpfData.find((a) => a.type === "EPF")!;
    await epfPpfPage.updateEpfContribution(epfData.monthlyContribution! + 1000);
    await epfPpfPage.expectFormDialogClosed();
  });

  test("should show projected maturity value", async ({ page }) => {
    const projectedMaturity = await epfPpfPage.getProjectedMaturity();
    expect(projectedMaturity).toContain("₹");
    const numericValue = epfPpfPage.parseINR(projectedMaturity);
    expect(numericValue).toBeGreaterThan(0);
  });
});
