
import { ColumnConfig } from "../core/types/table.types";

export const FUNDS_TABLE_COLUMNS: ColumnConfig[] = [
    { key: "projectTitle", label: "Project Title", flex: 4, minWidth: 250, type: "text", align: "left" },
    { key: "officeInCharge", label: "Implementing Office", flex: 3, minWidth: 200, type: "text", align: "left" },
    { key: "dateReceived", label: "Date Received", flex: 2, minWidth: 120, type: "date", align: "center" },
    { key: "status", label: "Status", flex: 2, minWidth: 100, type: "status", align: "center" },
    { key: "received", label: "Budget Allocated", flex: 2, minWidth: 140, type: "currency", align: "right" },
    { key: "obligatedPR", label: "Obligated (PR)", flex: 2, minWidth: 140, type: "currency", align: "right" },
    { key: "utilized", label: "Utilized", flex: 2, minWidth: 140, type: "currency", align: "right" },
    { key: "balance", label: "Balance", flex: 2, minWidth: 140, type: "currency", align: "right" },
    { key: "utilizationRate", label: "Util. Rate", flex: 2, minWidth: 100, type: "percentage", align: "right" },
    { key: "remarks", label: "Remarks", flex: 3, minWidth: 200, type: "text", align: "left" },
];
