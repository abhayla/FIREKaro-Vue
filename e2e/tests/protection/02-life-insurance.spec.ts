import { test, expect } from "@playwright/test";
import { LifeInsurancePage } from "../../pages/protection";
import { lifeInsuranceData, sampleLifePolicy } from "../../fixtures/protection-data";

test.describe("Life Insurance", () => {
  let lifePage: LifeInsurancePage;

  test.beforeEach(async ({ page }) => {
    lifePage = new LifeInsurancePage(page);
    await lifePage.navigateTo();
  });

  test("should display life insurance page", async ({ page }) => {
    await lifePage.expectPageLoaded();
    await expect(lifePage.addPolicyButton).toBeVisible();
  });

  test("should open add policy form", async ({ page }) => {
    await lifePage.openAddForm();
    await lifePage.expectFormDialogVisible();
  });

  test("should close form when cancel is clicked", async ({ page }) => {
    await lifePage.openAddForm();
    await lifePage.expectFormDialogVisible();
    await lifePage.cancelButton.click();
    await lifePage.expectFormDialogClosed();
  });

  test("should have form fields for adding life insurance policy", async ({ page }) => {
    await lifePage.openAddForm();

    // Verify form dialog is visible with required fields
    await lifePage.expectFormDialogVisible();

    // Check that required fields exist
    await expect(lifePage.policyNumberField).toBeVisible();
    await expect(lifePage.policyNameField).toBeVisible();
    await expect(lifePage.sumAssuredField).toBeVisible();
    await expect(lifePage.premiumField).toBeVisible();
    await expect(lifePage.startDateField).toBeVisible();
    await expect(lifePage.endDateField).toBeVisible();

    // Close the form
    await lifePage.cancelButton.click();
    await lifePage.expectFormDialogClosed();
  });

  test("should show summary cards", async ({ page }) => {
    // Summary cards should be visible (even if showing 0 values for empty state)
    await expect(page.getByText(/Coverage|Sum Assured/i).first()).toBeVisible();
  });

  test("should have save button that requires valid data", async ({ page }) => {
    await lifePage.openAddForm();

    // Save button should be visible
    await expect(lifePage.saveButton).toBeVisible();

    // Save button should be disabled when form is empty (or validation should prevent save)
    // Either the button is disabled OR clicking it keeps the form open
    const saveBtn = lifePage.saveButton;
    const isDisabled = await saveBtn.isDisabled();

    if (!isDisabled) {
      // If not disabled, clicking should keep form open due to validation
      await saveBtn.click();
      await page.waitForTimeout(300);
      await lifePage.expectFormDialogVisible();
    }
  });

  test("should show policy type buttons", async ({ page }) => {
    await lifePage.openAddForm();

    // Check that policy type button group exists
    await expect(lifePage.policyTypeButtonGroup).toBeVisible();

    // Check for Life button (should be selected by default for this page context)
    await expect(lifePage.policyTypeButtonGroup.getByRole("button", { name: "Life" })).toBeVisible();
    await expect(lifePage.policyTypeButtonGroup.getByRole("button", { name: "Health" })).toBeVisible();
  });

  test("should be able to fill policy form fields", async ({ page }) => {
    await lifePage.openAddForm();

    // Fill basic text fields (no dropdown interaction)
    await lifePage.policyNumberField.fill('TEST-' + Date.now());
    await lifePage.policyNameField.fill('Test Life Policy');
    await lifePage.sumAssuredField.fill('1000000');
    await lifePage.premiumField.fill('12000');

    // Fill date fields
    const today = new Date().toISOString().split('T')[0];
    const nextYear = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    await lifePage.startDateField.fill(today);
    await lifePage.endDateField.fill(nextYear);

    // Verify fields were filled
    await expect(lifePage.policyNameField).toHaveValue('Test Life Policy');
    await expect(lifePage.sumAssuredField).toHaveValue('1000000');

    // Close form without saving (to avoid API dependency)
    await lifePage.cancelButton.click();
    await lifePage.expectFormDialogClosed();
  });
});
