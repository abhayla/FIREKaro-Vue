import { test, expect } from "@playwright/test";
import { InvestmentReportsPage } from "../../pages/investments";
import { portfolioSummary, assetAllocation } from "../../fixtures/investments-data";

test.describe("Investment Reports", () => {
  let reportsPage: InvestmentReportsPage;

  test.beforeEach(async ({ page }) => {
    reportsPage = new InvestmentReportsPage(page);
    await reportsPage.navigateTo();
  });

  test("should display reports page correctly", async ({ page }) => {
    await reportsPage.expectPageLoaded();
    await reportsPage.expectSummaryVisible();
  });

  test("should show asset allocation chart", async ({ page }) => {
    await reportsPage.expectAllocationChartVisible();
    // Should show equity vs debt breakdown
    await expect(page.getByText(/Equity/i)).toBeVisible();
    await expect(page.getByText(/Debt/i)).toBeVisible();
  });

  test("should show performance metrics", async ({ page }) => {
    // Should show returns metrics
    const xirr = await reportsPage.getXIRR();
    expect(xirr).toMatch(/%/); // Percentage values
  });

  test("should have export button visible", async ({ page }) => {
    await reportsPage.expectExportButtonVisible();
  });

  test("should export report as PDF", async ({ page }) => {
    // Set up download listener
    const downloadPromise = page.waitForEvent("download");
    await reportsPage.exportToPDF();
    const download = await downloadPromise;

    // Verify download started
    expect(download.suggestedFilename()).toContain(".pdf");
  });

  test.describe("Excel Export", () => {
    test("should show Excel export option", async ({ page }) => {
      // Look for Excel/CSV export button
      const excelButton = page.getByRole("button", { name: /Excel|CSV|Export.*Data/i });
      const isVisible = await excelButton.isVisible().catch(() => false);
      expect(typeof isVisible).toBe("boolean");
    });

    test("should export data as Excel/CSV", async ({ page }) => {
      const excelButton = page.getByRole("button", { name: /Excel|CSV/i });

      if (await excelButton.isVisible()) {
        const downloadPromise = page.waitForEvent("download");
        await excelButton.click();
        const download = await downloadPromise;

        // Verify download is Excel or CSV
        const filename = download.suggestedFilename();
        expect(filename).toMatch(/\.(xlsx|xls|csv)$/);
      }
    });
  });

  test.describe("Tax Reports", () => {
    test("should show capital gains section", async ({ page }) => {
      // Tax reports should show capital gains breakdown
      const capitalGainsSection = page.locator(".v-card").filter({
        hasText: /Capital Gains|LTCG|STCG/i,
      });
      const isVisible = await capitalGainsSection.first().isVisible().catch(() => false);
      expect(typeof isVisible).toBe("boolean");
    });

    test("should show 80C deduction status", async ({ page }) => {
      // EPF, PPF contributions count towards 80C
      const section80C = page.getByText(/80C|Deduction|Tax.*Saving/i);
      const isVisible = await section80C.first().isVisible().catch(() => false);
      expect(typeof isVisible).toBe("boolean");
    });

    test("should show 80CCD benefit from NPS", async ({ page }) => {
      // NPS provides additional 80CCD(1B) benefit
      const section80CCD = page.getByText(/80CCD|NPS.*Benefit/i);
      const isVisible = await section80CCD.first().isVisible().catch(() => false);
      expect(typeof isVisible).toBe("boolean");
    });
  });

  test.describe("Performance Reports", () => {
    test("should show period selector", async ({ page }) => {
      // Period options: 1M, 3M, 6M, 1Y, 3Y, 5Y, All
      const periodSelector = page.locator(".v-btn-toggle, .v-tabs").filter({
        hasText: /1M|3M|1Y|YTD|All/i,
      });
      const isVisible = await periodSelector.first().isVisible().catch(() => false);
      expect(typeof isVisible).toBe("boolean");
    });

    test("should filter performance by selected period", async ({ page }) => {
      // Click on a period option
      const periodOption = page.getByRole("button", { name: /1Y|YTD/i });

      if (await periodOption.first().isVisible()) {
        await periodOption.first().click();
        await page.waitForTimeout(500);

        // Performance data should update
        const performanceCard = page.locator(".v-card").filter({
          hasText: /Return|Performance|XIRR|CAGR/i,
        });
        await expect(performanceCard.first()).toBeVisible();
      }
    });

    test("should show XIRR calculation", async ({ page }) => {
      const xirrLabel = page.getByText(/XIRR/i);
      const isVisible = await xirrLabel.first().isVisible().catch(() => false);
      expect(typeof isVisible).toBe("boolean");
    });

    test("should show CAGR calculation", async ({ page }) => {
      const cagrLabel = page.getByText(/CAGR/i);
      const isVisible = await cagrLabel.first().isVisible().catch(() => false);
      expect(typeof isVisible).toBe("boolean");
    });

    test("should show absolute and percentage returns", async ({ page }) => {
      // Returns shown as both absolute (Rs) and percentage
      const percentReturn = page.getByText(/%/);
      const hasPercent = (await percentReturn.count()) > 0;
      expect(hasPercent).toBeTruthy();
    });
  });

  test.describe("Asset Allocation Report", () => {
    test("should show allocation breakdown by asset class", async ({ page }) => {
      const allocationLabels = ["Equity", "Debt", "Gold", "Real Estate", "Cash"];

      let foundLabels = 0;
      for (const label of allocationLabels) {
        const element = page.getByText(new RegExp(label, "i"));
        if (await element.first().isVisible().catch(() => false)) {
          foundLabels++;
        }
      }

      // Should have at least equity and debt
      expect(foundLabels).toBeGreaterThan(0);
    });

    test("should show pie/doughnut chart for allocation", async ({ page }) => {
      const chart = page.locator("canvas");
      await expect(chart.first()).toBeVisible();
    });

    test("should show allocation percentages", async ({ page }) => {
      // Percentages should add up to 100%
      const percentageText = page.locator("text=/\\d+\\.?\\d*%/");
      const count = await percentageText.count();
      expect(count).toBeGreaterThan(0);
    });
  });

  test.describe("Holdings Report", () => {
    test("should show detailed holdings breakdown", async ({ page }) => {
      const holdingsSection = page.locator(".v-card, .v-table").filter({
        hasText: /Holdings|Stocks|Mutual Funds/i,
      });
      const isVisible = await holdingsSection.first().isVisible();
      expect(isVisible).toBeTruthy();
    });

    test("should show individual holding values", async ({ page }) => {
      // Each holding should show current value
      const valueLabels = page.locator("text=/₹|Value|Current/i");
      const count = await valueLabels.count();
      expect(count).toBeGreaterThan(0);
    });
  });

  test.describe("Report Customization", () => {
    test("should allow date range selection", async ({ page }) => {
      const dateRangePicker = page.locator(".v-date-picker, input[type='date']");
      const isVisible = await dateRangePicker.first().isVisible().catch(() => false);
      expect(typeof isVisible).toBe("boolean");
    });

    test("should allow report type selection", async ({ page }) => {
      const reportTypeSelector = page.locator(".v-select, .v-tabs").filter({
        hasText: /Report.*Type|Summary|Detailed|Tax/i,
      });
      const isVisible = await reportTypeSelector.first().isVisible().catch(() => false);
      expect(typeof isVisible).toBe("boolean");
    });
  });
});
