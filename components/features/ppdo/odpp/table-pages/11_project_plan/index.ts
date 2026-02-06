// components/ppdo/11_project_plan/index.ts
// Centralized Project Budget Components Module

// ============================================================================
// PAGE HEADERS
// ============================================================================
export { BudgetPageHeader } from "./components/BudgetPageHeader";
export { YearBudgetPageHeader } from "./components/YearBudgetPageHeader";

// ============================================================================
// MAIN TABLE COMPONENT
// ============================================================================
export { BudgetTrackingTable } from "./components/BudgetTrackingTable";

// ============================================================================
// STATISTICS & VISUALIZATION
// ============================================================================
export { default as BudgetStatistics } from "./components/BudgetStatistics";

// ============================================================================
// FORMS
// ============================================================================
export { BudgetItemForm } from "./components/BudgetItemForm";
export { BudgetParticularCombobox } from "./components/BudgetParticularCombobox";

// ============================================================================
// MODALS & DIALOGS
// ============================================================================
export { Modal } from "./components/BudgetModal";
export { ConfirmationModal } from "./components/BudgetConfirmationModal";
export { ExpandModal } from "./components/BudgetExpandModal";
export { BudgetBulkToggleDialog } from "./components/BudgetBulkToggleDialog";
export { BudgetViolationModal } from "./components/BudgetViolationModal";
export { default as BudgetShareModal } from "./components/BudgetShareModal";

// ============================================================================
// FORM COMPONENTS
// ============================================================================
export {
  BudgetItemForm as FormBudgetItemForm,
  ParticularField,
  YearField,
  AllocatedBudgetField,
  AutoCalculateSwitch,
  ManualInputSection,
  ViolationAlerts,
  InfoBanner,
  FormActions,
} from "./form";

// Form validation utilities
export * from "./form/formValidation";

// ============================================================================
// TABLE COMPONENTS
// ============================================================================
export {
  BudgetTableHeader,
  BudgetTableRow,
  BudgetTableTotalsRow,
  BudgetTableEmptyState,
  BudgetContextMenu,
  BudgetColumnVisibilityMenu,
  BudgetTableToolbar,
} from "./table";

// ============================================================================
// CUSTOM HOOKS - DATA
// ============================================================================
export { useBudgetAccess } from "./hooks/useBudgetAccess";
export { useBudgetData } from "./hooks/useBudgetData";
export { useBudgetMutations } from "./hooks/useBudgetMutations";

// ============================================================================
// CUSTOM HOOKS - TABLE STATE & ACTIONS
// ============================================================================
export { useBudgetTableState } from "./hooks/useBudgetTableState";
export { useBudgetTableFilters } from "./hooks/useBudgetTableFilters";
export { useBudgetTableSelection } from "./hooks/useBudgetTableSelection";
export { useBudgetTableActions } from "./hooks/useBudgetTableActions";
export { useBudgetTablePrint } from "./hooks/useBudgetTablePrint";

// ============================================================================
// CUSTOM HOOKS - PRINT PREVIEW
// ============================================================================
export { usePrintPreviewState } from "./hooks/usePrintPreviewState";
export { usePrintPreviewActions } from "./hooks/usePrintPreviewActions";
export { usePrintPreviewDraft } from "./hooks/usePrintPreviewDraft";
export { usePrintPreviewInitialization } from "./hooks/usePrintPreviewInitialization";
export { useTableCanvasResize } from "./hooks/useTableCanvasResize";
export { usePrintDraft } from "./hooks/usePrintDraft";

// ============================================================================
// TYPES
// ============================================================================
export type {
  // Budget types
  BudgetItem,
  BudgetItemFromDB,
  BudgetItemFormData,
  BudgetTotals,
  BudgetParticular,
  BudgetStatus,
  BudgetSortField,
  // Table types
  BudgetTrackingTableProps,
  SortDirection,
  SortField,
  BudgetContextMenuState,
  ColumnConfig,
  FilterState,
  // Hook return types
  UseBudgetTableStateReturn,
  UseBudgetTableFiltersReturn,
  UseBudgetTableSelectionReturn,
  UseBudgetTableActionsReturn,
  UseBudgetTablePrintReturn,
  UseBudgetAccessReturn,
  UseBudgetDataReturn,
  UseBudgetMutationsReturn,
  UsePrintDraftReturn,
  // Access types
  AccessCheck,
  UserFromList,
  UserRole,
  UserStatus,
  AccessLevel,
  // Form types
  BudgetItemFormProps,
  ConfirmationModalProps,
  ModalSize,
  ModalProps,
  ViolationData,
  BudgetViolationModalProps,
  BudgetBulkToggleDialogProps,
  // Print types
  ColumnDefinition,
  PrintPreviewModalProps,
  PrintPreviewToolbarProps,
  DraftMetadata,
  DraftInfo,
  StorageInfo,
} from "./types";

// ============================================================================
// UTILITIES
// ============================================================================
export {
  extractYearFromURL,
  isValidYear,
  convertToPrintTotals,
  getVisibleColumns,
  formatTimestamp,
  calculateBudgetTotals,
  calculateTotalUtilizationRate,
} from "./utils";

// Draft storage utilities - re-export with consistent naming
export {
  getDraftKey as generateDraftId,
  saveDraft as saveDraftToStorage,
  loadDraft as getDraftsFromStorage,
  deleteDraft as deleteDraftFromStorage,
  getStorageInfo,
} from "./utils/draftStorage";

// Spreadsheet config
export {
  BUDGET_SPREADSHEET_CONFIG,
} from "./utils/budgetSpreadsheetConfig";

// ============================================================================
// CONSTANTS
// ============================================================================
export {
  BUDGET_TABLE_COLUMNS,
  STATUS_OPTIONS,
  ACCESS_LEVELS,
  ITEMS_PER_PAGE,
  ANIMATION,
  EXPORT,
} from "./constants";

// Re-export shared constants
export {
  VALIDATION_MESSAGES,
  VALIDATION_LIMITS,
  CODE_PATTERN,
} from "@/lib/shared/constants/validation";

export {
  STORAGE_KEYS,
} from "@/lib/shared/constants/storage";

export {
  PAGINATION,
  TIMEOUTS,
  LIMITS,
  AVATAR_COLORS,
} from "@/lib/shared/constants/display";

// ============================================================================
// ADAPTERS
// ============================================================================
export { BudgetPrintAdapter } from "./adapters/BudgetPrintAdapter";
