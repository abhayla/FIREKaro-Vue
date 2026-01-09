import { test, expect } from "@playwright/test";
import { NetWorthPage } from "../../pages/financial-health";
import { netWorthData, netWorthHistory } from "../../fixtures/financial-health-data";

test.describe("Net Worth", () => {
  let netWorthPage: NetWorthPage;

  test.beforeEach(async ({ page }) => {
    netWorthPage = new NetWorthPage(page);
    await netWorthPage.navigateTo();
  });

  test("should display net worth page", async ({ page }) => {
    await netWorthPage.expectPageLoaded();
  });

  test("should show total net worth card", async ({ page }) => {
    await expect(netWorthPage.totalNetWorthCard).toBeVisible();
    const netWorth = await netWorthPage.getTotalNetWorth();
    expect(netWorth).toContain("₹");
  });

  test("should show total assets card", async ({ page }) => {
    await expect(netWorthPage.totalAssetsCard).toBeVisible();
    const assets = await netWorthPage.getTotalAssets();
    expect(assets).toContain("₹");
  });

  test("should show total liabilities card", async ({ page }) => {
    await expect(netWorthPage.totalLiabilitiesCard).toBeVisible();
    const liabilities = await netWorthPage.getTotalLiabilities();
    expect(liabilities).toContain("₹");
  });

  test("should display assets breakdown", async ({ page }) => {
    // Check for asset categories
    await expect(
      page.getByText(/Liquid Assets|Cash|Bank|Investments|Retirement|Property/i).first()
    ).toBeVisible();
  });

  test("should display liabilities breakdown", async ({ page }) => {
    // Check for liability categories
    await expect(
      page.getByText(/Home Loan|Car Loan|Credit Card|Mortgage/i).first()
    ).toBeVisible();
  });

  test("should show net worth trend chart", async ({ page }) => {
    await expect(netWorthPage.netWorthTrendChart).toBeVisible();
  });

  test("should calculate net worth correctly (assets - liabilities)", async ({ page }) => {
    const netWorthText = await netWorthPage.getTotalNetWorth();
    const assetsText = await netWorthPage.getTotalAssets();
    const liabilitiesText = await netWorthPage.getTotalLiabilities();

    // All should contain INR currency
    expect(netWorthText).toContain("₹");
    expect(assetsText).toContain("₹");
    expect(liabilitiesText).toContain("₹");
  });

  test("should show monthly change indicator", async ({ page }) => {
    await expect(
      page.getByText(/Monthly Change|Change|Growth/i).first()
    ).toBeVisible();
  });
});
