// app/components/spreadsheet/utils/cellCalculations.ts

import { ColumnDefinition } from "../types";

/**
 * Calculate totals for all numeric columns
 */
export function calculateTotals(
  data: any[],
  columns: ColumnDefinition[]
): Record<string, number> {
  const totalRow: Record<string, number> = {};
  
  columns.forEach((col) => {
    // Skip year - don't total it
    if (col.key === "year") return;
    
    // Only total currency, number, and percentage columns
    if (col.type === "currency" || col.type === "number" || col.type === "percentage") {
      const sum = data.reduce((acc, item) => {
        const value = item[col.key];
        return acc + (typeof value === "number" ? value : 0);
      }, 0);
      totalRow[col.key] = sum;
    }
  });
  
  return totalRow;
}

/**
 * Calculate row total (sum of currency and number values)
 */
export function calculateRowTotal(
  item: any,
  columns: ColumnDefinition[]
): number {
  return columns.reduce((sum, col) => {
    if (col.type === "currency" || col.type === "number") {
      const value = item[col.key];
      return sum + (typeof value === "number" ? value : 0);
    }
    return sum;
  }, 0);
}

/**
 * Calculate grand total (sum of all currency columns)
 */
export function calculateGrandTotal(
  totals: Record<string, number>,
  columns: ColumnDefinition[]
): number {
  return columns.reduce((sum, col) => {
    if (col.type === "currency") {
      return sum + (totals[col.key] || 0);
    }
    return sum;
  }, 0);
}