
/**
 * useTotalsCalculator Hook
 * 
 * Calculates and renders totals rows for tables.
 * Supports sum, average, count, and custom aggregation strategies.
 */

"use client";

import { useMemo, useCallback, ReactNode } from "react";
import { ColumnConfig } from "../../core/types/table.types";
import { TotalsConfig, TotalsColumnConfig } from "../types/adapter.types";
import { calculateAllTotals } from "../utils/totalsAggregator";

export interface UseTotalsCalculatorOptions<T> {
    data: T[];
    columns: ColumnConfig<T>[];
    columnWidths: Map<string, number>;
    config?: TotalsConfig<T>;
    enabled?: boolean;
}

export interface UseTotalsCalculatorReturn<T> {
    /** Calculated totals map (columnKey -> value) */
    totals: Map<string, number>;
    /** Get formatted value for a specific column */
    getFormattedValue: (columnKey: string) => string;
    /** Render the totals row */
    renderTotals: () => ReactNode | null;
}

/**
 * Default formatters for common data types
 */
const defaultFormatters: Record<string, (value: number) => string> = {
    currency: (value) => {
        return new Intl.NumberFormat("en-PH", {
            style: "currency",
            currency: "PHP",
            minimumFractionDigits: 2,
        }).format(value);
    },
    percentage: (value) => `${value.toFixed(2)}%`,
    number: (value) => value.toLocaleString("en-PH"),
};

/**
 * Get the appropriate formatter for a column
 */
function getFormatter<T>(
    columnConfig?: TotalsColumnConfig<T>,
    columnType?: string
): (value: number) => string {
    if (columnConfig?.formatter) {
        return columnConfig.formatter;
    }
    
    if (columnType && defaultFormatters[columnType]) {
        return defaultFormatters[columnType];
    }
    
    return defaultFormatters.number;
}

export function useTotalsCalculator<T>(
    options: UseTotalsCalculatorOptions<T>
): UseTotalsCalculatorReturn<T> {
    const { data, columns, config, enabled = false } = options;

    // Calculate all totals
    const totals = useMemo(() => {
        if (!enabled || !config || data.length === 0) {
            return new Map<string, number>();
        }
        return calculateAllTotals(data, config.columns);
    }, [data, config, enabled]);

    // Create a lookup for column configs
    const columnConfigMap = useMemo(() => {
        if (!config) return new Map<string, TotalsColumnConfig<T>>();
        const map = new Map<string, TotalsColumnConfig<T>>();
        for (const col of config.columns) {
            map.set(String(col.key), col);
        }
        return map;
    }, [config]);

    // Create a lookup for column types
    const columnTypeMap = useMemo(() => {
        const map = new Map<string, string>();
        for (const col of columns) {
            map.set(String(col.key), col.type);
        }
        return map;
    }, [columns]);

    // Get formatted value for a column
    const getFormattedValue = useCallback(
        (columnKey: string): string => {
            const value = totals.get(columnKey);
            if (value === undefined) return "";
            
            const columnConfig = columnConfigMap.get(columnKey);
            const columnType = columnTypeMap.get(columnKey);
            const formatter = getFormatter(columnConfig, columnType);
            
            return formatter(value);
        },
        [totals, columnConfigMap, columnTypeMap]
    );

    // Get raw value for a column
    const getValue = useCallback(
        (columnKey: string): number | undefined => {
            return totals.get(columnKey);
        },
        [totals]
    );

    // Render function - returns null (actual rendering done by GenericTotalsRow component)
    const renderTotals = useCallback((): ReactNode | null => {
        if (!enabled || !config || data.length === 0) {
            return null;
        }
        // The actual rendering is handled by GenericTotalsRow component
        // This function exists to maintain the adapter interface
        return null;
    }, [enabled, config, data.length]);

    return {
        totals,
        getFormattedValue,
        renderTotals,
    };
}
