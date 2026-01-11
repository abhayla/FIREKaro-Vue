/**
 * Expenses Page Objects
 * Barrel export for all expenses page objects
 *
 * Structure:
 * - ExpensesOverviewPage: Landing page with summary cards, alerts, quick nav
 * - ExpenseTrackingPage: Track section with Overview + Expense Details tabs
 * - BudgetsPage: Budgets section with Overview + Budget Details tabs
 * - RecurringExpensesPage: Recurring section with Overview + Recurring Details tabs
 * - ExpenseCategoriesPage: Categories dialog (accessible from Track page)
 *
 * NOTE: Reports page is deprecated - reports are now in Track Overview tab
 */

export { ExpensesOverviewPage } from "./overview.page";
export { ExpenseTrackingPage } from "./tracking.page";
export { BudgetsPage } from "./budgets.page";
export { RecurringExpensesPage } from "./recurring.page";
export { ExpenseCategoriesPage } from "./categories.page";

// Legacy export - Reports functionality is now in ExpenseTrackingPage.overviewTab
// Keeping ExpensesReportsPage export for backwards compatibility with existing tests
// Tests should be updated to use ExpenseTrackingPage instead
export { ExpenseTrackingPage as ExpensesReportsPage } from "./tracking.page";
