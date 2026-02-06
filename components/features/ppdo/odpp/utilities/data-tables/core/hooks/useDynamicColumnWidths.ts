
import { useMemo } from "react";
import { ColumnConfig } from "../types/table.types";

interface UseDynamicColumnWidthsOptions {
  columns: ColumnConfig[];
  hiddenColumns: Set<string>;
  containerWidth: number;
}

/**
 * Calculates dynamic column widths based on flex weights.
 * Returns a map of column keys to pixel widths.
 */
export function useDynamicColumnWidths({
  columns,
  hiddenColumns,
  containerWidth,
}: UseDynamicColumnWidthsOptions): Map<string, number> {
  return useMemo(() => {
    // Filter to visible columns
    const visibleColumns = columns.filter(col => !hiddenColumns.has(col.key as string));
    
    if (visibleColumns.length === 0) {
      return new Map();
    }

    // Account for row number column (48px) and actions column (64px)
    const fixedColumnsWidth = 48 + 64;
    const availableWidth = Math.max(0, containerWidth - fixedColumnsWidth);
    
    // Calculate total flex
    const totalFlex = visibleColumns.reduce((sum, col) => sum + col.flex, 0);
    
    // Calculate minimum required width
    const minRequiredWidth = visibleColumns.reduce(
      (sum, col) => sum + (col.minWidth || getDefaultMinWidth(col.type)),
      0
    );

    // If can't fit minimums, use minimum widths (table will scroll)
    if (availableWidth <= minRequiredWidth) {
      return new Map(
        visibleColumns.map(col => [
          col.key as string,
          col.minWidth || getDefaultMinWidth(col.type)
        ])
      );
    }

    // Calculate width per flex unit
    const widthPerFlex = availableWidth / totalFlex;
    
    // Calculate each column width
    const widths = new Map<string, number>();
    let totalAllocated = 0;

    visibleColumns.forEach((col, index) => {
      const minW = col.minWidth || getDefaultMinWidth(col.type);
      const idealWidth = Math.round(col.flex * widthPerFlex);
      const finalWidth = Math.max(minW, idealWidth);
      
      widths.set(col.key as string, finalWidth);
      totalAllocated += finalWidth;
    });

    // Distribute remaining space to first column (usually the main text column)
    const remaining = availableWidth - totalAllocated;
    if (remaining > 0 && visibleColumns.length > 0) {
      const firstKey = visibleColumns[0].key as string;
      const currentWidth = widths.get(firstKey) || 0;
      widths.set(firstKey, currentWidth + remaining);
    }

    return widths;
  }, [columns, hiddenColumns, containerWidth]);
}

function getDefaultMinWidth(type: ColumnConfig["type"]): number {
  switch (type) {
    case "text": return 120;
    case "currency": return 100;
    case "percentage": return 80;
    case "number": return 60;
    case "date": return 100;
    case "status": return 90;
    default: return 80;
  }
}
