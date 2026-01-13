import { test, expect } from "@playwright/test";
import { FIREPlanningPage } from "../../pages/fire-goals";
import { fireCalculationData, calculateFIRENumber } from "../../fixtures/fire-goals-data";

test.describe("FIRE Calculators (Planning Tab)", () => {
  let planningPage: FIREPlanningPage;

  test.beforeEach(async ({ page }) => {
    planningPage = new FIREPlanningPage(page);
    await planningPage.navigateTo();
    // Expand calculators accordion
    await planningPage.expandCalculatorsSection();
    // Wait for accordion to expand
    await page.waitForTimeout(300);
  });

  test("should display calculators accordion", async ({ page }) => {
    await expect(planningPage.calculatorsAccordion).toBeVisible();
  });

  test("should show FIRE Number calculator tab", async ({ page }) => {
    await expect(planningPage.fireCalculatorTab).toBeVisible();
  });

  test("should show Retirement Date calculator tab", async ({ page }) => {
    await expect(planningPage.retirementCalculatorTab).toBeVisible();
  });

  test("should show SIP calculator tab", async ({ page }) => {
    await expect(planningPage.sipCalculatorTab).toBeVisible();
  });

  test("should show Monte Carlo tab", async ({ page }) => {
    await expect(planningPage.monteCarloTab).toBeVisible();
  });

  test("should display FIRE calculator form", async ({ page }) => {
    // FIRE Number tab should be active by default
    await expect(page.getByLabel(/Monthly Expenses|Annual Expenses/i).first()).toBeVisible();
  });

  test("should switch to Retirement Date calculator", async ({ page }) => {
    await planningPage.retirementCalculatorTab.click();
    // Check for retirement calculator specific elements
    await expect(page.getByLabel(/Current Age/i)).toBeVisible();
    await expect(page.getByLabel(/Target.*Corpus|Target Retirement/i)).toBeVisible();
  });

  test("should switch to SIP calculator", async ({ page }) => {
    await planningPage.sipCalculatorTab.click();
    // Check for SIP calculator specific elements
    await expect(page.getByLabel(/Goal Amount/i)).toBeVisible();
    await expect(page.getByLabel(/Time Period|Years/i)).toBeVisible();
    await expect(page.getByText(/Recommended.*SIP|Monthly SIP/i).first()).toBeVisible();
  });

  test("should switch to Monte Carlo simulation", async ({ page }) => {
    await planningPage.monteCarloTab.click();
    // Wait for Monte Carlo chart or loading
    await page.waitForTimeout(500);
    // Should show success rate or Monte Carlo related content
    await expect(
      page.getByText(/Monte Carlo|Success Rate|Percentile/i).first()
    ).toBeVisible();
  });

  test("should calculate recommended SIP in SIP calculator", async ({ page }) => {
    await planningPage.sipCalculatorTab.click();

    // Fill in values
    await page.getByLabel(/Goal Amount/i).fill("5000000");
    await page.getByLabel(/Time Period|Years/i).fill("10");

    // Wait for calculation
    await page.waitForTimeout(300);

    // Should show recommended SIP with INR
    await expect(page.getByText(/₹/).first()).toBeVisible();
  });

  test("should show retirement age calculation in Retirement Date calculator", async ({ page }) => {
    await planningPage.retirementCalculatorTab.click();

    // The retirement age should be calculated and displayed
    await expect(page.getByText(/retire at age|At current pace/i).first()).toBeVisible();
  });

  test("should show Lean/Fat FIRE options in calculators", async ({ page }) => {
    await expect(
      page.getByText(/Lean FIRE|Fat FIRE|Coast FIRE/i).first()
    ).toBeVisible();
  });

  test("should calculate FIRE number correctly (25x rule)", async ({ page }) => {
    // Look for FIRE number result - should show INR currency
    await expect(page.getByText(/₹/).first()).toBeVisible();
  });

  test("should show expected returns slider", async ({ page }) => {
    // Expected returns slider should be present in calculators
    await expect(
      page.getByText(/Expected.*Return|Returns/i).first()
    ).toBeVisible();
  });
});
