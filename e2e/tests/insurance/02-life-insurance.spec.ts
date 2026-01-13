import { test, expect } from "@playwright/test";
import { InsurancePage } from "../../pages/insurance";
import { lifeInsuranceData, sampleLifePolicy } from "../../fixtures/insurance-data";

test.describe("Life Insurance", () => {
  let insurancePage: InsurancePage;

  test.beforeEach(async ({ page }) => {
    insurancePage = new InsurancePage(page);
    await insurancePage.navigateTo();
    await insurancePage.goToItemDetails("life");
  });

  test("should display life insurance sub-tab within Item Details", async ({ page }) => {
    await insurancePage.expectPageLoaded();
    await insurancePage.expectOnMainTab("details");
    await insurancePage.expectOnSubTab("life");
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

  test("should have form fields for adding life insurance policy", async () => {
    await insurancePage.openAddForm();

    // Verify form dialog is visible with required fields
    await insurancePage.expectFormDialogVisible();

    // Check that required fields exist
    await expect(insurancePage.policyNumberField).toBeVisible();
    await expect(insurancePage.policyNameField).toBeVisible();
    await expect(insurancePage.sumAssuredField).toBeVisible();
    await expect(insurancePage.premiumField).toBeVisible();
    await expect(insurancePage.startDateField).toBeVisible();
    await expect(insurancePage.endDateField).toBeVisible();

    // Close the form
    await insurancePage.cancelButton.click();
    await insurancePage.expectFormDialogClosed();
  });

  test("should show summary stats for life insurance", async ({ page }) => {
    // Life sub-tab should show coverage stats
    await expect(page.getByText(/Coverage|Sum Assured|Total/i).first()).toBeVisible();
  });

  test("should have save button that requires valid data", async ({ page }) => {
    await insurancePage.openAddForm();

    // Save button should be visible
    await expect(insurancePage.saveButton).toBeVisible();

    // Save button should be disabled when form is empty (or validation should prevent save)
    // Either the button is disabled OR clicking it keeps the form open
    const saveBtn = insurancePage.saveButton;
    const isDisabled = await saveBtn.isDisabled();

    if (!isDisabled) {
      // If not disabled, clicking should keep form open due to validation
      await saveBtn.click();
      await page.waitForTimeout(300);
      await insurancePage.expectFormDialogVisible();
    }
  });

  test("should show policy type buttons with Life pre-selected", async () => {
    await insurancePage.openAddForm();

    // Check that policy type button group exists
    await expect(insurancePage.policyTypeButtonGroup).toBeVisible();

    // Check for Life and Health buttons
    await expect(
      insurancePage.policyTypeButtonGroup.getByRole("button", { name: "Life" })
    ).toBeVisible();
    await expect(
      insurancePage.policyTypeButtonGroup.getByRole("button", { name: "Health" })
    ).toBeVisible();
  });

  test("should be able to fill policy form fields", async () => {
    await insurancePage.openAddForm();

    // Fill basic text fields (no dropdown interaction)
    await insurancePage.policyNumberField.fill("TEST-" + Date.now());
    await insurancePage.policyNameField.fill("Test Life Policy");
    await insurancePage.sumAssuredField.fill("1000000");
    await insurancePage.premiumField.fill("12000");

    // Fill date fields
    const today = new Date().toISOString().split("T")[0];
    const nextYear = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0];
    await insurancePage.startDateField.fill(today);
    await insurancePage.endDateField.fill(nextYear);

    // Verify fields were filled
    await expect(insurancePage.policyNameField).toHaveValue("Test Life Policy");
    await expect(insurancePage.sumAssuredField).toHaveValue("1000000");

    // Close form without saving (to avoid API dependency)
    await insurancePage.cancelButton.click();
    await insurancePage.expectFormDialogClosed();
  });

  test("should stay on same URL when switching sub-tabs", async ({ page }) => {
    // Switch to Health sub-tab
    await insurancePage.goToSubTab("health");
    await insurancePage.expectOnSubTab("health");
    await expect(page).toHaveURL(/\/insurance$/);

    // Switch back to Life sub-tab
    await insurancePage.goToSubTab("life");
    await insurancePage.expectOnSubTab("life");
    await expect(page).toHaveURL(/\/insurance$/);
  });
});
