import React from "react";
import { EntityStatistics } from "@/components/features/ppdo/odpp/utilities/shared/EntityStatistics";
import type { StatusConfig } from "@/components/features/ppdo/odpp/utilities/shared/StandardStatisticsGrid";
import { useStatusCounts } from "@/lib/shared/hooks/useStatusCounts";
import { TwentyPercentDF } from "../types";

interface TwentyPercentDFStatisticsProps {
    totalAllocated: number;
    totalUtilized: number;
    totalObligated: number;
    averageUtilizationRate: number;
    totalProjects: number;
    items?: TwentyPercentDF[];
}

const DF_STATUS_CONFIG: StatusConfig[] = [
    {
        key: "completed",
        label: "Completed",
        dotColor: "bg-zinc-700",
    },
    {
        key: "ongoing",
        label: "Ongoing",
        dotColor: "bg-zinc-600",
    },
    {
        key: "delayed",
        label: "Delayed",
        dotColor: "bg-zinc-500",
    },
];

export function TwentyPercentDFStatistics({
    totalAllocated,
    totalUtilized,
    totalObligated,
    averageUtilizationRate,
    totalProjects,
    items = [],
}: TwentyPercentDFStatisticsProps) {
    const statusCounts = useStatusCounts(items);

    return (
        <EntityStatistics
            totalAllocated={totalAllocated}
            totalUtilized={totalUtilized}
            totalObligated={totalObligated}
            averageUtilizationRate={averageUtilizationRate}
            totalItems={totalProjects}
            statusCounts={statusCounts}
            statusConfig={DF_STATUS_CONFIG}
            labels={{
                totalItems: "Total Particulars",
            }}
            ariaLabel="20% DF statistics"
        />
    );
}