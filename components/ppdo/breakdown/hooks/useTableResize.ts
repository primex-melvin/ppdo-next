// components/ppdo/breakdown/hooks/useTableResize.ts

/**
 * Centralized Table Resize Hook for Breakdown Components
 *
 * Handles column and row resizing via mouse drag.
 * Used by both Project and Trust Fund breakdown tables.
 */

"use client";

import { useCallback } from "react";
import { ColumnConfig, RowHeights } from "../types/breakdown.types";
import { MIN_COLUMN_WIDTH, MIN_ROW_HEIGHT, DEFAULT_ROW_HEIGHT } from "../constants/table.constants";

interface UseTableResizeProps {
  columns: ColumnConfig[];
  setColumns: React.Dispatch<React.SetStateAction<ColumnConfig[]>>;
  rowHeights: RowHeights;
  setRowHeights: React.Dispatch<React.SetStateAction<RowHeights>>;
  canEditLayout: boolean;
  saveLayout: (cols: ColumnConfig[], heights: RowHeights) => void;
}

export function useTableResize({
  columns,
  setColumns,
  rowHeights,
  setRowHeights,
  canEditLayout,
  saveLayout,
}: UseTableResizeProps) {

  /**
   * Handles column resize via mouse drag
   */
  const startResizeColumn = useCallback((e: React.MouseEvent, index: number) => {
    if (!canEditLayout) return;

    e.preventDefault();
    e.stopPropagation();

    const startX = e.clientX;
    const startWidth = columns[index].width;

    const onMove = (ev: MouseEvent) => {
      const delta = ev.clientX - startX;
      setColumns(prev => {
        const next = [...prev];
        next[index] = {
          ...next[index],
          width: Math.max(MIN_COLUMN_WIDTH, startWidth + delta)
        };
        return next;
      });
    };

    const onUp = () => {
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
      setColumns(prev => {
        saveLayout(prev, rowHeights);
        return prev;
      });
    };

    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
  }, [canEditLayout, columns, rowHeights, saveLayout, setColumns]);

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
        saveLayout(columns, prev);
        return prev;
      });
    };

    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
  }, [canEditLayout, rowHeights, columns, saveLayout, setRowHeights]);

  return {
    startResizeColumn,
    startResizeRow,
  };
}
