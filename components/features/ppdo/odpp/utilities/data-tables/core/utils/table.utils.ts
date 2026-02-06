
import { ColumnConfig } from "../types/table.types";

/**
 * Generates CSS grid template columns string
 */
export function generateGridTemplate(columns: ColumnConfig[]): string {
    return [
        "48px", // Row number column
        ...columns.map(c => `${c.width}px`),
        "64px" // Actions column
    ].join(" ");
}

/**
 * Merges saved column settings with default columns
 */
export function mergeColumnSettings(
    savedColumns: Array<{ fieldKey: string; width: number }>,
    defaultColumns: ColumnConfig[]
): ColumnConfig[] {
    const merged: ColumnConfig[] = [];

    // First, add all saved columns with their widths
    savedColumns.forEach(savedCol => {
        const defaultCol = defaultColumns.find(col => col.key === savedCol.fieldKey);
        if (defaultCol) {
            merged.push({ ...defaultCol, width: savedCol.width });
        }
    });

    // Then add any default columns that weren't in saved settings
    defaultColumns.forEach(defaultCol => {
        if (!merged.find(col => col.key === defaultCol.key)) {
            merged.push(defaultCol);
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
