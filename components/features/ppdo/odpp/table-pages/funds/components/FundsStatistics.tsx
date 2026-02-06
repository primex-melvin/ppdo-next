import React from "react";
import { EntityStatistics } from "@/components/features/ppdo/odpp/utilities/shared/EntityStatistics";
import type { StatusConfig } from "@/components/features/ppdo/odpp/utilities/shared/StandardStatisticsGrid";
import { StatusCounts } from "../types";

export interface FundsStatisticsProps {
  totalAllocated: number;
  totalUtilized: number;
  totalObligated: number;
  averageUtilizationRate: number;
  totalProjects: number;
  statusCounts: StatusCounts;
  labels?: {
    allocated?: string;
    utilized?: string;
    obligated?: string;
    utilizationRate?: string;
    projects?: string;
  };
}

const FUNDS_STATUS_CONFIG: StatusConfig[] = [
  {
    key: "on_process",
    label: "On Process",
    dotColor: "bg-zinc-700",
  },
  {
    key: "ongoing",
    label: "Ongoing",
    dotColor: "bg-zinc-600",
  },
  {
    key: "completed",
    label: "Completed",
    dotColor: "bg-zinc-500",
  },
];

export function FundsStatistics({
  totalAllocated,
  totalUtilized,
  totalObligated,
  averageUtilizationRate,
  totalProjects,
  statusCounts,
  labels = {},
}: FundsStatisticsProps) {
  const counts = {
    on_process: statusCounts.on_process || 0,
    ongoing: statusCounts.ongoing || 0,
    completed: statusCounts.completed || 0,
  };

  return (
    <EntityStatistics
      totalAllocated={totalAllocated}
      totalUtilized={totalUtilized}
      totalObligated={totalObligated}
      averageUtilizationRate={averageUtilizationRate}
      totalItems={totalProjects}
      statusCounts={counts}
      statusConfig={FUNDS_STATUS_CONFIG}
      labels={{
        allocated: labels.allocated ?? "Total Budget Allocated",
        utilized: labels.utilized ?? "Total Budget Utilized",
        obligated: labels.obligated ?? "Total Obligated Budget",
        utilizationRate: labels.utilizationRate ?? "Average Utilization Rate",
        totalItems: labels.projects ?? "Total Projects",
      }}
      ariaLabel="Fund statistics"
    />
  );
}

export default FundsStatistics;