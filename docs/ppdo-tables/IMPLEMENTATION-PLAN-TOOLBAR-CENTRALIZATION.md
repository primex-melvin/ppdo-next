# Implementation Plan: Table Toolbar Centralization

> **STATUS: COMPLETED** (2026-02-04)

## Executive Summary

This document outlines the implementation plan to centralize all table toolbars across the PPDO application using the DRY (Don't Repeat Yourself) principle. The goal is to ensure all tables have access to all toolbar features while maintaining backward compatibility and domain-specific flexibility.

### Implementation Summary

All phases have been completed:
- Phase 1: Enhanced `types.ts` and `TableToolbar.tsx` with new features
- Phase 2: Created `TwentyPercentDFTableToolbar` and `TrustFundTableToolbar` adapters
- Phase 3: Migrated all standalone toolbars to use adapters (via re-exports)
- Phase 4: Updated barrel exports in `index.ts`
- Phase 5: Verified TypeScript compilation
- Phase 6: Updated documentation

---

## 1. Current State Analysis

### 1.1 Existing Toolbar Implementations

| Toolbar | Location | Status |
|---------|----------|--------|
| **Unified TableToolbar** | `components/ppdo/table/toolbar/TableToolbar.tsx` | Core (Partial) |
| **BudgetTableToolbar (Adapter)** | `components/ppdo/table/toolbar/adapters/BudgetTableToolbar.tsx` | Uses Unified |
| **ProjectsTableToolbar (Adapter)** | `components/ppdo/table/toolbar/adapters/ProjectsTableToolbar.tsx` | Uses Unified |
| **FundsTableToolbar (Adapter)** | `components/ppdo/table/toolbar/adapters/FundsTableToolbar.tsx` | Uses Unified |
| **ProjectsTableToolbar (Standalone)** | `components/ppdo/projects/components/ProjectsTable/ProjectsTableToolbar.tsx` | NOT Centralized |
| **FundsTableToolbar (Standalone)** | `components/ppdo/funds/components/toolbar/FundsTableToolbar.tsx` | NOT Centralized |
| **TwentyPercentDFTableToolbar** | `components/ppdo/twenty-percent-df/components/TwentyPercentDFTable/TwentyPercentDFTableToolbar.tsx` | NOT Centralized |
| **TrustFundTableToolbar** | `app/(private)/dashboard/(protected)/trust-funds/[year]/components/TrustFundTableToolbar.tsx` | NOT Centralized |
| **BudgetTableToolbar (Legacy)** | `components/ppdo/11_project_plan/table/BudgetTableToolbar.tsx` | NOT Centralized |

### 1.2 Feature Matrix (Current State)

| Feature | Unified | Projects (Standalone) | Funds (Standalone) | 20%DF | TrustFund | Budget (Legacy) |
|---------|:-------:|:---------------------:|:-----------------:|:-----:|:---------:|:---------------:|
| Animated Search (Framer Motion) | Yes | **No** | Yes | Yes | Yes | **No** |
| Column Visibility | Yes | Yes (custom) | Yes | Yes (custom) | **No** | Yes (custom) |
| Bulk Auto-Calculate | Yes | Yes | **No** | Yes | **No** | Yes |
| Bulk Category Change | **No** | Yes | **No** | Yes | **No** | **No** |
| Kanban Support (Status/Field) | **No** | **No** | Yes | **No** | **No** | **No** |
| Print Preview | Yes | Yes | Yes | Yes | **No** | Yes |
| Direct Print PDF | Yes | Yes | Yes | Yes | Yes | **No** |
| Admin Share | Yes | Yes | **No** | Yes | **No** | Yes |
| Export CSV | Yes | Yes | Yes | Yes | Yes | Yes |
| Trash/Recycle Bin | Yes | Yes | Yes | Yes | Yes | Yes |
| Add Button | Yes | Yes | Yes | Yes | Yes | Yes |
| Responsive More Menu | Yes | Yes | Yes | Yes | Yes | Yes |
| Tooltips | Yes | Yes | Yes | Yes | Yes | Yes |

---

## 2. Gap Analysis & Required Enhancements

### 2.1 Missing Features in Unified TableToolbar

The following features must be added to `TableToolbar.tsx`:

1. **Custom Bulk Actions Component Slot**
   - Accept a `bulkActionsComponent` prop for domain-specific bulk actions (e.g., `ProjectBulkActions`, `TwentyPercentDFBulkActions`)
   - Current: Only supports `bulkActions[]` array with simple buttons

2. **Kanban View Support**
   - `visibleStatuses` / `onToggleStatus` - Status visibility for Kanban
   - `visibleFields` / `onToggleField` - Field visibility for Kanban cards
   - `showStatusVisibility` / `showFieldVisibility` - Toggle flags

3. **Feature Toggle Flags**
   - `showColumnVisibility` - Enable/disable column toggle (default: true)
   - `showExport` - Enable/disable export dropdown (default: true)
   - `showShare` - Enable/disable share button (default: true, if admin)
   - `showPrintPreview` - Enable/disable print preview (default: true)

4. **Search Animation Toggle**
   - `animatedSearch` - Enable/disable Framer Motion animation (default: true)

### 2.2 Missing Features in Standalone Toolbars

| Toolbar | Missing Features |
|---------|------------------|
| **ProjectsTableToolbar (Standalone)** | Animated search, Kanban support |
| **FundsTableToolbar (Standalone)** | Bulk auto-calculate, Admin share |
| **TwentyPercentDFTableToolbar** | Kanban support |
| **TrustFundTableToolbar** | Column visibility, Admin share, Print preview, Bulk auto-calculate |
| **BudgetTableToolbar (Legacy)** | Animated search, Direct print PDF |

---

## 3. Implementation Plan

### Phase 1: Enhance Unified TableToolbar (Core)

**Files to modify:**
- `components/ppdo/table/toolbar/types.ts`
- `components/ppdo/table/toolbar/TableToolbar.tsx`

#### Task 1.1: Update `types.ts` with new props

```typescript
// Add to TableToolbarProps interface:

// === CUSTOM BULK ACTIONS COMPONENT ===
/** Custom bulk actions component (e.g., ProjectBulkActions) */
bulkActionsComponent?: React.ReactNode;

// === KANBAN VIEW SUPPORT ===
/** Visible status IDs for Kanban view */
visibleStatuses?: Set<string>;
/** Toggle status visibility callback */
onToggleStatus?: (statusId: string, isChecked: boolean) => void;
/** Visible field IDs for Kanban cards */
visibleFields?: Set<string>;
/** Toggle field visibility callback */
onToggleField?: (fieldId: string, isChecked: boolean) => void;
/** Available kanban fields configuration */
kanbanFields?: { id: string; label: string }[];

// === FEATURE TOGGLES ===
/** Show/hide column visibility menu (default: true) */
showColumnVisibility?: boolean;
/** Show/hide export dropdown (default: true) */
showExport?: boolean;
/** Show/hide share button even if admin (default: true) */
showShare?: boolean;
/** Show/hide print preview in export menu (default: true) */
showPrintPreview?: boolean;
/** Show/hide direct print in export menu (default: true) */
showDirectPrint?: boolean;
/** Enable animated search expansion (default: true) */
animatedSearch?: boolean;
```

#### Task 1.2: Implement new features in `TableToolbar.tsx`

1. Add `bulkActionsComponent` render slot
2. Add Kanban menus (StatusVisibilityMenu, KanbanFieldVisibilityMenu)
3. Apply feature toggle flags with defaults
4. Make animated search configurable

---

### Phase 2: Create New Adapters for Standalone Toolbars

**Files to create:**
- `components/ppdo/table/toolbar/adapters/TwentyPercentDFTableToolbar.tsx`
- `components/ppdo/table/toolbar/adapters/TrustFundTableToolbar.tsx`

**Files to update:**
- `components/ppdo/table/toolbar/adapters/FundsTableToolbar.tsx` (add Kanban support)

#### Task 2.1: Create TwentyPercentDFTableToolbar Adapter

- Wrap unified `TableToolbar`
- Pass `TwentyPercentDFBulkActions` as `bulkActionsComponent`
- Maintain existing prop interface

#### Task 2.2: Create TrustFundTableToolbar Adapter

- Wrap unified `TableToolbar`
- Add missing features: column visibility, admin share, print preview
- Maintain existing prop interface but extend with new optional props

#### Task 2.3: Update FundsTableToolbar Adapter

- Add `visibleStatuses`, `onToggleStatus`, `visibleFields`, `onToggleField` props
- Add `showColumnToggle`, `showExport` toggle flags
- Support Kanban view features

---

### Phase 3: Migrate Standalone Toolbars to Use Adapters

**Files to update:**
1. `components/ppdo/projects/components/ProjectsTable/ProjectsTableToolbar.tsx`
2. `components/ppdo/funds/components/toolbar/FundsTableToolbar.tsx`
3. `components/ppdo/twenty-percent-df/components/TwentyPercentDFTable/TwentyPercentDFTableToolbar.tsx`
4. `app/(private)/dashboard/(protected)/trust-funds/[year]/components/TrustFundTableToolbar.tsx`
5. `components/ppdo/11_project_plan/table/BudgetTableToolbar.tsx`

#### Migration Strategy

**Option A: Replace with Re-export (Recommended)**
```typescript
// In standalone file, replace entire implementation with:
export { ProjectsTableToolbar } from "@/components/features/ppdo/table/toolbar/adapters";
```

**Option B: Deprecate & Redirect**
```typescript
// Mark standalone as deprecated, redirect to adapter
/** @deprecated Use import from "@/components/features/ppdo/table/toolbar/adapters" instead */
export { ProjectsTableToolbar } from "@/components/features/ppdo/table/toolbar/adapters/ProjectsTableToolbar";
```

---

### Phase 4: Update Consumer Components

**Files to audit and update:**

| Consumer | Current Import | New Import |
|----------|----------------|------------|
| ProjectsTable | Local ProjectsTableToolbar | Adapter |
| FundsTable | Local FundsTableToolbar | Adapter |
| TwentyPercentDFTable | Local TwentyPercentDFTableToolbar | Adapter |
| TrustFundPage | Local TrustFundTableToolbar | Adapter |
| BudgetTable (11_project_plan) | Local BudgetTableToolbar | Adapter |

---

### Phase 5: Cleanup & Remove Duplicate Code

**Files to delete (after migration verified):**
1. `components/ppdo/projects/components/ProjectsTable/ProjectsTableToolbar.tsx` (replace with re-export)
2. `components/ppdo/funds/components/toolbar/FundsTableToolbar.tsx` (replace with re-export)
3. `components/ppdo/twenty-percent-df/components/TwentyPercentDFTable/TwentyPercentDFTableToolbar.tsx` (replace with re-export)
4. `app/(private)/dashboard/(protected)/trust-funds/[year]/components/TrustFundTableToolbar.tsx` (replace with re-export)
5. `components/ppdo/11_project_plan/table/BudgetTableToolbar.tsx` (replace with re-export)

**Keep supporting files:**
- `ColumnVisibilityMenu.tsx` files (used by adapters)
- `ProjectBulkActions.tsx` / `TwentyPercentDFBulkActions.tsx` (injected as components)
- `BudgetColumnVisibilityMenu.tsx` (can be passed as custom column visibility component)

---

### Phase 6: Update Barrel Exports

**File:** `components/ppdo/table/toolbar/index.ts`

```typescript
// Core
export { TableToolbar } from "./TableToolbar";
export type { TableToolbarProps, BulkAction, ColumnVisibilityMenuProps } from "./types";

// Sub-components
export { TableToolbarColumnVisibility } from "./TableToolbarColumnVisibility";
export { TableToolbarBulkActions } from "./TableToolbarBulkActions";

// Adapters (Backward Compatible)
export { BudgetTableToolbar } from "./adapters/BudgetTableToolbar";
export { ProjectsTableToolbar } from "./adapters/ProjectsTableToolbar";
export { FundsTableToolbar } from "./adapters/FundsTableToolbar";
export { TwentyPercentDFTableToolbar } from "./adapters/TwentyPercentDFTableToolbar";
export { TrustFundTableToolbar } from "./adapters/TrustFundTableToolbar";
```

---

### Phase 7: Verification & Testing

#### 7.1 Manual Testing Checklist

| Table | Test Items |
|-------|------------|
| **Budget Table** | Search, Column toggle, Auto-calculate, Trash, Export CSV, Print Preview, Share, Add |
| **Projects Table** | Search, Column toggle, Bulk category change, Auto-calculate, Trash, Export, Print, Share, Add |
| **Funds Table** | Search, Column toggle, Kanban status/field visibility, Trash, Export, Print, Add |
| **20% DF Table** | Search, Column toggle, Bulk category change, Auto-calculate, Trash, Export, Print, Share, Add |
| **Trust Fund Table** | Search, Column toggle, Trash, Export CSV, Print PDF, Print Preview, Share, Add |

#### 7.2 Responsive Testing

- Desktop (lg+): Full toolbar visible
- Tablet (md-lg): Compact view with some icons
- Mobile (< md): Hamburger "More" menu for overflow actions

#### 7.3 Animation Testing

- Verify Framer Motion search expansion works on all toolbars
- Test animation enable/disable via `animatedSearch` prop

---

### Phase 8: Documentation Update

**Files to update:**
- `docs/ppdo-tables/02-unified-table-toolbar.md` - Update with new props
- `docs/ppdo-tables/03-table-toolbar-adapters.md` - Add new adapters
- `docs/ppdo-tables/04-domain-specific-toolbars.md` - Mark as deprecated, redirect to adapters
- `docs/ppdo-tables/10-integration-guide.md` - Update integration examples

---

## 4. Backend Changes Required

### 4.1 No Backend Changes Required

The toolbar centralization is purely a frontend refactoring. All existing:
- Convex mutations (bulk trash, auto-calculate, category change)
- Convex queries (pending requests count, admin status)
- Export/print logic

...remain unchanged. The adapters will simply pass through the same callbacks.

### 4.2 Potential Future Backend Enhancements (Optional)

| Feature | Current State | Enhancement |
|---------|---------------|-------------|
| Trust Fund Share | Not available | Add sharing mutation for trust funds |
| Trust Fund Print Preview | Direct print only | Add print template/draft support |
| Funds Admin Share | Not available | Add sharing mutation for funds |

> **Note:** These are optional enhancements and NOT required for toolbar centralization.

---

## 5. Task Breakdown (TODO List)

### Phase 1: Enhance Core TableToolbar
- [ ] Update `types.ts` with new prop interfaces
- [ ] Add `bulkActionsComponent` slot to `TableToolbar.tsx`
- [ ] Add Kanban view support (StatusVisibilityMenu, KanbanFieldVisibilityMenu)
- [ ] Add feature toggle flags with defaults
- [ ] Make search animation configurable

### Phase 2: Create New Adapters
- [ ] Create `TwentyPercentDFTableToolbar` adapter
- [ ] Create `TrustFundTableToolbar` adapter
- [ ] Update `FundsTableToolbar` adapter with Kanban support

### Phase 3: Migrate Standalone Toolbars
- [ ] Migrate `ProjectsTableToolbar` (standalone) to use adapter
- [ ] Migrate `FundsTableToolbar` (standalone) to use adapter
- [ ] Migrate `TwentyPercentDFTableToolbar` to use adapter
- [ ] Migrate `TrustFundTableToolbar` to use adapter
- [ ] Migrate `BudgetTableToolbar` (legacy) to use adapter

### Phase 4: Update Consumers
- [ ] Update ProjectsTable import
- [ ] Update FundsTable import
- [ ] Update TwentyPercentDFTable import
- [ ] Update TrustFundPage import
- [ ] Update BudgetTable (11_project_plan) import

### Phase 5: Cleanup
- [ ] Replace standalone files with re-exports
- [ ] Remove duplicate code
- [ ] Update barrel exports in `index.ts`

### Phase 6: Verification
- [ ] Test Budget Table toolbar functionality
- [ ] Test Projects Table toolbar functionality
- [ ] Test Funds Table toolbar functionality (including Kanban)
- [ ] Test 20% DF Table toolbar functionality
- [ ] Test Trust Fund Table toolbar functionality
- [ ] Test responsive layouts on all toolbars
- [ ] Test animations on all toolbars

### Phase 7: Documentation
- [ ] Update `02-unified-table-toolbar.md`
- [ ] Update `03-table-toolbar-adapters.md`
- [ ] Update `04-domain-specific-toolbars.md`
- [ ] Update `10-integration-guide.md`

---

## 6. File Change Summary

### Files to Create
| File | Purpose |
|------|---------|
| `components/ppdo/table/toolbar/adapters/TwentyPercentDFTableToolbar.tsx` | New adapter |
| `components/ppdo/table/toolbar/adapters/TrustFundTableToolbar.tsx` | New adapter |

### Files to Modify
| File | Changes |
|------|---------|
| `components/ppdo/table/toolbar/types.ts` | Add new props |
| `components/ppdo/table/toolbar/TableToolbar.tsx` | Implement new features |
| `components/ppdo/table/toolbar/adapters/FundsTableToolbar.tsx` | Add Kanban support |
| `components/ppdo/table/toolbar/index.ts` | Update exports |

### Files to Replace (with re-exports)
| File | Replacement |
|------|-------------|
| `components/ppdo/projects/components/ProjectsTable/ProjectsTableToolbar.tsx` | Re-export from adapters |
| `components/ppdo/funds/components/toolbar/FundsTableToolbar.tsx` | Re-export from adapters |
| `components/ppdo/twenty-percent-df/components/TwentyPercentDFTable/TwentyPercentDFTableToolbar.tsx` | Re-export from adapters |
| `app/(private)/dashboard/(protected)/trust-funds/[year]/components/TrustFundTableToolbar.tsx` | Re-export from adapters |
| `components/ppdo/11_project_plan/table/BudgetTableToolbar.tsx` | Re-export from adapters |

---

## 7. Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Breaking existing functionality | Medium | High | Use adapter pattern for backward compatibility |
| Missing edge cases in testing | Medium | Medium | Comprehensive testing checklist |
| Performance regression from animations | Low | Low | Make animations configurable |
| Import path changes breaking builds | Low | High | Keep old paths as re-exports |

---

## 8. Success Criteria

1. **All tables use unified toolbar** - No duplicate toolbar implementations
2. **No breaking changes** - All existing functionality works unchanged
3. **All features available everywhere** - Every table has access to all toolbar features
4. **Clean codebase** - Duplicate code removed, single source of truth
5. **Updated documentation** - All docs reflect new architecture
6. **Passing tests** - All manual/automated tests pass

---

## 9. Architecture Diagram (After Implementation)

```
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚                        Unified TableToolbar                              â”‚
â”‚  â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”    â”‚
â”‚  â”‚ Core Features:                                                   â”‚    â”‚
â”‚  â”‚ - Animated Search (Framer Motion)                               â”‚    â”‚
â”‚  â”‚ - Column Visibility Menu                                         â”‚    â”‚
â”‚  â”‚ - Bulk Actions (Pluggable)                                       â”‚    â”‚
â”‚  â”‚ - Custom Bulk Actions Component Slot                             â”‚    â”‚
â”‚  â”‚ - Kanban Support (Status/Field Visibility)                       â”‚    â”‚
â”‚  â”‚ - Export Dropdown (Print Preview, Print PDF, Export CSV)         â”‚    â”‚
â”‚  â”‚ - Admin Share Button                                             â”‚    â”‚
â”‚  â”‚ - Trash/Recycle Bin                                              â”‚    â”‚
â”‚  â”‚ - Add New Button                                                 â”‚    â”‚
â”‚  â”‚ - Responsive More Menu                                           â”‚    â”‚
â”‚  â”‚ - Feature Toggle Flags                                           â”‚    â”‚
â”‚  â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜    â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
                                    â”‚
                    â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¼â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
                    â”‚               â”‚               â”‚
                    â–¼               â–¼               â–¼
        â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”  â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”  â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
        â”‚    Adapter    â”‚  â”‚    Adapter    â”‚  â”‚    Adapter    â”‚
        â”‚   (Budget)    â”‚  â”‚  (Projects)   â”‚  â”‚    (Funds)    â”‚
        â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜  â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜  â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
                â”‚                   â”‚                   â”‚
                â–¼                   â–¼                   â–¼
        â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”  â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”  â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
        â”‚ BudgetTable   â”‚  â”‚ ProjectsTable â”‚  â”‚  FundsTable   â”‚
        â”‚ (Consumer)    â”‚  â”‚  (Consumer)   â”‚  â”‚  (Consumer)   â”‚
        â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜  â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜  â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜

        â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”  â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
        â”‚    Adapter    â”‚  â”‚    Adapter    â”‚
        â”‚   (20% DF)    â”‚  â”‚ (Trust Fund)  â”‚
        â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜  â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
                â”‚                   â”‚
                â–¼                   â–¼
        â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”  â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
        â”‚ 20%DFTable    â”‚  â”‚ TrustFundPage â”‚
        â”‚ (Consumer)    â”‚  â”‚  (Consumer)   â”‚
        â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜  â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
```

---

## 10. Appendix: New Props Reference

### TableToolbarProps (Enhanced)

```typescript
interface TableToolbarProps {
  // === SEARCH ===
  searchQuery: string;
  onSearchChange: (query: string) => void;
  searchInputRef: React.RefObject<HTMLInputElement>;
  onSearchFocus?: (e: React.FocusEvent<HTMLInputElement>) => void;
  searchPlaceholder?: string;
  animatedSearch?: boolean; // NEW: default true

  // === SELECTION ===
  selectedCount: number;
  onClearSelection: () => void;

  // === COLUMN VISIBILITY ===
  hiddenColumns: Set<string>;
  onToggleColumn: (columnId: string, isChecked: boolean) => void;
  onShowAllColumns: () => void;
  onHideAllColumns: () => void;
  columns?: { key: string; label: string }[];
  columnVisibilityComponent?: React.ComponentType<ColumnVisibilityMenuProps>;
  showColumnVisibility?: boolean; // NEW: default true

  // === BULK ACTIONS ===
  bulkActions?: BulkAction[];
  bulkActionsComponent?: React.ReactNode; // NEW: custom component slot
  onBulkToggleAutoCalculate?: () => void; // Legacy
  onBulkCategoryChange?: (categoryId: any) => void; // Legacy
  canManageBulkActions?: boolean; // Legacy

  // === KANBAN SUPPORT (NEW) ===
  visibleStatuses?: Set<string>;
  onToggleStatus?: (statusId: string, isChecked: boolean) => void;
  visibleFields?: Set<string>;
  onToggleField?: (fieldId: string, isChecked: boolean) => void;
  kanbanFields?: { id: string; label: string }[];

  // === TRASH ===
  onBulkTrash: () => void;
  onOpenTrash?: () => void;

  // === EXPORT/PRINT ===
  onExportCSV?: () => void;
  onPrint?: () => void;
  onOpenPrintPreview?: () => void;
  hasPrintDraft?: boolean;
  showExport?: boolean; // NEW: default true
  showPrintPreview?: boolean; // NEW: default true
  showDirectPrint?: boolean; // NEW: default true

  // === SHARE (ADMIN) ===
  isAdmin?: boolean;
  pendingRequestsCount?: number;
  onOpenShare?: () => void;
  showShare?: boolean; // NEW: default true

  // === UI CUSTOMIZATION ===
  title?: string;
  addButtonLabel?: string;
  accentColor: string;
  onAddNew?: () => void;
  expandButton?: React.ReactNode;
}
```

---

*Document created: 2026-02-04*
*Author: Consolidation Architect Agent*
*Status: Ready for Implementation*