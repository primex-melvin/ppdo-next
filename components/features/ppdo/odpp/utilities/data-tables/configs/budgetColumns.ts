
import { ColumnConfig } from "../core/types/table.types";

export const BUDGET_TABLE_COLUMNS: ColumnConfig[] = [
    { key: "particular", label: "Particulars", flex: 4, minWidth: 260, type: "text", align: "left" },
    { key: "year", label: "Year", flex: 1, minWidth: 80, type: "number", align: "center" },
    { key: "status", label: "Status", flex: 2, minWidth: 120, type: "status", align: "center" },
    { key: "totalBudgetAllocated", label: "Allocated", flex: 2, minWidth: 150, type: "currency", align: "right" },
    { key: "obligatedBudget", label: "Obligated", flex: 2, minWidth: 150, type: "currency", align: "right" },
    { key: "totalBudgetUtilized", label: "Utilized", flex: 2, minWidth: 150, type: "currency", align: "right" },
    { key: "utilizationRate", label: "Util. Rate", flex: 2, minWidth: 120, type: "percentage", align: "right" },
    { key: "projectCompleted", label: "Completed", flex: 1, minWidth: 100, type: "number", align: "right" },
    { key: "projectDelayed", label: "Delayed", flex: 1, minWidth: 100, type: "number", align: "right" },
    { key: "projectsOngoing", label: "Ongoing", flex: 1, minWidth: 100, type: "number", align: "right" },
];
