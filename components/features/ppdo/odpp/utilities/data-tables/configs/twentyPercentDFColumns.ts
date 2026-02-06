
import { ColumnConfig } from "../core/types/table.types";

export const TWENTY_PERCENT_DF_COLUMNS: ColumnConfig[] = [
    { key: "particulars", label: "Particulars", width: 22, type: "text", align: "left" },
    { key: "implementingOffice", label: "Implementing Office", width: 14, type: "text", align: "left" },
    { key: "year", label: "Year", width: 6, type: "number", align: "center" },
    { key: "status", label: "Status", width: 8, type: "status", align: "center" },
    { key: "totalBudgetAllocated", label: "Allocated", width: 11, type: "currency", align: "right" },
    { key: "totalBudgetUtilized", label: "Utilized", width: 11, type: "currency", align: "right" },
    { key: "utilizationRate", label: "Util. Rate", width: 8, type: "percentage", align: "right" },
    { key: "projectCompleted", label: "COMPLETED", width: 6, type: "number", align: "right" },
    { key: "projectDelayed", label: "DELAYED", width: 6, type: "number", align: "right" },
    { key: "projectsOngoing", label: "ONGOING", width: 6, type: "number", align: "right" },
    { key: "remarks", label: "Remarks", width: 15, type: "text", align: "left" },
];
