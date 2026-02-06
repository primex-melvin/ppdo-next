"use client";

/**
 * @deprecated Use TableToolbar from @/components/features/ppdo/odpp/table/toolbar with config instead.
 * 
 * This adapter is kept for backward compatibility. New code should use the unified TableToolbar
 * directly with entity-specific configuration.
 * 
 * @example
 * // Before:
 * import { BudgetTableToolbar } from "@/components/features/ppdo/odpp/table/toolbar";
 * <BudgetTableToolbar {...props} />
 * 
 * // After:
 * import { TableToolbar } from "@/components/features/ppdo/odpp/table/toolbar";
 * import { BUDGET_TABLE_COLUMNS } from "@/components/features/ppdo/odpp/11_project_plan/constants";
 * import { Calculator } from "lucide-react";
 * 
 * <TableToolbar
 *   title="Budget Items"
 *   searchPlaceholder="Search budget items..."
 *   addButtonLabel="Add New"
 *   columns={BUDGET_TABLE_COLUMNS.map(col => ({ key: col.key, label: col.label }))}
 *   bulkActions={[
 *     {
 *       id: "auto-calculate",
 *       label: "Toggle Auto-Calculate",
 *       icon: <Calculator className="w-4 h-4" />,
 *       onClick: onBulkToggleAutoCalculate,
 *       showWhen: (count) => count > 0,
 *     }
 *   ]}
 *   {...props}
 * />
 */

export { TableToolbar as BudgetTableToolbar } from "../TableToolbar";
export type { TableToolbarProps as BudgetTableToolbarProps } from "../types";