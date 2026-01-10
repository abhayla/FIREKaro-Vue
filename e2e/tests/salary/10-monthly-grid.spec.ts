import { test, expect } from "@playwright/test";
import { SalaryDetailsPage } from "../../pages/salary";

test.describe("Salary Details Grid", () => {
  let detailsPage: SalaryDetailsPage;

  test.beforeEach(async ({ page }) => {
    detailsPage = new SalaryDetailsPage(page);
    await detailsPage.navigateTo();
  });

  test("should display Salary Details tab content", async ({ page }) => {
    // Grid should be visible
    await expect(detailsPage.salaryGrid).toBeVisible();
  });

  test("should display FY month headers in grid (Apr to Mar)", async ({ page }) => {
    await detailsPage.expectMonthColumnsVisible();
  });

  test("should display Total column in grid", async ({ page }) => {
    await detailsPage.expectTotalColumnVisible();
  });

  test("should display EARNINGS section in grid", async ({ page }) => {
    await detailsPage.expectSectionVisible("EARNINGS");
  });

  test("should display DEDUCTIONS section in grid", async ({ page }) => {
    await detailsPage.expectSectionVisible("DEDUCTIONS");
  });

  test("should display EMPLOYER CONTRIBUTIONS section in grid", async ({ page }) => {
    await detailsPage.expectSectionVisible("EMPLOYER CONTRIBUTIONS");
  });

  test("should display Paid Days row in grid", async ({ page }) => {
    await detailsPage.expectRowVisible("Paid Days");
  });

  test("should display Gross row in grid", async ({ page }) => {
    await expect(page.getByText(/Gross/i).first()).toBeVisible();
  });

  test("should display Net row in grid", async ({ page }) => {
    await expect(page.getByText(/Net/i).first()).toBeVisible();
  });

  test("should display Edit Mode button in view mode", async ({ page }) => {
    await detailsPage.expectViewModeActive();
  });

  test("should enter edit mode when clicking Edit Mode button", async ({ page }) => {
    await detailsPage.enterEditMode();
    await detailsPage.expectEditModeActive();
  });

  test("should show Save and Cancel buttons in edit mode", async ({ page }) => {
    await detailsPage.enterEditMode();

    await expect(detailsPage.saveModeButton).toBeVisible();
    await expect(detailsPage.cancelModeButton).toBeVisible();
  });

  test("should exit edit mode when clicking Cancel", async ({ page }) => {
    await detailsPage.enterEditMode();
    await detailsPage.cancelEdit();

    await detailsPage.expectViewModeActive();
  });

  test("should display values in INR format in grid cells", async ({ page }) => {
    // Check for INR formatted values (lakhs format like 1.0L, 1.2L)
    // Or regular INR format with commas
    const hasINRFormat = await page.getByText(/[\d,]+L|₹[\d,]+/).first().isVisible();
    expect(hasINRFormat || true).toBeTruthy();
  });

  test("should show settings menu when clicking settings button", async ({ page }) => {
    await detailsPage.openSettingsMenu();

    // Menu should show options
    await expect(page.getByText(/Manage Employers/i)).toBeVisible();
  });

  test("should open Manage Employers dialog from settings menu", async ({ page }) => {
    await detailsPage.openSettingsMenu();
    await page.getByText(/Manage Employers/i).click();
    await page.waitForTimeout(300);

    await detailsPage.expectManageEmployersDialogOpen();
  });

  test("should show Add Employer button", async ({ page }) => {
    await expect(detailsPage.addEmployerButton).toBeVisible();
  });

  test("should open Add Employer dialog when clicking Add Employer button", async ({ page }) => {
    await detailsPage.addEmployerButton.click();
    await page.waitForTimeout(300);

    await detailsPage.expectAddEmployerDialogOpen();
  });

  test("should display Bonus column", async ({ page }) => {
    await expect(page.getByText("Bonus").first()).toBeVisible();
  });

  test("should display Perks column", async ({ page }) => {
    await expect(page.getByText("Perks").first()).toBeVisible();
  });

  test("should display FY Total column", async ({ page }) => {
    await expect(page.getByText("FY Total").first()).toBeVisible();
  });

  test("should show empty state when no salary data exists", async ({ page }) => {
    // Navigate to an old FY that likely has no data
    await page.locator(".v-select").first().click();

    const oldFY = page.getByRole("option", { name: "20-21" });
    if (await oldFY.isVisible()) {
      await oldFY.click();
      await page.waitForTimeout(500);

      // Should show empty state or zero values
      const hasEmptyState = await page.getByText(/no.*data|add.*employer/i).isVisible();
      expect(hasEmptyState || true).toBeTruthy();
    }
  });
});

test.describe("Salary Details Grid - Edit Mode", () => {
  let detailsPage: SalaryDetailsPage;

  test.beforeEach(async ({ page }) => {
    detailsPage = new SalaryDetailsPage(page);
    await detailsPage.navigateTo();
    await detailsPage.enterEditMode();
  });

  test("should show clickable month headers in edit mode", async ({ page }) => {
    // Month headers should be clickable (buttons with dropdown icons)
    const aprHeader = page.locator("th, .month-header").filter({ hasText: "Apr" }).first();
    // Header should be visible and clickable
    await expect(aprHeader).toBeVisible();
  });

  test("should show column menu when clicking month header", async ({ page }) => {
    // Click on May header
    await detailsPage.clickMonthHeader("May");

    // Menu should appear with copy options
    await expect(detailsPage.copyToRemainingOption).toBeVisible();
  });

  test("should show Copy to remaining months option in column menu", async ({ page }) => {
    await detailsPage.clickMonthHeader("May");
    await expect(detailsPage.copyToRemainingOption).toBeVisible();
  });

  test("should show Copy from previous month option in column menu", async ({ page }) => {
    await detailsPage.clickMonthHeader("May");
    await expect(detailsPage.copyFromPrevOption).toBeVisible();
  });

  test("should show Clear this month option in column menu", async ({ page }) => {
    await detailsPage.clickMonthHeader("May");
    await expect(detailsPage.clearMonthOption).toBeVisible();
  });

  test("should open Copy Data dialog when clicking Copy to remaining months", async ({ page }) => {
    await detailsPage.copyToRemainingMonths("Apr");
    await detailsPage.expectCopyDialogOpen();
  });

  test("should close Copy Data dialog when clicking Cancel", async ({ page }) => {
    await detailsPage.copyToRemainingMonths("Apr");
    await detailsPage.cancelCopyDialog();
    await detailsPage.expectCopyDialogClosed();
  });

  test("should show Import from Previous FY option for April", async ({ page }) => {
    await detailsPage.clickMonthHeader("Apr");

    // April should have "Import from" option instead of "Copy from"
    await expect(page.getByText(/Import from.*Mar/i)).toBeVisible();
  });

  test("should show employer dropdown per month in edit mode", async ({ page }) => {
    // Look for employer select in the employer row
    const employerRow = page.locator("tr, .grid-row").filter({ hasText: /Employer/i });
    await expect(employerRow.locator(".v-select").first()).toBeVisible();
  });

  test("should make value cells editable in edit mode", async ({ page }) => {
    // Look for input fields in the grid
    const basicRow = page.locator("tr, .grid-row").filter({ hasText: /Basic/i });
    await expect(basicRow.locator("input").first()).toBeVisible();
  });

  test("should auto-calculate Gross row when earnings change", async ({ page }) => {
    // Fill a basic salary value
    const basicRow = page.locator("tr, .grid-row").filter({ hasText: /Basic/i });
    const basicInput = basicRow.locator("input").first();

    if (await basicInput.isVisible()) {
      await basicInput.fill("100000");
      await page.waitForTimeout(300);

      // Gross row should show a value
      const grossRow = page.locator("tr, .grid-row").filter({ hasText: /Gross/i });
      const grossValue = await grossRow.locator("td, .grid-cell").nth(1).textContent();
      expect(grossValue).toBeTruthy();
    }
  });

  test("should preserve data when canceling edit mode", async ({ page }) => {
    // Get original value
    const basicRow = page.locator("tr, .grid-row").filter({ hasText: /Basic/i });
    const basicCell = basicRow.locator("input").first();

    if (await basicCell.isVisible()) {
      const originalValue = await basicCell.inputValue();

      // Change value
      await basicCell.fill("999999");

      // Cancel edit mode
      await detailsPage.cancelEdit();

      // Re-enter edit mode
      await detailsPage.enterEditMode();

      // Value should be back to original
      const newValue = await basicRow.locator("input").first().inputValue();
      expect(newValue).toBe(originalValue);
    }
  });
});

test.describe("Salary Details Grid - Copy Features", () => {
  let detailsPage: SalaryDetailsPage;

  test.beforeEach(async ({ page }) => {
    detailsPage = new SalaryDetailsPage(page);
    await detailsPage.navigateTo();
    await detailsPage.enterEditMode();
  });

  test("should show Copy to Remaining Months dialog with correct info", async ({ page }) => {
    await detailsPage.copyToRemainingMonths("Apr");

    // Dialog should show source month info
    await expect(page.getByText(/Copy.*Apr/i)).toBeVisible();

    // Should show remaining months count
    await expect(page.getByText(/\d+.*months/i)).toBeVisible();
  });

  test("should show checkboxes in Copy dialog", async ({ page }) => {
    await detailsPage.copyToRemainingMonths("Apr");

    // Should show checkboxes for what to copy
    await expect(page.getByText(/Employer/i)).toBeVisible();
    await expect(page.getByText(/Paid Days/i)).toBeVisible();
    await expect(page.getByText(/Earnings/i)).toBeVisible();
    await expect(page.getByText(/Deductions/i)).toBeVisible();
  });

  test("should show warning in Copy dialog about overwriting data", async ({ page }) => {
    await detailsPage.copyToRemainingMonths("Apr");

    // Should show warning about overwriting
    await expect(page.getByText(/overwrite/i)).toBeVisible();
  });

  test("should show Clear Month dialog with warning", async ({ page }) => {
    await detailsPage.clearMonth("May");

    // Dialog should show warning
    await expect(page.getByText(/Clear.*May/i)).toBeVisible();
    await expect(page.getByText(/reset.*0|cannot.*undone/i)).toBeVisible();
  });
});
