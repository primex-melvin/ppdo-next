
import { ColumnConfig } from "../core/types/table.types";

export const TWENTY_PERCENT_DF_COLUMNS: ColumnConfig[] = [
    { key: "particulars", label: "Particulars", width: 300, type: "text", align: "left" },
    { key: "implementingOffice", label: "Implementing Office", width: 150, type: "text", align: "left" },
    { key: "year", label: "Year", width: 80, type: "number", align: "center" },
    { key: "status", label: "Status", width: 120, type: "status", align: "center" },
    { key: "totalBudgetAllocated", label: "Allocated", width: 140, type: "currency", align: "right" },
    { key: "totalBudgetUtilized", label: "Utilized", width: 140, type: "currency", align: "right" },
    { key: "utilizationRate", label: "Util. Rate", width: 100, type: "percentage", align: "right" },
    { key: "remarks", label: "Remarks", width: 200, type: "text", align: "left" },
];
