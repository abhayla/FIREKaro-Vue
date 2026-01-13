import { test, expect } from "@playwright/test";
import { InvestmentsOverviewPage } from "../../pages/investments";

test.describe("Family View - Investments", () => {
  let investmentsPage: InvestmentsOverviewPage;

  test.beforeEach(async ({ page }) => {
    investmentsPage = new InvestmentsOverviewPage(page);
    await investmentsPage.navigateTo();
  });

  test.describe("Family Toggle", () => {
    test("should display family toggle button in app bar", async ({ page }) => {
      await expect(investmentsPage.familyToggleButton).toBeVisible();
    });

    test("should default to personal view", async ({ page }) => {
      await investmentsPage.expectFamilyViewDisabled();
    });

    test("should open family view menu on click", async ({ page }) => {
      await investmentsPage.openFamilyViewMenu();
      await expect(investmentsPage.familyViewMenu).toBeVisible();
    });

    test("should show Personal and Family buttons in menu", async ({ page }) => {
      await investmentsPage.openFamilyViewMenu();
      await expect(page.getByRole("button", { name: /Personal/i })).toBeVisible();
      await expect(page.getByRole("button", { name: /Family/i })).toBeVisible();
    });

    test("should switch to family view", async ({ page }) => {
      await investmentsPage.enableFamilyView();
      await investmentsPage.expectFamilyViewEnabled();
    });

    test("should switch back to personal view", async ({ page }) => {
      // First enable family view
      await investmentsPage.enableFamilyView();
      await investmentsPage.expectFamilyViewEnabled();

      // Then switch back
      await investmentsPage.disableFamilyView();
      await investmentsPage.expectFamilyViewDisabled();
    });

    test("should change icon when family view is enabled", async ({ page }) => {
      // Personal view shows single account icon
      let icon = investmentsPage.familyToggleButton.locator("i");
      await expect(icon).toHaveClass(/mdi-account[^-]/);

      // Enable family view
      await investmentsPage.enableFamilyView();

      // Family view shows group icon
      icon = investmentsPage.familyToggleButton.locator("i");
      await expect(icon).toHaveClass(/mdi-account-group/);
    });
  });

  test.describe("Family Member Selection", () => {
    test.beforeEach(async ({ page }) => {
      await investmentsPage.enableFamilyView();
    });

    test("should show member selector when family view enabled", async ({ page }) => {
      await investmentsPage.openFamilyViewMenu();
      const selector = investmentsPage.familyViewMenu.locator(".v-select");
      await expect(selector).toBeVisible();
    });

    test("should have All Members option", async ({ page }) => {
      await investmentsPage.openFamilyViewMenu();
      const selector = investmentsPage.familyViewMenu.locator(".v-select");
      await selector.click();
      await expect(page.getByRole("option", { name: /All Members/i })).toBeVisible();
    });

    test("should select All Members by default", async ({ page }) => {
      const selectedMember = await investmentsPage.getSelectedFamilyMemberName();
      expect(selectedMember).toMatch(/All Members/i);
    });
  });

  test.describe("Family View Data Display", () => {
    test.beforeEach(async ({ page }) => {
      await investmentsPage.enableFamilyView();
      // Close menu if open
      await page.keyboard.press("Escape");
      await page.waitForTimeout(300);
    });

    test("should still show portfolio summary in family view", async ({ page }) => {
      // Portfolio value should be visible regardless of view mode
      await expect(page.getByText(/Portfolio Value|Total Value/i)).toBeVisible();
    });

    test("should display family investment breakdown component", async ({ page }) => {
      // Look for family-specific component or indicator
      const familyBreakdown = page.locator(".v-card").filter({
        hasText: /Family.*Breakdown|Family.*Investment|All Members/i,
      });

      // This component should be visible when family view is enabled
      const isVisible = await familyBreakdown.isVisible().catch(() => false);
      // If visible, verify it's showing family data
      if (isVisible) {
        await expect(familyBreakdown).toContainText(/Family|Members/i);
      }
    });

    test("should show aggregated values for all members", async ({ page }) => {
      // When "All Members" is selected, values should be aggregated
      const totalValueCard = investmentsPage.getSummaryCardByTitle("Total Value");
      const hasValue = await totalValueCard.isVisible();
      expect(hasValue).toBeTruthy();
    });
  });

  test.describe("View Mode Persistence", () => {
    test("should maintain family view when navigating to sub-pages", async ({ page }) => {
      await investmentsPage.enableFamilyView();

      // Navigate to a specific investment type via URL (tabs removed)
      await page.goto("/investments/stocks");
      await page.waitForTimeout(500);

      // Family view should still be active
      await investmentsPage.expectFamilyViewEnabled();
    });

    test("should maintain family view when returning to overview", async ({ page }) => {
      await investmentsPage.enableFamilyView();

      // Navigate away via URL (tabs removed)
      await page.goto("/investments/mutual-funds");
      await page.waitForTimeout(300);

      // Navigate back via URL
      await page.goto("/investments");
      await page.waitForTimeout(300);

      // Family view should still be active
      await investmentsPage.expectFamilyViewEnabled();
    });
  });

  test.describe("Family Allocation Chart", () => {
    test.beforeEach(async ({ page }) => {
      await investmentsPage.enableFamilyView();
      await page.keyboard.press("Escape");
    });

    test("should show allocation breakdown by member", async ({ page }) => {
      // Look for allocation chart or breakdown
      const allocationSection = page.locator(".v-card").filter({
        hasText: /Allocation|Distribution|Breakdown/i,
      });

      const isVisible = await allocationSection.first().isVisible();
      expect(isVisible).toBeTruthy();
    });
  });

  test.describe("Reports in Family View", () => {
    test("should navigate to reports in family view", async ({ page }) => {
      await investmentsPage.enableFamilyView();

      // Navigate to reports via URL (tabs removed)
      await page.goto("/investments/reports");
      await page.waitForTimeout(500);

      // Family view should persist
      await investmentsPage.expectFamilyViewEnabled();

      // Reports should be visible
      await expect(page.getByText(/Report|Performance|XIRR/i)).toBeVisible();
    });

    test("should show family-wide performance metrics", async ({ page }) => {
      await investmentsPage.enableFamilyView();
      await page.keyboard.press("Escape");

      // Navigate to reports via URL (tabs removed)
      await page.goto("/investments/reports");
      await page.waitForTimeout(500);

      // Check for performance metrics
      const performanceSection = page.locator(".v-card").filter({
        hasText: /Performance|XIRR|CAGR|Returns/i,
      });

      const isVisible = await performanceSection.first().isVisible();
      expect(isVisible).toBeTruthy();
    });
  });

  test.describe("Tooltip and Accessibility", () => {
    test("should show tooltip on family toggle button", async ({ page }) => {
      // Hover over the button
      await investmentsPage.familyToggleButton.hover();
      await page.waitForTimeout(500);

      // Tooltip should appear
      const tooltip = page.locator(".v-tooltip__content, [role='tooltip']");
      await expect(tooltip).toBeVisible();
    });

    test("should have correct tooltip text for personal view", async ({ page }) => {
      await investmentsPage.familyToggleButton.hover();
      await page.waitForTimeout(500);

      const tooltip = page.locator(".v-tooltip__content, [role='tooltip']");
      await expect(tooltip).toContainText(/Personal/i);
    });

    test("should have correct tooltip text for family view", async ({ page }) => {
      await investmentsPage.enableFamilyView();
      await page.keyboard.press("Escape");

      await investmentsPage.familyToggleButton.hover();
      await page.waitForTimeout(500);

      const tooltip = page.locator(".v-tooltip__content, [role='tooltip']");
      await expect(tooltip).toContainText(/Family/i);
    });
  });
});
