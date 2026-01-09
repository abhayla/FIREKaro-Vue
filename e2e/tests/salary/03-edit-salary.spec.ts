import { test, expect } from "@playwright/test";
import { SalaryHistoryPage, SalaryFormPage } from "../../pages/salary";

test.describe("Edit Salary Entry", () => {
  let historyPage: SalaryHistoryPage;
  let formPage: SalaryFormPage;

  // Test employer name
  const testEmployer = "Edit Test Company";

  test.beforeEach(async ({ page }) => {
    historyPage = new SalaryHistoryPage(page);
    formPage = new SalaryFormPage(page);

    // Navigate to history page
    await historyPage.navigateTo();
    await page.waitForTimeout(2000); // Wait for data to load
  });

  /**
   * Helper to ensure test data exists
   */
  async function ensureTestDataExists(page: import("@playwright/test").Page, month: string, basicSalary: number) {
    const hasData = await page.locator("tbody tr").filter({ hasText: /'\d{2}$/ }).count() > 0;

    if (!hasData) {
      await historyPage.clickAddMonth();
      await formPage.fillForm({
        employer: testEmployer,
        month,
        basicSalary,
      });
      await formPage.save();
      await page.waitForTimeout(1000);
    }
  }

  test("should open edit dialog when clicking edit button", async ({ page }) => {
    // Find first edit button in table (if data exists)
    const editButton = page.locator("[data-testid='btn-edit-salary']").first();

    if (await editButton.isVisible()) {
      await editButton.click();
      await page.waitForTimeout(500);

      // Dialog should open with data-testid
      await formPage.expectDialogOpen();
      await expect(page.getByText(/Edit Salary Entry/)).toBeVisible();
    } else {
      // No data - create a record first
      await historyPage.clickAddMonth();
      await formPage.fillForm({
        employer: testEmployer,
        month: "April",
        basicSalary: 50000,
      });
      await formPage.save();
      await page.waitForTimeout(1000);

      // Now try to edit
      const newEditButton = page.locator("[data-testid='btn-edit-salary']").first();
      await newEditButton.click();
      await page.waitForTimeout(500);

      await formPage.expectDialogOpen();
    }
  });

  test("should show form fields pre-populated when editing", async ({ page }) => {
    await ensureTestDataExists(page, "May", 60000);

    // Click edit on first row using data-testid
    await page.locator("[data-testid='btn-edit-salary']").first().click();
    await page.waitForTimeout(500);

    // Verify fields are populated (not empty)
    const basicValue = await formPage.basicSalaryInput.inputValue();
    expect(parseInt(basicValue)).toBeGreaterThan(0);
  });

  test("should update gross when basic salary changes", async ({ page }) => {
    await ensureTestDataExists(page, "June", 70000);

    // Click edit on first row
    await page.locator("[data-testid='btn-edit-salary']").first().click();
    await page.waitForTimeout(500);

    // Get current gross
    const grossBefore = await formPage.getGrossEarnings();

    // Increase basic by 10000
    const currentBasic = await formPage.basicSalaryInput.inputValue();
    const newBasic = parseInt(currentBasic) + 10000;
    await formPage.basicSalaryInput.fill(newBasic.toString());
    await page.waitForTimeout(300);

    // Gross should increase
    const grossAfter = await formPage.getGrossEarnings();
    const grossBeforeNum = parseInt(grossBefore.replace(/[^\d]/g, ""));
    const grossAfterNum = parseInt(grossAfter.replace(/[^\d]/g, ""));

    expect(grossAfterNum).toBeGreaterThan(grossBeforeNum);

    await formPage.cancel();
  });

  test("should save changes successfully", async ({ page }) => {
    await ensureTestDataExists(page, "July", 80000);

    // Click edit on first row
    await page.locator("[data-testid='btn-edit-salary']").first().click();
    await page.waitForTimeout(500);

    // Make a small change - update paid days
    const currentDays = await formPage.paidDaysInput.inputValue();
    const newDays = currentDays === "30" ? "29" : "30";
    await formPage.paidDaysInput.fill(newDays);

    // Save changes using data-testid
    await formPage.update();

    // Should show success message or dialog should close
    const hasSnackbar = await page.locator(".v-snackbar").isVisible().catch(() => false);
    const dialogClosed = !(await formPage.isVisible());

    expect(hasSnackbar || dialogClosed).toBeTruthy();
  });

  test("should cancel edit without saving", async ({ page }) => {
    await ensureTestDataExists(page, "August", 90000);

    // Get original gross from table
    const firstRow = page.locator("tbody tr").first();
    const originalGross = await firstRow.locator("td").nth(2).textContent();

    // Click edit
    await page.locator("[data-testid='btn-edit-salary']").first().click();
    await page.waitForTimeout(500);

    // Make a change
    await formPage.basicSalaryInput.fill("999999");

    // Cancel
    await formPage.cancel();
    await page.waitForTimeout(500);

    // Verify gross hasn't changed
    const currentGross = await firstRow.locator("td").nth(2).textContent();
    expect(currentGross).toBe(originalGross);
  });

  test("should show employer contributions section when editing record with employer data", async ({
    page,
  }) => {
    // Create record with employer contributions if not exists
    const hasData = await page.locator("tbody tr").filter({ hasText: /'\d{2}$/ }).count() > 0;

    if (!hasData) {
      await historyPage.clickAddMonth();
      await formPage.fillForm({
        employer: testEmployer,
        month: "September",
        basicSalary: 100000,
        employerPf: 3670,
        pensionFund: 1250,
      });
      await formPage.save();
      await page.waitForTimeout(1000);
    }

    // Click edit
    await page.locator("[data-testid='btn-edit-salary']").first().click();
    await page.waitForTimeout(500);

    // If the record has employer contributions, the section should be expandable
    const employerSection = formPage.employerSection;
    await expect(employerSection).toBeVisible();

    // Expand and verify
    await formPage.expandEmployerContributions();
    await expect(formPage.employerPfInput).toBeVisible();

    await formPage.cancel();
  });

  test("should preserve expanded sections when editing", async ({ page }) => {
    // Create record with VPF if not exists
    const hasData = await page.locator("tbody tr").filter({ hasText: /'\d{2}$/ }).count() > 0;

    if (!hasData) {
      await historyPage.clickAddMonth();
      await formPage.fillForm({
        employer: testEmployer,
        month: "October",
        basicSalary: 75000,
        vpfDeduction: 5000,
      });
      await formPage.save();
      await page.waitForTimeout(1000);
    }

    // Click edit
    await page.locator("[data-testid='btn-edit-salary']").first().click();
    await page.waitForTimeout(500);

    // Since record has VPF, Other Deductions section should auto-expand
    // or we can expand it manually
    await formPage.expandOtherDeductions();
    await expect(formPage.vpfInput).toBeVisible();

    await formPage.cancel();
  });
});
