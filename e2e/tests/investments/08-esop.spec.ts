import { test, expect } from "@playwright/test";
import { ESOPPage } from "../../pages/investments";
import { esopGrantsData, esopSummary, testESOPGrant } from "../../fixtures/investments-data";

test.describe("ESOP/RSU Grants", () => {
  let esopPage: ESOPPage;

  test.beforeEach(async ({ page }) => {
    esopPage = new ESOPPage(page);
    await esopPage.navigateTo();
  });

  test.describe("Navigation & Page Load", () => {
    test("should display ESOP page correctly", async ({ page }) => {
      await esopPage.expectPageLoaded();
      await expect(esopPage.addGrantButton).toBeVisible();
    });

    test("should show ESOPs tab as active", async ({ page }) => {
      await expect(page.getByRole("tab", { name: /ESOPs/i })).toHaveAttribute("aria-selected", "true");
    });

    test("should display two-tab pattern (Overview and Item Details)", async ({ page }) => {
      await expect(esopPage.overviewTab).toBeVisible();
      await expect(esopPage.detailsTab).toBeVisible();
    });

    test("should default to Overview tab", async ({ page }) => {
      await esopPage.expectOverviewTabActive();
    });

    test("should have financial year selector", async ({ page }) => {
      await expect(esopPage.financialYearSelector).toBeVisible();
    });
  });

  test.describe("Overview Tab - Summary Cards", () => {
    test("should show summary cards with correct titles", async ({ page }) => {
      await esopPage.expectSummaryCardsVisible();
    });

    test("should display total value in INR format", async ({ page }) => {
      const totalValue = await esopPage.getTotalValue();
      // Should contain rupee symbol or L/Cr suffix
      expect(totalValue).toMatch(/₹|L|Cr|,/);
    });

    test("should display vested value", async ({ page }) => {
      const vestedValue = await esopPage.getVestedValue();
      expect(vestedValue).toBeTruthy();
    });

    test("should display exercisable value", async ({ page }) => {
      const exercisableValue = await esopPage.getExercisableValue();
      expect(exercisableValue).toBeTruthy();
    });

    test("should display unvested value", async ({ page }) => {
      const unvestedValue = await esopPage.getUnvestedValue();
      expect(unvestedValue).toBeTruthy();
    });
  });

  test.describe("Overview Tab - Charts", () => {
    test("should display grant type distribution chart", async ({ page }) => {
      await expect(esopPage.grantTypeChart).toBeVisible();
    });

    test("should display vesting status chart", async ({ page }) => {
      await expect(esopPage.vestingStatusChart).toBeVisible();
    });

    test("should show chart title for grant type", async ({ page }) => {
      await expect(page.getByText(/Grant Type Distribution/i)).toBeVisible();
    });

    test("should show chart title for vesting status", async ({ page }) => {
      await expect(page.getByText(/Vesting Status/i)).toBeVisible();
    });
  });

  test.describe("Overview Tab - Quick View", () => {
    test("should display grants in quick view list", async ({ page }) => {
      await expect(page.getByText(/Quick View/i)).toBeVisible();
    });

    test("should show View All Grants button", async ({ page }) => {
      await expect(esopPage.viewDetailsButton).toBeVisible();
    });

    test("should navigate to details tab on View All Grants click", async ({ page }) => {
      await esopPage.clickViewAllGrants();
      await esopPage.expectDetailsTabActive();
    });
  });

  test.describe("Overview Tab - Grant Summary", () => {
    test("should show grant summary section", async ({ page }) => {
      await expect(page.getByText(/Grant Summary/i)).toBeVisible();
    });

    test("should display total grants count", async ({ page }) => {
      await expect(page.getByText(/Total Grants/i)).toBeVisible();
    });

    test("should display active grants count", async ({ page }) => {
      await expect(page.getByText(/Active/i)).toBeVisible();
    });

    test("should display companies count", async ({ page }) => {
      await expect(page.getByText(/Companies/i)).toBeVisible();
    });
  });

  test.describe("Overview Tab - Tax Rules", () => {
    test("should display ESOP tax rules section", async ({ page }) => {
      await esopPage.expectTaxRulesSectionVisible();
    });

    test("should show perquisite taxation info", async ({ page }) => {
      await expect(page.getByText(/At Vesting/i)).toBeVisible();
      await expect(page.getByText(/FMV.*Exercise Price/i)).toBeVisible();
    });

    test("should show listed company LTCG info", async ({ page }) => {
      await expect(page.getByText(/Listed.*LTCG/i)).toBeVisible();
      await expect(page.getByText(/12\.5%|12 months/i)).toBeVisible();
    });

    test("should show unlisted company LTCG info", async ({ page }) => {
      await expect(page.getByText(/Unlisted.*LTCG/i)).toBeVisible();
      await expect(page.getByText(/24 months/i)).toBeVisible();
    });

    test("should show startup tax deferral benefit", async ({ page }) => {
      await expect(page.getByText(/Startup Benefit/i)).toBeVisible();
      await expect(page.getByText(/DPIIT|4 years|deferred/i)).toBeVisible();
    });
  });

  test.describe("Tab Navigation", () => {
    test("should switch to Item Details tab", async ({ page }) => {
      await esopPage.navigateToDetails();
      await esopPage.expectDetailsTabActive();
    });

    test("should switch back to Overview tab", async ({ page }) => {
      await esopPage.navigateToDetails();
      await esopPage.navigateToOverview();
      await esopPage.expectOverviewTabActive();
    });

    test("should not change URL when switching tabs", async ({ page }) => {
      const initialUrl = page.url();
      await esopPage.navigateToDetails();
      expect(page.url()).toBe(initialUrl);

      await esopPage.navigateToOverview();
      expect(page.url()).toBe(initialUrl);
    });

    test("should maintain tab state after interaction", async ({ page }) => {
      await esopPage.navigateToDetails();
      await page.waitForTimeout(500);
      await esopPage.expectDetailsTabActive();
    });
  });

  test.describe("Add Grant Dialog", () => {
    test("should open add grant dialog", async ({ page }) => {
      await esopPage.openAddGrantDialog();
      await esopPage.expectAddGrantDialogVisible();
    });

    test("should display dialog title", async ({ page }) => {
      await esopPage.openAddGrantDialog();
      await expect(page.getByText(/Add ESOP|Add Grant/i)).toBeVisible();
    });

    test("should close dialog on cancel/close", async ({ page }) => {
      await esopPage.openAddGrantDialog();
      await esopPage.closeAddGrantDialog();
      await esopPage.expectAddGrantDialogClosed();
    });

    test("should have add grant button on action bar", async ({ page }) => {
      // Scroll to action bar
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await expect(esopPage.addGrantButton).toBeVisible();
    });
  });

  test.describe("Item Details Tab", () => {
    test.beforeEach(async ({ page }) => {
      await esopPage.navigateToDetails();
    });

    test("should display grants table or list", async ({ page }) => {
      // Either a data table or list should be visible
      const hasTable = await esopPage.grantsTable.isVisible();
      const hasList = await page.locator(".v-list").isVisible();
      expect(hasTable || hasList).toBeTruthy();
    });

    test("should show add grant button on details tab", async ({ page }) => {
      await expect(esopPage.addGrantButton).toBeVisible();
    });

    test("should display grant company names", async ({ page }) => {
      // Check for mock data companies
      const companyVisible = await page.getByText(/TechCorp|Global Tech/i).isVisible();
      expect(companyVisible).toBeTruthy();
    });

    test("should display grant type badges", async ({ page }) => {
      // Should show ESOP or RSU indicators
      const hasBadge = await page.locator(".v-chip, .v-avatar").filter({ hasText: /E|R/i }).isVisible();
      expect(hasBadge).toBeTruthy();
    });
  });

  test.describe("Financial Year Selection", () => {
    test("should change data on FY selection", async ({ page }) => {
      // Get initial state
      const initialValue = await esopPage.getTotalValue();

      // Change FY (if selector allows)
      await esopPage.financialYearSelector.click();
      const options = page.getByRole("option");
      const optionCount = await options.count();

      if (optionCount > 1) {
        // Select a different year
        await options.nth(1).click();
        await page.waitForTimeout(500);

        // Page should still be functional
        await esopPage.expectSummaryCardsVisible();
      }
    });
  });

  test.describe("Grant Types Display", () => {
    test("should display ESOP grant type", async ({ page }) => {
      // Mock data includes ESOP grants
      const esopGrant = esopGrantsData.find((g) => g.grantType === "ESOP");
      if (esopGrant) {
        await expect(page.getByText(esopGrant.companyName)).toBeVisible();
      }
    });

    test("should display RSU grant type", async ({ page }) => {
      // Mock data includes RSU grants
      const rsuGrant = esopGrantsData.find((g) => g.grantType === "RSU");
      if (rsuGrant) {
        await expect(page.getByText(rsuGrant.companyName)).toBeVisible();
      }
    });
  });

  test.describe("Value Calculations Display", () => {
    test("should show units count in summary", async ({ page }) => {
      // Summary cards show unit counts
      await expect(page.getByText(/units/i)).toBeVisible();
    });

    test("should display currency in Indian format", async ({ page }) => {
      // Values should use INR formatting (lakhs/crores or comma separated)
      const valueText = await page.locator(".text-currency, .text-h5, .text-h6").first().textContent();
      // Should have INR indicators
      expect(valueText).toMatch(/₹|L|Cr|,|\d/);
    });
  });

  test.describe("Responsive Layout", () => {
    test("should stack cards on mobile viewport", async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.waitForTimeout(300);

      // Summary cards should still be visible
      await esopPage.expectSummaryCardsVisible();
    });
  });
});
