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

  test("should show separate EPF and PPF tabs after redirect", async ({ page }) => {
    await page.goto("/investments/epf-ppf");
    await page.waitForLoadState("domcontentloaded");
    await page.locator(".v-card").first().waitFor({ state: "visible", timeout: 10000 }).catch(() => {});

    // Should now show separate EPF and PPF tabs (not combined)
    await expect(page.getByRole("tab", { name: "EPF" })).toBeVisible();
    await expect(page.getByRole("tab", { name: "PPF" })).toBeVisible();
  });
});
