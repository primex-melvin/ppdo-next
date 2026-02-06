"use client";

/**
 * @deprecated Use TableToolbar from @/components/features/ppdo/odpp/table/toolbar with config instead.
 * 
 * This adapter is kept for backward compatibility. New code should use the unified TableToolbar
 * directly with entity-specific configuration.
 * 
 * @example
 * // Before:
 * import { TwentyPercentDFTableToolbar } from "@/components/features/ppdo/odpp/table/toolbar";
 * <TwentyPercentDFTableToolbar {...props} />
 * 
 * // After:
 * import { TableToolbar } from "@/components/features/ppdo/odpp/table/toolbar";
 * import { AVAILABLE_COLUMNS } from "@/components/features/ppdo/odpp/twenty-percent-df/constants";
 * import { TwentyPercentDFBulkActions } from "@/components/features/ppdo/odpp/twenty-percent-df/components/TwentyPercentDFTable/TwentyPercentDFBulkActions";
 * import { Calculator } from "lucide-react";
 * 
 * <TableToolbar
 *   title="Projects"
 *   searchPlaceholder="Search projects..."
 *   addButtonLabel="Add"
 *   columns={AVAILABLE_COLUMNS.map(col => ({ key: col.id, label: col.label }))}
 *   bulkActions={[
 *     {
 *       id: "auto-calculate",
 *       label: "Toggle Auto-Calculate",
 *       icon: <Calculator className="w-4 h-4" />,
 *       onClick: onBulkToggleAutoCalculate,
 *       showWhen: (count) => count > 0,
 *     }
 *   ]}
 *   bulkActionsComponent={
 *     canManageBulkActions && selectedCount > 0 ? (
 *       <TwentyPercentDFBulkActions
 *         selectedCount={selectedCount}
 *         onCategoryChange={onBulkCategoryChange}
 *       />
 *     ) : null
 *   }
 *   showColumnVisibility={true}
 *   showExport={true}
 *   showShare={true}
 *   showPrintPreview={true}
 *   showDirectPrint={true}
 *   animatedSearch={true}
 *   {...props}
 * />
 */

export { TableToolbar as TwentyPercentDFTableToolbar } from "../TableToolbar";
export type { TableToolbarProps as TwentyPercentDFTableToolbarProps } from "../types";