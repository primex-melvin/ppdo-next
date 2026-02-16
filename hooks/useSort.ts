// hooks/useSort.ts

"use client";

import { useState, useMemo, useCallback } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import {
  SortOption,
  SortFieldMap,
  UseSortOptions,
  UseSortReturn,
  SORT_OPTIONS,
} from "@/types/sort";

/**
 * Generic sort hook with URL persistence support
 * 
 * @example
 * ```tsx
 * const { sortedItems, sortOption, setSortOption } = useSort({
 *   items: funds,
 *   initialSort: "lastModified",
 *   sortFieldMap: { nameField: "projectTitle", allocatedField: "received" },
 *   enableUrlPersistence: true
 * });
 * ```
 */
export function useSort<T>({
  items,
  initialSort = "lastModified",
  sortFieldMap,
  enableUrlPersistence = false,
}: UseSortOptions<T>): UseSortReturn<T> {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Get initial sort from URL or default
  const getInitialSortOption = useCallback((): SortOption => {
    if (enableUrlPersistence) {
      const urlSortId = searchParams.get("sort") as SortOption;
      if (urlSortId && SORT_OPTIONS.some((opt) => opt.value === urlSortId)) {
        return urlSortId;
      }
    }
    return initialSort;
  }, [enableUrlPersistence, searchParams, initialSort]);

  const [sortOption, setSortOptionState] = useState<SortOption>(getInitialSortOption);

  // Update URL when sort changes
  const setSortOption = useCallback(
    (option: SortOption) => {
      setSortOptionState(option);

      if (enableUrlPersistence) {
        const params = new URLSearchParams(searchParams.toString());
        params.set("sort", option);
        router.replace(`${pathname}?${params.toString()}`, { scroll: false });
      }
    },
    [enableUrlPersistence, searchParams, pathname, router]
  );

  // Sort the items
  const sortedItems = useMemo(() => {
    if (!items || items.length === 0) return [];

    const fieldMap = sortFieldMap || {};
    
    return [...items].sort((a, b) => {
      let comparison = 0;

      switch (sortOption) {
        case "lastModified":
          // Sort by _creationTime or updatedAt descending
          comparison = sortByField(a, b, "_creationTime", "desc", fieldMap);
          break;
        case "nameAsc":
          comparison = sortByField(a, b, fieldMap.nameField || "projectTitle", "asc", fieldMap);
          break;
        case "nameDesc":
          comparison = sortByField(a, b, fieldMap.nameField || "projectTitle", "desc", fieldMap);
          break;
        case "allocatedDesc":
          comparison = sortByField(a, b, fieldMap.allocatedField || "received", "desc", fieldMap);
          break;
        case "allocatedAsc":
          comparison = sortByField(a, b, fieldMap.allocatedField || "received", "asc", fieldMap);
          break;
        case "obligatedDesc":
          comparison = sortByField(a, b, fieldMap.obligatedField || "obligatedPR", "desc", fieldMap);
          break;
        case "obligatedAsc":
          comparison = sortByField(a, b, fieldMap.obligatedField || "obligatedPR", "asc", fieldMap);
          break;
        case "utilizedDesc":
          comparison = sortByField(a, b, fieldMap.utilizedField || "utilized", "desc", fieldMap);
          break;
        case "utilizedAsc":
          comparison = sortByField(a, b, fieldMap.utilizedField || "utilized", "asc", fieldMap);
          break;
        default:
          comparison = 0;
      }

      return comparison;
    });
  }, [items, sortOption, sortFieldMap]);

  return {
    sortedItems,
    sortOption,
    setSortOption,
  };
}

/**
 * Helper function to compare two items by a field
 */
function sortByField<T>(
  a: T,
  b: T,
  field: keyof T | string,
  direction: "asc" | "desc",
  fieldMap: SortFieldMap<T>
): number {
  // Check for modifiedField if _creationTime is requested
  let actualField: keyof T | string = field;
  if (field === "_creationTime" && fieldMap.modifiedField) {
    actualField = fieldMap.modifiedField as keyof T;
  }

  // Use type assertion to access the field
  const aValue = (a as Record<string, unknown>)[actualField as string];
  const bValue = (b as Record<string, unknown>)[actualField as string];
  const sortDirection = direction === "asc" ? 1 : -1;

  // Handle undefined/null values
  if (aValue == null && bValue == null) return 0;
  if (aValue == null) return 1 * sortDirection;
  if (bValue == null) return -1 * sortDirection;

  // Compare based on type
  if (typeof aValue === "string" && typeof bValue === "string") {
    return aValue.localeCompare(bValue) * sortDirection;
  }

  if (typeof aValue === "number" && typeof bValue === "number") {
    return (aValue - bValue) * sortDirection;
  }

  // Convert to string for comparison
  return String(aValue).localeCompare(String(bValue)) * sortDirection;
}

export default useSort;
