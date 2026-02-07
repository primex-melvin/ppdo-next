
import { ColumnConfig } from "../core/types/table.types";

/**
 * Breakdown table columns with persisted widths.
 * Used for project/trust fund breakdown records.
 */
export const BREAKDOWN_TABLE_COLUMNS: ColumnConfig[] = [
    {
        key: "projectTitle",
        label: "Project Name",
        width: 280,
        flex: 4,
        minWidth: 200,
        maxWidth: 450,
        type: "text",
        align: "left"
    },
    {
        key: "implementingOffice",
        label: "Implementing Office",
        width: 180,
        flex: 3,
        minWidth: 150,
        maxWidth: 300,
        type: "text",
        align: "left"
    },
    {
        key: "allocatedBudget",
        label: "Allocated Budget",
        width: 150,
        flex: 2,
        minWidth: 120,
        maxWidth: 200,
        type: "currency",
        align: "right"
    },
    {
        key: "obligatedBudget",
        label: "Obligated Budget",
        width: 150,
        flex: 2,
        minWidth: 120,
        maxWidth: 200,
        type: "currency",
        align: "right"
    },
    {
        key: "budgetUtilized",
        label: "Budget Utilized",
        width: 150,
        flex: 2,
        minWidth: 120,
        maxWidth: 200,
        type: "currency",
        align: "right"
    },
    {
        key: "utilizationRate",
        label: "Utilization Rate",
        width: 120,
        flex: 2,
        minWidth: 100,
        maxWidth: 160,
        type: "number",
        align: "right"
    },
    {
        key: "balance",
        label: "Balance",
        width: 150,
        flex: 2,
        minWidth: 120,
        maxWidth: 200,
        type: "currency",
        align: "right"
    },
    {
        key: "dateStarted",
        label: "Date Started",
        width: 120,
        flex: 2,
        minWidth: 100,
        maxWidth: 160,
        type: "date",
        align: "left"
    },
    {
        key: "targetDate",
        label: "Target Date",
        width: 120,
        flex: 2,
        minWidth: 100,
        maxWidth: 160,
        type: "date",
        align: "left"
    },
    {
        key: "completionDate",
        label: "Completion Date",
        width: 120,
        flex: 2,
        minWidth: 100,
        maxWidth: 160,
        type: "date",
        align: "left"
    },
    {
        key: "projectAccomplishment",
        label: "Accomplishment %",
        width: 100,
        flex: 1,
        minWidth: 80,
        maxWidth: 140,
        type: "number",
        align: "right"
    },
    {
        key: "status",
        label: "Status",
        width: 120,
        flex: 2,
        minWidth: 100,
        maxWidth: 180,
        type: "status",
        align: "center"
    },
    {
        key: "remarks",
        label: "Remarks",
        width: 250,
        flex: 3,
        minWidth: 180,
        maxWidth: 400,
        type: "text",
        align: "left"
    },
];
