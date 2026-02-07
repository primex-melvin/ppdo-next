
/**
 * GenericTotalsRow Component
 * 
 * Reusable totals row component that calculates and displays totals
 * based on configuration. Supports sum, average, count, and custom aggregations.
 */

"use client";

import { cn } from "@/lib/utils";
import { formatCurrency, formatPercentage } from "../../core/utils/formatters";
import { ColumnConfig } from "../../core/types/table.types";
import { TotalsConfig, TotalsColumnConfig } from "../types/adapter.types";
import { calculateColumnTotal } from "../utils/totalsAggregator";

interface GenericTotalsRowProps<T> {
    /** Visible columns configuration */
    columns: ColumnConfig<T>[];
    /** Current column widths map */
    columnWidths: Map<string, number>;
    /** Table data for aggregation */
    data: T[];
    /** Totals configuration */
    config: TotalsConfig<T>;
    /** Optional className */
    className?: string;
}

/**
 * Get the appropriate formatter for a column
 */
function getFormatter<T>(
    columnConfig?: TotalsColumnConfig<T>,
    columnType?: string
): (value: number) => string {
    // Use custom formatter if provided
    if (columnConfig?.formatter) {
        return columnConfig.formatter;
    }

    // Use default formatters based on column type
    switch (columnType) {
        case "currency":
            return formatCurrency;
        case "percentage":
            return formatPercentage;
        case "number":
            return (value) => value.toLocaleString("en-PH");
        default:
            return (value) => String(value);
    }
}

/**
 * Generic totals row component
 * 
 * @example
 * ```tsx
 * <GenericTotalsRow
 *   columns={visibleColumns}
 *   columnWidths={columnWidths}
 *   data={budgetItems}
 *   config={{
 *     labelColumn: "particular",
 *     columns: [
 *       { key: "totalBudgetAllocated", aggregator: "sum" },
 *       { key: "utilizationRate", aggregator: "custom", customAggregator: calculateRate },
 *     ],
 *   }}
 * />
 * ```
 */
export function GenericTotalsRow<T>({
    columns,
    columnWidths,
    data,
    config,
    className,
}: GenericTotalsRowProps<T>) {
    // Don't render if no data or config
    if (data.length === 0 || !config) {
        return null;
    }

    // Create lookup maps
    const totalsConfigMap = new Map<string, TotalsColumnConfig<T>>();
    for (const col of config.columns) {
        totalsConfigMap.set(String(col.key), col);
    }

    // Calculate totals
    const totals = new Map<string, number>();
    for (const colConfig of config.columns) {
        const value = calculateColumnTotal(data, colConfig);
        totals.set(String(colConfig.key), value);
    }

    // Determine label column
    const labelColumn = config.labelColumn || String(columns[0]?.key);
    const labelText = config.labelText || "TOTALS";

    return (
        <tr
            className={cn(
                "sticky bottom-0 bg-zinc-50 dark:bg-zinc-800 font-bold z-20",
                "shadow-[0_-1px_0_0_rgba(0,0,0,0.1)] dark:shadow-[0_-1px_0_0_rgba(255,255,255,0.1)]",
                className
            )}
        >
            {/* Checkbox column (empty) */}
            <td
                className="text-center py-2"
                style={{ border: "1px solid rgb(228 228 231 / 1)" }}
            />

            {/* Row number column (empty) */}
            <td
                className="text-center py-2 text-[11px] sm:text-xs text-zinc-700 dark:text-zinc-200"
                style={{ border: "1px solid rgb(228 228 231 / 1)" }}
            />

            {/* Data columns */}
            {columns.map((column) => {
                const columnKey = String(column.key);
                const totalsConfig = totalsConfigMap.get(columnKey);
                const hasTotal = totalsConfig !== undefined;
                const totalValue = totals.get(columnKey);

                // Determine cell content
                let cellContent: React.ReactNode = "";

                if (columnKey === labelColumn) {
                    // Show TOTALS label
                    cellContent = (
                        <span className="text-zinc-900 dark:text-zinc-100">
                            {labelText}
                        </span>
                    );
                } else if (hasTotal && totalValue !== undefined) {
                    // Format the total value
                    const formatter = getFormatter(totalsConfig, column.type);
                    const formattedValue = formatter(totalValue);

                    // Special styling for certain types
                    if (column.type === "percentage" && totalValue >= 100) {
                        cellContent = (
                            <span className="text-green-600 dark:text-green-400">
                                {formattedValue}
                            </span>
                        );
                    } else {
                        cellContent = formattedValue;
                    }
                }

                return (
                    <td
                        key={columnKey}
                        className={cn(
                            "px-2 sm:px-3 py-2 text-[11px] sm:text-xs",
                            "text-zinc-800 dark:text-zinc-200"
                        )}
                        style={{
                            border: "1px solid rgb(228 228 231 / 1)",
                            textAlign: column.align,
                        }}
                    >
                        {cellContent}
                    </td>
                );
            })}

            {/* Actions column (empty) */}
            <td
                className="text-center"
                style={{ border: "1px solid rgb(228 228 231 / 1)" }}
            />
        </tr>
    );
}
