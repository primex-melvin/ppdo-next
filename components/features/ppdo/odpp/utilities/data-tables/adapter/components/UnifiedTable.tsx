
/**
 * UnifiedTable Component
 * 
 * Complete table component using the column resize adapter.
 * Provides a simplified interface for rendering resizable data tables
 * with support for selection, totals, and custom cell rendering.
 */

"use client";

import { useCallback } from "react";
import { cn } from "@/lib/utils";
import { ResizableTableContainer } from "../../core/ResizableTableContainer";
import { ResizableTableHeader } from "../../core/ResizableTableHeader";
import { ResizableTableRow } from "../../core/ResizableTableRow";
import { DEFAULT_ROW_HEIGHT } from "../../core/constants/table.constants";
import { GenericTotalsRow } from "./GenericTotalsRow";
import { ActionDropdown } from "./ActionDropdown";
import type { 
    ColumnResizeAdapterReturn,
    UnifiedTableProps as UnifiedTablePropsType,
    ActionConfig,
} from "../types/adapter.types";

// Re-export types
export type { UnifiedTablePropsType as UnifiedTableProps };

/**
 * Props for the UnifiedTable component
 */
interface UnifiedTableComponentProps<T extends { id: string }> extends UnifiedTablePropsType<T> {
    /** Optional action configuration for rendering action dropdowns */
    actionConfig?: ActionConfig<T>;
    /** Optional totals configuration (required if adapter has enableTotals) */
    totalsConfig?: Parameters<typeof GenericTotalsRow<T>>[0]["config"];
}

/**
 * Unified Table Component
 * 
 * @example
 * ```tsx
 * const adapter = useColumnResizeAdapter<BudgetItem>({
 *   tableIdentifier: "budgetItemsTable_v2",
 *   columns: BUDGET_TABLE_COLUMNS,
 *   data: budgetItems,
 *   enableSelection: true,
 *   enableTotals: true,
 *   totalsConfig: { ... },
 *   customActions: { onView, onEdit, onDelete },
 * });
 * 
 * return (
 *   <UnifiedTable
 *     data={budgetItems}
 *     adapter={adapter}
 *     actionConfig={{ onView, onEdit, onDelete }}
 *     totalsConfig={totalsConfig}
 *     emptyMessage="No budget items found"
 *   />
 * );
 * ```
 */
export function UnifiedTable<T extends { id: string }>({
    data,
    adapter,
    toolbar,
    emptyMessage = "No items found",
    maxHeight,
    onRowClick,
    className,
    actionConfig,
    totalsConfig,
}: UnifiedTableComponentProps<T>) {
    const {
        visibleColumns,
        columnWidths,
        rowHeights,
        canEditLayout,
        isAllSelected,
        isIndeterminate,
        selectedIds,
        renderCell,
        onDragStart,
        onDragOver,
        onDrop,
        onStartResize,
        onStartRowResize,
        onSelectAll,
        onSelectRow,
    } = adapter;

    // Create renderActions callback that uses ActionDropdown
    const renderActions = useCallback(
        (item: T) => {
            if (!actionConfig) return null;
            return (
                <ActionDropdown
                    item={item}
                    config={actionConfig}
                />
            );
        },
        [actionConfig]
    );

    return (
        <ResizableTableContainer toolbar={toolbar} maxHeight={maxHeight}>
            <table
                className={cn("w-full", className)}
                style={{ borderCollapse: "collapse", tableLayout: "fixed" }}
            >
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
                            <td
                                colSpan={visibleColumns.length + 3}
                                className="px-4 py-8 text-center text-zinc-500"
                            >
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
                                    renderActions={actionConfig ? renderActions : undefined}
                                    onRowClick={onRowClick ? (rowItem, e) => {
                                        onRowClick(rowItem as unknown as T, e);
                                    } : undefined}
                                    onStartRowResize={onStartRowResize}
                                    isSelected={selectedIds.has(item.id)}
                                    onSelectRow={onSelectRow}
                                />
                            ))}
                            {/* Totals row */}
                            {totalsConfig && data.length > 0 && (
                                <GenericTotalsRow
                                    columns={visibleColumns}
                                    columnWidths={columnWidths}
                                    data={data}
                                    config={totalsConfig}
                                />
                            )}
                        </>
                    )}
                </tbody>
            </table>
        </ResizableTableContainer>
    );
}
