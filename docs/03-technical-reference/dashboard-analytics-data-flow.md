# Dashboard Analytics Data Flow Documentation

## Overview

This document explains how the PPDO Dashboard at `http://localhost:3000/dashboard/YYYY?fund=budget` queries and processes data for display.

**Route Pattern**: `/dashboard/[year]`  
**Query Parameters**: `?fund=budget` (optional, defaults to "budget")  
**Fund Types**: `budget` | `trust` | `twenty-percent-df` | `education` | `health`

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         URL: /dashboard/2025?fund=budget                     │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  Next.js App Router                                                         │
│  app/(private)/dashboard/[year]/page.tsx                                    │
│  - React Server Component (RSC) entry point                                 │
│  - Reads URL params and searchParams                                        │
│  - Passes year to DashboardContent                                          │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  Client Components ("use client")                                           │
│  DashboardContent → KPICardsRow, Charts, Tables                             │
│  - useDashboardFilters hook manages URL state                               │
│  - Convex useQuery hooks fetch data                                         │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  Convex Backend                                                             │
│  convex/dashboard.ts → getDashboardAnalytics()                              │
│  - Queries multiple tables based on fundType                                │
│  - Normalizes data from different schemas                                   │
│  - Applies filters and aggregations                                         │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## File Structure

### Frontend (Next.js + React)

| File | Purpose |
|------|---------|
| `app/(private)/dashboard/[year]/page.tsx` | Route entry point, Server Component |
| `components/analytics/DashboardContent.tsx` | Main data consumer, Client Component |
| `components/analytics/DashboardFilters.tsx` | Filter UI controls |
| `hooks/useDashboardFilters.ts` | URL state management for filters |
| `components/ppdo/dashboard/summary/KPICardsRow.tsx` | KPI display component |
| `components/analytics/EnhancedBudgetChart.tsx` | Budget visualization |
| `components/analytics/TimeSeriesChart.tsx` | Time-based trends |
| `components/analytics/DepartmentBreakdownChart.tsx` | Department distribution |
| `components/analytics/StatusDistributionChart.tsx` | Status pie chart |

### Backend (Convex)

| File | Purpose |
|------|---------|
| `convex/dashboard.ts` | Main analytics query (`getDashboardAnalytics`) |
| `convex/fiscalYears.ts` | Fiscal year lookups |
| `convex/schema.ts` | Database schema definitions |

---

## Data Flow Step-by-Step

### Step 1: Route Entry (Server Component)

**File**: `app/(private)/dashboard/[year]/page.tsx`

```typescript
export default function AnalyticsPage({ 
  params 
}: { 
  params: Promise<{ year: string }> 
}) {
  const { year } = use(params);
  const { filters, updateFilter, resetFilters } = useDashboardFilters();

  return (
    <DashboardContent filters={filters} year={year} />
  );
}
```

**Key Points**:
- Uses Next.js 15+ `use()` hook to unwrap params Promise
- `useDashboardFilters()` reads URL search params (including `?fund=budget`)
- Passes `year` and `filters` to `DashboardContent`

---

### Step 2: Filter State Management

**File**: `hooks/useDashboardFilters.ts`

The hook manages dashboard filters in URL query parameters for shareability:

```typescript
export interface DashboardFilters {
    fiscalYearId?: Id<"fiscalYears">;
    departmentIds?: Id<"departments">[];
    officeIds?: string[];
    startDate?: number;
    endDate?: number;
    months?: number[];
    quarter?: number;
    projectStatuses?: string[];
    budgetStatuses?: string[];
    searchTerm?: string;
    sortBy?: string;
    sortOrder?: "asc" | "desc";
    fundType?: "budget" | "trust" | "twenty-percent-df" | "education" | "health";
}
```

**URL Parameter Mapping**:

| Filter | URL Key | Example |
|--------|---------|---------|
| fundType | `fund` | `?fund=budget` |
| fiscalYearId | `fy` | `?fy=kx8c2...` |
| departmentIds | `depts` | `?depts=id1,id2` |
| officeIds | `offices` | `?offices=OFF001,OFF002` |
| startDate | `start` | `?start=1704067200000` |
| endDate | `end` | `?end=1706745599999` |
| months | `months` | `?months=1,2,3` |
| quarter | `q` | `?q=1` |
| projectStatuses | `ps` | `?ps=ongoing,completed` |
| budgetStatuses | `bs` | `?bs=active` |
| searchTerm | `search` | `?search=infrastructure` |

---

### Step 3: Dashboard Content - Data Fetching

**File**: `components/analytics/DashboardContent.tsx`

```typescript
export function DashboardContent({ filters, year }: DashboardContentProps) {
    // 1. Get fiscal year ID from year param
    const fiscalYears = useQuery(api.fiscalYears.list, {});
    
    const fiscalYearId = filters.fiscalYearId || (
        year && fiscalYears
            ? fiscalYears.find(fy => fy.year === parseInt(year))?._id
            : undefined
    );

    // 2. Build query arguments
    const queryArgs = {
        ...filters,
        fiscalYearId,
        dateRange: (startDate && endDate) 
            ? { start: startDate, end: endDate } 
            : undefined,
    };

    // 3. Main analytics query
    const analytics = useQuery(
        api.dashboard.getDashboardAnalytics,
        queryArgs
    );

    // 4. Render components with data
    return (
        <>
            <KPICardsRow metrics={analytics.metrics} />
            <EnhancedBudgetChart data={analytics.chartData.budgetOverview} />
            <TimeSeriesChart data={analytics.timeSeriesData} />
            ...
        </>
    );
}
```

---

### Step 4: Backend Query - Fund Type Routing

**File**: `convex/dashboard.ts`

The `getDashboardAnalytics` query handles different fund types by routing to different tables:

```typescript
const fundType = args.fundType || "budget";

if (fundType === "trust") {
    // Trust Funds
    const trustFunds = await ctx.db.query("trustFunds").collect();
    rawProjects = trustFunds;
    rawBudgetItems = trustFunds;
    
} else if (fundType === "twenty-percent-df") {
    const dfProjects = await ctx.db.query("twentyPercentDF").collect();
    rawProjects = dfProjects;
    rawBudgetItems = dfProjects;
    
} else if (fundType === "education") {
    const sefProjects = await ctx.db.query("specialEducationFunds").collect();
    rawProjects = sefProjects;
    rawBudgetItems = sefProjects;
    
} else if (fundType === "health") {
    const shfProjects = await ctx.db.query("specialHealthFunds").collect();
    rawProjects = shfProjects;
    rawBudgetItems = shfProjects;
    
} else {
    // Default "budget" - Uses separate tables
    rawProjects = await ctx.db.query("projects").collect();
    rawBudgetItems = await ctx.db.query("budgetItems").collect();
}
```

---

### Step 5: Data Normalization

Different fund types have different schema fields. The query normalizes them into a common structure:

**Budget Fund (Default)**:
```typescript
allProjects = rawProjects.map(p => ({
    _id: p._id,
    year: p.year,
    departmentId: p.departmentId,
    implementingOffice: p.implementingOffice,
    particulars: p.particulars,
    status: p.status,
    totalBudgetAllocated: p.totalBudgetAllocated || 0,
    obligatedBudget: p.obligatedBudget || 0,
    totalBudgetUtilized: p.totalBudgetUtilized || 0,
}));
```

**Trust Funds**:
```typescript
allProjects = rawProjects.map(t => ({
    _id: t._id,
    year: t.year || t.fiscalYear,
    departmentId: t.departmentId,
    implementingOffice: t.officeInCharge,        // Field mapping
    particulars: t.projectTitle,                 // Field mapping
    status: t.status,
    totalBudgetAllocated: t.received || 0,       // Field mapping
    obligatedBudget: t.obligatedPR || 0,         // Field mapping
    totalBudgetUtilized: t.utilized || 0,        // Field mapping
}));
```

---

### Step 6: Filtering Logic

```typescript
// Apply all filters
const filters = buildFilters(args, targetYear);
allProjects = applyProjectFilters(allProjects, filters, allDepartments);
allBudgetItems = applyBudgetFilters(allBudgetItems, filters, allDepartments);

// Search term filtering
if (args.searchTerm) {
    const searchLower = args.searchTerm.toLowerCase().trim();
    allProjects = allProjects.filter(p =>
        p.particulars.toLowerCase().includes(searchLower) ||
        (p.implementingOffice && p.implementingOffice.toLowerCase().includes(searchLower))
    );
}
```

---

### Step 7: Aggregation & Metrics Calculation

```typescript
// Calculate all metrics from filtered data
const metrics = calculateMetrics(allProjects, allBudgetItems, allBreakdowns);

const departmentBreakdown = calculateDepartmentBreakdown(
    allBudgetItems, allProjects, allDepartments
);

const officeBreakdown = calculateOfficeBreakdown(allProjects);

const timeSeriesData = calculateTimeSeries(allProjects, allBudgetItems, filters);

const chartData = buildChartData(
    allProjects, allBudgetItems, allCategories, allDepartments
);
```

---

## Response Structure

The `getDashboardAnalytics` query returns:

```typescript
{
    metrics: {
        totalProjects: number;
        ongoingProjects: number;
        completedProjects: number;
        delayedProjects: number;
        totalBudgetAllocated: number;
        totalBudgetUtilized: number;
        averageUtilizationRate: number;
        totalObligations: number;
    },
    departmentBreakdown: Array<{
        departmentId: string;
        departmentName: string;
        projectCount: number;
        budgetAllocated: number;
        budgetUtilized: number;
    }>,
    officeBreakdown: Array<{
        officeName: string;
        projectCount: number;
        totalBudget: number;
    }>,
    timeSeriesData: Array<{
        period: string;
        allocated: number;
        utilized: number;
        obligated: number;
    }>,
    chartData: {
        budgetOverview: { allocated: number; utilized: number; obligated: number };
        statusDistribution: Array<{ status: string; count: number }>;
    },
    recentActivities: Array<{
        id: string;
        type: string;
        description: string;
        timestamp: number;
    }>,
    topCategories: Array<{
        categoryId: string;
        categoryName: string;
        totalBudget: number;
    }>,
    filters: {
        appliedFilters: DashboardFilters;
        resultCount: { projects: number; budgetItems: number };
    }
}
```

---

## Database Tables by Fund Type

| Fund Type | Projects Table | Breakdowns Table | Schema Fields |
|-----------|---------------|------------------|---------------|
| `budget` | `projects` | `govtProjectBreakdowns` | `particulars`, `implementingOffice` |
| `trust` | `trustFunds` | `trustFundBreakdowns` | `projectTitle`, `officeInCharge` |
| `twenty-percent-df` | `twentyPercentDF` | `twentyPercentDFBreakdowns` | `projectTitle`, `implementingOffice` |
| `education` | `specialEducationFunds` | `specialEducationFundBreakdowns` | `projectTitle`, `implementingOffice` |
| `health` | `specialHealthFunds` | `specialHealthFundBreakdowns` | `projectTitle`, `implementingOffice` |

---

## Key Implementation Notes

### 1. Fund Type Double-Mapping
For non-budget funds, the same entity is mapped to both `projects` and `budgetItems` arrays because:
- The dashboard UI expects separate project counts and budget aggregations
- These fund types don't have a separate "budget item" concept
- The entity itself contains both project metadata and budget information

### 2. Real-time Updates
All data is fetched via Convex `useQuery`, providing:
- Automatic real-time synchronization
- Optimistic updates on mutations
- Subscription-based re-fetching

### 3. Performance Considerations
- Data is fetched once per page load via `.collect()` queries
- All filtering happens in-memory after fetch
- For large datasets, consider adding pagination or server-side filtering

### 4. Schema Field Mapping
Different fund types use different field names for similar concepts:

| Concept | Budget | Trust Funds | Others |
|---------|--------|-------------|--------|
| Name | `particulars` | `projectTitle` | `projectTitle` |
| Office | `implementingOffice` | `officeInCharge` | `implementingOffice` |
| Budget | `totalBudgetAllocated` | `received` | `totalBudgetAllocated` |
| Obligated | `obligatedBudget` | `obligatedPR` | `obligatedBudget` |
| Utilized | `totalBudgetUtilized` | `utilized` | `totalBudgetUtilized` |

---

## Example API Calls

### Basic Request (Budget Fund)
```typescript
const analytics = useQuery(api.dashboard.getDashboardAnalytics, {
    fundType: "budget",
    fiscalYearId: "kx8c2...",
});
```

### With Filters
```typescript
const analytics = useQuery(api.dashboard.getDashboardAnalytics, {
    fundType: "trust",
    fiscalYearId: "kx8c2...",
    departmentIds: ["dept1", "dept2"],
    projectStatus: ["ongoing", "completed"],
    dateRange: { start: 1704067200000, end: 1706745599999 },
    searchTerm: "infrastructure",
});
```

---

## Troubleshooting

### Issue: Empty dashboard data
**Check**:
1. Is `fundType` correctly set in URL (`?fund=budget`)?
2. Does the fiscal year exist in `fiscalYears` table?
3. Are there records in the underlying tables for that fund type?

### Issue: Incorrect field mappings
**Check**:
1. Schema definitions in `convex/schema.ts`
2. Normalization logic in `convex/dashboard.ts`
3. Field name differences between fund types

### Issue: Filters not applying
**Check**:
1. `useDashboardFilters` is parsing URL params correctly
2. Filter arguments are being passed to `getDashboardAnalytics`
3. Filter logic in `buildFilters()` and `applyProjectFilters()`

---

## Related Documentation

- [Convex Schema](./convex-schema.md)
- [Fund Management](./fund-management.md)
- [Dashboard UI Components](./dashboard-ui-components.md)
- [Filter System](./filter-system.md)
