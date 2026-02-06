
/**
 * Common Spreadsheet Configuration Utilities
 * 
 * Shared spreadsheet configs used across PPDO modules.
 */

import { SpreadsheetConfig, ColumnDefinition } from "@/components/features/spreadsheet/types";
import { api } from "@/convex/_generated/api";

// ============================================================================
// Project Spreadsheet Config
// ============================================================================

/**
 * Standard column definitions for project-like entities
 * Used by: Projects, 20% Development Fund
 */
export const PROJECT_COLUMNS: ColumnDefinition[] = [
    { key: "particulars", label: "Particulars", type: "text", align: "left" },
    { key: "implementingOffice", label: "Implementing Office", type: "text", align: "left" },
    { key: "year", label: "Year", type: "number", align: "center" },
    { key: "status", label: "Status", type: "text", align: "center" },
    { key: "totalBudgetAllocated", label: "Budget Allocated", type: "currency", align: "right" },
    { key: "obligatedBudget", label: "Obligated Budget", type: "currency", align: "right" },
    { key: "totalBudgetUtilized", label: "Budget Utilized", type: "currency", align: "right" },
    { key: "utilizationRate", label: "Utilization Rate", type: "percentage", align: "right" },
    { key: "projectCompleted", label: "Completed", type: "number", align: "right" },
    { key: "projectDelayed", label: "Delayed", type: "number", align: "right" },
    { key: "projectsOngoing", label: "Ongoing", type: "number", align: "right" },
];

/**
 * Create a spreadsheet config for project-like entities
 * @param budgetItemId - The parent budget item ID for filtering
 * @param particular - The particular name for the title
 * @param tableName - Optional custom table name (default: "projects")
 * @returns SpreadsheetConfig for projects
 */
export const createProjectSpreadsheetConfig = (
    budgetItemId: string,
    particular: string,
    tableName: string = "projects"
): SpreadsheetConfig => ({
    tableName,
    fetchQuery: api.projects.list,
    columns: PROJECT_COLUMNS,
    features: {
        enableExport: true,
        enablePrint: true,
        enableShare: false,
        showTotalsRow: true,
        showTotalsColumn: true,
        viewMode: "viewer",
    },
    title: `Projects - ${particular}`,
    accentColor: "#3b82f6",
    filters: { budgetItemId },
});

// ============================================================================
// Budget Item Spreadsheet Config (for 11_project_plan)
// ============================================================================

/**
 * Column definitions for budget items
 */
export const BUDGET_ITEM_COLUMNS: ColumnDefinition[] = [
    { key: "particular", label: "Particular", type: "text", align: "left" },
    { key: "year", label: "Year", type: "number", align: "center" },
    { key: "status", label: "Status", type: "text", align: "center" },
    { key: "totalBudgetAllocated", label: "Total Budget Allocated", type: "currency", align: "right" },
    { key: "obligatedBudget", label: "Obligated Budget", type: "currency", align: "right" },
    { key: "totalBudgetUtilized", label: "Total Budget Utilized", type: "currency", align: "right" },
    { key: "utilizationRate", label: "Utilization Rate", type: "percentage", align: "right" },
    { key: "projectCompleted", label: "Projects Completed", type: "number", align: "center" },
    { key: "projectDelayed", label: "Projects Delayed", type: "number", align: "center" },
    { key: "projectsOngoing", label: "Projects On Track", type: "number", align: "center" },
];

/**
 * Standard spreadsheet config for budget items
 */
export const BUDGET_SPREADSHEET_CONFIG: SpreadsheetConfig = {
    tableName: "budgetItems",
    fetchQuery: api.budgetItems.list,
    columns: BUDGET_ITEM_COLUMNS,
    features: {
        enableExport: true,
        enablePrint: true,
        enableShare: false,
        showTotalsRow: true,
        showTotalsColumn: true,
        viewMode: "viewer",
    },
    title: "Budget Tracking",
    accentColor: "#3b82f6",
};