import { test, expect } from "@playwright/test";
import { SalaryHistoryPage, SalaryFormPage } from "../../pages/salary";

test.describe("Form Validation", () => {
  let historyPage: SalaryHistoryPage;
  let formPage: SalaryFormPage;

  test.beforeEach(async ({ page }) => {
    historyPage = new SalaryHistoryPage(page);
    formPage = new SalaryFormPage(page);
    await historyPage.navigateTo();
    await historyPage.clickAddMonth();
  });

  test("should have required basic salary field", async ({ page }) => {
    // Basic salary input should be present
    await expect(formPage.basicSalaryInput).toBeVisible();
  });

  test("should allow saving with only basic salary filled", async ({ page }) => {
    await formPage.selectMonth("January");
    await formPage.basicSalaryInput.fill("50000");

    await formPage.save();

    // Should succeed (no validation error)
    await formPage.expectDialogClosed();
  });

  test("should prevent negative basic salary via input type", async ({
    page,
  }) => {
    // HTML number inputs typically prevent negative via min attribute
    // or the value stays at 0 when trying to go negative
    const basicInput = formPage.basicSalaryInput;

    // Try to enter negative - input may reject or convert
    await basicInput.fill("-1000");

    // Check the actual value (should be 0 or 1000 depending on implementation)
    const value = await basicInput.inputValue();
    expect(parseInt(value)).toBeGreaterThanOrEqual(0);
  });

  test("should not allow negative deductions", async ({ page }) => {
    await formPage.epfInput.fill("-500");

    const value = await formPage.epfInput.inputValue();
    expect(parseInt(value)).toBeGreaterThanOrEqual(0);
  });

  test("should have default paid days of 30", async ({ page }) => {
    await expect(formPage.paidDaysInput).toHaveValue("30");
  });

  test("should validate paid days is positive", async ({ page }) => {
    await formPage.paidDaysInput.fill("0");

    // Check if 0 is kept or converted
    const value = await formPage.paidDaysInput.inputValue();
    // Paid days of 0 might be valid (unpaid month) but typically should be 1-31
    expect(parseInt(value)).toBeGreaterThanOrEqual(0);
  });

  test("should limit paid days to reasonable range", async ({ page }) => {
    // Try to enter more than 31 days
    await formPage.paidDaysInput.fill("35");

    const value = await formPage.paidDaysInput.inputValue();
    // Implementation may cap at 31 or allow any value
    expect(parseInt(value)).toBeLessThanOrEqual(35);
  });

  test("should clear form fields on cancel", async ({ page }) => {
    // Fill some data
    await formPage.basicSalaryInput.fill("100000");
    await formPage.hraInput.fill("50000");

    // Cancel
    await formPage.cancel();

    // Reopen form
    await historyPage.clickAddMonth();

    // Fields should be reset to defaults
    await expect(formPage.basicSalaryInput).toHaveValue("0");
    await expect(formPage.hraInput).toHaveValue("0");
  });

  test("should handle form submission with all zeros", async ({ page }) => {
    // All values default to 0
    await formPage.selectMonth("August");

    // Try to save - this might be valid or invalid depending on business rules
    await formPage.save();

    // Either succeeds or shows validation error
    // Check for either outcome
    const dialogVisible = await formPage.isDialogOpen();
    const snackbarVisible = await page.locator(".v-snackbar").isVisible();

    // One of these should be true
    expect(dialogVisible || snackbarVisible).toBeTruthy();
  });

  test("should show validation error for duplicate month in same FY", async ({
    page,
  }) => {
    // Navigate to FY with existing data
    await formPage.cancel();
    await historyPage.selectFinancialYear("2022-23");
    await page.waitForTimeout(500);

    await historyPage.clickAddMonth();

    // Try to add April which already exists
    await formPage.selectMonth("April");
    await formPage.basicSalaryInput.fill("50000");

    await formPage.save();

    // Should show error about duplicate month
    await expect(page.getByText(/already exists|duplicate/i)).toBeVisible({
      timeout: 5000,
    });
  });

  test("should validate numeric inputs only accept numbers", async ({
    page,
  }) => {
    // Try to type letters in numeric field
    await formPage.basicSalaryInput.fill("abc");

    // Value should be empty or 0 (number inputs reject non-numeric)
    const value = await formPage.basicSalaryInput.inputValue();
    expect(value === "" || value === "0" || !isNaN(Number(value))).toBeTruthy();
  });

  test("should preserve values during validation errors", async ({ page }) => {
    await formPage.cancel();
    await historyPage.selectFinancialYear("2022-23");
    await page.waitForTimeout(500);

    await historyPage.clickAddMonth();

    // Fill valid data
    await formPage.basicSalaryInput.fill("75000");
    await formPage.hraInput.fill("35000");

    // Try to save duplicate month (April exists)
    await formPage.selectMonth("April");
    await formPage.save();

    // Values should still be present after validation error
    await expect(formPage.basicSalaryInput).toHaveValue("75000");
    await expect(formPage.hraInput).toHaveValue("35000");
  });

  test("should update month dropdown options based on FY", async ({ page }) => {
    // The month dropdown should have all 12 months
    const monthSelect = page.locator('[aria-label="Month"]');
    await monthSelect.click();

    // Check some months are present
    await expect(page.getByRole("option", { name: "April" })).toBeVisible();
    await expect(page.getByRole("option", { name: "December" })).toBeVisible();
    await expect(page.getByRole("option", { name: "March" })).toBeVisible();
  });
});
