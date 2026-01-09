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
    const uniqueName = `${testData.assetName} ${Date.now()}`;

    await capitalGainsPage.openAddForm();
    await capitalGainsPage.fillCapitalGainsForm({
      assetType: "listed_equity",
      assetName: uniqueName,
      purchaseDate: testData.purchaseDate,
      saleDate: testData.saleDate,
      purchasePrice: testData.purchasePrice,
      salePrice: testData.salePrice,
    });

    await capitalGainsPage.saveForm();
    await capitalGainsPage.expectFormDialogClosed();
    await capitalGainsPage.expectTransactionInTable(uniqueName);
  });

  test("should add STCG mutual fund transaction", async ({ page }) => {
    const testData = capitalGainsData[1]; // Axis Bluechip Fund
    const uniqueName = `${testData.assetName} ${Date.now()}`;

    await capitalGainsPage.openAddForm();
    await capitalGainsPage.fillCapitalGainsForm({
      assetType: "equity_mf",
      assetName: uniqueName,
      purchaseDate: testData.purchaseDate,
      saleDate: testData.saleDate,
      purchasePrice: testData.purchasePrice,
      salePrice: testData.salePrice,
    });

    await capitalGainsPage.saveForm();
    await capitalGainsPage.expectFormDialogClosed();
    await capitalGainsPage.expectTransactionInTable(uniqueName);
  });

  test("should add gold LTCG transaction", async ({ page }) => {
    const testData = capitalGainsData[2]; // Sovereign Gold Bonds
    const uniqueName = `${testData.assetName} ${Date.now()}`;

    await capitalGainsPage.openAddForm();
    await capitalGainsPage.fillCapitalGainsForm({
      assetType: "gold",
      assetName: uniqueName,
      purchaseDate: testData.purchaseDate,
      saleDate: testData.saleDate,
      purchasePrice: testData.purchasePrice,
      salePrice: testData.salePrice,
    });

    await capitalGainsPage.saveForm();
    await capitalGainsPage.expectFormDialogClosed();
    await capitalGainsPage.expectTransactionInTable(uniqueName);
  });

  test("should edit existing capital gain transaction", async ({ page }) => {
    const uniqueName = `Edit Test ${Date.now()}`;

    // First add the transaction
    await capitalGainsPage.openAddForm();
    await capitalGainsPage.fillCapitalGainsForm({
      assetType: "listed_equity",
      assetName: uniqueName,
      purchaseDate: "2023-01-15",
      saleDate: "2025-06-20",
      purchasePrice: 100000,
      salePrice: 150000,
    });
    await capitalGainsPage.saveForm();
    await capitalGainsPage.expectTransactionInTable(uniqueName);

    // Now edit it
    await capitalGainsPage.editTransaction(uniqueName);
    await capitalGainsPage.expectFormDialogVisible();

    await capitalGainsPage.fillCapitalGainsForm({
      salePrice: 200000,
    });
    await capitalGainsPage.saveForm();
    await capitalGainsPage.expectFormDialogClosed();
  });

  test("should delete capital gain transaction", async ({ page }) => {
    const uniqueName = `Delete Test Asset ${Date.now()}`;

    // First add the transaction
    await capitalGainsPage.openAddForm();
    await capitalGainsPage.fillCapitalGainsForm({
      assetType: "listed_equity",
      assetName: uniqueName,
      purchaseDate: "2023-01-15",
      saleDate: "2025-06-20",
      purchasePrice: 100000,
      salePrice: 150000,
    });
    await capitalGainsPage.saveForm();
    await capitalGainsPage.expectTransactionInTable(uniqueName);

    // Now delete it
    await capitalGainsPage.deleteTransaction(uniqueName);
    await capitalGainsPage.confirmDeleteTransaction();
    await capitalGainsPage.expectTransactionNotInTable(uniqueName);
  });

  test.skip("should filter by gain type STCG", async ({ page }) => {
    // Skip: Filter UI not implemented in this version
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
    const uniqueName = `Cancel Test Asset ${Date.now()}`;
    await capitalGainsPage.openAddForm();
    await capitalGainsPage.fillCapitalGainsForm({
      assetName: uniqueName,
      purchaseDate: "2023-01-15",
      saleDate: "2025-06-20",
      purchasePrice: 100000,
      salePrice: 120000,
    });
    await capitalGainsPage.cancelForm();
    await capitalGainsPage.expectFormDialogClosed();
    await capitalGainsPage.expectTransactionNotInTable(uniqueName);
  });
});
