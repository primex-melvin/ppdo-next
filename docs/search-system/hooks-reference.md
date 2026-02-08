# Search System Hooks Reference

> React hooks for implementing search functionality in the PPDO application.

## Table of Contents

1. [useSearchRouter](#usesearchrouter)
2. [useFacetEngine](#usefacetengine)
3. [useInfiniteSearch](#useinfinitesearch)
4. [useDebounce](#usedebounce)
5. [useTypeahead](#usetypeahead)

---

## useSearchRouter

Manages URL-first state synchronization for search parameters.

### Purpose
- Synchronizes search state with URL query parameters
- Enables deep linking and browser history
- Provides type-safe state updates

### Signature

```typescript
function useSearchRouter(): {
  state: SearchState;
  setState: (updates: Partial<SearchState>) => void;
  clearFilters: () => void;
  toggleFilter: (key: string, value: string) => void;
}

interface SearchState {
  query: string;
  filters: Record<string, string[]>;
  sort: "relevance" | "recent" | "alphabetical";
  cursor?: string;
}
```

### Implementation

```typescript
// hooks/useSearchRouter.ts
"use client";

import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useCallback, useMemo } from "react";

export interface SearchState {
  query: string;
  filters: Record<string, string[]>;
  sort: "relevance" | "recent" | "alphabetical";
  cursor?: string;
}

const DEFAULT_STATE: SearchState = {
  query: "",
  filters: {},
  sort: "relevance",
};

export function useSearchRouter() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Parse current URL state
  const state = useMemo<SearchState>(() => {
    const filtersParam = searchParams.get("f");
    
    return {
      query: searchParams.get("q") ?? DEFAULT_STATE.query,
      filters: filtersParam ? parseFilters(filtersParam) : DEFAULT_STATE.filters,
      sort: (searchParams.get("sort") as SearchState["sort"]) ?? DEFAULT_STATE.sort,
      cursor: searchParams.get("cursor") ?? undefined,
    };
  }, [searchParams]);

  // Update URL with new state
  const setState = useCallback(
    (updates: Partial<SearchState>, options?: { resetCursor?: boolean }) => {
      const params = new URLSearchParams(searchParams);

      // Update query
      if (updates.query !== undefined) {
        if (updates.query) {
          params.set("q", updates.query);
        } else {
          params.delete("q");
        }
        // Reset pagination on query change
        params.delete("cursor");
      }

      // Update filters
      if (updates.filters !== undefined) {
        const filterString = serializeFilters(updates.filters);
        if (filterString) {
          params.set("f", filterString);
        } else {
          params.delete("f");
        }
      }

      // Update sort
      if (updates.sort !== undefined) {
        if (updates.sort !== DEFAULT_STATE.sort) {
          params.set("sort", updates.sort);
        } else {
          params.delete("sort");
        }
      }

      // Update cursor
      if (updates.cursor !== undefined) {
        if (updates.cursor) {
          params.set("cursor", updates.cursor);
        } else {
          params.delete("cursor");
        }
      }

      // Reset cursor if requested
      if (options?.resetCursor) {
        params.delete("cursor");
      }

      // Navigate without scrolling
      router.push(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [pathname, router, searchParams]
  );

  // Clear all filters
  const clearFilters = useCallback(() => {
    setState({ filters: {} }, { resetCursor: true });
  }, [setState]);

  // Toggle a single filter value
  const toggleFilter = useCallback(
    (key: string, value: string) => {
      const current = state.filters[key] ?? [];
      const updated = current.includes(value)
        ? current.filter((v) => v !== value)
        : [...current, value];

      setState(
        {
          filters: {
            ...state.filters,
            [key]: updated.length > 0 ? updated : undefined,
          },
        },
        { resetCursor: true }
      );
    },
    [setState, state.filters]
  );

  return { state, setState, clearFilters, toggleFilter };
}

// Filter serialization: "department:planning,engineering;year:2024"
function serializeFilters(filters: Record<string, string[]>): string {
  const parts = Object.entries(filters)
    .filter(([_, values]) => values && values.length > 0)
    .map(([key, values]) => `${key}:${values.join(",")}`);
  
  return parts.join(";");
}

function parseFilters(filterString: string): Record<string, string[]> {
  const filters: Record<string, string[]> = {};
  
  const groups = filterString.split(";");
  for (const group of groups) {
    const [key, values] = group.split(":");
    if (key && values) {
      filters[key] = values.split(",");
    }
  }
  
  return filters;
}
```

### Usage Example

```typescript
// components/search/SearchPage.tsx
"use client";

import { useSearchRouter } from "@/hooks/useSearchRouter";
import { SearchInput } from "./SearchInput";
import { FacetSidebar } from "./FacetSidebar";
import { SearchResults } from "./SearchResults";

export function SearchPage() {
  const { state, setState, clearFilters, toggleFilter } = useSearchRouter();

  return (
    <div className="flex h-screen">
      {/* Zone B: Sidebar */}
      <FacetSidebar
        filters={state.filters}
        onToggleFilter={toggleFilter}
        onClearFilters={clearFilters}
      />

      {/* Zone C: Main Content */}
      <main className="flex-1 p-6">
        {/* Zone A: Typeahead */}
        <SearchInput
          value={state.query}
          onChange={(query) => setState({ query })}
        />

        {/* Sort controls */}
        <select
          value={state.sort}
          onChange={(e) => setState({ sort: e.target.value as any })}
        >
          <option value="relevance">Most Relevant</option>
          <option value="recent">Most Recent</option>
          <option value="alphabetical">A-Z</option>
        </select>

        {/* Results */}
        <SearchResults
          query={state.query}
          filters={state.filters}
          sort={state.sort}
        />
      </main>
    </div>
  );
}
```

---

## useFacetEngine

Manages facet filter logic with optimistic updates.

### Purpose
- Handle filter selection/deselection
- Optimistically update UI while fetching
- Compute available facets based on current filters

### Signature

```typescript
function useFacetEngine(options: {
  query: string;
  initialFilters?: Record<string, string[]>;
}): {
  filters: Record<string, string[]>;
  availableFacets: FacetDefinition[] | undefined;
  isLoading: boolean;
  toggleFilter: (key: string, value: string) => void;
  clearFilters: () => void;
  activeFilterCount: number;
}
```

### Implementation

```typescript
// hooks/useFacetEngine.ts
"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useCallback, useMemo, useState } from "react";
import type { FacetDefinition } from "@/convex/search/types";

interface UseFacetEngineOptions {
  query: string;
  initialFilters?: Record<string, string[]>;
}

interface UseFacetEngineReturn {
  filters: Record<string, string[]>;
  availableFacets: FacetDefinition[] | undefined;
  isLoading: boolean;
  toggleFilter: (key: string, value: string) => void;
  clearFilters: () => void;
  hasActiveFilters: boolean;
  activeFilterCount: number;
}

export function useFacetEngine(
  options: UseFacetEngineOptions
): UseFacetEngineReturn {
  const { query, initialFilters = {} } = options;

  // Local state for optimistic updates
  const [localFilters, setLocalFilters] = useState(initialFilters);

  // Fetch available facets from server
  const availableFacets = useQuery(
    api.search.availableFacets,
    query
      ? { query, currentFilters: localFilters }
      : "skip"
  );

  // Toggle filter with optimistic update
  const toggleFilter = useCallback((key: string, value: string) => {
    setLocalFilters((prev) => {
      const current = prev[key] ?? [];
      const updated = current.includes(value)
        ? current.filter((v) => v !== value)
        : [...current, value];

      const newFilters = { ...prev };
      if (updated.length === 0) {
        delete newFilters[key];
      } else {
        newFilters[key] = updated;
      }

      return newFilters;
    });
  }, []);

  // Clear all filters
  const clearFilters = useCallback(() => {
    setLocalFilters({});
  }, []);

  // Compute active filter count
  const activeFilterCount = useMemo(() => {
    return Object.values(localFilters).reduce(
      (sum, values) => sum + values.length,
      0
    );
  }, [localFilters]);

  return {
    filters: localFilters,
    availableFacets,
    isLoading: availableFacets === undefined,
    toggleFilter,
    clearFilters,
    hasActiveFilters: activeFilterCount > 0,
    activeFilterCount,
  };
}
```

---

## useInfiniteSearch

Handles paginated search with infinite scroll.

### Purpose
- Fetch search results with pagination
- Manage infinite scroll state
- Handle loading and error states

### Signature

```typescript
function useInfiniteSearch(options: {
  query: string;
  filters?: Record<string, string[]>;
  sort?: "relevance" | "recent" | "alphabetical";
  pageSize?: number;
}): {
  data: { pages: SearchResultsPage[] } | undefined;
  fetchNextPage: () => void;
  hasNextPage: boolean;
  isFetching: boolean;
  isLoading: boolean;
  error: Error | null;
}
```

### Implementation

```typescript
// hooks/useInfiniteSearch.ts
"use client";

import { useQuery, usePaginatedQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useCallback, useEffect, useState } from "react";
import type { SearchResultsPage, SearchParams } from "@/convex/search/types";

interface UseInfiniteSearchOptions {
  query: string;
  filters?: Record<string, string[]>;
  sort?: "relevance" | "recent" | "alphabetical";
  pageSize?: number;
}

interface UseInfiniteSearchReturn {
  data: { pages: SearchResultsPage[] } | undefined;
  fetchNextPage: () => void;
  hasNextPage: boolean;
  isFetching: boolean;
  isLoading: boolean;
  error: Error | null;
  refresh: () => void;
}

export function useInfiniteSearch(
  options: UseInfiniteSearchOptions
): UseInfiniteSearchReturn {
  const { query, filters = {}, sort = "relevance", pageSize = 20 } = options;

  const [pages, setPages] = useState<SearchResultsPage[]>([]);
  const [cursor, setCursor] = useState<string | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Fetch initial results when params change
  useEffect(() => {
    if (!query && Object.keys(filters).length === 0) {
      setPages([]);
      setCursor(undefined);
      return;
    }

    setIsLoading(true);
    setError(null);
    setPages([]);
    setCursor(undefined);

    // Initial fetch would go here - simplified for example
    // In practice, use useQuery with proper dependency handling
  }, [query, JSON.stringify(filters), sort]);

  const fetchNextPage = useCallback(() => {
    if (!cursor) return;
    // Fetch next page logic
  }, [cursor]);

  const refresh = useCallback(() => {
    setPages([]);
    setCursor(undefined);
    // Trigger refetch
  }, []);

  const hasNextPage = !!cursor;
  const isFetching = isLoading;

  return {
    data: pages.length > 0 ? { pages } : undefined,
    fetchNextPage,
    hasNextPage,
    isFetching,
    isLoading,
    error,
    refresh,
  };
}

// Alternative: Using Convex's built-in paginated query
export function useConvexInfiniteSearch(
  options: UseInfiniteSearchOptions
) {
  const { query, filters = {}, sort = "relevance" } = options;

  const {
    results,
    status,
    loadMore,
  } = usePaginatedQuery(
    api.search.search,
    query
      ? { query, filters, sortBy: sort, paginationOpts: { numItems: 20 } }
      : "skip",
    { numItems: 20 }
  );

  return {
    data: results,
    fetchNextPage: loadMore,
    hasNextPage: status === "CanLoadMore",
    isFetching: status === "LoadingMore",
    isLoading: status === "LoadingFirstPage",
  };
}
```

---

## useDebounce

Delays value updates to reduce query frequency.

### Purpose
- Debounce search input to avoid excessive API calls
- Configurable delay duration
- Immediate update option for special cases

### Implementation

```typescript
// hooks/useDebounce.ts
"use client";

import { useState, useEffect } from "react";

export function useDebounce<T>(
  value: T,
  delay: number = 300
): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

// Hook with immediate flush capability
export function useDebounceWithFlush<T>(
  value: T,
  delay: number = 300
): {
  debouncedValue: T;
  flush: () => void;
  cancel: () => void;
} {
  const [debouncedValue, setDebouncedValue] = useState(value);
  const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    const id = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    setTimeoutId(id);

    return () => {
      clearTimeout(id);
    };
  }, [value, delay]);

  const flush = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      setTimeoutId(null);
    }
    setDebouncedValue(value);
  };

  const cancel = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      setTimeoutId(null);
    }
  };

  return { debouncedValue, flush, cancel };
}
```

### Usage Example

```typescript
// components/search/SearchInput.tsx
"use client";

import { useState } from "react";
import { useDebounce } from "@/hooks/useDebounce";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

export function SearchInput({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const [inputValue, setInputValue] = useState(value);
  const debouncedValue = useDebounce(inputValue, 300);

  // Fetch suggestions based on debounced value
  const suggestions = useQuery(
    api.search.suggestions,
    debouncedValue.length >= 2
      ? { query: debouncedValue, limit: 8 }
      : "skip"
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
    onChange(e.target.value);
  };

  return (
    <div className="relative">
      <input
        type="text"
        value={inputValue}
        onChange={handleChange}
        placeholder="Search..."
        className="w-full px-4 py-2 border rounded"
      />
      {suggestions && suggestions.length > 0 && (
        <SuggestionDropdown suggestions={suggestions} />
      )}
    </div>
  );
}
```

---

## useTypeahead

Manages typeahead suggestion state with keyboard navigation.

### Purpose
- Handle suggestion selection
- Keyboard navigation (arrow keys, enter, escape)
- Accessibility support

### Implementation

```typescript
// hooks/useTypeahead.ts
"use client";

import { useState, useCallback, useRef, KeyboardEvent } from "react";
import type { SearchSuggestion } from "@/convex/search/types";

interface UseTypeaheadOptions {
  suggestions: SearchSuggestion[];
  onSelect: (suggestion: SearchSuggestion) => void;
  onClose: () => void;
}

interface UseTypeaheadReturn {
  selectedIndex: number;
  getItemProps: (index: number) => {
    onClick: () => void;
    onMouseEnter: () => void;
    "aria-selected": boolean;
  };
  handleKeyDown: (e: KeyboardEvent) => void;
  listProps: {
    role: "listbox";
    "aria-label": string;
  };
}

export function useTypeahead(
  options: UseTypeaheadOptions
): UseTypeaheadReturn {
  const { suggestions, onSelect, onClose } = options;
  const [selectedIndex, setSelectedIndex] = useState(-1);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setSelectedIndex((prev) =>
            prev < suggestions.length - 1 ? prev + 1 : prev
          );
          break;

        case "ArrowUp":
          e.preventDefault();
          setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
          break;

        case "Enter":
          e.preventDefault();
          if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
            onSelect(suggestions[selectedIndex]);
          }
          break;

        case "Escape":
          e.preventDefault();
          onClose();
          break;

        case "Home":
          e.preventDefault();
          setSelectedIndex(0);
          break;

        case "End":
          e.preventDefault();
          setSelectedIndex(suggestions.length - 1);
          break;
      }
    },
    [suggestions, selectedIndex, onSelect, onClose]
  );

  const getItemProps = useCallback(
    (index: number) => ({
      onClick: () => onSelect(suggestions[index]),
      onMouseEnter: () => setSelectedIndex(index),
      "aria-selected": index === selectedIndex,
    }),
    [suggestions, selectedIndex, onSelect]
  );

  return {
    selectedIndex,
    getItemProps,
    handleKeyDown,
    listProps: {
      role: "listbox",
      "aria-label": "Search suggestions",
    },
  };
}
```

---

*Hooks Reference for PPDO Search System v1.0*
