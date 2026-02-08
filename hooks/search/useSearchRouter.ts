// hooks/search/useSearchRouter.ts
/**
 * Search Router Hook - URL-First State Management
 *
 * Manages search state in URL query parameters for:
 * - Shareable search URLs
 * - Browser back/forward navigation
 * - Persistent search state across page reloads
 *
 * URL format: ?q=road&category=project&cursor=20
 */

import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useCallback, useMemo } from "react";
import type { EntityType } from "@/convex/search/types";

export interface SearchState {
  query: string;
  category?: EntityType;
  cursor?: number;
}

export interface SearchRouterReturn {
  // Current state
  state: SearchState;

  // State setters
  setQuery: (query: string) => void;
  setCategory: (category?: EntityType) => void;
  setCursor: (cursor?: number) => void;
  setState: (updates: Partial<SearchState>) => void;

  // Actions
  clearFilters: () => void;
  clearAll: () => void;

  // Metadata
  hasActiveFilters: boolean;
  isSearchActive: boolean;

  // Utilities
  getShareableUrl: () => string;
}

/**
 * URL-first search state management hook
 * Syncs search query, category filter, and pagination cursor with URL params
 */
export function useSearchRouter(): SearchRouterReturn {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  /**
   * Parse URL parameters to search state object
   */
  const state = useMemo<SearchState>(() => {
    const query = searchParams.get("q") || "";
    const category = searchParams.get("category") as EntityType | undefined;
    const cursor = searchParams.get("cursor");

    return {
      query,
      category: category || undefined,
      cursor: cursor ? Number(cursor) : undefined,
    };
  }, [searchParams]);

  /**
   * Update URL with new search state
   */
  const updateUrl = useCallback(
    (updates: Partial<SearchState>) => {
      const params = new URLSearchParams(searchParams.toString());

      // Update query
      if (updates.query !== undefined) {
        if (updates.query.trim()) {
          params.set("q", updates.query.trim());
        } else {
          params.delete("q");
        }
      }

      // Update category
      if ("category" in updates) {
        if (updates.category) {
          params.set("category", updates.category);
        } else {
          params.delete("category");
        }
      }

      // Update cursor
      if ("cursor" in updates) {
        if (updates.cursor !== undefined && updates.cursor > 0) {
          params.set("cursor", String(updates.cursor));
        } else {
          params.delete("cursor");
        }
      }

      // Navigate with new params (without scroll to maintain position)
      const newUrl = params.toString() ? `${pathname}?${params.toString()}` : pathname;
      router.push(newUrl, { scroll: false });
    },
    [searchParams, router, pathname]
  );

  /**
   * Set search query
   */
  const setQuery = useCallback(
    (query: string) => {
      updateUrl({ query, cursor: undefined }); // Reset cursor when query changes
    },
    [updateUrl]
  );

  /**
   * Set category filter
   */
  const setCategory = useCallback(
    (category?: EntityType) => {
      updateUrl({ category, cursor: undefined }); // Reset cursor when category changes
    },
    [updateUrl]
  );

  /**
   * Set pagination cursor
   */
  const setCursor = useCallback(
    (cursor?: number) => {
      updateUrl({ cursor });
    },
    [updateUrl]
  );

  /**
   * Update multiple state values at once
   */
  const setState = useCallback(
    (updates: Partial<SearchState>) => {
      updateUrl(updates);
    },
    [updateUrl]
  );

  /**
   * Clear category and cursor filters, keep query
   */
  const clearFilters = useCallback(() => {
    updateUrl({ category: undefined, cursor: undefined });
  }, [updateUrl]);

  /**
   * Clear all search state
   */
  const clearAll = useCallback(() => {
    router.push(pathname, { scroll: false });
  }, [router, pathname]);

  /**
   * Get shareable URL with current search state
   */
  const getShareableUrl = useCallback(() => {
    if (typeof window === "undefined") return "";
    return `${window.location.origin}${pathname}?${searchParams.toString()}`;
  }, [pathname, searchParams]);

  /**
   * Check if category or cursor filters are active
   */
  const hasActiveFilters = useMemo(() => {
    return Boolean(state.category || state.cursor);
  }, [state.category, state.cursor]);

  /**
   * Check if search query is active
   */
  const isSearchActive = useMemo(() => {
    return state.query.trim().length > 0;
  }, [state.query]);

  return {
    state,
    setQuery,
    setCategory,
    setCursor,
    setState,
    clearFilters,
    clearAll,
    hasActiveFilters,
    isSearchActive,
    getShareableUrl,
  };
}
