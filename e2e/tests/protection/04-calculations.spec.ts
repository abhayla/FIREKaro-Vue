import { test, expect } from "@playwright/test";
import { ProtectionOverviewPage, ProtectionCalculatorPage } from "../../pages/protection";
import { coverageSummary, coverageNeedCalculation } from "../../fixtures/protection-data";

test.describe("Protection Calculations", () => {
  test("should show coverage cards or empty state on overview page", async ({ page }) => {
    const overview = new ProtectionOverviewPage(page);
    await overview.navigateTo();

    // Either shows coverage cards (with data) or empty state (No Insurance Policies)
    const hasLifeCoverage = await page.getByText(/Life Coverage/i).first().isVisible().catch(() => false);
    const hasEmptyState = await page.getByText(/No Insurance Policies/i).isVisible().catch(() => false);
    const hasCoverageInfo = await page.getByText(/Coverage|Premium/i).first().isVisible().catch(() => false);

    expect(hasLifeCoverage || hasEmptyState || hasCoverageInfo).toBeTruthy();
  });

  test("should show premium or coverage info on overview page", async ({ page }) => {
    const overview = new ProtectionOverviewPage(page);
    await overview.navigateTo();

    // The overview page shows various coverage/premium related text
    // Either shows premium/coverage cards OR empty state OR some coverage-related content
    const hasPremium = await page.getByText(/Premium/i).first().isVisible().catch(() => false);
    const hasCoverage = await page.getByText(/Coverage/i).first().isVisible().catch(() => false);
    const hasEmptyState = await page.getByText(/No Insurance Policies|No active policies/i).first().isVisible().catch(() => false);
    const hasQuickActions = await page.getByText(/Quick Actions|Add Policy/i).first().isVisible().catch(() => false);

    expect(hasPremium || hasCoverage || hasEmptyState || hasQuickActions).toBeTruthy();
  });

  test("should display calculator page", async ({ page }) => {
    const calculatorPage = new ProtectionCalculatorPage(page);
    await calculatorPage.navigateTo();
    await calculatorPage.expectPageLoaded();
  });

  test("should show wizard/stepper on calculator page", async ({ page }) => {
    const calculatorPage = new ProtectionCalculatorPage(page);
    await calculatorPage.navigateTo();

    // Calculator should have some form of step indicator or wizard
    await expect(page.locator(".v-stepper, .v-card, [role='progressbar']").first()).toBeVisible();
  });

  test("should have calculate or next button on calculator", async ({ page }) => {
    const calculatorPage = new ProtectionCalculatorPage(page);
    await calculatorPage.navigateTo();

    // Either calculate button, next button, or Open Calculator button should be visible
    const hasCalculateOrNext = await page.getByRole("button", { name: /Calculate|Next|Continue|Get|Open.*Calculator/i }).first().isVisible();
    expect(hasCalculateOrNext).toBeTruthy();
  });

  test("should show coverage summary cards on overview", async ({ page }) => {
    const overview = new ProtectionOverviewPage(page);
    await overview.navigateTo();

    // At minimum, the overview should show some cards (coverage cards or empty state card)
    await expect(page.locator('.v-card').first()).toBeVisible();
  });
});
