import React from "react";
import { EntityStatistics } from "@/components/features/ppdo/odpp/utilities/shared/EntityStatistics";
import type { StatusConfig } from "@/components/features/ppdo/odpp/utilities/shared/StandardStatisticsGrid";

interface ProjectSummaryStatsProps {
  totalAllocated: number;
  totalUtilized: number;
  totalObligated?: number;
  avgUtilizationRate: number;
  totalProjects: number;
  statusCounts?: {
    completed: number;
    ongoing: number;
    delayed: number;
  };
}

const PROJECT_STATUS_CONFIG: StatusConfig[] = [
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

export function ProjectSummaryStats({
  totalAllocated,
  totalUtilized,
  totalObligated = 0,
  avgUtilizationRate,
  totalProjects,
  statusCounts,
}: ProjectSummaryStatsProps) {
  const counts = statusCounts || { completed: 0, ongoing: 0, delayed: 0 };

  return (
    <EntityStatistics
      totalAllocated={totalAllocated}
      totalUtilized={totalUtilized}
      totalObligated={totalObligated}
      averageUtilizationRate={avgUtilizationRate}
      totalItems={totalProjects}
      statusCounts={counts}
      statusConfig={PROJECT_STATUS_CONFIG}
      labels={{
        totalItems: "Total Projects",
      }}
      ariaLabel="Project summary statistics"
    />
  );
}

export default ProjectSummaryStats;