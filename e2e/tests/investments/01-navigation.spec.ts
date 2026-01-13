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

  test("should display all investment types in sidebar navigation", async ({ page }) => {
    // Investments section should be expandable in sidebar
    // First expand the Investments section in sidebar
    const sidebar = page.locator(".v-navigation-drawer");
    await expect(sidebar).toBeVisible();

    // Look for Investments group in sidebar and expand it
    const investmentsGroup = sidebar.getByText("Investments").first();
    await expect(investmentsGroup).toBeVisible();

    // Click to expand if not already expanded
    await investmentsGroup.click();
    await page.waitForTimeout(300);

    // Check all investment sub-items are visible in sidebar
    await expect(sidebar.getByText("Portfolio")).toBeVisible();
    await expect(sidebar.getByText("Stocks")).toBeVisible();
    await expect(sidebar.getByText("Mutual Funds")).toBeVisible();
    await expect(sidebar.getByText("EPF")).toBeVisible();
    await expect(sidebar.getByText("PPF")).toBeVisible();
    await expect(sidebar.getByText("NPS")).toBeVisible();
    await expect(sidebar.getByText("ESOPs")).toBeVisible();
    await expect(sidebar.getByText("Property")).toBeVisible();
    await expect(sidebar.getByText("Reports")).toBeVisible();
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

  test("should highlight correct sidebar item when navigating", async ({ page }) => {
    // On investments page, the Investments section should be highlighted in sidebar
    const sidebar = page.locator(".v-navigation-drawer");

    // Navigate to Stocks page
    await page.goto("/investments/stocks");
    await page.waitForLoadState("domcontentloaded");
    await page.locator(".v-card").first().waitFor({ state: "visible", timeout: 10000 }).catch(() => {});

    // Stocks sidebar item should have active class
    const stocksItem = sidebar.locator(".v-list-item").filter({ hasText: "Stocks" });
    await expect(stocksItem).toHaveClass(/v-list-item--active/);
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
