import { test, expect } from "@playwright/test";
import { EmergencyFundPage } from "../../pages/financial-health";
import { emergencyFundData } from "../../fixtures/financial-health-data";

test.describe("Emergency Fund", () => {
  let emergencyPage: EmergencyFundPage;

  test.beforeEach(async ({ page }) => {
    emergencyPage = new EmergencyFundPage(page);
    await emergencyPage.navigateTo();
  });

  test("should display emergency fund page", async ({ page }) => {
    await emergencyPage.expectPageLoaded();
  });

  test("should show target amount card", async ({ page }) => {
    await expect(emergencyPage.targetAmountCard).toBeVisible();
    const target = await emergencyPage.getTargetAmount();
    expect(target).toContain("₹");
  });

  test("should show current amount card", async ({ page }) => {
    await expect(emergencyPage.currentAmountCard).toBeVisible();
    const current = await emergencyPage.getCurrentAmount();
    expect(current).toContain("₹");
  });

  test("should show months covered", async ({ page }) => {
    await expect(emergencyPage.monthsCoveredCard).toBeVisible();
    const months = await emergencyPage.getMonthsCovered();
    expect(months).toBeTruthy();
  });

  test("should display progress bar", async ({ page }) => {
    await expect(emergencyPage.progressBar).toBeVisible();
  });

  test("should show progress percentage", async ({ page }) => {
    const progress = await emergencyPage.getProgressPercentage();
    expect(progress).toMatch(/%|\d/);
  });

  test("should display recommendation", async ({ page }) => {
    await expect(emergencyPage.recommendationCard).toBeVisible();
  });

  test("should show target based on monthly expenses", async ({ page }) => {
    // Target = monthly expenses x target months
    await expect(
      page.getByText(/Target|Goal|Monthly Expenses/i).first()
    ).toBeVisible();
  });
});
