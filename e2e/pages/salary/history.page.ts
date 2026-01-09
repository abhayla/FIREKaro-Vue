import { Page, Locator, expect } from "@playwright/test";
import { BasePage } from "../base.page";

/**
 * Page Object for Salary History page (/dashboard/salary/history)
 */
export class SalaryHistoryPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  // Navigation
  async navigateTo() {
    await this.goto("/dashboard/salary/history");
    await this.waitForTableLoad();
  }

  // Page elements
  get pageTitle(): Locator {
    return this.page.getByRole("heading", { name: "Salary" });
  }

  get addMonthButton(): Locator {
    return this.page.locator("[data-testid='btn-add-salary']");
  }

  get historyTable(): Locator {
    return this.page.locator("[data-testid='table-salary-history']");
  }

  get tableRows(): Locator {
    return this.historyTable.locator("tbody tr");
  }

  get emptyStateAlert(): Locator {
    return this.page.getByText("No salary history records found");
  }

  get totalsSection(): Locator {
    return this.page.locator("text=TOTALS").locator("..");
  }

  // Actions
  async clickAddMonth() {
    await this.addMonthButton.click();
    await this.page.waitForTimeout(300);
  }

  async getRowCount(): Promise<number> {
    const rows = await this.tableRows.all();
    // Filter out the "no data" row
    const dataRows = rows.filter(async (row) => {
      const text = await row.textContent();
      return !text?.includes("No salary history");
    });
    return dataRows.length;
  }

  async getRowByMonth(monthLabel: string): Promise<Locator> {
    // Wait for table to finish loading
    await this.waitForTableLoad();
    return this.historyTable.locator(`tr:has-text("${monthLabel}")`);
  }

  async clickEditOnRow(monthLabel: string) {
    const row = await this.getRowByMonth(monthLabel);
    // Wait for row to be visible
    await row.waitFor({ state: "visible", timeout: 10000 });
    // Use data-testid for edit button
    await row.locator("[data-testid='btn-edit-salary']").click();
    await this.page.waitForTimeout(300);
  }

  async clickDeleteOnRow(monthLabel: string) {
    const row = await this.getRowByMonth(monthLabel);
    // Wait for row to be visible
    await row.waitFor({ state: "visible", timeout: 10000 });
    // Use data-testid for delete button
    await row.locator("[data-testid='btn-delete-salary']").click();
    await this.page.waitForTimeout(300);
  }

  // Delete confirmation dialog
  get deleteDialog(): Locator {
    return this.page.locator(".v-dialog:has-text('Confirm Delete')");
  }

  async confirmDelete() {
    await this.deleteDialog.getByRole("button", { name: "Delete" }).click();
    await this.waitForSnackbar("deleted");
  }

  async cancelDelete() {
    await this.deleteDialog.getByRole("button", { name: "Cancel" }).click();
  }

  // Get table data
  async getTableData(): Promise<
    Array<{
      month: string;
      paidDays: string;
      gross: string;
      deductions: string;
      net: string;
      tds: string;
    }>
  > {
    const rows = await this.tableRows.all();
    const data = [];

    for (const row of rows) {
      const cells = await row.locator("td").all();
      if (cells.length >= 6) {
        data.push({
          month: (await cells[0].textContent()) || "",
          paidDays: (await cells[1].textContent()) || "",
          gross: (await cells[2].textContent()) || "",
          deductions: (await cells[3].textContent()) || "",
          net: (await cells[4].textContent()) || "",
          tds: (await cells[5].textContent()) || "",
        });
      }
    }

    return data;
  }

  // Get totals from footer
  async getTotals(): Promise<{
    days: string;
    gross: string;
    deductions: string;
    net: string;
    tds: string;
  }> {
    const totalsContainer = this.totalsSection;
    return {
      days:
        (await totalsContainer
          .locator("text=Days")
          .locator("..")
          .locator("div")
          .last()
          .textContent()) || "",
      gross:
        (await totalsContainer
          .locator("text=Gross")
          .locator("..")
          .locator("div")
          .last()
          .textContent()) || "",
      deductions:
        (await totalsContainer
          .locator("text=Deductions")
          .locator("..")
          .locator("div")
          .last()
          .textContent()) || "",
      net:
        (await totalsContainer
          .locator("text=Net")
          .locator("..")
          .locator("div")
          .last()
          .textContent()) || "",
      tds:
        (await totalsContainer
          .locator("text=TDS")
          .locator("..")
          .locator("div")
          .last()
          .textContent()) || "",
    };
  }

  // Assertions
  async expectRowCount(count: number) {
    await expect(this.tableRows).toHaveCount(count);
  }

  async expectEmptyState() {
    await expect(this.emptyStateAlert).toBeVisible();
  }

  async expectRowExists(monthLabel: string) {
    const row = await this.getRowByMonth(monthLabel);
    await expect(row).toBeVisible();
  }

  async expectRowNotExists(monthLabel: string) {
    const row = await this.getRowByMonth(monthLabel);
    await expect(row).not.toBeVisible();
  }
}
