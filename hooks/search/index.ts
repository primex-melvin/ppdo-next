// hooks/search/index.ts
/**
 * Search Hooks
 * Export all search-related hooks
 */

export {
  useSearchRouter,
  type SearchState,
  type SearchRouterReturn,
} from "./useSearchRouter";

export {
  useCategoryFilter,
  type CategoryCount,
  type CategoryFilterOptions,
  type CategoryFilterReturn,
} from "./useCategoryFilter";

export {
  useInfiniteSearch,
  usePaginatedSearch,
  type SearchOptions,
  type InfiniteSearchReturn,
} from "./useInfiniteSearch";
