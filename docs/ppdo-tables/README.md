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

| Component | Path |
|-----------|------|
| Unified TableToolbar | `components/ppdo/table/toolbar/TableToolbar.tsx` |
| BudgetTableToolbar (Adapter) | `components/ppdo/table/toolbar/adapters/BudgetTableToolbar.tsx` |
| ProjectsTableToolbar (Adapter) | `components/ppdo/table/toolbar/adapters/ProjectsTableToolbar.tsx` |
| FundsTableToolbar (Adapter) | `components/ppdo/table/toolbar/adapters/FundsTableToolbar.tsx` |
| ProjectsTableToolbar (Standalone) | `components/ppdo/projects/components/ProjectsTable/ProjectsTableToolbar.tsx` |
| FundsTableToolbar (Standalone) | `components/ppdo/funds/components/toolbar/FundsTableToolbar.tsx` |
| TwentyPercentDFTableToolbar | `components/ppdo/twenty-percent-df/components/TwentyPercentDFTable/TwentyPercentDFTableToolbar.tsx` |
| TrustFundTableToolbar | `app/(private)/dashboard/(protected)/trust-funds/[year]/components/TrustFundTableToolbar.tsx` |
| PrintPreviewToolbar | `components/ppdo/table/print-preview/PrintPreviewToolbar.tsx` |
| BudgetTableToolbar (11_project_plan) | `components/ppdo/11_project_plan/table/BudgetTableToolbar.tsx` |

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
| [Toolbar Centralization](./IMPLEMENTATION-PLAN-TOOLBAR-CENTRALIZATION.md) | **Pending** | Centralize all standalone toolbars to use unified TableToolbar |

---

## Current Centralization Status

| Toolbar | Centralized? | Notes |
|---------|:------------:|-------|
| BudgetTableToolbar (Adapter) | Yes | Uses unified TableToolbar |
| ProjectsTableToolbar (Adapter) | Yes | Uses unified TableToolbar |
| FundsTableToolbar (Adapter) | Yes | Uses unified TableToolbar |
| ProjectsTableToolbar (Standalone) | **No** | Needs migration |
| FundsTableToolbar (Standalone) | **No** | Needs migration (has Kanban features) |
| TwentyPercentDFTableToolbar | **No** | Needs migration |
| TrustFundTableToolbar | **No** | Needs migration (missing features) |
| BudgetTableToolbar (Legacy) | **No** | Needs migration |
