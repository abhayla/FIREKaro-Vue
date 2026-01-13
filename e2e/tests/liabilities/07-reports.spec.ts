import { test, expect } from "@playwright/test";
import { LiabilitiesReportsPage } from "../../pages/liabilities";

test.describe("Liabilities Reports", () => {
  let reportsPage: LiabilitiesReportsPage;

  test.beforeEach(async ({ page }) => {
    reportsPage = new LiabilitiesReportsPage(page);
    await reportsPage.navigateTo();
  });

  test("should display reports page correctly", async () => {
    await reportsPage.expectPageLoaded();
  });

  test("should display all report tabs", async () => {
    await reportsPage.expectTabsVisible();
  });

  test("should navigate to Debt Summary tab", async () => {
    await reportsPage.goToDebtSummary();
    await expect(reportsPage.debtSummaryTab).toHaveAttribute("aria-selected", "true");
  });

  test("should navigate to Payment History tab", async () => {
    await reportsPage.goToPaymentHistory();
    await expect(reportsPage.paymentHistoryTab).toHaveAttribute("aria-selected", "true");
  });

  test("should navigate to Interest Analysis tab", async () => {
    await reportsPage.goToInterestAnalysis();
    await expect(reportsPage.interestAnalysisTab).toHaveAttribute("aria-selected", "true");
  });

  test("should navigate to Tax Benefits tab", async () => {
    await reportsPage.goToTaxBenefits();
    await expect(reportsPage.taxBenefitsTab).toHaveAttribute("aria-selected", "true");
  });

  test("should have export button visible", async () => {
    await reportsPage.expectExportButtonVisible();
  });
});
