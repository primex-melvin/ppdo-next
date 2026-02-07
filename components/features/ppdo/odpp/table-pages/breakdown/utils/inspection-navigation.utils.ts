/**
 * Inspection Navigation Utilities
 *
 * Handles navigation from breakdown tables to inspection pages for all fund types.
 */

import { Breakdown, NavigationParams } from "../types/breakdown.types";
import { createBreakdownSlug } from "./helpers";

/**
 * Builds the URL path for viewing inspections of a breakdown
 * Supports all fund types: project, trust fund, SEF, SHF, and 20% DF
 */
export function buildInspectionUrl(
  breakdown: Breakdown,
  params: NavigationParams,
  entityType:
    | "project"
    | "trustfund"
    | "specialeducationfund"
    | "specialhealthfund"
    | "twentyPercentDF" = "project"
): string {
  const breakdownSlug = createBreakdownSlug(breakdown);

  switch (entityType) {
    case "trustfund": {
      const { year, slug } = params;
      return `/dashboard/trust-funds/${year}/${slug}/${breakdownSlug}/inspections`;
    }

    case "specialeducationfund": {
      const { year, slug } = params;
      return `/dashboard/special-education-funds/${year}/${slug}/${breakdownSlug}/inspections`;
    }

    case "specialhealthfund": {
      const { year, slug } = params;
      return `/dashboard/special-health-funds/${year}/${slug}/${breakdownSlug}/inspections`;
    }

    case "twentyPercentDF": {
      const { year, slug } = params;
      return `/dashboard/20_percent_df/${year}/${slug}/${breakdownSlug}/inspections`;
    }

    case "project":
    default: {
      const { year, particularId, projectbreakdownId } = params;
      return `/dashboard/project/${year}/${particularId}/${projectbreakdownId}/${breakdownSlug}/inspections`;
    }
  }
}

/**
 * Logs inspection navigation for debugging
 */
export function logInspectionNavigation(breakdown: Breakdown, url: string): void {
  console.log("Navigating to inspections:", {
    breakdownId: breakdown._id,
    breakdownTitle: breakdown.projectTitle || breakdown.projectName,
    url,
  });
}
