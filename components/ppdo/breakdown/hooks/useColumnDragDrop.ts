// components/ppdo/breakdown/hooks/useColumnDragDrop.ts

/**
 * Centralized Column Drag & Drop Hook for Breakdown Components
 *
 * Enables column reordering via drag and drop.
 * Used by both Project and Trust Fund breakdown tables.
 */

"use client";

import { useState, useCallback } from "react";
import { ColumnConfig, RowHeights } from "../types/breakdown.types";

interface UseColumnDragDropProps {
  columns: ColumnConfig[];
  setColumns: React.Dispatch<React.SetStateAction<ColumnConfig[]>>;
  rowHeights: RowHeights;
  canEditLayout: boolean;
  saveLayout: (cols: ColumnConfig[], heights: RowHeights) => void;
}

export function useColumnDragDrop({
  columns,
  setColumns,
  rowHeights,
  canEditLayout,
  saveLayout,
}: UseColumnDragDropProps) {
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
