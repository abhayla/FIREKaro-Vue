# Expenses Section Plan

> **Status**: Ready for Implementation
> **Created**: January 7, 2026
> **Based on**: docs/Plans/Feature-Reorganization-Plan.md (Section 4: EXPENSES)
> **Estimated Effort**: ~7.5 days (enhancement-focused, not greenfield)
> **Approved**: January 7, 2026

---

## Executive Summary

The Expenses section is **70% complete** with solid infrastructure. This plan focuses on:
1. **Real AI Integration** - Connect Grok API to existing mock endpoints
2. **Alert Delivery System** - Email/push notifications for budget alerts
3. **Export Functionality** - PDF/Excel report generation
4. **Category Rules Engine** - Smart auto-categorization rules
5. **Reports Tab** - Unified reporting interface

---

## Current State Analysis

### Already Implemented (Keep As-Is)

| Feature | Status | Location |
|---------|--------|----------|
| Expense CRUD | ✅ Complete | `/api/expenses/*`, 13 fields |
| Budget 50/30/20 | ✅ Complete | `/api/budgets/*`, full framework |
| CSV Import | ✅ Complete | `CSVImporter.tsx`, parser + validation |
| Analytics Dashboard | ✅ Complete | `ExpenseAnalytics.tsx`, Chart.js |
| Data Completeness | ✅ Complete | Coverage scoring + recommendations |
| Onboarding Wizard | ✅ Complete | Setup flow for new users |
| 17 UI Components | ✅ Complete | Full component library |

### Needs Enhancement

| Feature | Current State | Target State |
|---------|---------------|--------------|
| AI Categorization | Rule-based mock | Real Grok API integration |
| AI Insights | Mock data (6 types) | Real spending analysis |
| Receipt OCR | Endpoint only | Grok Vision processing |
| Budget Alerts | Generated, not delivered | Email + in-app notifications |
| Export | Button exists | PDF/Excel generation |
| Recurring Expenses | Schema only | Auto-generation service |

### New Features to Add

1. **Category Rules Engine** - Custom rules for auto-categorization
2. **Reports Tab** - Unified reporting with export options
3. **Spending Goals** - Goal tracking for expense reduction
4. **Alert Preferences** - User notification settings

---

## Target Tab Structure (5 Tabs)

```
EXPENSES PAGE
├── Tab 1: Track Expenses (EXISTING - Minor Enhancement)
├── Tab 2: Budget Planning (EXISTING - Add Alerts UI)
├── Tab 3: Categories & Rules (NEW)
├── Tab 4: Analysis (EXISTING - Enhance with Real AI)
└── Tab 5: Reports (NEW)
```

---

## Phase 1: Real AI Integration (Days 1-3)

### 1.1 Grok API Connection

The infrastructure exists - need to connect real API calls.

**Files to Modify:**

```
src/services/ai/grok-client.ts          # Already exists - verify API key usage
src/services/ai/smart-categorization.ts  # Replace mock with real Grok calls
src/services/ai/receipt-ocr.ts           # Add Grok Vision API
src/services/ai/predictive-analytics.ts  # Connect real analysis
```

**Smart Categorization Enhancement:**

```typescript
// src/services/ai/smart-categorization.ts
// Current: Rule-based with keyword matching
// Target: Grok API with fallback to rules

export async function categorizeWithGrok(expense: ExpenseInput): Promise<CategoryResult> {
  const prompt = buildCategorizationPrompt(expense);

  try {
    const response = await grokClient.chat({
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
      max_tokens: 200,
    });

    return parseCategorizationResponse(response);
  } catch (error) {
    // Fallback to rule-based
    return categorizeByRules(expense);
  }
}
```

**Receipt OCR with Grok Vision:**

```typescript
// src/services/ai/receipt-ocr.ts
export async function processReceiptWithGrok(imageBase64: string): Promise<ReceiptData> {
  const response = await grokClient.vision({
    image: imageBase64,
    prompt: `Extract from this receipt:
      - Merchant name
      - Total amount
      - Date
      - Line items (if visible)
      - Payment method (if visible)
      Return as JSON.`,
  });

  return parseReceiptResponse(response);
}
```

### 1.2 Real Insights Generation

**Current Mock Insights (6 types):**
1. Spending trend
2. Category anomaly
3. Budget warning
4. Savings opportunity
5. Recurring pattern
6. Optimization tip

**Enhancement - Real Analysis:**

```typescript
// src/services/ai/insights-generator.ts (NEW)
export async function generateRealInsights(userId: string, month: number, year: number): Promise<Insight[]> {
  // 1. Fetch user's expense data
  const expenses = await prisma.expense.findMany({
    where: { userId, month, year },
  });

  // 2. Fetch historical data for comparison
  const historicalData = await getHistoricalExpenses(userId, 6); // Last 6 months

  // 3. Calculate actual metrics
  const metrics = {
    monthOverMonthChange: calculateMoMChange(expenses, historicalData),
    categoryBreakdown: groupByCategory(expenses),
    anomalies: detectAnomalies(expenses, historicalData),
    patterns: detectPatterns(expenses),
  };

  // 4. Generate insights with Grok
  const prompt = buildInsightsPrompt(metrics);
  const aiInsights = await grokClient.chat({ messages: [{ role: 'user', content: prompt }] });

  return parseInsights(aiInsights, metrics);
}
```

### 1.3 API Route Updates

**Modify existing routes to use real AI:**

```
src/app/api/expenses/ai/categorize/route.ts      # Use categorizeWithGrok()
src/app/api/expenses/ai/batch-categorize/route.ts # Batch with rate limiting
src/app/api/expenses/ai/insights/route.ts         # Use generateRealInsights()
src/app/api/expenses/ai/process-receipt/route.ts  # Use processReceiptWithGrok()
```

---

## Phase 2: In-App Alert System (Day 4)

> **Note**: Simplified from email+push to in-app only per user approval.

### 2.1 New Prisma Models

```prisma
// Add to prisma/schema.prisma

model AlertPreference {
  id                String   @id @default(cuid())
  userId            String   @unique
  budgetAlerts      Boolean  @default(true)
  overspendAlerts   Boolean  @default(true)
  alertThreshold    Int      @default(80) // Percentage trigger
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
  user              User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model AlertDelivery {
  id              String   @id @default(cuid())
  userId          String
  alertType       String   // BUDGET_WARNING, OVERSPEND
  category        String   // needs, wants, savings
  percentage      Float
  message         String
  isRead          Boolean  @default(false)
  createdAt       DateTime @default(now())
  user            User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  @@index([userId, isRead])
}
```

### 2.2 Alert Service

```typescript
// src/services/alerts/BudgetAlertService.ts (NEW)

export class BudgetAlertService {
  async checkAndCreateAlerts(userId: string): Promise<void> {
    const prefs = await prisma.alertPreference.findUnique({ where: { userId } });
    if (!prefs?.budgetAlerts) return;

    const budget = await this.getCurrentBudget(userId);
    const alerts = this.generateAlerts(budget, prefs.alertThreshold);

    for (const alert of alerts) {
      // Check if alert already exists for this period
      const existing = await this.findExistingAlert(userId, alert);
      if (!existing) {
        await prisma.alertDelivery.create({
          data: { userId, ...alert }
        });
      }
    }
  }

  private generateAlerts(budget: Budget, threshold: number): Alert[] {
    const alerts: Alert[] = [];
    const categories = ['needs', 'wants', 'savings'];

    for (const cat of categories) {
      const percentage = (budget[`actual${cat}`] / budget[`${cat}Limit`]) * 100;
      if (percentage >= threshold) {
        alerts.push({
          alertType: percentage >= 100 ? 'OVERSPEND' : 'BUDGET_WARNING',
          category: cat,
          percentage,
          message: this.buildAlertMessage(cat, percentage),
        });
      }
    }
    return alerts;
  }
}
```

### 2.3 API Routes

```
src/app/api/alerts/preferences/route.ts     # GET/PUT alert preferences
src/app/api/alerts/budget/route.ts          # GET unread alerts
src/app/api/alerts/[id]/read/route.ts       # POST mark as read
src/app/api/alerts/read-all/route.ts        # POST mark all as read
```

### 2.4 UI Components

```
src/components/expense-tracker/
  AlertPreferencesModal.tsx                 # Settings modal (simplified)
  BudgetAlertBanner.tsx                     # In-app alert display
  AlertNotificationBell.tsx                 # Header notification bell with count
```

### 2.5 Header Integration

```
┌─────────────────────────────────────────────────────────────┐
│ FIREKaro    [Family: Individual ▼]   🔔(3)   [👤 Profile]   │
└─────────────────────────────────────────────────────────────┘
                                        ↑
                               Click to show alert dropdown
```

---

## Phase 3: Category Rules Engine (Day 5)

### 3.1 New Prisma Model

```prisma
model ExpenseCategoryRule {
  id              String   @id @default(cuid())
  userId          String
  name            String
  isActive        Boolean  @default(true)
  priority        Int      @default(0) // Higher = checked first

  // Matching conditions (JSON for flexibility)
  conditions      Json     // { merchant: "contains", amount: "greaterThan", etc. }

  // Actions
  targetCategory  String
  targetSubcategory String?
  applyTags       String[] @default([])

  // Stats
  timesApplied    Int      @default(0)
  lastAppliedAt   DateTime?

  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  user            User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId, isActive])
}
```

### 3.2 Rules Engine Service

```typescript
// src/services/expense/RulesEngine.ts (NEW)

interface RuleCondition {
  field: 'merchant' | 'description' | 'amount' | 'paymentMethod';
  operator: 'equals' | 'contains' | 'startsWith' | 'greaterThan' | 'lessThan' | 'between';
  value: string | number | [number, number];
}

export class ExpenseRulesEngine {
  async applyRules(expense: ExpenseInput, userId: string): Promise<ExpenseInput> {
    const rules = await prisma.expenseCategoryRule.findMany({
      where: { userId, isActive: true },
      orderBy: { priority: 'desc' },
    });

    for (const rule of rules) {
      if (this.matchesConditions(expense, rule.conditions as RuleCondition[])) {
        // Apply rule actions
        expense.category = rule.targetCategory;
        if (rule.targetSubcategory) {
          expense.subcategory = rule.targetSubcategory;
        }
        if (rule.applyTags.length > 0) {
          expense.tags = [...(expense.tags || []), ...rule.applyTags];
        }

        // Update stats
        await this.incrementRuleUsage(rule.id);
        break; // First matching rule wins
      }
    }

    return expense;
  }

  private matchesConditions(expense: ExpenseInput, conditions: RuleCondition[]): boolean {
    return conditions.every(cond => this.evaluateCondition(expense, cond));
  }

  private evaluateCondition(expense: ExpenseInput, cond: RuleCondition): boolean {
    const value = expense[cond.field];
    switch (cond.operator) {
      case 'equals': return value === cond.value;
      case 'contains': return String(value).toLowerCase().includes(String(cond.value).toLowerCase());
      case 'startsWith': return String(value).toLowerCase().startsWith(String(cond.value).toLowerCase());
      case 'greaterThan': return Number(value) > Number(cond.value);
      case 'lessThan': return Number(value) < Number(cond.value);
      case 'between': return Number(value) >= cond.value[0] && Number(value) <= cond.value[1];
      default: return false;
    }
  }
}
```

### 3.3 Categories & Rules Tab UI

```
+----------------------------------------------------------------+
| CATEGORIES & RULES                                              |
+----------------------------------------------------------------+
| [Your Categories]                          [+ Add Category]     |
| +------------------+ +------------------+ +------------------+  |
| | Food & Dining    | | Transportation   | | Shopping         |  |
| | Icon: 🍽️         | | Icon: 🚗         | | Icon: 🛍️         |  |
| | 15 expenses      | | 8 expenses       | | 12 expenses      |  |
| | [Edit] [Rules]   | | [Edit] [Rules]   | | [Edit] [Rules]   |  |
| +------------------+ +------------------+ +------------------+  |
+----------------------------------------------------------------+
| [Auto-Categorization Rules]                    [+ Create Rule]  |
| Priority | Rule Name        | Condition           | Category    |
| 1        | Swiggy Orders    | Merchant = "Swiggy" | Food        |
| 2        | Uber Rides       | Merchant ~ "Uber"   | Transport   |
| 3        | Amazon Shopping  | Merchant ~ "Amazon" | Shopping    |
| [Edit] [Delete] [Toggle]                                        |
+----------------------------------------------------------------+
| [Suggested Rules] (Based on your spending patterns)             |
| "Create rule for 'Zomato' → Food & Dining?" [Accept] [Dismiss] |
+----------------------------------------------------------------+
```

### 3.4 API Routes

```
src/app/api/expense-rules/
  route.ts                    # GET/POST rules
  [id]/route.ts               # PUT/DELETE rule
  suggestions/route.ts        # GET AI-suggested rules
  test/route.ts               # POST test rule against sample data
```

### 3.5 UI Components

```
src/components/expense-tracker/
  CategoriesRulesTab.tsx      # Main tab component
  CategoryCard.tsx            # Category display/edit
  RuleEditor.tsx              # Create/edit rule modal
  RuleConditionBuilder.tsx    # Visual condition builder
  RuleSuggestions.tsx         # AI-suggested rules
```

---

## Phase 4: Reports Tab (Days 5-6)

### 4.1 UI Wireframe

```
+----------------------------------------------------------------+
| EXPENSE REPORTS                                                 |
+----------------------------------------------------------------+
| [Report Type]                                                   |
| [Monthly Summary] [Category Analysis] [Trends] [Budget vs Actual]|
+----------------------------------------------------------------+
| [View Mode]  [Monthly ▼]  [Quarterly]  [Yearly]  [Custom Range] |
+----------------------------------------------------------------+
| MONTHLY VIEW:                                                   |
| ◀ Previous │  [January 2024 ▼]  │ Next ▶    [Generate Report]  |
+----------------------------------------------------------------+
| CUSTOM RANGE VIEW:                                              |
| From: [Apr 2024 ▼]  To: [Sep 2024 ▼]         [Generate Report] |
+----------------------------------------------------------------+
| [Report Preview]                                                |
| +----------------------------------------------------------+   |
| | EXPENSE SUMMARY - January 2024                           |   |
| | Total Spent: ₹45,230                                     |   |
| | Categories: 8 | Transactions: 47                         |   |
| |                                                          |   |
| | [Pie Chart: Category Distribution]                       |   |
| |                                                          |   |
| | Top Categories:                                          |   |
| | 1. Food & Dining    ₹12,450 (27%)                       |   |
| | 2. Transportation   ₹8,200 (18%)                        |   |
| | 3. Utilities        ₹6,500 (14%)                        |   |
| +----------------------------------------------------------+   |
+----------------------------------------------------------------+
| [Export Options]                                                |
| [Download PDF] [Download Excel] [Download CSV] [Share Report]   |
+----------------------------------------------------------------+
```

### 4.2 Report Generation Service

```typescript
// src/services/reports/ExpenseReportService.ts (NEW)

export class ExpenseReportService {
  async generateMonthlySummary(userId: string, month: number, year: number): Promise<ReportData> {
    const expenses = await prisma.expense.findMany({
      where: { userId, month, year },
    });

    const budget = await prisma.budget.findUnique({
      where: { userId_month_year: { userId, month, year } },
    });

    return {
      summary: {
        totalSpent: expenses.reduce((sum, e) => sum + e.amount, 0),
        transactionCount: expenses.length,
        categoriesUsed: new Set(expenses.map(e => e.category)).size,
        averageTransaction: expenses.length > 0
          ? expenses.reduce((sum, e) => sum + e.amount, 0) / expenses.length
          : 0,
      },
      categoryBreakdown: this.groupByCategory(expenses),
      dailySpending: this.groupByDate(expenses),
      budgetComparison: budget ? this.compareToBudget(expenses, budget) : null,
      topMerchants: this.getTopMerchants(expenses, 5),
      paymentMethodBreakdown: this.groupByPaymentMethod(expenses),
    };
  }

  async generatePDF(reportData: ReportData): Promise<Buffer> {
    // Use @react-pdf/renderer or jspdf
    const doc = new jsPDF();
    // ... build PDF
    return doc.output('arraybuffer');
  }

  async generateExcel(reportData: ReportData): Promise<Buffer> {
    // Use xlsx library
    const workbook = XLSX.utils.book_new();
    // ... build Excel
    return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
  }
}
```

### 4.3 API Routes

```
src/app/api/expenses/reports/
  route.ts                    # GET report data
  monthly-summary/route.ts    # GET monthly summary
  category-analysis/route.ts  # GET category breakdown
  trends/route.ts             # GET spending trends
  export/route.ts             # POST generate PDF/Excel
  share/route.ts              # POST generate shareable link
```

### 4.4 UI Components

```
src/components/expense-tracker/
  ExpenseReportsTab.tsx       # Main reports tab
  ReportTypeSelector.tsx      # Report type tabs
  DateRangePicker.tsx         # Date range selection
  ReportPreview.tsx           # Report visualization
  ExportOptions.tsx           # Download buttons
  MonthlySummaryReport.tsx    # Monthly report template
  CategoryAnalysisReport.tsx  # Category report template
  TrendsReport.tsx            # Trends report template
```

---

## Phase 5: Integration & Testing (Day 8)

### 5.1 Main Page Update

Modify `src/app/dashboard/expenses/page.tsx`:
- Update tab structure (5 tabs)
- Add notification bell for alerts
- Integrate new components

### 5.2 Tests to Create

```
tests/e2e/expense-ai-categorization.spec.ts  # AI features E2E
tests/e2e/expense-rules.spec.ts              # Rules engine E2E
tests/e2e/expense-reports.spec.ts            # Reports E2E
tests/e2e/expense-alerts.spec.ts             # Alerts E2E
src/services/ai/__tests__/real-categorization.test.ts  # Unit tests
src/services/expense/__tests__/RulesEngine.test.ts     # Unit tests
src/services/reports/__tests__/ExpenseReportService.test.ts
```

### 5.3 Background Jobs

Add Bull queue jobs for:
- Alert checking (hourly)
- Weekly digest emails
- Recurring expense generation

```typescript
// src/jobs/expense-jobs.ts
export const expenseJobs = {
  checkBudgetAlerts: {
    name: 'check-budget-alerts',
    cron: '0 * * * *', // Every hour
    handler: async () => {
      const users = await getUsersWithAlertPrefs();
      for (const user of users) {
        await budgetAlertService.checkAndSendAlerts(user.id);
      }
    },
  },

  weeklyDigest: {
    name: 'weekly-expense-digest',
    cron: '0 9 * * 1', // Monday 9 AM
    handler: async () => {
      const users = await getUsersWithWeeklyDigest();
      for (const user of users) {
        await sendWeeklyDigest(user.id);
      }
    },
  },

  generateRecurringExpenses: {
    name: 'generate-recurring-expenses',
    cron: '0 0 1 * *', // 1st of every month
    handler: async () => {
      await recurringExpenseService.generateMonthlyExpenses();
    },
  },
};
```

---

## Implementation Order Summary

| Phase | Feature | Days | Priority |
|-------|---------|------|----------|
| 1 | Real AI Integration (Grok) | 3 | P0 |
| 2 | In-App Alert System | 1 | P1 |
| 3 | Category Rules Engine | 1 | P1 |
| 4 | Reports Tab (with date nav) | 1.5 | P1 |
| 5 | Integration & Testing | 1 | P0 |
| **Total** | | **7.5 days** | |

### User Decisions Made

| Decision | Choice |
|----------|--------|
| Alert Delivery | **In-app only** - No email/push notifications |
| Date Selection | **Month dropdown + Prev/Next** - For all report views |
| CSV Import | **Move to Track tab** - As button/modal, not separate tab |

---

## New Files Summary

### Prisma Models (3 new)
- `AlertPreference` - User alert settings (threshold, enabled flags)
- `AlertDelivery` - In-app alert records
- `ExpenseCategoryRule` - Custom auto-categorization rules

### Services (5 new)
- `src/services/ai/insights-generator.ts` - Real insights from expense data
- `src/services/alerts/BudgetAlertService.ts` - Alert checking/creation
- `src/services/expense/RulesEngine.ts` - Rule matching logic
- `src/services/reports/ExpenseReportService.ts` - Report generation + export
- `src/jobs/expense-jobs.ts` - Background job definitions

### API Routes (13 new)
- `/api/alerts/preferences` - GET/PUT alert settings
- `/api/alerts/budget` - GET unread alerts
- `/api/alerts/[id]/read` - POST mark as read
- `/api/alerts/read-all` - POST mark all as read
- `/api/expense-rules/*` (4 routes) - CRUD + suggestions
- `/api/expenses/reports/*` (5 routes) - Report data + export

### Components (10 new)
- Alert components (3): AlertPreferencesModal, BudgetAlertBanner, AlertNotificationBell
- Rules components (4): CategoriesRulesTab, RuleEditor, RuleConditionBuilder, RuleSuggestions
- Reports components (3): ExpenseReportsTab, ReportTypeSelector, ExportOptions

### Modifications (8 files)
- `src/services/ai/smart-categorization.ts` - Add real Grok integration
- `src/services/ai/receipt-ocr.ts` - Add Grok Vision
- `src/app/api/expenses/ai/*` routes (4) - Use real AI services
- `src/app/dashboard/expenses/page.tsx` - New 5-tab structure
- `prisma/schema.prisma` - Add 3 new models

---

## Dependencies

- **Grok API Key**: Required for real AI features (`GROK_API_KEY`)
- **Email Service**: Nodemailer already configured
- **PDF Generation**: jspdf + jspdf-autotable (already installed)
- **Excel Generation**: xlsx (already installed)
- **Bull Queue**: Already configured for background jobs

---

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| Grok API rate limits | Medium | Implement caching + fallback to rules |
| Alert spam | Low | Configurable thresholds + daily limits |
| Large report generation | Medium | Pagination + async generation |

---

## Related Plan Documents

1. `docs/Plans/Feature-Reorganization-Plan.md` - Master navigation
2. `docs/Plans/Salary-Section-Plan.md` - Salary component tracking
3. `docs/Plans/Non-Salary-Income-Plan.md` - Income section plan
4. `docs/Plans/Tax-Planning-Section-Plan.md` - Tax planning
5. **`docs/Plans/Expenses-Section-Plan.md`** - This plan

---

---

**Status: ✅ APPROVED & READY FOR IMPLEMENTATION**

*Plan approved on January 7, 2026 with user-requested modifications:*
- *Simplified alerts to in-app only*
- *Added month dropdown with prev/next navigation for reports*
