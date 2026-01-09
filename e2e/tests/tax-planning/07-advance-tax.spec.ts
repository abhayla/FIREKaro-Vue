import { test, expect } from "@playwright/test";
import { AdvanceTaxPage } from "../../pages/tax-planning";

test.describe("Advance Tax Management", () => {
  let advanceTaxPage: AdvanceTaxPage;

  test.beforeEach(async ({ page }) => {
    advanceTaxPage = new AdvanceTaxPage(page);
    await advanceTaxPage.navigateTo();
  });

  test("should load advance tax page", async ({ page }) => {
    await advanceTaxPage.expectPageLoaded();
    await expect(page).toHaveURL(/\/dashboard\/tax-planning\/advance-tax/);
  });

  test("should display Advance Tax tab as active", async ({ page }) => {
    await expect(advanceTaxPage.advanceTaxTab).toHaveAttribute("aria-selected", "true");
  });

  test.describe("When no estimate exists", () => {
    test("should show create estimate button", async ({ page }) => {
      // This test assumes no estimate exists for the user
      // In a real scenario, we'd need to ensure clean state
      const createButton = page.getByRole("button", { name: /Create Estimate/i });
      const noEstimateMsg = page.locator("text=No Advance Tax Estimate");

      // Either show create button or summary cards (if estimate exists)
      const hasNoEstimate = await noEstimateMsg.isVisible().catch(() => false);

      if (hasNoEstimate) {
        await expect(createButton).toBeVisible();
      } else {
        await advanceTaxPage.expectSummaryCardsVisible();
      }
    });
  });

  test.describe("When estimate exists", () => {
    test.beforeEach(async ({ page }) => {
      // Create estimate if it doesn't exist
      const createButton = page.getByRole("button", { name: /Create Estimate/i });
      const hasNoEstimate = await createButton.isVisible().catch(() => false);

      if (hasNoEstimate) {
        await createButton.click();
        await page.waitForTimeout(1000);
      }
    });

    test("should display summary cards", async () => {
      await advanceTaxPage.expectSummaryCardsVisible();
    });

    test("should display quarterly timeline", async () => {
      await advanceTaxPage.expectTimelineVisible();
    });

    test("should display interest calculator", async () => {
      await advanceTaxPage.expectInterestCalculatorVisible();
    });

    test("should display payment history table", async () => {
      await advanceTaxPage.expectPaymentHistoryVisible();
    });

    test("should show net tax liability in summary card", async () => {
      const netTax = await advanceTaxPage.getNetTaxLiability();
      expect(netTax).toMatch(/₹|Rs\.?|\d/);
    });

    test("should show total paid amount", async () => {
      const totalPaid = await advanceTaxPage.getTotalPaid();
      expect(totalPaid).toMatch(/₹|Rs\.?|\d/);
    });

    test("should have recalculate button", async ({ page }) => {
      await expect(advanceTaxPage.recalculateButton).toBeVisible();
    });

    test("should have add payment button", async ({ page }) => {
      await expect(advanceTaxPage.addPaymentButton).toBeVisible();
    });
  });

  test.describe("Payment Dialog", () => {
    test.beforeEach(async ({ page }) => {
      // Ensure estimate exists
      const createButton = page.getByRole("button", { name: /Create Estimate/i });
      const hasNoEstimate = await createButton.isVisible().catch(() => false);

      if (hasNoEstimate) {
        await createButton.click();
        await page.waitForTimeout(1000);
      }
    });

    test("should open payment dialog when clicking Add Payment", async ({ page }) => {
      await advanceTaxPage.openAddPaymentDialog();
      await advanceTaxPage.expectPaymentDialogVisible();
    });

    test("should close payment dialog when clicking Cancel", async ({ page }) => {
      await advanceTaxPage.openAddPaymentDialog();
      await advanceTaxPage.cancelPayment();
      await advanceTaxPage.expectPaymentDialogClosed();
    });

    test("should have required form fields in payment dialog", async ({ page }) => {
      await advanceTaxPage.openAddPaymentDialog();

      // Check for essential form fields
      await expect(advanceTaxPage.paymentDateInput).toBeVisible();
      await expect(advanceTaxPage.paymentAmountInput).toBeVisible();
      await expect(advanceTaxPage.quarterSelect).toBeVisible();
    });
  });

  test.describe("Quarterly Timeline", () => {
    test.beforeEach(async ({ page }) => {
      // Ensure estimate exists
      const createButton = page.getByRole("button", { name: /Create Estimate/i });
      const hasNoEstimate = await createButton.isVisible().catch(() => false);

      if (hasNoEstimate) {
        await createButton.click();
        await page.waitForTimeout(1000);
      }
    });

    test("should display all four quarters", async ({ page }) => {
      await expect(advanceTaxPage.quarterlyTimeline).toBeVisible();

      // Check for quarter labels
      await expect(page.locator("text=Q1")).toBeVisible();
      await expect(page.locator("text=Q2")).toBeVisible();
      await expect(page.locator("text=Q3")).toBeVisible();
      await expect(page.locator("text=Q4")).toBeVisible();
    });

    test("should display due dates", async ({ page }) => {
      await expect(advanceTaxPage.quarterlyTimeline).toBeVisible();

      // Check for due date information
      await expect(page.locator("text=/June|Jun/i")).toBeVisible();
      await expect(page.locator("text=/Sep/i")).toBeVisible();
      await expect(page.locator("text=/Dec/i")).toBeVisible();
      await expect(page.locator("text=/Mar/i")).toBeVisible();
    });
  });

  test.describe("Interest Calculator", () => {
    test.beforeEach(async ({ page }) => {
      // Ensure estimate exists
      const createButton = page.getByRole("button", { name: /Create Estimate/i });
      const hasNoEstimate = await createButton.isVisible().catch(() => false);

      if (hasNoEstimate) {
        await createButton.click();
        await page.waitForTimeout(1000);
      }
    });

    test("should show interest breakdown", async ({ page }) => {
      await expect(advanceTaxPage.interestCalculator).toBeVisible();

      // Should show 234B and 234C sections
      await expect(page.locator("text=234B")).toBeVisible();
      await expect(page.locator("text=234C")).toBeVisible();
    });

    test("should have what-if calculator section", async ({ page }) => {
      await expect(advanceTaxPage.interestCalculator).toBeVisible();
      await expect(page.locator("text=What-If Calculator")).toBeVisible();
    });
  });

  test.describe("Educational Info", () => {
    test("should display advance tax rules information", async ({ page }) => {
      await expect(page.locator("text=Advance Tax Rules")).toBeVisible();
    });

    test("should show due dates information", async ({ page }) => {
      // Check for due date information in educational section
      await expect(page.locator("text=June 15")).toBeVisible();
      await expect(page.locator("text=September 15")).toBeVisible();
      await expect(page.locator("text=December 15")).toBeVisible();
      await expect(page.locator("text=March 15")).toBeVisible();
    });

    test("should show interest provisions information", async ({ page }) => {
      await expect(page.locator("text=Interest Provisions")).toBeVisible();
      await expect(page.locator("text=Section 234B")).toBeVisible();
      await expect(page.locator("text=Section 234C")).toBeVisible();
    });
  });
});
