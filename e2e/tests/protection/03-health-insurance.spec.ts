import { test, expect } from "@playwright/test";
import { HealthInsurancePage } from "../../pages/protection";
import { healthInsuranceData } from "../../fixtures/protection-data";

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

  test("should show summary cards", async ({ page }) => {
    await expect(page.getByText(/Total Coverage|Sum Insured/i)).toBeVisible();
    await expect(page.getByText(/Annual Premium/i)).toBeVisible();
  });
});
