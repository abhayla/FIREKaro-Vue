# Salary Section - Detailed Plan

> **Created**: January 7, 2026
> **Status**: Ready for Implementation
> **Related**: Feature-Reorganization-Plan.md
> **Last Updated**: January 7, 2026 (All open questions resolved)

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

### 2.1 Salary History Location
- **Decision**: Salary History is NOT a separate nav item
- **Location**: Accessed via Income Source card → "View Monthly Breakdown"
- **URL**: `/dashboard/income/[incomeSourceId]/salary`

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

## 6. UI Wireframes

### 6.1 Income Sources Page (with Salary cards)
```
┌─────────────────────────────────────────────────────────────────┐
│ Income Sources                           FY [2024-25 ▼] [+ Add] │
├─────────────────────────────────────────────────────────────────┤
│ [All] [Salary] [Business] [Property] [Other]                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ 💼 SALARY SOURCES                                               │
│ ┌─────────────────────────────┐ ┌─────────────────────────────┐ │
│ │ Cognizant (Primary)         │ │ Previous Employer           │ │
│ │ Full-Time | Apr 2020 -      │ │ Full-Time | Jan 2018 - Mar  │ │
│ │                             │ │ 2020                        │ │
│ │ Gross: ₹36,11,826           │ │ Gross: ₹0 (no data)         │ │
│ │ Net: ₹23,01,618             │ │ Net: ₹0                     │ │
│ │ 12/12 months ✅              │ │ 0/12 months                 │ │
│ │                             │ │                             │ │
│ │ [View Monthly Breakdown →]  │ │ [View Monthly Breakdown →]  │ │
│ └─────────────────────────────┘ └─────────────────────────────┘ │
│                                                                 │
│ [+ Add Salary Source]                                           │
└─────────────────────────────────────────────────────────────────┘
```

### 6.2 Employer Salary Page (Monthly Breakdown)
```
┌─────────────────────────────────────────────────────────────────┐
│ ← Back to Income    Cognizant - Monthly Salary                  │
├─────────────────────────────────────────────────────────────────┤
│ Employer: Cognizant Technology Solutions India Pvt Ltd          │
│ Employee ID: 702518 | Designation: Functional Architect         │
│ PAN: ALPPK7647D | UAN: 100072381181        FY: [2024-25 ▼]     │
├─────────────────────────────────────────────────────────────────┤
│ ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌───────────┐        │
│ │ Gross     │ │ Deductions│ │ Net Salary│ │ Completion│        │
│ │₹36,11,826 │ │₹13,10,208 │ │₹23,01,618 │ │   100%    │        │
│ └───────────┘ └───────────┘ └───────────┘ └───────────┘        │
├─────────────────────────────────────────────────────────────────┤
│ [Import Excel] [Auto-Fill] [Export PDF] [Configure Components]  │
├─────────────────────────────────────────────────────────────────┤
│         │Apr'24│May'24│Jun'24│...│Feb'25│Mar'25│ Total │        │
│─────────┼──────┼──────┼──────┼───┼──────┼──────┼───────┤        │
│Paid Days│  30  │  31  │  30  │...│  29  │  31  │  366  │        │
│─────────┼──────┼──────┼──────┼───┼──────┼──────┼───────┤        │
│EARNINGS │      │      │      │   │      │      │       │        │
│Basic    │1,24K │1,24K │1,24K │...│1,24K │1,24K │14,91L │        │
│HRA      │ 8.3K │ 8.3K │ 8.3K │...│ 8.3K │ 8.3K │ 1.0L  │        │
│Special  │1,60K │1,59K │1,59K │...│1,59K │1,59K │19,14L │        │
│...      │      │      │      │   │      │      │       │        │
│Gross(A) │2,96K │2,95K │2,95K │...│2,95K │3,67K │36,12L │        │
│─────────┼──────┼──────┼──────┼───┼──────┼──────┼───────┤        │
│DEDUCTIONS│     │      │      │   │      │      │       │        │
│PF       │14.9K │14.9K │14.9K │...│14.9K │14.9K │1,79L  │        │
│PT       │ 200  │ 200  │ 200  │...│ 300  │ 200  │ 2.5K  │        │
│TDS      │68.2K │67.9K │67.9K │...│69.8K │92.4K │8,45L  │        │
│Other    │12.4K │21.1K │21.1K │...│21.1K │59.8K │2,83L  │        │
│Ded(B)   │95.8K │1,04K │1,04K │...│1,06K │1,67K │13,10L │        │
│─────────┼──────┼──────┼──────┼───┼──────┼──────┼───────┤        │
│Net(A-B) │2,00K │1,91K │1,91K │...│1,89K │2,00K │23,02L │        │
└─────────────────────────────────────────────────────────────────┘
│ Click any cell to edit | [Expand "Other" to show VPF, NPS...]  │
└─────────────────────────────────────────────────────────────────┘
```

### 6.3 Salary Entry Dialog (Dynamic)
```
┌─────────────────────────────────────────────────────────────────┐
│ Edit Salary - April 2024                                   [X]  │
├─────────────────────────────────────────────────────────────────┤
│ Paid Days: [30    ]                                             │
├─────────────────────────────────────────────────────────────────┤
│ EARNINGS                                              ₹2,95,967 │
│ ┌─────────────────────────┐ ┌─────────────────────────┐        │
│ │ Basic Salary *          │ │ House Rent Allowance    │        │
│ │ ₹ [1,24,250        ]    │ │ ₹ [8,333           ]    │        │
│ └─────────────────────────┘ └─────────────────────────┘        │
│ ┌─────────────────────────┐ ┌─────────────────────────┐        │
│ │ Conveyance Allowance    │ │ Medical Allowance       │        │
│ │ ₹ [1,600           ]    │ │ ₹ [1,250           ]    │        │
│ └─────────────────────────┘ └─────────────────────────┘        │
│ ┌─────────────────────────┐ ┌─────────────────────────┐        │
│ │ Special Allowance       │ │ Special Pay             │        │
│ │ ₹ [1,60,534        ]    │ │ ₹ [0               ]    │        │
│ └─────────────────────────┘ └─────────────────────────┘        │
│ [+ Add Custom Earning]                                          │
├─────────────────────────────────────────────────────────────────┤
│ DEDUCTIONS                                             ₹95,761  │
│ ┌─────────────────────────┐ ┌─────────────────────────┐        │
│ │ Provident Fund     🔗   │ │ Professional Tax        │        │
│ │ ₹ [14,910          ]    │ │ ₹ [200             ]    │        │
│ │ → Syncs to EPF Account  │ └─────────────────────────┘        │
│ └─────────────────────────┘                                    │
│ ┌─────────────────────────┐ ┌─────────────────────────┐        │
│ │ TDS                     │ │ Other Deductions   [▼]  │        │
│ │ ₹ [68,226          ]    │ │ ₹ [12,425          ]    │        │
│ └─────────────────────────┘ └─────────────────────────┘        │
│                                                                 │
│ ┌─ Expand "Other Deductions" ───────────────────────────────┐  │
│ │ ┌───────────────────┐ ┌───────────────────┐               │  │
│ │ │ VPF          🔗   │ │ NPS Employee  🔗  │               │  │
│ │ │ ₹ [12,425     ]   │ │ ₹ [0          ]   │               │  │
│ │ │ → Syncs to EPF    │ │ → Syncs to NPS    │               │  │
│ │ └───────────────────┘ └───────────────────┘               │  │
│ │ [+ Add sub-component]                                     │  │
│ └───────────────────────────────────────────────────────────┘  │
│                                                                 │
│ [+ Add Custom Deduction]                                        │
├─────────────────────────────────────────────────────────────────┤
│ EMPLOYER CONTRIBUTIONS (Info only - not in your take-home)     │
│ ┌─────────────────────────┐ ┌─────────────────────────┐        │
│ │ Employer PF        🔗   │ │ Pension Fund       🔗   │        │
│ │ ₹ [14,910          ]    │ │ ₹ [1,250           ]    │        │
│ └─────────────────────────┘ └─────────────────────────┘        │
├─────────────────────────────────────────────────────────────────┤
│ SUMMARY                                                         │
│ Gross: ₹2,95,967 | Deductions: ₹95,761 | Net: ₹2,00,206        │
├─────────────────────────────────────────────────────────────────┤
│ 🔗 = Will sync to linked section (EPF/NPS)                     │
│                                      [Cancel]  [Save Salary]    │
└─────────────────────────────────────────────────────────────────┘
```

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

## 9. Implementation Phases

| Phase | Tasks | Duration |
|-------|-------|----------|
| 1. Schema | Add models, migration, seed components | 2 days |
| 2. Shared Primitives | FYMonthHeader, SummaryCards, etc. | 2 days |
| 3. Services | SalaryComponentService, MonthlySalaryService | 2 days |
| 4. APIs | New endpoints, validation, sync logic | 2 days |
| 5. UI - Income Page | Landing page with salary cards | 1 day |
| 6. UI - Salary Page | Monthly breakdown table | 2 days |
| 7. UI - Entry Dialog | Dynamic component form | 2 days |
| 8. Sync Logic | EPF/VPF/NPS auto-sync | 2 days |
| 9. Import/Export | Excel import, PDF export | 2 days |
| 10. Testing | E2E tests, edge cases | 2 days |

**Total: ~19 days**

---

## 10. Files to Create/Modify

### New Files
```
src/components/shared/
├── FYMonthHeader.tsx
├── SummaryMetricCards.tsx
├── OpeningBalanceRow.tsx
└── FinancialYearSelector.tsx

src/components/salary/
├── SalaryEntryDialog.tsx
├── SalaryMonthlyTable.tsx
├── ComponentConfigDialog.tsx
└── SalaryImportDialog.tsx

src/services/salary/
├── SalaryComponentService.ts
├── MonthlySalaryService.ts
└── SalarySyncService.ts

src/app/api/salary-components/
└── route.ts

src/app/api/income-sources/[id]/salary/
├── route.ts
├── [month]/route.ts
├── import/route.ts
├── auto-fill/route.ts
└── sync/route.ts

src/app/dashboard/income/
├── page.tsx
└── [incomeSourceId]/salary/page.tsx

scripts/
└── seed-salary-components.ts
```

### Modified Files
```
prisma/schema.prisma (add 3 models)
src/services/tax/IncomeSourceService.ts (add salary relations)
src/app/api/salary-history/route.ts (add redirect)
src/app/dashboard/salary-history/page.tsx (add redirect)
```

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
