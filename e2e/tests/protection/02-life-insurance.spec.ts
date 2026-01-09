import { test, expect } from "@playwright/test";
import { LifeInsurancePage } from "../../pages/protection";
import { lifeInsuranceData } from "../../fixtures/protection-data";

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

  test("should add term insurance policy", async ({ page }) => {
    const termPolicy = lifeInsuranceData.find((p) => p.policyType === "term")!;

    await lifePage.openAddForm();
    await lifePage.fillPolicyForm({
      policyType: "Term",
      policyName: termPolicy.policyName,
      sumAssured: termPolicy.sumAssured,
      premium: termPolicy.premiumAmount,
    });

    await lifePage.saveForm();
    await lifePage.expectFormDialogClosed();
    await lifePage.expectPolicyInTable(termPolicy.policyName);
  });

  test("should show summary cards", async ({ page }) => {
    await expect(page.getByText(/Total Coverage|Sum Assured/i)).toBeVisible();
    await expect(page.getByText(/Annual Premium/i)).toBeVisible();
  });
});
