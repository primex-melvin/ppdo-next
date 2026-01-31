// app/dashboard/project/budget/[particularId]/[projectbreakdownId]/[inspectionId]/page.tsx

"use client";

import { useParams, useRouter } from "next/navigation";
import { Id } from "@/convex/_generated/dataModel";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { ChevronLeft, Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { useDashboardBreadcrumbs } from "@/lib/hooks/useDashboardBreadcrumbs";
import { decodeLabel, extractIdFromSlug, extractCleanNameFromSlug, getParticularFullName, formatYearLabel } from "@/lib/utils/breadcrumb-utils";
import { FinancialBreakdownCard } from "@/components/ppdo/inspection";
import { FinancialBreakdownHeader, tabs } from "@/components/ppdo/inspection";
import { FinancialBreakdownMain } from "@/components/ppdo/inspection";
import { Card } from "@/components/ppdo/inspection";

export default function BreakdownDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("inspection");
  // Default: start with summary hidden
  const [showSummary, setShowSummary] = useState(false);

  // View mode for Inspections: 'table' or 'list' (default table)
  const [viewMode, setViewMode] = useState<"table" | "list">(() => {
    try {
      if (typeof window === "undefined") return "table";
      const v = localStorage.getItem("inspectionViewMode");
      return v === "list" ? "list" : "table";
    } catch (e) {
      return "table";
    }
  });

  // Persist view mode
  useState(() => {
    try {
      if (typeof window !== "undefined") {
        localStorage.setItem("inspectionViewMode", viewMode);
      }
    } catch (e) {
      // ignore storage errors
    }
  });

  // Extract IDs from URL with decoding
  const year = params.year as string;
  const particularId = decodeLabel(params.particularId as string);
  const projectbreakdownId = decodeLabel(params.projectbreakdownId as string);
  const breakdownSlug = decodeLabel(params.inspectionId as string); // This is the breakdown/inspection slug

  // 🔧 CRITICAL: Extract breakdown ID from the slug
  const breakdownId = extractIdFromSlug(breakdownSlug) as Id<"govtProjectBreakdowns">;

  // Fetch the breakdown first
  const breakdown = useQuery(
    api.govtProjects.getProjectBreakdown,
    { breakdownId }
  );

  // Then fetch the parent project using the breakdown's projectId
  const project = useQuery(
    api.projects.get,
    breakdown?.projectId ? { id: breakdown.projectId as Id<"projects"> } : "skip"
  );

  // Set up breadcrumbs with loading states using the hook
  const particularFullName = getParticularFullName(particularId);
  const cleanProjectName = extractCleanNameFromSlug(projectbreakdownId);
  const cleanBreakdownName = extractCleanNameFromSlug(breakdownSlug);
  const yearLabel = formatYearLabel(year);

  useDashboardBreadcrumbs({
    isDataLoaded: !!(breakdown && project),
    loadingBreadcrumbs: [
      { label: "Home", href: "/dashboard" },
      { label: "Project", href: "/dashboard/project" },
      { label: yearLabel, href: `/dashboard/project/${year}` },
      { label: particularFullName, loading: true },
      { label: cleanProjectName, loading: true },
      { label: cleanBreakdownName, loading: true },
    ],
    loadedBreadcrumbs: [
      { label: "Home", href: "/dashboard" },
      { label: "Project", href: "/dashboard/project" },
      { label: yearLabel, href: `/dashboard/project/${year}` },
      { label: particularFullName, href: `/dashboard/project/${year}/${encodeURIComponent(particularId)}` },
      { label: cleanProjectName, href: `/dashboard/project/${year}/${encodeURIComponent(particularId)}/${encodeURIComponent(projectbreakdownId)}` },
      { label: cleanBreakdownName },
    ],
    dependencies: [breakdown, project, year, particularId, projectbreakdownId, breakdownSlug],
  });

  const handleBack = () => {
    router.push(`/dashboard/project/${year}/${encodeURIComponent(particularId)}/${encodeURIComponent(projectbreakdownId)}`);
  };

  if (!breakdown || !project) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
        <div className="max-w-7xl mx-auto p-6">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 dark:bg-gray-800 rounded w-1/3"></div>
            <div className="h-12 bg-gray-200 dark:bg-gray-800 rounded w-1/2"></div>
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              <div className="h-96 bg-gray-200 dark:bg-gray-800 rounded"></div>
              <div className="lg:col-span-3 h-96 bg-gray-200 dark:bg-gray-800 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Ensure projectId exists before passing to tabs
  const validProjectId = breakdown.projectId || project._id;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="max-w-7xl mx-auto p-6 space-y-4">
        {/* Back Button */}
        <div className="flex items-center justify-between gap-4 -mb-2">
          <button
            onClick={handleBack}
            className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
            <span>Back to Breakdown List</span>
          </button>
        </div>

        {/* Header */}
        <div className="space-y-1">
          <div className="flex items-center justify-between gap-4">
            <h1
              className="text-4xl font-bold text-gray-900 dark:text-gray-100"
              style={{ fontFamily: "Cinzel, serif" }}
            >
              {breakdown.projectTitle || breakdown.projectName || "Breakdown Details"}
            </h1>

            {/* Toggle Summary Button */}
            <button
              onClick={() => setShowSummary(!showSummary)}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              title={showSummary ? "Hide Summary" : "Show Summary"}
            >
              {showSummary ? (
                <>
                  <EyeOff className="w-4 h-4" />
                  <span className="hidden sm:inline">Hide Summary</span>
                </>
              ) : (
                <>
                  <Eye className="w-4 h-4" />
                  <span className="hidden sm:inline">Show Summary</span>
                </>
              )}
            </button>
          </div>

          {/* Tabs: show beneath the Hide/Show Summary toggle */}
          <div className="flex justify-end mt-2">
            <FinancialBreakdownHeader activeTab={activeTab} onTabChange={setActiveTab} />
          </div>

          <p className="text-gray-600 dark:text-gray-400 text-sm">
            {breakdown.implementingOffice && (
              <span className="font-medium">{breakdown.implementingOffice} • </span>
            )}
            Part of: {project.particulars}
          </p>
        </div>

        {/* Layout Grid - Tabs Integration */}
        <div className={`grid grid-cols-1 ${showSummary ? 'lg:grid-cols-4' : 'lg:grid-cols-1'} gap-4`}>
          {/* Left Card - Financial Stats */}
          {showSummary && (
            <div className="lg:col-span-1">
              <FinancialBreakdownCard
                breakdown={breakdown}
                project={project}
              />
            </div>
          )}

          {/* Right Side - Tab Content Only */}
          <div className={showSummary ? 'lg:col-span-3' : 'lg:col-span-1'}>
            <Card className="border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm">
              <div className="pt-0">
                <FinancialBreakdownMain activeTab={activeTab} projectId={validProjectId} viewMode={viewMode} onViewModeChange={setViewMode} />
              </div>
            </Card>
          </div>
        </div>

        {/* Parent Project Info - Moved to bottom for reference */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 rounded-xl border border-blue-200 dark:border-blue-800 p-4 mt-2">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">
            Parent Project Information
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Project</p>
              <p className="text-base font-medium text-gray-900 dark:text-gray-100">
                {project.particulars}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Office</p>
              <p className="text-base font-medium text-gray-900 dark:text-gray-100">
                {project.implementingOffice}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Budget</p>
              <p className="text-base font-medium text-gray-900 dark:text-gray-100">
                ₱{project.totalBudgetAllocated.toLocaleString("en-PH")}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}