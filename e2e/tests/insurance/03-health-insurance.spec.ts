import { test, expect } from "@playwright/test";
import { InsurancePage } from "../../pages/insurance";
import { healthInsuranceData, sampleHealthPolicy } from "../../fixtures/insurance-data";

test.describe("Health Insurance", () => {
  let insurancePage: InsurancePage;

  test.beforeEach(async ({ page }) => {
    insurancePage = new InsurancePage(page);
    await insurancePage.navigateTo();
    await insurancePage.goToItemDetails("health");
  });

  test("should display health insurance sub-tab within Item Details", async ({ page }) => {
    await insurancePage.expectPageLoaded();
    await insurancePage.expectOnMainTab("details");
    await insurancePage.expectOnSubTab("health");
    await expect(insurancePage.addPolicyButton).toBeVisible();
  });

  test("should open add policy form", async () => {
    await insurancePage.openAddForm();
    await insurancePage.expectFormDialogVisible();
  });

  test("should close form when cancel is clicked", async () => {
    await insurancePage.openAddForm();
    await insurancePage.expectFormDialogVisible();
    await insurancePage.cancelButton.click();
    await insurancePage.expectFormDialogClosed();
  });

  test("should have form fields for adding health insurance policy", async () => {
    await insurancePage.openAddForm();

    // Verify form dialog is visible with required fields
    await insurancePage.expectFormDialogVisible();

    // Check that required fields exist
    await expect(insurancePage.policyNumberField).toBeVisible();
    await expect(insurancePage.policyNameField).toBeVisible();
    await expect(insurancePage.sumAssuredField).toBeVisible();
    await expect(insurancePage.premiumField).toBeVisible();

    // Close the form
    await insurancePage.cancelButton.click();
    await insurancePage.expectFormDialogClosed();
  });

  test("should show summary stats for health insurance", async ({ page }) => {
    // Health sub-tab should show coverage stats
    await expect(page.getByText(/Coverage|Sum|Total/i).first()).toBeVisible();
  });

  test("should have save button that requires valid data", async ({ page }) => {
    await insurancePage.openAddForm();

    // Save button should be visible
    await expect(insurancePage.saveButton).toBeVisible();

    // Save button should be disabled when form is empty (or validation should prevent save)
    const saveBtn = insurancePage.saveButton;
    const isDisabled = await saveBtn.isDisabled();

    if (!isDisabled) {
      // If not disabled, clicking should keep form open due to validation
      await saveBtn.click();
      await page.waitForTimeout(300);
      await insurancePage.expectFormDialogVisible();
    }
  });

  test("should show health-specific fields when Health type is selected", async ({ page }) => {
    await insurancePage.openAddForm();

    // Select Health type
    await insurancePage.selectPolicyType("Health");
    await page.waitForTimeout(300); // Wait for conditional fields to appear

    // Health-specific fields should appear
    await expect(page.getByText(/Coverage Type|Room Rent/i).first()).toBeVisible();
  });

  test("should be able to fill policy form fields", async ({ page }) => {
    await insurancePage.openAddForm();

    // Select Health type
    await insurancePage.selectPolicyType("Health");
    await page.waitForTimeout(300);

    // Fill basic text fields (no dropdown interaction)
    await insurancePage.policyNumberField.fill("HEALTH-TEST-" + Date.now());
    await insurancePage.policyNameField.fill("Test Health Policy");
    await insurancePage.sumAssuredField.fill("500000");
    await insurancePage.premiumField.fill("20000");

    // Fill date fields
    const today = new Date().toISOString().split("T")[0];
    const nextYear = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0];
    await insurancePage.policyFormDialog.getByLabel(/Start Date/i).fill(today);
    await insurancePage.policyFormDialog.getByLabel(/End Date/i).fill(nextYear);

    // Verify fields were filled
    await expect(insurancePage.policyNameField).toHaveValue("Test Health Policy");
    await expect(insurancePage.sumAssuredField).toHaveValue("500000");

    // Close form without saving (to avoid API dependency)
    await insurancePage.cancelButton.click();
    await insurancePage.expectFormDialogClosed();
  });

  test("should stay on same URL when switching sub-tabs", async ({ page }) => {
    // Switch to Life sub-tab
    await insurancePage.goToSubTab("life");
    await insurancePage.expectOnSubTab("life");
    await expect(page).toHaveURL(/\/insurance$/);

    // Switch to Motor sub-tab
    await insurancePage.goToSubTab("motor");
    await insurancePage.expectOnSubTab("motor");
    await expect(page).toHaveURL(/\/insurance$/);
  });
});
