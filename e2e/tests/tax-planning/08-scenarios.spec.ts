import { test, expect } from "@playwright/test";
import { ScenariosPage } from "../../pages/tax-planning";

/**
 * Tax Scenarios (What-If) Tests
 *
 * Structure: Tax Details tab → What-If Scenarios accordion section
 * The scenarios section is now inside an accordion in the Tax Details tab
 *
 * Empty State: Shows "No Baseline Scenario" with "Create Baseline" button
 * New Scenario button is disabled until baseline exists
 * With Baseline: Can create and compare what-if scenarios
 */
test.describe("Tax Scenarios Management", () => {
  let scenariosPage: ScenariosPage;

  test.beforeEach(async ({ page }) => {
    scenariosPage = new ScenariosPage(page);
    // navigateTo() now handles: go to page → click Tax Details tab → expand Scenarios accordion
    await scenariosPage.navigateTo();
  });

  test("should load scenarios section", async ({ page }) => {
    // URL is /tax-planning (accordion-based, not route-based)
    await expect(page).toHaveURL(/\/tax-planning$/);
  });

  test("should display Tax Details tab as active", async ({ page }) => {
    await expect(scenariosPage.taxDetailsTab).toHaveAttribute("aria-selected", "true");
  });

  test.describe("Empty State", () => {
    test("should show No Baseline Scenario message or scenarios list", async ({ page }) => {
      // Either shows empty state or has a baseline
      const noBaselineMsg = page.getByText("No Baseline Scenario");
      const baselineCard = page.locator("text=/BASELINE|Baseline Scenario/i");

      const hasNoBaseline = await noBaselineMsg.isVisible().catch(() => false);
      const hasBaseline = await baselineCard.first().isVisible().catch(() => false);

      // Either empty state or baseline should be visible
      expect(hasNoBaseline || hasBaseline).toBe(true);
    });

    test("should show Create Baseline button when no baseline exists", async ({ page }) => {
      const noBaselineMsg = page.getByText("No Baseline Scenario");
      const createButton = page.getByRole("button", { name: /Create Baseline/i });

      const hasNoBaseline = await noBaselineMsg.isVisible().catch(() => false);

      if (hasNoBaseline) {
        await expect(createButton).toBeVisible();
      }
    });

    test("should have New Scenario button disabled when no baseline", async ({ page }) => {
      const noBaselineMsg = page.getByText("No Baseline Scenario");
      const newScenarioButton = page.getByRole("button", { name: /New Scenario/i });

      const hasNoBaseline = await noBaselineMsg.isVisible().catch(() => false);

      if (hasNoBaseline) {
        await expect(newScenarioButton).toBeDisabled();
      }
    });
  });

  test.describe("Create Baseline Flow", () => {
    test("should have Create Baseline button clickable when no baseline", async ({ page }) => {
      const createButton = page.getByRole("button", { name: /Create Baseline/i });
      const hasButton = await createButton.isVisible().catch(() => false);

      if (hasButton) {
        await expect(createButton).toBeEnabled();
      }
    });
  });
});
