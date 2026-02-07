/**
 * Special Education Fund Inspection Page
 *
 * Displays inspections for a specific special education fund breakdown.
 * Uses the modular InspectionPageContainer with the Special Education Fund adapter.
 */

"use client";

import { useParams } from "next/navigation";
import { InspectionPageContainer } from "@/components/features/ppdo/inspection/InspectionPageContainer";
import { specialEducationFundAdapter } from "@/components/features/ppdo/inspection/adapters";
import { useDashboardBreadcrumbs } from "@/lib/hooks/useDashboardBreadcrumbs";
import {
  decodeLabel,
  extractIdFromSlug,
  extractCleanNameFromSlug,
  formatYearLabel,
} from "@/lib/utils/breadcrumb-utils";

export default function SpecialEducationFundInspectionPage() {
  const params = useParams();

  // Extract URL params
  const year = params.year as string;
  const slug = decodeLabel(params.slug as string);
  const breakdownSlug = decodeLabel(params.breakdownId as string);

  // Extract IDs from slugs
  const breakdownId = extractIdFromSlug(breakdownSlug);

  // Extract clean names for breadcrumbs
  const cleanFundName = extractCleanNameFromSlug(slug);
  const cleanBreakdownName = extractCleanNameFromSlug(breakdownSlug);
  const yearLabel = formatYearLabel(year);

  // Fetch data for breadcrumbs (using adapter)
  const breakdown = specialEducationFundAdapter.useGetBreakdown(breakdownId);
  const parent = specialEducationFundAdapter.useGetParent(breakdown);

  // Set up breadcrumbs
  useDashboardBreadcrumbs({
    isDataLoaded: !!(breakdown && parent),
    loadingBreadcrumbs: [
      { label: "Home", href: "/dashboard" },
      { label: "Special Education Funds", href: "/dashboard/special-education-funds" },
      { label: yearLabel, href: `/dashboard/special-education-funds/${year}` },
      { label: cleanFundName, loading: true },
      { label: cleanBreakdownName, loading: true },
    ],
    loadedBreadcrumbs: [
      { label: "Home", href: "/dashboard" },
      { label: "Special Education Funds", href: "/dashboard/special-education-funds" },
      { label: yearLabel, href: `/dashboard/special-education-funds/${year}` },
      {
        label: parent?.name || cleanFundName,
        href: `/dashboard/special-education-funds/${year}/${encodeURIComponent(slug)}`,
      },
      { label: "Inspections" },
    ],
    dependencies: [breakdown, parent, year, slug, breakdownSlug],
  });

  const backUrl = `/dashboard/special-education-funds/${year}/${encodeURIComponent(slug)}`;

  return (
    <InspectionPageContainer
      entityType="specialeducationfund"
      breakdownId={breakdownId}
      backUrl={backUrl}
      backLabel="Back to Breakdown"
      year={year}
      adapter={specialEducationFundAdapter}
      activityLogType="specialeducationfund"
    />
  );
}
