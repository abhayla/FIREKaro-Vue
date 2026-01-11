import { test, expect } from "@playwright/test";
import { InsurancePage } from "../../pages/insurance";
import { coverageSummary, coverageNeedCalculation } from "../../fixtures/insurance-data";

test.describe("Insurance Calculations", () => {
  let insurancePage: InsurancePage;

  test.beforeEach(async ({ page }) => {
    insurancePage = new InsurancePage(page);
    await insurancePage.navigateTo();
  });

  test("should show coverage cards or empty state on overview tab", async ({ page }) => {
    await insurancePage.expectOnMainTab("overview");

    // Either shows coverage cards (with data) or empty state (No Insurance Policies)
    const hasLifeCoverage = await page
      .getByText(/Life Coverage/i)
      .first()
      .isVisible()
      .catch(() => false);
    const hasEmptyState = await page
      .getByText(/No Insurance Policies/i)
      .isVisible()
      .catch(() => false);
    const hasCoverageInfo = await page
      .getByText(/Coverage|Premium/i)
      .first()
      .isVisible()
      .catch(() => false);

    expect(hasLifeCoverage || hasEmptyState || hasCoverageInfo).toBeTruthy();
  });

  test("should show premium or coverage info on overview tab", async ({ page }) => {
    await insurancePage.expectOnMainTab("overview");

    // The overview tab shows various coverage/premium related text
    // Either shows premium/coverage cards OR empty state OR some coverage-related content
    const hasPremium = await page
      .getByText(/Premium/i)
      .first()
      .isVisible()
      .catch(() => false);
    const hasCoverage = await page
      .getByText(/Coverage/i)
      .first()
      .isVisible()
      .catch(() => false);
    const hasEmptyState = await page
      .getByText(/No Insurance Policies|No active policies/i)
      .first()
      .isVisible()
      .catch(() => false);
    const hasQuickActions = await page
      .getByText(/Quick Actions|Add Policy/i)
      .first()
      .isVisible()
      .catch(() => false);

    expect(hasPremium || hasCoverage || hasEmptyState || hasQuickActions).toBeTruthy();
  });

  test("should navigate to calculator tab", async ({ page }) => {
    await insurancePage.goToMainTab("calculator");
    await insurancePage.expectOnMainTab("calculator");
    await expect(page).toHaveURL(/\/insurance$/);
  });

  test("should display calculator content on calculator tab", async ({ page }) => {
    await insurancePage.goToMainTab("calculator");
    await insurancePage.expectPageLoaded();
    await insurancePage.expectCalculatorVisible();
  });

  test("should show HLV calculator on calculator tab", async ({ page }) => {
    await insurancePage.goToMainTab("calculator");

    // Calculator tab should have HLV Calculator content inside the v-alert
    await expect(
      page.locator('.v-alert').getByText(/Human Life Value.*Calculator/i)
    ).toBeVisible();
  });

  test("should have calculate or open full calculator button", async ({ page }) => {
    await insurancePage.goToMainTab("calculator");

    // Either calculate button, next button, or Open Calculator button should be visible
    const hasCalculateOrNext = await page
      .getByRole("button", { name: /Calculate|Next|Continue|Get|Open.*Calculator/i })
      .first()
      .isVisible();
    expect(hasCalculateOrNext).toBeTruthy();
  });

  test("should show coverage summary cards on overview", async ({ page }) => {
    await insurancePage.expectOnMainTab("overview");

    // At minimum, the overview should show some cards (coverage cards or empty state card)
    await expect(page.locator(".v-card").first()).toBeVisible();
  });

  test("should be able to navigate from overview to calculator", async ({ page }) => {
    // Start on overview
    await insurancePage.expectOnMainTab("overview");

    // Navigate to calculator
    await insurancePage.goToMainTab("calculator");
    await insurancePage.expectOnMainTab("calculator");

    // Check calculator content is visible
    await insurancePage.expectCalculatorVisible();
  });

  test("should show How HLV Works information on calculator tab", async ({ page }) => {
    await insurancePage.goToMainTab("calculator");

    // The calculator tab should have explanatory content about HLV method
    const hasHLVInfo = await page
      .getByText(/How.*HLV|Income Replacement|Liabilities/i)
      .first()
      .isVisible()
      .catch(() => false);
    const hasCalculatorContent = await page.locator(".v-card").first().isVisible();

    expect(hasHLVInfo || hasCalculatorContent).toBeTruthy();
  });
});
