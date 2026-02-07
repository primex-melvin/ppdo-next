/**
 * Trust Fund Inspection Page
 *
 * Displays inspections for a specific trust fund breakdown.
 * Uses the modular InspectionPageContainer with the Trust Fund adapter.
 */

"use client";

import { useParams } from "next/navigation";
import { InspectionPageContainer } from "@/components/features/ppdo/inspection/InspectionPageContainer";
import { trustFundAdapter } from "@/components/features/ppdo/inspection/adapters";
import { useDashboardBreadcrumbs } from "@/lib/hooks/useDashboardBreadcrumbs";
import {
  decodeLabel,
  extractIdFromSlug,
  extractCleanNameFromSlug,
  formatYearLabel,
} from "@/lib/utils/breadcrumb-utils";

export default function TrustFundInspectionPage() {
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
  const breakdown = trustFundAdapter.useGetBreakdown(breakdownId);
  const parent = trustFundAdapter.useGetParent(breakdown);

  // Set up breadcrumbs
  useDashboardBreadcrumbs({
    isDataLoaded: !!(breakdown && parent),
    loadingBreadcrumbs: [
      { label: "Home", href: "/dashboard" },
      { label: "Trust Funds", href: "/dashboard/trust-funds" },
      { label: yearLabel, href: `/dashboard/trust-funds/${year}` },
      { label: cleanFundName, loading: true },
      { label: cleanBreakdownName, loading: true },
    ],
    loadedBreadcrumbs: [
      { label: "Home", href: "/dashboard" },
      { label: "Trust Funds", href: "/dashboard/trust-funds" },
      { label: yearLabel, href: `/dashboard/trust-funds/${year}` },
      {
        label: parent?.name || cleanFundName,
        href: `/dashboard/trust-funds/${year}/${encodeURIComponent(slug)}`,
      },
      { label: "Inspections" },
    ],
    dependencies: [breakdown, parent, year, slug, breakdownSlug],
  });

  const backUrl = `/dashboard/trust-funds/${year}/${encodeURIComponent(slug)}`;

  return (
    <InspectionPageContainer
      entityType="trustfund"
      breakdownId={breakdownId}
      backUrl={backUrl}
      backLabel="Back to Breakdown"
      year={year}
      adapter={trustFundAdapter}
      activityLogType="trustfund"
    />
  );
}
