// services/filtering/tableFilters.ts
// NEW FILE - CREATE THIS

import {
  filterBySearchQuery,
  filterByStatus,
  filterByYear,
} from "@/lib/shared/utils/filtering";
import { sortItems, sortWithPinnedFirst } from "@/lib/shared/utils/sorting";
import { SortDirection } from "@/lib/shared/types/table.types";

/**
 * Generic filter configuration interface
 */
export interface FilterConfig<TItem, TSortField extends keyof TItem> {
  searchQuery: string;
  searchFields: (keyof TItem)[];
  statusFilter: string[];
  yearFilter: number[];
  sortField: TSortField | null;
  sortDirection: SortDirection;
  customFilters?: Array<(items: TItem[]) => TItem[]>;
}

/**
 * Applies all filters to a dataset
 * Generic implementation that works for both Budget and Project items
 * 
 * @param items - Array of items to filter
 * @param config - Filter configuration
 * @returns Filtered and sorted array
 * 
 * @example
 * ```typescript
 * const filtered = applyFilters(budgetItems, {
 *   searchQuery: "GAD",
 *   searchFields: ["particular", "status", "year"],
 *   statusFilter: ["ongoing"],
 *   yearFilter: [2024],
 *   sortField: "totalBudgetAllocated",
 *   sortDirection: "desc",
 * });
 * ```
 */
export function applyFilters<TItem extends Record<string, any>, TSortField extends keyof TItem>(
  items: TItem[],
  config: FilterConfig<TItem, TSortField>
): TItem[] {
  let filtered = [...items];

  // Apply search filter
  if (config.searchQuery) {
    filtered = filterBySearchQuery(filtered, config.searchQuery, config.searchFields);
  }

  // Apply status filter (if item has status field)
  if (config.statusFilter.length > 0) {
    filtered = filterByStatus(filtered as any, config.statusFilter) as TItem[];
  }

  // Apply year filter (if item has year field)
  if (config.yearFilter.length > 0) {
    filtered = filterByYear(filtered as any, config.yearFilter) as TItem[];
  }

  // Apply custom filters
  if (config.customFilters) {
    config.customFilters.forEach((filterFn) => {
      filtered = filterFn(filtered);
    });
  }

  // Apply sorting
  if (config.sortField && config.sortDirection) {
    filtered = sortItems(filtered, config.sortField, config.sortDirection);
  }

  // Apply pinned-first sorting (if item has isPinned field)
  if (filtered.some((item) => 'isPinned' in item)) {
    filtered = sortWithPinnedFirst(filtered as any) as TItem[];
  }

  return filtered;
}

/**
 * Creates a filter preset for budget items
 * 
 * @param searchQuery - Search query string
 * @param statusFilter - Array of status strings
 * @param yearFilter - Array of years
 * @param sortField - Field to sort by
 * @param sortDirection - Sort direction
 * @returns FilterConfig for budget items
 */
export function createBudgetFilterConfig<TSortField extends string>(
  searchQuery: string,
  statusFilter: string[],
  yearFilter: number[],
  sortField: TSortField | null,
  sortDirection: SortDirection
): FilterConfig<any, TSortField> {
  return {
    searchQuery,
    searchFields: ["particular", "status", "year"],
    statusFilter,
    yearFilter,
    sortField,
    sortDirection,
  };
}

/**
 * Creates a filter preset for project items
 * 
 * @param searchQuery - Search query string
 * @param statusFilter - Array of status strings
 * @param yearFilter - Array of years
 * @param officeFilter - Array of implementing offices
 * @param sortField - Field to sort by
 * @param sortDirection - Sort direction
 * @returns FilterConfig for project items
 */
export function createProjectFilterConfig<TSortField extends string>(
  searchQuery: string,
  statusFilter: string[],
  yearFilter: number[],
  officeFilter: string[],
  sortField: TSortField | null,
  sortDirection: SortDirection
): FilterConfig<any, TSortField> {
  return {
    searchQuery,
    searchFields: ["particulars", "implementingOffice", "status"],
    statusFilter,
    yearFilter,
    sortField,
    sortDirection,
    customFilters: officeFilter.length > 0
      ? [
        (items) =>
          items.filter((item) =>
            officeFilter.includes(item.implementingOffice)
          ),
      ]
      : undefined,
  };
}

/**
 * Creates a filter preset for 20% DF items
 * 
 * @param searchQuery - Search query string
 * @param statusFilter - Array of status strings
 * @param yearFilter - Array of years
 * @param officeFilter - Array of implementing offices
 * @param sortField - Field to sort by
 * @param sortDirection - Sort direction
 * @returns FilterConfig for 20% DF items
 */
export function createTwentyPercentDFFilterConfig<TSortField extends string>(
  searchQuery: string,
  statusFilter: string[],
  yearFilter: number[],
  officeFilter: string[],
  sortField: TSortField | null,
  sortDirection: SortDirection
): FilterConfig<any, TSortField> {
  return {
    searchQuery,
    searchFields: ["particulars", "implementingOffice", "status"],
    statusFilter,
    yearFilter,
    sortField,
    sortDirection,
    customFilters: officeFilter.length > 0
      ? [
        (items) =>
          items.filter((item) =>
            officeFilter.includes(item.implementingOffice)
          ),
      ]
      : undefined,
  };
}

/**
 * Checks if any filters are active
 * 
 * @param config - Filter configuration
 * @returns Boolean indicating if filters are active
 */
export function hasActiveFilters<TItem, TSortField extends keyof TItem>(
  config: FilterConfig<TItem, TSortField>
): boolean {
  return Boolean(
    config.searchQuery ||
    config.statusFilter.length > 0 ||
    config.yearFilter.length > 0 ||
    config.sortField ||
    (config.customFilters && config.customFilters.length > 0)
  );
}

/**
 * Clears all filters from a configuration
 * 
 * @param config - Filter configuration
 * @returns Cleared filter configuration
 */
export function clearAllFilters<TItem, TSortField extends keyof TItem>(
  config: FilterConfig<TItem, TSortField>
): FilterConfig<TItem, TSortField> {
  return {
    ...config,
    searchQuery: "",
    statusFilter: [],
    yearFilter: [],
    sortField: null,
    sortDirection: null,
    customFilters: undefined,
  };
}