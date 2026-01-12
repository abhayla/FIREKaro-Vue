import { test, expect } from "@playwright/test";
import {
  LiabilitiesOverviewPage,
  LoansPage,
  CreditCardsPage,
  DebtPayoffPage,
  LiabilitiesReportsPage,
} from "../../pages/liabilities";

test.describe("Liabilities Navigation", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/liabilities");
    await page.waitForLoadState("domcontentloaded");
    await page.locator(".v-card").first().waitFor({ state: "visible", timeout: 10000 }).catch(() => {});
  });

  test("should load liabilities overview page", async ({ page }) => {
    const overview = new LiabilitiesOverviewPage(page);
    await expect(overview.pageTitle).toBeVisible();
    await expect(page).toHaveURL(/\/liabilities$/);
  });

  test("should navigate to Loans page", async ({ page }) => {
    await page.goto("/liabilities/loans");
    await page.waitForLoadState("domcontentloaded");
    await page.locator(".v-card").first().waitFor({ state: "visible", timeout: 10000 }).catch(() => {});

    const loans = new LoansPage(page);
    await loans.expectPageLoaded();
  });

  test("should navigate to Credit Cards page", async ({ page }) => {
    await page.goto("/liabilities/credit-cards");
    await page.waitForLoadState("domcontentloaded");
    await page.locator(".v-card").first().waitFor({ state: "visible", timeout: 10000 }).catch(() => {});

    const creditCards = new CreditCardsPage(page);
    await creditCards.expectPageLoaded();
  });

  test("should navigate to Debt Payoff page", async ({ page }) => {
    await page.goto("/liabilities/debt-payoff");
    await page.waitForLoadState("domcontentloaded");
    await page.locator(".v-card").first().waitFor({ state: "visible", timeout: 10000 }).catch(() => {});

    const debtPayoff = new DebtPayoffPage(page);
    await debtPayoff.expectPageLoaded();
  });

  test("should navigate to Reports page", async ({ page }) => {
    await page.goto("/liabilities/reports");
    await page.waitForLoadState("domcontentloaded");
    await page.locator(".v-card").first().waitFor({ state: "visible", timeout: 10000 }).catch(() => {});

    const reports = new LiabilitiesReportsPage(page);
    await reports.expectPageLoaded();
  });

  test("should display internal tabs on Loans page", async ({ page }) => {
    await page.goto("/liabilities/loans");
    await page.waitForLoadState("domcontentloaded");
    await page.locator(".v-card").first().waitFor({ state: "visible", timeout: 10000 }).catch(() => {});

    // Verify internal tabs exist
    const overviewTab = page.getByRole("tab", { name: "Overview" });
    const detailsTab = page.getByRole("tab", { name: "Loan Details" });

    await expect(overviewTab).toBeVisible();
    await expect(detailsTab).toBeVisible();

    // Overview tab should be active by default
    await expect(overviewTab).toHaveAttribute("aria-selected", "true");

    // Click on Details tab and verify it becomes active
    await detailsTab.click();
    await expect(detailsTab).toHaveAttribute("aria-selected", "true");
  });

  test("should display internal tabs on Credit Cards page", async ({ page }) => {
    await page.goto("/liabilities/credit-cards");
    await page.waitForLoadState("domcontentloaded");
    await page.locator(".v-card").first().waitFor({ state: "visible", timeout: 10000 }).catch(() => {});

    // Verify internal tabs exist
    const overviewTab = page.getByRole("tab", { name: "Overview" });
    const detailsTab = page.getByRole("tab", { name: "Card Details" });

    await expect(overviewTab).toBeVisible();
    await expect(detailsTab).toBeVisible();

    // Overview tab should be active by default
    await expect(overviewTab).toHaveAttribute("aria-selected", "true");

    // Click on Details tab and verify it becomes active
    await detailsTab.click();
    await expect(detailsTab).toHaveAttribute("aria-selected", "true");
  });

  test("should display internal tabs on Debt Payoff page", async ({ page }) => {
    await page.goto("/liabilities/debt-payoff");
    await page.waitForLoadState("domcontentloaded");
    await page.locator(".v-card").first().waitFor({ state: "visible", timeout: 10000 }).catch(() => {});

    // Verify internal tabs exist
    const overviewTab = page.getByRole("tab", { name: "Overview" });
    const detailsTab = page.getByRole("tab", { name: "Details" });

    await expect(overviewTab).toBeVisible();
    await expect(detailsTab).toBeVisible();

    // Overview tab should be active by default
    await expect(overviewTab).toHaveAttribute("aria-selected", "true");

    // Click on Details tab and verify it becomes active
    await detailsTab.click();
    await expect(detailsTab).toHaveAttribute("aria-selected", "true");
  });

  test("should display report tabs on Reports page", async ({ page }) => {
    await page.goto("/liabilities/reports");
    await page.waitForLoadState("domcontentloaded");
    await page.locator(".v-card").first().waitFor({ state: "visible", timeout: 10000 }).catch(() => {});

    // Verify report type tabs exist
    await expect(page.getByRole("tab", { name: "Debt Summary" })).toBeVisible();
    await expect(page.getByRole("tab", { name: "Payment History" })).toBeVisible();
    await expect(page.getByRole("tab", { name: "Interest Analysis" })).toBeVisible();
    await expect(page.getByRole("tab", { name: "Tax Benefits" })).toBeVisible();
  });
});
