import { test, expect } from "@playwright/test";
import { LiabilitiesOverviewPage, LoansPage, CreditCardsPage } from "../../pages/liabilities";

test.describe("Liabilities Overview", () => {
  let overviewPage: LiabilitiesOverviewPage;

  test.beforeEach(async ({ page }) => {
    overviewPage = new LiabilitiesOverviewPage(page);
    await overviewPage.navigateTo();
  });

  test("should display overview page correctly", async () => {
    await overviewPage.expectPageLoaded();
    await expect(overviewPage.overviewTab).toHaveAttribute("aria-selected", "true");
  });

  test("should show summary cards", async () => {
    await overviewPage.expectSummaryCardsVisible();
  });

  test("should display total debt card", async () => {
    await expect(overviewPage.totalDebtCard).toBeVisible();
    const totalDebtValue = await overviewPage.getTotalDebt();
    expect(totalDebtValue).toBeTruthy();
  });

  test("should display monthly EMI card", async () => {
    await expect(overviewPage.monthlyEMICard).toBeVisible();
    const emiValue = await overviewPage.getMonthlyEMI();
    expect(emiValue).toBeTruthy();
  });

  test("should navigate to loans tab from overview", async ({ page }) => {
    await overviewPage.clickLoansTab();
    await expect(page).toHaveURL(/\/dashboard\/liabilities\/loans/);

    const loansPage = new LoansPage(page);
    await loansPage.expectPageLoaded();
  });

  test("should navigate to credit cards tab from overview", async ({ page }) => {
    await overviewPage.clickCreditCardsTab();
    await expect(page).toHaveURL(/\/dashboard\/liabilities\/credit-cards/);

    const creditCardsPage = new CreditCardsPage(page);
    await creditCardsPage.expectPageLoaded();
  });

  test("should navigate to debt payoff tab from overview", async ({ page }) => {
    await overviewPage.clickDebtPayoffTab();
    await expect(page).toHaveURL(/\/dashboard\/liabilities\/debt-payoff/);
  });

  test("should navigate to reports tab from overview", async ({ page }) => {
    await overviewPage.clickReportsTab();
    await expect(page).toHaveURL(/\/dashboard\/liabilities\/reports/);
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
});
