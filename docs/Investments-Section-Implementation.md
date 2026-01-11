# Investments Section - Implementation Documentation

> **Version**: 2.2
> **Last Updated**: January 11, 2026
> **Status**: Implemented

---

## Overview

The Investments section has been restructured to follow the Salary section's two-tab pattern: **Overview** + **Item Details**. Each investment type page now has consistent navigation and data presentation.

---

## URL Structure

```
/investments                    → Portfolio (landing page, no tabs)
/investments/stocks            → Overview | Item Details tabs
/investments/mutual-funds      → Overview | Item Details tabs
/investments/epf               → Overview | Item Details tabs (EPF + VPF tracked separately)
/investments/ppf               → Overview | Item Details tabs (separate from EPF)
/investments/nps               → Overview | Item Details tabs
/investments/esop              → Overview | Item Details tabs
/investments/property          → Overview | Item Details tabs
/investments/reports           → Reports page (no tabs)
```

> **Note**: Investments section uses `/investments/*` URLs (without `/dashboard` prefix) as of v2.2.

### Sidebar Navigation

The sidebar shows EPF and PPF as **separate** menu items:
- **EPF** → `/investments/epf` (includes VPF tracking within the same page)
- **PPF** → `/investments/ppf` (Public Provident Fund - independent of EPF)

### Legacy Redirects

| Old Path | Redirects To |
|----------|--------------|
| `/investments/epf-ppf` | `/investments/epf` |
| `/portfolio` | `/investments` |
| `/epf` | `/investments/epf` |
| `/ppf` | `/investments/ppf` |
| `/nps` | `/investments/nps` |
| `/stocks` | `/investments/stocks` |
| `/mutual-funds` | `/investments/mutual-funds` |

---

## Architecture

### Component Structure

```
src/
├── pages/dashboard/investments/
│   ├── index.vue                    # Portfolio landing page
│   ├── stocks.vue                   # Stocks container (tabs)
│   ├── mutual-funds.vue             # Mutual Funds container (tabs)
│   ├── epf.vue                      # EPF container (tabs) - NEW
│   ├── ppf.vue                      # PPF container (tabs) - NEW
│   ├── nps.vue                      # NPS container (tabs)
│   ├── esop.vue                     # ESOP container (tabs)
│   ├── property.vue                 # Property container (tabs)
│   └── reports.vue                  # Reports page
│
├── components/investments/
│   ├── tabs/                        # Tab content components
│   │   ├── StocksOverviewTab.vue
│   │   ├── StocksDetailsTab.vue
│   │   ├── MutualFundsOverviewTab.vue
│   │   ├── MutualFundsDetailsTab.vue
│   │   ├── EPFOverviewTab.vue
│   │   ├── EPFDetailsTab.vue
│   │   ├── PPFOverviewTab.vue
│   │   ├── PPFDetailsTab.vue
│   │   ├── NPSOverviewTab.vue
│   │   ├── NPSDetailsTab.vue
│   │   ├── ESOPOverviewTab.vue
│   │   ├── ESOPDetailsTab.vue
│   │   ├── PropertyOverviewTab.vue
│   │   └── PropertyDetailsTab.vue
│   │
│   └── shared/                      # Shared components
│       ├── InvestmentMonthlyGrid.vue
│       ├── InvestmentDataTable.vue
│       └── InvestmentCopyDataDialog.vue  # Copy/Import dialog (NEW)
│
├── components/shared/               # Cross-section shared components
│   ├── DataCompletionGrid.vue       # Month completion indicator (NEW)
│   └── EditableGridCell.vue         # Inline editable cell (NEW)
```

### Tab Pattern

Each investment type page follows this pattern:

```vue
<script setup lang="ts">
import { ref } from "vue";
import SectionHeader from "@/components/shared/SectionHeader.vue";
import FinancialYearSelector from "@/components/shared/FinancialYearSelector.vue";
import XXXOverviewTab from "@/components/investments/tabs/XXXOverviewTab.vue";
import XXXDetailsTab from "@/components/investments/tabs/XXXDetailsTab.vue";
import { useFinancialYear } from "@/composables/useSalary";

const tabs = [
  { title: "Portfolio", route: "/investments" },
  { title: "Stocks", route: "/investments/stocks" },
  { title: "Mutual Funds", route: "/investments/mutual-funds" },
  { title: "EPF", route: "/investments/epf" },
  { title: "PPF", route: "/investments/ppf" },
  { title: "NPS", route: "/investments/nps" },
  { title: "ESOPs", route: "/investments/esop" },
  { title: "Property", route: "/investments/property" },
  { title: "Reports", route: "/investments/reports" },
];

const activeTab = ref("overview");
const { selectedFinancialYear } = useFinancialYear();
</script>

<template>
  <div>
    <SectionHeader title="Investments" subtitle="XXX" icon="mdi-chart-line" :tabs="tabs" />

    <div class="d-flex justify-space-between align-center mb-4">
      <v-tabs v-model="activeTab" color="primary" density="compact">
        <v-tab value="overview">Overview</v-tab>
        <v-tab value="details">Item Details</v-tab>
      </v-tabs>

      <FinancialYearSelector v-model="selectedFinancialYear" :dense="true" />
    </div>

    <v-window v-model="activeTab">
      <v-window-item value="overview">
        <XXXOverviewTab :financial-year="selectedFinancialYear" @go-to-details="activeTab = 'details'" />
      </v-window-item>
      <v-window-item value="details">
        <XXXDetailsTab :financial-year="selectedFinancialYear" @add-item="showDialog = true" />
      </v-window-item>
    </v-window>
  </div>
</template>
```

---

## Investment Types

### 1. Stocks

**Display Type**: Data Table

| Tab | Contents |
|-----|----------|
| Overview | Total value, day's gain/loss, portfolio allocation chart, top performers, sector breakdown |
| Item Details | Full stock holdings table with qty, avg price, current price, P&L, day change |

**Key Features**:
- Real-time P&L calculations
- XIRR returns calculation
- Tax implications (STCG/LTCG)
- Search and sort functionality

---

### 2. Mutual Funds

**Display Type**: Data Table

| Tab | Contents |
|-----|----------|
| Overview | Total value, category allocation, active SIPs, top performers by XIRR |
| Item Details | Full MF holdings table with NAV, units, invested amount, current value, XIRR |

**Key Features**:
- Category-wise filtering (Equity, Debt, Hybrid, ELSS)
- SIP tracking
- ELSS lock-in tracking
- Tax-free after 1 year (LTCG > ₹1.25L taxed at 12.5%)

---

### 3. EPF (Employee Provident Fund)

**Display Type**: Monthly Grid (Salary-style)

| Tab | Contents |
|-----|----------|
| Overview | Total balance, employee/employer share, 80C status, interest earned, projection chart |
| Item Details | Monthly contribution grid: Employee PF (12%), Employer PF (3.67%), EPS (8.33%), VPF |

**Key Features**:
- UAN tracking
- Monthly contribution breakdown
- Interest calculation (8.25% p.a.)
- Retirement corpus projection
- 80C deduction tracking

**EPF Rules**:
| Parameter | Value |
|-----------|-------|
| Employee Contribution | 12% of Basic + DA |
| Employer PF Contribution | 3.67% of Basic + DA |
| Employer EPS Contribution | 8.33% of Basic + DA (max ₹15,000 wage ceiling) |
| Interest Rate | 8.25% p.a. (2023-24) |
| Tax Status | EEE (Exempt-Exempt-Exempt) |

---

### 4. PPF (Public Provident Fund)

**Display Type**: Monthly Grid

| Tab | Contents |
|-----|----------|
| Overview | Current balance, maturity date, interest rate, contribution status, projection chart |
| Item Details | Monthly/yearly contribution grid, transaction history |

**Key Features**:
- 15-year lock-in tracking
- Extension tracking (5-year blocks)
- Partial withdrawal eligibility (after 7th year)
- Loan facility (year 3-6)
- Maturity projection

**PPF Rules**:
| Parameter | Value |
|-----------|-------|
| Interest Rate | 7.1% p.a. (compounded annually) |
| Min Deposit | ₹500/year |
| Max Deposit | ₹1,50,000/year |
| Tenure | 15 years |
| Tax Status | EEE (Exempt-Exempt-Exempt) |

---

### 5. NPS (National Pension System)

**Display Type**: Monthly Grid

| Tab | Contents |
|-----|----------|
| Overview | Tier 1/2 balance, asset allocation chart, 80CCD(1B) status, retirement projection |
| Item Details | Monthly contribution grid: Tier I Employee, Tier I Employer, Tier II |

**Key Features**:
- PRAN tracking
- Tier 1 and Tier 2 separation
- Asset allocation (E, C, G, A)
- Pension Fund Manager tracking
- 80CCD(1B) additional ₹50K deduction

**NPS Tax Benefits**:
| Section | Benefit |
|---------|---------|
| 80CCD(1) | Part of 80C limit (₹1.5L) |
| 80CCD(1B) | Additional ₹50,000 |
| 80CCD(2) | Employer contribution (up to 10% of Basic+DA) |

---

### 6. ESOPs & RSUs

**Display Type**: Grant Cards

| Tab | Contents |
|-----|----------|
| Overview | Total value, vested/unvested value, grant distribution chart, vesting status, tax rules |
| Item Details | Individual grant cards with vesting progress, schedule, exercise options |

**Key Features**:
- Multiple grant types (ESOP, RSU, RSA, SAR, Phantom)
- Vesting schedule tracking (Cliff, Graded, Hybrid, Milestone)
- Exercise tracking
- FMV updates
- Perquisite tax calculation
- Startup tax deferral tracking (DPIIT)

**ESOP Tax Rules (India)**:
| Event | Tax Treatment |
|-------|--------------|
| At Vesting | FMV - Exercise Price = Perquisite (Salary income) |
| At Sale (Listed STCG) | 20% if sold within 12 months |
| At Sale (Listed LTCG) | 12.5% above ₹1.25L exemption |
| At Sale (Unlisted STCG) | Slab rate if sold within 24 months |
| At Sale (Unlisted LTCG) | 12.5% (no indexation from 2024) |
| Startup Benefit | Tax deferred for 4 years or exit (DPIIT registered) |

---

### 7. Property (Real Estate)

**Display Type**: Data Table

| Tab | Contents |
|-----|----------|
| Overview | Total value, net equity, appreciation, rental yield, type breakdown chart |
| Item Details | Property table with purchase price, current value, appreciation, loan, rent |

**Key Features**:
- Property types: Residential, Commercial, Land, Other
- Loan tracking
- Rental income tracking
- Appreciation calculation
- Net equity calculation

**Property Tax Benefits**:
| Section | Benefit |
|---------|---------|
| Section 24(b) | Home loan interest up to ₹2L for self-occupied |
| Section 80C | Home loan principal up to ₹1.5L (within overall limit) |
| Capital Gains | LTCG after 2 years: 20% with indexation, Exemption under 54/54F |

---

## Shared Components

### InvestmentMonthlyGrid

A reusable grid component for displaying monthly financial data (used by EPF, PPF, NPS).

**Props**:
```typescript
interface GridSection {
  title: string;
  icon: string;
  iconColor: string;
  rows: GridRow[];
}

interface GridRow {
  code: string;
  label: string;
  type: "currency" | "number" | "text";
  values: (number | null)[];
  total: number;
  editable?: boolean;
  isSummary?: boolean;
  color?: "success" | "error" | "info" | "warning" | "primary";
}

defineProps<{
  financialYear: string;
  sections: GridSection[];
  loading?: boolean;
  readonly?: boolean;
  showTotalColumn?: boolean;
  showFYTotalColumn?: boolean;
}>();
```

**Events**:
```typescript
defineEmits<{
  (e: "update", payload: { code: string; monthIndex: number; value: number }): void;
  (e: "edit-mode-change", isEditing: boolean): void;
}>();
```

### InvestmentDataTable

A reusable data table component for displaying investment holdings (used by Stocks, MF, Property).

### DataCompletionGrid (NEW - v2.1)

A shared component showing 12-month FY data completion status (used by EPF, PPF, NPS Overview tabs).

**Props**:
```typescript
interface Props {
  completion: boolean[];      // 12-element array for each FY month
  title?: string;            // Default: "Data Completion"
  icon?: string;             // Default: "mdi-calendar-check"
  showProgress?: boolean;    // Default: true
  iconSize?: number | string; // Default: "small"
}
```

**Features**:
- Visual month-by-month completion indicators (checkmarks)
- Progress bar with percentage
- Color-coded chip showing "X/12 months"
- Follows SalaryOverviewTab data completion pattern

### InvestmentCopyDataDialog (NEW - v2.1)

A dialog component for bulk copy/import operations (used by EPF, PPF, NPS Details tabs).

**Props**:
```typescript
interface Props {
  modelValue: boolean;           // v-model for dialog visibility
  mode: InvestmentCopyMode;      // 'copy-to-remaining' | 'copy-from-prev' | 'import-prev-fy' | 'clear'
  financialYear: string;
  investmentType: 'EPF' | 'PPF' | 'NPS';
  loading?: boolean;
}
```

**Features**:
- Four copy modes with different behaviors
- Month selection via chip group
- Contribution type checkboxes (employee, employer, VPF, interest)
- Preview text showing what will happen
- Loading state during async operations

**Copy Modes**:
| Mode | Description |
|------|-------------|
| `copy-to-remaining` | Apply last entered month's values to all empty months |
| `copy-from-prev` | Copy values from the previous month |
| `import-prev-fy` | Import data from previous financial year |
| `clear` | Clear data for selected months |

### EditableGridCell (NEW - v2.1)

A reusable inline-editable cell component following AG Grid patterns.

**Props**:
```typescript
interface Props {
  modelValue: number | string | null;
  type?: 'number' | 'text' | 'currency';  // Default: 'currency'
  editable?: boolean;
  placeholder?: string;
  min?: number;
  max?: number;
  formatFn?: (value: any) => string;
}
```

**Features**:
- v-model support for two-way binding
- `markAsPending` pattern for async save feedback
- Multiple input types (currency, number, text)
- Exposed focus method for programmatic control

---

## Data Fetching

All investment data is fetched using Vue Query composables from `src/composables/useInvestments.ts`:

```typescript
// Stocks
const { data: stocks, isLoading } = useStocks();
const createStock = useCreateStock();
const updateStock = useUpdateStock();
const deleteStock = useDeleteStock();

// Mutual Funds
const { data: mutualFunds, isLoading } = useMutualFunds();
const createMutualFund = useCreateMutualFund();

// EPF
const { data: epfData, isLoading } = useEPF();

// PPF
const { data: ppfData, isLoading } = usePPF();

// NPS
const { data: npsData, isLoading } = useNPS();

// ESOPs
const { data: esopData, isLoading } = useESOPGrants();
const { data: summary } = useESOPSummary();
const createGrant = useCreateESOPGrant();
const exerciseGrant = useExerciseESOPGrant();

// Properties
const { data: properties, isLoading } = useProperties();
const createInvestment = useCreateInvestment();
const updateInvestment = useUpdateInvestment();
const deleteInvestment = useDeleteInvestment();
```

---

## Formatting Utilities

```typescript
// Currency formatting
formatINR(150000)           // "₹1,50,000"
formatINRCompact(10000000)  // "1.00 Cr"
formatINRCompact(500000)    // "5.00 L"

// Percentage formatting
formatPercentage(15.5)      // "+15.50%"
formatPercentage(-5.2)      // "-5.20%"
```

---

## Router Configuration

```typescript
// src/router/index.ts

// Investments section - top-level route (not under /dashboard)
{
  path: "/investments",
  component: () => import("@/layouts/DashboardLayout.vue"),
  meta: { requiresAuth: true },
  children: [
    { path: "", name: "investments", component: () => import("@/pages/dashboard/investments/index.vue") },
    { path: "stocks", name: "investments-stocks", component: () => import("@/pages/dashboard/investments/stocks.vue") },
    { path: "mutual-funds", name: "investments-mutual-funds", component: () => import("@/pages/dashboard/investments/mutual-funds.vue") },
    { path: "epf", name: "investments-epf", component: () => import("@/pages/dashboard/investments/epf.vue") },
    { path: "ppf", name: "investments-ppf", component: () => import("@/pages/dashboard/investments/ppf.vue") },
    { path: "nps", name: "investments-nps", component: () => import("@/pages/dashboard/investments/nps.vue") },
    { path: "esop", name: "investments-esop", component: () => import("@/pages/dashboard/investments/esop.vue") },
    { path: "property", name: "investments-property", component: () => import("@/pages/dashboard/investments/property.vue") },
    { path: "reports", name: "investments-reports", component: () => import("@/pages/dashboard/investments/reports.vue") },
  ],
},

// Legacy redirect
{
  path: "/investments/epf-ppf",
  redirect: "/investments/epf",
},
```

---

## Mock Data

Each component includes mock data for demonstration when API returns empty. The mock data follows the same structure as the API response and is used as a fallback:

```typescript
const propertiesList = computed(() => {
  if (properties.value && properties.value.length > 0) {
    return properties.value;
  }
  return mockProperties;
});
```

---

## Key Implementation Decisions

| Decision | Implementation |
|----------|---------------|
| URL Structure | `/investments/*` (top-level, not under `/dashboard`) |
| Sidebar Navigation | EPF and PPF shown as separate items |
| Tab Pattern | Client-side `v-tabs` + `v-window` (no URL change) |
| EPF/PPF Split | Separate pages - EPF includes VPF, PPF is independent |
| Monthly Grid | EPF, PPF, NPS use InvestmentMonthlyGrid |
| Data Tables | Stocks, MF, Property use v-data-table |
| ESOP Display | Grant cards with expansion panels |
| FY Selector | Shared FinancialYearSelector component |
| Mock Data | Fallback when API returns empty |

---

## Files Created/Modified

### New Files (14 tab components + 5 shared)

| File | Purpose |
|------|---------|
| `EPFOverviewTab.vue` | EPF summary, 80C status, charts, DataCompletionGrid |
| `EPFDetailsTab.vue` | Monthly contribution grid, CopyDataDialog |
| `PPFOverviewTab.vue` | PPF balance, maturity, projection, DataCompletionGrid |
| `PPFDetailsTab.vue` | Yearly contribution grid, CopyDataDialog |
| `NPSOverviewTab.vue` | Tier 1/2 balances, allocation, DataCompletionGrid |
| `NPSDetailsTab.vue` | Monthly contribution grid, CopyDataDialog |
| `StocksOverviewTab.vue` | Portfolio summary, top performers |
| `StocksDetailsTab.vue` | Holdings data table |
| `MutualFundsOverviewTab.vue` | Category allocation, SIPs |
| `MutualFundsDetailsTab.vue` | Holdings data table |
| `PropertyOverviewTab.vue` | Portfolio value, rental yield |
| `PropertyDetailsTab.vue` | Properties data table |
| `ESOPOverviewTab.vue` | Grants summary, vesting status |
| `ESOPDetailsTab.vue` | Individual grant cards |
| `InvestmentMonthlyGrid.vue` | Shared monthly grid component |
| `InvestmentDataTable.vue` | Shared data table component |
| `InvestmentCopyDataDialog.vue` | Copy/Import dialog (v2.1) |
| `DataCompletionGrid.vue` | Month completion indicator (v2.1) |
| `EditableGridCell.vue` | Inline editable cell (v2.1) |

### New Page Files

| File | Purpose |
|------|---------|
| `epf.vue` | EPF container page with tabs |
| `ppf.vue` | PPF container page with tabs |

### Modified Files

| File | Changes |
|------|---------|
| `stocks.vue` | Added two-tab pattern |
| `mutual-funds.vue` | Added two-tab pattern |
| `nps.vue` | Added two-tab pattern |
| `esop.vue` | Added two-tab pattern |
| `property.vue` | Added two-tab pattern |
| `router/index.ts` | Added EPF/PPF routes, redirect |

### Deleted Files

| File | Reason |
|------|--------|
| `epf-ppf.vue` | Replaced by separate epf.vue and ppf.vue |

---

## Testing

### E2E Test Files

```
e2e/tests/investments/
├── 01-navigation.spec.ts      # Tab navigation tests
├── 05-epf.spec.ts             # EPF page tests (includes DataCompletionGrid, CopyDialog tests)
├── 05-ppf.spec.ts             # PPF page tests (includes DataCompletionGrid, CopyDialog tests)
├── 06-nps.spec.ts             # NPS page tests
├── 03-stocks.spec.ts          # Stocks page tests
├── 04-mutual-funds.spec.ts    # Mutual Funds page tests
├── 07-property.spec.ts        # Property page tests
├── 08-esop.spec.ts            # ESOP page tests
└── 08-reports.spec.ts         # Reports page tests

e2e/pages/investments/
├── epf.page.ts                # EPF page object (includes DataCompletionGrid, CopyDialog locators)
├── ppf.page.ts                # PPF page object (includes DataCompletionGrid, CopyDialog locators)
├── nps.page.ts                # NPS page object
└── ...
```

### Test Scenarios

1. **Navigation**: Click Overview/Item Details tabs - should switch without URL change
2. **FY Selector**: Change financial year - data should refresh
3. **Router Redirect**: Navigate to `/investments/epf-ppf` - should redirect to `/investments/epf`
4. **Section Navigation**: Click section tabs (Portfolio, Stocks, etc.) - should navigate correctly
5. **Data Display**: Verify Overview shows summary, Item Details shows editable grid/table
6. **Responsive**: Test on mobile viewport - tabs should be scrollable
7. **DataCompletionGrid (v2.1)**: Verify grid shows on Overview tabs, displays X/12 months chip
8. **CopyDataDialog (v2.1)**: Test Copy menu button, dialog opening, mode selection, dialog close

---

## Performance Considerations

1. **Lazy Loading**: Tab content only renders when tab is active (v-window default behavior)
2. **Mock Data Fallback**: Prevents UI crashes when API is unavailable
3. **Vue Query Caching**: Data is cached and only refetched when invalidated
4. **Computed Properties**: Heavy calculations use computed for reactivity efficiency

---

## Future Enhancements

1. **API Integration**: Connect to backend CRUD endpoints for all investment types
2. **Import Features**: CAS import for mutual funds, broker sync for stocks
3. **Real-time Updates**: WebSocket integration for live stock prices
4. **Reports**: PDF/Excel export functionality
5. **Family View**: Multi-member investment aggregation

---

## Related Documents

- [Salary-Section-Plan.md](./Salary-Section-Plan.md) - Reference for two-tab pattern
- [STYLING-GUIDE.md](./STYLING-GUIDE.md) - UI patterns and Vuetify conventions

---

## Changelog

### v2.2 (January 11, 2026) - URL Restructure & Sidebar Fix

**URL Changes**:
- Moved investments routes from `/dashboard/investments/*` to `/investments/*`
- Investments is now a top-level route (sibling to `/dashboard`, not a child)
- All legacy URLs redirect to new paths

**Sidebar Navigation**:
- Split "EPF & PPF" into separate "EPF" and "PPF" menu items
- EPF page includes VPF tracking (EPF + VPF on same page)
- PPF is now a fully separate menu item

**Updated Files**:
- `src/router/index.ts` - New `/investments` top-level route
- `src/layouts/DashboardLayout.vue` - Sidebar navigation updated
- All 9 investment page files - Updated tabs arrays
- All E2E page objects and test specs - Updated URLs

### v2.1 (January 11, 2026) - Salary ↔ Investments Alignment

**New Shared Components**:
- `DataCompletionGrid.vue` - 12-month FY completion indicator (matches Salary pattern)
- `EditableGridCell.vue` - Reusable inline-editable cell component
- `InvestmentCopyDataDialog.vue` - Bulk copy/import dialog for monthly data

**Updated Components**:
- `EPFOverviewTab.vue` - Added DataCompletionGrid
- `PPFOverviewTab.vue` - Added DataCompletionGrid
- `NPSOverviewTab.vue` - Added DataCompletionGrid
- `EPFDetailsTab.vue` - Added Copy menu and dialog integration
- `PPFDetailsTab.vue` - Added Copy menu and dialog integration
- `NPSDetailsTab.vue` - Added Copy menu and dialog integration
- `InvestmentMonthlyGrid.vue` - Updated styling for consistency with SalaryMonthlyGrid

**Updated E2E Tests**:
- `epf.page.ts` - Added DataCompletionGrid and CopyDialog locators
- `ppf.page.ts` - Added DataCompletionGrid and CopyDialog locators
- `05-epf.spec.ts` - Added DataCompletionGrid and CopyDialog test suites
- `05-ppf.spec.ts` - Added DataCompletionGrid and CopyDialog test suites

### v2.0 (January 10, 2026) - Two-Tab Pattern Implementation

- Restructured all investment pages to follow Overview + Item Details pattern
- Split EPF-PPF combined page into separate EPF and PPF pages
- Added legacy redirect for `/epf-ppf` → `/epf`
