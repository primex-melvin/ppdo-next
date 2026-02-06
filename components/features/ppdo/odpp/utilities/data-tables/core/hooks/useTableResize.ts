
/**
 * Centralized Table Resize Hook
 *
 * Handles row resizing via mouse drag.
 * NOTE: Column resizing is disabled - widths are calculated dynamically from flex values.
 */

"use client";

import { useCallback } from "react";
import { ColumnConfig, RowHeights } from "../types/table.types";
import { MIN_ROW_HEIGHT, DEFAULT_ROW_HEIGHT } from "../constants/table.constants";

export interface UseTableResizeProps<T = any> {
    columns: ColumnConfig<T>[];
    setColumns: React.Dispatch<React.SetStateAction<ColumnConfig<T>[]>>;
    rowHeights: RowHeights;
    setRowHeights: React.Dispatch<React.SetStateAction<RowHeights>>;
    canEditLayout: boolean;
    saveLayout: (heights: RowHeights) => void;
}

export function useTableResize<T = any>({
    columns,
    setColumns,
    rowHeights,
    setRowHeights,
    canEditLayout,
    saveLayout,
}: UseTableResizeProps<T>) {

    /**
     * Column resize is disabled - widths are calculated dynamically from flex values.
     * To resize columns, users can hide/show columns via the Columns toolbar.
     */
    const startResizeColumn = useCallback((e: React.MouseEvent, index: number) => {
        // No-op: Column resizing disabled in flex-based layout
        console.log("Column resizing is disabled in flex-based layout");
    }, []);

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
