
import { ColumnConfig } from "../types/table.types";

export interface CalculatedColumn {
  key: string;
  width: number; // Final pixel width
  flex: number;
  minWidth: number;
}

/**
 * Calculates column widths dynamically based on:
 * - Available container width
 * - Visible columns only
 * - Flex weights (relative importance)
 * - Minimum width constraints
 * 
 * @param columns - All column configs
 * @param hiddenColumns - Set of hidden column keys
 * @param containerWidth - Available width in pixels
 * @returns Map of column key to calculated width
 */
export function calculateColumnWidths(
  columns: ColumnConfig[],
  hiddenColumns: Set<string>,
  containerWidth: number
): Map<string, number> {
  // Filter to visible columns only
  const visibleColumns = columns.filter(col => !hiddenColumns.has(col.key as string));
  
  if (visibleColumns.length === 0) {
    return new Map();
  }

  // Calculate total flex weight
  const totalFlex = visibleColumns.reduce((sum, col) => sum + col.flex, 0);
  
  // Calculate minimum total width needed
  const minTotalWidth = visibleColumns.reduce(
    (sum, col) => sum + (col.minWidth || getDefaultMinWidth(col.type)),
    0
  );

  // If container is smaller than minimum, use minimum widths (will scroll)
  if (containerWidth <= minTotalWidth) {
    return new Map(
      visibleColumns.map(col => [
        col.key as string,
        col.minWidth || getDefaultMinWidth(col.type)
      ])
    );
  }

  // Calculate available width after reserving minimums
  const availableWidth = containerWidth;
  
  // Calculate width per flex unit
  const widthPerFlex = availableWidth / totalFlex;
  
  // Calculate initial widths
  const calculatedWidths = new Map<string, number>();
  let allocatedWidth = 0;

  visibleColumns.forEach(col => {
    const minW = col.minWidth || getDefaultMinWidth(col.type);
    const idealWidth = col.flex * widthPerFlex;
    const finalWidth = Math.max(minW, idealWidth);
    
    calculatedWidths.set(col.key as string, finalWidth);
    allocatedWidth += finalWidth;
  });

  // Distribute any remaining space (rounding errors or constraints)
  const remainingSpace = containerWidth - allocatedWidth;
  if (remainingSpace > 0 && visibleColumns.length > 0) {
    // Add remaining space to the first column (usually particulars/project name)
    const firstColKey = visibleColumns[0].key as string;
    const currentWidth = calculatedWidths.get(firstColKey) || 0;
    calculatedWidths.set(firstColKey, currentWidth + remainingSpace);
  }

  return calculatedWidths;
}

/**
 * Gets default minimum width based on column type
 */
function getDefaultMinWidth(type: ColumnConfig["type"]): number {
  switch (type) {
    case "text": return 150;
    case "currency": return 100;
    case "percentage": return 80;
    case "number": return 60;
    case "date": return 100;
    case "status": return 100;
    default: return 80;
  }
}

/**
 * Hook to measure container width
 */
export function useContainerWidth(ref: React.RefObject<HTMLElement>): number {
  const [width, setWidth] = useState(1200); // Default fallback

  useEffect(() => {
    if (!ref.current) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setWidth(entry.contentRect.width);
      }
    });

    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [ref]);

  return width;
}

import { useState, useEffect } from "react";
