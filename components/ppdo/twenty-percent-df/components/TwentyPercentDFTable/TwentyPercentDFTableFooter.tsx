
"use client";

import { TwentyPercentDFTotals } from "../../types";
import { formatCurrency, formatPercentage, getUtilizationColor, countVisibleLabelColumns } from "../../utils";

interface TwentyPercentDFTableFooterProps {
    totals: TwentyPercentDFTotals;
    hiddenColumns: Set<string>;
    canManageBulkActions: boolean;
    accentColor: string;
}

/**
 * Table footer row displaying totals for all visible columns
 */
export function TwentyPercentDFTableFooter({
    totals,
    hiddenColumns,
    canManageBulkActions,
    accentColor,
}: TwentyPercentDFTableFooterProps) {

    const visibleLabelColSpan = countVisibleLabelColumns(hiddenColumns);

    return (
        <tr className="border-t-2 border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950/50 font-semibold sticky bottom-0 z-10">
            {/* Checkbox column */}
            {canManageBulkActions && <td></td>}

            {/* Label columns (particulars, office, year, status) */}
            {visibleLabelColSpan > 0 && (
                <td className="px-3 py-3" colSpan={visibleLabelColSpan}>
                    <span className="text-sm text-zinc-900">TOTAL</span>
                </td>
            )}

            {/* Budget Allocated */}
            {!hiddenColumns.has('totalBudgetAllocated') && (
                <td className="px-3 py-3 text-right text-sm" style={{ color: accentColor }}>
                    {formatCurrency(totals.totalBudgetAllocated)}
                </td>
            )}

            {/* Obligated Budget */}
            {!hiddenColumns.has('obligatedBudget') && (
                <td className="px-3 py-3 text-right text-sm" style={{ color: accentColor }}>
                    {formatCurrency(totals.obligatedBudget)}
                </td>
            )}

            {/* Budget Utilized */}
            {!hiddenColumns.has('totalBudgetUtilized') && (
                <td className="px-3 py-3 text-right text-sm" style={{ color: accentColor }}>
                    {formatCurrency(totals.totalBudgetUtilized)}
                </td>
            )}

            {/* Utilization Rate */}
            {!hiddenColumns.has('utilizationRate') && (
                <td className="px-3 py-3 text-right text-sm">
                    <span className={getUtilizationColor(totals.utilizationRate)}>
                        {formatPercentage(totals.utilizationRate)}
                    </span>
                </td>
            )}

            {/* Completed */}
            {!hiddenColumns.has('projectCompleted') && (
                <td className="px-3 py-3 text-right text-sm" style={{ color: accentColor }}>
                    {Math.round(totals.projectCompleted)}
                </td>
            )}

            {/* Delayed */}
            {!hiddenColumns.has('projectDelayed') && (
                <td className="px-3 py-3 text-right text-sm" style={{ color: accentColor }}>
                    {totals.projectDelayed}
                </td>
            )}

            {/* Ongoing */}
            {!hiddenColumns.has('projectsOngoing') && (
                <td className="px-3 py-3 text-right text-sm" style={{ color: accentColor }}>
                    {Math.round(totals.projectsOngoing)}
                </td>
            )}

            {/* Remarks */}
            {!hiddenColumns.has('remarks') && (
                <td className="px-3 py-3 text-sm text-zinc-400 text-center">-</td>
            )}
        </tr>
    );
}
