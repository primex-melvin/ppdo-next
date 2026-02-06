import React from "react";
import { EntityStatistics } from "@/components/features/ppdo/odpp/utilities/shared/EntityStatistics";

interface ProjectSummaryStatsProps {
    totalAllocated: number;
    totalUtilized: number;
    avgUtilizationRate: number;
    totalProjects: number;
}

export function ProjectSummaryStats({
    totalAllocated,
    totalUtilized,
    avgUtilizationRate,
    totalProjects,
}: ProjectSummaryStatsProps) {
    return (
        <EntityStatistics
            totalAllocated={totalAllocated}
            totalUtilized={totalUtilized}
            totalObligated={0}
            averageUtilizationRate={avgUtilizationRate}
            totalItems={totalProjects}
            statusCounts={{}}
            statusConfig={[]}
            showBreakdown={false}
            labels={{
                totalItems: "Total Projects",
            }}
            ariaLabel="Project summary statistics"
        />
    );
}