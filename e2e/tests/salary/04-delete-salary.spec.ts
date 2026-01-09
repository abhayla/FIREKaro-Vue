import { test, expect } from "@playwright/test";
import { SalaryHistoryPage, SalaryFormPage } from "../../pages/salary";

test.describe("Delete Salary Entry", () => {
  let historyPage: SalaryHistoryPage;
  // Use a unique month identifier to avoid conflicts with other tests
  const testMonthLabel = "Dec'22";
  const testFY = "2022-23";
  const testEmployer = "Delete Test Company";

  test.beforeEach(async ({ page }) => {
    historyPage = new SalaryHistoryPage(page);

    // Navigate and select FY 2022-23 (oldest available FY)
    await historyPage.navigateTo();
    await historyPage.selectFinancialYear(testFY);
    await page.waitForTimeout(1000);

    // Check if December already exists, if not add it
    const decRow = page.locator(`tr:has-text("${testMonthLabel}")`);
    const hasDecRow = await decRow.isVisible().catch(() => false);

    if (!hasDecRow) {
      // Add a test record to delete
      const formPage = new SalaryFormPage(page);
      await historyPage.clickAddMonth();
      await page.waitForTimeout(500);
      await formPage.fillForm({
        employer: testEmployer,
        month: "December",
        basicSalary: 50000,
        tdsDeduction: 5000,
      });
      await formPage.save();
      await page.waitForTimeout(1000);
    }
  });

  test("should show delete confirmation dialog", async ({ page }) => {
    await historyPage.clickDeleteOnRow(testMonthLabel);

    await expect(historyPage.deleteDialog).toBeVisible();
    await expect(page.getByText("Confirm Delete")).toBeVisible();
    await expect(
      page.getByText("Are you sure you want to delete")
    ).toBeVisible();
  });

  test("should cancel delete and keep record", async ({ page }) => {
    await historyPage.clickDeleteOnRow(testMonthLabel);
    await historyPage.cancelDelete();

    // Dialog should close
    await expect(historyPage.deleteDialog).not.toBeVisible();

    // Record should still exist
    await historyPage.expectRowExists(testMonthLabel);
  });

  test("should delete record after confirmation", async ({ page }) => {
    // Verify record exists
    await historyPage.expectRowExists(testMonthLabel);

    // Click delete
    await historyPage.clickDeleteOnRow(testMonthLabel);
    await historyPage.confirmDelete();

    // Wait for deletion to complete
    await page.waitForTimeout(1000);

    // Record should be removed
    await historyPage.expectRowNotExists(testMonthLabel);
  });

  test("should show delete success message", async ({ page }) => {
    await historyPage.clickDeleteOnRow(testMonthLabel);
    await historyPage.confirmDelete();

    await historyPage.waitForSnackbar("deleted");
  });

  test("should update totals after deletion", async ({ page }) => {
    // Get totals before deletion
    const totalsBefore = await historyPage.getTotals();

    await historyPage.clickDeleteOnRow(testMonthLabel);
    await historyPage.confirmDelete();
    await page.waitForTimeout(1000);

    // Totals should be different (less records)
    const totalsAfter = await historyPage.getTotals();

    // Days should decrease by 30
    expect(parseInt(totalsAfter.days.replace(/"/g, ""))).toBeLessThan(
      parseInt(totalsBefore.days.replace(/"/g, ""))
    );
  });
});
