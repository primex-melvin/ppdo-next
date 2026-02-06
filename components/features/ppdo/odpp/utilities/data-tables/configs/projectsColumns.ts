
import { ColumnConfig } from "../core/types/table.types";

/**
 * Project table columns with flex weights.
 * Higher flex = wider column.
 * All flex values are relative to each other.
 */
export const PROJECT_TABLE_COLUMNS: ColumnConfig[] = [
    {
        key: "particulars",
        label: "Project Name",
        flex: 5,        // Widest - project names are long
        minWidth: 200,
        type: "text",
        align: "left"
    },
    {
        key: "implementingOffice",
        label: "Implementing Office",
        flex: 3,        // Medium-wide
        minWidth: 140,
        type: "text",
        align: "left"
    },
    {
        key: "year",
        label: "Year",
        flex: 1,        // Narrow - just 4 digits
        minWidth: 60,
        type: "number",
        align: "center"
    },
    {
        key: "status",
        label: "Status",
        flex: 2,        // Medium - status badges
        minWidth: 100,
        type: "status",
        align: "center"
    },
    {
        key: "totalBudgetAllocated",
        label: "Allocated Budget",
        flex: 3,        // Currency needs space
        minWidth: 130,
        type: "currency",
        align: "right"
    },
    {
        key: "obligatedBudget",
        label: "Obligated Budget",
        flex: 3,
        minWidth: 130,
        type: "currency",
        align: "right"
    },
    {
        key: "totalBudgetUtilized",
        label: "Utilized Budget",
        flex: 3,
        minWidth: 130,
        type: "currency",
        align: "right"
    },
    {
        key: "utilizationRate",
        label: "Utilization Rate",
        flex: 2,        // Percentage
        minWidth: 100,
        type: "percentage",
        align: "right"
    },
    {
        key: "projectCompleted",
        label: "COMPLETED",
        flex: 1,        // Small number
        minWidth: 70,
        type: "number",
        align: "right"
    },
    {
        key: "projectDelayed",
        label: "DELAYED",
        flex: 1,
        minWidth: 70,
        type: "number",
        align: "right"
    },
    {
        key: "projectsOngoing",
        label: "ONGOING",
        flex: 1,
        minWidth: 70,
        type: "number",
        align: "right"
    },
    {
        key: "remarks",
        label: "Remarks",
        flex: 4,        // Can be long text
        minWidth: 150,
        type: "text",
        align: "left"
    },
];
