// components/ppdo/breakdown/index.ts

/**
 * Centralized Breakdown Components Module
 *
 * This module provides all breakdown-related components, hooks, utilities, and types
 * for both Project and Trust Fund breakdown pages.
 *
 * Usage:
 * ```tsx
 * // Import everything you need from one place
 * import {
 *   BreakdownHistoryTable,
 *   BreakdownForm,
 *   BreakdownHeader,
 *   EntityOverviewCards,
 *   BreakdownStatsAccordion,
 *   useTableSettings,
 *   Breakdown,
 * } from "@/components/features/ppdo/breakdown";
 * ```
 */

// ============================================================================
// SHARED COMPONENTS (Header, Overview Cards, Stats Accordion)
// ============================================================================
export { BreakdownHeader } from "./shared/BreakdownHeader";
export type { BreakdownHeaderProps } from "./shared/BreakdownHeader";

export { EntityOverviewCards } from "./shared/EntityOverviewCards";
export type { EntityOverviewCardsProps } from "./shared/EntityOverviewCards";

export { BreakdownStatsAccordion } from "./shared/BreakdownStatsAccordion";
export type { BreakdownStatsAccordionProps } from "./shared/BreakdownStatsAccordion";

export { BreakdownStatistics } from "./shared/BreakdownStatistics";


// ============================================================================
// TABLE COMPONENTS
// ============================================================================
export {
  BreakdownHistoryTable,
  TableHeader,
  TableRow,
  TableTotalsRow,
  EmptyState,
} from "./table";

// ============================================================================
// FORM COMPONENTS
// ============================================================================
export {
  BreakdownForm,
  ProjectTitleField,
  ImplementingOfficeField,
  AllocatedBudgetField,
  ObligatedBudgetField,
  UtilizedBudgetField,
  AccomplishmentField,
  StatusField,
  RemarksField,
  LocationFields,
  DateFields,
  FormActions,
  BudgetOverviewCard,
  BudgetWarningAlert,
  BudgetStatusBar,
  FinancialInfoSection,
  AdditionalInfoSection,
} from "./form";

// ============================================================================
// KANBAN COMPONENTS
// ============================================================================
export { BreakdownKanban } from "./kanban";

// ============================================================================
// TYPES
// ============================================================================
export type {
  Breakdown,
  ColumnConfig,
  ColumnType,
  ColumnAlign,
  BreakdownHistoryTableProps,
  RowHeights,
  ColumnTotals,
  TableSettings,
  NavigationParams,
} from "./types";

// ============================================================================
// CONSTANTS
// ============================================================================
export {
  TABLE_IDENTIFIER,
  DEFAULT_ROW_HEIGHT,
  MIN_COLUMN_WIDTH,
  MIN_ROW_HEIGHT,
  TABLE_HEIGHT,
  DEFAULT_COLUMNS,
  CURRENCY_FORMAT_OPTIONS,
  LOCALE,
} from "./constants";

// ============================================================================
// HOOKS
// ============================================================================
export {
  useTableSettings,
  useTableResize,
  useColumnDragDrop,
} from "./hooks";

// ============================================================================
// UTILITIES
// ============================================================================
export {
  // Helpers
  extractIdFromSlug,
  createBreakdownSlug,
  filterBreakdowns,
  calculateColumnTotals,
  generateGridTemplate,
  mergeColumnSettings,
  safeJsonParse,
  isInteractiveElement,
  // Formatters
  formatCellValue,
  formatCurrency,
  formatDate,
  formatPercentage,
  formatLocation,
  // Navigation
  buildBreakdownDetailPath,
  logBreakdownNavigation,
} from "./utils";

// ============================================================================
// FORM UTILITIES (Re-exported from form module)
// ============================================================================
export {
  breakdownSchema,
  type BreakdownFormValues,
  type BudgetAllocationStatus,
  type BudgetWarning,
  calculateBudgetAvailability,
  getBudgetWarning,
  calculateUtilizationRate,
  useBudgetValidation,
} from "./form";

// ============================================================================
// PRINT ADAPTER
// ============================================================================
export { BreakdownPrintAdapter } from "./lib/print-adapters/BreakdownPrintAdapter";

// ============================================================================
// SHARE MODAL
// ============================================================================
export { BreakdownShareModal } from "./components/BreakdownShareModal";