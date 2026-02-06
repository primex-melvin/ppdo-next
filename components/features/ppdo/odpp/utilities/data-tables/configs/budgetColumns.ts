
import { ColumnConfig } from "../core/types/table.types";

export const BUDGET_TABLE_COLUMNS: ColumnConfig[] = [
    { key: "particular", label: "Particulars", width: 260, type: "text", align: "left" },
    { key: "year", label: "Year", width: 80, type: "number", align: "center" },
    { key: "status", label: "Status", width: 120, type: "status", align: "center" },
    { key: "totalBudgetAllocated", label: "Allocated", width: 150, type: "currency", align: "right" },
    { key: "obligatedBudget", label: "Obligated", width: 150, type: "currency", align: "right" },
    { key: "totalBudgetUtilized", label: "Utilized", width: 150, type: "currency", align: "right" },
    { key: "utilizationRate", label: "Util. Rate", width: 120, type: "percentage", align: "right" },
    { key: "projectCompleted", label: "Completed", width: 100, type: "number", align: "right" },
    { key: "projectDelayed", label: "Delayed", width: 100, type: "number", align: "right" },
    { key: "projectsOngoing", label: "Ongoing", width: 100, type: "number", align: "right" },
];
