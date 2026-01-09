import { test, expect } from "@playwright/test";
import { ProtectionReportsPage } from "../../pages/protection";

test.describe("Protection Reports", () => {
  let reportsPage: ProtectionReportsPage;

  test.beforeEach(async ({ page }) => {
    reportsPage = new ProtectionReportsPage(page);
    await reportsPage.navigateTo();
  });

  test("should display reports page", async ({ page }) => {
    await reportsPage.expectPageLoaded();
  });

  test("should show coverage chart", async ({ page }) => {
    await expect(reportsPage.coverageChart).toBeVisible();
  });

  test("should have export button", async ({ page }) => {
    await expect(reportsPage.exportButton).toBeVisible();
  });
});
