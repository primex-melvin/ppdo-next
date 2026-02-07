/**
 * Project Inspection Page
 *
 * Displays inspections for a specific project breakdown.
 * Uses the modular InspectionPageContainer with the Project adapter.
 */

"use client";

import { useParams } from "next/navigation";
import { InspectionPageContainer } from "@/components/features/ppdo/inspection/InspectionPageContainer";
import { projectAdapter } from "@/components/features/ppdo/inspection/adapters";
import { useDashboardBreadcrumbs } from "@/lib/hooks/useDashboardBreadcrumbs";
import {
  decodeLabel,
  extractIdFromSlug,
  extractCleanNameFromSlug,
  getParticularFullName,
  formatYearLabel,
} from "@/lib/utils/breadcrumb-utils";

export default function ProjectInspectionPage() {
  const params = useParams();

  // Extract URL params
  const year = params.year as string;
  const particularId = decodeLabel(params.particularId as string);
  const projectbreakdownId = decodeLabel(params.projectbreakdownId as string);
  const breakdownSlug = decodeLabel(params.breakdownId as string);

  // Extract IDs from slugs
  const breakdownId = extractIdFromSlug(breakdownSlug);

  // Extract clean names for breadcrumbs
  const particularFullName = getParticularFullName(particularId);
  const cleanProjectName = extractCleanNameFromSlug(projectbreakdownId);
  const cleanBreakdownName = extractCleanNameFromSlug(breakdownSlug);
  const yearLabel = formatYearLabel(year);

  // Fetch data for breadcrumbs (using adapter)
  const breakdown = projectAdapter.useGetBreakdown(breakdownId);
  const project = projectAdapter.useGetParent(breakdown);

  // Set up breadcrumbs
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
      {
        label: particularFullName,
        href: `/dashboard/project/${year}/${encodeURIComponent(particularId)}`,
      },
      {
        label: project?.particulars || cleanProjectName,
        href: `/dashboard/project/${year}/${encodeURIComponent(particularId)}/${encodeURIComponent(projectbreakdownId)}`,
      },
      { label: "Inspections" },
    ],
    dependencies: [breakdown, project, year, particularId, projectbreakdownId, breakdownSlug],
  });

  const backUrl = `/dashboard/project/${year}/${encodeURIComponent(particularId)}/${encodeURIComponent(projectbreakdownId)}`;

  return (
    <InspectionPageContainer
      entityType="project"
      breakdownId={breakdownId}
      backUrl={backUrl}
      backLabel="Back to Breakdown"
      year={year}
      adapter={projectAdapter}
      activityLogType="breakdown"
    />
  );
}
