# Consolidation Plan: DRY Principle Implementation

## Agent Team: Senior QA Consolidation Specialists

Our partner company's senior agents have conducted a thorough audit of the codebase and identified significant redundancy that violates the DRY principle. This plan outlines the strategy to consolidate components while maintaining full backward compatibility.

---

## Executive Summary

### Current State
- **Statistics Components**: 5 implementations with 60-80% code duplication
- **Table Components**: 4+ major table implementations with overlapping functionality
- **Currency Formatting**: Duplicated across 15+ files
- **Status Counting Logic**: Identical logic in multiple components

### Target State
- **Single Statistics Component**: One configurable component for all use cases
- **Unified Table Infrastructure**: Shared hooks and utilities
- **Centralized Formatters**: Single source of truth for formatting
- **Composable Architecture**: Mix and match features without duplication

---

## Phase 1: Statistics Components Consolidation

### 1.1 Current Redundancy Analysis

| Component | Uses StandardStatisticsGrid | Duplicated Logic | Lines |
|-----------|---------------------------|------------------|-------|
| BudgetStatistics | ❌ No | Currency, Status counts, Grid layout | 148 |
| TwentyPercentDFStatistics | ❌ No | Currency, Status counts, Grid layout | 135 |
| FundsStatistics | ✅ Yes | None (uses shared) | 92 |
| ProjectSummaryStats | ✅ Yes | None (uses shared) | 89 |
| BreakdownStatistics | ✅ Yes | None (uses shared) | 53 |

### 1.2 The Problem

**BudgetStatistics** and **TwentyPercentDFStatistics** have identical:
```typescript
// 1. Currency formatter (duplicated)
const currency = useMemo(() => new Intl.NumberFormat("en-PH", ...), []);

// 2. Status counting logic (duplicated)
const statusCounts = useMemo(() => {
  const counts = { completed: 0, ongoing: 0, delayed: 0, not_available: 0 };
  items.forEach((item) => { /* identical logic */ });
  return counts;
}, [items]);

// 3. Status config (duplicated)
const statusConfig = [
  { key: 'completed', label: 'Completed', dotColor: 'bg-zinc-700' },
  { key: 'ongoing', label: 'Ongoing', dotColor: 'bg-zinc-600' },
  { key: 'delayed', label: 'Delayed', dotColor: 'bg-zinc-500' },
];

// 4. Project breakdown JSX (duplicated)
const projectBreakdown = (
  <div className="mt-3 flex flex-col gap-1 text-xs text-zinc-500 dark:text-zinc-400">
    {statusConfig.map((status) => { /* identical JSX */ })}
    {/* Divider and Total */}
  </div>
);

// 5. Grid layout (duplicated)
<section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6 no-print">
  {/* Same 3-column layout */}
</section>
```

### 1.3 Consolidation Strategy

**Option A: Full Consolidation (RECOMMENDED)**

Create a single `EntityStatistics` component that replaces all variants:

```typescript
// components/ppdo/shared/EntityStatistics.tsx
interface EntityStatisticsProps {
  // Core data
  totalAllocated: number;
  totalUtilized: number;
  totalObligated: number;
  averageUtilizationRate: number;
  totalItems: number;
  
  // Status data
  statusCounts: Record<string, number>;
  statusConfig: StatusConfig[];
  
  // Customization
  labels?: {
    allocated?: string;
    utilized?: string;
    obligated?: string;
    utilizationRate?: string;
    totalItems?: string;
  };
  
  // Optional features
  showBreakdown?: boolean;
  ariaLabel?: string;
}
```

**Migration Path:**
1. Create `EntityStatistics` component
2. Update BudgetStatistics to be a thin wrapper:
   ```typescript
   export function BudgetStatistics(props: BudgetStatisticsProps) {
     const statusCounts = useCalculateStatusCounts(props.items);
     return (
       <EntityStatistics
         {...props}
         totalItems={props.totalProjects}
         statusCounts={statusCounts}
         statusConfig={DEFAULT_PROJECT_STATUS_CONFIG}
         labels={{ totalItems: "Total Particulars" }}
       />
     );
   }
   ```
3. Do the same for TwentyPercentDFStatistics
4. Eventually deprecate wrappers and use EntityStatistics directly

---

## Phase 2: Currency & Formatting Consolidation

### 2.1 Current State
Currency formatter is defined in:
- BudgetStatistics.tsx
- TwentyPercentDFStatistics.tsx
- FundsStatistics.tsx
- ProjectSummaryStats.tsx
- BreakdownStatistics.tsx (uses formatCurrency utility)
- BudgetPageHeader.tsx (potentially)
- Various table components

### 2.2 Solution: Centralized Formatters

The `formatCurrency` utility already exists in `components/ppdo/breakdown/utils/formatters.ts`.

**Action Items:**
1. Move all formatters to `lib/shared/utils/formatters.ts`
2. Create React hook `useCurrencyFormatter()` for consistent memoization
3. Update all components to use shared formatters

```typescript
// lib/shared/utils/formatters.ts
export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    maximumFractionDigits: 0,
  }).format(value);
};

export const formatPercentage = (value: number, decimals = 1): string => {
  return `${value.toFixed(decimals)}%`;
};
```

---

## Phase 3: Status Counting Logic Consolidation

### 3.1 Current Redundancy
Status counting logic exists in:
- BudgetStatistics.tsx
- TwentyPercentDFStatistics.tsx

### 3.2 Solution: Custom Hook

```typescript
// lib/shared/hooks/useStatusCounts.ts
export function useStatusCounts<T extends { status?: string }>(
  items: T[],
  defaultStatuses: string[]
): Record<string, number> {
  return useMemo(() => {
    const counts: Record<string, number> = {};
    defaultStatuses.forEach(s => counts[s] = 0);
    items.forEach((item) => {
      const status = item.status || 'not_available';
      counts[status] = (counts[status] || 0) + 1;
    });
    return counts;
  }, [items, defaultStatuses]);
}
```

---

## Phase 4: Table Components Consolidation

### 4.1 Current Redundancy Analysis

All table components share:
- View mode toggle (table/kanban)
- Modal state management (add/edit/delete)
- Selection handling (checkboxes, bulk actions)
- Print preview functionality
- Column resizing
- Search/filter logic
- Export to CSV

**Current Implementations:**
- BudgetTrackingTable.tsx (~500+ lines)
- ProjectsTable.tsx (~600+ lines)
- FundsTable.tsx (~500+ lines)
- TwentyPercentDFTable.tsx (~500+ lines)

### 4.2 Consolidation Strategy

**Layer 1: Shared Hooks (Already partially done)**
Create comprehensive hooks in `components/ppdo/shared/hooks/`:

```typescript
// useEntityTable.ts - Main table orchestration hook
export function useEntityTable<T extends BaseEntity>(config: TableConfig<T>) {
  // Combines:
  // - useEntityTableState (modals)
  // - useEntityTableFilters (search, sort, filter)
  // - useEntityTableSelection (row selection)
  // - useEntityTableActions (CRUD operations)
  // - useEntityTablePrint (print/export)
}
```

**Layer 2: Shared Components**
Already have some in `components/ppdo/shared/table/`:
- ResizableTableContainer
- ResizableTableHeader
- ResizableTableRow

**Missing:**
- GenericTableToolbar
- GenericTableModals
- GenericKanbanView

### 4.3 Recommended Architecture

```
EntityTable (generic wrapper)
├── EntityTableToolbar (shared)
│   ├── SearchInput
│   ├── FilterDropdowns
│   ├── ColumnVisibility
│   └── ViewToggle (Table/Kanban)
├── View: Table
│   └── ResizableTableContainer (shared)
│       ├── ResizableTableHeader (shared)
│       ├── ResizableTableRow (shared)
│       └── TotalsRow
└── View: Kanban
    └── KanbanBoard (shared)
        └── KanbanCard (shared)
```

---

## Phase 5: Implementation Roadmap

### Phase 5.1: Statistics Consolidation (Week 1)
**Priority: HIGH** - Easiest win, maximum impact

1. **Day 1-2**: Create `EntityStatistics` component
   - Combine best of StandardStatisticsGrid + specific logic
   - Full TypeScript support
   - Comprehensive prop configuration

2. **Day 3**: Create `useStatusCounts` hook
   - Extract from BudgetStatistics
   - Unit tests

3. **Day 4**: Refactor BudgetStatistics
   - Convert to thin wrapper
   - Zero visual changes
   - Full backward compatibility

4. **Day 5**: Refactor TwentyPercentDFStatistics
   - Convert to thin wrapper
   - Zero visual changes

5. **Verification**: 
   - All statistics sections render identically
   - No visual regressions
   - Build passes
   - TypeScript strict mode passes

### Phase 5.2: Formatter Consolidation (Week 2)
**Priority: MEDIUM**

1. Move all formatters to `lib/shared/utils/formatters.ts`
2. Create `useCurrencyFormatter` hook
3. Update all components to use shared formatters
4. Remove duplicate formatter definitions

### Phase 5.3: Table Consolidation (Week 3-4)
**Priority: MEDIUM** - Complex, requires careful testing

1. Audit existing shared hooks in `components/ppdo/shared/hooks/`
2. Create missing generic hooks
3. Refactor ONE table component as pilot (e.g., FundsTable)
4. Test thoroughly
5. Apply lessons to other tables

---

## Files to Create/Modify

### New Files
```
components/ppdo/shared/EntityStatistics.tsx       # Consolidated statistics
lib/shared/hooks/useStatusCounts.ts               # Status counting hook
lib/shared/hooks/useCurrencyFormatter.ts          # Currency hook
components/ppdo/shared/hooks/useEntityTable.ts    # Generic table hook
```

### Modified Files (Refactored)
```
components/ppdo/11_project_plan/components/BudgetStatistics.tsx         # Thin wrapper
components/ppdo/twenty-percent-df/components/TwentyPercentDFStatistics.tsx # Thin wrapper
components/ppdo/funds/components/FundsStatistics.tsx                    # Use EntityStatistics
components/ppdo/projects/components/ProjectSummaryStats.tsx             # Use EntityStatistics
components/ppdo/breakdown/shared/BreakdownStatistics.tsx                # Use EntityStatistics
```

---

## Acceptance Criteria

### For Statistics Consolidation
- [ ] Single EntityStatistics component handles all use cases
- [ ] BudgetStatistics, TwentyPercentDFStatistics are < 50 lines each
- [ ] No duplicate currency formatter logic
- [ ] No duplicate status counting logic
- [ ] All pages render identically (pixel-perfect)
- [ ] TypeScript compilation passes
- [ ] Build succeeds
- [ ] Zero runtime errors

### For Table Consolidation
- [ ] Generic table hook reduces table component LOC by 50%+
- [ ] Shared table components used by all tables
- [ ] Consistent toolbar across all tables
- [ ] Consistent modal behavior across all tables

---

## Risk Mitigation

| Risk | Impact | Mitigation |
|------|--------|------------|
| Visual regression | High | Pixel-perfect comparison, screenshot testing |
| Type errors | Medium | Strict TypeScript, comprehensive interfaces |
| Feature loss | High | Feature parity checklist per component |
| Performance | Low | useMemo preserved, no additional re-renders |

---

## Success Metrics

1. **Code Reduction**: 30-50% reduction in statistics-related code
2. **Maintainability**: One file to change for UI updates
3. **Developer Experience**: New tables built in 50% less time
4. **Bug Reduction**: Single source of truth = fewer inconsistencies

---

## Conclusion

This consolidation will transform the codebase from:
- **Before**: 5 statistics implementations, 4+ table implementations, duplicated logic
- **After**: 1 statistics implementation, 1 table infrastructure, shared utilities

**Next Developer Experience:**
> "Boss wants to change the statistics card style? Just edit `EntityStatistics.tsx` and it updates everywhere!"

> "Need a new table? Just use `useEntityTable()` and you're 80% done!"
