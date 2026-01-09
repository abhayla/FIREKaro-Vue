import { test, expect } from "@playwright/test";
import { GoalsPage } from "../../pages/fire-goals";
import { goalsData, getGoalsByCategory } from "../../fixtures/fire-goals-data";

test.describe("Goals CRUD", () => {
  let goalsPage: GoalsPage;

  test.beforeEach(async ({ page }) => {
    goalsPage = new GoalsPage(page);
    await goalsPage.navigateTo();
  });

  test("should display goals page", async ({ page }) => {
    await goalsPage.expectPageLoaded();
  });

  test("should show add goal button", async ({ page }) => {
    await expect(goalsPage.addGoalButton).toBeVisible();
  });

  test("should open add goal form", async ({ page }) => {
    await goalsPage.openAddForm();
    await goalsPage.expectFormDialogVisible();
  });

  test("should show goal form fields", async ({ page }) => {
    await goalsPage.openAddForm();

    await expect(goalsPage.goalNameInput).toBeVisible();
    await expect(goalsPage.targetAmountInput).toBeVisible();
    await expect(goalsPage.targetDateInput).toBeVisible();
  });

  test("should add a new goal", async ({ page }) => {
    const newGoal = {
      name: "Test Goal - Vacation",
      category: "Lifestyle",
      targetAmount: 300000,
      currentAmount: 50000,
      targetDate: "2027-12-31",
      priority: "Medium",
      monthlyContribution: 10000,
    };

    await goalsPage.openAddForm();
    await goalsPage.fillGoalForm(newGoal);
    await goalsPage.saveForm();
    await goalsPage.expectFormDialogClosed();
    await goalsPage.expectGoalInTable(newGoal.name);
  });

  test("should display goals in table/list", async ({ page }) => {
    await expect(goalsPage.goalsTable).toBeVisible();
  });

  test("should show goal progress", async ({ page }) => {
    // Check for progress indicators
    await expect(
      page.getByText(/Progress|%|On Track/i).first()
    ).toBeVisible();
  });

  test("should show summary cards", async ({ page }) => {
    await expect(
      page.getByText(/Total Goals|On Track|Total Target/i).first()
    ).toBeVisible();
  });
});
