
/**
 * Column Resize Adapter - Type Definitions
 * 
 * TypeScript interfaces for the unified adapter system that eliminates
 * code duplication across all PPDO table implementations.
 */

import { ReactNode, ComponentType } from "react";
import { ColumnConfig, RowHeights } from "../../core/types/table.types";

// ============================================================================
// MAIN ADAPTER OPTIONS
// ============================================================================

export interface ColumnResizeAdapterOptions<T extends { id: string }> {
    /** Unique identifier for the table (used for persistence) */
    tableIdentifier: string;
    /** Column configuration definitions */
    columns: ColumnConfig<T>[];
    /** Table data array */
    data: T[];
    
    // Optional configurations
    /** Set of hidden column keys */
    hiddenColumns?: Set<string>;
    /** Enable row selection functionality */
    enableSelection?: boolean;
    /** Enable totals row calculation */
    enableTotals?: boolean;
    /** Totals calculation configuration */
    totalsConfig?: TotalsConfig<T>;
    
    // Custom renderers (optional)
    /** Override default cell renderers */
    customCellRenderers?: Partial<CellRendererRegistry<T>>;
    /** Configure action dropdown items */
    customActions?: ActionConfig<T>;
}

// ============================================================================
// ADAPTER RETURN TYPE
// ============================================================================

export interface ColumnResizeAdapterReturn<T extends { id: string }> {
    // State
    /** Currently visible columns (filtered by hiddenColumns) */
    visibleColumns: ColumnConfig<T>[];
    /** Current column widths map (columnKey -> width) */
    columnWidths: Map<string, number>;
    /** Current row heights map (rowId -> height) */
    rowHeights: RowHeights;
    /** Whether user can edit table layout (resize, reorder) */
    canEditLayout: boolean;
    /** Loading state */
    isLoading: boolean;
    
    // Selection state (if enabled)
    /** Set of selected row IDs */
    selectedIds: Set<string>;
    /** Whether all rows are selected */
    isAllSelected: boolean;
    /** Whether selection is in indeterminate state */
    isIndeterminate: boolean;
    
    // Render helpers
    /** Render a cell for given item and column */
    renderCell: (item: T, column: ColumnConfig<T>) => ReactNode;
    /** Render action dropdown for given item */
    renderActions: (item: T) => ReactNode;
    /** Render totals row component */
    renderTotals: () => ReactNode | null;
    
    // Handlers
    /** Handle drag start for column reordering */
    onDragStart: (index: number) => void;
    /** Handle drag over for column reordering */
    onDragOver: (e: React.DragEvent) => void;
    /** Handle drop for column reordering */
    onDrop: (index: number) => void;
    /** Start column resize */
    onStartResize: (e: React.MouseEvent, index: number) => void;
    /** Start row resize */
    onStartRowResize: (e: React.MouseEvent, rowId: string) => void;
    /** Handle row selection */
    onSelectRow: (id: string, checked: boolean) => void;
    /** Handle select all rows */
    onSelectAll: (checked: boolean) => void;
}

// ============================================================================
// CELL RENDERER REGISTRY
// ============================================================================

export type CellRendererType = "text" | "number" | "date" | "status" | "currency" | "percentage" | "custom";

export interface CellRendererRegistry<T> {
    /** Render text cells */
    text: (item: T, column: ColumnConfig<T>) => ReactNode;
    /** Render number cells */
    number: (item: T, column: ColumnConfig<T>) => ReactNode;
    /** Render date cells */
    date: (item: T, column: ColumnConfig<T>) => ReactNode;
    /** Render status cells */
    status: (item: T, column: ColumnConfig<T>) => ReactNode;
    /** Render currency cells */
    currency: (item: T, column: ColumnConfig<T>) => ReactNode;
    /** Render percentage cells */
    percentage: (item: T, column: ColumnConfig<T>) => ReactNode;
    /** Render custom cells */
    custom: (item: T, column: ColumnConfig<T>) => ReactNode;
}

// ============================================================================
// ACTION CONFIGURATION
// ============================================================================

/** Icon component type for action items */
export type ActionIcon = ComponentType<{ className?: string }>;

export interface ActionConfig<T> {
    /** View action handler */
    onView?: (item: T) => void;
    /** Edit action handler */
    onEdit?: (item: T) => void;
    /** Delete action handler */
    onDelete?: (item: T) => void;
    /** Pin/unpin action handler */
    onPin?: (item: T) => void;
    /** Toggle auto-calculate action handler */
    onToggleAutoCalculate?: (item: T) => void;
    /** Change category action handler */
    onChangeCategory?: (item: T) => void;
    /** View log action handler */
    onViewLog?: (item: T) => void;
    /** Custom additional actions */
    customActions?: Array<{
        label: string;
        icon: ActionIcon;
        onClick: (item: T) => void;
        variant?: "default" | "danger";
    }>;
}

// ============================================================================
// TOTALS CONFIGURATION
// ============================================================================

export type AggregatorType = "sum" | "avg" | "count" | "custom";

export interface TotalsColumnConfig<T> {
    /** Column key to aggregate */
    key: keyof T | string;
    /** Aggregation method */
    aggregator: AggregatorType;
    /** Custom aggregation function (when aggregator is "custom") */
    customAggregator?: (items: T[]) => number;
    /** Optional formatter for the aggregated value */
    formatter?: (value: number) => string;
}

export interface TotalsConfig<T> {
    /** Column configurations for totals calculation */
    columns: TotalsColumnConfig<T>[];
    /** Which column shows the "TOTALS" label (defaults to first column) */
    labelColumn?: string;
    /** Custom label text (defaults to "TOTALS") */
    labelText?: string;
}

// ============================================================================
// UNIFIED TABLE PROPS
// ============================================================================

export interface UnifiedTableProps<T extends { id: string }> {
    /** Table data array */
    data: T[];
    /** Adapter instance from useColumnResizeAdapter */
    adapter: ColumnResizeAdapterReturn<T>;
    /** Optional toolbar content */
    toolbar?: ReactNode;
    /** Message to show when data is empty */
    emptyMessage?: string;
    /** Max height for the table container */
    maxHeight?: string;
    /** Optional row click handler */
    onRowClick?: (item: T, e: React.MouseEvent) => void;
    /** Optional className for the container */
    className?: string;
}

// ============================================================================
// GENERIC TOTALS ROW PROPS
// ============================================================================

export interface GenericTotalsRowProps<T> {
    /** Visible columns configuration */
    columns: ColumnConfig<T>[];
    /** Current column widths */
    columnWidths: Map<string, number>;
    /** Table data for aggregation */
    data: T[];
    /** Totals configuration */
    config: TotalsConfig<T>;
}

// ============================================================================
// ACTION DROPDOWN PROPS
// ============================================================================

export interface ActionDropdownProps<T> {
    /** Table item */
    item: T;
    /** Action configuration */
    config: ActionConfig<T>;
    /** Optional className */
    className?: string;
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

/** Generic item with ID */
export type WithId = { id: string };

/** Cell render function type */
export type CellRenderFn<T> = (item: T, column: ColumnConfig<T>) => ReactNode;

/** Aggregation function type */
export type AggregationFn<T> = (items: T[], key: keyof T | string) => number;
