# Insurance Section Plan

> **Status**: ✅ FULLY IMPLEMENTED (January 2026)
> **Created**: January 7, 2026
> **Restructured**: January 11, 2026 (Tab-based architecture)
> **Based on**: docs/Plans/Feature-Reorganization-Plan.md (Section 7: INSURANCE)

---

## Executive Summary

The INSURANCE section provides comprehensive insurance coverage tracking and analysis for Indian users. The section was restructured in January 2026 from a multi-page route-based architecture to a single-page tab-based architecture, matching the Salary section pattern for consistency.

---

## Architecture Overview

### Navigation Structure

```
/dashboard/insurance                     ← Single URL (all navigation is client-side)
├── Overview Tab                         ← Summary cards, coverage chart, gap alert, CTA
├── Item Details Tab                     ← Policy management by type
│   ├── Life Sub-tab                     ← Term, ULIP, Endowment policies
│   ├── Health Sub-tab                   ← Individual, Floater, Super Top-up
│   ├── Motor Sub-tab                    ← Comprehensive, Third-party
│   ├── Home Sub-tab                     ← Structure, Contents coverage
│   └── Travel Sub-tab                   ← Domestic, International
├── Calculator Tab                       ← HLV (Human Life Value) calculator
└── Reports Tab                          ← Coverage, Premium, Tax, Renewals reports
```

### Key Architecture Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Page structure | Single page with tabs | Consistent with Salary section, better UX |
| Main tabs | 4 tabs (Overview, Item Details, Calculator, Reports) | Logical grouping of functionality |
| Sub-tabs | 5 insurance types | Organized policy management |
| Navigation | Client-side (v-tabs + v-window) | No URL changes, smoother transitions |
| Legacy URLs | Redirect to main page | Backwards compatibility |

---

## Implementation Status

### Frontend - Page Structure ✅

| Component | Location | Purpose |
|-----------|----------|---------|
| **Main Page** | `src/pages/dashboard/insurance/index.vue` | Tab container, dialog management |
| **Overview Tab** | `src/components/insurance/InsuranceOverviewTab.vue` | Summary, coverage chart, CTAs |
| **Details Tab** | `src/components/insurance/InsuranceDetailsTab.vue` | Sub-tab container for 5 types |
| **Policy Sub-Tab** | `src/components/insurance/PolicyTypeSubTab.vue` | Generic policy list per type |
| **Calculator Tab** | `src/components/insurance/InsuranceCalculatorTab.vue` | HLV calculator interface |
| **Reports Tab** | `src/components/insurance/InsuranceReportsTab.vue` | Reports with export |

### Frontend - Shared Components ✅

| Component | Location | Purpose |
|-----------|----------|---------|
| `InsurancePolicyCard.vue` | `src/components/insurance/` | Policy display card |
| `InsurancePolicyForm.vue` | `src/components/insurance/` | Add/Edit policy dialog |
| `InsuranceSummaryCard.vue` | `src/components/insurance/` | Summary metrics card |
| `CoverageGapAlert.vue` | `src/components/insurance/` | Coverage adequacy alert |
| `CoverageAdequacyWizard.vue` | `src/components/insurance/` | Full HLV wizard dialog |
| `HLVCalculator.vue` | `src/components/insurance/` | Quick HLV calculator |
| `FamilyCoverageView.vue` | `src/components/insurance/` | Family member coverage |

### Frontend - Composable ✅

| Composable | Location | Features |
|------------|----------|----------|
| `useInsurance` | `src/composables/useInsurance.ts` | CRUD operations, summary, HLV calculation, type helpers |

### Backend - API Routes ✅

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/insurance` | GET | List policies (filter: type, status, familyMemberId) |
| `/api/insurance` | POST | Create new policy |
| `/api/insurance/:id` | GET | Get single policy with nominees |
| `/api/insurance/:id` | PUT | Update policy |
| `/api/insurance/:id` | DELETE | Delete policy |
| `/api/insurance/summary` | GET | Aggregated summary (coverage, premium, renewals) |
| `/api/insurance/coverage-analysis` | GET | Coverage adequacy analysis |
| `/api/insurance/recommendations` | GET | Personalized recommendations |
| `/api/insurance/:id/nominees` | GET | List nominees for policy |
| `/api/insurance/:id/nominees` | POST | Add nominee to policy |
| `/api/insurance/:id/nominees/:nomineeId` | PUT | Update nominee |
| `/api/insurance/:id/nominees/:nomineeId` | DELETE | Delete nominee |

**Route File**: `server/routes/insurance.ts`

### Backend - Database Models ✅

| Model | Fields | Status |
|-------|--------|--------|
| `InsurancePolicy` | ~35 fields | ✅ Complete |
| `InsuranceNominee` | ~10 fields | ✅ Complete |
| `InsuranceType` enum | LIFE, HEALTH, MOTOR, HOME, TRAVEL | ✅ Complete |
| `InsurancePolicyStatus` enum | ACTIVE, EXPIRED, CANCELLED, PENDING | ✅ Complete |
| `InsurancePaymentFrequency` enum | MONTHLY, QUARTERLY, HALF_YEARLY, YEARLY | ✅ Complete |
| `TaxBenefitType` enum | SECTION_80C, SECTION_80D, BOTH, NONE | ✅ Complete |

### E2E Tests ✅

| Test File | Tests | Coverage |
|-----------|-------|----------|
| `01-navigation.spec.ts` | 17 tests | Main tabs, sub-tabs, legacy URL redirects |
| `02-life-insurance.spec.ts` | 9 tests | Life sub-tab, policy form, form fields |
| `03-health-insurance.spec.ts` | 9 tests | Health sub-tab, health-specific fields |
| `04-calculations.spec.ts` | 9 tests | Calculator tab, HLV calculator, overview cards |
| `05-reports.spec.ts` | 9 tests | Reports tab, report types, export |
| **Total** | **53 tests** | ✅ All updated for tab-based structure |

**Page Objects**: `e2e/pages/insurance/index.ts` - Single `InsurancePage` class with legacy compatibility exports

---

## Tab-Based Architecture Details

### Main Tab Container (`index.vue`)

```vue
<script setup lang="ts">
const activeTab = ref('overview')
const activeSubTab = ref('life')

// Dialog management
const showPolicyForm = ref(false)
const showCalculator = ref(false)
const editingPolicy = ref<InsurancePolicy | null>(null)
const preSelectedType = ref<InsuranceType | null>(null)

// Navigation handlers
const handleGoToDetails = (subTab?: string) => {
  if (subTab) activeSubTab.value = subTab
  activeTab.value = 'details'
}

const handleAddPolicy = (type?: InsuranceType) => {
  editingPolicy.value = null
  preSelectedType.value = type || null
  showPolicyForm.value = true
}
</script>

<template>
  <v-tabs v-model="activeTab" color="primary" density="compact">
    <v-tab value="overview">Overview</v-tab>
    <v-tab value="details">Item Details</v-tab>
    <v-tab value="calculator">Calculator</v-tab>
    <v-tab value="reports">Reports</v-tab>
  </v-tabs>

  <v-window v-model="activeTab">
    <v-window-item value="overview">
      <InsuranceOverviewTab
        @go-to-details="handleGoToDetails"
        @add-policy="handleAddPolicy()"
        @open-calculator="handleOpenCalculator"
      />
    </v-window-item>
    <v-window-item value="details">
      <InsuranceDetailsTab
        v-model:active-sub-tab="activeSubTab"
        @add-policy="handleAddPolicy"
        @edit-policy="handleEditPolicy"
        @delete-policy="handleDeletePolicy"
      />
    </v-window-item>
    <!-- ... other tabs ... -->
  </v-window>
</template>
```

### Sub-Tab Navigation (`InsuranceDetailsTab.vue`)

```vue
<script setup lang="ts">
const subTabs = [
  { value: 'life', label: 'Life', icon: 'mdi-heart-pulse', color: 'purple' },
  { value: 'health', label: 'Health', icon: 'mdi-hospital-box', color: 'blue' },
  { value: 'motor', label: 'Motor', icon: 'mdi-car', color: 'orange' },
  { value: 'home', label: 'Home', icon: 'mdi-home-outline', color: 'green' },
  { value: 'travel', label: 'Travel', icon: 'mdi-airplane', color: 'cyan' },
]
</script>

<template>
  <v-tabs v-model="activeSubTab" density="compact" color="secondary">
    <v-tab v-for="tab in subTabs" :key="tab.value" :value="tab.value">
      <v-icon :icon="tab.icon" size="18" class="mr-2" />
      {{ tab.label }}
    </v-tab>
  </v-tabs>

  <v-window v-model="activeSubTab">
    <v-window-item v-for="tab in subTabs" :key="tab.value" :value="tab.value">
      <PolicyTypeSubTab
        :type="tab.value"
        @add-policy="emit('add-policy', tab.value)"
        @edit-policy="emit('edit-policy', $event)"
        @delete-policy="emit('delete-policy', $event)"
      />
    </v-window-item>
  </v-window>
</template>
```

### Event Flow

```
User Action → Child Component → emit() → Parent (index.vue) → Handle Action

Example: Add Policy from Life sub-tab
1. User clicks "Add Policy" in PolicyTypeSubTab
2. PolicyTypeSubTab emits: @add-policy="emit('add-policy', 'life')"
3. InsuranceDetailsTab bubbles: @add-policy="emit('add-policy', $event)"
4. index.vue handles: handleAddPolicy('life')
5. Opens InsurancePolicyForm with type pre-selected to 'life'
```

---

## Router Configuration

### Current Routes (`src/router/index.ts`)

```typescript
// Main insurance route
{
  path: 'insurance',
  name: 'insurance',
  component: () => import('@/pages/dashboard/insurance/index.vue'),
}

// Legacy URL redirects (for backwards compatibility)
{ path: 'insurance/life', redirect: '/dashboard/insurance' }
{ path: 'insurance/health', redirect: '/dashboard/insurance' }
{ path: 'insurance/other', redirect: '/dashboard/insurance' }
{ path: 'insurance/calculator', redirect: '/dashboard/insurance' }
{ path: 'insurance/reports', redirect: '/dashboard/insurance' }
```

### Deleted Pages

The following pages were removed during restructuring:
- `src/pages/dashboard/insurance/life.vue`
- `src/pages/dashboard/insurance/health.vue`
- `src/pages/dashboard/insurance/other.vue`
- `src/pages/dashboard/insurance/calculator.vue`
- `src/pages/dashboard/insurance/reports.vue`

---

## Key Features

### 1. Policy Management
- Full CRUD for all 5 insurance types
- Type-specific fields (maturity for life, room rent for health, IDV for motor)
- Nominee management with share percentages
- Family member association
- Expired/cancelled policy collapsible section

### 2. Coverage Adequacy Calculator (HLV Method)
- Quick calculator on Calculator tab
- Full wizard dialog for detailed analysis
- Human Life Value (HLV) calculation
- Income replacement method
- 2025 medical inflation factors
- Coverage gap analysis with recommendations

### 3. Reports (Client-side)
- Coverage Summary by type
- Premium Analysis (annual breakdown)
- Tax Deductions (80C/80D/Both)
- Renewal Calendar (upcoming 60 days)
- CSV Export functionality
- Print support

### 4. Family View
- `familyMemberId` filter on all API endpoints
- Family coverage overview on frontend
- Per-member policy grouping

---

## Database Schema

### InsurancePolicy Model

```prisma
model InsurancePolicy {
  id                    String                    @id @default(cuid())
  userId                String
  familyMemberId        String?

  // Core fields
  policyNumber          String
  policyName            String
  type                  InsuranceType             // LIFE, HEALTH, MOTOR, HOME, TRAVEL
  provider              String
  status                InsurancePolicyStatus     @default(ACTIVE)
  sumAssured            Float
  premium               Float
  paymentFrequency      InsurancePaymentFrequency
  startDate             DateTime
  endDate               DateTime
  nextDueDate           DateTime?
  lastPremiumPaidDate   DateTime?

  // Life insurance specific
  maturityDate          DateTime?
  maturityAmount        Float?
  surrenderValue        Float?
  loanAvailable         Boolean                   @default(false)
  loanAmount            Float?

  // Health insurance specific
  coverType             String?                   // individual, family, floater
  roomRentLimit         Float?
  copayPercent          Float?
  waitingPeriod         Int?
  preExistingWaiting    Int?
  networkHospitals      Int?

  // Motor insurance specific
  vehicleNumber         String?
  vehicleType           String?
  vehicleModel          String?
  idvValue              Float?
  ncbPercent            Float?

  // Home insurance specific
  propertyType          String?
  propertyAddress       String?
  propertyValue         Float?
  contentsCover         Float?

  // Tax & metadata
  taxBenefit            TaxBenefitType?
  policyDocument        String?
  notes                 String?

  createdAt             DateTime                  @default(now())
  updatedAt             DateTime                  @updatedAt

  // Relations
  user                  User                      @relation(...)
  nominees              InsuranceNominee[]
}
```

### InsuranceNominee Model

```prisma
model InsuranceNominee {
  id                String   @id @default(cuid())
  policyId          String
  name              String
  relationship      String
  dateOfBirth       DateTime?
  sharePercent      Float    @default(100)
  isMinor           Boolean  @default(false)
  appointeeName     String?
  appointeeRelation String?
  phone             String?
  isPrimary         Boolean  @default(true)
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
  policy            InsurancePolicy @relation(...)
}
```

---

## API Response Examples

### GET /api/insurance/summary

```json
{
  "totalPolicies": 5,
  "lifeCoverage": 16000000,
  "healthCoverage": 9000000,
  "annualPremium": 183000,
  "upcomingRenewals": [
    {
      "id": "clx...",
      "policyName": "HDFC Click 2 Protect",
      "type": "LIFE",
      "endDate": "2026-03-31",
      "premium": 12000
    }
  ],
  "policiesByType": {
    "life": 3,
    "health": 4,
    "motor": 1,
    "home": 1,
    "travel": 1
  },
  "taxDeductions": {
    "section80C": 70000,
    "section80D": 70000
  }
}
```

### GET /api/insurance/coverage-analysis

```json
{
  "overall": {
    "score": 75,
    "status": "partial",
    "message": "Your coverage is adequate but could be improved"
  },
  "life": {
    "current": 16000000,
    "recommended": 20000000,
    "percentage": 80,
    "gap": 4000000
  },
  "health": {
    "current": 9000000,
    "recommended": 10000000,
    "percentage": 90,
    "gap": 1000000
  }
}
```

---

## Files Reference

### Created During Restructuring (January 11, 2026)

| File | Purpose |
|------|---------|
| `src/components/insurance/InsuranceOverviewTab.vue` | Overview tab content |
| `src/components/insurance/InsuranceDetailsTab.vue` | Sub-tab container |
| `src/components/insurance/PolicyTypeSubTab.vue` | Generic policy list |
| `src/components/insurance/InsuranceCalculatorTab.vue` | Calculator tab content |
| `src/components/insurance/InsuranceReportsTab.vue` | Reports tab content |

### Modified During Restructuring

| File | Changes |
|------|---------|
| `src/pages/dashboard/insurance/index.vue` | Restructured as tab container |
| `src/router/index.ts` | Added legacy URL redirects |
| `e2e/pages/insurance/index.ts` | Unified InsurancePage class |
| `e2e/tests/insurance/*.spec.ts` | Updated all 5 test files |

### Deleted During Restructuring

| File | Reason |
|------|--------|
| `src/pages/dashboard/insurance/life.vue` | Moved to sub-tab component |
| `src/pages/dashboard/insurance/health.vue` | Moved to sub-tab component |
| `src/pages/dashboard/insurance/other.vue` | Replaced by Motor/Home/Travel sub-tabs |
| `src/pages/dashboard/insurance/calculator.vue` | Moved to tab component |
| `src/pages/dashboard/insurance/reports.vue` | Moved to tab component |

---

## Testing

### Running E2E Tests

```bash
# Run all insurance tests
npm run test:e2e -- e2e/tests/insurance/

# Run specific test file
npm run test:e2e -- e2e/tests/insurance/01-navigation.spec.ts

# Run with UI mode
npm run test:e2e:ui -- e2e/tests/insurance/
```

### Test Coverage

- Navigation: Main tab navigation, sub-tab navigation, legacy URL redirects
- Life Insurance: Sub-tab display, form fields, policy management
- Health Insurance: Health-specific fields, form validation
- Calculator: HLV calculator visibility, calculator tab navigation
- Reports: Report types, export functionality, report switching

---

## Future Enhancements (Deferred)

| Feature | Priority | Notes |
|---------|----------|-------|
| `InsuranceClaim` Model | Low | Users rarely track claims |
| `InsurancePremiumPayment` Model | Medium | Policy-level tracking sufficient |
| `InsuranceRider` Model | Low | Can use notes field |
| Server-side HLV calculations | Low | Frontend calculator works well |
| Document upload | Medium | Store policy documents |
| Premium reminders | Medium | Email/push notifications |

---

**Last Updated**: January 11, 2026
**Restructured to**: Single-page tab-based architecture
