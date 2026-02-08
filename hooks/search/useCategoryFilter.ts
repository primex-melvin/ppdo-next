// hooks/search/useCategoryFilter.ts
/**
 * Category Filter Hook
 *
 * Manages active category state with:
 * - Optimistic category switching (instant UI updates)
 * - Category counts from API
 * - Graceful fallback when API is slow
 */

import { useState, useCallback, useMemo, useEffect } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { EntityType } from "@/convex/search/types";
import { ENTITY_TYPE_LABELS, ENTITY_TYPE_PLURALS } from "@/convex/search/types";

export interface CategoryCount {
  entityType: EntityType;
  count: number;
  label: string;
  pluralLabel: string;
}

export interface CategoryFilterOptions {
  query?: string;
  initialCategory?: EntityType;
}

export interface CategoryFilterReturn {
  // Active category
  activeCategory?: EntityType;
  setActiveCategory: (category?: EntityType) => void;

  // Category counts
  counts: CategoryCount[];
  isLoadingCounts: boolean;
  totalCount: number;

  // Helpers
  getCategoryCount: (category: EntityType) => number;
  getCategoryLabel: (category: EntityType) => string;
  getCategoryPluralLabel: (category: EntityType) => string;
  hasResults: boolean;
}

/**
 * Manage category filter state with optimistic updates
 */
export function useCategoryFilter(
  options: CategoryFilterOptions = {}
): CategoryFilterReturn {
  const { query = "", initialCategory } = options;

  // Optimistic local state (instant UI updates)
  const [activeCategory, setActiveCategory] = useState<EntityType | undefined>(
    initialCategory
  );

  // Fetch category counts from API
  const categoryCounts = useQuery(
    api.search.categoryCounts,
    query.trim().length >= 2 ? { query: query.trim() } : "skip"
  );

  // Update active category when initial category changes
  useEffect(() => {
    if (initialCategory !== undefined) {
      setActiveCategory(initialCategory);
    }
  }, [initialCategory]);

  /**
   * Convert API response to CategoryCount array
   */
  const counts = useMemo<CategoryCount[]>(() => {
    if (!categoryCounts) {
      return [];
    }

    // Get all entity types with their counts
    const allCategories: EntityType[] = [
      "project",
      "twentyPercentDF",
      "trustFund",
      "specialEducationFund",
      "specialHealthFund",
      "department",
      "agency",
      "user",
    ];

    return allCategories
      .map((entityType) => ({
        entityType,
        count: categoryCounts[entityType] || 0,
        label: ENTITY_TYPE_LABELS[entityType],
        pluralLabel: ENTITY_TYPE_PLURALS[entityType],
      }))
      .filter((category) => category.count > 0) // Only show categories with results
      .sort((a, b) => b.count - a.count); // Sort by count descending
  }, [categoryCounts]);

  /**
   * Calculate total count across all categories
   */
  const totalCount = useMemo(() => {
    return counts.reduce((sum, category) => sum + category.count, 0);
  }, [counts]);

  /**
   * Get count for a specific category
   */
  const getCategoryCount = useCallback(
    (category: EntityType): number => {
      const found = counts.find((c) => c.entityType === category);
      return found?.count || 0;
    },
    [counts]
  );

  /**
   * Get label for a category
   */
  const getCategoryLabel = useCallback((category: EntityType): string => {
    return ENTITY_TYPE_LABELS[category];
  }, []);

  /**
   * Get plural label for a category
   */
  const getCategoryPluralLabel = useCallback((category: EntityType): string => {
    return ENTITY_TYPE_PLURALS[category];
  }, []);

  /**
   * Check if there are any results
   */
  const hasResults = useMemo(() => {
    return totalCount > 0;
  }, [totalCount]);

  /**
   * Check if counts are loading
   */
  const isLoadingCounts = useMemo(() => {
    return query.trim().length >= 2 && categoryCounts === undefined;
  }, [query, categoryCounts]);

  return {
    activeCategory,
    setActiveCategory,
    counts,
    isLoadingCounts,
    totalCount,
    getCategoryCount,
    getCategoryLabel,
    getCategoryPluralLabel,
    hasResults,
  };
}
