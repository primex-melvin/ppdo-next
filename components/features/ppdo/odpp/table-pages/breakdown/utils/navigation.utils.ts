// components/ppdo/breakdown/utils/navigation.utils.ts

/**
 * Centralized Navigation Utilities for Breakdown Components
 *
 * These utilities handle navigation for both Project and Trust Fund breakdown pages.
 */

import { Breakdown, NavigationParams } from "../types/breakdown.types";
import { createBreakdownSlug } from "./helpers";

/**
 * Builds the URL path for viewing breakdown details
 * Supports project, trust fund, special education fund, special health fund, and 20% DF breakdowns
 */
export function buildBreakdownDetailPath(
  breakdown: Breakdown,
  params: NavigationParams,
  entityType: "project" | "trustfund" | "specialeducationfund" | "specialhealthfund" | "twentyPercentDF" = "project"
): string {
  const breakdownSlug = createBreakdownSlug(breakdown);

  if (entityType === "trustfund") {
    const { year, slug } = params;
    return `/dashboard/trust-funds/${year}/${slug}/${breakdownSlug}`;
  }

  if (entityType === "specialeducationfund") {
    const { year, slug } = params;
    return `/dashboard/special-education-funds/${year}/${slug}/${breakdownSlug}`;
  }

  if (entityType === "specialhealthfund") {
    const { year, slug } = params;
    return `/dashboard/special-health-funds/${year}/${slug}/${breakdownSlug}`;
  }

  if (entityType === "twentyPercentDF") {
    const { year, slug } = params;
    return `/dashboard/20_percent_df/${year}/${slug}/${breakdownSlug}`;
  }

  // Default: project breakdown
  const { year, particularId, projectbreakdownId } = params;
  return `/dashboard/project/${year}/${particularId}/${projectbreakdownId}/${breakdownSlug}`;
}

/**
 * Logs breakdown navigation for debugging
 */
export function logBreakdownNavigation(breakdown: Breakdown): void {
  console.log('Breakdown clicked:', {
    _id: breakdown._id,
    projectId: breakdown.projectId,
    trustFundId: breakdown.trustFundId,
    projectTitle: breakdown.projectTitle,
    allKeys: Object.keys(breakdown)
  });
}