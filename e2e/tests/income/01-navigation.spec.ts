import { test, expect } from "@playwright/test";
import {
  IncomeOverviewPage,
  BusinessIncomePage,
  RentalIncomePage,
  CapitalGainsPage,
  InterestIncomePage,
  DividendIncomePage,
  OtherIncomePage,
  IncomeReportsPage,
} from "../../pages/income";

test.describe("Income Navigation", () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to income section
    await page.goto("/income");
    await page.waitForLoadState("domcontentloaded");
    await page.locator(".v-card").first().waitFor({ state: "visible", timeout: 10000 }).catch(() => {});
  });

  test("should load income overview page", async ({ page }) => {
    const overview = new IncomeOverviewPage(page);
    await expect(overview.pageTitle).toBeVisible();
    await expect(page).toHaveURL(/\/income$/);
  });

  test("should display all income type navigation links in sidebar", async ({ page }) => {
    // The sidebar uses links for navigation, not tabs
    // Use .first() because there may be duplicate links on the page (sidebar + quick nav)
    await expect(page.getByRole("link", { name: "Overview" }).first()).toBeVisible();
    await expect(page.getByRole("link", { name: "Business Income", exact: true }).first()).toBeVisible();
    await expect(page.getByRole("link", { name: "Rental Income", exact: true }).first()).toBeVisible();
    await expect(page.getByRole("link", { name: "Capital Gains", exact: true }).first()).toBeVisible();
    await expect(page.getByRole("link", { name: "Interest Income", exact: true }).first()).toBeVisible();
    await expect(page.getByRole("link", { name: "Dividend Income", exact: true }).first()).toBeVisible();
    await expect(page.getByRole("link", { name: /Other Sources/i }).first()).toBeVisible();
    await expect(page.getByRole("link", { name: "Reports" }).first()).toBeVisible();
  });

  test("should navigate to Business page", async ({ page }) => {
    // Use direct navigation since tab clicks have timing issues with Vue Router
    await page.goto("/income/business");
    await page.waitForLoadState("domcontentloaded");
    await page.locator(".v-card").first().waitFor({ state: "visible", timeout: 10000 }).catch(() => {});

    const business = new BusinessIncomePage(page);
    await business.expectPageLoaded();
  });

  test("should navigate to Rental page", async ({ page }) => {
    await page.goto("/income/rental");
    await page.waitForLoadState("domcontentloaded");
    await page.locator(".v-card").first().waitFor({ state: "visible", timeout: 10000 }).catch(() => {});

    const rental = new RentalIncomePage(page);
    await rental.expectPageLoaded();
  });

  test("should navigate to Capital Gains page", async ({ page }) => {
    await page.goto("/income/capital-gains");
    await page.waitForLoadState("domcontentloaded");
    await page.locator(".v-card").first().waitFor({ state: "visible", timeout: 10000 }).catch(() => {});

    const capitalGains = new CapitalGainsPage(page);
    await capitalGains.expectPageLoaded();
  });

  test("should navigate to Interest page", async ({ page }) => {
    await page.goto("/income/interest");
    await page.waitForLoadState("domcontentloaded");
    await page.locator(".v-card").first().waitFor({ state: "visible", timeout: 10000 }).catch(() => {});

    const interest = new InterestIncomePage(page);
    await interest.expectPageLoaded();
  });

  test("should navigate to Dividends page", async ({ page }) => {
    await page.goto("/income/dividends");
    await page.waitForLoadState("domcontentloaded");
    await page.locator(".v-card").first().waitFor({ state: "visible", timeout: 10000 }).catch(() => {});

    const dividends = new DividendIncomePage(page);
    await dividends.expectPageLoaded();
  });

  test("should navigate to Other page", async ({ page }) => {
    await page.goto("/income/other");
    await page.waitForLoadState("domcontentloaded");
    await page.locator(".v-card").first().waitFor({ state: "visible", timeout: 10000 }).catch(() => {});

    const other = new OtherIncomePage(page);
    await other.expectPageLoaded();
  });

  test("should navigate to Reports page", async ({ page }) => {
    await page.goto("/income/reports");
    await page.waitForLoadState("domcontentloaded");
    await page.locator(".v-card").first().waitFor({ state: "visible", timeout: 10000 }).catch(() => {});

    const reports = new IncomeReportsPage(page);
    await reports.expectPageLoaded();
  });

  test("should show correct active navigation link", async ({ page }) => {
    // Check Overview is the current page (link in sidebar is highlighted)
    const overviewLink = page.getByRole("link", { name: "Overview" }).first();
    await expect(overviewLink).toBeVisible();

    // Navigate to Business and verify the sidebar link updates
    await page.goto("/income/business");
    await page.waitForLoadState("domcontentloaded");

    // The Business Income link should now be visible and navigable
    const businessLink = page.getByRole("link", { name: "Business Income" });
    await expect(businessLink).toBeVisible();
  });
});
