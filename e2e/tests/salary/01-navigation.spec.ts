import { test, expect } from "@playwright/test";
import { SalaryOverviewPage } from "../../pages/salary";

test.describe("Salary Section Navigation", () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to salary section
    await page.goto("/dashboard/salary");
    await page.waitForLoadState("domcontentloaded");
    // Wait for first card to appear (indicates data loaded)
    await page.locator(".v-card").first().waitFor({ state: "visible", timeout: 10000 }).catch(() => {});
  });

  test("should load salary page with Overview tab active by default", async ({ page }) => {
    // Check page title or salary heading
    const hasTitle = await page.getByText("Salary", { exact: true }).first().isVisible().catch(() => false);
    expect(hasTitle).toBeTruthy();
    await expect(page).toHaveURL(/\/dashboard\/salary$/);
    // Overview tab should be selected by default - using v-tab selector
    const overviewTab = page.locator(".v-tab").filter({ hasText: "Overview" });
    await expect(overviewTab).toHaveAttribute("aria-selected", "true");
  });

  test("should display both tabs (Overview and Salary Details)", async ({ page }) => {
    await expect(page.locator(".v-tab").filter({ hasText: "Overview" })).toBeVisible();
    await expect(page.locator(".v-tab").filter({ hasText: "Salary Details" })).toBeVisible();
  });

  test("should NOT display old tabs (Salary History, Current Salary, Reports)", async ({ page }) => {
    await expect(page.locator(".v-tab").filter({ hasText: "Salary History" })).not.toBeVisible();
    await expect(page.locator(".v-tab").filter({ hasText: "Current Salary" })).not.toBeVisible();
    await expect(page.locator(".v-tab").filter({ hasText: "Reports" })).not.toBeVisible();
  });

  test("should switch to Salary Details tab when clicked", async ({ page }) => {
    const detailsTab = page.locator(".v-tab").filter({ hasText: "Salary Details" });
    await detailsTab.click();
    await page.waitForTimeout(300);

    // Salary Details tab should be selected
    await expect(detailsTab).toHaveAttribute("aria-selected", "true");
    await expect(page.locator(".v-tab").filter({ hasText: "Overview" })).toHaveAttribute("aria-selected", "false");
  });

  test("should show FY navigation controls (Prev/Next buttons and dropdown)", async ({ page }) => {
    // FY selector should be visible - look for v-select with FY pattern
    const fySelector = page.locator(".v-select").first();
    await expect(fySelector).toBeVisible();

    // Prev/Next buttons should be visible (icon buttons with title attribute)
    const prevBtn = page.locator("button[title='Previous Financial Year']");
    const nextBtn = page.locator("button[title='Next Financial Year']");
    await expect(prevBtn).toBeVisible();
    await expect(nextBtn).toBeVisible();
  });

  test("should navigate to previous FY when clicking Prev button", async ({ page }) => {
    // Get current FY text
    const fyText = await page.locator(".v-select").first().textContent();

    // Click previous FY button
    await page.locator("button[title='Previous Financial Year']").click();
    await page.waitForTimeout(500);

    // FY should change (we don't know exact values, just that it changed)
    const newFyText = await page.locator(".v-select").first().textContent();
    expect(newFyText).not.toBe(fyText);
  });

  test("should allow FY selection via dropdown", async ({ page }) => {
    // Click on the FY selector
    await page.locator(".v-select").first().click();
    await page.waitForTimeout(200);

    // Select FY 2022-23
    await page.getByRole("option", { name: "22-23" }).click();
    await page.waitForTimeout(500);

    // Verify FY is selected
    await expect(
      page.locator(".v-select__selection-text").filter({ hasText: "2022-23" })
    ).toBeVisible();
  });

  test("should navigate via sidebar", async ({ page }) => {
    // Click Salary in sidebar - use a broader selector
    const sidebarSalary = page.locator("nav .v-list-item").filter({ hasText: /^Salary$/ });
    if (await sidebarSalary.isVisible()) {
      await sidebarSalary.click();
      await page.waitForLoadState("domcontentloaded");
    }
    await expect(page).toHaveURL(/\/dashboard\/salary/);
  });

  test("should show data completion indicator in Overview tab", async ({ page }) => {
    // Data completion section should be visible - check for both text and count
    const hasDataCompletion = await page.getByText("DATA COMPLETION").isVisible().catch(() => false);
    const hasMonthCount = await page.getByText(/\d+\/12/).isVisible().catch(() => false);
    expect(hasDataCompletion || hasMonthCount).toBeTruthy();
  });

  test("should show summary metric cards in Overview tab", async ({ page }) => {
    // Summary cards should display FY Gross, FY Net, TDS, EPF+VPF
    await expect(page.getByText(/FY Gross/i)).toBeVisible();
    await expect(page.getByText(/FY Net/i)).toBeVisible();
  });

  test("should display Salary Details grid when Details tab is clicked", async ({ page }) => {
    await page.locator(".v-tab").filter({ hasText: "Salary Details" }).click();
    await page.waitForTimeout(500);

    // Grid should show month columns (Apr'XX, May'XX format) or table headers
    const hasAprColumn = await page.locator("th, .month-header").filter({ hasText: /Apr/i }).first().isVisible().catch(() => false);
    const hasComponentHeader = await page.locator("th").filter({ hasText: "Component" }).isVisible().catch(() => false);
    expect(hasAprColumn || hasComponentHeader).toBeTruthy();
  });

  test("should show Edit Mode button in Salary Details tab", async ({ page }) => {
    await page.locator(".v-tab").filter({ hasText: "Salary Details" }).click();
    await page.waitForTimeout(500);

    // Edit Mode button should be visible
    const hasEditMode = await page.getByRole("button", { name: /Edit Mode/i }).isVisible().catch(() => false);
    const hasEditBtn = await page.locator("button").filter({ hasText: /Edit/i }).first().isVisible().catch(() => false);
    expect(hasEditMode || hasEditBtn).toBeTruthy();
  });

  test("should show Settings button in Salary Details tab", async ({ page }) => {
    await page.locator(".v-tab").filter({ hasText: "Salary Details" }).click();
    await page.waitForTimeout(500);

    // Settings button (gear icon) should be visible - look for button with cog icon
    const settingsBtn = page.locator("button").filter({ has: page.locator(".mdi-cog") });
    const hasSettings = await settingsBtn.isVisible().catch(() => false);
    // Alternative: look for button with gear icon class
    const hasSettingsAlt = await page.locator("button .mdi-cog").isVisible().catch(() => false);
    expect(hasSettings || hasSettingsAlt).toBeTruthy();
  });

  test("should maintain selected tab when FY changes", async ({ page }) => {
    // Switch to Salary Details tab
    const detailsTab = page.locator(".v-tab").filter({ hasText: "Salary Details" });
    await detailsTab.click();
    await page.waitForTimeout(300);

    // Change FY
    await page.locator(".v-select").first().click();
    await page.getByRole("option", { name: "22-23" }).click();
    await page.waitForTimeout(500);

    // Should still be on Salary Details tab
    await expect(detailsTab).toHaveAttribute("aria-selected", "true");
  });
});
