/**
 * Custom Hooks Index
 * 
 * Shared hooks for use across the application.
 */

// Dashboard hooks
export { useDashboardFilters } from "./useDashboardFilters";

// Utility hooks
export { useDebounce, useDebounceWithFlush } from "./use-debounce";

// Auth hooks
export { useCurrentUser } from "./useCurrentUser";
export { usePermissions } from "./usePermissions";

// Table management hooks
export {
  useTableSearch,
  type UseTableSearchOptions,
  type UseTableSearchReturn,
} from "./useTableSearch";

export {
  useTableSelection,
  type UseTableSelectionOptions,
  type UseTableSelectionReturn,
} from "./useTableSelection";

export {
  useTableColumnVisibility,
  type UseTableColumnVisibilityOptions,
  type UseTableColumnVisibilityReturn,
} from "./useTableColumnVisibility";

// Migration hooks
export { useMigration } from "./useMigration";

// Trash hooks
export { useTrashConfirmation } from "./useTrashConfirmation";
export type { PendingTrashItem, TrashPreviewResult } from "./useTrashConfirmation";

// Fiscal Year Dashboard hooks
export {
  useFiscalYearDashboard,
  type FiscalYearWithStats,
  type RawFiscalYear,
  type YearToDelete,
  type UseFiscalYearDashboardOptions,
  type UseFiscalYearDashboardReturn,
} from "./useFiscalYearDashboard";

// Search hooks
export {
  useSearchRouter,
  useCategoryFilter,
  useInfiniteSearch,
  usePaginatedSearch,
  type SearchState,
  type SearchRouterReturn,
  type CategoryCount,
  type CategoryFilterOptions,
  type CategoryFilterReturn,
  type SearchOptions,
  type InfiniteSearchReturn,
} from "./search";
