"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { DashboardFilters } from "@/hooks/useDashboardFilters";
import { DashboardSkeleton } from "@/components/analytics/DashboardSkeleton";
import { KPICardsRow } from "@/components/ppdo/dashboard/summary/KPICardsRow";
import { EnhancedBudgetChart } from "@/components/analytics/EnhancedBudgetChart";
import { TimeSeriesChart } from "@/components/analytics/TimeSeriesChart";
import { DepartmentBreakdownChart } from "@/components/analytics/DepartmentBreakdownChart";
import { StatusDistributionChart } from "@/components/analytics/StatusDistributionChart";
import { motion, Variants } from "framer-motion";
import { cn } from "@/lib/utils";

interface DashboardContentProps {
    filters: DashboardFilters;
    year?: string;
}

export function DashboardContent({ filters, year }: DashboardContentProps) {
    // Get fiscal year ID first to ensure we have one
    const fiscalYears = useQuery(api.fiscalYears.list, {});

    // Resolve fiscal year ID
    const fiscalYearId = filters.fiscalYearId || (
        year && fiscalYears
            ? fiscalYears.find(fy => fy.year === parseInt(year))?._id
            : undefined
    );

    // Prepare query args avoiding extra fields
    const shouldSkip = !fiscalYearId && (!fiscalYears || fiscalYears.length === 0);

    // Destructure to separate flat date fields from the rest
    const { startDate, endDate, ...otherFilters } = filters;

    // Construct API arguments
    const queryArgs = shouldSkip ? "skip" : {
        ...otherFilters,
        fiscalYearId,
        dateRange: (startDate && endDate) ? { start: startDate, end: endDate } : undefined,
    };

    const analytics = useQuery(
        api.dashboard.getDashboardAnalytics,
        queryArgs
    );

    if (!analytics) {
        return <DashboardSkeleton />;
    }

    const { metrics, chartData, timeSeriesData, departmentBreakdown } = analytics;

    const containerVariants: Variants = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1,
                delayChildren: 0.1
            }
        }
    };

    const itemVariants: Variants = {
        hidden: { opacity: 0, y: -20 },
        show: {
            opacity: 1,
            y: 0,
            transition: {
                type: "spring",
                stiffness: 50,
                damping: 10
            }
        }
    };

    return (
        <motion.div
            className="space-y-6"
            variants={containerVariants}
            initial="hidden"
            animate="show"
        >
            {/* KPI Cards */}
            <motion.div variants={itemVariants}>
                <KPICardsRow
                    totalProjects={metrics.totalProjects}
                    ongoing={metrics.ongoingProjects}
                    completed={metrics.completedProjects}
                    delayed={metrics.delayedProjects}
                />
            </motion.div>

            {/* Top Row: Budget & Time Series */}
            <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <EnhancedBudgetChart data={chartData.budgetOverview} />
                <TimeSeriesChart data={timeSeriesData} />
            </motion.div>

            {/* Bottom Row: Department Breakdown & Categories */}
            <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <DepartmentBreakdownChart
                    data={departmentBreakdown}
                    officeData={analytics.officeBreakdown}
                />

                {/* Status Distribution (New Small Chart) */}
                <StatusDistributionChart data={chartData.statusDistribution} />
            </motion.div>
        </motion.div>
    );
}
