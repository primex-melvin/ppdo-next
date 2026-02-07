
/**
 * Centralized Table Resize Hook
 *
 * Handles column and row resizing via mouse drag.
 * Uses updateColumnWidth for proper state management via the core useTableSettings.
 */

"use client";

import { useCallback } from "react";
import { ColumnConfig, RowHeights } from "../types/table.types";
import { MIN_ROW_HEIGHT, DEFAULT_ROW_HEIGHT } from "../constants/table.constants";

export interface UseTableResizeProps<T = any> {
    columns: ColumnConfig<T>[];
    rowHeights: RowHeights;
    setRowHeights: React.Dispatch<React.SetStateAction<RowHeights>>;
    canEditLayout: boolean;
    saveLayout: (heights: RowHeights) => void;

    /** 
     * Function to update a single column width (from core useTableSettings).
     * If not provided, falls back to setColumns for legacy compatibility.
     */
    updateColumnWidth?: (columnKey: string, newWidth: number) => void;

    /** @deprecated Use updateColumnWidth instead */
    setColumns?: React.Dispatch<React.SetStateAction<ColumnConfig<T>[]>>;
}

export function useTableResize<T = any>({
    columns,
    rowHeights,
    setRowHeights,
    canEditLayout,
    saveLayout,
    updateColumnWidth,
    setColumns,
}: UseTableResizeProps<T>) {
    /**
     * Minimum column width during resize
     */
    const MIN_COLUMN_WIDTH = 60;

    /**
     * Handles column resize via mouse drag
     */
    const startResizeColumn = useCallback((e: React.MouseEvent, index: number) => {
        if (!canEditLayout) return;

        e.preventDefault();
        e.stopPropagation();

        const startX = e.clientX;
        const column = columns[index];
        const columnKey = String(column.key);
        const startWidth = column.width ?? 150;
        const minWidth = column.minWidth ?? MIN_COLUMN_WIDTH;
        const maxWidth = column.maxWidth ?? 600;

        const onMove = (ev: MouseEvent) => {
            const delta = ev.clientX - startX;
            const newWidth = Math.min(maxWidth, Math.max(minWidth, startWidth + delta));

            // Use updateColumnWidth if available (preferred), otherwise fall back to setColumns
            if (updateColumnWidth) {
                updateColumnWidth(columnKey, newWidth);
            } else if (setColumns) {
                // Legacy fallback - directly mutate columns array
                setColumns(prev => prev.map((col, i) =>
                    i === index ? { ...col, width: newWidth } : col
                ));
            }
        };

        const onUp = () => {
            document.removeEventListener("mousemove", onMove);
            document.removeEventListener("mouseup", onUp);
        };

        document.addEventListener("mousemove", onMove);
        document.addEventListener("mouseup", onUp);
    }, [canEditLayout, columns, updateColumnWidth, setColumns]);

    /**
     * Handles row resize via mouse drag
     */
    const startResizeRow = useCallback((e: React.MouseEvent, rowId: string) => {
        if (!canEditLayout) return;

        e.preventDefault();
        e.stopPropagation();

        const startY = e.clientY;
        const startHeight = rowHeights[rowId] ?? DEFAULT_ROW_HEIGHT;

        const onMove = (ev: MouseEvent) => {
            const delta = ev.clientY - startY;
            setRowHeights(prev => ({
                ...prev,
                [rowId]: Math.max(MIN_ROW_HEIGHT, startHeight + delta),
            }));
        };

        const onUp = () => {
            document.removeEventListener("mousemove", onMove);
            document.removeEventListener("mouseup", onUp);
            setRowHeights(prev => {
                saveLayout(prev);
                return prev;
            });
        };

        document.addEventListener("mousemove", onMove);
        document.addEventListener("mouseup", onUp);
    }, [canEditLayout, rowHeights, saveLayout, setRowHeights]);

    return {
        startResizeColumn,
        startResizeRow,
    };
}
