import { test, expect } from "@playwright/test";
import { HealthInsurancePage } from "../../pages/insurance";
import { healthInsuranceData, sampleHealthPolicy } from "../../fixtures/insurance-data";

test.describe("Health Insurance", () => {
  let healthPage: HealthInsurancePage;

  test.beforeEach(async ({ page }) => {
    healthPage = new HealthInsurancePage(page);
    await healthPage.navigateTo();
  });

  test("should display health insurance page", async ({ page }) => {
    await healthPage.expectPageLoaded();
    await expect(healthPage.addPolicyButton).toBeVisible();
  });

  test("should open add policy form", async ({ page }) => {
    await healthPage.openAddForm();
    await healthPage.expectFormDialogVisible();
  });

  test("should close form when cancel is clicked", async ({ page }) => {
    await healthPage.openAddForm();
    await healthPage.expectFormDialogVisible();
    await healthPage.cancelButton.click();
    await healthPage.expectFormDialogClosed();
  });

  test("should have form fields for adding health insurance policy", async ({ page }) => {
    await healthPage.openAddForm();

    // Verify form dialog is visible with required fields
    await healthPage.expectFormDialogVisible();

    // Check that required fields exist
    await expect(healthPage.policyNumberField).toBeVisible();
    await expect(healthPage.policyNameField).toBeVisible();
    await expect(healthPage.sumAssuredField).toBeVisible();
    await expect(healthPage.premiumField).toBeVisible();

    // Close the form
    await healthPage.cancelButton.click();
    await healthPage.expectFormDialogClosed();
  });

  test("should show summary cards", async ({ page }) => {
    // Summary cards should be visible (even if showing 0 values for empty state)
    await expect(page.getByText(/Coverage|Sum/i).first()).toBeVisible();
  });

  test("should have save button that requires valid data", async ({ page }) => {
    await healthPage.openAddForm();

    // Save button should be visible
    await expect(healthPage.saveButton).toBeVisible();

    // Save button should be disabled when form is empty (or validation should prevent save)
    const saveBtn = healthPage.saveButton;
    const isDisabled = await saveBtn.isDisabled();

    if (!isDisabled) {
      // If not disabled, clicking should keep form open due to validation
      await saveBtn.click();
      await page.waitForTimeout(300);
      await healthPage.expectFormDialogVisible();
    }
  });

  test("should show health-specific fields when Health type is selected", async ({ page }) => {
    await healthPage.openAddForm();

    // Select Health type
    await healthPage.selectPolicyType('Health');
    await page.waitForTimeout(300); // Wait for conditional fields to appear

    // Health-specific fields should appear
    await expect(page.getByText(/Coverage Type|Room Rent/i).first()).toBeVisible();
  });

  test("should be able to fill policy form fields", async ({ page }) => {
    await healthPage.openAddForm();

    // Select Health type
    await healthPage.selectPolicyType('Health');
    await page.waitForTimeout(300);

    // Fill basic text fields (no dropdown interaction)
    await healthPage.policyNumberField.fill('HEALTH-TEST-' + Date.now());
    await healthPage.policyNameField.fill('Test Health Policy');
    await healthPage.sumAssuredField.fill('500000');
    await healthPage.premiumField.fill('20000');

    // Fill date fields
    const today = new Date().toISOString().split('T')[0];
    const nextYear = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    await healthPage.policyFormDialog.getByLabel(/Start Date/i).fill(today);
    await healthPage.policyFormDialog.getByLabel(/End Date/i).fill(nextYear);

    // Verify fields were filled
    await expect(healthPage.policyNameField).toHaveValue('Test Health Policy');
    await expect(healthPage.sumAssuredField).toHaveValue('500000');

    // Close form without saving (to avoid API dependency)
    await healthPage.cancelButton.click();
    await healthPage.expectFormDialogClosed();
  });
});
