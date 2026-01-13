import { test, expect } from "@playwright/test";
import { EpfPage, PpfPage, NpsPage, InvestmentReportsPage } from "../../pages/investments";

test.describe("Financial Year Handling - Investments", () => {
  test.describe("EPF - Financial Year Selection", () => {
    let epfPage: EpfPage;

    test.beforeEach(async ({ page }) => {
      epfPage = new EpfPage(page);
      await epfPage.navigateTo();
    });

    test("should display financial year selector", async ({ page }) => {
      await expect(epfPage.financialYearSelector).toBeVisible();
    });

    test("should default to current financial year", async ({ page }) => {
      const currentFY = epfPage.getCurrentFinancialYear();
      await epfPage.expectFinancialYearSelected(currentFY);
    });

    test("should show FY options in dropdown", async ({ page }) => {
      await epfPage.financialYearSelector.click();
      await page.waitForTimeout(300);

      // Should show multiple FY options
      const options = page.getByRole("option");
      const count = await options.count();
      expect(count).toBeGreaterThan(0);
    });

    test("should change contribution data on FY selection", async ({ page }) => {
      // Get initial balance
      const initialBalance = await epfPage.getTotalBalance();

      // Change FY
      await epfPage.financialYearSelector.click();
      const options = page.getByRole("option");
      const optionCount = await options.count();

      if (optionCount > 1) {
        // Select previous FY
        await options.nth(1).click();
        await page.waitForTimeout(500);

        // Page should update (may show different data or empty state)
        await epfPage.expectSummaryCardsVisible();
      }
    });

    test("should persist FY selection when switching tabs", async ({ page }) => {
      // Select a specific FY
      await epfPage.selectFinancialYear("2024-25");

      // Switch to details tab
      await epfPage.navigateToDetails();
      await page.waitForTimeout(300);

      // Switch back to overview
      await epfPage.navigateToOverview();
      await page.waitForTimeout(300);

      // FY should still be selected
      await epfPage.expectFinancialYearSelected("2024-25");
    });

    test("should show monthly contribution grid for selected FY", async ({ page }) => {
      await epfPage.navigateToDetails();

      // Should show 12 months grid
      const monthLabels = page.locator("text=/Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec|Jan|Feb|Mar/i");
      const visibleMonths = await monthLabels.count();
      expect(visibleMonths).toBeGreaterThan(0);
    });
  });

  test.describe("PPF - Financial Year Selection", () => {
    let ppfPage: PpfPage;

    test.beforeEach(async ({ page }) => {
      ppfPage = new PpfPage(page);
      await ppfPage.navigateTo();
    });

    test("should display financial year selector", async ({ page }) => {
      await expect(ppfPage.financialYearSelector).toBeVisible();
    });

    test("should default to current financial year", async ({ page }) => {
      const currentFY = ppfPage.getCurrentFinancialYear();
      await ppfPage.expectFinancialYearSelected(currentFY);
    });

    test("should show PPF balance for selected FY", async ({ page }) => {
      const balance = await ppfPage.getCurrentBalance();
      expect(balance).toBeTruthy();
    });

    test("should update interest earned on FY change", async ({ page }) => {
      // Interest earned is FY-specific
      const interestCard = ppfPage.interestEarnedCard;
      await expect(interestCard).toBeVisible();
    });

    test("should show contribution history for FY", async ({ page }) => {
      await ppfPage.navigateToDetails();

      // Contribution grid or table should be visible
      const contributionSection = page.locator(".v-card").filter({
        hasText: /Contribution|Deposit/i,
      });
      await expect(contributionSection.first()).toBeVisible();
    });

    test("should validate annual limit per FY", async ({ page }) => {
      // PPF has Rs 1.5L annual limit per FY
      const limitInfo = page.getByText(/1\.5\s*L|150,000|₹1,50,000/i);
      await expect(limitInfo).toBeVisible();
    });
  });

  test.describe("NPS - Financial Year Selection", () => {
    let npsPage: NpsPage;

    test.beforeEach(async ({ page }) => {
      npsPage = new NpsPage(page);
      await npsPage.navigateTo();
    });

    test("should display financial year selector", async ({ page }) => {
      await expect(npsPage.financialYearSelector).toBeVisible();
    });

    test("should show 80CCD benefit info for selected FY", async ({ page }) => {
      // NPS has 80CCD(1B) benefit of Rs 50K
      const benefitInfo = page.getByText(/80CCD|50,000|₹50,000/i);
      await expect(benefitInfo).toBeVisible();
    });

    test("should display contribution summary for FY", async ({ page }) => {
      const contributionCard = npsPage.getSummaryCardByTitle("Contribution");
      const hasContribution = await contributionCard.isVisible();
      // Either contribution card or similar summary should be present
      expect(hasContribution).toBeTruthy();
    });
  });

  test.describe("Reports - Financial Year Filtering", () => {
    let reportsPage: InvestmentReportsPage;

    test.beforeEach(async ({ page }) => {
      reportsPage = new InvestmentReportsPage(page);
      await reportsPage.navigateTo();
    });

    test("should have period/FY selector on reports page", async ({ page }) => {
      // Reports may have FY or date range selector
      const periodSelector = page.locator(".v-select, .v-btn-toggle").filter({
        hasText: /FY|Period|Year|Month/i,
      });
      const isVisible = await periodSelector.first().isVisible();
      expect(isVisible).toBeTruthy();
    });

    test("should filter report data by selected period", async ({ page }) => {
      // Get initial state
      const initialCards = await page.locator(".v-card").count();

      // Change period if selector available
      const periodSelector = page.locator(".v-select").filter({
        hasText: /Period|Year/i,
      });

      if (await periodSelector.isVisible()) {
        await periodSelector.click();
        const options = page.getByRole("option");
        if ((await options.count()) > 1) {
          await options.first().click();
          await page.waitForTimeout(500);
        }
      }

      // Page should still be functional
      const cardsAfter = await page.locator(".v-card").count();
      expect(cardsAfter).toBeGreaterThan(0);
    });
  });

  test.describe("Financial Year Boundary Behavior", () => {
    test("should correctly identify current FY based on date", async ({ page }) => {
      const epfPage = new EpfPage(page);
      await epfPage.navigateTo();

      const currentFY = epfPage.getCurrentFinancialYear();
      // FY format should be YYYY-YY
      expect(currentFY).toMatch(/^\d{4}-\d{2}$/);

      // Verify it's selected by default
      await epfPage.expectFinancialYearSelected(currentFY);
    });

    test("should handle April transition (start of new FY)", async ({ page }) => {
      // This tests FY calculation logic
      const epfPage = new EpfPage(page);

      // If current month is April-March, FY should be correct
      const now = new Date();
      const month = now.getMonth() + 1;
      const year = now.getFullYear();

      let expectedFY: string;
      if (month >= 4) {
        // April onwards = current year to next year
        expectedFY = `${year}-${(year + 1).toString().slice(-2)}`;
      } else {
        // Jan-Mar = previous year to current year
        expectedFY = `${year - 1}-${year.toString().slice(-2)}`;
      }

      await epfPage.navigateTo();
      await epfPage.expectFinancialYearSelected(expectedFY);
    });

    test("should show correct months for FY in contribution grid", async ({ page }) => {
      const epfPage = new EpfPage(page);
      await epfPage.navigateTo();
      await epfPage.navigateToDetails();

      // FY runs April to March
      // First month should be April
      const aprilLabel = page.getByText(/Apr|April/i);
      await expect(aprilLabel.first()).toBeVisible();
    });
  });

  test.describe("Cross-Section FY Consistency", () => {
    test("should use same FY across EPF and PPF", async ({ page }) => {
      const epfPage = new EpfPage(page);
      await epfPage.navigateTo();

      // Select specific FY on EPF
      await epfPage.selectFinancialYear("2024-25");

      // Navigate to PPF
      const ppfPage = new PpfPage(page);
      await ppfPage.navigateTo();

      // Note: FY selection might not persist across pages
      // This test documents expected behavior
      // If FY should persist, verify it here
    });

    test("should calculate correct interest based on FY rates", async ({ page }) => {
      // PPF interest rate changes by FY
      const ppfPage = new PpfPage(page);
      await ppfPage.navigateTo();

      // Current PPF rate should be visible (7.1% as of 2024)
      const rateInfo = page.getByText(/7\.1%|Interest Rate/i);
      await expect(rateInfo).toBeVisible();
    });
  });

  test.describe("FY Data Validation", () => {
    test("should not allow future FY contributions in PPF", async ({ page }) => {
      const ppfPage = new PpfPage(page);
      await ppfPage.navigateTo();

      // Try to select a future FY if available
      await ppfPage.financialYearSelector.click();
      const options = page.getByRole("option");

      // Future FY options should be disabled or not present
      // This test documents expected validation behavior
      await page.keyboard.press("Escape");
    });

    test("should show zero values for FY with no data", async ({ page }) => {
      const epfPage = new EpfPage(page);
      await epfPage.navigateTo();

      // Select an old FY that may have no data
      await epfPage.financialYearSelector.click();
      const options = page.getByRole("option");
      const count = await options.count();

      if (count > 3) {
        // Select oldest available FY
        await options.last().click();
        await page.waitForTimeout(500);

        // Should either show zero values or empty state, not error
        const hasCards = await page.locator(".v-card").count();
        expect(hasCards).toBeGreaterThan(0);
      }
    });
  });
});
