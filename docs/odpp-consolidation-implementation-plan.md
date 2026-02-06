# ODPP Components Consolidation Implementation Plan

## Executive Summary

This plan outlines the consolidation of `components/ppdo/odpp/*` to eliminate redundancy, improve maintainability, and establish a single source of truth for all components.

**Current State:**
- 521 files across 10 subfolders
- Significant component duplication
- Multiple implementations of similar hooks
- Inconsistent import patterns

**Target State:**
- ~350-400 files (30-40% reduction)
- Single source of truth for shared components
- Unified hook architecture
- Consistent import patterns via index files

---

## Phase 1: Component Consolidation

### 1.1 Modal Components
**Status:** Partially Complete âœ“

| Component | Current Locations | Target Location | Action |
|-----------|------------------|-----------------|--------|
| ConfirmationModal | `common/`, `projects/`, `twenty-percent-df/` | `common/components/modals/` | âœ… Complete |
| BudgetViolationModal | `common/`, `projects/`, `twenty-percent-df/`, `11_project_plan/` | `common/components/modals/` | âœ… Complete |
| Modal | `11_project_plan/`, `projects/`, `twenty-percent-df/` | `common/components/modals/` | ðŸ”§ Consolidate |

**Implementation:**
- Projects/TwentyPercentDF versions are re-exporting (deprecated)
- Budget version in `11_project_plan` needs migration to common

### 1.2 Form Field Components
**Status:** In Progress

| Component | Locations | Action |
|-----------|-----------|--------|
| AutoCalculateSwitch | `common/` (âœ“ generic), `projects/`, `twenty-percent-df/`, `11_project_plan/form/` | Migrate all to common version |
| AllocatedBudgetField | `common/`, `projects/form/`, `twenty-percent-df/form/`, `11_project_plan/form/`, `breakdown/form/` | Consolidate to common |
| YearField | `11_project_plan/form/`, `projects/form/`, `twenty-percent-df/form/`, `breakdown/form/`, `common/forms/fields/` | Consolidate to common |
| RemarksField | Same pattern | Consolidate to common |
| ParticularField | Same pattern | Consolidate to common |
| FormActions | Same pattern | Consolidate to common |

**Strategy:**
```typescript
// Generic version in common/components/forms/fields/
interface FormFieldProps<TFieldValues extends FieldValues> {
  form: UseFormReturn<TFieldValues>;
  fieldName?: Path<TFieldValues>;
  // ... other generic props
}
```

### 1.3 Statistics Components
**Status:** âœ… Complete

Already consolidated via `EntityStatistics` + `StandardStatisticsGrid`.

---

## Phase 2: Hook Consolidation

### 2.1 Table-Related Hooks

**Current Redundancy:**
```
11_project_plan/hooks/
  - useBudgetTableState.ts
  - useBudgetTableFilters.ts
  - useBudgetTableSelection.ts
  - useBudgetTableActions.ts
  - useBudgetTablePrint.ts

funds/hooks/
  - useTableFilter.ts
  - useTableSelection.ts
  - useColumnResize.ts
  - useTableSort.ts

breakdown/hooks/
  - useTableSettings.ts
  - useTableResize.ts
  - useColumnDragDrop.ts

shared/table/hooks/
  - useGenericTableSettings.ts (âœ“ good)
  - useTableSettings.ts (duplicate)
  - useTableSelection.ts (duplicate)
  - useResizableColumns.ts

data-tables/core/hooks/
  - useTableSettings.ts (duplicate)
  - useTableSelection.ts (duplicate)
  - useResizableColumns.ts (duplicate)
  - useTableResize.ts (duplicate)
  - useColumnDragDrop.ts (duplicate)
```

**Consolidation Strategy:**

Create unified hooks in `shared/table/hooks/`:

1. **useTableState** (already exists in lib/shared)
   - Selection, filters, sorting
   
2. **useTableResizing**
   - Merge: useColumnResize + useResizableColumns + useTableResize
   
3. **useTableFeatures**
   - Export, print, column visibility

### 2.2 Data Fetching Hooks

**Current:**
```
11_project_plan/hooks/
  - useBudgetData.ts
  - useBudgetMutations.ts

funds/hooks/
  - useFundsData.ts
  - useFundsMutations.ts

projects/hooks/
  - useParticularData.ts
  - useProjectMutations.ts

twenty-percent-df/hooks/
  - useTwentyPercentDFData.ts
  - useTwentyPercentDFMutations.ts
```

**Consolidation:**
These should remain separate as they have entity-specific logic, but can be standardized to use a common pattern via `useEntityData` and `useEntityMutations` base hooks.

---

## Phase 3: Table Component Consolidation

### 3.1 Table Structure Components

**Current Duplicates:**
```
11_project_plan/table/
  - BudgetTableHeader.tsx
  - BudgetTableRow.tsx
  - BudgetTableTotalsRow.tsx
  - BudgetTableEmptyState.tsx
  - BudgetContextMenu.tsx

funds/components/table/
  - FundsTableHeader.tsx
  - FundsTableRow.tsx
  - FundsTableTotalRow.tsx
  - FundsTableBody.tsx

projects/components/ProjectsTable/
  - ProjectsTableHeader.tsx
  - ProjectsTableRow.tsx
  - ProjectsTableFooter.tsx
  - ProjectsTableBody.tsx

twenty-percent-df/components/TwentyPercentDFTable/
  - TwentyPercentDFTableHeader.tsx
  - TwentyPercentDFTableRow.tsx
  - TwentyPercentDFTableFooter.tsx
  - TwentyPercentDFTableBody.tsx

breakdown/table/
  - TableHeader.tsx
  - TableRow.tsx
  - TableTotalsRow.tsx
  - EmptyState.tsx

data-tables/core/
  - ResizableTableHeader.tsx
  - ResizableTableRow.tsx
  - ResizableTableContainer.tsx
```

**Consolidation Plan:**

All should use `data-tables/core/` as the base:
```
data-tables/core/
  - ResizableTableContainer.tsx (generic wrapper)
  - ResizableTableHeader.tsx (generic)
  - ResizableTableRow.tsx (generic)
  - ResizableTableTotalsRow.tsx (generic)
  - TableEmptyState.tsx (generic)
  - TableContextMenu.tsx (generic)
```

Entity-specific tables become thin wrappers:
```typescript
// funds/components/FundsTable.tsx
export function FundsTable() {
  return (
    <ResizableTableContainer>
      <ResizableTableHeader columns={FUNDS_COLUMNS} />
      {data.map(item => (
        <ResizableTableRow 
          key={item.id}
          data={item}
          renderCell={(field) => <FundsCell field={field} />}
        />
      ))}
    </ResizableTableContainer>
  );
}
```

### 3.2 Toolbar Components

**Current:**
```
table/toolbar/
  - TableToolbar.tsx
  - TableToolbarBulkActions.tsx
  - TableToolbarColumnVisibility.tsx
  - BudgetTableToolbar.tsx
  - BudgetColumnVisibilityMenu.tsx
  
  adapters/
    - BudgetTableToolbar.tsx
    - FundsTableToolbar.tsx
    - ProjectsTableToolbar.tsx
    - TwentyPercentDFTableToolbar.tsx
    - TrustFundTableToolbar.tsx
```

**Consolidation:**
Use a single `TableToolbar` with configuration props instead of adapters:
```typescript
interface TableToolbarConfig {
  showSearch?: boolean;
  showColumnVisibility?: boolean;
  showBulkActions?: boolean;
  showExport?: boolean;
  showPrint?: boolean;
  customActions?: React.ReactNode;
}
```

---

## Phase 4: Form Consolidation

### 4.1 Form Structure

**Current Pattern:**
Each entity has its own form folder with:
- formValidation.ts
- Form components (YearField, RemarksField, etc.)
- Budget calculations
- FormActions

**Target Pattern:**
```
common/forms/
  - schema/
    - baseBudgetSchema.ts (shared validation)
    - budgetItemSchema.ts
    - projectSchema.ts
    - fundSchema.ts
  - fields/ (already partially done)
    - All generic form fields
  - calculations/
    - budgetCalculations.ts (consolidated)
```

### 4.2 Form Validation Consolidation

**Current:**
```
11_project_plan/form/formValidation.ts
projects/components/form/utils/formValidation.ts
twenty-percent-df/components/form/utils/formValidation.ts
breakdown/form/utils/formValidation.ts
```

**Consolidation:**
Create `common/forms/schema/` with:
- `baseEntitySchema.ts` - Common fields (year, status, remarks)
- `budgetEntitySchema.ts` - Budget-related (allocated, utilized, obligated)
- Entity-specific extensions

---

## Phase 5: Utility & Constants Consolidation

### 5.1 Utility Functions

**Current Duplicates:**
```
11_project_plan/utils/
  - budgetTableHelpers.ts
  - budgetCalculations.ts
  - budgetSpreadsheetConfig.ts

projects/utils/
  - printAdapters.ts
  - (similar calculations)

funds/utils/
  - fundsSpreadsheetConfig.ts
  - calculateUtilizationRate (duplicate)
  - calculateTotals (duplicate)

twenty-percent-df/utils/
  - printAdapters.ts (similar to projects)
  - budgetCalculations.ts (duplicate)
```

**Consolidation:**
```
common/utils/
  - budgetCalculations.ts (unified)
  - printAdapters.ts (generic)
  - spreadsheet/
    - baseSpreadsheetConfig.ts
    - exportUtils.ts
```

### 5.2 Constants

**Current:**
```
11_project_plan/constants/
  - budgetTableColumns.ts
  - STATUS_OPTIONS
  
projects/constants/
  - projectsTableColumns.ts
  - STATUS_OPTIONS (duplicate)

funds/constants/
  - fundsTableColumns.ts
  - STATUS_OPTIONS (duplicate)
```

**Consolidation:**
```
common/constants/
  - tableColumns.ts (exports all column configs)
  - status.ts (single source of truth)
  - validation.ts (already exists âœ“)
```

---

## Phase 6: Print & Export Consolidation

### 6.1 Print Components

**Current:**
```
11_project_plan/
  - adapters/BudgetPrintAdapter.ts
  - hooks/usePrintDraft.ts
  - hooks/usePrintPreviewState.ts
  - hooks/usePrintPreviewActions.ts

funds/
  - lib/print-adapters/FundsPrintAdapter.ts

breakdown/
  - lib/print-adapters/BreakdownPrintAdapter.ts

print/
  - GenericPrintPreviewModal.tsx

table/print-preview/
  - Multiple print preview components
```

**Consolidation:**
```
common/print/
  - adapters/
    - BasePrintAdapter.ts
    - EntityPrintAdapters.ts
  - hooks/
    - usePrint.ts (unified)
  - components/
    - PrintPreviewModal.tsx (single)
```

---

## Implementation Roadmap

### Phase 1: Component Cleanup (Week 1)
**Priority: HIGH**

1. **Day 1-2:** Audit all duplicate modals/forms
   - Identify which are already consolidated
   - Remove deprecated re-exports
   
2. **Day 3-4:** Migrate remaining modals to common
   - Modal.tsx from 11_project_plan
   - Any remaining duplicate fields
   
3. **Day 5:** Verify all imports updated
   - Search for old import patterns
   - Update to use common/

### Phase 2: Hook Consolidation (Week 2)
**Priority: HIGH**

1. **Day 1-2:** Create unified table hooks in shared/
   - useTableState (extend existing)
   - useTableResizing
   
2. **Day 3-4:** Migrate entity hooks to use shared
   - Update funds hooks
   - Update projects hooks
   - Update 20% df hooks
   
3. **Day 5:** Testing & validation
   - Ensure no regression
   - TypeScript strict mode

### Phase 3: Table Component Unification (Week 3)
**Priority: MEDIUM**

1. **Day 1-2:** Strengthen data-tables/core/
   - Ensure all features supported
   - Generic cell renderers
   
2. **Day 3-4:** Create thin wrapper components
   - FundsTable â†’ wrapper
   - ProjectsTable â†’ wrapper
   - BudgetTrackingTable â†’ wrapper
   
3. **Day 5:** Remove old table components
   - Delete duplicate implementations
   - Update exports

### Phase 4: Toolbar & Form Consolidation (Week 4)
**Priority: MEDIUM**

1. **Day 1-2:** Consolidate toolbars
   - Single TableToolbar component
   - Remove adapter pattern
   
2. **Day 3-4:** Consolidate form utilities
   - Merge validation schemas
   - Unified calculation utilities
   
3. **Day 5:** Testing & documentation

### Phase 5: Print & Export (Week 5)
**Priority: LOW**

1. Consolidate print adapters
2. Unified print preview modal
3. Remove duplicate print logic

---

## Expected Outcomes

### File Count Reduction
| Category | Before | After | Reduction |
|----------|--------|-------|-----------|
| Modals | 15 | 5 | 67% |
| Form Fields | 30 | 12 | 60% |
| Table Components | 40 | 15 | 63% |
| Hooks | 35 | 15 | 57% |
| Utilities | 25 | 10 | 60% |
| **Total** | **521** | **~300** | **42%** |

### Maintainability Improvements
1. **Single Source of Truth:** Update once, reflects everywhere
2. **Consistent Patterns:** All entities use same architecture
3. **Easier Testing:** Fewer components to test
4. **Faster Onboarding:** Clear structure for new developers

### Developer Experience
```typescript
// Before: Different import for each entity
import { ConfirmationModal } from "@/components/features/ppdo/projects/components";
import { BudgetViolationModal } from "@/components/features/ppdo/11_project_plan/components";

// After: Single import location
import { ConfirmationModal, BudgetViolationModal } from "@/components/features/ppdo/common";
```

---

## Risk Mitigation

| Risk | Impact | Mitigation |
|------|--------|------------|
| Breaking changes | High | Gradual migration, keep re-exports during transition |
| Feature loss | High | Comprehensive feature parity checklist |
| Performance | Low | Use React.memo, preserve optimization patterns |
| Type errors | Medium | Strict TypeScript, comprehensive interfaces |

---

## Success Metrics

1. **Code Reduction:** 40%+ file reduction in odpp/
2. **Import Consistency:** 100% imports from common/ or shared/
3. **Build Time:** Faster compilation (fewer files)
4. **Bundle Size:** Reduced client bundle
5. **Developer Satisfaction:** Easier to find and modify code

---

## Notes

- **Backward Compatibility:** Maintain index.ts re-exports during transition
- **Documentation:** Update all JSDoc comments
- **Testing:** Each phase requires full regression testing
- **Git Strategy:** One phase per commit for easy rollback