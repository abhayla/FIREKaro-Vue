import { test, expect } from "@playwright/test";
import { StocksPage } from "../../pages/investments";
import { stocksData, portfolioSummary } from "../../fixtures/investments-data";

test.describe("Stocks/Equity Holdings", () => {
  let stocksPage: StocksPage;

  test.beforeEach(async ({ page }) => {
    stocksPage = new StocksPage(page);
    await stocksPage.navigateTo();
  });

  test("should display stocks page correctly", async ({ page }) => {
    await stocksPage.expectPageLoaded();
    await expect(stocksPage.addStockButton).toBeVisible();
  });

  test("should show summary cards", async ({ page }) => {
    await expect(stocksPage.totalValueCard).toBeVisible();
    await expect(stocksPage.totalInvestedCard).toBeVisible();
    await expect(stocksPage.totalPnLCard).toBeVisible();
  });

  test("should open add stock form dialog", async ({ page }) => {
    await stocksPage.openAddForm();
    await stocksPage.expectFormDialogVisible();
    await expect(stocksPage.stockSymbolField).toBeVisible();
    await expect(stocksPage.quantityField).toBeVisible();
    await expect(stocksPage.buyPriceField).toBeVisible();
  });

  test("should add stock holding", async ({ page }) => {
    const testStock = stocksData[0]; // HDFC Bank

    await stocksPage.openAddForm();
    await stocksPage.fillStockForm({
      symbol: testStock.symbol,
      name: testStock.name,
      quantity: testStock.quantity,
      buyPrice: testStock.averagePrice,
    });

    await stocksPage.saveForm();
    await stocksPage.expectFormDialogClosed();
    await stocksPage.expectStockInTable(testStock.name);
  });

  test("should edit stock holding", async ({ page }) => {
    const testStock = stocksData[0];

    // First add the stock
    await stocksPage.openAddForm();
    await stocksPage.fillStockForm({
      symbol: testStock.symbol,
      name: testStock.name,
      quantity: testStock.quantity,
      buyPrice: testStock.averagePrice,
    });
    await stocksPage.saveForm();

    // Now edit it
    await stocksPage.editStock(testStock.name);
    await stocksPage.expectFormDialogVisible();

    const updatedQuantity = testStock.quantity + 50;
    await stocksPage.fillStockForm({
      quantity: updatedQuantity,
    });
    await stocksPage.saveForm();
    await stocksPage.expectFormDialogClosed();
  });

  test("should delete stock holding", async ({ page }) => {
    const testStock = stocksData[0];

    // First add the stock
    await stocksPage.openAddForm();
    await stocksPage.fillStockForm({
      symbol: testStock.symbol,
      name: testStock.name,
      quantity: testStock.quantity,
      buyPrice: testStock.averagePrice,
    });
    await stocksPage.saveForm();

    // Now delete it
    await stocksPage.deleteStock(testStock.name);
    await stocksPage.confirmDelete();
    await stocksPage.expectStockNotInTable(testStock.name);
  });

  test("should cancel form without saving", async ({ page }) => {
    await stocksPage.openAddForm();
    await stocksPage.fillStockForm({
      symbol: "TEST",
      name: "Test Stock",
      quantity: 100,
      buyPrice: 1000,
    });
    await stocksPage.cancelForm();
    await stocksPage.expectFormDialogClosed();
    await stocksPage.expectStockNotInTable("Test Stock");
  });
});
