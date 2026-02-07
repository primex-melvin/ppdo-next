
/**
 * Default Cell Renderers
 * 
 * Built-in cell renderers for common column types.
 * These can be overridden via customCellRenderers in the adapter options.
 */

"use client";

import { ReactNode } from "react";
import { ColumnConfig } from "../../core/types/table.types";
import { TextCell, CountCell, DateCell, CurrencyCell, PercentageCell } from "../../cells";
import { CellRendererRegistry } from "../types/adapter.types";

/**
 * Default cell renderers for each column type
 */
export const defaultCellRenderers = {
    /** Render text cells using TextCell component */
    text: <T,>(item: T, column: ColumnConfig<T>): ReactNode => {
        const value = (item as Record<string, unknown>)[column.key as string];
        return <TextCell value={String(value ?? "")} align={column.align} />;
    },
    
    /** Render number cells using CountCell component */
    number: <T,>(item: T, column: ColumnConfig<T>): ReactNode => {
        const value = (item as Record<string, unknown>)[column.key as string];
        const numValue = typeof value === "number" ? value : undefined;
        return <CountCell value={numValue} />;
    },
    
    /** Render date cells using DateCell component */
    date: <T,>(item: T, column: ColumnConfig<T>): ReactNode => {
        const value = (item as Record<string, unknown>)[column.key as string];
        // Parse string dates to timestamps, pass through numbers and Date objects
        let dateValue: number | Date | undefined | null = null;
        if (typeof value === "string") {
            const parsed = Date.parse(value);
            dateValue = isNaN(parsed) ? null : parsed;
        } else if (typeof value === "number" || value instanceof Date) {
            dateValue = value;
        }
        return <DateCell value={dateValue} />;
    },
    
    /** Render currency cells using CurrencyCell component */
    currency: <T,>(item: T, column: ColumnConfig<T>): ReactNode => {
        const value = (item as Record<string, unknown>)[column.key as string];
        const numValue = typeof value === "number" ? value : undefined;
        return <CurrencyCell value={numValue} align={column.align} />;
    },
    
    /** Render percentage cells using PercentageCell component */
    percentage: <T,>(item: T, column: ColumnConfig<T>): ReactNode => {
        const value = (item as Record<string, unknown>)[column.key as string];
        const numValue = typeof value === "number" ? value : undefined;
        return <PercentageCell value={numValue} />;
    },
    
    /** 
     * Render status cells 
     * Note: This is a placeholder - status rendering is typically domain-specific.
     * Override this via customCellRenderers for specific table implementations.
     */
    status: <T,>(item: T, column: ColumnConfig<T>): ReactNode => {
        const value = (item as Record<string, unknown>)[column.key as string];
        return (
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-zinc-100 text-zinc-800">
                {String(value ?? "-")}
            </span>
        );
    },
    
    /** 
     * Render custom cells 
     * Default implementation shows the raw value or dash for empty values.
     */
    custom: <T,>(item: T, column: ColumnConfig<T>): ReactNode => {
        const value = (item as Record<string, unknown>)[column.key as string];
        if (value === undefined || value === null || value === "") {
            return <span className="text-zinc-400">-</span>;
        }
        return (
            <span className="truncate block text-xs" title={String(value)}>
                {String(value)}
            </span>
        );
    },
} satisfies CellRendererRegistry<unknown>;

/**
 * Get a cell renderer for a specific column type
 * Falls back to custom renderer if provided, otherwise uses default
 */
export function getCellRenderer<T>(
    type: keyof CellRendererRegistry<T>,
    customRenderers?: Partial<CellRendererRegistry<T>>
): CellRendererRegistry<T>[keyof CellRendererRegistry<T>] {
    if (customRenderers?.[type]) {
        return customRenderers[type];
    }
    return defaultCellRenderers[type] as CellRendererRegistry<T>[keyof CellRendererRegistry<T>];
}
