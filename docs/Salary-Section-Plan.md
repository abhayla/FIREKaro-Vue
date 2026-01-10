# Salary Section - Detailed Plan

> **Created**: January 7, 2026
> **Status**: UI Implementation Complete (Phase 1-6 Done, Phase 7 Testing Pending)
> **Related**: Feature-Reorganization-Plan.md
> **Last Updated**: January 10, 2026 (All UI Components Complete including Column Header Menu)

---

## 0. CONFIRMED STRUCTURE (User Verified)

### Salary Statement Structure (Cognizant Format - Use as Template)

```
EMPLOYEE INFO
├── Name, Employee ID, Designation, Gender, Location
├── PAN
├── PF Account Number, Universal Account Number (UAN)
├── SA New Policy Number, LIC ID (for Superannuation)
└── NPS PRAN Account Number

EARNINGS (Monthly columns: Apr'24 to Mar'25 + Total)
├── Paid Days
├── Basic
├── House Rent Allowance (HRA)
├── Conveyance Allowance
├── Medical Allowance
├── Special Allowance
├── Special Pay* (variable/one-time)
└── Gross Earnings (A) = Sum of above

DEDUCTIONS - EMPLOYEE CONTRIBUTION (Monthly + Total)
├── Provident Fund (EPF - 12% of Basic) → Syncs to EPF Account
├── Other Deductions (VPF) → Syncs to EPF Account (VPF)
├── Professional Tax
├── TDS (Income Tax)
└── Gross Deductions (B) = Sum of above

NET EARNINGS = (A) - (B)

EMPLOYER CONTRIBUTION (Monthly + Total) - Info only, not deducted from salary
├── National Pension System (NPS) → 80CCD(2), syncs to NPS Account
├── Pension Fund (EPS - part of EPF) → Syncs to EPF Account
├── Provident Fund (Employer PF - 3.67% of Basic) → Syncs to EPF Account
└── Superannuation Fund Contribution → Has Opening Balance, syncs to Superannuation
```

### Key Sync Rules (CONFIRMED)

| Salary Component | Sync Target | Tax Section | Notes |
|------------------|-------------|-------------|-------|
| EPF (Employee) | EPF Account - Employee | 80C | 12% of Basic |
| VPF (in Other Deductions) | EPF Account - VPF | 80C | Optional additional |
| EPF (Employer) | EPF Account - Employer | - | 3.67% of Basic |
| Pension Fund (EPS) | EPF Account - Pension | - | 8.33% of Basic (capped) |
| NPS (Employer) | NPS Account - Employer | 80CCD(2) | 10% old / 14% new regime |
| Superannuation | Superannuation Fund | - | Has Opening Balance |

### NPS Understanding (CONFIRMED)

- **NPS in salary = Employer contribution only** (80CCD(2))
- **NOT employee deduction** from salary
- Limit: 10% of (Basic+DA) under old regime, 14% under new regime
- If user wants personal NPS (80CCD(1B) - additional ₹50K), that's a **separate investment**, not through salary
- Salary is source of truth for Employer NPS → syncs to NPS Account

---

## 1. Reference Documents Analyzed

### Cognizant YTD Statement (FY 2023-24)
**Source**: `docs/Salary References/YTD_702518_FY202324.pdf`

**Employee Info Captured:**
- Name, Employee ID, Designation, Gender, Location
- PAN, PF Account Number, Universal Account Number (UAN)

**Earnings (Regular):**
| Component | Monthly (Typical) | Yearly Total |
|-----------|------------------|--------------|
| Paid Days | 30-31 | 366 |
| Basic | ₹1,24,250 | ₹14,91,000 |
| House Rent Allowance | ₹8,333 | ₹99,996 |
| Conveyance Allowance | ₹1,600 | ₹19,200 |
| Medical Allowance | ₹1,250 | ₹15,000 |
| Special Allowance | ₹1,59,442 | ₹19,14,396 |
| Special Pay* | ₹0 (₹72,234 in Mar) | ₹72,234 |
| **Gross Earnings (A)** | ~₹2,94,875 | ₹36,11,826 |

**Deductions (Regular):**
| Component | Monthly (Typical) | Yearly Total |
|-----------|------------------|--------------|
| Provident Fund | ₹14,910 | ₹1,78,920 |
| Professional Tax | ₹200 (₹300 in Feb) | ₹2,500 |
| TDS | ~₹67,886 | ₹8,45,310 |
| Other Deductions | ₹21,123 | ₹2,83,478 |
| **Gross Deductions (B)** | ~₹1,04,119 | ₹13,10,208 |

**Net Earnings (A-B):** ₹23,01,618

### PF/VPF Statement (FY 2024-25)
**Source**: `docs/Salary References/PF_VPF_702518_FY202425.pdf`

**Additional Employee Info:**
| Field | Value |
|-------|-------|
| SA New Policy Number | 610605001444 |
| LIC ID | 6084 |
| NPS PRAN A/C | 110001613538 |

**Employer Contributions (FY 2024-25):**
| Component | Opening Balance | Monthly Range | Yearly Total |
|-----------|-----------------|---------------|--------------|
| Earned PF Wage | - | ₹1,02,783 - ₹1,26,175 | ₹14,84,933 |
| National Pension System | - | ₹4,810 - ₹17,664 | ₹1,78,158 |
| Pension Fund (EPS) | - | ₹556 - ₹1,250 | ₹14,306 |
| Provident Fund (Employer) | - | ₹11,778 - ₹13,891 | ₹1,63,886 |
| Superannuation Fund | **₹13,07,641** | ₹7,215 - ₹18,926 | ₹15,21,890 |

**Employee Contributions (FY 2024-25):**
| Component | Monthly Range | Yearly Total |
|-----------|---------------|--------------|
| Provident Fund (12%) | ₹12,334 - ₹15,141 | ₹1,78,192 |
| Voluntary Provident Fund | ₹0 - ₹25,235 | ₹2,65,249 |

**Key Observation - Jul'24 Anomaly:**
- Jul'24 shows reduced amounts across all components (₹1,02,783 PF Wage vs ₹1,26,175 typical)
- Likely partial month due to leave or unpaid days
- Validates need for **Paid Days tracking** feature

---

## 2. Key Design Decisions

### 2.1 Salary Page Structure (UPDATED January 10, 2026)
- **Decision**: Single page with 2 tabs (Overview + Salary Details)
- **Previous Structure**: 4 separate pages (index, current, history, reports)
- **New Structure**: Single page at `/dashboard/salary` with tab switching
- **Benefit**: All salary info in one place, easier navigation
- **Key Feature**: Per-month employer dropdown for job change tracking

### 2.2 Multi-Employer Support
- **Decision**: Each SALARY type IncomeSource = One Employer
- **Benefit**: User can track multiple jobs in same FY (job change scenario)

### 2.3 Dynamic Salary Components
- **Decision**: Use `SalaryComponentDefinition` model instead of fixed fields
- **Benefit**: Users can add custom components (ESOP, Joining Bonus, etc.)

### 2.4 Data Entry Flexibility
- **Decision**: User decides - can enter bundled OR individual components
- **Example**: "Other Deductions" can stay as single field OR expand to VPF + NPS + Insurance

### 2.5 Cross-Section Sync Rules

| Component | Source of Truth | Syncs To |
|-----------|-----------------|----------|
| EPF (Employee) | Salary | EPF Account → Employee Contributions |
| EPF (Employer) | Salary | EPF Account → Employer Contributions |
| VPF | Salary | EPF Account → VPF Contributions |
| NPS (Employee) | Salary | NPS Account → Employee Contributions |
| NPS (Employer) | Salary | NPS Account → Employer Contributions |
| Superannuation | Salary | Superannuation Fund (separate tracking) |

**Note**: NPS has complex structure - needs further research on:
- Tier 1 vs Tier 2 accounts
- Employer vs Employee contribution limits
- Tax treatment differences (80CCD(1), 80CCD(1B), 80CCD(2))

---

## 3. Shared UI Primitives (Reusable)

### 3.1 FYMonthHeader Component
```
┌─────┬─────┬─────┬─────┬─────┬─────┬─────┬─────┬─────┬─────┬─────┬─────┬───────┐
│ Apr │ May │ Jun │ Jul │ Aug │ Sep │ Oct │ Nov │ Dec │ Jan │ Feb │ Mar │ Total │
└─────┴─────┴─────┴─────┴─────┴─────┴─────┴─────┴─────┴─────┴─────┴─────┴───────┘
```
**Usage**: Salary, EPF tracking, NPS tracking, Loan payments

### 3.2 SummaryMetricCards Component
```
┌───────────┐ ┌───────────┐ ┌───────────┐ ┌───────────┐
│ Metric 1  │ │ Metric 2  │ │ Metric 3  │ │ Metric 4  │
│ ₹XX,XXX   │ │ ₹XX,XXX   │ │ ₹XX,XXX   │ │ XX%       │
└───────────┘ └───────────┘ └───────────┘ └───────────┘
```
**Usage**: All dashboard sections

### 3.3 OpeningBalanceRow Component
```
Opening Balance: ₹XX,XX,XXX  [as of Apr 1, 2024]
```
**Usage**: EPF, Superannuation, NPS, Investment accounts

### 3.4 FinancialYearSelector Component
```
Financial Year: [2024-25 ▼]
```
**Usage**: All financial sections

---

## 4. Data Models

### 4.1 SalaryComponentDefinition (Master)
```prisma
model SalaryComponentDefinition {
  id              String                @id @default(cuid())
  code            String                // "BASIC", "HRA", "VPF"
  name            String                // "Basic Salary"
  componentType   SalaryComponentType   // EARNING, DEDUCTION, EMPLOYER_CONTRIBUTION
  category        String?               // "Fixed", "Variable", "Statutory"

  // Tax Treatment
  isTaxable       Boolean               @default(true)
  taxSection      String?               // "80C", "10(13A)", "80CCD(1B)"
  isExemptUpTo    Float?                // Exemption limit

  // Cross-Section Sync
  syncTarget      SyncTargetType?       // EPF, VPF, NPS, SUPERANNUATION, NONE
  syncDirection   SyncDirection         @default(FROM_SALARY)

  // Configuration
  isSystem        Boolean               @default(false)
  isActive        Boolean               @default(true)
  displayOrder    Int                   @default(0)
  userId          String?               // null = system-wide

  @@unique([code, userId])
}

enum SalaryComponentType {
  EARNING
  DEDUCTION
  EMPLOYER_CONTRIBUTION
}

enum SyncTargetType {
  EPF
  VPF
  NPS_EMPLOYEE
  NPS_EMPLOYER
  SUPERANNUATION
  PENSION_FUND
  NONE
}

enum SyncDirection {
  FROM_SALARY        // Salary is source of truth
  TO_SALARY          // Other section is source
  BIDIRECTIONAL      // Both ways (with conflict resolution)
  MANUAL             // No auto-sync
}
```

### 4.2 MonthlySalaryEntry
```prisma
model MonthlySalaryEntry {
  id                    String        @id @default(cuid())
  incomeSourceId        String        // Required link to employer
  financialYear         String        // "2024-25"
  month                 Int           // 1=April, 12=March
  year                  Int           // Calendar year
  paidDays              Int           @default(30)

  // Computed Totals
  grossEarnings         Float         @default(0)
  totalDeductions       Float         @default(0)
  employerContributions Float         @default(0)
  netSalary             Float         @default(0)
  taxableEarnings       Float         @default(0)
  tdsDeducted           Float         @default(0)

  // Metadata
  importSource          String?       // MANUAL, EXCEL, CSV, PAYSLIP_OCR
  isVerified            Boolean       @default(false)
  notes                 String?

  incomeSource          IncomeSource  @relation(...)
  components            SalaryComponentEntry[]

  @@unique([incomeSourceId, financialYear, month])
}
```

### 4.3 SalaryComponentEntry
```prisma
model SalaryComponentEntry {
  id                      String                    @id @default(cuid())
  monthlySalaryEntryId    String
  componentDefinitionId   String
  amount                  Float                     @default(0)
  remarks                 String?

  // Sync Status
  syncedAt                DateTime?
  syncStatus              SyncStatus                @default(PENDING)

  @@unique([monthlySalaryEntryId, componentDefinitionId])
}

enum SyncStatus {
  PENDING      // Not yet synced
  SYNCED       // Successfully synced to target
  CONFLICT     // Conflict detected, needs resolution
  SKIPPED      // User chose not to sync
}
```

---

## 5. System Components to Seed

### Earnings (12 components)
| Code | Name | Taxable | Tax Section |
|------|------|---------|-------------|
| BASIC | Basic Salary | Yes | - |
| HRA | House Rent Allowance | Partial | 10(13A) |
| DA | Dearness Allowance | Yes | - |
| CONVEYANCE | Conveyance Allowance | Yes | - |
| MEDICAL | Medical Allowance | Yes | - |
| SPECIAL | Special Allowance | Yes | - |
| LTA | Leave Travel Allowance | Partial | 10(5) |
| CEA | Children Education Allowance | Partial | 10(14) |
| CAR | Car Allowance | Yes | - |
| BONUS | Bonus | Yes | - |
| INCENTIVE | Incentives | Yes | - |
| SPECIAL_PAY | Special Pay/Arrears | Yes | - |

### Deductions (10 components)
| Code | Name | Sync Target | Tax Section |
|------|------|-------------|-------------|
| EPF | Employee Provident Fund | EPF | 80C |
| VPF | Voluntary Provident Fund | VPF | 80C |
| PT | Professional Tax | NONE | 16(iii) |
| TDS | Income Tax (TDS) | NONE | - |
| NPS_EMP | NPS Employee Contribution | NPS_EMPLOYEE | 80CCD(1) |
| NPS_EMP_ADDL | NPS Additional (80CCD1B) | NPS_EMPLOYEE | 80CCD(1B) |
| ESI | ESI Contribution | NONE | - |
| LWF | Labour Welfare Fund | NONE | - |
| LOAN_RECOVERY | Loan Recovery | NONE | - |
| OTHER_DED | Other Deductions | NONE | - |

### Employer Contributions (6 components)
| Code | Name | Sync Target |
|------|------|-------------|
| EPF_ER | Employer Provident Fund | EPF |
| PENSION | Pension Fund (EPS) | EPF |
| NPS_ER | Employer NPS | NPS_EMPLOYER |
| SUPERANN | Superannuation Fund | SUPERANNUATION |
| GRATUITY | Gratuity Provision | NONE |
| ESI_ER | Employer ESI | NONE |

---

## 6. UI Wireframes (UPDATED January 10, 2026)

> **Major Redesign**: Single page with 2 tabs (Overview + Salary Details)
> **Key Feature**: Per-month employer dropdown for job change tracking
> **All Mockups Approved**: January 10, 2026

---

### 6.0 Page Structure

```
┌─────────────────────────────────────────────────────────────────┐
│ Salary                                                          │
│ Track your salary income and history                            │
├─────────────────────────────────────────────────────────────────┤
│ [Overview]  [Salary Details]          ← 2 tabs only            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│              [◀ Prev]  FY: [2024-25 ▼]  [Next ▶]              │
│                                                                 │
│              ← Prev/Next FY navigation + dropdown              │
└─────────────────────────────────────────────────────────────────┘
```

**Key Decisions:**
- Single page replaces 4 pages (index, current, history, reports)
- Per-month employer dropdown (not single employer dropdown)
- One employer per month (overlapping jobs: pick primary for that month)

---

### 6.1 Salary Details Tab - View Mode

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│ Salary                                                                              │
│ Track your salary income and history                                                │
├─────────────────────────────────────────────────────────────────────────────────────┤
│ [Overview]  [■ Salary Details]                                                      │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                     │
│                          [◀ Prev]  FY: [2024-25 ▼]  [Next ▶]                       │
│                                                                                     │
│                                                      [Edit Mode]  [⚙️]  [Export ↓] │
├─────────────────────────────────────────────────────────────────────────────────────┤
│          │Apr'24  │May'24  │Jun'24  │Jul'24  │...│Mar'25 │ Total  │ Bonus  │ Perks  │FY Total│
│──────────┼────────┼────────┼────────┼────────┼───┼───────┼────────┼────────┼────────┼────────│
│Employer  │ Prev   │ Prev   │ Prev   │ Cog    │...│ Cog   │   -    │   -    │   -    │   -    │
│Paid Days │   30   │   31   │   30   │   31   │...│   31  │  365   │   -    │   -    │   -    │
│──────────┼────────┼────────┼────────┼────────┼───┼───────┼────────┼────────┼────────┼────────│
│EARNINGS  │        │        │        │        │   │       │        │        │        │        │
│Basic     │  85K   │  85K   │  85K   │ 1.24L  │...│ 1.24L │ 13.66L │   -    │   -    │ 13.66L │
│HRA       │   6K   │   6K   │   6K   │  8.3K  │...│  8.3K │ 92.7K  │   -    │   -    │ 92.7K  │
│Conveyance│  1.6K  │  1.6K  │  1.6K  │  1.6K  │...│  1.6K │ 19.2K  │   -    │   -    │ 19.2K  │
│Medical   │ 1.25K  │ 1.25K  │ 1.25K  │ 1.25K  │...│ 1.25K │  15K   │   -    │   -    │  15K   │
│Special   │  29K   │  29K   │  29K   │ 1.60L  │...│ 1.60L │ 15.28L │   -    │   -    │ 15.28L │
│LTA       │   -    │   -    │   -    │   -    │...│   -   │   -    │   -    │  50K   │  50K   │
│Spec. Pay │   -    │   -    │   -    │   -    │...│  72K  │  72K   │   -    │   -    │  72K   │
│Gross(A)  │ 1.23L  │ 1.23L  │ 1.23L  │ 2.96L  │...│ 2.96L │ 30.91L │   -    │  50K   │ 31.41L │
│──────────┼────────┼────────┼────────┼────────┼───┼───────┼────────┼────────┼────────┼────────│
│DEDUCTIONS│        │        │        │        │   │       │        │        │        │        │
│EPF (12%) │ 10.2K  │ 10.2K  │ 10.2K  │ 14.9K  │...│ 14.9K │ 1.64L  │   -    │   -    │ 1.64L  │
│VPF       │   5K   │   5K   │   5K   │ 21.1K  │...│ 21.1K │ 2.65L  │   -    │   -    │ 2.65L  │
│PT        │  200   │  200   │  200   │  200   │...│  200  │ 2.5K   │   -    │   -    │ 2.5K   │
│TDS       │ 25.0K  │ 25.0K  │ 25.0K  │ 68.2K  │...│ 92.4K │ 6.20L  │   -    │  12K   │ 6.32L  │
│Life Ins  │  2.5K  │  2.5K  │  2.5K  │  2.5K  │...│  2.5K │  30K   │   -    │   -    │  30K   │
│Other Ded │   -    │   -    │   -    │   -    │...│   -   │   -    │   -    │   -    │   -    │
│Ded(B)    │ 42.9K  │ 42.9K  │ 42.9K  │ 1.07L  │...│ 1.31L │ 10.81L │   -    │  12K   │ 10.93L │
│──────────┼────────┼────────┼────────┼────────┼───┼───────┼────────┼────────┼────────┼────────│
│EMPLOYER CONTRIBUTIONS (Info only - not deducted from salary)                                 │
│EPF (ER)  │  3.1K  │  3.1K  │  3.1K  │  4.6K  │...│  4.6K │ 54.5K  │   -    │   -    │ 54.5K  │
│Pension   │  1.1K  │  1.1K  │  1.1K  │ 1.25K  │...│ 1.25K │ 14.3K  │   -    │   -    │ 14.3K  │
│NPS (ER)  │   -    │   -    │   -    │ 12.4K  │...│ 12.4K │ 1.12L  │   -    │   -    │ 1.12L  │
│Superann  │   -    │   -    │   -    │  7.2K  │...│  7.2K │ 64.8K  │   -    │   -    │ 64.8K  │
│──────────┼────────┼────────┼────────┼────────┼───┼───────┼────────┼────────┼────────┼────────│
│Net(A-B)  │ 80.1K  │ 80.1K  │ 80.1K  │ 1.89L  │...│ 1.65L │ 20.10L │   -    │  38K   │ 20.48L │
├─────────────────────────────────────────────────────────────────────────────────────────────────┤
│ [+ Add Row]                                                              [+ Add Employer]      │
└─────────────────────────────────────────────────────────────────────────────────────────────────┘
```

**Grid Columns:**
- 12 months (Apr-Mar)
- Total (sum of monthly)
- Bonus (one-time annual)
- Perks (LTA, perquisites)
- FY Total (Total + Bonus + Perks)

**Default Rows:**
- Employer (per-month dropdown)
- Paid Days
- EARNINGS: Basic, HRA, Conveyance, Medical, Special, LTA, Special Pay, Gross(A)
- DEDUCTIONS: EPF, VPF, PT, TDS, Life Ins, Other Ded, Ded(B)
- EMPLOYER CONTRIBUTIONS: EPF (ER), Pension, NPS (ER), Superann
- Net(A-B)

---

### 6.2 Salary Details Tab - Edit Mode

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│ Salary                                                                              │
├─────────────────────────────────────────────────────────────────────────────────────┤
│ [Overview]  [■ Salary Details]                                                      │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                     │
│                          [◀ Prev]  FY: [2024-25 ▼]  [Next ▶]                       │
│                                                                                     │
│  [📋 Import from Mar'24]                           [✓ Save]  [✗ Cancel]  [⚙️]      │
│  ↑ Shows only when FY is empty & prev year has data                                │
├─────────────────────────────────────────────────────────────────────────────────────┤
│          │  Apr'24 ▼ │  May'24 ▼ │  Jun'24 ▼ │  Jul'24 ▼ │...│  Mar'25 ▼ │ Total  │
│          │  (click)  │  (click)  │  (click)  │  (click)  │   │  (click)  │        │
│──────────┼───────────┼───────────┼───────────┼───────────┼───┼───────────┼────────│
│Employer  │[Prev   ▼] │[Prev   ▼] │[Prev   ▼] │[Cog    ▼] │...│[Cog    ▼] │   -    │
│Paid Days │[   30   ] │[   31   ] │[   30   ] │[   31   ] │...│[   31   ] │  365   │
│──────────┼───────────┼───────────┼───────────┼───────────┼───┼───────────┼────────│
│EARNINGS  │           │           │           │           │   │           │        │
│Basic     │[  85000 ] │[  85000 ] │[  85000 ] │[ 124250 ] │...│[ 124250 ] │ 13.66L │
│HRA       │[   6000 ] │[   6000 ] │[   6000 ] │[   8333 ] │...│[   8333 ] │ 92.7K  │
│...       │           │           │           │           │   │           │        │
│Gross(A)  │ (auto)    │ (auto)    │ (auto)    │ (auto)    │   │ (auto)    │ 30.91L │
│──────────┼───────────┼───────────┼───────────┼───────────┼───┼───────────┼────────│
│DEDUCTIONS│           │           │           │           │   │           │        │
│EPF (12%) │[  10200 ] │[  10200 ] │[  10200 ] │[  14910 ] │...│[  14910 ] │ 1.64L  │
│VPF       │[   5000 ] │[   5000 ] │[   5000 ] │[  21123 ] │...│[  21123 ] │ 2.65L  │
│...       │           │           │           │           │   │           │        │
│Ded(B)    │ (auto)    │ (auto)    │ (auto)    │ (auto)    │   │ (auto)    │ 10.81L │
│──────────┼───────────┼───────────┼───────────┼───────────┼───┼───────────┼────────│
│EMPLOYER CONTRIBUTIONS (Info only - not deducted from salary)                       │
│EPF (ER)  │[   3100 ] │[   3100 ] │[   3100 ] │[   4600 ] │...│[   4600 ] │ 54.5K  │
│...       │           │           │           │           │   │           │        │
│──────────┼───────────┼───────────┼───────────┼───────────┼───┼───────────┼────────│
│Net(A-B)  │ (auto)    │ (auto)    │ (auto)    │ (auto)    │   │ (auto)    │ 20.10L │
├─────────────────────────────────────────────────────────────────────────────────────┤
│ [+ Add Row]                                                    [+ Add Employer]     │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

**Edit Mode Features:**
- All value cells become editable input fields [    ]
- Employer dropdowns active per month
- Column headers clickable with copy menu (▼)
- Summary rows (Gross, Ded, Net) auto-calculate
- [📋 Import from Mar'XX] button when FY is empty

**Column Header Click Menu:**
```
Clicking "May'24 ▼":
┌──────────────────────────────────┐
│ 📋 Copy to remaining months →    │
│ 📋 Copy from Apr'24              │
│ 🗑️ Clear this month              │
└──────────────────────────────────┘

For Apr'24 (first month):
┌──────────────────────────────────┐
│ 📋 Copy to remaining months →    │
│ 📋 Import from Mar'24 (Prev FY)  │
│ 🗑️ Clear this month              │
└──────────────────────────────────┘
```

---

### 6.3 Add Employer - Full Dialog

Triggered by: [+ Add Employer] button

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│ Add New Employer                                                           [X]  │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  Employer/Company Name *                                                        │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │ Cognizant Technology Solutions India Pvt Ltd                            │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
│  ┌─────────────────────────────────┐  ┌─────────────────────────────────┐      │
│  │ Employee ID                     │  │ Designation                     │      │
│  │ [702518                       ] │  │ [Functional Architect         ] │      │
│  └─────────────────────────────────┘  └─────────────────────────────────┘      │
│                                                                                 │
│  ┌─────────────────────────────────┐  ┌─────────────────────────────────┐      │
│  │ Start Date *                    │  │ End Date                        │      │
│  │ [Apr 2020                   📅] │  │ [                            📅] │      │
│  └─────────────────────────────────┘  └─────────────────────────────────┘      │
│                                        ☑ Currently working here                 │
│                                                                                 │
│  ┌─────────────────────────────────┐  ┌─────────────────────────────────┐      │
│  │ PAN (Employer)                  │  │ TAN (Employer)                  │      │
│  │ [AAACR1234A                  ]  │  │ [BLRC12345E                  ]  │      │
│  └─────────────────────────────────┘  └─────────────────────────────────┘      │
│                                                                                 │
│  ┌─────────────────────────────────┐  ┌─────────────────────────────────┐      │
│  │ UAN (Universal Account Number)  │  │ PF Account Number               │      │
│  │ [100072381181                ]  │  │ [BGBNG00123450000123         ]  │      │
│  └─────────────────────────────────┘  └─────────────────────────────────┘      │
│                                                                                 │
│  ┌─────────────────────────────────┐                                           │
│  │ NPS PRAN (if applicable)        │                                           │
│  │ [110001613538                ]  │                                           │
│  └─────────────────────────────────┘                                           │
│                                                                                 │
│  ☐ Set as Primary Employer                                                      │
│                                                                                 │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                    [Cancel]  [Save Employer]    │
└─────────────────────────────────────────────────────────────────────────────────┘
```

**Fields:**
| Field | Required | Description |
|-------|----------|-------------|
| Employer/Company Name | Yes | Full legal name |
| Employee ID | No | Your employee ID |
| Designation | No | Job title/role |
| Start Date | Yes | When you joined |
| End Date | No | When you left (disabled if "Currently working") |
| PAN (Employer) | No | Employer's PAN |
| TAN (Employer) | No | Employer's TAN |
| UAN | No | Universal Account Number for EPF |
| PF Account Number | No | PF account with this employer |
| NPS PRAN | No | NPS account number |
| Set as Primary | No | Mark as main/current employer |

---

### 6.4 Add Employer - Quick Add

Triggered by: Dropdown → "+ Add New Employer..."

```
┌─────────────────────────────────────────────────────────────────┐
│ Quick Add Employer                                         [X]  │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Employer/Company Name *                                        │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ Enter company name...                                   │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌──────────────────────────┐  ┌──────────────────────────┐    │
│  │ Start Date *             │  │ End Date                 │    │
│  │ [Jul 2024            📅] │  │ [                    📅] │    │
│  └──────────────────────────┘  └──────────────────────────┘    │
│                                 ☑ Currently working here        │
│                                                                 │
│  ⓘ You can add more details (Employee ID, PAN, UAN) later      │
│    from Settings [⚙️]                                           │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│                                          [Cancel]  [Add]        │
└─────────────────────────────────────────────────────────────────┘
```

---

### 6.5 Manage Employers Dialog

Triggered by: [⚙️] → "Manage Employers"

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│ Manage Employers                                                           [X]  │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│ ┌─────────────────────────────────────────────────────────────────────────────┐│
│ │ ★ Cognizant Technology Solutions India Pvt Ltd                 PRIMARY     ││
│ │   ─────────────────────────────────────────────────────────────────────    ││
│ │   Employee ID: 702518  |  Designation: Functional Architect                ││
│ │   Period: Jul 2024 → Present                                               ││
│ │   UAN: 100072381181  |  PF: BGBNG00123450000123                           ││
│ │                                                                            ││
│ │                                              [Edit]  [Set as Primary]      ││
│ └─────────────────────────────────────────────────────────────────────────────┘│
│                                                                                 │
│ ┌─────────────────────────────────────────────────────────────────────────────┐│
│ │   Previous Employer Pvt Ltd                                                ││
│ │   ─────────────────────────────────────────────────────────────────────    ││
│ │   Employee ID: 12345  |  Designation: Senior Developer                     ││
│ │   Period: Apr 2024 → Jun 2024                                              ││
│ │   UAN: 100072381181  |  PF: BGBNG00987650000456                           ││
│ │                                                                            ││
│ │                                      [Edit]  [Set as Primary]  [🗑️ Delete] ││
│ └─────────────────────────────────────────────────────────────────────────────┘│
│                                                                                 │
├─────────────────────────────────────────────────────────────────────────────────┤
│ [+ Add Employer]                                                      [Close]   │
└─────────────────────────────────────────────────────────────────────────────────┘
```

**Settings Menu (⚙️):**
```
┌────────────────────────────────┐
│ 👥 Manage Employers            │
│ 📋 Manage Salary Components    │
│ ──────────────────────────────│
│ 📥 Import from Excel           │
│ 📤 Export to Excel             │
└────────────────────────────────┘
```

---

### 6.6 Copy Features

**6.6.1 Import from Previous FY:**
```
┌─────────────────────────────────────────────────────────────────────────────────┐
│ Import from Previous Year                                                  [X]  │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  📋 Found salary data for Mar'24 (FY 2023-24)                                  │
│                                                                                 │
│  ┌───────────────────────────────────────────────────────────────────────────┐ │
│  │ Employer: Cognizant Technology Solutions                                  │ │
│  │ Gross: ₹2,95,967  |  Deductions: ₹1,06,959  |  Net: ₹1,89,008            │ │
│  └───────────────────────────────────────────────────────────────────────────┘ │
│                                                                                 │
│  Import to:                                                                     │
│  ○ April 2024 only                                                             │
│  ● All months (Apr'24 → Mar'25)                        ← Recommended           │
│                                                                                 │
│  ☑ Include Employer (Cognizant)                                                │
│  ☑ Include Paid Days (31 → adjusted per month)                                 │
│                                                                                 │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                   [Cancel]  [Import]            │
└─────────────────────────────────────────────────────────────────────────────────┘
```

**6.6.2 Copy to Remaining Months:**
```
┌─────────────────────────────────────────────────────────────────────────────────┐
│ Copy to Remaining Months                                                   [X]  │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  Copy May'24 data to remaining months?                                         │
│  This will copy to: Jun'24 → Mar'25 (10 months)                                │
│                                                                                 │
│  ☑ Employer (Cognizant)                                                        │
│  ☑ Paid Days (31 → adjusted per month)                                         │
│  ☑ All Earnings                                                                │
│  ☑ All Deductions                                                              │
│  ☑ All Employer Contributions                                                  │
│                                                                                 │
│  ⚠️ This will overwrite any existing data in those months.                     │
│                                                                                 │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                   [Cancel]  [Copy]              │
└─────────────────────────────────────────────────────────────────────────────────┘
```

**6.6.3 Copy from Previous Month:**
```
┌─────────────────────────────────────────────────────────────────────────────────┐
│ Copy from Previous Month                                                   [X]  │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  Copy May'24 data to Jun'24?                                                   │
│                                                                                 │
│  ☑ Employer  ☑ Paid Days  ☑ Earnings  ☑ Deductions  ☑ Employer Contrib        │
│                                                                                 │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                   [Cancel]  [Copy]              │
└─────────────────────────────────────────────────────────────────────────────────┘
```

**6.6.4 Clear Month:**
```
┌─────────────────────────────────────────────────────────────────────────────────┐
│ Clear Month Data                                                           [X]  │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  ⚠️ Clear all data for Jul'24?                                                 │
│  This will reset all values to 0/empty.                                        │
│  This action cannot be undone (until you Cancel edit mode).                    │
│                                                                                 │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                   [Cancel]  [Clear]             │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

### 6.7 Overview Tab

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│ Salary                                                                              │
├─────────────────────────────────────────────────────────────────────────────────────┤
│ [■ Overview]  [Salary Details]                                                      │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                          [◀ Prev]  FY: [2024-25 ▼]  [Next ▶]                       │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                     │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐│
│  │ 💰 FY Gross     │  │ 💵 FY Net       │  │ 🏛️ TDS Paid     │  │ 🏦 EPF + VPF    ││
│  │   ₹31.41L      │  │   ₹20.48L      │  │   ₹6.32L       │  │   ₹4.29L       ││
│  │ Avg: ₹2.62L/mo │  │ Avg: ₹1.71L/mo │  │ ~20.1% of Gross │  │ EPF+VPF (80C)   ││
│  └─────────────────┘  └─────────────────┘  └─────────────────┘  └─────────────────┘│
│                                                                                     │
├─────────────────────────────────────────────────────────────────────────────────────┤
│  DATA COMPLETION                                                    12/12 months ✓ │
│  ┌────┬────┬────┬────┬────┬────┬────┬────┬────┬────┬────┬────┐                     │
│  │ ✓  │ ✓  │ ✓  │ ✓  │ ✓  │ ✓  │ ✓  │ ✓  │ ✓  │ ✓  │ ✓  │ ✓  │                     │
│  │Apr │May │Jun │Jul │Aug │Sep │Oct │Nov │Dec │Jan │Feb │Mar │                     │
│  └────┴────┴────┴────┴────┴────┴────┴────┴────┴────┴────┴────┘                     │
├─────────────────────────────────────────────────────────────────────────────────────┤
│  MONTHLY SALARY TREND                                                              │
│  [Bar chart: 12 months, Gross/Net bars, employer color coding]                     │
│  Legend: [■ Gross]  [■ Net]                          [Toggle: Gross/Net/Both]      │
├─────────────────────────────────────────────────────────────────────────────────────┤
│  ┌──────────────────────────────────────────┐  ┌──────────────────────────────────┐│
│  │ YEAR-ON-YEAR COMPARISON                  │  │ EMPLOYER BREAKDOWN               ││
│  │ FY 2024-25 vs FY 2023-24                │  │  Cognizant         ₹27.72L (88%) ││
│  │ Gross: ↑ ₹2.91L (+10.2%)                │  │  Previous Employer  ₹3.69L (12%) ││
│  │ Net:   ↑ ₹2.28L (+12.5%)                │  │  Total:             ₹31.41L      ││
│  └──────────────────────────────────────────┘  └──────────────────────────────────┘│
│                                                                                     │
│  ┌──────────────────────────────────────────────────────────────────────────────┐  │
│  │ DEDUCTIONS BREAKDOWN                                                         │  │
│  │  TDS          ████████████████████████████████████████  ₹6.32L (58%)        │  │
│  │  VPF          ████████████████████                      ₹2.65L (24%)        │  │
│  │  EPF (12%)    ██████████████                            ₹1.64L (15%)        │  │
│  │  Life Ins     ██                                        ₹0.30L  (3%)        │  │
│  └──────────────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

**Overview Components:**
- Summary Metric Cards (4): FY Gross, FY Net, TDS Paid, EPF+VPF
- Data Completion Indicator (12 month visual)
- Monthly Salary Trend Chart
- Year-on-Year Comparison Card
- Employer Breakdown Chart
- Deductions Breakdown Bars

**Empty State:**
```
┌─────────────────────────────────┐
│      📋                         │
│   No salary data for FY 2025-26 │
│   [Go to Salary Details]        │
└─────────────────────────────────┘
```

---

### 6.8 Key Decisions Summary

| Decision | Choice |
|----------|--------|
| Page structure | Single page, 2 tabs (Overview + Salary Details) |
| Multi-employer handling | Per-month employer dropdown |
| Overlapping employers | One employer per month only |
| FY navigation | Prev/Next buttons + Dropdown |
| Additional columns | Bonus, Perks, FY Total |
| Edit mode | Toggle button, all cells editable, Save/Cancel |
| Add employer | Full dialog (button) + Quick add (dropdown) |
| Copy features | Import from prev FY, Copy to remaining, Copy from prev, Clear |

---

## 7. API Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/salary-components` | List all component definitions |
| POST | `/api/salary-components` | Create custom component |
| PUT | `/api/salary-components/[id]` | Update component |
| DELETE | `/api/salary-components/[id]` | Delete custom component |
| GET | `/api/income-sources/[id]/salary` | List monthly entries |
| POST | `/api/income-sources/[id]/salary` | Create/update month |
| GET | `/api/income-sources/[id]/salary/[month]` | Get specific month |
| DELETE | `/api/income-sources/[id]/salary/[month]` | Delete month |
| POST | `/api/income-sources/[id]/salary/import` | Import Excel/CSV |
| POST | `/api/income-sources/[id]/salary/auto-fill` | Auto-fill months |
| GET | `/api/income-sources/[id]/salary/summary` | Yearly summary |
| POST | `/api/income-sources/[id]/salary/sync` | Trigger sync to EPF/NPS |

---

## 8. Open Questions

### 8.1 NPS Structure - RESOLVED
- [x] Tier 1 vs Tier 2: Only Tier 1 via salary (Tier 2 is separate investment)
- [x] Employer contribution limits: 10% old regime / 14% new regime of Basic+DA
- [x] Tax treatment: 80CCD(2) for employer contribution via salary
- [x] Employee NPS (80CCD(1), 80CCD(1B)): Separate investment, NOT via salary deduction
- [ ] Asset allocation sync (Equity/Corporate/Govt bonds) - Future feature

### 8.2 Superannuation Fund
- [x] Has Opening Balance (confirmed from PF/VPF statement)
- [ ] How to track opening balance from previous years?
- [ ] Interest calculation method
- [ ] Withdrawal rules

### 8.3 Import Formats
- [ ] Standard Excel template to provide
- [ ] PDF payslip parsing (OCR) - future feature?
- [ ] Form 16 import

### 8.4 User Questions - ALL RESOLVED ✅
- [x] **Other Deductions**: **EXPANDABLE** - Single field with click-to-expand for VPF, NPS, ESI breakdown
- [x] **Partial Month Handling**: **BOTH** - Track Paid Days field AND allow manual override of component amounts
- [x] **Mid-Year Salary Changes**: **YES** - Support via SalaryStructure model with effective dates (e.g., "Post-Promotion Sep 2024")

---

## 9. Implementation Phases (UPDATED January 10, 2026)

| Phase | Tasks | Status |
|-------|-------|--------|
| 1. Core Grid | Create SalaryDetailsTab with view mode grid, per-month employer dropdown | ✅ Complete |
| 2. Edit Mode | Add edit state, cell editing, column header menu, auto-calculations | ✅ Complete (toggle, inputs, column header menu all wired) |
| 3. Employer Management | Full dialog, Quick add, Manage employers dialog | ✅ Complete |
| 4. Copy Features | Import from prev FY, Copy to remaining, Copy from prev, Clear | ✅ Complete (dialog + column header menu wired) |
| 5. Overview Tab | Summary cards, charts, data completion, empty state | ✅ Complete |
| 6. Integration | Rewrite index.vue, delete old pages, update router, update sidebar | ✅ Complete |
| 7. Testing | E2E tests, unit tests for calculations | ❌ Not Started |

---

## 10. Files to Create/Modify (UPDATED January 10, 2026)

### Delete (Old Pages) - ✅ ALL DELETED
| File | Status |
|------|--------|
| `src/pages/dashboard/salary/current.vue` | ✅ Deleted |
| `src/pages/dashboard/salary/history.vue` | ✅ Deleted |
| `src/pages/dashboard/salary/reports.vue` | ✅ Deleted |

### Modify - ✅ COMPLETE
| File | Change | Status |
|------|--------|--------|
| `src/pages/dashboard/salary/index.vue` | Complete rewrite - 2 tabs | ✅ Done |
| `src/router/index.ts` | Remove old routes, add redirects | ✅ Done |
| `src/layouts/DashboardLayout.vue` | Remove salary sub-pages from sidebar | ✅ Done |
| `src/composables/useSalary.ts` | Add copy functions | ⏳ Pending |

### Create - IMPLEMENTATION STATUS
| File | Status | Notes |
|------|--------|-------|
| `src/components/salary/SalaryOverviewTab.vue` | ✅ Created | Full implementation with charts |
| `src/components/salary/SalaryDetailsTab.vue` | ✅ Created | View mode complete, edit mode placeholder |
| `src/components/salary/AddEmployerDialog.vue` | ✅ Created | Includes `quickMode` prop (combined with QuickAdd) |
| `src/components/salary/ManageEmployersDialog.vue` | ✅ Created | Full implementation |
| `src/components/salary/CopyDataDialog.vue` | ✅ Created | All 4 modes supported |
| `src/components/salary/SalaryGridEditMode.vue` | ❌ Skipped | Edit mode is inline in SalaryDetailsTab |
| `src/components/salary/QuickAddEmployerDialog.vue` | ❌ Skipped | Using `quickMode` prop in AddEmployerDialog |
| `src/components/salary/ColumnHeaderMenu.vue` | ✅ Inline | Implemented inside SalaryDetailsTab (v-menu in column headers) |
| `src/components/salary/SalaryTrendChart.vue` | ❌ Skipped | Using existing SalaryChart.vue |
| `src/components/salary/YoYComparisonCard.vue` | ❌ Skipped | Inline in SalaryOverviewTab |
| `src/components/salary/EmployerBreakdownChart.vue` | ❌ Skipped | Inline in SalaryOverviewTab |
| `src/components/salary/DeductionsBreakdown.vue` | ❌ Skipped | Inline in SalaryOverviewTab |
| `src/components/salary/DataCompletionIndicator.vue` | ❌ Skipped | Inline in SalaryOverviewTab |

---

## 11. DECISIONS CONFIRMED (Summary for New Context)

### User Decisions (January 7, 2026)
| Question | Decision | Implementation |
|----------|----------|----------------|
| Other Deductions | **Expandable** | Click [▼] to expand VPF, NPS, ESI sub-components |
| Partial Month | **Both options** | Track `paidDays` field + allow manual override |
| Mid-Year Changes | **Yes - track** | SalaryStructure model with effectiveFrom/effectiveTo dates |

### Architecture Decisions
1. **Salary History Location**: Under Income section, NOT standalone nav item
2. **Multi-Employer**: Each SALARY IncomeSource = One Employer
3. **Dynamic Components**: Use SalaryComponentDefinition model (not fixed fields)
4. **Data Entry**: User decides - single field OR expanded sub-components
5. **Sync Direction**: Salary is source of truth for EPF, VPF, Employer NPS
6. **Expandable Fields**: OTHER_DED marked as `isExpandable=true` with sub-components (VPF, NPS_EMP, ESI, LOAN_RECOVERY)
7. **Salary Structures**: Support mid-year changes via SalaryStructure with template data

### Shared UI Primitives to Create
1. **FYMonthHeader** - Apr|May|...|Mar|Total header with FY selector
2. **SummaryMetricCards** - 4-card grid for key totals
3. **OpeningBalanceRow** - For funds with carryover (EPF, Superannuation)
4. **FinancialYearSelector** - Dropdown for FY selection

### Component Categories (for SalaryComponentDefinition seeding)
- **Earnings**: Basic, HRA, Conveyance, Medical, Special, Special Pay, etc.
- **Employee Deductions**: EPF, VPF, PT, TDS
- **Employer Contributions**: Employer PF, Pension Fund, NPS, Superannuation

### Sync Rules Summary
```
SALARY → EPF Account
├── EPF (Employee 12%) → Employee Contribution
├── VPF → VPF Contribution
├── EPF (Employer 3.67%) → Employer Contribution
└── Pension Fund (EPS 8.33%) → Pension Component

SALARY → NPS Account
└── NPS (Employer) → Employer Contribution (80CCD(2))

SALARY → Superannuation
└── Superannuation Fund → Has Opening Balance
```

---

## 12. NEXT STEPS - READY FOR IMPLEMENTATION

### All Questions Resolved ✅
Section 8.4 questions have been answered by user. No blocking questions remain.

### Implementation Order
1. **Phase 1: Schema** - Add SalaryComponentDefinition, SalaryComponentEntry, SalaryStructure models
2. **Phase 2: Seed** - Run seed script for 25 system salary components
3. **Phase 3: Shared Primitives** - Create FYMonthHeader, FinancialYearSelector, SummaryMetricCards, OpeningBalanceRow
4. **Phase 4: Services** - SalaryComponentService, SalaryStructureService, SalarySyncService
5. **Phase 5: APIs** - New endpoints + enhance existing salary-history routes
6. **Phase 6: UI** - Enhance salary-history page with expandable deductions, structure selector
7. **Phase 7: Sync** - Implement auto-sync to EPF/NPS accounts
8. **Phase 8: Testing** - E2E tests for all new functionality

### Estimated Effort: ~10 days (optimized from original 19 days)

---

## 13. Reference Files

- **Salary Samples**: `docs/Salary References/YTD_702518_FY202324.pdf`, `PF_VPF_702518_FY202425.pdf`
- **Feature Plan**: `docs/Plans/Feature-Reorganization-Plan.md`
- **Current Salary Implementation**: `src/app/dashboard/salary-history/`, `src/app/api/salary-history/`
- **EPF Calculations**: `src/lib/calculations/epf.ts`
- **NPS Calculations**: `src/lib/calculations/nps.ts`
