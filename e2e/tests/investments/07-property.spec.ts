import { test, expect } from "@playwright/test";
import { PropertyPage } from "../../pages/investments";
import { propertyData } from "../../fixtures/investments-data";

test.describe("Property Investments", () => {
  let propertyPage: PropertyPage;

  test.beforeEach(async ({ page }) => {
    propertyPage = new PropertyPage(page);
    await propertyPage.navigateTo();
  });

  test("should display property page correctly", async ({ page }) => {
    await propertyPage.expectPageLoaded();
    await expect(propertyPage.addPropertyButton).toBeVisible();
  });

  test("should show summary cards", async ({ page }) => {
    await expect(propertyPage.totalValueCard).toBeVisible();
    await expect(propertyPage.totalInvestedCard).toBeVisible();
    await expect(propertyPage.appreciationCard).toBeVisible();
  });

  test("should add property investment", async ({ page }) => {
    const testProperty = propertyData[0]; // Whitefield Apartment

    await propertyPage.openAddForm();
    await propertyPage.fillPropertyForm({
      propertyName: testProperty.propertyName,
      propertyType: testProperty.propertyType,
      address: testProperty.location,
      purchaseDate: testProperty.purchaseDate,
      purchasePrice: testProperty.purchasePrice,
      currentValue: testProperty.currentValuation,
      isRented: testProperty.isLetOut,
      monthlyRent: testProperty.monthlyRent,
    });

    await propertyPage.saveForm();
    await propertyPage.expectFormDialogClosed();
    await propertyPage.expectPropertyInTable(testProperty.propertyName);
  });

  test("should calculate appreciation correctly", async ({ page }) => {
    const testProperty = propertyData[0];

    await propertyPage.openAddForm();
    await propertyPage.fillPropertyForm({
      propertyName: testProperty.propertyName,
      propertyType: testProperty.propertyType,
      purchasePrice: testProperty.purchasePrice,
      currentValue: testProperty.currentValuation,
    });

    await propertyPage.saveForm();

    // Check appreciation is displayed
    const appreciationValue = await propertyPage.getAppreciation();
    expect(appreciationValue).toContain("₹");
    // Should be positive (current > purchase)
    const numericValue = propertyPage.parseINR(appreciationValue);
    expect(numericValue).toBeGreaterThan(0);
  });

  test("should delete property", async ({ page }) => {
    const testProperty = propertyData[0];

    // First add the property
    await propertyPage.openAddForm();
    await propertyPage.fillPropertyForm({
      propertyName: testProperty.propertyName,
      propertyType: testProperty.propertyType,
      purchasePrice: testProperty.purchasePrice,
      currentValue: testProperty.currentValuation,
    });
    await propertyPage.saveForm();

    // Now delete it
    await propertyPage.deleteProperty(testProperty.propertyName);
    await propertyPage.confirmDelete();
    await propertyPage.expectPropertyNotInTable(testProperty.propertyName);
  });
});
