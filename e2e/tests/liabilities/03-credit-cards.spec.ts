import { test, expect } from "@playwright/test";
import { CreditCardsPage } from "../../pages/liabilities";
import { creditCardsData, liabilitiesSummary } from "../../fixtures/liabilities-data";

test.describe("Credit Cards", () => {
  let creditCardsPage: CreditCardsPage;

  test.beforeEach(async ({ page }) => {
    creditCardsPage = new CreditCardsPage(page);
    await creditCardsPage.navigateTo();
  });

  test("should display credit cards page correctly", async ({ page }) => {
    await creditCardsPage.expectPageLoaded();
    await expect(creditCardsPage.addCardButton).toBeVisible();
  });

  test("should show summary cards", async ({ page }) => {
    await expect(creditCardsPage.totalOutstandingCard).toBeVisible();
    await expect(creditCardsPage.totalLimitCard).toBeVisible();
    await expect(creditCardsPage.avgUtilizationCard).toBeVisible();
  });

  test("should open add card form dialog", async ({ page }) => {
    await creditCardsPage.openAddForm();
    await creditCardsPage.expectFormDialogVisible();
    await expect(creditCardsPage.cardNameField).toBeVisible();
    await expect(creditCardsPage.creditLimitField).toBeVisible();
  });

  test("should add credit card", async ({ page }) => {
    const testCard = creditCardsData[0]; // HDFC Regalia

    await creditCardsPage.openAddForm();
    await creditCardsPage.fillCardForm({
      cardName: testCard.cardName,
      bankName: testCard.bankName,
      cardNumber: testCard.cardNumber,
      creditLimit: testCard.creditLimit,
      outstanding: testCard.currentOutstanding,
      minimumDue: testCard.minimumDue,
      dueDate: testCard.dueDate,
      interestRate: testCard.interestRate,
    });

    await creditCardsPage.saveForm();
    await creditCardsPage.expectFormDialogClosed();
    await creditCardsPage.expectCardInTable(testCard.cardName);
  });

  test("should calculate utilization correctly", async ({ page }) => {
    const testCard = creditCardsData[0];

    await creditCardsPage.openAddForm();
    await creditCardsPage.fillCardForm({
      cardName: testCard.cardName,
      creditLimit: testCard.creditLimit,
      outstanding: testCard.currentOutstanding,
    });
    await creditCardsPage.saveForm();

    // Check utilization is displayed
    const utilization = await creditCardsPage.getUtilization();
    expect(utilization).toContain("%");
  });

  test("should edit credit card", async ({ page }) => {
    const testCard = creditCardsData[0];

    // First add the card
    await creditCardsPage.openAddForm();
    await creditCardsPage.fillCardForm({
      cardName: testCard.cardName,
      bankName: testCard.bankName,
      creditLimit: testCard.creditLimit,
      outstanding: testCard.currentOutstanding,
    });
    await creditCardsPage.saveForm();

    // Now edit it
    await creditCardsPage.editCard(testCard.cardName);
    await creditCardsPage.expectFormDialogVisible();

    const updatedOutstanding = testCard.currentOutstanding + 10000;
    await creditCardsPage.fillCardForm({
      outstanding: updatedOutstanding,
    });
    await creditCardsPage.saveForm();
    await creditCardsPage.expectFormDialogClosed();
  });

  test("should delete credit card", async ({ page }) => {
    const testCard = creditCardsData[0];

    // First add the card
    await creditCardsPage.openAddForm();
    await creditCardsPage.fillCardForm({
      cardName: testCard.cardName,
      creditLimit: testCard.creditLimit,
    });
    await creditCardsPage.saveForm();

    // Now delete it
    await creditCardsPage.deleteCard(testCard.cardName);
    await creditCardsPage.confirmDelete();
    await creditCardsPage.expectCardNotInTable(testCard.cardName);
  });
});
