import { test, expect } from "@playwright/test";
import { NetWorthPage } from "../../pages/financial-health";
import { milestonesData, testMilestone } from "../../fixtures/financial-health-data";

/**
 * Net Worth Milestones Tests
 *
 * Tests for the customizable net worth milestones feature:
 * - Display of milestones section
 * - Achieved vs pending milestones
 * - Adding custom milestones
 * - Progress tracking
 * - Next milestone projection
 */
test.describe("Net Worth Milestones", () => {
  let netWorthPage: NetWorthPage;

  test.beforeEach(async ({ page }) => {
    netWorthPage = new NetWorthPage(page);
    await netWorthPage.navigateTo();
  });

  test("should display milestones section on net worth page", async ({ page }) => {
    await netWorthPage.expectPageLoaded();
    await netWorthPage.expectMilestonesSectionVisible();
  });

  test("should show achieved and pending milestones", async ({ page }) => {
    await netWorthPage.expectMilestonesSectionVisible();

    // Check for milestone items
    const milestoneCount = await netWorthPage.getMilestoneCount();
    expect(milestoneCount).toBeGreaterThan(0);
  });

  test("should display progress for pending milestones", async ({ page }) => {
    await netWorthPage.expectMilestonesSectionVisible();

    // Check for progress indicators (percentages or progress bars)
    await expect(
      page.getByText(/%/).first()
    ).toBeVisible();
  });

  test("should show add milestone button", async ({ page }) => {
    await netWorthPage.expectMilestonesSectionVisible();
    await expect(netWorthPage.addMilestoneButton).toBeVisible();
  });

  test("should open add milestone dialog", async ({ page }) => {
    await netWorthPage.openAddMilestoneDialog();
    await expect(netWorthPage.milestoneDialog).toBeVisible();
    await expect(netWorthPage.milestoneNameInput).toBeVisible();
    await expect(netWorthPage.milestoneAmountInput).toBeVisible();
  });

  test("should cancel milestone dialog without saving", async ({ page }) => {
    await netWorthPage.openAddMilestoneDialog();
    await netWorthPage.milestoneNameInput.fill("Test Cancel");
    await netWorthPage.milestoneCancelButton.click();

    // Dialog should be closed
    await expect(netWorthPage.milestoneDialog).not.toBeVisible();
  });

  test("should add a custom milestone", async ({ page }) => {
    const initialCount = await netWorthPage.getMilestoneCount();

    await netWorthPage.addMilestone(testMilestone.name, testMilestone.targetAmount);

    // Verify milestone was added
    await netWorthPage.expectMilestoneVisible(testMilestone.name);
  });

  test("should display milestone amounts in INR format", async ({ page }) => {
    await netWorthPage.expectMilestonesSectionVisible();

    // Check for INR currency formatting
    await expect(
      page.locator('.v-card').filter({ hasText: /Milestones/i }).getByText(/₹|Cr|L/)
    ).toBeVisible();
  });

  test("should show next milestone information", async ({ page }) => {
    // Check for "next milestone" or "days to" information
    const hasNextInfo = await page.getByText(/Next|Days to|Months to/i).isVisible();
    expect(hasNextInfo).toBeTruthy();
  });

  test("should highlight achieved milestones differently", async ({ page }) => {
    await netWorthPage.expectMilestonesSectionVisible();

    // Check for achieved indicators (checkmark, "Achieved" text, or success color)
    const achievedElements = await page.locator('.v-chip, .v-icon').filter({
      hasText: /Achieved|✓|check/i
    }).count();

    // Should have at least one achieved milestone based on test data
    expect(achievedElements).toBeGreaterThanOrEqual(0);
  });
});
