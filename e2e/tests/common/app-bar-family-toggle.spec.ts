import { test, expect } from "@playwright/test";

/**
 * Tests for the AppBarFamilyToggle component
 * This toggle is in the app bar header and controls personal/family view across all pages
 */
test.describe("App Bar Family Toggle", () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to any dashboard page
    await page.goto("/dashboard/investments");
    await page.waitForLoadState("domcontentloaded");
    await page.locator(".v-card").first().waitFor({ state: "visible", timeout: 10000 }).catch(() => {});
  });

  test("should display family toggle icon in app bar", async ({ page }) => {
    // Look for the toggle button with person/group icon in the app bar
    const toggleButton = page.locator("header").getByRole("button").filter({
      has: page.locator(".mdi-account, .mdi-account-group")
    });
    await expect(toggleButton).toBeVisible();
  });

  test("should open menu when clicking the toggle button", async ({ page }) => {
    // Click the family toggle button in the header
    const toggleButton = page.locator("header").getByRole("button").filter({
      has: page.locator(".mdi-account, .mdi-account-group")
    });
    await toggleButton.click();

    // Menu should open with View Mode title
    await expect(page.getByText("View Mode")).toBeVisible();

    // Personal and Family options should be visible inside the menu/dialog
    const menu = page.locator(".v-menu__content, .v-overlay__content");
    await expect(menu.getByRole("button", { name: "Personal", exact: true })).toBeVisible();
    await expect(menu.getByRole("button", { name: "Family", exact: true })).toBeVisible();
  });

  test("should default to Personal view", async ({ page }) => {
    const toggleButton = page.locator("header").getByRole("button").filter({
      has: page.locator(".mdi-account, .mdi-account-group")
    });

    // The icon should be mdi-account (personal) when in personal view
    await expect(toggleButton.locator(".mdi-account")).toBeVisible();

    await toggleButton.click();

    // Personal button should be selected (active) in the button toggle group
    const menu = page.locator(".v-menu__content, .v-overlay__content");
    const personalBtn = menu.getByRole("button", { name: "Personal", exact: true });
    await expect(personalBtn).toBeVisible();
    await expect(personalBtn).toHaveClass(/v-btn--active/);
  });

  test("should switch to Family view when clicking Family button", async ({ page }) => {
    const toggleButton = page.locator("header").getByRole("button").filter({
      has: page.locator(".mdi-account, .mdi-account-group")
    });
    await toggleButton.click();

    // Click Family button inside the menu
    const menu = page.locator(".v-menu__content, .v-overlay__content");
    await menu.getByRole("button", { name: "Family", exact: true }).click();

    // Wait a moment for the state to update
    await page.waitForTimeout(300);

    // Icon should change to account-group
    await expect(toggleButton.locator(".mdi-account-group")).toBeVisible();
  });

  test("should show family member selector when in Family view", async ({ page }) => {
    const toggleButton = page.locator("header").getByRole("button").filter({
      has: page.locator(".mdi-account, .mdi-account-group")
    });
    await toggleButton.click();

    // Switch to Family view
    const menu = page.locator(".v-menu__content, .v-overlay__content");
    await menu.getByRole("button", { name: "Family", exact: true }).click();
    await page.waitForTimeout(500);

    // The "View for" dropdown should appear in the menu (it's a v-select with label)
    // When in family view, the dropdown with "All Members" should be visible
    await expect(menu.locator(".v-select")).toBeVisible();
  });

  test("should switch back to Personal view", async ({ page }) => {
    const toggleButton = page.locator("header").getByRole("button").filter({
      has: page.locator(".mdi-account, .mdi-account-group")
    });
    await toggleButton.click();

    const menu = page.locator(".v-menu__content, .v-overlay__content");

    // Switch to Family first
    await menu.getByRole("button", { name: "Family", exact: true }).click();
    await page.waitForTimeout(300);

    // Then switch back to Personal
    await menu.getByRole("button", { name: "Personal", exact: true }).click();
    await page.waitForTimeout(300);

    // Icon should change back to account
    await expect(toggleButton.locator(".mdi-account")).toBeVisible();

    // Family member selector should not be visible
    await expect(menu.getByText("View for")).not.toBeVisible();
  });

  test("should persist view mode when navigating via sidebar", async ({ page }) => {
    const toggleButton = page.locator("header").getByRole("button").filter({
      has: page.locator(".mdi-account, .mdi-account-group")
    });

    // Switch to Family view
    await toggleButton.click();
    const menu = page.locator(".v-menu__content, .v-overlay__content");
    await menu.getByRole("button", { name: "Family", exact: true }).click();
    await page.waitForTimeout(500);

    // Verify icon changed
    await expect(toggleButton.locator(".mdi-account-group")).toBeVisible();

    // Close menu by pressing Escape
    await page.keyboard.press("Escape");
    await page.waitForTimeout(300);

    // Navigate using sidebar link (SPA navigation preserves state)
    await page.getByRole("navigation").getByText("Liabilities").click();
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(500);

    // The family view should still be active (Pinia store persists in SPA navigation)
    await expect(toggleButton.locator(".mdi-account-group")).toBeVisible();
  });

  test("should show tooltip with current view state", async ({ page }) => {
    const toggleButton = page.locator("header").getByRole("button").filter({
      has: page.locator(".mdi-account, .mdi-account-group")
    });

    // Hover over the button to show tooltip
    await toggleButton.hover();
    await page.waitForTimeout(500);

    // Tooltip should show "Personal View"
    await expect(page.getByText("Personal View")).toBeVisible();
  });

  test("should not show page-level family toggle on any page", async ({ page }) => {
    // Check investments page
    await page.goto("/dashboard/investments");
    await page.waitForLoadState("domcontentloaded");
    await page.locator(".v-card").first().waitFor({ state: "visible", timeout: 10000 }).catch(() => {});

    // There should be no FamilyToggle component on the main content area
    // The old toggle had a class mb-6 directly in the page content
    // We look for a button toggle in main that has Personal/Family text
    const pageToggle = page.locator("main .v-btn-toggle").filter({
      has: page.locator('button:has-text("Personal")')
    }).filter({
      has: page.locator('button:has-text("Family")')
    });

    // This should NOT be visible since we removed it from pages
    await expect(pageToggle).toHaveCount(0);
  });

  test("should be visible across all dashboard sections", async ({ page }) => {
    const sections = [
      "/dashboard/investments",
      "/dashboard/liabilities",
      "/financial-health",
      "/dashboard/tax-planning",
      "/dashboard/non-salary-income",
      "/dashboard/salary",
      "/dashboard/expenses",
      "/dashboard/insurance",
      "/dashboard/fire-goals",
    ];

    for (const section of sections) {
      await page.goto(section);
      await page.waitForLoadState("domcontentloaded");
      await page.waitForTimeout(500);

      const toggleButton = page.locator("header").getByRole("button").filter({
        has: page.locator(".mdi-account, .mdi-account-group")
      });

      await expect(toggleButton).toBeVisible();
    }
  });
});
