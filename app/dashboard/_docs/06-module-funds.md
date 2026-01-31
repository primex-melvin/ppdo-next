# Module: Funds

> Documentation for Trust Funds, Special Education Funds, Special Health Funds, and 20% Development Fund

---

## Overview

The Funds modules manage special purpose funds for the Provincial Planning and Development Office:

| Fund Type | Description |
|-----------|-------------|
| **Trust Funds** | Project organs and trust fund management |
| **Special Education Funds (SEF)** | Education-specific allocations |
| **Special Health Funds (SHF)** | Health-specific allocations |
| **20% Development Fund** | 20% of IRA for development projects |

All funds follow a similar pattern: **Fiscal Year → Fund Items → Breakdowns**

---

## Common Architecture

All fund modules share the same architecture:

```
/fund-module
├── page.tsx                    # Year selection landing
├── [year]/
│   ├── page.tsx                # Fund items for year
│   ├── components/             # Year-specific components
│   └── [slug]/
│       └── page.tsx            # Specific fund detail
```

---

## Trust Funds

### Route Structure
```
/dashboard/trust-funds
/dashboard/trust-funds/[year]
/dashboard/trust-funds/[year]/[slug]
```

### Data Model
```typescript
interface TrustFund {
  _id: Id<"trustFunds">;
  _creationTime: number;
  year: number;
  name: string;
  description?: string;
  received: number;         // Total amount received
  utilized: number;         // Total amount utilized
  balance: number;          // received - utilized
  utilizationRate: number;  // (utilized / received) * 100
  isActive: boolean;
}

interface TrustFundBreakdown {
  _id: Id<"trustFundBreakdowns">;
  trustFundId: Id<"trustFunds">;
  description: string;
  amount: number;
  date: number;
  reference?: string;
}
```

### Components
```
trust-funds/
├── page.tsx
└── [year]/
    ├── page.tsx
    └── components/
        ├── TrustFundForm.tsx
        ├── TrustFundsTable.tsx
        ├── TrustFundStatistics.tsx
        ├── TrustFundTableToolbar.tsx
        └── hooks/
            ├── useTrustFundData.ts
            └── useTrustFundMutations.ts
```

### Statistics Displayed
- **Total Received**: Sum of all fund receipts
- **Total Utilized**: Sum of all expenditures
- **Total Balance**: Available funds
- **Avg Utilization Rate**: Average utilization across funds
- **Trust Fund Count**: Number of funds
- **Total Items**: Number of breakdown items

---

## Special Education Funds (SEF)

### Route Structure
```
/dashboard/special-education-funds
/dashboard/special-education-funds/[year]
/dashboard/special-education-funds/[year]/[slug]
```

### Data Model
```typescript
interface SpecialEducationFund {
  _id: Id<"specialEducationFunds">;
  _creationTime: number;
  year: number;
  name: string;
  description?: string;
  received: number;
  utilized: number;
  balance: number;
  utilizationRate: number;
  isActive: boolean;
}

interface SpecialEducationFundBreakdown {
  _id: Id<"specialEducationFundBreakdowns">;
  specialEducationFundId: Id<"specialEducationFunds">;
  description: string;
  amount: number;
  date: number;
  reference?: string;
}
```

### Purpose
SEF is specifically for education-related projects:
- School buildings
- Educational materials
- Teacher training
- Scholarship programs
- Other education initiatives

---

## Special Health Funds (SHF)

### Route Structure
```
/dashboard/special-health-funds
/dashboard/special-health-funds/[year]
/dashboard/special-health-funds/[year]/[slug]
```

### Data Model
```typescript
interface SpecialHealthFund {
  _id: Id<"specialHealthFunds">;
  _creationTime: number;
  year: number;
  name: string;
  description?: string;
  received: number;
  utilized: number;
  balance: number;
  utilizationRate: number;
  isActive: boolean;
}

interface SpecialHealthFundBreakdown {
  _id: Id<"specialHealthFundBreakdowns">;
  specialHealthFundId: Id<"specialHealthFunds">;
  description: string;
  amount: number;
  date: number;
  reference?: string;
}
```

### Purpose
SHF is specifically for health-related projects:
- Health facilities
- Medical equipment
- Health programs
- Vaccination drives
- Other health initiatives

---

## 20% Development Fund

### Route Structure
```
/dashboard/20_percent_df
/dashboard/20_percent_df/[year]
/dashboard/20_percent_df/[year]/[slug]
```

### Description
The 20% Development Fund represents the 20% of the Internal Revenue Allotment (IRA) that must be allocated to development projects according to the Local Government Code.

### Components
```
20_percent_df/
├── page.tsx
└── [year]/
    ├── page.tsx
    ├── components/
    │   └── TwentyPercentDFYearHeader.tsx
    └── [slug]/
        └── page.tsx
```

---

## Shared Components

### FiscalYearCard
Used across all fund modules to display year statistics.

**Props:**
```typescript
interface FiscalYearCardProps {
  fiscalYear: FiscalYearWithStats;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onOpen: () => void;
  onDelete: (e: React.MouseEvent) => void;
  accentColor: string;
  statsContent: React.ReactNode;
  expandedContent: React.ReactNode;
  openButtonLabel?: string;
}
```

### FiscalYearHeader
Common header for year selection pages.

**Features:**
- Title and subtitle
- Add year button
- Open latest year button
- Year count indicator

### FiscalYearModal
Modal for creating new fiscal years.

### FiscalYearDeleteDialog
Confirmation dialog for year deletion.

---

## Fund Statistics Calculation

```typescript
// Common calculation pattern across all funds
const yearStats = useMemo(() => {
  return fiscalYears.map((year) => {
    const yearFunds = funds.filter(f => f.year === year.year);
    const yearBreakdowns = breakdowns.filter(b => 
      yearFunds.some(f => f._id === b.fundId)
    );

    const totalReceived = yearFunds.reduce((sum, f) => sum + f.received, 0);
    const totalUtilized = yearFunds.reduce((sum, f) => sum + f.utilized, 0);
    const totalBalance = yearFunds.reduce((sum, f) => sum + f.balance, 0);
    const avgUtilizationRate = yearFunds.length > 0
      ? yearFunds.reduce((sum, f) => sum + f.utilizationRate, 0) / yearFunds.length
      : 0;

    return {
      ...year,
      stats: {
        fundCount: yearFunds.length,
        totalItems: yearBreakdowns.length,
        totalReceived,
        totalUtilized,
        totalBalance,
        avgUtilizationRate,
      },
    };
  });
}, [fiscalYears, funds, breakdowns]);
```

---

## Permission Matrix

| Action | super_admin | admin | user | inspector |
|--------|-------------|-------|------|-----------|
| View Landing | ✅ | ✅ | ✅ | ❌ |
| View Year | ✅ | ✅ | ✅ | ❌ |
| Create Fund | ✅ | ✅ | ❌ | ❌ |
| Edit Fund | ✅ | ✅ | ❌ | ❌ |
| Delete Fund | ✅ | ✅ | ❌ | ❌ |
| Add Breakdown | ✅ | ✅ | ✅ | ❌ |
| Edit Breakdown | ✅ | ✅ | ✅ | ❌ |
| Delete Breakdown | ✅ | ✅ | ❌ | ❌ |

---

## Convex API Endpoints

### Trust Funds
```typescript
// Queries
api.trustFunds.list                    // List all trust funds
api.trustFunds.getByYear               // Get funds for year
api.trustFunds.getById                 // Get single fund
api.trustFundBreakdowns.getBreakdowns  // Get breakdowns

// Mutations
api.trustFunds.create
api.trustFunds.update
api.trustFunds.remove
api.trustFundBreakdowns.create
api.trustFundBreakdowns.update
api.trustFundBreakdowns.remove
```

### Special Education Funds
```typescript
// Queries
api.specialEducationFunds.list
api.specialEducationFunds.getByYear
api.specialEducationFundBreakdowns.getBreakdowns

// Mutations
api.specialEducationFunds.create
api.specialEducationFunds.update
api.specialEducationFunds.remove
```

### Special Health Funds
```typescript
// Queries
api.specialHealthFunds.list
api.specialHealthFunds.getByYear
api.specialHealthFundBreakdowns.getBreakdowns

// Mutations
api.specialHealthFunds.create
api.specialHealthFunds.update
api.specialHealthFunds.remove
```

---

## UI Patterns

### Fund Card Display
```
┌─────────────────────────────────────────┐
│  2025                    [▼] [Open] [×] │
├─────────────────────────────────────────┤
│  Items: 15      Funds: 5                │
├─────────────────────────────────────────┤
│  (when expanded)                        │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐   │
│  │ Received│ │Utilized │ │  Avg %  │   │
│  │ ₱1.5M   │ │ ₱1.2M   │ │  80%    │   │
│  └─────────┘ └─────────┘ └─────────┘   │
│                                         │
│  Balance Overview                       │
│     ₱300,000                            │
│     Available Balance                   │
└─────────────────────────────────────────┘
```

---

## Related Documentation

- [Data Flow & Convex](./08-data-flow.md) - Backend integration
- [Access Control & RBAC](./09-access-control.md) - Permissions
- [Module: Projects](./04-module-projects.md) - Similar pattern
