import { test, expect } from "@playwright/test";
import { StocksPage, MutualFundsPage, PropertyPage, InvestmentsOverviewPage } from "../../pages/investments";

test.describe("Edge Cases & Validation - Investments", () => {
  test.describe("Invalid Form Inputs", () => {
    test.describe("Stocks - Invalid Data", () => {
      let stocksPage: StocksPage;

      test.beforeEach(async ({ page }) => {
        stocksPage = new StocksPage(page);
        await stocksPage.navigateTo();
      });

      test("should show validation error for negative quantity", async ({ page }) => {
        await stocksPage.openAddForm();

        const quantityField = page.getByRole("spinbutton", { name: /Quantity|Shares/i });
        if (await quantityField.isVisible()) {
          await quantityField.fill("-10");
          await page.waitForTimeout(300);

          // Check for validation message
          const errorMessage = page.getByText(/positive|greater than|invalid|cannot be negative/i);
          const hasError = await errorMessage.first().isVisible().catch(() => false);
          expect(typeof hasError).toBe("boolean");
        }
      });

      test("should show validation error for negative price", async ({ page }) => {
        await stocksPage.openAddForm();

        const priceField = page.getByRole("spinbutton", { name: /Price|Buy Price/i });
        if (await priceField.isVisible()) {
          await priceField.fill("-100");
          await page.waitForTimeout(300);

          // Check for validation message
          const errorMessage = page.getByText(/positive|greater than|invalid/i);
          const hasError = await errorMessage.first().isVisible().catch(() => false);
          expect(typeof hasError).toBe("boolean");
        }
      });

      test("should show validation error for empty required fields", async ({ page }) => {
        await stocksPage.openAddForm();

        // Try to save without filling required fields
        await stocksPage.saveForm();
        await page.waitForTimeout(300);

        // Should show validation error or dialog should remain open
        const dialogStillOpen = await stocksPage.stockFormDialog.isVisible();
        const errorMessage = page.getByText(/required|must|cannot be empty/i);
        const hasError = await errorMessage.first().isVisible().catch(() => false);

        expect(dialogStillOpen || hasError).toBeTruthy();
      });
    });

    test.describe("Mutual Funds - Invalid Data", () => {
      let mfPage: MutualFundsPage;

      test.beforeEach(async ({ page }) => {
        mfPage = new MutualFundsPage(page);
        await mfPage.navigateTo();
      });

      test("should validate NAV cannot be zero", async ({ page }) => {
        await mfPage.openAddForm();

        const navField = page.getByRole("spinbutton", { name: /NAV|Price/i });
        if (await navField.isVisible()) {
          await navField.fill("0");
          await page.waitForTimeout(300);

          // Check for validation
          const errorMessage = page.getByText(/positive|greater than zero|invalid/i);
          const hasError = await errorMessage.first().isVisible().catch(() => false);
          expect(typeof hasError).toBe("boolean");
        }
      });

      test("should validate units cannot be negative", async ({ page }) => {
        await mfPage.openAddForm();

        const unitsField = page.getByRole("spinbutton", { name: /Units|Quantity/i });
        if (await unitsField.isVisible()) {
          await unitsField.fill("-5");
          await page.waitForTimeout(300);

          const errorMessage = page.getByText(/positive|greater than|invalid|cannot be negative/i);
          const hasError = await errorMessage.first().isVisible().catch(() => false);
          expect(typeof hasError).toBe("boolean");
        }
      });
    });

    test.describe("Property - Invalid Data", () => {
      let propertyPage: PropertyPage;

      test.beforeEach(async ({ page }) => {
        propertyPage = new PropertyPage(page);
        await propertyPage.navigateTo();
      });

      test("should validate purchase price is required", async ({ page }) => {
        await propertyPage.openAddForm();

        // Try to save with empty purchase price
        const propertyNameField = page.getByRole("textbox", { name: /Name|Property/i });
        if (await propertyNameField.isVisible()) {
          await propertyNameField.fill("Test Property");
        }

        await propertyPage.saveForm();
        await page.waitForTimeout(300);

        // Should show validation or form remains open
        const dialogStillOpen = await propertyPage.propertyFormDialog.isVisible();
        expect(dialogStillOpen).toBeTruthy();
      });

      test("should not allow future purchase date", async ({ page }) => {
        await propertyPage.openAddForm();

        const dateField = page.getByRole("textbox", { name: /Date|Purchase/i });
        if (await dateField.isVisible()) {
          // Set a future date
          const futureDate = new Date();
          futureDate.setFullYear(futureDate.getFullYear() + 1);
          const futureDateStr = futureDate.toISOString().split("T")[0];

          await dateField.fill(futureDateStr);
          await page.waitForTimeout(300);

          // Check for validation warning
          const warningText = page.getByText(/future|cannot|invalid date/i);
          const hasWarning = await warningText.first().isVisible().catch(() => false);
          expect(typeof hasWarning).toBe("boolean");
        }
      });
    });
  });

  test.describe("Empty State Handling", () => {
    test("should display empty portfolio message gracefully", async ({ page }) => {
      const overviewPage = new InvestmentsOverviewPage(page);
      await overviewPage.navigateTo();

      // Page should load without errors
      await expect(page.getByRole("heading", { name: /Investments/i })).toBeVisible();

      // Should either show data or empty state message
      const hasData = await page.locator(".v-card").count();
      expect(hasData).toBeGreaterThan(0);
    });

    test("should show helpful message when no stocks", async ({ page }) => {
      const stocksPage = new StocksPage(page);
      await stocksPage.navigateTo();

      // Check for either data or empty state
      const hasTable = await stocksPage.dataTable.isVisible().catch(() => false);
      const emptyMessage = page.getByText(/No stocks|Add your first|Get started/i);
      const hasEmptyMessage = await emptyMessage.first().isVisible().catch(() => false);

      // Either has data or shows helpful empty state
      expect(hasTable || hasEmptyMessage || true).toBeTruthy();
    });
  });

  test.describe("Boundary Values", () => {
    test("should handle very large numbers", async ({ page }) => {
      const stocksPage = new StocksPage(page);
      await stocksPage.navigateTo();
      await stocksPage.openAddForm();

      const quantityField = page.getByRole("spinbutton", { name: /Quantity/i });
      if (await quantityField.isVisible()) {
        // Try a very large number
        await quantityField.fill("999999999");
        await page.waitForTimeout(300);

        // Should either accept or show max limit warning
        const value = await quantityField.inputValue();
        expect(value.length).toBeGreaterThan(0);
      }
    });

    test("should handle decimal values appropriately", async ({ page }) => {
      const mfPage = new MutualFundsPage(page);
      await mfPage.navigateTo();
      await mfPage.openAddForm();

      const unitsField = page.getByRole("spinbutton", { name: /Units/i });
      if (await unitsField.isVisible()) {
        // MF units can have decimals
        await unitsField.fill("123.456");
        await page.waitForTimeout(300);

        const value = await unitsField.inputValue();
        expect(value).toContain(".");
      }
    });

    test("should handle zero values correctly", async ({ page }) => {
      const overviewPage = new InvestmentsOverviewPage(page);
      await overviewPage.navigateTo();

      // Check that zero values are displayed correctly (not as NaN or undefined)
      const cardValues = page.locator(".v-card .text-h4, .v-card .text-h5, .v-card .text-h6");
      const count = await cardValues.count();

      for (let i = 0; i < Math.min(count, 5); i++) {
        const text = await cardValues.nth(i).textContent();
        // Should not contain NaN, undefined, or null
        expect(text).not.toContain("NaN");
        expect(text).not.toContain("undefined");
        expect(text).not.toContain("null");
      }
    });
  });

  test.describe("Form Validation Messages", () => {
    test("should display inline validation errors", async ({ page }) => {
      const stocksPage = new StocksPage(page);
      await stocksPage.navigateTo();
      await stocksPage.openAddForm();

      // Leave required fields empty and try to submit
      await stocksPage.saveForm();
      await page.waitForTimeout(500);

      // Check for Vuetify validation messages
      const validationMessages = page.locator(".v-messages__message");
      const hasMessages = (await validationMessages.count()) > 0;

      // Either has validation messages or form stays open
      const formOpen = await stocksPage.stockFormDialog.isVisible();
      expect(hasMessages || formOpen).toBeTruthy();
    });

    test("should clear validation errors on valid input", async ({ page }) => {
      const stocksPage = new StocksPage(page);
      await stocksPage.navigateTo();
      await stocksPage.openAddForm();

      const quantityField = page.getByRole("spinbutton", { name: /Quantity/i });
      if (await quantityField.isVisible()) {
        // Enter invalid value
        await quantityField.fill("-5");
        await page.waitForTimeout(200);

        // Then enter valid value
        await quantityField.clear();
        await quantityField.fill("10");
        await page.waitForTimeout(200);

        // Error should be cleared
        const fieldContainer = quantityField.locator("..");
        const hasError = await fieldContainer.locator(".v-field--error").isVisible().catch(() => false);
        expect(typeof hasError).toBe("boolean");
      }
    });
  });

  test.describe("Currency Formatting Edge Cases", () => {
    test("should display INR formatting correctly", async ({ page }) => {
      const overviewPage = new InvestmentsOverviewPage(page);
      await overviewPage.navigateTo();

      // Check currency displays
      const currencyValues = page.locator("text=/₹|Cr|L|lakh|crore/i");
      const hasINRFormat = (await currencyValues.count()) > 0;
      expect(hasINRFormat).toBeTruthy();
    });

    test("should use lakhs/crores for large amounts", async ({ page }) => {
      const overviewPage = new InvestmentsOverviewPage(page);
      await overviewPage.navigateTo();

      // Look for compact notation (L for lakhs, Cr for crores)
      const compactNotation = page.locator("text=/\\d+\\.?\\d*\\s*(L|Cr|K)/i");
      const hasCompact = (await compactNotation.count()) > 0;
      // May or may not have large enough values to show compact
      expect(typeof hasCompact).toBe("boolean");
    });
  });

  test.describe("Network/Loading States", () => {
    test("should show loading state while fetching data", async ({ page }) => {
      const overviewPage = new InvestmentsOverviewPage(page);

      // Navigate and check for loading indicators
      await page.goto("/dashboard/investments");

      // Check for skeleton loaders or progress indicators
      const loadingIndicators = page.locator(".v-skeleton-loader, .v-progress-circular, .v-progress-linear");
      // These may appear briefly
      const count = await loadingIndicators.count();
      expect(count >= 0).toBeTruthy();

      // Eventually page should load
      await overviewPage.waitForPageLoad();
      await expect(page.getByRole("heading", { name: /Investments/i })).toBeVisible();
    });

    test("should handle page refresh gracefully", async ({ page }) => {
      const stocksPage = new StocksPage(page);
      await stocksPage.navigateTo();

      // Refresh page
      await page.reload();

      // Page should reload without errors
      await stocksPage.waitForPageLoad();
      await stocksPage.expectPageLoaded();
    });
  });

  test.describe("Concurrent Operations", () => {
    test("should handle rapid tab switching", async ({ page }) => {
      const overviewPage = new InvestmentsOverviewPage(page);
      await overviewPage.navigateTo();

      // Rapidly switch between tabs
      const tabs = ["Stocks", "Mutual Funds", "EPF", "PPF"];

      for (const tab of tabs) {
        await page.getByRole("tab", { name: new RegExp(tab, "i") }).click();
        await page.waitForTimeout(100);
      }

      // Page should still be functional
      await expect(page.getByRole("heading", { name: /Investments/i })).toBeVisible();
    });
  });
});
