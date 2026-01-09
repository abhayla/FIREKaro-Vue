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

  test("should add life insurance policy", async ({ page }) => {
    const policy = lifeInsuranceData[0]; // HDFC Click 2 Protect Life

    await lifePage.openAddForm();
    await lifePage.fillPolicyForm({
      type: 'Life',
      provider: policy.provider,
      policyNumber: policy.policyNumber,
      policyName: policy.policyName,
      sumAssured: policy.sumAssured,
      premium: policy.premium,
      paymentFrequency: 'Yearly',
      startDate: policy.startDate,
      endDate: policy.endDate,
    });

    await lifePage.saveForm();

    // Form should close after successful save
    await lifePage.expectFormDialogClosed();

    // Policy should appear in the list
    await lifePage.expectPolicyInList(policy.policyName);
  });

  test("should show summary cards", async ({ page }) => {
    // Summary cards should be visible (even if showing 0 values for empty state)
    await expect(page.getByText(/Coverage|Sum Assured/i).first()).toBeVisible();
  });

  test("should validate required fields", async ({ page }) => {
    await lifePage.openAddForm();

    // Try to save without filling required fields
    await lifePage.saveButton.click();

    // Form should remain open (validation failed)
    await lifePage.expectFormDialogVisible();
  });

  test("should show policy type buttons", async ({ page }) => {
    await lifePage.openAddForm();

    // Check that policy type button group exists
    await expect(lifePage.policyTypeButtonGroup).toBeVisible();

    // Check for Life button (should be selected by default for this page context)
    await expect(lifePage.policyTypeButtonGroup.getByRole("button", { name: "Life" })).toBeVisible();
    await expect(lifePage.policyTypeButtonGroup.getByRole("button", { name: "Health" })).toBeVisible();
  });

  test("should add policy using sample test data", async ({ page }) => {
    await lifePage.openAddForm();
    await lifePage.fillPolicyForm({
      type: 'Life',
      provider: sampleLifePolicy.provider,
      policyNumber: sampleLifePolicy.policyNumber + '-' + Date.now(), // Unique policy number
      policyName: sampleLifePolicy.policyName,
      sumAssured: sampleLifePolicy.sumAssured,
      premium: sampleLifePolicy.premium,
      paymentFrequency: 'Yearly',
      startDate: sampleLifePolicy.startDate,
      endDate: sampleLifePolicy.endDate,
    });

    await lifePage.saveForm();
    await lifePage.expectFormDialogClosed();
    await lifePage.expectPolicyInList(sampleLifePolicy.policyName);
  });
});
