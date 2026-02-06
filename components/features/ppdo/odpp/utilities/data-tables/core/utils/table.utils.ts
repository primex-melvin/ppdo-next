
import { ColumnConfig } from "../types/table.types";

/**
 * Generates CSS grid template columns string
 */
export function generateGridTemplate(columns: ColumnConfig[]): string {
    // Calculate total flex for proportional distribution
    const totalFlex = columns.reduce((sum, c) => sum + c.flex, 0);
    
    return [
        "48px", // Row number column
        ...columns.map(c => `${c.flex}fr`), // Use CSS flex fr units
        "64px" // Actions column
    ].join(" ");
}

/**
 * Merges saved column settings with default columns
 * NOTE: Widths are NOT merged - they always come from defaultColumns (flex values)
 * Only visibility and order are considered from saved settings
 */
export function mergeColumnSettings(
    savedColumns: Array<{ fieldKey: string; isVisible?: boolean }>,
    defaultColumns: ColumnConfig[]
): ColumnConfig[] {
    // Create a map of default columns for quick lookup
    const defaultMap = new Map(defaultColumns.map(col => [String(col.key), col]));
    
    // Build merged array based on saved order (if valid)
    const merged: ColumnConfig[] = [];
    const processedKeys = new Set<string>();

    // First, add columns in saved order (if they exist in defaults)
    savedColumns.forEach(savedCol => {
        const defaultCol = defaultMap.get(savedCol.fieldKey);
        if (defaultCol && !processedKeys.has(savedCol.fieldKey)) {
            merged.push(defaultCol);
            processedKeys.add(savedCol.fieldKey);
        }
    });

    // Then add any default columns that weren't in saved settings
    defaultColumns.forEach(defaultCol => {
        const key = String(defaultCol.key);
        if (!processedKeys.has(key)) {
            merged.push(defaultCol);
            processedKeys.add(key);
        }
    });

    return merged;
}

/**
 * Safely parses JSON string, returns default value on error
 */
export function safeJsonParse<T>(
    jsonString: string | undefined,
    defaultValue: T
): T {
    if (!jsonString) {
        return defaultValue;
    }

    try {
        return JSON.parse(jsonString);
    } catch (error) {
        console.error('Failed to parse JSON:', error);
        return defaultValue;
    }
}

/**
 * Checks if click target is an interactive element
 */
export function isInteractiveElement(target: HTMLElement): boolean {
    return !!(
        target.closest('button') ||
        target.closest('[role="menuitem"]')
    );
}
