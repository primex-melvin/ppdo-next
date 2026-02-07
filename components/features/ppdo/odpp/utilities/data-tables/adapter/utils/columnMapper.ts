
/**
 * Column Mapper Utility
 * 
 * Helper functions for mapping and transforming column configurations.
 */

import { ColumnConfig } from "../../core/types/table.types";

/**
 * Map visible columns by filtering out hidden columns
 */
export function mapVisibleColumns<T>(
    columns: ColumnConfig<T>[],
    hiddenColumns?: Set<string>
): ColumnConfig<T>[] {
    if (!hiddenColumns || hiddenColumns.size === 0) {
        return columns;
    }
    return columns.filter(col => !hiddenColumns.has(String(col.key)));
}

/**
 * Create a column lookup map for efficient access
 */
export function createColumnMap<T>(
    columns: ColumnConfig<T>[]
): Map<string, ColumnConfig<T>> {
    const map = new Map<string, ColumnConfig<T>>();
    for (const col of columns) {
        map.set(String(col.key), col);
    }
    return map;
}

/**
 * Get column index by key
 */
export function getColumnIndex<T>(
    columns: ColumnConfig<T>[],
    key: string
): number {
    return columns.findIndex(col => String(col.key) === key);
}

/**
 * Check if a column is visible (not in hidden columns set)
 */
export function isColumnVisible(
    columnKey: string,
    hiddenColumns?: Set<string>
): boolean {
    if (!hiddenColumns) return true;
    return !hiddenColumns.has(columnKey);
}

/**
 * Toggle column visibility in a hidden columns set
 * Returns a new Set with the column toggled
 */
export function toggleColumnVisibility(
    columnKey: string,
    hiddenColumns: Set<string>
): Set<string> {
    const newSet = new Set(hiddenColumns);
    if (newSet.has(columnKey)) {
        newSet.delete(columnKey);
    } else {
        newSet.add(columnKey);
    }
    return newSet;
}
