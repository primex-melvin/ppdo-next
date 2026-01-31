/**
 * Custom Hooks Index
 * 
 * Shared hooks for use across the application.
 */

// Dashboard hooks
export { useDashboardFilters } from "./useDashboardFilters";

// Utility hooks
export { useDebounce } from "./use-debounce";

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
