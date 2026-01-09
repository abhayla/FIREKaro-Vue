# /e2e-test Skill

Generate Playwright e2e tests for FIREKaro dashboard sections.

## Usage

```
/e2e-test [section] [test-type]
```

## Arguments

### section (required)
- `salary` - Salary income section
- `non-salary-income` - Non-salary income (business, rental, capital gains)
- `tax-planning` - Tax planning and regime comparison
- `investments` - Investment portfolio
- `liabilities` - Loans and credit cards
- `expenses` - Expense tracking and budgets
- `protection` - Insurance coverage
- `financial-health` - Net worth and health score
- `fire-goals` - FIRE progress and goals

### test-type (optional)
- `navigation` - Tab navigation and routing tests
- `crud` - Create, read, update, delete operations
- `calculations` - INR calculations and validations
- `validation` - Form validation tests
- `reports` - Charts and exports
- `all` - All test types (default)

## Examples

```bash
# Generate all tests for investments section
/e2e-test investments

# Generate only CRUD tests for liabilities
/e2e-test liabilities crud

# Generate calculation tests for tax planning
/e2e-test tax-planning calculations
```

## Output Structure

The skill generates:

1. **Page Objects** (`e2e/pages/{section}/`)
   - `index.ts` - Barrel export with all page classes
   - Extends `BasePage` from `base.page.ts`
   - Uses accessibility-first selectors (getByRole, getByText)
   - Vuetify component selectors (.v-card, .v-dialog, .v-data-table)

2. **Test Specs** (`e2e/tests/{section}/`)
   - `01-navigation.spec.ts` - Tab navigation tests
   - `02-{feature}.spec.ts` - Core feature tests
   - Uses fixtures from `e2e/fixtures/{section}-data.ts`

3. **Fixtures** (`e2e/fixtures/{section}-data.ts`)
   - TypeScript interfaces for test data
   - Sample data matching unified profile
   - Helper functions for calculations

## Patterns

### Page Object Pattern

```typescript
import { Page, Locator, expect } from "@playwright/test";
import { BasePage } from "../base.page";

export class SectionPage extends BasePage {
  readonly baseUrl = "/dashboard/{section}";

  // Locators
  get pageTitle(): Locator {
    return this.page.getByRole("heading", { name: /Section Title/i });
  }

  get addButton(): Locator {
    return this.page.getByRole("button", { name: /Add/i });
  }

  get dataTable(): Locator {
    return this.page.locator(".v-data-table");
  }

  // Actions
  async navigateTo(): Promise<void> {
    await this.page.goto(this.baseUrl);
    await this.page.waitForLoadState("networkidle");
  }

  async expectPageLoaded(): Promise<void> {
    await expect(this.pageTitle).toBeVisible();
  }
}
```

### Test Spec Pattern

```typescript
import { test, expect } from "@playwright/test";
import { SectionPage } from "../../pages/section";
import { sectionData } from "../../fixtures/section-data";

test.describe("Section Feature", () => {
  let page: SectionPage;

  test.beforeEach(async ({ page: playwrightPage }) => {
    page = new SectionPage(playwrightPage);
    await page.navigateTo();
  });

  test("should display page", async () => {
    await page.expectPageLoaded();
  });

  test("should show data in table", async () => {
    await expect(page.dataTable).toBeVisible();
  });
});
```

### INR Currency Verification

```typescript
test("should display amount in INR format", async ({ page }) => {
  const amountText = await page.locator(".text-currency").first().textContent();
  expect(amountText).toContain("₹");
  // Verify Indian number format (lakhs/crores)
  expect(amountText).toMatch(/₹[\d,]+/);
});
```

### Form Dialog Pattern

```typescript
test("should open add form dialog", async ({ page }) => {
  await page.addButton.click();
  await expect(page.formDialog).toBeVisible();
});

test("should fill and submit form", async ({ page }) => {
  await page.openAddForm();
  await page.fillForm({
    name: "Test Item",
    amount: 100000,
  });
  await page.saveForm();
  await page.expectFormDialogClosed();
  await page.expectItemInTable("Test Item");
});
```

## Selectors Reference

### Vuetify 3 Components

| Component | Selector |
|-----------|----------|
| Card | `.v-card` |
| Dialog | `.v-dialog` |
| Data Table | `.v-data-table, .v-table` |
| Select | `.v-select` |
| Text Field | `.v-text-field` |
| Button | `getByRole("button")` |
| Tab | `getByRole("tab")` |
| Progress | `.v-progress-linear, .v-progress-circular` |
| Alert | `.v-alert` |
| Chip | `.v-chip` |

### Accessibility Selectors (Preferred)

```typescript
// Buttons
page.getByRole("button", { name: /Add|Save|Cancel/i })

// Tabs
page.getByRole("tab", { name: /Overview|Settings/i })

// Form inputs
page.getByLabel(/Amount|Name|Date/i)

// Text content
page.getByText(/Total|Summary/i)

// Headings
page.getByRole("heading", { name: /Page Title/i })
```

## Running Tests

```bash
# Run all e2e tests
npm run test:e2e

# Run specific section
npx playwright test e2e/tests/investments/

# Run with UI mode
npx playwright test --ui

# Run headed (visible browser)
npx playwright test --headed

# Run specific test file
npx playwright test e2e/tests/investments/01-navigation.spec.ts
```

## Test Coverage Summary

| Section | Spec Files | Tests | Page Objects |
|---------|-----------|-------|--------------|
| Salary | 9 | 97 | 7 |
| Non-Salary Income | 7 | 45 | 6 |
| Tax Planning | 6 | 35 | 4 |
| Investments | 8 | 50 | 8 |
| Liabilities | 7 | 40 | 5 |
| Expenses | 6 | 35 | 4 |
| Protection | 5 | 30 | 4 |
| Financial Health | 5 | 30 | 6 |
| FIRE & Goals | 6 | 35 | 6 |
| Integration | 3 | 15 | 0 |
| **Total** | **62** | **412** | **50** |
