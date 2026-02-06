/**
 * useInspectionStats Hook
 *
 * Calculates statistics for inspections based on the inspection data.
 * Follows the same pattern as useEntityStats in breakdown pages.
 */

"use client";

import { useMemo } from "react";
import { Inspection } from "../types";

export interface InspectionStats {
  totalInspections: number;
  totalImages: number;
  totalViews: number;
  averageImagesPerInspection: number;
  averageViewsPerInspection: number;
  statusCounts: {
    pending: number;
    in_progress: number;
    completed: number;
    cancelled: number;
  };
}

export function useInspectionStats(
  inspections: Inspection[] | undefined
): InspectionStats {
  return useMemo(() => {
    if (!inspections || inspections.length === 0) {
      return {
        totalInspections: 0,
        totalImages: 0,
        totalViews: 0,
        averageImagesPerInspection: 0,
        averageViewsPerInspection: 0,
        statusCounts: {
          pending: 0,
          in_progress: 0,
          completed: 0,
          cancelled: 0,
        },
      };
    }

    const totalInspections = inspections.length;
    const totalImages = inspections.reduce(
      (sum, insp) => sum + (insp.imageCount || 0),
      0
    );
    const totalViews = inspections.reduce(
      (sum, insp) => sum + (insp.viewCount || 0),
      0
    );

    const statusCounts = inspections.reduce(
      (acc, insp) => {
        const status = insp.status;
        if (status === "pending") acc.pending++;
        else if (status === "in_progress") acc.in_progress++;
        else if (status === "completed") acc.completed++;
        else if (status === "cancelled") acc.cancelled++;
        return acc;
      },
      { pending: 0, in_progress: 0, completed: 0, cancelled: 0 }
    );

    return {
      totalInspections,
      totalImages,
      totalViews,
      averageImagesPerInspection: totalImages / totalInspections,
      averageViewsPerInspection: totalViews / totalInspections,
      statusCounts,
    };
  }, [inspections]);
}
