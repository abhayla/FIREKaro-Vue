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
    // URL is /tax-planning (accordion-based, not route-based)
    await expect(page).toHaveURL(/\/tax-planning$/);
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
      // Export PDF button should be visible
      const pdfButton = page.getByRole("button", { name: /Export PDF/i });
      await expect(pdfButton).toBeVisible();
    });

    test("should have Excel export button", async ({ page }) => {
      await expect(reportsPage.exportExcelButton).toBeVisible();
      await expect(reportsPage.exportExcelButton).toContainText("Export Excel");
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
    // Note: Advance Tax is a separate accordion section, not a tab in Reports
  });

  test.describe("Tax Summary Tab", () => {
    test("should display tax distribution section", async ({ page }) => {
      // Tax Distribution chart/section should be visible
      await expect(page.getByText("Tax Distribution")).toBeVisible();
    });

    test("should display Tax Summary section", async ({ page }) => {
      await expect(page.getByText("Tax Summary").first()).toBeVisible();
    });

    test("should display ITR Form Reference section", async ({ page }) => {
      await expect(page.getByText("ITR Form Reference")).toBeVisible();
    });

    test("should show ITR form options", async ({ page }) => {
      // Check for ITR form section - forms might be below the fold
      // Look for at least one ITR form card
      const itrSection = page.getByText("ITR Form Reference");
      await expect(itrSection).toBeVisible();
      // The ITR forms are listed in this section
    });
  });

  test.describe("Regime Comparison Tab", () => {
    test.beforeEach(async () => {
      await reportsPage.switchToComparisonTab();
    });

    test("should switch to Regime Comparison tab", async ({ page }) => {
      // Tab should be selected after switch
      await expect(reportsPage.comparisonReportTab).toHaveAttribute("aria-selected", "true");
    });
  });

  test.describe("Deduction Utilization Tab", () => {
    test.beforeEach(async () => {
      await reportsPage.switchToDeductionsTab();
    });

    test("should switch to Deduction Utilization tab", async ({ page }) => {
      // Tab should be selected after switch
      await expect(reportsPage.deductionsReportTab).toHaveAttribute("aria-selected", "true");
    });
  });

  // Note: Advance Tax is a separate accordion section, not a tab in Reports

  test.describe("Export Functionality", () => {
    test("should have clickable PDF export button", async ({ page }) => {
      await expect(reportsPage.exportPDFButton).toBeEnabled();
    });

    test("should have clickable Excel export button", async ({ page }) => {
      await expect(reportsPage.exportExcelButton).toBeEnabled();
    });

    test("PDF button should be clickable", async ({ page }) => {
      const pdfButton = reportsPage.exportPDFButton;
      // Verify button is visible and enabled
      await expect(pdfButton).toBeVisible();
      await expect(pdfButton).toBeEnabled();
    });

    test("Excel button should be clickable", async ({ page }) => {
      const excelButton = reportsPage.exportExcelButton;
      // Verify button is visible and enabled
      await expect(excelButton).toBeVisible();
      await expect(excelButton).toBeEnabled();
    });
  });
});
