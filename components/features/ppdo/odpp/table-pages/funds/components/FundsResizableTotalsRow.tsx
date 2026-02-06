"use client";

import { ColumnConfig } from "@/components/features/ppdo/odpp/utilities/shared/table/types/resizableTable.types";
import { formatCurrency, formatPercentage } from "@/components/features/ppdo/odpp/utilities/shared/table/utils/formatters";
import { cn } from "@/lib/utils";

interface FundsResizableTotalsRowProps {
    columns: ColumnConfig[];
    totals: {
        received: number;
        obligatedPR: number;
        utilized: number;
        balance: number;
        utilizationRate: number;
    };
}

export function FundsResizableTotalsRow({
    columns,
    totals,
}: FundsResizableTotalsRowProps) {

    return (
        <tr className="sticky bottom-0 bg-zinc-50 dark:bg-zinc-800 font-bold z-20 shadow-[0_-1px_0_0_rgba(0,0,0,0.1)] dark:shadow-[0_-1px_0_0_rgba(255,255,255,0.1)]">
            {/* Empty Checkbox Cell */}
            <td
                className="text-center py-2"
                style={{
                    border: '1px solid rgb(228 228 231 / 1)',
                }}
            >
                {/* Empty */}
            </td>

            {/* Empty Row Number Cell */}
            <td
                className="text-center py-2 text-[11px] sm:text-xs text-zinc-700 dark:text-zinc-200"
                style={{
                    border: '1px solid rgb(228 228 231 / 1)',
                }}
            >
                {/* Empty */}
            </td>

            {/* Column Totals */}
            {columns.map(column => {
                let cellContent: React.ReactNode = "";

                if (column.key === "received") {
                    cellContent = formatCurrency(totals.received);
                } else if (column.key === "utilized") {
                    cellContent = formatCurrency(totals.utilized);
                } else if (column.key === "balance") {
                    cellContent = formatCurrency(totals.balance);
                } else if (column.key === "utilizationRate") {
                    const rate = totals.utilizationRate || 0;
                    cellContent = (
                        <span className={cn(
                            rate >= 100 ? "text-green-600 dark:text-green-400" : ""
                        )}>
                            {formatPercentage(rate)}
                        </span>
                    );
                } else if (column.key === "projectTitle") {
                    cellContent = "TOTALS";
                }

                return (
                    <td
                        key={column.key as string}
                        className="px-2 sm:px-3 py-2 text-[11px] sm:text-xs text-zinc-800 dark:text-zinc-200"
                        style={{
                            border: '1px solid rgb(228 228 231 / 1)',
                            textAlign: column.align,
                        }}
                    >
                        {cellContent}
                    </td>
                );
            })}

            {/* Actions Column Placeholder (if displayed in parent) */}
            <td
                className="text-center"
                style={{
                    border: '1px solid rgb(228 228 231 / 1)',
                }}
            >
                {/* Empty */}
            </td>
        </tr>
    );
}