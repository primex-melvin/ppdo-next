/**
 * InspectionStatistics Component
 *
 * Standardized statistics display for the inspection page.
 * Uses EntityStatistics (StandardStatisticsGrid) following DRY principle.
 */

"use client";

import React from "react";
import { EntityStatistics } from "@/components/features/ppdo/odpp/utilities/shared/EntityStatistics";
import type { StatusConfig } from "@/components/features/ppdo/odpp/utilities/shared/StandardStatisticsGrid";
import type { InspectionStats } from "../_hooks/useInspectionStats";

interface InspectionStatisticsProps {
  stats: InspectionStats;
  showDetails?: boolean;
}

const STATUS_CONFIG: StatusConfig[] = [
  { key: "completed", label: "Completed", dotColor: "bg-green-500" },
  { key: "in_progress", label: "In Progress", dotColor: "bg-blue-500" },
  { key: "pending", label: "Pending", dotColor: "bg-yellow-500" },
  { key: "cancelled", label: "Cancelled", dotColor: "bg-red-500" },
];

export function InspectionStatistics({
  stats,
  showDetails = true,
}: InspectionStatisticsProps) {
  if (!showDetails) return null;

  return (
    <EntityStatistics
      totalAllocated={stats.totalInspections}
      totalUtilized={stats.totalViews}
      totalObligated={stats.totalImages}
      averageUtilizationRate={stats.averageImagesPerInspection}
      totalItems={stats.totalInspections}
      statusCounts={stats.statusCounts}
      statusConfig={STATUS_CONFIG}
      labels={{
        allocated: "Total Inspections",
        utilized: "Total Views",
        obligated: "Total Images",
        utilizationRate: "Avg Images per Inspection",
        totalItems: "Total Inspections",
      }}
      className="animate-in fade-in slide-in-from-top-4 duration-500"
      ariaLabel="Inspection statistics"
    />
  );
}

export default InspectionStatistics;
