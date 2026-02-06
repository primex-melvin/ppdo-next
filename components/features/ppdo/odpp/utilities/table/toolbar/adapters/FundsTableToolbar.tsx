"use client";

/**
 * @deprecated Use TableToolbar from @/components/features/ppdo/odpp/table/toolbar with config instead.
 * 
 * This adapter is kept for backward compatibility. New code should use the unified TableToolbar
 * directly with entity-specific configuration.
 * 
 * @example
 * // Before:
 * import { FundsTableToolbar } from "@/components/features/ppdo/odpp/table/toolbar";
 * <FundsTableToolbar {...props} />
 * 
 * // After:
 * import { TableToolbar } from "@/components/features/ppdo/odpp/table/toolbar";
 * import { AVAILABLE_COLUMNS } from "@/components/features/ppdo/odpp/funds/constants";
 * 
 * const KANBAN_FIELDS = [
 *   { id: "received", label: "Received" },
 *   { id: "obligatedPR", label: "Obligated/PR" },
 *   { id: "utilized", label: "Utilized" },
 *   { id: "balance", label: "Balance" },
 *   { id: "utilizationRate", label: "Utilization Rate" },
 *   { id: "date", label: "Date" },
 *   { id: "remarks", label: "Remarks" },
 * ];
 * 
 * <TableToolbar
 *   title="Funds"
 *   searchPlaceholder="Search funds..."
 *   addButtonLabel="Add"
 *   columns={AVAILABLE_COLUMNS.map(col => ({ key: col.id, label: col.label }))}
 *   kanbanFields={KANBAN_FIELDS}
 *   showColumnVisibility={true}
 *   showExport={true}
 *   showShare={true}
 *   showPrintPreview={true}
 *   showDirectPrint={true}
 *   animatedSearch={true}
 *   {...props}
 * />
 */

export { TableToolbar as FundsTableToolbar } from "../TableToolbar";
export type { TableToolbarProps as FundsTableToolbarProps } from "../types";