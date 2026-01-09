import { test, expect } from "@playwright/test";
import { HealthInsurancePage } from "../../pages/protection";
import { healthInsuranceData, sampleHealthPolicy } from "../../fixtures/protection-data";

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

  test("should add health insurance policy", async ({ page }) => {
    const policy = healthInsuranceData[0]; // HDFC Ergo Optima Secure

    await healthPage.openAddForm();

    // Select Health type
    await healthPage.selectPolicyType('Health');

    await healthPage.fillPolicyForm({
      provider: policy.provider,
      policyNumber: policy.policyNumber,
      policyName: policy.policyName,
      sumAssured: policy.sumAssured,
      premium: policy.premium,
      startDate: policy.startDate,
      endDate: policy.endDate,
    });

    await healthPage.saveForm();

    // Form should close after successful save
    await healthPage.expectFormDialogClosed();

    // Policy should appear in the list
    await healthPage.expectPolicyInList(policy.policyName);
  });

  test("should show summary cards", async ({ page }) => {
    // Summary cards should be visible (even if showing 0 values for empty state)
    await expect(page.getByText(/Coverage|Sum/i).first()).toBeVisible();
  });

  test("should validate required fields", async ({ page }) => {
    await healthPage.openAddForm();

    // Try to save without filling required fields
    await healthPage.saveButton.click();

    // Form should remain open (validation failed)
    await healthPage.expectFormDialogVisible();
  });

  test("should show health-specific fields when Health type is selected", async ({ page }) => {
    await healthPage.openAddForm();

    // Select Health type
    await healthPage.selectPolicyType('Health');
    await page.waitForTimeout(300); // Wait for conditional fields to appear

    // Health-specific fields should appear
    await expect(page.getByText(/Coverage Type|Room Rent/i).first()).toBeVisible();
  });

  test("should add policy using sample test data", async ({ page }) => {
    await healthPage.openAddForm();

    await healthPage.selectPolicyType('Health');
    await healthPage.fillPolicyForm({
      provider: sampleHealthPolicy.provider,
      policyNumber: sampleHealthPolicy.policyNumber + '-' + Date.now(), // Unique policy number
      policyName: sampleHealthPolicy.policyName,
      sumAssured: sampleHealthPolicy.sumAssured,
      premium: sampleHealthPolicy.premium,
      startDate: sampleHealthPolicy.startDate,
      endDate: sampleHealthPolicy.endDate,
    });

    await healthPage.saveForm();
    await healthPage.expectFormDialogClosed();
    await healthPage.expectPolicyInList(sampleHealthPolicy.policyName);
  });
});
