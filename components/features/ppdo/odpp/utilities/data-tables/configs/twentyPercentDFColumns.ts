
import { ColumnConfig } from "../core/types/table.types";

/**
 * 20% DF table columns with flex weights.
 * Note: Slightly different weights than projects table
 * to account for fewer columns (no obligatedBudget).
 */
export const TWENTY_PERCENT_DF_COLUMNS: ColumnConfig[] = [
    { key: "particulars", label: "Particulars", flex: 5, minWidth: 200, type: "text", align: "left" },
    { key: "implementingOffice", label: "Implementing Office", flex: 3, minWidth: 140, type: "text", align: "left" },
    { key: "year", label: "Year", flex: 1, minWidth: 60, type: "number", align: "center" },
    { key: "status", label: "Status", flex: 2, minWidth: 100, type: "status", align: "center" },
    { key: "totalBudgetAllocated", label: "Allocated", flex: 3, minWidth: 120, type: "currency", align: "right" },
    { key: "totalBudgetUtilized", label: "Utilized", flex: 3, minWidth: 120, type: "currency", align: "right" },
    { key: "utilizationRate", label: "Util. Rate", flex: 2, minWidth: 90, type: "percentage", align: "right" },
    { key: "projectCompleted", label: "COMPLETED", flex: 1, minWidth: 70, type: "number", align: "right" },
    { key: "projectDelayed", label: "DELAYED", flex: 1, minWidth: 70, type: "number", align: "right" },
    { key: "projectsOngoing", label: "ONGOING", flex: 1, minWidth: 70, type: "number", align: "right" },
    { key: "remarks", label: "Remarks", flex: 4, minWidth: 150, type: "text", align: "left" },
];
