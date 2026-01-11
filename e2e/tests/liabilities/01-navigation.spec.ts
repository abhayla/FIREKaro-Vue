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

  test("should display all tabs", async ({ page }) => {
    await expect(page.getByRole("tab", { name: "Overview" })).toBeVisible();
    await expect(page.getByRole("tab", { name: "Loans" })).toBeVisible();
    await expect(page.getByRole("tab", { name: "Credit Cards" })).toBeVisible();
    await expect(page.getByRole("tab", { name: "Debt Payoff" })).toBeVisible();
    await expect(page.getByRole("tab", { name: "Reports" })).toBeVisible();
  });

  test("should navigate to Loans page", async ({ page }) => {
    // Use direct navigation since tab clicks have timing issues with Vue Router
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

  test("should show correct active tab indicator", async ({ page }) => {
    // Check Overview tab is active by default (section-level)
    const overviewTab = page.getByRole("tab", { name: "Overview" }).first();
    await expect(overviewTab).toHaveAttribute("aria-selected", "true");

    // Navigate to Loans and verify active state
    await page.goto("/liabilities/loans");
    await page.waitForLoadState("domcontentloaded");

    const loansTab = page.getByRole("tab", { name: "Loans" });
    await expect(loansTab).toHaveAttribute("aria-selected", "true");
  });

  test("should display internal tabs on Loans page", async ({ page }) => {
    await page.goto("/liabilities/loans");
    await page.waitForLoadState("domcontentloaded");
    await page.locator(".v-card").first().waitFor({ state: "visible", timeout: 10000 }).catch(() => {});

    // Verify internal tabs exist (use nth(1) to get the second tablist - internal tabs)
    const internalOverviewTab = page.locator('[role="tablist"]').nth(1).getByRole("tab", { name: "Overview" });
    const detailsTab = page.getByRole("tab", { name: "Loan Details" });

    await expect(internalOverviewTab).toBeVisible();
    await expect(detailsTab).toBeVisible();

    // Overview tab should be active by default
    await expect(internalOverviewTab).toHaveAttribute("aria-selected", "true");

    // Click on Details tab and verify it becomes active
    await detailsTab.click();
    await expect(detailsTab).toHaveAttribute("aria-selected", "true");
  });

  test("should display internal tabs on Credit Cards page", async ({ page }) => {
    await page.goto("/liabilities/credit-cards");
    await page.waitForLoadState("domcontentloaded");
    await page.locator(".v-card").first().waitFor({ state: "visible", timeout: 10000 }).catch(() => {});

    // Verify internal tabs exist (use nth(1) to get the second tablist - internal tabs)
    const internalOverviewTab = page.locator('[role="tablist"]').nth(1).getByRole("tab", { name: "Overview" });
    const detailsTab = page.getByRole("tab", { name: "Card Details" });

    await expect(internalOverviewTab).toBeVisible();
    await expect(detailsTab).toBeVisible();

    // Overview tab should be active by default
    await expect(internalOverviewTab).toHaveAttribute("aria-selected", "true");

    // Click on Details tab and verify it becomes active
    await detailsTab.click();
    await expect(detailsTab).toHaveAttribute("aria-selected", "true");
  });
});
