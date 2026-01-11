import { test, expect } from "@playwright/test";
import { ScenariosPage } from "../../pages/tax-planning";

/**
 * Tax Scenarios Management Tests
 *
 * Structure: Tax Details tab → Scenarios accordion section
 * The scenarios section is now inside an accordion in the Tax Details tab
 */
test.describe("Tax Scenarios Management", () => {
  let scenariosPage: ScenariosPage;

  test.beforeEach(async ({ page }) => {
    scenariosPage = new ScenariosPage(page);
    // navigateTo() now handles: go to page → click Tax Details tab → expand Scenarios accordion
    await scenariosPage.navigateTo();
  });

  test("should load scenarios section", async ({ page }) => {
    await scenariosPage.expectPageLoaded();
    // URL remains /tax-planning (accordion-based, not route-based)
    await expect(page).toHaveURL(/\/dashboard\/tax-planning$/);
  });

  test("should display Tax Details tab as active with Scenarios expanded", async ({ page }) => {
    await expect(scenariosPage.taxDetailsTab).toHaveAttribute("aria-selected", "true");
    await expect(scenariosPage.scenariosContent).toBeVisible();
  });

  test.describe("When no baseline exists", () => {
    test("should show create baseline button", async ({ page }) => {
      // This test assumes no baseline exists for the user
      const createButton = page.getByRole("button", { name: /Create Baseline/i });
      const noBaselineMsg = page.locator("text=No Baseline Scenario");

      // Either show create button or baseline card (if exists)
      const hasNoBaseline = await noBaselineMsg.isVisible().catch(() => false);

      if (hasNoBaseline) {
        await expect(createButton).toBeVisible();
      } else {
        await scenariosPage.expectBaselineVisible();
      }
    });
  });

  test.describe("When baseline exists", () => {
    test.beforeEach(async ({ page }) => {
      // Create baseline if it doesn't exist
      const createButton = page.getByRole("button", { name: /Create Baseline/i });
      const hasNoBaseline = await createButton.isVisible().catch(() => false);

      if (hasNoBaseline) {
        await createButton.click();
        await page.waitForTimeout(1000);
      }
    });

    test("should display baseline card", async () => {
      await scenariosPage.expectBaselineVisible();
    });

    test("should show baseline with BASELINE label", async ({ page }) => {
      await expect(scenariosPage.baselineCard).toBeVisible();
      await expect(scenariosPage.baselineCard.locator("text=BASELINE")).toBeVisible();
    });

    test("should display regime in baseline card", async ({ page }) => {
      const regime = await scenariosPage.getBaselineRegime();
      expect(regime).toMatch(/New Regime|Old Regime/i);
    });

    test("should display tax liability in baseline card", async () => {
      const tax = await scenariosPage.getBaselineTax();
      expect(tax).toMatch(/₹|Rs\.?|\d/);
    });

    test("should have refresh baseline button", async ({ page }) => {
      await expect(scenariosPage.refreshBaselineButton).toBeVisible();
    });

    test("should have new scenario button", async ({ page }) => {
      await expect(scenariosPage.newScenarioButton).toBeVisible();
    });
  });

  test.describe("Smart Suggestions", () => {
    test.beforeEach(async ({ page }) => {
      // Create baseline if it doesn't exist
      const createButton = page.getByRole("button", { name: /Create Baseline/i });
      const hasNoBaseline = await createButton.isVisible().catch(() => false);

      if (hasNoBaseline) {
        await createButton.click();
        await page.waitForTimeout(1000);
      }
    });

    test("should display smart suggestions section", async () => {
      await scenariosPage.expectSmartSuggestionsVisible();
    });

    test("should show AI-powered label", async ({ page }) => {
      await expect(page.locator("text=AI-Powered")).toBeVisible();
    });

    test("should display suggestion cards with Create Scenario buttons", async ({ page }) => {
      const suggestionCount = await scenariosPage.getSuggestionCount();

      if (suggestionCount > 0) {
        // At least one suggestion should have a Create Scenario button
        const createButton = scenariosPage.smartSuggestionsCard.getByRole("button", {
          name: /Create Scenario/i,
        });
        await expect(createButton.first()).toBeVisible();
      }
    });
  });

  test.describe("Scenario Editor Dialog", () => {
    test.beforeEach(async ({ page }) => {
      // Create baseline if it doesn't exist
      const createButton = page.getByRole("button", { name: /Create Baseline/i });
      const hasNoBaseline = await createButton.isVisible().catch(() => false);

      if (hasNoBaseline) {
        await createButton.click();
        await page.waitForTimeout(1000);
      }
    });

    test("should open scenario editor dialog when clicking New Scenario", async ({ page }) => {
      await scenariosPage.openNewScenarioDialog();
      await scenariosPage.expectScenarioEditorVisible();
    });

    test("should close scenario editor dialog when clicking Cancel", async ({ page }) => {
      await scenariosPage.openNewScenarioDialog();
      await scenariosPage.cancelScenario();
      await scenariosPage.expectScenarioEditorClosed();
    });

    test("should have required form fields in scenario editor", async ({ page }) => {
      await scenariosPage.openNewScenarioDialog();

      // Check for essential form fields
      await expect(scenariosPage.scenarioNameInput).toBeVisible();
      await expect(scenariosPage.regimeSelect).toBeVisible();
    });

    test("should show live tax preview in editor", async ({ page }) => {
      await scenariosPage.openNewScenarioDialog();

      // Should have live preview section
      await expect(page.locator("text=Live Tax Preview")).toBeVisible();
    });
  });

  test.describe("Scenario Management", () => {
    const testScenarioName = "E2E Test Scenario";

    test.beforeEach(async ({ page }) => {
      // Create baseline if it doesn't exist
      const createButton = page.getByRole("button", { name: /Create Baseline/i });
      const hasNoBaseline = await createButton.isVisible().catch(() => false);

      if (hasNoBaseline) {
        await createButton.click();
        await page.waitForTimeout(1000);
      }
    });

    test("should create a new scenario", async ({ page }) => {
      await scenariosPage.openNewScenarioDialog();

      await scenariosPage.fillScenarioForm({
        name: testScenarioName,
        description: "Test scenario created by E2E test",
        regime: "NEW",
      });

      await scenariosPage.saveScenario();
      await scenariosPage.expectScenarioEditorClosed();

      // Verify scenario was created
      await scenariosPage.expectScenarioExists(testScenarioName);
    });

    test("should show savings/increase compared to baseline", async ({ page }) => {
      // First create a scenario if it doesn't exist
      const existingScenario = page.locator(".scenario-card").first();
      const hasScenario = await existingScenario.isVisible().catch(() => false);

      if (hasScenario) {
        // Check for savings/comparison chip
        const savingsChip = existingScenario.locator(".v-chip").filter({ hasText: /Save|₹/i });
        await expect(savingsChip.first()).toBeVisible();
      }
    });
  });

  test.describe("Scenario Comparison", () => {
    test.beforeEach(async ({ page }) => {
      // Create baseline if it doesn't exist
      const createButton = page.getByRole("button", { name: /Create Baseline/i });
      const hasNoBaseline = await createButton.isVisible().catch(() => false);

      if (hasNoBaseline) {
        await createButton.click();
        await page.waitForTimeout(1000);
      }
    });

    test("should enable compare button when 2+ scenarios selected", async ({ page }) => {
      const scenarioCount = await scenariosPage.getScenarioCount();

      if (scenarioCount >= 2) {
        // Select first two scenarios
        const checkboxes = page.locator(".scenario-card .v-checkbox");
        await checkboxes.nth(0).click();
        await checkboxes.nth(1).click();

        // Compare button should now be visible
        await expect(scenariosPage.compareButton).toBeVisible();
      }
    });

    test("should open comparison dialog", async ({ page }) => {
      const scenarioCount = await scenariosPage.getScenarioCount();

      if (scenarioCount >= 2) {
        // Select scenarios and compare
        const checkboxes = page.locator(".scenario-card .v-checkbox");
        await checkboxes.nth(0).click();
        await checkboxes.nth(1).click();

        await scenariosPage.openComparison();
        await scenariosPage.expectComparisonVisible();
      }
    });

    test("should show comparison table with parameters", async ({ page }) => {
      const scenarioCount = await scenariosPage.getScenarioCount();

      if (scenarioCount >= 2) {
        const checkboxes = page.locator(".scenario-card .v-checkbox");
        await checkboxes.nth(0).click();
        await checkboxes.nth(1).click();

        await scenariosPage.openComparison();

        // Check for parameter rows
        await expect(page.locator("text=Tax Regime")).toBeVisible();
        await expect(page.locator("text=Gross Income")).toBeVisible();
        await expect(page.locator("text=Tax Liability")).toBeVisible();
      }
    });

    test("should close comparison dialog", async ({ page }) => {
      const scenarioCount = await scenariosPage.getScenarioCount();

      if (scenarioCount >= 2) {
        const checkboxes = page.locator(".scenario-card .v-checkbox");
        await checkboxes.nth(0).click();
        await checkboxes.nth(1).click();

        await scenariosPage.openComparison();
        await scenariosPage.closeComparison();
        await scenariosPage.expectComparisonClosed();
      }
    });
  });

  test.describe("Educational Info", () => {
    test("should display about what-if scenarios section", async ({ page }) => {
      await expect(page.locator("text=About What-If Scenarios")).toBeVisible();
    });

    test("should show optimization tips", async ({ page }) => {
      await expect(page.locator("text=Popular Optimizations")).toBeVisible();
      await expect(page.locator("text=80C")).toBeVisible();
      await expect(page.locator("text=80CCD")).toBeVisible();
    });
  });
});
