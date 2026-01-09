import { Page, Locator, expect } from "@playwright/test";
import { BasePage } from "../base.page";

/**
 * Expenses Reports Page Object
 */
export class ExpensesReportsPage extends BasePage {
  readonly url = "/dashboard/expenses/reports";

  constructor(page: Page) {
    super(page);
  }

  // ============================================
  // Locators
  // ============================================

  get pageTitle(): Locator {
    return this.page.getByRole("heading", { name: /Expenses/i });
  }

  // Charts
  get categoryBreakdownChart(): Locator {
    return this.page.locator(".v-card").filter({ hasText: /Category/i }).locator("canvas, svg");
  }

  get trendChart(): Locator {
    return this.page.locator(".v-card").filter({ hasText: /Trend|Monthly/i }).locator("canvas, svg");
  }

  // Period filter
  get periodSelect(): Locator {
    return this.page.locator(".v-select").filter({ hasText: /Period/i });
  }

  // Export
  get exportButton(): Locator {
    return this.page.getByRole("button", { name: /Export|Download/i });
  }

  // ============================================
  // Navigation
  // ============================================

  async navigateTo() {
    await this.goto(this.url);
    await this.waitForPageLoad();
  }

  // ============================================
  // Assertions
  // ============================================

  async expectPageLoaded() {
    await expect(this.page.getByRole("heading", { name: /Expenses/i })).toBeVisible();
  }

  async expectCategoryChartVisible() {
    await expect(this.categoryBreakdownChart).toBeVisible();
  }

  async expectExportButtonVisible() {
    await expect(this.exportButton).toBeVisible();
  }
}
