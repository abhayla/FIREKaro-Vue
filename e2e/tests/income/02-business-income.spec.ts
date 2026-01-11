import { test, expect } from "@playwright/test";
import { BusinessIncomePage } from "../../pages/income";
import { businessIncomeData, incomeSummary } from "../../fixtures/income-data";

test.describe("Business Income (44AD/44ADA)", () => {
  let businessPage: BusinessIncomePage;

  // Clean up test data before all tests
  test.beforeAll(async ({ request }) => {
    // Delete all business income for test user via API
    // This ensures tests start with a clean slate
    try {
      const businesses = await request.get("/api/business-income?fy=2025-26");
      const data = await businesses.json();
      if (Array.isArray(data)) {
        for (const item of data) {
          await request.delete(`/api/business-income/${item.id}`);
        }
      }
    } catch {
      // Ignore cleanup errors
    }
  });

  test.beforeEach(async ({ page }) => {
    businessPage = new BusinessIncomePage(page);
    await businessPage.navigateTo();
  });

  test("should display business income page correctly", async ({ page }) => {
    await businessPage.expectPageLoaded();
    await expect(businessPage.addBusinessButton).toBeVisible();
  });

  test("should open add business form dialog", async ({ page }) => {
    await businessPage.openAddForm();
    await businessPage.expectFormDialogVisible();
    await expect(businessPage.businessNameField).toBeVisible();
    await expect(businessPage.businessTypeSelect).toBeVisible();
    await expect(businessPage.taxationMethodSelect).toBeVisible();
    await expect(businessPage.grossReceiptsField).toBeVisible();
  });

  test("should add freelance business with 44ADA taxation", async ({ page }) => {
    const testData = businessIncomeData[0]; // Tech Consulting Services

    await businessPage.openAddForm();
    await businessPage.fillBusinessForm({
      businessName: testData.businessName,
      businessType: testData.businessType as any,
      taxationMethod: testData.taxationMethod,
      grossReceipts: testData.grossReceipts,
      digitalPaymentPercentage: testData.digitalPaymentPercentage,
    });

    await businessPage.saveForm();
    await businessPage.expectFormDialogClosed();
    await businessPage.expectBusinessInTable(testData.businessName);
  });

  test("should add trading business with 44AD taxation", async ({ page }) => {
    const testData = businessIncomeData[1]; // Online Course Sales

    await businessPage.openAddForm();
    await businessPage.fillBusinessForm({
      businessName: testData.businessName,
      businessType: testData.businessType as any,
      taxationMethod: testData.taxationMethod,
      grossReceipts: testData.grossReceipts,
      digitalPaymentPercentage: testData.digitalPaymentPercentage,
    });

    await businessPage.saveForm();
    await businessPage.expectFormDialogClosed();
    await businessPage.expectBusinessInTable(testData.businessName);
  });

  test("should edit existing business income", async ({ page }) => {
    const testData = businessIncomeData[0];

    // First add the business
    await businessPage.openAddForm();
    await businessPage.fillBusinessForm({
      businessName: testData.businessName,
      businessType: testData.businessType as any,
      taxationMethod: testData.taxationMethod,
      grossReceipts: testData.grossReceipts,
    });
    await businessPage.saveForm();

    // Now edit it
    await businessPage.editBusiness(testData.businessName);
    await businessPage.expectFormDialogVisible();

    const updatedReceipts = testData.grossReceipts + 100000;
    await businessPage.fillBusinessForm({
      grossReceipts: updatedReceipts,
    });
    await businessPage.saveForm();
    await businessPage.expectFormDialogClosed();
  });

  test("should delete business income", async ({ page }) => {
    // Use unique name to avoid conflicts with other tests
    const uniqueName = `Delete Test Business ${Date.now()}`;

    // First add the business
    await businessPage.openAddForm();
    await businessPage.fillBusinessForm({
      businessName: uniqueName,
      businessType: "freelance",
      grossReceipts: 100000,
    });
    await businessPage.saveForm();
    await businessPage.expectBusinessInTable(uniqueName);

    // Now delete it
    await businessPage.deleteBusiness(uniqueName);
    await businessPage.expectDeleteDialogVisible();
    await businessPage.confirmDeleteBusiness();
    await businessPage.expectBusinessNotInTable(uniqueName);
  });

  test("should cancel delete operation", async ({ page }) => {
    const testData = businessIncomeData[0];

    // First add the business
    await businessPage.openAddForm();
    await businessPage.fillBusinessForm({
      businessName: testData.businessName,
      businessType: testData.businessType as any,
      grossReceipts: testData.grossReceipts,
    });
    await businessPage.saveForm();

    // Start delete but cancel
    await businessPage.deleteBusiness(testData.businessName);
    await businessPage.expectDeleteDialogVisible();
    await businessPage.cancelDeleteBusiness();
    await businessPage.expectBusinessInTable(testData.businessName);
  });

  test("should cancel form without saving", async ({ page }) => {
    await businessPage.openAddForm();
    await businessPage.fillBusinessForm({
      businessName: "Test Business",
      grossReceipts: 100000,
    });
    await businessPage.cancelForm();
    await businessPage.expectFormDialogClosed();
    await businessPage.expectBusinessNotInTable("Test Business");
  });
});
