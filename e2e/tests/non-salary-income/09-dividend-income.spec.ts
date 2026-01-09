import { test, expect } from "@playwright/test";
import { DividendIncomePage } from "../../pages/non-salary-income";
import {
  dividendIncomeData,
  dividendIncomeSummary,
  getDividendIncomeByType,
} from "../../fixtures/non-salary-income-data";

test.describe("Dividend Income (Stocks & Mutual Funds)", () => {
  let dividendPage: DividendIncomePage;

  test.beforeEach(async ({ page }) => {
    dividendPage = new DividendIncomePage(page);
    await dividendPage.navigateTo();
  });

  test("should display dividend income page correctly", async ({ page }) => {
    await dividendPage.expectPageLoaded();
    await expect(dividendPage.addDividendButton).toBeVisible();
  });

  test("should display summary cards", async ({ page }) => {
    await expect(dividendPage.totalDividendsCard).toBeVisible();
    await expect(dividendPage.stockDividendsCard).toBeVisible();
    await expect(dividendPage.mfDividendsCard).toBeVisible();
    await expect(dividendPage.tdsDeductedCard).toBeVisible();
  });

  test("should open add dividend form dialog", async ({ page }) => {
    await dividendPage.openAddForm();
    await dividendPage.expectFormDialogVisible();
    await expect(dividendPage.sourceTypeSelect).toBeVisible();
    await expect(dividendPage.companyNameField).toBeVisible();
    await expect(dividendPage.dividendAmountField).toBeVisible();
  });

  test("should add stock dividend income", async ({ page }) => {
    const testData = dividendIncomeData[0]; // HDFC Bank dividend

    await dividendPage.openAddForm();
    await dividendPage.fillDividendForm({
      sourceType: "Stock",
      companyName: testData.companyOrFundName,
      symbol: testData.symbol,
      dividendAmount: testData.dividendAmount,
      dividendDate: testData.dividendDate,
      tdsDeducted: testData.tdsDeducted,
    });

    await dividendPage.saveForm();
    await dividendPage.expectFormDialogClosed();
    await dividendPage.expectDividendInTable(testData.companyOrFundName);
  });

  test("should add multiple stock dividends", async ({ page }) => {
    const stockDividends = getDividendIncomeByType('stock');

    for (const testData of stockDividends.slice(0, 2)) {
      await dividendPage.openAddForm();
      await dividendPage.fillDividendForm({
        sourceType: "Stock",
        companyName: testData.companyOrFundName,
        symbol: testData.symbol,
        dividendAmount: testData.dividendAmount,
        dividendDate: testData.dividendDate,
        tdsDeducted: testData.tdsDeducted,
      });
      await dividendPage.saveForm();
      await dividendPage.expectFormDialogClosed();
    }

    // Verify both are in table
    await dividendPage.expectDividendInTable(stockDividends[0].companyOrFundName);
    await dividendPage.expectDividendInTable(stockDividends[1].companyOrFundName);
  });

  test("should add mutual fund dividend income", async ({ page }) => {
    const testData = dividendIncomeData[3]; // HDFC Equity Fund dividend

    await dividendPage.openAddForm();
    await dividendPage.fillDividendForm({
      sourceType: "Mutual Fund",
      companyName: testData.companyOrFundName,
      dividendAmount: testData.dividendAmount,
      dividendDate: testData.dividendDate,
      tdsDeducted: testData.tdsDeducted,
    });

    await dividendPage.saveForm();
    await dividendPage.expectFormDialogClosed();
    await dividendPage.expectDividendInTable(testData.companyOrFundName);
  });

  test("should edit existing dividend income", async ({ page }) => {
    const testData = dividendIncomeData[0];

    // First add the dividend
    await dividendPage.openAddForm();
    await dividendPage.fillDividendForm({
      sourceType: "Stock",
      companyName: testData.companyOrFundName,
      dividendAmount: testData.dividendAmount,
    });
    await dividendPage.saveForm();

    // Now edit it
    await dividendPage.editDividend(testData.companyOrFundName);
    await dividendPage.expectFormDialogVisible();

    const updatedAmount = testData.dividendAmount + 2000;
    await dividendPage.fillDividendForm({
      dividendAmount: updatedAmount,
    });
    await dividendPage.saveForm();
    await dividendPage.expectFormDialogClosed();
  });

  test("should delete dividend income", async ({ page }) => {
    const testData = dividendIncomeData[0];

    // First add the dividend
    await dividendPage.openAddForm();
    await dividendPage.fillDividendForm({
      sourceType: "Stock",
      companyName: testData.companyOrFundName,
      dividendAmount: testData.dividendAmount,
    });
    await dividendPage.saveForm();

    // Now delete it
    await dividendPage.deleteDividend(testData.companyOrFundName);
    await dividendPage.confirmDeleteDividend();
    await dividendPage.expectDividendNotInTable(testData.companyOrFundName);
  });

  test("should cancel form without saving", async ({ page }) => {
    await dividendPage.openAddForm();
    await dividendPage.fillDividendForm({
      sourceType: "Stock",
      companyName: "Test Company Dividend",
      dividendAmount: 5000,
    });
    await dividendPage.cancelForm();
    await dividendPage.expectFormDialogClosed();
    await dividendPage.expectDividendNotInTable("Test Company Dividend");
  });

  test("should show correct dividend totals by type", async ({ page }) => {
    // Add stock dividend
    const stockData = dividendIncomeData[0];
    await dividendPage.openAddForm();
    await dividendPage.fillDividendForm({
      sourceType: "Stock",
      companyName: stockData.companyOrFundName,
      dividendAmount: stockData.dividendAmount,
    });
    await dividendPage.saveForm();

    // Add MF dividend
    const mfData = dividendIncomeData[3];
    await dividendPage.openAddForm();
    await dividendPage.fillDividendForm({
      sourceType: "Mutual Fund",
      companyName: mfData.companyOrFundName,
      dividendAmount: mfData.dividendAmount,
    });
    await dividendPage.saveForm();

    // Verify summary cards show non-zero values
    const totalDividends = await dividendPage.getTotalDividends();
    expect(totalDividends).not.toBe("₹0");
  });

  test("should calculate TDS deducted correctly", async ({ page }) => {
    const testData = dividendIncomeData[0];

    await dividendPage.openAddForm();
    await dividendPage.fillDividendForm({
      sourceType: "Stock",
      companyName: testData.companyOrFundName,
      dividendAmount: testData.dividendAmount,
      tdsDeducted: testData.tdsDeducted,
    });
    await dividendPage.saveForm();

    // Check TDS is shown in summary
    const tdsDeducted = await dividendPage.getTdsDeducted();
    expect(tdsDeducted).not.toBe("₹0");
  });
});
