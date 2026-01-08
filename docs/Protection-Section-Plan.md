# Protection Section Plan

> **Status**: Approved
> **Created**: January 7, 2026
> **Approved**: January 7, 2026
> **Based on**: docs/Plans/Feature-Reorganization-Plan.md (Section 7: PROTECTION)
> **Estimated Effort**: ~3.5 days (reorganization + enhanced calculator)

---

## Executive Summary

The PROTECTION section is **~90% implemented** with excellent infrastructure. The work is primarily:

1. **Navigation Restructure** - Convert tab-based page to sub-pages
2. **Adequacy Calculator** - Standalone interactive calculator page
3. **Reports Tab** - Add unified reporting
4. **Family View** - Leverage existing familyMemberId

---

## Current State Analysis

### What Exists & Works ✅

| Feature | Location | Status |
|---------|----------|--------|
| InsurancePolicy Model | `prisma/schema.prisma` (47 fields) | ✅ Complete |
| InsuranceNominee Model | `prisma/schema.prisma` | ✅ Complete |
| InsuranceClaim Model | `prisma/schema.prisma` | ✅ Complete |
| InsurancePremiumPayment Model | `prisma/schema.prisma` | ✅ Complete |
| InsuranceRider Model | `prisma/schema.prisma` | ✅ Complete |
| Policies API | `/api/insurance/policies/*` | ✅ Complete |
| Summary API | `/api/insurance/summary` | ✅ Complete |
| Reminders API | `/api/insurance/reminders` | ✅ Complete |
| Calculations | `insurance-coverage.ts` (5 functions) | ✅ Complete |
| Service Layer | `InsurancePolicyService.ts` | ✅ Complete |
| Dashboard Page | `/dashboard/insurance` (tabs) | ✅ Complete |
| E2E Tests | `insurance.spec.ts` | ✅ Complete |

### What's Missing ❌

| Feature | Status | Priority |
|---------|--------|----------|
| Sub-page Navigation | ❌ Missing | P0 |
| Standalone Adequacy Calculator | ❌ Missing | P1 |
| Reports Tab | ❌ Missing | P1 |
| Family View Toggle | ⚠️ Partial | P2 |

### Current vs Target Structure

```
CURRENT (Single Page + Tabs):        TARGET (Sub-Pages):
├── /dashboard/insurance             ├── /dashboard/protection/
    └── Tabs: All|Life|Health|       │   ├── page.tsx (Overview)
        Motor|Home                   │   ├── life/
                                     │   ├── health/
                                     │   ├── other/ (Motor/Home/Travel)
                                     │   ├── calculator/
                                     │   └── reports/
```

---

## Target Sub-Page Structure

```
PROTECTION SECTION
├── Overview (summary dashboard)
├── Life Insurance (policies list)
├── Health Insurance (policies list)
├── Other Insurance (Motor/Home/Travel)
├── Adequacy Calculator (interactive)
└── Reports
```

---

## Phase 1: Navigation Restructure (Day 1)

### 1.1 New File Structure

```
src/app/dashboard/protection/
├── layout.tsx                      # Section layout
├── page.tsx                        # Overview (refactor from existing)
├── life/page.tsx                   # Life insurance filtered view
├── health/page.tsx                 # Health insurance filtered view
├── other/page.tsx                  # Motor/Home/Travel combined
├── calculator/page.tsx             # Adequacy calculator (NEW)
└── reports/page.tsx                # Reports (NEW)
```

### 1.2 Section Components

```
src/components/protection/
├── ProtectionSectionHeader.tsx     # Header with family toggle
├── ProtectionNavigation.tsx        # Sub-page navigation
└── ProtectionOverview.tsx          # Overview dashboard
```

### 1.3 Sidebar Update

```typescript
{
  title: 'Protection',
  icon: Shield,
  href: '/dashboard/protection',
  children: [
    { title: 'Overview', href: '/dashboard/protection' },
    { title: 'Life Insurance', href: '/dashboard/protection/life' },
    { title: 'Health Insurance', href: '/dashboard/protection/health' },
    { title: 'Other Insurance', href: '/dashboard/protection/other' },
    { title: 'Adequacy Calculator', href: '/dashboard/protection/calculator' },
    { title: 'Reports', href: '/dashboard/protection/reports' },
  ]
}
```

### 1.4 Redirect

```typescript
// Old URL redirect
'/dashboard/insurance': '/dashboard/protection'
```

---

## Phase 2: Enhanced Adequacy Calculator (Days 1.5-2)

### 2.1 UX Best Practices Applied

Based on research from industry leaders:
- **Progressive disclosure** - 4-step wizard, not overwhelming single form
- **Minimal fields** - Only essential inputs, auto-populate from existing policies
- **Visual gap indicators** - Color-coded progress bars (green/amber/red)
- **Contextual tooltips** - Explain HLV, family floater terms
- **Mobile-first responsive** - 50% of insurance users on mobile
- **Trust colors** - Green/blue palette for confidence

### 2.2 Enhanced UI Design (4-Step Wizard)

**Step 1: Your Profile**
- Annual Income, Age, Retirement Age, City (Metro/Tier1/Tier2)
- Family: Spouse (Y/N + age), Children (count + ages), Dependent Parents (Y/N + ages)

**Step 2: Liabilities & Goals**
- Home Loan, Car/Other Loans, Credit Card Debt
- Child Education (per child), Child Marriage, Spouse Security (years of expenses)

**Step 3: Current Coverage** (auto-populated from user's policies)
- Existing Life Insurance, Health Insurance, Employer Group Coverage

**Step 4: Results Dashboard**
```
+------------------------------------------------------------------+
| 💰 LIFE INSURANCE ANALYSIS (Human Life Value Method)              |
| ┌─────────────────────────────────────────────────────────────┐  |
| │ Income Replacement (15x)      ₹1,80,00,000                  │  |
| │ Outstanding Liabilities       ₹   50,00,000                  │  |
| │ Children's Future             ₹   90,00,000                  │  |
| │ Emergency Buffer              ₹   10,00,000                  │  |
| ├─────────────────────────────────────────────────────────────┤  |
| │ TOTAL RECOMMENDED             ₹3,30,00,000                  │  |
| └─────────────────────────────────────────────────────────────┘  |
| Your Coverage: ₹55L  |  Gap: ₹2.75Cr  |  17% INADEQUATE         |
| [███░░░░░░░░░░░░░░░░░]                                           |
+------------------------------------------------------------------+
| 🏥 HEALTH INSURANCE (2025 Medical Inflation: 13%)                 |
| ┌─────────────────────────────────────────────────────────────┐  |
| │ You + Spouse (Metro)          ₹10L each                     │  |
| │ 2 Children                    ₹ 5L each                     │  |
| │ 2 Senior Parents (1.5x)       ₹15L each                     │  |
| ├─────────────────────────────────────────────────────────────┤  |
| │ RECOMMENDED: ₹25L floater + ₹25L senior plan               │  |
| └─────────────────────────────────────────────────────────────┘  |
| Your Coverage: ₹10L  |  Gap: ₹50L  |  17% INADEQUATE            |
+------------------------------------------------------------------+
| 📊 OVERALL PROTECTION SCORE: 30% - CRITICAL                       |
+------------------------------------------------------------------+
| 💡 PERSONALIZED RECOMMENDATIONS                                   |
| Priority 1: ₹2.75Cr term plan (est. ₹18-22K/year, 80C benefit)   |
| Priority 2: ₹25L family floater + ₹25L senior plan               |
| Priority 3: Critical illness rider ₹25L                          |
+------------------------------------------------------------------+
| [Download PDF]  [Email Report]  [Recalculate]                     |
+------------------------------------------------------------------+
```

### 2.3 Key Calculation Factors

| Factor | Source | Value |
|--------|--------|-------|
| Life coverage multiplier | Industry standard | 15-20x income (age-based) |
| Health base (Metro) | 2025 data | ₹10L per adult |
| Health base (Tier-1) | 2025 data | ₹7.5L per adult |
| Health base (Tier-2) | 2025 data | ₹5L per adult |
| Senior citizen multiplier | Industry | 1.5x base |
| Medical inflation | Aon 2025 Report | 13% |
| Child floater | Industry | ₹5L each |

### 2.4 Leverage Existing Calculations

Already implemented in `insurance-coverage.ts`:
- `calculateLifeInsuranceNeed()` - Enhance with HLV breakdown
- `calculateHealthInsuranceNeed()` - Add 2025 inflation factor
- `calculateTermInsuranceRecommendation()` - Keep as-is
- `calculatePremiumAffordability()` - Keep as-is

---

## Phase 3: Reports Tab (Day 2.5)

### 3.1 Report Types

| Report | Content |
|--------|---------|
| Coverage Summary | All policies, coverage by type |
| Premium Analysis | Annual premiums, affordability |
| Tax Deductions | Section 80C/80D breakdown |
| Claims History | Filed claims and status |

### 3.2 New API Routes

```
src/app/api/insurance/reports/
├── route.ts                        # GET report data
├── coverage/route.ts               # Coverage summary
├── premiums/route.ts               # Premium analysis
├── tax/route.ts                    # Tax deduction report
└── export/route.ts                 # PDF/Excel export
```

---

## Phase 4: Family View Enhancement (Day 3)

### 4.1 Existing Support

The `familyMemberId` field already exists on InsurancePolicy model.

### 4.2 API Updates

Add `familyMemberId` query parameter to existing APIs:
- GET /api/insurance/policies?familyMemberId=all
- GET /api/insurance/summary?familyMemberId=all

### 4.3 Family View UI

```
+------------------------------------------------------------------+
| PROTECTION - Family View                                          |
+------------------------------------------------------------------+
| FAMILY COVERAGE SUMMARY                                           |
| +------------------+ +------------------+ +------------------+     |
| | Self             | | Spouse           | | Children         |     |
| | Life: ₹50L       | | Life: ₹25L       | | Life: ₹5L        |     |
| | Health: ₹10L     | | Health: ₹10L     | | Health: ₹5L      |     |
| +------------------+ +------------------+ +------------------+     |
+------------------------------------------------------------------+
```

---

## Implementation Summary

| Phase | Feature | Days | Priority |
|-------|---------|------|----------|
| 1 | Navigation Restructure | 1 | P0 |
| 2 | Enhanced Adequacy Calculator (4-step wizard) | 1.5 | P1 |
| 3 | Reports Tab | 0.5 | P1 |
| 4 | Family View Enhancement | 0.5 | P2 |
| **Total** | | **3.5 days** | |

---

## New Files Summary

### Pages (6 new/restructured)
- `/dashboard/protection/` - Layout + Overview
- `/dashboard/protection/life/`
- `/dashboard/protection/health/`
- `/dashboard/protection/other/`
- `/dashboard/protection/calculator/`
- `/dashboard/protection/reports/`

### Components (8 new)
- ProtectionSectionHeader.tsx
- ProtectionNavigation.tsx
- AdequacyCalculatorWizard.tsx (4-step wizard container)
- CalculatorStep1Profile.tsx
- CalculatorStep2Liabilities.tsx
- CalculatorStep3Coverage.tsx
- CalculatorStep4Results.tsx
- FamilyCoverageOverview.tsx

### API Routes (5 new)
- `/api/insurance/reports/*` (4 routes)
- Update existing routes for familyMemberId filter

---

## User Decisions Made

| Decision | Choice |
|----------|--------|
| Navigation Structure | **Sub-pages approved** - Overview, Life, Health, Other, Calculator, Reports |
| Other Insurance Grouping | **Combined** - Motor/Home/Travel on single "Other" page |
| Calculator Design | **Enhanced 4-step wizard** with HLV breakdown, 2025 health inflation, auto-populate |
| Reports Tab | **Approved** - Coverage, Premium, Tax, Claims reports |
| Family View | **Approved** - Family filter on APIs + family coverage overview UI |
| Emergency Fund | **Stays in FINANCIAL HEALTH** section (not Protection) |

---

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| URL migration | Medium | Add redirects for /dashboard/insurance |
| Existing components reuse | Low | Most components already exist |

---

## Related Plan Documents

1. `docs/Plans/Feature-Reorganization-Plan.md` - Master navigation
2. `docs/Plans/Salary-Section-Plan.md` - ~10 days
3. `docs/Plans/Non-Salary-Income-Plan.md` - ~20.5 days
4. `docs/Plans/Tax-Planning-Section-Plan.md` - ~12.5 days
5. `docs/Plans/Expenses-Section-Plan.md` - ~7.5 days
6. `docs/Plans/Investments-Section-Plan.md` - ~9 days
7. `docs/Plans/Liabilities-Section-Plan.md` - ~6.5 days
8. **`docs/Plans/Protection-Section-Plan.md`** - ~3.5 days (this plan)

---

**Status: ✅ APPROVED & READY FOR IMPLEMENTATION**

*Plan approved on January 7, 2026 with user decisions:*
- *Sub-pages navigation structure approved*
- *Enhanced 4-step adequacy calculator with HLV breakdown*
- *Reports tab with 4 report types*
- *Family view enhancement approved*
- *Emergency Fund remains in FINANCIAL HEALTH section*
