
/**
 * Combined Resizable Columns Hook
 *
 * Aggregates settings, resize, and drag-and-drop functionality for tables.
 * Now with persisted column widths from database.
 */

"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { useTableSettings } from "./useTableSettings";
import { useTableResize } from "./useTableResize";
import { useColumnDragDrop } from "./useColumnDragDrop";
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
    const [resizingColumn, setResizingColumn] = useState<number | null>(null);

    // Use a ref to track the latest column width during resize to avoid stale closures
    const currentWidthRef = useRef<number>(0);

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

    // 1. Manage Settings (visibility, order, widths, row heights)
    const {
        columns,
        hiddenColumns,
        columnWidths,
        rowHeights,
        setRowHeights,
        setColumnOrder,
        toggleColumnVisibility,
        canEditLayout,
        updateColumnWidth,
        saveLayout,
    } = useTableSettings({
        tableIdentifier,
        defaultColumns,
    });

    // 2. ACTIVE COLUMN RESIZE (now functional with persisted widths!)
    const startResizeColumn = useCallback((e: React.MouseEvent, index: number) => {
        if (!canEditLayout) return;
        if (index < 0 || index >= columns.length) return;

        const col = columns[index];
        if (!col) return;

        e.preventDefault();
        e.stopPropagation();
        setResizingColumn(index);

        const startX = e.clientX;
        const colKey = String(col.key);
        const startWidth = columnWidths.get(colKey) ?? col.width ?? 150;
        const minWidth = col.minWidth ?? 60;
        const maxWidth = col.maxWidth ?? 600;

        // Initialize the ref with the starting width
        currentWidthRef.current = startWidth;

        // NOTE: Temporarily disabled to reduce console noise during search debug
        // console.log(`[Table:${tableIdentifier}] Resize START: ${colKey} (${startWidth}px)`);

        const handleMouseMove = (moveEvent: MouseEvent) => {
            const delta = moveEvent.clientX - startX;
            const newWidth = Math.max(minWidth, Math.min(maxWidth, startWidth + delta));

            // Update the ref with the current width
            currentWidthRef.current = newWidth;

            // NOTE: Temporarily disabled to reduce console noise during search debug
            // console.log(`[Table:${tableIdentifier}] Resize MOVE: ${colKey} → ${newWidth}px`);

            // Optimistic update
            updateColumnWidth(colKey, newWidth);
        };

        const handleMouseUp = () => {
            // Use the ref to get the final width instead of columnWidths state
            // This avoids stale closure issues
            const finalWidth = currentWidthRef.current;
            // NOTE: Temporarily disabled to reduce console noise during search debug
            // console.log(`[Table:${tableIdentifier}] Resize END: ${colKey} → ${finalWidth}px (saved: ${canEditLayout})`);

            setResizingColumn(null);
            document.removeEventListener("mousemove", handleMouseMove);
            document.removeEventListener("mouseup", handleMouseUp);

            // Final width is already saved via updateColumnWidth during drag
        };

        document.addEventListener("mousemove", handleMouseMove);
        document.addEventListener("mouseup", handleMouseUp);
    }, [canEditLayout, columns, columnWidths, updateColumnWidth, tableIdentifier]);

    // 3. Row resize (for future implementation)
    const startResizeRow = useCallback((e: React.MouseEvent, rowId: string) => {
        if (!canEditLayout) return;
        // Implementation similar to column resize
        // Save to rowHeights state and persist via saveLayout
    }, [canEditLayout]);

    // Wrapper for useTableResize (expects 1 param: heights)
    const saveLayoutForResize = useCallback((heights: RowHeights) => {
        saveLayout(heights);
    }, [saveLayout]);

    // Wrapper for useColumnDragDrop (expects 2 params: cols, heights)
    const saveLayoutForDragDrop = useCallback((cols: ColumnConfig[], heights: RowHeights) => {
        saveLayout(heights);
    }, [saveLayout]);

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
        resizingColumn,
        containerRef,
        containerWidth,

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
