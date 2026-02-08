// hooks/search/useInfiniteSearch.ts
/**
 * Infinite Search Hook
 *
 * Handles paginated search with infinite scroll functionality using Convex queries.
 * Manages loading states, pagination, and result aggregation.
 */

import { useState, useCallback, useMemo, useEffect } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { EntityType, SearchApiResult } from "@/convex/search/types";

export interface SearchOptions {
  query: string;
  category?: EntityType;
  pageSize?: number;
  departmentIds?: string[];
  statuses?: string[];
  years?: number[];
  excludeDeleted?: boolean;
}

export interface InfiniteSearchReturn {
  // Results
  results: SearchApiResult[];
  totalCount: number;

  // Pagination
  hasMore: boolean;
  loadMore: () => void;
  currentPage: number;
  totalPages: number;

  // Loading states
  isLoading: boolean;
  isLoadingMore: boolean;
  isError: boolean;

  // Actions
  reset: () => void;
  refresh: () => void;

  // Metadata
  isEmpty: boolean;
  isFirstPage: boolean;
}

/**
 * Hook for infinite scroll search with Convex
 * Uses offset-based pagination and aggregates results across pages
 */
export function useInfiniteSearch(
  options: SearchOptions
): InfiniteSearchReturn {
  const {
    query,
    category,
    pageSize = 20,
    departmentIds,
    statuses,
    years,
    excludeDeleted = true,
  } = options;

  // State
  const [currentPage, setCurrentPage] = useState(0);
  const [allResults, setAllResults] = useState<SearchApiResult[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // Calculate current offset
  const offset = currentPage * pageSize;

  // Fetch current page
  const response = useQuery(
    api.search.search,
    query.trim().length >= 2
      ? {
          query: query.trim(),
          entityTypes: category ? [category] : undefined,
          departmentIds,
          statuses,
          years,
          excludeDeleted,
          limit: pageSize,
          offset,
        }
      : "skip"
  );

  // Reset when query or filters change
  useEffect(() => {
    setCurrentPage(0);
    setAllResults([]);
    setTotalCount(0);
    setIsLoadingMore(false);
  }, [query, category, JSON.stringify(departmentIds), JSON.stringify(statuses), JSON.stringify(years)]);

  // Update results when response changes
  useEffect(() => {
    if (response) {
      if (currentPage === 0) {
        // First page - replace all results
        setAllResults(response.results || []);
        setTotalCount(response.totalCount || 0);
      } else {
        // Subsequent pages - append results
        setAllResults((prev) => [...prev, ...(response.results || [])]);
        setTotalCount(response.totalCount || 0);
      }
      setIsLoadingMore(false);
    }
  }, [response, currentPage]);

  /**
   * Load next page of results
   */
  const loadMore = useCallback(() => {
    if (response && response.hasMore && !isLoadingMore) {
      setIsLoadingMore(true);
      setCurrentPage((prev) => prev + 1);
    }
  }, [response, isLoadingMore]);

  /**
   * Reset to first page
   */
  const reset = useCallback(() => {
    setCurrentPage(0);
    setAllResults([]);
    setTotalCount(0);
    setIsLoadingMore(false);
  }, []);

  /**
   * Refresh current results
   */
  const refresh = useCallback(() => {
    // Force re-fetch by resetting to current page
    const temp = currentPage;
    setCurrentPage(-1);
    setTimeout(() => setCurrentPage(temp), 0);
  }, [currentPage]);

  /**
   * Check if there are more results to load
   */
  const hasMore = useMemo(() => {
    return response?.hasMore || false;
  }, [response]);

  /**
   * Calculate total pages
   */
  const totalPages = useMemo(() => {
    if (totalCount === 0) return 0;
    return Math.ceil(totalCount / pageSize);
  }, [totalCount, pageSize]);

  /**
   * Check if currently loading first page
   */
  const isLoading = useMemo(() => {
    return query.trim().length >= 2 && currentPage === 0 && response === undefined;
  }, [query, currentPage, response]);

  /**
   * Check if there's an error
   */
  const isError = useMemo(() => {
    return false; // Convex handles errors internally
  }, []);

  /**
   * Check if results are empty
   */
  const isEmpty = useMemo(() => {
    return !isLoading && allResults.length === 0 && query.trim().length >= 2;
  }, [isLoading, allResults, query]);

  /**
   * Check if on first page
   */
  const isFirstPage = useMemo(() => {
    return currentPage === 0;
  }, [currentPage]);

  return {
    results: allResults,
    totalCount,
    hasMore,
    loadMore,
    currentPage,
    totalPages,
    isLoading,
    isLoadingMore,
    isError,
    reset,
    refresh,
    isEmpty,
    isFirstPage,
  };
}

/**
 * Hook for simple paginated search (non-infinite)
 * Useful for traditional page-by-page navigation
 */
export function usePaginatedSearch(options: SearchOptions) {
  const {
    query,
    category,
    pageSize = 20,
    departmentIds,
    statuses,
    years,
    excludeDeleted = true,
  } = options;

  const [currentPage, setCurrentPage] = useState(0);
  const offset = currentPage * pageSize;

  // Fetch current page only
  const response = useQuery(
    api.search.search,
    query.trim().length >= 2
      ? {
          query: query.trim(),
          entityTypes: category ? [category] : undefined,
          departmentIds,
          statuses,
          years,
          excludeDeleted,
          limit: pageSize,
          offset,
        }
      : "skip"
  );

  // Reset page when query or filters change
  useEffect(() => {
    setCurrentPage(0);
  }, [query, category, JSON.stringify(departmentIds), JSON.stringify(statuses), JSON.stringify(years)]);

  const goToPage = useCallback((page: number) => {
    setCurrentPage(page);
  }, []);

  const nextPage = useCallback(() => {
    if (response?.hasMore) {
      setCurrentPage((prev) => prev + 1);
    }
  }, [response]);

  const previousPage = useCallback(() => {
    setCurrentPage((prev) => Math.max(0, prev - 1));
  }, []);

  const totalPages = useMemo(() => {
    if (!response?.totalCount) return 0;
    return Math.ceil(response.totalCount / pageSize);
  }, [response, pageSize]);

  return {
    results: response?.results || [],
    totalCount: response?.totalCount || 0,
    currentPage,
    totalPages,
    hasNextPage: response?.hasMore || false,
    hasPreviousPage: currentPage > 0,
    goToPage,
    nextPage,
    previousPage,
    isLoading: query.trim().length >= 2 && response === undefined,
    isEmpty: !response && query.trim().length >= 2,
  };
}
