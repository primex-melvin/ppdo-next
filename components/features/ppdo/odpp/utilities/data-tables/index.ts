
/**
 * Centralized Data Tables Module
 * 
 * This module consolidates all table-related components, hooks, types, and utilities
 * into a single, well-organized location for the PPDO application.
 * 
 * @example
 * // Import table components
 * import { ProjectsTable, BudgetTable, FundsTable } from "@/components/features/ppdo/data-tables";
 * 
 * // Import column configurations
 * import { PROJECT_TABLE_COLUMNS, BUDGET_TABLE_COLUMNS } from "@/components/features/ppdo/data-tables";
 * 
 * // Import core hooks and types
 * import { useResizableColumns, ColumnConfig } from "@/components/features/ppdo/data-tables";
 * 
 * // Import cell renderers
 * import { CurrencyCell, StatusCell } from "@/components/features/ppdo/data-tables";
 */

// ===== CORE COMPONENTS =====
export {
    ResizableTableContainer,
    ResizableTableHeader,
    ResizableTableRow,
} from "./core";

// ===== CORE HOOKS =====
export {
    useResizableColumns,
    useTableSelection,
    useTableSettings,
    useTableResize,
    useColumnDragDrop,
} from "./core";

// ===== CORE TYPES =====
export type {
    ColumnConfig,
    ColumnType,
    ColumnAlign,
    RowHeights,
    TableSettings,
} from "./core";

// ===== CORE UTILS =====
export {
    formatCurrency,
    formatDate,
    formatPercentage,
    generateGridTemplate,
    mergeColumnSettings,
    safeJsonParse,
    isInteractiveElement,
} from "./core";

// ===== CORE CONSTANTS =====
export {
    TABLE_IDENTIFIER,
    DEFAULT_ROW_HEIGHT,
    MIN_COLUMN_WIDTH,
    MIN_ROW_HEIGHT,
    TABLE_HEIGHT,
    CURRENCY_FORMAT_OPTIONS,
    LOCALE,
} from "./core";

// ===== COLUMN CONFIGS =====
export {
    PROJECT_TABLE_COLUMNS,
    BUDGET_TABLE_COLUMNS,
    FUNDS_TABLE_COLUMNS,
    TWENTY_PERCENT_DF_COLUMNS,
    BREAKDOWN_TABLE_COLUMNS,
} from "./configs";

// ===== TABLE COMPONENTS =====
export {
    ProjectsTable,
    BudgetTable,
    FundsTable,
    TwentyPercentDFTable,
} from "./tables";

// ===== CELL RENDERERS - COMMON =====
export {
    CurrencyCell,
    PercentageCell,
    DateCell,
    TextCell,
    CountCell,
} from "./cells";

// ===== CELL RENDERERS - PROJECTS =====
export {
    ProjectNameCell,
    ProjectStatusCell,
    ProjectBudgetCell,
    ProjectRemarksCell,
} from "./cells";

// ===== CELL RENDERERS - BUDGET =====
export {
    BudgetParticularCell,
    BudgetStatusCell,
    BudgetAmountCell,
    BudgetCountCell,
} from "./cells";

// ===== CELL RENDERERS - FUNDS =====
export {
    FundTitleCell,
    FundStatusCell,
    FundAmountCell,
    FundDateCell,
    FundRemarksCell,
} from "./cells";

// ===== CELL RENDERERS - 20% DF =====
export {
    TwentyPercentDFNameCell,
    TwentyPercentDFStatusCell,
    TwentyPercentDFAmountCell,
} from "./cells";