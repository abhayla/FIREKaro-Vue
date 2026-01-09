import { Page, Locator, expect } from "@playwright/test";
import { BasePage } from "../base.page";

/**
 * Expenses Overview Page Object
 */
export class ExpensesOverviewPage extends BasePage {
  readonly url = "/dashboard/expenses";

  constructor(page: Page) {
    super(page);
  }

  // ============================================
  // Locators
  // ============================================

  get pageTitle(): Locator {
    return this.page.getByRole("heading", { name: /Expenses/i });
  }

  // Tabs
  get overviewTab(): Locator {
    return this.page.getByRole("tab", { name: "Overview" });
  }

  get trackTab(): Locator {
    return this.page.getByRole("tab", { name: /Track|Add/i });
  }

  get budgetsTab(): Locator {
    return this.page.getByRole("tab", { name: /Budgets/i });
  }

  get categoriesTab(): Locator {
    return this.page.getByRole("tab", { name: /Categories/i });
  }

  get reportsTab(): Locator {
    return this.page.getByRole("tab", { name: /Reports/i });
  }

  // Summary cards
  get totalSpentCard(): Locator {
    return this.getSummaryCardByTitle("Total Spent");
  }

  get budgetRemainingCard(): Locator {
    return this.getSummaryCardByTitle("Remaining");
  }

  get savingsRateCard(): Locator {
    return this.getSummaryCardByTitle("Savings Rate");
  }

  // ============================================
  // Navigation
  // ============================================

  async navigateTo() {
    await this.goto(this.url);
    await this.waitForPageLoad();
  }

  // ============================================
  // Getters
  // ============================================

  async getTotalSpent(): Promise<string> {
    return await this.getSummaryCardValue("Total Spent");
  }

  // ============================================
  // Assertions
  // ============================================

  async expectPageLoaded() {
    await expect(this.pageTitle).toBeVisible();
    await expect(this.overviewTab).toHaveAttribute("aria-selected", "true");
  }
}
