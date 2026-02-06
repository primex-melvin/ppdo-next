
/**
 * Combined Resizable Columns Hook
 *
 * Aggregates settings, resize, and drag-and-drop functionality for tables.
 * Now includes dynamic width calculation based on flex weights.
 */

"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { useTableSettings } from "./useTableSettings";
import { useTableResize } from "./useTableResize";
import { useColumnDragDrop } from "./useColumnDragDrop";
import { useDynamicColumnWidths } from "./useDynamicColumnWidths";
import { ColumnConfig, RowHeights } from "../types/table.types";

export interface UseResizableColumnsOptions {
    tableIdentifier: string;
    defaultColumns: ColumnConfig[];
}

export function useResizableColumns({
    tableIdentifier,
    defaultColumns,
}: UseResizableColumnsOptions) {
    // Ref for measuring container width
    const containerRef = useRef<HTMLDivElement>(null);
    const [containerWidth, setContainerWidth] = useState(1200);

    // Measure container width
    useEffect(() => {
        if (!containerRef.current) return;

        const observer = new ResizeObserver((entries) => {
            for (const entry of entries) {
                setContainerWidth(entry.contentRect.width);
            }
        });

        observer.observe(containerRef.current);
        return () => observer.disconnect();
    }, []);

    // 1. Manage Settings (visibility, order, row heights)
    const {
        columns,
        hiddenColumns,
        rowHeights,
        setRowHeights,
        setColumnOrder,
        toggleColumnVisibility,
        canEditLayout,
        saveLayout,
    } = useTableSettings({
        tableIdentifier,
        defaultColumns,
    });

    // 2. Calculate dynamic widths based on flex
    const columnWidths = useDynamicColumnWidths({
        columns,
        hiddenColumns,
        containerWidth,
    });

    // Wrapper for useTableResize (expects 1 param: heights)
    const saveLayoutForResize = useCallback((heights: RowHeights) => {
        saveLayout(heights);
    }, [saveLayout]);

    // Wrapper for useColumnDragDrop (expects 2 params: cols, heights)
    const saveLayoutForDragDrop = useCallback((cols: ColumnConfig[], heights: RowHeights) => {
        // cols parameter is ignored - widths calculated dynamically from flex
        saveLayout(heights);
    }, [saveLayout]);

    // 3. Manage Resizing (disabled for now - needs flex-based resize logic)
    const { startResizeColumn, startResizeRow } = useTableResize({
        columns,
        setColumns: () => {}, // No-op - widths calculated dynamically
        rowHeights,
        setRowHeights,
        canEditLayout,
        saveLayout: saveLayoutForResize,
    });

    // 4. Manage Drag & Drop
    const { onDragStart, onDrop, onDragOver, draggedCol } = useColumnDragDrop({
        columns,
        setColumns: setColumnOrder as any,
        rowHeights,
        canEditLayout,
        saveLayout: saveLayoutForDragDrop,
    });

    return {
        // State
        columns,
        hiddenColumns,
        columnWidths,
        rowHeights,
        canEditLayout,
        draggedCol,
        containerRef,

        // Actions
        setRowHeights,
        toggleColumnVisibility,
        saveLayout,

        // Resize Handlers
        startResizeColumn,
        startResizeRow,

        // Drag/Drop Handlers
        onDragStart,
        onDrop,
        onDragOver,
    };
}
