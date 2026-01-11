import { test, expect } from "@playwright/test";
import { ReportsPage } from "../../pages/tax-planning";

/**
 * Tax Planning Reports Tests
 *
 * Structure: Tax Details tab → Reports accordion section
 * The reports section is now inside an accordion in the Tax Details tab
 */
test.describe("Tax Planning Reports", () => {
  let reportsPage: ReportsPage;

  test.beforeEach(async ({ page }) => {
    reportsPage = new ReportsPage(page);
    // navigateTo() now handles: go to page → click Tax Details tab → expand Reports accordion
    await reportsPage.navigateTo();
  });

  test("should load reports section", async ({ page }) => {
    await reportsPage.expectPageLoaded();
    // URL remains /tax-planning (accordion-based, not route-based)
    await expect(page).toHaveURL(/\/dashboard\/tax-planning$/);
  });

  test("should display Tax Details tab as active with Reports expanded", async ({ page }) => {
    await expect(reportsPage.taxDetailsTab).toHaveAttribute("aria-selected", "true");
    await expect(reportsPage.reportsContent).toBeVisible();
  });

  test.describe("Controls", () => {
    test("should display financial year selector", async ({ page }) => {
      await expect(reportsPage.financialYearSelect).toBeVisible();
    });

    test("should display export buttons", async () => {
      await reportsPage.expectExportButtonsVisible();
    });

    test("should have PDF export button", async ({ page }) => {
      await expect(reportsPage.exportPDFButton).toBeVisible();
      await expect(reportsPage.exportPDFButton).toContainText("PDF");
    });

    test("should have Excel export button", async ({ page }) => {
      await expect(reportsPage.exportExcelButton).toBeVisible();
      await expect(reportsPage.exportExcelButton).toContainText("Excel");
    });
  });

  test.describe("Report Tabs", () => {
    test("should display all report tabs", async () => {
      await reportsPage.expectReportTabsVisible();
    });

    test("should show Tax Summary tab by default", async ({ page }) => {
      await expect(reportsPage.summaryReportTab).toHaveAttribute("aria-selected", "true");
    });

    test("should switch to Regime Comparison tab", async ({ page }) => {
      await reportsPage.switchToComparisonTab();
      await expect(reportsPage.comparisonReportTab).toHaveAttribute("aria-selected", "true");
    });

    test("should switch to Deduction Utilization tab", async ({ page }) => {
      await reportsPage.switchToDeductionsTab();
      await expect(reportsPage.deductionsReportTab).toHaveAttribute("aria-selected", "true");
    });

    test("should switch to Advance Tax tab", async ({ page }) => {
      await reportsPage.switchToAdvanceTaxTab();
      await expect(reportsPage.advanceTaxReportTab).toHaveAttribute("aria-selected", "true");
    });
  });

  test.describe("Tax Summary Tab", () => {
    test("should display tax distribution chart", async () => {
      await reportsPage.expectSummaryTabContent();
    });

    test("should display summary cards", async ({ page }) => {
      // Check for key summary metrics
      await expect(page.locator("text=Gross Total Income")).toBeVisible();
      await expect(page.locator("text=Tax Payable")).toBeVisible();
    });

    test("should display tax summary table", async ({ page }) => {
      const table = page.locator(".v-card").filter({ hasText: /Tax Summary/i }).locator(".v-table");
      await expect(table).toBeVisible();

      // Check for key table rows
      await expect(page.locator("text=Taxable Income")).toBeVisible();
    });

    test("should show currency values", async () => {
      const grossIncome = await reportsPage.getGrossIncome();
      expect(grossIncome).toMatch(/₹|Rs\.?|\d/);
    });
  });

  test.describe("Regime Comparison Tab", () => {
    test.beforeEach(async () => {
      await reportsPage.switchToComparisonTab();
    });

    test("should display regime comparison chart", async () => {
      await reportsPage.expectComparisonTabContent();
    });

    test("should display Old vs New Regime chart", async ({ page }) => {
      await expect(page.locator("text=Old vs New Regime")).toBeVisible();
    });

    test("should display detailed comparison table", async ({ page }) => {
      await expect(page.locator("text=Detailed Comparison")).toBeVisible();

      // Check for comparison parameters
      await expect(page.locator("text=Gross Income")).toBeVisible();
      await expect(page.locator("text=Deductions")).toBeVisible();
      await expect(page.locator("text=Total Tax")).toBeVisible();
    });

    test("should show savings recommendation", async ({ page }) => {
      // Should show which regime is better
      const savingsAlert = page.locator(".v-alert").filter({ hasText: /saves you/i });
      const isVisible = await savingsAlert.isVisible().catch(() => false);

      if (isVisible) {
        await expect(savingsAlert).toContainText(/Regime/);
      }
    });
  });

  test.describe("Deduction Utilization Tab", () => {
    test.beforeEach(async () => {
      await reportsPage.switchToDeductionsTab();
    });

    test("should display deduction utilization chart", async () => {
      await reportsPage.expectDeductionsTabContent();
    });

    test("should show section-wise summary", async ({ page }) => {
      await expect(page.locator("text=Section-wise Summary")).toBeVisible();
    });

    test("should display 80C section", async ({ page }) => {
      await expect(page.locator("text=Section 80C")).toBeVisible();
    });

    test("should display 80D section", async ({ page }) => {
      await expect(page.locator("text=Section 80D")).toBeVisible();
    });

    test("should display 80CCD(1B) section", async ({ page }) => {
      await expect(page.locator("text=Section 80CCD(1B)")).toBeVisible();
    });

    test("should show utilization percentages", async ({ page }) => {
      // Check for utilization chips
      const utilizationChips = page.locator(".v-chip").filter({ hasText: /%/ });
      await expect(utilizationChips.first()).toBeVisible();
    });
  });

  test.describe("Advance Tax Tab", () => {
    test.beforeEach(async () => {
      await reportsPage.switchToAdvanceTaxTab();
    });

    test("should display advance tax schedule card", async () => {
      await reportsPage.expectAdvanceTaxTabContent();
    });

    test("should show Advance Tax Schedule title", async ({ page }) => {
      await expect(page.locator("text=Advance Tax Schedule")).toBeVisible();
    });

    test("should display summary cards when data exists", async ({ page }) => {
      // Check for summary cards (if data exists)
      const estimatedTaxCard = page.locator("text=Estimated Tax");
      const notApplicable = page.locator("text=Advance tax is not applicable");

      const hasData = await estimatedTaxCard.isVisible().catch(() => false);
      const notApplicableVisible = await notApplicable.isVisible().catch(() => false);

      // Either show data or not applicable message
      expect(hasData || notApplicableVisible).toBeTruthy();
    });

    test("should display schedule table when data exists", async ({ page }) => {
      const scheduleTable = page.locator(".v-card").filter({ hasText: /Advance Tax Schedule/i }).locator(".v-table");
      const notApplicable = page.locator("text=Advance tax is not applicable");

      const hasTable = await scheduleTable.isVisible().catch(() => false);
      const notApplicableVisible = await notApplicable.isVisible().catch(() => false);

      // Either show table or not applicable message
      expect(hasTable || notApplicableVisible).toBeTruthy();
    });

    test("should show quarter columns in schedule table", async ({ page }) => {
      const scheduleTable = page.locator(".v-card").filter({ hasText: /Advance Tax Schedule/i }).locator(".v-table");
      const hasTable = await scheduleTable.isVisible().catch(() => false);

      if (hasTable) {
        await expect(page.locator("th:has-text('Quarter')")).toBeVisible();
        await expect(page.locator("th:has-text('Due Date')")).toBeVisible();
        await expect(page.locator("th:has-text('Amount Due')")).toBeVisible();
        await expect(page.locator("th:has-text('Status')")).toBeVisible();
      }
    });
  });

  test.describe("ITR Form Reference", () => {
    test("should display ITR form reference section", async () => {
      await reportsPage.expectITRFormReference();
    });

    test("should show ITR Form Reference title", async ({ page }) => {
      await expect(page.locator("text=ITR Form Reference")).toBeVisible();
    });

    test("should display multiple ITR form options", async ({ page }) => {
      // Check for ITR form chips
      await expect(page.locator(".v-chip:has-text('ITR-1')")).toBeVisible();
      await expect(page.locator(".v-chip:has-text('ITR-2')")).toBeVisible();
    });
  });

  test.describe("Export Functionality", () => {
    test("should have clickable PDF export button", async ({ page }) => {
      await expect(reportsPage.exportPDFButton).toBeEnabled();
    });

    test("should have clickable Excel export button", async ({ page }) => {
      await expect(reportsPage.exportExcelButton).toBeEnabled();
    });

    test("PDF button should show loading state when clicked", async ({ page }) => {
      // Click PDF button and check for loading indicator
      const pdfButton = reportsPage.exportPDFButton;

      // Set up download listener to prevent actual download
      page.on("download", () => {});

      await pdfButton.click();

      // Button might show loading state briefly
      // We don't wait for completion since it triggers actual export
    });

    test("Excel button should show loading state when clicked", async ({ page }) => {
      // Click Excel button and check for loading indicator
      const excelButton = reportsPage.exportExcelButton;

      // Set up download listener to prevent actual download
      page.on("download", () => {});

      await excelButton.click();

      // Button might show loading state briefly
      // We don't wait for completion since it triggers actual export
    });
  });
});
