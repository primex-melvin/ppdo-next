"use client";

import { useMemo, useState, useCallback } from "react";
import { useQuery } from "convex/react";
import { TrendingUp, Package, FolderTree, Folder, ListTree, FileText } from "lucide-react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import AccessDeniedPage from "@/components/shared/pages/AccessDeniedPage";
import { useBudgetAccess } from "@/components/features/ppdo/odpp/table-pages/11_project_plan";
import { LoadingState } from "@/components/features/ppdo/LoadingState";
import { FundDashboard, FiscalYearWithStats } from "@/components/features/ppdo/fund-dashboard";
import { useFiscalYearDashboard } from "@/hooks/useFiscalYearDashboard";

// Project-specific stats interface
interface ProjectStats {
  budgetItemCount: number;
  projectCount: number;
  breakdownCount: number;
  totalAllocated: number;
  totalUtilized: number;
  utilizationRate: number;
  completedProjects: number;
  ongoingProjects: number;
  delayedProjects: number;
  projectCountVal: number;
}

// Component for lazy-loaded expanded content
function ExpandedCardContent({
  fiscalYearId,
  year,
  accentColor,
}: {
  fiscalYearId: Id<"fiscalYears">;
  year: number;
  accentColor: string;
}) {
  // Lazy load data only when this component mounts (dropdown is opened)
  const allBudgetItems = useQuery(api.budgetItems.list, {});
  const allProjects = useQuery(api.projects.list, {});
  const allBreakdowns = useQuery(api.govtProjects.getProjectBreakdowns, {});

  const stats = useMemo(() => {
    if (!allBudgetItems || !allProjects || !allBreakdowns) return null;

    const yearBudgetItems = allBudgetItems.filter((item) => item.year === year);
    const yearProjects = allProjects.filter((project) => project.year === year);
    const yearBreakdowns = allBreakdowns.filter((breakdown) => {
      const parentProject = allProjects.find((p) => p._id === breakdown.projectId);
      return parentProject?.year === year;
    });

    const totalAllocated = yearBudgetItems.reduce((sum, item) => sum + item.totalBudgetAllocated, 0);
    const totalUtilized = yearBudgetItems.reduce((sum, item) => sum + item.totalBudgetUtilized, 0);
    const utilizationRate = totalAllocated > 0 ? (totalUtilized / totalAllocated) * 100 : 0;

    return {
      budgetItemCount: yearBudgetItems.length,
      projectCount: yearProjects.length,
      breakdownCount: yearBreakdowns.length,
      totalAllocated,
      totalUtilized,
      utilizationRate,
      completedProjects: yearProjects.filter((p) => p.status === "completed").length,
      ongoingProjects: yearProjects.filter((p) => p.status === "ongoing").length,
      delayedProjects: yearProjects.filter((p) => p.status === "delayed").length,
      projectCountVal: yearProjects.length,
    };
  }, [allBudgetItems, allProjects, allBreakdowns, year]);

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  if (!stats) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="inline-block animate-spin rounded-full h-6 w-6 border-3 border-zinc-300 border-t-transparent dark:border-zinc-700 dark:border-t-transparent" />
      </div>
    );
  }

  return (
    <>
      {/* Count Cards - Same style as financial cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-zinc-50 dark:bg-zinc-900 rounded-lg p-3 border border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center gap-2 mb-1">
            <Folder className="w-3 h-3 text-zinc-600 dark:text-zinc-400" />
            <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
              Projects
            </span>
          </div>
          <div className="text-xl font-bold text-zinc-900 dark:text-white">
            {stats.projectCount}
          </div>
        </div>

        <div className="bg-zinc-50 dark:bg-zinc-900 rounded-lg p-3 border border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center gap-2 mb-1">
            <ListTree className="w-3 h-3 text-zinc-600 dark:text-zinc-400" />
            <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
              Breakdowns
            </span>
          </div>
          <div className="text-xl font-bold text-zinc-900 dark:text-white">
            {stats.breakdownCount}
          </div>
        </div>

        <div className="bg-zinc-50 dark:bg-zinc-900 rounded-lg p-3 border border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center gap-2 mb-1">
            <FileText className="w-3 h-3 text-zinc-600 dark:text-zinc-400" />
            <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
              Budget Items
            </span>
          </div>
          <div className="text-xl font-bold text-zinc-900 dark:text-white">
            {stats.budgetItemCount}
          </div>
        </div>
      </div>

      {/* Financial Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-zinc-50 dark:bg-zinc-900 rounded-lg p-3 border border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="w-3 h-3 text-zinc-600 dark:text-zinc-400" />
            <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
              Total Allocated
            </span>
          </div>
          <div className="text-xl font-bold text-zinc-900 dark:text-white">
            {formatCurrency(stats.totalAllocated)}
          </div>
        </div>

        <div className="bg-zinc-50 dark:bg-zinc-900 rounded-lg p-3 border border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center gap-2 mb-1">
            <Package className="w-3 h-3 text-zinc-600 dark:text-zinc-400" />
            <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
              Total Utilized
            </span>
          </div>
          <div className="text-xl font-bold text-zinc-900 dark:text-white">
            {formatCurrency(stats.totalUtilized)}
          </div>
        </div>

        <div className="bg-zinc-50 dark:bg-zinc-900 rounded-lg p-3 border border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center gap-2 mb-1">
            <FolderTree className="w-3 h-3 text-zinc-600 dark:text-zinc-400" />
            <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
              Utilization Rate
            </span>
          </div>
          <div className="text-xl font-bold text-zinc-900 dark:text-white">
            {stats.utilizationRate.toFixed(1)}%
          </div>
        </div>
      </div>

      {/* Project Status Distribution */}
      <div className="bg-zinc-50 dark:bg-zinc-900/50 rounded-lg p-4 border border-zinc-200 dark:border-zinc-800">
        <h4 className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-4">
          Project Status Distribution
        </h4>
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="text-center">
            <div className="text-xl font-bold text-green-600 dark:text-green-500">
              {stats.completedProjects}
            </div>
            <div className="text-xs text-zinc-500 dark:text-zinc-400">Completed</div>
          </div>
          <div className="text-center">
            <div className="text-xl font-bold" style={{ color: accentColor }}>
              {stats.ongoingProjects}
            </div>
            <div className="text-xs text-zinc-500 dark:text-zinc-400">Ongoing</div>
          </div>
          <div className="text-center">
            <div className="text-xl font-bold text-red-600 dark:text-red-500">
              {stats.delayedProjects}
            </div>
            <div className="text-xs text-zinc-500 dark:text-zinc-400">Delayed</div>
          </div>
        </div>

        {stats.projectCountVal > 0 && (
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-zinc-500 dark:text-zinc-400">
              <span>Overall Progress</span>
              <span>
                {stats.completedProjects} of {stats.projectCountVal} completed
              </span>
            </div>
            <div className="h-2 bg-zinc-200 dark:bg-zinc-700 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${(stats.completedProjects / stats.projectCountVal) * 100}%`,
                  backgroundColor: accentColor
                }}
              />
            </div>
          </div>
        )}
      </div>
    </>
  );
}

export default function ProjectDashboardLanding() {
  const { accessCheck, isLoading: isLoadingAccess, canAccess } = useBudgetAccess();

  // Track which cards are expanded for lazy loading
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());

  // Use the shared dashboard hook - only fetch fiscal years (lightweight)
  const {
    sortedYears: baseSortedYears,
    isLoadingYears,
  } = useFiscalYearDashboard({
    routePrefix: "/dashboard/project",
  });

  const handleToggleExpand = useCallback((cardId: string, isExpanded: boolean) => {
    setExpandedCards(prev => {
      const newSet = new Set(prev);
      if (isExpanded) {
        newSet.add(cardId);
      } else {
        newSet.delete(cardId);
      }
      return newSet;
    });
  }, []);

  // Sort years descending
  const sortedYears = useMemo(() => {
    if (!baseSortedYears) return [];
    return [...baseSortedYears].sort((a, b) => b.year - a.year);
  }, [baseSortedYears]);

  const isLoading = isLoadingAccess || isLoadingYears;

  // Access denied renderer
  const renderAccessDenied = () => (
    <AccessDeniedPage
      userName={accessCheck?.user?.name || ""}
      userEmail={accessCheck?.user?.email || ""}
      departmentName={accessCheck?.department?.name || "Not Assigned"}
      pageRequested="Project Budget"
    />
  );

  return (
    <FundDashboard
      title="Years"
      routePrefix="/dashboard/project"
      accentColor="#15803D"
      itemTypeLabel="budget items, projects, or breakdowns"
      sortedYears={sortedYears as unknown as FiscalYearWithStats[]}
      isLoading={isLoading}
      loadingContent={<LoadingState message="Loading years..." />}
      // Empty stats content - counts moved to dropdown
      statsContent={() => null}
      onToggleExpand={handleToggleExpand}
      expandedContent={(fiscalYear) => {
        // Only render expanded content if this card has been expanded
        // This triggers the lazy loading of data
        if (!expandedCards.has(fiscalYear._id)) {
          return (
            <div className="flex items-center justify-center py-8">
              <div className="inline-block animate-spin rounded-full h-6 w-6 border-3 border-zinc-300 border-t-transparent dark:border-zinc-700 dark:border-t-transparent" />
            </div>
          );
        }
        return (
          <ExpandedCardContent
            fiscalYearId={fiscalYear._id}
            year={fiscalYear.year}
            accentColor="#15803D"
          />
        );
      }}
      accessCheck={accessCheck as { user?: { name?: string; email?: string }; department?: { name?: string } } | null}
      canAccess={canAccess}
      renderAccessDenied={renderAccessDenied}
    />
  );
}
