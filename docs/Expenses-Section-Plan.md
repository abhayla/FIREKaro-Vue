# Expenses Section Plan

> **Status**: ✅ IMPLEMENTED
> **Created**: January 7, 2026
> **Implemented**: January 9, 2026
> **Based on**: docs/Plans/Feature-Reorganization-Plan.md (Section 4: EXPENSES)

---

## Executive Summary

The Expenses section is **fully implemented** with:
1. **Complete Backend API** - Hono routes for expenses, budgets, rules, alerts, AI
2. **Grok AI Integration** - Smart categorization and receipt OCR
3. **In-App Alert System** - Budget warnings with notification bell
4. **Category Rules Engine** - Auto-categorization with priority rules
5. **PDF/Excel Export** - Client-side report generation
6. **Receipt Scanning** - Image upload with OCR data extraction

---

## Implementation Summary

### Implemented Features

| Feature | Status | Location |
|---------|--------|----------|
| Expense CRUD API | ✅ Complete | `server/routes/expenses.ts` |
| Budget 50/30/20 API | ✅ Complete | `server/routes/budgets.ts` |
| AI Categorization | ✅ Complete | `server/routes/expenses-ai.ts`, `server/lib/grok-client.ts` |
| Receipt OCR | ✅ Complete | `server/routes/expenses-ai.ts` (process-receipt endpoint) |
| Rules Engine | ✅ Complete | `server/routes/expense-rules.ts`, `server/services/rules-engine.ts` |
| Alert System | ✅ Complete | `server/routes/alerts.ts`, `src/stores/notifications.ts` |
| PDF/Excel Export | ✅ Complete | `src/pages/dashboard/expenses/reports.vue` (client-side) |
| Categories UI | ✅ Complete | `src/pages/dashboard/expenses/categories.vue` |
| Receipt Uploader | ✅ Complete | `src/components/expenses/ReceiptUploader.vue` |
| Notification Bell | ✅ Complete | `src/components/shared/AlertNotificationBell.vue` |

---

## Tab Structure (5 Tabs - Implemented)

```
EXPENSES PAGE
├── Tab 1: Overview (/dashboard/expenses)
├── Tab 2: Track (/dashboard/expenses/track)
├── Tab 3: Budgets (/dashboard/expenses/budgets)
├── Tab 4: Reports (/dashboard/expenses/reports)
└── Tab 5: Categories (/dashboard/expenses/categories)
```

---

## Backend Implementation

### Prisma Models Added

```prisma
// prisma/schema.prisma

model Expense {
  id              String    @id @default(cuid())
  userId          String
  amount          Float
  description     String
  category        String
  subcategory     String?
  date            DateTime
  merchant        String?
  paymentMethod   PaymentMethod @default(OTHER)
  tags            String[]  @default([])
  isRecurring     Boolean   @default(false)
  receiptUrl      String?
  notes           String?
  familyMemberId  String?
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  user            User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  @@index([userId, date])
  @@index([userId, category])
}

model Budget {
  id            String   @id @default(cuid())
  userId        String
  month         Int
  year          Int
  totalIncome   Float    @default(0)
  needsLimit    Float    @default(0)
  wantsLimit    Float    @default(0)
  savingsLimit  Float    @default(0)
  needsActual   Float    @default(0)
  wantsActual   Float    @default(0)
  savingsActual Float    @default(0)
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  user          User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  @@unique([userId, month, year])
}

model ExpenseCategory {
  id           String   @id @default(cuid())
  name         String
  icon         String?
  color        String?
  budgetType   BudgetType @default(WANTS)
  subcategories String[] @default([])
  isSystem     Boolean  @default(false)
  isActive     Boolean  @default(true)
  displayOrder Int      @default(0)
  userId       String?
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
  user         User?    @relation(fields: [userId], references: [id], onDelete: Cascade)
  @@index([userId, isActive])
}

model AlertPreference {
  id              String   @id @default(cuid())
  userId          String   @unique
  budgetAlerts    Boolean  @default(true)
  overspendAlerts Boolean  @default(true)
  alertThreshold  Int      @default(80)
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  user            User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model AlertDelivery {
  id         String   @id @default(cuid())
  userId     String
  alertType  String
  category   String
  percentage Float
  message    String
  isRead     Boolean  @default(false)
  createdAt  DateTime @default(now())
  user       User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  @@index([userId, isRead])
}

model ExpenseCategoryRule {
  id                String    @id @default(cuid())
  userId            String
  name              String
  isActive          Boolean   @default(true)
  priority          Int       @default(0)
  conditions        Json
  targetCategory    String
  targetSubcategory String?
  applyTags         String[]  @default([])
  timesApplied      Int       @default(0)
  lastAppliedAt     DateTime?
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt
  user              User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  @@index([userId, isActive])
}

enum PaymentMethod {
  UPI
  CREDIT_CARD
  DEBIT_CARD
  CASH
  NET_BANKING
  WALLET
  OTHER
}

enum BudgetType {
  NEEDS
  WANTS
  SAVINGS
}
```

### API Routes Implemented

#### Expenses CRUD (`server/routes/expenses.ts`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/expenses` | List expenses with month/category filters |
| GET | `/api/expenses/:id` | Get single expense |
| POST | `/api/expenses` | Create expense (triggers budget update + alerts) |
| PUT | `/api/expenses/:id` | Update expense |
| DELETE | `/api/expenses/:id` | Delete expense |
| GET | `/api/expenses/categories` | List expense categories |

#### Budgets (`server/routes/budgets.ts`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/budgets` | List budgets by month/year |
| GET | `/api/budgets/current` | Get current month's budget |
| POST | `/api/budgets` | Create/upsert budget |
| PUT | `/api/budgets/:id` | Update budget |
| DELETE | `/api/budgets/:id` | Delete budget |

#### AI Features (`server/routes/expenses-ai.ts`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/expenses/ai/categorize` | AI categorize single expense |
| POST | `/api/expenses/ai/batch-categorize` | Batch categorization |
| POST | `/api/expenses/ai/process-receipt` | OCR receipt image |
| GET | `/api/expenses/ai/insights` | Get AI spending insights |

#### Expense Rules (`server/routes/expense-rules.ts`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/expense-rules` | List user's rules |
| POST | `/api/expense-rules` | Create rule |
| PUT | `/api/expense-rules/:id` | Update rule |
| DELETE | `/api/expense-rules/:id` | Delete rule |
| POST | `/api/expense-rules/:id/toggle` | Toggle rule active state |
| POST | `/api/expense-rules/test` | Test rule against sample expense |
| GET | `/api/expense-rules/suggestions` | Get AI-suggested rules |

#### Alerts (`server/routes/alerts.ts`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/alerts` | List alerts (with read filter) |
| GET | `/api/alerts/unread-count` | Get unread alert count |
| POST | `/api/alerts/:id/read` | Mark alert as read |
| POST | `/api/alerts/read-all` | Mark all as read |
| DELETE | `/api/alerts/:id` | Delete alert |
| GET | `/api/alerts/preferences` | Get user's alert preferences |
| PUT | `/api/alerts/preferences` | Update alert preferences |
| POST | `/api/alerts/check-budget` | Manually trigger budget alert check |

---

## Grok AI Integration

### Grok Client (`server/lib/grok-client.ts`)

```typescript
import OpenAI from 'openai'

const grokClient = new OpenAI({
  apiKey: process.env.XAI_API_KEY,
  baseURL: 'https://api.x.ai/v1',
})

export async function categorizeExpense(description: string, merchant?: string): Promise<{
  category: string
  subcategory: string | null
  confidence: number
}> {
  const response = await grokClient.chat.completions.create({
    model: 'grok-beta',
    messages: [
      {
        role: 'system',
        content: `You are an expense categorization assistant for an Indian personal finance app.
          Categories: Food & Dining, Transportation, Utilities, Housing, Healthcare, Education,
          Shopping, Entertainment, Travel, Personal, Gifts & Donations, Savings & Investments,
          EMI & Loans, Other.
          Respond with JSON: { "category": "...", "subcategory": "...", "confidence": 0.0-1.0 }`,
      },
      {
        role: 'user',
        content: `Categorize: "${description}"${merchant ? ` at ${merchant}` : ''}`,
      },
    ],
    temperature: 0.3,
    max_tokens: 100,
  })
  // Parse and return result
}

export async function processReceiptImage(base64Image: string): Promise<ReceiptData> {
  const response = await grokClient.chat.completions.create({
    model: 'grok-vision-beta',
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'image_url',
            image_url: { url: `data:image/jpeg;base64,${base64Image}` },
          },
          {
            type: 'text',
            text: `Extract from this receipt:
              - Merchant name
              - Total amount (in INR)
              - Date
              - Line items
              - Payment method
              Return as JSON.`,
          },
        ],
      },
    ],
  })
  // Parse and return result
}
```

---

## Rules Engine (`server/services/rules-engine.ts`)

```typescript
export interface RuleCondition {
  field: 'merchant' | 'description' | 'amount' | 'paymentMethod'
  operator: 'equals' | 'contains' | 'startsWith' | 'endsWith' | 'greaterThan' | 'lessThan' | 'between'
  value: string | number | [number, number]
  caseSensitive?: boolean
}

export function evaluateCondition(expense: ExpenseInput, condition: RuleCondition): boolean {
  const fieldValue = expense[condition.field]
  if (fieldValue === undefined || fieldValue === null) return false

  switch (condition.operator) {
    case 'equals':
      return String(fieldValue).toLowerCase() === String(condition.value).toLowerCase()
    case 'contains':
      return String(fieldValue).toLowerCase().includes(String(condition.value).toLowerCase())
    case 'startsWith':
      return String(fieldValue).toLowerCase().startsWith(String(condition.value).toLowerCase())
    case 'greaterThan':
      return Number(fieldValue) > Number(condition.value)
    case 'lessThan':
      return Number(fieldValue) < Number(condition.value)
    case 'between':
      const [min, max] = condition.value as [number, number]
      return Number(fieldValue) >= min && Number(fieldValue) <= max
    default:
      return false
  }
}

export function applyRule(expense: ExpenseInput, rule: ExpenseCategoryRule): ExpenseInput {
  const conditions = rule.conditions as RuleCondition[]
  const allMatch = conditions.every((cond) => evaluateCondition(expense, cond))

  if (allMatch) {
    return {
      ...expense,
      category: rule.targetCategory,
      subcategory: rule.targetSubcategory || expense.subcategory,
      tags: [...(expense.tags || []), ...(rule.applyTags || [])],
    }
  }
  return expense
}
```

---

## Frontend Components

### New Vue Components

| Component | Location | Description |
|-----------|----------|-------------|
| `ReceiptUploader.vue` | `src/components/expenses/` | Image capture/upload with drag-drop, OCR preview |
| `RuleEditor.vue` | `src/components/expenses/` | Create/edit categorization rules |
| `RuleConditionBuilder.vue` | `src/components/expenses/` | Visual condition builder |
| `AlertNotificationBell.vue` | `src/components/shared/` | Notification dropdown with unread count |

### New Pages

| Page | Route | Description |
|------|-------|-------------|
| `categories.vue` | `/dashboard/expenses/categories` | Rules management + categories list |

### Updated Pages

| Page | Changes |
|------|---------|
| `track.vue` | Added "Scan Receipt" button, prefill from OCR |
| `reports.vue` | Added PDF/Excel export with jsPDF and xlsx |
| All expense pages | Updated tabs array to include 5th "Categories" tab |

### Pinia Store (`src/stores/notifications.ts`)

```typescript
export const useNotificationsStore = defineStore('notifications', () => {
  const alerts = ref<Alert[]>([])
  const unreadCount = ref(0)
  const preferences = ref<AlertPreference | null>(null)

  async function fetchAlerts() { /* ... */ }
  async function fetchUnreadCount() { /* ... */ }
  async function markAsRead(id: string) { /* ... */ }
  async function markAllAsRead() { /* ... */ }
  async function fetchPreferences() { /* ... */ }
  async function updatePreferences(prefs: Partial<AlertPreference>) { /* ... */ }

  // Toast notifications
  function showSuccess(message: string) { /* ... */ }
  function showError(message: string) { /* ... */ }
  function showWarning(message: string) { /* ... */ }

  return { alerts, unreadCount, preferences, /* methods */ }
})
```

---

## PDF/Excel Export (Client-Side)

```typescript
// In reports.vue
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import * as XLSX from 'xlsx'

const exportToPDF = () => {
  const doc = new jsPDF()
  doc.setFontSize(18)
  doc.text('Expense Report', 14, 22)
  doc.setFontSize(12)
  doc.text(`Period: ${reportPeriod.value}`, 14, 32)

  // Summary section
  autoTable(doc, {
    startY: 40,
    head: [['Metric', 'Value']],
    body: [
      ['Total Spent', formatINR(summary.value.totalSpent)],
      ['Transactions', summary.value.count.toString()],
      ['Avg Transaction', formatINR(summary.value.average)],
    ],
  })

  // Category breakdown
  autoTable(doc, {
    startY: doc.lastAutoTable.finalY + 10,
    head: [['Category', 'Amount', 'Percentage']],
    body: categoryBreakdown.value.map(c => [
      c.name, formatINR(c.amount), `${c.percentage.toFixed(1)}%`
    ]),
  })

  doc.save(`expense-report-${reportPeriod.value}.pdf`)
}

const exportToExcel = () => {
  const workbook = XLSX.utils.book_new()

  // Summary sheet
  const summaryData = [
    ['Expense Report', reportPeriod.value],
    ['Total Spent', summary.value.totalSpent],
    ['Transactions', summary.value.count],
  ]
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(summaryData), 'Summary')

  // Expenses sheet
  const expenseData = expenses.value.map(e => ({
    Date: e.date,
    Description: e.description,
    Category: e.category,
    Amount: e.amount,
    Merchant: e.merchant,
    Payment: e.paymentMethod,
  }))
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(expenseData), 'Expenses')

  XLSX.writeFile(workbook, `expense-report-${reportPeriod.value}.xlsx`)
}
```

---

## Alert System Integration

### Budget Alert Checking (in `server/routes/expenses.ts`)

```typescript
async function checkBudgetAlerts(userId: string, date: Date): Promise<void> {
  const month = date.getMonth() + 1
  const year = date.getFullYear()

  const preferences = await prisma.alertPreference.findUnique({ where: { userId } })
  if (!preferences?.budgetAlerts) return

  const threshold = preferences.alertThreshold || 80
  const budget = await prisma.budget.findUnique({
    where: { userId_month_year: { userId, month, year } },
  })
  if (!budget) return

  // Check Needs budget
  const needsUsage = budget.needsLimit > 0 ? (budget.needsActual / budget.needsLimit) * 100 : 0
  if (needsUsage >= threshold && needsUsage < 100) {
    await createAlertIfNeeded('BUDGET_WARNING', 'Needs', needsUsage,
      `Needs spending is at ${needsUsage.toFixed(0)}% of budget`)
  } else if (needsUsage >= 100 && preferences.overspendAlerts) {
    await createAlertIfNeeded('BUDGET_EXCEEDED', 'Needs', needsUsage,
      `Needs budget exceeded! Spending at ${needsUsage.toFixed(0)}%`)
  }

  // Similar checks for Wants and Savings...
}

// Called after expense create/update/delete (non-blocking)
checkBudgetAlerts(userId, expense.date).catch(err => console.error('Alert check error:', err))
```

---

## E2E Tests

### Test Files Created

| File | Tests | Description |
|------|-------|-------------|
| `01-navigation.spec.ts` | 7 | Navigation to all 5 tabs |
| `02-expense-tracking.spec.ts` | 7 | CRUD operations |
| `03-budgets.spec.ts` | 7 | Budget management |
| `04-calculations.spec.ts` | 3 | Amount calculations |
| `05-validation.spec.ts` | 3 | Form validation |
| `06-reports.spec.ts` | 9 | Reports + PDF/Excel/CSV export |
| `07-categories-rules.spec.ts` | 13 | Rules engine + categories |
| `08-receipt-scanning.spec.ts` | 12 | Receipt OCR + CSV import |

**Total: 62 E2E tests**

### Page Objects

| Page Object | Location |
|-------------|----------|
| `ExpensesOverviewPage` | `e2e/pages/expenses/overview.page.ts` |
| `ExpenseTrackingPage` | `e2e/pages/expenses/tracking.page.ts` |
| `BudgetsPage` | `e2e/pages/expenses/budgets.page.ts` |
| `ExpensesReportsPage` | `e2e/pages/expenses/reports.page.ts` |
| `ExpenseCategoriesPage` | `e2e/pages/expenses/categories.page.ts` |

---

## Dependencies Used

| Package | Version | Purpose |
|---------|---------|---------|
| `openai` | ^4.x | Grok API client (OpenAI-compatible) |
| `jspdf` | ^2.x | PDF generation |
| `jspdf-autotable` | ^3.x | PDF tables |
| `xlsx` | ^0.18.x | Excel file generation |

---

## Environment Variables

```env
# Required for AI features
XAI_API_KEY=your-grok-api-key
```

---

## File Summary

### Server Files Created/Modified

```
server/
├── routes/
│   ├── expenses.ts         # Expense CRUD + budget updates + alert triggers
│   ├── budgets.ts          # Budget CRUD
│   ├── expense-rules.ts    # Rules engine API
│   ├── expenses-ai.ts      # AI categorization + receipt OCR
│   └── alerts.ts           # Alert management
├── services/
│   └── rules-engine.ts     # Rule evaluation logic
├── lib/
│   └── grok-client.ts      # Grok API wrapper
└── index.ts                # Route registration
```

### Frontend Files Created/Modified

```
src/
├── components/
│   ├── expenses/
│   │   ├── ReceiptUploader.vue       # Receipt scanning UI
│   │   ├── RuleEditor.vue            # Rule creation dialog
│   │   ├── RuleConditionBuilder.vue  # Condition builder
│   │   ├── ExpenseForm.vue           # Updated with prefillData prop
│   │   └── ... (existing)
│   └── shared/
│       └── AlertNotificationBell.vue # Notification dropdown
├── pages/dashboard/expenses/
│   ├── index.vue           # Overview (updated tabs)
│   ├── track.vue           # Track (added receipt scanning)
│   ├── budgets.vue         # Budgets (updated tabs)
│   ├── reports.vue         # Reports (added PDF/Excel export)
│   └── categories.vue      # NEW: Categories & Rules
├── stores/
│   └── notifications.ts    # Alert/notification state
├── composables/
│   └── useExpenses.ts      # Extended with rules operations
└── layouts/
    └── DashboardLayout.vue # Added notification bell
```

---

## Commits

| Hash | Message |
|------|---------|
| `afa6952` | feat(non-salary-income): add complete backend API and frontend |
| `774a580` | feat(expenses): implement complete expense tracking system with AI |
| `a47bdca` | test(non-salary-income): add interest income E2E test |
| `81080b6` | test(expenses): add comprehensive E2E tests for new features |

---

**Status: ✅ FULLY IMPLEMENTED**

*All planned features implemented on January 9, 2026*
