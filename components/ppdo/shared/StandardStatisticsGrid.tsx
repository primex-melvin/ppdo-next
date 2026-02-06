/**
 * Shared StandardStatisticsGrid Component
 *
 * Standardized 3-column statistics grid used across all table pages.
 * Matches the Budget Tracking 2025 reference design.
 * 
 * Layout:
 * - Column 1: Stat 1 & Stat 2 (stacked)
 * - Column 2: Stat 3 & Stat 4 (stacked)
 * - Column 3: Stat 5 with status breakdown (tall)
 */

"use client";

import React, { useMemo } from "react";
import { StatCard } from "./StatCard";

export interface StatusConfig {
  key: string;
  label: string;
  dotColor: string;
}

export interface StandardStatisticsGridProps {
  // Column 1 stats
  stat1Label: string;
  stat1Value: string;
  stat2Label: string;
  stat2Value: string;
  
  // Column 2 stats
  stat3Label: string;
  stat3Value: string;
  stat4Label: string;
  stat4Value: string;
  
  // Column 3 (with breakdown)
  stat5Label: string;
  stat5Value: string;
  
  // Status breakdown configuration
  statusConfig: StatusConfig[];
  statusCounts: Record<string, number>;
  
  // Optional
  ariaLabel?: string;
  className?: string;
  showBreakdown?: boolean;
}

export function StandardStatisticsGrid({
  stat1Label,
  stat1Value,
  stat2Label,
  stat2Value,
  stat3Label,
  stat3Value,
  stat4Label,
  stat4Value,
  stat5Label,
  stat5Value,
  statusConfig,
  statusCounts,
  ariaLabel = "Statistics",
  className = "",
  showBreakdown = true,
}: StandardStatisticsGridProps) {
  // Build the status breakdown sub-content
  const statusBreakdown = useMemo(() => {
    if (!showBreakdown) return undefined;
    
    const total = Object.values(statusCounts).reduce((sum, count) => sum + count, 0);
    
    return (
      <div className="mt-3 flex flex-col gap-1 text-xs text-zinc-500 dark:text-zinc-400">
        {statusConfig.map((status) => {
          const count = statusCounts[status.key] || 0;
          return (
            <div key={status.key} className="flex justify-between items-center">
              <span className="flex items-center gap-1.5">
                <span className={`w-1.5 h-1.5 rounded-full ${status.dotColor}`} />
                {status.label}
              </span>
              <span className="font-mono tabular-nums">{count}</span>
            </div>
          );
        })}
        {/* Divider and Total */}
        <div className="h-px bg-zinc-200 dark:bg-zinc-700 my-1" />
        <div className="flex justify-between items-center font-medium text-zinc-700 dark:text-zinc-300">
          <span>Total</span>
          <span className="font-mono tabular-nums">{total}</span>
        </div>
      </div>
    );
  }, [statusConfig, statusCounts, showBreakdown]);

  return (
    <section
      aria-label={ariaLabel}
      className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6 no-print ${className}`}
    >
      {/* Column 1: Two stacked stat cards */}
      <div className="flex flex-col gap-4">
        <StatCard label={stat1Label} value={stat1Value} />
        <StatCard label={stat2Label} value={stat2Value} />
      </div>

      {/* Column 2: Two stacked stat cards */}
      <div className="flex flex-col gap-4">
        <StatCard label={stat3Label} value={stat3Value} />
        <StatCard label={stat4Label} value={stat4Value} />
      </div>

      {/* Column 3: One stat card with status breakdown */}
      <div className="md:col-span-2 lg:col-span-1">
        <StatCard
          label={stat5Label}
          value={stat5Value}
          subContent={statusBreakdown}
        />
      </div>
    </section>
  );
}

export default StandardStatisticsGrid;
