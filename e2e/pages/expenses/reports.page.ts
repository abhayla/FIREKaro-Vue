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

  get exportMenu(): Locator {
    return this.page.locator(".v-menu, .v-list").filter({ hasText: /PDF|Excel|CSV/i });
  }

  get exportPDFOption(): Locator {
    return this.page.getByRole("listitem").filter({ hasText: /PDF/i });
  }

  get exportExcelOption(): Locator {
    return this.page.getByRole("listitem").filter({ hasText: /Excel/i });
  }

  get exportCSVOption(): Locator {
    return this.page.getByRole("listitem").filter({ hasText: /CSV/i });
  }

  // ============================================
  // Navigation
  // ============================================

  async navigateTo() {
    await this.goto(this.url);
    await this.waitForPageLoad();
  }

  // ============================================
  // Export Actions
  // ============================================

  async openExportMenu() {
    await this.exportButton.click();
    await this.page.waitForTimeout(300);
  }

  async exportToPDF() {
    await this.openExportMenu();
    await this.exportPDFOption.click();
    await this.page.waitForTimeout(500);
  }

  async exportToExcel() {
    await this.openExportMenu();
    await this.exportExcelOption.click();
    await this.page.waitForTimeout(500);
  }

  async exportToCSV() {
    await this.openExportMenu();
    await this.exportCSVOption.click();
    await this.page.waitForTimeout(500);
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

  async expectExportMenuVisible() {
    await expect(this.exportMenu).toBeVisible();
  }

  async expectExportOptionsAvailable() {
    await this.openExportMenu();
    await expect(this.exportPDFOption).toBeVisible();
    await expect(this.exportExcelOption).toBeVisible();
    await expect(this.exportCSVOption).toBeVisible();
  }
}
