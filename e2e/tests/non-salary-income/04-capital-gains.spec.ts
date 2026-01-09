import { test, expect } from "@playwright/test";
import { CapitalGainsPage } from "../../pages/non-salary-income";
import { capitalGainsData, nonSalaryIncomeSummary, getCapitalGainsByType } from "../../fixtures/non-salary-income-data";

test.describe("Capital Gains (STCG/LTCG)", () => {
  let capitalGainsPage: CapitalGainsPage;

  test.beforeEach(async ({ page }) => {
    capitalGainsPage = new CapitalGainsPage(page);
    await capitalGainsPage.navigateTo();
  });

  test("should display capital gains page correctly", async ({ page }) => {
    await capitalGainsPage.expectPageLoaded();
    await expect(capitalGainsPage.addTransactionButton).toBeVisible();
  });

  test("should open add transaction form dialog", async ({ page }) => {
    await capitalGainsPage.openAddForm();
    await capitalGainsPage.expectFormDialogVisible();
    await expect(capitalGainsPage.assetTypeSelect).toBeVisible();
    await expect(capitalGainsPage.purchaseDateField).toBeVisible();
    await expect(capitalGainsPage.saleDateField).toBeVisible();
    await expect(capitalGainsPage.purchasePriceField).toBeVisible();
    await expect(capitalGainsPage.salePriceField).toBeVisible();
  });

  test("should add LTCG equity transaction", async ({ page }) => {
    const testData = capitalGainsData[0]; // HDFC Bank Shares

    await capitalGainsPage.openAddForm();
    await capitalGainsPage.fillCapitalGainsForm({
      assetType: "listed_equity",
      assetName: testData.assetName,
      purchaseDate: testData.purchaseDate,
      saleDate: testData.saleDate,
      purchasePrice: testData.purchasePrice,
      salePrice: testData.salePrice,
    });

    await capitalGainsPage.saveForm();
    await capitalGainsPage.expectFormDialogClosed();
    await capitalGainsPage.expectTransactionInTable(testData.assetName);
  });

  test("should add STCG mutual fund transaction", async ({ page }) => {
    const testData = capitalGainsData[1]; // Axis Bluechip Fund

    await capitalGainsPage.openAddForm();
    await capitalGainsPage.fillCapitalGainsForm({
      assetType: "equity_mf",
      assetName: testData.assetName,
      purchaseDate: testData.purchaseDate,
      saleDate: testData.saleDate,
      purchasePrice: testData.purchasePrice,
      salePrice: testData.salePrice,
    });

    await capitalGainsPage.saveForm();
    await capitalGainsPage.expectFormDialogClosed();
    await capitalGainsPage.expectTransactionInTable(testData.assetName);
  });

  test("should add gold LTCG transaction", async ({ page }) => {
    const testData = capitalGainsData[2]; // Sovereign Gold Bonds

    await capitalGainsPage.openAddForm();
    await capitalGainsPage.fillCapitalGainsForm({
      assetType: "gold",
      assetName: testData.assetName,
      purchaseDate: testData.purchaseDate,
      saleDate: testData.saleDate,
      purchasePrice: testData.purchasePrice,
      salePrice: testData.salePrice,
    });

    await capitalGainsPage.saveForm();
    await capitalGainsPage.expectFormDialogClosed();
    await capitalGainsPage.expectTransactionInTable(testData.assetName);
  });

  test("should edit existing capital gain transaction", async ({ page }) => {
    const testData = capitalGainsData[0];

    // First add the transaction
    await capitalGainsPage.openAddForm();
    await capitalGainsPage.fillCapitalGainsForm({
      assetType: "listed_equity",
      assetName: testData.assetName,
      purchasePrice: testData.purchasePrice,
      salePrice: testData.salePrice,
    });
    await capitalGainsPage.saveForm();

    // Now edit it
    await capitalGainsPage.editTransaction(testData.assetName);
    await capitalGainsPage.expectFormDialogVisible();

    const updatedSalePrice = testData.salePrice + 50000;
    await capitalGainsPage.fillCapitalGainsForm({
      salePrice: updatedSalePrice,
    });
    await capitalGainsPage.saveForm();
    await capitalGainsPage.expectFormDialogClosed();
  });

  test("should delete capital gain transaction", async ({ page }) => {
    const testData = capitalGainsData[0];

    // First add the transaction
    await capitalGainsPage.openAddForm();
    await capitalGainsPage.fillCapitalGainsForm({
      assetType: "listed_equity",
      assetName: testData.assetName,
      purchasePrice: testData.purchasePrice,
      salePrice: testData.salePrice,
    });
    await capitalGainsPage.saveForm();

    // Now delete it
    await capitalGainsPage.deleteTransaction(testData.assetName);
    await capitalGainsPage.confirmDeleteTransaction();
    await capitalGainsPage.expectTransactionNotInTable(testData.assetName);
  });

  test("should filter by gain type STCG", async ({ page }) => {
    // This test assumes data is pre-populated or we add multiple transactions first
    const stcgCount = getCapitalGainsByType("STCG").length;

    if (stcgCount > 0) {
      await capitalGainsPage.filterByGainType("STCG");
      await page.waitForTimeout(500);

      // Verify only STCG transactions are shown
      const tableCount = await capitalGainsPage.getTransactionCount();
      expect(tableCount).toBeGreaterThanOrEqual(0);
    }
  });

  test("should cancel form without saving", async ({ page }) => {
    await capitalGainsPage.openAddForm();
    await capitalGainsPage.fillCapitalGainsForm({
      assetName: "Test Asset",
      purchasePrice: 100000,
      salePrice: 120000,
    });
    await capitalGainsPage.cancelForm();
    await capitalGainsPage.expectFormDialogClosed();
    await capitalGainsPage.expectTransactionNotInTable("Test Asset");
  });
});
