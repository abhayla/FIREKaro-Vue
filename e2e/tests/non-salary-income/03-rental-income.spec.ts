import { test, expect } from "@playwright/test";
import { RentalIncomePage } from "../../pages/non-salary-income";
import { rentalIncomeData, nonSalaryIncomeSummary } from "../../fixtures/non-salary-income-data";

test.describe("Rental Income (House Property)", () => {
  let rentalPage: RentalIncomePage;

  test.beforeEach(async ({ page }) => {
    rentalPage = new RentalIncomePage(page);
    await rentalPage.navigateTo();
  });

  test("should display rental income page correctly", async ({ page }) => {
    await rentalPage.expectPageLoaded();
    await expect(rentalPage.addPropertyButton).toBeVisible();
  });

  test("should open add property form dialog", async ({ page }) => {
    await rentalPage.openAddForm();
    await rentalPage.expectFormDialogVisible();
    await expect(rentalPage.propertyNameField).toBeVisible();
    await expect(rentalPage.propertyTypeSelect).toBeVisible();
    await expect(rentalPage.monthlyRentField).toBeVisible();
  });

  test("should add rental property with full details", async ({ page }) => {
    const testData = rentalIncomeData[0]; // Whitefield Apartment

    await rentalPage.openAddForm();
    await rentalPage.fillRentalForm({
      propertyName: testData.propertyName,
      propertyType: testData.propertyType,
      propertyAddress: testData.propertyAddress,
      monthlyRent: testData.monthlyRent,
      vacantMonths: testData.vacantMonths,
      municipalTaxesPaid: testData.municipalTaxesPaid,
      housingLoanInterest: testData.housingLoanInterest,
      isLetOut: testData.isLetOut,
    });

    await rentalPage.saveForm();
    await rentalPage.expectFormDialogClosed();
    await rentalPage.expectPropertyInTable(testData.propertyName);
  });

  test("should auto-calculate annual rent from monthly rent", async ({ page }) => {
    await rentalPage.openAddForm();
    await rentalPage.fillRentalForm({
      monthlyRent: 25000,
    });

    // Wait for calculation
    await page.waitForTimeout(500);

    // Annual rent should be auto-calculated (25000 * 12 = 300000)
    const annualRentValue = await rentalPage.annualRentField.inputValue();
    expect(parseInt(annualRentValue)).toBe(300000);
  });

  test("should edit existing rental property", async ({ page }) => {
    const testData = rentalIncomeData[0];

    // First add the property
    await rentalPage.openAddForm();
    await rentalPage.fillRentalForm({
      propertyName: testData.propertyName,
      propertyType: testData.propertyType,
      monthlyRent: testData.monthlyRent,
    });
    await rentalPage.saveForm();

    // Now edit it
    await rentalPage.editProperty(testData.propertyName);
    await rentalPage.expectFormDialogVisible();

    const updatedRent = testData.monthlyRent + 5000;
    await rentalPage.fillRentalForm({
      monthlyRent: updatedRent,
    });
    await rentalPage.saveForm();
    await rentalPage.expectFormDialogClosed();
  });

  test("should delete rental property", async ({ page }) => {
    const testData = rentalIncomeData[0];

    // First add the property
    await rentalPage.openAddForm();
    await rentalPage.fillRentalForm({
      propertyName: testData.propertyName,
      propertyType: testData.propertyType,
      monthlyRent: testData.monthlyRent,
    });
    await rentalPage.saveForm();

    // Now delete it
    await rentalPage.deleteProperty(testData.propertyName);
    await rentalPage.confirmDeleteProperty();
    await rentalPage.expectPropertyNotInTable(testData.propertyName);
  });

  test("should cancel form without saving", async ({ page }) => {
    await rentalPage.openAddForm();
    await rentalPage.fillRentalForm({
      propertyName: "Test Property",
      monthlyRent: 20000,
    });
    await rentalPage.cancelForm();
    await rentalPage.expectFormDialogClosed();
    await rentalPage.expectPropertyNotInTable("Test Property");
  });
});
