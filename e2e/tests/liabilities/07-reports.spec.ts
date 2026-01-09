import { test, expect } from "@playwright/test";
import { LiabilitiesReportsPage } from "../../pages/liabilities";
import { loansData } from "../../fixtures/liabilities-data";

test.describe("Liabilities Reports", () => {
  let reportsPage: LiabilitiesReportsPage;

  test.beforeEach(async ({ page }) => {
    reportsPage = new LiabilitiesReportsPage(page);
    await reportsPage.navigateTo();
  });

  test("should display reports page correctly", async ({ page }) => {
    await reportsPage.expectPageLoaded();
  });

  test("should show amortization schedule", async ({ page }) => {
    await reportsPage.selectAmortizationReport();

    // Select a loan
    const homeLoan = loansData.find((l) => l.loanType === "home")!;
    await reportsPage.selectLoanForAmortization(homeLoan.lenderName);

    await reportsPage.expectAmortizationTableVisible();
  });

  test("should have export button visible", async ({ page }) => {
    await reportsPage.expectExportButtonVisible();
  });
});
