
/**
 * Column Resize Adapter
 * 
 * A unified adapter system for seamless table column resizing across all PPDO pages.
 * Eliminates code duplication while maintaining 100% backward compatibility.
 * 
 * @example
 * // Using the adapter (recommended for new tables)
 * import { useColumnResizeAdapter, UnifiedTable } from "./adapter";
 * 
 * const adapter = useColumnResizeAdapter<BudgetItem>({
 *   tableIdentifier: "budgetItemsTable_v2",
 *   columns: BUDGET_TABLE_COLUMNS,
 *   data: budgetItems,
 *   enableSelection: true,
 *   enableTotals: true,
 *   totalsConfig: { ... },
 *   customActions: { onView, onEdit, onDelete },
 * });
 * 
 * return (
 *   <UnifiedTable
 *     data={budgetItems}
 *     adapter={adapter}
 *     actionConfig={{ onView, onEdit, onDelete }}
 *     totalsConfig={totalsConfig}
 *   />
 * );
 */

// ===== ADAPTER HOOKS =====
export {
    useColumnResizeAdapter,
    useActionDropdown,
    useTotalsCalculator,
} from "./hooks";

// ===== ADAPTER COMPONENTS =====
export {
    UnifiedTable,
    GenericTotalsRow,
    ActionDropdown,
} from "./components";

// ===== ADAPTER TYPES =====
export type {
    ColumnResizeAdapterOptions,
    ColumnResizeAdapterReturn,
    CellRendererRegistry,
    CellRendererType,
    ActionConfig,
    AggregatorType,
    TotalsColumnConfig,
    TotalsConfig,
    UnifiedTableProps,
    GenericTotalsRowProps,
    ActionDropdownProps,
    WithId,
    CellRenderFn,
    AggregationFn,
} from "./types/adapter.types";

// ===== ADAPTER UTILITIES =====
export {
    // Totals aggregation
    sumAggregator,
    avgAggregator,
    countAggregator,
    getAggregator,
    calculateColumnTotal,
    calculateAllTotals,
    // Action building
    buildActionMenu,
    // Column mapping
    mapVisibleColumns,
    createColumnMap,
    getColumnIndex,
    isColumnVisible,
    toggleColumnVisibility,
} from "./utils";

export type { ActionMenuItem } from "./utils/actionBuilder";

// ===== CELL RENDERER REGISTRY =====
export {
    defaultCellRenderers,
    getCellRenderer,
    createCellRenderer,
    cellRendererRegistry,
} from "./registry/cellRegistry";
