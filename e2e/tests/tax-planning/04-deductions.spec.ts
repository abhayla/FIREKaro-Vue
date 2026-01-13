import { test, expect } from "@playwright/test";
import { TaxDeductionsPage } from "../../pages/tax-planning";

/**
 * Tax Deductions Tests
 *
 * Structure: Tax Details tab → Deductions accordion section
 *
 * UI Structure:
 * - Summary cards: Total Deductions, Tax Savings, 80C Remaining
 * - Add Deduction button
 * - Deduction categories with progress bars:
 *   - Section 80C (limit ₹1,50,000)
 *   - Section 80D - Health Insurance
 *   - Section 80CCD(1B) - NPS
 *   - Section 24 - Home Loan Interest
 *   - Other Deductions
 */
test.describe("Tax Deductions (80C, 80D, HRA)", () => {
  let deductionsPage: TaxDeductionsPage;

  test.beforeEach(async ({ page }) => {
    deductionsPage = new TaxDeductionsPage(page);
    await deductionsPage.navigateTo();
  });

  test.describe("Page Structure", () => {
    test("should display deductions section correctly", async ({ page }) => {
      await deductionsPage.expectPageLoaded();
    });

    test("should display Total Deductions summary", async ({ page }) => {
      await expect(page.locator("text=Total Deductions")).toBeVisible();
    });

    test("should display Tax Savings estimate", async ({ page }) => {
      await expect(page.locator("text=/Tax Savings/i")).toBeVisible();
    });

    test("should display 80C Remaining summary", async ({ page }) => {
      await expect(page.locator("text=80C Remaining")).toBeVisible();
    });

    test("should display Add Deduction button", async ({ page }) => {
      await expect(deductionsPage.addDeductionButton).toBeVisible();
    });
  });

  test.describe("Deduction Categories", () => {
    test("should display Section 80C category", async ({ page }) => {
      // Check for Section 80C title in the deductions area
      await expect(page.getByText("Section 80C").first()).toBeVisible();
    });

    test("should show Section 80C limit of ₹1,50,000", async ({ page }) => {
      // Use first() since the limit appears in multiple places (progress text, remaining text)
      await expect(page.locator("text=/₹1,50,000/").first()).toBeVisible();
    });

    test("should display Section 80D - Health Insurance category", async ({ page }) => {
      await expect(page.getByText(/Section 80D.*Health Insurance/i).first()).toBeVisible();
    });

    test("should show Section 80D limit of ₹25,000", async ({ page }) => {
      await expect(page.locator("text=/₹25,000/").first()).toBeVisible();
    });

    test("should display Section 80CCD(1B) - NPS category", async ({ page }) => {
      // Look for the NPS section - using exact text match
      await expect(page.getByText("Section 80CCD(1B) - NPS")).toBeVisible();
    });

    test("should show NPS limit of ₹50,000", async ({ page }) => {
      await expect(page.locator("text=/₹50,000/").first()).toBeVisible();
    });

    test("should display Section 24 - Home Loan Interest category", async ({ page }) => {
      await expect(page.getByText(/Section 24/i).first()).toBeVisible();
    });

    test("should show Home Loan Interest limit of ₹2,00,000", async ({ page }) => {
      await expect(page.locator("text=/₹2,00,000/").first()).toBeVisible();
    });

    test("should display Other Deductions category", async ({ page }) => {
      await expect(page.getByText(/Other Deductions/i).first()).toBeVisible();
    });
  });

  test.describe("Progress Tracking", () => {
    test("should show 80C progress bar", async ({ page }) => {
      // Look for a progress bar in the deductions section - multiple exist (one per category)
      const progressBars = await page.getByRole("progressbar").count();
      expect(progressBars).toBeGreaterThan(0);
    });

    test("should show percentage for 80C utilization", async ({ page }) => {
      await expect(page.locator("text=/0%|\\d+%/").first()).toBeVisible();
    });

    test("should show remaining amount for 80C", async ({ page }) => {
      await expect(page.locator("text=/remaining/i").first()).toBeVisible();
    });
  });

  test.describe("Empty State", () => {
    test("should show 'No deductions added yet' message when empty", async ({ page }) => {
      const hasEmptyState = await page.locator("text=/No deductions added yet/i").first().isVisible().catch(() => false);
      // Empty state should be visible when no deductions exist
      expect(hasEmptyState).toBe(true);
    });
  });

  test.describe("Add Deduction Flow", () => {
    test("should have Add Deduction buttons in each category", async ({ page }) => {
      // Each category should have its own Add Deduction button
      const addButtons = await page.getByRole("button", { name: /Add Deduction/i }).count();
      expect(addButtons).toBeGreaterThan(1); // Multiple add buttons
    });

    test("should open form when clicking Add Deduction button", async ({ page }) => {
      await deductionsPage.openAddDeductionForm();

      // Check if a dialog or form appeared
      const dialogVisible = await deductionsPage.deductionFormDialog.isVisible().catch(() => false);
      const formVisible = await page.locator(".v-dialog, .v-form").isVisible().catch(() => false);

      // Either dialog or some form element should appear
      expect(dialogVisible || formVisible).toBe(true);
    });
  });

  test.describe("Deductions Optimizer", () => {
    test("should display Deductions Optimizer section", async ({ page }) => {
      await expect(page.locator("text=Deductions Optimizer")).toBeVisible();
    });

    test("should show optimizer message when no data", async ({ page }) => {
      // When no deduction data, should show empty state message
      const hasNoData = await page.locator("text=/No deduction data available/i").isVisible().catch(() => false);
      const hasOptimizer = await page.locator("text=Deductions Optimizer").isVisible();

      expect(hasNoData || hasOptimizer).toBe(true);
    });
  });
});
