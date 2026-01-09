import { test, expect } from "@playwright/test";
import { LoansPage } from "../../pages/liabilities";
import { loansData, liabilitiesSummary } from "../../fixtures/liabilities-data";

test.describe("Loans CRUD Operations", () => {
  let loansPage: LoansPage;

  test.beforeEach(async ({ page }) => {
    loansPage = new LoansPage(page);
    await loansPage.navigateTo();
  });

  test("should display loans page correctly", async ({ page }) => {
    await loansPage.expectPageLoaded();
    await expect(loansPage.addLoanButton).toBeVisible();
  });

  test("should show summary cards", async ({ page }) => {
    await expect(loansPage.totalOutstandingCard).toBeVisible();
    await expect(loansPage.totalEMICard).toBeVisible();
  });

  test("should open add loan form dialog", async ({ page }) => {
    await loansPage.openAddForm();
    await loansPage.expectFormDialogVisible();
    await expect(loansPage.loanTypeSelect).toBeVisible();
    await expect(loansPage.lenderNameField).toBeVisible();
    await expect(loansPage.principalAmountField).toBeVisible();
  });

  test("should add home loan", async ({ page }) => {
    const homeLoan = loansData.find((l) => l.loanType === "home")!;

    await loansPage.openAddForm();
    await loansPage.fillLoanForm({
      loanType: "Home Loan",
      lenderName: homeLoan.lenderName,
      accountNumber: homeLoan.loanAccountNumber,
      principalAmount: homeLoan.principalAmount,
      outstanding: homeLoan.outstandingPrincipal,
      interestRate: homeLoan.interestRate,
      tenure: homeLoan.tenure,
      emiAmount: homeLoan.emiAmount,
      emiDate: homeLoan.emiDate,
    });

    await loansPage.saveForm();
    await loansPage.expectFormDialogClosed();
    await loansPage.expectLoanInTable(homeLoan.lenderName);
  });

  test("should add car loan", async ({ page }) => {
    const carLoan = loansData.find((l) => l.loanType === "car")!;

    await loansPage.openAddForm();
    await loansPage.fillLoanForm({
      loanType: "Car Loan",
      lenderName: carLoan.lenderName,
      principalAmount: carLoan.principalAmount,
      outstanding: carLoan.outstandingPrincipal,
      interestRate: carLoan.interestRate,
      emiAmount: carLoan.emiAmount,
    });

    await loansPage.saveForm();
    await loansPage.expectFormDialogClosed();
    await loansPage.expectLoanInTable(carLoan.lenderName);
  });

  test("should edit existing loan", async ({ page }) => {
    const testLoan = loansData[0];

    // First add the loan
    await loansPage.openAddForm();
    await loansPage.fillLoanForm({
      loanType: "Home Loan",
      lenderName: testLoan.lenderName,
      principalAmount: testLoan.principalAmount,
      outstanding: testLoan.outstandingPrincipal,
      interestRate: testLoan.interestRate,
      emiAmount: testLoan.emiAmount,
    });
    await loansPage.saveForm();

    // Now edit it
    await loansPage.editLoan(testLoan.lenderName);
    await loansPage.expectFormDialogVisible();

    const updatedOutstanding = testLoan.outstandingPrincipal - 50000;
    await loansPage.fillLoanForm({
      outstanding: updatedOutstanding,
    });
    await loansPage.saveForm();
    await loansPage.expectFormDialogClosed();
  });

  test("should delete loan", async ({ page }) => {
    const testLoan = loansData[0];

    // First add the loan
    await loansPage.openAddForm();
    await loansPage.fillLoanForm({
      loanType: "Home Loan",
      lenderName: testLoan.lenderName,
      principalAmount: testLoan.principalAmount,
      emiAmount: testLoan.emiAmount,
    });
    await loansPage.saveForm();

    // Now delete it
    await loansPage.deleteLoan(testLoan.lenderName);
    await loansPage.confirmDelete();
    await loansPage.expectLoanNotInTable(testLoan.lenderName);
  });
});
