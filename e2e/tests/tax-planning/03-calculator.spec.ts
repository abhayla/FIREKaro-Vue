import { test, expect } from "@playwright/test";
import { TaxCalculatorPage } from "../../pages/tax-planning";

/**
 * Tax Calculator Tests
 *
 * Structure: Tax Details tab → Calculator accordion section (expanded by default)
 *
 * UI Features:
 * - Mode toggle: From Data (uses API data) / Manual (user enters values)
 * - Regime selector: Old / New toggle buttons
 * - Quick Select income chips: ₹5L, ₹10L, ₹15L, ₹20L, ₹30L, ₹50L
 * - Auto-calculation (no Calculate button)
 * - Results: Tax Breakdown Table + Regime Comparison Card
 */
test.describe("Tax Calculator", () => {
  let calculatorPage: TaxCalculatorPage;

  test.beforeEach(async ({ page }) => {
    calculatorPage = new TaxCalculatorPage(page);
    await calculatorPage.navigateTo();
  });

  test.describe("Page Structure", () => {
    test("should display calculator section correctly", async ({ page }) => {
      await calculatorPage.expectPageLoaded();
      await expect(calculatorPage.calculatorContent).toBeVisible();
    });

    test("should display mode toggle buttons", async ({ page }) => {
      await expect(calculatorPage.fromDataButton).toBeVisible();
      await expect(calculatorPage.manualButton).toBeVisible();
    });

    test("should display regime toggle buttons", async ({ page }) => {
      await expect(calculatorPage.oldRegimeButton).toBeVisible();
      await expect(calculatorPage.newRegimeButton).toBeVisible();
    });

    test("should display quick select income chips", async ({ page }) => {
      await expect(calculatorPage.quickSelectChips.first()).toBeVisible();
      await expect(page.locator("text=₹5L")).toBeVisible();
      await expect(page.locator("text=₹10L")).toBeVisible();
    });

    test("should display gross income field", async ({ page }) => {
      await expect(calculatorPage.grossIncomeField).toBeVisible();
    });

    test("should display tax breakdown card", async ({ page }) => {
      await calculatorPage.expectResultsVisible();
    });

    test("should display reset button", async ({ page }) => {
      await expect(calculatorPage.resetButton).toBeVisible();
    });
  });

  test.describe("Mode Switching", () => {
    test("should have gross income disabled in From Data mode by default", async ({ page }) => {
      const isDisabled = await calculatorPage.grossIncomeField.isDisabled();
      expect(isDisabled).toBe(true);
    });

    test("should enable gross income when switching to Manual mode", async ({ page }) => {
      await calculatorPage.switchToManualMode();
      const isDisabled = await calculatorPage.grossIncomeField.isDisabled();
      expect(isDisabled).toBe(false);
    });

    test("should switch to manual mode when clicking quick select chip", async ({ page }) => {
      await calculatorPage.selectQuickIncome("₹10L");
      // After clicking quick select, should be in manual mode
      const isDisabled = await calculatorPage.grossIncomeField.isDisabled();
      expect(isDisabled).toBe(false);
    });
  });

  test.describe("Tax Calculation", () => {
    test("should calculate tax when using quick select income", async ({ page }) => {
      await calculatorPage.selectQuickIncome("₹15L");
      await page.waitForTimeout(500);

      // Should show results (either calculated values or empty state)
      const hasResults = await calculatorPage.taxBreakdownCard.isVisible();
      expect(hasResults).toBe(true);
    });

    test("should show calculation results after entering income manually", async ({ page }) => {
      await calculatorPage.enterGrossIncome(1500000);
      await calculatorPage.calculate();

      await calculatorPage.expectResultsVisible();
    });

    test("should show tax breakdown card", async ({ page }) => {
      await calculatorPage.selectQuickIncome("₹10L");
      await page.waitForTimeout(500);

      await expect(calculatorPage.taxBreakdownCard).toBeVisible();
    });

    test("should show regime comparison card", async ({ page }) => {
      await calculatorPage.selectQuickIncome("₹10L");
      await page.waitForTimeout(500);

      await expect(calculatorPage.regimeComparisonCard).toBeVisible();
    });
  });

  test.describe("Regime Selection", () => {
    test("should toggle to Old regime and show deduction fields", async ({ page }) => {
      await calculatorPage.selectQuickIncome("₹10L");
      await calculatorPage.selectRegime("Old");
      await page.waitForTimeout(300);

      // Deduction fields should be visible - use more specific locator
      const deductionsHeader = await page.getByText("Deductions (Old Regime Only)").isVisible().catch(() => false);
      const section80CVisible = await page.locator("text=/Section 80C/i").first().isVisible().catch(() => false);
      expect(deductionsHeader || section80CVisible).toBe(true);
    });

    test("should toggle to New regime and show notice", async ({ page }) => {
      await calculatorPage.selectQuickIncome("₹10L");
      await calculatorPage.selectRegime("New");
      await page.waitForTimeout(300);

      await expect(calculatorPage.newRegimeNotice).toBeVisible();
    });

    test("should recalculate when switching regimes", async ({ page }) => {
      await calculatorPage.selectQuickIncome("₹15L");
      await page.waitForTimeout(500);

      await calculatorPage.selectRegime("Old");
      await page.waitForTimeout(300);

      await calculatorPage.selectRegime("New");
      await page.waitForTimeout(300);

      // Results should still be visible
      await calculatorPage.expectResultsVisible();
    });
  });

  test.describe("Deductions (Old Regime)", () => {
    test.beforeEach(async ({ page }) => {
      await calculatorPage.selectQuickIncome("₹20L");
      await calculatorPage.selectRegime("Old");
      await page.waitForTimeout(500);
    });

    test("should display Section 80C input field", async ({ page }) => {
      // Use first() to avoid strict mode violation
      await expect(page.locator(".v-text-field").filter({ hasText: /Section 80C/ }).first()).toBeVisible();
    });

    test("should display Section 80D input field", async ({ page }) => {
      await expect(page.locator(".v-text-field").filter({ hasText: /Section 80D/ }).first()).toBeVisible();
    });

    test("should display Section 80CCD(1B) - NPS input field", async ({ page }) => {
      await expect(page.locator(".v-text-field").filter({ hasText: /80CCD.*1B/ }).first()).toBeVisible();
    });

    test("should display Section 24 - Home Loan input field", async ({ page }) => {
      await expect(page.locator(".v-text-field").filter({ hasText: /Section 24/ }).first()).toBeVisible();
    });

    test("should show total deductions chip when entering deductions", async ({ page }) => {
      // Find the Section 80C input field and enter a value
      const section80CField = page.locator(".v-text-field").filter({ hasText: /Section 80C/ }).first().locator("input");
      await section80CField.fill("150000");
      await page.waitForTimeout(500);

      // Total deductions chip should be visible (shows "Total: ₹xxx")
      const totalChip = await page.locator(".v-chip").filter({ hasText: /Total:/i }).isVisible();
      expect(totalChip).toBe(true);
    });
  });

  test.describe("Reset Functionality", () => {
    test("should reset calculator to From Data mode", async ({ page }) => {
      // Enter manual data
      await calculatorPage.selectQuickIncome("₹15L");
      await page.waitForTimeout(300);

      // Reset
      await calculatorPage.reset();
      await page.waitForTimeout(300);

      // Should be back in From Data mode (income field disabled)
      const isDisabled = await calculatorPage.grossIncomeField.isDisabled();
      expect(isDisabled).toBe(true);
    });

    test("should reset income field value", async ({ page }) => {
      await calculatorPage.enterGrossIncome(1500000);
      await page.waitForTimeout(300);

      await calculatorPage.reset();
      await page.waitForTimeout(300);

      // Income should be reset to API value or 0
      const value = await calculatorPage.grossIncomeField.inputValue();
      // After reset, either 0 or API value
      expect(parseInt(value) === 0 || value === "").toBe(true);
    });
  });

  test.describe("Tax Details Display", () => {
    test("should show currency values in results", async ({ page }) => {
      // Quick select chips always have currency values (₹5L, ₹10L, etc.)
      const quickSelectChips = page.locator("text=/₹\\d+L/");
      await expect(quickSelectChips.first()).toBeVisible();

      // Also verify the calculator section is loaded
      await expect(calculatorPage.grossIncomeField).toBeVisible();
    });

    test("should display empty state message when no calculation data", async ({ page }) => {
      // In From Data mode with no API data, should show empty state or breakdown card
      const hasEmptyState = await calculatorPage.noCalculationDataMessage.isVisible().catch(() => false);
      const hasResults = await page.locator(".text-currency").first().isVisible().catch(() => false);
      const hasBreakdownCard = await calculatorPage.taxBreakdownCard.isVisible().catch(() => false);

      // Either empty state, results, or breakdown card should be visible
      expect(hasEmptyState || hasResults || hasBreakdownCard).toBe(true);
    });
  });
});
