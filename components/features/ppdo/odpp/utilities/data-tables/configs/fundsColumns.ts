
import { ColumnConfig } from "../core/types/table.types";

export const FUNDS_TABLE_COLUMNS: ColumnConfig[] = [
    { key: "projectTitle", label: "Project Title", width: 300, type: "text", align: "left" },
    { key: "officeInCharge", label: "Implementing Office", width: 250, type: "text", align: "left" },
    { key: "dateReceived", label: "Date Received", width: 120, type: "date", align: "center" },
    { key: "status", label: "Status", width: 140, type: "status", align: "center" },
    { key: "received", label: "Budget Allocated", width: 140, type: "currency", align: "right" },
    { key: "obligatedPR", label: "Obligated (PR)", width: 140, type: "currency", align: "right" },
    { key: "utilized", label: "Utilized", width: 140, type: "currency", align: "right" },
    { key: "balance", label: "Balance", width: 140, type: "currency", align: "right" },
    { key: "utilizationRate", label: "Util. Rate", width: 100, type: "percentage", align: "right" },
    { key: "remarks", label: "Remarks", width: 200, type: "text", align: "left" },
];
