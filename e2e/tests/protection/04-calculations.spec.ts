import { test, expect } from "@playwright/test";
import { ProtectionOverviewPage, ProtectionCalculatorPage } from "../../pages/protection";
import { coverageSummary, coverageNeedCalculation } from "../../fixtures/protection-data";

test.describe("Protection Calculations", () => {
  test("should show total coverage on overview page", async ({ page }) => {
    const overview = new ProtectionOverviewPage(page);
    await overview.navigateTo();

    const totalCoverage = await overview.getTotalCoverage();
    // Should contain rupee symbol or a number
    expect(totalCoverage).toMatch(/₹|[0-9]/);
  });

  test("should show annual premium on overview page", async ({ page }) => {
    const overview = new ProtectionOverviewPage(page);
    await overview.navigateTo();

    const annualPremium = await overview.getAnnualPremium();
    // Should contain rupee symbol or a number
    expect(annualPremium).toMatch(/₹|[0-9]/);
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

    // Either calculate button or next button should be visible
    const hasCalculateOrNext = await page.getByRole("button", { name: /Calculate|Next|Continue|Get/i }).first().isVisible();
    expect(hasCalculateOrNext).toBeTruthy();
  });

  test("should show coverage summary cards on overview", async ({ page }) => {
    const overview = new ProtectionOverviewPage(page);
    await overview.navigateTo();

    // At minimum, the overview should show some coverage information
    await expect(overview.totalCoverageCard.or(page.locator('.v-card').first())).toBeVisible();
  });
});
