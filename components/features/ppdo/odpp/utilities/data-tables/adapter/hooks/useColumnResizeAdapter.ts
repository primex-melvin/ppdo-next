
/**
 * useColumnResizeAdapter Hook
 * 
 * Main adapter hook that combines all resize, selection, rendering, and totals logic
 * into a single, unified interface for table components.
 * 
 * This hook eliminates code duplication across all PPDO table implementations
 * while maintaining 100% backward compatibility with existing functionality.
 */

"use client";

import { useMemo, useCallback, ReactNode } from "react";
import { useResizableColumns } from "../../core/hooks/useResizableColumns";
import { useTableSelection } from "../../core/hooks/useTableSelection";
import { ColumnConfig } from "../../core/types/table.types";
import { createCellRenderer } from "../registry/cellRegistry";
import { useActionDropdown } from "./useActionDropdown";
import { useTotalsCalculator } from "./useTotalsCalculator";
import type { 
    ColumnResizeAdapterOptions, 
    ColumnResizeAdapterReturn,
    CellRendererRegistry,
    CellRendererType,
} from "../types/adapter.types";

/**
 * Main adapter hook for column resize functionality
 * 
 * @example
 * ```typescript
 * const adapter = useColumnResizeAdapter<BudgetItem>({
 *     tableIdentifier: "budgetItemsTable_v2",
 *     columns: BUDGET_TABLE_COLUMNS,
 *     data: budgetItems,
 *     hiddenColumns,
 *     enableSelection: true,
 *     enableTotals: true,
 *     totalsConfig: { ... },
 *     customCellRenderers: { ... },
 *     customActions: { ... },
 * });
 * 
 * return <UnifiedTable data={budgetItems} adapter={adapter} />;
 * ```
 */
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

    // =========================================================================
    // 1. CORE RESIZE LOGIC (from existing hook - no changes to core)
    // =========================================================================
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

    // =========================================================================
    // 2. VISIBLE COLUMNS CALCULATION
    // =========================================================================
    const visibleColumns = useMemo(() => {
        if (!hiddenColumns || hiddenColumns.size === 0) return allColumns;
        return allColumns.filter(col => !hiddenColumns.has(String(col.key)));
    }, [allColumns, hiddenColumns]);

    // =========================================================================
    // 3. SELECTION LOGIC (if enabled)
    // =========================================================================
    const {
        selectedIds,
        isAllSelected,
        isIndeterminate,
        handleSelectRow,
        handleSelectAll,
    } = useTableSelection<T>({
        data,
        getItemId: (item) => item.id,
    });

    // Wrap selection handlers to match adapter interface
    const onSelectRow = useCallback((id: string, checked: boolean) => {
        if (enableSelection) {
            handleSelectRow(id, checked);
        }
    }, [enableSelection, handleSelectRow]);

    const onSelectAll = useCallback((checked: boolean) => {
        if (enableSelection) {
            handleSelectAll(checked);
        }
    }, [enableSelection, handleSelectAll]);

    // =========================================================================
    // 4. CELL RENDERER
    // =========================================================================
    const renderCell = useCallback((item: T, column: ColumnConfig<T>) => {
        const renderer = createCellRenderer<T>(
            column.type as CellRendererType,
            customCellRenderers
        );
        return renderer(item, column);
    }, [customCellRenderers]);

    // =========================================================================
    // 5. ACTIONS DROPDOWN
    // =========================================================================
    const { getActionMenuItems } = useActionDropdown<T>({
        actions: customActions,
    });

    // Render actions - returns null as actual rendering is done by ActionDropdown component
    // getActionMenuItems is available for components that need the action configuration
    const renderActions = useCallback((item: T): ReactNode => {
        // The actual dropdown rendering is handled by the ActionDropdown component
        // Use getActionMenuItems(item) to get action configuration if needed
        return null;
    }, []);

    // =========================================================================
    // 6. TOTALS CALCULATOR
    // =========================================================================
    const { renderTotals } = useTotalsCalculator<T>({
        data,
        columns: visibleColumns,
        columnWidths,
        config: totalsConfig,
        enabled: enableTotals,
    });

    // =========================================================================
    // 7. RETURN ADAPTER INTERFACE
    // =========================================================================
    return {
        // State
        visibleColumns,
        columnWidths,
        rowHeights,
        canEditLayout,
        isLoading: false,
        
        // Selection (always return valid values, even if disabled)
        selectedIds: selectedIds ?? new Set(),
        isAllSelected: isAllSelected ?? false,
        isIndeterminate: isIndeterminate ?? false,
        
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
        onSelectRow,
        onSelectAll,
    };
}
