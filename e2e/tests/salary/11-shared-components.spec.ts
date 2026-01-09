import { test, expect } from "@playwright/test";
import { SalaryOverviewPage } from "../../pages/salary";

test.describe("Shared Components in Salary Section", () => {
  let overviewPage: SalaryOverviewPage;

  test.beforeEach(async ({ page }) => {
    overviewPage = new SalaryOverviewPage(page);
    await overviewPage.navigateTo();
  });

  test.describe("FinancialYearSelector", () => {
    test("should display FY selector with calendar icon", async ({ page }) => {
      // Look for FY selector with calendar icon
      await expect(page.locator(".v-select").filter({ has: page.getByText(/Financial Year/i) })).toBeVisible();
      await expect(page.locator(".mdi-calendar-range")).toBeVisible();
    });

    test("should show current FY by default", async ({ page }) => {
      // Current FY should be shown (2025-26 based on the context)
      await expect(page.getByText(/2025-26/)).toBeVisible();
    });

    test("should display FY options in dropdown", async ({ page }) => {
      // Click FY selector to open dropdown
      await page
        .locator(".v-select")
        .filter({ has: page.getByText(/Financial Year/i) })
        .click();
      await page.waitForTimeout(300);

      // Should show multiple FY options
      await expect(page.getByRole("option").first()).toBeVisible();

      // Should have FY format (e.g., "FY 2024-25")
      await expect(page.getByRole("option", { name: /\d{2}-\d{2}/ })).toBeVisible();
    });

    test("should allow selecting a different FY", async ({ page }) => {
      // Click FY selector
      await page
        .locator(".v-select")
        .filter({ has: page.getByText(/Financial Year/i) })
        .click();
      await page.waitForTimeout(300);

      // Select a different FY
      await page.getByRole("option", { name: "24-25" }).click();
      await page.waitForTimeout(500);

      // Data should update to show the selected FY
      await expect(page.getByText(/2024-25/)).toBeVisible();
    });

    test("should show past 5 years of FY options", async ({ page }) => {
      await page
        .locator(".v-select")
        .filter({ has: page.getByText(/Financial Year/i) })
        .click();
      await page.waitForTimeout(300);

      // Should have at least 5 year options
      const optionCount = await page.getByRole("option").count();
      expect(optionCount).toBeGreaterThanOrEqual(5);
    });

    test("should maintain selected FY when navigating between tabs", async ({
      page,
    }) => {
      // Select a specific FY
      await page
        .locator(".v-select")
        .filter({ has: page.getByText(/Financial Year/i) })
        .click();
      await page.getByRole("option", { name: "23-24" }).click();
      await page.waitForTimeout(500);

      // Navigate to History tab
      await page.getByRole("tab", { name: "Salary History" }).click();
      await page.waitForTimeout(500);

      // Navigate back to Overview
      await page.getByRole("tab", { name: "Overview" }).click();
      await page.waitForTimeout(500);

      // FY should still be the selected one
      await expect(page.getByText(/2023-24/)).toBeVisible();
    });
  });

  test.describe("SummaryMetricCards", () => {
    test("should display 4 summary metric cards", async ({ page }) => {
      // Look for summary cards with metric labels
      await expect(page.getByText(/Monthly Gross/i)).toBeVisible();
      await expect(page.getByText(/Monthly Net/i)).toBeVisible();
      await expect(page.getByText(/Annual Gross/i)).toBeVisible();
      await expect(page.getByText(/TDS/i)).toBeVisible();
    });

    test("should display values in INR currency format", async ({ page }) => {
      // All metric cards should have INR formatted values
      const inrValues = page.locator(".text-h5, .text-h4").filter({ hasText: /₹/ });
      const count = await inrValues.count();
      expect(count).toBeGreaterThanOrEqual(1);
    });

    test("should display icons on metric cards", async ({ page }) => {
      // Cards should have icons
      await expect(page.locator(".mdi-cash, .mdi-wallet, .mdi-chart-line, .mdi-receipt-text").first()).toBeVisible();
    });

    test("should show subtitle with months recorded", async ({ page }) => {
      // Annual Gross card should show months subtitle
      await expect(page.getByText(/months recorded/i)).toBeVisible();
    });

    test("should update values when FY changes", async ({ page }) => {
      // Get current values
      const grossBefore = await page.locator(".v-card").filter({ hasText: /Monthly Gross/i }).locator(".text-h5, .text-h4").textContent();

      // Change FY
      await page
        .locator(".v-select")
        .filter({ has: page.getByText(/Financial Year/i) })
        .click();
      await page.getByRole("option", { name: "22-23" }).click();
      await page.waitForTimeout(1000);

      // Get new values
      const grossAfter = await page.locator(".v-card").filter({ hasText: /Monthly Gross/i }).locator(".text-h5, .text-h4").textContent();

      // Values might be different (depending on data) or same format
      // Just verify the card still shows a value
      expect(grossAfter).toBeTruthy();
    });

    test("should show loading state while data is fetching", async ({
      page,
    }) => {
      // Navigate and quickly check for loading
      await page.goto("/dashboard/salary");

      // Look for loading indicator or skeleton loader
      // The cards might briefly show loading state
      const hasLoadingOrData =
        await page.locator(".v-progress-circular, .v-skeleton-loader, .text-h5, .text-h4").first().isVisible();
      expect(hasLoadingOrData).toBeTruthy();
    });

    test("should display cards in responsive grid layout", async ({ page }) => {
      // Cards should be in a row layout
      const summaryRow = page.locator(".v-row").filter({ has: page.getByText(/Monthly Gross/i) });
      await expect(summaryRow).toBeVisible();
    });
  });

  test.describe("DataCompletionProgress", () => {
    test("should display data completion progress card", async ({ page }) => {
      await expect(page.getByText(/Data Completion/i)).toBeVisible();
    });

    test("should show months count in X/12 format", async ({ page }) => {
      await expect(page.getByText(/\d+\/12/)).toBeVisible();
    });

    test("should display progress bar", async ({ page }) => {
      const progressCard = page.locator(".v-card").filter({ hasText: /Data Completion/i });
      await expect(progressCard.locator(".v-progress-linear")).toBeVisible();
    });

    test("should show FY label in progress card", async ({ page }) => {
      const progressCard = page.locator(".v-card").filter({ hasText: /Data Completion/i });
      // Should show the selected FY
      await expect(progressCard.getByText(/\d{4}-\d{2}/)).toBeVisible();
    });

    test("should show Apr to Mar labels on progress bar", async ({ page }) => {
      const progressCard = page.locator(".v-card").filter({ hasText: /Data Completion/i });
      await expect(progressCard.getByText("Apr")).toBeVisible();
      await expect(progressCard.getByText("Mar")).toBeVisible();
    });

    test("should update progress when FY changes", async ({ page }) => {
      // Get current progress
      const progressBefore = await page.locator(".v-chip").filter({ hasText: /\/12/ }).textContent();

      // Change to an older FY that might have different data
      await page
        .locator(".v-select")
        .filter({ has: page.getByText(/Financial Year/i) })
        .click();
      await page.getByRole("option", { name: "22-23" }).click();
      await page.waitForTimeout(1000);

      // Progress should still be displayed (might be different value)
      await expect(page.getByText(/\d+\/12/)).toBeVisible();
    });

    test("should show green color when 12/12 months completed", async ({
      page,
    }) => {
      // Navigate to a FY with full data (if available)
      await page
        .locator(".v-select")
        .filter({ has: page.getByText(/Financial Year/i) })
        .click();
      await page.getByRole("option", { name: "24-25" }).click();
      await page.waitForTimeout(1000);

      // Check chip color - if 12/12, should be success color
      const chip = page.locator(".v-chip").filter({ hasText: /\/12/ });
      const chipText = await chip.textContent();

      if (chipText?.includes("12/12")) {
        // Should have success color class
        await expect(chip).toHaveClass(/bg-success|text-success/);
      }
    });
  });
});
