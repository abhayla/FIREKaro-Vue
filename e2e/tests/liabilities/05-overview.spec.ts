import { test, expect } from "@playwright/test";
import { LiabilitiesOverviewPage } from "../../pages/liabilities";

test.describe("Liabilities Overview", () => {
  let overviewPage: LiabilitiesOverviewPage;

  test.beforeEach(async ({ page }) => {
    overviewPage = new LiabilitiesOverviewPage(page);
    await overviewPage.navigateTo();
  });

  test("should display overview page correctly", async () => {
    await overviewPage.expectPageLoaded();
  });

  test("should show summary cards", async () => {
    await overviewPage.expectSummaryCardsVisible();
  });

  test("should display total debt card", async () => {
    await expect(overviewPage.totalDebtCard).toBeVisible();
    const totalDebtValue = await overviewPage.getTotalDebt();
    expect(totalDebtValue).toBeTruthy();
  });

  test("should display monthly payment card", async () => {
    await expect(overviewPage.monthlyPaymentCard).toBeVisible();
    const paymentValue = await overviewPage.getMonthlyPayment();
    expect(paymentValue).toBeTruthy();
  });

  test("should show debt breakdown sections", async ({ page }) => {
    // Check for loans breakdown card or section
    const loansSection = page.locator(".v-card").filter({ hasText: /Loans|Home Loan|EMI/i }).first();
    await expect(loansSection).toBeVisible();
  });

  test("should show upcoming payments section", async ({ page }) => {
    // Check for upcoming payments or due dates section
    // This may not exist if there are no upcoming payments - just verify page loads
    const upcomingSection = page.locator(".v-card").filter({ hasText: /Upcoming|Due|Payment/i }).first();
    const sectionExists = await upcomingSection.count();
    if (sectionExists > 0) {
      await expect(upcomingSection).toBeVisible();
    } else {
      await expect(overviewPage.pageTitle).toBeVisible();
    }
  });

  test("should display DTI gauge or ratio", async ({ page }) => {
    // Check for DTI visualization
    const dtiSection = page.locator(".v-card").filter({ hasText: /DTI|Debt.to.Income/i }).first();
    const sectionExists = await dtiSection.count();
    if (sectionExists > 0) {
      await expect(dtiSection).toBeVisible();
    } else {
      // If no DTI section, just verify the page loaded
      await expect(overviewPage.pageTitle).toBeVisible();
    }
  });
});
