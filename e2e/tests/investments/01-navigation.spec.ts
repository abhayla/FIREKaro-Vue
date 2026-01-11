import { test, expect } from "@playwright/test";
import {
  InvestmentsOverviewPage,
  StocksPage,
  MutualFundsPage,
  EpfPage,
  PpfPage,
  NpsPage,
  PropertyPage,
  InvestmentReportsPage,
  PortfolioPage,
} from "../../pages/investments";

test.describe("Investments Navigation", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/investments");
    await page.waitForLoadState("domcontentloaded");
    await page.locator(".v-card").first().waitFor({ state: "visible", timeout: 10000 }).catch(() => {});
  });

  test("should load investments overview page", async ({ page }) => {
    const overview = new InvestmentsOverviewPage(page);
    await expect(overview.pageTitle).toBeVisible();
    // Investments is at top-level /investments route (not under /dashboard)
    await expect(page).toHaveURL(/\/investments$/);
  });

  test("should display all investment type tabs", async ({ page }) => {
    // Note: The index page is called "Portfolio", not "Overview"
    await expect(page.getByRole("tab", { name: "Portfolio" })).toBeVisible();
    await expect(page.getByRole("tab", { name: "Stocks" })).toBeVisible();
    await expect(page.getByRole("tab", { name: "Mutual Funds" })).toBeVisible();
    await expect(page.getByRole("tab", { name: "EPF" })).toBeVisible();
    await expect(page.getByRole("tab", { name: "PPF" })).toBeVisible();
    await expect(page.getByRole("tab", { name: "NPS" })).toBeVisible();
    await expect(page.getByRole("tab", { name: "ESOPs" })).toBeVisible();
    await expect(page.getByRole("tab", { name: "Property" })).toBeVisible();
    await expect(page.getByRole("tab", { name: "Reports" })).toBeVisible();
  });

  test("should navigate to Stocks page", async ({ page }) => {
    await page.goto("/investments/stocks");
    await page.waitForLoadState("domcontentloaded");
    await page.locator(".v-card").first().waitFor({ state: "visible", timeout: 10000 }).catch(() => {});

    const stocks = new StocksPage(page);
    await stocks.expectPageLoaded();
  });

  test("should navigate to Mutual Funds page", async ({ page }) => {
    await page.goto("/investments/mutual-funds");
    await page.waitForLoadState("domcontentloaded");
    await page.locator(".v-card").first().waitFor({ state: "visible", timeout: 10000 }).catch(() => {});

    const mf = new MutualFundsPage(page);
    await mf.expectPageLoaded();
  });

  test("should navigate to EPF page", async ({ page }) => {
    await page.goto("/investments/epf");
    await page.waitForLoadState("domcontentloaded");
    await page.locator(".v-card").first().waitFor({ state: "visible", timeout: 10000 }).catch(() => {});

    const epf = new EpfPage(page);
    await epf.expectPageLoaded();
  });

  test("should navigate to PPF page", async ({ page }) => {
    await page.goto("/investments/ppf");
    await page.waitForLoadState("domcontentloaded");
    await page.locator(".v-card").first().waitFor({ state: "visible", timeout: 10000 }).catch(() => {});

    const ppf = new PpfPage(page);
    await ppf.expectPageLoaded();
  });

  test("should redirect old EPF-PPF URL to EPF", async ({ page }) => {
    await page.goto("/investments/epf-ppf");
    await page.waitForLoadState("domcontentloaded");

    // Should redirect to EPF page
    await expect(page).toHaveURL(/\/investments\/epf$/);
  });

  test("should navigate to NPS page", async ({ page }) => {
    await page.goto("/investments/nps");
    await page.waitForLoadState("domcontentloaded");
    await page.locator(".v-card").first().waitFor({ state: "visible", timeout: 10000 }).catch(() => {});

    const nps = new NpsPage(page);
    await nps.expectPageLoaded();
  });

  test("should navigate to Property page", async ({ page }) => {
    await page.goto("/investments/property");
    await page.waitForLoadState("domcontentloaded");
    await page.locator(".v-card").first().waitFor({ state: "visible", timeout: 10000 }).catch(() => {});

    const property = new PropertyPage(page);
    await property.expectPageLoaded();
  });

  test("should navigate to Reports page", async ({ page }) => {
    await page.goto("/investments/reports");
    await page.waitForLoadState("domcontentloaded");
    await page.locator(".v-card").first().waitFor({ state: "visible", timeout: 10000 }).catch(() => {});

    const reports = new InvestmentReportsPage(page);
    await reports.expectPageLoaded();
  });

  test("should show correct active tab indicator", async ({ page }) => {
    // Portfolio tab is active by default (it's the index page)
    const portfolioTab = page.getByRole("tab", { name: "Portfolio" });
    await expect(portfolioTab).toHaveAttribute("aria-selected", "true");

    // Navigate to Stocks and verify active state
    await page.goto("/investments/stocks");
    await page.waitForLoadState("domcontentloaded");

    const stocksTab = page.getByRole("tab", { name: "Stocks" });
    await expect(stocksTab).toHaveAttribute("aria-selected", "true");
    await expect(portfolioTab).toHaveAttribute("aria-selected", "false");
  });

  test("should show two-tab pattern on EPF page", async ({ page }) => {
    await page.goto("/investments/epf");
    await page.waitForLoadState("domcontentloaded");
    await page.locator(".v-card").first().waitFor({ state: "visible", timeout: 10000 }).catch(() => {});

    // Check for Overview and Item Details tabs
    await expect(page.getByRole("tab", { name: "Overview" })).toBeVisible();
    await expect(page.getByRole("tab", { name: "Item Details" })).toBeVisible();
  });

  test("should show two-tab pattern on PPF page", async ({ page }) => {
    await page.goto("/investments/ppf");
    await page.waitForLoadState("domcontentloaded");
    await page.locator(".v-card").first().waitFor({ state: "visible", timeout: 10000 }).catch(() => {});

    // Check for Overview and Item Details tabs
    await expect(page.getByRole("tab", { name: "Overview" })).toBeVisible();
    await expect(page.getByRole("tab", { name: "Item Details" })).toBeVisible();
  });

  test("should switch between Overview and Item Details tabs without URL change", async ({ page }) => {
    await page.goto("/investments/epf");
    await page.waitForLoadState("domcontentloaded");
    await page.locator(".v-card").first().waitFor({ state: "visible", timeout: 10000 }).catch(() => {});

    const currentUrl = page.url();

    // Click Item Details tab
    await page.getByRole("tab", { name: "Item Details" }).click();
    await page.waitForTimeout(300);

    // URL should not change
    await expect(page).toHaveURL(currentUrl);

    // Item Details tab should be active
    await expect(page.getByRole("tab", { name: "Item Details" })).toHaveAttribute("aria-selected", "true");

    // Click back to Overview
    await page.getByRole("tab", { name: "Overview" }).click();
    await page.waitForTimeout(300);

    // URL should still be the same
    await expect(page).toHaveURL(currentUrl);
  });
});
