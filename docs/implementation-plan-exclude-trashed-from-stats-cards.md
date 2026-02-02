# Implementation Plan: Exclude Trashed Items from Statistics Cards

## Executive Summary

After thorough analysis, the statistics cards in table headers for **budget, project, breakdown, 20% DF, trust fund, special health, and special education** already have proper filtering in place. However, there are some **edge cases and verification steps** needed to ensure data consistency.

## Current Status Analysis

### ✅ Already Filtering Trashed Items (NO ACTION NEEDED)

#### 1. Breakdown Detail Pages Statistics
| Page | Query | Filter Status |
|------|-------|---------------|
| Project Breakdowns | `api.govtProjects.getProjectBreakdowns` | ✅ Filters `isDeleted` |
| 20% DF Breakdowns | `api.twentyPercentDFBreakdowns.list` | ✅ Filters `isDeleted` |
| Trust Fund Breakdowns | `api.trustFundBreakdowns.getBreakdowns` | ✅ Filters `isDeleted` |
| SEF Breakdowns | `api.specialEducationFundBreakdowns.getBreakdowns` | ✅ Filters `isDeleted` |
| SHF Breakdowns | `api.specialHealthFundBreakdowns.getBreakdowns` | ✅ Filters `isDeleted` |

#### 2. Frontend Hooks
| Hook | File | Filter Status |
|------|------|---------------|
| `useEntityStats` | `lib/hooks/useEntityStats.ts:30` | ✅ Filters `isDeleted` |
| `useEntityMetadata` | `lib/hooks/useEntityStats.ts:140` | ✅ Filters `isDeleted` |

#### 3. Landing Page List Queries
| Query | File | Filter Status |
|-------|------|---------------|
| `trustFunds.list` | `convex/trustFunds.ts:19` | ✅ Filters `isDeleted` |
| `budgetItems.list` | `convex/budgetItems.ts:26` | ✅ Filters `isDeleted` |
| `projects.list` | `convex/projects.ts:33,42,48` | ✅ Filters `isDeleted` |

#### 4. Statistics Queries
| Query | File | Filter Status |
|-------|------|---------------|
| `trustFunds.getStatistics` | `convex/trustFunds.ts:71` | ✅ Filters `isDeleted` |

### ⚠️ REQUIRES FIXING

#### 1. Dashboard Analytics (FIXED IN PREVIOUS COMMIT)
| Query | File | Status |
|-------|------|--------|
| `getSummaryData` | `convex/dashboard.ts:35-37` | ✅ FIXED |
| `getDashboardAnalytics` | `convex/dashboard.ts:214-257` | ✅ FIXED |
| `getDepartmentHierarchy` | `convex/dashboard.ts:434` | ✅ FIXED |
| `getTimeSeriesData` | `convex/dashboard.ts:548-555` | ✅ FIXED |
| `searchAutocomplete` | `convex/dashboard.ts:680,703` | ✅ FIXED |

---

## Verification Checklist

### Phase 1: Verify Backend Queries are Filtering

Run these verification queries in Convex dashboard:

```typescript
// Test 1: Count trashed vs active projects
const allProjects = await ctx.db.query("projects").collect();
const trashedProjects = allProjects.filter(p => p.isDeleted);
const activeProjects = allProjects.filter(p => !p.isDeleted);
console.log(`Total: ${allProjects.length}, Trashed: ${trashedProjects.length}, Active: ${activeProjects.length}`);

// Test 2: Count trashed vs active budget items
const allBudgetItems = await ctx.db.query("budgetItems").collect();
const trashedBudgetItems = allBudgetItems.filter(b => b.isDeleted);
const activeBudgetItems = allBudgetItems.filter(b => !b.isDeleted);
console.log(`Total: ${allBudgetItems.length}, Trashed: ${trashedBudgetItems.length}, Active: ${activeBudgetItems.length}`);

// Test 3: Count trashed vs active breakdowns
const allBreakdowns = await ctx.db.query("govtProjectBreakdowns").collect();
const trashedBreakdowns = allBreakdowns.filter(b => b.isDeleted);
const activeBreakdowns = allBreakdowns.filter(b => !b.isDeleted);
console.log(`Total: ${allBreakdowns.length}, Trashed: ${trashedBreakdowns.length}, Active: ${activeBreakdowns.length}`);
```

### Phase 2: Verify Frontend Display Matches

Check each page type to ensure displayed counts match:

| Page Type | URL Pattern | Statistics Card | Verification |
|-----------|-------------|-----------------|--------------|
| Project Landing | `/dashboard/project` | Fiscal Year Cards | Compare `projectCount` with visible projects |
| Project Detail | `/dashboard/project/YYYY/XXX` | EntityOverviewCards | Compare `breakdownCounts` with table rows |
| Project Breakdowns | `/dashboard/project/YYYY/XXX/ZZZ` | StatusChainCard, BreakdownStatsAccordion | Compare `breakdownCount` with table rows |
| Trust Fund Landing | `/dashboard/trust-funds` | Fiscal Year Cards | Compare `trustFundCount` with visible funds |
| Trust Fund Detail | `/dashboard/trust-funds/YYYY/XXX` | EntityOverviewCards, BreakdownStatsAccordion | Compare counts with table rows |
| 20% DF Landing | `/dashboard/20_percent_df` | Fiscal Year Cards | Compare `fundCount` with visible funds |
| 20% DF Detail | `/dashboard/20_percent_df/YYYY/XXX` | EntityOverviewCards, BreakdownStatsAccordion | Compare counts with table rows |
| SEF Landing | `/dashboard/special-education-funds` | Fiscal Year Cards | Compare `fundCount` with visible funds |
| SEF Detail | `/dashboard/special-education-funds/YYYY/XXX` | EntityOverviewCards, BreakdownStatsAccordion | Compare counts with table rows |
| SHF Landing | `/dashboard/special-health-funds` | Fiscal Year Cards | Compare `fundCount` with visible funds |
| SHF Detail | `/dashboard/special-health-funds/YYYY/XXX` | EntityOverviewCards, BreakdownStatsAccordion | Compare counts with table rows |

### Phase 3: Test Data Integrity

Create a test scenario:
1. Note current statistics on a page
2. Move an item to trash
3. Verify statistics update immediately (decrease by 1)
4. Restore item from trash
5. Verify statistics update immediately (increase by 1)

---

## Potential Issues Found

### Issue 1: Calculated Fields from Parent Records

**Problem**: Some statistics use parent record calculated fields that may include trashed breakdowns in their calculation.

**Example**: 
- `project.totalBudgetAllocated` is a calculated field
- If the calculation includes trashed breakdowns, the statistics will be wrong

**Solution**: Verify aggregation functions in Convex:

```typescript
// convex/lib/projectAggregation.ts
export async function recalculateProjectMetrics(ctx, projectId) {
  const breakdowns = await ctx.db
    .query("govtProjectBreakdowns")
    .withIndex("projectId", q => q.eq("projectId", projectId))
    .filter(q => q.neq(q.field("isDeleted"), true)) // ✅ Ensure this exists
    .collect();
  
  // Calculate metrics from active breakdowns only
  const totalBudgetAllocated = breakdowns.reduce((sum, b) => sum + (b.allocatedBudget || 0), 0);
  
  await ctx.db.patch(projectId, { totalBudgetAllocated });
}
```

**Files to Check**:
- `convex/lib/projectAggregation.ts`
- `convex/lib/budgetAggregation.ts`
- `convex/lib/fundAggregation.ts`
- `convex/lib/twentyPercentDFAggregation.ts`

### Issue 2: Client-Side Filtering Redundancy

**Problem**: Some statistics may be filtered twice (backend and frontend), which is good for safety but could mask backend issues.

**Current Flow**:
1. Backend query filters trashed items
2. Frontend hook filters again
3. Statistics displayed

**Recommendation**: Keep both filters for defense in depth, but verify backend is doing its job.

### Issue 3: Dashboard Analytics (FIXED)

**Status**: ✅ Fixed in previous commit to `convex/dashboard.ts`

The dashboard analytics query was NOT filtering trashed items. This has been fixed.

---

## Testing Protocol

### Step 1: Create Test Data
```powershell
# Create a project with 3 breakdowns
# Move 1 breakdown to trash
# Verify statistics show 2 breakdowns (not 3)
```

### Step 2: Verify Each Fund Type

| Fund Type | Create | Trash | Verify Stats |
|-----------|--------|-------|--------------|
| Budget Projects | 3 breakdowns | 1 breakdown | Shows 2 |
| Trust Funds | 3 breakdowns | 1 breakdown | Shows 2 |
| 20% DF | 3 breakdowns | 1 breakdown | Shows 2 |
| SEF | 3 breakdowns | 1 breakdown | Shows 2 |
| SHF | 3 breakdowns | 1 breakdown | Shows 2 |

### Step 3: Check Landing Page Cards

For each fiscal year card, verify:
- Project count matches visible projects
- Budget totals exclude trashed items
- Breakdown counts are accurate

---

## Files Summary

### Backend (Convex)
| File | Lines | Status |
|------|-------|--------|
| `convex/dashboard.ts` | Multiple | ✅ FIXED |
| `convex/govtProjects.ts` | 664, 669 | ✅ Already filtering |
| `convex/trustFundBreakdowns.ts` | 63 | ✅ Already filtering |
| `convex/specialEducationFundBreakdowns.ts` | 63 | ✅ Already filtering |
| `convex/specialHealthFundBreakdowns.ts` | 63 | ✅ Already filtering |
| `convex/twentyPercentDFBreakdowns.ts` | 240 | ✅ Already filtering |
| `convex/trustFunds.ts` | 19, 71 | ✅ Already filtering |
| `convex/budgetItems.ts` | 26 | ✅ Already filtering |
| `convex/projects.ts` | 33, 42, 48 | ✅ Already filtering |

### Frontend (React)
| File | Lines | Status |
|------|-------|--------|
| `lib/hooks/useEntityStats.ts` | 30, 140 | ✅ Already filtering |
| `components/ppdo/breakdown/shared/EntityOverviewCards.tsx` | Consumer | ✅ Safe |
| `components/ppdo/breakdown/shared/BreakdownStatsAccordion.tsx` | Consumer | ✅ Safe |
| `components/ppdo/dashboard/summary/KPICardsRow.tsx` | Consumer | ✅ Safe |

---

## Conclusion

The statistics cards are **already properly filtering trashed items** through multiple layers:

1. **Backend queries** filter at the database level
2. **Frontend hooks** filter as a safety net
3. **The dashboard.ts fix** ensures analytics queries also filter

**Next Steps**:
1. Deploy the dashboard.ts fix (already done)
2. Run verification tests
3. Monitor for any discrepancies

If discrepancies persist after verification, investigate:
- Calculated fields in parent records
- Aggregation functions that may cache old values
- Client-side state that may not refresh
