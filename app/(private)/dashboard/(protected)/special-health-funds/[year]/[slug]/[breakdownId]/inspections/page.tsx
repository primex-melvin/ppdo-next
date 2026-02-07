/**
 * Special Health Fund Inspection Page
 *
 * Displays inspections for a specific special health fund breakdown.
 * Uses the modular InspectionPageContainer with the Special Health Fund adapter.
 */

"use client";

import { useParams } from "next/navigation";
import { InspectionPageContainer } from "@/components/features/ppdo/inspection/InspectionPageContainer";
import { specialHealthFundAdapter } from "@/components/features/ppdo/inspection/adapters";
import { useDashboardBreadcrumbs } from "@/lib/hooks/useDashboardBreadcrumbs";
import {
  decodeLabel,
  extractIdFromSlug,
  extractCleanNameFromSlug,
  formatYearLabel,
} from "@/lib/utils/breadcrumb-utils";

export default function SpecialHealthFundInspectionPage() {
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
  const breakdown = specialHealthFundAdapter.useGetBreakdown(breakdownId);
  const parent = specialHealthFundAdapter.useGetParent(breakdown);

  // Set up breadcrumbs
  useDashboardBreadcrumbs({
    isDataLoaded: !!(breakdown && parent),
    loadingBreadcrumbs: [
      { label: "Home", href: "/dashboard" },
      { label: "Special Health Funds", href: "/dashboard/special-health-funds" },
      { label: yearLabel, href: `/dashboard/special-health-funds/${year}` },
      { label: cleanFundName, loading: true },
      { label: cleanBreakdownName, loading: true },
    ],
    loadedBreadcrumbs: [
      { label: "Home", href: "/dashboard" },
      { label: "Special Health Funds", href: "/dashboard/special-health-funds" },
      { label: yearLabel, href: `/dashboard/special-health-funds/${year}` },
      {
        label: parent?.name || cleanFundName,
        href: `/dashboard/special-health-funds/${year}/${encodeURIComponent(slug)}`,
      },
      { label: "Inspections" },
    ],
    dependencies: [breakdown, parent, year, slug, breakdownSlug],
  });

  const backUrl = `/dashboard/special-health-funds/${year}/${encodeURIComponent(slug)}`;

  return (
    <InspectionPageContainer
      entityType="specialhealthfund"
      breakdownId={breakdownId}
      backUrl={backUrl}
      backLabel="Back to Breakdown"
      year={year}
      adapter={specialHealthFundAdapter}
      activityLogType="specialhealthfund"
    />
  );
}
