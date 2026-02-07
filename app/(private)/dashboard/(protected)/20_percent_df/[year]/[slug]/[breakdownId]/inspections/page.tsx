/**
 * 20% Development Fund Inspection Page
 *
 * Displays inspections for a specific 20% development fund breakdown.
 * Uses the modular InspectionPageContainer with the 20% DF adapter.
 */

"use client";

import { useParams } from "next/navigation";
import { InspectionPageContainer } from "@/components/features/ppdo/inspection/InspectionPageContainer";
import { twentyPercentDFAdapter } from "@/components/features/ppdo/inspection/adapters";
import { useDashboardBreadcrumbs } from "@/lib/hooks/useDashboardBreadcrumbs";
import {
  decodeLabel,
  extractIdFromSlug,
  extractCleanNameFromSlug,
  formatYearLabel,
} from "@/lib/utils/breadcrumb-utils";

export default function TwentyPercentDFInspectionPage() {
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
  const breakdown = twentyPercentDFAdapter.useGetBreakdown(breakdownId);
  const parent = twentyPercentDFAdapter.useGetParent(breakdown);

  // Set up breadcrumbs
  useDashboardBreadcrumbs({
    isDataLoaded: !!(breakdown && parent),
    loadingBreadcrumbs: [
      { label: "Home", href: "/dashboard" },
      { label: "20% Development Fund", href: "/dashboard/20_percent_df" },
      { label: yearLabel, href: `/dashboard/20_percent_df/${year}` },
      { label: cleanFundName, loading: true },
      { label: cleanBreakdownName, loading: true },
    ],
    loadedBreadcrumbs: [
      { label: "Home", href: "/dashboard" },
      { label: "20% Development Fund", href: "/dashboard/20_percent_df" },
      { label: yearLabel, href: `/dashboard/20_percent_df/${year}` },
      {
        label: parent?.name || cleanFundName,
        href: `/dashboard/20_percent_df/${year}/${encodeURIComponent(slug)}`,
      },
      { label: "Inspections" },
    ],
    dependencies: [breakdown, parent, year, slug, breakdownSlug],
  });

  const backUrl = `/dashboard/20_percent_df/${year}/${encodeURIComponent(slug)}`;

  return (
    <InspectionPageContainer
      entityType="twentyPercentDF"
      breakdownId={breakdownId}
      backUrl={backUrl}
      backLabel="Back to Breakdown"
      year={year}
      adapter={twentyPercentDFAdapter}
      activityLogType="twentyPercentDF"
    />
  );
}
