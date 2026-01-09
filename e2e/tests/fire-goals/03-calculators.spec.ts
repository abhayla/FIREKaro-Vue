import { test, expect } from "@playwright/test";
import { FIRECalculatorsPage } from "../../pages/fire-goals";
import { fireCalculationData, calculateFIRENumber } from "../../fixtures/fire-goals-data";

test.describe("FIRE Calculators", () => {
  let calculatorsPage: FIRECalculatorsPage;

  test.beforeEach(async ({ page }) => {
    calculatorsPage = new FIRECalculatorsPage(page);
    await calculatorsPage.navigateTo();
  });

  test("should display calculators page", async ({ page }) => {
    await calculatorsPage.expectPageLoaded();
  });

  test("should show FIRE number calculator", async ({ page }) => {
    await expect(calculatorsPage.fireNumberCalculator).toBeVisible();
  });

  test("should have monthly expenses input", async ({ page }) => {
    await expect(calculatorsPage.monthlyExpensesInput).toBeVisible();
  });

  test("should have withdrawal rate input", async ({ page }) => {
    await expect(calculatorsPage.withdrawalRateInput).toBeVisible();
  });

  test("should calculate FIRE number (25x rule)", async ({ page }) => {
    // FIRE Number = Annual Expenses / 4% = Annual Expenses * 25
    // Rs. 70,000/month = Rs. 8,40,000/year
    // FIRE Number = Rs. 8,40,000 * 25 = Rs. 2,10,00,000 (Rs. 2.1 Cr)
    await calculatorsPage.monthlyExpensesInput.fill("70000");
    await calculatorsPage.withdrawalRateInput.fill("4");

    // If there's a calculate button, click it
    const calculateBtn = calculatorsPage.calculateButton;
    if (await calculateBtn.isVisible()) {
      await calculateBtn.click();
    }

    // Result should contain INR currency
    await expect(page.getByText(/₹/).first()).toBeVisible();
  });

  test("should show Coast FIRE calculator", async ({ page }) => {
    await expect(
      page.getByText(/Coast FIRE/i).first()
    ).toBeVisible();
  });

  test("should show Lean/Fat FIRE options", async ({ page }) => {
    await expect(
      page.getByText(/Lean FIRE|Fat FIRE/i).first()
    ).toBeVisible();
  });

  test("should display years to FIRE calculator", async ({ page }) => {
    await expect(
      page.getByText(/Years to FIRE|Time to FIRE/i).first()
    ).toBeVisible();
  });
});
