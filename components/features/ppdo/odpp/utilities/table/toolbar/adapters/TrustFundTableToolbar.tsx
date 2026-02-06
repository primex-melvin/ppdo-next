"use client";

/**
 * @deprecated Use TableToolbar from @/components/features/ppdo/odpp/table/toolbar with config instead.
 * 
 * This adapter is kept for backward compatibility. New code should use the unified TableToolbar
 * directly with entity-specific configuration.
 * 
 * @example
 * // Before:
 * import { TrustFundTableToolbar } from "@/components/features/ppdo/odpp/table/toolbar";
 * <TrustFundTableToolbar {...props} />
 * 
 * // After:
 * import { TableToolbar } from "@/components/features/ppdo/odpp/table/toolbar";
 * 
 * const TRUST_FUND_COLUMNS = [
 *   { key: "description", label: "Description" },
 *   { key: "amount", label: "Amount" },
 *   { key: "received", label: "Received" },
 *   { key: "utilized", label: "Utilized" },
 *   { key: "balance", label: "Balance" },
 *   { key: "utilizationRate", label: "Utilization Rate" },
 *   { key: "remarks", label: "Remarks" },
 * ];
 * 
 * <TableToolbar
 *   title="Trust Funds"
 *   searchPlaceholder="Search trust funds..."
 *   addButtonLabel="Add"
 *   columns={TRUST_FUND_COLUMNS}
 *   showColumnVisibility={!!(onToggleColumn && onShowAllColumns && onHideAllColumns)}
 *   showExport={true}
 *   showShare={!!onOpenShare}
 *   showPrintPreview={!!onOpenPrintPreview}
 *   showDirectPrint={true}
 *   animatedSearch={true}
 *   {...props}
 * />
 */

export { TableToolbar as TrustFundTableToolbar } from "../TableToolbar";
export type { TableToolbarProps as TrustFundTableToolbarProps } from "../types";