
import { ColumnConfig } from "../core/types/table.types";

export const PROJECT_TABLE_COLUMNS: ColumnConfig[] = [
    {
        key: "particulars",
        label: "Project Name",
        width: 22,  // 22%
        type: "text",
        align: "left"
    },
    {
        key: "implementingOffice",
        label: "Implementing Office",
        width: 14,  // 14%
        type: "text",
        align: "left"
    },
    {
        key: "year",
        label: "Year",
        width: 6,   // 6%
        type: "number",
        align: "center"
    },
    {
        key: "status",
        label: "Status",
        width: 8,   // 8%
        type: "status",
        align: "center"
    },
    {
        key: "totalBudgetAllocated",
        label: "Allocated Budget",
        width: 10,  // 10%
        type: "currency",
        align: "right"
    },
    {
        key: "obligatedBudget",
        label: "Obligated Budget",
        width: 10,  // 10%
        type: "currency",
        align: "right"
    },
    {
        key: "totalBudgetUtilized",
        label: "Utilized Budget",
        width: 10,  // 10%
        type: "currency",
        align: "right"
    },
    {
        key: "utilizationRate",
        label: "Utilization Rate",
        width: 8,   // 8%
        type: "percentage",
        align: "right"
    },
    {
        key: "projectCompleted",
        label: "COMPLETED",
        width: 6,   // 6%
        type: "number",
        align: "right"
    },
    {
        key: "projectDelayed",
        label: "DELAYED",
        width: 6,   // 6%
        type: "number",
        align: "right"
    },
    {
        key: "projectsOngoing",
        label: "ONGOING",
        width: 6,   // 6%
        type: "number",
        align: "right"
    },
    {
        key: "remarks",
        label: "Remarks",
        width: 15,  // 15%
        type: "text",
        align: "left"
    },
];
