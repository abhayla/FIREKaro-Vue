import { test, expect } from "@playwright/test";
import { EpfPage } from "../../pages/investments";

/**
 * Legacy EPF-PPF Tests
 * These tests verify that the old combined EPF-PPF URL properly redirects
 * to the new separate EPF page.
 *
 * For EPF-specific tests, see 05-epf.spec.ts
 * For PPF-specific tests, see 05-ppf.spec.ts
 */
test.describe("EPF-PPF Legacy Redirect", () => {
  test("should redirect /epf-ppf to /epf", async ({ page }) => {
    await page.goto("/investments/epf-ppf");
    await page.waitForLoadState("domcontentloaded");

    // Should redirect to EPF page
    await expect(page).toHaveURL(/\/investments\/epf$/);
  });

  test("should load EPF page after redirect", async ({ page }) => {
    await page.goto("/investments/epf-ppf");
    await page.waitForLoadState("domcontentloaded");
    await page.locator(".v-card").first().waitFor({ state: "visible", timeout: 10000 }).catch(() => {});

    const epfPage = new EpfPage(page);
    await epfPage.expectPageLoaded();
  });

  test("should show EPF second-level tabs after redirect", async ({ page }) => {
    await page.goto("/investments/epf-ppf");
    await page.waitForLoadState("domcontentloaded");
    await page.locator(".v-card").first().waitFor({ state: "visible", timeout: 10000 }).catch(() => {});

    // Should show second-level tabs (Overview and Item Details)
    await expect(page.getByRole("tab", { name: "Overview" })).toBeVisible();
    await expect(page.getByRole("tab", { name: "Item Details" })).toBeVisible();

    // EPF and PPF are now separate pages accessed via sidebar (no horizontal tabs)
    // Verify we're on EPF page
    await expect(page).toHaveURL(/\/investments\/epf$/);
  });
});
