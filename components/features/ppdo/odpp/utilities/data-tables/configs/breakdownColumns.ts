
import { ColumnConfig } from "../core/types/table.types";

export const BREAKDOWN_TABLE_COLUMNS: ColumnConfig[] = [
    {
        key: "projectTitle",
        label: "Project Name",
        flex: 4,
        minWidth: 200,
        type: "text",
        align: "left"
    },
    {
        key: "implementingOffice",
        label: "Implementing Office",
        flex: 3,
        minWidth: 160,
        type: "text",
        align: "left"
    },
    {
        key: "allocatedBudget",
        label: "Allocated Budget",
        flex: 2,
        minWidth: 120,
        type: "currency",
        align: "right"
    },
    {
        key: "obligatedBudget",
        label: "Obligated Budget",
        flex: 2,
        minWidth: 120,
        type: "currency",
        align: "right"
    },
    {
        key: "budgetUtilized",
        label: "Budget Utilized",
        flex: 2,
        minWidth: 120,
        type: "currency",
        align: "right"
    },
    {
        key: "utilizationRate",
        label: "Utilization Rate",
        flex: 2,
        minWidth: 100,
        type: "number",
        align: "right"
    },
    {
        key: "balance",
        label: "Balance",
        flex: 2,
        minWidth: 120,
        type: "currency",
        align: "right"
    },
    {
        key: "dateStarted",
        label: "Date Started",
        flex: 2,
        minWidth: 110,
        type: "date",
        align: "left"
    },
    {
        key: "targetDate",
        label: "Target Date",
        flex: 2,
        minWidth: 110,
        type: "date",
        align: "left"
    },
    {
        key: "completionDate",
        label: "Completion Date",
        flex: 2,
        minWidth: 110,
        type: "date",
        align: "left"
    },
    {
        key: "projectAccomplishment",
        label: "Accomplishment %",
        flex: 1,
        minWidth: 80,
        type: "number",
        align: "right"
    },
    {
        key: "status",
        label: "Status",
        flex: 2,
        minWidth: 100,
        type: "status",
        align: "center"
    },
    {
        key: "remarks",
        label: "Remarks",
        flex: 3,
        minWidth: 180,
        type: "text",
        align: "left"
    },
];
