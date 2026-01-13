/**
 * Expenses Page Objects
 * Barrel export for all expenses page objects
 *
 * Structure:
 * - ExpensesOverviewPage: Overview page (/expenses) with summary cards, quick actions
 * - ExpenseTrackingPage: Track section (/expenses/track) with Overview + Expense Details tabs
 * - BudgetsPage: Budgets section (/expenses/budgets) with Overview + Budget Details tabs
 * - RecurringExpensesPage: Recurring section (/expenses/recurring) with Overview + Recurring Details tabs
 * - ExpenseCategoriesPage: Categories page (/expenses/categories) with Rules + Categories tabs
 * - ExpenseReportsPage: Reports page (/expenses/reports) with period selectors, charts, exports
 */

export { ExpensesOverviewPage } from "./overview.page";
export { ExpenseTrackingPage } from "./tracking.page";
export { BudgetsPage } from "./budgets.page";
export { RecurringExpensesPage } from "./recurring.page";
export { ExpenseCategoriesPage } from "./categories.page";
export { ExpenseReportsPage } from "./reports.page";
