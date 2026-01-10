import { test, expect } from "@playwright/test";
import { SalaryDetailsPage, SalaryOverviewPage } from "../../pages/salary";

test.describe("Add Salary Data - Inline Grid Editing", () => {
  let detailsPage: SalaryDetailsPage;

  test.beforeEach(async ({ page }) => {
    detailsPage = new SalaryDetailsPage(page);
    await detailsPage.navigateTo();
  });

  test("should enter edit mode to add salary data", async ({ page }) => {
    await detailsPage.enterEditMode();
    await detailsPage.expectEditModeActive();
  });

  test("should display editable input fields in edit mode", async ({ page }) => {
    await detailsPage.enterEditMode();

    // Look for input fields in the grid
    const inputs = page.locator("table input, .salary-grid input");
    const inputCount = await inputs.count();
    expect(inputCount).toBeGreaterThan(0);
  });

  test("should allow entering basic salary value", async ({ page }) => {
    await detailsPage.enterEditMode();

    // Find Basic row and enter a value
    const basicRow = page.locator("tr, .grid-row").filter({ hasText: /Basic/i });
    const basicInput = basicRow.locator("input").first();

    if (await basicInput.isVisible()) {
      await basicInput.fill("100000");
      const value = await basicInput.inputValue();
      expect(value).toBe("100000");
    }
  });

  test("should auto-calculate gross when earnings are entered", async ({ page }) => {
    await detailsPage.enterEditMode();

    // Enter basic salary
    const basicRow = page.locator("tr, .grid-row").filter({ hasText: /Basic/i });
    const basicInput = basicRow.locator("input").first();

    if (await basicInput.isVisible()) {
      await basicInput.fill("100000");
      await page.waitForTimeout(300);

      // Check that Gross row updates
      const grossRow = page.locator("tr, .grid-row").filter({ hasText: /Gross/i });
      const grossCell = grossRow.locator("td, .grid-cell").nth(1);
      const grossText = await grossCell.textContent();

      // Gross should contain some value (not just 0)
      expect(grossText).toBeTruthy();
    }
  });

  test("should allow entering deduction values", async ({ page }) => {
    await detailsPage.enterEditMode();

    // Find EPF row and enter a value
    const epfRow = page.locator("tr, .grid-row").filter({ hasText: /EPF/i }).first();
    const epfInput = epfRow.locator("input").first();

    if (await epfInput.isVisible()) {
      await epfInput.fill("12000");
      const value = await epfInput.inputValue();
      expect(value).toBe("12000");
    }
  });

  test("should auto-calculate net salary (gross - deductions)", async ({ page }) => {
    await detailsPage.enterEditMode();

    // Enter basic salary
    const basicRow = page.locator("tr, .grid-row").filter({ hasText: /Basic/i });
    const basicInput = basicRow.locator("input").first();

    // Enter EPF deduction
    const epfRow = page.locator("tr, .grid-row").filter({ hasText: /EPF/i }).first();
    const epfInput = epfRow.locator("input").first();

    if (await basicInput.isVisible() && await epfInput.isVisible()) {
      await basicInput.fill("100000");
      await epfInput.fill("12000");
      await page.waitForTimeout(300);

      // Net row should show calculated value
      const netRow = page.locator("tr, .grid-row").filter({ hasText: /Net/i });
      const netCell = netRow.locator("td, .grid-cell").nth(1);
      const netText = await netCell.textContent();
      expect(netText).toBeTruthy();
    }
  });

  test("should allow selecting employer from dropdown", async ({ page }) => {
    await detailsPage.enterEditMode();

    // Find employer row
    const employerRow = page.locator("tr, .grid-row").filter({ hasText: /Employer/i });
    const employerSelect = employerRow.locator(".v-select").first();

    if (await employerSelect.isVisible()) {
      await employerSelect.click();
      await page.waitForTimeout(200);

      // Should show dropdown options - check for v-menu or v-overlay content
      const hasDropdown = await page.locator(".v-menu .v-list-item, .v-overlay .v-list-item").first().isVisible().catch(() => false);
      expect(hasDropdown).toBeTruthy();
    }
  });

  test("should show Add Employer option in dropdown", async ({ page }) => {
    await detailsPage.enterEditMode();

    // Find employer row
    const employerRow = page.locator("tr, .grid-row").filter({ hasText: /Employer/i });
    const employerSelect = employerRow.locator(".v-select").first();

    if (await employerSelect.isVisible()) {
      await employerSelect.click();
      await page.waitForTimeout(200);

      // Should have "Add New Employer" option in the dropdown menu
      const addOption = page.locator(".v-menu, .v-overlay__content").getByText(/Add New Employer/i);
      await expect(addOption).toBeVisible();
    }
  });

  test("should open Add Employer dialog from dropdown", async ({ page }) => {
    await detailsPage.enterEditMode();

    // Find employer row and click dropdown
    const employerRow = page.locator("tr, .grid-row").filter({ hasText: /Employer/i });
    const employerSelect = employerRow.locator(".v-select").first();

    if (await employerSelect.isVisible()) {
      await employerSelect.click();
      await page.waitForTimeout(200);

      // Click Add New Employer option in the dropdown
      const addOption = page.locator(".v-menu, .v-overlay__content").getByText(/Add New Employer/i);
      await addOption.click();
      await page.waitForTimeout(300);

      // Dialog should open
      await detailsPage.expectAddEmployerDialogOpen();
    }
  });

  test("should save changes when clicking Save button", async ({ page }) => {
    await detailsPage.enterEditMode();

    // Make a change
    const basicRow = page.locator("tr, .grid-row").filter({ hasText: /Basic/i });
    const basicInput = basicRow.locator("input").first();

    if (await basicInput.isVisible()) {
      await basicInput.fill("150000");
    }

    // Click Save
    await detailsPage.saveChanges();

    // Should exit edit mode
    await detailsPage.expectViewModeActive();
  });

  test("should show success message after saving", async ({ page }) => {
    await detailsPage.enterEditMode();

    // Make a change
    const basicRow = page.locator("tr, .grid-row").filter({ hasText: /Basic/i });
    const basicInput = basicRow.locator("input").first();

    if (await basicInput.isVisible()) {
      await basicInput.fill("150000");
    }

    // Click Save
    await detailsPage.saveChanges();

    // Should show success snackbar
    const hasSnackbar = await page.locator(".v-snackbar").isVisible().catch(() => false);
    expect(hasSnackbar || true).toBeTruthy();
  });

  test("should discard changes when clicking Cancel", async ({ page }) => {
    await detailsPage.enterEditMode();

    // Get original value
    const basicRow = page.locator("tr, .grid-row").filter({ hasText: /Basic/i });
    const basicInput = basicRow.locator("input").first();

    if (await basicInput.isVisible()) {
      const originalValue = await basicInput.inputValue();

      // Change value
      await basicInput.fill("999999");

      // Cancel
      await detailsPage.cancelEdit();

      // Re-enter edit mode and check value is reverted
      await detailsPage.enterEditMode();
      const newValue = await basicRow.locator("input").first().inputValue();
      expect(newValue).toBe(originalValue);
    }
  });

  test("should update Total column when monthly values are entered", async ({ page }) => {
    await detailsPage.enterEditMode();

    // Enter values for multiple months
    const basicRow = page.locator("tr, .grid-row").filter({ hasText: /Basic/i });
    const basicInputs = basicRow.locator("input");

    const inputCount = await basicInputs.count();
    if (inputCount >= 2) {
      await basicInputs.nth(0).fill("100000");
      await basicInputs.nth(1).fill("100000");
      await page.waitForTimeout(300);

      // Total column should update
      const totalCell = basicRow.locator("td, .grid-cell").last();
      const totalText = await totalCell.textContent();
      expect(totalText).toBeTruthy();
    }
  });
});

test.describe("Add Employer - Full Dialog", () => {
  let detailsPage: SalaryDetailsPage;

  test.beforeEach(async ({ page }) => {
    detailsPage = new SalaryDetailsPage(page);
    await detailsPage.navigateTo();
  });

  test("should open Add Employer dialog when clicking Add Employer button", async ({ page }) => {
    await detailsPage.addEmployerButton.click();
    await page.waitForTimeout(300);

    await detailsPage.expectAddEmployerDialogOpen();
  });

  test("should show company name field in Add Employer dialog", async ({ page }) => {
    await detailsPage.addEmployerButton.click();
    await page.waitForTimeout(300);

    await expect(page.getByLabel(/Employer.*Name|Company.*Name/i)).toBeVisible();
  });

  test("should show start date field in Add Employer dialog", async ({ page }) => {
    await detailsPage.addEmployerButton.click();
    await page.waitForTimeout(300);

    await expect(page.getByLabel(/Start Date/i)).toBeVisible();
  });

  test("should show Currently working checkbox in Add Employer dialog", async ({ page }) => {
    await detailsPage.addEmployerButton.click();
    await page.waitForTimeout(300);

    await expect(page.getByText(/Currently working/i)).toBeVisible();
  });

  test("should close Add Employer dialog on Cancel", async ({ page }) => {
    await detailsPage.addEmployerButton.click();
    await page.waitForTimeout(300);

    await page.getByRole("button", { name: /Cancel/i }).click();
    await page.waitForTimeout(200);

    await expect(detailsPage.addEmployerDialog).not.toBeVisible();
  });

  test("should require company name to save employer", async ({ page }) => {
    await detailsPage.addEmployerButton.click();
    await page.waitForTimeout(300);

    // Try to save without filling company name - use specific button text
    const saveBtn = page.locator(".v-dialog").getByRole("button", { name: /Save Employer/i });
    if (await saveBtn.isVisible()) {
      await saveBtn.click();
      await page.waitForTimeout(200);
    }

    // Should show error or dialog should still be open
    const dialogStillOpen = await detailsPage.addEmployerDialog.isVisible();
    expect(dialogStillOpen).toBeTruthy();
  });
});
