"use client";

/**
 * @deprecated Use TableToolbar from @/components/features/ppdo/odpp/table/toolbar with config instead.
 * 
 * This adapter is kept for backward compatibility. New code should use the unified TableToolbar
 * directly with entity-specific configuration.
 * 
 * @example
 * // Before:
 * import { ProjectsTableToolbar } from "@/components/features/ppdo/odpp/table/toolbar";
 * <ProjectsTableToolbar {...props} />
 * 
 * // After:
 * import { TableToolbar } from "@/components/features/ppdo/odpp/table/toolbar";
 * import { AVAILABLE_COLUMNS } from "@/components/features/ppdo/odpp/projects/constants";
 * import { ProjectBulkActions } from "@/components/features/ppdo/odpp/projects/components/ProjectsTable/ProjectBulkActions";
 * import { Calculator } from "lucide-react";
 * 
 * <TableToolbar
 *   title="Projects"
 *   searchPlaceholder="Search projects..."
 *   addButtonLabel="Add Project"
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
 *       <ProjectBulkActions
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

export { TableToolbar as ProjectsTableToolbar } from "../TableToolbar";
export type { TableToolbarProps as ProjectsTableToolbarProps } from "../types";