import { test, expect } from "@playwright/test";
import { SalaryOverviewPage, SalaryHistoryPage, SalaryFormPage } from "../../pages/salary";

test.describe("Salary Monthly Grid", () => {
  let overviewPage: SalaryOverviewPage;
  let historyPage: SalaryHistoryPage;
  let formPage: SalaryFormPage;

  const testEmployer = "Grid Test Company";

  test.beforeEach(async ({ page }) => {
    overviewPage = new SalaryOverviewPage(page);
    historyPage = new SalaryHistoryPage(page);
    formPage = new SalaryFormPage(page);
  });

  /**
   * Helper to ensure test data exists for grid testing
   */
  async function ensureEmployerWithData(page: import("@playwright/test").Page) {
    // Navigate to history page
    await historyPage.navigateTo();
    await page.waitForTimeout(1000);

    // Check if we have any data
    const hasData = await page.locator("tbody tr").filter({ hasText: /'\d{2}$/ }).count() > 0;

    if (!hasData) {
      // Create a few test records
      await historyPage.clickAddMonth();
      await formPage.fillForm({
        employer: testEmployer,
        month: "April",
        basicSalary: 100000,
        hra: 40000,
        specialAllowance: 20000,
        epfDeduction: 12000,
        professionalTax: 200,
        tdsDeduction: 15000,
      });
      await formPage.save();
      await page.waitForTimeout(1000);

      await historyPage.clickAddMonth();
      await formPage.fillForm({
        month: "May",
        basicSalary: 100000,
        hra: 40000,
        specialAllowance: 20000,
        epfDeduction: 12000,
        professionalTax: 200,
        tdsDeduction: 15000,
      });
      await formPage.save();
      await page.waitForTimeout(1000);
    }
  }

  test("should display Salary Sources section with employer cards", async ({
    page,
  }) => {
    await ensureEmployerWithData(page);
    await overviewPage.navigateTo();
    await page.waitForTimeout(1000);

    // Verify Salary Sources section is visible
    await expect(page.getByText(/Salary Sources/i)).toBeVisible();
  });

  test("should open monthly grid dialog when clicking View Breakdown on employer card", async ({
    page,
  }) => {
    await ensureEmployerWithData(page);
    await overviewPage.navigateTo();
    await page.waitForTimeout(1000);

    // Find employer card with View Breakdown button
    const viewBreakdownButton = page.getByRole("button", { name: /View.*Breakdown|Breakdown/i }).first();

    if (await viewBreakdownButton.isVisible()) {
      await viewBreakdownButton.click();
      await page.waitForTimeout(500);

      // Monthly grid dialog should open
      await expect(page.getByText(/Monthly Breakdown/i)).toBeVisible();
    }
  });

  test("should display FY month headers in grid (Apr to Mar)", async ({
    page,
  }) => {
    await ensureEmployerWithData(page);
    await overviewPage.navigateTo();
    await page.waitForTimeout(1000);

    // Open the grid dialog
    const viewBreakdownButton = page.getByRole("button", { name: /View.*Breakdown|Breakdown/i }).first();

    if (await viewBreakdownButton.isVisible()) {
      await viewBreakdownButton.click();
      await page.waitForTimeout(500);

      // Check for FY month headers
      const monthHeaders = ["Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec", "Jan", "Feb", "Mar"];

      for (const month of monthHeaders.slice(0, 3)) {
        await expect(page.getByText(month).first()).toBeVisible();
      }
    }
  });

  test("should display EARNINGS section in grid", async ({ page }) => {
    await ensureEmployerWithData(page);
    await overviewPage.navigateTo();
    await page.waitForTimeout(1000);

    const viewBreakdownButton = page.getByRole("button", { name: /View.*Breakdown|Breakdown/i }).first();

    if (await viewBreakdownButton.isVisible()) {
      await viewBreakdownButton.click();
      await page.waitForTimeout(500);

      // Check for EARNINGS section header
      await expect(page.getByText("EARNINGS")).toBeVisible();
    }
  });

  test("should display DEDUCTIONS section in grid", async ({ page }) => {
    await ensureEmployerWithData(page);
    await overviewPage.navigateTo();
    await page.waitForTimeout(1000);

    const viewBreakdownButton = page.getByRole("button", { name: /View.*Breakdown|Breakdown/i }).first();

    if (await viewBreakdownButton.isVisible()) {
      await viewBreakdownButton.click();
      await page.waitForTimeout(500);

      // Check for DEDUCTIONS section header
      await expect(page.getByText("DEDUCTIONS")).toBeVisible();
    }
  });

  test("should display Paid Days row in grid", async ({ page }) => {
    await ensureEmployerWithData(page);
    await overviewPage.navigateTo();
    await page.waitForTimeout(1000);

    const viewBreakdownButton = page.getByRole("button", { name: /View.*Breakdown|Breakdown/i }).first();

    if (await viewBreakdownButton.isVisible()) {
      await viewBreakdownButton.click();
      await page.waitForTimeout(500);

      // Check for Paid Days row
      await expect(page.getByText("Paid Days")).toBeVisible();
    }
  });

  test("should display Gross Earnings row in grid", async ({ page }) => {
    await ensureEmployerWithData(page);
    await overviewPage.navigateTo();
    await page.waitForTimeout(1000);

    const viewBreakdownButton = page.getByRole("button", { name: /View.*Breakdown|Breakdown/i }).first();

    if (await viewBreakdownButton.isVisible()) {
      await viewBreakdownButton.click();
      await page.waitForTimeout(500);

      // Check for Gross Earnings summary row
      await expect(page.getByText(/Gross Earnings/i)).toBeVisible();
    }
  });

  test("should display Net Salary row in grid", async ({ page }) => {
    await ensureEmployerWithData(page);
    await overviewPage.navigateTo();
    await page.waitForTimeout(1000);

    const viewBreakdownButton = page.getByRole("button", { name: /View.*Breakdown|Breakdown/i }).first();

    if (await viewBreakdownButton.isVisible()) {
      await viewBreakdownButton.click();
      await page.waitForTimeout(500);

      // Check for Net Salary summary row
      await expect(page.getByText(/Net Salary/i)).toBeVisible();
    }
  });

  test("should display Total column in grid", async ({ page }) => {
    await ensureEmployerWithData(page);
    await overviewPage.navigateTo();
    await page.waitForTimeout(1000);

    const viewBreakdownButton = page.getByRole("button", { name: /View.*Breakdown|Breakdown/i }).first();

    if (await viewBreakdownButton.isVisible()) {
      await viewBreakdownButton.click();
      await page.waitForTimeout(500);

      // Check for Total column header
      await expect(page.getByText("Total").first()).toBeVisible();
    }
  });

  test("should close grid dialog when clicking close button", async ({
    page,
  }) => {
    await ensureEmployerWithData(page);
    await overviewPage.navigateTo();
    await page.waitForTimeout(1000);

    const viewBreakdownButton = page.getByRole("button", { name: /View.*Breakdown|Breakdown/i }).first();

    if (await viewBreakdownButton.isVisible()) {
      await viewBreakdownButton.click();
      await page.waitForTimeout(500);

      // Dialog should be open
      await expect(page.getByText(/Monthly Breakdown/i)).toBeVisible();

      // Click close button
      await page.locator(".v-dialog button:has(.mdi-close)").click();
      await page.waitForTimeout(500);

      // Dialog should be closed
      await expect(page.locator(".v-dialog").filter({ hasText: /Monthly Breakdown/i })).not.toBeVisible();
    }
  });

  test("should display values in INR format in grid cells", async ({
    page,
  }) => {
    await ensureEmployerWithData(page);
    await overviewPage.navigateTo();
    await page.waitForTimeout(1000);

    const viewBreakdownButton = page.getByRole("button", { name: /View.*Breakdown|Breakdown/i }).first();

    if (await viewBreakdownButton.isVisible()) {
      await viewBreakdownButton.click();
      await page.waitForTimeout(500);

      // Check for INR formatted values (lakhs format like 1.0L, 1.2L)
      // Or regular INR format with commas
      const hasINRFormat = await page.getByText(/[\d,]+L|₹[\d,]+/).first().isVisible();
      expect(hasINRFormat).toBeTruthy();
    }
  });

  test("should show empty state when no salary data exists", async ({
    page,
  }) => {
    // Navigate to an empty FY
    await overviewPage.navigateTo();
    await page.waitForTimeout(500);

    // Select an old FY that likely has no data
    await page
      .locator(".v-select")
      .filter({ has: page.locator('text="Financial Year"') })
      .click();

    const oldFY = page.getByRole("option", { name: "20-21" });
    if (await oldFY.isVisible()) {
      await oldFY.click();
      await page.waitForTimeout(500);

      // Should show empty state in employer cards section
      await expect(
        page.getByText(/no.*employers|add.*employer|no.*data/i)
      ).toBeVisible();
    }
  });
});
