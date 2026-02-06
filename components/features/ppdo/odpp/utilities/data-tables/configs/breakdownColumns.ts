
import { ColumnConfig } from "../core/types/table.types";

export const BREAKDOWN_TABLE_COLUMNS: ColumnConfig[] = [
    {
        key: "projectTitle",
        label: "Project Name",
        width: 200,
        type: "text",
        align: "left"
    },
    {
        key: "implementingOffice",
        label: "Implementing Office",
        width: 160,
        type: "text",
        align: "left"
    },
    {
        key: "allocatedBudget",
        label: "Allocated Budget",
        width: 120,
        type: "currency",
        align: "right"
    },
    {
        key: "obligatedBudget",
        label: "Obligated Budget",
        width: 120,
        type: "currency",
        align: "right"
    },
    {
        key: "budgetUtilized",
        label: "Budget Utilized",
        width: 120,
        type: "currency",
        align: "right"
    },
    {
        key: "utilizationRate",
        label: "Utilization Rate",
        width: 100,
        type: "number",
        align: "right"
    },
    {
        key: "balance",
        label: "Balance",
        width: 120,
        type: "currency",
        align: "right"
    },
    {
        key: "dateStarted",
        label: "Date Started",
        width: 110,
        type: "date",
        align: "left"
    },
    {
        key: "targetDate",
        label: "Target Date",
        width: 110,
        type: "date",
        align: "left"
    },
    {
        key: "completionDate",
        label: "Completion Date",
        width: 110,
        type: "date",
        align: "left"
    },
    {
        key: "projectAccomplishment",
        label: "Accomplishment %",
        width: 80,
        type: "number",
        align: "right"
    },
    {
        key: "status",
        label: "Status",
        width: 100,
        type: "status",
        align: "center"
    },
    {
        key: "remarks",
        label: "Remarks",
        width: 180,
        type: "text",
        align: "left"
    },
];
