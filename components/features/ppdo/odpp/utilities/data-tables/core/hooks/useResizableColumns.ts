
/**
 * Combined Resizable Columns Hook
 *
 * Aggregates settings, resize, and drag-and-drop functionality for tables.
 */

"use client";

import { useTableSettings } from "./useTableSettings";
import { useTableResize } from "./useTableResize";
import { useColumnDragDrop } from "./useColumnDragDrop";
import { ColumnConfig } from "../types/table.types";

export interface UseResizableColumnsOptions {
    tableIdentifier: string;
    defaultColumns: ColumnConfig[];
}

export function useResizableColumns({
    tableIdentifier,
    defaultColumns,
}: UseResizableColumnsOptions) {
    // 1. Manage Settings (and State)
    const {
        columns,
        setColumns,
        rowHeights,
        setRowHeights,
        canEditLayout,
        saveLayout,
    } = useTableSettings({
        tableIdentifier,
        defaultColumns,
    });

    // 2. Manage Resizing
    const { startResizeColumn, startResizeRow } = useTableResize({
        columns,
        setColumns,
        rowHeights,
        setRowHeights,
        canEditLayout,
        saveLayout,
    });

    // 3. Manage Drag & Drop
    const { onDragStart, onDrop, onDragOver, draggedCol } = useColumnDragDrop({
        columns,
        setColumns,
        rowHeights,
        canEditLayout,
        saveLayout,
    });

    return {
        // State
        columns,
        rowHeights,
        canEditLayout,
        draggedCol,

        // Actions
        setColumns,
        setRowHeights,
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
