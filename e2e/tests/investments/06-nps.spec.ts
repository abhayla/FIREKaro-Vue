import { test, expect } from "@playwright/test";
import { NpsPage } from "../../pages/investments";
import { npsData } from "../../fixtures/investments-data";

test.describe("NPS (National Pension System)", () => {
  let npsPage: NpsPage;

  test.beforeEach(async ({ page }) => {
    npsPage = new NpsPage(page);
    await npsPage.navigateTo();
  });

  test("should display NPS page correctly", async ({ page }) => {
    await npsPage.expectPageLoaded();
  });

  test("should show summary cards", async ({ page }) => {
    await expect(npsPage.totalBalanceCard).toBeVisible();
    await expect(npsPage.totalContributionCard).toBeVisible();
    await expect(npsPage.returnsCard).toBeVisible();
  });

  test("should display account details", async ({ page }) => {
    await npsPage.expectAccountDetailsVisible();
  });

  test("should display allocation section", async ({ page }) => {
    await npsPage.expectAllocationSectionVisible();
  });

  test("should edit NPS account details", async ({ page }) => {
    await npsPage.openEditForm();
    await npsPage.expectFormDialogVisible();

    // Update with increased balance
    await npsPage.updateNpsDetails({
      currentBalance: npsData.balance + 50000,
      equityPercent: npsData.allocation.equity,
      corporateBondPercent: npsData.allocation.corporate,
      govBondPercent: npsData.allocation.government,
    });
    await npsPage.expectFormDialogClosed();
  });
});
