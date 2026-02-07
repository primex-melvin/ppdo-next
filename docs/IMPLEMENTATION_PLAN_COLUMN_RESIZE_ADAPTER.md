# Column Resize Adapter - Implementation Plan

> **DRY Principle Implementation**: A unified adapter system for seamless table column resizing across all PPDO pages.

---

## 📋 Executive Summary

### Goal
Create a `columnResizeAdapter` that eliminates code duplication across all table implementations while maintaining 100% backward compatibility with existing functionality.

### Current Pain Points
| Issue | Impact | Solution |
|-------|--------|----------|
| Repeated `useResizableColumns` setup in every table | 30+ lines duplicated per table | Unified adapter hook |
| Duplicated `visibleColumns` calculation | 5 lines per table | Computed in adapter |
| Repeated totals row logic | 60+ lines per table | Generic totals component |
| Duplicated action dropdown patterns | 40+ lines per table | Standardized actions |
| Inconsistent cell rendering switch statements | 20+ lines per table | Cell renderer registry |

### Success Metrics
- **Lines of Code Reduction**: ~80% less code per table
- **Setup Time**: From 30 minutes to 5 minutes for new tables
- **Bug Fix Propagation**: Single location vs 5+ files
- **Type Safety**: 100% TypeScript coverage
- **Backward Compatibility**: Zero breaking changes

---

## 🏗️ Architecture Overview

### Adapter Pattern Design

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         COLUMN RESIZE ADAPTER PATTERN                        │
└─────────────────────────────────────────────────────────────────────────────┘

┌──────────────────┐     ┌─────────────────────┐     ┌─────────────────────┐
│   Page Component │────▶│  Table Component    │────▶│  useColumnResize    │
│   (Existing)     │     │  (Simplified)       │     │  Adapter            │
└──────────────────┘     └─────────────────────┘     └──────────┬──────────┘
                                                                │
                               ┌────────────────────────────────┼────────┐
                               │                                │        │
                               ▼                                ▼        ▼
                         ┌─────────┐  ┌─────────────┐  ┌────────────┐ ┌──────────┐
                         │useTable │  │ Cell Render │  │  Action    │ │  Totals  │
                         │Settings │  │   Registry  │  │  Factory   │ │  Engine  │
                         └─────────┘  └─────────────┘  └────────────┘ └──────────┘
                               │
                               ▼
                        ┌──────────────┐
                        │ useResizable │
                        │   Columns    │
                        │  (Existing)  │
                        └──────────────┘
```

### Adapter Responsibilities

| Component | Responsibility | Replaces |
|-----------|---------------|----------|
| `useColumnResizeAdapter` | Main hook combining all resize logic | `useResizableColumns` + setup |
| `CellRendererRegistry` | Map column types to cell components | Switch statements |
| `ActionDropdownFactory` | Generate standard action dropdowns | Duplicate dropdown code |
| `GenericTotalsRow` | Calculate and display totals | Custom totals per table |
| `UnifiedTableContainer` | Combine container + header + rows | Boilerplate JSX |

---

## 📁 File Structure

```
components/features/ppdo/odpp/utilities/data-tables/
│
├── 📁 core/                          # Existing - no changes
│   └── ...
│
├── 📁 configs/                       # Existing - no changes
│   └── ...
│
├── 📁 cells/                         # Existing - no changes
│   └── ...
│
├── 📁 tables/                        # Existing - REFACTORED
│   ├── ProjectsTable.tsx            # Simplified with adapter
│   ├── FundsTable.tsx               # Simplified with adapter
│   ├── BudgetTable.tsx              # Simplified with adapter
│   ├── TwentyPercentDFTable.tsx     # Simplified with adapter
│   └── index.ts                     # Exports unchanged
│
├── 📁 adapter/                       # NEW - Adapter system
│   │
│   ├── 📁 hooks/                     # Adapter hooks
│   │   ├── useColumnResizeAdapter.ts    # Main adapter hook
│   │   ├── useCellRenderer.ts           # Cell rendering logic
│   │   ├── useTableActions.ts           # Action dropdown generation
│   │   └── useTotalsCalculator.ts       # Generic totals calculation
│   │
│   ├── 📁 components/                # Adapter components
│   │   ├── UnifiedTable.tsx             # Complete table with adapter
│   │   ├── GenericTotalsRow.tsx         # Reusable totals row
│   │   ├── ActionDropdown.tsx           # Standardized actions
│   │   └── CellRenderer.tsx             # Dynamic cell rendering
│   │
│   ├── 📁 registry/                  # Cell renderer registry
│   │   ├── cellRegistry.ts              # Type-to-component mapping
│   │   ├── defaultRenderers.ts          # Built-in renderers
│   │   └── createRenderer.ts            # Renderer factory
│   │
│   ├── 📁 types/                     # Adapter types
│   │   └── adapter.types.ts             # TypeScript interfaces
│   │
│   ├── 📁 utils/                     # Adapter utilities
│   │   ├── columnMapper.ts              # Column configuration helpers
│   │   ├── totalsAggregator.ts          # Totals calculation logic
│   │   └── actionBuilder.ts             # Action menu builder
│   │
│   └── index.ts                      # Public API exports
│
└── index.ts                          # Update to export adapter
```

---

## 🔧 Implementation Phases

### Phase 1: Foundation (Week 1)
**Goal**: Create adapter infrastructure without touching existing tables

#### 1.1 Create Type Definitions
```typescript
// adapter/types/adapter.types.ts

export interface ColumnResizeAdapterOptions<T> {
    tableIdentifier: string;
    columns: ColumnConfig<T>[];
    data: T[];
    
    // Optional configurations
    hiddenColumns?: Set<string>;
    enableSelection?: boolean;
    enableTotals?: boolean;
    totalsConfig?: TotalsConfig<T>;
    
    // Custom renderers (optional)
    customCellRenderers?: Partial<CellRendererRegistry<T>>;
    customActions?: ActionConfig<T>;
}

export interface ColumnResizeAdapterReturn<T> {
    // State
    visibleColumns: ColumnConfig<T>[];
    columnWidths: Map<string, number>;
    rowHeights: RowHeights;
    canEditLayout: boolean;
    isLoading: boolean;
    
    // Selection state (if enabled)
    selectedIds: Set<string>;
    isAllSelected: boolean;
    isIndeterminate: boolean;
    
    // Render helpers
    renderCell: (item: T, column: ColumnConfig<T>) => React.ReactNode;
    renderActions: (item: T) => React.ReactNode;
    renderTotals: () => React.ReactNode;
    
    // Handlers
    onDragStart: (index: number) => void;
    onDragOver: (e: React.DragEvent) => void;
    onDrop: (index: number) => void;
    onStartResize: (e: React.MouseEvent, index: number) => void;
    onStartRowResize: (e: React.MouseEvent, rowId: string) => void;
    onSelectRow: (id: string, checked: boolean) => void;
    onSelectAll: (checked: boolean) => void;
}

export interface CellRendererRegistry<T> {
    text: (item: T, column: ColumnConfig<T>) => React.ReactNode;
    number: (item: T, column: ColumnConfig<T>) => React.ReactNode;
    date: (item: T, column: ColumnConfig<T>) => React.ReactNode;
    status: (item: T, column: ColumnConfig<T>) => React.ReactNode;
    currency: (item: T, column: ColumnConfig<T>) => React.ReactNode;
    percentage: (item: T, column: ColumnConfig<T>) => React.ReactNode;
    custom: (item: T, column: ColumnConfig<T>) => React.ReactNode;
}

export interface ActionConfig<T> {
    onView?: (item: T) => void;
    onEdit?: (item: T) => void;
    onDelete?: (item: T) => void;
    onPin?: (item: T) => void;
    onToggleAutoCalculate?: (item: T) => void;
    onChangeCategory?: (item: T) => void;
    onViewLog?: (item: T) => void;
    customActions?: Array<{
        label: string;
        icon: React.ComponentType;
        onClick: (item: T) => void;
        variant?: 'default' | 'danger';
    }>;
}

export interface TotalsConfig<T> {
    columns: Array<{
        key: keyof T | string;
        aggregator: 'sum' | 'avg' | 'count' | 'custom';
        customAggregator?: (items: T[]) => number;
        formatter?: (value: number) => string;
    }>;
    labelColumn?: string;  // Which column shows "TOTALS" label
}
```

#### 1.2 Create Cell Renderer Registry
```typescript
// adapter/registry/cellRegistry.ts

import { ColumnType, ColumnConfig } from "../../core/types/table.types";
import { CurrencyCell, DateCell, PercentageCell, TextCell, CountCell } from "../../cells";

export const defaultCellRenderers = {
    text: <T,>(item: T, column: ColumnConfig<T>) => {
        const value = (item as any)[column.key];
        return <TextCell value={value} />;
    },
    
    number: <T,>(item: T, column: ColumnConfig<T>) => {
        const value = (item as any)[column.key];
        return <CountCell value={value} />;
    },
    
    date: <T,>(item: T, column: ColumnConfig<T>) => {
        const value = (item as any)[column.key];
        return <DateCell value={value} />;
    },
    
    currency: <T,>(item: T, column: ColumnConfig<T>) => {
        const value = (item as any)[column.key];
        return <CurrencyCell value={value} align={column.align} />;
    },
    
    percentage: <T,>(item: T, column: ColumnConfig<T>) => {
        const value = (item as any)[column.key];
        return <PercentageCell value={value} />;
    },
    
    status: <T,>(item: T, column: ColumnConfig<T>) => {
        // Status rendering is domain-specific
        // Return placeholder - will be overridden
        const value = (item as any)[column.key];
        return <span>{value}</span>;
    },
    
    custom: <T,>(item: T, column: ColumnConfig<T>) => {
        return <span className="truncate">{(item as any)[column.key] || "-"}</span>;
    },
};

export function createCellRenderer<T>(
    type: ColumnType,
    customRenderers: Partial<CellRendererRegistry<T>> = {}
) {
    return customRenderers[type] || defaultCellRenderers[type];
}
```

#### 1.3 Create Main Adapter Hook
```typescript
// adapter/hooks/useColumnResizeAdapter.ts

"use client";

import { useMemo, useCallback } from "react";
import { useResizableColumns } from "../../core/hooks/useResizableColumns";
import { useTableSelection } from "../../core/hooks/useTableSelection";
import { ColumnConfig } from "../../core/types/table.types";
import { createCellRenderer } from "../registry/cellRegistry";
import { useActionDropdown } from "./useTableActions";
import { useTotalsCalculator } from "./useTotalsCalculator";
import type { 
    ColumnResizeAdapterOptions, 
    ColumnResizeAdapterReturn,
    CellRendererRegistry 
} from "../types/adapter.types";

export function useColumnResizeAdapter<T extends { id: string }>(
    options: ColumnResizeAdapterOptions<T>
): ColumnResizeAdapterReturn<T> {
    const {
        tableIdentifier,
        columns,
        data,
        hiddenColumns,
        enableSelection = false,
        enableTotals = false,
        totalsConfig,
        customCellRenderers = {},
        customActions = {},
    } = options;

    // 1. Use existing resize logic (no changes to core)
    const {
        columns: allColumns,
        columnWidths,
        rowHeights,
        canEditLayout,
        startResizeColumn,
        startResizeRow,
        onDragStart,
        onDrop,
        onDragOver,
    } = useResizableColumns({
        tableIdentifier,
        defaultColumns: columns,
    });

    // 2. Calculate visible columns
    const visibleColumns = useMemo(() => {
        if (!hiddenColumns) return allColumns;
        return allColumns.filter(col => !hiddenColumns.has(col.key as string));
    }, [allColumns, hiddenColumns]);

    // 3. Selection logic (if enabled)
    const {
        selectedIds,
        isAllSelected,
        isIndeterminate,
        handleSelectRow,
        handleSelectAll,
    } = useTableSelection({
        data,
        enabled: enableSelection,
    });

    // 4. Cell renderer
    const renderCell = useCallback((item: T, column: ColumnConfig<T>) => {
        const renderer = createCellRenderer<T>(
            column.type,
            customCellRenderers
        );
        return renderer(item, column);
    }, [customCellRenderers]);

    // 5. Actions dropdown
    const { renderActions } = useActionDropdown<T>({
        actions: customActions,
    });

    // 6. Totals row
    const { renderTotals } = useTotalsCalculator<T>({
        data,
        columns: visibleColumns,
        columnWidths,
        config: totalsConfig,
        enabled: enableTotals,
    });

    return {
        // State
        visibleColumns,
        columnWidths,
        rowHeights,
        canEditLayout,
        isLoading: false,
        
        // Selection
        selectedIds: selectedIds || new Set(),
        isAllSelected: isAllSelected || false,
        isIndeterminate: isIndeterminate || false,
        
        // Render helpers
        renderCell,
        renderActions,
        renderTotals,
        
        // Handlers (passthrough from core)
        onDragStart,
        onDragOver,
        onDrop,
        onStartResize: startResizeColumn,
        onStartRowResize: startResizeRow,
        onSelectRow: handleSelectRow || (() => {}),
        onSelectAll: handleSelectAll || (() => {}),
    };
}
```

### Phase 2: Components (Week 1-2)

#### 2.1 Create Unified Table Component
```typescript
// adapter/components/UnifiedTable.tsx

"use client";

import { ResizableTableContainer } from "../../core/ResizableTableContainer";
import { ResizableTableHeader } from "../../core/ResizableTableHeader";
import { ResizableTableRow } from "../../core/ResizableTableRow";
import { DEFAULT_ROW_HEIGHT } from "../../core/constants/table.constants";
import type { ColumnResizeAdapterReturn } from "../types/adapter.types";

interface UnifiedTableProps<T extends { id: string }> {
    data: T[];
    adapter: ColumnResizeAdapterReturn<T>;
    toolbar?: React.ReactNode;
    emptyMessage?: string;
    maxHeight?: string;
}

export function UnifiedTable<T extends { id: string }>({
    data,
    adapter,
    toolbar,
    emptyMessage = "No items found",
    maxHeight,
}: UnifiedTableProps<T>) {
    const {
        visibleColumns,
        columnWidths,
        rowHeights,
        canEditLayout,
        isAllSelected,
        isIndeterminate,
        renderCell,
        renderActions,
        renderTotals,
        onDragStart,
        onDragOver,
        onDrop,
        onStartResize,
        onStartRowResize,
        onSelectAll,
        onSelectRow,
    } = adapter;

    return (
        <ResizableTableContainer toolbar={toolbar} maxHeight={maxHeight}>
            <table style={{ borderCollapse: 'collapse', tableLayout: 'fixed' }}>
                <ResizableTableHeader
                    columns={visibleColumns}
                    columnWidths={columnWidths}
                    canEditLayout={canEditLayout}
                    onDragStart={onDragStart}
                    onDragOver={onDragOver}
                    onDrop={onDrop}
                    onStartResize={onStartResize}
                    isAllSelected={isAllSelected}
                    isIndeterminate={isIndeterminate}
                    onSelectAll={onSelectAll}
                />
                <tbody>
                    {data.length === 0 ? (
                        <tr>
                            <td colSpan={visibleColumns.length + 3} className="px-4 py-8 text-center text-zinc-500">
                                {emptyMessage}
                            </td>
                        </tr>
                    ) : (
                        <>
                            {data.map((item, index) => (
                                <ResizableTableRow
                                    key={item.id}
                                    data={{ ...item, _id: item.id }}
                                    index={index}
                                    columns={visibleColumns}
                                    columnWidths={columnWidths}
                                    rowHeight={rowHeights[item.id] ?? DEFAULT_ROW_HEIGHT}
                                    canEditLayout={canEditLayout}
                                    renderCell={renderCell}
                                    renderActions={renderActions}
                                    onStartRowResize={onStartRowResize}
                                    isSelected={adapter.selectedIds.has(item.id)}
                                    onSelectRow={onSelectRow}
                                />
                            ))}
                            {renderTotals()}
                        </>
                    )}
                </tbody>
            </table>
        </ResizableTableContainer>
    );
}
```

### Phase 3: Refactor Existing Tables (Week 2-3)

#### 3.1 Refactor BudgetTable (Example)

**BEFORE** (~294 lines):
```typescript
export function BudgetTable({
    budgetItems,
    hiddenColumns,
    onRowClick,
    onEdit,
    onDelete,
    onPin,
    onToggleAutoCalculate,
    selectedIds,
    onSelectRow,
    onSelectAll,
}: BudgetTableProps) {
    const {
        columns: allColumns,
        columnWidths,
        rowHeights,
        canEditLayout,
        startResizeColumn,
        startResizeRow,
        onDragStart,
        onDrop,
        onDragOver
    } = useResizableColumns({...});

    const visibleColumns = useMemo(() => {...}, [...]);

    const renderCell = (item: BudgetItem, column: ColumnConfig) => {
        switch (column.key) {  // 25 lines of switches
            case "particular": return <BudgetParticularCell ... />;
            // ... more cases
        }
    };

    const renderActions = (item: BudgetItem) => (  // 55 lines
        <DropdownMenu>...</DropdownMenu>
    );

    // 80+ lines of JSX
    return (...);
}
```

**AFTER** (~60 lines):
```typescript
export function BudgetTable({
    budgetItems,
    hiddenColumns,
    onRowClick,
    onEdit,
    onDelete,
    onPin,
    onToggleAutoCalculate,
}: BudgetTableProps) {
    // Domain-specific cell renderers
    const customRenderers = useMemo(() => ({
        status: (item: BudgetItem) => <BudgetStatusCell item={item} />,
        custom: (item: BudgetItem, column: ColumnConfig) => {
            // Handle budget-specific fields
            switch (column.key) {
                case "particular": return <BudgetParticularCell item={item} />;
                case "projectCompleted": return <BudgetCountCell ... />;
                // ... other budget-specific fields
                default: return <span>{(item as any)[column.key] || "-"}</span>;
            }
        },
    }), []);

    const adapter = useColumnResizeAdapter<BudgetItem>({
        tableIdentifier: "budgetItemsTable_v2",
        columns: BUDGET_TABLE_COLUMNS,
        data: budgetItems,
        hiddenColumns,
        enableSelection: true,
        enableTotals: true,
        totalsConfig: {
            labelColumn: "particular",
            columns: [
                { key: "totalBudgetAllocated", aggregator: "sum", formatter: formatCurrency },
                { key: "obligatedBudget", aggregator: "sum", formatter: formatCurrency },
                { key: "totalBudgetUtilized", aggregator: "sum", formatter: formatCurrency },
                { key: "projectCompleted", aggregator: "sum" },
                { key: "projectDelayed", aggregator: "sum" },
                { key: "projectsOngoing", aggregator: "sum" },
                { key: "utilizationRate", aggregator: "custom", customAggregator: calculateUtilizationRate },
            ],
        },
        customCellRenderers: customRenderers,
        customActions: {
            onView: onRowClick,
            onEdit: onEdit ? (item) => onEdit(item.id, item) : undefined,
            onDelete: onDelete ? (item) => onDelete(item.id) : undefined,
            onPin,
            onToggleAutoCalculate,
        },
    });

    return (
        <UnifiedTable
            data={budgetItems}
            adapter={adapter}
            emptyMessage="No budget items found"
        />
    );
}
```

### Phase 4: Migration Strategy (Week 3-4)

#### 4.1 Migration Order
1. **Start with simplest table**: FundsTable (fewest custom cells)
2. **Then**: TwentyPercentDFTable (similar to Funds)
3. **Then**: BudgetTable (more complex totals)
4. **Finally**: ProjectsTable (most complex with grouping)

#### 4.2 Backward Compatibility Strategy

```typescript
// adapter/index.ts
// Export both new and old APIs

// NEW - Recommended
export { useColumnResizeAdapter } from "./hooks/useColumnResizeAdapter";
export { UnifiedTable } from "./components/UnifiedTable";

// OLD - Still supported (no breaking changes)
export { useResizableColumns } from "../core/hooks/useResizableColumns";
export { ResizableTableContainer, ResizableTableHeader, ResizableTableRow } from "../core";

// Migration helper
export { migrateTableToAdapter } from "./utils/migrationHelper";
```

#### 4.3 Feature Flags for Gradual Rollout

```typescript
// Each table can opt-in to adapter
interface BudgetTableProps {
    // ... existing props
    useAdapter?: boolean;  // Feature flag
}

export function BudgetTable({ useAdapter = false, ...props }: BudgetTableProps) {
    if (useAdapter) {
        return <BudgetTableWithAdapter {...props} />;
    }
    // Legacy implementation
    return <BudgetTableLegacy {...props} />;
}
```

---

## 📊 Code Comparison

### Lines of Code Analysis

| Table | Before (Lines) | After (Lines) | Reduction |
|-------|---------------|---------------|-----------|
| FundsTable | 284 | 45 | 84% |
| TwentyPercentDFTable | 331 | 55 | 83% |
| BudgetTable | 294 | 60 | 80% |
| ProjectsTable | 356 | 75 | 79% |
| **TOTAL** | **1,265** | **235** | **81%** |

### Complexity Analysis

| Aspect | Before | After |
|--------|--------|-------|
| Hooks per table | 3-4 | 1 |
| useMemo calculations | 2-3 | 0 (in adapter) |
| Render functions | 2-3 | 0 (in adapter) |
| JSX nesting depth | 4-5 levels | 1 level |
| Props drilling | Moderate | Minimal |

---

## ✅ Testing Strategy

### Unit Tests
```typescript
// adapter/hooks/__tests__/useColumnResizeAdapter.test.ts
describe("useColumnResizeAdapter", () => {
    it("should return correct visible columns", () => {...});
    it("should handle cell rendering", () => {...});
    it("should calculate totals correctly", () => {...});
    it("should generate action dropdowns", () => {...});
    it("should maintain backward compatibility", () => {...});
});
```

### Integration Tests
```typescript
// Test each refactored table
describe("BudgetTable with Adapter", () => {
    it("should render same as legacy version", () => {...});
    it("should handle column resize", () => {...});
    it("should handle selection", () => {...});
    it("should calculate totals correctly", () => {...});
});
```

### Visual Regression Tests
- Screenshot comparison: Legacy vs Adapter versions
- Pixel-perfect matching required before merge

---

## 🚀 Rollout Plan

### Week 1: Foundation
- [ ] Create type definitions
- [ ] Create cell renderer registry
- [ ] Create main adapter hook
- [ ] Create UnifiedTable component

### Week 2: Core Components
- [ ] Create useActionDropdown hook
- [ ] Create useTotalsCalculator hook
- [ ] Create GenericTotalsRow component
- [ ] Write unit tests

### Week 3: Migration (Part 1)
- [ ] Refactor FundsTable
- [ ] Refactor TwentyPercentDFTable
- [ ] Test both tables thoroughly
- [ ] Fix any issues

### Week 4: Migration (Part 2)
- [ ] Refactor BudgetTable
- [ ] Refactor ProjectsTable
- [ ] Full regression testing
- [ ] Performance benchmarking

### Week 5: Cleanup & Documentation
- [ ] Deprecate old patterns (soft deprecation)
- [ ] Update documentation
- [ ] Create migration guide for future tables
- [ ] Team knowledge sharing session

---

## 🔄 Backward Compatibility Guarantee

### What Stays the Same
1. **All existing props** work exactly the same
2. **All existing imports** continue to work
3. **Database schema** unchanged
4. **User settings** preserved
5. **Core hooks** (`useResizableColumns`) remain available

### What Changes (Internal Only)
1. Table components use less code internally
2. Some internal functions moved to adapter
3. No external API changes

### Migration Path for New Tables
```typescript
// OLD WAY (still works)
import { useResizableColumns, ResizableTableContainer } from "@/data-tables";

// NEW WAY (recommended)
import { useColumnResizeAdapter, UnifiedTable } from "@/data-tables/adapter";
```

---

## 📈 Expected Benefits

### Developer Experience
- **Faster development**: New tables in 5 minutes vs 30 minutes
- **Less code to maintain**: 81% reduction in table component code
- **Fewer bugs**: Centralized logic = single source of truth
- **Easier testing**: Test adapter once, all tables benefit

### Performance
- **Reduced bundle size**: Shared logic deduplicated
- **Fewer re-renders**: Optimized memoization in adapter
- **Faster initial load**: Less component initialization code

### Maintainability
- **Single point of change**: Bug fixes apply to all tables
- **Consistent behavior**: All tables behave identically
- **Type safety**: Full TypeScript coverage
- **Documentation**: One place to document table behavior

---

## 🎯 Success Criteria

| Criteria | Target | Measurement |
|----------|--------|-------------|
| Code reduction | 75%+ | Lines of code comparison |
| Zero breaking changes | 100% | All existing tests pass |
| Test coverage | 90%+ | Coverage report |
| Performance | No regression | Benchmark comparison |
| Developer satisfaction | 8/10+ | Team survey |

---

## 📚 Appendix

### A. Complete API Reference

See inline documentation in each file for complete TypeScript definitions.

### B. Migration Checklist

For each table being migrated:
- [ ] Identify custom cell renderers
- [ ] Identify action dropdown items
- [ ] Define totals configuration
- [ ] Create adapter configuration
- [ ] Replace JSX with UnifiedTable
- [ ] Verify all props still work
- [ ] Run visual regression tests
- [ ] Update storybook (if applicable)

### C. Troubleshooting Guide

| Issue | Solution |
|-------|----------|
| Cell not rendering correctly | Check customCellRenderers configuration |
| Totals not showing | Verify enableTotals and totalsConfig |
| Actions missing | Check customActions configuration |
| Selection not working | Ensure enableSelection is true |

---

*Implementation Plan Version: 1.0*  
*Created: February 2026*  
*Status: Awaiting Approval*

---

**Ready for your review and GO signal! 🚀**
