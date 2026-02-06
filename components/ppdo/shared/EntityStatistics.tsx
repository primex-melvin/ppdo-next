import React from "react";
import { StandardStatisticsGrid, StatusConfig } from "./StandardStatisticsGrid";
import { useCurrencyFormatter } from "@/lib/shared/hooks/useCurrencyFormatter";

export interface EntityStatisticsProps {
    // Core data
    totalAllocated: number;
    totalUtilized: number;
    totalObligated: number;
    averageUtilizationRate: number;
    totalItems: number;

    // Status data
    statusCounts: Record<string, number>;
    statusConfig: StatusConfig[];

    // Customization
    labels?: {
        allocated?: string;
        utilized?: string;
        obligated?: string;
        utilizationRate?: string;
        totalItems?: string;
    };

    // Optional features
    showBreakdown?: boolean; // Defaults to true
    ariaLabel?: string;
    className?: string;
}

export function EntityStatistics({
    totalAllocated,
    totalUtilized,
    totalObligated,
    averageUtilizationRate,
    totalItems,
    statusCounts,
    statusConfig,
    labels = {},
    showBreakdown = true,
    ariaLabel = "Statistics",
    className = "",
}: EntityStatisticsProps) {
    const currency = useCurrencyFormatter();

    return (
        <StandardStatisticsGrid
            ariaLabel={ariaLabel}
            className={className}
            stat1Label={labels.allocated ?? "Total Budget Allocated"}
            stat1Value={currency.format(totalAllocated)}
            stat2Label={labels.utilizationRate ?? "Average Utilization Rate"}
            stat2Value={`${averageUtilizationRate.toFixed(1)}%`}
            stat3Label={labels.utilized ?? "Total Budget Utilized"}
            stat3Value={currency.format(totalUtilized)}
            stat4Label={labels.obligated ?? "Total Obligated Budget"}
            stat4Value={currency.format(totalObligated)}
            stat5Label={labels.totalItems ?? "Total Items"}
            stat5Value={totalItems.toLocaleString()}
            statusConfig={statusConfig}
            statusCounts={statusCounts}
            showBreakdown={showBreakdown}
        />
    );
}

export default EntityStatistics;
