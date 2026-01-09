import { test, expect } from "@playwright/test";
import { ExpensesReportsPage } from "../../pages/expenses";

test.describe("Expenses Reports", () => {
  let reportsPage: ExpensesReportsPage;

  test.beforeEach(async ({ page }) => {
    reportsPage = new ExpensesReportsPage(page);
    await reportsPage.navigateTo();
  });

  test("should display reports page correctly", async ({ page }) => {
    await reportsPage.expectPageLoaded();
  });

  test("should show category breakdown chart", async ({ page }) => {
    await reportsPage.expectCategoryChartVisible();
  });

  test("should have export button visible", async ({ page }) => {
    await reportsPage.expectExportButtonVisible();
  });

  test("should show expense trend chart", async ({ page }) => {
    await expect(reportsPage.trendChart).toBeVisible();
  });

  test("should allow period selection", async ({ page }) => {
    await expect(reportsPage.periodSelect).toBeVisible();
  });
});
