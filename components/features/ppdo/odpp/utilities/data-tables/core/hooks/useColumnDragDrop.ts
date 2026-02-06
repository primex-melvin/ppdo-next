
/**
 * Centralized Column Drag & Drop Hook
 *
 * Enables column reordering via drag and drop.
 */

"use client";

import { useState, useCallback } from "react";
import { ColumnConfig, RowHeights } from "../types/table.types";

export interface UseColumnDragDropProps<T = any> {
    columns: ColumnConfig<T>[];
    setColumns: React.Dispatch<React.SetStateAction<ColumnConfig<T>[]>>;
    rowHeights: RowHeights;
    canEditLayout: boolean;
    saveLayout: (cols: ColumnConfig<T>[], heights: RowHeights) => void;
}

export function useColumnDragDrop<T = any>({
    columns,
    setColumns,
    rowHeights,
    canEditLayout,
    saveLayout,
}: UseColumnDragDropProps<T>) {
    const [draggedCol, setDraggedCol] = useState<number | null>(null);

    /**
     * Initiates column drag
     */
    const onDragStart = useCallback((index: number) => {
        if (!canEditLayout) return;
        setDraggedCol(index);
    }, [canEditLayout]);

    /**
     * Handles column drop and reordering
     */
    const onDrop = useCallback((index: number) => {
        if (!canEditLayout) return;
        if (draggedCol === null || draggedCol === index) return;

        setColumns(prev => {
            const next = [...prev];
            const [moved] = next.splice(draggedCol, 1);
            next.splice(index, 0, moved);
            saveLayout(next, rowHeights);
            return next;
        });

        setDraggedCol(null);
    }, [canEditLayout, draggedCol, rowHeights, saveLayout, setColumns]);

    /**
     * Allows drag over
     */
    const onDragOver = useCallback((e: React.DragEvent) => {
        if (!canEditLayout) return;
        e.preventDefault();
    }, [canEditLayout]);

    return {
        draggedCol,
        onDragStart,
        onDrop,
        onDragOver,
    };
}
