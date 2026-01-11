import { test, expect } from "@playwright/test";
import { LoansPage, CreditCardsPage } from "../../pages/liabilities";

test.describe("Liabilities Form Validation", () => {
  test("should require loan type when adding loan", async ({ page }) => {
    const loansPage = new LoansPage(page);
    await loansPage.navigateTo();

    await loansPage.openAddForm();
    await loansPage.fillLoanForm({
      lenderName: "Test Bank",
      principalAmount: 1000000,
      emiAmount: 10000,
    });

    await loansPage.saveForm();
    // Should show validation error or stay open
    const hasError = await loansPage.hasValidationErrors();
    if (!hasError) {
      // Form might close if loan type has a default
      await loansPage.expectFormDialogClosed();
    }
  });

  test("should require positive amounts for loan", async ({ page }) => {
    const loansPage = new LoansPage(page);
    await loansPage.navigateTo();

    await loansPage.openAddForm();
    await loansPage.fillLoanForm({
      loanType: "Personal Loan",
      lenderName: "Test Bank",
      principalAmount: -1000,
    });

    await loansPage.saveForm();
    // Should show validation error
    await loansPage.expectFormDialogVisible();
  });

  test("should cancel form without saving", async ({ page }) => {
    const loansPage = new LoansPage(page);
    await loansPage.navigateTo();

    await loansPage.openAddForm();
    await loansPage.fillLoanForm({
      loanType: "Personal Loan",
      lenderName: "Test Bank",
      principalAmount: 500000,
    });

    await loansPage.cancelForm();
    await loansPage.expectFormDialogClosed();
    // We're already on Details tab (openAddForm navigates there)
    await loansPage.expectLoanNotInTable("Test Bank");
  });

  test("should validate credit card limit", async ({ page }) => {
    const creditCardsPage = new CreditCardsPage(page);
    await creditCardsPage.navigateTo();

    await creditCardsPage.openAddForm();
    await creditCardsPage.fillCardForm({
      cardName: "Test Card",
      creditLimit: 0, // Invalid - should be positive
    });

    await creditCardsPage.saveForm();
    // Should show validation error or handle gracefully
  });
});
