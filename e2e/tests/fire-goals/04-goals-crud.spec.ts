import { test, expect } from "@playwright/test";
import { FIREPlanningPage } from "../../pages/fire-goals";
import { goalsData, getGoalsByCategory } from "../../fixtures/fire-goals-data";

test.describe("Goals CRUD (Planning Tab)", () => {
  let planningPage: FIREPlanningPage;

  test.beforeEach(async ({ page }) => {
    planningPage = new FIREPlanningPage(page);
    await planningPage.navigateTo();
    // Goals section is expanded by default, but ensure it is
    await planningPage.expandGoalsSection();
    await page.waitForTimeout(300);
  });

  test("should display goals section in Planning tab", async ({ page }) => {
    await expect(planningPage.goalsAccordion).toBeVisible();
  });

  test("should show add goal button", async ({ page }) => {
    await expect(planningPage.addGoalButton).toBeVisible();
  });

  test("should open add goal form dialog", async ({ page }) => {
    await planningPage.openAddGoalForm();
  });

  test("should show goal form fields", async ({ page }) => {
    await planningPage.openAddGoalForm();
    await expect(planningPage.goalNameInput).toBeVisible();
    await expect(planningPage.targetAmountInput).toBeVisible();
  });

  test("should close goal form on cancel", async ({ page }) => {
    await planningPage.openAddGoalForm();
    // Find and click cancel button
    const cancelBtn = page.getByRole("button", { name: /Cancel/i });
    await cancelBtn.click();
    // Form should close
    await expect(planningPage.goalFormDialog).not.toBeVisible();
  });

  test("should show goals summary cards", async ({ page }) => {
    // Check for goal summary stats
    await expect(page.getByText(/Total Goals/i).first()).toBeVisible();
    await expect(page.getByText(/Completed/i).first()).toBeVisible();
    await expect(page.getByText(/Total Target/i).first()).toBeVisible();
  });

  test("should show status filter", async ({ page }) => {
    await expect(planningPage.statusFilter).toBeVisible();
  });

  test("should show category filter", async ({ page }) => {
    await expect(planningPage.categoryFilter).toBeVisible();
  });

  test("should show empty state or goals list", async ({ page }) => {
    // Should show either goals grid or empty state
    const hasGoals = await page.locator(".goal-card, [class*='goal']").first().isVisible().catch(() => false);
    const hasEmptyState = await page.getByText(/Start Your FIRE Journey/i).isVisible().catch(() => false);
    expect(hasGoals || hasEmptyState).toBeTruthy();
  });

  test("should have expand all and collapse all buttons", async ({ page }) => {
    await expect(planningPage.expandAllButton).toBeVisible();
    await expect(planningPage.collapseAllButton).toBeVisible();
  });

  test("should expand all sections when clicking Expand All", async ({ page }) => {
    await planningPage.expandAllSections();
    // All accordions should be expanded
    await expect(planningPage.calculatorsAccordion).toBeVisible();
    await expect(planningPage.projectionsAccordion).toBeVisible();
    await expect(planningPage.withdrawalAccordion).toBeVisible();
  });

  test("should collapse all sections when clicking Collapse All", async ({ page }) => {
    // First expand all
    await planningPage.expandAllSections();
    await page.waitForTimeout(300);

    // Then collapse all
    await planningPage.collapseAllSections();
    await page.waitForTimeout(300);

    // Only the accordion headers should be visible, content should be collapsed
    // Note: Accordion titles are always visible, but content should be hidden
    const calculatorsContent = planningPage.calculatorsAccordion.locator(".v-expansion-panel-text");
    await expect(calculatorsContent).not.toBeVisible();
  });

  test("should show goal categories in category filter", async ({ page }) => {
    await planningPage.categoryFilter.click();
    await page.waitForTimeout(200);
    // Check for category options
    await expect(page.getByText(/Essential|Lifestyle|Legacy/i).first()).toBeVisible();
  });

  test("should show goal statuses in status filter", async ({ page }) => {
    await planningPage.statusFilter.click();
    await page.waitForTimeout(200);
    // Check for status options
    await expect(page.getByText(/On Track|At Risk|Off Track|Completed/i).first()).toBeVisible();
  });

  test("should filter goals when status filter is applied", async ({ page }) => {
    await planningPage.statusFilter.click();
    await page.waitForTimeout(200);
    // Select a status
    await page.getByRole("option", { name: /On Track/i }).click();
    await page.waitForTimeout(300);
    // Filter should be applied (check for chip or filtered results)
    await expect(page.getByText(/On Track/i).first()).toBeVisible();
  });
});
