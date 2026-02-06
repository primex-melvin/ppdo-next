import React from "react";
import { EntityStatistics } from "@/components/features/ppdo/odpp/utilities/shared/EntityStatistics";
import type { StatusConfig } from "@/components/features/ppdo/odpp/utilities/shared/StandardStatisticsGrid";
import { useStatusCounts } from "@/lib/shared/hooks/useStatusCounts";

interface BudgetStatisticsProps {
  totalAllocated: number;
  totalUtilized: number;
  totalObligated: number;
  averageUtilizationRate: number;
  totalProjects: number;
  items?: Array<{
    status?: "completed" | "ongoing" | "delayed";
    year?: number;
  }>;
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

export default function BudgetStatistics({
  totalAllocated,
  totalUtilized,
  totalObligated,
  averageUtilizationRate,
  totalProjects,
  items = [],
}: BudgetStatisticsProps) {
  const statusCounts = useStatusCounts(items);

  return (
    <EntityStatistics
      totalAllocated={totalAllocated}
      totalUtilized={totalUtilized}
      totalObligated={totalObligated}
      averageUtilizationRate={averageUtilizationRate}
      totalItems={totalProjects}
      statusCounts={statusCounts}
      statusConfig={PROJECT_STATUS_CONFIG}
      labels={{
        totalItems: "Total Particulars",
      }}
      ariaLabel="Budget statistics"
    />
  );
}