// lib/shared/hooks/useFilteredQuery.ts

import { useMemo } from "react";
import type { FunctionReference } from "convex/server";
import { useQuery } from "convex/react";

/**
 * Generic hook for querying and filtering Convex data
 *
 * Standardizes data fetching patterns across dashboard pages by:
 * - Handling loading states consistently
 * - Filtering data based on search terms
 * - Providing empty state detection
 *
 * @example
 * ```tsx
 * const { data, isLoading, isEmpty } = useFilteredQuery(
 *   api.projects.list,
 *   {},
 *   'name',
 *   searchTerm
 * );
 * ```
 */

type QueryArgs = Record<string, unknown>;

export interface UseFilteredQueryReturn<T> {
  /** Filtered data array (empty array during loading) */
  data: T[];
  /** True when data is undefined (Convex loading state) */
  isLoading: boolean;
  /** True when data is loaded but empty */
  isEmpty: boolean;
  /** Raw unfiltered data from query */
  rawData: T[] | undefined;
}

/**
 * Hook for fetching and filtering Convex query data
 *
 * @param query - Convex query function reference
 * @param args - Arguments to pass to the query
 * @param searchKey - Property name to search within (optional)
 * @param searchTerm - Search term to filter by (optional)
 * @returns Object containing filtered data, loading state, and empty state
 */
export function useFilteredQuery<T extends Record<string, unknown>>(
  query: FunctionReference<"query", "public", QueryArgs, T[]>,
  args: QueryArgs = {},
  searchKey?: keyof T,
  searchTerm?: string
): UseFilteredQueryReturn<T> {
  const rawData = useQuery(query, args);
  const isLoading = rawData === undefined;

  const filteredData = useMemo(() => {
    // Return empty array during loading
    if (isLoading) return [];

    // Return all data if no search is active
    if (!searchKey || !searchTerm || searchTerm.trim() === "") {
      return rawData;
    }

    // Filter data based on search term
    const normalizedSearch = searchTerm.toLowerCase().trim();
    return rawData.filter((item) => {
      const value = item[searchKey];
      if (typeof value === "string") {
        return value.toLowerCase().includes(normalizedSearch);
      }
      if (typeof value === "number") {
        return value.toString().includes(normalizedSearch);
      }
      return false;
    });
  }, [rawData, searchKey, searchTerm, isLoading]);

  const isEmpty = !isLoading && filteredData.length === 0;

  return {
    data: filteredData,
    isLoading,
    isEmpty,
    rawData,
  };
}

/**
 * Hook for fetching multiple queries and aggregating their loading states
 *
 * Useful when a page depends on multiple data sources
 *
 * @example
 * ```tsx
 * const { isLoading, allLoaded } = useMultipleQueries({
 *   fiscalYears: useQuery(api.fiscalYears.list, {}),
 *   budgetItems: useQuery(api.budgetItems.list, {}),
 *   projects: useQuery(api.projects.list, {})
 * });
 * ```
 */
export function useMultipleQueries<T extends Record<string, unknown>>(
  queries: T
): {
  /** True if ANY query is still loading */
  isLoading: boolean;
  /** True if ALL queries have loaded */
  allLoaded: boolean;
  /** Object with same keys as input, containing loading state per query */
  loadingStates: Record<keyof T, boolean>;
} {
  const loadingStates = useMemo(() => {
    const states: Record<keyof T, boolean> = {} as Record<keyof T, boolean>;
    for (const key in queries) {
      states[key] = queries[key] === undefined;
    }
    return states;
  }, [queries]);

  const isLoading = Object.values(loadingStates).some((state) => state);
  const allLoaded = Object.values(loadingStates).every((state) => !state);

  return {
    isLoading,
    allLoaded,
    loadingStates,
  };
}
