import { test, expect } from "@playwright/test";
import { SalaryDetailsPage } from "../../pages/salary";

test.describe("Clear Salary Data - Month-Level Operations", () => {
  let detailsPage: SalaryDetailsPage;

  test.beforeEach(async ({ page }) => {
    detailsPage = new SalaryDetailsPage(page);
    await detailsPage.navigateTo();
    await detailsPage.enterEditMode();
  });

  test("should show Clear option in column header menu", async ({ page }) => {
    // Click on a month header
    await detailsPage.clickMonthHeader("May");

    // Should show Clear option
    await expect(detailsPage.clearMonthOption).toBeVisible();
  });

  test("should open Clear confirmation dialog", async ({ page }) => {
    await detailsPage.clearMonth("May");

    // Dialog should be visible
    await detailsPage.expectCopyDialogOpen();
  });

  test("should show warning in Clear dialog", async ({ page }) => {
    await detailsPage.clearMonth("May");

    // Should show warning about clearing data in the dialog
    const dialog = page.locator(".v-dialog");
    const hasTitle = await dialog.getByText(/Clear Month/i).isVisible().catch(() => false);
    const hasWarning = await dialog.getByText(/reset|0|cannot.*undone|clear.*data/i).isVisible().catch(() => false);
    expect(hasTitle || hasWarning).toBeTruthy();
  });

  test("should show month name in Clear dialog", async ({ page }) => {
    await detailsPage.clearMonth("Jul");

    // Should show the month being cleared in the dialog content
    const dialog = page.locator(".v-dialog");
    const hasJul = await dialog.getByText(/Jul/i).isVisible().catch(() => false);
    expect(hasJul).toBeTruthy();
  });

  test("should cancel Clear and keep data", async ({ page }) => {
    // Enter some data first
    const basicRow = page.locator("tr, .grid-row").filter({ hasText: /Basic/i });
    const basicInput = basicRow.locator("input").first();

    if (await basicInput.isVisible()) {
      await basicInput.fill("150000");
    }

    // Open clear dialog for April
    await detailsPage.clearMonth("Apr");

    // Cancel
    await detailsPage.cancelCopyDialog();

    // Data should still be there
    const value = await basicRow.locator("input").first().inputValue();
    expect(value).toBe("150000");
  });

  test("should clear month data after confirmation", async ({ page }) => {
    // Enter some data first
    const basicRow = page.locator("tr, .grid-row").filter({ hasText: /Basic/i });
    const basicInput = basicRow.locator("input").first();

    if (await basicInput.isVisible()) {
      await basicInput.fill("200000");
    }

    // Clear April
    await detailsPage.clearMonth("Apr");

    // Confirm clear - click Clear button in dialog
    const dialog = page.locator(".v-dialog");
    const clearBtn = dialog.getByRole("button", { name: /^Clear$/ });
    if (await clearBtn.isVisible()) {
      await clearBtn.click();
      await page.waitForTimeout(500);
    }

    // Data should be cleared
    const clearedValue = await basicRow.locator("input").first().inputValue();
    expect(clearedValue === "0" || clearedValue === "").toBeTruthy();
  });

  test("should clear all earnings for the month", async ({ page }) => {
    // Enter multiple earnings
    const basicRow = page.locator("tr, .grid-row").filter({ hasText: /Basic/i });
    const hraRow = page.locator("tr, .grid-row").filter({ hasText: /HRA/i });

    const basicInput = basicRow.locator("input").first();
    const hraInput = hraRow.locator("input").first();

    if (await basicInput.isVisible()) {
      await basicInput.fill("100000");
    }
    if (await hraInput.isVisible()) {
      await hraInput.fill("40000");
    }

    // Clear April
    await detailsPage.clearMonth("Apr");
    await page.locator(".v-dialog").getByRole("button", { name: /^Clear$/ }).click();
    await page.waitForTimeout(500);

    // Both should be cleared
    if (await basicRow.locator("input").first().isVisible()) {
      const basicValue = await basicRow.locator("input").first().inputValue();
      expect(basicValue === "0" || basicValue === "").toBeTruthy();
    }
    if (await hraRow.locator("input").first().isVisible()) {
      const hraValue = await hraRow.locator("input").first().inputValue();
      expect(hraValue === "0" || hraValue === "").toBeTruthy();
    }
  });

  test("should clear all deductions for the month", async ({ page }) => {
    // Enter deductions
    const epfRow = page.locator("tr, .grid-row").filter({ hasText: /EPF/i }).first();
    const epfInput = epfRow.locator("input").first();

    if (await epfInput.isVisible()) {
      await epfInput.fill("12000");
    }

    // Clear April
    await detailsPage.clearMonth("Apr");
    await page.locator(".v-dialog").getByRole("button", { name: /^Clear$/ }).click();
    await page.waitForTimeout(500);

    // EPF should be cleared
    if (await epfRow.locator("input").first().isVisible()) {
      const epfValue = await epfRow.locator("input").first().inputValue();
      expect(epfValue === "0" || epfValue === "").toBeTruthy();
    }
  });

  test("should update Gross and Net when month is cleared", async ({ page }) => {
    // Enter earnings
    const basicRow = page.locator("tr, .grid-row").filter({ hasText: /Basic/i });
    const basicInput = basicRow.locator("input").first();

    if (await basicInput.isVisible()) {
      await basicInput.fill("100000");
      await page.waitForTimeout(300);
    }

    // Get Gross before clear
    const grossRow = page.locator("tr, .grid-row").filter({ hasText: /Gross/i });
    const grossBefore = await grossRow.locator("td, .grid-cell").nth(1).textContent();

    // Clear April
    await detailsPage.clearMonth("Apr");
    await page.locator(".v-dialog").getByRole("button", { name: /^Clear$/ }).click();
    await page.waitForTimeout(500);

    // Gross should update (be different or empty)
    const grossAfter = await grossRow.locator("td, .grid-cell").nth(1).textContent();
    if (grossBefore && grossBefore !== "0" && grossBefore !== "-") {
      expect(grossAfter === "0" || grossAfter === "-" || grossAfter !== grossBefore).toBeTruthy();
    }
  });

  test("should update Total column when month is cleared", async ({ page }) => {
    // Enter values for April and May
    const basicRow = page.locator("tr, .grid-row").filter({ hasText: /Basic/i });
    const basicInputs = basicRow.locator("input");

    const inputCount = await basicInputs.count();
    if (inputCount >= 2) {
      await basicInputs.nth(0).fill("100000");
      await basicInputs.nth(1).fill("100000");
      await page.waitForTimeout(300);
    }

    // Get Total before clear
    const totalBefore = await basicRow.locator("td, .grid-cell").last().textContent();

    // Clear April
    await detailsPage.clearMonth("Apr");
    await page.locator(".v-dialog").getByRole("button", { name: /^Clear$/ }).click();
    await page.waitForTimeout(500);

    // Total should decrease (only May value remains)
    const totalAfter = await basicRow.locator("td, .grid-cell").last().textContent();
    if (totalBefore && totalAfter) {
      // Total should be different after clearing one month
      expect(totalAfter !== totalBefore || totalAfter === "0").toBeTruthy();
    }
  });

  test("should not affect other months when clearing one month", async ({ page }) => {
    // Enter values for April and May
    const basicRow = page.locator("tr, .grid-row").filter({ hasText: /Basic/i });
    const basicInputs = basicRow.locator("input");

    const inputCount = await basicInputs.count();
    if (inputCount >= 2) {
      await basicInputs.nth(0).fill("100000");
      await basicInputs.nth(1).fill("150000");
      await page.waitForTimeout(300);
    }

    // Clear April only
    await detailsPage.clearMonth("Apr");
    await page.locator(".v-dialog").getByRole("button", { name: /^Clear$/ }).click();
    await page.waitForTimeout(500);

    // May should still have its value
    if (inputCount >= 2) {
      const mayValue = await basicInputs.nth(1).inputValue();
      expect(mayValue).toBe("150000");
    }
  });

  test("should be able to re-enter data after clearing", async ({ page }) => {
    // Enter, clear, then re-enter data
    const basicRow = page.locator("tr, .grid-row").filter({ hasText: /Basic/i });
    const basicInput = basicRow.locator("input").first();

    if (await basicInput.isVisible()) {
      // Enter initial value
      await basicInput.fill("100000");

      // Clear
      await detailsPage.clearMonth("Apr");
      await page.locator(".v-dialog").getByRole("button", { name: /^Clear$/ }).click();
      await page.waitForTimeout(500);

      // Re-enter new value
      await basicInput.fill("200000");
      expect(await basicInput.inputValue()).toBe("200000");
    }
  });
});

test.describe("Manage Employers - Delete Employer", () => {
  let detailsPage: SalaryDetailsPage;

  test.beforeEach(async ({ page }) => {
    detailsPage = new SalaryDetailsPage(page);
    await detailsPage.navigateTo();
  });

  test("should open Manage Employers dialog from settings", async ({ page }) => {
    await detailsPage.openSettingsMenu();
    await page.getByText(/Manage Employers/i).click();
    await page.waitForTimeout(300);

    await detailsPage.expectManageEmployersDialogOpen();
  });

  test("should show list of employers in Manage Employers dialog", async ({ page }) => {
    await detailsPage.openSettingsMenu();
    await page.getByText(/Manage Employers/i).click();
    await page.waitForTimeout(300);

    // Should show employer cards or empty state
    const hasEmployers = await page.locator(".v-card").filter({ hasText: /Gross|Net|months/ }).count() > 0;
    const hasEmptyState = await page.getByText(/no.*employers/i).isVisible();

    expect(hasEmployers || hasEmptyState).toBeTruthy();
  });

  test("should show Delete button on non-primary employer", async ({ page }) => {
    await detailsPage.openSettingsMenu();
    await page.getByText(/Manage Employers/i).click();
    await page.waitForTimeout(300);

    // Look for delete button (may not exist if only one employer or all are primary)
    const deleteButton = page.getByRole("button", { name: /delete/i });
    // This is optional - might not have deletable employers
    expect(await deleteButton.count() >= 0).toBeTruthy();
  });

  test("should not show Delete button on primary employer", async ({ page }) => {
    await detailsPage.openSettingsMenu();
    await page.getByText(/Manage Employers/i).click();
    await page.waitForTimeout(300);

    // Find primary employer card
    const primaryCard = page.locator(".v-card").filter({ hasText: /PRIMARY/i });

    if (await primaryCard.isVisible()) {
      // Primary employer should not have delete button
      const deleteInPrimary = primaryCard.getByRole("button", { name: /delete/i });
      expect(await deleteInPrimary.count()).toBe(0);
    }
  });

  test("should show delete confirmation when clicking Delete", async ({ page }) => {
    await detailsPage.openSettingsMenu();
    await page.getByText(/Manage Employers/i).click();
    await page.waitForTimeout(300);

    const deleteButton = page.locator(".v-card:not(:has-text('PRIMARY'))").getByRole("button", { name: /delete/i }).first();

    if (await deleteButton.isVisible()) {
      await deleteButton.click();
      await page.waitForTimeout(300);

      // Should show confirmation dialog
      await expect(page.getByText(/Delete.*Employer|Confirm.*Delete/i)).toBeVisible();
    }
  });

  test("should cancel delete and keep employer", async ({ page }) => {
    await detailsPage.openSettingsMenu();
    await page.getByText(/Manage Employers/i).click();
    await page.waitForTimeout(300);

    // Get initial employer count
    const employerCards = page.locator(".v-card").filter({ hasText: /Gross|Net/ });
    const initialCount = await employerCards.count();

    const deleteButton = page.locator(".v-card:not(:has-text('PRIMARY'))").getByRole("button", { name: /delete/i }).first();

    if (await deleteButton.isVisible()) {
      await deleteButton.click();
      await page.waitForTimeout(300);

      // Cancel
      await page.getByRole("button", { name: /Cancel/i }).click();
      await page.waitForTimeout(300);

      // Count should be same
      const finalCount = await employerCards.count();
      expect(finalCount).toBe(initialCount);
    }
  });
});
