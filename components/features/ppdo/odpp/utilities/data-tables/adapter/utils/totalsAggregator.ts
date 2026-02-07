
/**
 * Totals Aggregator Utility
 * 
 * Provides aggregation functions for calculating totals across table data.
 * Supports sum, average, count, and custom aggregation strategies.
 */

import { AggregatorType, TotalsColumnConfig } from "../types/adapter.types";

/**
 * Calculate sum of values for a given key
 */
export function sumAggregator<T>(items: T[], key: keyof T | string): number {
    return items.reduce((acc, item) => {
        const value = (item as Record<string, unknown>)[key as string];
        if (typeof value === "number") {
            return acc + value;
        }
        return acc;
    }, 0);
}

/**
 * Calculate average of values for a given key
 */
export function avgAggregator<T>(items: T[], key: keyof T | string): number {
    if (items.length === 0) return 0;
    const sum = sumAggregator(items, key);
    return sum / items.length;
}

/**
 * Count non-null/non-undefined values for a given key
 */
export function countAggregator<T>(items: T[], key: keyof T | string): number {
    return items.filter(item => {
        const value = (item as Record<string, unknown>)[key as string];
        return value !== undefined && value !== null && value !== "";
    }).length;
}

/**
 * Get the appropriate aggregation function for a given type
 */
export function getAggregator<T>(type: AggregatorType): (items: T[], key: keyof T | string) => number {
    switch (type) {
        case "sum":
            return sumAggregator;
        case "avg":
            return avgAggregator;
        case "count":
            return countAggregator;
        case "custom":
            return () => 0; // Custom aggregators are handled separately
        default:
            return sumAggregator;
    }
}

/**
 * Calculate totals for a single column based on its configuration
 */
export function calculateColumnTotal<T>(
    items: T[],
    config: TotalsColumnConfig<T>
): number {
    if (config.aggregator === "custom" && config.customAggregator) {
        return config.customAggregator(items);
    }
    
    const aggregator = getAggregator<T>(config.aggregator);
    return aggregator(items, config.key);
}

/**
 * Calculate all totals for a table based on totals configuration
 * Returns a map of column key to aggregated value
 */
export function calculateAllTotals<T>(
    items: T[],
    configs: TotalsColumnConfig<T>[]
): Map<string, number> {
    const totals = new Map<string, number>();
    
    for (const config of configs) {
        const value = calculateColumnTotal(items, config);
        totals.set(String(config.key), value);
    }
    
    return totals;
}
