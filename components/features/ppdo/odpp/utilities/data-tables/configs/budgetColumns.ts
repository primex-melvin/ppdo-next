
import { ColumnConfig } from "../core/types/table.types";

/**
 * Budget table columns with persisted widths.
 */
export const BUDGET_TABLE_COLUMNS: ColumnConfig[] = [
    {
        key: "particular",
        label: "Particulars",
        width: 280,
        flex: 4,
        minWidth: 200,
        maxWidth: 600,
        type: "text",
        align: "left"
    },
    {
        key: "year",
        label: "Year",
        width: 80,
        flex: 1,
        minWidth: 60,
        maxWidth: 120,
        type: "number",
        align: "center"
    },
    {
        key: "status",
        label: "Status",
        width: 130,
        flex: 2,
        minWidth: 100,
        maxWidth: 180,
        type: "status",
        align: "center"
    },
    {
        key: "totalBudgetAllocated",
        label: "Allocated",
        width: 140,
        flex: 2,
        minWidth: 120,
        maxWidth: 200,
        type: "currency",
        align: "right"
    },
    {
        key: "obligatedBudget",
        label: "Obligated",
        width: 140,
        flex: 2,
        minWidth: 120,
        maxWidth: 200,
        type: "currency",
        align: "right"
    },
    {
        key: "totalBudgetUtilized",
        label: "Utilized",
        width: 140,
        flex: 2,
        minWidth: 120,
        maxWidth: 200,
        type: "currency",
        align: "right"
    },
    {
        key: "utilizationRate",
        label: "Util. Rate",
        width: 110,
        flex: 2,
        minWidth: 100,
        maxWidth: 160,
        type: "percentage",
        align: "right"
    },
    {
        key: "projectCompleted",
        label: "Completed",
        width: 100,
        flex: 1,
        minWidth: 80,
        maxWidth: 140,
        type: "number",
        align: "right"
    },
    {
        key: "projectDelayed",
        label: "Delayed",
        width: 100,
        flex: 1,
        minWidth: 80,
        maxWidth: 140,
        type: "number",
        align: "right"
    },
    {
        key: "projectsOngoing",
        label: "Ongoing",
        width: 100,
        flex: 1,
        minWidth: 80,
        maxWidth: 140,
        type: "number",
        align: "right"
    },
];
