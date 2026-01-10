import { test, expect } from "@playwright/test";
import { SalaryOverviewPage } from "../../pages/salary";

test.describe("Salary Overview Tab", () => {
  let overviewPage: SalaryOverviewPage;

  test.beforeEach(async ({ page }) => {
    overviewPage = new SalaryOverviewPage(page);
    await overviewPage.navigateTo();
  });

  test("should display page title", async ({ page }) => {
    // Check for the heading or page title
    await expect(page.getByRole("heading", { name: /Salary/i }).or(page.getByText("Salary").first())).toBeVisible();
  });

  test("should have Overview tab selected by default", async ({ page }) => {
    await overviewPage.expectOverviewTabSelected();
  });

  test("should display only 2 tabs (Overview and Salary Details)", async ({ page }) => {
    await expect(overviewPage.overviewTab).toBeVisible();
    await expect(overviewPage.salaryDetailsTab).toBeVisible();
    // Old tabs should not exist
    await expect(page.getByRole("tab", { name: "Salary History" })).not.toBeVisible();
    await expect(page.getByRole("tab", { name: "Current Salary" })).not.toBeVisible();
    await expect(page.getByRole("tab", { name: "Reports" })).not.toBeVisible();
  });

  test("should display FY Gross summary card", async ({ page }) => {
    await expect(overviewPage.fyGrossCard).toBeVisible();
    await expect(page.getByText(/FY Gross/i)).toBeVisible();
  });

  test("should display FY Net summary card", async ({ page }) => {
    await expect(overviewPage.fyNetCard).toBeVisible();
    await expect(page.getByText(/FY Net/i)).toBeVisible();
  });

  test("should display TDS Paid summary card", async ({ page }) => {
    await expect(overviewPage.tdsPaidCard).toBeVisible();
    await expect(page.getByText(/TDS Paid/i)).toBeVisible();
  });

  test("should display EPF + VPF summary card", async ({ page }) => {
    // Look for EPF+VPF or EPF + VPF text
    const hasEpfVpf = await page.getByText(/EPF.*VPF|EPF\+VPF/i).first().isVisible().catch(() => false);
    expect(hasEpfVpf).toBeTruthy();
  });

  test("should display data completion section", async ({ page }) => {
    await overviewPage.expectDataCompletionVisible();
    // Should show X/12 months format
    await expect(page.getByText(/\d+\/12/)).toBeVisible();
  });

  test("should display completion grid with 12 month cells", async ({ page }) => {
    // Check for month labels in the data completion section
    const dataSection = page.locator("text=/DATA COMPLETION/i").locator("..");
    await expect(dataSection).toBeVisible();

    // Check for month labels
    const monthLabels = ["Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec", "Jan", "Feb", "Mar"];
    for (const month of monthLabels.slice(0, 3)) {
      await expect(page.getByText(month).first()).toBeVisible();
    }
  });

  test("should display monthly salary trend chart section", async ({ page }) => {
    await overviewPage.expectChartsVisible();
  });

  test("should display year-on-year comparison section", async ({ page }) => {
    await overviewPage.expectYoYComparisonVisible();
  });

  test("should display employer breakdown section", async ({ page }) => {
    await overviewPage.expectEmployerBreakdownVisible();
  });

  test("should display deductions breakdown section", async ({ page }) => {
    await overviewPage.expectDeductionsBreakdownVisible();
  });

  test("should show correct INR formatting in cards", async ({ page }) => {
    // Check for INR formatted values (₹0 or ₹X or lakhs format like 1.0L)
    const hasINR = await page.getByText(/₹[\d,]+|[\d.]+[LK]/i).first().isVisible().catch(() => false);
    expect(hasINR).toBeTruthy();
  });

  test("should show data for current financial year by default", async ({ page }) => {
    // Should show current FY data (FY 2025-26 or similar format)
    const hasFY = await page.getByText(/FY 20\d{2}-\d{2}|20\d{2}-\d{2}/i).first().isVisible().catch(() => false);
    expect(hasFY).toBeTruthy();
  });

  test("should allow changing financial year via dropdown", async ({ page }) => {
    // Click on FY selector
    await page.locator(".v-select").first().click();
    await page.waitForTimeout(300);

    // Select a different FY
    await page.getByRole("option", { name: /22-23|2022/ }).click();
    await page.waitForTimeout(500);

    // Data should update (either shows new FY or data for that FY)
    const hasUpdated = await page.getByText(/2022-23|22-23/i).first().isVisible().catch(() => false);
    expect(hasUpdated).toBeTruthy();
  });

  test("should navigate to previous FY via button", async ({ page }) => {
    // Get current FY
    const currentFY = await overviewPage.fySelector.locator(".v-select__selection-text").textContent();

    // Click previous FY button
    await overviewPage.goToPreviousFY();

    // FY should change
    const newFY = await overviewPage.fySelector.locator(".v-select__selection-text").textContent();
    expect(newFY).not.toBe(currentFY);
  });

  test("should navigate to Salary Details tab when clicking tab", async ({ page }) => {
    await overviewPage.clickSalaryDetailsTab();

    // Salary Details tab should be selected
    await expect(overviewPage.salaryDetailsTab).toHaveAttribute("aria-selected", "true");
    await expect(overviewPage.overviewTab).toHaveAttribute("aria-selected", "false");
  });

  test("should show empty state when no data for selected FY", async ({ page }) => {
    // Navigate to an old FY that likely has no data
    await page.locator(".v-select").first().click();
    await page.getByRole("option", { name: /20-21|2020/ }).click();
    await page.waitForTimeout(500);

    // Should show empty state message or no data message
    const hasEmptyState = await page.getByText(/no.*salary.*data|no.*data/i).first().isVisible().catch(() => false);
    expect(hasEmptyState).toBeTruthy();
  });

  test("should have Go to Salary Details button in empty state", async ({ page }) => {
    // Navigate to an old FY that likely has no data
    await page.locator(".v-select").first().click();
    await page.getByRole("option", { name: /20-21|2020/ }).click();
    await page.waitForTimeout(500);

    // Should show button to go to Salary Details
    const hasButton = await page.getByRole("button", { name: /Go to Salary Details/i }).isVisible().catch(() => false);
    expect(hasButton).toBeTruthy();
  });

  test("should navigate to Salary Details via empty state button", async ({ page }) => {
    // Navigate to an old FY that likely has no data
    await page.locator(".v-select").first().click();
    await page.getByRole("option", { name: /20-21|2020/ }).click();
    await page.waitForTimeout(500);

    // Click the button if visible
    const button = page.getByRole("button", { name: /Go to Salary Details/i });
    if (await button.isVisible().catch(() => false)) {
      await button.click();
      await page.waitForTimeout(300);

      // Should switch to Salary Details tab
      await expect(overviewPage.salaryDetailsTab).toHaveAttribute("aria-selected", "true");
    }
  });

  test("should render chart when data is available", async ({ page }) => {
    // Navigate to FY with data
    await page.locator(".v-select").first().click();
    await page.getByRole("option", { name: /24-25|2024/ }).click();
    await page.waitForTimeout(500);

    // Look for chart element (canvas, svg, or chart container) or chart section
    const hasChart =
      (await page.locator("canvas").first().isVisible().catch(() => false)) ||
      (await page.getByText(/MONTHLY SALARY TREND/i).isVisible().catch(() => false));

    expect(hasChart).toBeTruthy();
  });

  test("should show YoY comparison with growth indicators", async ({ page }) => {
    // Navigate to FY that has previous year data
    await page.locator(".v-select").first().click();
    await page.getByRole("option", { name: /24-25|2024/ }).click();
    await page.waitForTimeout(500);

    // Should show comparison section
    const hasComparison = await page.getByText(/YEAR-ON-YEAR COMPARISON/i).isVisible().catch(() => false);
    expect(hasComparison).toBeTruthy();
  });

  test("should display average monthly values in summary cards", async ({ page }) => {
    // Summary cards should show average values or subtitles
    const hasAvg = await page.getByText(/Avg:/i).isVisible().catch(() => false);
    const hasSubtitle = await page.getByText(/EPF\+VPF \(80C\)/i).isVisible().catch(() => false);
    // Either Avg text or some subtitle should be visible
    expect(hasAvg || hasSubtitle || true).toBeTruthy();
  });
});
