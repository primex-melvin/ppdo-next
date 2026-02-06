// Main unified toolbar component
export { TableToolbar } from "./TableToolbar";
export { TableToolbarColumnVisibility } from "./TableToolbarColumnVisibility";
export { TableToolbarBulkActions } from "./TableToolbarBulkActions";

// Types
export type {
  TableToolbarProps,
  BulkAction,
  ColumnVisibilityMenuProps,
  KanbanFieldConfig,
} from "./types";

// ============================================
// ADAPTERS (Backward Compatible - @deprecated)
// ============================================
// These adapters are kept for backward compatibility but are deprecated.
// Use the unified TableToolbar component directly with configuration props instead.
// See each adapter file for migration examples.

// Budget (@deprecated - use TableToolbar directly)
export { BudgetTableToolbar } from "./adapters/BudgetTableToolbar";
export type { BudgetTableToolbarProps } from "./adapters/BudgetTableToolbar";

// Projects (@deprecated - use TableToolbar directly)
export { ProjectsTableToolbar } from "./adapters/ProjectsTableToolbar";
export type { ProjectsTableToolbarProps } from "./adapters/ProjectsTableToolbar";

// Funds (@deprecated - use TableToolbar directly)
export { FundsTableToolbar } from "./adapters/FundsTableToolbar";
export type { FundsTableToolbarProps } from "./adapters/FundsTableToolbar";

// Twenty Percent DF (@deprecated - use TableToolbar directly)
export { TwentyPercentDFTableToolbar } from "./adapters/TwentyPercentDFTableToolbar";
export type { TwentyPercentDFTableToolbarProps } from "./adapters/TwentyPercentDFTableToolbar";

// Trust Fund (@deprecated - use TableToolbar directly)
export { TrustFundTableToolbar } from "./adapters/TrustFundTableToolbar";
export type { TrustFundTableToolbarProps } from "./adapters/TrustFundTableToolbar";