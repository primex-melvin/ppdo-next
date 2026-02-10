# PPDO Tables Documentation

This folder contains comprehensive documentation for the PPDO table system, focusing on the unified toolbar architecture, hooks, and component patterns.

## Table of Contents

1. [Architecture Overview](./01-architecture-overview.md) - High-level system design
2. [Unified Table Toolbar](./02-unified-table-toolbar.md) - Core `TableToolbar` component
3. [Table Toolbar Adapters](./03-table-toolbar-adapters.md) - Domain-specific toolbar wrappers
4. [Domain-Specific Toolbars](./04-domain-specific-toolbars.md) - Independent toolbar implementations
5. [Table Hooks](./05-table-hooks.md) - Reusable hooks for search, selection, and column visibility
6. [Column Visibility System](./06-column-visibility-system.md) - Column toggling components
7. [Bulk Actions System](./07-bulk-actions-system.md) - Pluggable bulk action patterns
8. [Print Preview Toolbar](./08-print-preview-toolbar.md) - Print/export toolbar system
9. [Responsive Design Patterns](./09-responsive-design-patterns.md) - Mobile/desktop adaptations
10. [Integration Guide](./10-integration-guide.md) - How to implement in new tables

## Quick Reference

### Toolbar Components Location

| Component | Path | Status |
|-----------|------|--------|
| Unified TableToolbar | `components/ppdo/table/toolbar/TableToolbar.tsx` | Core |
| BudgetTableToolbar (Adapter) | `components/ppdo/table/toolbar/adapters/BudgetTableToolbar.tsx` | Adapter |
| ProjectsTableToolbar (Adapter) | `components/ppdo/table/toolbar/adapters/ProjectsTableToolbar.tsx` | Adapter |
| FundsTableToolbar (Adapter) | `components/ppdo/table/toolbar/adapters/FundsTableToolbar.tsx` | Adapter |
| TwentyPercentDFTableToolbar (Adapter) | `components/ppdo/table/toolbar/adapters/TwentyPercentDFTableToolbar.tsx` | Adapter |
| TrustFundTableToolbar (Adapter) | `components/ppdo/table/toolbar/adapters/TrustFundTableToolbar.tsx` | Adapter |
| PrintPreviewToolbar | `components/ppdo/table/print-preview/PrintPreviewToolbar.tsx` | Standalone |

### Re-export Files (Backward Compatibility)

| File | Re-exports From |
|------|-----------------|
| `components/ppdo/projects/components/ProjectsTable/ProjectsTableToolbar.tsx` | Adapter |
| `components/ppdo/funds/components/toolbar/FundsTableToolbar.tsx` | Adapter |
| `components/ppdo/twenty-percent-df/.../TwentyPercentDFTableToolbar.tsx` | Adapter |
| `app/(private)/dashboard/(protected)/trust-funds/[year]/.../TrustFundTableToolbar.tsx` | Adapter |
| `components/ppdo/11_project_plan/table/BudgetTableToolbar.tsx` | Adapter |

### Supporting Components

| Component | Path |
|-----------|------|
| TableToolbarColumnVisibility | `components/ppdo/table/toolbar/TableToolbarColumnVisibility.tsx` |
| TableToolbarBulkActions | `components/ppdo/table/toolbar/TableToolbarBulkActions.tsx` |
| ResponsiveMoreMenu | `components/shared/table/ResponsiveMoreMenu.tsx` |

### Hooks

| Hook | Path |
|------|------|
| useTableSearch | `hooks/useTableSearch.ts` |
| useTableSelection | `hooks/useTableSelection.ts` |
| useTableColumnVisibility | `hooks/useTableColumnVisibility.ts` |

## Design Principles

1. **Unified Core, Domain-Specific Adapters**: A single `TableToolbar` component serves as the foundation, with adapters for domain-specific needs
2. **Pluggable Bulk Actions**: Custom bulk actions can be injected without modifying the core toolbar
3. **Responsive by Default**: All toolbars support desktop and mobile layouts
4. **Backward Compatibility**: Adapters maintain API compatibility with legacy implementations
5. **Animation-Enhanced UX**: Framer Motion powers smooth search expansion and state transitions

---

## Implementation Plans

| Plan | Status | Description |
|------|--------|-------------|
| [Toolbar Centralization](./IMPLEMENTATION-PLAN-TOOLBAR-CENTRALIZATION.md) | **Completed** | All toolbars now use unified TableToolbar via adapters |

---

## Centralization Status

All table toolbars are now centralized using the unified `TableToolbar` component via adapters.

| Toolbar | Status | Notes |
|---------|:------:|-------|
| BudgetTableToolbar | Yes | Adapter with auto-calculate bulk action |
| ProjectsTableToolbar | Yes | Adapter with ProjectBulkActions component |
| FundsTableToolbar | Yes | Adapter with Kanban support (status/field visibility) |
| TwentyPercentDFTableToolbar | Yes | Adapter with TwentyPercentDFBulkActions component |
| TrustFundTableToolbar | Yes | Adapter with enhanced features (column visibility, share) |

### New Features Added to Unified TableToolbar

- **bulkActionsComponent** - Custom component slot for domain-specific bulk actions
- **Kanban View Support** - `visibleStatuses`, `onToggleStatus`, `visibleFields`, `onToggleField`
- **Feature Toggles** - `showColumnVisibility`, `showExport`, `showShare`, `showPrintPreview`, `showDirectPrint`, `animatedSearch`
