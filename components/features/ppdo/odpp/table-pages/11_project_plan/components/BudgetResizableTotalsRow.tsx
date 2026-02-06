"use client";

import { ColumnConfig } from "@/components/features/ppdo/odpp/utilities/shared/table/types/resizableTable.types";
import { formatCurrency, formatPercentage } from "@/components/features/ppdo/odpp/utilities/shared/table/utils/formatters";
import { BudgetItem } from "@/types/types";

interface BudgetResizableTotalsRowProps {
    columns: ColumnConfig[];
    budgetItems: BudgetItem[];
}

export function BudgetResizableTotalsRow({
    columns,
    budgetItems,
}: BudgetResizableTotalsRowProps) {
    // Calculate totals
    const totals = budgetItems.reduce((acc, item) => {
        acc.totalBudgetAllocated = (acc.totalBudgetAllocated || 0) + (item.totalBudgetAllocated || 0);
        acc.obligatedBudget = (acc.obligatedBudget || 0) + (item.obligatedBudget || 0);
        acc.totalBudgetUtilized = (acc.totalBudgetUtilized || 0) + (item.totalBudgetUtilized || 0);
        acc.projectCompleted = (acc.projectCompleted || 0) + (item.projectCompleted || 0);
        acc.projectDelayed = (acc.projectDelayed || 0) + (item.projectDelayed || 0);
        acc.projectsOngoing = (acc.projectsOngoing || 0) + (item.projectsOngoing || 0);
        return acc;
    }, {
        totalBudgetAllocated: 0,
        obligatedBudget: 0,
        totalBudgetUtilized: 0,
        projectCompleted: 0,
        projectDelayed: 0,
        projectsOngoing: 0
    });

    // Calculate utilization rate
    const utilizationRate = totals.totalBudgetAllocated > 0
        ? (totals.totalBudgetUtilized / totals.totalBudgetAllocated) * 100
        : 0;

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

                if (column.key === "totalBudgetAllocated") {
                    cellContent = formatCurrency(totals.totalBudgetAllocated);
                } else if (column.key === "obligatedBudget") {
                    cellContent = formatCurrency(totals.obligatedBudget);
                } else if (column.key === "totalBudgetUtilized") {
                    cellContent = formatCurrency(totals.totalBudgetUtilized);
                } else if (column.key === "utilizationRate") {
                    cellContent = (
                        <span className={cn(
                            utilizationRate >= 100 ? "text-green-600 dark:text-green-400" : ""
                        )}>
                            {formatPercentage(utilizationRate)}
                        </span>
                    );
                } else if (column.key === "projectCompleted") {
                    cellContent = totals.projectCompleted;
                } else if (column.key === "projectDelayed") {
                    cellContent = totals.projectDelayed;
                } else if (column.key === "projectsOngoing") {
                    cellContent = totals.projectsOngoing;
                } else if (column.key === "particular") {
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

import { cn } from "@/lib/utils";