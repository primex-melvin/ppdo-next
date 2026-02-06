
"use client";

import { ColumnConfig } from "@/components/features/ppdo/odpp/utilities/shared/table/types/resizableTable.types";
import { formatCurrency, formatPercentage } from "@/components/features/ppdo/odpp/utilities/shared/table/utils/formatters";
import { Project } from "../types";

interface ProjectsTotalsRowProps {
    columns: ColumnConfig[];
    projects: Project[];
}

export function ProjectsTotalsRow({
    columns,
    projects,
}: ProjectsTotalsRowProps) {
    // Calculate totals
    const totals = projects.reduce((acc, project) => {
        acc.allocatedBudget = (acc.allocatedBudget || 0) + (project.totalBudgetAllocated || 0);
        acc.obligatedBudget = (acc.obligatedBudget || 0) + (project.obligatedBudget || 0);
        acc.utilization = (acc.utilization || 0) + (project.totalBudgetUtilized || 0);
        return acc;
    }, { allocatedBudget: 0, obligatedBudget: 0, utilization: 0 });

    // Calculate utilization rate
    const utilizationRate = totals.allocatedBudget > 0
        ? (totals.utilization / totals.allocatedBudget) * 100
        : 0;

    return (
        <tr className="sticky bottom-0 bg-zinc-50 dark:bg-zinc-800 font-bold z-20 shadow-[0_-1px_0_0_rgba(0,0,0,0.1)] dark:shadow-[0_-1px_0_0_rgba(255,255,255,0.1)]">
            {/* Empty Checkbox Cell */}
            <td
                className="text-center py-2"
                style={{
                    border: '2px solid rgb(228 228 231 / 1)',
                }}
            >
                {/* Empty */}
            </td>

            {/* Empty Row Number Cell */}
            <td
                className="text-center py-2 text-[11px] sm:text-xs text-zinc-700 dark:text-zinc-200"
                style={{
                    border: '2px solid rgb(228 228 231 / 1)',
                }}
            >
                {/* Empty */}
            </td>

            {/* Column Totals */}
            {columns.map(column => {
                let cellContent = "";

                if (column.key === "totalBudgetAllocated") {
                    cellContent = formatCurrency(totals.allocatedBudget);
                } else if (column.key === "obligatedBudget") {
                    cellContent = formatCurrency(totals.obligatedBudget);
                } else if (column.key === "totalBudgetUtilized") {
                    cellContent = formatCurrency(totals.utilization);
                } else if (column.key === "utilizationRate") {
                    cellContent = formatPercentage(utilizationRate);
                } else if (column.key === "particulars") {
                    cellContent = "TOTALS";
                }

                return (
                    <td
                        key={column.key as string}
                        className="px-2 sm:px-3 py-2 text-[11px] sm:text-xs text-zinc-800 dark:text-zinc-200"
                        style={{
                            border: '2px solid rgb(228 228 231 / 1)',
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
                    border: '2px solid rgb(228 228 231 / 1)',
                }}
            >
                {/* Empty */}
            </td>
        </tr>
    );
}