
import { ColumnConfig } from "../core/types/table.types";

export const PROJECT_TABLE_COLUMNS: ColumnConfig[] = [
    {
        key: "particulars",
        label: "Project Name",
        width: 300,
        type: "text",
        align: "left"
    },
    {
        key: "implementingOffice",
        label: "Implementing Office",
        width: 200,
        type: "text",
        align: "left"
    },
    {
        key: "year",
        label: "Year",
        width: 80,
        type: "number",
        align: "center"
    },
    {
        key: "status",
        label: "Status",
        width: 120,
        type: "status",
        align: "center"
    },
    {
        key: "totalBudgetAllocated",
        label: "Allocated Budget",
        width: 150,
        type: "currency",
        align: "right"
    },
    {
        key: "obligatedBudget",
        label: "Obligated Budget",
        width: 150,
        type: "currency",
        align: "right"
    },
    {
        key: "totalBudgetUtilized",
        label: "Utilized Budget",
        width: 150,
        type: "currency",
        align: "right"
    },
    {
        key: "utilizationRate",
        label: "Utilization Rate",
        width: 120,
        type: "percentage",
        align: "right"
    },
    {
        key: "remarks",
        label: "Remarks",
        width: 200,
        type: "text",
        align: "left"
    },
];
