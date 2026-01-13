import { test, expect } from "@playwright/test";
import { AdvanceTaxPage } from "../../pages/tax-planning";

/**
 * Advance Tax Management Tests
 *
 * Structure: Tax Details tab → Advance Tax accordion section
 * The advance tax section is now inside an accordion in the Tax Details tab
 *
 * Empty State: Shows "No Advance Tax Estimate" with "Create Estimate" button
 * With Estimate: Shows summary cards, quarterly timeline, payment history
 */
test.describe("Advance Tax Management", () => {
  let advanceTaxPage: AdvanceTaxPage;

  test.beforeEach(async ({ page }) => {
    advanceTaxPage = new AdvanceTaxPage(page);
    // navigateTo() now handles: go to page → click Tax Details tab → expand Advance Tax accordion
    await advanceTaxPage.navigateTo();
  });

  test("should load advance tax section", async ({ page }) => {
    // URL is /tax-planning (accordion-based, not route-based)
    await expect(page).toHaveURL(/\/tax-planning$/);
  });

  test("should display Tax Details tab as active", async ({ page }) => {
    await expect(advanceTaxPage.taxDetailsTab).toHaveAttribute("aria-selected", "true");
  });

  test.describe("Empty State", () => {
    test("should show No Advance Tax Estimate message or summary", async ({ page }) => {
      // Either shows empty state or has an estimate
      const noEstimateMsg = page.getByText("No Advance Tax Estimate");
      const summaryCards = page.locator("text=/Net Tax Liability|Total Paid/i");

      const hasNoEstimate = await noEstimateMsg.isVisible().catch(() => false);
      const hasSummary = await summaryCards.first().isVisible().catch(() => false);

      // Either empty state or summary cards should be visible
      expect(hasNoEstimate || hasSummary).toBe(true);
    });

    test("should show Create Estimate button when no estimate exists", async ({ page }) => {
      const noEstimateMsg = page.getByText("No Advance Tax Estimate");
      const createButton = page.getByRole("button", { name: /Create Estimate/i });

      const hasNoEstimate = await noEstimateMsg.isVisible().catch(() => false);

      if (hasNoEstimate) {
        await expect(createButton).toBeVisible();
      }
    });
  });

  test.describe("Create Estimate Flow", () => {
    test("should have Create Estimate button clickable when no estimate", async ({ page }) => {
      const createButton = page.getByRole("button", { name: /Create Estimate/i });
      const hasButton = await createButton.isVisible().catch(() => false);

      if (hasButton) {
        await expect(createButton).toBeEnabled();
      }
    });
  });
});
