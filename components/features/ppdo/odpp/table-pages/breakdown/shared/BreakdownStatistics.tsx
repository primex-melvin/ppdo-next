import React from "react";
import { EntityStatistics } from "@/components/features/ppdo/odpp/utilities/shared/EntityStatistics";
import type { StatusConfig } from "@/components/features/ppdo/odpp/utilities/shared/StandardStatisticsGrid";

interface BreakdownStatisticsProps {
    totalAllocated: number;
    totalUtilized: number;
    totalObligated: number;
    averageUtilizationRate: number;
    totalBreakdowns: number;
    statusCounts: {
        completed: number;
        ongoing: number;
        delayed: number;
        [key: string]: number;
    };
    showDetails?: boolean;
}

const STATUS_CONFIG: StatusConfig[] = [
    { key: "completed", label: "Completed", dotColor: "bg-zinc-500" },
    { key: "ongoing", label: "Ongoing", dotColor: "bg-zinc-400" },
    { key: "delayed", label: "Delayed", dotColor: "bg-zinc-300" },
];

export function BreakdownStatistics({
    totalAllocated,
    totalUtilized,
    totalObligated,
    averageUtilizationRate,
    totalBreakdowns,
    statusCounts,
    showDetails = true,
}: BreakdownStatisticsProps) {
    if (!showDetails) return null;

    return (
        <EntityStatistics
            totalAllocated={totalAllocated}
            totalUtilized={totalUtilized}
            totalObligated={totalObligated}
            averageUtilizationRate={averageUtilizationRate}
            totalItems={totalBreakdowns}
            statusCounts={statusCounts}
            statusConfig={STATUS_CONFIG}
            labels={{
                allocated: "Total Allocated Budget",
                utilized: "Total Utilized Budget",
                obligated: "Total Obligated Budget",
                utilizationRate: "Average Utilization Rate",
                totalItems: "Total Breakdown Records",
            }}
            className="animate-in fade-in slide-in-from-top-4 duration-500"
            ariaLabel="Breakdown statistics"
        />
    );
}