import { test, expect } from "@playwright/test";
import { MutualFundsPage } from "../../pages/investments";
import { mutualFundsData, getSIPFunds, getTotalMonthlySIP } from "../../fixtures/investments-data";

test.describe("Mutual Funds", () => {
  let mfPage: MutualFundsPage;

  test.beforeEach(async ({ page }) => {
    mfPage = new MutualFundsPage(page);
    await mfPage.navigateTo();
  });

  test("should display mutual funds page correctly", async ({ page }) => {
    await mfPage.expectPageLoaded();
    await expect(mfPage.addMutualFundButton).toBeVisible();
  });

  test("should show summary cards", async ({ page }) => {
    await expect(mfPage.totalValueCard).toBeVisible();
    await expect(mfPage.totalInvestedCard).toBeVisible();
    await expect(mfPage.totalSIPCard).toBeVisible();
  });

  test("should open add fund form dialog", async ({ page }) => {
    await mfPage.openAddForm();
    await mfPage.expectFormDialogVisible();
    await expect(mfPage.fundNameField).toBeVisible();
    await expect(mfPage.fundCategorySelect).toBeVisible();
    await expect(mfPage.investmentTypeSelect).toBeVisible();
  });

  test("should add SIP fund", async ({ page }) => {
    const sipFund = mutualFundsData.find((f) => f.investmentType === "sip")!;

    await mfPage.openAddForm();
    await mfPage.fillMutualFundForm({
      fundName: sipFund.fundName,
      category: sipFund.category,
      investmentType: "SIP",
      sipAmount: sipFund.sipAmount,
      units: sipFund.units,
      nav: sipFund.averageNav,
    });

    await mfPage.saveForm();
    await mfPage.expectFormDialogClosed();
    await mfPage.expectFundInTable(sipFund.fundName);
  });

  test("should add lumpsum investment", async ({ page }) => {
    const lumpsumFund = mutualFundsData.find((f) => f.investmentType === "lumpsum")!;

    await mfPage.openAddForm();
    await mfPage.fillMutualFundForm({
      fundName: lumpsumFund.fundName,
      category: lumpsumFund.category,
      investmentType: "Lumpsum",
      units: lumpsumFund.units,
      nav: lumpsumFund.averageNav,
    });

    await mfPage.saveForm();
    await mfPage.expectFormDialogClosed();
    await mfPage.expectFundInTable(lumpsumFund.fundName);
  });

  test("should edit mutual fund", async ({ page }) => {
    const testFund = mutualFundsData[0];

    // First add the fund
    await mfPage.openAddForm();
    await mfPage.fillMutualFundForm({
      fundName: testFund.fundName,
      category: testFund.category,
      investmentType: "SIP",
      sipAmount: testFund.sipAmount,
      units: testFund.units,
      nav: testFund.averageNav,
    });
    await mfPage.saveForm();

    // Now edit it
    await mfPage.editFund(testFund.fundName);
    await mfPage.expectFormDialogVisible();

    const updatedUnits = testFund.units + 500;
    await mfPage.fillMutualFundForm({
      units: updatedUnits,
    });
    await mfPage.saveForm();
    await mfPage.expectFormDialogClosed();
  });

  test("should delete mutual fund", async ({ page }) => {
    const testFund = mutualFundsData[0];

    // First add the fund
    await mfPage.openAddForm();
    await mfPage.fillMutualFundForm({
      fundName: testFund.fundName,
      category: testFund.category,
      investmentType: "SIP",
      units: testFund.units,
      nav: testFund.averageNav,
    });
    await mfPage.saveForm();

    // Now delete it
    await mfPage.deleteFund(testFund.fundName);
    await mfPage.confirmDelete();
    await mfPage.expectFundNotInTable(testFund.fundName);
  });
});
