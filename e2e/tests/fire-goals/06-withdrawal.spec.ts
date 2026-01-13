import { test, expect } from "@playwright/test";
import { FIREPlanningPage } from "../../pages/fire-goals";
import { withdrawalStrategies, fireCalculationData } from "../../fixtures/fire-goals-data";

test.describe("Withdrawal Strategies (Planning Tab)", () => {
  let planningPage: FIREPlanningPage;

  test.beforeEach(async ({ page }) => {
    planningPage = new FIREPlanningPage(page);
    await planningPage.navigateTo();
    // Wait for page to stabilize
    await page.waitForTimeout(500);
    // Try to expand withdrawal accordion (skip if already expanded or error)
    try {
      await planningPage.expandWithdrawalSection();
    } catch {
      // Accordion might already be expanded or not visible
    }
    await page.waitForTimeout(300);
  });

  test("should display withdrawal planning accordion", async ({ page }) => {
    await expect(planningPage.withdrawalAccordion).toBeVisible();
  });

  test("should show 4% SWR strategy", async ({ page }) => {
    await expect(page.getByText(/4%|Safe Withdrawal|SWR/i).first()).toBeVisible();
  });

  test("should show Bucket strategy", async ({ page }) => {
    await expect(page.getByText(/Bucket/i).first()).toBeVisible();
  });

  test("should show VPW strategy", async ({ page }) => {
    await expect(page.getByText(/VPW/i).first()).toBeVisible();
  });

  test("should show Guyton-Klinger strategy", async ({ page }) => {
    await expect(page.getByText(/Guyton|Guardrail/i).first()).toBeVisible();
  });

  test("should display SWR calculator table", async ({ page }) => {
    await expect(planningPage.swrTable).toBeVisible();
  });

  test("should show different SWR rates in table", async ({ page }) => {
    // Check for various SWR percentages
    await expect(page.getByText(/3\.0%|3\.5%|4\.0%|4\.5%|5\.0%/i).first()).toBeVisible();
  });

  test("should show corpus required for each SWR", async ({ page }) => {
    // SWR table should show corpus required
    await expect(page.getByText(/₹/).first()).toBeVisible();
  });

  test("should show success rates for strategies", async ({ page }) => {
    // Success rate chips
    await expect(page.getByText(/95%|96%|97%|98%|100%/).first()).toBeVisible();
  });

  test("should display strategy comparison cards", async ({ page }) => {
    await expect(planningPage.strategyCards).toBeVisible();
  });

  test("should explain 4% Rule", async ({ page }) => {
    await expect(page.getByText(/4% Rule|Withdraw 4%/i).first()).toBeVisible();
  });

  test("should show India-specific SWR note", async ({ page }) => {
    // India has higher inflation, so conservative SWR is recommended
    await expect(page.getByText(/India|conservative|3.*3\.5%/i).first()).toBeVisible();
  });

  test("should show strategy recommendation cards", async ({ page }) => {
    await expect(page.getByText(/Which Strategy.*Right/i).first()).toBeVisible();
  });

  test("should describe who each strategy is best for", async ({ page }) => {
    // Each strategy card should have "Best for:" description
    await expect(page.getByText(/Best for/i).first()).toBeVisible();
  });

  test("should show pros and cons of strategies", async ({ page }) => {
    await expect(page.getByText(/Pros|Cons/i).first()).toBeVisible();
  });

  test("should highlight standard 4% SWR row", async ({ page }) => {
    // The 4% row should be highlighted
    await expect(page.getByText(/4\.0%.*Standard/i).first()).toBeVisible();
  });

  test("should show annual expenses note in SWR table", async ({ page }) => {
    // Note about annual expenses basis
    await expect(page.getByText(/annual expenses|₹10L\/year/i).first()).toBeVisible();
  });

  test("should display withdrawal strategy selector component", async ({ page }) => {
    // WithdrawalStrategySelector should be visible
    await expect(page.locator(".v-card").filter({ hasText: /4%|Bucket|VPW|Guyton/i }).first()).toBeVisible();
  });
});
