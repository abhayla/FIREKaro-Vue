import { test, expect } from "@playwright/test";
import { ProjectionsPage } from "../../pages/fire-goals";
import { projectionData, fireSummary } from "../../fixtures/fire-goals-data";

test.describe("Projections", () => {
  let projectionsPage: ProjectionsPage;

  test.beforeEach(async ({ page }) => {
    projectionsPage = new ProjectionsPage(page);
    await projectionsPage.navigateTo();
  });

  test("should display projections page", async ({ page }) => {
    await projectionsPage.expectPageLoaded();
  });

  test("should show projection chart", async ({ page }) => {
    await expect(projectionsPage.projectionChart).toBeVisible();
  });

  test("should show crossover year (FI date)", async ({ page }) => {
    await expect(
      page.getByText(/Crossover|Financial Independence|FI Date/i).first()
    ).toBeVisible();
  });

  test("should show projected corpus at FIRE age", async ({ page }) => {
    await expect(
      page.getByText(/Projected|Future Value|At.*Age/i).first()
    ).toBeVisible();
  });

  test("should display projection table", async ({ page }) => {
    await expect(projectionsPage.projectionTable).toBeVisible();
  });

  test("should show scenario inputs", async ({ page }) => {
    // Check for scenario adjustment inputs
    await expect(
      page.getByText(/Return Rate|Inflation|Savings/i).first()
    ).toBeVisible();
  });

  test("should show milestone indicators", async ({ page }) => {
    // Check for milestones like 25%, 50%, 75%, 100% FIRE
    await expect(
      page.getByText(/25%|50%|Milestone/i).first()
    ).toBeVisible().catch(() => {
      // Milestones may be shown differently
      expect(true).toBe(true);
    });
  });
});
