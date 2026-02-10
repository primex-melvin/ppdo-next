"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useDashboardFilters } from "@/hooks/useDashboardFilters";
import { DashboardFilters } from "@/components/features/analytics/DashboardFilters";
import { DashboardSkeleton } from "@/components/features/analytics/DashboardSkeleton";
import { KPICard } from "@/components/shared/cards";
import { motion } from "framer-motion";
import { AnalyticsGrid } from "./AnalyticsGrid";
import { FolderOpen, CheckCircle2, Clock, TrendingUp } from "lucide-react";

/**
 * Animation variants for the KPI cards container
 */
const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

export function DashboardSummary({ year }: { year: number }) {
  const { filters, updateFilter, resetFilters } = useDashboardFilters();

  // Get fiscal year ID
  const fiscalYears = useQuery(api.fiscalYears.list, {});
  const fiscalYear = fiscalYears?.find(fy => fy.year === year);

  // Destructure to separate flat date fields from the rest
  const { startDate, endDate, ...otherFilters } = filters;

  // Fetch analytics with filters
  const analytics = useQuery(
    api.dashboard.getDashboardAnalytics,
    fiscalYear ? {
      ...otherFilters,
      fiscalYearId: fiscalYear._id,
      dateRange: (startDate && endDate) ? { start: startDate, end: endDate } : undefined,
    } : "skip"
  );

  if (!analytics) {
    return <DashboardSkeleton />;
  }

  // Transform Convex data for AnalyticsGrid components
  const timelineData = {
    [year.toString()]: analytics.timeSeriesData.monthly.map((m: any) => m.projects)
  };

  const colors = ["#10B981", "#3B82F6", "#F59E0B", "#EF4444", "#8B5CF6", "#6366F1", "#EC4899"];

  const pieChartData = {
    status: [
      { name: "Ongoing", value: analytics.chartData.statusDistribution.ongoing, color: "#3B82F6" },
      { name: "Completed", value: analytics.chartData.statusDistribution.completed, color: "#10B981" },
      { name: "Delayed", value: analytics.chartData.statusDistribution.delayed, color: "#EF4444" },
      { name: "Finance", value: 0, color: "#6B7280" }, // Fallback for required type
      { name: "Sector", value: 0, color: "#6B7280" }, // Fallback for required type
      { name: "Department", value: 0, color: "#6B7280" }, // Fallback for required type
      { name: "Budget", value: 0, color: "#6B7280" } // Fallback for required type
    ],
    budget: [
      { name: "Utilized", value: analytics.chartData.budgetOverview.disbursed, color: "#10B981" },
      { name: "Obligated", value: Math.max(0, analytics.chartData.budgetOverview.obligated - analytics.chartData.budgetOverview.disbursed), color: "#F59E0B" },
      { name: "Balance", value: analytics.chartData.budgetOverview.remaining, color: "#6B7280" },
    ],
    sector: (analytics.chartData.categoryDistribution || []).map((cat: any, i: number) => ({
      name: cat.name,
      value: cat.value,
      color: colors[i % colors.length]
    })),
    finance: [
      { name: "Allocated", value: analytics.chartData.budgetOverview.allocated, color: "#3B82F6" },
      { name: "Utilized", value: analytics.chartData.budgetOverview.disbursed, color: "#10B981" },
      { name: "Obligated", value: analytics.chartData.budgetOverview.obligated, color: "#F59E0B" },
      { name: "Balance", value: analytics.chartData.budgetOverview.remaining, color: "#6B7280" },
    ],
    department: (analytics.departmentBreakdown || []).map((d: any, i: number) => ({
      name: d.code || d.name,
      value: d.allocated,
      color: colors[i % colors.length]
    }))
  };

  const utilizationData = (analytics.departmentBreakdown || []).map((d: any) => ({
    department: d.code || d.name,
    utilized: d.utilized,
    obligated: Math.max(0, d.obligated - d.utilized),
    balance: Math.max(0, d.allocated - d.obligated),
  }));

  const budgetDistributionData = (analytics.topCategories || []).map((c: any) => ({
    label: c.category,
    value: c.allocated,
    subValue: `₱${c.utilized.toLocaleString()}`,
    percentage: c.allocated > 0 ? (c.utilized / c.allocated) * 100 : 0
  }));

  return (
    <div className="space-y-6">
      {/* Header with Filters */}
      <DashboardFilters
        filters={filters}
        onChange={updateFilter}
        onReset={resetFilters}
      />

      {/* Enhanced KPI Cards with Trends */}
      <motion.div
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
      >
        <KPICard
          title="Total Projects"
          value={analytics.metrics.totalProjects}
          trend={{ value: 12.5, isPositive: true }}
          icon={<FolderOpen className="w-6 h-6" />}
        />
        <KPICard
          title="Ongoing"
          value={analytics.metrics.ongoingProjects}
          trend={{ value: 5.2, isPositive: true }}
          icon={<Clock className="w-6 h-6" />}
        />
        <KPICard
          title="Completed"
          value={analytics.metrics.completedProjects}
          trend={{ value: 8.1, isPositive: true }}
          icon={<CheckCircle2 className="w-6 h-6" />}
        />
        <KPICard
          title="Utilization Rate"
          value={`${analytics.metrics.utilizationRate.toFixed(1)}%`}
          trend={{ value: 2.4, isPositive: true }}
          icon={<TrendingUp className="w-6 h-6" />}
        />
      </motion.div>

      {/* Enhanced Charts */}
      <AnalyticsGrid
        timelineData={timelineData}
        pieChartData={pieChartData}
        utilizationData={utilizationData}
        budgetDistributionData={budgetDistributionData}
      />
    </div>
  );
}